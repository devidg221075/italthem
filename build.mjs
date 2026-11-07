// Static build: renders every page for both languages into dist/ and copies assets/.
import { rm, mkdir, writeFile, cp, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from './src/lib/content.mjs';
import { buildPages } from './src/lib/site-pages.mjs';
import { renderSitePage, renderNotFound } from './src/lib/views.mjs';
import { buildSitemaps, robotsTxt, SITE_URL, THEME_COLOR } from './src/lib/seo.mjs';
import { buildRedirects, buildHtaccess } from './src/lib/redirects.mjs';
import { esc } from './src/lib/html.mjs';
import { buildSearchIndex } from './src/lib/search-index.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');

/** Language chooser at /. Canonical and x-default point at /en/ (the chooser meta-refreshes there). */
export function rootPage() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ITALTHERM</title>
<meta http-equiv="refresh" content="0; url=/en/">
<meta name="theme-color" content="${THEME_COLOR}">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/img/icon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="canonical" href="${SITE_URL}/en/">
<link rel="alternate" hreflang="en" href="${SITE_URL}/en/">
<link rel="alternate" hreflang="it" href="${SITE_URL}/it/">
<link rel="alternate" hreflang="x-default" href="${SITE_URL}/en/">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font:16px/1.6 system-ui,sans-serif;color:#112337;text-align:center}a{color:#204ce5;font-weight:600;margin:0 8px}</style>
</head>
<body>
<main><h1>ITALTHERM</h1><p><a href="${esc('/en/')}" hreflang="en">English</a> · <a href="${esc('/it/')}" hreflang="it">Italiano</a></p></main>
</body>
</html>
`;
}

export async function build() {
  const contents = { en: await loadContent('en'), it: await loadContent('it') };
  const pages = buildPages(contents);
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });
  for (const page of pages) {
    const file = path.join(DIST, page.file);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, renderSitePage(page, contents));
  }
  await writeFile(path.join(DIST, 'index.html'), rootPage());
  await writeFile(path.join(DIST, '404.html'), renderNotFound(contents));
  for (const [name, xml] of Object.entries(buildSitemaps(pages))) await writeFile(path.join(DIST, name), xml);
  await writeFile(path.join(DIST, 'robots.txt'), robotsTxt());
  await writeFile(path.join(DIST, '.htaccess'), buildHtaccess(buildRedirects(contents)));
  // assets/img/src (the 3 MB originals) stays in the repo only; dist ships the optimized assets/img/opt.
  const SRC_IMG = path.join(ROOT, 'assets/img/src');
  await cp(path.join(ROOT, 'assets'), path.join(DIST, 'assets'), { recursive: true, filter: (f) => f !== SRC_IMG });
  for (const l of ['en', 'it']) await writeFile(path.join(DIST, `assets/search-${l}.json`), JSON.stringify(buildSearchIndex(contents[l], l)));
  for (const f of ['contact.php', 'contact-lib.php']) await copyFile(path.join(ROOT, 'server', f), path.join(DIST, f));
  return pages;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pages = await build();
  console.log(`built ${pages.length} pages -> dist/`);
}
