import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from '../src/lib/content.mjs';
import { buildPages } from '../src/lib/site-pages.mjs';
import { layout } from '../src/lib/render.mjs';
import { SITE_URL, makeTitle, makeDescription, jsonLd, buildSitemaps, robotsTxt } from '../src/lib/seo.mjs';
import { buildRedirects, buildHtaccess, DEMO_GONE, DEMO_MOVED } from '../src/lib/redirects.mjs';
import { parseRules, simulate } from './helpers/htaccess-sim.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const read = (rel) => readFileSync(path.join(DIST, rel), 'utf8');
const fileOf = (url) => `${url.replace(/^\//, '')}index.html`;

let contents;
let pages;
let redirects;
let htaccess;
before(async () => {
  execFileSync('node', ['build.mjs'], { cwd: ROOT, stdio: 'pipe' });
  contents = { en: await loadContent('en'), it: await loadContent('it') };
  pages = buildPages(contents);
  redirects = buildRedirects(contents);
  htaccess = read('.htaccess');
});

const attr = (html, re) => html.match(re)?.[1];
const ldBlocks = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1].replace(/<\\\//g, '</')));
const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const metaOf = (html, name) => unesc(attr(html, new RegExp(`<meta name="${name}" content="([^"]*)"`)) ?? '');

// ---------------------------------------------------------------- head helpers

test('a title containing $\' or $& is not expanded by String.replace', async () => {
  const site = contents.en.site;
  const html = layout({ lang: 'en', slug: 'x', title: "Pump $' and $& and $` end", description: 'd', body: '<h1>t</h1>', site });
  assert.ok(html.includes('<title>Pump $&#39; and $&amp; and $` end | ITALTHERM</title>'), html.slice(0, 600));
  assert.equal((html.match(/<\/head>/g) || []).length, 1);
});

test('makeTitle: brand suffix, ellipsis only above 70 characters', () => {
  assert.equal(makeTitle('Products'), 'Products | ITALTHERM');
  assert.equal(makeTitle('ITALTHERM – Industrial Furnaces'), 'ITALTHERM – Industrial Furnaces');
  const long = makeTitle('Automatic Bullion Bars Production System With Extra Long Marketing Words IT.KB');
  assert.ok(long.length <= 70 && long.includes('…') && long.endsWith(' | ITALTHERM'), long);
});

test('makeDescription: joins existing text, cuts at a sentence or a word, 120-160 characters', () => {
  assert.equal(makeDescription(['Short one.', 'Second.'], { min: 5 }), 'Short one.');
  const text = 'Alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigma tau upsilon phi chi psi omega alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigma tau upsilon.';
  const d = makeDescription([text]);
  assert.ok(d.length <= 160 && d.length >= 120 && d.endsWith('…') && !/\s…$/.test(d), `${d.length} ${d}`);
  assert.ok(text.startsWith(d.slice(0, -1)));
});

test('jsonLd escapes </ so a value can never close the script', () => {
  const s = jsonLd({ a: '</script><b>' });
  assert.equal((s.match(/<\/script>/g) || []).length, 1);
  assert.ok(s.includes('<\\/script>'));
});

test('nav label is localised', () => {
  assert.ok(read('en/index.html').includes('<nav aria-label="Main">'));
  assert.ok(read('it/index.html').includes('<nav aria-label="Principale">'));
});

// ---------------------------------------------------------------- built pages

// Uniqueness is per language: the four IT service pages carry the original English text (see docs/CHANGES.md), so they repeat the EN ones.
test('every page: unique title, unique 120-160 character description, canonical, robots, theme colour, favicons', () => {
  const titles = new Map();
  const descs = new Map();
  for (const p of pages) {
    const html = read(p.file);
    const title = unesc(attr(html, /<title>([^<]*)<\/title>/) ?? '');
    assert.ok(title && title.length <= 70, `${p.url} title "${title}"`);
    assert.ok(!titles.has(p.lang + title), `${p.url} duplicates title of ${titles.get(p.lang + title)}: ${title}`);
    titles.set(p.lang + title, p.url);
    const d = metaOf(html, 'description');
    assert.ok(d.length >= 120 && d.length <= 160, `${p.url} description ${d.length}: ${d}`);
    assert.ok(!descs.has(p.lang + d), `${p.url} duplicates description of ${descs.get(p.lang + d)}`);
    descs.set(p.lang + d, p.url);
    assert.equal(attr(html, /<link rel="canonical" href="([^"]*)"/), SITE_URL + p.url, p.url);
    assert.equal(metaOf(html, 'robots'), 'index,follow', p.url);
    assert.equal(metaOf(html, 'theme-color'), '#112337');
    assert.ok(html.includes('href="/assets/img/favicon.svg"') && html.includes('rel="apple-touch-icon"'));
    assert.equal((html.match(/<title>/g) || []).length, 1);
  }
});

test('hreflang en/it/x-default on every page, reciprocal, absolute', () => {
  const byUrl = new Map(pages.map((p) => [SITE_URL + p.url, p]));
  for (const p of pages) {
    const html = read(p.file);
    const alts = Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]));
    assert.deepEqual(Object.keys(alts).sort(), ['en', 'it', 'x-default'], p.url);
    assert.equal(alts['x-default'], alts.en, `${p.url} x-default -> en`);
    assert.equal(alts[p.lang], SITE_URL + p.url, `${p.url} self-reference`);
    for (const l of ['en', 'it']) {
      const target = byUrl.get(alts[l]);
      assert.ok(target, `${p.url}: ${l} alternate ${alts[l]} is not a built page`);
      assert.equal(target.lang, l);
      const back = Object.fromEntries([...read(target.file).matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]));
      assert.equal(back[p.lang], SITE_URL + p.url, `${target.url} does not point back to ${p.url}`);
    }
  }
});

