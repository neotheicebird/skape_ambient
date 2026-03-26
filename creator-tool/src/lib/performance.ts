import type { OverlaySettings, Preset } from "../types";

export const DEFAULT_FPS_CAP = 30;
export const HIGH_QUALITY_FPS_CAP = 45;
export const DEFAULT_RESOLUTION_SCALE = 0.75;
export const HIGH_QUALITY_RESOLUTION_SCALE = 1;

export const MAX_PERFORMANCE_BUDGET = 5;

export const BASE_EFFECT_COST: Record<Preset["effect"], number> = {
  flow: 1,
  burn: 2,
  gas: 3
};

export const OVERLAY_COST = {
  liquidGlass: 1,
  ribbedGlass: 1,
  pixelGrid: 1,
  chromaticAberration: 2
} as const;

export type PerformanceLevel = "Light" | "Balanced" | "Heavy" | "Over Budget";

export function activeOverlayCount(overlays: OverlaySettings | undefined): number {
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

export function calculatePerformanceScore(preset: Pick<Preset, "effect" | "overlays">): number {
  let score = BASE_EFFECT_COST[preset.effect];
  const overlays = preset.overlays;

  if (!overlays) {
    return score;
  }

  if (overlays.liquidGlass) {
    score += OVERLAY_COST.liquidGlass;
  }
  if (overlays.ribbedGlass) {
    score += OVERLAY_COST.ribbedGlass;
  }
  if (overlays.pixelGrid) {
    score += OVERLAY_COST.pixelGrid;
  }
  if (overlays.chromaticAberration) {
    score += OVERLAY_COST.chromaticAberration;
  }

  return score;
}

export function getPerformanceLevel(score: number): PerformanceLevel {
  if (score <= 2) {
    return "Light";
  }

  if (score <= 4) {
    return "Balanced";
  }

  if (score === 5) {
    return "Heavy";
  }

  return "Over Budget";
}
