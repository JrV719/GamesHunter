"use client";

import { useMemo, useState } from "react";
import { cn, formatScore } from "@/lib/utils";
import {
  TROPHY_TYPE_LABELS,
  TROPHY_TYPE_COLORS,
  TROPHY_TYPE_ORDER,
  type TrophyType,
} from "@/lib/constants";
import { TrophyIcon, IconAlert, IconGlobe, IconStar, IconInfo, IconFilter } from "@/components/ui/Icon";
import { Chip, EmptyState, DataStatusBadge, difficultyTextColor } from "@/components/ui/primitives";

export type TrophyEntry = {
  id: string;
  sortOrder: number;
  howTo: string;
  difficulty: number;
  isMissable: boolean;
  isOnline: boolean;
  recommendedStage: string;
  requiresDifficulty: string | null;
  isDLC: boolean;
  isUnobtainable: boolean;
  note: string | null;
  trophyName: string;
  trophyType: TrophyType;
  trophyIconUrl: string | null;
  trophyOfficialDescription: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
};

type Filter = "todos" | TrophyType | "missable" | "online" | "dificil";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "platinum", label: "Platino" },
  { id: "gold", label: "Oro" },
  { id: "silver", label: "Plata" },
  { id: "bronze", label: "Bronce" },
  { id: "missable", label: "Perdibles" },
  { id: "online", label: "Online" },
  { id: "dificil", label: "Difíciles (7+)" },
];

