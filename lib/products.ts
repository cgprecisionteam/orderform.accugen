/**
 * Central product catalogue.
 * All dropdowns and unit-type logic derive from this single source of truth.
 *
 * unitType controls the Items UI:
 *   per_tooth  → FDI tooth selector (qty = teeth selected)
 *   per_arch   → Arch picker – Upper / Lower / Both (qty = 1 or 2)
 *   per_unit   → Manual numeric quantity input
 */

export type UnitType = 'per_tooth' | 'per_arch' | 'per_unit';

export interface Product {
  name: string;
  category: string;
  unitType: UnitType;
}

export const PRODUCTS: Product[] = [
  // ── CAD Service ──────────────────────────────────────────────
  { name: 'Crown Design',           category: 'CAD Service', unitType: 'per_tooth' },
  { name: 'Full Arch Design',       category: 'CAD Service', unitType: 'per_arch'  },

  // ── Crowns and Bridges ───────────────────────────────────────
  { name: 'Full Crown - Zirconia Economy',         category: 'Crowns and Bridges', unitType: 'per_tooth' },
  { name: 'Full Crown - Zirconia Economy Plus',    category: 'Crowns and Bridges', unitType: 'per_tooth' },
  { name: 'Full Crown - Zirconia Economy Premium', category: 'Crowns and Bridges', unitType: 'per_tooth' },
  { name: 'Full Crown - Zirconia Premium Plus',    category: 'Crowns and Bridges', unitType: 'per_tooth' },

  // ── Implant ──────────────────────────────────────────────────
  { name: 'Custom Abutment',          category: 'Implant', unitType: 'per_tooth' },
  { name: 'Implant Crown',            category: 'Implant', unitType: 'per_tooth' },
  { name: 'Implant Bridge',           category: 'Implant', unitType: 'per_tooth' },
  { name: 'Implant Full Arch (PMMA)', category: 'Implant', unitType: 'per_arch'  },

  // ── Removable ────────────────────────────────────────────────
  { name: 'Full Denture',    category: 'Removable', unitType: 'per_arch' },
  { name: 'Partial Denture', category: 'Removable', unitType: 'per_unit' },
  { name: 'Flexi Partial',   category: 'Removable', unitType: 'per_unit' },

  // ── Orthodontics ─────────────────────────────────────────────
  { name: 'Clear Aligner', category: 'Orthodontics', unitType: 'per_arch' },
  { name: 'Retainer',      category: 'Orthodontics', unitType: 'per_arch' },
  { name: 'Study Model',   category: 'Orthodontics', unitType: 'per_unit' },
];

/** Ordered, deduplicated category list derived from PRODUCTS. */
export const CATEGORIES: string[] = Array.from(new Set(PRODUCTS.map((p) => p.category)));

/** Products for a given category, sorted alphabetically. */
export function getProductsByCategory(category: string): Product[] {
  return PRODUCTS
    .filter((p) => p.category === category)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Unit type for a named product; defaults to per_tooth if not found. */
export function getUnitType(productName: string): UnitType {
  return PRODUCTS.find((p) => p.name === productName)?.unitType ?? 'per_tooth';
}

/** Display names for the product dropdown (names only, sorted). */
export function getProductNamesByCategory(category: string): string[] {
  return getProductsByCategory(category).map((p) => p.name);
}
