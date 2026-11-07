import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const CSS_PATH = new URL('../assets/css/site.css', import.meta.url);
const JS_PATH = new URL('../assets/js/site.js', import.meta.url);
const read = (u) => (existsSync(u) ? readFileSync(u, 'utf8') : '');

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

test('WCAG contrast of brand colours', () => {
  assert.ok(contrast('#112337', '#ffffff') >= 4.5, 'navy on white');
  assert.ok(contrast('#ffffff', '#204ce5') >= 4.5, 'white on blue');
  assert.ok(contrast('#204ce5', '#ffffff') >= 4.5, 'blue on white');
});

test('CSS declares the brand tokens', () => {
  const css = read(CSS_PATH);
  for (const t of ['--bg', '--fg', '--accent', '--accent-2']) assert.ok(css.includes(`${t}:`), t);
  assert.ok(css.includes('#112337') && css.includes('#204ce5'));
});

test('site.css + site.js < 40 KB', () => {
  const total = Buffer.byteLength(read(CSS_PATH)) + Buffer.byteLength(read(JS_PATH));
  assert.ok(total > 0, 'files exist');
  assert.ok(total < 40 * 1024, `total ${total} bytes`);
});

/** Split CSS into [selector, body] pairs (flattening @media blocks). */
function rules(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) out.push([m[1].trim(), m[2]]);
  return out;
}

test('no is-scrolled rule changes box metrics (header must not grow on scroll)', () => {
  const css = read(CSS_PATH);
  assert.ok(css.includes('is-scrolled'), 'is-scrolled style exists');
  const banned = /(^|;)\s*(height|min-height|max-height|padding[\w-]*|margin[\w-]*|line-height|font-size|border-width|top)\s*:/;
  for (const [sel, body] of rules(css)) {
    if (sel.includes('is-scrolled')) assert.ok(!banned.test(body), `${sel} { ${body} }`);
  }
});

test('is-scrolled is only a state class, never a standalone layout class', () => {
  const css = read(CSS_PATH);
  for (const [sel] of rules(css)) {
    if (!sel.includes('is-scrolled')) continue;
    for (const part of sel.split(',')) assert.match(part.trim(), /^\.hdr\.is-scrolled/, part);
  }
  assert.ok(!/(^|[^\w-])\.sc\b[^{]*is-scrolled|is-scrolled[^{]*\.sc\b/.test(css));
  // The header height token is the same regardless of state
  assert.match(css, /\.hdr \.w\{[^}]*height:var\(--hh\)/);
});

test('site.js has no localStorage / eval and adds the js class', () => {
  const js = read(JS_PATH);
  assert.ok(js.length > 0);
  assert.ok(!/localStorage|sessionStorage|\beval\s*\(|new Function/.test(js));
  assert.ok(js.includes("classList.add('js')"));
  assert.ok(js.includes('is-scrolled') && js.includes('data-year') && js.includes('inert'));
});

test('fonts are self-hosted WOFF2 with font-display swap', () => {
  const css = read(CSS_PATH);
  assert.ok(!/fonts\.googleapis|gstatic/.test(css));
  const urls = [...css.matchAll(/url\((\/assets\/fonts\/[^)]+)\)/g)].map((m) => m[1]);
  assert.ok(urls.length >= 4);
  for (const u of urls) assert.ok(existsSync(new URL(`..${u}`, import.meta.url)), u);
  assert.ok(css.includes('font-display:swap'));
});

test('Inter is the only typeface: no monospace or JetBrains in the CSS, templates or fonts', () => {
  const css = read(CSS_PATH);
  assert.ok(!/monospace/i.test(css), 'monospace in site.css');
  assert.ok(!/jetbrains/i.test(css), 'JetBrains in site.css');
  assert.ok(!/--mono\b/.test(css), '--mono token');
  assert.ok(!existsSync(new URL('../assets/fonts/jetbrains-mono-latin-var.woff2', import.meta.url)));
  assert.ok(!existsSync(new URL('../assets/fonts/jetbrains-mono-latin-ext-var.woff2', import.meta.url)));
  for (const f of ['../templates/head.html', '../templates/logo.html']) assert.ok(!/monospace|jetbrains/i.test(read(new URL(f, import.meta.url))), f);
});
