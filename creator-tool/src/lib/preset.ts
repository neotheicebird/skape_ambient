import { TEXTURE_IDS, type ChromaticAberration, type OverlaySettings, type Palette, type PixelGrid, type Preset, type TextureId, type TextureOverlay } from "../types";

export const MAX_SHADER_COLORS = 6;
const EFFECT_MODES = new Set(["flow", "gas", "burn", "bands", "cellular"]);
const TEXTURE_ID_SET = new Set<string>(TEXTURE_IDS);

const DEFAULT_PRESET: Preset = {
  name: "new-preset",
  palette: "",
  effect: "flow",
  speed: 1,
  distortion: 0.35,
  noise: 0.5,
  overlays: {}
};

export type ParsedPresetResult = {
  preset: Preset;
  warnings: string[];
};

export function createDefaultPreset(paletteName: string): Preset {
  return {
    ...DEFAULT_PRESET,
    palette: paletteName || DEFAULT_PRESET.palette,
    overlays: {}
  };
}

export function validatePreset(preset: Preset, palettes: Palette[]): string[] {
  const errors: string[] = [];

  if (!preset.name.trim()) {
    errors.push("Preset name is required.");
  }

  if (!palettes.some((palette) => palette.name === preset.palette)) {
    errors.push("Preset palette must reference a loaded .hex palette.");
  }

  if (!EFFECT_MODES.has(preset.effect)) {
    errors.push("Preset effect must be one of: flow, gas, burn, bands, cellular.");
  }

  if (preset.speed < 0 || preset.speed > 4) {
    errors.push("Speed must be between 0 and 4.");
  }

  if (preset.distortion < 0 || preset.distortion > 1) {
    errors.push("Distortion must be between 0 and 1.");
  }

  if (preset.noise < 0 || preset.noise > 1) {
    errors.push("Noise must be between 0 and 1.");
  }

  const overlays = preset.overlays;

  if (overlays?.chromaticAberration) {
    if (overlays.chromaticAberration.intensity < 0 || overlays.chromaticAberration.intensity > 1) {
      errors.push("Chromatic aberration intensity must be between 0 and 1.");
    }
    if (overlays.chromaticAberration.offset < 0 || overlays.chromaticAberration.offset > 1) {
      errors.push("Chromatic aberration offset must be between 0 and 1.");
    }
  }

  if (overlays?.pixelGrid) {
    if (overlays.pixelGrid.size < 1 || overlays.pixelGrid.size > 400) {
      errors.push("Pixel grid size must be between 1 and 400.");
    }
    if (overlays.pixelGrid.lineStrength < 0 || overlays.pixelGrid.lineStrength > 1) {
      errors.push("Pixel grid line strength must be between 0 and 1.");
    }
  }

  if (overlays?.textureOverlay) {
    if (!TEXTURE_ID_SET.has(overlays.textureOverlay.texture)) {
      errors.push("Texture overlay texture id is invalid.");
    }
    if (overlays.textureOverlay.scale <= 0 || overlays.textureOverlay.scale > 20) {
      errors.push("Texture overlay scale must be greater than 0 and at most 20.");
    }
    if (overlays.textureOverlay.intensity < 0 || overlays.textureOverlay.intensity > 1) {
      errors.push("Texture overlay intensity must be between 0 and 1.");
    }
    if (
      overlays.textureOverlay.distortion !== undefined &&
      (overlays.textureOverlay.distortion < 0 || overlays.textureOverlay.distortion > 1)
    ) {
      errors.push("Texture overlay distortion must be between 0 and 1 when provided.");
    }
  }

  if (
    preset.performanceScore !== undefined &&
    (typeof preset.performanceScore !== "number" || Number.isNaN(preset.performanceScore))
  ) {
    errors.push("Performance score must be a number when provided.");
  }

  return errors;
}

export function serializePreset(preset: Preset): string {
  return `${JSON.stringify(preset, null, 2)}\n`;
}

function expectObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Preset JSON must be an object.");
  }
  return value as Record<string, unknown>;
}

function expectString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string") {
    throw new Error(`Preset field "${key}" must be a string.`);
  }
  return value;
}

function expectNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Preset field "${key}" must be a number.`);
  }
  return value;
}

function expectBoolean(record: Record<string, unknown>, key: string): boolean {
  const value = record[key];
  if (typeof value !== "boolean") {
    throw new Error(`Preset field "${key}" must be a boolean.`);
  }
  return value;
}

function parseTextureId(value: string): TextureId {
  if (!TEXTURE_ID_SET.has(value)) {
    throw new Error(
      `Texture overlay texture must be one of: ${TEXTURE_IDS.join(", ")}.`
    );
  }

  return value as TextureId;
}

function parseChromaticAberration(value: unknown): ChromaticAberration {
  const record = expectObject(value);
  const mode = expectString(record, "mode");
  if (mode !== "radial" && mode !== "directional") {
    throw new Error('Chromatic aberration mode must be "radial" or "directional".');
  }

  return {
    intensity: expectNumber(record, "intensity"),
    offset: expectNumber(record, "offset"),
    mode
  };
}

function parsePixelGrid(value: unknown): PixelGrid {
  const record = expectObject(value);
  return {
    size: expectNumber(record, "size"),
    lineStrength: expectNumber(record, "lineStrength")
  };
}

function parseTextureOverlay(value: unknown): TextureOverlay {
  const record = expectObject(value);
  const texture = parseTextureId(expectString(record, "texture"));
  const scale = expectNumber(record, "scale");
  const intensity = expectNumber(record, "intensity");
  const distortionRaw = record.distortion;

  return {
    texture,
    scale,
    intensity,
    distortion:
      distortionRaw === undefined
        ? undefined
        : (() => {
            if (typeof distortionRaw !== "number" || Number.isNaN(distortionRaw)) {
              throw new Error('Texture overlay field "distortion" must be a number when provided.');
            }
            return distortionRaw;
          })()
  };
}

function parseOverlays(value: unknown, warnings: string[]): OverlaySettings {
  const record = expectObject(value);
  const overlays: OverlaySettings = {};

  if (record.chromaticAberration !== undefined) {
    overlays.chromaticAberration = parseChromaticAberration(record.chromaticAberration);
  }
  if (record.pixelGrid !== undefined) {
    overlays.pixelGrid = parsePixelGrid(record.pixelGrid);
  }
  if (record.textureOverlay !== undefined) {
    overlays.textureOverlay = parseTextureOverlay(record.textureOverlay);
  }

  // Legacy v1.1 overlay migration paths.
  if (record.liquidGlass !== undefined) {
    const legacy = expectObject(record.liquidGlass);
    const intensity = expectNumber(legacy, "intensity");
    if (!overlays.textureOverlay) {
      overlays.textureOverlay = {
        texture: "frosted-soft",
        scale: 3,
        intensity,
        distortion: 0.12
      };
    }
    warnings.push('Legacy overlay "liquidGlass" migrated to overlays.textureOverlay (frosted-soft).');
  }

  if (record.ribbedGlass !== undefined) {
    const legacy = expectObject(record.ribbedGlass);
    const intensity = expectNumber(legacy, "intensity");
    const frequency = expectNumber(legacy, "frequency");
    const mode = expectString(legacy, "mode");
    if (mode !== "linear" && mode !== "grid") {
      throw new Error('Ribbed glass mode must be "linear" or "grid".');
    }

    if (!overlays.textureOverlay) {
      overlays.textureOverlay = {
        texture: mode === "grid" ? "ribbed-wide" : "ribbed-fine",
        scale: Math.max(0.5, Math.min(8, frequency / 8)),
        intensity,
        distortion: 0.1
      };
    }
    warnings.push('Legacy overlay "ribbedGlass" migrated to overlays.textureOverlay.');
  }

  return overlays;
}

function parseEffectWithLegacySupport(effectRaw: string, warnings: string[]): Preset["effect"] {
  if (EFFECT_MODES.has(effectRaw)) {
    return effectRaw as Preset["effect"];
  }

  if (effectRaw === "liquid") {
    warnings.push('Legacy effect "liquid" migrated to "flow".');
    return "flow";
  }

  throw new Error('Preset field "effect" must be one of: flow, gas, burn, bands, cellular.');
}

export function parseImportedPresetJson(rawJson: string): ParsedPresetResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error("Invalid JSON file.");
  }

  const warnings: string[] = [];
  const record = expectObject(parsed);
  const effect = parseEffectWithLegacySupport(expectString(record, "effect"), warnings);

  let overlays: OverlaySettings = {};
  if (record.overlays !== undefined) {
    overlays = parseOverlays(record.overlays, warnings);
  }

  // Legacy v1 migration path.
  if (record.glass !== undefined || record.glassSize !== undefined) {
    const glass = record.glass === undefined ? false : expectBoolean(record, "glass");
    const glassSize = record.glassSize === undefined ? 0.25 : expectNumber(record, "glassSize");
    if (glass && !overlays.textureOverlay) {
      overlays = {
        ...overlays,
        textureOverlay: {
          texture: "frosted-soft",
          scale: 3,
          intensity: glassSize,
          distortion: 0.12
        }
      };
      warnings.push("Legacy glass fields migrated to overlays.textureOverlay.");
    }
  }

  let performanceScore: number | undefined;
  if (record.performanceScore !== undefined) {
    performanceScore = expectNumber(record, "performanceScore");
  }

  return {
    preset: {
      name: expectString(record, "name"),
      palette: expectString(record, "palette"),
      effect,
      speed: expectNumber(record, "speed"),
      distortion: expectNumber(record, "distortion"),
      noise: expectNumber(record, "noise"),
      overlays,
      performanceScore
    },
    warnings
  };
}

export function sanitizePresetName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "preset";
}

export function getShaderColors(palette: Palette | undefined): string[] {
  if (!palette) {
    return ["#111111", "#444444", "#777777", "#999999", "#BBBBBB", "#DDDDDD"];
  }
  return palette.colors.slice(0, MAX_SHADER_COLORS);
}
