import type { ProductType, SpecValues } from "./types";

interface SpecDef {
  label: string;
  unit?: string;
}

/** Visningsnavn for spesifikasjoner. Kun felter med verdi vises. */
export const SPEC_DEFS: Record<string, SpecDef> = {
  color: { label: "Farge" },
  volume: { label: "Volum" },
  volume_ml: { label: "Volum", unit: "ml" },
  pigments: { label: "Pigment" },
  opacity: { label: "Dekkevne" },
  lightfastness: { label: "Lysekthet" },
  series: { label: "Prisserie" },
  binder: { label: "Bindemiddel" },
  width_cm: { label: "Bredde", unit: "cm" },
  height_cm: { label: "Høyde", unit: "cm" },
  depth_cm: { label: "Dybde", unit: "cm" },
  material: { label: "Materiale" },
  primer: { label: "Grunning" },
  pack_count: { label: "Antall i pakken", unit: "stk" },
  size: { label: "Størrelse" },
  hair_type: { label: "Hårtype" },
  shape: { label: "Form" },
  handle: { label: "Skaft" },
  contents: { label: "Innhold" },
  weight_g: { label: "Vekt", unit: "g" },
};

/** Hvilke spesifikasjoner som er relevante (og vises i admin) per produkttype. */
export const SPECS_BY_TYPE: Record<ProductType, string[]> = {
  oil_paint: ["color", "volume", "pigments", "opacity", "lightfastness", "series", "binder"],
  canvas: ["width_cm", "height_cm", "depth_cm", "material", "primer", "pack_count"],
  brush: ["size", "hair_type", "shape", "handle", "contents"],
  medium: ["contents", "volume"],
  set: ["contents"],
  accessory: ["contents", "material"],
};

/** Spesifikasjoner som skal vises som «Ikke dokumentert» hvis de mangler (oljemaling). */
export const DOCUMENTED_ONLY: Partial<Record<ProductType, string[]>> = {
  oil_paint: ["pigments", "opacity", "lightfastness"],
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  oil_paint: "Oljemaling",
  brush: "Pensel",
  canvas: "Lerret",
  medium: "Malermedium",
  set: "Malersett",
  accessory: "Tilbehør",
};

function formatNumber(n: number) {
  return n.toLocaleString("nb-NO", { maximumFractionDigits: 2 });
}

export function formatSpecValue(key: string, value: SpecValues[string]): string | null {
  if (value === null || value === undefined || value === "") return null;
  const def = SPEC_DEFS[key];
  const str = typeof value === "number" ? formatNumber(value) : String(value);
  return def?.unit ? `${str} ${def.unit}` : str;
}

export function buildSpecRows(type: ProductType, productSpecs: SpecValues, variantOptions: SpecValues = {}, usage?: string | null) {
  const merged: SpecValues = { ...productSpecs, ...variantOptions };
  const order = [...SPECS_BY_TYPE[type], ...Object.keys(merged).filter((k) => !SPECS_BY_TYPE[type].includes(k))];
  const rows: { key: string; label: string; value: string }[] = [];
  const seenLabels = new Set<string>();
  for (const key of order) {
    const value = formatSpecValue(key, merged[key]);
    const label = SPEC_DEFS[key]?.label ?? key;
    if (!value || seenLabels.has(label)) continue;
    seenLabels.add(label);
    rows.push({ key, label, value });
  }
  if (usage) rows.push({ key: "usage", label: "Bruksområde", value: usage });
  return rows;
}
