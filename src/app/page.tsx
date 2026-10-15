import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchBar } from "@/components/search/SearchBar";
import { GameGrid } from "@/components/game/GameCard";
import { AccessNotice } from "@/components/site/AccessNotice";
import { SectionHeading, Chip } from "@/components/ui/primitives";
import {
  IconSparkle,
  IconTrend,
  IconClock,
  IconFlame,
  IconGauge,
  IconTrophy,
  IconArrowRight,
  IconDatabase,
  IconShield,
  IconSearch,
} from "@/components/ui/Icon";
import { getHomeCollections, getSiteStats, listGames } from "@/lib/queries/games";

export const metadata: Metadata = {
  title: "Trofeos PS4 y PS5: dificultad del Platino, tiempos y guías",
  description:
    "Busca entre miles de juegos de PS4 y PS5 y consulta la dificultad del Platino, el tiempo estimado, la lista completa de trofeos y si hay trofeos perdibles u online.",
  alternates: { canonical: "/" },
};

const QUICK_FILTERS = [
  { label: "PS4", href: "/juegos?plataforma=ps4", accent: "text-slate-300" },
  { label: "PS5", href: "/juegos?plataforma=ps5", accent: "text-accent-300" },
  { label: "PS4 + PS5", href: "/juegos?plataforma=ps4,ps5", accent: "text-brand-400" },
  { label: "Platino fácil", href: "/juegos?dificultad=1-4", accent: "text-emerald-300" },
  { label: "Platino difícil", href: "/juegos?dificultad=8-10", accent: "text-rose-300" },
  { label: "Menos de 10 h", href: "/juegos?horas=10", accent: "text-teal-300" },
  { label: "Menos de 20 h", href: "/juegos?horas=20", accent: "text-sky-300" },
  { label: "Más de 50 h", href: "/juegos?horas=50&horasMin=50", accent: "text-amber-300" },
];

const FEATURES = [
  {
    icon: IconGauge,
    title: "Dificultad del Platino, no del juego",
    text: "Un juego fácil puede tener un platino agotador. Valoramos el platino por separado de la dificultad de la historia.",
  },
  {
    icon: IconClock,
    title: "Tiempos por tramo",
    text: "Historia, historia + secundarias, contenido y platino completo, con rangos cuando hay datos más precisos.",
  },
  {
    icon: IconShield,
    title: "Avisos de perdibles y online",
    text: "Te decimos qué trofeos se pueden perder y cuándo conseguirlos, y cuáles requieren servidores o PS Plus.",
  },
  {
    icon: IconDatabase,
    title: "Cada dato con su fuente",
    text: "Resumen en texto propio, enlace a la guía original y nivel de confianza verificado, provisional o demo.",
  },
];

