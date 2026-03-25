import type {
  ChromaticAberration,
  LiquidGlass,
  OverlaySettings,
  Palette,
  PixelGrid,
  Preset,
  RibbedGlass
} from "../types";

export const MAX_SHADER_COLORS = 6;
const EFFECT_MODES = new Set(["flow", "burn", "gas"]);

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

function activeOverlayCount(overlays: OverlaySettings | undefined): number {
  if (!overlays) {
    return 0;
  }

  return [
    overlays.liquidGlass,
    overlays.ribbedGlass,
    overlays.chromaticAberration,
    overlays.pixelGrid
  ].filter(Boolean).length;
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
    errors.push("Preset effect must be one of: flow, burn, gas.");
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
  if (activeOverlayCount(overlays) > 3) {
    errors.push("Use at most 3 overlays per preset for performance guardrails.");
  }

  if (overlays?.liquidGlass) {
    if (overlays.liquidGlass.intensity < 0 || overlays.liquidGlass.intensity > 1) {
      errors.push("Liquid glass intensity must be between 0 and 1.");
    }
  }

  if (overlays?.ribbedGlass) {
    if (overlays.ribbedGlass.intensity < 0 || overlays.ribbedGlass.intensity > 1) {
      errors.push("Ribbed glass intensity must be between 0 and 1.");
    }
    if (overlays.ribbedGlass.frequency <= 0) {
      errors.push("Ribbed glass frequency must be greater than 0.");
    }
  }

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

function parseLiquidGlass(value: unknown): LiquidGlass {
  const record = expectObject(value);
  return {
    intensity: expectNumber(record, "intensity")
  };
}

function parseRibbedGlass(value: unknown): RibbedGlass {
  const record = expectObject(value);
  const mode = expectString(record, "mode");
  if (mode !== "linear" && mode !== "grid") {
    throw new Error('Ribbed glass mode must be "linear" or "grid".');
  }

  return {
    intensity: expectNumber(record, "intensity"),
    frequency: expectNumber(record, "frequency"),
    angle: expectNumber(record, "angle"),
    mode
  };
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

function parseOverlays(value: unknown): OverlaySettings {
  const record = expectObject(value);
  const overlays: OverlaySettings = {};

  if (record.liquidGlass !== undefined) {
    overlays.liquidGlass = parseLiquidGlass(record.liquidGlass);
  }
  if (record.ribbedGlass !== undefined) {
    overlays.ribbedGlass = parseRibbedGlass(record.ribbedGlass);
  }
  if (record.chromaticAberration !== undefined) {
    overlays.chromaticAberration = parseChromaticAberration(record.chromaticAberration);
  }
  if (record.pixelGrid !== undefined) {
    overlays.pixelGrid = parsePixelGrid(record.pixelGrid);
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

  throw new Error('Preset field "effect" must be one of: flow, burn, gas.');
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
    overlays = parseOverlays(record.overlays);
  }

  // Legacy v1 migration path
  if (record.glass !== undefined || record.glassSize !== undefined) {
    const glass = record.glass === undefined ? false : expectBoolean(record, "glass");
    const glassSize = record.glassSize === undefined ? 0.25 : expectNumber(record, "glassSize");
    if (glass) {
      overlays = {
        ...overlays,
        liquidGlass: overlays.liquidGlass ?? { intensity: glassSize }
      };
      warnings.push("Legacy glass fields migrated to overlays.liquidGlass.");
    }
  }

  return {
    preset: {
      name: expectString(record, "name"),
      palette: expectString(record, "palette"),
      effect,
      speed: expectNumber(record, "speed"),
      distortion: expectNumber(record, "distortion"),
      noise: expectNumber(record, "noise"),
      overlays
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
