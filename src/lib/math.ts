export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);

export const easeOutCubic = (x: number) => 1 - (1 - clamp(x)) ** 3;

/** Frame-rate independent smoothing factor: `f` is the fraction to move per frame at 60 fps. */
export const damp = (f: number, dt: number) => 1 - (1 - f) ** (60 * dt);
