#!/usr/bin/env node
/**
 * Builds the home-screen and browser icons from the source mark.
 *
 * The source is a black mark on a transparent 500x500 canvas, and the mark
 * itself only occupies 255x138 of it. Shipped as-is that fails three ways:
 * iOS composites transparency onto black, Android's maskable shapes fill the
 * transparent area themselves, and the wide margins leave the mark tiny on a
 * home screen. So each icon is drawn on the brand yellow at a deliberate size.
 *
 * Run with: node scripts/make-icons.mjs   (needs sharp, which ships with Next)
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SOURCE = "public/navey-icon.png";
const YELLOW = { r: 0xff, g: 0xde, b: 0x00, alpha: 1 };

/**
 * Android may mask a "maskable" icon to a circle, squircle or teardrop, and
 * only the central 80% is guaranteed to survive. Anything near the edge can be
 * sliced off, so that variant is drawn noticeably smaller.
 */
const TARGETS = [
  { file: "public/icon-192.png", size: 192, coverage: 0.68 },
  { file: "public/icon-512.png", size: 512, coverage: 0.68 },
  { file: "public/icon-maskable-512.png", size: 512, coverage: 0.5 },
  // Next serves this one as the iOS home-screen icon by file convention, so
  // it has to sit in the app directory rather than public/.
  { file: "src/app/apple-icon.png", size: 180, coverage: 0.68 },
  // Next serves this one as the favicon. Tab icons are rendered near 16px, so
  // the mark is given more of the square or it disappears.
  { file: "src/app/icon.png", size: 512, coverage: 0.78 },
];

const mark = await sharp(SOURCE).trim({ threshold: 10 }).toBuffer();
const { width, height } = await sharp(mark).metadata();
if (!width || !height) throw new Error("Could not measure the source mark");

for (const { file, size, coverage } of TARGETS) {
  const targetWidth = Math.round(size * coverage);
  const targetHeight = Math.round((targetWidth * height) / width);

  const resized = await sharp(mark)
    .resize(targetWidth, targetHeight, { fit: "contain", background: { ...YELLOW, alpha: 0 } })
    .toBuffer();

  await mkdir(file.slice(0, file.lastIndexOf("/")), { recursive: true });

  await sharp({
    create: { width: size, height: size, channels: 4, background: YELLOW },
  })
    .composite([
      {
        input: resized,
        top: Math.round((size - targetHeight) / 2),
        left: Math.round((size - targetWidth) / 2),
      },
    ])
    // Flattened and stripped of alpha deliberately: transparency is what iOS
    // composites onto black, and some Android launchers handle it poorly too.
    .flatten({ background: YELLOW })
    .removeAlpha()
    .png()
    .toFile(file);

  console.log(`  ${file}  ${size}x${size}  mark ${targetWidth}x${targetHeight}`);
}

console.log("\nIcons rebuilt.");
