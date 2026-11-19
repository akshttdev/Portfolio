// Grades images into the site's look: crushed blacks, blood red (or bone-white mono with red shadows), film grain
// and a vignette.
// usage: node scripts/grunge.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const ROOT = new URL("../public/", import.meta.url).pathname;

// gradient maps: [position 0..1, [r, g, b]]
const MAPS = {
  red: [
    [0, [0, 0, 0]],
    [0.38, [70, 4, 3]],
    [0.68, [225, 37, 27]],
    [1, [246, 236, 228]],
  ],
  mono: [
    [0, [0, 0, 0]],
    [0.3, [38, 6, 5]],
    [0.7, [176, 168, 162]],
    [1, [244, 241, 236]],
  ],
};

function lut(stops) {
  const out = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let k = 0;
    while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
    const [p0, c0] = stops[k];
    const [p1, c1] = stops[k + 1];
    const f = Math.min(1, Math.max(0, (t - p0) / (p1 - p0)));
    for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.round(c0[c] + (c1[c] - c0[c]) * f);
  }
  return out;
}

// small deterministic PRNG, so re-running the script gives the same grain
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

async function grade(input, output, map, { max = 1400, grain = 16, seed = 1, trim = false } = {}) {
  // (trim: cut off a plain photo frame, e.g. a white border)
  const src = trim ? await sharp(input).rotate().trim({ threshold: 60 }).toBuffer() : input;
  const { data, info } = await sharp(src)
    .rotate()
    .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
    .greyscale()
    .normalise({ lower: 2, upper: 98 })
    .gamma(1.15)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const L = lut(MAPS[map]);
  const out = Buffer.alloc(w * h * 3);
  const rand = rng(seed);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      // vignette: darken towards the corners
      const dx = x / w - 0.5;
      const dy = y / h - 0.5;
      const v = 1 - Math.min(1, (dx * dx + dy * dy) * 1.5);
      const n = (rand() - 0.5) * grain;
      const g = Math.max(0, Math.min(255, Math.round(data[i] * (0.55 + 0.45 * v) + n)));
      out[i * 3] = L[g * 3];
      out[i * 3 + 1] = L[g * 3 + 1];
      out[i * 3 + 2] = L[g * 3 + 2];
    }
  }
  await sharp(out, { raw: { width: w, height: h, channels: 3 } }).webp({ quality: 78 }).toFile(output);
  console.log("wrote", output.replace(ROOT, "public/"), `${w}x${h}`);
}

const PROJECTS = [
  ["synapse", "1.jpg", "red"],
  ["cal", "25.jpeg", "mono"],
  ["torch", "22.jpeg", "red"],
  ["knot", "23.jpeg", "mono"],
  ["burnout", "24.jpg", "mono", { trim: true }],
  ["agronest", "17.jpg", "red"],
  ["rps-robot", "21.jpg", "mono", { trim: true }],
];

mkdirSync(`${ROOT}images/projects/grunge`, { recursive: true });
for (const [i, [id, file, map, opts]] of PROJECTS.entries()) {
  await grade(`${ROOT}images/projects/${file}`, `${ROOT}images/projects/grunge/${id}.webp`, map, { seed: i + 1, ...opts });
}
