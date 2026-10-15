import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPublicProfile,
  getUserCommunity,
  getUserCommunityCounts,
} from "@/lib/community";
import { getUserStats } from "@/lib/auth";
import { Avatar } from "@/components/community/PostCard";
import { RichBody } from "@/components/community/RichBody";
import { Chip, EmptyState, SectionHeading } from "@/components/ui/primitives";
import {
  IconChat,
  IconEdit,
  IconHeart,
  IconMessage,
  IconQuote,
  IconTrophy,
} from "@/components/ui/Icon";
import { POST_KIND_LABELS, type PostKind } from "@/lib/constants";
import { cn, formatDate, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

type RouteParams = Promise<{ username: string }>;

export async function generateMetadata({ params }: { params: RouteParams }): Promise<Metadata> {
  const { username } = await params;
  const user = await getPublicProfile(username);
  if (!user) return { title: "Usuario no encontrado" };
  const name = user.displayName ?? user.username;
  return {
    title: `${name} en la comunidad`,
    description: `Perfil de ${name} en GamesHunter: publicaciones, opiniones y comentarios de la comunidad.`,
    alternates: { canonical: `/usuarios/${user.username}` },
    openGraph: { title: `${name} · GamesHunter`, description: user.bio ?? `Perfil de ${name}.` },
  };
}

export default async function UserProfilePage({ params }: { params: RouteParams }) {
  const { username } = await params;

  const user = await getPublicProfile(username);
  if (!user) notFound();

  const [content, counts, stats] = await Promise.all([
    getUserCommunity(user.id),
    getUserCommunityCounts(user.id),
    getUserStats(user.id),
  ]);

  const isStaff = user.role === "admin" || user.role === "moderator";

  return (
    <div className="gh-container py-8">
      {/* Cabecera */}
      <header className="gh-card mb-8 flex flex-wrap items-start gap-4 p-5">
        <Avatar name={user.displayName ?? user.username} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-black tracking-tight text-base-100">
            {user.displayName ?? user.username}
            {isStaff && (
              <span className="gh-chip border-accent-500/30 bg-accent-500/10 text-accent-300">
                {user.role === "admin" ? "Administrador" : "Moderación"}
              </span>
            )}
          </h1>
          <p className="text-sm text-base-400">@{user.username}</p>
          {user.bio && <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-base-300">{user.bio}</p>}
          <p className="mt-2 text-[11px] text-base-500">Miembro desde {formatDate(user.createdAt)}</p>
        </div>
        <Link href="/perfil" className="gh-btn gh-btn-ghost text-xs">
          <IconEdit size={13} /> Mi perfil
        </Link>
      </header>

      {/* Métricas */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Publicaciones", value: counts.posts, icon: IconChat },
          { label: "Opiniones", value: content.opinions.length, icon: IconQuote },
          { label: "Comentarios", value: counts.comments, icon: IconMessage },
          { label: "Votos dados", value: counts.votes, icon: IconHeart },
          { label: "Platinos", value: stats.platinas, icon: IconTrophy },
          { label: "Completados", value: stats.completados, icon: IconTrophy },
        ].map((s) => (
          <div key={s.label} className="gh-card p-4">
            <s.icon size={15} className="text-accent-400" />
            <p className="mt-1.5 font-mono text-2xl font-black text-base-100">{s.value}</p>
            <p className="text-[11px] text-base-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-10">
          {/* Publicaciones */}
          <section>
            <SectionHeading
              title={`Publicaciones (${content.posts.length})`}
              description="Todo lo que ha publicado, opiniones incluidas."
              icon={<IconChat size={16} className="text-accent-400" />}
            />
            {content.posts.length === 0 ? (
              <EmptyState
                title="Todavía no ha publicado nada"
                description="Cuando este usuario abra un hilo u opinione sobre un juego, aparecerá aquí."
                icon={<IconChat size={22} />}
              />
            ) : (
              <ul className="space-y-3">
                {content.posts.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/comunidad/${p.id}`}
                      className="gh-card block p-4 transition-colors hover:border-accent-500/40"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Chip className="border-base-700 bg-base-850 text-[10px] text-base-400">
                          {POST_KIND_LABELS[p.kind as PostKind] ?? p.kind}
                        </Chip>
                        {p.gameSlug && p.gameTitle && (
                          <Chip className="border-accent-500/25 bg-accent-500/[0.07] text-[10px] text-accent-300">
                            {p.gameTitle}
                          </Chip>
                        )}
                        <span className="ml-auto text-[11px] text-base-500">
                          {timeAgo(p.createdAt)}
                        </span>
                      </div>
                      <h3 className="mt-1.5 text-[15px] font-bold leading-snug text-base-100">
                        {p.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-[13px] text-base-400">{p.body}</p>
                      <div className="mt-2 flex gap-3 text-[11px] text-base-500">
                        <span className="inline-flex items-center gap-1">
                          <IconHeart size={12} /> {p.votesCount}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <IconMessage size={12} /> {p.commentsCount}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Comentarios */}
        <section>
          <SectionHeading
            title={`Comentarios (${content.comments.length})`}
            icon={<IconMessage size={16} className="text-accent-400" />}
          />
          {content.comments.length === 0 ? (
            <EmptyState
              title="Sin comentarios"
              description="Aún no ha participado en ninguna conversación."
              icon={<IconMessage size={22} />}
            />
          ) : (
            <ul className="space-y-2.5">
              {content.comments.map((c) => (
                <li key={c.id} className="gh-card p-3.5">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-base-500">{timeAgo(c.createdAt)}</span>
                    {c.postTitle && (
                      <Link
                        href={`/comunidad/${c.postId}#${c.id}`}
                        className="gh-link line-clamp-1 font-semibold"
                        title={c.postTitle}
                      >
                        {c.postTitle}
                      </Link>
                    )}
                  </div>
                  <RichBody text={c.body} className="mt-1.5" />
                  {c.postGameSlug && (
                    <Link
                      href={`/juegos/${c.postGameSlug}`}
                      className={cn("mt-1.5 inline-block text-[11px] gh-link")}
                    >
                      Ver el juego
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}