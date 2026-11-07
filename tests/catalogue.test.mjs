import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from '../src/lib/content.mjs';
import { familyOf, FAMILIES } from '../src/lib/featured.mjs';

// Catalogue page from the approved mockup: banner, family filter sidebar, count, sort, 11 cards.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const read = (rel) => readFileSync(path.join(DIST, rel), 'utf8');
const count = (s, re) => (s.match(re) || []).length;
let content;
before(async () => { execFileSync('node', ['build.mjs'], { cwd: ROOT, stdio: 'pipe' }); content = await loadContent('en'); });

test('families: continuous casting (IT.CC) is its own family, the rest follow the real product groups', () => {
  assert.deepEqual(FAMILIES, ['cc', 'melt', 'heat', 'prod']);
  const by = (f) => content.products.filter((p) => familyOf(p) === f).map((p) => p.code).sort();
  assert.deepEqual(by('cc'), ['IT.CC']);
  assert.deepEqual(by('melt'), ['IT.GT', 'IT.MT', 'IT.SM']);
  assert.deepEqual(by('heat'), ['IT.AF', 'IT.BF', 'IT.CWA']);
  assert.deepEqual(by('prod'), ['IT.FM', 'IT.GMB', 'IT.GMS', 'IT.KB']);
});

for (const [lang, file] of [['en', 'en/products/index.html'], ['it', 'it/prodotti/index.html']]) {
  test(`${lang} catalogue: banner, 11 cards in mockup order with family data, sidebar with real counts, sort`, () => {
    const html = read(file);
    assert.equal(count(html, /<h1>/g), 1);
    const cards = [...html.matchAll(/<div class="cc" data-g="(\w+)" data-r="(\d+)" data-code="([^"]+)"><a class="pc" href="([^"]+)"/g)];
    assert.equal(cards.length, 11);
    assert.deepEqual(cards.slice(0, 4).map((c) => c[3]), ['IT.CC', 'IT.GT', 'IT.AF', 'IT.GMS'], 'featured four first, as in the mockup');
    assert.deepEqual([...new Set(cards.map((c) => c[1]))].sort(), ['cc', 'heat', 'melt', 'prod']);
    for (const c of cards) assert.ok(c[4].startsWith(`/${lang}/${lang === 'en' ? 'products' : 'prodotti'}/it-`));
    const side = html.match(/<details class="cf" open>[\s\S]*?<\/details>/)[0];
    assert.deepEqual([...side.matchAll(/name="g" value="(\w+)"[\s\S]*?<em>(\d+)<\/em>/g)].map((m) => [m[1], +m[2]]), [['cc', 1], ['melt', 3], ['heat', 3], ['prod', 4]]);
    assert.ok(!/name="cap"|Capacit|Gold capacity/.test(html), 'no capacity filter');
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

  test(`${lang}: the mega menu and the drawer link each family to the filtered catalogue`, () => {
    const html = read(`${lang}/index.html`);
    const base = lang === 'en' ? '/en/products/' : '/it/prodotti/';
    const mega = html.match(/<div class="ml">([\s\S]*?)<\/div><div class="mr">/)[1];
    assert.deepEqual([...mega.matchAll(/href="([^"]+)"/g)].map((m) => m[1]), [base, `${base}?g=melt`, `${base}?g=cc`, `${base}?g=heat`, `${base}?g=prod`]);
    const drawer = html.match(/class="dp ps"[\s\S]*?<\/div><\/div>/)[0];
    assert.deepEqual([...drawer.matchAll(/href="([^"]+)"/g)].map((m) => m[1]), [`${base}?g=melt`, `${base}?g=cc`, `${base}?g=heat`, `${base}?g=prod`, base]);
  });
}

test('catalogue.js: no globals, no HTML parsing, filters read data-* attributes of the cards and honour ?g=', () => {
  const js = readFileSync(path.join(ROOT, 'assets/js/catalogue.js'), 'utf8');
  assert.ok(!/innerHTML|localStorage|\beval\s*\(/.test(js));
  for (const k of ['data-g', 'data-r', 'data-code', 'data-one', 'data-many', "get('g')"]) assert.ok(js.includes(k), k);
  assert.ok(!js.includes('data-cap'), 'capacity filter removed');
});

test('home hero kicker is in Italian on the Italian page and in English on the English page', () => {
  assert.match(read('it/index.html'), /<span lang="it">Tecnologia italiana<\/span>/);
  assert.match(read('en/index.html'), /<span lang="en">Italian technology<\/span>/);
});

test('IT.CC has the four mockup benefits in both languages; products without supplied texts show no list', () => {
  const it = read('it/prodotti/it-cc/index.html');
  const en = read('en/products/it-cc/index.html');
  assert.equal(count(it.match(/<ul class="ben">[\s\S]*?<\/ul>/)[0], /<li>/g), 4);
  for (const t of ['Elevata produttività', 'Qualità costante del prodotto', 'Affidabilità e lunga durata', 'Personalizzazione su richiesta']) assert.ok(it.includes(t), t);
  assert.equal(count(en.match(/<ul class="ben">[\s\S]*?<\/ul>/)[0], /<li>/g), 4);
  for (const slug of ['it-af', 'it-gt', 'it-kb']) assert.ok(!read(`it/prodotti/${slug}/index.html`).includes('class="ben"'), slug);
});
