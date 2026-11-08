import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from '../src/lib/content.mjs';
import { buildPages } from '../src/lib/site-pages.mjs';
import { productUrl, serviceUrl } from '../src/lib/routes.mjs';
import { imageUrl } from '../src/lib/images.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const read = (rel) => readFileSync(path.join(DIST, rel), 'utf8');
const count = (s, re) => (s.match(re) || []).length;

let contents;
let pages;
before(async () => {
  execFileSync('node', ['build.mjs'], { cwd: ROOT, stdio: 'pipe' });
  contents = { en: await loadContent('en'), it: await loadContent('it') };
  pages = buildPages(contents);
});

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const htmlFiles = () => walk(DIST).filter((f) => f.endsWith('.html')).map((f) => path.relative(DIST, f));

test('expected files exist for both languages', () => {
  const expected = ['index.html',
    'en/index.html', 'en/about-us/index.html', 'en/products/index.html', 'en/contact/index.html',
    'it/index.html', 'it/chi-siamo/index.html', 'it/prodotti/index.html', 'it/contatti/index.html'];
  for (const l of ['en', 'it']) {
    const dir = l === 'en' ? 'services' : 'servizi';
    for (const s of contents[l].services) expected.push(`${l}/${dir}/${s.slug}/index.html`);
    assert.equal(contents[l].services.length, 4);
  }
  for (const f of expected) assert.ok(existsSync(path.join(DIST, f)), f);
  assert.ok(existsSync(path.join(DIST, 'assets/css/site.css')));
  assert.ok(existsSync(path.join(DIST, 'assets/js/site.js')));
});

test('buildPages lists every page with url, file and alternates', () => {
  assert.equal(pages.length, 42, "40 + cookie policy x2");
  for (const p of pages) {
    for (const k of ['lang', 'slug', 'url', 'type', 'title', 'file', 'alternates']) assert.ok(p[k] !== undefined, `${p.url} ${k}`);
    assert.ok(existsSync(path.join(DIST, p.file)), p.file);
    assert.equal(p.alternates.length, 2);
    assert.ok(p.alternates.some((a) => a.lang === p.lang && a.url === p.url));
  }
  assert.deepEqual(pages.filter((p) => p.lang === 'it' && p.type === 'service').map((p) => p.url.split('/')[2]), ['servizi', 'servizi', 'servizi', 'servizi']);
});

test('route helpers', () => {
  assert.equal(productUrl({ slug: 'it-cc' }, 'en'), '/en/products/it-cc/');
  assert.equal(productUrl({ slug: 'it-cc' }, 'it'), '/it/prodotti/it-cc/');
  assert.equal(serviceUrl({ slug: 'x' }, 'it'), '/it/servizi/x/');
  const opt = /^\/assets\/img\/opt\/CONTROLLED-ATMOSPHERE-WIRE-ANNEALING-FURNACE-MODEL-IT-960\.[0-9a-f]{8}\.webp$/;
  assert.match(imageUrl('https://ital-therm.it/wp-content/uploads/2026/04/CONTROLLED-ATMOSPHERE-WIRE-ANNEALING-FURNACE-MODEL-IT.jpg'), opt);
  assert.equal(imageUrl('CONTROLLED-ATMOSPHERE-WIRE-ANNEALING-FURNACE-MODEL-IT.jpg'), imageUrl('https://x.test/a/CONTROLLED-ATMOSPHERE-WIRE-ANNEALING-FURNACE-MODEL-IT.jpg'));
});

