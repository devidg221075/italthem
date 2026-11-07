import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from '../src/lib/content.mjs';
import { buildPages } from '../src/lib/site-pages.mjs';
import { productUrl } from '../src/lib/routes.mjs';
import { normalizeUrl } from '../src/lib/docs.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const read = (url) => readFileSync(path.join(DIST, url, 'index.html'), 'utf8');
const count = (s, re) => (s.match(re) || []).length;

let contents;
let pages;
before(async () => {
  execFileSync('node', ['build.mjs'], { cwd: ROOT, stdio: 'pipe' });
  contents = { en: await loadContent('en'), it: await loadContent('it') };
  pages = buildPages(contents);
});

const productPages = () => pages.filter((p) => p.type === 'product');

test('normalizeUrl handles root-relative, protocol-relative and absolute values', () => {
  assert.equal(normalizeUrl('/wp-content/uploads/a.pdf'), 'https://ital-therm.it/wp-content/uploads/a.pdf');
  assert.equal(normalizeUrl('//ital-therm.it/wp-content/uploads/a.pdf'), 'https://ital-therm.it/wp-content/uploads/a.pdf');
  assert.equal(normalizeUrl('https://ital-therm.it/x/a.pdf'), 'https://ital-therm.it/x/a.pdf');
  assert.equal(normalizeUrl('http://ital-therm.it/x/a b.pdf'), 'https://ital-therm.it/x/a%20b.pdf');
  assert.equal(normalizeUrl('https://ital-therm.it/x/A%20B.pdf'), 'https://ital-therm.it/x/A%20B.pdf');
  assert.throws(() => normalizeUrl(''));
});

test('all 22 product pages are built with alternates, group, code and slug', () => {
  assert.equal(productPages().length, 22);
  for (const p of productPages()) {
    assert.ok(p.code && p.group && p.slug, p.url);
    assert.equal(p.alternates.length, 2);
    assert.ok(existsSync(path.join(DIST, p.file)), p.file);
    const prod = contents[p.lang].products.find((x) => x.slug === p.slug);
    assert.equal(p.url, productUrl(prod, p.lang));
  }
});

