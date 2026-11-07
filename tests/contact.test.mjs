import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const read = (rel) => readFileSync(path.join(DIST, rel), 'utf8');
const count = (s, re) => (s.match(re) || []).length;
const PAGES = { en: ['en/contact/index.html', 'en/privacy/index.html'], it: ['it/contatti/index.html', 'it/privacy/index.html'] };

before(() => { execFileSync('node', ['build.mjs'], { cwd: ROOT, stdio: 'pipe' }); });

for (const lang of ['en', 'it']) {
  test(`[${lang}] contact form: labelled controls, honeypot, hidden inputs, privacy link, one h1`, () => {
    const html = read(PAGES[lang][0]);
    assert.equal(count(html, /<h1[\s>]/g), 1);
    const form = html.match(/<form\b[^>]*class="fl"[^>]*>[\s\S]*?<\/form>/)?.[0];
    assert.ok(form, 'form.fl exists');
    assert.match(form, /action="\/contact\.php"/);
    assert.match(form, /method="post"/i);
    assert.ok(!/\bnovalidate\b/.test(form));
    const tag = (re) => [...form.matchAll(re)].map((m) => m[0]);
    for (const el of tag(/<(?:input|textarea)\b[^>]*>/g)) {
      if (/type="hidden"/.test(el)) continue;
      const id = el.match(/\bid="([^"]+)"/)?.[1];
      const wrapped = /<label\b[^>]*>(?:(?!<\/label>)[\s\S])*?<input\b[^>]*name="consent"/.test(form) && /name="consent"/.test(el);
      const labelled = wrapped || /aria-label="[^"]+"/.test(el) || (id && new RegExp(`<label[^>]*for="${id}"`).test(form));
      assert.ok(labelled, `unlabelled control: ${el}`);
    }
    for (const n of ['first_name', 'last_name', 'email', 'message']) {
      assert.match(form, new RegExp(`<(?:input|textarea)\\b[^>]*name="${n}"[^>]*\\brequired\\b|<(?:input|textarea)\\b[^>]*\\brequired\\b[^>]*name="${n}"`), n);
    }
    assert.match(form, /name="email_confirm"[^>]*autocomplete="email"|autocomplete="email"[^>]*name="email_confirm"/);
    assert.match(form, /name="first_name"[^>]*autocomplete="given-name"/);
    assert.match(form, /name="last_name"[^>]*autocomplete="family-name"/);
    const consent = form.match(/<input\b[^>]*name="consent"[^>]*>/)[0];
    assert.match(consent, /type="checkbox"/);
    assert.match(consent, /\brequired\b/);
    const hp = form.match(/<[^>]*name="website"[^>]*>/)[0];
    assert.match(hp, /tabindex="-1"/);
    assert.match(hp, /autocomplete="off"/);
    assert.match(form, /<div[^>]*class="hp"[^>]*aria-hidden="true"/);
    assert.ok(form.includes(`<input type="hidden" name="lang" value="${lang}">`));
    const sel = form.match(/<select class="inp" id="f-product" name="product">[\s\S]*?<\/select>/)?.[0];
    assert.ok(sel, 'visible product select (the handler validates the slug)');
    assert.match(sel, /<option value="">/);
    assert.equal(count(sel, /<option value="it-/g), 11);
    assert.ok(sel.includes('<option value="it-cc">IT.CC – '));
    assert.match(form, /<label for="f-product">/);
    assert.ok(form.includes(`href="/${lang}/privacy/"`));
    assert.match(form, /<button[^>]*type="submit"[^>]*>(Send request|Invia richiesta)<svg/);
    assert.match(form, /aria-live="polite"/);
    assert.match(form, /data-products='\{[^']*"it-cc":"IT\.CC"/);
    assert.match(form, /<fieldset class="nm"><legend>(First name and last name|Nome e cognome del contatto)/);
    assert.match(form, /name="email_confirm"[^>]*maxlength="254"/);
    const comp = form.match(/<input\b[^>]*name="company"[^>]*>/)?.[0];
    assert.ok(comp, 'both languages have a company field (the handler accepts it on both)');
    assert.match(comp, /maxlength="120"/); assert.match(comp, /autocomplete="organization"/);
    assert.ok(!/required/.test(comp), 'optional on both forms, as in the approved mockup');
    assert.match(form, lang === 'it' ? /<label for="f-company">Azienda</ : /<label for="f-company">Company</);
    assert.ok(form.indexOf('name="company"') < form.indexOf('name="message"'));
    for (const a of ['data-ok', 'data-err', 'data-sending', 'data-about']) assert.ok(form.includes(a), a);
  });

  test(`[${lang}] contact page keeps the original side blocks, links the phones and has a click-to-load map`, () => {
    const html = read(PAGES[lang][0]);
    assert.ok(html.includes('02487940518') && html.includes('info@ital-therm.it') && html.includes('+39 0575 802485'));
    for (const p of ['+390575802485', '+393668719427']) assert.ok(html.includes(`href="tel:${p}"`), p);
    assert.ok(html.includes('href="mailto:info@ital-therm.it"'));
    assert.ok(html.includes('href="https://wa.me/393668719427"'));
    const map = html.match(/<div class="map" data-embed="([^"]+)" data-title="[^"]+">[\s\S]*?<p class="mn">[^<]+<\/p><\/div><\/div>/);
    assert.ok(map, 'map block with the embed address in a data attribute');
    assert.match(map[1], /^https:\/\/www\.google\.com\/maps\?q=Viale%20S\.%20Maria%20delle%20Vertighe[^"]*Monte%20San%20Savino[^"]*&amp;hl=(it|en)&amp;z=16&amp;output=embed$/);
    assert.match(map[0], /<button class="btn b1 mlb" type="button" hidden>/, 'load button is hidden until JS runs');
    assert.match(map[0], /href="https:\/\/www\.google\.com\/maps\/search\/\?api=1&amp;query=[^"]+" target="_blank" rel="noopener"/, 'plain link works without JS');
    assert.ok(!/<iframe/.test(html), 'nothing from Google is loaded until the visitor presses the button');
    assert.ok(!/810487|Le Vertighe, 50|Sonico/.test(html));
  });

  test(`[${lang}] privacy page has the company data and one h1`, () => {
    const html = read(PAGES[lang][1]);
    assert.equal(count(html, /<h1[\s>]/g), 1);
    for (const s of ['ITALTHERM S.r.l.', '02487940518', 'info@ital-therm.it', 'Monte San Savino', 'garanteprivacy.it', 'it_notice', String(new Date().getFullYear())]) {
      assert.ok(html.includes(s), s);
    }
    assert.match(html, /Artt?\. ?15/);
  });

  test(`[${lang}] notice banner is hidden by default and links to the privacy page`, () => {
    for (const f of [...PAGES[lang], `${lang}/index.html`]) {
      const html = read(f);
      const m = html.match(/<div class="nb"[^>]*>[\s\S]*?<\/div>/);
      assert.ok(m, f);
      assert.match(m[0], /\bhidden\b/);
      assert.match(m[0], /role="region"/);
      assert.match(m[0], /aria-label="[^"]+"/);
      assert.ok(m[0].includes(`href="/${lang}/privacy/"`));
      assert.match(m[0], /<button[^>]*type="button"[^>]*>OK<\/button>/);
    }
  });
}

