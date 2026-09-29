import Link from "next/link";
import { GameCover } from "@/components/ui/GameCover";
import { DataStatusBadge, Chip, DifficultyBar } from "@/components/ui/primitives";
import { formatHours, formatScore } from "@/lib/utils";
import { IconClock, IconTrophy, IconCalendar } from "@/components/ui/Icon";

type Game = any;

export function GameHero({ game }: { game: Game }) {
  const profile = game.profile;
  const difficulty = game.difficulties.find((d: any) => d.kind === "platinum");
  const platformShort = game.platforms.map((p: any) => p.platform.shortName);
  const genres = game.categories.slice(0, 3).map((c: any) => c.name);

  return (
    <header className="relative overflow-hidden border-b border-base-700/60">
      {/* Fondo */}
      <div className="absolute inset-0" aria-hidden="true">
        <GameCover
          src={game.heroImage ?? game.coverImage}
          alt=""
          slug={game.slug}
          title={game.title}
          accentColor={game.accentColor}
          className="h-full w-full"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-base-900 via-base-900/85 to-base-900/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-base-950/80 to-transparent" />
      </div>

      <div className="gh-container relative py-8 sm:py-12">
        <nav aria-label="Migas de pan" className="mb-5 text-xs text-base-400">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-accent-300">
                Inicio
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/juegos" className="hover:text-accent-300">
                Juegos
              </Link>
            </li>
            {genres[0] && (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link
                    href={`/categorias/${game.categories[0].slug}`}
                    className="hover:text-accent-300"
                  >
                    {genres[0]}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden="true">/</li>
            <li className="text-base-200">{game.title}</li>
          </ol>
        </nav>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Portada */}
          <div className="relative w-32 shrink-0 overflow-hidden rounded-xl border border-base-700 shadow-2xl sm:w-44">
            <GameCover
              src={game.coverImage}
              alt={`Portada de ${game.title}`}
              slug={game.slug}
              title={game.title}
              accentColor={game.accentColor}
              className="aspect-[3/4] w-full"
              priority
              sizes="176px"
            />
          </div>

          {/* Datos */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {platformShort.map((p: string) => (
                <Chip key={p} className="border-accent-500/30 bg-accent-500/10 text-accent-300">
                  {p}
                </Chip>
              ))}
              <DataStatusBadge status={game.data_status} />
              {game.is_recommended && (
                <Chip className="border-brand-500/30 bg-brand-500/10 text-brand-400">
                  Recomendado
                </Chip>
              )}
            </div>

            <h1 className="mt-2.5 text-2xl font-black leading-tight tracking-tight text-base-100 sm:text-4xl">
              {game.title}
            </h1>
            {game.tagline && (
              <p className="mt-1 text-sm text-base-300 sm:text-base">{game.tagline}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-base-400">
              <span className="flex items-center gap-1.5">
                <IconCalendar size={14} />
                {game.releaseDate
                  ? new Intl.DateTimeFormat("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).format(new Date(game.releaseDate))
                  : "Fecha por confirmar"}
              </span>
              <span className="flex items-center gap-1.5">
                <IconTrophy size={14} />
                {profile?.total_trophies ?? "—"} trofeos
              </span>
              <span className="flex items-center gap-1.5">
                <IconClock size={14} />
                {formatHours(profile?.estimated_hours_min, profile?.estimated_hours_max)}
              </span>
            </div>

            {/* Dificultad del platino */}
            {difficulty && (
              <div className="mt-5 max-w-sm rounded-xl border border-base-700 bg-base-850/80 p-3.5 backdrop-blur-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-base-400">
                    Dificultad del Platino
                  </span>
                  <span className="font-mono text-lg font-black text-base-100">
                    {formatScore(difficulty.score)}
                  </span>
                </div>
                <div className="mt-2">
                  <DifficultyBar score={difficulty.score} showValue={false} />
                </div>
                {difficulty.note && (
                  <p className="mt-2 text-[11px] leading-relaxed text-base-400">
                    {difficulty.note}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
