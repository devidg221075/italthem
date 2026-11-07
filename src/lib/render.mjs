import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc, displayTitle } from './html.mjs';
import { pageUrl, NAV_KEYS, NAV_LABELS, canonicalKey } from './routes.mjs';
import { seoHead } from './seo.mjs';
import { assetUrl } from './assets.mjs';

export { esc, displayTitle, pageUrl, seoHead };

const TPL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../templates');
const partial = (name) => readFileSync(path.join(TPL, name), 'utf8').trim();
const LOGO = partial('logo.html');
const HEAD = partial('head.html');

const UI = {
  en: { main: 'Main', cta: 'Request a contact', menu: 'Open menu', close: 'Close menu', pages: 'Pages', contact: 'Contact', privacy: 'Privacy', tagline: 'ITALTHERM is an Italian company specializing in high-technology systems.', home: 'Italtherm home', lang: 'Language', notice: 'Notice', noticeText: 'This site does not use tracking or advertising cookies.', noticeLink: 'Read the privacy notice.' },
  it: { main: 'Principale', cta: 'Richiedi un contatto', menu: 'Apri menu', close: 'Chiudi menu', pages: 'Pagine', contact: 'Contatti', privacy: 'Privacy', tagline: 'ITALTHERM è un’azienda italiana specializzata in sistemi ad alta tecnologia.', home: 'Italtherm home', lang: 'Lingua', notice: 'Avviso', noticeText: 'Questo sito non usa cookie di tracciamento o pubblicitari.', noticeLink: 'Leggi l’informativa sulla privacy.' },
};

const tel = (p) => `tel:${p.replace(/[^+\d]/g, '')}`;

function nav(lang, slug, cls) {
  const cur = canonicalKey(slug);
  return NAV_KEYS.map((k) => {
    const c = cls ? ` class="${cls}"` : '';
    return `<a${c} href="${pageUrl(k, lang)}" data-n="${k}"${k === cur ? ' aria-current="page"' : ''}>${esc(NAV_LABELS[lang][k])}</a>`;
  }).join('');
}

function langSwitch(lang, slug, switchUrls) {
  const item = (l) => (l === lang
    ? `<span aria-current="true">${l.toUpperCase()}</span>`
    : `<a href="${switchUrls?.[l] ?? pageUrl(slug, l)}" hreflang="${l}" lang="${l}">${l.toUpperCase()}</a>`);
  return `<span class="lang" aria-label="${esc(UI[lang].lang)}">${item('en')} · ${item('it')}</span>`;
}

function header(lang, slug, site, switchUrls, navKey) {
  const ui = UI[lang];
  const phones = site.phones.map((p) => `<a href="${tel(p)}">${esc(p)}</a>`).join(' · ');
  return `<header class="hdr"><div class="w"><a href="${pageUrl('home', lang)}" aria-label="${esc(ui.home)}">${LOGO}</a><nav aria-label="${esc(ui.main)}">${nav(lang, navKey ?? slug)}</nav><div class="rt">${langSwitch(lang, slug, switchUrls)}<a class="cta" href="${pageUrl('contact', lang)}">${esc(ui.cta)}</a><button class="bur" type="button" aria-label="${esc(ui.menu)}" aria-expanded="false" aria-controls="drawer"><i></i></button></div></div></header>
<div class="drw" id="drawer"><div class="top"><span class="brand">ItalTherm</span><button class="x" type="button" aria-label="${esc(ui.close)}">×</button></div>${nav(lang, navKey ?? slug, 'l')}<div class="info"><b>${esc(site.name)}</b><br>${esc(site.address)}<br>${phones}<br><a href="mailto:${esc(site.email)}">${esc(site.email)}</a><br>${langSwitch(lang, slug, switchUrls)}</div></div>`;
}

function footer(lang, slug, site) {
  const ui = UI[lang];
  const year = new Date().getFullYear();
  const pages = NAV_KEYS.map((k) => `<a href="${pageUrl(k, lang)}">${esc(NAV_LABELS[lang][k])}</a>`).join('');
  const phones = site.phones.map((p) => `<a href="${tel(p)}">${esc(p)}</a>`).join('');
  return `<footer class="ft"><div class="w"><div class="top"><div><div class="brand">ItalTherm</div><p>${esc(ui.tagline)}</p></div><div><h4>${esc(ui.pages)}</h4>${pages}</div><div><h4>${esc(ui.contact)}</h4>${phones}<a href="mailto:${esc(site.email)}">${esc(site.email)}</a><address>${esc(site.address)}</address></div></div><div class="bt"><span>© <span data-year>${year}</span> ${esc(site.name)} · P.IVA ${esc(site.vat)} · REA ${esc(site.rea)}</span><a href="${pageUrl('privacy', lang)}">${esc(ui.privacy)}</a></div></div></footer>`;
}

/** Cookie notice: markup is `hidden`; site.js reveals it until the visitor presses OK (cookie it_notice). */
function notice(lang) {
  const ui = UI[lang];
  return `<div class="nb" role="region" aria-label="${esc(ui.notice)}" hidden><p>${esc(ui.noticeText)} <a href="${pageUrl('privacy', lang)}">${esc(ui.noticeLink)}</a></p><button type="button">OK</button></div>`;
}

/**
 * Reusable shell. `body` is trusted, pre-rendered HTML (must contain the page's single <h1>).
 * `alternates` ([{lang, url}]) and `seo` ({url, type, image, images, crumbs, product}) feed the SEO head; `head` overrides it entirely.
 */
/** `switchUrls` ({en, it}) overrides the language-switch targets and `navKey` the highlighted nav item, for pages whose url is not derived from `slug` (services, products). */
export function layout({ lang, slug, title, description, body, site, alternates = [], head, switchUrls, navKey, seo: seoExtra = {} }) {
  const seo = head ?? seoHead({ title, description, alternates, ...seoExtra }, lang, { site });
  return `<!doctype html>
<html lang="${esc(lang)}">
<head>
${HEAD.replace('{{seo}}', () => seo).replace('{{css}}', () => assetUrl('/assets/css/site.css'))}
</head>
<body>
${header(lang, slug, site, switchUrls, navKey)}
<main id="main">
${body}
</main>
${footer(lang, slug, site)}
${notice(lang)}
<script src="${assetUrl('/assets/js/site.js')}" defer></script>
</body>
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
  const sections = (page.sections || []).map((s) => `<section class="sec"><div class="w">${s.kicker ? `<small>${esc(s.kicker)}</small>` : ''}${s.heading ? `<h2>${esc(s.heading)}</h2>` : ''}${(s.blocks || []).map(renderBlock).join('')}</div></section>`).join('\n');
  return `<section class="phd"><div class="w"><h1>${esc(page.title)}</h1>${page.lead ? `<p class="lead">${esc(page.lead)}</p>` : ''}</div></section>\n${sections}`;
}

export function renderPage(page, lang, site) {
  return layout({ lang, slug: page.slug, title: page.seo?.title ?? page.title, description: page.seo?.description ?? page.meta_description, body: pageBody(page), site, head: page.seo?.head });
}
