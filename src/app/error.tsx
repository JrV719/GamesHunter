"use client";

import { useEffect } from "react";
import Link from "next/link";
import { IconAlert, IconDatabase, IconSearch, IconArrowRight } from "@/components/ui/Icon";

/**
 * Frontera de error de las rutas.
 *
 * Hasta ahora una excepción en el render del servidor (por ejemplo, porque la
 * base de datos no está configurada en el despliegue) terminaba en la pantalla
 * «Application error» de Next, que no dice nada útil. Esta página sustituye esa
 * pantalla en blanco por un mensaje legible y ofrece reintentar.
 *
 * El mensaje real de un error de servidor se omite en producción por seguridad,
 * así que aquí sólo se muestra el `digest`, que es el identificador que aparece
 * también en los registros de Vercel y permite casar ambos.
 */
export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Queda también en la consola del navegador; el detalle real está en los
    // Runtime Logs de Vercel, buscados por este mismo digest.
    console.error("Error de render en GamesHunter", error);
  }, [error]);

  return (
    <div className="gh-container flex min-h-[70dvh] items-center justify-center py-16">
      <div className="w-full max-w-xl">
        <div className="gh-card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-base-700 bg-base-800/60 px-5 py-4">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-rose-500/15 text-rose-300">
              <IconAlert size={18} />
            </span>
            <div>
              <h1 className="text-base font-black tracking-tight text-base-100">
                No hemos podido cargar esta página
              </h1>
              <p className="text-xs text-base-400">
                El servidor ha respondido con un error al generar el contenido.
              </p>
            </div>
          </div>

          <div className="space-y-4 p-5 text-sm leading-relaxed text-base-300">
            <p>
              El catálogo de GamesHunter se lee de una base de datos externa. Si el despliegue no la
              tiene configurada, el servidor no puede mostrar fichas de juegos, guías ni la
              comunidad.
            </p>

            <div className="rounded-lg border border-base-700 bg-base-850 p-4 text-xs">
              <p className="mb-2 flex items-center gap-2 font-bold text-base-200">
                <IconDatabase size={14} className="text-accent-400" />
                Causa más habitual
              </p>
              <p className="text-base-400">
                Faltan las variables de entorno de la base de datos en el proyecto de Vercel (
                <code className="text-accent-300">DATABASE_URL</code> y{" "}
                <code className="text-accent-300">DATABASE_AUTH_TOKEN</code>). Se configuran en{" "}
                <strong className="text-base-300">Settings → Environment Variables</strong> y
                requieren un nuevo despliegue para aplicarse.
              </p>
            </div>

            {error.digest && (
              <p className="text-xs text-base-500">
                Identificador del error (aparece también en los registros de Vercel):{" "}
                <code className="font-mono text-base-400">{error.digest}</code>
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-base-700 bg-base-800/40 px-5 py-4">
            <button type="button" onClick={reset} className="gh-btn gh-btn-primary text-xs">
              Reintentar
            </button>
            <Link href="/" className="gh-btn gh-btn-ghost text-xs">
              <IconArrowRight size={14} /> Volver al inicio
            </Link>
            <Link href="/juegos" className="gh-btn gh-btn-ghost text-xs">
              <IconSearch size={14} /> Ir al catálogo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
