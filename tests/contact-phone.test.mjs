import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Optional phone field (contact form, handler, privacy notice).
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

function run(calls) {
  const r = spawnSync('php', ['tests/php/driver.php'], { cwd: ROOT, input: JSON.stringify({ calls }), encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  return JSON.parse(r.stdout);
}
const valid = () => ({
  company: 'ACME S.r.l.', first_name: 'Mario', last_name: 'Rossi', email: 'mario@example.com', email_confirm: 'mario@example.com',
  message: 'Vorrei un preventivo per un forno.', consent: '1', website: '', lang: 'en', product: '',
});
const qp = (b) => Buffer.from(b.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))), 'latin1').toString('utf8');
const one = (post) => { const o = run([{ post }]); return { r: o.results[0], mails: o.mails.map((m) => ({ ...m, body: qp(m.body) })) }; };

test('phone is optional: absent or empty is accepted and shown as "-" in the email', () => {
  for (const phone of [undefined, '', '   ']) {
    const post = valid();
    if (phone !== undefined) post.phone = phone;
    const { r, mails } = one(post);
    assert.deepEqual([r.status, r.ok, mails.length], [200, true, 1], JSON.stringify(phone));
    assert.match(mails[0].body, /^Phone: -$/m);
  }
});

test('valid phone numbers are accepted and written to the email body', () => {
  for (const phone of ['+39 0575 802485', '0575802485', '+39 366 871 9427', '(0575) 802-485', '+1.555.123.4567', '0039/0575/802485']) {
    const { r, mails } = one({ ...valid(), phone });
    assert.deepEqual([r.status, r.ok], [200, true], phone);
    assert.match(mails[0].body, new RegExp(`^Phone: ${phone.replace(/[+().\\/]/g, '\\$&')}$`, 'm'), phone);
  }
});

test('invalid phone numbers are rejected with the phone field, in both languages, and nothing is sent', () => {
  const bad = ['abc', '12345', '+39 0575 80x485', 'call me', '0575 802485 ext 12', '1'.repeat(16), '1'.repeat(31), '++390575802485', '+', '-0575802485'];
  for (const lang of ['en', 'it']) {
    for (const phone of bad) {
      const { r, mails } = one({ ...valid(), lang, phone });
      assert.deepEqual([r.status, r.ok, r.field, mails.length], [422, false, 'phone', 0], `${lang}: ${phone}`);
      assert.ok(r.error && r.error.length > 10);
    }
  }
});

test('line breaks in the phone field (header injection) are rejected', () => {
  const { r, mails } = one({ ...valid(), phone: '0575802485\r\nBcc: evil@example.com' });
  assert.deepEqual([r.ok, r.field, mails.length], [false, 'phone', 0]);
});

test('an invalid phone does not use up the visitor rate limit slot', () => {
  const calls = [{ post: { ...valid(), phone: 'abc' } }, { post: valid() }, { post: valid() }, { post: valid() }];
  const o = run(calls);
  assert.deepEqual(o.results.map((x) => x.ok), [false, true, true, true]);
});

before(() => { execFileSync('node', ['build.mjs'], { cwd: ROOT, stdio: 'pipe' }); });

for (const [lang, file, label] of [['en', 'en/contact/index.html', 'Phone'], ['it', 'it/contatti/index.html', 'Telefono']]) {
  test(`${lang}: the form has an optional tel field next to the company, and the privacy notice mentions the phone number`, () => {
    const html = readFileSync(path.join(DIST, file), 'utf8');
    const f = html.match(/<input class="inp" id="f-phone"[^>]*>/)?.[0];
    assert.ok(f, 'phone input');
    assert.match(f, /name="phone"/);
    assert.match(f, /type="tel"/);
    assert.match(f, /autocomplete="tel"/);
    assert.match(f, /maxlength="30"/);
    assert.ok(!/required/.test(f), 'optional');
    assert.ok(html.includes(`<label for="f-phone">${label}</label>`), 'label without the "required" marker');
    assert.ok(html.indexOf('id="f-company"') < html.indexOf('id="f-phone"') && html.indexOf('id="f-phone"') < html.indexOf('id="f-product"'));
    const privacy = readFileSync(path.join(DIST, lang === 'en' ? 'en/privacy/index.html' : 'it/privacy/index.html'), 'utf8');
    assert.ok(lang === 'en' ? privacy.includes('your phone number if you choose to enter it') : privacy.includes('il tuo numero di telefono se scegli di inserirlo'));
  });
}
