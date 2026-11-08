import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Typography of the approved master board:
//   titles and hierarchy: Manrope Bold / SemiBold (H1 56/1.1, H2 40/1.2, H3 28/1.3)
//   text, UI and navigation: Inter Regular / Medium (body 16/1.6, caption 14/1.5, nav Inter Medium 16)
//   button text: Inter SemiBold 16 (SemiBold is also used for small labels such as the uppercase kickers)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CSS_DIR = path.join(ROOT, 'assets/css');
const files = readdirSync(CSS_DIR).filter((f) => f.endsWith('.css'));
const css = Object.fromEntries(files.map((f) => [f, readFileSync(path.join(CSS_DIR, f), 'utf8')]));

/** [selector, body] pairs, @media flattened, @font-face skipped. */
function rules(src) {
  src = src.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(src))) {
    const sel = m[1].trim();
    if (sel.startsWith('@font-face')) continue;
    out.push([sel.replace(/^@media[^{]*\{/, '').trim(), m[2]]);
  }
  return out;
}

test('Manrope is used only at SemiBold 600 and Bold 700; Inter only at Regular 400, Medium 500 and SemiBold 600', () => {
  for (const [file, src] of Object.entries(css)) {
    for (const [sel, body] of rules(src)) {
      const weights = [...body.matchAll(/(?:^|;)\s*font:\s*(\d{3})\b/g), ...body.matchAll(/(?:^|;)\s*font-weight:\s*(\d{3})/g)].map((m) => Number(m[1]));
      if (!weights.length) continue;
      const manrope = body.includes('var(--head)');
      const globalTitles = /^h1,\s*h2,\s*h3$/.test(sel) || sel === 'h3';
      for (const w of weights) {
        if (manrope || globalTitles) assert.ok([600, 700].includes(w), `${file}: ${sel} { Manrope ${w} }`);
        else assert.ok([400, 500, 600].includes(w), `${file}: ${sel} { Inter ${w} }`);
      }
    }
  }
});

test('@font-face ranges match the weights in use and only Manrope and Inter are declared', () => {
  const site = css['site.css'];
  const faces = [...site.matchAll(/@font-face\{([^}]*)\}/g)].map((m) => m[1]).filter((b) => /src:url/.test(b));
  assert.equal(faces.length, 4);
  for (const f of faces) {
    const fam = f.match(/font-family:"([^"]+)"/)[1];
    const range = f.match(/font-weight:(\d+) (\d+)/);
    if (fam === 'Manrope') assert.deepEqual([range[1], range[2]], ['600', '700']);
    else if (fam === 'Inter') assert.deepEqual([range[1], range[2]], ['400', '600']);
    else assert.fail(`unexpected family ${fam}`);
  }
});

test('type scale of the master: body Inter 16/1.6, nav Inter Medium 16, buttons Inter SemiBold 16, H1 up to 56, H2 up to 40, negative letter-spacing only on the three heading levels', () => {
  const site = css['site.css'];
  assert.match(site, /body\{[^}]*font:16px\/1\.6 var\(--sans\)/);
  assert.match(site, /\.hdr nav\{[^}]*font:500 16px var\(--sans\)/);
  assert.match(site, /\.btn\{[^}]*font:600 16px\/1 var\(--sans\)/);
  assert.match(site, /\.hero h1\{font-size:var\(--h1\);line-height:1\.1/);
  assert.match(site, /\.sc h2\{font-size:var\(--h2\);line-height:1\.2/);
  assert.match(site, /\.pgh h1\{font-size:var\(--h1\);line-height:1\.1/);
  assert.match(site, /h3\{font-weight:600;font-size:var\(--h3\);line-height:1\.3;letter-spacing:-\.02em\}/, 'H3 Manrope SemiBold 28/1.3');
  // the master headings are set tight (measured on the master board and the approved home mockup): -0.03em H1, -0.02em H2/H3, nothing else
  for (const [file, src] of Object.entries(css)) {
    const rest = src.replace(/(?<=^|\}|\n)h[123]\{[^}]*\}/g, '');
    assert.ok(!/letter-spacing:-/.test(rest), `${file}: negative letter-spacing outside the heading levels`);
  }
  assert.match(css['site.css'], /h1\{font-size:var\(--h1\);line-height:1\.1;letter-spacing:-\.03em\}/);
});

test('heading scale: tokens are 56/40/28 on desktop and every page-level heading takes its size from them', () => {
  const site = readFileSync(path.join(ROOT, 'assets/css/site.css'), 'utf8');
  assert.match(site, /@media\(min-width:1001px\)\{:root\{--h1:56px;--h2:40px;--h3:28px\}\}/);
  assert.match(site, /h1\{font-size:var\(--h1\);line-height:1\.1;letter-spacing:-\.03em\}h2\{font-size:var\(--h2\);line-height:1\.2;letter-spacing:-\.02em\}/);
  for (const f of ['site', 'about', 'catalogue', 'contact', 'product']) {
    const css = readFileSync(path.join(ROOT, `assets/css/${f}.css`), 'utf8');
    // no heading rule sets its own clamp()/px size any more; the only exceptions are card labels (.pc h3 product-card name, .card .cl h2 contact side-card label)
    for (const m of css.matchAll(/(^|\})\s*([^{}]*\bh[123]\b[^{}]*)\{([^}]*)\}/g)) {
      if (/font-size:\s*\d|font:[^;]*\d+px\/|font-size:clamp/.test(m[3]) && !/\.pc h3|\.card \.cl h2/.test(m[2])) assert.fail(`${f}.css: ${m[2].trim()} sets its own size: ${m[3]}`);
    }
  }
});
