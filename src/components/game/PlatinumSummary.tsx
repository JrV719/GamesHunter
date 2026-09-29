import { DataRow, Chip, Alert } from "@/components/ui/primitives";
import { formatHours, formatScore, yesNo } from "@/lib/utils";
import {
  IconAlert,
  IconGlobe,
  IconRepeat,
  IconTarget,
  IconSparkle,
  IconTrophy,
  IconFlame,
  IconLayers,
  IconCheck,
} from "@/components/ui/Icon";

type Game = any;

/** Ficha de Platino: el bloque "de un vistazo" de cada juego. */
export function PlatinumSummary({ game }: { game: Game }) {
  const p = game.profile;
  if (!p) {
    return (
      <section>
        <h2 className="gh-section-title mb-3">Información del Platino</h2>
        <Alert tone="neutral" title="Ficha pendiente">
          Todavía no se ha documentado la ficha de platino de este juego.
        </Alert>
      </section>
    );
  }

  const runs =
    (p.playthroughsMin ?? 1) === (p.playthroughsMax ?? 1)
      ? `${p.playthroughsMin ?? 1}`
      : `${p.playthroughsMin ?? 1}-${p.playthroughsMax}`;

  return (
    <section aria-labelledby="platino">
      <h2 id="platino" className="gh-section-title mb-3 flex items-center gap-2">
        <IconTrophy size={16} className="text-accent-400" />
        Información del Platino
      </h2>

      <div className="gh-card overflow-hidden">
        <div className="grid grid-cols-2 gap-px bg-base-700 sm:grid-cols-3 lg:grid-cols-4">
          <Stat
            label="Dificultad"
            value={formatScore(
              game.difficulties.find((d: any) => d.kind === "platinum")?.score,
            )}
            hint="Del platino, no del juego"
          />
          <Stat
            label="Tiempo"
            value={formatHours(p.estimatedHoursMin, p.estimatedHoursMax)}
            hint="Estimado para el 100%"
          />
          <Stat label="Partidas necesarias" value={runs} hint="Número de playthroughs" />
          <Stat
            label="Grindeo"
            value={p.grindRating ? `${p.grindRating}/10` : "—"}
            hint="Cuánto farmneo hace falta"
          />
        </div>

        <div className="grid gap-px bg-base-700 sm:grid-cols-2">
          <div className="bg-base-800 px-4 py-3">
            <DataRow
              label="Trofeos en total"
              value={`${p.totalTrophies} (${p.platinumCount} platino · ${p.goldCount} oro · ${p.silverCount} plata · ${p.bronzeCount} bronce)`}
            />
            <DataRow label="Trofeos perdibles" value={yesNo(p.hasMissables)} />
            <DataRow label="Trofeos online" value={yesNo(p.hasOnline)} />
            <DataRow
              label="Relacionados con la dificultad"
              value={yesNo(p.difficultyLinked)}
            />
          </div>
          <div className="bg-base-800 px-4 py-3">
            <DataRow
              label="Requiere máxima dificultad"
              value={yesNo(p.requiresMaxDifficulty)}
            />
            <DataRow label="Coleccionables" value={yesNo(p.hasCollectibles)} />
            <DataRow label="Requiere DLC" value={yesNo(p.requiresDLC)} />
            <DataRow label="Requiere PS Plus" value={yesNo(p.requiresPSPlus)} />
            <DataRow
              label="Requiere servidores activos"
              value={yesNo(p.requiresActiveServers)}
            />
            <DataRow
              label="Platino tras terminar la historia"
              value={yesNo(p.platinumAfterEnding)}
            />
          </div>
        </div>
      </div>

      {/* Avisos con detalle */}
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {p.hasMissables && (
          <Alert tone="danger" title="Trofeos que se pueden perder" icon={<IconAlert size={18} />}>
            {p.missableTrophies ?? "Consulta la lista de trofeos para ver el detalle."}
          </Alert>
        )}
        {p.hasOnline && (
          <Alert tone="info" title="Trofeos con componente online" icon={<IconGlobe size={18} />}>
            {p.onlineTrophies ?? "Revisa la lista de trofeos para identificarlos."}
          </Alert>
        )}
        {p.difficultyLinked && (
          <Alert tone="warn" title="Trofeos atados a una dificultad" icon={<IconTarget size={18} />}>
            {p.difficultyTrophies ??
              "Hay trofeos que exigen jugar en una dificultad concreta. Hazlos al final."}
          </Alert>
        )}
        {(p.playthroughsMax ?? 1) > 1 && (
          <Alert tone="warn" title="Múltiples partidas" icon={<IconRepeat size={18} />}>
            Necesitarás entre {p.playthroughsMin ?? 1} y {p.playthroughsMax} partidas. Puedes
            farmear en el hub del juego si tiene zona segura.
          </Alert>
        )}
        {(p.grindRating ?? 0) >= 6 && (
          <Alert tone="warn" title="Grindeo" icon={<IconFlame size={18} />}>
            Este platino tiene un nivel de grind alto ({p.grindRating}/10). Planifica el farmeo al
            final, cuando ya no necesites los recursos para la historia.
          </Alert>
        )}
        {p.requiresDLC && (
          <Alert tone="info" title="Expansión necesaria" icon={<IconLayers size={18} />}>
            Parte de la lista de trofeos requiere contenido adicional. Comprueba cuál antes de
            empezar.
          </Alert>
        )}
        {!p.hasMissables && !p.hasOnline && (
          <Alert tone="info" title="Sin sobresaltos" icon={<IconCheck size={18} />}>
            No hay trofeos perdibles ni online: puedes seguir la historia sin preocuparte por el orden.
          </Alert>
        )}
        {game.isRecommended && game.recommendationNote && (
          <Alert tone="info" title="Recomendación del equipo" icon={<IconSparkle size={18} />}>
            {game.recommendationNote}
          </Alert>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-base-800 px-4 py-3.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-base-400">{label}</p>
      <p className="mt-1 font-mono text-lg font-black leading-none text-base-100">{value}</p>
      {hint && <p className="mt-1.5 text-[11px] text-base-500">{hint}</p>}
    </div>
  );
}
