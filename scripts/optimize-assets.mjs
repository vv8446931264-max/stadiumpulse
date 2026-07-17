// One-off: shrink the raw 4K AI assets into web-sized files in public/.
// Run with: node scripts/optimize-assets.mjs
import sharp from "sharp";
import { cp } from "node:fs/promises";
import { existsSync } from "node:fs";

const SRC = "Ai_images";
const OUT = "public";

const jobs = [
  // [source, output, transform]
  ["Football_stadium_at_night_4K_202607171608.jpeg", "hero-stadium.jpg",
    (s) => s.resize(1920).jpeg({ quality: 74, mozjpeg: true })],
  ["Stadium_with_fans_at_night_202607171634.jpeg", "hero-fans.jpg",
    (s) => s.resize(1600).jpeg({ quality: 72, mozjpeg: true })],
  ["StadiumPulse_GenAI_Incident_Tria…_4K_202607171630.jpeg", "og.jpg",
    (s) => s.resize(1200, 630, { fit: "cover" }).jpeg({ quality: 80, mozjpeg: true })],
  ["Three_flat_isometric_icons_4K_202607171619.jpeg", "how-it-works.jpg",
    (s) => s.resize(1600).jpeg({ quality: 78, mozjpeg: true })],
  ["StadiumPulse_logo_stadium_operat…_4K_202607171611.jpeg", "logo.png",
    (s) => s.resize(512).png({ compressionLevel: 9 })],
  ["StadiumPulse_logo_stadium_operat…_4K_202607171611.jpeg", "icon.png",
    (s) => s.resize(64).png({ compressionLevel: 9 })],
];

for (const [src, out, fn] of jobs) {
  const inPath = `${SRC}/${src}`;
  if (!existsSync(inPath)) {
    console.warn(`SKIP (missing): ${inPath}`);
    continue;
  }
  await fn(sharp(inPath)).toFile(`${OUT}/${out}`);
  console.log(`✓ ${out}`);
}

// Hero video loop: the 2 MB clip is already web-sized — just copy it.
const vid = `${SRC}/Aerial_push-in_over_stadium_202607171633.mp4`;
if (existsSync(vid)) {
  await cp(vid, `${OUT}/hero-loop.mp4`);
  console.log("✓ hero-loop.mp4");
}
console.log("done");
