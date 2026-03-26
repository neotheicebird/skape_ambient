import { useEffect, useMemo, useRef, useState } from "react";

import { ShaderCanvas } from "./components/ShaderCanvas";
import { loadProjectHexPalettes } from "./lib/hexPalette";
import {
  MAX_PERFORMANCE_BUDGET,
  activeOverlayCount,
  calculatePerformanceScore,
  getPerformanceLevel
} from "./lib/performance";
import {
  createDefaultPreset,
  getShaderColors,
  parseImportedPresetJson,
  sanitizePresetName,
  serializePreset,
  validatePreset
} from "./lib/preset";
import type { OverlaySettings, Palette, Preset, PresetTier } from "./types";

type WritableStreamLike = {
  write: (data: string | Blob | BufferSource) => Promise<void>;
  close: () => Promise<void>;
};

type FileHandleLike = {
  createWritable: () => Promise<WritableStreamLike>;
};

type PermissionStateLike = "granted" | "denied" | "prompt";

type DirectoryHandleLike = {
  name: string;
  getDirectoryHandle: (name: string, options?: { create?: boolean }) => Promise<DirectoryHandleLike>;
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FileHandleLike>;
  queryPermission?: (descriptor?: { mode?: "read" | "readwrite" }) => Promise<PermissionStateLike>;
  requestPermission?: (descriptor?: { mode?: "read" | "readwrite" }) => Promise<PermissionStateLike>;
};

function downloadTextFile(content: string, fileName: string): void {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function updatePresetAtIndex(presets: Preset[], index: number, nextPreset: Preset): Preset[] {
  return presets.map((preset, i) => (i === index ? nextPreset : preset));
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read selected file."));
    reader.readAsText(file);
  });
}

function supportsDirectDirectorySave(): boolean {
  return typeof (window as { showDirectoryPicker?: unknown }).showDirectoryPicker === "function";
}

async function ensureReadWritePermission(handle: DirectoryHandleLike): Promise<boolean> {
  if (!handle.queryPermission || !handle.requestPermission) {
    return true;
  }

  const query = await handle.queryPermission({ mode: "readwrite" });
  if (query === "granted") {
    return true;
  }

  const request = await handle.requestPermission({ mode: "readwrite" });
  return request === "granted";
}

function normalizeOverlays(overlays: OverlaySettings): OverlaySettings | undefined {
  return Object.keys(overlays).length === 0 ? undefined : overlays;
}

function isRangeInputTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement && target.type === "range";
}

function applyPerformanceMetadata(preset: Preset): Preset {
  return {
    ...preset,
    performanceScore: calculatePerformanceScore(preset)
  };
}

