import Link from "next/link";
import { cn, formatHours } from "@/lib/utils";
import { type GameCard as GameCardData } from "@/lib/db-types";
import { GameCover } from "@/components/ui/GameCover";
import { Chip, DataStatusBadge, difficultyColor, difficultyTextColor } from "@/components/ui/primitives";
import { IconAlert, IconClock, IconGlobe, IconTrophy } from "@/components/ui/Icon";

const CHIP_BASE = "border-base-600 bg-base-800/80 text-base-300";

/** Tarjeta de juego usada en home, catálogo, categorías y relacionados. */
export function GameCard({
  game,
  priority = false,
  showStatus = false,
  className,
}: {
  game: GameCardData;
  priority?: boolean;
  showStatus?: boolean;
  className?: string;
}) {
  const difficulty = game.platinumDifficulty;
  const profile = game;
  const platforms = game.platforms.map((p) => p.shortName);
  const primaryCategory =
    game.categories.find((c) => c.isPrimary)?.name ?? game.categories[0]?.name;

  return (
    <article
      className={cn(
        "gh-card group relative flex flex-col overflow-hidden transition-all duration-200",
        "hover:border-accent-500/50 hover:shadow-[0_0_0_1px_rgb(56_189_248/.2),0_18px_40px_-24px_rgb(56_189_248/.45)]",
        className,
      )}
    >
      <Link
        href={`/juegos/${game.slug}`}
        className="absolute inset-0 z-10"
        aria-label={`Ver ficha de ${game.title}`}
      />

      <div className="relative aspect-[3/4] w-full overflow-hidden bg-base-850">
        <GameCover
          src={game.coverImage}
          alt={`Portada de ${game.title}`}
          slug={game.slug}
          title={game.title}
          accentColor={game.accentColor}
          priority={priority}
          className="absolute inset-0 h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
        />

        {/* Dificultad del Platino */}
        {difficulty != null && (
          <div className="absolute left-0 top-0 z-20 flex items-center gap-1.5 rounded-br-xl bg-base-950/85 px-2.5 py-1.5 backdrop-blur-sm">
            <span
              className={cn(
                "font-mono text-base font-black leading-none tabular-nums",
                difficultyTextColor(difficulty),
              )}
            >
              {difficulty}
            </span>
            <span className="text-[10px] font-bold uppercase leading-none tracking-wide text-base-400">
              /10
            </span>
          </div>
        )}

        {showStatus && (
          <div className="absolute right-0 top-0 z-20">
            <DataStatusBadge status={game.dataStatus} className="rounded-br-none rounded-tl-lg" />
          </div>
        )}

        {/* Flags de atención */}
        {(profile?.hasMissables || profile?.hasOnline) && (
          <div className="absolute bottom-1.5 right-1.5 z-20 flex gap-1">
            {profile.hasMissables && (
              <span
                className="rounded-md bg-rose-500/20 p-1 text-rose-300 backdrop-blur-sm"
                title="Tiene trofeos perdibles"
              >
                <IconAlert size={13} />
              </span>
            )}
            {profile.hasOnline && (
              <span
                className="rounded-md bg-accent-500/20 p-1 text-accent-300 backdrop-blur-sm"
                title="Tiene trofeos online"
              >
                <IconGlobe size={13} />
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-[15px] font-bold leading-snug tracking-tight text-base-100 transition-colors group-hover:text-accent-300">
            {game.title}
          </h3>
          <p className="mt-0.5 truncate text-xs text-base-400">{game.developerName}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {platforms.map((p) => (
            <Chip key={p} className={CHIP_BASE}>
              {p}
            </Chip>
          ))}
          {primaryCategory && (
            <Chip className="border-brand-500/30 bg-brand-500/10 text-brand-400">
              {primaryCategory}
            </Chip>
          )}
        </div>

        <div className="mt-auto space-y-1.5 border-t border-base-700/70 pt-2.5">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="flex items-center gap-1 text-base-400">
              <IconClock size={12} /> Platino
            </span>
            <span
              className={cn("font-mono text-sm font-semibold tabular-nums text-base-200")}
            >
              {formatHours(profile?.hoursMin, profile?.hoursMax)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="flex items-center gap-1 text-base-400">
              <IconTrophy size={12} /> Trofeos
            </span>
            <span className="font-mono font-semibold tabular-nums text-base-200">
              {profile?.totalTrophies ?? "—"}
            </span>          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-base-700">
            <div
              className={cn("h-full rounded-full", difficultyColor(difficulty ?? 5))}
              style={{ width: `${((difficulty ?? 5) / 10) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

export function GameCardSkeleton() {
  return (
    <div className="gh-card overflow-hidden">
      <div className="aspect-[3/4] w-full animate-pulse bg-base-750" />
      <div className="space-y-2 p-3.5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-base-750" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-base-750" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-base-750" />
      </div>
    </div>
  );
}

export function GameGrid({
  games,
  priorityCount = 0,
  showStatus = false,
  emptyState,
}: {
  games: GameCardData[];
  priorityCount?: number;
  showStatus?: boolean;
  emptyState?: React.ReactNode;
}) {
  if (games.length === 0) {
    return <>{emptyState}</>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {games.map((g, i) => (
        <GameCard
          key={g.id}
          game={g}
          priority={i < priorityCount}
          showStatus={showStatus}
        />
      ))}
    </div>
  );
}
