/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PRODUCT CATALOGUE — EDIT HERE ONLY
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * HOW TO EDIT:
 *   Add product    → add a new { name, unitType } line inside the right category
 *   Remove product → delete the line
 *   Rename product → update the name string
 *   Add category   → add a new "Category Name": [ ... ] block
 *   Remove cat     → delete the whole block
 *
 * unitType values:
 *   'per_tooth'  → FDI tooth selector shown (qty = number of teeth chosen)
 *   'per_arch'   → Upper / Lower / Both button group shown
 *   'per_unit'   → Manual numeric stepper shown
 *
 * isImplant is auto-derived — no need to set it manually.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type UnitType = 'per_tooth' | 'per_arch' | 'per_unit';

// ─── CATALOGUE ───────────────────────────────────────────────────────────────
// Structure: { [CategoryName]: [ { name, unitType }, ... ] }
// Categories appear in the dropdown in the order listed here.
// ─────────────────────────────────────────────────────────────────────────────

const CATALOGUE: Record<string, { name: string; unitType: UnitType }[]> = {

  'Crowns and Bridges': [
    { name: 'Full Crown | Zirconia Economy',         unitType: 'per_tooth' },
    { name: 'Full Crown | Zirconia Economy Plus',    unitType: 'per_tooth' },
    { name: 'Full Crown | Zirconia Premium',         unitType: 'per_tooth' },
    { name: 'Full Crown | Zirconia Premium Plus',    unitType: 'per_tooth' },
    { name: 'Full Crown | IPS e.max CAD',            unitType: 'per_tooth' },
    { name: 'Full Crown | PMMA',                     unitType: 'per_tooth' },
    { name: 'Full Crown | G-CAM',                    unitType: 'per_tooth' },
     ],
'Inlay/Onlay': [
    { name: 'Inlay/Onlay | Zirconia Economy',        unitType: 'per_tooth' },
    { name: 'Inlay/Onlay | Zirconia Economy Plus',   unitType: 'per_tooth' },
    { name: 'Inlay/Onlay | Zirconia Premium',        unitType: 'per_tooth' },
    { name: 'Inlay/Onlay | Zirconia Premium Plus',   unitType: 'per_tooth' },
  ],

  'Veneers': [
    { name: 'Milled Veneer | IPS e.max CAD',       unitType: 'per_tooth' },
    { name: 'Milled Veneer | Zirconia Premium',     unitType: 'per_tooth' },
    { name: 'Milled Veneer | Zirconia Premium Plus', unitType: 'per_tooth' },
  ],

'Implant Crowns and Bridges': [
    { name: 'Implant Crown | Zirconia Economy',                   unitType: 'per_tooth' },
    { name: 'Implant Crown | Zirconia Economy Plus',              unitType: 'per_tooth' },
    { name: 'Implant Crown | Zirconia Economy Premium Plus',      unitType: 'per_tooth' },
    { name: 'Implant Crown | Zirconia Premium',                   unitType: 'per_tooth' },
    { name: 'Implant Crown | IPS e.max CAD',                      unitType: 'per_tooth' },
    { name: 'Implant Crown | PMMA',                               unitType: 'per_tooth' },
    { name: 'Implant Crown | G-CAM',                              unitType: 'per_tooth' },
  ],

  'Implant Crown + Custom Abutment': [
    { name: 'Implant Crown + Custom Abutment | Zr Economy',       unitType: 'per_tooth' },
    { name: 'Implant Crown + Custom Abutment | Zr Economy Plus',  unitType: 'per_tooth' },
    { name: 'Implant Crown + Custom Abutment | Zr Premium',       unitType: 'per_tooth' },
    { name: 'Implant Crown + Custom Abutment | Zr Premium Plus',  unitType: 'per_tooth' },
    { name: 'Milled Custom Abutment',                             unitType: 'per_tooth' },
    { name: 'Implant Crown + Custom Abutment | PMMA',             unitType: 'per_tooth' },
  ],

  'Full Arch Implant Prosthesis': [
    { name: 'Implant Full Arch | PMMA on Milled Titanium Bar',                unitType: 'per_arch' },
    { name: 'Implant Full Arch | PMMA with Ti Base',                          unitType: 'per_arch' },

    { name: 'Milled Malo Framework + Zirconia Crowns Economy',                unitType: 'per_arch' },
    { name: 'Milled Malo Framework + Zirconia Crowns Economy Plus',           unitType: 'per_arch' },
    { name: 'Milled Malo Framework + Zirconia Crowns Premium',                unitType: 'per_arch' },
    { name: 'Milled Malo Framework + Zirconia Crowns Premium Plus',           unitType: 'per_arch' },

    { name: 'iBar | Zirconia Economy',                                        unitType: 'per_arch' },
    { name: 'iBar | Zirconia Economy Plus',                                   unitType: 'per_arch' },
    { name: 'iBar | Zirconia Premium',                                        unitType: 'per_arch' },
    { name: 'iBar | Zirconia Premium Plus',                                   unitType: 'per_arch' },
  ],

  'Milled Titanium Bars': [
    { name: 'Milled Malo Framework (2 Implant Sites)',   unitType: 'per_arch' },
    { name: 'Milled Malo Framework (3 Implant Sites)',   unitType: 'per_arch' },
    { name: 'Milled Malo Framework (4-6 Implant Sites)', unitType: 'per_arch' },
    { name: 'Milled Malo Framework (7+ Implant Sites)',  unitType: 'per_arch' },

    { name: 'Milled Titanium Bar (2 Implant Sites)',     unitType: 'per_arch' },
    { name: 'Milled Titanium Bar (3 Implant Sites)',     unitType: 'per_arch' },
    { name: 'Milled Titanium Bar (4-6 Implant Sites)',   unitType: 'per_arch' },
    { name: 'Milled Titanium Bar (7+ Implant Sites)',    unitType: 'per_arch' },
  ],

  

};

