// Minimal simulator of the mod_rewrite rules in dist/.htaccess. Understands what build emits: `RewriteRule <regex> <target|-> [flags]`
// (R=301 / G / L) with the RewriteCond lines directly above it (HTTP_HOST regex, HTTPS off, HTTP:X-Forwarded-Proto, DOCUMENT_ROOT/$0/index.html -f).
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist');

export function parseRules(htaccess) {
  const rules = [];
  let conds = [];
  for (const raw of htaccess.split(/\r?\n/)) {
    const line = raw.trim();
    const c = line.match(/^RewriteCond\s+(\S+)\s+(\S+)(?:\s+\[([^\]]*)\])?$/);
    if (c) { conds.push({ test: c[1], pattern: c[2], flags: (c[3] ?? '').split(',') }); continue; }
    const m = line.match(/^RewriteRule\s+(\S+)\s+(\S+)(?:\s+\[([^\]]*)\])?$/);
    if (!m) continue;
    rules.push({ re: new RegExp(m[1]), target: m[2], flags: (m[3] ?? '').split(','), conds });
    conds = [];
  }
  return rules;
}

const evalCond = (c, req, m0) => {
  const neg = c.pattern.startsWith('!');
  const pat = neg ? c.pattern.slice(1) : c.pattern;
  let ok;
  if (c.test === '%{HTTP_HOST}') ok = new RegExp(pat, c.flags.includes('NC') ? 'i' : '').test(req.host);
  else if (c.test === '%{HTTPS}') ok = (req.scheme === 'https' ? 'on' : 'off') === pat;
  else if (c.test === '%{HTTP:X-Forwarded-Proto}') ok = new RegExp(pat).test(req.xfp ?? '');
  else if (c.test === '%{DOCUMENT_ROOT}/$0/index.html' && pat === '-f') ok = existsSync(path.join(DIST, m0, 'index.html'));
  else throw new Error(`simulator does not know condition ${c.test} ${c.pattern}`);
  return neg ? !ok : ok;
};

/** One request, first terminating rule. -> {status, to?, url?}: `to` is the path when the target is the canonical origin, `url` the absolute URL. */
export function simulate(rules, urlPath, req = {}) {
  const r0 = { scheme: 'https', host: 'ital-therm.it', ...req };
  const p = urlPath.replace(/^\//, '');
  for (const r of rules) {
    const m = p.match(r.re);
    if (!m) continue;
    if (!r.conds.every((c) => evalCond(c, r0, m[0]))) continue;
    if (r.flags.includes('G')) return { status: 410 };
    const redir = r.flags.find((f) => /^R(=\d+)?$/.test(f));
    if (redir) {
      const url = r.target.replace(/\?$/, '').replace('%{REQUEST_URI}', `/${p}`).replace('$0', m[0]);
      const to = url.startsWith('https://ital-therm.it/') ? url.slice('https://ital-therm.it'.length) : url;
      return { status: Number(redir.split('=')[1] ?? 302), to, url };
    }
    if (r.flags.includes('L')) return { status: 200 };
  }
  return { status: 200 };
}

/** Follows redirects from scheme+host+path: -> {status, hops, final:{scheme,host,path}, chain:[urls]}. Throws on loops (>6 hops). */
export function follow(rules, scheme, host, urlPath, xfp) {
  let cur = { scheme, host, path: urlPath };
  const chain = [];
  for (let hops = 0; hops <= 6; hops++) {
    const r = simulate(rules, cur.path, { scheme: cur.scheme, host: cur.host, xfp });
    if (r.status !== 301 && r.status !== 302) return { status: r.status, hops, final: cur, chain };
    const u = new URL(r.url, `${cur.scheme}://${cur.host}`);
    cur = { scheme: u.protocol.slice(0, -1), host: u.host, path: u.pathname };
    chain.push(u.href);
  }
  throw new Error(`redirect loop from ${scheme}://${host}${urlPath}: ${chain.join(' -> ')}`);
}
