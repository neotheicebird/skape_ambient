import { addPropertyControls, ControlType } from "framer"
import { type CSSProperties, useEffect, useRef } from "react"

type EffectMode = "flow" | "gas" | "burn" | "bands" | "cellular"
type ChromaticMode = "radial" | "directional"
type TextureId = "ribbed-fine" | "ribbed-wide" | "ribbed-diagonal" | "frosted-soft" | "grain"

type PresetConfig = {
    effect: EffectMode
    speed: number
    distortion: number
    noise: number
    overlays?: {
        chromaticAberration?: {
            intensity: number
            offset: number
            mode: ChromaticMode
        }
        pixelGrid?: {
            size: number
            lineStrength: number
        }
        textureOverlay?: {
            texture: TextureId
            scale: number
            intensity: number
            distortion?: number
        }
    }
}

type PresetName =
    | "Sea Drift"
    | "Flaming Soda"
    | "Nebula Glow"
    | "Eerie Green"
    | "Symbiotes"
    | "Photosynthesis"
    | "Twilight Fade"

type SkapeAmbientProps = {
    preset: PresetName
    style?: CSSProperties
    width?: number
    height?: number
}

type UniformLocations = {
    uTime: WebGLUniformLocation | null
    uResolution: WebGLUniformLocation | null
    uColorCount: WebGLUniformLocation | null
    uColors: Array<WebGLUniformLocation | null>
    uSpeed: WebGLUniformLocation | null
    uDistortion: WebGLUniformLocation | null
    uNoise: WebGLUniformLocation | null
    uMode: WebGLUniformLocation | null
    uChromaticEnabled: WebGLUniformLocation | null
    uChromaticIntensity: WebGLUniformLocation | null
    uChromaticOffset: WebGLUniformLocation | null
    uChromaticMode: WebGLUniformLocation | null
    uPixelGridEnabled: WebGLUniformLocation | null
    uPixelGridSize: WebGLUniformLocation | null
    uPixelGridLineStrength: WebGLUniformLocation | null
    uTextureEnabled: WebGLUniformLocation | null
    uTextureId: WebGLUniformLocation | null
    uTextureScale: WebGLUniformLocation | null
    uTextureIntensity: WebGLUniformLocation | null
    uTextureDistortion: WebGLUniformLocation | null
    uGrainIntensity: WebGLUniformLocation | null
}

const DEFAULT_FPS_CAP = 30
const DEFAULT_GRAIN_INTENSITY = 0.05

const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAGMENT_SHADER_SOURCE = `
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
    return fbm(warped * (3.0 + u_noise));
  }

  if (u_mode == 1) {
    vec2 dir = normalize(vec2(1.0, 0.35 + u_distortion * 0.65));
    vec2 stretched = vec2(dot(warped, dir) * 3.4, dot(warped, vec2(-dir.y, dir.x)) * 1.15);
    float signal = fbm(stretched + vec2(t * 0.16, -t * 0.06));
    float softBands = 0.5 + 0.5 * sin((stretched.y + t * 0.24) * 10.0);
    return mix(signal, signal * (0.65 + 0.35 * softBands), clamp(u_noise, 0.0, 1.0));
  }

  if (u_mode == 2) {
    float signal = fbm(warped * (4.2 + u_noise));
    float threshold = 0.45 + 0.2 * sin(t * 0.65);
    return smoothstep(threshold - 0.08, threshold + 0.08, signal);
  }

  if (u_mode == 3) {
    float stripe = 0.5 + 0.5 * sin((warped.x + fbm(warped * 2.6 + vec2(t * 0.1, 0.0)) * 0.35) * (8.0 + u_noise * 18.0));
    float compressed = pow(stripe, mix(1.0, 2.8, clamp(u_distortion, 0.0, 1.0)));
    return compressed;
  }

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
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

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
`

