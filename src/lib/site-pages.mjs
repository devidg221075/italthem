import { displayTitle } from './html.mjs';
import { LANGS, pageUrl, serviceUrl, productUrl } from './routes.mjs';

const fileFor = (url) => `${url.replace(/^\//, '')}index.html`;

/**
 * buildPages({en, it}) -> Page[]: {lang, slug, key, url, type, title, file, alternates:[{lang,url}]}.
 * `file` is relative to dist/. Task 6 appends product pages here; Task 8 reads this list for sitemaps/hreflang.
 */
export function buildPages(contents) {
  const pages = [];
  const add = (type, key, entries, extra = {}) => {
    const alternates = LANGS.map((l) => ({ lang: l, url: entries[l].url }));
    for (const l of LANGS) {
      const { url, title } = entries[l];
      pages.push({ lang: l, slug: key, key, url, type, title, file: fileFor(url), alternates, ...extra });
    }
  };
  const find = (l, slug) => contents[l].pages.find((p) => p.slug === slug);
  for (const key of ['home', 'about', 'products', 'contact']) {
    const e = {};
    for (const l of LANGS) e[l] = { url: pageUrl(key, l), title: find(l, key).seo?.title ?? find(l, key).title };
    add(key, key, e);
  }
  for (const s of contents.en.services) {
    const e = {};
    for (const l of LANGS) {
      const sl = contents[l].services.find((x) => x.slug === s.slug);
      if (!sl) throw new Error(`service "${s.slug}" missing in ${l}`);
      e[l] = { url: serviceUrl(sl, l), title: sl.title };
    }
    add('service', s.slug, e);
  }
  for (const p of contents.en.products) {
    const e = {};
    for (const l of LANGS) {
      const pl = contents[l].products.find((x) => x.slug === p.slug);
      if (!pl) throw new Error(`product "${p.slug}" missing in ${l}`);
      const t = displayTitle(pl.title);
      e[l] = { url: productUrl(pl, l), title: t.includes(pl.code) ? t : `${t} ${pl.code}` };
    }
    add('product', p.slug, e, { group: p.group, code: p.code });
  }
  return pages;
}
