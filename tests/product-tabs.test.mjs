import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from '../src/lib/content.mjs';
import { productUrl } from '../src/lib/routes.mjs';

// Product page tabs (approved IT.CC mockup): Description, Models and technical data, Documentation.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const read = (u) => readFileSync(path.join(DIST, u, 'index.html'), 'utf8');
const count = (s, re) => (s.match(re) || []).length;
let contents;
before(async () => {
  execFileSync('node', ['build.mjs'], { cwd: ROOT, stdio: 'pipe' });
  contents = { en: await loadContent('en'), it: await loadContent('it') };
});

for (const lang of ['en', 'it']) {
  test(`${lang}: product tabs are accessible, open on the models table, and every panel is in the HTML (no-JS shows them all)`, () => {
    const cc = contents[lang].products.find((p) => p.code === 'IT.CC');
    const html = read(productUrl(cc, lang));
    assert.match(html, /<div class="ptab" data-first="spec">/);
    const tabs = [...html.matchAll(/<button type="button" role="tab" id="t-(\w+)" aria-controls="p-(\w+)" aria-selected="(true|false)" tabindex="(0|-1)">/g)];
    assert.deepEqual(tabs.map((t) => t[1]), ['desc', 'spec', 'docs']);
    assert.deepEqual(tabs.map((t) => t[3]), ['false', 'true', 'false']);
    assert.equal(count(html, /role="tabpanel"/g), 3);
    assert.equal(count(html, / data-off>/g), 2, 'the two closed panels are marked, the open one is not');
    assert.ok(html.includes('<table') && html.includes('class="desc"') && html.includes('class="dc"'));
    assert.match(html, /<script src="\/assets\/js\/product\.js\?v=[0-9a-f]{8}" defer><\/script>/);
  });

  test(`${lang}: a product without spec rows opens on the description tab`, async () => {
    const { productBody } = await import('../src/lib/views.mjs');
    const html = productBody({ ...contents[lang].products[0], specs: { columns: [], rows: [] } }, contents[lang], lang);
    assert.match(html, /data-first="desc"/);
  });
}

test('the WordPress "Category: Ital-therm" line is not shown; SKU and Tag stay', () => {
  for (const lang of ['en', 'it']) {
    for (const p of contents[lang].products) {
      const html = read(productUrl(p, lang));
      assert.ok(!/Category:\s*Ital-?therm/i.test(html), `${p.slug}: category line`);
      assert.ok(html.includes('SKU:'), `${p.slug}: SKU stays`);
    }
  }
});

test('product.js has no globals or HTML parsing, handles arrow keys, Home, End and #p- links', () => {
  const js = readFileSync(path.join(ROOT, 'assets/js/product.js'), 'utf8');
  assert.ok(!/innerHTML|localStorage|\beval\s*\(/.test(js));
  for (const k of ['ArrowRight', 'ArrowLeft', 'Home', 'End', '#p-', 'aria-selected', 'data-off']) assert.ok(js.includes(k), k);
});
