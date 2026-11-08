// Downloads every original image referenced by content into assets/img/src/ (skips files already present).
// curl is used on purpose: the agent proxy resets some connections, so each file is retried (6 tries, 2 s apart).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync, renameSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from '../src/lib/content.mjs';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/img/src');
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

export async function imageUrls() {
  const urls = new Set();
  for (const lang of ['en', 'it']) {
    const c = await loadContent(lang);
    for (const p of c.products) for (const u of p.images || []) urls.add(u);
  }
  return [...urls].sort();
}

function download(url, dest) {
  const tmp = `${dest}.part`;
  for (let attempt = 1; attempt <= 6; attempt++) {
    const r = spawnSync('curl', ['-sSfL', '--max-time', '120', '-o', tmp, url], { encoding: 'utf8' });
    if (r.status === 0 && existsSync(tmp) && statSync(tmp).size > 0) {
      renameSync(tmp, dest);
      return true;
    }
    rmSync(tmp, { force: true });
    console.warn(`  attempt ${attempt}/6 failed for ${url}: ${(r.stderr || '').trim().split('\n').pop()}`);
    if (attempt < 6) sleep(2000);
  }
  return false;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  mkdirSync(OUT, { recursive: true });
  let failed = 0;
  for (const url of await imageUrls()) {
    const file = path.join(OUT, decodeURIComponent(path.basename(new URL(url).pathname)));
    if (existsSync(file) && statSync(file).size > 0) continue;
    console.log(`fetch ${url}`);
    if (!download(url, file)) { failed++; console.error(`FAILED ${url}`); }
  }
  if (failed) { console.error(`${failed} image(s) failed`); process.exitCode = 1; } else console.log('images ok');
}
