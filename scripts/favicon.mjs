// The favicon is a crop of the site's own red skull hero: one red head glowing on black, darkened at the edges.
// usage: node scripts/favicon.mjs <hero-screenshot.png> [left top size]
//   (a 1440x900 screenshot of the hero with the text and menu hidden; default crop: the head at the top right)
//   -> src/app/icon.png (512) and src/app/apple-icon.png (180)
import sharp from "sharp";

const [src, left = "900", top = "0", size = "440"] = process.argv.slice(2);
if (!src) throw new Error("usage: node scripts/favicon.mjs <hero-screenshot.png> [left top size]");

const crop = await sharp(src)
  .extract({ left: +left, top: +top, width: +size, height: +size })
  .resize(512, 512)
  .toBuffer();
const vignette = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <defs><radialGradient id="g" cx="0.42" cy="0.38" r="0.75">
    <stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.85"/>
  </radialGradient></defs>
  <rect width="512" height="512" fill="url(#g)"/>
</svg>`);
const icon = await sharp(crop).composite([{ input: vignette }]).modulate({ saturation: 1.15 }).png().toBuffer();

const root = new URL("../src/app/", import.meta.url).pathname;
await sharp(icon).toFile(`${root}icon.png`);
await sharp(icon).resize(180, 180).toFile(`${root}apple-icon.png`);
console.log("wrote src/app/icon.png and src/app/apple-icon.png");
