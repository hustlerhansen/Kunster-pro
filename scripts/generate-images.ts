/**
 * Genererer SVG-illustrasjoner (plassholdere) for demosortimentet.
 * Kjør: npx tsx scripts/generate-images.ts
 * Erstatt med ekte produktfoto via adminpanelet før lansering.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "public", "images", "demo");
mkdirSync(OUT, { recursive: true });

const GOLD = "#D4AF65";

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((n >> 16) & 255) + amt);
  const g = clamp(((n >> 8) & 255) + amt);
  const b = clamp((n & 255) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function lightBg(id: string, content: string, w = 800, h = 800): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img">
<defs>
  <radialGradient id="${id}-bg" cx="50%" cy="40%" r="75%">
    <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#EFEBE3"/>
  </radialGradient>
  <linearGradient id="${id}-metal" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#F3F3F1"/><stop offset=".45" stop-color="#C9CACC"/><stop offset=".55" stop-color="#E9E9E7"/><stop offset="1" stop-color="#9C9EA2"/>
  </linearGradient>
  <linearGradient id="${id}-black" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3A3A3A"/><stop offset=".5" stop-color="#151515"/><stop offset="1" stop-color="#050505"/>
  </linearGradient>
  <filter id="${id}-shadow" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>
</defs>
<rect width="${w}" height="${h}" fill="url(#${id}-bg)"/>
${content}
</svg>`;
}

function tube(id: string, x: number, y: number, len: number, thick: number, color: string, label: string, sub: string, rot = -18): string {
  const capW = thick * 0.42;
  return `<g transform="translate(${x} ${y}) rotate(${rot})">
  <ellipse cx="${len * 0.05}" cy="${thick * 0.95}" rx="${len * 0.62}" ry="${thick * 0.16}" fill="#000" opacity=".22" filter="url(#${id}-shadow)"/>
  <path d="M ${-len / 2} ${-thick * 0.42} L ${-len / 2 + 14} ${-thick / 2} L ${len / 2 - 40} ${-thick / 2} Q ${len / 2} ${-thick / 2} ${len / 2 + 6} ${-capW / 2 - 6} L ${len / 2 + 6} ${capW / 2 + 6} Q ${len / 2} ${thick / 2} ${len / 2 - 40} ${thick / 2} L ${-len / 2 + 14} ${thick / 2} L ${-len / 2} ${thick * 0.42} Z" fill="url(#${id}-metal)" stroke="#8E9094" stroke-width="1.5"/>
  ${Array.from({ length: 6 }, (_, i) => `<line x1="${-len / 2 + 4 + i * 3}" y1="${-thick * 0.44}" x2="${-len / 2 + 4 + i * 3}" y2="${thick * 0.44}" stroke="#8E9094" stroke-width="1" opacity=".7"/>`).join("")}
  <rect x="${-len / 2 + 40}" y="${-thick / 2 + 1}" width="${len * 0.62}" height="${thick - 2}" fill="#FBFAF7"/>
  <rect x="${-len / 2 + 40}" y="${-thick / 2 + 1}" width="${len * 0.62}" height="${thick * 0.2}" fill="#111"/>
  <rect x="${-len / 2 + 40 + len * 0.62 - thick * 0.42}" y="${-thick / 2 + thick * 0.2 + 1}" width="${thick * 0.42}" height="${thick * 0.8 - 2}" fill="${color}" stroke="#d8d2c4" stroke-width="1"/>
  <text x="${-len / 2 + 52}" y="${-thick / 2 + thick * 0.15}" font-family="Georgia, serif" font-size="${thick * 0.11}" fill="${GOLD}" letter-spacing="2">KUNSTNER PRO</text>
  <text x="${-len / 2 + 52}" y="${thick * 0.12}" font-family="Georgia, serif" font-size="${thick * 0.15}" fill="#111">${label}</text>
  <text x="${-len / 2 + 52}" y="${thick * 0.36}" font-family="Arial, sans-serif" font-size="${thick * 0.075}" fill="#555" letter-spacing="1.2">${sub}</text>
  <rect x="${len / 2 + 4}" y="${-capW / 2 - 4}" width="18" height="${capW + 8}" fill="url(#${id}-metal)"/>
  <rect x="${len / 2 + 20}" y="${-capW / 2 - 10}" width="${thick * 0.55}" height="${capW + 20}" rx="6" fill="url(#${id}-black)"/>
  ${Array.from({ length: 5 }, (_, i) => `<line x1="${len / 2 + 28 + i * thick * 0.09}" y1="${-capW / 2 - 8}" x2="${len / 2 + 28 + i * thick * 0.09}" y2="${capW / 2 + 8}" stroke="#444" stroke-width="2"/>`).join("")}
</g>`;
}

function paintBlob(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M -80 10 C -90 -30 -40 -55 0 -45 C 35 -70 95 -40 85 -5 C 110 20 70 55 30 45 C 5 70 -55 60 -60 40 C -95 40 -100 25 -80 10 Z" fill="${color}"/>
  <path d="M -50 -10 C -30 -30 10 -30 30 -20" stroke="${shade(color, 70)}" stroke-width="8" fill="none" stroke-linecap="round" opacity=".55"/>
  <path d="M -20 25 C 10 35 40 30 60 15" stroke="${shade(color, -40)}" stroke-width="6" fill="none" stroke-linecap="round" opacity=".45"/>
</g>`;
}

function brush(id: string, x: number, y: number, len: number, w: number, rot: number, shape: "flat" | "round" | "filbert", hair: string, handle: string): string {
  const fl = len * 0.12;
  const hl = len * 0.18;
  const tip =
    shape === "flat"
      ? `M 0 ${-w / 2} L ${-hl} ${-w / 2 - 3} L ${-hl} ${w / 2 + 3} L 0 ${w / 2} Z`
      : shape === "round"
        ? `M 0 ${-w / 2} Q ${-hl * 0.6} ${-w / 2 - 2} ${-hl} 0 Q ${-hl * 0.6} ${w / 2 + 2} 0 ${w / 2} Z`
        : `M 0 ${-w / 2} L ${-hl * 0.7} ${-w / 2 - 2} Q ${-hl} ${-w / 2} ${-hl} 0 Q ${-hl} ${w / 2} ${-hl * 0.7} ${w / 2 + 2} L 0 ${w / 2} Z`;
  return `<g transform="translate(${x} ${y}) rotate(${rot})">
  <path d="${tip}" fill="${hair}"/>
  <path d="M -4 ${-w / 2 + 2} L ${-hl * 0.9} ${-w / 4}" stroke="${shade(hair, 35)}" stroke-width="2" opacity=".6"/>
  <rect x="0" y="${-w / 2 - 2}" width="${fl}" height="${w + 4}" fill="url(#${id}-metal)" stroke="#8E9094"/>
  <path d="M ${fl} ${-w / 2 - 2} L ${len - hl} ${-w * 0.28} Q ${len - hl + 14} 0 ${len - hl} ${w * 0.28} L ${fl} ${w / 2 + 2} Z" fill="${handle}"/>
  <path d="M ${fl + 4} ${-w / 2 + 1} L ${len - hl - 6} ${-w * 0.22}" stroke="#fff" stroke-width="2" opacity=".18"/>
</g>`;
}

function canvasStack(id: string, cx: number, cy: number, w: number, h: number, depth: number, count: number): string {
  let out = "";
  for (let i = count - 1; i >= 0; i--) {
    const ox = cx - w / 2 + i * 26;
    const oy = cy - h / 2 - i * 18;
    out += `<g>
    <path d="M ${ox + w} ${oy} L ${ox + w + depth} ${oy - depth * 0.55} L ${ox + w + depth} ${oy + h - depth * 0.55} L ${ox + w} ${oy + h} Z" fill="#D9CDB4"/>
    <path d="M ${ox} ${oy} L ${ox + depth} ${oy - depth * 0.55} L ${ox + w + depth} ${oy - depth * 0.55} L ${ox + w} ${oy} Z" fill="#EFE8DA"/>
    <rect x="${ox}" y="${oy}" width="${w}" height="${h}" fill="url(#${id}-weave)" stroke="#E2DBCB"/>
  </g>`;
  }
  return `<defs><pattern id="${id}-weave" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#FDFCF9"/><path d="M0 3h6M3 0v6" stroke="#EEE9DE" stroke-width="1"/></pattern></defs>
  <ellipse cx="${cx + 30}" cy="${cy + h / 2 + 18}" rx="${w * 0.75}" ry="22" fill="#000" opacity=".2" filter="url(#${id}-shadow)"/>
  ${out}`;
}

function bottle(id: string, cx: number, cy: number, liquid: string, label: string, sub: string): string {
  return `<defs><linearGradient id="${id}-glass" x1="0" x2="1"><stop offset="0" stop-color="${shade(liquid, -30)}"/><stop offset=".35" stop-color="${shade(liquid, 40)}"/><stop offset=".7" stop-color="${liquid}"/><stop offset="1" stop-color="${shade(liquid, -45)}"/></linearGradient></defs>
  <ellipse cx="${cx}" cy="${cy + 205}" rx="150" ry="22" fill="#000" opacity=".22" filter="url(#${id}-shadow)"/>
  <path d="M ${cx - 120} ${cy - 60} Q ${cx - 120} ${cy - 120} ${cx - 50} ${cy - 135} L ${cx - 50} ${cy - 190} L ${cx + 50} ${cy - 190} L ${cx + 50} ${cy - 135} Q ${cx + 120} ${cy - 120} ${cx + 120} ${cy - 60} L ${cx + 120} ${cy + 190} Q ${cx + 120} ${cy + 205} ${cx + 105} ${cy + 205} L ${cx - 105} ${cy + 205} Q ${cx - 120} ${cy + 205} ${cx - 120} ${cy + 190} Z" fill="url(#${id}-glass)" opacity=".92"/>
  <rect x="${cx - 58}" y="${cy - 265}" width="116" height="85" rx="8" fill="url(#${id}-black)"/>
  ${Array.from({ length: 9 }, (_, i) => `<line x1="${cx - 50 + i * 12.5}" y1="${cy - 260}" x2="${cx - 50 + i * 12.5}" y2="${cy - 185}" stroke="#333" stroke-width="3"/>`).join("")}
  <rect x="${cx - 100}" y="${cy - 10}" width="200" height="150" fill="#FBFAF7"/>
  <rect x="${cx - 100}" y="${cy - 10}" width="200" height="26" fill="#111"/>
  <text x="${cx}" y="${cy + 8}" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="${GOLD}" letter-spacing="3">KUNSTNER PRO</text>
  <text x="${cx}" y="${cy + 70}" text-anchor="middle" font-family="Georgia, serif" font-size="30" fill="#111">${label}</text>
  <text x="${cx}" y="${cy + 105}" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#555" letter-spacing="2">${sub}</text>
  <path d="M ${cx - 95} ${cy - 90} Q ${cx - 92} ${cy + 60} ${cx - 90} ${cy + 180}" stroke="#fff" stroke-width="10" opacity=".25" fill="none" stroke-linecap="round"/>`;
}

const files: Record<string, string> = {};

// ----------------------------------------------------------- Oljemaling enkeltfarger
const colors: [string, string, string][] = [
  ["olje-titanhvit", "Titanhvit", "#F4F1EA"],
  ["olje-ultramarinbla", "Ultramarinblå", "#1F3A93"],
  ["olje-gul-oker", "Gul oker", "#C9962E"],
  ["olje-brent-sienna", "Brent sienna", "#8A3B1E"],
  ["olje-lampesort", "Lampesort", "#1B1B1B"],
];
for (const [file, name, color] of colors) {
  const blobColor = color === "#F4F1EA" ? "#FFFFFF" : color;
  files[file] = lightBg(
    file,
    `${paintBlob(560, 600, 1.25, blobColor)}${color === "#F4F1EA" ? `<g transform="translate(560 600) scale(1.25)"><path d="M -80 10 C -90 -30 -40 -55 0 -45 C 35 -70 95 -40 85 -5 C 110 20 70 55 30 45 C 5 70 -55 60 -60 40 C -95 40 -100 25 -80 10 Z" fill="none" stroke="#DDD6C8" stroke-width="2"/></g>` : ""}
    ${tube(file, 380, 380, 470, 170, color, name, "OLJEMALING · OIL COLOUR")}`,
  );
}

// ----------------------------------------------------------- Oljemalingssett
const setColors = ["#F4F1EA", "#F2C230", "#C9962E", "#D9541E", "#B0202A", "#7A1F4F", "#3B2F8F", "#1F3A93", "#1E7A6F", "#2F6B2F", "#8A3B1E", "#1B1B1B"];
files["oljemalingssett-12"] = lightBg(
  "set12",
  `<ellipse cx="400" cy="610" rx="330" ry="34" fill="#000" opacity=".25" filter="url(#set12-shadow)"/>
  <path d="M 90 300 L 710 300 L 740 600 L 60 600 Z" fill="#141414"/>
  <path d="M 90 300 L 710 300 L 700 330 L 100 330 Z" fill="#2A2A2A"/>
  <rect x="100" y="335" width="600" height="250" fill="#1E1E1E"/>
  ${setColors
    .map((c, i) => {
      const x = 118 + i * 48.5;
      return `<g><rect x="${x}" y="360" width="38" height="190" rx="4" fill="url(#set12-metal)"/><rect x="${x}" y="395" width="38" height="120" fill="#FBFAF7"/><rect x="${x}" y="470" width="38" height="45" fill="${c}"/><rect x="${x + 7}" y="340" width="24" height="26" rx="3" fill="url(#set12-black)"/></g>`;
    })
    .join("")}
  <text x="400" y="250" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="#111">Oljemalingssett</text>
  <text x="400" y="282" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#8a7a55" letter-spacing="4">12 FARGER · 21 ML</text>`,
);

// ----------------------------------------------------------- Pensler
const handleDark = "#1A1A1A";
const handleWood = "#8B5A2B";
files["penselsett-10"] = lightBg(
  "bset",
  `<ellipse cx="420" cy="650" rx="300" ry="30" fill="#000" opacity=".18" filter="url(#bset-shadow)"/>
  ${Array.from({ length: 10 }, (_, i) => {
    const shapes = ["flat", "round", "filbert"] as const;
    return brush("bset", 170 + i * 14, 150 + i * 46, 620 - i * 12, 26 - i * 1.2, 22 - i * 0.6, shapes[i % 3], i % 2 ? "#E8DCC0" : "#D2B48C", i % 3 === 0 ? handleWood : handleDark);
  }).join("")}`,
);
files["pensel-flat"] = lightBg(
  "bflat",
  `<ellipse cx="420" cy="560" rx="280" ry="26" fill="#000" opacity=".18" filter="url(#bflat-shadow)"/>
  ${[0, 1, 2, 3].map((i) => brush("bflat", 160 + i * 20, 260 + i * 70, 600, 44 - i * 7, 14, "flat", "#D2B48C", handleWood)).join("")}`,
);
files["pensel-rund"] = lightBg(
  "bround",
  `<ellipse cx="420" cy="560" rx="280" ry="26" fill="#000" opacity=".18" filter="url(#bround-shadow)"/>
  ${[0, 1, 2, 3].map((i) => brush("bround", 160 + i * 20, 260 + i * 70, 600, 30 - i * 5, 14, "round", "#F1E9D8", handleDark)).join("")}`,
);
files["pensel-filbert"] = lightBg(
  "bfil",
  `<ellipse cx="420" cy="560" rx="280" ry="26" fill="#000" opacity=".18" filter="url(#bfil-shadow)"/>
  ${[0, 1, 2].map((i) => brush("bfil", 170 + i * 25, 290 + i * 85, 600, 40 - i * 7, 14, "filbert", "#EDE2C9", handleDark)).join("")}`,
);

// ----------------------------------------------------------- Lerret
files["lerret-oppspent"] = lightBg("lspent", canvasStack("lspent", 380, 420, 380, 460, 28, 1));
files["lerret-pakke"] = lightBg(
  "lpk",
  `${canvasStack("lpk", 360, 440, 330, 420, 26, 5)}
  <rect x="540" y="560" width="150" height="56" rx="6" fill="#111"/><text x="615" y="596" text-anchor="middle" font-family="Georgia, serif" font-size="26" fill="${GOLD}">5 stk</text>`,
);
files["lerretsplater"] = lightBg("lplate", canvasStack("lplate", 380, 430, 360, 450, 8, 3));
files["lerret-lin"] = lightBg(
  "llin",
  `<defs><pattern id="llin-weave2" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#E8DCC4"/><path d="M0 2.5h5M2.5 0v5" stroke="#D8C9AA" stroke-width="1"/></pattern></defs>
  <ellipse cx="420" cy="660" rx="300" ry="24" fill="#000" opacity=".2" filter="url(#llin-shadow)"/>
  <path d="M 590 190 L 660 150 L 660 590 L 590 630 Z" fill="#CBB993"/>
  <path d="M 190 190 L 260 150 L 660 150 L 590 190 Z" fill="#E3D6BA"/>
  <rect x="190" y="190" width="400" height="440" fill="url(#llin-weave2)" stroke="#CFC0A0"/>
  <rect x="215" y="215" width="350" height="390" fill="#FBF8F1" opacity=".9"/>`,
);

// ----------------------------------------------------------- Medium og tilbehør
files["linolje"] = lightBg("linolje", bottle("linolje", 400, 380, "#E2B33B", "Linolje", "RAFFINERT"));
files["malermedium"] = lightBg("medium", bottle("medium", 400, 380, "#C98A2B", "Malermedium", "OLJEMALING"));
files["penselsape"] = lightBg(
  "sape",
  `<ellipse cx="400" cy="560" rx="250" ry="30" fill="#000" opacity=".2" filter="url(#sape-shadow)"/>
  <ellipse cx="400" cy="500" rx="220" ry="70" fill="url(#sape-metal)"/>
  <rect x="180" y="400" width="440" height="100" fill="url(#sape-metal)"/>
  <ellipse cx="400" cy="400" rx="220" ry="70" fill="#E9E6DF"/>
  <ellipse cx="400" cy="400" rx="190" ry="56" fill="#F5EFDC"/>
  <ellipse cx="400" cy="400" rx="120" ry="34" fill="#EFE5C8"/>
  <rect x="250" y="425" width="300" height="60" fill="#111"/>
  <text x="400" y="463" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="${GOLD}">Penselsåpe</text>
  ${brush("sape", 470, 290, 330, 22, -158, "round", "#F1E9D8", handleDark)}`,
);

// ----------------------------------------------------------- Malersett
function woodBox(id: string, inner: string, title: string): string {
  return lightBg(
    id,
    `<defs><linearGradient id="${id}-wood" x1="0" x2="1"><stop offset="0" stop-color="#9A6A3C"/><stop offset=".5" stop-color="#B98352"/><stop offset="1" stop-color="#8A5B30"/></linearGradient></defs>
    <ellipse cx="400" cy="650" rx="330" ry="30" fill="#000" opacity=".25" filter="url(#${id}-shadow)"/>
    <path d="M 70 300 L 730 300 L 760 640 L 40 640 Z" fill="url(#${id}-wood)"/>
    <rect x="95" y="320" width="610" height="300" fill="#2B1D12"/>
    ${inner}
    <text x="400" y="240" text-anchor="middle" font-family="Georgia, serif" font-size="36" fill="#111">${title}</text>
    <rect x="330" y="258" width="140" height="3" fill="${GOLD}"/>`,
  );
}
files["sett-start"] = woodBox(
  "sstart",
  `${["#F4F1EA", "#1F3A93", "#C9962E", "#8A3B1E", "#1B1B1B"].map((c, i) => `<g><rect x="${120 + i * 70}" y="350" width="52" height="170" rx="5" fill="url(#sstart-metal)"/><rect x="${120 + i * 70}" y="385" width="52" height="100" fill="#FBFAF7"/><rect x="${120 + i * 70}" y="450" width="52" height="35" fill="${c}"/></g>`).join("")}
  ${[0, 1, 2].map((i) => brush("sstart", 480, 360 + i * 40, 230, 14, 0, (["flat", "round", "filbert"] as const)[i], "#E8DCC0", handleDark)).join("")}
  <rect x="120" y="540" width="560" height="60" fill="#F7F3EA"/>`,
  "Startpakke",
);
files["sett-profesjonell"] = woodBox(
  "sprof",
  `${["#F4F1EA", "#1F3A93", "#C9962E", "#8A3B1E"].map((c, i) => `<g><rect x="${120 + i * 92}" y="345" width="78" height="230" rx="6" fill="url(#sprof-metal)"/><rect x="${120 + i * 92}" y="390" width="78" height="140" fill="#FBFAF7"/><rect x="${120 + i * 92}" y="480" width="78" height="50" fill="${c}"/></g>`).join("")}
  ${[0, 1, 2].map((i) => brush("sprof", 500, 370 + i * 55, 200, 22 - i * 3, 0, "flat", "#D2B48C", handleWood)).join("")}`,
  "Profesjonell malepakke",
);
files["sett-komplett"] = woodBox(
  "skomp",
  `${setColors.slice(0, 8).map((c, i) => `<g><rect x="${115 + i * 40}" y="345" width="32" height="140" rx="4" fill="url(#skomp-metal)"/><rect x="${115 + i * 40}" y="375" width="32" height="80" fill="#FBFAF7"/><rect x="${115 + i * 40}" y="430" width="32" height="25" fill="${c}"/></g>`).join("")}
  ${[0, 1, 2, 3].map((i) => brush("skomp", 450, 355 + i * 34, 230, 12, 0, (["flat", "round", "filbert", "flat"] as const)[i], "#E8DCC0", handleDark)).join("")}
  <rect x="120" y="505" width="200" height="95" fill="#FBF8F1"/><rect x="340" y="505" width="200" height="95" fill="#FBF8F1"/>
  <rect x="570" y="500" width="70" height="105" rx="10" fill="#E2B33B" opacity=".9"/>`,
  "Komplett kunstnersett",
);

// ----------------------------------------------------------- Kategoribilder (mørke)
function darkTile(id: string, content: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700" role="img">
<defs>
  <radialGradient id="${id}-bg" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="#3A3129"/><stop offset=".6" stop-color="#1A1613"/><stop offset="1" stop-color="#0D0B0A"/></radialGradient>
  <linearGradient id="${id}-metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3F3F1"/><stop offset=".45" stop-color="#C9CACC"/><stop offset=".55" stop-color="#E9E9E7"/><stop offset="1" stop-color="#9C9EA2"/></linearGradient>
  <linearGradient id="${id}-black" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A3A3A"/><stop offset="1" stop-color="#050505"/></linearGradient>
  <linearGradient id="${id}-fade" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></linearGradient>
  <filter id="${id}-shadow"><feGaussianBlur stdDeviation="12"/></filter>
</defs>
<rect width="600" height="700" fill="url(#${id}-bg)"/>
${content}
<rect width="600" height="700" fill="url(#${id}-fade)"/>
</svg>`;
}
files["kategori-oljemaling"] = darkTile(
  "koj",
  ["#F2C230", "#1F3A93", "#B0202A", "#F4F1EA", "#2F6B2F"]
    .map((c, i) => `<g transform="translate(${70 + i * 98} ${150 + (i % 2) * 30})"><rect width="78" height="330" rx="8" fill="url(#koj-metal)"/><rect y="60" width="78" height="200" fill="#FBFAF7"/><rect y="60" width="78" height="30" fill="#111"/><rect y="190" width="78" height="70" fill="${c}"/><rect x="14" y="-40" width="50" height="46" rx="5" fill="url(#koj-black)"/></g>`)
    .join(""),
);
files["kategori-pensler"] = darkTile(
  "kpen",
  Array.from({ length: 8 }, (_, i) => brush("kpen", 120 + i * 50, 120 + (i % 3) * 20, 520, 26 - (i % 4) * 3, 92 - i * 1.5, (["flat", "round", "filbert"] as const)[i % 3], i % 2 ? "#E8DCC0" : "#C79A5B", i % 3 ? "#1A1A1A" : "#8B5A2B")).join(""),
);
files["kategori-lerret"] = darkTile(
  "kler",
  `<defs><pattern id="kler-weave" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#FDFCF9"/><path d="M0 3h6M3 0v6" stroke="#EEE9DE"/></pattern></defs>
  ${[2, 1, 0].map((i) => `<g><path d="M ${150 + i * 50 + 300} ${140 - i * 30} l 30 -18 v 420 l -30 18 Z" fill="#CBBE9F"/><rect x="${150 + i * 50}" y="${140 - i * 30}" width="300" height="420" fill="url(#kler-weave)"/></g>`).join("")}`,
);
files["kategori-malermedium"] = darkTile(
  "kmed",
  `<g transform="translate(-40 40) scale(.8)">${bottle("kmed", 330, 420, "#E2B33B", "Linolje", "RAFFINERT")}</g>
   <g transform="translate(250 120) scale(.62)">${bottle("kmed2", 330, 420, "#C98A2B", "Medium", "OLJEMALING")}</g>`,
);
files["kategori-malersett"] = darkTile(
  "kset",
  `<g transform="translate(-2 20) scale(.78)">
    <path d="M 70 300 L 730 300 L 760 640 L 40 640 Z" fill="#9A6A3C"/>
    <rect x="95" y="320" width="610" height="300" fill="#2B1D12"/>
    ${setColors.slice(0, 9).map((c, i) => `<g><rect x="${115 + i * 64}" y="345" width="50" height="190" rx="5" fill="url(#kset-metal)"/><rect x="${115 + i * 64}" y="385" width="50" height="110" fill="#FBFAF7"/><rect x="${115 + i * 64}" y="455" width="50" height="40" fill="${c}"/></g>`).join("")}
  </g>`,
);

// ----------------------------------------------------------- Hero (maleriske penselstrøk)
files["hero"] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" role="img">
<defs>
  <radialGradient id="h-bg" cx="70%" cy="45%" r="80%"><stop offset="0" stop-color="#3B2F25"/><stop offset=".55" stop-color="#17130F"/><stop offset="1" stop-color="#0B0A09"/></radialGradient>
  <filter id="h-paint" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency=".018 .09" numOctaves="3" seed="7" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="38" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3" result="grain"/>
    <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.1" result="g2"/>
    <feComposite in="d" in2="g2" operator="in"/>
  </filter>
  <filter id="h-soft"><feGaussianBlur stdDeviation="40"/></filter>
  <linearGradient id="h-fade" x1="0" x2="1"><stop offset="0" stop-color="#0B0A09" stop-opacity=".98"/><stop offset=".42" stop-color="#0B0A09" stop-opacity=".78"/><stop offset=".7" stop-color="#0B0A09" stop-opacity=".1"/><stop offset="1" stop-color="#0B0A09" stop-opacity="0"/></linearGradient>
  <linearGradient id="h-metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3F3F1"/><stop offset=".45" stop-color="#B9BABC"/><stop offset=".55" stop-color="#E9E9E7"/><stop offset="1" stop-color="#8C8E92"/></linearGradient>
</defs>
<rect width="1600" height="900" fill="url(#h-bg)"/>
<ellipse cx="1150" cy="420" rx="420" ry="260" fill="${GOLD}" opacity=".12" filter="url(#h-soft)"/>
<g filter="url(#h-paint)">
  <path d="M 700 260 C 900 180 1150 210 1520 140 L 1560 250 C 1200 320 950 300 740 380 Z" fill="#1F3A93"/>
  <path d="M 760 360 C 980 300 1250 330 1580 270 L 1590 360 C 1290 420 1000 400 780 470 Z" fill="#E9E2D0"/>
  <path d="M 720 470 C 960 420 1200 470 1560 410 L 1580 520 C 1250 570 960 540 740 600 Z" fill="${GOLD}"/>
  <path d="M 800 590 C 1020 560 1260 600 1590 540 L 1600 650 C 1290 700 1030 680 820 720 Z" fill="#8A3B1E"/>
  <path d="M 900 700 C 1100 680 1350 720 1600 690 L 1600 800 C 1350 820 1120 800 920 820 Z" fill="#2F6B2F" opacity=".85"/>
  <path d="M 1000 200 C 1150 160 1300 190 1450 150 L 1460 200 C 1300 240 1160 220 1010 250 Z" fill="#F2C230" opacity=".9"/>
</g>
<g transform="translate(1190 610) rotate(-24)">
  <rect x="-230" y="-48" width="420" height="96" rx="10" fill="url(#h-metal)"/>
  <rect x="-170" y="-46" width="290" height="92" fill="#F7F4EC"/>
  <rect x="-170" y="-46" width="290" height="22" fill="#111"/>
  <rect x="60" y="-24" width="60" height="70" fill="#1F3A93"/>
  <text x="-155" y="-29" font-family="Georgia, serif" font-size="13" fill="${GOLD}" letter-spacing="3">KUNSTNER PRO</text>
  <text x="-155" y="12" font-family="Georgia, serif" font-size="30" fill="#111">Oil Colour</text>
  <rect x="190" y="-26" width="70" height="52" rx="6" fill="#111"/>
</g>
<g transform="translate(1000 300) rotate(36)">
  <path d="M 0 -12 L -70 -15 Q -95 0 -70 15 L 0 12 Z" fill="#C79A5B"/>
  <rect x="0" y="-14" width="60" height="28" fill="url(#h-metal)"/>
  <path d="M 60 -14 L 520 -8 Q 540 0 520 8 L 60 14 Z" fill="#1A1A1A"/>
</g>
<rect width="1600" height="900" fill="url(#h-fade)"/>
</svg>`;

for (const [name, svg] of Object.entries(files)) {
  writeFileSync(join(OUT, `${name}.svg`), svg.replace(/\n\s+/g, "\n"));
}
console.log(`Genererte ${Object.keys(files).length} illustrasjoner i ${OUT}`);