export default function App(): JSX.Element {
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [paletteErrors, setPaletteErrors] = useState<string[]>([]);

  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [exportTier, setExportTier] = useState<PresetTier>("free");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [presetsDirectoryHandle, setPresetsDirectoryHandle] = useState<DirectoryHandleLike | null>(null);
  const [exportStatus, setExportStatus] = useState<string>("");
  const [importStatus, setImportStatus] = useState<string>("");
  const [isAdjustingControl, setIsAdjustingControl] = useState(false);
  const [overlayMemoryByPreset, setOverlayMemoryByPreset] = useState<Record<number, OverlaySettings>>({});
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const selectedPreset = presets[selectedPresetIndex];
  const selectedPalette = useMemo(
    () => palettes.find((palette) => palette.name === selectedPreset?.palette),
    [palettes, selectedPreset?.palette]
  );

  async function refreshPalettes(): Promise<void> {
    try {
      const { palettes: loadedPalettes, errors } = await loadProjectHexPalettes();
      setPalettes(loadedPalettes);
      setPaletteErrors(errors);

      if (loadedPalettes.length > 0 && presets.length === 0) {
        setPresets([applyPerformanceMetadata(createDefaultPreset(loadedPalettes[0].name))]);
        setSelectedPresetIndex(0);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown palette loading error.";
      setPaletteErrors([message]);
    }
  }

  useEffect(() => {
    void refreshPalettes();
  }, []);

  useEffect(() => {
    if (!isAdjustingControl) {
      return;
    }

    const stopAdjusting = (): void => setIsAdjustingControl(false);
    window.addEventListener("pointerup", stopAdjusting);
    window.addEventListener("pointercancel", stopAdjusting);
    return () => {
      window.removeEventListener("pointerup", stopAdjusting);
      window.removeEventListener("pointercancel", stopAdjusting);
    };
  }, [isAdjustingControl]);

  function setCurrentPreset(nextPreset: Preset): void {
    setPresets((current) =>
      updatePresetAtIndex(current, selectedPresetIndex, applyPerformanceMetadata(nextPreset))
    );
  }

  function patchCurrentPreset(patch: (preset: Preset) => Preset): void {
    if (!selectedPreset) {
      return;
    }
    setCurrentPreset(patch(selectedPreset));
  }

  function patchOverlays(patch: (overlays: OverlaySettings) => OverlaySettings): void {
    patchCurrentPreset((preset) => {
      const next = patch({ ...(preset.overlays ?? {}) });
      return {
        ...preset,
        overlays: normalizeOverlays(next)
      };
    });
  }

  function rememberOverlaySetting<K extends keyof OverlaySettings>(
    key: K,
    value: NonNullable<OverlaySettings[K]>
  ): void {
    setOverlayMemoryByPreset((current) => ({
      ...current,
      [selectedPresetIndex]: {
        ...(current[selectedPresetIndex] ?? {}),
        [key]: value
      }
    }));
  }

  function getRememberedOverlay<K extends keyof OverlaySettings>(key: K): OverlaySettings[K] | undefined {
    return overlayMemoryByPreset[selectedPresetIndex]?.[key] as OverlaySettings[K] | undefined;
  }

  function createPreset(): void {
    if (palettes.length === 0) {
      return;
    }

    const nextPreset = createDefaultPreset(palettes[0].name);
    setPresets((current) => [
      ...current,
      applyPerformanceMetadata({ ...nextPreset, name: `preset-${current.length + 1}` })
    ]);
    setSelectedPresetIndex(presets.length);
    setValidationErrors([]);
  }

  async function loadPresetFromFile(file: File): Promise<void> {
    try {
      const fileText = await readFileAsText(file);
      const parsed = parseImportedPresetJson(fileText);
      const importedPreset = parsed.preset;

      let normalizedPreset = importedPreset;
      const warnings = [...parsed.warnings];

      if (
        palettes.length > 0 &&
        !palettes.some((palette) => palette.name === importedPreset.palette)
      ) {
        normalizedPreset = { ...importedPreset, palette: palettes[0].name };
        warnings.push(
          `Palette "${importedPreset.palette}" was not found and was remapped to "${palettes[0].name}".`
        );
      }

      const scoredPreset = applyPerformanceMetadata(normalizedPreset);
      const errors = validatePreset(scoredPreset, palettes);
      setValidationErrors(errors);

      const nextPresets = [...presets, scoredPreset];
      setPresets(nextPresets);
      setSelectedPresetIndex(nextPresets.length - 1);

      if (warnings.length > 0) {
        setImportStatus(`Loaded "${scoredPreset.name}" with migration notes: ${warnings.join(" ")}`);
      } else {
        setImportStatus(`Loaded preset "${scoredPreset.name}" from ${file.name}.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown preset import error.";
      setImportStatus(`Import failed: ${message}`);
    }
  }

  function openPresetFilePicker(): void {
    importInputRef.current?.click();
  }

  async function choosePresetsDirectory(): Promise<void> {
    if (!supportsDirectDirectorySave()) {
      setExportStatus("Direct folder save is unavailable in this browser. Using download fallback.");
      return;
    }

    try {
      const picker = (
        window as unknown as {
          showDirectoryPicker: (options?: { mode?: "read" | "readwrite" }) => Promise<DirectoryHandleLike>;
        }
      ).showDirectoryPicker;

      const handle = await picker({ mode: "readwrite" });
      const granted = await ensureReadWritePermission(handle);
      if (!granted) {
        setExportStatus("Write permission denied for selected directory.");
        return;
      }

      setPresetsDirectoryHandle(handle);
      setExportStatus(`Selected directory: ${handle.name}`);
    } catch (error) {
      const domError = error as { name?: string };
      if (domError?.name === "AbortError") {
        return;
      }
      const message = error instanceof Error ? error.message : "Unknown directory picker error.";
      setExportStatus(`Could not select directory: ${message}`);
    }
  }

  async function savePresetToSelectedDirectory(
    handle: DirectoryHandleLike,
    tier: PresetTier,
    fileName: string,
    content: string
  ): Promise<void> {
    const granted = await ensureReadWritePermission(handle);
    if (!granted) {
      throw new Error("Write permission denied for selected directory.");
    }

    const tierDirectory = await handle.getDirectoryHandle(tier, { create: true });
    const fileHandle = await tierDirectory.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async function exportPresetJson(): Promise<void> {
    if (!selectedPreset) {
      return;
    }

    const exportPreset = applyPerformanceMetadata(selectedPreset);
    const errors = validatePreset(exportPreset, palettes);
    setValidationErrors(errors);

    if (errors.length > 0) {
      return;
    }

    const fileStem = sanitizePresetName(exportPreset.name);
    const fileName = `${fileStem}.json`;
    const content = serializePreset(exportPreset);

    if (presetsDirectoryHandle) {
      try {
        await savePresetToSelectedDirectory(presetsDirectoryHandle, exportTier, fileName, content);
        setExportStatus(`Saved to ${presetsDirectoryHandle.name}/${exportTier}/${fileName}`);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown direct save error.";
        setExportStatus(`Direct save failed (${message}). Downloading instead.`);
      }
    }

    downloadTextFile(content, fileName);
    setExportStatus(`Downloaded ${fileName}. Select presets directory for direct save.`);
  }

  const shaderColors = useMemo(() => getShaderColors(selectedPalette), [selectedPalette]);

  const overlays = selectedPreset?.overlays ?? {};
  const liquidEnabled = Boolean(overlays.liquidGlass);
  const ribbedEnabled = Boolean(overlays.ribbedGlass);
  const chromaticEnabled = Boolean(overlays.chromaticAberration);
  const pixelGridEnabled = Boolean(overlays.pixelGrid);
  const performanceScore = selectedPreset ? calculatePerformanceScore(selectedPreset) : 0;
  const performanceLevel = getPerformanceLevel(performanceScore);
  const overlayCount = activeOverlayCount(selectedPreset?.overlays);
  const isOverBudget = performanceScore > MAX_PERFORMANCE_BUDGET;
  const isBeyondRecommendedOverlayCount = overlayCount > 2;

  return (
    <main className="layout">
      <section className="preview-panel">
        {selectedPreset ? (
          <ShaderCanvas preset={selectedPreset} colors={shaderColors} paused={isAdjustingControl} />
        ) : (
          <div className="empty-state">Create a preset after loading palettes.</div>
        )}
      </section>

      <section className="control-panel">
        <header className="section-header">
          <h1>Skape Ambient Creator Tool</h1>
          <p>Internal utility for building and exporting preset JSON files.</p>
        </header>

        <div className="card manual-step">
          <h2>Manual Checkpoint</h2>
          <p>Add your palette files to <code>creator-tool/palettes/hex/*.hex</code> before validating palettes.</p>
          <button type="button" onClick={() => void refreshPalettes()}>
            Reload .hex palettes
          </button>
        </div>

        {paletteErrors.length > 0 && (
          <div className="card error-list">
            <h2>Palette Status</h2>
            <ul>
              {paletteErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="card">
          <h2>Preset Library</h2>
          <label>
            Active preset
            <select
              value={selectedPresetIndex}
              onChange={(event) => setSelectedPresetIndex(Number(event.target.value))}
              disabled={presets.length === 0}
            >
              {presets.map((preset, index) => (
                <option key={`${preset.name}-${index}`} value={index}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>

          <button type="button" onClick={createPreset} disabled={palettes.length === 0}>
            Create preset
          </button>

          <button type="button" onClick={openPresetFilePicker}>
            Load preset JSON
          </button>

          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void loadPresetFromFile(file);
              }
              event.currentTarget.value = "";
            }}
          />

          {importStatus && <p className="status-note">{importStatus}</p>}
        </div>

        {selectedPreset && (
          <div className="card performance-card">
            <h2>Performance</h2>
            <p className={`performance-score performance-${performanceLevel.toLowerCase().replace(" ", "-")}`}>
              Performance Score: {performanceScore} / {MAX_PERFORMANCE_BUDGET} ({performanceLevel})
            </p>
            <p className="hint">Recommended composition: 1 base effect with 0-2 overlays.</p>
            {isBeyondRecommendedOverlayCount && (
              <p className="performance-warning">
                Advisory: this preset uses more than 2 overlays and may be harder to keep lightweight.
              </p>
            )}
            {isOverBudget && (
              <p className="performance-warning">
                This preset may impact performance on some devices.
              </p>
            )}
          </div>
        )}

        {selectedPreset && (
          <div
            className="card controls-grid"
            onPointerDownCapture={(event) => {
              if (isRangeInputTarget(event.target)) {
                setIsAdjustingControl(true);
              }
            }}
            onPointerUpCapture={(event) => {
              if (isRangeInputTarget(event.target)) {
                setIsAdjustingControl(false);
              }
            }}
            onPointerCancelCapture={(event) => {
              if (isRangeInputTarget(event.target)) {
                setIsAdjustingControl(false);
              }
            }}
          >
            <h2>Controls</h2>

            <label>
              Name
              <input
                value={selectedPreset.name}
                onChange={(event) => patchCurrentPreset((preset) => ({ ...preset, name: event.target.value }))}
              />
            </label>

            <label>
              Palette
              <select
                value={selectedPreset.palette}
                onChange={(event) =>
                  patchCurrentPreset((preset) => ({ ...preset, palette: event.target.value }))
                }
              >
                {palettes.map((palette) => (
                  <option key={palette.name} value={palette.name}>
                    {palette.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Effect
              <select
                value={selectedPreset.effect}
                onChange={(event) =>
                  patchCurrentPreset((preset) => ({
                    ...preset,
                    effect: event.target.value as Preset["effect"]
                  }))
                }
              >
                <option value="flow">flow</option>
                <option value="burn">burn</option>
                <option value="gas">gas</option>
              </select>
            </label>

            <label>
              Speed ({selectedPreset.speed.toFixed(2)})
              <input
                type="range"
                min={0}
                max={4}
                step={0.01}
                value={selectedPreset.speed}
                onChange={(event) =>
                  patchCurrentPreset((preset) => ({
                    ...preset,
                    speed: Number(event.target.value)
                  }))
                }
              />
            </label>

            <label>
              Distortion ({selectedPreset.distortion.toFixed(2)})
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={selectedPreset.distortion}
                onChange={(event) =>
                  patchCurrentPreset((preset) => ({
                    ...preset,
                    distortion: Number(event.target.value)
                  }))
                }
              />
            </label>

            <label>
              Noise ({selectedPreset.noise.toFixed(2)})
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={selectedPreset.noise}
                onChange={(event) =>
                  patchCurrentPreset((preset) => ({
                    ...preset,
                    noise: Number(event.target.value)
                  }))
                }
              />
            </label>

            <h3 className="subheading">Overlays</h3>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={liquidEnabled}
                onChange={(event) => {
                  patchOverlays((current) => {
                    const next = { ...current };
                    if (event.target.checked) {
                      next.liquidGlass =
                        (getRememberedOverlay("liquidGlass") as OverlaySettings["liquidGlass"]) ??
                        next.liquidGlass ??
                        { intensity: 0.25 };
                    } else {
                      if (next.liquidGlass) {
                        rememberOverlaySetting("liquidGlass", next.liquidGlass);
                      }
                      delete next.liquidGlass;
                    }
                    return next;
                  });
                }}
              />
              Liquid Glass
            </label>

            {liquidEnabled && (
              <label>
                Liquid intensity ({(overlays.liquidGlass?.intensity ?? 0).toFixed(2)})
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={overlays.liquidGlass?.intensity ?? 0}
                  onChange={(event) => {
                    patchOverlays((current) => ({
                      ...current,
                      liquidGlass: {
                        intensity: Number(event.target.value)
                      }
                    }));
                  }}
                />
              </label>
            )}

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={ribbedEnabled}
                onChange={(event) => {
                  patchOverlays((current) => {
                    const next = { ...current };
                    if (event.target.checked) {
                      next.ribbedGlass =
                        (getRememberedOverlay("ribbedGlass") as OverlaySettings["ribbedGlass"]) ??
                        next.ribbedGlass ??
                        {
                          intensity: 0.25,
                          frequency: 12,
                          angle: 0,
                          mode: "linear"
                        };
                    } else {
                      if (next.ribbedGlass) {
                        rememberOverlaySetting("ribbedGlass", next.ribbedGlass);
                      }
                      delete next.ribbedGlass;
                    }
                    return next;
                  });
                }}
              />
              Ribbed Glass
            </label>

            {ribbedEnabled && (
              <>
                <label>
                  Ribbed intensity ({(overlays.ribbedGlass?.intensity ?? 0).toFixed(2)})
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={overlays.ribbedGlass?.intensity ?? 0}
                    onChange={(event) => {
                      patchOverlays((current) => ({
                        ...current,
                        ribbedGlass: {
                          ...(current.ribbedGlass ?? {
                            intensity: 0,
                            frequency: 12,
                            angle: 0,
                            mode: "linear"
                          }),
                          intensity: Number(event.target.value)
                        }
                      }));
                    }}
                  />
                </label>

                <label>
                  Ribbed frequency ({(overlays.ribbedGlass?.frequency ?? 0).toFixed(1)})
                  <input
                    type="range"
                    min={1}
                    max={60}
                    step={0.5}
                    value={overlays.ribbedGlass?.frequency ?? 12}
                    onChange={(event) => {
                      patchOverlays((current) => ({
                        ...current,
                        ribbedGlass: {
                          ...(current.ribbedGlass ?? {
                            intensity: 0.25,
                            frequency: 12,
                            angle: 0,
                            mode: "linear"
                          }),
                          frequency: Number(event.target.value)
                        }
                      }));
                    }}
                  />
                </label>

                <label>
                  Ribbed angle ({(overlays.ribbedGlass?.angle ?? 0).toFixed(0)}°)
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    step={1}
                    value={overlays.ribbedGlass?.angle ?? 0}
                    onChange={(event) => {
                      patchOverlays((current) => ({
                        ...current,
                        ribbedGlass: {
                          ...(current.ribbedGlass ?? {
                            intensity: 0.25,
                            frequency: 12,
                            angle: 0,
                            mode: "linear"
                          }),
                          angle: Number(event.target.value)
                        }
                      }));
                    }}
                  />
                </label>

                <label>
                  Ribbed mode
                  <select
                    value={overlays.ribbedGlass?.mode ?? "linear"}
                    onChange={(event) => {
                      patchOverlays((current) => ({
                        ...current,
                        ribbedGlass: {
                          ...(current.ribbedGlass ?? {
                            intensity: 0.25,
                            frequency: 12,
                            angle: 0,
                            mode: "linear"
                          }),
                          mode: event.target.value as "linear" | "grid"
                        }
                      }));
                    }}
                  >
                    <option value="linear">linear</option>
                    <option value="grid">grid</option>
                  </select>
                </label>
              </>
            )}

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={chromaticEnabled}
                onChange={(event) => {
                  patchOverlays((current) => {
                    const next = { ...current };
                    if (event.target.checked) {
                      next.chromaticAberration =
                        (getRememberedOverlay(
                          "chromaticAberration"
                        ) as OverlaySettings["chromaticAberration"]) ??
                        next.chromaticAberration ??
                        {
                          intensity: 0.2,
                          offset: 0.08,
                          mode: "radial"
                        };
                    } else {
                      if (next.chromaticAberration) {
                        rememberOverlaySetting("chromaticAberration", next.chromaticAberration);
                      }
                      delete next.chromaticAberration;
                    }
                    return next;
                  });
                }}
              />
              Chromatic Aberration
            </label>

            {chromaticEnabled && (
              <>
                <label>
                  Chromatic intensity ({(overlays.chromaticAberration?.intensity ?? 0).toFixed(2)})
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={overlays.chromaticAberration?.intensity ?? 0.2}
                    onChange={(event) => {
                      patchOverlays((current) => ({
                        ...current,
                        chromaticAberration: {
                          ...(current.chromaticAberration ?? {
                            intensity: 0.2,
                            offset: 0.08,
                            mode: "radial"
                          }),
                          intensity: Number(event.target.value)
                        }
                      }));
                    }}
                  />
                </label>

                <label>
                  Chromatic offset ({(overlays.chromaticAberration?.offset ?? 0).toFixed(2)})
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={overlays.chromaticAberration?.offset ?? 0.08}
                    onChange={(event) => {
                      patchOverlays((current) => ({
                        ...current,
                        chromaticAberration: {
                          ...(current.chromaticAberration ?? {
                            intensity: 0.2,
                            offset: 0.08,
                            mode: "radial"
                          }),
                          offset: Number(event.target.value)
                        }
                      }));
                    }}
                  />
                </label>

                <label>
                  Chromatic mode
                  <select
                    value={overlays.chromaticAberration?.mode ?? "radial"}
                    onChange={(event) => {
                      patchOverlays((current) => ({
                        ...current,
                        chromaticAberration: {
                          ...(current.chromaticAberration ?? {
                            intensity: 0.2,
                            offset: 0.08,
                            mode: "radial"
                          }),
                          mode: event.target.value as "radial" | "directional"
                        }
                      }));
                    }}
                  >
                    <option value="radial">radial</option>
                    <option value="directional">directional</option>
                  </select>
                </label>
              </>
            )}

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={pixelGridEnabled}
                onChange={(event) => {
                  patchOverlays((current) => {
                    const next = { ...current };
                    if (event.target.checked) {
                      next.pixelGrid =
                        (getRememberedOverlay("pixelGrid") as OverlaySettings["pixelGrid"]) ??
                        next.pixelGrid ??
                        {
                          size: 32,
                          lineStrength: 0.25
                        };
                    } else {
                      if (next.pixelGrid) {
                        rememberOverlaySetting("pixelGrid", next.pixelGrid);
                      }
                      delete next.pixelGrid;
                    }
                    return next;
                  });
                }}
              />
              Pixel Grid
            </label>

            {pixelGridEnabled && (
              <>
                <label>
                  Grid size ({(overlays.pixelGrid?.size ?? 0).toFixed(0)})
                  <input
                    type="range"
                    min={1}
                    max={200}
                    step={1}
                    value={overlays.pixelGrid?.size ?? 32}
                    onChange={(event) => {
                      patchOverlays((current) => ({
                        ...current,
                        pixelGrid: {
                          ...(current.pixelGrid ?? {
                            size: 32,
                            lineStrength: 0.25
                          }),
                          size: Number(event.target.value)
                        }
                      }));
                    }}
                  />
                </label>

                <label>
                  Grid line strength ({(overlays.pixelGrid?.lineStrength ?? 0).toFixed(2)})
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={overlays.pixelGrid?.lineStrength ?? 0.25}
                    onChange={(event) => {
                      patchOverlays((current) => ({
                        ...current,
                        pixelGrid: {
                          ...(current.pixelGrid ?? {
                            size: 32,
                            lineStrength: 0.25
                          }),
                          lineStrength: Number(event.target.value)
                        }
                      }));
                    }}
                  />
                </label>
              </>
            )}
          </div>
        )}

        <div className="card">
          <h2>Export</h2>
          <label>
            Preset tier
            <select value={exportTier} onChange={(event) => setExportTier(event.target.value as PresetTier)}>
              <option value="free">free</option>
              <option value="pro">pro</option>
            </select>
          </label>

          <p className="hint">
            Select your project <code>presets</code> folder for direct save, or use download fallback.
          </p>

          <button type="button" onClick={() => void choosePresetsDirectory()}>
            Select presets directory
          </button>

          {presetsDirectoryHandle && (
            <p className="hint">
              Direct save target: <code>{presetsDirectoryHandle.name}/{exportTier}</code>
            </p>
          )}

          <button type="button" onClick={() => void exportPresetJson()} disabled={!selectedPreset}>
            Export selected preset JSON
          </button>

          {exportStatus && <p className="status-note">{exportStatus}</p>}

          {validationErrors.length > 0 && (
            <ul className="validation-errors">
              {validationErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
