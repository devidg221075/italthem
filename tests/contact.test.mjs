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
    assert.match(form, /<input type="hidden" name="product" value="">/);
    assert.ok(form.includes(`href="/${lang}/privacy/"`));
    assert.match(form, /<button[^>]*type="submit"[^>]*>(Send request|Invia richiesta)<\/button>/);
    assert.match(form, /aria-live="polite"/);
    assert.match(form, /data-products='\{[^']*"it-cc":"IT\.CC"/);
    assert.match(form, /<fieldset class="nm"><legend>(First name and last name|Nome e cognome del contatto)/);
    assert.match(form, /name="email_confirm"[^>]*maxlength="254"/);
    const comp = form.match(/<input\b[^>]*name="company"[^>]*>/)?.[0];
    if (lang === 'it') {
      assert.ok(comp, 'IT has a company field');
      assert.match(comp, /required/); assert.match(comp, /maxlength="120"/); assert.match(comp, /autocomplete="organization"/);
      assert.match(form, /<label for="f-company">Azienda/);
      assert.ok(form.indexOf('name="company"') < form.indexOf('name="first_name"'));
    } else assert.ok(!comp, 'EN has no company field');
    for (const a of ['data-ok', 'data-err', 'data-sending', 'data-about']) assert.ok(form.includes(a), a);
  });

  test(`[${lang}] contact page keeps the original side blocks and no map yet`, () => {
    const html = read(PAGES[lang][0]);
    assert.ok(html.includes('02487940518') && html.includes('info@ital-therm.it') && html.includes('+39 0575 802485'));
    assert.ok(!/class="map"|wa\.me|api\.whatsapp/.test(html), 'map / WhatsApp belong to Task 10');
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

test('site.js wires the form, product prefill and the it_notice cookie', () => {
  const js = readFileSync(path.join(ROOT, 'assets/js/site.js'), 'utf8');
  assert.match(js, /it_notice=1/);
  assert.match(js, /Max-Age=15552000/);
  assert.match(js, /SameSite=Lax/);
  assert.match(js, /contact\.php|form\.action/);
  assert.ok(!/localStorage|sessionStorage/.test(js));
});
