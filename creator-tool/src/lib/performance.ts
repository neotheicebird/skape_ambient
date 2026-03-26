import type { OverlaySettings, Preset } from "../types";

export const DEFAULT_FPS_CAP = 30;
export const HIGH_QUALITY_FPS_CAP = 45;
export const DEFAULT_RESOLUTION_SCALE = 0.75;
export const HIGH_QUALITY_RESOLUTION_SCALE = 1;

export const MAX_PERFORMANCE_BUDGET = 5;

export const BASE_EFFECT_COST: Record<Preset["effect"], number> = {
  flow: 1,
  gas: 3,
  burn: 2,
  bands: 2,
  cellular: 3
};

export const OVERLAY_COST = {
  textureOverlay: 1,
  pixelGrid: 1,
  chromaticAberration: 2
} as const;

export type PerformanceLevel = "Light" | "Balanced" | "Heavy" | "Over Budget";

export function activeOverlayCount(overlays: OverlaySettings | undefined): number {
  if (!overlays) {
    return 0;
  }

  return [
    overlays.chromaticAberration,
    overlays.pixelGrid,
    overlays.textureOverlay
  ].filter(Boolean).length;
}

export function calculatePerformanceScore(preset: Pick<Preset, "effect" | "overlays">): number {
  let score = BASE_EFFECT_COST[preset.effect];
  const overlays = preset.overlays;

  if (!overlays) {
    return score;
  }

  if (overlays.pixelGrid) {
    score += OVERLAY_COST.pixelGrid;
  }
  if (overlays.chromaticAberration) {
    score += OVERLAY_COST.chromaticAberration;
  }
  if (overlays.textureOverlay) {
    score += OVERLAY_COST.textureOverlay;
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
