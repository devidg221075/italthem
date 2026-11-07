// Builds assets/img/icons.svg (an SVG sprite) from the official icon kit in scripts/icons-src/ (ITALTHERM_Kit_Vettoriale/01_Icone, traced from the
// approved master board). Page icons reference it with <use href="/assets/img/icons.svg#name">, so one cached file serves every page and the colour
// comes from the surrounding text (currentColor). The kit's fixed paint colours (navy #1E3A66, blue #0754BC) are replaced by currentColor; the pale
// disc of "spunta-cerchio" keeps its own colour.
//   node scripts/build-icons.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'scripts/icons-src');
const OUT = path.join(ROOT, 'assets/img/icons.svg');

const symbols = readdirSync(SRC).filter((f) => f.endsWith('.svg')).sort().map((f) => {
  const id = f.replace(/\.svg$/, '');
  let s = readFileSync(path.join(SRC, f), 'utf8');
  const viewBox = s.match(/viewBox="([^"]+)"/)?.[1];
  if (!viewBox) throw new Error(`${f}: no viewBox`);
  let inner = s.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  inner = inner.replace(/<title>[\s\S]*?<\/title>/, '').replace(/<defs>[\s\S]*?<\/defs>/, '').replace(/ xmlns="[^"]*"/g, '');
  inner = inner.replace(/(fill|stroke)="#(?:1E3A66|0754BC)"/gi, '$1="currentColor"');
  if (/url\(#/.test(inner)) throw new Error(`${f}: still references a gradient`);
  if (/<image\b/i.test(inner)) throw new Error(`${f}: contains a raster image`);
  return `<symbol id="${id}" viewBox="${viewBox}">${inner.trim()}</symbol>`;
});

writeFileSync(OUT, `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${symbols.join('\n')}\n</svg>\n`);
console.log(`wrote ${path.relative(ROOT, OUT)} with ${symbols.length} icons (${(readFileSync(OUT).length / 1024).toFixed(1)} KB)`);
