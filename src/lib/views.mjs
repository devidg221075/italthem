// Page bodies for home, about, catalogue and service pages. Text comes from content/<lang>; only chrome strings are in strings.mjs.
import { esc, displayTitle, layout, renderBlock } from './render.mjs';
import { icon } from './icons.mjs';
import { pageUrl, productUrl, serviceUrl, NAV_LABELS } from './routes.mjs';
import { imageUrl, imgTag, hasImage, preloadLink, SIZES } from './images.mjs';
import { T } from './strings.mjs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { docUrl } from './docs.mjs';
import { PRIVACY, COOKIES } from './privacy.mjs';
import { makeDescription, usableMeta } from './seo.mjs';
import { HERO_SLIDES, MENU_PRODUCTS, SERVICE_PHOTOS, ABOUT_PHOTOS, CATALOGUE_ORDER } from './featured.mjs';

const catIcon = (cat) => icon({ cc: 'conveyor', melt: 'crucible', heat: 'heat', grains: 'grains' }[cat]);
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
const img = (url, alt, opts) => imgTag(url, { alt, ...opts });
const altOf = (p) => `${p.code} ${displayTitle(p.title)}`;
const clip = (s, n = 160) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…`);

export function orderedProducts(products) {
  const rank = (p) => { const i = CATALOGUE_ORDER.indexOf(p.code); return i < 0 ? 99 : i; };
  return [...products].sort((a, b) => rank(a) - rank(b));
}

function card(p, lang, sizes = SIZES.card, priority = false) {
  return `<a class="pc" href="${productUrl(p, lang)}"><div class="ph">${img(photo(p, 0), altOf(p), { sizes, priority })}</div><small>${esc(p.code)}</small><h3>${esc(displayTitle(p.title))}</h3></a>`;
}

function homeBody(content, lang) {
  const { pages, products, services, site } = content;
  const t = T[lang];
  const home = pages.find((p) => p.slug === 'home');
  const about = pages.find((p) => p.slug === 'about');
  const taglines = section(home, 0).blocks.filter((b) => b.type === 'p').map((b) => b.text);
  const slides = HERO_SLIDES.map((s) => ({ p: byCode(products, s.code), image: s.image, cat: s.cat }));
  const aboutIntro = section(about, 0);

  // The category row follows the mockup order (IT.CC, IT.GT, IT.AF, IT.GMS), which is not the slide order.
  const cats = MENU_PRODUCTS.map((code) => slides.find((s) => s.p.code === code)).map((s) => `<li><a href="${productUrl(s.p, lang)}">${catIcon(s.cat)}<span>${esc(t.cats[s.cat])}</span><b>${esc(s.p.code)}</b></a></li>`).join('');
  const hero = `<section class="hero" aria-roledescription="carousel" aria-label="${esc(t.machines)}"><div class="hbg" aria-hidden="true"></div><div class="w hbody"><div class="htx"><p class="kick"><i aria-hidden="true"></i><span lang="${t.heroKickerLang}">${esc(t.heroKicker)}</span></p><h1>${esc(t.heroTitle)}</h1><p class="sub">${esc(t.heroSub)}</p><div class="hb"><a class="btn b1" href="${pageUrl('products', lang)}">${esc(t.discoverProducts)}${icon('arrow', 'ic ar')}</a></div></div>`
    + `<div class="stage">${slides.map((s, i) => `<div class="m${i ? '' : ' on'}"${i ? ' aria-hidden="true"' : ''}>${img(photo(s.p, s.image), altOf(s.p), { sizes: SIZES.hero, priority: i === 0 })}</div>`).join('')}</div></div>`
    + `<ul class="w cats">${cats}</ul><div class="dots" role="group" aria-label="${esc(t.dots)}">${slides.map((s, i) => `<button type="button"${i ? '' : ' class="on" aria-current="true"'} aria-label="${esc(`${t.cats[s.cat]} ${s.p.code}`)}"></button>`).join('')}</div></section>`;

  const tg = `<section class="tg"><div class="w" style="--n:${taglines.length}">${taglines.map((x) => `<div>${esc(x)}</div>`).join('')}</div></section>`;

  const rail = `<section class="sc"><div class="w"><div class="hd"><div><div class="ey">${esc(t.catalogue)}</div><h2>${esc(section(home, 1).heading)}</h2></div><a class="btn b2" href="${pageUrl('products', lang)}">${esc(t.allSystems(products.length))}</a></div><div class="rail">${orderedProducts(products).map((p) => card(p, lang, SIZES.rail)).join('')}</div></div></section>`;

  const svc = `<section class="sc flush"><div class="w"><div class="hd"><div><div class="ey">${esc(t.whatWeDo)}</div><h2>${esc(section(home, 2).heading)}</h2></div></div><div class="svt">${services.map((s) => {
    const ph = SERVICE_PHOTOS[s.slug];
    return `<a href="${serviceUrl(s, lang)}"><div class="im">${ph ? img(photo(byCode(products, ph.code), ph.image), '', { sizes: SIZES.service }) : ''}</div><h3>${esc(s.title)}</h3></a>`;
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
<section class="sc" style="padding-top:30px"><div class="w"><div class="gr3" id="pgrid">${orderedProducts(products).map((p, i) => `<div data-g="${esc(p.group)}">${card(p, lang, SIZES.card, i === 0)}</div>`).join('')}</div></div></section>`;
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
    return `<div class="ab"><div class="tx">${s.kicker ? `<div class="ey">${esc(s.kicker)}</div>` : ''}<h2>${esc(s.heading)}</h2>${body}</div><div class="im${ph.contain ? ' c' : ''}">${img(photo(prod, ph.image), altOf(prod), { sizes: SIZES.about, priority: i === 0 })}</div></div>`;
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
const localImage = (u) => hasImage(u);
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
  const big = imgs.map((u, i) => img(u, alt(i), { sizes: SIZES.gallery, priority: i === 0, cls: i ? undefined : 'on' })).join('');
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
  const gal = `<div class="gal">${g.imgs.length ? `<div class="big">${g.big}</div>` : ''}${g.imgs.length > 1 ? `<div class="th" aria-label="${esc(t.gallery)}">${g.imgs.map((u, i) => `<button type="button"${i ? '' : ' class="on" aria-current="true"'} aria-label="${esc(t.imageN(i + 1))}">${img(u, '', { sizes: SIZES.thumb })}</button>`).join('')}</div>` : ''}</div>`;
  const contact = `${pageUrl('contact', lang)}?product=${encodeURIComponent(p.slug)}`;
  const pdf = p.pdf && hasFile(docUrl(p.slug).slice(1))
    ? `<a class="pdf" href="${docUrl(p.slug)}" target="_blank" rel="noopener">${esc(p.download_label)} ↓</a>` : '';
  return `<section class="ph0 pg" style="padding-bottom:10px"><div class="w"><div class="crumb"><a href="${pageUrl('home', lang)}">${esc(t.home)}</a> / <a href="${pageUrl('products', lang)}">${esc(productsPage?.title ?? t.products)}</a> / ${esc(p.code)}</div></div></section>
<section><div class="w"><div class="pd">${gal}<div><span class="badge">${esc(p.code)}</span><h1>${esc(displayTitle(p.title))}</h1>${description(p.short)}<div class="act"><a class="btn b1" href="${esc(contact)}">${esc(t.quote)} →</a><a class="btn b2" href="${pageUrl('contact', lang)}">${esc(t.contactUs)}</a></div>${pdf}${p.meta ? `<div class="meta">${br(p.meta)}</div>` : ''}</div></div>
${specTable(p, t)}</div></section>
<section class="sc"><div class="w"><div class="hd"><h2>${esc(t.otherFurnaces)}</h2><a class="btn b2" href="${pageUrl('products', lang)}">${esc(t.allProducts)}</a></div><div class="gr3">${related(p, content.products).map((x) => card(x, lang)).join('')}</div></div></section>`;
}

// Anchors into the original `form` label array of the contact page (per language); the build fails if one is missing.
const FORM_LABELS = {
  en: { group: 'First name and last name', first: 'First name', last: 'Last name', email: 'Your email', confirm: 'Confirm Email', req: 'Your request', gdpr: 'PRIVACY (GDPR)', link: 'privacy', enter: 'Enter Email' },
  it: { company: 'Azienda', group: 'Nome e cognome del contatto', first: 'Nome', last: 'Cognome', email: 'La tua Email', confirm: 'Conferma email', req: 'Descrivi la tua richiesta', gdpr: 'PRIVACY (GDPR)', link: 'privacy', enter: 'Inserisci email' },
};

function contactBody(content, lang) {
  const t = T[lang];
  const page = content.pages.find((p) => p.slug === 'contact');
  const form = page.form ?? [];
  const L = FORM_LABELS[lang];
  const at = (label) => {
    const i = form.indexOf(label);
    if (i < 0) throw new Error(`contact form label "${label}" not found in ${lang} content`);
    return i;
  };
  const required = form[at(L.first) - 1] ?? form[1]; // "(Required)" / "(Obbligatorio)" marker that precedes the name fields
  const gi = at(L.gdpr);
  const sentence = form[gi + 2];
  const lead = form[at(L.link) - 1];
  const products = Object.fromEntries(content.products.map((p) => [p.slug, p.code]));
  const req = `<i>${esc(required)}</i>`;
  const fld = (id, name, label, { type = 'text', ac, mark = true, ph, max } = {}) => `<div class="fld"><label for="${id}">${esc(label)}${mark ? req : ''}</label><input class="inp" id="${id}" name="${name}" type="${type}"${ac ? ` autocomplete="${ac}"` : ''}${ph ? ` placeholder="${esc(ph)}"` : ''}${mark ? ' required' : ''}${max ? ` maxlength="${max}"` : ''}></div>`;
  const formHtml = `<form class="fl" action="/contact.php" method="post" data-ok="${esc(t.sentOk)}" data-err="${esc(t.sentErr)}" data-sending="${esc(t.sending)}" data-about="${esc(t.about)}" data-products='${esc(JSON.stringify(products)).replace(/&quot;/g, '"')}'>`
    + (L.company && form.includes(L.company) ? `${fld('f-company', 'company', L.company, { ac: 'organization', max: 120 })}` : '')
    + `<fieldset class="nm"><legend>${esc(form[at(L.group)])}${req}</legend><div class="row2">${fld('f-first', 'first_name', form[at(L.first)], { ac: 'given-name', max: 80 })}${fld('f-last', 'last_name', form[at(L.last)], { ac: 'family-name', max: 80 })}</div></fieldset>`
    + `<div class="row2">${fld('f-email', 'email', form[at(L.email)], { type: 'email', ac: 'email', ph: form[at(L.enter)], max: 254 })}${fld('f-confirm', 'email_confirm', form[at(L.confirm)], { type: 'email', ac: 'email', ph: form[at(L.confirm)], max: 254 })}</div>`
    + `<div class="fld"><label for="f-msg">${esc(form[at(L.req)])}${req}</label><textarea class="inp" id="f-msg" name="message" rows="6" minlength="10" maxlength="5000" required></textarea></div>`
    + `<div class="hp" aria-hidden="true"><label for="f-web">Website</label><input id="f-web" type="text" name="website" tabindex="-1" autocomplete="off" value=""></div>`
    + `<input type="hidden" name="lang" value="${esc(lang)}"><input type="hidden" name="product" value="">`
    + `<p class="about" hidden></p>`
    + `<label class="gdpr"><input type="checkbox" name="consent" value="1" required><span><b>${esc(form[gi])}</b> ${esc(form[gi + 1])} · ${esc(sentence.replace(/\.?$/, '.'))} ${esc(lead)} <a href="${pageUrl('privacy', lang)}">${esc(form[at(L.link)])}</a>.</span></label>`
    + `<button class="btn b1" type="submit">${esc(t.send)}</button>`
    + `<div class="fmsg" role="status" aria-live="polite" aria-label="${esc(t.status)}"></div>`
    + `<p class="st ok" id="st-ok">${esc(t.sentOk)}</p><p class="st bad" id="st-err">${esc(t.sentErr)}</p></form>`;
  // Right column: the original blocks, verbatim; each heading starts a card.
  const cards = [];
  for (const b of page.sections.flatMap((s) => s.blocks ?? [])) {
    if (b.type === 'h') cards.push({ h: b.text, ps: [] });
    else if (b.type === 'p' && cards.length) cards.at(-1).ps.push(b.text);
  }
  const side = cards.map((c) => `<div class="card"><div class="ey">${esc(c.h)}</div>${c.ps.map((x) => `<p>${br(x)}</p>`).join('')}</div>`).join('');
  return `<section class="ph0 pg"><div class="w"><div class="crumb"><a href="${pageUrl('home', lang)}">${esc(t.home)}</a> / ${esc(page.title)}</div><h1>${esc(page.title)}</h1>${page.lead ? `<p class="lead">${esc(page.lead).replace(/\n/g, '<br>')}</p>` : ''}</div></section>
<section><div class="w ctw">${formHtml}<div class="side">${side}</div></div></section>`;
}

/** Privacy notice and cookie policy share one layout. `[[privacy]]` links to the privacy notice. */
function privacyBody(lang, site, doc = PRIVACY) {
  const t = T[lang];
  const P = doc[lang];
  const sub = (s) => esc(s)
    .replace('[[privacy]]', `<a href="${pageUrl('privacy', lang)}">${esc(PRIVACY[lang].title.toLowerCase())}</a>`)
    .replace('[[mail]]', `<a href="mailto:${esc(site.email)}">${esc(site.email)}</a>`)
    .replace('[[garante]]', '<a href="https://www.garanteprivacy.it" rel="noopener">www.garanteprivacy.it</a>');
  const sections = P.sections.map((s) => `<h2>${esc(s.h)}</h2>${s.p.map((x) => `<p>${sub(x)}</p>`).join('')}${s.ul ? `<ul>${s.ul.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${(s.after ?? []).map((x) => `<p>${sub(x)}</p>`).join('')}`).join('');
  return `<section class="ph0 pg"><div class="w"><div class="crumb"><a href="${pageUrl('home', lang)}">${esc(t.home)}</a> / ${esc(P.title)}</div><h1>${esc(P.title)}</h1><p class="lead">${esc(P.lead)}</p></div></section>
<section class="sec prv"><div class="w">${sections}<p class="upd">${esc(P.updated(new Date().getFullYear()))}</p></div></section>`;
}

const HOME_TITLE = { en: 'ITALTHERM – Industrial Furnaces for Precious Metals', it: 'ITALTHERM – Forni industriali per metalli preziosi' };

const paragraphs = (text) => String(text ?? '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);

/** First photo of a product that has optimized variants, as a site path. */
const mainPhoto = (p) => {
  const u = (p.images ?? []).find(localImage);
  return u ? imageUrl(u) : undefined;
};

/** Per-page SEO inputs: `{title, description, seo:{url,type,image,images,crumbs,product}}`. Descriptions are excerpts of existing content. */
function seoFor(page, content) {
  const { lang } = page;
  const t = T[lang];
  const { products, pages } = content;
  const src = pages.find((p) => p.slug === page.key);
  const meta = usableMeta(src?.meta_description) ? [src.meta_description] : [];
  const homePhoto = imageUrl(photo(byCode(products, HERO_SLIDES[0].code), HERO_SLIDES[0].image));
  const home = { name: t.home, url: pageUrl('home', lang) };
  const productsPage = pages.find((p) => p.slug === 'products');
  const productsCrumb = { name: productsPage?.title ?? t.products, url: pageUrl('products', lang) };
  const base = { url: page.url, type: page.type, image: homePhoto };
  switch (page.type) {
    case 'home':
      return { title: HOME_TITLE[lang], description: makeDescription([src.lead, ...meta]), seo: base };
    case 'about': {
      const ph = ABOUT_PHOTOS[0];
      return { title: NAV_LABELS[lang].about, description: makeDescription([...meta, src.lead]), seo: { ...base, image: imageUrl(photo(byCode(products, ph.code), ph.image)), crumbs: [home, { name: page.title, url: page.url }] } };
    }
    case 'products': {
      // No text of its own: excerpt of the About page intro (real content), unique because About describes itself with its lead.
      const about = pages.find((p) => p.slug === 'about');
      const intro = (about?.sections?.[0]?.blocks ?? []).filter((b) => b.type === 'p').map((b) => b.text);
      return { title: page.title, description: makeDescription([...meta, src.lead, ...intro]), seo: { ...base, image: mainPhoto(orderedProducts(products)[0]) ?? homePhoto, crumbs: [home, { name: page.title, url: page.url }] } };
    }
    case 'contact':
      return { title: page.title, description: makeDescription([...meta, ...paragraphs(src.lead)]), seo: { ...base, crumbs: [home, { name: page.title, url: page.url }] } };
    case 'cookies':
      return { title: page.title, description: makeDescription([COOKIES[lang].lead, COOKIES[lang].sections[1].p[0]]), seo: { ...base, crumbs: [home, { name: page.title, url: page.url }] } };
    case 'privacy':
      return { title: page.title, description: makeDescription([PRIVACY[lang].lead, PRIVACY[lang].sections[0].p[0].replace(/\[\[\w+\]\]/g, '')]), seo: { ...base, crumbs: [home, { name: page.title, url: page.url }] } };
    case 'service': {
      const s = content.services.find((x) => x.slug === page.key);
      const ph = SERVICE_PHOTOS[s.slug];
      const image = ph ? imageUrl(photo(byCode(products, ph.code), ph.image)) : homePhoto;
      return { title: s.title, description: makeDescription(s.blocks.filter((b) => b.type === 'p').map((b) => b.text)), seo: { ...base, image, crumbs: [home, productsCrumb, { name: s.title, url: page.url }] } };
    }
    case 'product': {
      const p = products.find((x) => x.slug === page.key);
      const images = (p.images ?? []).filter(localImage).map(imageUrl);
      // Products that open with the same paragraph (the two grain systems) describe themselves from their next paragraph, so descriptions stay unique.
      const paras = paragraphs(p.short);
      const shared = products.some((o) => o !== p && paragraphs(o.short)[0] === paras[0]);
      // The standalone word "Model"/"Mod" is dropped from the <title> to stay near 60 characters; the code stays.
      return { title: page.title.replace(/\s+(Model|Mod)(?=\s)/, ''), description: makeDescription(shared && paras.length > 1 ? [...paras.slice(1), paras[0]] : paras), seo: { ...base, image: images[0] ?? homePhoto, images, product: p, crumbs: [home, productsCrumb, { name: page.title, url: page.url }] } };
    }
    default:
      throw new Error(`no SEO rules for page type "${page.type}"`);
  }
}

/** Renders a built page. `page` comes from buildPages(); `contents` is {en, it}. */
export function renderSitePage(page, contents) {
  const content = contents[page.lang];
  const { lang } = page;
  const switchUrls = Object.fromEntries(page.alternates.map((a) => [a.lang, a.url]));
  const common = { lang, site: content.site, products: content.products, switchUrls, alternates: page.alternates };
  const src = content.pages.find((p) => p.slug === page.key);
  const { title, description, seo } = seoFor(page, content);
  // The LCP image (first hero slide / first gallery image) is preloaded with the same srcset/sizes as its <img>.
  let preload;
  if (page.type === 'home') preload = preloadLink(photo(byCode(content.products, HERO_SLIDES[0].code), HERO_SLIDES[0].image), { sizes: SIZES.hero });
  if (page.type === 'product') {
    const first = (content.products.find((x) => x.slug === page.key).images ?? []).find(localImage);
    if (first) preload = preloadLink(first, { sizes: SIZES.gallery });
  }
  const withSeo = { ...common, title, description, seo, preload, head: src?.seo?.head };
  switch (page.type) {
    case 'home':
      return layout({ ...withSeo, slug: 'home', cta: false, body: homeBody(content, lang) });
    case 'about':
      return layout({ ...withSeo, slug: 'about', body: aboutBody(content, lang) });
    case 'products':
      return layout({ ...withSeo, slug: 'products', body: catalogueBody(content, lang) });
    case 'contact':
      return layout({ ...withSeo, slug: 'contact', cta: false, body: contactBody(content, lang) });
    case 'privacy':
      return layout({ ...withSeo, slug: 'privacy', head: undefined, body: privacyBody(lang, content.site) });
    case 'cookies':
      return layout({ ...withSeo, slug: 'cookies', head: undefined, body: privacyBody(lang, content.site, COOKIES) });
    case 'service': {
      const s = content.services.find((x) => x.slug === page.key);
      return layout({ ...withSeo, slug: `services/${s.slug}`, navKey: 'products', head: undefined, body: serviceBody(s, content, lang) });
    }
    case 'product': {
      const p = content.products.find((x) => x.slug === page.key);
      return layout({ ...withSeo, slug: `products/${p.slug}`, navKey: 'products', head: undefined, body: productBody(p, content, lang) });
    }
    default:
      throw new Error(`no renderer for page type "${page.type}"`);
  }
}

const NOT_FOUND = {
  en: { h: 'Page not found', p: 'The page you are looking for does not exist or has been removed.', home: 'Home', products: 'Products', contact: 'Contact us' },
  it: { h: 'Pagina non trovata', p: 'La pagina che cerchi non esiste o è stata rimossa.', home: 'Home', products: 'Prodotti', contact: 'Contattaci' },
};

/** The bilingual /404.html (also served for 410 Gone). noindex, not part of the sitemap. */
export function renderNotFound(contents) {
  const en = NOT_FOUND.en;
  const it = NOT_FOUND.it;
  const links = (l, n) => `<p><a class="btn b1" style="color:#fff;text-decoration:none" href="${pageUrl('home', l)}">${esc(n.home)}</a> <a class="btn b2" href="${pageUrl('products', l)}">${esc(n.products)}</a> <a class="btn b2" href="${pageUrl('contact', l)}">${esc(n.contact)}</a></p>`;
  const body = `<section class="phd"><div class="w"><h1>${esc(en.h)}</h1><p class="lead">${esc(en.p)}</p>${links('en', en)}</div></section>
<section class="sec" lang="it"><div class="w"><h2>${esc(it.h)}</h2><p>${esc(it.p)}</p>${links('it', it)}</div></section>`;
  return layout({ lang: 'en', slug: '404', title: `${en.h} / ${it.h}`, description: `${en.p} ${it.p}`, body, site: contents.en.site, products: contents.en.products, switchUrls: { en: '/en/', it: '/it/' }, seo: { type: 'notfound' } });
}
