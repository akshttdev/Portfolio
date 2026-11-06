import type { DepthSlide } from "@/components/depth-morph/config";

// Each photo needs a matching depth map (white = near), same framing.
// Optional per slide: focus/zoom to adjust the crop, or face + anchor to auto-align faces across slides
// (see DepthSlide in components/depth-morph/config.ts). Measured faces, if needed again:
//   home   { x: 0.585, y: 0.595, h: 0.145 }   studio { x: 0.39, y: 0.395, h: 0.2 }   kurta { x: 0.485, y: 0.593, h: 0.086 }
//   apartment { x: 0.565, y: 0.53, h: 0.15 }
export const aboutSlides: DepthSlide[] = [
  { image: "/images/about/fishing.webp", depth: "/images/about/fishing-depth.webp", label: "First catch", focus: [0.45, 0.36] },
  { image: "/images/about/apartment.webp", depth: "/images/about/apartment-depth.webp", label: "Off hours", focus: [0.56, 0.5] },
  { image: "/images/about/kurta.webp", depth: "/images/about/kurta-depth.webp", label: "Nights out", focus: [0.5, 0.58] },
];

// Other photos, still in /public/images/about. Swap in by replacing entries above
// (each photo also has a lighter .webp next to the .jpg; prefer the .webp):
// studio-wide = studio.jpg with AI-extended background (LaMa) so the face is smaller and centred:
// { image: "/images/about/studio-wide.webp", depth: "/images/about/studio-wide-depth.webp", label: "Digital Product School" },
// { image: "/images/about/apartment-lean.webp", depth: "/images/about/apartment-lean-depth.webp", label: "Off hours", focus: [0.44, 0.5] },
// { image: "/images/about/home.jpg", depth: "/images/about/home-depth.webp", label: "Off hours" },
// { image: "/images/about/flowers.jpg", depth: "/images/about/flowers-depth.webp", label: "Flower show" },
// Card versions (whole photo over a blurred copy of itself): fishing-card.jpg, flowers-card.jpg (+ -depth.webp)
// { image: "/images/about/car.jpg", depth: "/images/about/car-depth.webp", label: "Weekends", face: { x: 0.585, y: 0.425, h: 0.1 } },
// { image: "/images/about/portrait.jpg", depth: "/images/about/portrait-depth.webp", label: "Munich", face: { x: 0.51, y: 0.34, h: 0.195 } },
