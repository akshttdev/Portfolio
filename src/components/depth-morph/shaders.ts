// Shaders for the depth morph. The fragment shader does the cover framing, depth parallax and the
// depth-ordered dissolve between two photos.

export const VERT = `
attribute vec2 aPos;
uniform vec2 uScale, uOffset;
varying vec2 vUv;
void main() { vUv = aPos * .5 + .5; gl_Position = vec4(aPos * uScale + uOffset, 0., 1.); }`;

export const FRAG = `
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