test('Open Graph and Twitter tags with an absolute image that exists', () => {
  for (const p of pages) {
    const html = read(p.file);
    const og = (n) => unesc(attr(html, new RegExp(`<meta property="og:${n}" content="([^"]*)"`)) ?? '');
    assert.equal(og('type'), p.type === 'product' ? 'product' : 'website', p.url);
    assert.equal(og('site_name'), 'ITALTHERM');
    assert.equal(og('url'), SITE_URL + p.url);
    assert.equal(og('locale'), p.lang === 'en' ? 'en_US' : 'it_IT');
    assert.equal(attr(html, /<meta property="og:locale:alternate" content="([^"]*)"/), p.lang === 'en' ? 'it_IT' : 'en_US');
    assert.equal(og('title'), unesc(attr(html, /<title>([^<]*)<\/title>/)));
    assert.equal(og('description'), metaOf(html, 'description'));
    const img = og('image');
    assert.ok(img.startsWith(`${SITE_URL}/assets/img/`), `${p.url} og:image ${img}`);
    assert.ok(existsSync(path.join(DIST, decodeURIComponent(img.slice(SITE_URL.length)))), `${p.url} ${img} missing`);
    assert.equal(metaOf(html, 'twitter:card'), 'summary_large_image');
    assert.equal(metaOf(html, 'twitter:image'), img);
  }
});

test('home og:image is the first hero photo', () => {
  assert.match(attr(read('en/index.html'), /<meta property="og:image" content="([^"]*)"/), /\/assets\/img\/src\/CONTROLLED-ATMOSPHERE-WIRE-ANNEALING-FURNACE-MODEL-IT\.jpg$/);
});

test('JSON-LD: Organization, LocalBusiness and WebSite on both homes', () => {
  for (const f of ['en/index.html', 'it/index.html']) {
    const blocks = ldBlocks(read(f));
    const types = blocks.map((b) => b['@type']);
    for (const t of ['Organization', 'LocalBusiness', 'WebSite']) assert.ok(types.includes(t), `${f} ${t}`);
    assert.ok(!types.includes('BreadcrumbList'), 'home has no breadcrumb');
    for (const b of blocks.filter((x) => ['Organization', 'LocalBusiness'].includes(x['@type']))) {
      assert.equal(b.name, 'ITALTHERM S.r.l.');
      assert.equal(b.email, 'info@ital-therm.it');
      assert.equal(b.telephone, '+39 0575 802485');
      assert.equal(b.vatID, '02487940518');
      assert.deepEqual(b.address, { '@type': 'PostalAddress', streetAddress: 'Viale S. Maria delle Vertighe 50/B', addressLocality: 'Monte San Savino', addressRegion: 'AR', postalCode: '52048', addressCountry: 'IT' });
      assert.ok(!('geo' in b) && !('openingHours' in b) && !('aggregateRating' in b));
    }
  }
});

