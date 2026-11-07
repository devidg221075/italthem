import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadContent } from '../src/lib/content.mjs';

test('loadContent("en") returns 11 products with slug, title, short', async () => {
  const c = await loadContent('en');
  assert.equal(c.products.length, 11);
  for (const p of c.products) {
    for (const f of ['slug', 'code', 'title', 'short']) {
      assert.ok(typeof p[f] === 'string' && p[f].length > 0, `${p.slug}.${f}`);
    }
    assert.ok(['melt', 'heat', 'prod'].includes(p.group));
    assert.deepEqual(Object.keys(p.specs), ['columns', 'rows']);
  }
  assert.ok(Array.isArray(c.pages) && Array.isArray(c.services));
  assert.ok(c.site.name && c.site.vat && c.site.email);
});

test('loadContent throws naming file and field for a product missing short', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'content-'));
  try {
    await mkdir(path.join(root, 'en', 'products'), { recursive: true });
    await writeFile(path.join(root, 'en', 'site.json'), JSON.stringify({ name: 'X', vat: '1', rea: '1', email: 'a@b.c', phones: [], address: 'a' }));
    await writeFile(path.join(root, 'en', 'pages.json'), '[]');
    await writeFile(path.join(root, 'en', 'products', 'broken.json'),
      JSON.stringify({ slug: 'broken', code: 'IT.X', title: 'T', specs: { columns: [], rows: [] }, images: [], pdf: '', meta: '', group: 'melt' }));
    await assert.rejects(() => loadContent('en', root), (e) => {
      assert.match(e.message, /broken\.json/);
      assert.match(e.message, /short/);
      return true;
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('loadContent rejects unknown language', async () => {
  await assert.rejects(() => loadContent('fr'), /language/);
});
