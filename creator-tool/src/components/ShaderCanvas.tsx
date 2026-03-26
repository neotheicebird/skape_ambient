import { useEffect, useRef, useState } from "react";

import {
  DEFAULT_FPS_CAP,
  DEFAULT_RESOLUTION_SCALE,
  HIGH_QUALITY_FPS_CAP,
  HIGH_QUALITY_RESOLUTION_SCALE
} from "../lib/performance";
import type { Preset } from "../types";
import {
  chromaticModeToInt,
  effectToMode,
  fragmentShaderSource,
  hexToRgbVector,
  ribbedModeToInt,
  vertexShaderSource
} from "../lib/shader";

type ShaderCanvasProps = {
  preset: Preset;
  colors: string[];
  paused?: boolean;
  qualityMode?: "default" | "high";
};

type UniformLocations = {
  uTime: WebGLUniformLocation | null;
  uResolution: WebGLUniformLocation | null;
  uColorCount: WebGLUniformLocation | null;
  uColors: Array<WebGLUniformLocation | null>;
  uSpeed: WebGLUniformLocation | null;
  uDistortion: WebGLUniformLocation | null;
  uNoise: WebGLUniformLocation | null;
  uMode: WebGLUniformLocation | null;
  uGasDirection: WebGLUniformLocation | null;
  uGasBandStrength: WebGLUniformLocation | null;
  uLiquidGlassIntensity: WebGLUniformLocation | null;
  uRibbedEnabled: WebGLUniformLocation | null;
  uRibbedIntensity: WebGLUniformLocation | null;
  uRibbedFrequency: WebGLUniformLocation | null;
  uRibbedAngle: WebGLUniformLocation | null;
  uRibbedMode: WebGLUniformLocation | null;
  uChromaticEnabled: WebGLUniformLocation | null;
  uChromaticIntensity: WebGLUniformLocation | null;
  uChromaticOffset: WebGLUniformLocation | null;
  uChromaticMode: WebGLUniformLocation | null;
  uPixelGridEnabled: WebGLUniformLocation | null;
  uPixelGridSize: WebGLUniformLocation | null;
  uPixelGridLineStrength: WebGLUniformLocation | null;
};

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Failed to create shader.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "Unknown shader compile error.";
    gl.deleteShader(shader);
    throw new Error(log);
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  const program = gl.createProgram();
  if (!program) {
    throw new Error("Failed to create shader program.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? "Unknown program link error.";
    gl.deleteProgram(program);
    throw new Error(log);
  }

  return program;
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
    uGasDirection: gl.getUniformLocation(program, "u_gasDirection"),
    uGasBandStrength: gl.getUniformLocation(program, "u_gasBandStrength"),
    uLiquidGlassIntensity: gl.getUniformLocation(program, "u_liquidGlassIntensity"),
    uRibbedEnabled: gl.getUniformLocation(program, "u_ribbedEnabled"),
    uRibbedIntensity: gl.getUniformLocation(program, "u_ribbedIntensity"),
    uRibbedFrequency: gl.getUniformLocation(program, "u_ribbedFrequency"),
    uRibbedAngle: gl.getUniformLocation(program, "u_ribbedAngle"),
    uRibbedMode: gl.getUniformLocation(program, "u_ribbedMode"),
    uChromaticEnabled: gl.getUniformLocation(program, "u_chromaticEnabled"),
    uChromaticIntensity: gl.getUniformLocation(program, "u_chromaticIntensity"),
    uChromaticOffset: gl.getUniformLocation(program, "u_chromaticOffset"),
    uChromaticMode: gl.getUniformLocation(program, "u_chromaticMode"),
    uPixelGridEnabled: gl.getUniformLocation(program, "u_pixelGridEnabled"),
    uPixelGridSize: gl.getUniformLocation(program, "u_pixelGridSize"),
    uPixelGridLineStrength: gl.getUniformLocation(program, "u_pixelGridLineStrength")
  };
}

