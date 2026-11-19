// Plays the DJ sets through SoundCloud's own embed player (the Widget API), kept hidden: the On the decks rows are
// the interface. One player for all the sets; SoundCloud streams the audio, nothing is hosted here.
// The script and player load only when the section comes near (warmUp), not on every visit.
//
// Browsers only start audio from a click: play/pause are called straight from the click handler. If a browser
// still refuses (Safari can, for players inside an iframe), `blocked` is set and the row points to SoundCloud.

type SCWidget = {
  bind(event: string, cb: (e?: { currentPosition?: number }) => void): void;
  play(): void;
  pause(): void;
  seekTo(ms: number): void;
  load(url: string, options: Record<string, unknown>): void;
};
type SCApi = { Widget: ((el: HTMLIFrameElement) => SCWidget) & { Events: Record<string, string> } };

export type DeckState = {
  /** the set loaded in the player */
  url: string | null;
  playing: boolean;
  /** waiting for SoundCloud */
  loading: boolean;
  /** the browser wouldn't start it */
  blocked: boolean;
};

const SERVER_STATE: DeckState = { url: null, playing: false, loading: false, blocked: false };
let state: DeckState = SERVER_STATE;
const listeners = new Set<() => void>();
const setState = (patch: Partial<DeckState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

/** For useSyncExternalStore (play/pause/track changes only; the position is read every frame with positionMs) */
export const deckStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => state,
  getServer: () => SERVER_STATE,
};

const OPTIONS = {
  auto_play: false,
  buying: false,
  sharing: false,
  download: false,
  show_artwork: false,
  show_comments: false,
  show_playcount: false,
  show_user: false,
  hide_related: true,
  visual: false,
};
const query = (o: Record<string, unknown>) => Object.entries(o).map(([k, v]) => `${k}=${v}`).join("&");

// the position, from SoundCloud's progress events, run forward on the clock in between (they come ~4x a second)
let pos = 0;
let posAt = 0;
let pendingSeek: number | null = null;
let guardUntil = 0;
let lastSeekAt = 0;

/** Where the loaded set is, ms */
export function positionMs() {
  return state.playing ? pos + (performance.now() - posAt) : pos;
}

let apiPromise: Promise<SCApi> | null = null;
function loadApi(): Promise<SCApi> {
  apiPromise ??= new Promise<SCApi>((resolve, reject) => {
    const w = window as unknown as { SC?: SCApi };
    if (w.SC) return resolve(w.SC);
    const s = document.createElement("script");
    s.src = "https://w.soundcloud.com/player/api.js";
    s.async = true;
    s.onload = () => (w.SC ? resolve(w.SC) : reject(new Error("SoundCloud widget API missing")));
    s.onerror = () => {
      apiPromise = null;
      reject(new Error("SoundCloud widget API failed to load"));
    };
    document.head.appendChild(s);
  });
  return apiPromise;
}

let widget: SCWidget | null = null;
let loadedUrl: string | null = null;
let ready: Promise<SCWidget> | null = null;

function getWidget(initialUrl: string): Promise<SCWidget> {
  ready ??= loadApi().then(
    (SC) =>
      new Promise<SCWidget>((resolve) => {
        const iframe = document.createElement("iframe");
        iframe.allow = "autoplay; encrypted-media";
        iframe.title = "SoundCloud player";
        iframe.tabIndex = -1;
        iframe.setAttribute("aria-hidden", "true");
        Object.assign(iframe.style, {
          position: "fixed",
          left: "-10px",
          bottom: "0",
          width: "1px",
          height: "1px",
          border: "0",
          opacity: "0",
          pointerEvents: "none",
        });
        iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(initialUrl)}&${query(OPTIONS)}`;
        document.body.appendChild(iframe);
        loadedUrl = initialUrl;
        const w = SC.Widget(iframe);
        const E = SC.Widget.Events;
        w.bind(E.READY, () => {
          widget = w;
          resolve(w);
        });
        w.bind(E.PLAY, () => {
          posAt = performance.now();
          setState({ playing: true, loading: false, blocked: false });
          if (pendingSeek != null) {
            w.seekTo(pendingSeek);
            lastSeekAt = performance.now();
            pos = pendingSeek;
          }
        });
        w.bind(E.PAUSE, () => {
          pos = positionMs();
          posAt = performance.now();
          setState({ playing: false });
        });
        w.bind(E.FINISH, () => {
          pos = 0;
          setState({ playing: false });
        });
        w.bind(E.PLAY_PROGRESS, (e) => {
          if (e?.currentPosition == null) return;
          // just after a seek the player still reports where it was: ignore that
          if (performance.now() - lastUserSeekAt < 700) return;
          // Starting a new set from a chosen point: the player reports the seek as done, then the stream starts
          // from 0:00 anyway. So for the first seconds, whenever it is behind the chosen point, seek again
          // (not more than once every 800 ms: each seek restarts its buffering).
          if (pendingSeek != null) {
            if (performance.now() > guardUntil) pendingSeek = null;
            else if (e.currentPosition < pendingSeek - 5000) {
              if (performance.now() - lastSeekAt > 800) {
                lastSeekAt = performance.now();
                w.seekTo(pendingSeek);
              }
              return;
            }
          }
          pos = e.currentPosition;
          posAt = performance.now();
        });
      }),
  );
  return ready;
}

/** Load the player in the background (when the section is near), so a click can start a set at once. */
export function warmUp(url: string) {
  void getWidget(url).catch(() => {});
}

/** Play `url` (from `startMs` if given), or pause/resume it if it's the one loaded. Call from a click. */
export function toggleSet(url: string, startMs?: number) {
  if (widget && state.url === url) {
    if (startMs != null) seek(startMs);
    if (state.playing && startMs == null) widget.pause();
    else widget.play();
    return;
  }
  pos = startMs ?? 0;
  posAt = performance.now();
  pendingSeek = startMs ?? null;
  guardUntil = performance.now() + 12000;
  setState({ url, playing: false, loading: true, blocked: false });

  const start = (w: SCWidget) => {
    if (loadedUrl === url) w.play();
    else {
      loadedUrl = url;
      w.load(url, {
        ...OPTIONS,
        auto_play: true,
        // the new set is in: go to the chosen point
        callback: () => {
          if (pendingSeek == null) return;
          w.seekTo(pendingSeek);
          lastSeekAt = performance.now();
        },
      });
    }
  };
  if (widget) start(widget); // still inside the click
  else void getWidget(url).then(start, () => setState({ loading: false, blocked: true }));

  // nothing playing after a while: the browser blocked it (or SoundCloud is unreachable)
  setTimeout(() => {
    if (state.url === url && state.loading) setState({ loading: false, blocked: true });
  }, 6000);
}

let seekTimer: ReturnType<typeof setTimeout> | null = null;
let lastUserSeekAt = -1e9;

/**
 * Go to `ms`. The position changes at once (so a drag on the waveform follows the hand); the player itself is told
 * at most every 150 ms, since each seek restarts its buffering.
 */
export function seek(ms: number) {
  pendingSeek = null;
  pos = Math.max(0, ms);
  posAt = performance.now();
  lastUserSeekAt = posAt;
  if (seekTimer) return;
  seekTimer = setTimeout(() => {
    seekTimer = null;
    widget?.seekTo(pos);
    posAt = performance.now();
    lastUserSeekAt = posAt;
  }, 150);
}

export function pauseAll() {
  if (state.playing) widget?.pause();
}
