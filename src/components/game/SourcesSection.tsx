import { DataStatusBadge, Chip } from "@/components/ui/primitives";
import { CONFIDENCE_META, DATA_STATUS_META, type Confidence, type DataStatus } from "@/lib/constants";
import { IconExternal, IconDatabase, IconInfo } from "@/components/ui/Icon";
import { formatDate } from "@/lib/utils";

type Game = any;

/**
 * Sección de datos y trazabilidad.
 * Muestra de dónde sale cada dato, cuándo se actualizó y con qué confianza.
 */
export function SourcesSection({ game }: { game: Game }) {
  const prov = game.provenance ?? [];
  const platforms = game.platforms ?? [];
  const lists = game.trophyLists ?? [];

  return (
    <section aria-labelledby="datos">
      <h2 id="datos" className="gh-section-title mb-3 flex items-center gap-2">
        <IconDatabase size={16} className="text-accent-400" />
        Datos, plataformas y fuentes
      </h2>

      {/* Estado del dato */}
      <div className="gh-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <DataStatusBadge status={game.dataStatus} />
          <p className="text-[12px] leading-relaxed text-base-400">
            {DATA_STATUS_META[(game.dataStatus as DataStatus) ?? "provisional"].description}
          </p>
        </div>
        <p className="mt-2.5 text-[11px] text-base-500">
          Ficha actualizada el {formatDate(game.updatedAt)} · {prov.length} registros de trazabilidad
        </p>
      </div>

      {/* Plataformas */}
      <div className="mt-3 gh-card p-4">
        <p className="gh-label">Plataformas y listas de trofeos</p>
        <ul className="mt-2 space-y-2.5">
          {platforms.map((p: any) => {
            const release = game.releases?.find((r: any) => r.platformId === p.platformId);
            const list = lists.find((l: any) => l.platformSlug === p.platform.slug);
            return (
              <li key={p.platformId} className="rounded-lg bg-base-850 px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-base-100">
                    {p.platform.name}
                  </span>
                  {release?.release_date && (
                    <Chip className="border-base-700 bg-base-800 text-base-400">
                      Lanzamiento{" "}
                      {new Intl.DateTimeFormat("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      }).format(new Date(release.release_date))}
                    </Chip>
                  )}
                  {release?.is_original === 1 && (
                    <Chip className="border-accent-500/30 bg-accent-500/10 text-accent-300">
                      Versión original
                    </Chip>
                  )}
                  <Chip
                    className={
                      p.sharesTrophyList
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                    }
                  >
                    {p.sharesTrophyList ? "Trofeos compartidos" : "Lista independiente"}
                  </Chip>
                </div>
                {p.notes && <p className="mt-1.5 text-[12px] text-base-400">{p.notes}</p>}
                {list && (
                  <p className="mt-1.5 text-[11px] text-base-500">
                    Lista: {list.name} · {list.totalCount} documentados · completitud{" "}
                    {list.completeness}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Trazabilidad */}
      {prov.length > 0 && (
        <div className="mt-3 gh-card p-4">
          <p className="gh-label flex items-center gap-1.5">
            <IconInfo size={12} /> Trazabilidad de los datos
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-xs">
              <thead>
                <tr className="border-b border-base-700 text-[10px] uppercase tracking-wider text-base-500">
                  <th className="pb-2 pr-3 font-bold">Dato</th>
                  <th className="pb-2 pr-3 font-bold">Fuente</th>
                  <th className="pb-2 pr-3 font-bold">Enlace</th>
                  <th className="pb-2 pr-3 font-bold">Actualizado</th>
                  <th className="pb-2 font-bold">Confianza</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-700/60">
                {prov.map((p: any) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-3 text-base-200">{p.field}</td>
                    <td className="py-2 pr-3 text-base-300">
                      {p.sourceName ?? (p.sourceId ? "—" : "Sin fuente")}
                    </td>
                    <td className="py-2 pr-3">
                      {p.sourceUrl ? (
                        <a
                          href={p.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="gh-link inline-flex items-center gap-1"
                        >
                          Ver <IconExternal size={10} />
                        </a>
                      ) : (
                        <span className="text-base-600">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-base-400">{formatDate(p.lastUpdated)}</td>
                    <td className="py-2">
                      <span
                        className={
                          CONFIDENCE_META[(p.confidence as Confidence) ?? "media"].className
                        }
                      >
                        {CONFIDENCE_META[(p.confidence as Confidence) ?? "media"].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-base-500">
        GamesHunter resume con texto propio la información publicada por las fuentes enlazadas y no
        reproduce sus artículos. Si un dato no cuadra con tu experiencia, la fuente original tiene
        prioridad.
      </p>
    </section>
  );
}
