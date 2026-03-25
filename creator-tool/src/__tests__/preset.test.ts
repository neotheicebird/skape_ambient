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

  it("serializes JSON with trailing newline", () => {
    const preset = createDefaultPreset("moss");
    expect(serializePreset(preset).endsWith("\n")).toBe(true);
  });

  it("sanitizes preset names for file names", () => {
    expect(sanitizePresetName("  Liquid Ember v1! ")).toBe("liquid-ember-v1");
  });

  it("parses imported preset json", () => {
    const preset = parseImportedPresetJson(
      JSON.stringify({
        name: "loaded",
        palette: "moss",
        effect: "flow",
        speed: 1.2,
        distortion: 0.4,
        noise: 0.6,
        glass: true,
        glassSize: 0.5
      })
    );

    expect(preset.name).toBe("loaded");
    expect(preset.effect).toBe("flow");
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
          noise: 0.6,
          glass: false,
          glassSize: 0.5
        })
      )
    ).toThrow('Preset field "effect" must be one of: flow, liquid, burn.');
  });
});
