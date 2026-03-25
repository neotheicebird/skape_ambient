import { useEffect, useRef, useState } from "react";

import type { Preset } from "../types";
import { effectToMode, fragmentShaderSource, hexToRgbVector, vertexShaderSource } from "../lib/shader";

type ShaderCanvasProps = {
  preset: Preset;
  colors: string[];
};

type UniformLocations = {
  uTime: WebGLUniformLocation | null;
  uResolution: WebGLUniformLocation | null;
  uColorCount: WebGLUniformLocation | null;
  uColors: Array<WebGLUniformLocation | null>;
  uSpeed: WebGLUniformLocation | null;
  uDistortion: WebGLUniformLocation | null;
  uNoise: WebGLUniformLocation | null;
  uGlass: WebGLUniformLocation | null;
  uGlassSize: WebGLUniformLocation | null;
  uMode: WebGLUniformLocation | null;
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
    uGlass: gl.getUniformLocation(program, "u_glass"),
    uGlassSize: gl.getUniformLocation(program, "u_glassSize"),
    uMode: gl.getUniformLocation(program, "u_mode")
  };
}

export function ShaderCanvas({ preset, colors }: ShaderCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const [shaderError, setShaderError] = useState<string | null>(null);

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

    const start = performance.now();

    const render = (now: number): void => {
      const pixelRatio = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.floor(canvas.clientWidth * pixelRatio));
      const height = Math.max(1, Math.floor(canvas.clientHeight * pixelRatio));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      gl.viewport(0, 0, width, height);

      const elapsed = (now - start) / 1000;

      const rgb = colors.slice(0, 6).map(hexToRgbVector);
      while (rgb.length < 6) {
        rgb.push(rgb[rgb.length - 1] ?? [0.2, 0.2, 0.2]);
      }

      gl.uniform1f(uniforms.uTime, elapsed);
      gl.uniform2f(uniforms.uResolution, width, height);
      gl.uniform1i(uniforms.uColorCount, Math.max(1, Math.min(colors.length, 6)));
      rgb.forEach((color, index) => {
        gl.uniform3f(uniforms.uColors[index], color[0], color[1], color[2]);
      });

      gl.uniform1f(uniforms.uSpeed, preset.speed);
      gl.uniform1f(uniforms.uDistortion, preset.distortion);
      gl.uniform1f(uniforms.uNoise, preset.noise);
      gl.uniform1f(uniforms.uGlass, preset.glass ? 1 : 0);
      gl.uniform1f(uniforms.uGlassSize, preset.glassSize);
      gl.uniform1i(uniforms.uMode, effectToMode(preset.effect));

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [preset, colors]);

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
