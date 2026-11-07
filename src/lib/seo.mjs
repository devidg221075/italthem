// SEO: <head> metadata, hreflang, Open Graph, JSON-LD, sitemaps and robots.txt. Redirects live in redirects.mjs.
import { esc } from './html.mjs';

/** The one place that knows the production origin. */
export const SITE_URL = 'https://ital-therm.it';
export const BRAND = 'ITALTHERM';
export const THEME_COLOR = '#112337';
const LOCALES = { en: 'en_US', it: 'it_IT' };
const LOGO_PATH = '/assets/img/icon-192.png';

export const absUrl = (p) => (/^https?:\/\//.test(p) ? p : `${SITE_URL}${p}`);

const ADDRESS = {
  '@type': 'PostalAddress',
  streetAddress: 'Viale S. Maria delle Vertighe 50/B',
  addressLocality: 'Monte San Savino',
  addressRegion: 'AR',
  postalCode: '52048',
  addressCountry: 'IT',
};

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

/** `<page title> | ITALTHERM`; the page title is cut at a word boundary (with an ellipsis) only when the result would pass 70 characters. */
export function makeTitle(title) {
  const t = clean(title);
  if (!t) return BRAND;
  const full = new RegExp(BRAND, 'i').test(t) ? t : `${t} | ${BRAND}`;
  if (full.length <= 70) return full;
  const suffix = full === t ? '' : ` | ${BRAND}`;
  return `${t.slice(0, 70 - suffix.length - 1).replace(/\s+\S*$/, '').replace(/[\s,;:–-]+$/, '')}…${suffix}`;
}

/** A source text is unusable as a description when it is a fragment, shouting capitals or words glued together by the original extraction. */
export function usableMeta(s) {
  const t = clean(s);
  if (t.length < 20) return false;
  if (/^[a-zà-ö]/.test(t)) return false;
  const letters = t.replace(/[^A-Za-zÀ-ÿ]/g, '');
  if (letters.length && t.replace(/[^A-ZÀ-Þ]/g, '').length / letters.length > 0.5) return false;
  return !/[A-Z]{3,}[A-Z][a-z]/.test(t);
}

/**
 * Meta description made only of existing text: the parts are joined until `min` characters are reached,
 * then cut at the last sentence end inside `max`, or at a word boundary with an ellipsis.
 */
export function makeDescription(parts, { min = 120, max = 160 } = {}) {
  let text = '';
  for (const raw of parts) {
    const p = clean(raw);
    if (!p) continue;
    text = text ? `${text}${/[.!?:;]$/.test(text) ? ' ' : '. '}${p}` : p;
    if (text.length >= min) break;
  }
  if (text.length <= max) return text;
  const ends = [...text.slice(0, max + 1).matchAll(/[.!?](?=\s|$)/g)].map((m) => m.index + 1).filter((i) => i >= min && i <= max);
  if (ends.length) return text.slice(0, ends.at(-1));
  return `${text.slice(0, max - 1).replace(/\s+\S*$/, '').replace(/[\s,;:–-]+$/, '')}…`;
}

/** JSON for a <script type="application/ld+json"> block: `</` can never close the script. */
export function jsonLd(obj) {
  return `<script type="application/ld+json">${JSON.stringify(obj).replace(/<\//g, '<\\/')}</script>`;
}

const meta = (name, content) => `<meta name="${name}" content="${esc(content)}">`;
const prop = (name, content) => `<meta property="${name}" content="${esc(content)}">`;

const telOf = (p) => String(p).trim();

function organization(site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: site.name,
    url: `${SITE_URL}/`,
    logo: absUrl(LOGO_PATH),
    email: site.email,
    telephone: telOf(site.phones[0]),
    address: ADDRESS,
    vatID: site.vat,
    contactPoint: site.phones.map((p) => ({ '@type': 'ContactPoint', telephone: telOf(p), email: site.email, contactType: 'customer service' })),
  };
}

function localBusiness(site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#localbusiness`,
    name: site.name,
    url: `${SITE_URL}/`,
    image: absUrl(LOGO_PATH),
    logo: absUrl(LOGO_PATH),
    email: site.email,
    telephone: telOf(site.phones[0]),
    address: ADDRESS,
    vatID: site.vat,
  };
}

function website(site, lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: BRAND,
    url: `${SITE_URL}/`,
    inLanguage: lang,
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

function breadcrumbs(crumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: absUrl(c.url) })),
  };
}

function product(page, site) {
  const p = page.product;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: page.title,
    sku: p.code,
    image: (page.images ?? []).map(absUrl),
    description: clean(p.short),
    brand: { '@type': 'Organization', name: BRAND, url: `${SITE_URL}/` },
    url: absUrl(page.url),
  };
}

