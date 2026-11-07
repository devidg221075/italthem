import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { imageAttrs, imageUrl, imgTag, hasImage, sourceName } from '../src/lib/images.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const OPT = path.join(ROOT, 'assets/img/opt');
const SRC = path.join(ROOT, 'assets/img/src');
const manifest = JSON.parse(readFileSync(path.join(OPT, 'manifest.json'), 'utf8'));

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, out); else out.push(f);
  }
  return out;
}
let pages; // [{rel, html}]
before(() => {
  execFileSync('node', ['build.mjs'], { cwd: ROOT, stdio: 'pipe' });
  pages = walk(DIST).filter((f) => f.endsWith('.html')).map((f) => ({ rel: path.relative(DIST, f), html: readFileSync(f, 'utf8') }));
});

const allImgs = (html) => [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
// The logo is the supplied SVG (not an optimized photo): it is checked separately, photos go through the WebP pipeline.
const isLogo = (t) => /\ssrc="\/assets\/img\/italtherm\.svg"/.test(t);
const imgs = (html) => allImgs(html).filter((t) => !isLogo(t));
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const has = (tag, name) => new RegExp(`\\s${name}(=|\\s|>)`).test(tag);
const distFile = (url) => path.join(DIST, decodeURIComponent(url.replace(/^\//, '')));
const srcsetUrls = (v) => v.split(',').map((x) => x.trim().split(/\s+/)[0]);

test('manifest: every original has WebP variants that exist, are never upscaled and match their hash', () => {
  const originals = readdirSync(SRC).filter((f) => /\.jpe?g$/i.test(f));
  assert.deepEqual(Object.keys(manifest).sort(), originals.sort(), 'manifest covers exactly the originals');
  const listed = new Set(['manifest.json']);
  for (const [name, e] of Object.entries(manifest)) {
    assert.ok(e.width > 0 && e.height > 0, name);
    assert.ok(e.variants.length >= 1, name);
    const ws = e.variants.map((v) => v.w);
    assert.deepEqual(ws, [...ws].sort((a, b) => a - b), `${name} variants ascending`);
    for (const v of e.variants) {
      assert.equal(v.format, 'webp');
      assert.ok(v.w <= e.width, `${name}: ${v.w}px variant of a ${e.width}px source is an upscale`);
      assert.match(v.file, /-\d+\.[0-9a-f]{8}\.webp$/, v.file);
      assert.ok(v.file.includes(`-${v.w}.`), v.file);
      const buf = readFileSync(path.join(OPT, v.file));
      assert.equal(createHash('sha1').update(buf).digest('hex').slice(0, 8), v.file.match(/\.([0-9a-f]{8})\.webp$/)[1], `hash of ${v.file}`);
      assert.equal(buf.subarray(0, 4).toString(), 'RIFF');
      assert.equal(buf.subarray(8, 12).toString(), 'WEBP');
      listed.add(v.file);
    }
    for (const w of [480, 960, 1600]) if (w <= e.width) assert.ok(ws.includes(w), `${name} has ${w}`);
    if (e.width < 480) assert.deepEqual(ws, [e.width], `${name}: narrow source keeps its own width`);
  }
  assert.deepEqual(readdirSync(OPT).sort(), [...listed].sort(), 'no stray files in assets/img/opt');
});

test('imageAttrs: src is the largest variant up to 960px, srcset lists the variants, width/height are the src intrinsic size', () => {
  const name = 'Contr.-atmosphere-annealing-furnace_AF400-3-1.jpg'; // 1600x1067 source
  const a = imageAttrs(`https://ital-therm.it/wp-content/uploads/${name}`, { sizes: '50vw', alt: 'x' });
  assert.match(a.src, /-960\.[0-9a-f]{8}\.webp$/);
  assert.equal(srcsetUrls(a.srcset).length, 3);
  assert.match(a.srcset, / 1600w$/);
  assert.equal(a.width, 960);
  assert.equal(a.height, Math.round((960 * 1067) / 1600));
  assert.equal(a.loading, 'lazy');
  assert.equal(a.decoding, 'async');
  assert.equal(a.fetchpriority, undefined);
  assert.match(imageUrl(name), /-1600\.[0-9a-f]{8}\.webp$/, 'imageUrl is the largest variant');
  const p = imageAttrs(name, { sizes: '50vw', priority: true });
  assert.equal(p.fetchpriority, 'high');
  assert.equal(p.loading, undefined);
  // never upscaled: a 285px source only has its own width
  const small = imageAttrs('AUTOMATIC-BULLION-BARS-PRODUCTION-SYSTEM-Mod-IT_1.jpg', { sizes: '96px' });
  assert.equal(small.width, 285);
  assert.equal(small.srcset.split(',').length, 1);
  assert.ok(hasImage('AUTOMATIC-BULLION-BARS-PRODUCTION-SYSTEM-Mod-IT_1.jpg') && !hasImage('nope.jpg'));
  assert.equal(sourceName('https://x.test/a/B%20C.jpg?x=1'), 'B C.jpg');
  assert.throws(() => imageAttrs('nope.jpg', {}), /manifest/);
});

test('imgTag escapes the alt text and keeps an empty alt attribute', () => {
  const t = imgTag('Contr.-atmosphere-annealing-furnace_AF400.jpg', { alt: 'A "B" <c>', sizes: '50vw', cls: 'on' });
  assert.match(t, /alt="A &quot;B&quot; &lt;c&gt;"/);
  assert.match(imgTag('Contr.-atmosphere-annealing-furnace_AF400.jpg', { sizes: '96px' }), /alt=""/);
  assert.match(t, /^<img class="on" src=/);
});

test('every <img> in every built page has alt, width, height and decoding', () => {
  let n = 0;
  for (const { rel, html } of pages) {
    for (const tag of allImgs(html).filter(isLogo)) {
      assert.ok(has(tag, 'alt') && attr(tag, 'alt') === 'ItalTherm', `${rel}: logo alt`);
      assert.match(attr(tag, 'width') ?? '', /^\d+$/); assert.match(attr(tag, 'height') ?? '', /^\d+$/);
      assert.equal(attr(tag, 'decoding'), 'async', `${rel}: logo decoding`);
      assert.ok(existsSync(distFile(attr(tag, 'src'))), `${rel}: logo file ships`);
    }
    for (const tag of imgs(html)) {
      n++;
      assert.ok(has(tag, 'alt'), `${rel}: alt in ${tag}`);
      assert.match(attr(tag, 'width') ?? '', /^\d+$/, `${rel}: width in ${tag}`);
      assert.match(attr(tag, 'height') ?? '', /^\d+$/, `${rel}: height in ${tag}`);
      assert.equal(attr(tag, 'decoding'), 'async', `${rel}: decoding in ${tag}`);
      assert.ok(attr(tag, 'srcset') && attr(tag, 'sizes'), `${rel}: srcset+sizes in ${tag}`);
    }
  }
  assert.ok(n > 100, `found ${n} images`);
});

test('exactly one image per page is not lazy, and it is the fetchpriority=high LCP image', () => {
  for (const { rel, html } of pages) {
    const all = imgs(html);
    if (!all.length) continue;
    // The mega menu photos in the header are always lazy; a page whose <main> has photos has exactly one LCP image.
    const inMain = imgs(html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? '');
    const eager = all.filter((t) => attr(t, 'loading') !== 'lazy');
    assert.equal(eager.length, inMain.length ? 1 : 0, `${rel}: ${eager.length} non-lazy images`);
    assert.equal(all.filter((t) => has(t, 'fetchpriority')).length, eager.length, `${rel}: one fetchpriority per LCP image`);
    for (const t of eager) assert.equal(attr(t, 'fetchpriority'), 'high', rel);
    for (const t of all.filter((x) => !eager.includes(x))) assert.equal(attr(t, 'loading'), 'lazy', `${rel}: ${t}`);
  }
});

test('every src and srcset URL exists in dist, is an optimized WebP, and no original ships', () => {
  for (const { rel, html } of pages) {
    for (const tag of imgs(html)) {
      for (const u of [attr(tag, 'src'), ...srcsetUrls(attr(tag, 'srcset'))]) {
        assert.match(u, /^\/assets\/img\/opt\/.+-\d+\.[0-9a-f]{8}\.webp$/, `${rel}: ${u}`);
        assert.ok(existsSync(distFile(u)), `${rel}: ${u} missing in dist`);
      }
    }
  }
  assert.ok(!existsSync(path.join(DIST, 'assets/img/src')), 'originals are not shipped');
  assert.ok(!walk(DIST).some((f) => /\.jpe?g$/i.test(f)), 'no JPEG in dist');
  assert.ok(existsSync(path.join(DIST, 'assets/img/opt/manifest.json')));
});

test('og:image points at an optimized absolute URL that exists', () => {
  for (const { rel, html } of pages) {
    const og = html.match(/<meta property="og:image" content="([^"]*)"/)?.[1];
    if (!og) continue;
    assert.match(og, /^https:\/\/ital-therm\.it\/assets\/img\/opt\/.+-(960|1600|\d+)\.[0-9a-f]{8}\.webp$/, rel);
    assert.ok(existsSync(distFile(new URL(og).pathname)), `${rel}: ${og}`);
  }
});

test('LCP image preload exists only on home and product pages and matches the page LCP <img>', () => {
  let withPreload = 0;
  for (const { rel, html } of pages) {
    const links = [...html.matchAll(/<link rel="preload" as="image"[^>]*>/g)].map((m) => m[0]);
    const isHome = /^(en|it)\/index\.html$/.test(rel);
    const isProduct = /^(en\/products|it\/prodotti)\/[^/]+\/index\.html$/.test(rel);
    if (!isHome && !isProduct) { assert.equal(links.length, 0, `${rel} must not preload an image`); continue; }
    assert.equal(links.length, 1, rel);
    withPreload++;
    const link = links[0];
    assert.equal(attr(link, 'fetchpriority'), 'high');
    for (const u of srcsetUrls(attr(link, 'imagesrcset'))) assert.ok(existsSync(distFile(u)), `${rel}: ${u}`);
    assert.ok(attr(link, 'imagesizes'));
    const lcp = imgs(html).find((t) => attr(t, 'fetchpriority') === 'high');
    assert.equal(attr(link, 'imagesrcset'), attr(lcp, 'srcset'), `${rel}: preload srcset equals the LCP img srcset`);
    assert.equal(attr(link, 'imagesizes'), attr(lcp, 'sizes'), rel);
    assert.ok(html.indexOf(link) < html.indexOf('rel="stylesheet"'), `${rel}: preload comes before the stylesheet`);
  }
  assert.equal(withPreload, 2 + 2 * 11, 'home x2 + 11 products x2');
});

test('Inter latin is preloaded (and declared with font-display swap), CSS in head, JS deferred, color-scheme set', () => {
  const css = readFileSync(path.join(ROOT, 'assets/css/site.css'), 'utf8');
  assert.match(css, /@font-face\{font-family:"Inter"[^}]*font-display:swap[^}]*inter-latin-var\.woff2/);
  assert.ok(existsSync(path.join(DIST, 'assets/fonts/inter-latin-var.woff2')));
  const SITE = pages.filter((p) => !['index.html'].includes(p.rel));
  assert.ok(SITE.length > 30);
  for (const { rel, html } of SITE) {
    const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
    assert.match(head, /<link rel="preload" as="font" type="font\/woff2" crossorigin href="\/assets\/fonts\/inter-latin-var\.woff2">/, rel);
    assert.ok(!head.includes('inter-latin-ext'), `${rel}: only the Latin file is preloaded`);
    assert.match(head, /<meta name="color-scheme" content="light">/, rel);
    assert.ok(head.includes('<script>document.documentElement.classList.add("js")</script>'), `${rel}: js class is set before first paint (no layout shift when the carousel controls appear)`);
    assert.match(head, /<link rel="stylesheet" href="\/assets\/css\/site\.css\?v=[0-9a-f]{8}">/, rel);
    for (const s of html.matchAll(/<script\b[^>]*\bsrc=[^>]*>/g)) assert.match(s[0], /\bdefer\b/, `${rel}: ${s[0]}`);
  }
});

test('LCP images stay small (home <= 120 KB, product pages <= 150 KB, 1600 px variants excluded)', () => {
  for (const { rel, html } of pages) {
    const lcp = imgs(html).find((t) => attr(t, 'fetchpriority') === 'high');
    if (!lcp) continue;
    for (const u of srcsetUrls(attr(lcp, 'srcset')).filter((x) => !/-1600\./.test(x))) {
      const max = /^(en|it)\/index\.html$/.test(rel) ? 120 : 150;
      assert.ok(statSync(distFile(u)).size <= max * 1024, `${rel}: ${u} ${statSync(distFile(u)).size}`);
    }
  }
});