export function TrophySection({
  entries,
  totalCount,
  completeness,
  notes,
  listName,
}: {
  entries: TrophyEntry[];
  totalCount: number;
  completeness: string;
  notes?: string | null;
  listName: string;
}) {
  const [filter, setFilter] = useState<Filter>("todos");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = [...entries].sort(
      (a, b) =>
        TROPHY_TYPE_ORDER[a.trophyType] - TROPHY_TYPE_ORDER[b.trophyType] ||
        b.difficulty - a.difficulty ||
        a.sortOrder - b.sortOrder,
    );
    switch (filter) {
      case "todos":
        return list;
      case "missable":
        return list.filter((e) => e.isMissable);
      case "online":
        return list.filter((e) => e.isOnline);
      case "dificil":
        return list.filter((e) => e.difficulty >= 7);
      default:
        return list.filter((e) => e.trophyType === filter);
    }
  }, [entries, filter]);

  const counts = useMemo(
    () => ({
      platinum: entries.filter((e) => e.trophyType === "platinum").length,
      gold: entries.filter((e) => e.trophyType === "gold").length,
      silver: entries.filter((e) => e.trophyType === "silver").length,
      bronze: entries.filter((e) => e.trophyType === "bronze").length,
      missable: entries.filter((e) => e.isMissable).length,
      online: entries.filter((e) => e.isOnline).length,
    }),
    [entries],
  );

  const documented = entries.length;
  const pending = Math.max(0, (totalCount || documented) - documented);

  return (
    <section aria-labelledby="trofeos">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="trofeos" className="gh-section-title flex items-center gap-2">
            <IconFilter size={16} className="text-accent-400" />
            Lista de trofeos
          </h2>
          <p className="mt-0.5 text-xs text-base-400">
            {listName} · {documented} de {totalCount || documented} documentados
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(TROPHY_TYPE_LABELS) as TrophyType[]).map((t) => (
            <Chip key={t} className={TROPHY_TYPE_COLORS[t]} title={`${counts[t]} documentados`}>
              {TROPHY_TYPE_LABELS[t]} {counts[t]}
            </Chip>
          ))}
        </div>
      </div>

      {(completeness !== "completa" || pending > 0 || notes) && (
        <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-3.5 text-[13px] leading-relaxed text-amber-200">
          <IconInfo size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">
              Lista {completeness === "completa" ? "completa" : "parcial"}
              {pending > 0 && ` · faltan ${pending} trofeos por documentar`}
            </p>
            {notes && <p className="mt-1 opacity-90">{notes}</p>}
            <p className="mt-1 opacity-70">
              Cuando la lista esté completa, los nombres y descripciones oficiales seguirán
              enlazados a la fuente original. Cada explicación es un resumen propio.
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="no-scrollbar -mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={active}
              className={cn(
                "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? "border-accent-500/50 bg-accent-600/20 text-accent-300"
                  : "border-base-700 bg-base-800 text-base-400 hover:border-base-600 hover:text-base-200",
              )}
            >
              {f.label}
              {f.id === "missable" && counts.missable > 0 && ` (${counts.missable})`}
              {f.id === "online" && counts.online > 0 && ` (${counts.online})`}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sin trofeos en este filtro"
          description="Prueba con otro filtro o consulta la fuente original para ver la lista completa."
          icon={<IconFilter size={22} />}
        />
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((e) => {
            const isOpen = expanded === e.id;
            return (
              <li
                key={e.id}
                className={cn(
                  "gh-card overflow-hidden transition-colors",
                  e.isMissable && "border-rose-500/25",
                  isOpen && "border-accent-500/40",
                )}
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : e.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start gap-3.5 p-3.5 text-left transition-colors hover:bg-base-750/40"
                >
                  <span
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-xl border",
                      TROPHY_TYPE_COLORS[e.trophyType],
                    )}
                  >
                    <TrophyIcon type={e.trophyType} size={22} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-base-400">
                        {TROPHY_TYPE_LABELS[e.trophyType]}
                      </span>
                      {e.isMissable && (
                        <span className="gh-chip border-rose-500/40 bg-rose-500/15 text-rose-300">
                          <IconAlert size={11} /> Perdible
                        </span>
                      )}
                      {e.isOnline && (
                        <span className="gh-chip border-accent-500/40 bg-accent-500/15 text-accent-300">
                          <IconGlobe size={11} /> Online
                        </span>
                      )}
                      {e.isDLC && (
                        <span className="gh-chip border-brand-500/40 bg-brand-500/15 text-brand-400">
                          DLC
                        </span>
                      )}
                      {e.requiresDifficulty && (
                        <span className="gh-chip border-amber-500/40 bg-amber-500/15 text-amber-300">
                          <IconStar size={11} /> {e.requiresDifficulty}
                        </span>
                      )}
                    </span>

                    <span className="mt-1 block text-[15px] font-bold leading-snug text-base-100">
                      {e.trophyName}
                    </span>

                    {e.trophyOfficialDescription && (
                      <span className="mt-1 block text-[12px] italic leading-relaxed text-base-400">
                        “{e.trophyOfficialDescription}”
                      </span>
                    )}

                    <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-base-500">
                      <span className="flex items-center gap-1">
                        <IconStar size={11} />
                        <span
                          className={cn("font-semibold", difficultyTextColor(e.difficulty))}
                        >
                          Dificultad {formatScore(e.difficulty)}
                        </span>
                      </span>
                      <span>{e.isOnline ? "Requiere online" : "No requiere online"}</span>
                      <span>· {e.recommendedStage}</span>
                    </span>

                    {isOpen && (
                      <span className="mt-3 block space-y-2 border-t border-base-700 pt-3">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-accent-300">
                          Cómo conseguirlo
                        </span>
                        <span className="block text-[13px] leading-relaxed text-base-200">
                          {e.howTo}
                        </span>
                        {e.note && (
                          <span className="block text-[12px] leading-relaxed text-base-400">
                            {e.note}
                          </span>
                        )}
                        {e.sourceUrl && (
                          <a
                            href={e.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="gh-link inline-block text-[11px]"
                          >
                            Ver en {e.sourceName ?? "la fuente original"} ↗
                          </a>
                        )}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {entries.some((e) => e.trophyOfficialDescription) && (
        <p className="mt-3 text-[11px] leading-relaxed text-base-500">
          Las descripciones entre comillas corresponden al texto oficial del trofeo. El resto de la
          explicación es un resumen propio de GamesHunter.{" "}
          <DataStatusBadge status="provisional" withTooltip={false} className="align-middle" />
        </p>
      )}
    </section>
  );
}
