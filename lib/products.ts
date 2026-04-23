/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PRODUCT CATALOGUE — EDIT HERE ONLY
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * HOW TO EDIT:
 *   Add product    → add a new { label, group, unitType, ... } entry to PRODUCT_TYPES
 *   Remove product → delete the entry
 *   Rename product → update the label string and mirror it in resolveProductName / getRestorationCategory
 *   Add category   → add a new group value to RestGroup and handle it in getRestorationCategory
 *
 * unitType values:
 *   'per_tooth'  → FDI tooth selector shown
 *   'per_arch'   → Upper / Lower / Both button group shown
 *
 * group values:
 *   'restoration' → standard crown/veneer/inlay work
 *   'implant'     → implant-supported single units (implant detail fields shown)
 *   'fullarch'    → full-arch implant prostheses (arch selector + implant detail fields)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type UnitType = 'per_tooth' | 'per_arch' | 'per_unit';
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

// ─── PRODUCT TYPES ───────────────────────────────────────────────────────────
// This is the single source of truth. All form dropdowns and email output
// are derived from this array. Edit this to add/remove products.
// ─────────────────────────────────────────────────────────────────────────────

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
    variants: ['Standard', 'On Titanium Bar', 'With Ti Base'] },
  { label: 'Milled Titanium Bar',        group: 'fullarch', unitType: 'per_arch', isImplant: true,
    noMaterial: true, availableMaterials: [],
    siteCounts: ['2 Implant Sites', '3 Implant Sites', '4-6 Implant Sites', '7+ Implant Sites'] },
  { label: 'Milled Malo Framework',      group: 'fullarch', unitType: 'per_arch', isImplant: true,
    noMaterial: true, availableMaterials: [],
    siteCounts: ['2 Implant Sites', '3 Implant Sites', '4-6 Implant Sites', '7+ Implant Sites'] },

];

// ─────────────────────────────────────────────────────────────────────────────
// BELOW THIS LINE — DO NOT EDIT (auto-derived from PRODUCT_TYPES above)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves a (productType, material, tier, variant, siteCount) tuple to the
 * canonical product name string that appears in emails.
 */
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

/** Maps a product label to the legacy catalogue category string (used in email). */
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
