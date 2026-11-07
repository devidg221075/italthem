export const LANGS = ['en', 'it'];

// canonical key -> url slug per language ('' = language root)
const SLUGS = {
  home: { en: '', it: '' },
  about: { en: 'about-us', it: 'chi-siamo' },
  products: { en: 'products', it: 'prodotti' },
  contact: { en: 'contact', it: 'contatti' },
};
const ALIASES = { 'about-us': 'about', 'chi-siamo': 'about', prodotti: 'products', contatti: 'contact', contattaci: 'contact' };

export const NAV_KEYS = ['home', 'about', 'products', 'contact'];

export const NAV_LABELS = {
  en: { home: 'Home', about: 'About us', products: 'Products', contact: 'Contact us' },
  it: { home: 'Home', about: 'Chi siamo', products: 'Prodotti', contact: 'Contattaci' },
};

export function canonicalKey(slug) {
  const k = ALIASES[slug] || slug;
  return k === '' ? 'home' : k;
}

/** pageUrl('about', 'it') -> '/it/chi-siamo/'; unknown slugs are used verbatim. */
export function pageUrl(slug, lang) {
  if (!LANGS.includes(lang)) throw new Error(`unknown language "${lang}"`);
  const key = canonicalKey(slug);
  const s = SLUGS[key] ? SLUGS[key][lang] : slug;
  return s ? `/${lang}/${s}/` : `/${lang}/`;
}

export function otherLang(lang) {
  return lang === 'en' ? 'it' : 'en';
}

const SECTION = { products: { en: 'products', it: 'prodotti' }, services: { en: 'services', it: 'servizi' } };

/** productUrl({slug:'it-cc'}, 'it') -> '/it/prodotti/it-cc/'. Page built by Task 6. */
export function productUrl(product, lang) {
  if (!LANGS.includes(lang)) throw new Error(`unknown language "${lang}"`);
  return `/${lang}/${SECTION.products[lang]}/${product.slug}/`;
}

/** serviceUrl({slug:'x'}, 'it') -> '/it/servizi/x/'. */
export function serviceUrl(service, lang) {
  if (!LANGS.includes(lang)) throw new Error(`unknown language "${lang}"`);
  return `/${lang}/${SECTION.services[lang]}/${service.slug}/`;
}
