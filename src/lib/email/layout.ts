/**
 * Felles e-postlayout med Kunstner Pro-profil. Tabellbasert og inline-stilt for
 * god støtte i e-postklienter. All dynamisk tekst escapes.
 */
export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const GOLD = "#D4AF65";
const INK = "#111111";

export function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0"><tr><td style="background:${GOLD};border-radius:6px">
<a href="${esc(href)}" style="display:inline-block;padding:14px 28px;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;color:${INK};text-decoration:none">${esc(label)}</a>
</td></tr></table>`;
}

export function layout(opts: { preheader: string; title: string; body: string; siteUrl: string; footerNote?: string }): string {
  return `<!doctype html>
<html lang="nb"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(opts.title)}</title></head>
<body style="margin:0;padding:0;background:#F8F7F4">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8F7F4"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border:1px solid #E4E0D7">
<tr><td style="background:${INK};padding:26px 32px">
  <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:bold;color:#FFFFFF">Kunstner<span style="color:${GOLD}">·</span>Pro</div>
  <div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:3px;color:#BBBBBB;text-transform:uppercase;margin-top:4px">Oljemaling &amp; Kunstmateriell</div>
</td></tr>
<tr><td style="padding:36px 32px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#222222">
  <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:${INK};margin:0 0 18px">${esc(opts.title)}</h1>
  ${opts.body}
</td></tr>
<tr><td style="padding:22px 32px;background:#F3F0EA;font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#6B665E">
  ${opts.footerNote ? `<p style="margin:0 0 8px">${opts.footerNote}</p>` : ""}
  <p style="margin:0">Kunstner Pro · <a href="${esc(opts.siteUrl)}" style="color:#6B665E">${esc(opts.siteUrl.replace(/^https?:\/\//, ""))}</a> · <a href="${esc(opts.siteUrl)}/kontakt" style="color:#6B665E">Kundeservice</a></p>
</td></tr>
</table></td></tr></table></body></html>`;
}

export function kr(ore: number): string {
  const v = ore / 100;
  return `${v.toLocaleString("nb-NO", { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 })} kr`;
}
