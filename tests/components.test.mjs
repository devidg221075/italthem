import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Components of the master board: grid and spacing scale, the four button variants with their states, form fields, checkbox,
// breadcrumb, icons. Geometry that needs a browser (container 1280 at 1440, margins and gutters per width) is checked by scripts/check-layout.mjs.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const css = readFileSync(path.join(ROOT, 'assets/css/site.css'), 'utf8');
const read = (rel) => readFileSync(path.join(DIST, rel), 'utf8');
before(() => { execFileSync('node', ['build.mjs'], { cwd: ROOT, stdio: 'pipe' }); });

test('spacing scale 8 / 16 / 24 / 32 / 48 / 64 is declared as tokens', () => {
  for (const [n, px] of [[1, 8], [2, 16], [3, 24], [4, 32], [5, 48], [6, 64]]) assert.ok(css.includes(`--sp${n}:${px}px`), `--sp${n}`);
});

test('grid: container 1280 with 80 px margins at 1440, gutter 24 / 20 / 16 on desktop / tablet / phone', () => {
  assert.match(css, /--gut:24px/);
  assert.match(css, /--mx:clamp\(40px,5\.5556vw,80px\)/, '80 px at 1440, shrinking on narrower screens');
  assert.match(css, /\.w\{max-width:1440px;margin:0 auto;padding-left:max\(var\(--mx\)/, '1440 - 2 x 80 = 1280 content');
  assert.match(css, /@media \(max-width:1000px\)\{\s*:root\{--hh:68px;--gut:20px;--mx:32px\}/);
  assert.match(css, /@media \(max-width:600px\)\{\s*:root\{--gut:16px;--mx:16px\}/);
  for (const sel of ['.gr3', '.gr4', '.svt']) assert.match(css, new RegExp(`\\${sel}\\{[^}]*gap:var\\(--gut\\)`), `${sel} uses the gutter`);
});

test('buttons: primary, secondary, outline and ghost, each with hover and a double focus ring', () => {
  assert.match(css, /\.btn\{--ring:0 0 0 2px #fff,0 0 0 4px var\(--blue\);/, 'double ring token');
  assert.match(css, /\.btn:focus-visible\{outline:0;box-shadow:var\(--ring\)\}/);
  assert.match(css, /\.b1\{background:linear-gradient\(180deg,#0760df,#0754bc\);[^}]*color:#fff/, 'primary: kit gradient #0760DF to #0754BC');
  assert.match(css, /\.b1:hover\{background:linear-gradient\(180deg,#254873,#1e3a66\)/, 'primary hover: dark navy');
  assert.match(css, /\.b2\{background:#fff;border-color:#a8c4ed;color:var\(--blue\)\}/, 'secondary: white, light blue border, blue text');
  assert.match(css, /\.b2:hover\{background:#d6e6ff/, 'secondary hover: pale blue fill');
  assert.match(css, /\.b3\{background:#fff;border-color:var\(--rule\);color:var\(--ink\)\}/, 'outline: neutral grey border, dark text');
  assert.match(css, /\.b3:hover\{background:var\(--pearl\)\}/, 'outline hover: pearl fill');
  assert.match(css, /\.bg\{[^}]*color:var\(--blue\);text-decoration:underline/, 'ghost: underlined blue text link');
  assert.match(css, /\.btn\{[^}]*font:600 16px\/1 var\(--sans\)/, 'Inter SemiBold 16');
});

test('the product datasheet button is the neutral outline variant with the download icon; the quote CTA is primary', () => {
  const html = read('it/prodotti/it-cc/index.html');
  assert.match(html, /<a class="btn b1" href="\/it\/contatti\/\?product=it-cc">Richiedi un preventivo<svg/);
  assert.match(html, /<a class="btn b3" href="\/assets\/docs\/it-cc\.pdf"[^>]*><svg[^>]*><use href="\/assets\/img\/icons\.svg#download"\/><\/svg>Scarica specifiche tecniche<\/a>/);
});

test('form fields: red asterisk for required (original wording kept for screen readers), blue rounded checkbox', () => {
  assert.match(css, /\.rq\{color:#d92d20/);
  assert.match(css, /\.ck input:checked\+i\{background:var\(--blue\)/);
  for (const [file, word] of [['it/contatti/index.html', '(Obbligatorio)'], ['en/contact/index.html', '(Required)']]) {
    const html = read(file);
    assert.match(html, new RegExp(`<span class="rq" aria-hidden="true">\\*</span><span class="vh"> ${word.replace(/[()]/g, '\\$&')}</span>`));
    assert.match(html, /<label class="ck gdpr"><input type="checkbox" name="consent" value="1" required><i aria-hidden="true"><\/i>/);
    assert.ok(!html.includes(`<i>${word}</i>`), 'no grey parenthesised marker any more');
  }
});

test('breadcrumbs: house icon, chevrons, current page in blue (product, service, privacy, cookie policy)', () => {
  for (const f of ['it/prodotti/it-cc/index.html', 'en/products/it-af/index.html', 'it/servizi/italtherm-annealing-furnaces/index.html', 'it/privacy/index.html', 'en/cookie-policy/index.html']) {
    const m = read(f).match(/<div class="crumb">[\s\S]*?<\/b><\/div>/);
    assert.ok(m, f);
    assert.match(m[0], /<a href="\/(it|en)\/"><svg class="ic"[^>]*><use href="\/assets\/img\/icons\.svg#home"\/>/, `${f}: house icon`);
    assert.ok(m[0].includes('<span aria-hidden="true">›</span>'), `${f}: chevron`);
  }
});

test('icons: the official kit through one cached sprite, plus inline line icons (stroke 1.8, round caps); colour always from the text', () => {
  const html = read('it/index.html');
  const inline = [...html.matchAll(/<svg class="ic[^"]*" viewBox="0 0 24 24"[^>]*>/g)].map((m) => m[0]);
  assert.ok(inline.length > 10);
  for (const i of inline) {
    assert.match(i, /stroke-width="1\.8" stroke-linecap="round" stroke-linejoin="round"/, i);
    assert.match(i, /fill="none" stroke="currentColor"/);
    assert.match(i, /aria-hidden="true"/);
  }
  const sprite = read('assets/img/icons.svg');
  const ids = new Set([...sprite.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]));
  assert.ok(ids.size >= 16);
  assert.ok(!/<image|url\(#|#1E3A66|#0754BC/i.test(sprite.replace(/#E1ECFD/i, '')), 'no raster, no gradients, no hard-coded kit colours');
  for (const f of ['it/index.html', 'en/products/it-cc/index.html', 'it/chi-siamo/index.html', 'it/contatti/index.html', 'it/prodotti/index.html']) {
    const uses = [...read(f).matchAll(/<svg class="ic[^"]*" viewBox="0 0 32 32"[^>]*aria-hidden="true"[^>]*><use href="\/assets\/img\/icons\.svg#([a-z-]+)"\/><\/svg>/g)].map((m) => m[1]);
    assert.ok(uses.length > 0, f);
    for (const id of uses) assert.ok(ids.has(id), `${f}: #${id} missing from the sprite`);
  }
  for (const id of ['ricerca', 'download', 'documento', 'lingua', 'contatti', 'tecnologia', 'supporto-tecnico', 'soluzioni-su-misura', 'home', 'spunta']) assert.ok(ids.has(id), id);
});
