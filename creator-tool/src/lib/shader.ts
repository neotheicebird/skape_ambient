import type { EffectMode } from "../types";

export const vertexShaderSource = `
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const fragmentShaderSource = `
precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;

uniform vec3 u_colors[6];
uniform int u_colorCount;

uniform float u_speed;
uniform float u_distortion;
uniform float u_noise;

uniform float u_glass;
uniform float u_glassSize;

uniform int u_mode;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amp * noise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return value;
}

vec3 getPaletteColor(float t) {
  vec3 c0 = u_colors[0];
  vec3 c1 = u_colors[1];
  vec3 c2 = u_colors[2];
  vec3 c3 = u_colors[3];
  vec3 c4 = u_colors[4];
  vec3 c5 = u_colors[5];

  if (u_colorCount <= 1) {
    return c0;
  }

  float scaled = clamp(t, 0.0, 1.0) * float(u_colorCount - 1);
  if (scaled < 1.0) {
    return mix(c0, c1, scaled);
  }
  if (scaled < 2.0) {
    return mix(c1, c2, scaled - 1.0);
  }
  if (scaled < 3.0) {
    return mix(c2, c3, scaled - 2.0);
  }
  if (scaled < 4.0) {
    return mix(c3, c4, scaled - 3.0);
  }
  if (scaled < 5.0) {
    return mix(c4, c5, scaled - 4.0);
  }
  return c5;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  uv.x *= u_resolution.x / max(u_resolution.y, 1.0);

  float t = u_time * u_speed;
  vec2 warp = vec2(
    fbm(uv * (2.0 + u_noise) + vec2(t * 0.2, -t * 0.14)),
    fbm(uv * (2.2 + u_noise) + vec2(-t * 0.17, t * 0.11))
  );
  uv += (warp - 0.5) * u_distortion;

  float signal = fbm(uv * (3.0 + u_noise));

  if (u_mode == 1) {
    signal = fbm(uv * (4.5 + u_noise) + vec2(cos(t), sin(t)) * 0.7);
  } else if (u_mode == 2) {
    float threshold = 0.45 + 0.2 * sin(t * 0.6);
    signal = smoothstep(threshold - 0.08, threshold + 0.08, signal);
  }

  vec3 color = getPaletteColor(signal);

  if (u_glass > 0.5) {
    vec2 center = fract(uv * (1.0 + 3.0 * u_glassSize)) - 0.5;
    float lens = smoothstep(0.5, 0.0, length(center));
    color += vec3(lens * 0.15);
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

export function effectToMode(effect: EffectMode): number {
  switch (effect) {
    case "flow":
      return 0;
    case "liquid":
      return 1;
    case "burn":
      return 2;
  }
}

export function hexToRgbVector(hex: string): [number, number, number] {
  const normalized = hex.replace(/^#/, "");
  if (!/^[0-9A-Fa-f]{6}$/.test(normalized)) {
    throw new Error(`Invalid RGB hex: ${hex}`);
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  return [r, g, b];
}
