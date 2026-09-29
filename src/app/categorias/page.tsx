import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, getPlatforms } from "@/lib/queries/taxonomy";
import { listGames } from "@/lib/queries/games";
import { GameCard } from "@/components/game/GameCard";
import { SectionHeading } from "@/components/ui/primitives";
import { IconTag, IconLayers } from "@/components/ui/Icon";
import { SORT_LABELS } from "@/lib/filters";

export const metadata: Metadata = {
  title: "Categorías de juegos con guía de trofeos",
  description:
    "Explora los juegos de PS4 y PS5 por género: acción, RPG, aventura, terror, soulslike, mundo abierto, indie y más. Cada categoría enlaza a su filtrado de platinos.",
  alternates: { canonical: "/categorias" },
};

const SORTS_SHOWN = [
  "relevance",
  "difficulty_asc",
  "difficulty_desc",
  "platinum_hours_asc",
  "trophies_desc",
  "release_desc",
] as const;

export default async function CategoriesPage() {
  const [categories, platforms] = await Promise.all([getCategories(), getPlatforms()]);

  const withCounts = categories
    .filter((c) => (c.gameCount ?? 0) > 0)
    .sort((a, b) => (b.gameCount ?? 0) - (a.gameCount ?? 0));

  return (
    <div className="gh-container py-8">
      <header className="mb-8 max-w-3xl">
        <h1 className="text-2xl font-black tracking-tight text-base-100 sm:text-3xl">
          Categorías
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-base-400">
          Filtra el catálogo por género. Cada categoría se puede combinar con los filtros de
          dificultad, tiempo, plataformas y tipo de trofeo desde la{" "}
          <Link href="/juegos" className="gh-link">
            página del catálogo
          </Link>
          .
        </p>
      </header>

      <section>
        <SectionHeading
          title="Géneros con juegos publicados"
          description={`${withCounts.length} categorías activas`}
          icon={<IconTag size={16} className="text-accent-400" />}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {withCounts.map((c) => (
            <Link
              key={c.id}
              href={`/categorias/${c.slug}`}
              className="gh-card group flex flex-col p-4 transition-colors hover:border-accent-500/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[15px] font-bold text-base-100 group-hover:text-accent-300">
                    {c.name}
                  </p>
                  {c.description && (
                    <p className="mt-1 text-[12px] leading-relaxed text-base-400">
                      {c.description}
                    </p>
                  )}
                </div>
                <span className="shrink-0 rounded-lg bg-accent-600/15 px-2 py-1 font-mono text-xs font-bold text-accent-300">
                  {c.gameCount}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <SectionHeading
          title="Ordenaciones disponibles"
          description="Se aplican en el catálogo y en las categorías."
          icon={<IconLayers size={16} className="text-accent-400" />}
        />
        <div className="gh-card divide-y divide-base-700/70">
          {SORTS_SHOWN.map((s) => (
            <Link
              key={s}
              href={`/juegos?orden=${s}`}
              className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-base-300 transition-colors hover:bg-base-750 hover:text-accent-300"
            >
              {SORT_LABELS[s]}
              <span aria-hidden="true" className="text-base-600">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <SectionHeading
          title="Por plataforma"
          description="PS4, PS5 o las dos."
          icon={<IconLayers size={16} className="text-accent-400" />}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {platforms.map((p) => (
            <Link
              key={p.id}
              href={`/juegos?plataforma=${p.slug}`}
              className="gh-card p-4 transition-colors hover:border-accent-500/50"
            >
              <p className="text-sm font-bold text-base-100">{p.name}</p>
              <p className="mt-1 text-[12px] text-base-400">
                Ver todos los juegos de {p.shortName}
              </p>
            </Link>
          ))}
          <Link
            href="/juegos?plataforma=ps4,ps5"
            className="gh-card p-4 transition-colors hover:border-accent-500/50"
          >
            <p className="text-sm font-bold text-base-100">PS4 + PS5</p>
            <p className="mt-1 text-[12px] text-base-400">Juegos disponibles en ambas plataformas</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