/**
 * Everything the <head> needs besides charset/viewport/stylesheet.
 * `page`: {title, description, url?, alternates?:[{lang,url}], type?, image?, images?, crumbs?, product?}.
 * Without `url` (isolated unit renders) the canonical, hreflang and Open Graph URL are left out; `notfound` pages are noindex.
 */
export function seoHead(page, lang, ctx = {}) {
  const { site } = ctx;
  const title = makeTitle(page.title);
  const out = [`<title>${esc(title)}</title>`];
  const desc = clean(page.description);
  if (desc) out.push(meta('description', desc));
  if (page.type === 'notfound') {
    out.push(meta('robots', 'noindex,follow'));
  } else {
    out.push(meta('robots', 'index,follow'));
  }
  out.push(meta('theme-color', THEME_COLOR));
  out.push('<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">');
  out.push('<link rel="icon" href="/assets/img/icon-192.png" type="image/png" sizes="192x192">');
  out.push('<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">');
  if (page.url && page.type !== 'notfound') {
    const url = absUrl(page.url);
    out.push(`<link rel="canonical" href="${esc(url)}">`);
    const alts = page.alternates ?? [];
    for (const a of alts) out.push(`<link rel="alternate" hreflang="${esc(a.lang)}" href="${esc(absUrl(a.url))}">`);
    const def = alts.find((a) => a.lang === 'en') ?? alts[0];
    if (def) out.push(`<link rel="alternate" hreflang="x-default" href="${esc(absUrl(def.url))}">`);
    out.push(prop('og:type', page.type === 'product' ? 'product' : 'website'));
    out.push(prop('og:site_name', BRAND));
    out.push(prop('og:title', title));
    if (desc) out.push(prop('og:description', desc));
    out.push(prop('og:url', url));
    out.push(prop('og:locale', LOCALES[lang]));
    for (const a of alts) if (a.lang !== lang) out.push(prop('og:locale:alternate', LOCALES[a.lang]));
    if (page.image) out.push(prop('og:image', absUrl(page.image)));
    out.push(meta('twitter:card', 'summary_large_image'));
    out.push(meta('twitter:title', title));
    if (desc) out.push(meta('twitter:description', desc));
    if (page.image) out.push(meta('twitter:image', absUrl(page.image)));
    if (site) {
      if (page.type === 'home') out.push(jsonLd(organization(site)), jsonLd(localBusiness(site)), jsonLd(website(site, lang)));
      if (page.crumbs?.length) out.push(jsonLd(breadcrumbs(page.crumbs)));
      if (page.type === 'product' && page.product) out.push(jsonLd(product(page, site)));
    }
  }
  return out.join('\n');
}

// ---------------------------------------------------------------------------------------------------------------
// Sitemaps and robots.txt

const xml = (s) => esc(s);
const today = (now) => now.toISOString().slice(0, 10);

function alternatesXml(page) {
  const links = page.alternates.map((a) => `<xhtml:link rel="alternate" hreflang="${a.lang}" href="${xml(absUrl(a.url))}"/>`);
  const def = page.alternates.find((a) => a.lang === 'en') ?? page.alternates[0];
  links.push(`<xhtml:link rel="alternate" hreflang="x-default" href="${xml(absUrl(def.url))}"/>`);
  return links.map((l) => `    ${l}`).join('\n');
}

/** buildSitemaps(pages, now?) -> {'sitemap.xml': index, 'sitemap-en.xml', 'sitemap-it.xml'}; every `<lastmod>` is the build date. */
export function buildSitemaps(pages, now = new Date()) {
  const lastmod = today(now);
  const langs = [...new Set(pages.map((p) => p.lang))];
  const files = {};
  for (const l of langs) {
    const urls = pages.filter((p) => p.lang === l).map((p) => `  <url>\n    <loc>${xml(absUrl(p.url))}</loc>\n    <lastmod>${lastmod}</lastmod>\n${alternatesXml(p)}\n  </url>`);
    files[`sitemap-${l}.xml`] = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
  }
  const entries = langs.map((l) => `  <sitemap>\n    <loc>${SITE_URL}/sitemap-${l}.xml</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`);
  files['sitemap.xml'] = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</sitemapindex>\n`;
  return files;
}

export function robotsTxt() {
  return `# The old WordPress rules (Disallow: /wp-admin/ and friends) are gone on purpose: this static site has no admin area,
# and CSS/JS must stay crawlable so search engines can render the pages.
User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
}
