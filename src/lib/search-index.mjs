// Site search index (one JSON per language, written to dist/assets/search-<lang>.json and fetched on the first click on the search button).
// Only content that already exists on the site: products (code, title, text), services and the main pages. No external service.
import { displayTitle } from './html.mjs';
import { pageUrl, productUrl, serviceUrl, MENU_LABELS } from './routes.mjs';
import { PRIVACY, COOKIES } from './privacy.mjs';
import { T } from './strings.mjs';

const flat = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

/** buildSearchIndex(content, lang) -> {items:[{t:'p'|'s'|'g', c?:code, n:title, u:url, x:searchable text}]}; t = product, service, page. */
export function buildSearchIndex(content, lang) {
  const items = [];
  for (const p of content.products) {
    const specs = (p.specs?.columns ?? []).join(' ');
    items.push({ t: 'p', c: p.code, n: displayTitle(p.title), u: productUrl(p, lang), x: flat(`${p.code} ${displayTitle(p.title)} ${specs} ${p.short}`).slice(0, 900) });
  }
  for (const s of content.services) {
    items.push({ t: 's', n: s.title, u: serviceUrl(s, lang), x: flat(`${s.title} ${(s.blocks ?? []).filter((b) => b.type === 'p').map((b) => b.text).join(' ')}`).slice(0, 600) });
  }
  const pageTitle = { about: MENU_LABELS[lang].about, products: T[lang].products, contact: MENU_LABELS[lang].contact, privacy: PRIVACY[lang].title, cookies: COOKIES[lang].title };
  for (const k of ['about', 'products', 'contact', 'privacy', 'cookies']) items.push({ t: 'g', n: pageTitle[k], u: pageUrl(k, lang), x: pageTitle[k] });
  return { items };
}
