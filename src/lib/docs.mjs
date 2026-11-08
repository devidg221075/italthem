// Technical-specification PDFs: URL normalisation and local paths (shared by scripts/fetch-docs.mjs, the renderer and tests).
export const ORIGIN = 'https://ital-therm.it';

/** Root-relative, protocol-relative, http(s) or bare values -> absolute https URL (spaces percent-encoded). */
export function normalizeUrl(value) {
  let u = String(value ?? '').trim();
  if (!u) throw new Error('empty URL');
  if (u.startsWith('//')) u = `https:${u}`;
  else if (u.startsWith('/')) u = `${ORIGIN}${u}`;
  else if (/^http:\/\//i.test(u)) u = u.replace(/^http:/i, 'https:');
  else if (!/^https:\/\//i.test(u)) u = `${ORIGIN}/${u}`;
  return u.replace(/ /g, '%20');
}

/** Public URL of the local copy of a product's PDF. */
export const docUrl = (slug) => `/assets/docs/${slug}.pdf`;
