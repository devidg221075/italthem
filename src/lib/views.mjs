// Page bodies for home, about, catalogue and service pages. Text comes from content/<lang>; only chrome strings are in strings.mjs.
import { esc, displayTitle, layout, renderPage, renderBlock } from './render.mjs';
import { pageUrl, productUrl, serviceUrl } from './routes.mjs';
import { imageUrl } from './images.mjs';
import { T } from './strings.mjs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { docUrl } from './docs.mjs';
import { HERO_SLIDES, SERVICE_PHOTOS, ABOUT_PHOTOS, CATALOGUE_ORDER } from './featured.mjs';

const tel = (p) => `tel:${p.replace(/[^+\d]/g, '')}`;
const section = (page, i) => page.sections?.[i] ?? {};
const byCode = (products, code) => {
  const p = products.find((x) => x.code === code);
  if (!p) throw new Error(`featured product "${code}" not found in content`);
  return p;
};
const photo = (product, i) => {
  const u = product.images?.[i];
  if (!u) throw new Error(`product ${product.code} has no image #${i}`);
  return u;
};
const img = (url, alt, { lazy = true, extra = '' } = {}) => `<img src="${esc(imageUrl(url))}" alt="${esc(alt)}"${lazy ? ' loading="lazy"' : ''}${extra}>`;
const altOf = (p) => `${p.code} ${displayTitle(p.title)}`;
const clip = (s, n = 160) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…`);

export function orderedProducts(products) {
  const rank = (p) => { const i = CATALOGUE_ORDER.indexOf(p.code); return i < 0 ? 99 : i; };
  return [...products].sort((a, b) => rank(a) - rank(b));
}

function card(p, lang) {
  return `<a class="pc" href="${productUrl(p, lang)}"><div class="ph">${img(photo(p, 0), altOf(p))}</div><small>${esc(p.code)}</small><h3>${esc(displayTitle(p.title))}</h3></a>`;
}

/** First sentence of the home lead without the "Italtherm:" prefix, with the closing "precious metals" emphasised. */
function heroHeading(lead) {
  let s = lead.split(/(?<=\.)\s/)[0].replace(/^Italtherm:\s*/i, '');
  s = s.charAt(0).toUpperCase() + s.slice(1);
  const m = s.match(/^(.*?)(precious metals|metalli preziosi)(\.?)$/i);
  return m ? `${esc(m[1])}<em>${esc(m[2])}${esc(m[3])}</em>` : esc(s);
}

function homeBody(content, lang) {
  const { pages, products, services, site } = content;
  const t = T[lang];
  const home = pages.find((p) => p.slug === 'home');
  const about = pages.find((p) => p.slug === 'about');
  const taglines = section(home, 0).blocks.filter((b) => b.type === 'p').map((b) => b.text);
  const slides = HERO_SLIDES.map((s) => ({ p: byCode(products, s.code), image: s.image }));
  const aboutIntro = section(about, 0);

  const hero = `<section class="hero" aria-roledescription="carousel" aria-label="${esc(t.machines)}"><div class="bg"></div><div class="ghost" aria-hidden="true">${esc(slides[0].p.code)}</div><div class="w body"><div><h1>${heroHeading(home.lead)}</h1><p class="sub">${esc(about.lead)}</p><div class="hb"><a class="btn b1" href="${pageUrl('products', lang)}">${esc(t.discover)}</a><a class="btn b2" href="${pageUrl('contact', lang)}">${esc(t.contactUs)}</a></div>`
    + `<div class="cap">${slides.map((s, i) => `<div class="c${i ? '' : ' on'}"><b>${esc(s.p.code)}</b><span>${esc(displayTitle(s.p.title))}</span></div>`).join('')}</div>`
    + `<div class="ctrl"><button class="pv" type="button" aria-label="${esc(t.prev)}">←</button><button class="nx" type="button" aria-label="${esc(t.next)}">→</button><span class="count"><i class="cur">01</i> / ${String(slides.length).padStart(2, '0')}</span></div></div>`
    + `<div class="stage">${slides.map((s, i) => `<div class="m${i ? '' : ' on'}"${i ? ' aria-hidden="true"' : ''}>${img(photo(s.p, s.image), altOf(s.p), { lazy: i > 0, extra: i === 0 ? ' fetchpriority="high"' : '' })}</div>`).join('')}</div></div>`
    + `<div class="sel"><div class="w">${slides.map((s, i) => `<button type="button"${i ? '' : ' class="on" aria-current="true"'}>${img(photo(s.p, s.image), '')}<span><b>${esc(s.p.code)}</b><span>${esc(displayTitle(s.p.title))}</span></span></button>`).join('')}</div></div></section>`;

  const tg = `<section class="tg"><div class="w" style="--n:${taglines.length}">${taglines.map((x) => `<div>${esc(x)}</div>`).join('')}</div></section>`;

  const rail = `<section class="sc"><div class="w"><div class="hd"><div><div class="ey">${esc(t.catalogue)}</div><h2>${esc(section(home, 1).heading)}</h2></div><a class="btn b2" href="${pageUrl('products', lang)}">${esc(t.allSystems(products.length))}</a></div><div class="rail">${orderedProducts(products).map((p) => card(p, lang)).join('')}</div></div></section>`;

  const svc = `<section class="sc flush"><div class="w"><div class="hd"><div><div class="ey">${esc(t.whatWeDo)}</div><h2>${esc(section(home, 2).heading)}</h2></div></div><div class="svt">${services.map((s) => {
    const ph = SERVICE_PHOTOS[s.slug];
    return `<a href="${serviceUrl(s, lang)}"><div class="im">${ph ? img(photo(byCode(products, ph.code), ph.image), '') : ''}</div><h3>${esc(s.title)}</h3></a>`;
  }).join('')}</div></div></section>`;

  const abt = `<section class="sc flush"><div class="w"><div class="hd"><div><div class="ey">${esc(aboutIntro.kicker)}</div><h2>${esc(aboutIntro.heading)}</h2></div><a class="btn b2" href="${pageUrl('about', lang)}">${esc(t.readMore)}</a></div>${(aboutIntro.blocks || []).filter((b) => b.type === 'p').map((b) => `<p class="lead" style="max-width:62ch;font-size:18px;color:var(--body)">${esc(b.text)}</p>`).join('')}</div></section>`;

  const bandSec = section(home, 3);
  const band = `<section class="sc flush"><div class="w"><div class="band"><div><div class="ey">${esc(t.contactUs)}</div><h2>${esc(bandSec.heading)}</h2></div><div class="k"><a href="${tel(site.phones[0])}"><div><span>${esc(t.phone)}</span>${esc(site.phones[0])}</div>→</a><a href="mailto:${esc(site.email)}"><div><span>${esc(t.email)}</span>${esc(site.email)}</div>→</a></div></div></div></section>`;

  return [hero, tg, rail, svc, abt, band].join('\n');
}

function catalogueBody(content, lang) {
  const { pages, products } = content;
  const t = T[lang];
  const page = pages.find((p) => p.slug === 'products');
  const chips = ['all', 'melt', 'heat', 'prod'].map((k, i) => `<button type="button" data-filter="${k}"${i ? ' aria-pressed="false"' : ' class="on" aria-pressed="true"'}>${esc(t.filters[k])}</button>`).join('');
  return `<section class="ph0 pg"><div class="w"><div class="crumb"><a href="${pageUrl('home', lang)}">${esc(t.home)}</a> / ${esc(page.title)}</div><h1>${esc(page.title)}</h1>${page.lead ? `<p class="lead">${esc(page.lead)}</p>` : ''}<div class="chips" role="group" aria-label="${esc(t.filterLabel)}">${chips}</div></div></section>
