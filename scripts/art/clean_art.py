"""Cuts each cover's largest text-free 4:5 window (the big strip on the About page shows art, not names).

usage (from the repo root): python3 -I scripts/art/clean_art.py
  1. finds text with macOS Vision (scripts/art/textboxes.swift)
  2. adds the stylised titles Vision misses / drops its false hits (EXTRA, OVERRIDE, IGNORE_BELOW below)
  3. picks the largest 4:5 window that touches no text (nearest the centre among equals)
  4. crops it with sharp to public/images/music/art/<id>.webp (800x1000)
"""
import glob, json, os, subprocess

COVERS = "public/images/music/covers"
OUT = "public/images/music/art"
PAD = 0.02
ASPECT = 0.8  # the strip panel: half the screen wide, full height

# normalised [x, y, w, h], origin top-left
EXTRA = {"carry-you": [[0, 0, 1, 0.14]], "breakaway": [[0, 0, 1, 0.15]], "empty": [[0, 0, 1, 0.15]]}
OVERRIDE = {"byte": [[0, 0.33, 1, 0.2]]}  # the binary digits are the artwork; only the name band is text
IGNORE_BELOW = {"follow": 0.5}  # Vision reads the shirts' texture as text

files = sorted(glob.glob(f"{COVERS}/*.webp"))
raw = subprocess.run(["swift", "scripts/art/textboxes.swift", *files], capture_output=True, text=True, check=True).stdout
boxes = {k.removesuffix(".webp"): v for k, v in json.loads(raw).items()}

windows = {}
for id, bx in sorted(boxes.items()):
    if id in IGNORE_BELOW:
        bx = [b for b in bx if b[1] < IGNORE_BELOW[id]]
    bx = OVERRIDE.get(id, bx + EXTRA.get(id, []))
    bx = [[x - PAD, y - PAD, w + 2 * PAD, h + 2 * PAD] for x, y, w, h in bx]
    for hi in range(100, 29, -1):
        h = hi / 100
        w = h * ASPECT
        cands = [
            (abs(xi / 100 + w / 2 - 0.5) + abs(yi / 100 + h / 2 - 0.5), xi / 100, yi / 100)
            for xi in range(0, int(round((1 - w) * 100)) + 1)
            for yi in range(0, int(round((1 - h) * 100)) + 1)
            if all(xi / 100 + w <= a or a + bw <= xi / 100 or yi / 100 + h <= b or b + bh <= yi / 100 for a, b, bw, bh in bx)
        ]
        if cands:
            _, x, y = min(cands)
            windows[id] = [x, y, w, h]
            break
    print(f"{id:18} x{windows[id][0]:.2f} y{windows[id][1]:.2f} {windows[id][2]:.2f}x{windows[id][3]:.2f}")

os.makedirs(OUT, exist_ok=True)
crop = """
const sharp = require("sharp"); const w = JSON.parse(process.argv[1]);
(async () => { for (const [id, [x, y, cw, ch]] of Object.entries(w)) {
  const px = (v) => Math.round(v * 1000);
  await sharp(`%s/${id}.webp`).extract({ left: px(x), top: px(y), width: Math.min(px(cw), 1000 - px(x)), height: Math.min(px(ch), 1000 - px(y)) })
    .resize(800, 1000, { kernel: "lanczos3" }).webp({ quality: 80 }).toFile(`%s/${id}.webp`);
} })();""" % (COVERS, OUT)
subprocess.run(["node", "-e", crop, json.dumps(windows)], check=True)
print("wrote", len(windows), "to", OUT)
