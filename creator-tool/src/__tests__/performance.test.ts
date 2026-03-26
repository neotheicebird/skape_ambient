import { describe, expect, it } from "vitest";

import {
  MAX_PERFORMANCE_BUDGET,
  activeOverlayCount,
  calculatePerformanceScore,
  getPerformanceLevel
} from "../lib/performance";

describe("performance helpers", () => {
  it("calculates base plus overlay score", () => {
    const score = calculatePerformanceScore({
      effect: "burn",
      overlays: {
        textureOverlay: { texture: "frosted-soft", scale: 3, intensity: 0.3 },
        chromaticAberration: { intensity: 0.2, offset: 0.1, mode: "radial" }
      }
    });

    expect(score).toBe(5);
  });

  it("tracks active overlay count", () => {
    expect(activeOverlayCount(undefined)).toBe(0);
    expect(
      activeOverlayCount({
        textureOverlay: { texture: "frosted-soft", scale: 3, intensity: 0.2 },
        pixelGrid: { size: 24, lineStrength: 0.2 }
      })
    ).toBe(2);
  });

  it("maps score to user-facing level", () => {
    expect(getPerformanceLevel(2)).toBe("Light");
    expect(getPerformanceLevel(4)).toBe("Balanced");
    expect(getPerformanceLevel(5)).toBe("Heavy");
    expect(getPerformanceLevel(MAX_PERFORMANCE_BUDGET + 1)).toBe("Over Budget");
  });
});
