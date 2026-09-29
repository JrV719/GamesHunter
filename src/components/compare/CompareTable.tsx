import Link from "next/link";
import { cn, formatHours, formatDate, yesNo } from "@/lib/utils";
import { TIME_KIND_LABELS, DIFFICULTY_KIND_LABELS, type TimeKind, type DifficultyKind } from "@/lib/constants";
import { GameCover } from "@/components/ui/GameCover";
import {
  DifficultyBar,
  DataStatusBadge,
  difficultyTextColor,
  Chip,
} from "@/components/ui/primitives";
import { IconInfo, IconExternal, IconScale } from "@/components/ui/Icon";

type Game = any;

/** Fila de la tabla comparativa. */
function Row({
  label,
  hint,
  children,
  highlight = false,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <tr className="border-b border-base-700/60 last:border-0">
      <th
        scope="row"
        className="sticky left-0 z-10 w-40 min-w-40 bg-base-800 px-3 py-2.5 align-top text-left sm:w-48"
      >
        <span className="flex flex-col">
          <span className="text-xs font-semibold text-base-200">{label}</span>
          {hint && <span className="text-[10px] leading-tight text-base-500">{hint}</span>}
        </span>
      </th>
      {children}
    </tr>
  );
}

function Cell({
  children,
  accent = false,
  mono = false,
}: {
  children: React.ReactNode;
  accent?: boolean;
  mono?: boolean;
}) {
  return (
    <td
      className={cn(
        "px-3 py-2.5 align-top text-[13px]",
        mono && "font-mono tabular-nums",
        accent ? "font-bold text-accent-300" : "text-base-200",
      )}
    >
      {children}
    </td>
  );
}

