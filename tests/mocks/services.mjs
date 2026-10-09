/**
 * Lokal etterligning av eksterne tjenester for testing uten ekte nøkler:
 *   - Enhetsregisteret (Brønnøysund):  BRREG_API_URL=http://localhost:4010/brreg
 *   - Stripe:                          STRIPE_API_URL=http://localhost:4010
 *   - Resend:                          RESEND_BASE_URL=http://localhost:4010
 * Kontroll og innsyn:  POST /__mode {"stripe":"ok"|"fail"} · GET /__emails · GET /__stripe · POST /__reset
 * Kjør: node tests/mocks/services.mjs
 */
import http from "node:http";

const state = { stripeMode: "ok", emails: [], stripeCalls: [], sessions: {} };

// Organisasjonsnumre (gyldig mod11) brukt i testene
const ORGS = {
  "974760673": { navn: "REGISTERENHETEN I BRØNNØYSUND", organisasjonsform: { kode: "ORGL" }, registrertIMvaregisteret: true },
  "914778271": { navn: "AKTIV KUNSTSKOLE AS", organisasjonsform: { kode: "AS" }, registrertIMvaregisteret: true },
  "923456783": { navn: "KONKURSRAMMET ATELIER AS", organisasjonsform: { kode: "AS" }, konkurs: true },
};

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
  });
}
const json = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const body = ["POST", "PUT", "PATCH"].includes(req.method) ? await readBody(req) : "";

    if (url.pathname === "/__reset") {
      Object.assign(state, { stripeMode: "ok", emails: [], stripeCalls: [], sessions: {} });
      return json(res, 200, { ok: true });
    }
    if (url.pathname === "/__mode") {
      Object.assign(state, { stripeMode: JSON.parse(body).stripe ?? state.stripeMode });
      return json(res, 200, { ok: true, mode: state.stripeMode });
    }
    if (url.pathname === "/__emails") return json(res, 200, state.emails);
    if (url.pathname === "/__stripe") return json(res, 200, state.stripeCalls);

    // ---- Enhetsregisteret
    const brreg = /^\/brreg\/enheter\/(\d{9})$/.exec(url.pathname);
    if (brreg) {
      const org = ORGS[brreg[1]];
      return org ? json(res, 200, { organisasjonsnummer: brreg[1], ...org }) : json(res, 404, { status: 404, error: "Not Found" });
    }

    // ---- Resend
    if (url.pathname === "/emails" && req.method === "POST") {
      const mail = JSON.parse(body);
      state.emails.push({ to: mail.to, subject: mail.subject, html: mail.html, from: mail.from });
      return json(res, 200, { id: `re_mock_${state.emails.length}` });
    }

    // ---- Stripe
    if (url.pathname.startsWith("/v1/")) {
      state.stripeCalls.push({ method: req.method, path: url.pathname, body: Object.fromEntries(new URLSearchParams(body)) });
      if (state.stripeMode === "fail") return json(res, 500, { error: { message: "Mock Stripe utilgjengelig", type: "api_error" } });
      if (url.pathname === "/v1/checkout/sessions" && req.method === "POST") {
        const id = `cs_test_mock_${state.stripeCalls.length}`;
        const p = new URLSearchParams(body);
        state.sessions[id] = { id, amount_total: 0, metadata: { order_id: p.get("metadata[order_id]") } };
        return json(res, 200, { id, object: "checkout.session", url: `http://localhost:4010/pay/${id}`, payment_status: "unpaid" });
      }
      if (url.pathname === "/v1/coupons") return json(res, 200, { id: `coupon_mock_${state.stripeCalls.length}`, object: "coupon" });
      if (url.pathname === "/v1/refunds") return json(res, 200, { id: "re_mock", object: "refund", status: "succeeded" });
      return json(res, 404, { error: { message: "mock: ukjent endepunkt" } });
    }
    json(res, 404, { error: "not found" });
  })
  .listen(4010, () => console.log("mock-tjenester på :4010"));
