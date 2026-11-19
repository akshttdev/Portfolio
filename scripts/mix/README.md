# Music: the drops

How `public/audio/drops/*.mp3` were made (the music ring, hidden for now, and Voodoo for the intro).
Needs `ffmpeg` and Python 3 with `numpy`. Run with `python3 -I` (keeps the script folder off Python's import path).

```
python3 -I scripts/mix/drops.py scripts/mix/tracks.json public/audio/drops [id ...]
```

`tracks.json` lists each track's file (relative to `~/Documents/Music`). For each one, `drops.py`:

1. fits the tempo over the whole track (where the kick onsets line up best, ~0.01 BPM)
2. finds the first drop: the beat where the sub-bass (30-80 Hz) jumps from a quiet build to 4 loud bars
3. locks the beat grid onto that drop's kick attacks, and tracks the kicks beat by beat for the exact start
4. cuts 16 bars (8 if the drop doesn't hold) from 10 ms before the first kick, bakes a 10 ms seam so the loop
   is gapless, encodes 128 kbps MP3, and writes `drops.json` (BPM, drop time, loop length) plus
   `drops-check.png` (sub-bass per beat for every track, the chosen loop in red) for a quick visual check

Per-track overrides in `tracks.json`: `bpm` (a hint, searched +-6 BPM), `drop` (seconds, skips the search: used for
Byte, whose file opens with a preview of its drop, and Breach, whose first drop thins out after 8 bars) and
`preBars` (bars of build-up kept before the loop point: Voodoo keeps 2, for the intro).

Then update `TRACKS` / `INTRO_TRACK` in `src/data/music.ts` (BPM, bars, duration, loopStart come from `drops.json`).
Covers are the 1000 px artwork from Apple Music, saved as `public/images/music/covers/<id>.webp`.

The older `analyze.py`, `kicks.py`, `make_clips.py` and `verify.py` built the earlier two-deck mix and are kept for
reference.
