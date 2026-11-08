import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Header search (lazy overlay) and the cookie policy page.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const read = (rel) => readFileSync(path.join(DIST, rel), 'utf8');
before(() => { execFileSync('node', ['build.mjs'], { cwd: ROOT, stdio: 'pipe' }); });

for (const lang of ['en', 'it']) {
  test(`${lang}: search index has the 11 products with code, title, url and text, plus services and pages`, () => {
    const { items } = JSON.parse(read(`assets/search-${lang}.json`));
    const products = items.filter((i) => i.t === 'p');
    assert.equal(products.length, 11);
    for (const p of products) {
      assert.match(p.c, /^IT\.[A-Z]+$/);
      assert.ok(p.n && p.x.includes(p.c), p.c);
      assert.ok(existsSync(path.join(DIST, p.u.replace(/^\//, ''), 'index.html')), `${p.u} exists`);
    }
    assert.equal(items.filter((i) => i.t === 's').length, 4);
    assert.equal(items.filter((i) => i.t === 'g').length, 5);
    for (const i of items) assert.ok(existsSync(path.join(DIST, i.u.replace(/^\//, ''), 'index.html')), i.u);
    assert.ok(statSync(path.join(DIST, `assets/search-${lang}.json`)).size < 30 * 1024, 'index stays small');
  });

  test(`${lang}: every page has the search button pointing at lazy assets; nothing search-related loads up front`, () => {
    const html = read(lang === 'en' ? 'en/index.html' : 'it/index.html');
    const btn = html.match(/<button class="sb"[^>]*>/)[0];
    assert.ok(btn.includes(`data-index="/assets/search-${lang}.json"`));
    assert.match(btn, /data-js="\/assets\/js\/search\.js\?v=[0-9a-f]{8}"/);
    assert.match(btn, /data-css="\/assets\/css\/search\.css\?v=[0-9a-f]{8}"/);
    assert.ok(btn.includes('aria-label='));
    assert.ok(!/<script src="[^"]*search\.js/.test(html) && !/<link[^>]*search\.css/.test(html), 'search assets are lazy');
  });

  test(`${lang}: cookie policy page has the real cookie, one h1, the company contact and a link from the footer`, () => {
    const file = `${lang}/cookie-policy/index.html`;
    const html = read(file);
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    assert.ok(html.includes('it_notice') && html.includes('mailto:info@ital-therm.it'));
    assert.ok(html.includes(`href="/${lang}/privacy/"`));
    assert.ok(read(`${lang}/index.html`).includes(`href="/${lang}/cookie-policy/"`));
    assert.ok(read(`sitemap-${lang}.xml`).includes(`/${lang}/cookie-policy/`));
  });
}

test('search.js builds the overlay with the DOM API only and site.js loads it on first click', () => {
  const js = readFileSync(path.join(ROOT, 'assets/js/search.js'), 'utf8');
  assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\s*\(/.test(js));
  const site = readFileSync(path.join(ROOT, 'assets/js/site.js'), 'utf8');
  assert.ok(site.includes("'it:search'") && site.includes('data-js') && site.includes('data-css'));
  assert.ok(existsSync(path.join(DIST, 'assets/js/search.js')) && existsSync(path.join(DIST, 'assets/css/search.css')));
});
