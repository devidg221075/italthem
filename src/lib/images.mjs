// Optimized images: assets/img/opt/manifest.json (written by `npm run images`, committed) maps each original in assets/img/src to
// responsive WebP variants with content-hashed names. Templates call imageAttrs()/imgTag(); nothing here needs image tooling.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc } from './html.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const OPT_URL = '/assets/img/opt/';

// `sizes` per layout context (breakpoints match site.css: 1000/600 px).
export const SIZES = {
  hero: '(min-width:1001px) 50vw, 100vw',
  rail: '(min-width:420px) 300px, 74vw',
  card: '(min-width:1001px) 380px, (min-width:601px) 50vw, 100vw',
  service: '(min-width:1001px) 290px, (min-width:601px) 50vw, 100vw',
  about: '(min-width:1001px) 600px, 100vw',
  banner: '(min-width:1001px) 46vw, 1px',
  gallery: '(min-width:1001px) 50vw, 100vw',
  thumb: '96px',
  menu: '(min-width:1001px) 200px, 0px',
};

let manifest;
const load = () => (manifest ??= JSON.parse(readFileSync(path.join(ROOT, 'assets/img/opt/manifest.json'), 'utf8')));

/** 'https://…/Foo%20Bar.jpg?x' | 'Foo Bar.jpg' -> 'Foo Bar.jpg' (the key used in the manifest). */
export const sourceName = (name) => decodeURIComponent(path.posix.basename(String(name).split(/[?#]/)[0]));

export const hasImage = (name) => Object.hasOwn(load(), sourceName(name));

function entry(name) {
  const e = load()[sourceName(name)];
  if (!e) throw new Error(`image "${name}" is not in assets/img/opt/manifest.json (run \`npm run images\`)`);
  return e;
}

const urlOf = (v) => OPT_URL + encodeURIComponent(v.file);
const webp = (e) => e.variants.filter((v) => v.format === 'webp').sort((a, b) => a.w - b.w);

/** Backwards-compatible helper: URL of the largest WebP variant (used for og:image and JSON-LD). */
export function imageUrl(name) {
  return urlOf(webp(entry(name)).at(-1));
}

/**
 * Attribute data for an <img>: src (the largest variant up to 960 px), srcset (all WebP variants), sizes, intrinsic width/height of
 * that src (so the browser reserves the space), loading/decoding. `priority: true` is the LCP image: fetchpriority=high, not lazy.
 */
export function imageAttrs(name, { sizes, priority = false, alt = '' } = {}) {
  const e = entry(name);
  const vs = webp(e);
  const src = [...vs].reverse().find((v) => v.w <= 960) ?? vs[0];
  const attrs = {
    src: urlOf(src),
    srcset: vs.map((v) => `${urlOf(v)} ${v.w}w`).join(', '),
    sizes,
    width: src.w,
    height: Math.round((src.w * e.height) / e.width),
    alt,
    decoding: 'async',
  };
  if (priority) attrs.fetchpriority = 'high';
  else attrs.loading = 'lazy';
  return attrs;
}

const ORDER = ['class', 'src', 'srcset', 'sizes', 'width', 'height', 'alt', 'loading', 'decoding', 'fetchpriority'];

/** `<img>` markup from imageAttrs(); `cls` adds a class and `extra` is raw trusted attribute text. */
export function imgTag(name, { cls, extra = '', ...opts } = {}) {
  const a = { ...imageAttrs(name, opts), class: cls };
  const parts = ORDER.filter((k) => a[k] !== undefined && a[k] !== '' || k === 'alt').map((k) => `${k}="${esc(String(a[k] ?? ''))}"`);
  return `<img ${parts.join(' ')}${extra}>`;
}

/** `<link rel="preload" as="image">` for the LCP image; same srcset/sizes as its <img> so the browser fetches the file the img will pick. */
export function preloadLink(name, { sizes }) {
  const a = imageAttrs(name, { sizes, priority: true });
  return `<link rel="preload" as="image" imagesrcset="${esc(a.srcset)}" imagesizes="${esc(a.sizes)}" fetchpriority="high">`;
}