test('JSON-LD: BreadcrumbList on inner pages, Product with sku on all 22 product pages', () => {
  let products = 0;
  for (const p of pages.filter((x) => x.type !== 'home')) {
    const blocks = ldBlocks(read(p.file));
    const bc = blocks.find((b) => b['@type'] === 'BreadcrumbList');
    assert.ok(bc, `${p.url} BreadcrumbList`);
    assert.equal(bc.itemListElement.at(-1).item, SITE_URL + p.url);
    assert.equal(bc.itemListElement[0].item, `${SITE_URL}/${p.lang}/`);
    bc.itemListElement.forEach((it, i) => assert.equal(it.position, i + 1));
    const prod = blocks.find((b) => b['@type'] === 'Product');
    if (p.type !== 'product') { assert.ok(!prod, p.url); continue; }
    products++;
    const src = contents[p.lang].products.find((x) => x.slug === p.key);
    assert.equal(prod.sku, src.code);
    assert.equal(prod.description, src.short.replace(/\s+/g, ' ').trim());
    assert.equal(prod.url, SITE_URL + p.url);
    assert.equal(prod.brand['@type'], 'Organization');
    assert.ok(prod.image.length >= 1 && prod.image.every((u) => u.startsWith(`${SITE_URL}/assets/img/`)));
    assert.ok(!('offers' in prod) && !('aggregateRating' in prod) && !('review' in prod));
  }
  assert.equal(products, 22);
});

test('product descriptions are excerpts of the product text', () => {
  const norm = (s) => s.replace(/\s+/g, ' ').replace(/…$/, '').trim();
  for (const p of pages.filter((x) => x.type === 'product')) {
    const src = contents[p.lang].products.find((x) => x.slug === p.key);
    assert.ok(norm(src.short).includes(norm(metaOf(read(p.file), 'description')).slice(0, 60)), p.url);
  }
});

// ---------------------------------------------------------------- 404 and root

test('/404.html is bilingual, noindex, with links, and is not in the sitemaps', () => {
  const html = read('404.html');
  assert.equal(metaOf(html, 'robots'), 'noindex,follow');
  assert.ok(!html.includes('rel="canonical"') && !html.includes('hreflang="en"'));
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
  for (const href of ['/en/', '/it/', '/en/products/', '/it/prodotti/', '/en/contact/', '/it/contatti/']) assert.ok(html.includes(`href="${href}"`), href);
  assert.ok(html.includes('Page not found') && html.includes('Pagina non trovata'));
  for (const f of ['sitemap-en.xml', 'sitemap-it.xml']) assert.ok(!read(f).includes('404'));
});

test('root language chooser has canonical and hreflang x-default', () => {
  const html = read('index.html');
  assert.equal(attr(html, /<link rel="canonical" href="([^"]*)"/), `${SITE_URL}/en/`);
  assert.ok(html.includes(`<link rel="alternate" hreflang="x-default" href="${SITE_URL}/en/">`));
  assert.ok(html.includes(`hreflang="it" href="${SITE_URL}/it/"`) && html.includes(`hreflang="en" href="${SITE_URL}/en/"`));
  assert.ok(html.includes('http-equiv="refresh"') && html.includes('href="/en/"') && html.includes('href="/it/"'));
});

// ---------------------------------------------------------------- sitemaps and robots

