// Fetches pages of the live site with curl (the sandbox proxy resets some
// connections at random, so every URL is retried) and stores the raw HTML in
// content/original/html/. URLs that still fail are listed in content/MISSING.txt.
//
// Usage: node scripts/crawl.mjs <url|url=file.html> [...]
//   crawl(['https://ital-therm.it/it/'])                 -> html/it__it.html
//   crawl([{ url: '...', file: 'p-kb.html' }])           -> html/p-kb.html
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML_DIR = path.join(ROOT, 'content/original/html');
const MISSING = path.join(ROOT, 'content/MISSING.txt');
const UA = 'Mozilla/5.0';

export function fileNameFor(url) {
  const p = new URL(url).pathname.replace(/^\/|\/$/g, '').replace(/\//g, '__');
  return `${p || 'home'}.html`;
}

function fetchOnce(url, out) {
  const code = execFileSync(
    'curl',
    ['-sS', '-m', '60', '-A', UA, '-o', out, '-w', '%{http_code}', url],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  return Number(code);
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export async function crawl(urls, { retries = 6, delayMs = 2000, dir = HTML_DIR, missingFile = MISSING } = {}) {
  mkdirSync(dir, { recursive: true });
  const missing = [];
  for (const entry of urls) {
    const { url, file } = typeof entry === 'string' ? { url: entry, file: fileNameFor(entry) } : entry;
    const out = path.join(dir, file);
    let ok = false;
    for (let i = 1; i <= retries && !ok; i++) {
      try {
        ok = fetchOnce(url, out) === 200;
      } catch {
        ok = false;
      }
      if (!ok && i < retries) sleep(delayMs);
    }
    console.log(`${ok ? 'ok     ' : 'MISSING'} ${url} -> ${file}`);
    if (!ok) missing.push(url);
  }
  if (missing.length) {
    const prev = existsSync(missingFile) ? readFileSync(missingFile, 'utf8').split('\n').filter(Boolean) : [];
    writeFileSync(missingFile, [...new Set([...prev, ...missing])].join('\n') + '\n');
    throw new Error(
      `${missing.length} URL(s) could not be fetched (listed in content/MISSING.txt). ` +
        'Please provide a WordPress export (Strumenti > Esporta) so the text can be taken from it.',
    );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2).map((a) => {
    const [url, file] = a.split('=');
    return file ? { url, file } : url;
  });
  if (!args.length) {
    console.error('usage: node scripts/crawl.mjs <url|url=file.html> ...');
    process.exit(2);
  }
  crawl(args).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
