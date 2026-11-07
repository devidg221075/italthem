// Old WordPress URLs -> new URLs, and the Apache .htaccess built from them.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pageUrl, productUrl, serviceUrl } from './routes.mjs';

const TPL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../server/.htaccess.tpl');

/** Theme demo pages with no content of their own (docs/CHANGES.md "Pagine demo del tema da eliminare"): answered with 410 Gone. */
export const DEMO_GONE = ['blog-grid', 'faqs', 'projects-gird', 'pricing', 'cart', 'cart-2', 'checkout', 'checkout-2', 'my-account', 'testimonials', 'team-grid', 'services-gird', 'content-from-mizox'];

/** Demo pages that map to a real page instead: slug -> canonical page key. `home` was the theme's home copy; the continuous-casting draft duplicated "About us". */
export const DEMO_MOVED = { home: 'home', 'italtherm-continuous-casting-machine': 'about' };

const norm = (p) => (p === '/' ? p : p.replace(/\/+$/, ''));

/**
 * buildRedirects(contents) -> Redirect[] ({from, to?, status}). Every content `old_path` that is not already its own new URL is
 * redirected to the new page of the same language; demo pages get 410 (or a 301 for DEMO_MOVED). Query strings are dropped by the rules.
 */
export function buildRedirects(contents) {
  const out = new Map();
  const add = (from, to) => {
    if (norm(from) === '/' || (to && norm(from) === norm(to))) return; // `/` is the language chooser; `/it/...` paths that kept their URL stay
    if (out.has(norm(from))) throw new Error(`duplicate redirect source ${from}`);
    out.set(norm(from), to ? { from, to, status: 301 } : { from, status: 410 });
  };
  for (const lang of ['en', 'it']) {
    const c = contents[lang];
    for (const p of c.pages) if (p.old_path) add(p.old_path, pageUrl(p.slug, lang));
    for (const p of c.products) if (p.old_path) add(p.old_path, productUrl(p, lang));
    for (const s of c.services) if (s.old_path) add(s.old_path, serviceUrl(s, lang));
    const prefix = lang === 'en' ? '/' : '/it/';
    add(`${prefix}product-category/ital-therm/`, pageUrl('products', lang));
    for (const slug of DEMO_GONE) add(`${prefix}${slug}/`);
    for (const [slug, key] of Object.entries(DEMO_MOVED)) add(`${prefix}${slug}/`, pageUrl(key, lang));
  }
  return [...out.values()];
}

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function rule(r) {
  const re = `^${escRe(r.from.replace(/^\/+/, '').replace(/\/+$/, ''))}/?$`;
  return r.status === 410 ? `RewriteRule ${re} - [G,L]` : `RewriteRule ${re} ${r.to}? [R=301,L]`;
}

/** buildHtaccess(map) -> the server/.htaccess.tpl template with the redirect section filled in. */
export function buildHtaccess(map) {
  const moved = map.filter((r) => r.status === 301).map(rule);
  const gone = map.filter((r) => r.status === 410).map(rule);
  const section = [
    '# --- 301: old WordPress URLs -> new pages (with or without trailing slash; the trailing "?" drops the query string) ---',
    ...moved,
    '',
    '# --- 410 Gone: demo pages of the old theme, never real content ---',
    ...gone,
  ].join('\n');
  return readFileSync(TPL, 'utf8').replace('# {{REDIRECTS}}', () => section);
}
