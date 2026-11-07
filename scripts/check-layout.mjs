// Visual/layout check (not part of npm test). Builds a throwaway page with the real renderer,
// serves it statically and measures the header with Playwright at two widths and two scroll positions.
// Usage: NODE_PATH=$(npm root -g) node scripts/check-layout.mjs   (output in /tmp/t4)
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, cpSync, readFileSync, existsSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { loadContent } from '../src/lib/content.mjs';
import { renderPage } from '../src/lib/render.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(import.meta.dirname, '..');
const out = '/tmp/t4';
mkdirSync(out, { recursive: true });
cpSync(path.join(root, 'assets'), path.join(out, 'assets'), { recursive: true });

const c = await loadContent('en');
const page = c.pages.find((p) => p.slug === 'about');
// pad the page so it can scroll past 900px
const pad = Array.from({ length: 30 }, (_, i) => ({ type: 'p', text: `Filler paragraph ${i + 1}. `.repeat(12) }));
const tall = { ...page, sections: [...(page.sections || []), { heading: 'Filler', blocks: pad }] };
writeFileSync(path.join(out, 'index.html'), renderPage(tall, 'en', c.site));

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const srv = http.createServer((req, res) => {
  const f = path.join(out, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!existsSync(f)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }).end(readFileSync(f));
}).listen(0);
const base = `http://127.0.0.1:${srv.address().port}/`;

const browser = await chromium.launch();
let bad = 0;
for (const [w, h, expected] of [[1360, 900, 76], [390, 844, 68]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(base, { waitUntil: 'load' });
  const res = {};
  for (const y of [0, 900]) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(450);
    res[y] = await p.evaluate(() => {
      const hd = document.querySelector('.hdr');
      return { h: hd.getBoundingClientRect().height, scrolled: hd.classList.contains('is-scrolled'), top: hd.getBoundingClientRect().top,
        sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth };
    });
    await p.screenshot({ path: path.join(out, `shot-${w}-${y}.png`) });
  }
  const ok = res[0].h === expected && res[900].h === expected && res[0].scrolled === false && res[900].scrolled === true
    && res[0].sw <= res[0].cw && res[900].sw <= res[900].cw && res[900].top === 0;
  if (w === 390) {
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.click('.bur');
    await p.waitForTimeout(600);
    const d = await p.evaluate(() => ({ open: document.querySelector('#drawer').classList.contains('open'), inert: document.querySelector('#drawer').hasAttribute('inert'), exp: document.querySelector('.bur').getAttribute('aria-expanded'), lock: document.body.classList.contains('no-scroll') }));
    await p.screenshot({ path: path.join(out, 'shot-390-drawer.png') });
    await p.keyboard.press('Escape');
    await p.waitForTimeout(600);
    const d2 = await p.evaluate(() => ({ open: document.querySelector('#drawer').classList.contains('open'), inert: document.querySelector('#drawer').hasAttribute('inert'), focus: document.activeElement.className }));
    console.log('drawer open:', JSON.stringify(d), 'after Escape:', JSON.stringify(d2));
    if (!(d.open && !d.inert && d.exp === 'true' && d.lock && !d2.open && d2.inert && d2.focus === 'bur')) bad++;
  }
  console.log(`${w}px expected ${expected}: scroll0 h=${res[0].h} scrolled=${res[0].scrolled}; scroll900 h=${res[900].h} scrolled=${res[900].scrolled} top=${res[900].top}; scrollWidth ${res[0].sw}/${res[900].sw} <= clientWidth ${res[0].cw} -> ${ok ? 'OK' : 'FAIL'}`);
  if (!ok) bad++;
  await ctx.close();
}
await browser.close();
srv.close();
console.log(bad ? 'LAYOUT CHECK FAILED' : 'LAYOUT CHECK PASSED');
process.exit(bad ? 1 : 0);
