"""Builds the two beat-matched 16-bar loops (128 BPM) for the About page mix, plus waveform peaks.
usage: python3 -I make_clips.py <virus> <voodoo> <outdir> [voodoo_nudge_ms]
"""
import json, base64, subprocess, sys
import numpy as np

SR = 44100
BPM = 128.0
BARS = 16
LOOP = BARS * 4 * 60 / BPM  # 30.0 s
N = int(round(LOOP * SR))   # 1,323,000 samples
XF = int(0.010 * SR)        # 10 ms seam crossfade


def render(path, start, dur, tempo=1.0):
    """Decode [start, start+dur] of the original (stereo, float), optionally time-stretched (pitch kept)."""
    af = f"atrim=start={start:.6f}:end={start + dur:.6f},asetpts=PTS-STARTPTS"
    if tempo != 1.0:
        af += f",atempo={tempo:.8f}"
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-af", af, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


def seamless(x, head):
    """x holds `head` samples of pre-roll, then the loop, then >= XF samples more. Returns exactly N samples whose
    end flows into its start: the first XF samples are faded in from what follows the loop end."""
    loop = x[head:head + N].copy()
    tail = x[head + N:head + N + XF]
    w = np.linspace(0, 1, XF, dtype=np.float32)[:, None]
    loop[:XF] = loop[:XF] * w + tail * (1 - w)
    return loop


def kick_times(x):
    mono = x.mean(axis=1)
    F = np.fft.rfft(mono); f = np.fft.rfftfreq(len(mono), 1 / SR); F[(f < 30) | (f > 150)] = 0
    low = np.abs(np.fft.irfft(F, len(mono)))
    k = int(0.002 * SR); env = np.convolve(low, np.ones(k) / k, mode="same")
    beat = 60 / BPM; offs = []
    for i in range(1, BARS * 4 - 1):
        g = i * beat; a = int((g - 0.08) * SR); b = int((g + 0.08) * SR)
        offs.append((np.argmax(np.diff(env[a:b])) + a) / SR - g)
    return np.array(offs) * 1000


def peaks(x, per_sec=120):
    """3-band waveform (low / mid / high RMS), `per_sec` columns per second, as base64 uint8 strings."""
    mono = x.mean(axis=1)
    F = np.fft.rfft(mono); f = np.fft.rfftfreq(len(mono), 1 / SR)
    out = {}
    for name, lo, hi in [("low", 20, 200), ("mid", 200, 2500), ("high", 2500, 20000)]:
        G = F.copy(); G[(f < lo) | (f >= hi)] = 0
        y = np.fft.irfft(G, len(mono))
        hop = SR // per_sec
        n = len(y) // hop
        r = np.sqrt((y[:n * hop].reshape(n, hop) ** 2).mean(axis=1))
        r = r / (np.percentile(r, 99.5) + 1e-9)
        out[name] = base64.b64encode(np.clip(r * 255, 0, 255).astype(np.uint8).tobytes()).decode()
    return out


def main():
    virus, voodoo, outdir = sys.argv[1:4]
    nudge = float(sys.argv[4]) / 1000 if len(sys.argv) > 4 else 0.0
    # Deck 1, Virus (How About Now): 127.99 BPM; first kick of the first drop at 98.0333 s (kick tracker, kicks.py).
    # Both loops start 10 ms before their first kick, so the two decks' kicks line up.
    a_start = 98.0333 - 0.010
    pre = 0.5
    a = render(virus, a_start - pre, pre + LOOP + 0.1)
    A = seamless(a, int(round(pre * SR)))
    # Deck 2, Voodoo: 130.00 BPM; first kick of the first drop at 53.5599 s. Stretched to 128 BPM (atempo keeps
    # the pitch, like key lock), so 16 bars become exactly 30 s too; 10 ms in the loop = 10 ms * tempo here.
    tempo = BPM / 130.0
    b_start = 53.5599 - 0.010 * tempo + nudge
    b = render(voodoo, b_start - pre, pre + LOOP * tempo + 0.1, tempo)
    B = seamless(b, int(round(pre / tempo * SR)))
    ka, kb = kick_times(A), kick_times(B)
    print(f"Deck 1 kicks vs 128 grid: median {np.median(ka):+.1f} ms (IQR {np.percentile(ka,25):+.1f}..{np.percentile(ka,75):+.1f})")
    print(f"Deck 2 kicks vs 128 grid: median {np.median(kb):+.1f} ms (IQR {np.percentile(kb,25):+.1f}..{np.percentile(kb,75):+.1f})")
    print(f"=> deck 2 minus deck 1: {np.median(kb) - np.median(ka):+.1f} ms  (nudge used: {nudge*1000:+.1f} ms)")
    for name, x in [("virus", A), ("voodoo", B)]:
        pcm = (np.clip(x, -1, 1) * 32767).astype("<i2").tobytes()
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-",
                        "-c:a", "libmp3lame", "-b:a", "192k", f"{outdir}/{name}.mp3"], input=pcm, check=True)
    meta = {"bpm": BPM, "bars": BARS, "loopSeconds": LOOP, "peaksPerSecond": 120,
            "decks": {"virus": peaks(A), "voodoo": peaks(B)}}
    with open(f"{outdir}/peaks.json", "w") as fh:
        json.dump(meta, fh, separators=(",", ":"))
    print("wrote", outdir)


main()
