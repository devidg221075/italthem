// Generates the responsive WebP variants of assets/img/src/* into assets/img/opt/ plus manifest.json.
// Run with `npm run images` (needs the sharp devDependency). The outputs are COMMITTED, so `node build.mjs` needs no image tooling.
//
//   assets/img/opt/<base>-<w>.<hash8>.webp   w in 480 / 720 / 960 / 1600, never upscaled (a source narrower than 480 gets one variant at its own width)
//   assets/img/opt/manifest.json             { "<source file>": { width, height, variants: [{ w, file, format }] } }
//
// <hash8> is the first 8 hex digits of the sha1 of the encoded file, so a changed image gets a new name and the files can be
// cached for a year (`immutable`). The originals stay in assets/img/src (source of truth, not shipped in dist/).
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const WIDTHS = [480, 720, 960, 1600];
// The photos sit on a white studio background and are blended with `mix-blend-mode: multiply`: keep the white clean.
// WebP is always 4:2:0; smartSubsample keeps the edges sharp and quality 80 leaves no visible noise on the white.
const WEBP = { quality: 80, effort: 6, smartSubsample: true };
const MAX_960_BYTES = 140 * 1024;

/**
 * Product photos shot on a white studio background are cropped to the machine (plus a 3% white margin) so the machine fills its box on
 * the site. Only images whose four corners are white are touched (detail shots, photos with a coloured background stay as they are).
 */
export async function trimStudioWhite(sharp, input) {
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const patch = 8;
  const corners = [[0, 0], [info.width - patch, 0], [0, info.height - patch], [info.width - patch, info.height - patch]];
  for (const [cx, cy] of corners) {
    let sum = 0;
    for (let y = cy; y < cy + patch; y++) for (let x = cx; x < cx + patch; x++) {
      const i = (y * info.width + x) * 3;
      sum += Math.min(data[i], data[i + 1], data[i + 2]);
    }
    if (sum / (patch * patch) < 245) return input;
  }
  const trimmed = await sharp(input).trim({ background: '#ffffff', threshold: 18 }).toBuffer({ resolveWithObject: true });
  const pad = Math.round(Math.max(trimmed.info.width, trimmed.info.height) * 0.03);
  return sharp(trimmed.data).extend({ top: pad, bottom: pad, left: pad, right: pad, background: '#ffffff' }).jpeg({ quality: 95 }).toBuffer();
}

export async function optimize(srcDir = path.join(ROOT, 'assets/img/src'), outDir = path.join(ROOT, 'assets/img/opt')) {
  const { default: sharp } = await import('sharp');
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const manifest = {};
  for (const file of readdirSync(srcDir).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort()) {
    let input = readFileSync(path.join(srcDir, file));
    input = await trimStudioWhite(sharp, input);
    const { width, height } = await sharp(input).metadata();
    const base = file.replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9._-]+/g, '-');
    const widths = WIDTHS.filter((w) => w <= width);
    // keep the native width when it is well above the last standard step (e.g. a 765 px crop), so big boxes never fall back to the 480 px file
    if (!widths.length || (width <= WIDTHS.at(-1) && width - widths.at(-1) > 120)) widths.push(width);
    const variants = [];
    for (const w of widths) {
      // very detailed photos can exceed the page-weight budget at 960 px: lower the quality step by step (never below 62) until it fits
      let quality = WEBP.quality;
      let buf = await sharp(input).resize({ width: w, withoutEnlargement: true }).webp({ ...WEBP, quality }).toBuffer();
      while (w <= 960 && buf.length > MAX_960_BYTES && quality > 62) {
        quality -= 4;
        buf = await sharp(input).resize({ width: w, withoutEnlargement: true }).webp({ ...WEBP, quality }).toBuffer();
      }
      const name = `${base}-${w}.${createHash('sha1').update(buf).digest('hex').slice(0, 8)}.webp`;
      writeFileSync(path.join(outDir, name), buf);
      variants.push({ w, file: name, format: 'webp' });
    }
    manifest[file] = { width, height, variants };
  }
  writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 1)}\n`);
  return manifest;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const m = await optimize();
  const n = Object.values(m).reduce((a, e) => a + e.variants.length, 0);
  console.log(`optimized ${Object.keys(m).length} images -> ${n} WebP files in assets/img/opt/`);
}
