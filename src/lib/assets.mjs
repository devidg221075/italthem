import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Cache-busting URL for a built asset: assetUrl('/assets/css/site.css') -> '/assets/css/site.css?v=1a2b3c4d'
 * (first 8 hex digits of the file's sha1), so CSS/JS can be cached for a year and still update on deploy.
 * `root` is the folder that contains `assets/` (overridable for tests).
 */
export function assetUrl(urlPath, root = ROOT) {
  const hash = createHash('sha1').update(readFileSync(path.join(root, urlPath.replace(/^\//, '')))).digest('hex').slice(0, 8);
  return `${urlPath}?v=${hash}`;
}
