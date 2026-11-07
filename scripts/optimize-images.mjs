// Generates the responsive WebP variants of assets/img/src/* into assets/img/opt/ plus manifest.json.
// Run with `npm run images` (needs the sharp devDependency). The outputs are COMMITTED, so `node build.mjs` needs no image tooling.
//
//   assets/img/opt/<base>-<w>.<hash8>.webp   w in 480 / 960 / 1600, never upscaled (a source narrower than 480 gets one variant at its own width)
//   assets/img/opt/manifest.json             { "<source file>": { width, height, variants: [{ w, file, format }] } }
//
// <hash8> is the first 8 hex digits of the sha1 of the encoded file, so a changed image gets a new name and the files can be
// cached for a year (`immutable`). The originals stay in assets/img/src (source of truth, not shipped in dist/).
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const WIDTHS = [480, 960, 1600];
// The photos sit on a white studio background and are blended with `mix-blend-mode: multiply`: keep the white clean.
// WebP is always 4:2:0; smartSubsample keeps the edges sharp and quality 80 leaves no visible noise on the white.
const WEBP = { quality: 80, effort: 6, smartSubsample: true };

export async function optimize(srcDir = path.join(ROOT, 'assets/img/src'), outDir = path.join(ROOT, 'assets/img/opt')) {
  const { default: sharp } = await import('sharp');
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const manifest = {};
  for (const file of readdirSync(srcDir).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort()) {
    const input = readFileSync(path.join(srcDir, file));
    const { width, height } = await sharp(input).metadata();
    const base = file.replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9._-]+/g, '-');
    const widths = WIDTHS.filter((w) => w <= width);
    if (!widths.length) widths.push(width);
    const variants = [];
    for (const w of widths) {
      const buf = await sharp(input).resize({ width: w, withoutEnlargement: true }).webp(WEBP).toBuffer();
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
