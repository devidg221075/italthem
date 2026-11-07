import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc, displayTitle } from './html.mjs';
import { pageUrl, productUrl, NAV_KEYS, MENU_LABELS, canonicalKey } from './routes.mjs';
import { seoHead } from './seo.mjs';
import { assetUrl } from './assets.mjs';
import { icon } from './icons.mjs';
import { imgTag, SIZES } from './images.mjs';
import { T } from './strings.mjs';
import { MENU_PRODUCTS, MENU_LIST, HERO_SLIDES } from './featured.mjs';

export { esc, displayTitle, pageUrl, seoHead };

const TPL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../templates');
const partial = (name) => readFileSync(path.join(TPL, name), 'utf8').trim();
const HEAD = partial('head.html');

// Official logo: assets/img/italtherm.svg (the supplied ItalTherm.svg, only the viewBox cropped to the artwork). 724x183 -> 3.96:1.
const LOGO_H = 44;
const logo = (cls = 'lgo', lazy = false) => `<img class="${cls}" src="/assets/img/italtherm.svg" width="${Math.round(LOGO_H * 724 / 183)}" height="${LOGO_H}" alt="ItalTherm" decoding="async"${lazy ? ' loading="lazy"' : ''}>`;

const UI = {
  en: { main: 'Main', menu: 'Open menu', close: 'Close menu', contact: 'Contact', privacy: 'Privacy', home: 'Italtherm home', lang: 'Language', notice: 'Notice', noticeText: 'This site does not use tracking or advertising cookies.', noticeLink: 'Read the privacy notice.', sub: 'Open the products menu' },
  it: { main: 'Principale', menu: 'Apri menu', close: 'Chiudi menu', contact: 'Contatti', privacy: 'Privacy', home: 'Italtherm home', lang: 'Lingua', notice: 'Avviso', noticeText: 'Questo sito non usa cookie di tracciamento o pubblicitari.', noticeLink: 'Leggi l’informativa sulla privacy.', sub: 'Apri il menu prodotti' },
};

const tel = (p) => `tel:${p.replace(/[^+\d]/g, '')}`;
const byCode = (products, code) => products.find((x) => x.code === code);
const shortTitle = (p) => displayTitle(p.title);

/** Main navigation links. Products becomes a mega-menu trigger (`mega`) in the header and a drill-down button in the drawer. */
function nav(lang, slug, { cls = '', products = [], mega = false, drawer = false } = {}) {
  const cur = canonicalKey(slug);
  const t = T[lang];
  return NAV_KEYS.map((k) => {
    const c = cls ? ` class="${cls}"` : '';
    const label = esc(MENU_LABELS[lang][k]);
    const attrs = `href="${pageUrl(k, lang)}" data-n="${k}"${k === cur ? ' aria-current="page"' : ''}`;
    if (k === 'products' && mega && products.length) {
      return `<div class="hm"><a${c} ${attrs} aria-haspopup="true" aria-expanded="false" aria-controls="mega">${label}${icon('down', 'ic dn')}</a>${megaMenu(lang, products, t)}</div>`;
    }
    if (k === 'products' && drawer) return `<a${c} ${attrs} data-sub>${label}${icon('chevron', 'ic ch')}</a>`;
    return `<a${c} ${attrs}>${label}</a>`;
  }).join('');
}

function catIcon(cat) {
  return icon({ cc: 'conveyor', melt: 'crucible', heat: 'heat', grains: 'grains' }[cat]);
}

/** Mega menu (approved mockup): list of families on the left, one card per featured product on the right. */
function megaMenu(lang, products, t) {
  const rep = (code) => byCode(products, code);
  const list = MENU_LIST.map(({ cat, code }) => {
    const p = rep(code);
    return `<a href="${productUrl(p, lang)}">${esc(t.menuCats[cat])}${icon('chevron', 'ic ch')}</a>`;
  }).join('');
  const cards = MENU_PRODUCTS.map((code) => {
    const p = rep(code);
    return `<a class="mc" href="${productUrl(p, lang)}"><div class="ph">${imgTag(p.images[0], { alt: '', sizes: SIZES.menu })}</div><b>${esc(p.code)}</b><span>${esc(shortTitle(p))}</span>${icon('arrow', 'ic ar')}</a>`;
  }).join('');
  return `<div class="mega" id="mega"><div class="mi"><div class="ml"><a class="all" href="${pageUrl('products', lang)}">${esc(t.allProductsMenu)}${icon('arrow', 'ic ar')}</a>${list}</div><div class="mr">${cards}</div></div></div>`;
}

