import { DifficultyBar, difficultyLabel, Alert } from "@/components/ui/primitives";
import { DIFFICULTY_KIND_LABELS, type DifficultyKind } from "@/lib/constants";
import { IconGauge, IconInfo } from "@/components/ui/Icon";

type Row = { kind: string; label: string; score: number; note: string | null };

/**
 * Sección de dificultad.
 * Distingue explícitamente la dificultad del JUEGO de la del PLATINO:
 * un juego fácil puede tener un platino agotador.
 */
export function DifficultySection({ difficulties }: { difficulties: Row[] }) {
  if (!difficulties || difficulties.length === 0) return null;

  const platinum = difficulties.find((d) => d.kind === "platinum");
  const others = difficulties.filter((d) => d.kind !== "platinum");

  return (
    <section aria-labelledby="dificultad">
      <h2 id="dificultad" className="gh-section-title mb-1 flex items-center gap-2">
        <IconGauge size={16} className="text-accent-400" />
        Dificultad
      </h2>
      <p className="mb-4 text-xs text-base-400">
        Estas valoraciones son distintas entre sí: la del platino mide el esfuerzo de la lista de
        trofeos; las demás miden el reto de jugar el juego.
      </p>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        {/* Platino */}
        {platinum && (
          <div className="gh-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-base-400">
                  Dificultad del Platino
                </p>
                <p className="mt-1 font-mono text-4xl font-black leading-none text-base-100">
                  {platinum.score}
                  <span className="text-lg text-base-500">/10</span>
                </p>
                <p className="mt-1.5 text-xs font-semibold text-accent-300">
                  {difficultyLabel(platinum.score)}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <DifficultyBar score={platinum.score} showValue={false} />
            </div>
            {platinum.note && (
              <p className="mt-3 border-t border-base-700 pt-3 text-[13px] leading-relaxed text-base-300">
                {platinum.note}
              </p>
            )}
          </div>
        )}

        {/* Otras dificultades */}
        <div className="gh-card p-5">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-wider text-base-400">
            Niveles de dificultad del juego
          </p>
          <ul className="space-y-3.5">
            {others.map((d) => (
              <li key={`${d.kind}-${d.label}`}>
                <DifficultyBar
                  score={d.score}
                  label={`${d.label} (${DIFFICULTY_KIND_LABELS[d.kind as DifficultyKind] ?? d.kind})`}
                />
                {d.note && (
                  <p className="mt-1 pl-0.5 text-[11px] leading-relaxed text-base-500">{d.note}</p>
                )}
              </li>
            ))}
            {others.length === 0 && (
              <li className="text-xs text-base-400">
                Este juego no tiene niveles de dificultad seleccionables.
              </li>
            )}
          </ul>
        </div>
      </div>

      <Alert tone="neutral" title="Cómo leer estas cifras" className="mt-3">
        <p className="flex items-start gap-2">
          <IconInfo size={14} className="mt-0.5 shrink-0" />
          <span>
            Una historia fácil (3/10) no implica un platino fácil. Para saber qué te espera al
            completar la lista, mira siempre la fila del platino y los avisos de perdibles y online.
          </span>
        </p>
      </Alert>
    </section>
  );
}
