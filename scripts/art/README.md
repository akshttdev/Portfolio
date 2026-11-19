# Cover art without the names

The About page's music ring uses two images per track:

- `public/images/music/covers/<id>.webp`: the official 1000 px cover (Apple Music), for the small ring thumbnail
- `public/images/music/art/<id>.webp`: the cover's largest part with no text on it, 4:5, for the big strip

`python3 -I scripts/art/clean_art.py` (from the repo root, macOS) makes the second from the first: it finds text
with Apple's Vision framework (`textboxes.swift`), adds the stylised titles Vision misses, and crops the largest
4:5 window that avoids all of it. Covers whose title runs through the middle (Gravity, Mistaken) end up with a
smaller, more abstract crop.
