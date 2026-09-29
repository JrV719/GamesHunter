import Link from "next/link";
import { getCategories, getPlatforms } from "@/lib/queries/taxonomy";

const SECTIONS = [
  {
    title: "Explorar",
    links: [
      { href: "/juegos", label: "Catálogo completo" },
      { href: "/juegos?sort=relevance&plataforma=ps5", label: "Juegos de PS5" },
      { href: "/juegos?sort=relevance&plataforma=ps4", label: "Juegos de PS4" },
      { href: "/comparar", label: "Comparador" },
    ],
  },
  {
    title: "Guías",
    links: [
      { href: "/guias", label: "Todas las guías" },
      { href: "/juegos?dificultad=1-4", label: "Platinos fáciles" },
      { href: "/juegos?dificultad=8-10", label: "Platinos difíciles" },
      { href: "/juegos?horas=10", label: "Platinos de menos de 10 h" },
    ],
  },
  {
    title: "Sitio",
    links: [
      { href: "/acerca-de", label: "Acerca de y fuentes" },
      { href: "/panel-admin", label: "Panel de administración" },
      { href: "/login", label: "Iniciar sesión" },
      { href: "/registro", label: "Crear cuenta" },
    ],
  },
];

export async function Footer() {
  const [platforms, categories] = await Promise.all([getPlatforms(), getCategories()]);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-base-700 bg-base-950/60">
      <div className="gh-container py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="text-base font-black tracking-tight text-base-100">
              Games<span className="text-accent-400">Hunter</span>
            </p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-base-400">
              Base de datos y guías de trofeos de PlayStation 4 y PlayStation 5. Dificultad del
              Platino, tiempos estimados, lista de trofeos y avisos de trofeos perdibles y online.
            </p>
            <p className="mt-4 text-xs text-base-500">
              Proyecto independiente. No está afiliado a Sony Interactive Entertainment.
            </p>
          </div>

          {SECTIONS.map((s) => (
            <div key={s.title}>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-base-200">
                {s.title}
              </p>
              <ul className="space-y-2">
                {s.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-base-400 transition-colors hover:text-accent-300"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-base-200">
              Plataformas
            </p>
            <ul className="space-y-2">
              {platforms.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/juegos?plataforma=${p.slug}`}
                    className="text-sm text-base-400 transition-colors hover:text-accent-300"
                  >
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mb-3 mt-6 text-xs font-bold uppercase tracking-wider text-base-200">
              Géneros
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {categories.slice(0, 8).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/categorias/${c.slug}`}
                    className="gh-chip border-base-700 bg-base-850 text-base-400 transition-colors hover:border-accent-500/40 hover:text-accent-300"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-base-700/70 pt-6 text-xs text-base-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} GamesHunter. Datos orientativos basados en guías públicas de la comunidad.</p>
          <p>
            La información de trofeos se resume con texto propio y enlaza a su fuente original.
            Cada ficha indica su nivel de confianza.
          </p>
        </div>
      </div>
    </footer>
  );
}
