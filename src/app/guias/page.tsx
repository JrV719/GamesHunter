import type { Metadata } from "next";
import Link from "next/link";
import { listGuides } from "@/lib/queries/guides";
import { GUIDE_KIND_LABELS, type GuideKind } from "@/lib/constants";
import { GameCover } from "@/components/ui/GameCover";
import { Chip, DataStatusBadge, EmptyState } from "@/components/ui/primitives";
import { IconBook, IconArrowRight } from "@/components/ui/Icon";
import { toNum } from "@/lib/url-params";

export const metadata: Metadata = {
  title: "Guías de platino y de trofeos",
  description:
    "Guías de platino escritas con texto propio para PS4 y PS5, con los pasos ordenados, el momento recomendado para cada trofeo y los avisos de perdibles y online.",
  alternates: { canonical: "/guias" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function GuidesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const page = Math.max(1, toNum(sp.pagina) ?? 1);
  const { guides, total, totalPages } = await listGuides({ page, limit: 12 });

  return (
    <div className="gh-container py-8">
      <header className="mb-8 max-w-3xl">
        <h1 className="text-2xl font-black tracking-tight text-base-100 sm:text-3xl">Guías</h1>
        <p className="mt-2 text-sm leading-relaxed text-base-400">
          Guías de platino ordenadas por pasos. Están escritas con nuestro propio lenguaje a partir
          de la bibliografía sobre cada juego y enlazan a la fuente original para que puedas
          contrastar cualquier dato.
        </p>
      </header>

      {total === 0 ? (
        <EmptyState
          title="Todavía no hay guías"
          description="Se publicarán en cuanto se documente la primera lista de trofeos."
          icon={<IconBook size={22} />}
        />
      ) : (
        <>
          <p className="mb-4 text-xs text-base-500">
            {total} {total === 1 ? "guía" : "guías"} publicada{total > 1 ? "s" : ""}
          </p>

          <ul className="grid gap-3 md:grid-cols-2">
            {guides.map((g: any) => (
              <li key={g.id}>
                <Link
                  href={`/guias/${g.slug}`}
                  className="gh-card group flex h-full gap-4 p-4 transition-colors hover:border-accent-500/50"
                >
                  {g.gameSlug ? (
                    <div className="relative hidden h-28 w-20 shrink-0 overflow-hidden rounded-lg sm:block">
                      <GameCover
                        src={g.gameCoverImage}
                        alt=""
                        slug={g.gameSlug}
                        title={g.gameTitle ?? ""}
                        accentColor={g.gameAccentColor ?? "#38bdf8"}
                        className="h-full w-full"
                        sizes="80px"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Chip className="border-accent-500/30 bg-accent-500/10 text-accent-300">
                        {GUIDE_KIND_LABELS[(g.kind as GuideKind) ?? "platino"]}
                      </Chip>
                      <DataStatusBadge status={g.dataStatus} withTooltip={false} />
                      {g.stepCount > 0 && (
                        <Chip className="border-base-700 bg-base-850 text-base-400">
                          {g.stepCount} pasos
                        </Chip>
                      )}
                    </div>
                    <h2 className="mt-2 text-[15px] font-bold leading-snug text-base-100 transition-colors group-hover:text-accent-300">
                      {g.title}
                    </h2>
                    {g.gameTitle && (
                      <p className="mt-0.5 text-[11px] font-semibold text-base-500">
                        {g.gameTitle}
                      </p>
                    )}
                    <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-base-400">
                      {g.summary}
                    </p>
                    <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-accent-300">
                      Leer guía <IconArrowRight size={11} />
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav className="mt-8 flex justify-center gap-1" aria-label="Paginación de guías">
              {Array.from({ length: totalPages }).map((_, i) => (
                <Link
                  key={i}
                  href={`/guias?pagina=${i + 1}`}
                  aria-current={i + 1 === page ? "page" : undefined}
                  className={`grid h-8 w-8 place-items-center rounded-lg font-mono text-xs font-semibold ${
                    i + 1 === page
                      ? "bg-accent-600 text-white"
                      : "text-base-400 hover:bg-base-800"
                  }`}
                >
                  {i + 1}
                </Link>
              ))}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