function langSwitch(lang, slug, switchUrls) {
  const item = (l) => (l === lang
    ? `<span aria-current="true">${l.toUpperCase()}</span>`
    : `<a href="${switchUrls?.[l] ?? pageUrl(slug, l)}" hreflang="${l}" lang="${l}">${l.toUpperCase()}</a>`);
  return `<span class="lang" aria-label="${esc(UI[lang].lang)}">${item('it')}<i aria-hidden="true"></i>${item('en')}</span>`;
}

function header(lang, slug, site, switchUrls, navKey, products) {
  const ui = UI[lang];
  const t = T[lang];
  const key = navKey ?? slug;
  const phones = site.phones.map((p) => `<a href="${tel(p)}">${esc(p)}</a>`).join(' · ');
  const subList = (products.length ? MENU_LIST : []).map(({ cat, code }) => `<a class="l" href="${productUrl(byCode(products, code), lang)}">${catIcon(cat)}<span>${esc(t.menuCats[cat])}</span>${icon('chevron', 'ic ch')}</a>`).join('');
  return `<header class="hdr"><div class="w"><a class="brand" href="${pageUrl('home', lang)}" aria-label="${esc(ui.home)}">${logo()}</a><nav aria-label="${esc(ui.main)}">${nav(lang, key, { products, mega: true })}</nav><div class="rt"><button class="sb" type="button" aria-label="${esc(t.search)}" aria-haspopup="dialog" data-js="${assetUrl('/assets/js/search.js')}" data-css="${assetUrl('/assets/css/search.css')}" data-index="/assets/search-${lang}.json" data-ph="${esc(t.searchPlaceholder)}" data-none="${esc(t.searchNone)}" data-close="${esc(t.searchClose)}" data-types="${esc(JSON.stringify(t.searchTypes))}">${icon('search')}</button>${langSwitch(lang, slug, switchUrls)}<button class="bur" type="button" aria-label="${esc(ui.menu)}" aria-expanded="false" aria-controls="drawer">${icon('menu')}</button></div></div></header>
<div class="drw" id="drawer"><div class="dp pm"><div class="top"><a class="brand" href="${pageUrl('home', lang)}" aria-label="${esc(ui.home)}">${logo()}</a><button class="x" type="button" aria-label="${esc(ui.close)}">${icon('close')}</button></div>${nav(lang, key, { cls: 'l', drawer: true })}<div class="info"><div class="lg">${icon('globe')}${langSwitch(lang, slug, switchUrls)}</div><b>${esc(site.name)}</b><br>${esc(site.address)}<br>${phones}<br><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></div></div><div class="dp ps" aria-hidden="true"><div class="top"><button class="bk" type="button">${icon('back')}<span>${esc(t.productsMenu)}</span></button><button class="x" type="button" aria-label="${esc(ui.close)}">${icon('close')}</button></div>${subList}<a class="l all" href="${pageUrl('products', lang)}"><span>${esc(t.allProductsMenu)}</span>${icon('arrow', 'ic ar')}</a></div></div>`;
}

/** Call-to-action strip above the footer (approved component "Hai un progetto da realizzare?"). */
export function ctaStrip(lang) {
  const t = T[lang];
  return `<section class="cta-s"><div class="w"><div class="cs"><h2>${esc(t.ctaTitle)}</h2><p>${esc(t.ctaText)}</p><a class="btn b1" href="${pageUrl('contact', lang)}">${esc(t.ctaButton)}${icon('arrow', 'ic ar')}</a></div></div></section>`;
}

