"""Finds the first drop of each track and cuts it into a seamless, bar-exact loop for the About page music ring.

usage: python3 -I drops.py <tracks.json> <outdir> [id ...]
tracks.json: {"root": "~/Documents/Music", "tracks": [{"id": "voodoo", "file": "relative/to/root.mp3", "bpm": 130,
              "drop": 53.56, "preBars": 0}, ...]}
  bpm   optional hint (the search is limited to +-6 BPM around it); otherwise 110-150 is searched
  drop  optional hint in seconds, to override the automatic drop search
  preBars  bars of build-up kept before the drop (the loop then starts after them; see loopStart in the output)

How a drop is found: per beat, the bass (40-150 Hz) energy. The drop is the beat where the next 8 bars are loud in the
bass and the 4 bars before are quiet (the break/build), i.e. the largest jump. Then the kick punches are tracked beat by
beat from there and a straight line is fitted through them (exact tempo + time of the first kick), like kicks.py.
Writes <outdir>/<id>.mp3 (128 kbps), <outdir>/drops.json and <outdir>/drops-check.png (bass per beat, chosen loop red).
"""
import json, os, subprocess, sys
import numpy as np

SR = 44100
ASR = 11025  # analysis rate


def decode(path, sr, ch=1, start=None, dur=None):
    af = []
    if start is not None:
        af = ["-af", f"atrim=start={max(start, 0):.6f}:end={start + dur:.6f},asetpts=PTS-STARTPTS"]
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, *af, "-ac", str(ch), "-ar", str(sr), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32)
    return x.reshape(-1, ch).copy() if ch > 1 else x.copy()


