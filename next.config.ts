import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF is typically ~20-30% smaller than WebP for photos; browsers without AVIF still get WebP.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
