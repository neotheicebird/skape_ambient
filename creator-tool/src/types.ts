export type EffectMode = "flow" | "gas" | "burn" | "bands" | "cellular";

export type ChromaticAberration = {
  intensity: number;
  offset: number;
  mode: "radial" | "directional";
};

export type PixelGrid = {
  size: number;
  lineStrength: number;
};

export const TEXTURE_IDS = [
  "ribbed-fine",
  "ribbed-wide",
  "ribbed-diagonal",
  "frosted-soft",
  "grain"
] as const;

export type TextureId = (typeof TEXTURE_IDS)[number];

export type TextureOverlay = {
  texture: TextureId;
  scale: number;
  intensity: number;
  distortion?: number;
};

export type OverlaySettings = {
  chromaticAberration?: ChromaticAberration;
  pixelGrid?: PixelGrid;
  textureOverlay?: TextureOverlay;
};

export type Preset = {
  name: string;
  palette: string;
  effect: EffectMode;
  speed: number;
  distortion: number;
  noise: number;
  overlays?: OverlaySettings;
  performanceScore?: number;
};

export type Palette = {
  name: string;
  colors: string[];
};

export type PresetTier = "free" | "pro";