export function CompareTable({ games }: { games: Game[] }) {
  const timeKinds = Array.from(
    new Set(games.flatMap((g) => (g.times ?? []).map((t: any) => t.kind))),
  ) as string[];
  const diffKinds = Array.from(
    new Set(games.flatMap((g) => (g.difficulties ?? []).map((d: any) => d.kind))),
  ) as string[];

  const getTime = (g: Game, kind: string) => (g.times ?? []).find((t: any) => t.kind === kind);
  const getDiff = (g: Game, kind: string) =>
    (g.difficulties ?? []).find((d: any) => d.kind === kind);
  const getList = (g: Game) => g.trophyLists?.[0] ?? null;

  return (
    <div className="mt-6">
      <div className="gh-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-base-700 px-4 py-3">
          <IconScale size={16} className="text-accent-400" />
          <h2 className="text-sm font-bold text-base-100">Comparativa</h2>
          <span className="ml-auto text-[11px] text-base-500">
            {games.length} {games.length === 1 ? "juego" : "juegos"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] border-collapse text-left">
            <caption className="sr-only">
              Comparativa de dificultad, tiempos y tipo de platino entre los juegos seleccionados
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-10 w-40 min-w-40 bg-base-800 px-3 py-3 sm:w-48"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-base-500">
                    Característica
                  </span>
                </th>
                {games.map((g) => (
                  <th key={g.id} scope="col" className="min-w-44 px-3 py-3 align-top">
                    <Link href={`/juegos/${g.slug}`} className="group block">
                      <div className="relative h-24 w-full overflow-hidden rounded-lg">
                        <GameCover
                          src={g.coverImage}
                          alt=""
                          slug={g.slug}
                          title={g.title}
                          accentColor={g.accent_color ?? g.accentColor}
                          className="h-full w-full"
                          sizes="176px"
                        />
                      </div>
                      <p className="mt-2 text-[13px] font-bold leading-snug text-base-100 transition-colors group-hover:text-accent-300">
                        {g.title}
                      </p>
                    </Link>
                    <p className="mt-0.5 text-[10px] text-base-500">{g.developerName}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(g.platforms ?? []).map((p: any) => (
                        <Chip
                          key={p.slug}
                          className="border-base-700 bg-base-850 text-[10px] text-base-400"
                        >
                          {p.shortName}
                        </Chip>
                      ))}
                      <DataStatusBadge
                        status={g.dataStatus ?? g.data_status}
                        withTooltip={false}
                        className="text-[10px]"
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Dificultad del platino */}
              <Row label="Dificultad del Platino" hint="1-10 · esfuerzo de la lista">
                {games.map((g) => {
                  const d = getDiff(g, "platinum");
                  return (
                    <Cell key={g.id} mono>
                      {d ? (
                        <span className={cn("text-base", difficultyTextColor(d.score))}>
                          {d.score}/10
                        </span>
                      ) : (
                        "—"
                      )}
                      {d && (
                        <div className="mt-1.5 w-24">
                          <DifficultyBar score={d.score} showValue={false} />
                        </div>
                      )}
                    </Cell>
                  );
                })}
              </Row>

              {/* Grindeo */}
              <Row label="Grindeo" hint="1-10">
                {games.map((g) => (
                  <Cell key={g.id} mono>
                    {g.profile?.grindRating ? `${g.profile.grindRating}/10` : "—"}
                  </Cell>
                ))}
              </Row>

              {/* Tiempos */}
              {timeKinds.map((kind) => (
                <Row
                  key={kind}
                  label={TIME_KIND_LABELS[kind as TimeKind] ?? kind}
                  hint={kind === "platinum" ? "objetivo principal" : undefined}
                >
                  {games.map((g) => {
                    const t = getTime(g, kind);
                    return (
                      <Cell key={g.id} mono accent={kind === "platinum"}>
                        {t ? formatHours(t.minHours, t.maxHours) : "—"}
                      </Cell>
                    );
                  })}
                </Row>
              ))}

              {/* Trofeos */}
              <Row label="Trofeos en total">
                {games.map((g) => (
                  <Cell key={g.id} mono>
                    {g.profile?.totalTrophies ?? "—"}
                  </Cell>
                ))}
              </Row>
              <Row label="Platino / Oro / Plata / Bronce">
                {games.map((g) => (
                  <Cell key={g.id} mono>
                    {g.profile
                      ? `${g.profile.platinumCount} / ${g.profile.goldCount} / ${g.profile.silverCount} / ${g.profile.bronzeCount}`
                      : "—"}
                  </Cell>
                ))}
              </Row>
              <Row label="Trofeos documentados" hint="de los que consta en la ficha">
                {games.map((g) => {
                  const l = getList(g);
                  return (
                    <Cell key={g.id} mono>
                      {l ? `${l.totalCount} (${l.completeness})` : "—"}
                    </Cell>
                  );
                })}
              </Row>

              {/* Flags */}
              <Row label="Trofeos perdibles">
                {games.map((g) => (
                  <Cell key={g.id}>
                    <YesNo value={g.profile?.hasMissables} />
                  </Cell>
                ))}
              </Row>
              <Row label="Trofeos online">
                {games.map((g) => (
                  <Cell key={g.id}>
                    <YesNo value={g.profile?.hasOnline} />
                  </Cell>
                ))}
              </Row>
              <Row label="Atados a una dificultad">
                {games.map((g) => (
                  <Cell key={g.id}>
                    <YesNo value={g.profile?.difficultyLinked} />
                  </Cell>
                ))}
              </Row>
              <Row label="Requiere máxima dificultad">
                {games.map((g) => (
                  <Cell key={g.id}>
                    <YesNo value={g.profile?.requiresMaxDifficulty} />
                  </Cell>
                ))}
              </Row>
              <Row label="Requiere DLC">
                {games.map((g) => (
                  <Cell key={g.id}>
                    <YesNo value={g.profile?.requiresDLC} />
                  </Cell>
                ))}
              </Row>
              <Row label="Requiere PS Plus">
                {games.map((g) => (
                  <Cell key={g.id}>
                    <YesNo value={g.profile?.requiresPSPlus} />
                  </Cell>
                ))}
              </Row>
              <Row label="Coleccionables">
                {games.map((g) => (
                  <Cell key={g.id}>
                    <YesNo value={g.profile?.hasCollectibles} />
                  </Cell>
                ))}
              </Row>
              <Row label="Platino tras la historia">
                {games.map((g) => (
                  <Cell key={g.id}>
                    <YesNo value={g.profile?.platinumAfterEnding} />
                  </Cell>
                ))}
              </Row>

              {/* Partidas */}
              <Row label="Partidas necesarias" hint="new game+ o repetir">
                {games.map((g) => {
                  const p = g.profile;
                  if (!p) return <Cell key={g.id}>—</Cell>;
                  return (
                    <Cell key={g.id} mono>
                      {p.playthroughsMin == null
                        ? "—"
                        : p.playthroughsMin === p.playthroughsMax
                          ? `${p.playthroughsMin}`
                          : `${p.playthroughsMin}-${p.playthroughsMax}`}
                    </Cell>
                  );
                })}
              </Row>

              {/* Otras dificultades */}
              {diffKinds
                .filter((k) => k !== "platinum")
                .map((kind) => (
                  <Row
                    key={kind}
                    label={DIFFICULTY_KIND_LABELS[kind as DifficultyKind] ?? kind}
                    hint="dificultad del juego"
                  >
                    {games.map((g) => {
                      const d = getDiff(g, kind);
                      return (
                        <Cell key={g.id} mono>
                          {d ? `${d.score}/10` : "—"}
                        </Cell>
                      );
                    })}
                  </Row>
                ))}

              {/* Extras */}
              <Row label="Plataformas">
                {games.map((g) => (
                  <Cell key={g.id}>
                    <div className="flex flex-wrap gap-1">
                      {(g.platforms ?? []).map((p: any) => (
                        <Chip
                          key={p.slug}
                          className="border-base-700 bg-base-850 text-[10px] text-base-400"
                        >
                          {p.shortName}
                        </Chip>
                      ))}
                    </div>
                  </Cell>
                ))}
              </Row>
              <Row label="Lista de trofeos" hint="compartida o independiente">
                {games.map((g) => (
                  <Cell key={g.id}>
                    <div className="space-y-1">
                      {(g.platformDetails ?? []).map((p: any) => (
                        <p key={p.slug} className="text-[11px] text-base-400">
                          {p.shortName}:{" "}
                          <span className={p.shares ? "text-emerald-300" : "text-amber-300"}>
                            {p.shares ? "compartida" : "independiente"}
                          </span>
                        </p>
                      ))}
                    </div>
                  </Cell>
                ))}
              </Row>
              <Row label="Géneros">
                {games.map((g) => (
                  <Cell key={g.id}>
                    <div className="flex flex-wrap gap-1">
                      {(g.categories ?? []).slice(0, 4).map((c: any) => (
                        <Link
                          key={c.slug}
                          href={`/categorias/${c.slug}`}
                          className="gh-chip border-base-700 bg-base-850 text-[10px] text-base-400 hover:text-accent-300"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  </Cell>
                ))}
              </Row>
              <Row label="Lanzamiento">
                {games.map((g) => (
                  <Cell key={g.id}>
                    {formatDate(g.releaseDate ?? g.release_date)}
                  </Cell>
                ))}
              </Row>
              <Row label="Ficha">
                {games.map((g) => (
                  <Cell key={g.id}>
                    <a
                      href={`/juegos/${g.slug}`}
                      className="gh-link inline-flex items-center gap-1 text-[12px]"
                    >
                      Ver detalle <IconExternal size={11} />
                    </a>
                  </Cell>
                ))}
              </Row>
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-base-500">
        <IconInfo size={13} className="mt-0.5 shrink-0" />
        <span>
          Esta tabla no clasifica ni recomienda: solo juxtapone los datos para que compares. Los
          tiempos y las dificultades son estimaciones con el nivel de confianza indicado en cada
          ficha. En móvil, desplaza la tabla horizontalmente o usa la vista de tarjetas.
        </span>
      </p>
    </div>
  );
}

function YesNo({ value }: { value: boolean | null | undefined }) {
  const v = value === null || value === undefined ? null : Boolean(value);
  return (
    <span
      className={cn(
        "font-semibold",
        v === null ? "text-base-500" : v ? "text-rose-300" : "text-emerald-300",
      )}
    >
      {yesNo(v)}
    </span>
  );
}
