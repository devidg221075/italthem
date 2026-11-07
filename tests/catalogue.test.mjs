import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from '../src/lib/content.mjs';
import { goldCapacities, capRanges } from '../src/lib/views.mjs';

// Catalogue page from the approved mockup: banner, filter sidebar (process, gold capacity), count, sort, 11 cards.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const read = (rel) => readFileSync(path.join(DIST, rel), 'utf8');
const count = (s, re) => (s.match(re) || []).length;
let content;
before(async () => { execFileSync('node', ['build.mjs'], { cwd: ROOT, stdio: 'pipe' }); content = await loadContent('en'); });

test('gold capacity is read from the spec table only where the table has it', () => {
  const by = (code) => content.products.find((p) => p.code === code);
  assert.deepEqual(goldCapacities(by('IT.CC')), [5, 10, 20]);
  assert.deepEqual(goldCapacities(by('IT.GT')), [20, 30, 50]);
  assert.deepEqual(goldCapacities(by('IT.FM')), [30, 50, 100]);
  assert.deepEqual(goldCapacities(by('IT.GMS')), [5, 10, 15]);
  for (const code of ['IT.AF', 'IT.BF', 'IT.CWA', 'IT.KB']) assert.deepEqual(goldCapacities(by(code)), [], `${code}: no gold capacity in the table (the mould row of IT.KB is not a capacity)`);
});

test('capacity ranges: up to 10 kg, 10-50 kg, over 50 kg (a product is in every range one of its models falls in)', () => {
  const by = (code) => content.products.find((p) => p.code === code);
  assert.deepEqual(capRanges(by('IT.CC')), [0, 1]);
  assert.deepEqual(capRanges(by('IT.GT')), [1]);
  assert.deepEqual(capRanges(by('IT.FM')), [1, 2]);
  assert.deepEqual(capRanges(by('IT.KB')), []);
  const n = (i) => content.products.filter((p) => capRanges(p).includes(i)).length;
  assert.deepEqual([n(0), n(1), n(2)], [4, 7, 2]);
});

for (const [lang, file] of [['en', 'en/products/index.html'], ['it', 'it/prodotti/index.html']]) {
  test(`${lang} catalogue: banner, 11 cards in mockup order with filter data, sidebar with real counts, sort`, () => {
    const html = read(file);
    assert.equal(count(html, /<h1>/g), 1);
    const cards = [...html.matchAll(/<div class="cc" data-g="(\w+)" data-cap="([^"]*)" data-r="(\d+)" data-code="([^"]+)"><a class="pc" href="([^"]+)"/g)];
    assert.equal(cards.length, 11);
    assert.deepEqual(cards.slice(0, 4).map((c) => c[4]), ['IT.CC', 'IT.GT', 'IT.AF', 'IT.GMS'], 'featured four first, as in the mockup');
    assert.deepEqual([...new Set(cards.map((c) => c[1]))].sort(), ['heat', 'melt', 'prod']);
    for (const c of cards) assert.ok(c[5].startsWith(`/${lang}/${lang === 'en' ? 'products' : 'prodotti'}/it-`));
    const side = html.match(/<details class="cf" open>[\s\S]*?<\/details>/)[0];
    assert.deepEqual([...side.matchAll(/name="g" value="(\w+)"[\s\S]*?<em>(\d+)<\/em>/g)].map((m) => [m[1], +m[2]]), [['melt', 4], ['heat', 3], ['prod', 4]]);
    assert.deepEqual([...side.matchAll(/name="cap" value="(\d)"[\s\S]*?<em>(\d+)<\/em>/g)].map((m) => [m[1], +m[2]]), [['0', 4], ['1', 7], ['2', 2]]);
    assert.match(html, /<p class="cnt"[^>]*>(11 products found|11 prodotti trovati)<\/p>/);
    assert.equal(count(html, /<option value="[rc]">/g), 2);
  });

  test(`${lang} catalogue: page-specific CSS and JS are linked here only`, () => {
    const html = read(file);
    assert.match(html, /<link rel="stylesheet" href="\/assets\/css\/catalogue\.css\?v=[0-9a-f]{8}">/);
    assert.match(html, /<script src="\/assets\/js\/catalogue\.js\?v=[0-9a-f]{8}" defer><\/script>/);
    assert.ok(!read(`${lang}/index.html`).includes('catalogue.'), 'home does not load catalogue assets');
    assert.ok(existsSync(path.join(DIST, 'assets/css/catalogue.css')) && existsSync(path.join(DIST, 'assets/js/catalogue.js')));
  });
}

test('catalogue.js: no globals, no HTML parsing, filters read data-* attributes of the cards', () => {
  const js = readFileSync(path.join(ROOT, 'assets/js/catalogue.js'), 'utf8');
  assert.ok(!/innerHTML|localStorage|\beval\s*\(/.test(js));
  for (const k of ['data-g', 'data-cap', 'data-r', 'data-code', 'data-one', 'data-many']) assert.ok(js.includes(k), k);
});
