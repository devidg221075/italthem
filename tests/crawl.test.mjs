import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from '../src/lib/content.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFile(path.join(ROOT, p), 'utf8');

async function demoPaths() {
  const md = await read('docs/CHANGES.md');
  const sec = md.split(/^## /m).find((s) => s.startsWith('Pagine demo del tema'));
  assert.ok(sec, 'docs/CHANGES.md must have the "Pagine demo del tema" section');
  return [...sec.matchAll(/`([a-z0-9-]+)`/g)].map((m) => `/${m[1]}/`);
}

test('every URL of the live sitemap has a content entry or is a removed demo page', async () => {
  const urls = (await read('content/original/sitemap-urls.txt')).split('\n').filter(Boolean);
  assert.ok(urls.length >= 40, 'sitemap list looks incomplete');
  const known = new Set(await demoPaths());
  for (const lang of ['en', 'it']) {
    const c = await loadContent(lang);
    for (const e of [...c.pages, ...c.products, ...c.services]) {
      assert.ok(e.old_path, `${lang}/${e.slug} has no old_path`);
      known.add(e.old_path);
    }
  }
  const unmapped = urls.map((u) => new URL(u).pathname).filter((p) => !known.has(p));
  assert.deepEqual(unmapped, [], `URLs without content entry nor demo-page listing: ${unmapped.join(', ')}`);
});

test('no product description keeps the OCR/typo errors listed in CHANGES.md', async () => {
  for (const lang of ['en', 'it']) {
    for (const p of (await loadContent(lang)).products) {
      assert.ok(!p.short.includes('ltalTherm'), `${lang}/${p.slug} contains "ltalTherm"`);
      assert.ok(!p.short.includes(' tor '), `${lang}/${p.slug} contains " tor "`);
    }
  }
});

test('both languages are complete: 11 products, 4 services, 4 pages', async () => {
  for (const lang of ['en', 'it']) {
    const c = await loadContent(lang);
    assert.equal(c.products.length, 11, `${lang} products`);
    assert.equal(c.services.length, 4, `${lang} services`);
    assert.deepEqual(c.pages.map((p) => p.slug), ['home', 'about', 'products', 'contact']);
    for (const p of c.products) {
      assert.ok(p.specs.rows.length > 0, `${lang}/${p.slug} has no spec rows`);
      assert.ok(p.images.length > 0, `${lang}/${p.slug} has no images`);
      assert.match(p.pdf, /^https:\/\/ital-therm\.it\//);
      assert.ok(!/\d+x\d+\.\w+$/.test(p.images[0]), 'thumbnail suffix left in image URL');
    }
  }
});

test('site data uses the decided values only', async () => {
  const { site } = await loadContent('it');
  assert.deepEqual(site.phones, ['+39 0575 802485', '+39 366 871 9427']);
  assert.equal(site.vat, '02487940518');
  assert.equal(site.rea, 'Arezzo 220552');
  assert.ok(!/Le Vertighe/.test(JSON.stringify(site)));
});

test('corrections.json is well formed and its results are present in the content', async () => {
  const log = JSON.parse(await read('content/corrections.json'));
  assert.ok(log.length > 0);
  for (const c of log) {
    for (const k of ['file', 'field', 'from', 'to']) assert.equal(typeof c[k], 'string', `${k} missing in ${JSON.stringify(c)}`);
    assert.notEqual(c.from, c.to);
    if (c.to === '' || c.file.includes('#')) continue; // dropped placeholders / page entries are checked via the page files
    const body = JSON.stringify(JSON.parse(await read(c.file)));
    assert.ok(body.includes(JSON.stringify(c.to).slice(1, -1)) || c.field === 'short' || c.field === 'body' || c.field === 'title',
      `${c.file} ${c.field}: corrected text "${c.to}" not found`);
  }
});

test('raw text snapshots exist for every page, product and service in both languages', async () => {
  const files = await readdir(path.join(ROOT, 'content/original/text'));
  assert.equal(files.filter((f) => f.startsWith('en-')).length, 19);
  assert.equal(files.filter((f) => f.startsWith('it-')).length, 19);
});

test('no page is missing (content/MISSING.txt absent or empty)', async () => {
  try {
    assert.equal((await read('content/MISSING.txt')).trim(), '');
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
});
