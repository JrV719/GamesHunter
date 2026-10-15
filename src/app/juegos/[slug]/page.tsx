import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getGameDetail, getRelatedGames } from "@/lib/queries/games";
import { GameHero } from "@/components/game/GameHero";
import { PlatinumSummary } from "@/components/game/PlatinumSummary";
import { DifficultySection } from "@/components/game/DifficultySection";
import { TimesSection } from "@/components/game/TimesSection";
import { TrophySection } from "@/components/game/TrophySection";
import { GuideSection } from "@/components/game/GuideSection";
import { SourcesSection } from "@/components/game/SourcesSection";
import { GameCard } from "@/components/game/GameCard";
import { SectionHeading, Alert, Chip } from "@/components/ui/primitives";
import { IconAlert, IconGlobe, IconRepeat, IconTarget, IconArrowRight } from "@/components/ui/Icon";
import { getCurrentUser } from "@/lib/auth";
import { GameUserActions } from "@/components/game/GameUserActions";
import { CommunitySection } from "@/components/game/CommunitySection";
import { isStaff } from "@/lib/permissions";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const { getAllGameSlugs } = await import("@/lib/queries/games");
  const rows = await getAllGameSlugs();
  return rows.map((r: any) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameDetail(slug);
  if (!game) return { title: "Juego no encontrado" };

  const difficulty = game.difficulties.find((d: any) => d.kind === "platinum")?.score;
  const profile = game.profile as any;
  const platforms = game.platforms.map((p: any) => p.platform.shortName).join(" / ");

  const title = `${game.title} — Trofeos, dificultad del Platino y guía`;
  const description = [
    `${game.title} para ${platforms}.`,
    difficulty ? `Dificultad del Platino ${difficulty}/10.` : "",
    profile?.estimatedHoursMin
      ? `Tiempo estimado ${profile.estimatedHoursMin}-${profile.estimatedHoursMax ?? profile.estimatedHoursMin} h.`
      : "",
    profile?.totalTrophies ? `${profile.totalTrophies} trofeos.` : "",
    profile?.hasMissables ? "Tiene trofeos perdibles." : "Sin trofeos perdibles.",
    profile?.hasOnline ? "Incluye trofeos online." : "Sin trofeos online.",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    title,
    description,
    alternates: { canonical: `/juegos/${game.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/juegos/${game.slug}`,
    },
  };
}

/** Datos estructurados: VideoGame + FAQPage. */
function JsonLd({ game }: { game: Awaited<ReturnType<typeof getGameDetail>> }) {
  if (!game) return null;
  const profile = game.profile as any;
  const difficulty = game.difficulties.find((d: any) => d.kind === "platinum")?.score ?? 5;
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/juegos/${game.slug}`;

  const videoGame = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.title,
    description: game.summary,
    url,
    image: game.coverImage ? `${process.env.NEXT_PUBLIC_SITE_URL}${game.coverImage}` : undefined,
    datePublished: game.releaseDate ?? undefined,
    genre: (game.categories as any[]).map((c: any) => c.name),
    gamePlatform: game.platforms.map((p: any) => p.platform.name),
    author: { "@type": "Organization", name: game.developer?.name ?? "Desconocido" },
    publisher: game.publisher ? { "@type": "Organization", name: game.publisher.name } : undefined,
    numberOfAchievements: profile?.totalTrophies ?? undefined,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: difficulty,
      bestRating: 10,
      worstRating: 1,
    },
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `¿Cuál es la dificultad del platino de ${game.title}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `La dificultad estimada del platino es ${difficulty} de 10, según las guías públicas de la comunidad.`,
        },
      },
      {
        "@type": "Question",
        name: `¿Cuántas horas se necesitan para el platino de ${game.title}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text:
            profile?.estimatedHoursMin != null
              ? `Se estiman entre ${profile.estimatedHoursMin} y ${profile.estimatedHoursMax ?? profile.estimatedHoursMin} horas. Es una estimación y varía según el jugador.`
              : "Todavía no hay un tiempo estimado contrastado.",
        },
      },
      {
        "@type": "Question",
        name: `¿${game.title} tiene trofeos perdibles?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: profile?.hasMissables
            ? "Sí. La ficha indica cuáles son y cómo evitarlos."
            : "No se han identificado trofeos que se puedan perder de forma permanente.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoGame) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
    </>
  );
}