const PALETTES: Record<string, string[]> = {
    curiosities: ["#46425e", "#15788c", "#00b9be", "#ffeecc", "#ffb0a3", "#ff6973"],
    "soda-cap": ["#2176cc", "#ff7d6e", "#fca6ac", "#e8e7cb"],
    "kirokaze-gameboy": ["#332c50", "#46878f", "#94e344", "#e2f3e4"],
    "lava-gb": ["#051f39", "#4a2480", "#c53a9d", "#ff8e80"],
    "slimy-05": ["#d1cb95", "#40985e", "#1a644e", "#04373b", "#0a1a2f"],
    "twilight-5": ["#fbbbad", "#ee8695", "#4a7a96", "#333f58", "#292831"],
}

const PRESETS: Record<PresetName, { palette: keyof typeof PALETTES; config: PresetConfig }> = {
    "Sea Drift": {
        palette: "curiosities",
        config: {
            effect: "gas",
            speed: 0.5,
            distortion: 0.3,
            noise: 0.5,
            overlays: {
                pixelGrid: {
                    size: 160,
                    lineStrength: 0.13,
                },
            },
        },
    },
    "Flaming Soda": {
        palette: "soda-cap",
        config: {
            effect: "burn",
            speed: 0.7,
            distortion: 0.75,
            noise: 0.75,
            overlays: {
                chromaticAberration: {
                    intensity: 0.4,
                    offset: 0.15,
                    mode: "radial",
                },
            },
        },
    },
    "Nebula Glow": {
        palette: "curiosities",
        config: {
            effect: "bands",
            speed: 0.95,
            distortion: 0.5,
            noise: 0.59,
        },
    },
    "Eerie Green": {
        palette: "kirokaze-gameboy",
        config: {
            effect: "bands",
            speed: 1.51,
            distortion: 0.25,
            noise: 0.5,
            overlays: {
                chromaticAberration: {
                    intensity: 0.25,
                    offset: 0.4,
                    mode: "directional",
                },
            },
        },
    },
    Symbiotes: {
        palette: "lava-gb",
        config: {
            effect: "cellular",
            speed: 3,
            distortion: 0.6,
            noise: 1,
        },
    },
    Photosynthesis: {
        palette: "slimy-05",
        config: {
            effect: "cellular",
            speed: 1.5,
            distortion: 0.1,
            noise: 0.6,
        },
    },
    "Twilight Fade": {
        palette: "twilight-5",
        config: {
            effect: "flow",
            speed: 0.1,
            distortion: 0.03,
            noise: 0.1,
        },
    },
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type)
    if (!shader) {
        throw new Error("Failed to create shader")
    }

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader) ?? "Unknown shader compile error"
        gl.deleteShader(shader)
        throw new Error(log)
    }

    return shader
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE)
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE)

    const program = gl.createProgram()
    if (!program) {
        throw new Error("Failed to create shader program")
    }

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(program) ?? "Unknown program link error"
        gl.deleteProgram(program)
        throw new Error(log)
    }

    return program
}

function getUniformLocations(gl: WebGLRenderingContext, program: WebGLProgram): UniformLocations {
    return {
        uTime: gl.getUniformLocation(program, "u_time"),
        uResolution: gl.getUniformLocation(program, "u_resolution"),
        uColorCount: gl.getUniformLocation(program, "u_colorCount"),
        uColors: Array.from({ length: 6 }, (_, i) => gl.getUniformLocation(program, `u_colors[${i}]`)),
        uSpeed: gl.getUniformLocation(program, "u_speed"),
        uDistortion: gl.getUniformLocation(program, "u_distortion"),
        uNoise: gl.getUniformLocation(program, "u_noise"),
        uMode: gl.getUniformLocation(program, "u_mode"),
        uChromaticEnabled: gl.getUniformLocation(program, "u_chromaticEnabled"),
        uChromaticIntensity: gl.getUniformLocation(program, "u_chromaticIntensity"),
        uChromaticOffset: gl.getUniformLocation(program, "u_chromaticOffset"),
        uChromaticMode: gl.getUniformLocation(program, "u_chromaticMode"),
        uPixelGridEnabled: gl.getUniformLocation(program, "u_pixelGridEnabled"),
        uPixelGridSize: gl.getUniformLocation(program, "u_pixelGridSize"),
        uPixelGridLineStrength: gl.getUniformLocation(program, "u_pixelGridLineStrength"),
        uTextureEnabled: gl.getUniformLocation(program, "u_textureEnabled"),
        uTextureId: gl.getUniformLocation(program, "u_textureId"),
        uTextureScale: gl.getUniformLocation(program, "u_textureScale"),
        uTextureIntensity: gl.getUniformLocation(program, "u_textureIntensity"),
        uTextureDistortion: gl.getUniformLocation(program, "u_textureDistortion"),
        uGrainIntensity: gl.getUniformLocation(program, "u_grainIntensity"),
    }
}

