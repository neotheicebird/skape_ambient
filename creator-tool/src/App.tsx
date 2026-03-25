import { useEffect, useMemo, useRef, useState } from "react";

import { ShaderCanvas } from "./components/ShaderCanvas";
import { loadProjectHexPalettes } from "./lib/hexPalette";
import {
  createDefaultPreset,
  getShaderColors,
  parseImportedPresetJson,
  sanitizePresetName,
  serializePreset,
  validatePreset
} from "./lib/preset";
import type { Palette, Preset, PresetTier } from "./types";

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
        setPresets([createDefaultPreset(loadedPalettes[0].name)]);
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

  function setCurrentPreset(nextPreset: Preset): void {
    setPresets((current) => updatePresetAtIndex(current, selectedPresetIndex, nextPreset));
  }

  function createPreset(): void {
    if (palettes.length === 0) {
      return;
    }

    const nextPreset = createDefaultPreset(palettes[0].name);
    setPresets((current) => [...current, { ...nextPreset, name: `preset-${current.length + 1}` }]);
    setSelectedPresetIndex(presets.length);
    setValidationErrors([]);
  }

  async function loadPresetFromFile(file: File): Promise<void> {
    try {
      const fileText = await readFileAsText(file);
      const importedPreset = parseImportedPresetJson(fileText);

      let normalizedPreset = importedPreset;
      if (
        palettes.length > 0 &&
        !palettes.some((palette) => palette.name === importedPreset.palette)
      ) {
        normalizedPreset = { ...importedPreset, palette: palettes[0].name };
        setImportStatus(
          `Loaded "${importedPreset.name}" but palette "${importedPreset.palette}" was not found; remapped to "${palettes[0].name}".`
        );
      } else {
        setImportStatus(`Loaded preset "${importedPreset.name}" from ${file.name}.`);
      }

      const errors = validatePreset(normalizedPreset, palettes);
      setValidationErrors(errors);

      const nextPresets = [...presets, normalizedPreset];
      setPresets(nextPresets);
      setSelectedPresetIndex(nextPresets.length - 1);
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
      const picker = (window as { showDirectoryPicker: (options?: { mode?: "read" | "readwrite" }) => Promise<DirectoryHandleLike> })
        .showDirectoryPicker;
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

    const errors = validatePreset(selectedPreset, palettes);
    setValidationErrors(errors);

    if (errors.length > 0) {
      return;
    }

    const fileStem = sanitizePresetName(selectedPreset.name);
    const fileName = `${fileStem}.json`;
    const content = serializePreset(selectedPreset);

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

  return (
    <main className="layout">
      <section className="preview-panel">
        {selectedPreset ? (
          <ShaderCanvas preset={selectedPreset} colors={shaderColors} />
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
          <div className="card controls-grid">
            <h2>Controls</h2>

            <label>
              Name
              <input
                value={selectedPreset.name}
                onChange={(event) => setCurrentPreset({ ...selectedPreset, name: event.target.value })}
              />
            </label>

            <label>
              Palette
              <select
                value={selectedPreset.palette}
                onChange={(event) => setCurrentPreset({ ...selectedPreset, palette: event.target.value })}
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
                  setCurrentPreset({
                    ...selectedPreset,
                    effect: event.target.value as Preset["effect"]
                  })
                }
              >
                <option value="flow">flow</option>
                <option value="liquid">liquid</option>
                <option value="burn">burn</option>
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
                  setCurrentPreset({
                    ...selectedPreset,
                    speed: Number(event.target.value)
                  })
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
                  setCurrentPreset({
                    ...selectedPreset,
                    distortion: Number(event.target.value)
                  })
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
                  setCurrentPreset({
                    ...selectedPreset,
                    noise: Number(event.target.value)
                  })
                }
              />
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={selectedPreset.glass}
                onChange={(event) =>
                  setCurrentPreset({
                    ...selectedPreset,
                    glass: event.target.checked
                  })
                }
              />
              Glass
            </label>

            <label>
              Glass size ({selectedPreset.glassSize.toFixed(2)})
              <input
                type="range"
                min={0.05}
                max={1}
                step={0.01}
                value={selectedPreset.glassSize}
                onChange={(event) =>
                  setCurrentPreset({
                    ...selectedPreset,
                    glassSize: Number(event.target.value)
                  })
                }
              />
            </label>
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
