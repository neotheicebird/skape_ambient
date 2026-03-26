import type { ChromaticAberration, EffectMode, TextureId } from "../types";

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

uniform float u_chromaticEnabled;
uniform float u_chromaticIntensity;
uniform float u_chromaticOffset;
uniform int u_chromaticMode;

uniform float u_pixelGridEnabled;
uniform float u_pixelGridSize;
uniform float u_pixelGridLineStrength;

uniform float u_textureEnabled;
uniform int u_textureId;
uniform float u_textureScale;
uniform float u_textureIntensity;
uniform float u_textureDistortion;

uniform float u_grainIntensity;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amp * valueNoise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return value;
}

float worley(vec2 p) {
  vec2 cell = floor(p);
  vec2 local = fract(p);
  float minDist = 1.0;

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = vec2(
        hash21(cell + neighbor + vec2(0.37, 0.91)),
        hash21(cell + neighbor + vec2(1.73, 2.11))
      );
      vec2 diff = neighbor + point - local;
      minDist = min(minDist, length(diff));
    }
  }

  return minDist;
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

float texturePattern(vec2 uv, int textureId) {
  if (textureId == 0) {
    return 0.5 + 0.5 * sin(uv.x * 40.0);
  }

  if (textureId == 1) {
    return 0.5 + 0.5 * sin(uv.x * 16.0);
  }

  if (textureId == 2) {
    return 0.5 + 0.5 * sin((uv.x + uv.y) * 24.0);
  }

  if (textureId == 3) {
    return fbm(uv * 5.0);
  }

  return hash21(floor(uv * 120.0));
}

vec2 applyTextureUvDistortion(vec2 uv, float t) {
  if (u_textureEnabled < 0.5 || u_textureDistortion <= 0.001) {
    return uv;
  }

  vec2 texUv = uv * max(0.1, u_textureScale) + vec2(t * 0.04, -t * 0.03);
  float p = texturePattern(texUv, u_textureId);
  vec2 offset = vec2(p - 0.5, 0.5 - p) * (0.03 * clamp(u_textureDistortion, 0.0, 1.0));
  return uv + offset;
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
    // gas
    vec2 dir = normalize(vec2(1.0, 0.35 + u_distortion * 0.65));
    vec2 stretched = vec2(dot(warped, dir) * 3.4, dot(warped, vec2(-dir.y, dir.x)) * 1.15);
    float signal = fbm(stretched + vec2(t * 0.16, -t * 0.06));
    float softBands = 0.5 + 0.5 * sin((stretched.y + t * 0.24) * 10.0);
    return mix(signal, signal * (0.65 + 0.35 * softBands), clamp(u_noise, 0.0, 1.0));
  }

  if (u_mode == 2) {
    // burn
    float signal = fbm(warped * (4.2 + u_noise));
    float threshold = 0.45 + 0.2 * sin(t * 0.65);
    return smoothstep(threshold - 0.08, threshold + 0.08, signal);
  }

  if (u_mode == 3) {
    // bands
    float stripe = 0.5 + 0.5 * sin((warped.x + fbm(warped * 2.6 + vec2(t * 0.1, 0.0)) * 0.35) * (8.0 + u_noise * 18.0));
    float compressed = pow(stripe, mix(1.0, 2.8, clamp(u_distortion, 0.0, 1.0)));
    return compressed;
  }

  // cellular
  float cells = worley(warped * (3.0 + u_noise * 3.0) + vec2(t * 0.1, -t * 0.08));
  float inverted = 1.0 - clamp(cells * 1.65, 0.0, 1.0);
  float detail = fbm(warped * 3.2 + vec2(-t * 0.06, t * 0.07));
  return mix(inverted, inverted * (0.75 + 0.25 * detail), 0.45);
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

  vec2 sampleUv = applyTextureUvDistortion(uv, t);

  if (u_pixelGridEnabled > 0.5 && u_pixelGridSize >= 1.0) {
    sampleUv = floor(sampleUv * u_pixelGridSize) / u_pixelGridSize + (0.5 / u_pixelGridSize);
  }

  float signal = baseField(sampleUv, t);
  vec3 color = getPaletteColor(signal);

  if (u_textureEnabled > 0.5 && u_textureIntensity > 0.001) {
    vec2 texUv = sampleUv * max(0.1, u_textureScale) + vec2(t * 0.03, -t * 0.02);
    float p = texturePattern(texUv, u_textureId);
    float modulation = mix(1.0, 0.6 + 0.8 * p, clamp(u_textureIntensity, 0.0, 1.0));
    color *= modulation;
  }

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

  float grain = (hash21(gl_FragCoord.xy + vec2(t * 61.7, t * 37.1)) - 0.5) * clamp(u_grainIntensity, 0.0, 1.0);
  color = clamp(color + vec3(grain), 0.0, 1.0);

  gl_FragColor = vec4(color, 1.0);
}
`;

export function effectToMode(effect: EffectMode): number {
  switch (effect) {
    case "flow":
      return 0;
    case "gas":
      return 1;
    case "burn":
      return 2;
    case "bands":
      return 3;
    case "cellular":
      return 4;
  }
}

export function chromaticModeToInt(mode: ChromaticAberration["mode"]): number {
  return mode === "directional" ? 1 : 0;
}

export function textureIdToInt(textureId: TextureId): number {
  switch (textureId) {
    case "ribbed-fine":
      return 0;
    case "ribbed-wide":
      return 1;
    case "ribbed-diagonal":
      return 2;
    case "frosted-soft":
      return 3;
    case "grain":
      return 4;
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
