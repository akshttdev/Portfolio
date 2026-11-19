// The About page's music ring (in ring order): the drop of each favourite track, cut into a seamless, bar-exact loop.
// Made by scripts/mix/drops.py (see scripts/mix/README.md); covers from Apple Music (Diamonds is an ID with no
// artwork yet, so its cover is drawn by scripts/grunge.mjs).

export type Track = {
  id: string;
  title: string;
  artist: string;
  year: string;
  bpm: number;
  /** bars in the loop (the drop) */
  bars: number;
  /** clip length, s (the loop is [loopStart, duration]; set explicitly so no browser's MP3 padding gets looped) */
  duration: number;
  /** seconds of build-up before the loop point */
  loopStart: number;
  /** the official cover (ring thumbnail) */
  cover: string;
  /** the cover's largest text-free part, 4:5, for the big strip (see scripts/art/README.md) */
  art: string;
  src: string;
};

const t = (id: string, title: string, artist: string, year: string, bpm: number, bars: number, duration: number, loopStart = 0): Track => ({
  id, title, artist, year, bpm, bars, duration, loopStart,
  cover: `/images/music/covers/${id}.webp`,
  art: `/images/music/art/${id}.webp`,
  src: `/audio/drops/${id}.mp3`,
});

export const TRACKS: Track[] = [
  t("carry-you", "Carry You (Extended Mix)", "Martin Garrix, Third Party, Oaks & Declan J Donovan", "2024", 127.06, 16, 30.221837),
  t("gravity", "Gravity (Tomas Grey & Off Clouds Remix)", "Martin Garrix & Sem Vox feat. Jaimes", "2025", 128.0, 16, 29.998776),
  t("dramma", "Dramma", "R3HAB & ARTBAT", "2026", 127.98, 16, 30.004104),
  t("voodoo", "Voodoo", "Martin Garrix, R3HAB & Skytech", "2025", 130.0, 16, 33.23161, 3.692402),
  t("aurora", "Aurora", "Martin Garrix & Blinders", "2022", 128.0, 16, 30.00093),
  t("breach", "Breach (Walk Alone)", "Martin Garrix & Blinders", "2018", 128.0, 16, 30.0),
  t("byte", "Byte", "Martin Garrix & Brooks", "2017", 128.04, 16, 29.989365),
  t("game-over", "Game Over", "Martin Garrix & Loopers", "2018", 128.0, 16, 29.999977),
  t("mistaken", "Mistaken (Club Mix)", "Martin Garrix, Matisse & Sadko feat. Alex Aris", "2019", 128.0, 16, 30.000476),
  t("follow", "Follow", "Martin Garrix & Zedd", "2022", 126.99, 16, 30.237846),
  t("this-dream-of-you", "This Dream Of You", "Martin Garrix", "2026", 128.05, 16, 29.988503),
  t("mi-amor", "Mi Amor", "ARTBAT, 7 SKIES & Sadie Rose Van", "2026", 126.0, 16, 30.477211),
  t("limitless", "Limitless", "Martin Garrix & Mesto", "2022", 126.01, 16, 30.473197),
  t("breakaway", "Breakaway", "Martin Garrix & Mesto feat. WILHELM", "2024", 128.0, 16, 30.000227),
  t("empty", "Empty", "Martin Garrix, DubVision & Jaimes", "2024", 127.05, 16, 30.225057),
];

export const SETS = [
  { label: "Sunday", url: "https://soundcloud.com/akshat-872450192/sunday" },
  { label: "21.10.26", url: "https://soundcloud.com/akshat-872450192/21-10-26" },
  { label: "31.10.26", url: "https://soundcloud.com/akshat-872450192/31-10-26" },
];

export const AWAY_FROM_THE_MONITOR = [
  { label: "DJing", note: "Progressive & tech house" },
  { label: "Travel", note: "Whenever I can" },
  { label: "Guitar", note: "Playing" },
  { label: "Running", note: "Long distances" },
  { label: "Football", note: "Obsessing over it" },
];
