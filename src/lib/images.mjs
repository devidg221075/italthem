import path from 'node:path';

/** imageUrl('https://…/Foo.jpg' | 'Foo.jpg') -> '/assets/img/src/Foo.jpg'. Task 9 upgrades this to optimized srcset/width/height. */
export function imageUrl(name) {
  const file = decodeURIComponent(path.posix.basename(String(name).split(/[?#]/)[0]));
  return `/assets/img/src/${encodeURIComponent(file)}`;
}
