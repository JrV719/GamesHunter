import type { Metadata } from "next";
import Link from "next/link";
import { getSources } from "@/lib/queries/taxonomy";
import { getSiteStats } from "@/lib/queries/games";
import { DATA_STATUS_META, CONFIDENCE_META, type DataStatus, type Confidence } from "@/lib/constants";
import { Chip, DataStatusBadge } from "@/components/ui/primitives";
import { IconExternal, IconShield, IconDatabase, IconInfo } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Acerca de GamesHunter y fuentes de datos",
  description:
    "Cómo funciona GamesHunter: qué datos son verificados, cuáles son provisionales y cuáles son de demostración. Fuentes, política de uso y enlaces a las guías originales.",
  alternates: { canonical: "/acerca-de" },
};

const POLICY_LABELS: Record<string, string> = {
  enlace: "Solo enlace",
  resumen: "Datos objetivos",
  texto_parcial: "Fragmentos breves",
  desconocido: "Sin verificar",
};

export default async function AboutPage() {
  const [sources, stats] = await Promise.all([getSources(), getSiteStats()]);

  return (
    <div className="gh-container py-10">
      <header className="mb-10 max-w-3xl">
        <h1 className="text-2xl font-black tracking-tight text-base-100 sm:text-3xl">
          Acerca de GamesHunter
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-base-300">
          GamesHunter es una base de datos independiente de trofeos de PlayStation 4 y PlayStation
          5. Recopilamos información publicada por guías públicas, la resumimos con texto propio y
          enlazamos siempre a la fuente original para que puedas contrastarla.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-base-400">
          <strong className="text-base-200">No copiamos artículos ni guías.</strong> Si una fuente
          no permite reutilizar su contenido, aquí solo enlazamos a ella.
        </p>
      </header>

      {/* Números */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Juegos", value: stats.games },
          { label: "Trofeos", value: stats.trophies },
          { label: "Guías", value: stats.guides },
          { label: "Plataformas", value: stats.platforms },
          { label: "Fuentes", value: stats.sources },
        ].map((s) => (
          <div key={s.label} className="gh-card p-4">
            <p className="font-mono text-2xl font-black text-base-100">{s.value}</p>
            <p className="text-[11px] text-base-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Estado del dato */}
      <section className="mb-12">
        <h2 className="gh-section-title mb-3 flex items-center gap-2">
          <IconShield size={16} className="text-accent-400" />
          Qué es real y qué es provisional
        </h2>
        <p className="mb-4 max-w-3xl text-sm leading-relaxed text-base-400">
          Cada ficha lleva una marca de estado. No conviene mezclarlas: un dato verificado es un
          hecho comprobable; uno provisional es una estimación de la comunidad.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {(Object.keys(DATA_STATUS_META) as DataStatus[]).map((key) => (
            <div key={key} className="gh-card p-4">
              <DataStatusBadge status={key} withTooltip={false} />
              <p className="mt-2.5 text-[13px] leading-relaxed text-base-300">
                {DATA_STATUS_META[key].description}
              </p>
            </div>
          ))}
        </div>
        <div className="gh-card mt-3 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-base-400">
            Niveles de confianza
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            {(Object.keys(CONFIDENCE_META) as Confidence[]).map((c) => (
              <span key={c} className="flex items-center gap-1.5 text-[12px]">
                <span className={`h-2 w-2 rounded-full ${CONFIDENCE_META[c].className}`} />
                <span className="text-base-400">
                  {c}: {CONFIDENCE_META[c].label.replace("Confianza ", "")}
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Fuentes */}
      <section className="mb-12">
        <h2 className="gh-section-title mb-3 flex items-center gap-2">
          <IconDatabase size={16} className="text-accent-400" />
          Fuentes de datos
        </h2>
        <p className="mb-4 max-w-3xl text-sm leading-relaxed text-base-400">
          La columna "uso" indica qué se puede hacer con la información de cada fuente. El sistema
          está preparado para añadir más fuentes en el panel de administración.
        </p>
        <ul className="space-y-3">
          {sources.map((s) => (
            <li key={s.id} className="gh-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-base-100">{s.name}</h3>
                <Chip
                  className={
                    s.usagePolicy === "enlace"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  }
                >
                  {POLICY_LABELS[s.usagePolicy] ?? s.usagePolicy}
                </Chip>
                {s.allowsCopy ? (
                  <Chip className="border-rose-500/30 bg-rose-500/10 text-rose-300">
                    permite reutilización
                  </Chip>
                ) : (
                  <Chip className="border-base-700 bg-base-850 text-base-400">
                    no se reproduce contenido
                  </Chip>
                )}
                {s.homepage && (
                  <a
                    href={s.homepage}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="gh-link ml-auto inline-flex items-center gap-1 text-[12px]"
                  >
                    Visitar <IconExternal size={11} />
                  </a>
                )}
              </div>
              {s.notes && (
                <p className="mt-2 text-[13px] leading-relaxed text-base-400">{s.notes}</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Cómo se construyen las fichas */}
      <section className="mb-12">
        <h2 className="gh-section-title mb-3">Cómo se construye una ficha</h2>
        <ol className="space-y-2.5">
          {[
            {
              t: "Recopilación",
              d: "Tomamos datos objetivos de varias fuentes: número y nombre de trofeos, plataformas, fechas y recolhida de cada dato en la tabla de trazabilidad.",
            },
            {
              t: "Contraste",
              d: "Cada cifra se contrasta con al menos dos referencias. Si solo hay una fuente o las cifras discrepan, la ficha se marca como 'provisional'.",
            },
            {
              t: "Redacción propia",
              d: "Dificultades, tiempos y explicaciones de cada trofeo se escriben con nuestro propio lenguaje. No se reproduce texto ajeno.",
            },
            {
              t: "Revisión",
              d: "Un editor revisa la ficha, valida los avisos de perdibles y online, y actualiza la confianza de cada campo.",
            },
          ].map((s, i) => (
            <li key={s.t} className="gh-card flex gap-3.5 p-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-600/20 font-mono text-xs font-black text-accent-300">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-bold text-base-100">{s.t}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-base-300">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Qué es la comunidad y qué NO es */}
      <section className="mb-12">
        <h2 className="gh-section-title mb-3">La comunidad y sus opiniones</h2>
        <div className="gh-card space-y-3 p-5 text-[13px] leading-relaxed text-base-300">
          <p>
            En cada ficha de juego hay una sección de <strong>opiniones de la comunidad</strong>, y
            en <Link href="/comunidad" className="gh-link">Comunidad</Link> hay un foro abierto por
            temas: platinos, trofeos, dificultad, consejos, online y noticias.
          </p>
          <p>
            Es importante no confundirlas con los datos de la ficha. La dificultad del Platino y los
            tiempos que aparecen arriba son <strong>datos verificados</strong>, con su fuente, su
            fecha y su nivel de confianza. Las opiniones son{" "}
            <strong>la experiencia de quien lo consiguió</strong>: dependen del jugador, de su
            versión y de si usó la guía abierta. Por eso van siempre en un bloque aparte, con su
            propio aviso, y nunca sustituyen a los datos documentados.
          </p>
          <p>
            Las medias que sí se calculan (dificultad media, horas medias) salen únicamente de las
            opiniones, y por eso se muestran con una sola cifra y su número de respuestas.
          </p>
          <p>
            Cada persona puede editar o borrar su propio contenido. Los administradores y
            moderadores pueden ocultar o eliminar cualquier publicación, y todo el mundo puede
            denunciar contenido que incumpla las normas desde el botón de la bandera.
          </p>
        </div>
      </section>

      {/* Advertencia */}
      <div className="gh-card border-amber-500/30 bg-amber-500/[0.06] p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-amber-200">
          <IconInfo size={16} /> Aviso importante
        </p>
        <div className="mt-2 space-y-2 text-[13px] leading-relaxed text-amber-100/90">
          <p>
            Los tiempos y las dificultades son <strong>estimaciones</strong> y varían mucho según el
            jugador, la versión y si se juega con la guía abierta. Úsalos como orientación, no como
            un dato exacto.
          </p>
          <p>
            GamesHunter es un proyecto independiente. No está afiliado a Sony Interactive
            Entertainment, y las marcas citadas pertenecen a sus respectivos titulares. Los textos
            oficiales de los trofeos son públicos y se muestran entrecomillados cuando se
            reproducen.
          </p>
          <p>
            Si un dato parece incorrecto, contrasta con la fuente original. Puedes{" "}
            <Link href="/guias" className="underline">
              consultar las guías
            </Link>{" "}
            o{" "}
            <Link href="/juegos" className="underline">
              filtrar el catálogo
            </Link>{" "}
            por los criterios que te interesen.
          </p>
        </div>
      </div>
    </div>
  );
}
