// Performance report (not part of `npm test`): builds, serves dist/ with a tiny static server, loads key pages in mobile-emulated
// Chromium (390x800) and prints transfer by type, request count, LCP, CLS, long tasks (TBT proxy) and failed requests.
//   node scripts/perf-report.mjs            (needs Playwright: NODE_PATH-style global install is resolved automatically)
//   node scripts/perf-report.mjs --desktop  (1360x900 instead)
//   node scripts/perf-report.mjs --lighthouse  (also tries `npx --yes lighthouse` once, 60 s budget)
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const desktop = process.argv.includes('--desktop');
const PAGES = ['/en/', '/en/products/', '/en/products/it-cc/', '/it/', '/en/contact/'];
const MIME = { html: 'text/html; charset=utf-8', css: 'text/css', js: 'text/javascript', webp: 'image/webp', woff2: 'font/woff2', svg: 'image/svg+xml', png: 'image/png', json: 'application/json', xml: 'application/xml', txt: 'text/plain', pdf: 'application/pdf' };

const require = createRequire(path.join(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim(), 'x.js'));
const { chromium } = require('playwright');

execFileSync('node', ['build.mjs'], { cwd: ROOT, stdio: 'inherit' });

const server = http.createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  try {
    const f = path.join(DIST, p);
    if (!f.startsWith(DIST) || !(await stat(f)).isFile()) throw new Error('nf');
    const ext = path.extname(f).slice(1);
    // The same cache policy as server/.htaccess.tpl matters for repeat visits only; a first load is measured here, so just serve.
    res.writeHead(200, { 'content-type': MIME[ext] ?? 'application/octet-stream' });
    res.end(await readFile(f));
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const typeOf = (url, ct = '') => {
  if (/\.(woff2?|ttf)$/.test(url)) return 'font';
  if (ct.startsWith('image/') || /\.(webp|png|svg|jpe?g|avif)$/.test(url)) return 'img';
  if (ct.includes('css')) return 'css';
  if (ct.includes('javascript')) return 'js';
  if (ct.includes('html')) return 'html';
  return 'other';
};

const browser = await chromium.launch();
const ctx = await browser.newContext(desktop
  ? { viewport: { width: 1360, height: 900 }, deviceScaleFactor: 1 }
  : { viewport: { width: 390, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const rows = [];
for (const url of PAGES) {
  const page = await ctx.newPage();
  const bytes = { html: 0, css: 0, js: 0, font: 0, img: 0, other: 0 };
  let requests = 0;
  const failed = [];
  page.on('requestfailed', (r) => failed.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on('response', async (r) => {
    requests++;
    if (r.status() >= 400) failed.push(`${r.url()} ${r.status()}`);
    try {
      const body = await r.body();
      bytes[typeOf(r.url(), r.headers()['content-type'])] += body.length; // uncompressed: the local server does not gzip, so this is an upper bound
    } catch { /* redirects have no body */ }
  });
  await page.addInitScript(() => {
    window.__m = { lcp: 0, lcpEl: '', cls: 0, long: 0, shifts: [] };
    new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__m.lcp = e.startTime; window.__m.lcpEl = e.url || e.element?.tagName || ''; } }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__m.cls += e.value; window.__m.shifts.push(`${e.value.toFixed(4)}@${e.startTime.toFixed(0)}ms ${e.sources.map((x) => `${x.node?.nodeName}.${x.node?.className ?? ''}`).join(',')}`); } }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.long += Math.max(0, e.duration - 50); }).observe({ type: 'longtask', buffered: true });
  });
  await page.goto(base + url, { waitUntil: 'load' });
  await page.waitForTimeout(1500); // let lazy images and late layout shifts settle
  const m = await page.evaluate(() => window.__m);
  const lcpFile = m.lcpEl ? decodeURIComponent(new URL(m.lcpEl, 'http://x').pathname.split('/').pop()) : '';
  let lcpBytes = 0;
  if (m.lcpEl.includes('/assets/img/opt/')) lcpBytes = (await stat(path.join(DIST, new URL(m.lcpEl, 'http://x').pathname))).size;
  const total = Object.values(bytes).reduce((a, b) => a + b, 0);
  rows.push({ url, total, bytes, requests, lcp: m.lcp, lcpFile, lcpBytes, cls: m.cls, shifts: m.shifts, tbt: m.long, failed });
  await page.close();
}
await browser.close();
server.close();

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`\nPerformance report: ${desktop ? 'desktop 1360x900' : 'mobile 390x800 @2x'}, first load, no throttling, local server (bytes uncompressed)\n`);
for (const r of rows) {
  console.log(`${r.url}`);
  console.log(`  transfer ${kb(r.total)}  (html ${kb(r.bytes.html)}, css ${kb(r.bytes.css)}, js ${kb(r.bytes.js)}, font ${kb(r.bytes.font)}, img ${kb(r.bytes.img)}, other ${kb(r.bytes.other)})  requests ${r.requests}`);
  console.log(`  LCP ${r.lcp.toFixed(0)} ms ${r.lcpFile ? `(${r.lcpFile}${r.lcpBytes ? `, ${kb(r.lcpBytes)}` : ''})` : ''}  CLS ${r.cls.toFixed(4)}  long-task blocking ${r.tbt.toFixed(0)} ms  failed requests ${r.failed.length ? r.failed.join('; ') : 'none'}`);
  for (const sh of r.shifts) console.log(`  layout shift ${sh}`);
}

if (process.argv.includes('--lighthouse')) {
  console.log('\nLighthouse: trying `npx --yes lighthouse` (60 s budget)...');
  const r = spawnSync('npx', ['--yes', 'lighthouse', '--version'], { encoding: 'utf8', timeout: 60000 });
  console.log(r.status === 0 ? `lighthouse ${r.stdout.trim()} is available; run it against a served dist/ manually.` : `skipped: ${r.error?.code ?? (r.stderr || '').trim().split('\n').pop()}`);
}
