export const MODEL_URLS = {
  body: "/models/man_comp-transformed.glb",
  skeleton: "/models/skeleton_comp-transformed.glb",
} as const;

const buffers = new Map<string, Promise<ArrayBuffer>>();

/**
 * One download per model, shared by the early prefetch (SkullHero, while the 3D engine chunk is still
 * downloading) and the GLTF loader. Before, the prefetch's response was thrown away and the loader fetched the
 * same file again. Kept after use, so coming back to the home page rebuilds the scene without a refetch
 * (the loader copies what it needs out of the buffer, so it's never detached).
 */
export function loadModelBuffer(url: string): Promise<ArrayBuffer> {
  let buffer = buffers.get(url);
  if (!buffer) {
    buffer = fetch(url).then((res) => {
      if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
      return res.arrayBuffer();
    });
    buffer.catch(() => buffers.delete(url)); // a failed download can be retried on the next mount
    buffers.set(url, buffer);
  }
  return buffer;
}
