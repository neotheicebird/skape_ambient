export type EffectMode = "flow" | "liquid" | "burn";

export type Preset = {
  name: string;
  palette: string;
  effect: EffectMode;
  speed: number;
  distortion: number;
  noise: number;
  glass: boolean;
  glassSize: number;
};

export type Palette = {
  name: string;
  colors: string[];
};

export type PresetTier = "free" | "pro";
