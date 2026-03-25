import type { ChromaticAberration, EffectMode, RibbedGlass } from "../types";

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
uniform int u_mode;

uniform vec2 u_gasDirection;
uniform float u_gasBandStrength;

uniform float u_liquidGlassIntensity;
uniform float u_ribbedEnabled;
uniform float u_ribbedIntensity;
uniform float u_ribbedFrequency;
uniform float u_ribbedAngle;
uniform int u_ribbedMode;

uniform float u_chromaticEnabled;
uniform float u_chromaticIntensity;
uniform float u_chromaticOffset;
uniform int u_chromaticMode;

uniform float u_pixelGridEnabled;
uniform float u_pixelGridSize;
uniform float u_pixelGridLineStrength;

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
  for (int i = 0; i < 4; i++) {
    value += amp * noise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return value;
}

vec2 rotate2d(vec2 v, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
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

float baseField(vec2 uv, float t) {
  vec2 warped = uv;
  vec2 warp = vec2(
    fbm(warped * (2.0 + u_noise) + vec2(t * 0.18, -t * 0.11)),
    fbm(warped * (2.2 + u_noise) + vec2(-t * 0.13, t * 0.17))
  );
  warped += (warp - 0.5) * u_distortion;

  if (u_mode == 0) {
    // flow
    return fbm(warped * (3.0 + u_noise));
  }

  if (u_mode == 1) {
    // burn
    float signal = fbm(warped * (4.2 + u_noise));
    float threshold = 0.45 + 0.2 * sin(t * 0.65);
    return smoothstep(threshold - 0.08, threshold + 0.08, signal);
  }

  // gas
  vec2 dir = normalize(u_gasDirection);
  vec2 stretched = vec2(dot(warped, dir) * 3.4, dot(warped, vec2(-dir.y, dir.x)) * 1.15);
  float signal = fbm(stretched + vec2(t * 0.16, -t * 0.06));
  if (u_gasBandStrength > 0.001) {
    float bands = 0.5 + 0.5 * sin((stretched.y + t * 0.24) * 12.0);
    signal = mix(signal, signal * (0.65 + 0.35 * bands), clamp(u_gasBandStrength, 0.0, 1.0));
  }
  return signal;
}

vec2 applyOverlayUvDistortion(vec2 uv, float t) {
  vec2 outUv = uv;

  if (u_liquidGlassIntensity > 0.001) {
    vec2 ripple = vec2(
      sin((outUv.y + t * 0.4) * 18.0),
      cos((outUv.x - t * 0.35) * 14.0)
    );
    outUv += ripple * (0.015 * u_liquidGlassIntensity);
  }

  if (u_ribbedEnabled > 0.5 && u_ribbedIntensity > 0.001) {
    vec2 centered = outUv - 0.5;
    vec2 rotated = rotate2d(centered, radians(u_ribbedAngle));
    if (u_ribbedMode == 0) {
      rotated.x += sin(rotated.y * u_ribbedFrequency) * (0.03 * u_ribbedIntensity);
    } else {
      vec2 cells = floor(rotated * u_ribbedFrequency) / max(u_ribbedFrequency, 1.0);
      rotated = mix(rotated, cells, clamp(u_ribbedIntensity, 0.0, 1.0));
    }
    outUv = rotate2d(rotated, -radians(u_ribbedAngle)) + 0.5;
  }

  return outUv;
}

float getGridLineMask(vec2 uv) {
  if (u_pixelGridEnabled < 0.5 || u_pixelGridSize < 1.0 || u_pixelGridLineStrength <= 0.001) {
    return 0.0;
  }

  vec2 scaled = uv * u_pixelGridSize;
  vec2 local = fract(scaled);
  float border = min(min(local.x, 1.0 - local.x), min(local.y, 1.0 - local.y));
  float line = 1.0 - smoothstep(0.0, 0.08, border);
  return line * clamp(u_pixelGridLineStrength, 0.0, 1.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  uv.x *= u_resolution.x / max(u_resolution.y, 1.0);

  float t = u_time * u_speed;

  vec2 sampleUv = applyOverlayUvDistortion(uv, t);

  if (u_pixelGridEnabled > 0.5 && u_pixelGridSize >= 1.0) {
    sampleUv = floor(sampleUv * u_pixelGridSize) / u_pixelGridSize + (0.5 / u_pixelGridSize);
  }

  float signal = baseField(sampleUv, t);
  vec3 color = getPaletteColor(signal);

  if (u_chromaticEnabled > 0.5 && u_chromaticIntensity > 0.001) {
    vec2 offsetDir = vec2(1.0, 0.0);
    if (u_chromaticMode == 0) {
      vec2 centered = sampleUv - 0.5;
      offsetDir = normalize(centered + vec2(0.0001, 0.0001));
    }

    vec2 offsetUv = offsetDir * u_chromaticOffset * 0.06;
    float signalR = baseField(sampleUv + offsetUv, t);
    float signalB = baseField(sampleUv - offsetUv, t);

    vec3 colR = getPaletteColor(signalR);
    vec3 colG = color;
    vec3 colB = getPaletteColor(signalB);

    vec3 shifted = vec3(colR.r, colG.g, colB.b);
    color = mix(color, shifted, clamp(u_chromaticIntensity, 0.0, 1.0));
  }

  float gridMask = getGridLineMask(sampleUv);
  if (gridMask > 0.0) {
    color = mix(color, color * 0.55, gridMask);
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

export function effectToMode(effect: EffectMode): number {
  switch (effect) {
    case "flow":
      return 0;
    case "burn":
      return 1;
    case "gas":
      return 2;
  }
}

export function ribbedModeToInt(mode: RibbedGlass["mode"]): number {
  return mode === "grid" ? 1 : 0;
}

export function chromaticModeToInt(mode: ChromaticAberration["mode"]): number {
  return mode === "directional" ? 1 : 0;
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
