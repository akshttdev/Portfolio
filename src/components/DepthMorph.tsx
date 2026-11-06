"use client";

/**
 * Scroll-driven depth morph between photos.
 *
 * Each slide is a photo plus a grayscale depth map (white = near). As you scroll, the next photo
 * dissolves in nearest-first along a noisy, rippling edge with a chromatic split; the cursor drives
 * depth parallax. Plain WebGL, no extra deps. Falls back to a static image without WebGL.
 *
 * Transition technique inspired by the hero on martingarrix.com.
 */

import { useEffect, useRef, useState } from "react";
import { getLenis } from "@/lib/lenis";

/** focus: point to keep in frame when the photo is cropped to the screen, as [x, y] fractions from the
 *  top-left (default centre). Matters for portrait photos on landscape screens and vice versa. */
/** zoom: crop in further than "cover" (1 = default, 1.2 = 20% closer). Lets focus re-centre a subject even
 *  when the photo's full width/height would otherwise already be on screen. */
/** face: where the face is in the photo ({x, y} centre and h = face height, all fractions from the top-left).
 *  anchor: when set on one slide with a face, every other slide with a face is zoomed/shifted so the face
 *  lands at the same screen position and size as the anchor's — the morph then flows face-to-face.
 *  The anchor itself is shown un-zoomed (or at its own zoom), framed as close to centre as the photo allows. */
export type DepthSlide = {
  image: string;
  depth: string;
  label: string;
  focus?: [number, number];
  zoom?: number;
  face?: { x: number; y: number; h: number };
  anchor?: boolean;
};

type Props = { slides: DepthSlide[]; title: string };

const CFG = {
  hold: 0.35, // scroll rest between transitions, in screen heights
  parallax: 0.04,
  // soft cap on how far the cursor can push the depth effect: full response near the centre, easing off
  // toward the screen edges (1.0 at the edge maps to 0.6) so it never reaches the cut-out "paper" look
  parallaxLimit: 0.4,
  breath: 0.015,
  scrollEase: 0.08, // only used when Lenis isn't already smoothing the scroll
  mouseEase: 0.06,
  shift: { image: 0.014, title: 16 },
  idle: { delayMs: 1500, ax: 0.75, fx: 0.42, ay: 0.45, fy: 0.84, py: 0.6 },
  revealDelay: 0.7, // let the page-transition wipe finish first
  rim: [0.55, 0.06, 0.04] as const, // red glow on the dissolve edge
};

const VERT = `
attribute vec2 aPos;
uniform vec2 uScale, uOffset;
varying vec2 vUv;
void main() { vUv = aPos * .5 + .5; gl_Position = vec4(aPos * uScale + uOffset, 0., 1.); }`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uFrom, uFromDepth, uTo, uToDepth;
uniform float uFromAspect, uToAspect, uPlaneAspect, uProgress, uParallax, uTime, uReveal, uBreath;
uniform vec2 uMouse, uFromFocus, uToFocus;
uniform float uFromZoom, uToZoom;
uniform vec3 uRim;

