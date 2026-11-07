// Icons. Two sources, one visual language (line icons, one colour from the text):
//  - the official icon kit traced from the approved master board, served as one cached sprite (assets/img/icons.svg, built by scripts/build-icons.mjs);
//  - a few small inline line icons for what the kit does not have (menu, close, arrows, pin, phone, the four product families, factory).

/** Name used in the templates -> symbol id in assets/img/icons.svg. */
export const SPRITE = {
  search: 'ricerca',
  download: 'download',
  doc: 'documento',
  globe: 'lingua',
  mail: 'contatti',
  gear: 'tecnologia',
  handshake: 'supporto-tecnico',
  layers: 'soluzioni-su-misura',
  home: 'home',
  check: 'spunta',
  headset: 'assistenza',
  video: 'video',
  upload: 'carica-file',
  product: 'prodotto',
  furnace: 'forno',
};
export const SPRITE_URL = '/assets/img/icons.svg';

const P = {
  // belt / conveyor: continuous casting
  conveyor: '<rect x="3" y="9" width="18" height="6" rx="3"/><circle cx="7" cy="12" r="1.4"/><circle cx="17" cy="12" r="1.4"/>',
  // crucible: melting furnaces
  crucible: '<path d="M5 6h14M6 6v7a6 6 0 0 0 12 0V6"/><path d="M5 9.5h14"/><path d="M9 21h6"/>',
  // heat waves: annealing / heat treatment
  heat: '<path d="M7 4c-2 2.2 2 3.8 0 6s2 3.8 0 6"/><path d="M12 4c-2 2.2 2 3.8 0 6s2 3.8 0 6"/><path d="M17 4c-2 2.2 2 3.8 0 6s2 3.8 0 6"/>',
  // dots in a pyramid: grain production
  grains: '<circle cx="12" cy="5" r="1.3"/><circle cx="8.5" cy="10" r="1.3"/><circle cx="15.5" cy="10" r="1.3"/><circle cx="5" cy="15" r="1.3"/><circle cx="12" cy="15" r="1.3"/><circle cx="19" cy="15" r="1.3"/><circle cx="8.5" cy="20" r="1.3"/><circle cx="15.5" cy="20" r="1.3"/>',
  arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  back: '<path d="M20 12H5M11 6l-6 6 6 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  phone: '<path d="M6.6 3.5h3l1.4 4-2 1.4a11 11 0 0 0 5.1 5.1l1.4-2 4 1.4v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  factory: '<path d="M3 21V10l5 3V10l5 3V6l5 2.5V21z"/><path d="M3 21h18M8 17h2M13 17h2"/>',
};

/** icon('arrow') -> inline <svg>; icon('search') -> <svg><use> from the sprite. Decorative (aria-hidden). */
export function icon(name, cls = 'ic') {
  if (SPRITE[name]) {
    return `<svg class="${cls}" viewBox="0 0 32 32" width="24" height="24" aria-hidden="true" focusable="false"><use href="${SPRITE_URL}#${SPRITE[name]}"/></svg>`;
  }
  if (!P[name]) throw new Error(`unknown icon "${name}"`);
  return `<svg class="${cls}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[name]}</svg>`;
}