for (const lang of ['en', 'it']) {
  test(`${lang} home: hero, rail, service tiles`, () => {
    const html = read(`${lang}/index.html`);
    const hero = html.match(/<section class="hero"[\s\S]*?<\/section>/)[0];
    assert.equal(count(hero, /<div class="m[ "]/g), 5, 'IT.KB, IT.GT, IT.CC, IT.AF, IT.GMS');
    assert.equal(count(hero, /<li><a href="\/[^"]+\/(products|prodotti)\/it-(cc|gt|af|gms)\/">/g), 4, 'category row: IT.CC, IT.GT, IT.AF, IT.GMS');
    assert.deepEqual([...hero.matchAll(/<b>(IT\.[A-Z]+)<\/b>/g)].map((m) => m[1]), ['IT.CC', 'IT.GT', 'IT.AF', 'IT.GMS']);
    assert.equal(count(hero.split('<div class="dots"')[1], /<button type="button"/g), 5);
    assert.equal(count(hero, /<h1>/g), 1);
    const rail = html.match(/<div class="rail">[\s\S]*?<\/div><\/div><\/section>/)[0];
    assert.equal(count(rail, /class="pc"/g), 11);
    const svt = html.match(/<div class="svt">[\s\S]*?<\/div><\/div><\/section>/)[0];
    assert.equal(count(svt, /<a href="\/[^"]+\/(services|servizi)\/[^"]+\/">/g), 4);
    assert.equal(count(html, /loading="lazy"/g) > 0, true);
    // only the first hero image is eager
    assert.ok(/<div class="m on">\s*<img(?![^>]*loading=)/.test(html));
  });
}

test('en home: taglines, about excerpt and contact band come from content', () => {
  const html = read('en/index.html');
  for (const t of ['High-technology systems', 'Exceptional value', 'Precision Meets Affordability']) assert.ok(html.includes(`<div>${t}</div>`), t);
  assert.ok(html.includes('Founded by a team of experienced engineers'));
  assert.ok(html.includes('href="tel:+390575802485"') && html.includes('href="mailto:info@ital-therm.it"'));
  assert.ok(html.includes('<h1>Industrial furnaces for precious metals</h1>'), 'hero title from the approved mockup');
});

test('hero uses the machine overview photos', () => {
  const html = read('en/index.html');
  const stage = html.match(/<div class="stage">[\s\S]*?<\/div><\/div>/)[0];
  assert.match(stage, /furnace_AF400-(480|960)\.[0-9a-f]{8}\.webp/);
  assert.ok(!stage.includes('AF400-3-1'));
  assert.match(stage, /GEAR-DRIVEN-TILTING-METAL-MELTING-FURNACE-MODEL-IT-(480|960)/, 'IT.GT is the second slide');
  assert.match(stage.split('<div class="m"')[0], /Mod-IT-hero-(480|960|1600)\.[0-9a-f]{8}\.webp/, 'IT.KB (high-resolution photo supplied by the owner) is the first slide = LCP');
});

test('service pages render the body blocks verbatim', () => {
  const s = contents.en.services.find((x) => x.slug === 'italtherm-annealing-furnaces');
  const html = read('en/services/italtherm-annealing-furnaces/index.html');
  assert.ok(html.includes('<h1>ItalTherm Annealing Furnaces</h1>'));
  assert.ok(html.includes(s.blocks[0].text));
  assert.ok(html.includes('Protective Atmosphere &amp; Rapid Cooling'));
});

test('no Lorem ipsum, exactly one h1, language switch and image alt on every page', () => {
  for (const f of htmlFiles()) {
    const html = read(f);
    assert.ok(!/lorem ipsum/i.test(html), f);
    assert.equal(count(html, /<h1[\s>]/g), 1, f);
    for (const m of html.matchAll(/<img\b[^>]*>/g)) assert.ok(/\balt="/.test(m[0]), `${f}: ${m[0]}`);
    if (f !== 'index.html') assert.ok(!/id="drawer"[^>]*aria-hidden/.test(html), `${f}: static drawer must not be aria-hidden`);
  }
  const svc = read('it/servizi/italtherm-annealing-furnaces/index.html');
  assert.ok(svc.includes('href="/en/services/italtherm-annealing-furnaces/" hreflang="en"'));
});

test('root page links to both languages', () => {
  const html = read('index.html');
  assert.ok(html.includes('http-equiv="refresh"') && html.includes('href="/en/"') && html.includes('href="/it/"'));
});

// Internal links must resolve.
test('every internal href and src resolves to a built file', () => {
  const bad = [];
  for (const f of htmlFiles()) {
    for (const m of read(f).matchAll(/\b(?:href|src)="(\/[^"#?]*)[^"]*"/g)) {
      const url = decodeURI(m[1]);
      const target = url.endsWith('/') ? `${url}index.html` : url;
      if (!existsSync(path.join(DIST, target))) bad.push(`${f} -> ${url}`);
    }
  }
  assert.deepEqual(bad, []);
});
