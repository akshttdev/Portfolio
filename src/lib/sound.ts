// One player for the whole site (it lives at module level, so it keeps playing across client-side navigation).
// Each track is a seamless loop of its drop; switching tracks waits for the next beat of the one playing and
// crossfades quickly, like cutting between two channels on a mixer.
//
// Browsers only let audio start from a click or key press, so enable() must be called from one. Until then
// play() just remembers the track (and the UI can show it as selected).

import type { Track } from "@/data/music";

export type SoundState = {
  /** the visitor turned sound on */
  enabled: boolean;
  /** the track that is playing, or will play once sound is on */
  trackId: string | null;
  /** a track is downloading/decoding */
  loading: boolean;
};

const SERVER_STATE: SoundState = { enabled: false, trackId: null, loading: false };
let state: SoundState = SERVER_STATE;
const listeners = new Set<() => void>();

function setState(patch: Partial<SoundState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

/** For useSyncExternalStore */
export const soundStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => state,
  getServer: () => SERVER_STATE,
};

const XFADE_IN = 0.12; // s, the new track's fade in (short: it starts on a beat)
const XFADE_OUT = 0.35; // s, the old one's fade out
const MASTER = 0.9;

type Voice = { track: Track; source: AudioBufferSourceNode; gain: GainNode; /** ctx time of buffer offset 0 */ zero: number };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let voice: Voice | null = null;
let wanted: Track | null = null;
let wantedFromStart = false;
const raw = new Map<string, Promise<ArrayBuffer>>();
const decoded = new Map<string, Promise<AudioBuffer>>();

function fetchRaw(src: string) {
  let p = raw.get(src);
  if (!p) {
    p = fetch(src).then((r) => {
      if (!r.ok) throw new Error(`${src}: ${r.status}`);
      return r.arrayBuffer();
    });
    p.catch(() => raw.delete(src)); // let a later call retry
    raw.set(src, p);
  }
  return p;
}

function decode(track: Track) {
  let p = decoded.get(track.src);
  if (!p) {
    const c = ctx!;
    // decodeAudioData detaches the buffer it is given, so hand it a copy (the raw one stays cached)
    p = fetchRaw(track.src).then((buf) => c.decodeAudioData(buf.slice(0)));
    p.catch(() => decoded.delete(track.src));
    decoded.set(track.src, p);
  }
  return p;
}

/** Start downloading a track (no decoding, no audio context needed). Returns when it's downloaded. */
export function prefetch(track: Track) {
  return fetchRaw(track.src);
}

function ensureContext() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    // Don't keep playing in a background tab
    document.addEventListener("visibilitychange", () => {
      if (!ctx || !state.enabled) return;
      if (document.hidden) void ctx.suspend();
      else void ctx.resume();
    });
  }
  return ctx;
}

/** Turn sound on. Call from a click/key handler. Starts the wanted track (or `track`). */
export function enable(track?: Track, opts: { fromStart?: boolean } = {}) {
  const c = ensureContext();
  void c.resume();
  master!.gain.cancelScheduledValues(c.currentTime);
  master!.gain.setTargetAtTime(MASTER, c.currentTime, 0.05);
  setState({ enabled: true });
  if (track) {
    wanted = track;
    wantedFromStart = !!opts.fromStart;
  }
  if (wanted) return play(wanted, { fromStart: wantedFromStart });
  return Promise.resolve(null);
}

export function disable() {
  setState({ enabled: false });
  if (!ctx || !master) return;
  const c = ctx;
  master.gain.cancelScheduledValues(c.currentTime);
  master.gain.setTargetAtTime(0, c.currentTime, 0.08);
  setTimeout(() => {
    if (!state.enabled) void c.suspend();
  }, 500);
}

export function toggle(fallback: Track) {
  if (state.enabled) disable();
  else void enable(wanted ?? fallback);
}

/**
 * Play `track` (its drop, or from the start of its build-up with fromStart). If something is playing, the new
 * track comes in on its next beat. Resolves to the audio-clock time of the new track's drop, or null if sound is
 * off or another track was asked for meanwhile.
 */
export async function play(track: Track, opts: { fromStart?: boolean } = {}): Promise<number | null> {
  wanted = track;
  wantedFromStart = !!opts.fromStart;
  if (!state.enabled || !ctx || !master) {
    setState({ trackId: track.id });
    return null;
  }
  if (voice?.track.id === track.id) {
    setState({ trackId: track.id, loading: false });
    return null;
  }
  setState({ trackId: track.id, loading: true });
  let buffer: AudioBuffer;
  try {
    buffer = await decode(track);
  } catch (e) {
    console.warn("[sound]", e);
    if (wanted === track) setState({ loading: false });
    return null;
  }
  if (wanted !== track || !state.enabled) return null;
  const c = ctx;

  const offset = opts.fromStart ? 0 : track.loopStart;
  let when = c.currentTime + 0.04;
  if (voice) {
    // next beat of the playing track (its clip starts on a beat, so beats fall on zero + k * beat)
    const beat = 60 / voice.track.bpm;
    when = voice.zero + Math.ceil((when - voice.zero) / beat) * beat;
  }

  const source = c.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.loopStart = track.loopStart;
  source.loopEnd = Math.min(track.duration, buffer.duration);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(1, when + XFADE_IN);
  source.connect(gain).connect(master);
  source.start(when, offset);

  if (voice) {
    const old = voice;
    old.gain.gain.cancelScheduledValues(when);
    old.gain.gain.setValueAtTime(1, when);
    old.gain.gain.linearRampToValueAtTime(0, when + XFADE_OUT);
    old.source.stop(when + XFADE_OUT + 0.05);
    old.source.onended = () => {
      old.source.disconnect();
      old.gain.disconnect();
    };
  }
  voice = { track, source, gain, zero: when - offset };
  setState({ loading: false });
  return when + (track.loopStart - offset);
}

/** Where the playing track is: seconds into its clip, and 0..1 through the current beat. Null when silent. */
export function position(): { trackId: string; seconds: number; beatPhase: number } | null {
  if (!ctx || !voice || !state.enabled || ctx.state !== "running") return null;
  const t = ctx.currentTime - voice.zero;
  if (t < 0) return null;
  const { loopStart, duration, bpm } = voice.track;
  const loopLen = duration - loopStart;
  const seconds = t < duration ? t : loopStart + ((t - loopStart) % loopLen);
  const beat = 60 / bpm;
  return { trackId: voice.track.id, seconds, beatPhase: (t / beat) % 1 };
}

/** The audio clock, for scheduling visuals against it (e.g. the intro's drop). */
export function audioTime() {
  return ctx?.currentTime ?? 0;
}
