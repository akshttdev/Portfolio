import type { FrameSequence } from "@/components/scroll-sequence/frames";

// The walk-up-and-grab-the-camera clip (2.1 s at 30 fps), upscaled and graded like the photos.
// lg/ = full 4:3 frames (1600x1200), sm/ = 720x1080 portrait crops that follow the face, for phones.
export const aboutClip: FrameSequence = { dir: "/images/about/clip", count: 63, fps: 30 };
