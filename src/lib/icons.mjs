// Inline line icons (24x24, stroke = currentColor), same visual language as the approved mockups: thin, rounded, one colour.
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
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6.5L20.5 7"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  doc: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M9.5 12h5M9.5 16h5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
};

/** icon('arrow') -> inline <svg>; decorative (aria-hidden). */
export function icon(name, cls = 'ic') {
  if (!P[name]) throw new Error(`unknown icon "${name}"`);
  return `<svg class="${cls}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[name]}</svg>`;
}
