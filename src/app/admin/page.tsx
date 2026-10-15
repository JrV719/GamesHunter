import Link from "next/link";
import { getSiteStats } from "@/lib/queries/games";
import { all, one } from "@/lib/db";
import { IconTrophy, IconGamepad, IconBook, IconDatabase, IconUsers, IconTrend } from "@/components/ui/Icon";
import { requireAdmin } from "@/lib/permissions";

export const metadata = { title: "Panel de administración", robots: { index: false } };

export default async function AdminDashboard() {
  await requireAdmin();
  const [stats, games, pendingTrophies, missingGuides, recentUsers] = await Promise.all([
    getSiteStats(),
    all<{ n: number }>("SELECT COUNT(*) AS n FROM games"),
    all<{ n: number }>(
      `SELECT COUNT(*) AS n FROM games g
        WHERE g.status = 'published'
          AND NOT EXISTS (SELECT 1 FROM platinum_profiles pp WHERE pp.game_id = g.id)`,
    ),
    one<{ n: number }>(
      `SELECT COUNT(*) AS n FROM games g WHERE g.status = 'published'
        AND NOT EXISTS (SELECT 1 FROM guides gu WHERE gu.game_id = g.id)`,
    ),
    all<{ n: number }>("SELECT COUNT(*) AS n FROM users"),
  ]);

  const [byStatus, byDataStatus, topSources] = await Promise.all([
    all<{ status: string; n: number }>(
      "SELECT status, COUNT(*) AS n FROM games GROUP BY status",
    ),
    all<{ data_status: string; n: number }>(
      "SELECT data_status, COUNT(*) AS n FROM games GROUP BY data_status",
    ),
    all<{ name: string; n: number }>(
      `SELECT gs.name, COUNT(dp.id) AS n FROM data_provenance dp
         JOIN guide_sources gs ON gs.id = dp.source_id
        GROUP BY gs.name ORDER BY n DESC`,
    ),
  ]);

  const cards = [
    { label: "Juegos", value: games[0]?.n ?? 0, icon: IconGamepad, href: "/admin/juegos" },
    { label: "Trofeos", value: stats.trophies, icon: IconTrophy, href: "/admin/trofeos" },
    { label: "Guías", value: stats.guides, icon: IconBook, href: "/admin/guias" },
    { label: "Fuentes", value: stats.sources, icon: IconDatabase, href: "/admin/fuentes" },
    { label: "Usuarios", value: recentUsers[0]?.n ?? 0, icon: IconUsers, href: "/admin/usuarios" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="gh-card p-4 transition-colors hover:border-accent-500/40"
          >
            <c.icon size={16} className="text-accent-400" />
            <p className="mt-2 font-mono text-2xl font-black text-base-100">{c.value}</p>
            <p className="text-[11px] text-base-500">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="gh-card p-4">
          <p className="gh-label">Estado editorial</p>
          <ul className="space-y-1.5">
            {byStatus.map((s) => (
              <li key={s.status} className="flex justify-between text-[13px]">
                <span className="capitalize text-base-300">{s.status}</span>
                <span className="font-mono text-base-100">{s.n}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="gh-card p-4">
          <p className="gh-label">Estado del dato</p>
          <ul className="space-y-1.5">
            {byDataStatus.map((s) => (
              <li key={s.data_status} className="flex justify-between text-[13px]">
                <span className="text-base-300">{s.data_status}</span>
                <span className="font-mono text-base-100">{s.n}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="gh-card p-4">
          <p className="gh-label flex items-center gap-1.5">
            <IconTrend size={12} /> Datos por fuente
          </p>
          <ul className="space-y-1.5">
            {topSources.length === 0 && <li className="text-[13px] text-base-500">Sin datos</li>}
            {topSources.map((s) => (
              <li key={s.name} className="flex justify-between text-[13px]">
                <span className="truncate text-base-300">{s.name}</span>
                <span className="font-mono text-base-100">{s.n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="gh-card p-4">
        <p className="gh-label">Tareas pendientes</p>
        <ul className="mt-2 space-y-2 text-[13px]">
          <li className="flex items-center justify-between gap-3">
            <span className="text-base-300">Juegos sin ficha de platino</span>
            <span className="font-mono text-base-100">
              {pendingTrophies[0]?.n ?? 0}
            </span>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span className="text-base-300">Juegos publicados sin guía</span>
            <span className="font-mono text-base-100">{missingGuides?.n ?? 0}</span>
          </li>
        </ul>
        <p className="mt-3 text-[11px] text-base-500">
          Añade un juego desde{" "}
          <Link href="/admin/juegos/nuevo" className="gh-link">
            /admin/juegos/nuevo
          </Link>{" "}
          y después documenta sus trofeos, tiempos y dificultades.
        </p>
      </div>
    </div>
  );
}