// ─────────────────────────────────────────────────────────────────────────────
// BELOW THIS LINE — DO NOT EDIT (auto-derived from CATALOGUE above)
// ─────────────────────────────────────────────────────────────────────────────

export interface Product {
  name: string;
  category: string;
  unitType: UnitType;
  isImplant: boolean;
}

const IMPLANT_CATEGORIES = new Set([
  'Implant Crown + Custom Abutment',
  'Implant Crowns and Bridges',
  'Full Arch Implant Prosthesis',
  'Milled Titanium Bars',
]);

/** Flat product list — used by getUnitType and getProductsByCategory. */
export const PRODUCTS: Product[] = Object.entries(CATALOGUE).flatMap(
  ([category, items]) =>
    items.map(item => ({
      name: item.name,
      category,
      unitType: item.unitType,
      isImplant: IMPLANT_CATEGORIES.has(category),
    }))
);

/** Category list in catalogue order (no duplicates). */
export const CATEGORIES: string[] = Object.keys(CATALOGUE);

/** Products for a given category (catalogue order, not sorted — edit order above). */
export function getProductsByCategory(category: string): Product[] {
  return PRODUCTS.filter(p => p.category === category);
}

/** Product names for a given category (for dropdown). */
export function getProductNamesByCategory(category: string): string[] {
  return getProductsByCategory(category).map(p => p.name);
}

/** Unit type for a named product; defaults to per_tooth if not found. */
export function getUnitType(productName: string): UnitType {
  return PRODUCTS.find(p => p.name === productName)?.unitType ?? 'per_tooth';
}