test('sitemaps: index plus one file per language, same URLs as buildPages, hreflang alternates, build-date lastmod', () => {
  const idx = read('sitemap.xml');
  assert.ok(idx.includes('<sitemapindex') && idx.includes(`<loc>${SITE_URL}/sitemap-en.xml</loc>`) && idx.includes(`<loc>${SITE_URL}/sitemap-it.xml</loc>`));
  const set = new Set();
  const today = new Date().toISOString().slice(0, 10);
  for (const l of ['en', 'it']) {
    const xml = read(`sitemap-${l}.xml`);
    assert.ok(xml.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'));
    for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
      const loc = attr(m[1], /<loc>([^<]*)<\/loc>/);
      set.add(loc);
      assert.equal(attr(m[1], /<lastmod>([^<]*)<\/lastmod>/), today);
      const hl = [...m[1].matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map((x) => x[1]).sort();
      assert.deepEqual(hl, ['en', 'it', 'x-default'], loc);
    }
  }
  assert.deepEqual([...set].sort(), pages.map((p) => SITE_URL + p.url).sort());
  assert.equal(set.size, pages.length);
});

test('buildSitemaps is pure and escapes URLs', () => {
  const out = buildSitemaps([{ lang: 'en', url: '/en/a&b/', alternates: [{ lang: 'en', url: '/en/a&b/' }] }], new Date('2030-01-02T00:00:00Z'));
  assert.ok(out['sitemap-en.xml'].includes('/en/a&amp;b/') && out['sitemap-en.xml'].includes('<lastmod>2030-01-02</lastmod>'));
});

test('robots.txt allows everything and points to the sitemap index', () => {
  const r = read('robots.txt');
  assert.equal(r, robotsTxt());
  assert.match(r, /^User-agent: \*$/m);
  assert.match(r, /^Allow: \/$/m);
  assert.match(r, /^Sitemap: https:\/\/ital-therm\.it\/sitemap\.xml$/m);
  assert.ok(!/^Disallow/m.test(r));
});

// ---------------------------------------------------------------- redirects and .htaccess

const old = () => {
  const out = [];
  for (const l of ['en', 'it']) {
    const c = contents[l];
    for (const x of [...c.pages, ...c.products, ...c.services]) if (x.old_path) out.push({ lang: l, old: x.old_path, kind: x.slug });
  }
  return out;
};

test('every content old_path is redirected (or already is its own new URL), with and without trailing slash', () => {
  const rules = parseRules(htaccess);
  const newUrls = new Set(pages.map((p) => p.url));
  let checked = 0;
  for (const o of old()) {
    if (newUrls.has(o.old)) { assert.equal(simulate(rules, o.old).status, 200, `${o.old} must stay`); continue; }
    if (o.old === '/') continue; // language chooser
    for (const v of [o.old, o.old.replace(/\/$/, '')]) {
      const r = simulate(rules, v);
      assert.equal(r.status, 301, `${v}`);
      assert.ok(newUrls.has(r.to), `${v} -> ${r.to} is not a built page`);
      assert.equal(simulate(rules, r.to).status, 200, `${r.to} must not redirect again`);
    }
    checked++;
  }
  assert.ok(checked >= 30, `only ${checked} old paths checked`);
});

test('specific mappings: long About slug, shop, home, product category', () => {
  const rules = parseRules(htaccess);
  const longAbout = contents.en.pages.find((p) => p.slug === 'about').old_path;
  assert.ok(longAbout.length > 100);
  assert.deepEqual(simulate(rules, longAbout), { status: 301, to: '/en/about-us/' });
  assert.deepEqual(simulate(rules, '/shop/'), { status: 301, to: '/en/products/' });
  assert.deepEqual(simulate(rules, '/shop'), { status: 301, to: '/en/products/' });
  assert.deepEqual(simulate(rules, '/it/shop/'), { status: 301, to: '/it/prodotti/' });
  assert.deepEqual(simulate(rules, '/home/'), { status: 301, to: '/en/' });
  assert.deepEqual(simulate(rules, '/product-category/ital-therm/'), { status: 301, to: '/en/products/' });
  assert.deepEqual(simulate(rules, '/it/chi-siamo/'), { status: 200 });
  assert.deepEqual(simulate(rules, '/it/'), { status: 200 });
  assert.match(htaccess, /RewriteRule \^shop\/\?\$ \/en\/products\/\? \[R=301,L\]/);
});

test('410 Gone for every demo page of docs/CHANGES.md, with and without trailing slash, EN and IT paths', () => {
  const changes = readFileSync(path.join(ROOT, 'docs/CHANGES.md'), 'utf8');
  const section = changes.split('## Pagine demo del tema da eliminare')[1].split('\n## ')[0];
  const slugs = [...section.split('\n').find((l) => l.startsWith('`')).matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  assert.ok(slugs.length >= 15, slugs.join());
  assert.deepEqual([...slugs].sort(), [...DEMO_GONE, ...Object.keys(DEMO_MOVED)].sort(), 'redirects.mjs lists exactly the CHANGES.md demo pages');
  const rules = parseRules(htaccess);
  for (const s of slugs) {
    for (const prefix of ['/', '/it/']) {
      for (const v of [`${prefix}${s}/`, `${prefix}${s}`]) {
        const r = simulate(rules, v);
        if (s in DEMO_MOVED) assert.equal(r.status, 301, v);
        else assert.deepEqual(r, { status: 410 }, v);
      }
    }
  }
  for (const s of ['blog-grid', 'faqs', 'projects-gird', 'pricing', 'cart', 'cart-2', 'checkout', 'checkout-2', 'my-account', 'testimonials', 'team-grid', 'services-gird', 'content-from-mizox']) assert.ok(DEMO_GONE.includes(s), s);
  assert.deepEqual(simulate(rules, '/italtherm-continuous-casting-machine/'), { status: 301, to: '/en/about-us/' });
});

test('redirect map: no loops, no duplicates, only 301 with a target or 410', () => {
  const froms = new Set();
  const tos = new Set(redirects.filter((r) => r.status === 301).map((r) => r.to));
  for (const r of redirects) {
    assert.ok(r.status === 301 || r.status === 410);
    assert.equal(r.status === 301, typeof r.to === 'string', r.from);
    assert.ok(r.from.startsWith('/'));
    assert.ok(!froms.has(r.from.replace(/\/$/, '')), `duplicate ${r.from}`);
    froms.add(r.from.replace(/\/$/, ''));
    assert.notEqual(r.from, r.to);
  }
  for (const t of tos) assert.ok(!froms.has(t.replace(/\/$/, '')), `target ${t} is itself redirected`);
  assert.equal(buildHtaccess([{ from: '/a/', to: '/b/', status: 301 }, { from: '/c', status: 410 }]).match(/RewriteRule \^[ac]\/\?\$ .*/g).join('|'), 'RewriteRule ^a/?$ /b/? [R=301,L]|RewriteRule ^c/?$ - [G,L]');
});

test('.htaccess hardening: contact-lib denied, canonical host, headers, caching, errors', () => {
  assert.match(htaccess, /<FilesMatch "\^\(contact-lib\\\.php\)\$">\s*Require all denied\s*<\/FilesMatch>/);
  assert.match(htaccess, /Options -Indexes -MultiViews/);
  assert.match(htaccess, /RewriteCond %\{HTTPS\} off/);
  assert.match(htaccess, /RewriteCond %\{HTTP_HOST\} \^www\\\. \[NC\]/);
  assert.match(htaccess, /RewriteRule \^ https:\/\/ital-therm\.it%\{REQUEST_URI\} \[R=301,L\]/);
  for (const h of ['X-Content-Type-Options "nosniff"', 'Referrer-Policy "strict-origin-when-cross-origin"', 'X-Frame-Options "SAMEORIGIN"', 'Permissions-Policy "camera=(), microphone=(), geolocation=()"']) assert.ok(htaccess.includes(h), h);
  assert.match(htaccess, /public, max-age=31536000, immutable/);
  assert.match(htaccess, /public, max-age=2592000/);
  assert.match(htaccess, /Cache-Control "no-cache"/);
  assert.match(htaccess, /AddDefaultCharset utf-8/);
  assert.match(htaccess, /ErrorDocument 404 \/404\.html/);
  assert.match(htaccess, /ErrorDocument 410 \/404\.html/);
  assert.match(htaccess, /DirectoryIndex index\.html/);
  // every module-specific directive sits inside an IfModule guard
  let depth = 0;
  for (const line of htaccess.split('\n')) {
    if (/^\s*<IfModule/.test(line)) depth++;
    else if (/^\s*<\/IfModule/.test(line)) depth--;
    else if (/^\s*(php_flag|php_value|Header |ExpiresActive|ExpiresByType|AddOutputFilterByType)/.test(line)) assert.ok(depth > 0, `unguarded: ${line}`);
  }
  assert.equal(depth, 0);
  assert.ok(!htaccess.includes('{{'), 'no unfilled placeholder');
});

test('php -l is still clean', () => {
  for (const f of ['server/contact-lib.php', 'server/contact.php']) {
    const r = spawnSync('php', ['-l', f], { cwd: ROOT, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
  }
});
