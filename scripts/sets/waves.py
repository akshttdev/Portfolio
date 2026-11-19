"""Detailed 3-band waveform of a DJ set, for the deck view in "On the decks" (the rekordbox-style wave).

usage: python3 -I scripts/sets/waves.py <audio file> <set id>      e.g.  ... ~/Music/31.10.26.mp3 31-10-26
writes public/sets/<set id>.bin: 50 points per second, 3 bytes each (low, mid, high peak level, 0..255)

Bands: low < 200 Hz (kicks, bass), mid 200-2000 Hz, high > 2000 Hz. Each point is the band's peak in that 20 ms.
The set id is the `id` in src/data/sets.ts. Needs ffmpeg and numpy. Only this small file goes on the site, not the audio.
"""
import subprocess, sys
import numpy as np

SR = 11000
PER_SEC = 50
HOP = SR // PER_SEC

path, set_id = sys.argv[1], sys.argv[2]
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                     capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32)
n = len(x) // HOP
x = x[:n * HOP]
F = np.fft.rfft(x)
f = np.fft.rfftfreq(len(x), 1 / SR)
out = np.zeros((n, 3), np.uint8)
# how tall each band may get (the lows are the body of the wave, like on a deck)
for b, (lo, hi, weight) in enumerate([(20, 200, 1.0), (200, 2000, 0.62), (2000, SR, 0.34)]):
    G = F.copy()
    G[(f < lo) | (f >= hi)] = 0
    env = np.abs(np.fft.irfft(G, len(x))).reshape(n, HOP).max(axis=1)
    env = env / (np.percentile(env, 99.9) + 1e-9)
    out[:, b] = np.clip(env * weight * 255, 0, 255).astype(np.uint8)
open(f"public/sets/{set_id}.bin", "wb").write(out.tobytes())
print(f"public/sets/{set_id}.bin: {n / PER_SEC:.1f} s, {out.nbytes / 1024:.0f} KB")
