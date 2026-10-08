import { ImageResponse } from "next/og";

export const alt = "Kunstner Pro – Oljemaling & Kunstmateriell";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#111", color: "#fff" }}>
        <div style={{ fontSize: 30, letterSpacing: 8, color: "#D4AF65" }}>OLJEMALING & KUNSTMATERIELL</div>
        <div style={{ fontSize: 110, fontWeight: 700, marginTop: 20 }}>Kunstner Pro</div>
        <div style={{ fontSize: 40, marginTop: 24, color: "#ddd" }}>Spar penger uten å gå på kompromiss med kvaliteten.</div>
      </div>
    ),
    size,
  );
}
