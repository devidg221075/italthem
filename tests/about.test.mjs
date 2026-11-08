import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from '../src/lib/content.mjs';
import { esc } from '../src/lib/html.mjs';

// Company page (approved mockup, variant B). The mockup restructures the page; the original text must all still be there.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const read = (rel) => readFileSync(path.join(DIST, rel), 'utf8');
const count = (s, re) => (s.match(re) || []).length;
let contents;
before(async () => {
  execFileSync('node', ['build.mjs'], { cwd: ROOT, stdio: 'pipe' });
  contents = { en: await loadContent('en'), it: await loadContent('it') };
});

for (const [lang, file] of [['en', 'en/about-us/index.html'], ['it', 'it/chi-siamo/index.html']]) {
  test(`${lang} about: hero, strip of four reasons, "who we are" and three solution cards`, () => {
    const html = read(file);
    assert.equal(count(html, /<h1>/g), 1);
    assert.ok(html.includes(lang === 'it' ? '<h1>Tecnologia italiana per i metalli preziosi</h1>' : '<h1>Italian technology for precious metals</h1>'));
    assert.equal(count(html, /<section class="ab-h">/g), 1);
    const strip = html.match(/<ul class="abs">[\s\S]*?<\/ul>/)[0];
    assert.equal(count(strip, /<li>/g), 4);
    assert.equal(count(html, /<article class="acd">/g), 3);
    assert.equal(count(html, /<section class="cta-s">/g), 1, 'CTA strip before the footer');
    assert.match(html, /<link rel="stylesheet" href="\/assets\/css\/about\.css\?v=[0-9a-f]{8}">/);
    assert.equal(count(html.match(/<main[\s\S]*?<\/main>/)[0], /<img /g), 5, 'hero, who we are, three cards');
    assert.equal(count(html, /fetchpriority="high"/g), 1, 'only the hero photo is the LCP image');
  });

  test(`${lang} about: every original paragraph, list item and heading is still on the page`, () => {
    const html = read(file);
    const page = contents[lang].pages.find((p) => p.slug === 'about');
    const texts = [page.lead];
    for (const s of page.sections) {
      texts.push(s.heading, ...(s.blocks ?? []).flatMap((b) => (b.type === 'list' ? b.items : [b.text])));
    }
    texts.push(page.sections[1].kicker);
    for (const t of texts.filter(Boolean)) assert.ok(html.includes(esc(t)), `missing: ${t.slice(0, 70)}`);
  });
}
