// Seeds content/en/products/*.json from content/original/products.json (values copied programmatically).
// Specs stay empty here; a later task fills them.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const original = JSON.parse(await readFile(path.join(root, 'content/original/products.json'), 'utf8'));
const GROUPS = { cc: 'melt', gt: 'melt', mt: 'melt', sm: 'melt', af: 'heat', bf: 'heat', cwa: 'heat', kb: 'prod', gms: 'prod', gmb: 'prod', fm: 'prod' };
const outDir = path.join(root, 'content/en/products');
await mkdir(outDir, { recursive: true });

for (const [key, p] of Object.entries(original)) {
  const slug = `it-${key}`;
  const intro = p.short.find(([tag]) => tag === 'p');
  const pdf = (p.short_links || []).find((l) => l.toLowerCase().endsWith('.pdf')) || '';
  const product = {
    slug,
    code: `IT.${key.toUpperCase()}`,
    title: p.title,
    short: intro ? intro[1] : '',
    specs: { columns: [], rows: [] },
    images: [],
    pdf,
    meta: p.meta || '',
    group: GROUPS[key],
  };
  await writeFile(path.join(outDir, `${slug}.json`), JSON.stringify(product, null, 2) + '\n');
}
console.log(`seeded ${Object.keys(original).length} products`);