function effectToMode(effect: EffectMode): number {
    switch (effect) {
        case "flow":
            return 0
        case "gas":
            return 1
        case "burn":
            return 2
        case "bands":
            return 3
        case "cellular":
            return 4
    }
}

function chromaticModeToInt(mode: ChromaticMode): number {
    return mode === "directional" ? 1 : 0
}

function textureIdToInt(textureId: TextureId): number {
    switch (textureId) {
        case "ribbed-fine":
            return 0
        case "ribbed-wide":
            return 1
        case "ribbed-diagonal":
            return 2
        case "frosted-soft":
            return 3
        case "grain":
            return 4
    }
}

function hexToRgbVector(hex: string): [number, number, number] {
    const normalized = hex.replace(/^#/, "")
    if (!/^[0-9A-Fa-f]{6}$/.test(normalized)) {
        throw new Error(`Invalid RGB hex: ${hex}`)
    }

    const r = Number.parseInt(normalized.slice(0, 2), 16) / 255
    const g = Number.parseInt(normalized.slice(2, 4), 16) / 255
    const b = Number.parseInt(normalized.slice(4, 6), 16) / 255
    return [r, g, b]
}

function resolvePreset(presetName: PresetName): { config: PresetConfig; colors: string[] } {
    const preset = PRESETS[presetName] ?? PRESETS["Sea Drift"]
    return {
        config: preset.config,
        colors: PALETTES[preset.palette],
    }
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 */
export default function SkapeAmbient(props: SkapeAmbientProps) {
    const { style, ...rest } = props
    void rest
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const animationRef = useRef<number | null>(null)
    const presetRef = useRef(resolvePreset(props.preset))

    useEffect(() => {
        presetRef.current = resolvePreset(props.preset)
    }, [props.preset])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) {
            return
        }
        canvas.style.width = "100%"
        canvas.style.height = "100%"
        canvas.style.display = "block"

        const gl = canvas.getContext("webgl", { antialias: true })
        if (!gl) {
            return
        }

        let program: WebGLProgram
        try {
            program = createProgram(gl)
        } catch {
            return
        }

        const buffer = gl.createBuffer()
        if (!buffer) {
            gl.deleteProgram(program)
            return
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)

        gl.useProgram(program)

        const positionAttrib = gl.getAttribLocation(program, "a_position")
        gl.enableVertexAttribArray(positionAttrib)
        gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0)

        const uniforms = getUniformLocations(gl, program)
        let simulatedTime = 0
        let previousNow: number | null = null
        let lastDrawNow: number | null = null
        let isTabVisible = typeof document === "undefined" ? true : document.visibilityState !== "hidden"
        let isCanvasVisible = true

        const handleVisibilityChange = () => {
            if (typeof document !== "undefined") {
                isTabVisible = document.visibilityState !== "hidden"
                previousNow = null
                lastDrawNow = null
            }
        }

        if (typeof document !== "undefined") {
            document.addEventListener("visibilitychange", handleVisibilityChange)
        }

        let observer: IntersectionObserver | null = null
        if (typeof IntersectionObserver === "function") {
            observer = new IntersectionObserver(
                (entries) => {
                    const entry = entries[0]
                    isCanvasVisible = Boolean(entry?.isIntersecting)
                    previousNow = null
                    lastDrawNow = null
                },
                { threshold: 0.01 }
            )
            observer.observe(canvas)
        }

        const render = (now: number): void => {
            const { config, colors } = presetRef.current
            const frameIntervalMs = 1000 / DEFAULT_FPS_CAP
            const canDraw = isTabVisible && isCanvasVisible

            const width = Math.max(1, canvas.clientWidth)
            const height = Math.max(1, canvas.clientHeight)

            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width
                canvas.height = height
            }

            if (previousNow === null) {
                previousNow = now
            }

            const deltaSeconds = Math.max(0, (now - previousNow) / 1000)
            previousNow = now

            if (!canDraw) {
                animationRef.current = requestAnimationFrame(render)
                return
            }

            if (lastDrawNow !== null && now - lastDrawNow < frameIntervalMs) {
                animationRef.current = requestAnimationFrame(render)
                return
            }

            lastDrawNow = now

            gl.viewport(0, 0, canvas.width, canvas.height)
            simulatedTime += deltaSeconds

            const rgb = colors.slice(0, 6).map(hexToRgbVector)
            while (rgb.length < 6) {
                rgb.push(rgb[rgb.length - 1] ?? [0.2, 0.2, 0.2])
            }

            const overlays = config.overlays ?? {}
            const chromatic = overlays.chromaticAberration
            const pixelGrid = overlays.pixelGrid
            const textureOverlay = overlays.textureOverlay

            gl.uniform1f(uniforms.uTime, simulatedTime)
            gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height)
            gl.uniform1i(uniforms.uColorCount, Math.max(1, Math.min(colors.length, 6)))
            rgb.forEach((color, index) => {
                gl.uniform3f(uniforms.uColors[index], color[0], color[1], color[2])
            })

            gl.uniform1f(uniforms.uSpeed, config.speed)
            gl.uniform1f(uniforms.uDistortion, config.distortion)
            gl.uniform1f(uniforms.uNoise, config.noise)
            gl.uniform1i(uniforms.uMode, effectToMode(config.effect))

            gl.uniform1f(uniforms.uChromaticEnabled, chromatic ? 1 : 0)
            gl.uniform1f(uniforms.uChromaticIntensity, chromatic?.intensity ?? 0)
            gl.uniform1f(uniforms.uChromaticOffset, chromatic?.offset ?? 0)
            gl.uniform1i(uniforms.uChromaticMode, chromatic ? chromaticModeToInt(chromatic.mode) : 0)

            gl.uniform1f(uniforms.uPixelGridEnabled, pixelGrid ? 1 : 0)
            gl.uniform1f(uniforms.uPixelGridSize, pixelGrid?.size ?? 32)
            gl.uniform1f(uniforms.uPixelGridLineStrength, pixelGrid?.lineStrength ?? 0)

            gl.uniform1f(uniforms.uTextureEnabled, textureOverlay ? 1 : 0)
            gl.uniform1i(uniforms.uTextureId, textureOverlay ? textureIdToInt(textureOverlay.texture) : 0)
            gl.uniform1f(uniforms.uTextureScale, textureOverlay?.scale ?? 1)
            gl.uniform1f(uniforms.uTextureIntensity, textureOverlay?.intensity ?? 0)
            gl.uniform1f(uniforms.uTextureDistortion, textureOverlay?.distortion ?? 0)

            gl.uniform1f(uniforms.uGrainIntensity, DEFAULT_GRAIN_INTENSITY)

            gl.drawArrays(gl.TRIANGLES, 0, 6)
            animationRef.current = requestAnimationFrame(render)
        }

        animationRef.current = requestAnimationFrame(render)

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
            observer?.disconnect()
            if (typeof document !== "undefined") {
                document.removeEventListener("visibilitychange", handleVisibilityChange)
            }
            gl.deleteBuffer(buffer)
            gl.deleteProgram(program)
        }
    }, [])

    return (
        <div style={{ ...style }}>
            <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
        </div>
    )
}

SkapeAmbient.defaultProps = {
    preset: "Sea Drift",
    width: 400,
    height: 400,
}

addPropertyControls(SkapeAmbient, {
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        options: ["Sea Drift", "Flaming Soda", "Nebula Glow", "Eerie Green", "Symbiotes", "Photosynthesis", "Twilight Fade"],
    },
})
