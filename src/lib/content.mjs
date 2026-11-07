import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../content');
const LANGS = ['en', 'it'];
const GROUPS = ['melt', 'heat', 'prod'];

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;

async function readJson(file) {
  let raw;
  try {
    raw = await readFile(file, 'utf8');
  } catch (e) {
    throw new Error(`${file}: cannot read file (${e.code || e.message})`);
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`${file}: invalid JSON (${e.message})`);
  }
}

function requireStrings(obj, fields, file) {
  if (obj === null || typeof obj !== 'object') throw new Error(`${file}: expected an object`);
  for (const f of fields) {
    if (!isStr(obj[f])) throw new Error(`${file}: missing or empty required field "${f}"`);
  }
}

async function listJson(dir) {
  try {
    return (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

function validateSpecs(specs, file) {
  if (!specs || !Array.isArray(specs.columns) || !Array.isArray(specs.rows)) {
    throw new Error(`${file}: field "specs" must be { columns: [], rows: [] }`);
  }
  for (const r of specs.rows) {
    if (!isStr(r.label) || !Array.isArray(r.values)) {
      throw new Error(`${file}: field "specs.rows" entries need "label" and "values"`);
    }
  }
}

/** Loads and validates content/<lang>. `root` is overridable for tests. */
export async function loadContent(lang, root = DEFAULT_ROOT) {
  if (!LANGS.includes(lang)) throw new Error(`Unsupported language "${lang}" (expected en or it)`);
  const dir = path.join(root, lang);

  const siteFile = path.join(dir, 'site.json');
  const site = await readJson(siteFile);
  requireStrings(site, ['name', 'vat', 'rea', 'email', 'address'], siteFile);
  if (!Array.isArray(site.phones)) throw new Error(`${siteFile}: missing required field "phones"`);

  const pagesFile = path.join(dir, 'pages.json');
  const pages = await readJson(pagesFile);
  if (!Array.isArray(pages)) throw new Error(`${pagesFile}: expected an array`);
  pages.forEach((p, i) => requireStrings(p, ['slug', 'title'], `${pagesFile}[${i}]`));

  const products = [];
  for (const f of await listJson(path.join(dir, 'products'))) {
    const file = path.join(dir, 'products', f);
    const p = await readJson(file);
    requireStrings(p, ['slug', 'code', 'title', 'short'], file);
    validateSpecs(p.specs, file);
    if (!GROUPS.includes(p.group)) throw new Error(`${file}: field "group" must be one of ${GROUPS.join(', ')}`);
    products.push(p);
  }

  const services = [];
  for (const f of await listJson(path.join(dir, 'services'))) {
    const file = path.join(dir, 'services', f);
    const s = await readJson(file);
    requireStrings(s, ['slug', 'title', 'body'], file);
    services.push(s);
  }

  return { site, pages, products, services };
}