for (const lang of ['en', 'it']) {
  test(`${lang}: every product page has one h1, alt on every img, quote CTA and badge`, () => {
    for (const prod of contents[lang].products) {
      const html = read(productUrl(prod, lang));
      assert.equal(count(html, /<h1[ >]/g), 1, prod.slug);
      for (const m of html.matchAll(/<img\b[^>]*>/g)) assert.match(m[0], /\balt="/, `${prod.slug} ${m[0]}`);
      const cta = lang === 'en' ? `/en/contact/?product=${prod.slug}` : `/it/contatti/?product=${prod.slug}`;
      assert.ok(html.includes(`href="${cta}"`), `${prod.slug} CTA`);
      assert.ok(html.includes(lang === 'en' ? 'Request a quote' : 'Richiedi un preventivo'));
      assert.ok(html.includes(`<span class="badge">${prod.code}</span>`));
      assert.equal(count(html, /class="pc"/g), 3, 'three related products');
    }
  });

  test(`${lang}: spec table has one body row per spec row with th scope=row; empty specs render no table`, () => {
    let withSpecs = 0;
    let without = 0;
    for (const prod of contents[lang].products) {
      const html = read(productUrl(prod, lang));
      const rows = prod.specs?.rows ?? [];
      if (rows.length) {
        withSpecs++;
        const tbody = html.match(/<tbody>([\s\S]*?)<\/tbody>/)[1];
        assert.equal(count(tbody, /<tr>/g), rows.length, prod.slug);
        assert.equal(count(tbody, /<th scope="row">/g), rows.length);
        assert.equal(count(tbody, /<td[ >]/g), rows.length * prod.specs.columns.length);
        assert.equal(count(html, /<th scope="col">/g), prod.specs.columns.length);
        assert.ok(html.includes('class="spec-w"'));
        assert.ok(html.includes(lang === 'en' ? 'Description' : 'Descrizione'));
      } else {
        without++;
        assert.equal(count(html, /<table/g), 0, prod.slug);
        assert.ok(!/class="ey"[^>]*>(Description|Descrizione)</.test(html));
      }
    }
    assert.ok(withSpecs > 0, 'at least one product has specs');
    // synthetic product with empty specs goes through the same renderer
    assert.ok(without >= 0);
  });
}

test('synthetic product with empty specs renders no table and no Description heading', async () => {
  const { productBody } = await import('../src/lib/views.mjs');
  const base = contents.en.products[0];
  const html = productBody({ ...base, specs: { columns: [], rows: [] } }, contents.en, 'en');
  assert.equal(count(html, /<table/g), 0);
  assert.ok(!html.includes('Description'));
  const withSpecs = productBody(base, contents.en, 'en');
  assert.equal(count(withSpecs, /<table/g), 1);
});

test('IT.KB em-dash cells are accessible in both languages', () => {
  const kb = (l) => contents[l].products.find((p) => p.code === 'IT.KB');
  const dashes = kb('en').specs.rows.flatMap((r) => r.values).filter((v) => v === '—').length;
  assert.ok(dashes > 0, 'IT.KB has placeholder cells');
  const en = read(productUrl(kb('en'), 'en'));
  const it = read(productUrl(kb('it'), 'it'));
  assert.equal(count(en, /<span role="img" aria-label="not available">—<\/span>/g), dashes);
  assert.equal(count(it, /<span role="img" aria-label="non disponibile">—<\/span>/g), dashes);
});

test('cells and meta keep line breaks as <br>; description keeps paragraphs', () => {
  const kb = contents.en.products.find((p) => p.code === 'IT.KB');
  const html = read(productUrl(kb, 'en'));
  const paras = kb.short.split('\n').filter(Boolean);
  assert.equal(count(html.match(/<div class="desc">[\s\S]*?<\/div>/)[0], /<p>/g) + (paras[0].endsWith(':') ? 1 : 0), paras.length);
  assert.ok(html.match(/<div class="meta">[\s\S]*?<br>[\s\S]*?<\/div>/));
  const cc = contents.en.products.find((p) => p.code === 'IT.CC');
  const ccHtml = read(productUrl(cc, 'en'));
  assert.ok(ccHtml.includes('<b>ItalTherm Continuous Casting Machine:</b>'), 'lead line ending with ":" is bold');
});

test('gallery thumbs only when a product has more than one usable image', () => {
  for (const lang of ['en', 'it']) {
    for (const prod of contents[lang].products) {
      const html = read(productUrl(prod, lang));
      const usable = prod.images.filter((u) => existsSync(path.join(ROOT, 'assets/img/src', decodeURIComponent(u.split('/').pop())))).length;
      const big = html.match(/<div class="big">([\s\S]*?)<\/div>/)[1];
      assert.equal(count(big, /<img /g), usable, prod.slug);
      assert.equal(html.includes('<div class="th"'), usable > 1, `${prod.slug} thumbs`);
      if (usable > 1) assert.equal(count(html.match(/<div class="th"[^>]*>[\s\S]*?<\/div>/)[0], /<button /g), usable);
    }
  }
});

test('PDF link points to a local file that exists and opens safely in a new tab', () => {
  for (const lang of ['en', 'it']) {
    for (const prod of contents[lang].products) {
      const html = read(productUrl(prod, lang));
      const m = html.match(/<a class="pdf" href="([^"]+)"([^>]*)>/);
      assert.ok(m, `${prod.slug} pdf link`);
      assert.equal(m[1], `/assets/docs/${prod.slug}.pdf`);
      assert.ok(existsSync(path.join(ROOT, m[1].slice(1))), m[1]);
      assert.match(m[2], /target="_blank"/);
      assert.match(m[2], /rel="noopener"/);
      assert.ok(html.includes(prod.download_label));
    }
  }
});
