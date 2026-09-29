import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getUserStats, getUserCollection } from "@/lib/auth";
import { GameCover } from "@/components/ui/GameCover";
import { Chip, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { USER_GAME_STATUS_LABELS, type UserGameStatus } from "@/lib/constants";
import {
  IconTrophy,
  IconBookmark,
  IconPlay,
  IconCheck,
  IconList,
  IconLogout,
  IconSettings,
  IconSparkle,
} from "@/components/ui/Icon";
import { formatDate, formatHours } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mi perfil y biblioteca",
  robots: { index: false },
};

type SearchParams = Promise<{ bienvenida?: string }>;

export default async function ProfilePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?siguiente=/perfil");

  const [stats, collection] = await Promise.all([
    getUserStats(user.id),
    getUserCollection(user.id),
  ]);

  const byStatus = (s: string) => collection.library.filter((g: any) => g.status === s);

  return (
    <div className="gh-container py-8">
      {sp.bienvenida && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.07] px-4 py-3 text-sm text-emerald-200">
          <IconCheck size={16} /> ¡Cuenta creada! Ya puedes guardar favoritos y registrar tus
          platinos.
        </div>
      )}

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-base-100">
            {user.displayName ?? user.username}
          </h1>
          <p className="mt-1 text-sm text-base-400">
            @{user.username} · {user.email}
            {user.role !== "user" && (
              <>
                {" · "}
                <Link href="/admin" className="gh-link font-semibold capitalize">
                  {user.role}
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {(user.role === "admin" || user.role === "moderator") && (
            <Link href="/admin" className="gh-btn gh-btn-ghost text-xs">
              <IconSettings size={14} /> Panel de administración
            </Link>
          )}
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="gh-btn gh-btn-ghost text-xs">
              <IconLogout size={14} /> Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      {/* Estadísticas */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Platinos", value: stats.platinas, icon: IconTrophy, accent: true },
          { label: "Completados", value: stats.completados, icon: IconCheck },
          { label: "Jugando", value: stats.jugando, icon: IconPlay },
          { label: "Pendientes", value: stats.pendientes, icon: IconList },
          { label: "Favoritos", value: stats.favoritos, icon: IconBookmark },
          { label: "Trofeos marcados", value: stats.trofeos, icon: IconSparkle },
        ].map((s) => (
          <div key={s.label} className="gh-card p-4">
            <s.icon size={16} className={s.accent ? "text-accent-400" : "text-base-500"} />
            <p className="mt-2 font-mono text-2xl font-black text-base-100">{s.value}</p>
            <p className="text-[11px] text-base-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Biblioteca */}
        <section>
          <SectionHeading
            title="Mi biblioteca"
            description="Juegos marcados como pendientes, jugando o completados."
            icon={<IconList size={16} className="text-accent-400" />}
          />
          {collection.library.length === 0 ? (
            <EmptyState
              title="Biblioteca vacía"
              description="Marca un juego como 'Jugando' o 'Completado' desde su ficha para empezar a construir tu biblioteca."
              icon={<IconList size={22} />}
              action={
                <Link href="/juegos" className="gh-btn gh-btn-ghost text-xs">
                  Explorar catálogo
                </Link>
              }
            />
          ) : (
            <div className="space-y-6">
              {(["playing", "backlog", "completed", "abandoned"] as UserGameStatus[]).map((s) => {
                const items = byStatus(s);
                if (items.length === 0) return null;
                return (
                  <div key={s}>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-base-400">
                      {USER_GAME_STATUS_LABELS[s]} ({items.length})
                    </p>
                    <ul className="space-y-1.5">
                      {items.map((g: any) => (
                        <li key={g.slug}>
                          <Link
                            href={`/juegos/${g.slug}`}
                            className="gh-card flex items-center gap-3 p-2.5 transition-colors hover:border-accent-500/40"
                          >
                            <div className="h-12 w-10 shrink-0 overflow-hidden rounded">
                              <GameCover
                                src={g.coverImage}
                                alt=""
                                slug={g.slug}
                                title={g.title}
                                accentColor={g.accentColor}
                                className="h-full w-full"
                                sizes="40px"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-semibold text-base-100">
                                {g.title}
                              </p>
                              <p className="text-[11px] text-base-500">
                                {s === "playing" && g.progress > 0 && `Progreso ${g.progress}%`}
                                {s === "completed" && g.finishedAt
                                  ? `Completado el ${formatDate(g.finishedAt)}`
                                  : null}
                                {g.hoursPlayed ? ` · ${formatHours(g.hoursPlayed)}` : null}
                              </p>
                            </div>
                            <Chip className="border-base-700 bg-base-850 text-[10px] text-base-400">
                              {USER_GAME_STATUS_LABELS[s]}
                            </Chip>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="space-y-10">
          {/* Favoritos */}
          <section>
            <SectionHeading
              title="Favoritos"
              icon={<IconBookmark size={16} className="text-accent-400" />}
            />
            {collection.favorites.length === 0 ? (
              <EmptyState
                title="Sin favoritos"
                description="Añade favoritos desde cualquier ficha de juego."
                icon={<IconBookmark size={22} />}
              />
            ) : (
              <ul className="space-y-1.5">
                {collection.favorites.map((g: any) => (
                  <li key={g.slug}>
                    <Link
                      href={`/juegos/${g.slug}`}
                      className="gh-card flex items-center gap-3 p-2.5 transition-colors hover:border-accent-500/40"
                    >
                      <div className="h-12 w-10 shrink-0 overflow-hidden rounded">
                        <GameCover
                          src={g.coverImage}
                          alt=""
                          slug={g.slug}
                          title={g.title}
                          accentColor={g.accentColor}
                          className="h-full w-full"
                          sizes="40px"
                        />
                      </div>
                      <p className="truncate text-[13px] font-semibold text-base-100">{g.title}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Platinos */}
          <section>
            <SectionHeading
              title="Mis platinos"
              description="Registro de los platinos conseguidos."
              icon={<IconTrophy size={16} className="text-accent-400" />}
            />
            {collection.platinas.length === 0 ? (
              <EmptyState
                title="Aún no has registrado ningún platino"
                description="Usa el botón 'Registrar platino' en la ficha de un juego que hayas completado."
                icon={<IconTrophy size={22} />}
              />
            ) : (
              <ul className="space-y-1.5">
                {collection.platinas.map((g: any, i: number) => (
                  <li key={`${g.slug}-${i}`}>
                    <Link
                      href={`/juegos/${g.slug}`}
                      className="gh-card flex items-center gap-3 p-2.5 transition-colors hover:border-accent-500/40"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-600/20">
                        <IconTrophy size={16} className="text-accent-300" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-base-100">
                          {g.title}
                        </p>
                        <p className="text-[11px] text-base-500">
                          {formatDate(g.earnedAt)}
                          {g.platformName ? ` · ${g.platformName}` : ""}
                          {g.grade ? ` · ${g.grade}` : ""}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
