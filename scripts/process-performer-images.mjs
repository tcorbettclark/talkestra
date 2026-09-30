#!/usr/bin/env node
// Process performer photos from orig/ into web-serving variants.
//
// Usage:
//   npm run process-images
//
// Reads every orig/*.{jpg,jpeg} and writes to public/images/performers/:
//   <slug>-400.webp   <slug>-400.jpg
//   <slug>-800.webp   <slug>-800.jpg
//   <slug>-lqip.jpg   (16x16 low-quality placeholder)
// The "master" stays in orig/.
//
// Re-running is cheap: a variant is only rebuilt if the source is newer.
// Run after dropping a new photo into orig/ or after editing one.

import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const SRC_DIR = "orig/performers";
const OUT_DIR = "public/images/performers";
const SIZES = [400, 800];
const LQIP_SIZE = 16;

// A photo's slug is its filename without extension, normalised:
//   "Steve bio.jpg" -> "steve-bio"
//   "Steve bio.jpeg" -> "steve-bio"
const slugify = (name) =>
  path
    .parse(name)
    .name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const PHOTO_EXT = new Set([".jpg", ".jpeg"]);

async function listPhotos() {
  let entries;
  try {
    entries = await fs.readdir(SRC_DIR, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
  return entries.filter(
    (e) => e.isFile() && PHOTO_EXT.has(path.extname(e.name).toLowerCase()),
  );
}

async function buildVariant(src, out, width, format) {
  const pipeline = sharp(src).resize({ width, withoutEnlargement: true });
  if (format === "webp") {
    await pipeline.webp({ quality: 78, effort: 4 }).toFile(out);
  } else {
    // Progressive JPEG at modest quality: small, broadly supported.
    await pipeline
      .jpeg({ quality: 78, progressive: true, mozjpeg: false })
      .toFile(out);
  }
}

async function buildLqip(src, out) {
  await sharp(src)
    .resize({ width: LQIP_SIZE, height: LQIP_SIZE, fit: "cover" })
    .blur(1)
    .jpeg({ quality: 50 })
    .toFile(out);
}

async function needsRebuild(srcMtime, outPath) {
  try {
    const outStat = await fs.stat(outPath);
    return outStat.mtimeMs < srcMtime;
  } catch (err) {
    if (err.code === "ENOENT") return true;
    throw err;
  }
}

async function main() {
  const photos = await listPhotos();
  if (photos.length === 0) {
    console.log(`no photos in ${SRC_DIR}/`);
    return;
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  let totalRebuilt = 0;
  let totalSkipped = 0;

  for (const entry of photos) {
    const slug = slugify(entry.name);
    if (!slug) {
      console.warn(`skipping "${entry.name}" — empty slug`);
      continue;
    }

    const src = path.join(SRC_DIR, entry.name);
    const srcStat = await fs.stat(src);
    const srcMtime = srcStat.mtimeMs;

    const variants = [];
    for (const width of SIZES) {
      variants.push(`${slug}-${width}.webp`);
      variants.push(`${slug}-${width}.jpg`);
    }
    variants.push(`${slug}-lqip.jpg`);

    let rebuilt = 0;
    let skipped = 0;

    for (const name of variants) {
      const out = path.join(OUT_DIR, name);
      if (await needsRebuild(srcMtime, out)) {
        const ext = path.extname(name);
        if (name.endsWith("-lqip.jpg")) {
          await buildLqip(src, out);
        } else if (ext === ".webp") {
          const width = Number(name.match(/-(\d+)\.webp$/)[1]);
          await buildVariant(src, out, width, "webp");
        } else {
          const width = Number(name.match(/-(\d+)\.jpg$/)[1]);
          await buildVariant(src, out, width, "jpg");
        }
        rebuilt++;
      } else {
        skipped++;
      }
    }

    console.log(
      `${entry.name} -> ${slug} (${rebuilt} rebuilt, ${skipped} cached)`,
    );
    totalRebuilt += rebuilt;
    totalSkipped += skipped;
  }

  console.log(
    `\ndone: ${totalRebuilt} variants written, ${totalSkipped} cached`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});