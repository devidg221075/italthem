import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Shared chrome from the approved mockups: header with mega menu, mobile drawer, footer, CTA strip.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const read = (rel) => readFileSync(path.join(DIST, rel), 'utf8');
const count = (s, re) => (s.match(re) || []).length;
before(() => { execFileSync('node', ['build.mjs'], { cwd: ROOT, stdio: 'pipe' }); });

const PAGES = { en: { home: 'en/index.html', products: 'en/products/index.html', contact: 'en/contact/index.html', product: 'en/products/it-cc/index.html' }, it: { home: 'it/index.html', products: 'it/prodotti/index.html', contact: 'it/contatti/index.html', product: 'it/prodotti/it-cc/index.html' } };

for (const lang of ['en', 'it']) {
  test(`${lang}: header has the official logo, 4 nav items and the mega menu with the 4 featured machines`, () => {
    const html = read(PAGES[lang].home);
    const header = html.match(/<header class="hdr">[\s\S]*?<\/header>/)[0];
    assert.ok(header.includes('src="/assets/img/italtherm.svg"'));
    const nav = header.match(/<nav[\s\S]*?<\/nav>/)[0];
    assert.equal(count(nav, /data-n="/g), 4);
    assert.ok(nav.includes(lang === 'it' ? '>Azienda<' : '>Company<'));
    const mega = nav.match(/<div class="mega" id="mega">[\s\S]*?<\/div><\/div><\/div>/)[0];
    assert.deepEqual([...mega.matchAll(/<b>(IT\.[A-Z]+)<\/b>/g)].map((m) => m[1]), ['IT.CC', 'IT.GT', 'IT.AF', 'IT.GMS']);
    assert.equal(count(mega, /class="mc"/g), 4);
    const left = mega.match(/<div class="ml">([\s\S]*?)<\/div><div class="mr">/)[1];
    assert.equal(count(left, /<a /g), 5, 'all products + 4 families');
    assert.match(nav, /aria-haspopup="true" aria-expanded="false" aria-controls="mega"/);
  });

  test(`${lang}: mobile drawer has a main panel and a products drill-down panel`, () => {
    const html = read(PAGES[lang].home);
    const drw = html.match(/<div class="drw" id="drawer">[\s\S]*?<\/footer>|<div class="drw" id="drawer">[\s\S]*?<main/)[0];
    assert.equal(count(drw, /<div class="dp /g), 2);
    assert.ok(drw.includes('data-sub'), 'products entry opens the sub panel');
    assert.equal(count(drw.split('class="dp ps"')[1].split('</main')[0], /class="l"/g), 4);
    assert.ok(drw.includes('class="bk"'), 'back button');
  });

  test(`${lang}: footer has brand, navigation, products and contacts, legal row and the data from site.json`, () => {
    const html = read(PAGES[lang].product);
    const ft = html.match(/<footer class="ft">[\s\S]*?<\/footer>/)[0];
    assert.equal(count(ft, /<details class="fd" open>/g), 3);
    assert.ok(ft.includes('P.IVA 02487940518') && ft.includes('REA Arezzo 220552'));
    assert.ok(ft.includes('Viale S. Maria delle Vertighe, 50/B'));
    assert.ok(ft.includes('href="tel:+390575802485"') && ft.includes('href="tel:+393668719427"') && ft.includes('href="mailto:info@ital-therm.it"'));
    assert.ok(!/Le Vertighe, 50|810487|Sonico/.test(ft), 'discarded mockup contact data must not appear');
    assert.equal(count(ft, /it-(cc|gt|af|gms)\/">/g), 4);
  });

  test(`${lang}: CTA strip before the footer on inner pages, not on home and contact (they have their own)`, () => {
    for (const k of ['products', 'product']) assert.equal(count(read(PAGES[lang][k]), /<section class="cta-s">/g), 1, k);
    for (const k of ['home', 'contact']) assert.equal(count(read(PAGES[lang][k]), /<section class="cta-s">/g), 0, k);
  });
}

test('the discarded mockup contact data and the unavailable pages never reach the site', () => {
  for (const f of ['en/index.html', 'it/index.html', 'it/contatti/index.html']) {
    const html = read(f);
    assert.ok(!/810487|Le Vertighe, 50|Sonico/.test(html), f);
    assert.ok(!/Guarda il video|Assistenza</.test(html), `${f}: Video and Assistenza are not built yet`);
  }
});
