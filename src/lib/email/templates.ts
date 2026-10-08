import { siteUrl } from "@/lib/env";
import { button, esc, kr, layout } from "./layout";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface OrderEmailData {
  orderNumber: number | string;
  customerName: string;
  items: { name: string; variant?: string | null; quantity: number; lineTotalOre: number }[];
  subtotalOre: number;
  discountOre: number;
  shippingOre: number;
  totalOre: number;
  vatOre: number;
  shippingMethod: string | null;
  shippingAddress: { full_name: string; line1: string; line2?: string | null; postal_code: string; city: string };
  paymentMethod: string;
}

function itemsTable(d: OrderEmailData): string {
  const rows = d.items
    .map(
      (i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #EEE">${esc(i.name)}${i.variant ? `<br><span style="color:#777;font-size:13px">${esc(i.variant)}</span>` : ""}</td>
<td style="padding:8px 0;border-bottom:1px solid #EEE;text-align:center">${i.quantity}</td>
<td style="padding:8px 0;border-bottom:1px solid #EEE;text-align:right;white-space:nowrap">${kr(i.lineTotalOre)}</td></tr>`,
    )
    .join("");
  const line = (label: string, value: string, bold = false) =>
    `<tr><td colspan="2" style="padding:4px 0;${bold ? "font-weight:bold" : ""}">${label}</td><td style="padding:4px 0;text-align:right;${bold ? "font-weight:bold" : ""}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:18px 0">
<tr><th align="left" style="padding-bottom:6px;border-bottom:2px solid #111">Vare</th><th style="padding-bottom:6px;border-bottom:2px solid #111">Antall</th><th align="right" style="padding-bottom:6px;border-bottom:2px solid #111">Sum</th></tr>
${rows}
${line("Varer", kr(d.subtotalOre))}
${d.discountOre ? line("Rabatt", `−${kr(d.discountOre)}`) : ""}
${line(`Frakt${d.shippingMethod ? ` (${esc(d.shippingMethod)})` : ""}`, d.shippingOre ? kr(d.shippingOre) : "Gratis")}
${line("Totalt", kr(d.totalOre), true)}
${line("Herav MVA", kr(d.vatOre))}
</table>`;
}

function addressBlock(a: OrderEmailData["shippingAddress"]): string {
  return `<p style="margin:0 0 16px"><strong>Leveringsadresse</strong><br>${esc(a.full_name)}<br>${esc(a.line1)}${a.line2 ? `<br>${esc(a.line2)}` : ""}<br>${esc(a.postal_code)} ${esc(a.city)}</p>`;
}

export const emails = {
  welcome(name: string): RenderedEmail {
    return {
      subject: "Velkommen til Kunstner Pro",
      html: layout({
        siteUrl,
        preheader: "Kontoen din er opprettet.",
        title: `Velkommen, ${name}!`,
        body: `<p>Takk for at du opprettet konto hos Kunstner Pro – nettbutikken for oljemaling, pensler, lerret og kunstmateriell.</p>
<p>På <strong>Min side</strong> kan du følge bestillinger, lagre adresser og favoritter, og enkelt kjøpe de samme produktene igjen.</p>
${button(`${siteUrl}/konto`, "Gå til Min side")}
<p>Driver du atelier, kunstskole eller kursvirksomhet? Da kan du søke om <a href="${siteUrl}/handlekonto" style="color:#111">handlekonto</a>.</p>`,
      }),
      text: `Velkommen til Kunstner Pro, ${name}! Gå til Min side: ${siteUrl}/konto`,
    };
  },

  orderConfirmation(d: OrderEmailData): RenderedEmail {
    return {
      subject: `Ordrebekreftelse – ordre ${d.orderNumber}`,
      html: layout({
        siteUrl,
        preheader: `Vi har mottatt bestillingen din (ordre ${d.orderNumber}).`,
        title: "Takk for bestillingen!",
        body: `<p>Hei ${esc(d.customerName)},</p>
<p>Vi har mottatt ordre <strong>${esc(d.orderNumber)}</strong>. Du får en ny e-post når pakken er sendt.</p>
${itemsTable(d)}
${addressBlock(d.shippingAddress)}
<p style="margin:0 0 8px"><strong>Betaling:</strong> ${esc(d.paymentMethod)}</p>
${button(`${siteUrl}/konto/bestillinger`, "Se bestillingen")}
<p style="font-size:13px;color:#666">Du har 14 dagers angrerett fra du mottar varene. Les mer om <a href="${siteUrl}/angrerett" style="color:#666">angrerett</a> og <a href="${siteUrl}/kjopsvilkar" style="color:#666">kjøpsvilkår</a>.</p>`,
      }),
      text: `Takk for bestillingen! Ordre ${d.orderNumber}. Totalt ${kr(d.totalOre)}.`,
    };
  },

  paymentConfirmation(d: { orderNumber: number | string; customerName: string; totalOre: number; provider: string }): RenderedEmail {
    return {
      subject: `Betaling mottatt – ordre ${d.orderNumber}`,
      html: layout({
        siteUrl,
        preheader: "Betalingen er bekreftet.",
        title: "Betalingen er bekreftet",
        body: `<p>Hei ${esc(d.customerName)},</p><p>Vi har mottatt betaling på <strong>${kr(d.totalOre)}</strong> for ordre <strong>${esc(d.orderNumber)}</strong> via ${esc(d.provider)}. Bestillingen behandles nå.</p>${button(`${siteUrl}/konto/bestillinger`, "Se bestillingen")}`,
      }),
      text: `Betaling mottatt for ordre ${d.orderNumber}: ${kr(d.totalOre)}.`,
    };
  },

  shipmentConfirmation(d: { orderNumber: number | string; customerName: string; carrier: string; trackingNumber: string | null; trackingUrl: string | null }): RenderedEmail {
    return {
      subject: `Ordre ${d.orderNumber} er sendt`,
      html: layout({
        siteUrl,
        preheader: "Pakken din er på vei.",
        title: "Pakken din er på vei",
        body: `<p>Hei ${esc(d.customerName)},</p><p>Ordre <strong>${esc(d.orderNumber)}</strong> er sendt med <strong>${esc(d.carrier)}</strong>.</p>
${d.trackingNumber ? `<p>Sporingsnummer: <strong>${esc(d.trackingNumber)}</strong></p>` : ""}
${d.trackingUrl ? button(d.trackingUrl, "Spor pakken") : button(`${siteUrl}/konto/bestillinger`, "Se bestillingen")}`,
      }),
      text: `Ordre ${d.orderNumber} er sendt med ${d.carrier}. ${d.trackingNumber ? `Sporingsnummer: ${d.trackingNumber}` : ""}`,
    };
  },

  deliveryUpdate(d: { orderNumber: number | string; customerName: string; status: string; message: string }): RenderedEmail {
    return {
      subject: `Oppdatering på ordre ${d.orderNumber}: ${d.status}`,
      html: layout({
        siteUrl,
        preheader: d.message,
        title: d.status,
        body: `<p>Hei ${esc(d.customerName)},</p><p>${esc(d.message)}</p>${button(`${siteUrl}/konto/bestillinger`, "Se bestillingen")}`,
      }),
      text: `${d.status}: ${d.message}`,
    };
  },

  passwordReset(link: string): RenderedEmail {
    return {
      subject: "Tilbakestill passordet ditt",
      html: layout({
        siteUrl,
        preheader: "Lenken er gyldig i en begrenset periode.",
        title: "Tilbakestill passord",
        body: `<p>Vi har mottatt en forespørsel om å tilbakestille passordet for kontoen din.</p>${button(link, "Velg nytt passord")}<p style="font-size:13px;color:#666">Lenken kan bare brukes én gang. Har du ikke bedt om dette, kan du se bort fra e-posten – passordet ditt er uendret.</p>`,
      }),
      text: `Tilbakestill passordet ditt: ${link}`,
    };
  },

  creditApplicationReceived(d: { companyName: string; contactName: string }): RenderedEmail {
    return {
      subject: "Vi har mottatt søknaden om handlekonto",
      html: layout({
        siteUrl,
        preheader: "Søknaden behandles manuelt.",
        title: "Søknad om handlekonto mottatt",
        body: `<p>Hei ${esc(d.contactName)},</p><p>Takk for søknaden om handlekonto for <strong>${esc(d.companyName)}</strong>. Søknaden behandles manuelt, og vi tar kontakt når den er vurdert.</p><p>Du kan følge status på Min side.</p>${button(`${siteUrl}/konto/handlekonto`, "Se status")}`,
      }),
      text: `Vi har mottatt søknaden om handlekonto for ${d.companyName}.`,
    };
  },

  creditApplicationDecision(d: { companyName: string; contactName: string; approved: boolean; limitOre?: number | null; termsDays?: number | null; note?: string | null }): RenderedEmail {
    return {
      subject: d.approved ? "Handlekontoen din er godkjent" : "Svar på søknad om handlekonto",
      html: layout({
        siteUrl,
        preheader: d.approved ? "Du kan nå handle på faktura." : "Søknaden er behandlet.",
        title: d.approved ? "Handlekontoen er godkjent" : "Søknaden er behandlet",
        body: d.approved
          ? `<p>Hei ${esc(d.contactName)},</p><p>Handlekontoen for <strong>${esc(d.companyName)}</strong> er godkjent${d.limitOre ? ` med en kredittramme på <strong>${kr(d.limitOre)}</strong>` : ""}${d.termsDays ? ` og ${d.termsDays} dagers betalingsfrist` : ""}.</p>${d.note ? `<p>${esc(d.note)}</p>` : ""}${button(`${siteUrl}/konto/handlekonto`, "Se handlekontoen")}`
          : `<p>Hei ${esc(d.contactName)},</p><p>Vi har behandlet søknaden om handlekonto for <strong>${esc(d.companyName)}</strong>, og kan dessverre ikke innvilge den nå.</p>${d.note ? `<p>${esc(d.note)}</p>` : ""}<p>Du kan fortsatt handle med kort som vanlig. Ta gjerne kontakt med kundeservice om du har spørsmål.</p>`,
      }),
      text: d.approved ? `Handlekontoen for ${d.companyName} er godkjent.` : `Søknaden om handlekonto for ${d.companyName} er ikke innvilget.`,
    };
  },

  newsletterConfirm(link: string): RenderedEmail {
    return {
      subject: "Bekreft påmelding til nyhetsbrevet",
      html: layout({
        siteUrl,
        preheader: "Ett klikk gjenstår.",
        title: "Bekreft påmeldingen",
        body: `<p>Klikk på knappen for å bekrefte at du vil motta nyhetsbrev fra Kunstner Pro.</p>${button(link, "Bekreft påmelding")}<p style="font-size:13px;color:#666">Har du ikke meldt deg på, kan du se bort fra denne e-posten.</p>`,
      }),
      text: `Bekreft påmeldingen: ${link}`,
    };
  },

  abandonedCart(d: { name: string | null; items: { name: string; quantity: number }[]; unsubscribeUrl: string }): RenderedEmail {
    const list = d.items.map((i) => `<li>${esc(i.name)} × ${i.quantity}</li>`).join("");
    return {
      subject: "Du har varer i handlekurven",
      html: layout({
        siteUrl,
        preheader: "Varene ligger fortsatt klare.",
        title: "Glemte du noe?",
        body: `<p>Hei${d.name ? ` ${esc(d.name)}` : ""},</p><p>Du har fortsatt varer i handlekurven:</p><ul>${list}</ul>${button(`${siteUrl}/handlekurv`, "Fullfør bestillingen")}`,
        footerNote: `Du får denne e-posten fordi du har samtykket til markedsføring. <a href="${esc(d.unsubscribeUrl)}" style="color:#6B665E">Meld deg av</a>.`,
      }),
      text: `Du har varer i handlekurven: ${siteUrl}/handlekurv`,
    };
  },

  campaign(d: { subject: string; preheader: string | null; html: string; unsubscribeUrl: string }): RenderedEmail {
    return {
      subject: d.subject,
      html: layout({
        siteUrl,
        preheader: d.preheader ?? d.subject,
        title: d.subject,
        body: d.html,
        footerNote: `Du får denne e-posten fordi du har meldt deg på nyhetsbrevet. <a href="${esc(d.unsubscribeUrl)}" style="color:#6B665E">Meld deg av</a>.`,
      }),
      text: d.subject,
    };
  },

  lowStockAdmin(items: { sku: string; name: string; available: number; min: number }[]): RenderedEmail {
    const rows = items.map((i) => `<tr><td style="padding:4px 8px">${esc(i.sku)}</td><td style="padding:4px 8px">${esc(i.name)}</td><td style="padding:4px 8px;text-align:right">${i.available}</td><td style="padding:4px 8px;text-align:right">${i.min}</td></tr>`).join("");
    return {
      subject: `Lav lagerbeholdning: ${items.length} varianter`,
      html: layout({
        siteUrl,
        preheader: "Varianter under minimumsbeholdning.",
        title: "Lav lagerbeholdning",
        body: `<table cellpadding="0" cellspacing="0" style="font-size:13px;border-collapse:collapse"><tr><th align="left">SKU</th><th align="left">Produkt</th><th>Tilgj.</th><th>Min.</th></tr>${rows}</table>${button(`${siteUrl}/admin/lager`, "Åpne lager og innkjøpsforslag")}`,
      }),
      text: items.map((i) => `${i.sku} ${i.name}: ${i.available} (min ${i.min})`).join("\n"),
    };
  },
};
