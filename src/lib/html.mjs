const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape any value for use in HTML text or attribute context. */
export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => MAP[c]);
}

const SMALL = new Set(['of', 'and', 'for', 'the', 'a', 'an', 'in', 'on', 'to', 'with', 'di', 'del', 'della', 'e', 'per', 'con', 'il', 'la', 'lo', 'le', 'i', 'un', 'una', 'da', 'a', 'ad', 'dei', 'degli', 'delle', 'nel', 'nella', 'sul', 'su']);

/** UPPERCASE content title -> display Title Case; keeps model codes (IT.CC) and small words lower-case. */
export function displayTitle(title) {
  return String(title)
    .split(/(\s+)/)
    .map((tok, idx, all) => {
      if (/^\s*$/.test(tok)) return tok;
      const first = all.slice(0, idx).every((t) => /^\s*$/.test(t));
      return tok
        .split('-')
        .map((part, i) => {
          if (/[.\d]/.test(part)) return part; // model codes such as IT.GT, IT.CC, M2
          const low = part.toLowerCase();
          if (SMALL.has(low) && !(first && i === 0)) return low;
          return low.charAt(0).toUpperCase() + low.slice(1);
        })
        .join('-');
    })
    .join('');
}
