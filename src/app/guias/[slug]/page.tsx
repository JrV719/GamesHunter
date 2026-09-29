import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getGuideBySlug } from "@/lib/queries/guides";
import { getAllGameSlugs } from "@/lib/queries/games";
import { GameCover } from "@/components/ui/GameCover";
import { Chip, DataStatusBadge, Alert } from "@/components/ui/primitives";
import { GUIDE_KIND_LABELS, type GuideKind } from "@/lib/constants";
import { IconArrowRight, IconAlert, IconBook, IconExternal, IconTrophy } from "@/components/ui/Icon";
import { formatDate } from "@/lib/utils";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getAllGameSlugs();
  return slugs.map((s) => ({ slug: `platino-${s.slug}` }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);
  if (!guide) return { title: "Guía no encontrada" };
  return {
    title: guide.title,
    description: guide.summary,
    alternates: { canonical: `/guias/${guide.slug}` },
    openGraph: { type: "article", title: guide.title, description: guide.summary },
  };
}

export default async function GuidePage({ params }: Params) {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);
  if (!guide) notFound();

  const steps: any[] = guide.steps ?? [];

  return (
    <div className="gh-container py-8">
      <nav aria-label="Migas de pan" className="mb-4 text-xs text-base-400">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-accent-300">
              Inicio
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/guias" className="hover:text-accent-300">
              Guías
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="truncate text-base-200">{guide.title}</li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <article className="min-w-0">
          <header className="mb-6">
            <div className="flex flex-wrap items-center gap-1.5">
              <Chip className="border-accent-500/30 bg-accent-500/10 text-accent-300">
                <IconBook size={11} />
                {GUIDE_KIND_LABELS[(guide.kind as GuideKind) ?? "platino"]}
              </Chip>
              <DataStatusBadge status={guide.dataStatus} />
              {guide.gameSlug && (
                <Link
                  href={`/juegos/${guide.gameSlug}`}
                  className="gh-chip border-base-700 bg-base-850 text-base-300 hover:border-accent-500/40 hover:text-accent-300"
                >
                  <IconTrophy size={11} />
                  {guide.gameTitle}
                </Link>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-black leading-tight tracking-tight text-base-100 sm:text-3xl">
              {guide.title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-base-300">{guide.summary}</p>
            <p className="mt-3 text-[11px] text-base-500">
              {guide.readingTime} min de lectura
              {guide.publishedAt && ` · publicada el ${formatDate(guide.publishedAt)}`}
              {guide.updatedAt && ` · actualizada el ${formatDate(guide.updatedAt)}`}
              {guide.authorDisplayName && ` · por ${guide.authorDisplayName}`}
            </p>
          </header>

          <Alert tone="info" title="Sobre esta guía" className="mb-6">
            <p>
              Texto propio de GamesHunter. Resumimos la información publicada por las fuentes
              enlazadas al final de la página y no reproducimos sus artículos. Si un dato no cuadra
              con tu experiencia, consulta siempre la fuente original.
            </p>
          </Alert>

          {steps.length > 0 && (
            <section aria-labelledby="pasos">
              <h2 id="pasos" className="gh-section-title mb-3">
                Pasos
              </h2>
              <ol className="space-y-3">
                {steps.map((s) => (
                  <li key={s.id} className="gh-card p-4 sm:p-5">
                    <div className="flex gap-3.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-600/20 font-mono text-sm font-black text-accent-300">
                        {s.stepNumber}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold leading-snug text-base-100">
                          Paso {s.stepNumber} — {s.title}
                        </h3>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-base-300">
                          {s.body}
                        </p>
                        {s.warning && (
                          <p className="mt-2.5 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/[0.07] px-3 py-2 text-[12px] leading-relaxed text-rose-200">
                            <IconAlert size={14} className="mt-0.5 shrink-0" />
                            {s.warning}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Fuentes */}
          {guide.sources?.length > 0 && (
            <section aria-labelledby="fuentes" className="mt-10">
              <h2 id="fuentes" className="gh-section-title mb-3">
                Fuentes de esta guía
              </h2>
              <ul className="space-y-2">
                {guide.sources.map((s: any) => (
                  <li key={s.id} className="gh-card p-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="gh-link inline-flex items-center gap-1 text-sm font-semibold"
                      >
                        {s.sourceName} <IconExternal size={12} />
                      </a>
                      <Chip className="border-base-700 bg-base-850 text-base-400">
                        confianza: {s.confidence}
                      </Chip>
                      {s.scope && <span className="text-[11px] text-base-500">{s.scope}</span>}
                      {s.lastUpdated && (
                        <span className="text-[11px] text-base-500">
                          · {formatDate(s.lastUpdated)}
                        </span>
                      )}
                    </div>
                    {s.sourceNotes && (
                      <p className="mt-1.5 text-[11px] leading-relaxed text-base-500">
                        {s.sourceNotes}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>

        {/* Lateral */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {guide.gameSlug && (
            <div className="gh-card overflow-hidden">
              <Link href={`/juegos/${guide.gameSlug}`} className="group block">
                <div className="relative aspect-[3/4] w-full">
                  <GameCover
                    src={guide.gameCoverImage}
                    alt=""
                    slug={guide.gameSlug}
                    title={guide.gameTitle ?? ""}
                    accentColor={guide.gameAccentColor ?? "#38bdf8"}
                    className="h-full w-full"
                    sizes="288px"
                  />
                </div>
                <div className="p-3.5">
                  <p className="text-sm font-bold text-base-100 group-hover:text-accent-300">
                    {guide.gameTitle}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-accent-300">
                    Ver ficha completa <IconArrowRight size={11} />
                  </p>
                </div>
              </Link>
            </div>
          )}
          <Link href="/guias" className="gh-btn gh-btn-ghost w-full text-xs">
            <IconBook size={14} /> Todas las guías
          </Link>
        </aside>
      </div>
    </div>
  );
}
