import { describe, expect, it } from "vitest";

import {
  createDefaultPreset,
  parseImportedPresetJson,
  sanitizePresetName,
  serializePreset,
  validatePreset
} from "../lib/preset";
import type { Palette } from "../types";

const palettes: Palette[] = [
  {
    name: "moss",
    colors: ["#0F0F0F", "#1F1F1F"]
  }
];

describe("preset helpers", () => {
  it("creates defaults from selected palette", () => {
    const preset = createDefaultPreset("moss");
    expect(preset.palette).toBe("moss");
    expect(preset.effect).toBe("flow");
  });

  it("validates palette and ranges", () => {
    const preset = {
      ...createDefaultPreset("missing"),
      speed: 6
    };

    const errors = validatePreset(preset, palettes);
    expect(errors).toContain("Preset palette must reference a loaded .hex palette.");
    expect(errors).toContain("Speed must be between 0 and 4.");
  });

  it("keeps overlay stacking advisory-only for validation", () => {
    const preset = {
      ...createDefaultPreset("moss"),
      overlays: {
        textureOverlay: { texture: "frosted-soft" as const, scale: 3, intensity: 0.3, distortion: 0.1 },
        chromaticAberration: { intensity: 0.2, offset: 0.1, mode: "radial" as const },
        pixelGrid: { size: 24, lineStrength: 0.2 }
      }
    };

    const errors = validatePreset(preset, palettes);
    expect(errors).toEqual([]);
  });

  it("serializes JSON with trailing newline", () => {
    const preset = createDefaultPreset("moss");
    expect(serializePreset(preset).endsWith("\n")).toBe(true);
  });

  it("sanitizes preset names for file names", () => {
    expect(sanitizePresetName("  Liquid Ember v1! ")).toBe("liquid-ember-v1");
  });

  it("parses imported v1.3 preset json", () => {
    const result = parseImportedPresetJson(
      JSON.stringify({
        name: "loaded",
        palette: "moss",
        effect: "flow",
        speed: 1.2,
        distortion: 0.4,
        noise: 0.6,
        overlays: {
          textureOverlay: {
            texture: "frosted-soft",
            scale: 3,
            intensity: 0.35
          }
        }
      })
    );

    expect(result.preset.name).toBe("loaded");
    expect(result.preset.effect).toBe("flow");
    expect(result.warnings).toEqual([]);
  });

  it("parses optional performanceScore metadata", () => {
    const result = parseImportedPresetJson(
      JSON.stringify({
        name: "with-score",
        palette: "moss",
        effect: "burn",
        speed: 1,
        distortion: 0.4,
        noise: 0.6,
        performanceScore: 4
      })
    );

    expect(result.preset.performanceScore).toBe(4);
  });

  it("migrates legacy liquid effect and glass fields", () => {
    const result = parseImportedPresetJson(
      JSON.stringify({
        name: "legacy",
        palette: "moss",
        effect: "liquid",
        speed: 1,
        distortion: 0.4,
        noise: 0.6,
        glass: true,
        glassSize: 0.5
      })
    );

    expect(result.preset.effect).toBe("flow");
    expect(result.preset.overlays?.textureOverlay?.texture).toBe("frosted-soft");
    expect(result.preset.overlays?.textureOverlay?.intensity).toBe(0.5);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("migrates legacy ribbed overlay to texture overlay", () => {
    const result = parseImportedPresetJson(
      JSON.stringify({
        name: "legacy-ribbed",
        palette: "moss",
        effect: "burn",
        speed: 1,
        distortion: 0.4,
        noise: 0.6,
        overlays: {
          ribbedGlass: { intensity: 0.4, frequency: 12, angle: 0, mode: "linear" }
        }
      })
    );

    expect(result.preset.overlays?.textureOverlay?.texture).toBe("ribbed-fine");
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("rejects imported preset with invalid effect", () => {
    expect(() =>
      parseImportedPresetJson(
        JSON.stringify({
          name: "bad",
          palette: "moss",
          effect: "unknown",
          speed: 1,
          distortion: 0.4,
          noise: 0.6
        })
      )
    ).toThrow('Preset field "effect" must be one of: flow, gas, burn, bands, cellular.');
  });
});