export function ShaderCanvas({
  preset,
  colors,
  paused = false,
  qualityMode = "default"
}: ShaderCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const presetRef = useRef<Preset>(preset);
  const colorsRef = useRef<string[]>(colors);
  const pausedRef = useRef<boolean>(paused);
  const qualityModeRef = useRef<"default" | "high">(qualityMode);
  const [shaderError, setShaderError] = useState<string | null>(null);

  useEffect(() => {
    presetRef.current = preset;
  }, [preset]);

  useEffect(() => {
    colorsRef.current = colors;
  }, [colors]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    qualityModeRef.current = qualityMode;
  }, [qualityMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const gl = canvas.getContext("webgl", { antialias: true });
    if (!gl) {
      return;
    }

    let program: WebGLProgram;
    try {
      program = createProgram(gl);
      setShaderError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown shader initialization error.";
      setShaderError(message);
      return;
    }

    const buffer = gl.createBuffer();
    if (!buffer) {
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    gl.useProgram(program);

    const positionAttrib = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionAttrib);
    gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);

    const uniforms = getUniformLocations(gl, program);
    let simulatedTime = 0;
    let previousNow: number | null = null;
    let lastDrawNow: number | null = null;
    let isTabVisible = document.visibilityState !== "hidden";
    let isCanvasVisible = true;

    const handleVisibilityChange = (): void => {
      isTabVisible = document.visibilityState !== "hidden";
      previousNow = null;
      lastDrawNow = null;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver === "function") {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          isCanvasVisible = Boolean(entry?.isIntersecting);
          previousNow = null;
          lastDrawNow = null;
        },
        { threshold: 0.01 }
      );
      observer.observe(canvas);
    }

    const render = (now: number): void => {
      const currentPreset = presetRef.current;
      const currentColors = colorsRef.current;
      const currentQuality = qualityModeRef.current;
      const fpsCap = currentQuality === "high" ? HIGH_QUALITY_FPS_CAP : DEFAULT_FPS_CAP;
      const resolutionScale =
        currentQuality === "high" ? HIGH_QUALITY_RESOLUTION_SCALE : DEFAULT_RESOLUTION_SCALE;
      const frameIntervalMs = 1000 / fpsCap;
      const canDraw = isTabVisible && isCanvasVisible;

      const pixelRatio = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.floor(canvas.clientWidth * pixelRatio * resolutionScale));
      const height = Math.max(1, Math.floor(canvas.clientHeight * pixelRatio * resolutionScale));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      if (previousNow === null) {
        previousNow = now;
      }

      const deltaSeconds = Math.max(0, (now - previousNow) / 1000);
      previousNow = now;

      if (!canDraw) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      if (lastDrawNow !== null && now - lastDrawNow < frameIntervalMs) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      lastDrawNow = now;

      gl.viewport(0, 0, width, height);

      if (!pausedRef.current) {
        simulatedTime += deltaSeconds;
      }
      const elapsed = simulatedTime;

      const rgb = currentColors.slice(0, 6).map(hexToRgbVector);
      while (rgb.length < 6) {
        rgb.push(rgb[rgb.length - 1] ?? [0.2, 0.2, 0.2]);
      }

      const overlays = currentPreset.overlays ?? {};
      const liquid = overlays.liquidGlass;
      const ribbed = overlays.ribbedGlass;
      const chromatic = overlays.chromaticAberration;
      const pixelGrid = overlays.pixelGrid;

      gl.uniform1f(uniforms.uTime, elapsed);
      gl.uniform2f(uniforms.uResolution, width, height);
      gl.uniform1i(uniforms.uColorCount, Math.max(1, Math.min(currentColors.length, 6)));
      rgb.forEach((color, index) => {
        gl.uniform3f(uniforms.uColors[index], color[0], color[1], color[2]);
      });

      gl.uniform1f(uniforms.uSpeed, currentPreset.speed);
      gl.uniform1f(uniforms.uDistortion, currentPreset.distortion);
      gl.uniform1f(uniforms.uNoise, currentPreset.noise);
      gl.uniform1i(uniforms.uMode, effectToMode(currentPreset.effect));

      gl.uniform2f(uniforms.uGasDirection, 1.0, 0.35 + currentPreset.distortion * 0.65);
      gl.uniform1f(uniforms.uGasBandStrength, currentPreset.noise * 0.8);

      gl.uniform1f(uniforms.uLiquidGlassIntensity, liquid?.intensity ?? 0);
      gl.uniform1f(uniforms.uRibbedEnabled, ribbed ? 1 : 0);
      gl.uniform1f(uniforms.uRibbedIntensity, ribbed?.intensity ?? 0);
      gl.uniform1f(uniforms.uRibbedFrequency, ribbed?.frequency ?? 8);
      gl.uniform1f(uniforms.uRibbedAngle, ribbed?.angle ?? 0);
      gl.uniform1i(uniforms.uRibbedMode, ribbed ? ribbedModeToInt(ribbed.mode) : 0);

      gl.uniform1f(uniforms.uChromaticEnabled, chromatic ? 1 : 0);
      gl.uniform1f(uniforms.uChromaticIntensity, chromatic?.intensity ?? 0);
      gl.uniform1f(uniforms.uChromaticOffset, chromatic?.offset ?? 0);
      gl.uniform1i(uniforms.uChromaticMode, chromatic ? chromaticModeToInt(chromatic.mode) : 0);

      gl.uniform1f(uniforms.uPixelGridEnabled, pixelGrid ? 1 : 0);
      gl.uniform1f(uniforms.uPixelGridSize, pixelGrid?.size ?? 32);
      gl.uniform1f(uniforms.uPixelGridLineStrength, pixelGrid?.lineStrength ?? 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      observer?.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <div className="shader-canvas-wrap">
      <canvas className="shader-canvas" ref={canvasRef} />
      {shaderError && (
        <div className="shader-error">
          <strong>Shader preview unavailable</strong>
          <div>{shaderError}</div>
        </div>
      )}
    </div>
  );
}