export default async function HomePage() {
  const [collections, stats, allGames] = await Promise.all([
    getHomeCollections(),
    getSiteStats(),
    listGames({ pageSize: 5, sort: "relevance" }),
  ]);

  return (
    <div className="pb-16">
      {/* Aviso de acceso denegado. Va en un componente de cliente dentro de
          Suspense para que la portada siga prerenderizándose: si se leyera
          searchParams aquí, la página entera pasaría a ser dinámica. */}
      <Suspense fallback={null}>
        <AccessNotice />
      </Suspense>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden border-b border-base-700/60">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            background:
              "radial-gradient(70rem 34rem at 50% -20%, rgb(56 189 248/.18), transparent 65%)",
          }}
        />
        <div className="gh-container relative py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Chip className="mb-5 border-accent-500/30 bg-accent-500/10 text-accent-300">
              <IconSparkle size={13} />
              {stats.games} juegos · {stats.trophies} trofeos · {stats.guides} guías
            </Chip>

            <h1 className="text-balance text-3xl font-black leading-[1.1] tracking-tight text-base-100 sm:text-5xl">
              Encuentra tu próximo{" "}
              <span className="bg-gradient-to-r from-accent-300 via-accent-400 to-brand-400 bg-clip-text text-transparent">
                platino
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-base-300 sm:text-base">
              Dificultad real del Platino, tiempos estimados, lista completa de trofeos, avisos de
              trofeos perdibles y online, y guías paso a paso de{" "}
              <strong className="font-semibold text-base-100">PlayStation 4</strong> y{" "}
              <strong className="font-semibold text-base-100">PlayStation 5</strong>.
            </p>

            <div className="mx-auto mt-8 max-w-2xl">
              <SearchBar size="lg" placeholder="Busca un juego..." />
            </div>

            <p className="mt-3 text-xs text-base-500">
              Prueba con:{" "}
              {["ghost-of-tsushima", "Bloodborne", "Horizon"].map((g, i, arr) => (
                <span key={g}>
                  <Link href={`/juegos/${g}`} className="gh-link">
                    {g.replace(/-/g, " ")}
                  </Link>
                  {i < arr.length - 1 ? " · " : ""}
                </span>
              ))}
            </p>
          </div>

          {/* Filtros rápidos */}
          <div className="mt-10">
            <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-base-500">
              Filtros rápidos
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {QUICK_FILTERS.map((f) => (
                <Link
                  key={f.label}
                  href={f.href}
                  className="gh-card group flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-base-300 transition-all hover:border-accent-500/50 hover:bg-base-750"
                >
                  <span className={f.accent}>{f.label}</span>
                  <IconArrowRight
                    size={12}
                    className="text-base-600 transition-transform group-hover:translate-x-0.5 group-hover:text-accent-400"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= COLECCIONES ================= */}
      <div className="gh-container space-y-14 pt-14">
        {collections.recommended.length > 0 && (
          <section>
            <SectionHeading
              title="Recomendados por el equipo"
              description="Platinumos que Recomendamos por la relación entre dificultad, tiempo y gratitud."
              icon={<IconSparkle size={16} className="text-brand-400" />}
              href="/juegos?recomendado=1&sort=popularidad"
            />
            <GameGrid games={collections.recommended} />
          </section>
        )}

        <section>
          <SectionHeading
            title="Juegos populares"
            description="Los más visitados de la comunidad."
            icon={<IconTrend size={16} className="text-accent-400" />}
            href="/juegos?sort=popularidad"
          />
          <GameGrid games={collections.popular} priorityCount={4} />
        </section>

        <section>
          <SectionHeading
            title="Platinos fáciles"
            description="Dificultad 1-4/10: Poco riesgo de perder trofeos y sin grind."
            icon={<IconGauge size={16} className="text-emerald-400" />}
            href="/juegos?dificultad=1-4"
          />
          <GameGrid games={collections.easy} />
        </section>

        <section>
          <SectionHeading
            title="Platinos difíciles"
            description="Dificultad 8-10/10: Requieren trabajo, cuidado con los perdibles o varias partidas."
            icon={<IconFlame size={16} className="text-rose-400" />}
            href="/juegos?dificultad=8-10"
          />
          <GameGrid games={collections.hard} />
        </section>

        <section>
          <SectionHeading
            title="Menos tiempo para el Platino"
            description="Los platinos más rápidos del catálogo."
            icon={<IconClock size={16} className="text-teal-400" />}
            href="/juegos?horas=10"
          />
          <GameGrid games={collections.quick} />
        </section>

        <section>
          <SectionHeading
            title="Añadidos recientemente"
            description="Últimas fichas incorporadas a la base de datos."
            icon={<IconTrophy size={16} className="text-amber-400" />}
            href="/juegos?orden=nuevos"
          />
          <GameGrid games={collections.recent} />
        </section>
      </div>

      {/* ================= CÓMO FUNCIONA ================= */}
      <section className="gh-container mt-16">
        <div className="gh-card overflow-hidden">
          <div className="border-b border-base-700 px-5 py-4 sm:px-7">
            <h2 className="gh-section-title flex items-center gap-2">
              <IconSearch size={16} className="text-accent-400" />
              Cómo usar GamesHunter
            </h2>
            <p className="mt-0.5 text-xs text-base-400">
              De la búsqueda al platino en cinco pasos.
            </p>
          </div>
          <ol className="grid gap-px bg-base-700 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { n: 1, t: "Busca el juego", d: "Por nombre en el buscador grande o en el catálogo con filtros." },
              { n: 2, t: "Mira la dificultad", d: "Primero el Platino; la historia va aparte para no confundir." },
              { n: 3, t: "Revisa los tiempos", d: "Historia, secundarias y platino con rangos orientativos." },
              { n: 4, t: "Comprueba los avisos", d: "Perdibles, online, dificultad y partidas múltiples." },
              { n: 5, t: "Sigue la guía", d: "Pasos numerados con el momento recomendado para cada trofeo." },
            ].map((s) => (
              <li key={s.n} className="bg-base-800 p-5">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent-600/20 font-mono text-xs font-black text-accent-300">
                  {s.n}
                </span>
                <p className="mt-3 text-sm font-bold text-base-100">{s.t}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-base-400">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ================= DIFERENCIALES ================= */}
      <section className="gh-container mt-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="gh-card p-5">
              <f.icon size={20} className="text-accent-400" />
              <p className="mt-3 text-sm font-bold text-base-100">{f.title}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-base-400">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= CTA CATÁLOGO ================= */}
      {allGames.total > 5 && (
        <section className="gh-container mt-14">
          <div className="gh-card flex flex-col items-center gap-4 overflow-hidden px-6 py-10 text-center">
            <h2 className="text-xl font-black tracking-tight text-base-100 sm:text-2xl">
              ¿Prefieres filtrar? Usa el catálogo completo
            </h2>
            <p className="max-w-xl text-sm text-base-400">
              Combina plataforma, género, dificultad, tiempo, número de trofeos y avisos en una
              sola búsqueda. {allGames.total} juegos disponibles.
            </p>
            <Link href="/juegos" className="gh-btn gh-btn-primary">
              <IconSearch size={16} />
              Abrir catálogo
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
