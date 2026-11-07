import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const ROOT = new URL('..', import.meta.url).pathname;

function run(calls, extra = {}) {
  const r = spawnSync('php', ['tests/php/driver.php'], { cwd: ROOT, input: JSON.stringify({ calls, ...extra }), encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  return JSON.parse(r.stdout);
}
const valid = () => ({
  first_name: 'Mario', last_name: 'Rossi', email: 'mario@example.com', email_confirm: 'Mario@Example.com',
  message: 'Vorrei un preventivo per un forno.', consent: '1', website: '', lang: 'en', product: '',
});
const one = (post, server) => { const o = run([{ post, server }]); return { r: o.results[0], mails: o.mails }; };

test('php -l on both PHP files', () => {
  for (const f of ['server/contact-lib.php', 'server/contact.php']) {
    const r = spawnSync('php', ['-l', f], { cwd: ROOT, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
  }
});

test('valid input: mailer called once, fixed recipient, Reply-To visitor', () => {
  const { r, mails } = one(valid());
  assert.deepEqual([r.status, r.ok], [200, true]);
  assert.equal(mails.length, 1);
  assert.equal(mails[0].to, 'info@ital-therm.it');
  const h = mails[0].headers.join('\n');
  assert.match(h, /^From: .*no-reply@ital-therm\.it/m);
  assert.match(h, /^Reply-To: mario@example\.com$/m);
  assert.match(h, /charset=UTF-8/i);
  assert.equal(mails[0].subject, '[ital-therm.it] Request from Mario Rossi');
  assert.match(mails[0].body, /Vorrei un preventivo/);
  assert.match(mails[0].body, /203\.0\.113\.7/);
  assert.match(mails[0].body, /TestAgent\/1\.0/);
});

test('empty required fields report the offending field', () => {
  for (const f of ['first_name', 'last_name', 'email', 'message']) {
    const p = { ...valid(), [f]: '   ' };
    if (f === 'email') p.email_confirm = '';
    const { r, mails } = one(p);
    assert.equal(r.ok, false, f);
    assert.equal(r.status, 422, f);
    assert.equal(r.field, f);
    assert.ok(r.error);
    assert.equal(mails.length, 0);
  }
});

test('missing consent, mismatched or invalid emails are rejected', () => {
  let { r, mails } = one({ ...valid(), consent: '' });
  assert.deepEqual([r.ok, r.field, mails.length], [false, 'consent', 0]);
  ({ r, mails } = one({ ...valid(), email_confirm: 'other@example.com' }));
  assert.deepEqual([r.ok, r.field, mails.length], [false, 'email_confirm', 0]);
  ({ r, mails } = one({ ...valid(), email: 'not-an-email', email_confirm: 'not-an-email' }));
  assert.deepEqual([r.ok, r.field, mails.length], [false, 'email', 0]);
});

test('honeypot filled: pretends success and sends nothing', () => {
  const { r, mails } = one({ ...valid(), website: 'http://spam.example' });
  assert.deepEqual([r.status, r.ok], [200, true]);
  assert.equal(mails.length, 0);
});

test('CR/LF in name or email is rejected (header injection)', () => {
  for (const [f, v] of [['first_name', 'Mario\r\nBcc: x@evil.test'], ['last_name', 'Rossi\nBcc: x@evil.test'], ['email', 'a@example.com\r\nBcc: x@evil.test']]) {
    const p = { ...valid(), [f]: v };
    if (f === 'email') p.email_confirm = v;
    const { r, mails } = one(p);
    assert.equal(r.ok, false, f);
    assert.equal(r.field, f);
    assert.equal(mails.length, 0, f);
  }
});

test('message length limits', () => {
  let { r, mails } = one({ ...valid(), message: 'short' });
  assert.deepEqual([r.ok, r.field, mails.length], [false, 'message', 0]);
  ({ r, mails } = one({ ...valid(), message: 'x'.repeat(5001) }));
  assert.deepEqual([r.ok, r.field, mails.length], [false, 'message', 0]);
  ({ r } = one({ ...valid(), message: 'x'.repeat(5000) }));
  assert.equal(r.ok, true);
  ({ r } = one({ ...valid(), first_name: 'x'.repeat(81) }));
  assert.equal(r.field, 'first_name');
});

test('non-POST is rejected with 405; array values do not crash', () => {
  const { r, mails } = one(valid(), { REQUEST_METHOD: 'GET' });
  assert.deepEqual([r.status, r.ok, mails.length], [405, false, 0]);
  const o = one({ ...valid(), first_name: ['a'] });
  assert.deepEqual([o.r.ok, o.r.field], [false, 'first_name']);
});

test('4th accepted submission within an hour from the same IP gets 429; later hour is fine', () => {
  const t = 1800000000;
  const o = run([0, 1, 2, 3].map((i) => ({ post: valid(), now: t + i * 60 })).concat([{ post: valid(), now: t + 4000 }]));
  assert.deepEqual(o.results.map((x) => x.status), [200, 200, 200, 429, 200]);
  assert.equal(o.mails.length, 4);
  // other IP is unaffected
  const p = run([0, 1, 2].map(() => ({ post: valid() })).concat([{ post: valid(), server: { REMOTE_ADDR: '198.51.100.9' } }]));
  assert.equal(p.results[3].status, 200);
});

test('rejected submissions do not consume the rate limit', () => {
  const bad = { post: { ...valid(), consent: '' } };
  const o = run([bad, bad, bad, bad, { post: valid() }]);
  assert.equal(o.results[4].status, 200);
});

test('unknown product is ignored, known product appears in the subject', () => {
  let { mails } = one({ ...valid(), product: 'it-evil\r\nBcc: x@y.z' });
  assert.equal(mails[0].subject, '[ital-therm.it] Request from Mario Rossi');
  assert.ok(!mails[0].body.includes('evil'));
  ({ mails } = one({ ...valid(), product: 'it-cc' }));
  assert.match(mails[0].subject, /=\?UTF-8\?B\?/); // non-ASCII dash is MIME-encoded
  assert.match(mails[0].body, /IT\.CC/);
});

test('recipient cannot be overridden by the request', () => {
  const { mails } = one({ ...valid(), to: 'x@evil.test', email_to: 'y@evil.test', recipient: 'z@evil.test' });
  assert.equal(mails.length, 1);
  assert.equal(mails[0].to, 'info@ital-therm.it');
  assert.ok(!mails[0].headers.join('\n').includes('evil'));
  assert.ok(!mails[0].body.includes('evil'));
});

test('error text follows the visitor language and does not leak internals', () => {
  const { r } = one({ ...valid(), lang: 'it', consent: '' });
  assert.match(r.error, /consenso|privacy/i);
  const en = one({ ...valid(), consent: '' }).r;
  assert.notEqual(en.error, r.error);
  const bad = one({ ...valid(), lang: 'xx', consent: '' }).r;
  assert.equal(bad.error, en.error);
});

test('mailer failure returns a generic 500 and does not consume quota', () => {
  const o = run([{ post: valid() }, { post: valid() }, { post: valid() }, { post: valid() }], { mailerOk: false });
  assert.deepEqual(o.results.map((x) => x.status), [500, 500, 500, 500]);
  assert.ok(!/mail\(|sendmail|\/tmp|stack/i.test(o.results[0].error));
});

test('control characters are stripped from the message body', () => {
  const { mails } = one({ ...valid(), message: 'Hello\u0000 there\u0007, request.\r\nSecond line' });
  assert.ok(!/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(mails[0].body));
  assert.match(mails[0].body, /Second line/);
});
