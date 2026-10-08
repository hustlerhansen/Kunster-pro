/**
 * Deterministiske UUID-er for demodata, slik at demomodus og seed.sql
 * bruker nøyaktig de samme ID-ene. (Ikke kryptografisk – kun for demodata.)
 */
function fnv1a(input: string, seed: number): number {
  let h = 0x811c9dc5 ^ seed;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function demoId(name: string): string {
  const parts = [0, 1, 2, 3].map((seed) => fnv1a(name, seed * 2654435761).toString(16).padStart(8, "0"));
  const hex = parts.join("");
  // Formater som UUID v4-lignende (versjon 4, variant 8)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
