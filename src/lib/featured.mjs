// Editorial selections for the home page. `image` is the index into product.images of the machine overview photo
// (checked visually: index 0 is the full machine for these four; IT.AF[0] is Contr.-atmosphere-annealing-furnace_AF400.jpg).
// IT.GT goes first: its photo is the lightest (36 KB vs 129 KB for IT.CC) and the first slide is the page LCP image.
export const HERO_SLIDES = [
  { code: 'IT.GT', image: 0, cat: 'melt' },
  { code: 'IT.CC', image: 0, cat: 'cc' },
  { code: 'IT.AF', image: 0, cat: 'heat' },
  { code: 'IT.GMS', image: 0, cat: 'grains' },
];

// Mega menu / footer / home category row: one representative product per family, in the order of the approved mockups.
// `cat` keys the label in strings.mjs (T[lang].cats). Left list of the mega menu follows MENU_LIST order.
export const MENU_PRODUCTS = ['IT.CC', 'IT.GT', 'IT.AF', 'IT.GMS'];
export const MENU_LIST = [
  { cat: 'melt', code: 'IT.GT', g: 'melt' },
  { cat: 'cc', code: 'IT.CC', g: 'cc' },
  { cat: 'heat', code: 'IT.AF', g: 'heat' },
  { cat: 'grains', code: 'IT.GMS', g: 'prod' },
];

/** Catalogue family: the three real product groups, with continuous casting (IT.CC) shown as its own family as in the approved mockups. */
export const familyOf = (p) => (p.code === 'IT.CC' ? 'cc' : p.group);
export const FAMILIES = ['cc', 'melt', 'heat', 'prod'];

// Service tile -> product whose photo illustrates it.
export const SERVICE_PHOTOS = {
  'italtherm-mesh-belt-heat-treatment-furnace': { code: 'IT.BF', image: 0 },
  'italtherm-continuous-wire-annealing-furnace': { code: 'IT.CWA', image: 0 },
  'italtherm-annealing-furnaces': { code: 'IT.AF', image: 0 },
  'gear-driven-tilting-metal-melting-furnace': { code: 'IT.GT', image: 0 },
};

// About page hero and "Chi siamo" photos (landscape, checked visually): IT.AF copper tray, IT.MT operator at the furnace.
export const ABOUT_HERO = { code: 'IT.AF', image: 2 };
export const ABOUT_TEAM = { code: 'IT.MT', image: 1 };

// About page: solution block (by position in the three "Our solutions" sections) -> photo.
export const ABOUT_PHOTOS = [
  { code: 'IT.MT', image: 0, contain: true },
  { code: 'IT.CC', image: 1, contain: false },
  { code: 'IT.AF', image: 0, contain: true },
];

// Catalogue / rail order (codes); anything not listed goes last.
// The four featured machines first, in the order of the approved catalogue mockup (IT.CC, IT.GT, IT.AF, IT.GMS), then the rest.
export const CATALOGUE_ORDER = ['IT.CC', 'IT.GT', 'IT.AF', 'IT.GMS', 'IT.MT', 'IT.SM', 'IT.BF', 'IT.CWA', 'IT.GMB', 'IT.FM', 'IT.KB'];