test('contact.php and its lib are copied to dist', () => {
  assert.ok(existsSync(path.join(DIST, 'contact.php')));
  assert.ok(existsSync(path.join(DIST, 'contact-lib.php')));
});

test('site.js sets the it_notice cookie; contact.js (contact page only) wires the form and the product prefill', () => {
  const js = readFileSync(path.join(ROOT, 'assets/js/site.js'), 'utf8');
  assert.match(js, /it_notice=1/);
  assert.match(js, /Max-Age=15552000/);
  assert.match(js, /SameSite=Lax/);
  assert.ok(!/localStorage|sessionStorage/.test(js));
  const form = readFileSync(path.join(ROOT, 'assets/js/contact.js'), 'utf8');
  assert.match(form, /contact\.php/);
  assert.match(form, /form\.elements\.product\.value = pr/);
  assert.ok(!/localStorage|sessionStorage|innerHTML/.test(form));
  for (const f of ['en/contact/index.html', 'it/contatti/index.html']) {
    const html = readFileSync(path.join(DIST, f), 'utf8');
    assert.match(html, /<script src="\/assets\/js\/contact\.js\?v=[0-9a-f]{8}" defer><\/script>/);
    assert.match(html, /<link rel="stylesheet" href="\/assets\/css\/contact\.css\?v=[0-9a-f]{8}">/);
  }
  assert.ok(!readFileSync(path.join(DIST, 'en/index.html'), 'utf8').includes('contact.js'), 'other pages do not load it');
});
