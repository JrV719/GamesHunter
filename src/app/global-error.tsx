"use client";

/**
 * Frontera de error raíz: sustituye el HTML completo, así que también hay que
 * aportar `<html>` y `<body>`. Next la usa cuando falla el layout raíz (por
 * ejemplo, si la metadata no se puede resolver).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#0b0f14",
          color: "#e7edf6",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <div style={{ maxWidth: "32rem", padding: "2rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 0.75rem" }}>
            Games Hunter no ha podido arrancar
          </h1>
          <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "#8fa0ba" }}>
            Ha ocurrido un error antes de poder mostrar la página. Revisa los registros del
            despliegue en Vercel para ver el detalle.
          </p>
          {error.digest && (
            <p style={{ fontSize: "0.75rem", color: "#5c6b80", marginTop: "1rem" }}>
              Identificador: <code>{error.digest}</code>
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "#0ea5e9",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
