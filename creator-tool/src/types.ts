export type EffectMode = "flow" | "burn" | "gas";

export type LiquidGlass = {
  intensity: number;
};

export type RibbedGlass = {
  intensity: number;
  frequency: number;
  angle: number;
  mode: "linear" | "grid";
};

export type ChromaticAberration = {
  intensity: number;
  offset: number;
  mode: "radial" | "directional";
};

export type PixelGrid = {
  size: number;
  lineStrength: number;
};

export type OverlaySettings = {
  liquidGlass?: LiquidGlass;
  ribbedGlass?: RibbedGlass;
  chromaticAberration?: ChromaticAberration;
  pixelGrid?: PixelGrid;
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