export default async function GamePage({ params }: Params) {
  const { slug } = await params;
  // El detalle es un agregado de varias tablas; se tipa como registro laxo a
  // propósito para que los componentes puedan leer directamente lo projected.
  const game = (await getGameDetail(slug)) as any;
  if (!game) notFound();

  // Nota: no se incrementan vistas aqui a proposito. La ficha se prerenderiza
  // (SSG) y escribir en la base de datos durante el build bloquearia SQLite.
  // Para contar visitas de verdad, hazlo desde middleware o con un endpoint.
  const profile = game.profile as any;
  const difficulty = game.difficulties.find((d: any) => d.kind === "platinum")?.score ?? null;
  const related = await getRelatedGames(
    game.id,
    (game.categories as any[]).map((c: any) => c.slug),
    difficulty,
  );
  const user = await getCurrentUser();

  return (
    <article className="pb-16">
      <JsonLd game={game} />

      <GameHero game={game} />

      {/* Avisos destacados */}
      {(profile?.hasMissables || profile?.hasOnline || profile?.difficultyLinked) && (
        <div className="gh-container -mt-8 relative z-10">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {profile?.hasMissables && (
              <Alert tone="danger" title="TROFEO PERDIBLE" icon={<IconAlert size={18} />}>
                <p>
                  Este juego tiene trofeos que se pueden perder si no los consigues a tiempo. Lee el
                  apartado de{" "}
                  <Link href="#trofeos" className="underline">
                    trofeos
                  </Link>{" "}
                  antes de empezar la historia.
                </p>
                {profile.missableTrophies && (
                  <p className="mt-1.5 opacity-80">{profile.missableTrophies}</p>
                )}
              </Alert>
            )}
            {profile?.hasOnline && (
              <Alert tone="info" title="TROFEO ONLINE" icon={<IconGlobe size={18} />}>
                {profile.onlineTrophies ?? "Hay trofeos con componente online."}
              </Alert>
            )}
            {profile?.difficultyLinked && (
              <Alert tone="warn" title="DIFICULTAD" icon={<IconTarget size={18} />}>
                Hay trofeos atados a una dificultad concreta. Hazlos al final, cuando domines el
                combate.
              </Alert>
            )}
            {(profile?.playthroughsMax ?? 1) > 1 && (
              <Alert tone="warn" title="MÚLTIPLES PARTIDAS" icon={<IconRepeat size={18} />}>
                Se necesitan entre {profile.playthroughsMin ?? 1} y {profile.playthroughsMax}{" "}
                partidas para completar la lista.
              </Alert>
            )}
          </div>
        </div>
      )}

      <div className="gh-container mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Columna principal */}
        <div className="min-w-0 space-y-8">
          <PlatinumSummary game={game} />
          <DifficultySection difficulties={game.difficulties} />
          <TimesSection times={game.times} />
          <TrophySection
            entries={game.trophyLists?.[0]?.entries ?? []}
            totalCount={game.trophyLists?.[0]?.totalCount ?? 0}
            completeness={game.trophyLists?.[0]?.completeness ?? "parcial"}
            notes={game.trophyLists?.[0]?.notes}
            listName={game.trophyLists?.[0]?.name ?? "Lista de trofeos"}
          />
          <GuideSection game={game} />
          <SourcesSection game={game} />
          <CommunitySection
            gameId={game.id}
            gameSlug={game.slug}
            gameTitle={game.title}
            user={user}
            viewerIsStaff={isStaff(user)}
          />
        </div>

        {/* Columna lateral */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <GameUserActions gameId={game.id} isLoggedIn={Boolean(user)} />
          <div className="gh-card p-4">
            <p className="gh-label">Ficha rápida</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-base-400">Lanzamiento</dt>
                <dd className="text-right font-medium">
                  {game.releaseDate
                    ? new Intl.DateTimeFormat("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(game.releaseDate))
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-base-400">Desarrolladora</dt>
                <dd className="text-right font-medium">{game.developer?.name ?? "—"}</dd>
              </div>
              {game.publisher && (
                <div className="flex justify-between gap-3">
                  <dt className="text-base-400">Editora</dt>
                  <dd className="text-right font-medium">{game.publisher.name}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-base-400">Trofeos</dt>
                <dd className="text-right font-medium">{profile?.totalTrophies ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-base-400">Platino</dt>
                <dd className="text-right font-medium">{profile?.platinumCount ?? 1}</dd>
              </div>
            </dl>
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-base-700 pt-3">
              {game.platforms.map((p: any) => (
                <Chip key={p.platformId} className="border-accent-500/30 bg-accent-500/10 text-accent-300">
                  {p.platform.shortName}
                </Chip>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-base-500">
              Estado del dato:{" "}
              <span className="font-semibold text-base-300">
                {game.dataStatus === "verified"
                  ? "verificado"
                  : game.dataStatus === "demo"
                    ? "demo"
                    : "provisional"}
              </span>
              . Última actualización:{" "}
              {new Intl.DateTimeFormat("es-ES").format(new Date(game.updatedAt))}.
            </p>
          </div>

          {profile?.quickSummary && (
            <div className="gh-card p-4">
              <p className="gh-label">Resumen rápido</p>
              <p className="text-[13px] leading-relaxed text-base-300">{profile.quickSummary}</p>
            </div>
          )}

          {game.officialUrl && (
            <a
              href={game.officialUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="gh-btn gh-btn-ghost w-full text-xs"
            >
              Ver ficha oficial ↗
            </a>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="gh-container mt-16">
          <SectionHeading
            title="Juegos relacionados"
            description="Misma categoría y dificultad parecida."
            href="/juegos"
            hrefLabel="Ver catálogo"
          />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
            {related.map((g: any) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <Link href={`/comparar?juegos=${[game.slug, ...related.slice(0, 2).map((r: any) => r.slug)].join(",")}`} className="gh-btn gh-btn-ghost text-xs">
              Comparar con otros juegos <IconArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}
    </article>
  );
}
