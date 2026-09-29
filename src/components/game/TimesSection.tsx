import { formatHours, formatDecimal } from "@/lib/utils";
import { TIME_KIND_LABELS, type TimeKind } from "@/lib/constants";
import { IconClock, IconInfo, IconTrophy } from "@/components/ui/Icon";

type Row = {
  id: string;
  kind: string;
  label: string;
  minHours: number;
  maxHours: number;
  note: string | null;
};

const COLORS: Record<string, string> = {
  main_story: "bg-sky-500",
  story_side: "bg-teal-500",
  side_content: "bg-violet-500",
  platinum: "bg-accent-500",
  completionist: "bg-brand-500",
};

/** Sección de tiempos: barra comparativa de los tramos documentados. */
export function TimesSection({ times }: { times: Row[] }) {
  if (!times || times.length === 0) return null;

  const max = Math.max(...times.map((t) => t.maxHours), 1);
  const main = times.find((t) => t.kind === "main_story");
  const platinum = times.find((t) => t.kind === "platinum");

  return (
    <section aria-labelledby="tiempos">
      <h2 id="tiempos" className="gh-section-title mb-3 flex items-center gap-2">
        <IconClock size={16} className="text-accent-400" />
        Tiempos estimados
      </h2>

      <div className="gh-card p-5">
        <ul className="space-y-4">
          {times.map((t) => {
            const pct = (t.maxHours / max) * 100;
            const isPlatinum = t.kind === "platinum";
            return (
              <li key={t.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-base-100">
                    {isPlatinum && <IconTrophy size={14} className="text-accent-400" />}
                    {t.label}
                  </span>
                  <span
                    className={`font-mono text-sm font-bold tabular-nums ${
                      isPlatinum ? "text-accent-300" : "text-base-200"
                    }`}
                  >
                    {formatHours(t.minHours, t.maxHours)}
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-base-700">
                  <div
                    className={`h-full rounded-full ${COLORS[t.kind] ?? "bg-base-500"}`}
                    style={{ width: `${Math.max(6, pct)}%` }}
                  />
                </div>
                {t.note && (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-base-500">{t.note}</p>
                )}
              </li>
            );
          })}
        </ul>

        {main && platinum && (
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-base-700 pt-4 sm:grid-cols-4">
            <MiniStat
              label="Historia principal"
              value={formatHours(main.minHours, main.maxHours)}
            />
            <MiniStat
              label="Platino"
              value={formatHours(platinum.minHours, platinum.maxHours)}
              accent
            />
            <MiniStat
              label="Extra sobre la historia"
              value={`+${formatDecimal(
                Math.max(0, platinum.minHours - (main?.maxHours ?? 0)),
              )} h`}
            />
            <MiniStat
              label="Trofeos de la lista"
              value={`${Math.round(
                (platinum.maxHours / Math.max(1, main.maxHours)) * 10,
              )}× la historia`}
            />
          </div>
        )}
      </div>

      <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-base-500">
        <IconInfo size={13} className="mt-0.5 shrink-0" />
        <span>
          <strong className="font-semibold text-base-400">Tiempos aproximados.</strong> Son
          estimaciones obtenidas de guías públicas de la comunidad y pueden variar mucho según el
          jugador, la versión y si juegas con la guía abierta. Cuando el dato procede de una sola
          fuente se indica su confianza en la sección de datos.
        </span>
      </p>
    </section>
  );
}

function MiniStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg bg-base-850 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-base-500">{label}</p>
      <p
        className={`mt-0.5 font-mono text-sm font-bold tabular-nums ${
          accent ? "text-accent-300" : "text-base-200"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export { TIME_KIND_LABELS };
