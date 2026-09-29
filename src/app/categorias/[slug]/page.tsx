import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategoryBySlug, getCategories } from "@/lib/queries/taxonomy";
import { listGames } from "@/lib/queries/games";
import { GameGrid } from "@/components/game/GameCard";
import { Pagination } from "@/components/search/Pagination";
import { SortSelect } from "@/components/search/CatalogFilters";
import { Chip, EmptyState } from "@/components/ui/primitives";
import { IconTag, IconArrowRight } from "@/components/ui/Icon";
import { toList, toNum, toBool } from "@/lib/url-params";
import type { GameSort } from "@/lib/filters";
import { Suspense } from "react";
import { GameCardSkeleton } from "@/components/game/GameCard";

type Params = { params: Promise<{ slug: string }> };
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Categoría no encontrada" };
  return {
    title: `${category.name}: juegos con guía de trofeos y dificultad del Platino`,
    description: `${category.description ?? `Juegos de ${category.name}`} en PS4 y PS5 con dificultad del Platino, tiempos estimados, lista de trofeos y guías.`,
    alternates: { canonical: `/categorias/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: Params & { searchParams: SearchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const rawSort = Array.isArray(sp.orden) ? sp.orden[0] : sp.orden;
  const sort = (rawSort as GameSort) ?? "relevance";
  const page = Math.max(1, toNum(sp.pagina) ?? 1);
  const filters = {
    categories: [category.slug],
    platforms: toList(sp.plataforma),
    minDifficulty: toNum(sp.difMin),
    maxDifficulty: toNum(sp.difMax),
    maxHours: toNum(sp.horas),
    missables: toBool(sp.perdibles),
    online: toBool(sp.online),
  };

  const result = await listGames({ filters, sort, page });
  const allCategories = await getCategories();
  const related = allCategories
    .filter((c) => c.slug !== category.slug && (c.gameCount ?? 0) > 0)
    .slice(0, 10);

  return (
    <div className="gh-container py-8">
      <nav aria-label="Migas de pan" className="mb-4 text-xs text-base-400">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-accent-300">
              Inicio
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/categorias" className="hover:text-accent-300">
              Categorías
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-base-200">{category.name}</li>
        </ol>
      </nav>

      <header className="mb-6">
        <div className="flex items-center gap-2.5">
          <IconTag size={20} className="text-accent-400" />
          <h1 className="text-2xl font-black tracking-tight text-base-100 sm:text-3xl">
            {category.name}
          </h1>
        </div>
        {category.description && (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-base-400">
            {category.description}
          </p>
        )}
        <p className="mt-2 text-xs text-base-500">
          {result.total} {result.total === 1 ? "juego" : "juegos"} con datos de platino en esta
          categoría.
        </p>
      </header>

      {/* Subfiltros rápidos */}
      <div className="gh-card mb-5 flex flex-wrap items-center gap-2 p-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-base-500">
          Filtros rápidos
        </span>
        {[
          { label: "Platino fácil", q: "difMax=4" },
          { label: "Platino difícil", q: "difMin=8" },
          { label: "Menos de 20 h", q: "horas=20" },
          { label: "Con perdibles", q: "perdibles=1" },
          { label: "Con online", q: "online=1" },
          { label: "Solo PS5", q: "plataforma=ps5" },
          { label: "Solo PS4", q: "plataforma=ps4" },
        ].map((f) => (
          <Link
            key={f.label}
            href={`/categorias/${category.slug}?${f.q}`}
            className="gh-chip border-base-700 bg-base-850 text-base-400 transition-colors hover:border-accent-500/40 hover:text-accent-300"
          >
            {f.label}
          </Link>
        ))}
        <div className="ml-auto">
          <SortSelect
            sort={sort}
            filters={filters}
            base={`/categorias/${category.slug}`}
          />
        </div>
      </div>

      {result.total === 0 ? (
        <EmptyState
          title="No hay juegos en esta categoría con los filtros aplicados"
          description="Prueba a quitar algún filtro rápido."
          icon={<IconTag size={22} />}
          action={
            <Link href={`/categorias/${category.slug}`} className="gh-btn gh-btn-ghost text-xs">
              Quitar filtros
            </Link>
          }
        />
      ) : (
        <>
          <Suspense key={`${sort}-${page}-${JSON.stringify(filters)}`} fallback={<Skeleton />}>
            <GameGrid games={result.games} priorityCount={4} showStatus />
          </Suspense>
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            sort={sort}
            filters={filters}
            base={`/categorias/${category.slug}`}
          />
        </>
      )}

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="gh-section-title mb-3">Otras categorías</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((c) => (
              <Link
                key={c.id}
                href={`/categorias/${c.slug}`}
                className="gh-card flex items-center gap-2 px-3 py-2 text-xs font-semibold text-base-300 transition-colors hover:border-accent-500/40 hover:text-accent-300"
              >
                {c.name}
                <span className="font-mono text-[10px] text-base-500">{c.gameCount}</span>
                <IconArrowRight size={11} className="text-base-600" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  );
}