/** Whether a product belongs to an implant category. */
export function isImplantProduct(productName: string): boolean {
  return PRODUCTS.find(p => p.name === productName)?.isImplant ?? false;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESTORATION-BASED UI TYPES (used by OrderForm v2)
// ─────────────────────────────────────────────────────────────────────────────

export type Material = 'Zirconia' | 'Lithium Disilicate' | 'PMMA' | 'G-CAM';
export type ZirconiaTier = 'Economy' | 'Economy Plus' | 'Premium' | 'Premium Plus';
export type RestGroup = 'restoration' | 'implant' | 'fullarch';

export interface ProductTypeConfig {
  label: string;
  group: RestGroup;
  unitType: UnitType;
  isImplant: boolean;
  availableMaterials: Material[];
  availableTiers?: ZirconiaTier[];
  noMaterial?: boolean;
  variants?: string[];
  siteCounts?: string[];
}

export const PRODUCT_TYPES: ProductTypeConfig[] = [
  // ── Restorations ──────────────────────────────────────────────────────────
  { label: 'Full Crown',   group: 'restoration', unitType: 'per_tooth', isImplant: false,
    availableMaterials: ['Zirconia', 'Lithium Disilicate', 'PMMA', 'G-CAM'] },
  { label: 'Bridge',       group: 'restoration', unitType: 'per_tooth', isImplant: false,
    availableMaterials: ['Zirconia', 'Lithium Disilicate', 'PMMA', 'G-CAM'] },
  { label: 'Inlay/Onlay', group: 'restoration', unitType: 'per_tooth', isImplant: false,
    availableMaterials: ['Zirconia', 'Lithium Disilicate'] },
  { label: 'Veneer',      group: 'restoration', unitType: 'per_tooth', isImplant: false,
    availableMaterials: ['Lithium Disilicate', 'Zirconia'],
    availableTiers: ['Premium', 'Premium Plus'] },

  // ── Implant ───────────────────────────────────────────────────────────────
  { label: 'Implant Crown (Ti Base by Dentist)', group: 'implant', unitType: 'per_tooth', isImplant: true,
    availableMaterials: ['Zirconia', 'Lithium Disilicate', 'PMMA', 'G-CAM'] },
  { label: 'Implant Bridge',                    group: 'implant', unitType: 'per_tooth', isImplant: true,
    availableMaterials: ['Zirconia', 'PMMA'] },
  { label: 'Implant Crown + Custom Abutment',   group: 'implant', unitType: 'per_tooth', isImplant: true,
    availableMaterials: ['Zirconia', 'PMMA'] },

  // ── Full Arch ─────────────────────────────────────────────────────────────
  { label: 'iBar (Implant Full Arch)',                    group: 'fullarch', unitType: 'per_arch', isImplant: true,
    availableMaterials: ['Zirconia'] },
  { label: 'Malo Framework + Crowns (Implant Full Arch)', group: 'fullarch', unitType: 'per_arch', isImplant: true,
    availableMaterials: ['Zirconia'] },
  { label: 'Immediate Implant Full Arch', group: 'fullarch', unitType: 'per_arch', isImplant: true,
    availableMaterials: ['PMMA'],
    variants: ['On Titanium Bar', 'With Ti Base'] },
  { label: 'Milled Titanium Bar',        group: 'fullarch', unitType: 'per_arch', isImplant: true,
    noMaterial: true, availableMaterials: [],
    siteCounts: ['2 Implant Sites', '3 Implant Sites', '4-6 Implant Sites', '7+ Implant Sites'] },
  { label: 'Milled Malo Framework',      group: 'fullarch', unitType: 'per_arch', isImplant: true,
    noMaterial: true, availableMaterials: [],
    siteCounts: ['2 Implant Sites', '3 Implant Sites', '4-6 Implant Sites', '7+ Implant Sites'] },
];

export function resolveProductName(
  productType: string,
  material: Material | '',
  tier: ZirconiaTier | '',
  variant = '',
  siteCount = '',
): string {
  if (productType === 'Malo Framework + Crowns (Implant Full Arch)') {
    return `Malo Framework + Zirconia Crowns ${tier}`;
  }

  if (productType === 'Immediate Implant Full Arch') {
    if (variant === 'On Titanium Bar') return 'Immediate Implant Full Arch | PMMA on Titanium Bar';
    if (variant === 'With Ti Base')    return 'Immediate Implant Full Arch | PMMA with Ti Base';
    return 'Immediate Implant Full Arch | PMMA';
  }

  if (productType === 'Milled Titanium Bar') {
    return `Milled Titanium Bar (${siteCount})`;
  }

  if (productType === 'Milled Malo Framework') {
    return `Milled Malo Framework (${siteCount})`;
  }

  if (productType === 'Implant Crown + Custom Abutment') {
    if (material === 'Zirconia') return `Implant Crown + Custom Abutment | Zr ${tier}`;
    return `Implant Crown + Custom Abutment | ${material}`;
  }

  // Standard pattern applies to all remaining products
  if (material === 'Zirconia')           return `${productType} | Zirconia ${tier}`;
  if (material === 'Lithium Disilicate') return `${productType} | IPS e.max CAD`;
  return `${productType} | ${material}`;
}

export function getRestorationCategory(productType: string): string {
  switch (productType) {
    case 'Inlay/Onlay':                    return 'Inlay/Onlay';
    case 'Veneer':                         return 'Veneers';
    case 'Implant Crown + Custom Abutment': return 'Implant Crown + Custom Abutment';
    case 'Milled Titanium Bar':
    case 'Milled Malo Framework':          return 'Milled Titanium Bars';
    case 'Implant Crown (Ti Base by Dentist)':
    case 'Implant Bridge':                 return 'Implant Crowns and Bridges';
    case 'iBar (Implant Full Arch)':
    case 'Malo Framework + Crowns (Implant Full Arch)':
    case 'Immediate Implant Full Arch':    return 'Full Arch Implant Prosthesis';
    default:                               return 'Crowns and Bridges';
  }
}
