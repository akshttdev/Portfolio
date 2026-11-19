// The site's music: the full Voodoo track, streamed by an <audio> element (it starts playing without waiting for
// the whole 2.7 MB). The intro starts it 2 bars before the drop and shows the site on the drop; after that it
// plays on and loops the whole song. The top bar's Sound on/off pauses and resumes it.
//
// (The hidden music ring on About uses its own player, lib/sound.ts, with short loops of each drop.)

export const SITE_SONG = {
  src: "/audio/voodoo.mp3",
  /** 2 bars (130 BPM) before the drop: where the intro starts it */
  introFrom: 49.868,
  /** first kick of the drop, s (measured, see scripts/mix) */
  drop: 53.56,
  bpm: 130,
};

type MusicState = { on: boolean };

const SERVER_STATE: MusicState = { on: false };
let state: MusicState = SERVER_STATE;
const listeners = new Set<() => void>();
const setState = (patch: Partial<MusicState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

/** For useSyncExternalStore */
export const musicStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => state,
  getServer: () => SERVER_STATE,
};

let el: HTMLAudioElement | null = null;

function audio() {
  if (!el) {
    el = new Audio();
    el.preload = "auto";
    el.loop = true;
    el.src = SITE_SONG.src;
    // Don't keep playing in a background tab
    document.addEventListener("visibilitychange", () => {
      if (!el || !state.on) return;
      if (document.hidden) el.pause();
      else void el.play().catch(() => {});
    });
  }
  return el;
}

const seek = (a: HTMLAudioElement, t: number) => {
  try {
    a.currentTime = t;
  } catch {
    /* not seekable yet */
  }
};

/** Start buffering from the intro point. Resolves once it can play there (or after `timeout` ms regardless). */
export function prepareIntro(timeout = 8000): Promise<void> {
  const a = audio();
  return new Promise((resolve) => {
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(done, timeout);
    const atIntro = () => {
      seek(a, SITE_SONG.introFrom);
      if (a.readyState >= 3) done();
      else a.addEventListener("canplay", done, { once: true });
    };
    if (a.readyState >= 1) atIntro();
    else a.addEventListener("loadedmetadata", atIntro, { once: true });
    a.addEventListener("error", done, { once: true });
  });
}

/**
 * Play from 2 bars before the drop. Call from a click (browsers only allow sound after one). Resolves with a
 * function returning the seconds left until the drop, or null if the browser wouldn't play.
 */
export function playIntro(): Promise<(() => number) | null> {
  const a = audio();
  if (Math.abs(a.currentTime - SITE_SONG.introFrom) > 0.25) seek(a, SITE_SONG.introFrom);
  setState({ on: true });
  return a.play().then(
    () => () => SITE_SONG.drop - a.currentTime,
    () => {
      setState({ on: false });
      return null;
    },
  );
}

/** Back to the start of the song (after entering muted, Sound on plays it from the beginning). */
export function rewind() {
  if (el) seek(el, 0);
}

export function toggleMusic() {
  const a = audio();
  if (state.on) {
    a.pause();
    setState({ on: false });
  } else {
    setState({ on: true });
    void a.play().catch(() => setState({ on: false }));
  }
}
