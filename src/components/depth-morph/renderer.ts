import { CFG } from "./config";
import { FRAG, VERT } from "./shaders";
import { frameSlide, type LoadedSlide } from "./framing";

const UNIFORMS = [
  "uFrom", "uFromDepth", "uTo", "uToDepth", "uFromAspect", "uToAspect", "uPlaneAspect", "uProgress", "uParallax",
  "uTime", "uReveal", "uBreath", "uMouse", "uScale", "uOffset", "uRim", "uFromFocus", "uToFocus", "uFromZoom", "uToZoom",
] as const;

export type FrameParams = {
  scale: number;
  offset: [number, number];
  progress: number;
  time: number;
  reveal: number;
  parallax: number;
  breath: number;
  mouse: [number, number];
};

export type MorphRenderer = ReturnType<typeof setup>;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
  return s;
}

function link(gl: WebGLRenderingContext) {
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
  return prog;
}

/** Sets up the morph program on `canvas`. Returns null (and logs why) when WebGL isn't usable. */
export function createMorphRenderer(canvas: HTMLCanvasElement): MorphRenderer | null {
  const gl = canvas.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: true });
  if (!gl) {
    console.warn("DepthMorph: WebGL unavailable, showing static image");
    return null;
  }
  try {
    return setup(gl, canvas, link(gl));
  } catch (e) {
    console.warn("DepthMorph: WebGL setup failed, showing static image", e);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  }
}

function setup(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, prog: WebGLProgram) {
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const U = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(prog, n)])) as Record<
    (typeof UNIFORMS)[number],
    WebGLUniformLocation | null
  >;
  gl.uniform1i(U.uFrom, 0);
  gl.uniform1i(U.uFromDepth, 1);
  gl.uniform1i(U.uTo, 2);
  gl.uniform1i(U.uToDepth, 3);
  gl.uniform3f(U.uRim, ...CFG.rim);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  const textures: WebGLTexture[] = [];
  let planeAspect = 1;
  // the pair of slides whose textures + framing are bound; cleared on resize (framing depends on aspect)
  let bound: [LoadedSlide, LoadedSlide] | null = null;

  return {
    createTexture(src: TexImageSource) {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      textures.push(t);
      return t;
    },

    /** Size the canvas for a w x h CSS-pixel stage, within the pixel budget. */
    resize(w: number, h: number) {
      let dpr = Math.min(window.devicePixelRatio || 1, CFG.maxDpr);
      if (w * h * dpr * dpr > CFG.maxPixels) dpr = Math.sqrt(CFG.maxPixels / (w * h));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      planeAspect = h > 0 ? w / h : 1;
      gl.uniform1f(U.uPlaneAspect, planeAspect);
      bound = null;
    },

    /** Morph from `a` to `b` (no-op when that pair is already bound). */
    bindPair(a: LoadedSlide, b: LoadedSlide, anchor: LoadedSlide | null) {
      if (bound && bound[0] === a && bound[1] === b) return;
      bound = [a, b];
      [a.img, a.depth, b.img, b.depth].forEach((t, unit) => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, t);
      });
      const fa = frameSlide(a, anchor, planeAspect);
      const fb = frameSlide(b, anchor, planeAspect);
      gl.uniform1f(U.uFromAspect, a.aspect);
      gl.uniform1f(U.uToAspect, b.aspect);
      gl.uniform2f(U.uFromFocus, ...fa.center);
      gl.uniform2f(U.uToFocus, ...fb.center);
      gl.uniform1f(U.uFromZoom, fa.zoom);
      gl.uniform1f(U.uToZoom, fb.zoom);
    },

    draw(p: FrameParams) {
      gl.uniform2f(U.uScale, p.scale, p.scale);
      gl.uniform2f(U.uOffset, ...p.offset);
      gl.uniform1f(U.uProgress, p.progress);
      gl.uniform1f(U.uTime, p.time);
      gl.uniform1f(U.uReveal, p.reveal);
      gl.uniform1f(U.uParallax, p.parallax);
      gl.uniform1f(U.uBreath, p.breath);
      gl.uniform2f(U.uMouse, ...p.mouse);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },

    dispose() {
      textures.forEach((t) => gl.deleteTexture(t));
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
