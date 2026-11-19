"""Beat analysis for DJ-style looping: tempo (fine), beat phase, and a per-bar energy map to find the drops.
usage: python3 -I analyze.py <audio file> [<audio file> ...]
"""
import subprocess, sys
import numpy as np

SR = 44100
HOP = 441  # 10 ms -> 100 frames/s
WIN = 2048


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def spectrogram(x):
    n = 1 + (len(x) - WIN) // HOP
    idx = np.arange(WIN)[None, :] + HOP * np.arange(n)[:, None]
    frames = x[idx] * np.hanning(WIN)[None, :]
    return np.abs(np.fft.rfft(frames, axis=1))  # (n, WIN/2+1)


def band(S, lo, hi):
    f = np.fft.rfftfreq(WIN, 1 / SR)
    return S[:, (f >= lo) & (f < hi)]


def flux(B):
    d = np.diff(np.log1p(B * 10), axis=0)
    o = np.maximum(d, 0).sum(axis=1)
    o = np.concatenate([[0], o])
    o -= np.convolve(o, np.ones(50) / 50, mode="same")  # remove slow trend
    return np.maximum(o, 0)


def sample_at(env, t_frames):
    i = np.floor(t_frames).astype(int)
    fr = t_frames - i
    ok = (i >= 0) & (i + 1 < len(env))
    out = np.zeros_like(t_frames)
    out[ok] = env[i[ok]] * (1 - fr[ok]) + env[i[ok] + 1] * fr[ok]
    return out


def tempo_and_phase(env):
    fps = SR / HOP
    best = (0, 0, 0)
    # coarse: 110..140 BPM (house / progressive), then fine
    for bpm in np.arange(110, 140.0001, 0.05):
        period = fps * 60 / bpm
        beats = np.arange(0, len(env) - 2, period)
        for ph in np.linspace(0, period, 24, endpoint=False):
            s = sample_at(env, beats + ph).mean()
            if s > best[0]:
                best = (s, bpm, ph)
    _, bpm0, _ = best
    best = (0, 0, 0)
    for bpm in np.arange(bpm0 - 0.1, bpm0 + 0.1, 0.002):
        period = fps * 60 / bpm
        beats = np.arange(0, len(env) - 2, period)
        for ph in np.linspace(0, period, 96, endpoint=False):
            s = sample_at(env, beats + ph).mean()
            if s > best[0]:
                best = (s, bpm, ph)
    return best[1], best[2] / fps  # bpm, first beat (s)


def main():
    for path in sys.argv[1:]:
        x = decode(path)
        S = spectrogram(x)
        kick = flux(band(S, 30, 150))
        allb = flux(band(S, 30, 16000))
        bpm, t0 = tempo_and_phase(kick + 0.3 * allb)
        beat = 60 / bpm
        # per-bar low-band energy (kick+bass) and full energy, bars counted from t0 (phase unknown mod 4)
        low = (band(S, 30, 150) ** 2).sum(axis=1)
        full = (S ** 2).sum(axis=1)
        nbars = int((len(x) / SR - t0) / (4 * beat))
        print(f"\n== {path.split('/')[-1]}\n   duration {len(x)/SR:.2f}s  tempo {bpm:.3f} BPM  first beat {t0*1000:.1f} ms  beat {beat*1000:.2f} ms")
        for k in range(4):  # which beat inside the bar is the downbeat: test each offset
            pass
        rows = []
        for b in range(nbars):
            a = int((t0 + b * 4 * beat) * SR / HOP)
            e = int((t0 + (b + 1) * 4 * beat) * SR / HOP)
            rows.append((b, t0 + b * 4 * beat, low[a:e].mean(), full[a:e].mean()))
        lo = np.array([r[2] for r in rows]); fu = np.array([r[3] for r in rows])
        lo /= lo.max(); fu /= fu.max()
        line = "".join(" .:-=+*#%@"[min(9, int(v * 9.99))] for v in lo)
        print("   bass per bar:", line)
        line = "".join(" .:-=+*#%@"[min(9, int(v * 9.99))] for v in fu)
        print("   full per bar:", line)
        # biggest bass jumps = drops (bar index, time)
        jumps = sorted(((lo[b] - lo[b - 1], b) for b in range(1, len(lo))), reverse=True)[:5]
        print("   biggest bass jumps (bar, time s, jump):", [(b, round(rows[b][1], 3), round(j, 2)) for j, b in jumps])


main()
