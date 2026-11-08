// Downloads each product's technical-specification PDF into assets/docs/<slug>.pdf (skips files already present).
// curl with retries: the agent proxy resets some connections (6 tries, 2 s apart).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync, renameSync, rmSync, readFileSync, openSync, readSync, closeSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from '../src/lib/content.mjs';
import { normalizeUrl } from '../src/lib/docs.mjs';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/docs');
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

const isPdf = (file) => {
  const fd = openSync(file, 'r');
  const b = Buffer.alloc(5);
  readSync(fd, b, 0, 5, 0);
  closeSync(fd);
  return b.toString() === '%PDF-';
};

function download(url, dest) {
  const tmp = `${dest}.part`;
  for (let attempt = 1; attempt <= 6; attempt++) {
    const r = spawnSync('curl', ['-sSfL', '--max-time', '120', '-o', tmp, url], { encoding: 'utf8' });
    if (r.status === 0 && existsSync(tmp) && statSync(tmp).size > 0 && isPdf(tmp)) {
      renameSync(tmp, dest);
      return true;
    }
    rmSync(tmp, { force: true });
    console.warn(`  attempt ${attempt}/6 failed for ${url}: ${(r.stderr || 'not a PDF').trim().split('\n').pop()}`);
    if (attempt < 6) sleep(2000);
  }
  return false;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  mkdirSync(OUT, { recursive: true });
  const jobs = new Map();
  for (const lang of ['en', 'it']) {
    for (const p of (await loadContent(lang)).products) {
      if (!p.pdf) continue;
      const url = normalizeUrl(p.pdf);
      if (jobs.has(p.slug) && jobs.get(p.slug) !== url) console.warn(`  ${p.slug}: EN and IT PDFs differ, keeping the first (${jobs.get(p.slug)})`);
      else jobs.set(p.slug, url);
    }
  }
  let failed = 0;
  for (const [slug, url] of jobs) {
    const dest = path.join(OUT, `${slug}.pdf`);
    if (existsSync(dest) && statSync(dest).size > 0) { console.log(`have  ${slug}.pdf`); continue; }
    if (download(url, dest)) console.log(`got   ${slug}.pdf`);
    else { failed++; console.error(`FAIL  ${slug}.pdf <- ${url}`); }
  }
  process.exit(failed ? 1 : 0);
}