<section class="sc" style="padding-top:30px"><div class="w"><div class="gr3" id="pgrid">${orderedProducts(products).map((p) => `<div data-g="${esc(p.group)}">${card(p, lang)}</div>`).join('')}</div></div></section>`;
}

function aboutBody(content, lang) {
  const { pages, products } = content;
  const t = T[lang];
  const page = pages.find((p) => p.slug === 'about');
  const intro = section(page, 0);
  const solutions = [1, 2, 3].map((i) => section(page, i));
  const why = section(page, 4);
  const head = `<section class="ph0 pg"><div class="w"><div class="crumb"><a href="${pageUrl('home', lang)}">${esc(t.home)}</a> / ${esc(page.title)}</div><div class="ey">${esc(intro.kicker)}</div><h1>${esc(intro.heading)}</h1><p class="lead">${esc(page.lead)}</p>${(intro.blocks || []).map((b) => `<p class="lead" style="margin-top:12px">${esc(b.text)}</p>`).join('')}</div></section>`;
  const blocks = solutions.map((s, i) => {
    const ph = ABOUT_PHOTOS[i];
    const prod = byCode(products, ph.code);
    const body = (s.blocks || []).map(renderBlock).join('');
    return `<div class="ab"><div class="tx">${s.kicker ? `<div class="ey">${esc(s.kicker)}</div>` : ''}<h2>${esc(s.heading)}</h2>${body}</div><div class="im${ph.contain ? ' c' : ''}">${img(photo(prod, ph.image), altOf(prod))}</div></div>`;
  }).join('');
  const whyP = (why.blocks || []).find((b) => b.type === 'p');
  const whyL = (why.blocks || []).find((b) => b.type === 'list');
  const whyHtml = `<section class="why sc"><div class="w">${why.kicker ? `<div class="ey">${esc(why.kicker)}</div>` : ''}<h2>${esc(why.heading)}</h2>${whyP ? `<p style="margin-top:14px;font-size:17px;color:#34475c;max-width:60ch">${esc(whyP.text)}</p>` : ''}${whyL ? `<div class="gridw">${whyL.items.map((x) => `<div>${esc(x)}</div>`).join('')}</div>` : ''}</div></section>`;
  return `${head}\n<div class="w">${blocks}</div>\n${whyHtml}`;
}

function serviceBody(service, content, lang) {
  const t = T[lang];
  const products = pageUrl('products', lang);
  return `<section class="phd"><div class="w"><div class="crumb"><a href="${pageUrl('home', lang)}">${esc(t.home)}</a> / <a href="${products}">${esc(content.pages.find((p) => p.slug === 'products').title)}</a> / ${esc(service.title)}</div><h1>${esc(service.title)}</h1></div></section>
