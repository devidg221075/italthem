// Grid check against the master board (not part of `npm test`): builds, serves dist/ and measures the container, the page margins and
// the gutters of the card grids at the three widths of the board: desktop 1440, tablet 768, phone 390.
//   NODE_PATH=$(npm root -g) node scripts/check-grid.mjs
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const require = createRequire(path.join(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim(), 'x.js'));
const { chromium } = require('playwright');
execFileSync('node', ['build.mjs'], { cwd: ROOT, stdio: 'ignore' });

const MIME = { html: 'text/html', css: 'text/css', js: 'text/javascript', webp: 'image/webp', woff2: 'font/woff2', svg: 'image/svg+xml', json: 'application/json' };
const server = http.createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  try {
    const f = path.join(DIST, p);
    if (!f.startsWith(DIST) || !(await stat(f)).isFile()) throw new Error('nf');
    res.writeHead(200, { 'content-type': MIME[path.extname(f).slice(1)] ?? 'application/octet-stream' }).end(await readFile(f));
  } catch { res.writeHead(404).end('nf'); }
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

// width, expected content width, margin, gutter (master board: desktop container 1280 / margins 80 / gutter 24; tablet gutter 20; phone gutter 16)
const CASES = [[1440, 1280, 80, 24], [768, 768 - 64, 32, 20], [390, 390 - 32, 16, 16]];
const browser = await chromium.launch();
let bad = 0;
for (const [w, content, margin, gutter] of CASES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  await ctx.addCookies([{ name: 'it_notice', value: '1', url: base }]);
  const page = await ctx.newPage();
  await page.goto(`${base}/it/chi-siamo/`, { waitUntil: 'load' });
  const m = await page.evaluate(() => {
    const w = document.querySelector('main .w');
    const cs = getComputedStyle(w);
    const r = w.getBoundingClientRect();
    const grid = document.querySelector('.abc');
    return { left: r.left + parseFloat(cs.paddingLeft), content: r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), gap: getComputedStyle(grid).columnGap, scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth };
  });
  const ok = Math.abs(m.content - content) < 1.5 && Math.abs(m.left - margin) < 1.5 && parseFloat(m.gap) === gutter && m.scroll <= m.client;
  if (!ok) bad++;
  console.log(`${w}px: content ${m.content.toFixed(0)} (expected ${content}), margin ${m.left.toFixed(0)} (expected ${margin}), card gutter ${m.gap} (expected ${gutter}px), no horizontal scroll ${m.scroll <= m.client} -> ${ok ? 'OK' : 'FAIL'}`);
  await ctx.close();
}
await browser.close();
server.close();
console.log(bad ? 'GRID CHECK FAILED' : 'GRID CHECK PASSED');
process.exit(bad ? 1 : 0);
