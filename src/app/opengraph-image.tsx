import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Games Hunter — Encuentra tu próximo platino";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagen Open Graph generada al vuelo, sin ficheros externos. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0b0f14 0%, #121923 55%, #0f1b26 100%)",
          color: "#e7edf6",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "linear-gradient(135deg, #38bdf8, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
            }}
          >
            🏆
          </div>
          <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: -1 }}>
            Games Hunter
          </div>
        </div>

        <div
          style={{
            marginTop: 40,
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
            maxWidth: 900,
          }}
        >
          Encuentra tu próximo platino
        </div>

        <div style={{ marginTop: 28, fontSize: 30, color: "#8fa0ba", maxWidth: 900 }}>
          Dificultad del Platino, tiempos estimados, lista completa de trofeos y guías de PS4 y PS5.
        </div>

        <div
          style={{
            marginTop: 48,
            display: "flex",
            gap: 14,
            fontSize: 24,
            color: "#38bdf8",
          }}
        >
          <span style={{ border: "1px solid #24303f", borderRadius: 999, padding: "8px 20px" }}>
            PS4
          </span>
          <span style={{ border: "1px solid #24303f", borderRadius: 999, padding: "8px 20px" }}>
            PS5
          </span>
          <span style={{ border: "1px solid #24303f", borderRadius: 999, padding: "8px 20px" }}>
            Trofeos perdibles
          </span>
          <span style={{ border: "1px solid #24303f", borderRadius: 999, padding: "8px 20px" }}>
            Guías paso a paso
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