<section class="sec"><div class="w">${service.blocks.map(renderBlock).join('')}<p><a class="btn b1" style="color:#fff;text-decoration:none" href="${pageUrl('contact', lang)}">${esc(t.contactUs)}</a></p></div></section>`;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const hasFile = (rel) => existsSync(path.join(ROOT, rel));
const localImage = (u) => hasFile(imageUrl(u).slice(1).split('/').map(decodeURIComponent).join('/'));
const br = (s) => esc(s).replace(/\r?\n/g, '<br>');

function specCell(v, t) {
  return v === '—' ? `<td><span role="img" aria-label="${esc(t.notAvailable)}">—</span></td>` : `<td>${br(v)}</td>`;
}

function specTable(p, t) {
  const { columns = [], rows = [] } = p.specs ?? {};
  if (!rows.length) return '';
  return `<div class="ey" style="margin-top:20px">${esc(t.description)}</div><div class="spec"><div class="spec-w"><table${p.table_title ? ` aria-label="${esc(p.table_title)}"` : ''}><thead><tr><td></td>${columns.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr><th scope="row">${br(r.label)}</th>${r.values.map((v) => specCell(v, t)).join('')}</tr>`).join('')}</tbody></table></div></div>`;
}

function gallery(p) {
  const imgs = (p.images ?? []).filter(localImage);
  const alt = (i) => (i ? `${altOf(p)} (${i + 1})` : altOf(p));
  const big = imgs.map((u, i) => `<img${i ? '' : ' class="on"'} src="${esc(imageUrl(u))}" alt="${esc(alt(i))}"${i ? ' loading="lazy"' : ' fetchpriority="high"'}>`).join('');
  return { big, imgs };
}