// visible fraction of the image per axis for object-fit: cover, with overscan (so parallax never
// samples past the edge), an optional per-slide zoom and a slow breathing zoom
vec2 coverScale(float imgAspect, float zoom) {
  vec2 s = uPlaneAspect > imgAspect ? vec2(1., imgAspect / uPlaneAspect) : vec2(uPlaneAspect / imgAspect, 1.);
  float breath = 1. - uBreath * (.5 + .5 * sin(uTime * .35));
  return s * (1. - uParallax * 1.2) * breath / zoom;
}
// crop centre: the slide's focus point, kept far enough from the edges that the crop stays inside the image
vec2 coverCenter(float imgAspect, vec2 focus, float zoom) {
  vec2 k = coverScale(imgAspect, zoom);
  return clamp(focus, .5 * k, 1. - .5 * k);
}
vec2 cover(vec2 uv, float imgAspect, vec2 focus, float zoom) {
  return (uv - .5) * coverScale(imgAspect, zoom) + coverCenter(imgAspect, focus, zoom);
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
// depth with the foreground slightly dilated (max of a small cross), so silhouettes carry their own
// edge instead of smearing the background behind them into a ghost outline
float depthAt(sampler2D depth, vec2 uv) {
  const float o = .004;
  float d = texture2D(depth, uv).r;
  d = max(d, texture2D(depth, uv + vec2(o, 0.)).r);
  d = max(d, texture2D(depth, uv - vec2(o, 0.)).r);
  d = max(d, texture2D(depth, uv + vec2(0., o)).r);
  d = max(d, texture2D(depth, uv - vec2(0., o)).r);
  return d;
}
// depth parallax: near (white) pixels shift more with the cursor. Two refinement steps sample depth at the
// displaced position, which keeps edges solid instead of tearing at strong offsets.
vec2 parallax(sampler2D depth, vec2 uv) {
  vec2 off = uMouse * uParallax;
  vec2 p = uv + off * (depthAt(depth, uv) - .5);
  p = uv + off * (depthAt(depth, p) - .5);
  return uv + off * (depthAt(depth, mix(uv, p, .5)) - .5);
}

void main() {
  float p = uProgress;
  vec2 cA = coverCenter(uFromAspect, uFromFocus, uFromZoom);
  vec2 cB = coverCenter(uToAspect, uToFocus, uToZoom);
  vec2 uvA = cover(vUv, uFromAspect, uFromFocus, uFromZoom);
  vec2 uvB = cover(vUv, uToAspect, uToFocus, uToZoom);
  float dA = texture2D(uFromDepth, uvA).r;
  float dB = texture2D(uToDepth, uvB).r;

  // outgoing photo pushes toward the viewer, incoming settles from a slight zoom (around the focus point)
  uvA = (uvA - cA) * (1. - p * (.12 + .18 * dA)) + cA;
  uvB = (uvB - cB) * (1. + (1. - p) * (.10 + .15 * dB)) + cB;
  uvA = parallax(uFromDepth, uvA);
  uvB = parallax(uToDepth, uvB);

  // depth-ordered dissolve: near parts of the next photo arrive first
  float n = noise(vUv * 6. + uTime * .15) * .35 + noise(vUv * 22.) * .1;
  float edge = (1. - dB) * .55 + n;
  float t = p * 1.6 - .3;
  float mask = smoothstep(edge - .08, edge + .08, t);
  float rim = mask * (1. - mask) * 4.;

  // ripple + chromatic split along the edge
  vec2 dir = normalize(vUv - .5 + 1e-4);
  uvA += dir * rim * .03;
  uvB -= dir * rim * .03;
  float ca = rim * .012;
  vec3 colA = vec3(texture2D(uFrom, uvA + dir * ca).r, texture2D(uFrom, uvA).g, texture2D(uFrom, uvA - dir * ca).b);
  vec3 colB = vec3(texture2D(uTo,   uvB + dir * ca).r, texture2D(uTo,   uvB).g, texture2D(uTo,   uvB - dir * ca).b);
  vec3 col = mix(colA, colB, mask) + rim * uRim;

  // intro: wipe up from the bottom with a soft edge (premultiplied alpha)
  float shown = 1. - smoothstep(uReveal * 1.12 - .12, uReveal * 1.12, vUv.y);
  gl_FragColor = vec4(col * shown, shown);
}`;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease3 = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
const outCubic = (x: number) => 1 - (1 - clamp(x)) ** 3;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

export default function DepthMorph({ slides, title }: Props) {
  const heroRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const rollRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  const N = slides.length;
  const span = (N - 1) * (1 + CFG.hold) + CFG.hold;

  useEffect(() => {
    const hero = heroRef.current, stage = stageRef.current, host = canvasHostRef.current;
    const titleEl = titleRef.current, roll = rollRef.current, label = labelRef.current, cue = cueRef.current;
    if (!hero || !stage || !host || !titleEl || !roll || !label || !cue || N < 2) return;

    // A fresh canvas per mount. A WebGL context is tied to its canvas element, and we lose the context
    // on unmount to free GPU memory; reusing the same element on remount (client-side navigation,
    // StrictMode, fast refresh) would hand back that dead context and drop us into the fallback.
    const canvas = document.createElement("canvas");
    canvas.className = "absolute inset-0 w-full h-full block";
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);

    const gl = canvas.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: true });
    if (!gl) {
      console.warn("DepthMorph: WebGL unavailable, showing static image");
      canvas.remove();
      setFallback(true);
      return;
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
      return s;
    };
    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
    } catch (e) {
      console.warn("DepthMorph: WebGL setup failed, showing static image", e);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
      setFallback(true);
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const names = ["uFrom", "uFromDepth", "uTo", "uToDepth", "uFromAspect", "uToAspect", "uPlaneAspect", "uProgress",
      "uParallax", "uTime", "uReveal", "uBreath", "uMouse", "uScale", "uOffset", "uRim", "uFromFocus", "uToFocus", "uFromZoom", "uToZoom"] as const;
    const U = Object.fromEntries(names.map(n => [n, gl.getUniformLocation(prog, n)])) as Record<(typeof names)[number], WebGLUniformLocation | null>;
    gl.uniform1i(U.uFrom, 0); gl.uniform1i(U.uFromDepth, 1); gl.uniform1i(U.uTo, 2); gl.uniform1i(U.uToDepth, 3);
    gl.uniform3f(U.uRim, ...CFG.rim);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    const textures: WebGLTexture[] = [];
    const makeTex = (src: TexImageSource) => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      textures.push(t);
      return t;
    };

    // focus in texture space: x from the left, y from the bottom (textures are uploaded flipped)
    type Loaded = {
      img: WebGLTexture; depth: WebGLTexture; aspect: number;
      focus: [number, number]; zoom: number;
      face: [number, number, number] | null; // x, y (from bottom), height — texture space
    };
    const loaded: (Loaded | null)[] = slides.map(() => null);
    let disposed = false;
    let planeAspect = 1;
    let bound = "";

    // ---- framing: crop centre + zoom per slide for the current screen aspect
    const anchorIdx = slides.findIndex(s => s.anchor && s.face);
    // visible fraction of an image per axis at plain object-fit: cover
    const coverS = (a: number): [number, number] => (planeAspect > a ? [1, a / planeAspect] : [planeAspect / a, 1]);
    // where the anchor's face ends up on screen (uv, from bottom-left) and how tall it is (fraction of screen)
    const anchorTarget = () => {
      const l = anchorIdx >= 0 ? loaded[anchorIdx] : null;
      if (!l?.face) return null;
      const [sx, sy] = coverS(l.aspect);
      const kx = sx / l.zoom, ky = sy / l.zoom;
      const want = [0.5, 0.58]; // try to centre it, a little above the middle
      const cx = clamp(l.face[0] - (want[0] - 0.5) * kx, kx / 2, 1 - kx / 2);
      const cy = clamp(l.face[1] - (want[1] - 0.5) * ky, ky / 2, 1 - ky / 2);
      return { x: (l.face[0] - cx) / kx + 0.5, y: (l.face[1] - cy) / ky + 0.5, h: l.face[2] / ky };
    };
    const framing = (l: Loaded): { center: [number, number]; zoom: number } => {
      const t = anchorTarget();
      if (!l.face || !t) return { center: l.focus, zoom: l.zoom };
      const [sx, sy] = coverS(l.aspect);
      // zoom so the face matches the anchor's size; never below "cover" (that would expose the photo's edges)
      const zoom = l === loaded[anchorIdx] ? l.zoom : clamp((t.h * sy) / l.face[2], 1, 2.2);
      const kx = sx / zoom, ky = sy / zoom;
      return { center: [l.face[0] - (t.x - 0.5) * kx, l.face[1] - (t.y - 0.5) * ky], zoom };
    };

    // ---- sizing + title measurement
    const letters = Array.from(titleEl.children) as HTMLElement[];
    let letterPos = letters.map(() => 0.5);
    const measure = () => {
      const tb = titleEl.getBoundingClientRect();
      if (!tb.width) return;
      letterPos = letters.map(l => { const r = l.getBoundingClientRect(); return (r.left + r.width / 2 - tb.left) / tb.width; });
    };
    const resize = () => {
      // Cap the render budget: photos + grain don't need full Retina res, and fill cost scales with pixels
      const w = stage.clientWidth, h = stage.clientHeight;
      const MAX_PIXELS = 2560 * 1440;
      let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      if (w * h * dpr * dpr > MAX_PIXELS) dpr = Math.sqrt(MAX_PIXELS / (w * h));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      planeAspect = h > 0 ? w / h : 1;
      gl.uniform1f(U.uPlaneAspect, planeAspect);
      bound = ""; // framing depends on screen aspect: rebind on next frame
      measure();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    resize();
    document.fonts?.ready.then(() => !disposed && measure());

    // ---- input
    const pointer = { x: 0, y: 0, lastMove: -Infinity };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
      pointer.lastMove = performance.now();
    };
    const onLeave = () => { pointer.x = 0; pointer.y = 0; };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scrollTarget = () => {
      const max = hero.offsetHeight - window.innerHeight;
      return max > 0 ? clamp(-hero.getBoundingClientRect().top / max) : 0;
    };
    const slideAt = (s: number) => {
      let i = s * span;
      for (let k = 0; k < N - 1; k++) {
        if ((i -= CFG.hold) <= 0) return { index: k, progress: 0 };
        if (i < 1) return { index: k, progress: ease3(i) };
        i -= 1;
      }
      return { index: N - 2, progress: 1 };
    };

    const bind = (i: number) => {
      const a = loaded[i], b = loaded[i + 1] ?? a;
      if (!a || !b) return false;
      const key = `${i}:${b === a ? "a" : "b"}`;
      if (key !== bound) {
        bound = key;
        [a.img, a.depth, b.img, b.depth].forEach((t, unit) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); });
        gl.uniform1f(U.uFromAspect, a.aspect);
        gl.uniform1f(U.uToAspect, b.aspect);
        const fa = framing(a), fb = framing(b);
        gl.uniform2f(U.uFromFocus, ...fa.center);
        gl.uniform2f(U.uToFocus, ...fb.center);
        gl.uniform1f(U.uFromZoom, fa.zoom);
        gl.uniform1f(U.uToZoom, fb.zoom);
      }
      return true;
    };

    // ---- frame loop
    let smooth = scrollTarget();
    let last = performance.now();
    let startAt: number | null = null;
    let shownIdx = -1;
    let raf = 0;
    const mouse = { x: 0, y: 0 };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (startAt === null) startAt = now;
      const time = (now - startAt) / 1000;
      const still = reduce.matches;
      const k = (f: number) => 1 - (1 - f) ** (60 * dt);

      const target = scrollTarget();
      smooth += (target - smooth) * (still || getLenis() ? 1 : k(CFG.scrollEase));

      const I = CFG.idle;
      const idle = !still && now - pointer.lastMove > I.delayMs;
      const tx = idle ? I.ax * Math.sin(time * I.fx) : pointer.x;
      const ty = idle ? I.ay * Math.sin(time * I.fy + I.py) : pointer.y;
      const mk = k(idle ? CFG.mouseEase * 0.5 : CFG.mouseEase);
      mouse.x += (tx - mouse.x) * mk;
      mouse.y += (ty - mouse.y) * mk;

      const reveal = still ? 1 : outCubic((time - CFG.revealDelay) / 1.1);
      const { index, progress } = slideAt(smooth);
      if (!bind(index)) return;

      // first transition grows the framed card into a full-bleed photo
      const startScale = stage.clientWidth < 768 ? 0.74 : 0.56;
      const V = index === 0 ? progress : 1;
      const scale = (startScale + (1 - startScale) * V) * (0.94 + 0.06 * reveal);
      gl.uniform2f(U.uScale, scale, scale);
      gl.uniform2f(U.uOffset, mouse.x * CFG.shift.image, (1 - V) * 0.14 + mouse.y * CFG.shift.image);
      gl.uniform1f(U.uProgress, progress);
      gl.uniform1f(U.uTime, time);
      gl.uniform1f(U.uReveal, reveal);
      gl.uniform1f(U.uParallax, still ? 0 : CFG.parallax);
      gl.uniform1f(U.uBreath, still ? 0 : CFG.breath);
      const soft = (v: number) => { const c = clamp(v, -1, 1); return c * (1 - CFG.parallaxLimit * Math.abs(c)); };
      gl.uniform2f(U.uMouse, soft(mouse.x), soft(mouse.y));
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // title letters rise in from the centre outward, then lift away during the first morph
      titleEl.style.transform = `translate3d(${-mouse.x * CFG.shift.title}px, ${mouse.y * CFG.shift.title * 0.6}px, 0)`;
      letters.forEach((el, i) => {
        const c = letterPos[i], n = 2 * Math.abs(c - 0.5);
        const out = clamp((V - n * 0.35) / 0.5);
        const drift = (c - 0.5) * 2 * out * 0.25;
        const inn = still ? 1 : outCubic((time - (CFG.revealDelay + 0.4 + n * 0.3)) / 0.8);
        el.style.transform = `translate(${drift}em, ${(-out + 1 - inn) * 110}%)`;
      });

      const idx = index + (progress > 0.5 ? 1 : 0);
      if (idx !== shownIdx) {
        shownIdx = idx;
        roll.style.transform = `translateY(${-idx * 1.25}em)`;
        label.textContent = slides[idx].label;
      }
      cue.style.opacity = String(1 - clamp((smooth * span) / 0.25));
    };

    // only render while the hero is on screen and the tab is visible
    let visible = true, running = false;
    const sync = () => {
      // wait for the anchor too, otherwise the first slides would visibly re-frame when it arrives
      const ready = loaded[0] !== null && (anchorIdx < 0 || loaded[anchorIdx] !== null);
      const should = !disposed && visible && !document.hidden && ready;
      if (should === running) return;
      running = should;
      if (should) { last = performance.now(); raf = requestAnimationFrame(frame); }
      else cancelAnimationFrame(raf);
    };
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    io.observe(hero);
    document.addEventListener("visibilitychange", sync);

    const loadSlide = async (s: DepthSlide): Promise<Loaded> => {
      const [img, depth] = await Promise.all([loadImage(s.image), loadImage(s.depth)]);
      if (disposed) throw new Error("disposed");
      const [fx, fy] = s.focus ?? [0.5, 0.5];
      return {
        img: makeTex(img), depth: makeTex(depth), aspect: img.naturalWidth / img.naturalHeight,
        focus: [fx, 1 - fy], zoom: Math.max(1, s.zoom ?? 1),
        face: s.face ? [s.face.x, 1 - s.face.y, s.face.h] : null,
      };
    };
    loadSlide(slides[0])
      .then(first => {
        loaded[0] = first;
        sync();
        return Promise.all(slides.slice(1).map((s, i) => loadSlide(s).then(l => { loaded[i + 1] = l; })));
      })
      .catch(e => {
        if (disposed) return;
        console.warn("DepthMorph: a texture failed to load, showing static image", e);
        setFallback(true);
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      textures.forEach(t => gl.deleteTexture(t));
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
  }, [slides, N, span]);

  return (
    <section ref={heroRef} className="relative bg-[#0a0a0a]" style={{ height: `${(span + 1) * 100}vh` }}>
      <div ref={stageRef} className="sticky top-0 h-screen h-[100svh] overflow-hidden select-none">
        {fallback ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slides[0]?.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div ref={canvasHostRef} className="absolute inset-0" />
        )}

        <h1
          ref={titleRef}
          aria-label={title}
          className="absolute inset-x-0 bottom-[3vh] flex justify-center overflow-hidden pt-[0.08em] pointer-events-none
                     font-robert-b uppercase text-white mix-blend-difference leading-[0.82] tracking-[-0.04em]
                     text-[clamp(64px,19vw,380px)] will-change-transform"
        >
          {[...title].map((ch, i) => (
            <span key={i} aria-hidden="true" className="inline-block will-change-transform"
              style={{ transform: fallback ? "none" : "translateY(110%)" }}>
              {ch}
            </span>
          ))}
        </h1>

        <div className="absolute top-20 inset-x-6 flex justify-between nav-txt text-white/70 pointer-events-none max-md:top-16">
          <span>
            <span className="inline-block h-[1.25em] overflow-hidden align-top text-white">
              <span ref={rollRef} className="flex flex-col transition-transform duration-[420ms] ease-[cubic-bezier(.2,.8,.2,1)]">
                {slides.map((_, i) => <span key={i} className="h-[1.25em] leading-[1.25em]">{String(i + 1).padStart(2, "0")}</span>)}
              </span>
            </span>
            {" / "}{String(N).padStart(2, "0")}
          </span>
          <span ref={labelRef}>{slides[0]?.label}</span>
        </div>

        {/* plain white (not nav-txt, whose mix-blend-difference inverts it into colours over the photo) */}
        <div ref={cueRef} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-robert-b text-[.9rem] max-sm:text-[.75rem] uppercase tracking-wide text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)] pointer-events-none flex flex-col items-center gap-3">
          Scroll
          <span className="block w-px h-10 bg-white origin-top animate-pulse" />
        </div>
      </div>
    </section>
  );
}