def band(x, sr, lo, hi):
    F = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / sr); F[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(F, len(x))


def tempo_and_phase(x, sr, lo_bpm, hi_bpm):
    """Beat period (s) and first beat time from the kick-band onset envelope. The tempo is the frequency where the
    onsets (and their 2nd/4th harmonics) line up best over the whole track, so it is precise to ~0.01 BPM."""
    hop = 64
    low = band(x, sr, 40, 200)
    n = len(low) // hop
    env = np.sqrt((low[:n * hop].reshape(n, hop) ** 2).mean(axis=1))
    on = np.maximum(np.diff(env, prepend=env[0]), 0)
    on = on - on.mean()
    fr = sr / hop
    tt = np.arange(len(on)) / fr

    def strength(bpms):
        out = np.zeros(len(bpms))
        for h, w in ((1, 1.0), (2, 0.5), (4, 0.25)):
            for i0 in range(0, len(bpms), 64):
                f = bpms[i0:i0 + 64, None] / 60 * h
                out[i0:i0 + 64] += w * np.abs(np.exp(-2j * np.pi * f * tt[None, :]) @ on)
        return out

    coarse = np.arange(lo_bpm, hi_bpm, 0.05)
    c = strength(coarse)
    b0 = coarse[np.argmax(c)]
    fine = np.arange(b0 - 0.06, b0 + 0.06, 0.002)
    bpm = fine[np.argmax(strength(fine))]
    period = 60 / bpm
    z = np.exp(-2j * np.pi * (bpm / 60) * tt) @ on
    # onsets peak where the phase of the fundamental is 0: t = -arg(z)/(2 pi f) mod period
    t_first = (-np.angle(z) / (2 * np.pi) * period) % period
    return period, t_first


def kick_phase(path, around, period, nbeats=32):
    """Offset (s, within +-half a beat) that puts the grid on the kick attacks in the nbeats after `around`.
    The whole-track phase is only roughly right (it follows the centre of the kick+bass energy, not the attack)."""
    a = around - period
    x = decode(path, SR, 1, a, (nbeats + 2) * period)
    y = band(x, SR, 40, 200)
    k = int(0.001 * SR)
    env = np.sqrt(np.convolve(y * y, np.ones(k) / k, mode="same"))
    att = np.maximum(np.diff(env, prepend=env[0]), 0)
    att = np.convolve(att, np.ones(k) / k, mode="same")
    offs = np.arange(-period / 2, period / 2, 0.001)
    best, best_d = -1, 0.0
    for d in offs:
        idx = ((around + d - a + np.arange(nbeats) * period) * SR).astype(int)
        idx = idx[(idx >= 0) & (idx < len(att))]
        v = att[idx].sum()
        if v > best:
            best, best_d = v, d
    return best_d


def per_beat(x, sr, beats, lo, hi):
    y = band(x, sr, lo, hi)
    out = []
    for a, b in zip(beats[:-1], beats[1:]):
        s = y[int(a * sr):int(b * sr)]
        out.append(np.sqrt((s ** 2).mean()) if len(s) else 0.0)
    return np.array(out)


def find_drop(bass, after=16, before=16):
    """Index of the beat with the biggest bass jump: loud for `after` beats, quiet for `before` beats.
    Only beats on the same position in the bar as a phrase start are considered (multiples of 4 from any offset)."""
    n = len(bass)
    ref = np.percentile(bass, 90) + 1e-9
    b = bass / ref
    best, best_j = -1e9, None
    limit = int(n * 0.8)
    for j in range(before, min(limit, n - after)):
        post = b[j:j + after]
        pre = b[j - before:j]
        # the drop's first bars must all be loud, so use a low percentile of `post`, and the loudest bit of the build
        score = np.percentile(post, 25) - np.percentile(pre, 75)
        # ...and on the exact beat where it jumps: those windows score the same a few beats either side
        score += 0.5 * (b[j:j + 4].min() - b[j - 2:j].max())
        if score > best:
            best, best_j = score, j
    return best_j, best


def track_kicks(path, guess, bpm, nbeats):
    """kicks.py: kick attacks (70-200 Hz) beat by beat from `guess`, then a least-squares line."""
    a = guess - 1.0
    x = decode(path, SR, 1, a, nbeats * 60 / bpm + 2.0)
    y = band(x, SR, 70, 200)
    k = int(0.001 * SR)
    env = np.sqrt(np.convolve(y * y, np.ones(k) / k, mode="same"))
    d = np.diff(env)
    beat = 60 / bpm
    times = []
    t = guess
    for _ in range(nbeats):
        lo = int((t - a - 0.035) * SR); hi = int((t - a + 0.035) * SR)
        if hi >= len(d):
            break
        j = np.argmax(d[lo:hi]) + lo
        times.append(a + j / SR)
        t = times[-1] + beat
    times = np.array(times)
    kk = np.arange(len(times))
    period, t0 = np.polyfit(kk, times, 1)
    res = (times - (t0 + kk * period)) * 1000
    return t0, 60 / period, res


def seamless(x, head, N, xf):
    loop = x[head:head + N].copy()
    tail = x[head + N:head + N + xf]
    w = np.linspace(0, 1, xf, dtype=np.float32)[:, None]
    loop[:xf] = loop[:xf] * w + tail * (1 - w)
    return loop


def strip_png(rows, path):
    """rows: list of (bass_per_beat normalised, (lo, hi) beat range of the loop). One 6 px row per track."""
    W = max(len(r[0]) for r in rows); H = 6 * len(rows) + 2 * len(rows)
    img = np.zeros((H, W, 3), np.uint8)
    for i, (b, (lo, hi)) in enumerate(rows):
        y0 = i * 8
        for j, v in enumerate(b):
            c = int(np.clip(v, 0, 1) * 255)
            col = (c, c, c) if not (lo <= j < hi) else (c, int(c * 0.15), int(c * 0.1) )
            img[y0:y0 + 6, j] = col
            if lo <= j < hi and c < 40:
                img[y0:y0 + 6, j] = (60, 0, 0)
    img = np.repeat(np.repeat(img, 2, axis=1), 2, axis=0)
    ppm = f"P6 {img.shape[1]} {img.shape[0]} 255\n".encode() + img.tobytes()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "image2pipe", "-c:v", "ppm", "-i", "-", path], input=ppm, check=True)


