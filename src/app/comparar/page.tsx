import type { Metadata } from "next";
import { CompareBuilder } from "@/components/compare/CompareBuilder";
import { CompareTable } from "@/components/compare/CompareTable";
import { getGamesForComparison } from "@/lib/queries/games";
import { getPlatforms, getCategories } from "@/lib/queries/taxonomy";
import { toList } from "@/lib/url-params";

export const metadata: Metadata = {
  title: "Comparador de juegos y de Platinos",
  description:
    "Compara hasta cuatro juegos de PS4 y PS5 lado a lado: dificultad del Platino, tiempos por tramo, número de trofeos, perdibles, online y partidas necesarias. Los datos se muestran sin ordenar por mejor o peor.",
  alternates: { canonical: "/comparar" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ComparePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const slugs = toList(Array.isArray(sp.juegos) ? sp.juegos.join(",") : sp.juegos).slice(0, 4);

  const [games, platforms, categories] = await Promise.all([
    getGamesForComparison(slugs),
    getPlatforms(),
    getCategories(),
  ]);

  return (
    <div className="gh-container py-8">
      <header className="mb-6 max-w-3xl">
        <h1 className="text-2xl font-black tracking-tight text-base-100 sm:text-3xl">
          Comparador de juegos
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-base-400">
          Elige entre dos y cuatro juegos y contrasta sus datos de platino. La tabla muestra la
          información en bruto, <strong className="text-base-300">sin ordenar nada como mejor o
          peor</strong>: la decisión es tuya.
        </p>
      </header>

      <CompareBuilder platforms={platforms} categories={categories} selected={slugs} />

      {games.length === 0 ? (
        <div className="gh-card mt-6 flex flex-col items-center gap-3 px-6 py-14 text-center">
          <p className="text-base font-semibold text-base-100">Aún no has elegido ningún juego</p>
          <p className="max-w-md text-sm text-base-400">
            Selecciona al menos dos títulos arriba, o entra directamente con una URL como{" "}
            <code className="rounded bg-base-850 px-1.5 py-0.5 font-mono text-xs text-accent-300">
              /comparar?juegos=god-of-war,ghost-of-tsushima
            </code>
            .
          </p>
        </div>
      ) : (
        <CompareTable games={games} />
      )}
    </div>
  );
}