function description(short) {
  const paras = String(short ?? '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  if (!paras.length) return '';
  const lead = paras[0].endsWith(':') ? `<b>${esc(paras.shift())}</b>` : '';
  return `<div class="desc">${lead}${paras.map((x) => `<p>${esc(x)}</p>`).join('')}</div>`;
}

function related(p, products) {
  const others = orderedProducts(products).filter((x) => x.slug !== p.slug);
  return [...others.filter((x) => x.group === p.group), ...others.filter((x) => x.group !== p.group)].slice(0, 3);
}

export function productBody(p, content, lang) {
  const t = T[lang];
  const productsPage = content.pages.find((x) => x.slug === 'products');
  const g = gallery(p);
  const gal = `<div class="gal">${g.imgs.length ? `<div class="big">${g.big}</div>` : ''}${g.imgs.length > 1 ? `<div class="th" aria-label="${esc(t.gallery)}">${g.imgs.map((u, i) => `<button type="button"${i ? '' : ' class="on" aria-current="true"'} aria-label="${esc(t.imageN(i + 1))}"><img src="${esc(imageUrl(u))}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}</div>`;
  const contact = `${pageUrl('contact', lang)}?product=${encodeURIComponent(p.slug)}`;
  const pdf = p.pdf && hasFile(docUrl(p.slug).slice(1))
    ? `<a class="pdf" href="${docUrl(p.slug)}" target="_blank" rel="noopener">${esc(p.download_label)} ↓</a>` : '';
  return `<section class="ph0 pg" style="padding-bottom:10px"><div class="w"><div class="crumb"><a href="${pageUrl('home', lang)}">${esc(t.home)}</a> / <a href="${pageUrl('products', lang)}">${esc(productsPage?.title ?? t.products)}</a> / ${esc(p.code)}</div></div></section>
<section><div class="w"><div class="pd">${gal}<div><span class="badge">${esc(p.code)}</span><h1>${esc(displayTitle(p.title))}</h1>${description(p.short)}<div class="act"><a class="btn b1" href="${esc(contact)}">${esc(t.quote)} →</a><a class="btn b2" href="${pageUrl('contact', lang)}">${esc(t.contactUs)}</a></div>${pdf}${p.meta ? `<div class="meta">${br(p.meta)}</div>` : ''}</div></div>
${specTable(p, t)}</div></section>
<section class="sc"><div class="w"><div class="hd"><h2>${esc(t.otherFurnaces)}</h2><a class="btn b2" href="${pageUrl('products', lang)}">${esc(t.allProducts)}</a></div><div class="gr3">${related(p, content.products).map((x) => card(x, lang)).join('')}</div></div></section>`;
}

/** Renders a built page. `page` comes from buildPages(); `contents` is {en, it}. Task 6 adds the 'product' type. */
export function renderSitePage(page, contents) {
  const content = contents[page.lang];
  const { lang } = page;
  const switchUrls = Object.fromEntries(page.alternates.map((a) => [a.lang, a.url]));
  const common = { lang, site: content.site, switchUrls, alternates: page.alternates };
  const src = content.pages.find((p) => p.slug === page.key);
  const desc = src?.seo?.description ?? src?.meta_description;
  switch (page.type) {
    case 'home':
      return layout({ ...common, slug: 'home', title: page.title, description: desc, body: homeBody(content, lang), head: src.seo?.head });
    case 'about':
      return layout({ ...common, slug: 'about', title: page.title, description: desc, body: aboutBody(content, lang), head: src.seo?.head });
    case 'products':
      return layout({ ...common, slug: 'products', title: page.title, description: desc, body: catalogueBody(content, lang), head: src.seo?.head });
    case 'contact':
      return renderPage(src, lang, content.site);
    case 'service': {
      const s = content.services.find((x) => x.slug === page.key);
      const firstP = s.blocks.find((b) => b.type === 'p');
      return layout({ ...common, slug: `services/${s.slug}`, navKey: 'products', title: s.title, description: firstP ? clip(firstP.text) : undefined, body: serviceBody(s, content, lang) });
    }
    case 'product': {
      const p = content.products.find((x) => x.slug === page.key);
      const first = String(p.short ?? '').split(/\r?\n/).find(Boolean);
      return layout({ ...common, slug: `products/${p.slug}`, navKey: 'products', title: page.title, description: first ? clip(first) : undefined, body: productBody(p, content, lang) });
    }
    default:
      throw new Error(`no renderer for page type "${page.type}"`);
  }
}
