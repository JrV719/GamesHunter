import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { GameGrid, GameCardSkeleton } from "@/components/game/GameCard";
import { CatalogFilters, SortSelect, ActiveFilters } from "@/components/search/CatalogFilters";
import { Pagination } from "@/components/search/Pagination";
import { EmptyState } from "@/components/ui/primitives";
import { IconSearch } from "@/components/ui/Icon";
import { listGames } from "@/lib/queries/games";
import { getCategories, getPlatforms, getDevelopers } from "@/lib/queries/taxonomy";
import { parseFilters, toNum } from "@/lib/url-params";
import type { GameSort } from "@/lib/filters";

export const metadata: Metadata = {
  title: "Catálogo de juegos PS4 y PS5 con filtro de trofeos",
  description:
    "Explora el catálogo de juegos de PS4 y PS5 filtrando por plataforma, género, dificultad del Platino, tiempo, número de trofeos, trofeos online y trofeos perdibles.",
  alternates: { canonical: "/juegos" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const rawSort = Array.isArray(sp.orden) ? sp.orden[0] : sp.orden;
  const sort = (rawSort as GameSort) ?? "relevance";
  const page = Math.max(1, toNum(sp.pagina) ?? 1);

  const [result, platforms, categories, developers] = await Promise.all([
    listGames({ filters, sort, page }),
    getPlatforms(),
    getCategories(),
    getDevelopers(),
  ]);

  const activeCount = Object.entries(filters).filter(([, v]) =>
    Array.isArray(v) ? v.length > 0 : v !== undefined && v !== false,
  ).length;

  return (
    <div className="gh-container py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-base-100 sm:text-3xl">
          Catálogo de juegos
        </h1>
        <p className="mt-1 text-sm text-base-400">
          {result.total} {result.total === 1 ? "juego" : "juegos"} con datos de trofeos
          {filters.q && (
            <>
              {" "}
              para «<span className="font-semibold text-base-200">{filters.q}</span>»
            </>
          )}
          . Filtra por plataforma, género, dificultad del Platino, tiempo y tipo de trofeo.
        </p>
      </header>

      <div className="mb-5 max-w-2xl">
        <SearchBar initialQuery={filters.q} size="md" placeholder="Busca por nombre de juego..." />
      </div>

      <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto">
          <CatalogFilters
            platforms={platforms}
            categories={categories}
            developers={developers}
            filters={filters}
          />
        </aside>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <ActiveFilters filters={filters} total={result.total} />
            <SortSelect sort={sort} filters={filters} />
          </div>

          {result.total === 0 ? (
            <EmptyState
              title="Ningún juego coincide con estos filtros"
              description="Prueba a quitar algún filtro o a buscar por otro nombre. También puedes empezar por los juegos populares de la portada."
              icon={<IconSearch size={24} />}
              action={
                <a href="/juegos" className="gh-btn gh-btn-ghost text-xs">
                  Quitar todos los filtros
                </a>
              }
            />
          ) : (
            <>
              <Suspense
                key={`${sort}-${page}-${JSON.stringify(filters)}`}
                fallback={
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <GameCardSkeleton key={i} />
                    ))}
                  </div>
                }
              >
                <GameGrid games={result.games} priorityCount={4} showStatus />
              </Suspense>

              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                total={result.total}
                sort={sort}
                filters={filters}
              />
            </>
          )}

          {activeCount > 0 && result.total > 0 && (
            <p className="mt-6 text-center text-[11px] text-base-500">
              {activeCount} {activeCount === 1 ? "filtro activo" : "filtros activos"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
