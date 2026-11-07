import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../src/lib/content.mjs';
import { renderPage, layout, displayTitle } from '../src/lib/render.mjs';
import { pageUrl } from '../src/lib/routes.mjs';

const year = String(new Date().getFullYear());
const count = (s, re) => (s.match(re) || []).length;

for (const lang of ['en', 'it']) {
  test(`renderPage ${lang}: structure`, async () => {
    const c = await loadContent(lang);
    for (const page of c.pages) {
      const html = renderPage(page, lang, c.site);
      assert.match(html, /^<!doctype html>/i);
      assert.match(html, new RegExp(`<html lang="${lang}"`));
      assert.equal(count(html, /<h1[\s>]/g), 1, page.slug);
      assert.ok(!/lorem ipsum/i.test(html));
      assert.match(html, new RegExp(`<span data-year>${year}</span>`));
      assert.ok(html.includes(`© <span data-year>${year}</span> ITALTHERM S.r.l.`));
      assert.equal(count(html.match(/<nav[^>]*>[\s\S]*?<\/nav>/)[0], /<a /g), 4);
      for (const ph of c.site.phones) assert.ok(count(html, new RegExp(ph.replace('+', '\\+'), 'g')) >= 2, ph);
      assert.ok(html.includes(c.site.email) && html.includes(c.site.vat) && html.includes(c.site.rea));
    }
  });
}

test('language switcher links to the same page in the other language', async () => {
  const en = await loadContent('en');
  const about = en.pages.find((p) => p.slug === 'about');
  const html = renderPage(about, 'en', en.site);
  assert.ok(html.includes(`href="${pageUrl('about', 'it')}"`));
  assert.equal(pageUrl('about', 'it'), '/it/chi-siamo/');
  assert.equal(pageUrl('home', 'en'), '/en/');
  const it = await loadContent('it');
  const home = renderPage(it.pages.find((p) => p.slug === 'home'), 'it', it.site);
  assert.ok(home.includes('href="/en/"'));
  assert.ok(home.includes('>Chi siamo<'));
});

test('all content values are HTML-escaped', async () => {
  const en = await loadContent('en');
  const page = { slug: 'x', title: '<script>alert(1)</script>', lead: '<b>l</b>', sections: [{ heading: '<i>h</i>', blocks: [{ type: 'p', text: '<img src=x>' }, { type: 'list', items: ['<u>a</u>'] }] }] };
  const html = renderPage(page, 'en', en.site);
  assert.ok(!html.includes('<script>alert'));
  assert.ok(!html.includes('<img src=x>') && !html.includes('<u>a</u>') && !html.includes('<i>h</i>'));
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  const l = layout({ lang: 'en', slug: 'x', title: '"><x>', description: '"><y>', body: '<h1>t</h1>', site: en.site });
  assert.ok(!l.includes('"><x>') && !l.includes('"><y>'));
});

test('displayTitle', () => {
  assert.equal(displayTitle('GEAR-DRIVEN TILTING METAL MELTING FURNACE MODEL IT.GT'), 'Gear-Driven Tilting Metal Melting Furnace Model IT.GT');
  assert.equal(displayTitle('CONTROLLED ATMOSPHERE WIRE ANNEALING FURNACE MODEL IT.CWA'), 'Controlled Atmosphere Wire Annealing Furnace Model IT.CWA');
  assert.equal(displayTitle('FURNACE FOR THE GOLD AND SILVER'), 'Furnace for the Gold and Silver');
  assert.equal(displayTitle('THE FURNACE'), 'The Furnace');
});
