// Minimal simulator of the mod_rewrite rules in dist/.htaccess: applies RewriteRule lines in order to a request path
// and returns the first terminating outcome. Understands only what build emits: `RewriteRule <regex> <target|-> [flags]`
// with R=301 / G / L flags and no conditions on those lines (RewriteCond blocks are skipped as host/HTTPS rules).
export function parseRules(htaccess) {
  const rules = [];
  let pendingCond = false;
  for (const raw of htaccess.split(/\r?\n/)) {
    const line = raw.trim();
    if (/^RewriteCond\b/.test(line)) { pendingCond = true; continue; }
    const m = line.match(/^RewriteRule\s+(\S+)\s+(\S+)(?:\s+\[([^\]]*)\])?$/);
    if (!m) continue;
    const cond = pendingCond;
    pendingCond = false;
    if (cond) continue; // host / HTTPS canonicalisation rules
    rules.push({ re: new RegExp(m[1]), target: m[2], flags: (m[3] ?? '').split(',') });
  }
  return rules;
}

/** simulate(rules, '/shop/') -> {status:301,to:'/en/products/'} | {status:410} | {status:200}. */
export function simulate(rules, urlPath) {
  const p = urlPath.replace(/^\//, '');
  for (const r of rules) {
    if (!r.re.test(p)) continue;
    if (r.flags.includes('G')) return { status: 410 };
    const redir = r.flags.find((f) => /^R(=\d+)?$/.test(f));
    if (redir) return { status: Number(redir.split('=')[1] ?? 302), to: r.target.replace(/\?$/, '') };
    if (r.flags.includes('L')) return { status: 200 };
  }
  return { status: 200 };
}
