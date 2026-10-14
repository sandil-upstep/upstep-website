"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import Image from "next/image";
import gsap from "gsap";

// WebGL displacement crossfade between story photos, after Codrops'
// "WebGL Image Transitions" demo 5: each photo is smeared vertically by the
// other photo's brightness while they crossfade.
// Falls back to a plain next/image when WebGL is unavailable or the photos
// haven't loaded yet.

export type StoryPhotoMorphHandle = {
  // Returns false when WebGL isn't driving the photo, so the caller can
  // fall back to its CSS transition.
  morphTo: (index: number, seconds: number, reduceMotion: boolean) => boolean;
};

type Props = {
  ref?: Ref<StoryPhotoMorphHandle>;
  photos: string[];
  index: number;
  alt: string;
  sizes: string;
};

// Strength of the vertical smear (the demo uses 0.3); 0 = plain crossfade.
const INTENSITY = 0.3;
const MAX_DPR = 2;

const VERTEX = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  // v = 0 at the top so it lines up with the unflipped image rows.
  vUv = vec2(position.x * 0.5 + 0.5, 0.5 - position.y * 0.5);
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT = `
precision mediump float;
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform vec2 scale1;
uniform vec2 scale2;
uniform float progress;
uniform float intensity;
varying vec2 vUv;

// object-fit: cover; object-position: center top
vec2 cover(vec2 uv, vec2 s) {
  return vec2((uv.x - 0.5) * s.x + 0.5, uv.y * s.y);
}

vec4 readTex(sampler2D tex, vec2 uv) {
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(tex, uv);
}

float luma(vec4 c) {
  return (c.r + c.g + c.b) * 0.33;
}

void main() {
  vec2 base1 = cover(vUv, scale1);
  vec2 base2 = cover(vUv, scale2);

  // Each photo's brightness drives the other's displacement.
  float displace1 = luma(readTex(texture1, base1));
  float displace2 = luma(readTex(texture2, base2));

  // v grows downward here, so subtract to drip the pixels down like the demo.
  vec2 uv1 = vec2(base1.x, base1.y - progress * displace2 * intensity);
  vec2 uv2 = vec2(base2.x, base2.y - (1.0 - progress) * displace1 * intensity);

  gl_FragColor = mix(readTex(texture1, uv1), readTex(texture2, uv2), progress);
}
`;

type Tex = { texture: WebGLTexture; aspect: number };

type GLState = {
  gl: WebGLRenderingContext;
  textures: Tex[]; // one per photo index
  uniforms: Record<
    "texture1" | "texture2" | "scale1" | "scale2" | "progress" | "intensity",
    WebGLUniformLocation | null
  >;
  from: number;
  to: number;
  progress: number;
  intensity: number;
  tween?: gsap.core.Tween;
};

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function StoryPhotoMorph({ ref, photos, index, alt, sizes }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GLState | null>(null);
  const [ready, setReady] = useState(false);
  // Snapshot so the effect below only runs once per set of photos.
  const initialIndex = useRef(index);
  const photoKey = photos.join("|");

  const draw = () => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!s || !canvas) return;
    const { gl, uniforms: u } = s;
    const a = s.textures[s.from];
    const b = s.textures[s.to];
    const canvasAspect = canvas.width / canvas.height || 1;
    const scale = (imageAspect: number): [number, number] =>
      canvasAspect > imageAspect ? [1, imageAspect / canvasAspect] : [canvasAspect / imageAspect, 1];

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, a.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, b.texture);
    gl.uniform2fv(u.scale1, scale(a.aspect));
    gl.uniform2fv(u.scale2, scale(b.aspect));
    gl.uniform1f(u.progress, s.progress);
    gl.uniform1f(u.intensity, s.intensity);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return;

    let cancelled = false;
    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    // One oversized triangle covers the whole canvas.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      texture1: gl.getUniformLocation(program, "texture1"),
      texture2: gl.getUniformLocation(program, "texture2"),
      scale1: gl.getUniformLocation(program, "scale1"),
      scale2: gl.getUniformLocation(program, "scale2"),
      progress: gl.getUniformLocation(program, "progress"),
      intensity: gl.getUniformLocation(program, "intensity"),
    };
    gl.uniform1i(uniforms.texture1, 0);
    gl.uniform1i(uniforms.texture2, 1);
    gl.clearColor(0, 0, 0, 0);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      draw();
    };
    const observer = new ResizeObserver(resize);

    const unique = [...new Set(photos)];
    Promise.all(unique.map(loadImage))
      .then((images) => {
        if (cancelled) return;
        const bySrc = new Map<string, Tex>();
        images.forEach((img, i) => {
          const texture = gl.createTexture()!;
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          bySrc.set(unique[i], { texture, aspect: img.naturalWidth / img.naturalHeight });
        });
        const start = initialIndex.current;
        stateRef.current = {
          gl,
          textures: photos.map((src) => bySrc.get(src)!),
          uniforms,
          from: start,
          to: start,
          progress: 0,
          intensity: INTENSITY,
        };
        observer.observe(canvas);
        resize();
        setReady(true);
      })
      .catch(() => {
        // Leave the next/image fallback in place.
      });

    const onLost = (e: Event) => {
      e.preventDefault();
      stateRef.current?.tween?.kill();
      stateRef.current = null;
      setReady(false);
    };
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      cancelled = true;
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      stateRef.current?.tween?.kill();
      stateRef.current = null;
      setReady(false);
    };
    // draw only reads refs, so it doesn't need to be a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoKey]);

  useImperativeHandle(ref, () => ({
    morphTo(target, seconds, reduceMotion) {
      const s = stateRef.current;
      if (!s) return false;
      s.tween?.kill();
      s.from = s.progress >= 0.5 ? s.to : s.from;
      s.to = target;
      s.progress = 0;
      // Reduced motion: a plain crossfade with no displacement.
      s.intensity = reduceMotion ? 0 : INTENSITY;
      s.tween = gsap.to(s, {
        progress: 1,
        duration: seconds,
        ease: "power2.inOut",
        onUpdate: draw,
        onComplete: () => {
          s.from = target;
          s.progress = 0;
          draw();
        },
      });
      return true;
    },
  }));

  return (
    <>
      <canvas
        ref={canvasRef}
        className="stories__photo-canvas"
        role="img"
        aria-label={alt}
        aria-hidden={!ready}
        data-ready={ready || undefined}
      />
      {!ready && <Image src={photos[index]} fill sizes={sizes} alt={alt} />}
    </>
  );
}