def main():
    cfg = json.load(open(sys.argv[1]))
    root, tracks = os.path.expanduser(cfg["root"]), cfg["tracks"]
    outdir = sys.argv[2]
    only = set(sys.argv[3:])
    results, rows = {}, []
    try:
        results = json.load(open(f"{outdir}/drops.json"))
    except FileNotFoundError:
        pass
    for t in tracks:
        if only and t["id"] not in only:
            continue
        path = os.path.join(root, t["file"])
        x = decode(path, ASR)
        hint = t.get("bpm")
        lo_bpm, hi_bpm = (hint - 6, hint + 6) if hint else (110, 150)
        period, first = tempo_and_phase(x, ASR, lo_bpm, hi_bpm)
        bpm0 = 60 / period
        beats = np.arange(first, len(x) / ASR, period)
        # sub-bass: builds often keep their kicks, rarely the sub
        bass = per_beat(x, ASR, beats, 30, 80)
        if t.get("drop") is not None:
            j0 = int(round((t["drop"] - first) / period))
        else:
            j0, _ = find_drop(bass)
        # put the grid on the kicks of that drop (windows start 20 ms early so a kick counts for its own beat), again
        first += kick_phase(path, beats[j0], period)
        beats = np.arange(first % period, len(x) / ASR, period)
        bass = per_beat(x, ASR, np.maximum(beats - 0.020, 0), 30, 80)
        if t.get("drop") is not None:
            j = int(round((t["drop"] - beats[0]) / period)); score = float("nan")
        else:
            j, score = find_drop(bass)
        guess = beats[j]
        t0, bpm, res = track_kicks(path, guess, bpm0, 64)
        # Kick tracking is only trusted if the kicks really sit on a straight line
        med = float(np.median(np.abs(res)))
        if med > 6:
            t0, bpm = guess, bpm0
        # 16 bars if the drop holds for 16 bars, else 8
        nb = 64
        ref = np.percentile(bass, 90) + 1e-9
        first_half = bass[j:j + 32].mean() / ref
        second_half = bass[j + 32:j + 64].mean() / ref if j + 64 <= len(bass) else 0
        if second_half < 0.6 * first_half:
            nb = 32
        pre_beats = 4 * t.get("preBars", 0)
        beat = 60 / bpm
        L = (nb + pre_beats) * beat
        N = int(round(L * SR))
        xf = int(0.010 * SR)
        start = t0 - pre_beats * beat - 0.010
        pad = 0.5
        raw = decode(path, SR, 2, start - pad, pad + L + 0.1)
        head = int(round(pad * SR)) if start - pad >= 0 else int(round(start * SR))
        if pre_beats:
            # A loop with an intro: the seam goes back to the drop, not to the start of the build
            body = raw[head:head + N].copy()
            loop_start = int(round(pre_beats * beat * SR))
            tail = raw[head + N:head + N + xf]
            w = np.linspace(0, 1, xf, dtype=np.float32)[:, None]
            body[loop_start:loop_start + xf] = body[loop_start:loop_start + xf] * w + tail * (1 - w)
            clip = body
        else:
            clip = seamless(raw, head, N, xf)
        pcm = (np.clip(clip, -1, 1) * 32767).astype("<i2").tobytes()
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-",
                        "-c:a", "libmp3lame", "-b:a", "128k", f"{outdir}/{t['id']}.mp3"], input=pcm, check=True)
        results[t["id"]] = {
            "bpm": round(bpm, 3), "drop": round(float(t0), 4), "bars": nb // 4, "preBars": t.get("preBars", 0),
            "loopStart": round(pre_beats * beat, 6), "duration": round(N / SR, 6), "samples": N,
            "kickResidualMs": round(med, 2), "score": None if score != score else round(float(score), 3),
            "trackSeconds": round(len(x) / ASR, 1),
        }
        print(f"{t['id']:>12}: {bpm:7.3f} BPM  drop {t0:7.3f}s ({int(t0 // 60)}:{t0 % 60:05.2f})  {nb // 4} bars"
              f"  kicks |{med:.1f}| ms  score {score:.2f}", flush=True)
        rows.append((bass / ref, (j - pre_beats, j + nb)))
    with open(f"{outdir}/drops.json", "w") as fh:
        json.dump(results, fh, indent=1)
    if rows:
        strip_png(rows, f"{outdir}/drops-check.png")


main()
