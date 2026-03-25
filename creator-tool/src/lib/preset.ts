import type { Palette, Preset } from "../types";

export const MAX_SHADER_COLORS = 6;
const EFFECT_MODES = new Set(["flow", "liquid", "burn"]);

const DEFAULT_PRESET: Preset = {
  name: "new-preset",
  palette: "",
  effect: "flow",
  speed: 1,
  distortion: 0.35,
  noise: 0.5,
  glass: false,
  glassSize: 0.3
};

export function createDefaultPreset(paletteName: string): Preset {
  return {
    ...DEFAULT_PRESET,
    palette: paletteName || DEFAULT_PRESET.palette
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

  if (preset.speed < 0 || preset.speed > 4) {
    errors.push("Speed must be between 0 and 4.");
  }

  if (preset.distortion < 0 || preset.distortion > 1) {
    errors.push("Distortion must be between 0 and 1.");
  }

  if (preset.noise < 0 || preset.noise > 1) {
    errors.push("Noise must be between 0 and 1.");
  }

  if (preset.glassSize < 0.05 || preset.glassSize > 1) {
    errors.push("Glass size must be between 0.05 and 1.");
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

export function parseImportedPresetJson(rawJson: string): Preset {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error("Invalid JSON file.");
  }

  const record = expectObject(parsed);
  const effect = expectString(record, "effect");
  if (!EFFECT_MODES.has(effect)) {
    throw new Error('Preset field "effect" must be one of: flow, liquid, burn.');
  }

  return {
    name: expectString(record, "name"),
    palette: expectString(record, "palette"),
    effect: effect as Preset["effect"],
    speed: expectNumber(record, "speed"),
    distortion: expectNumber(record, "distortion"),
    noise: expectNumber(record, "noise"),
    glass: expectBoolean(record, "glass"),
    glassSize: expectNumber(record, "glassSize")
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