function footer(lang, slug, site, products, cta) {
  const ui = UI[lang];
  const t = T[lang];
  const year = new Date().getFullYear();
  const pages = NAV_KEYS.map((k) => `<a href="${pageUrl(k, lang)}">${icon('chevron', 'ic ch')}${esc(MENU_LABELS[lang][k])}</a>`).join('');
  const prods = (products.length ? MENU_PRODUCTS : []).map((code) => { const p = byCode(products, code); const cat = HERO_SLIDES.find((s) => s.code === code).cat; return `<a href="${productUrl(p, lang)}">${icon('chevron', 'ic ch')}${esc(t.cats[cat])} ${esc(code)}</a>`; }).join('');
  const phones = site.phones.map((p) => `<a class="ci" href="${tel(p)}">${icon('phone')}<span>${esc(p)}</span></a>`).join('');
  return `${cta ? ctaStrip(lang) : ''}<footer class="ft"><div class="w"><div class="fc"><div class="fb"><a class="brand" href="${pageUrl('home', lang)}" aria-label="${esc(ui.home)}">${logo('lgo', true)}</a><p>${esc(t.footTagline)}</p><i class="bar" aria-hidden="true"></i></div><details class="fd" open><summary>${esc(t.footNav)}${icon('down', 'ic dn')}</summary><div class="fl">${pages}</div></details><details class="fd" open><summary>${esc(t.footProducts)}${icon('down', 'ic dn')}</summary><div class="fl">${prods}</div></details><details class="fd" open><summary>${esc(t.footContacts)}${icon('down', 'ic dn')}</summary><div class="fl"><b>${esc(site.name)}</b><address class="ci">${icon('pin')}<span>${esc(site.address)}</span></address><a class="ci" href="mailto:${esc(site.email)}">${icon('mail')}<span>${esc(site.email)}</span></a>${phones}</div></details></div><div class="bt"><span>© <span data-year>${year}</span> ${esc(site.name)} · P.IVA ${esc(site.vat)} · REA ${esc(site.rea)}</span><span class="lg"><a href="${pageUrl('privacy', lang)}">${esc(ui.privacy)}</a><a href="${pageUrl('cookies', lang)}">${esc(t.cookies)}</a></span><a class="up" href="#main" aria-label="${esc(t.toTop)}">${icon('up')}</a></div></div></footer>`;
}

/** Cookie notice: markup is `hidden`; site.js reveals it until the visitor presses OK (cookie it_notice). */
function notice(lang) {
  const ui = UI[lang];
  return `<div class="nb" role="region" aria-label="${esc(ui.notice)}" hidden><p>${esc(ui.noticeText)} <a href="${pageUrl('privacy', lang)}">${esc(ui.noticeLink)}</a></p><button type="button">OK</button></div>`;
}

/**
 * Reusable shell. `body` is trusted, pre-rendered HTML (must contain the page's single <h1>).
 * `alternates` ([{lang, url}]) and `seo` ({url, type, image, images, crumbs, product}) feed the SEO head; `head` overrides it entirely.
 * `styles` / `scripts` ([asset paths]) add page-specific CSS and deferred JS (catalogue only);
 * `products` feeds the mega menu and footer; `cta: false` omits the CTA strip above the footer (home and contact have their own).
 */
/** `switchUrls` ({en, it}) overrides the language-switch targets and `navKey` the highlighted nav item, for pages whose url is not derived from `slug` (services, products). */
export function layout({ lang, slug, title, description, body, site, products = [], cta = true, styles = [], scripts = [], alternates = [], head, preload = '', switchUrls, navKey, seo: seoExtra = {} }) {
  const seo = head ?? seoHead({ title, description, alternates, ...seoExtra }, lang, { site });
  return `<!doctype html>
<html lang="${esc(lang)}">
<head>
${HEAD.replace('{{seo}}', () => seo).replace('{{preload}}', () => preload).replace('{{css}}', () => assetUrl('/assets/css/site.css'))}
${styles.map((u) => `<link rel="stylesheet" href="${assetUrl(u)}">`).join('\n')}${styles.length ? '\n' : ''}</head>
<body>
${header(lang, slug, site, switchUrls, navKey, products)}
<main id="main">
${body}
</main>
${footer(lang, slug, site, products, cta)}
${notice(lang)}
<script src="${assetUrl('/assets/js/site.js')}" defer></script>
${scripts.map((u) => `<script src="${assetUrl(u)}" defer></script>`).join('\n')}${scripts.length ? '\n' : ''}</body>
</html>
`;
}

export function renderBlock(b) {
  if (b.type === 'p') return `<p>${esc(b.text)}</p>`;
  if (b.type === 'h') return `<h3>${esc(b.text)}</h3>`;
  if (b.type === 'list') return `<ul>${(b.items || []).map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
  throw new Error(`unknown block type "${b.type}"`);
}

/** Generic page body: title as the single h1, lead, sections. */
export function pageBody(page) {
  const sections = (page.sections || []).map((s) => `<section class="prose"><div class="w">${s.kicker ? `<small>${esc(s.kicker)}</small>` : ''}${s.heading ? `<h2>${esc(s.heading)}</h2>` : ''}${(s.blocks || []).map(renderBlock).join('')}</div></section>`).join('\n');
  return `<section class="pgh"><div class="w"><h1>${esc(page.title)}</h1>${page.lead ? `<p class="sub">${esc(page.lead)}</p>` : ''}</div></section>\n${sections}`;
}

export function renderPage(page, lang, site) {
  return layout({ lang, slug: page.slug, title: page.seo?.title ?? page.title, description: page.seo?.description ?? page.meta_description, body: pageBody(page), site, head: page.seo?.head });
}
