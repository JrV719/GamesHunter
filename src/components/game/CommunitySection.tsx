import Link from "next/link";
import { getGameOpinionSummary, getGameOpinions, getGameCommunityPosts } from "@/lib/community";
import { PostCard } from "@/components/community/PostCard";
import { RichBody } from "@/components/community/RichBody";
import { Avatar } from "@/components/community/PostCard";
import { VoteButton, ReportButton } from "@/components/community/VoteButton";
import { submitGameOpinion } from "@/app/comunidad/actions";
import { EmptyState, SectionHeading, Alert } from "@/components/ui/primitives";
import { IconChat, IconInfo, IconQuote } from "@/components/ui/Icon";
import { difficultyTextColor } from "@/components/ui/primitives";
import { formatDecimal, timeAgo } from "@/lib/utils";

/**
 * Bloque «Opiniones de la comunidad» de la ficha de un juego.
 *
 * Se mantiene separado de los datos verificados a propósito: la ficha muestra
 * dificultad y tiempos con fuente y fecha, aquí lo que dicen los jugadores. El
 * propio bloque explica esa diferencia para no confundir ambos datos.
 */
export async function CommunitySection({
  gameId,
  gameSlug,
  gameTitle,
  user,
  viewerIsStaff,
}: {
  gameId: string;
  gameSlug: string;
  gameTitle: string;
  user: { id: string; username: string; displayName: string | null } | null;
  viewerIsStaff: boolean;
}) {
  const [summary, opinions, otherPosts] = await Promise.all([
    getGameOpinionSummary(gameId),
    getGameOpinions(gameId, { viewerId: user?.id ?? null }),
    getGameCommunityPosts(gameId, { viewerId: user?.id ?? null, limit: 6 }),
  ]);

  // Las opiniones ya vienen dentro de otherPosts: filtramos para no repetirlas.
  const threads = otherPosts.filter((p) => p.kind !== "opinion");

  return (
    <section id="comunidad" className="scroll-mt-20">
      <SectionHeading
        title="Opiniones de la comunidad"
        description={`${summary.count} ${summary.count === 1 ? "opinión publicada" : "opiniones publicadas"} sobre ${gameTitle}`}
        href={`/comunidad?juego=${gameSlug}`}
        hrefLabel="Ver toda la conversación"
        icon={<IconQuote size={16} className="text-accent-400" />}
      />

      {/* Aclaración de qué son estos datos */}
      <Alert tone="info" title="ESTAS SON OPINIONES, NO DATOS VERIFICADOS" icon={<IconInfo size={16} />} className="mb-5">
        <p>
          Lo que hay debajo lo escribieron los jugadores. La dificultad del platino y los tiempos de la
          ficha tienen su fuente y su fecha; estas cifras son la experiencia de quien lo consiguió y
          pueden variar mucho según cómo juegue cada uno.
        </p>
      </Alert>

      {/* Resumen de lo que dice la comunidad */}
      {summary.count > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="gh-card p-3.5">
            <p className="gh-label">Opiniones</p>
            <p className="font-mono text-xl font-black text-base-100">{summary.count}</p>
          </div>
          <div className="gh-card p-3.5">
            <p className="gh-label">Dificultad media</p>
            <p
              className={`font-mono text-xl font-black ${
                summary.avgDifficulty != null
                  ? difficultyTextColor(Math.round(summary.avgDifficulty))
                  : "text-base-500"
              }`}
            >
              {summary.avgDifficulty != null ? `${summary.avgDifficulty}/10` : "—"}
            </p>
          </div>
          <div className="gh-card col-span-2 p-3.5 sm:col-span-1">
            <p className="gh-label">Horas hasta el platino</p>
            <p className="font-mono text-xl font-black text-base-100">
              {summary.avgHours != null ? `${formatDecimal(summary.avgHours)} h` : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Formulario para opinar */}
      <div className="gh-card mb-6 p-4">
        {user ? (
          <form action={submitGameOpinion} className="space-y-3">
            <input type="hidden" name="gameId" value={gameId} />
            <input type="hidden" name="gameTitle" value={gameTitle} />
            <input type="hidden" name="gameSlug" value={gameSlug} />

            <div className="flex items-center gap-2">
              <Avatar name={user.displayName ?? user.username} size={26} />
              <p className="text-[13px] font-semibold text-base-200">
                Opina como{" "}
                <Link href={`/usuarios/${user.username}`} className="gh-link">
                  {user.displayName ?? user.username}
                </Link>
              </p>
            </div>

            <div>
              <label className="gh-label" htmlFor="op-body">
                ¿Qué te costó este platino?
              </label>
              <textarea
                id="op-body"
                name="body"
                rows={4}
                required
                minLength={20}
                maxLength={8000}
                placeholder="Cuántas horas te llevó, dónde se atascó la cosa, si hay trofeos que se pierden..."
                className="gh-input resize-y text-[13px]"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="gh-label" htmlFor="op-diff">
                  Dificultad para ti (1-10)
                </label>
                <input
                  id="op-diff"
                  name="ratingDifficulty"
                  type="number"
                  min={1}
                  max={10}
                  placeholder="7"
                  className="gh-input"
                />
              </div>
              <div>
                <label className="gh-label" htmlFor="op-hours">
                  Horas jugadas
                </label>
                <input
                  id="op-hours"
                  name="ratingHours"
                  type="number"
                  min={0}
                  step="0.5"
                  placeholder="40"
                  className="gh-input"
                />
              </div>
              <div>
                <label className="gh-label" htmlFor="op-overall">
                  Nota general (1-10)
                </label>
                <input
                  id="op-overall"
                  name="ratingOverall"
                  type="number"
                  min={1}
                  max={10}
                  placeholder="8"
                  className="gh-input"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="gh-btn gh-btn-primary text-xs">
                <IconQuote size={13} /> Publicar opinión
              </button>
            </div>
          </form>
        ) : (
          <p className="text-center text-[13px] text-base-400">
            <Link
              href={`/login?siguiente=${encodeURIComponent(`/juegos/${gameSlug}`)}`}
              className="gh-link font-semibold"
            >
              Inicia sesión
            </Link>{" "}
            para opinar sobre {gameTitle}.
          </p>
        )}
      </div>

      {/* Opiniones publicadas */}
      {opinions.length === 0 ? (
        <EmptyState
          title="Todavía no hay opiniones"
          description="Sé la primera persona en contar cuánto te costó este platino. Tu experiencia ayuda mucho a quien viene detrás."
          icon={<IconQuote size={22} />}
        />
      ) : (
        <ul className="space-y-3">
          {opinions.map((op) => (
            <li key={op.id} className="gh-card p-4">
              <div className="flex flex-wrap items-start gap-3">
                <Link href={`/usuarios/${op.username}`} className="shrink-0">
                  <Avatar name={op.displayName ?? op.username} size={34} />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 text-[12px]">
                    <Link
                      href={`/usuarios/${op.username}`}
                      className="font-bold text-base-100 hover:text-accent-300"
                    >
                      {op.displayName ?? op.username}
                    </Link>
                    {(op.authorRole === "admin" || op.authorRole === "moderator") && (
                      <span className="gh-chip border-accent-500/30 bg-accent-500/10 text-[9px] text-accent-300">
                        {op.authorRole === "admin" ? "Admin" : "Moderación"}
                      </span>
                    )}
                    <span className="text-base-500">·</span>
                    <span className="text-base-500">{timeAgo(op.createdAt)}</span>
                  </div>

                  <RichBody text={op.body} className="mt-2" />

                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-base-700/60 pt-2.5">
                    {op.ratingDifficulty != null && (
                      <span
                        className={`font-mono text-[11px] font-bold ${difficultyTextColor(op.ratingDifficulty)}`}
                      >
                        Platino {op.ratingDifficulty}/10
                      </span>
                    )}
                    {op.ratingHours != null && (
                      <span className="font-mono text-[11px] text-base-400">
                        {formatDecimal(op.ratingHours)} h jugadas
                      </span>
                    )}
                    {op.ratingOverall != null && (
                      <span className="font-mono text-[11px] text-amber-300">
                        Nota {op.ratingOverall}/10
                      </span>
                    )}
                    <Link
                      href={`/comunidad/${op.id}`}
                      className="inline-flex items-center gap-1 text-[11px] text-accent-300 hover:underline"
                    >
                      <IconChat size={12} />
                      {op.commentsCount} comentarios
                    </Link>

                    <div className="ml-auto flex items-center gap-1">
                      <VoteButton
                        targetType="post"
                        targetId={op.id}
                        count={op.votesCount}
                        voted={op.votedByMe > 0}
                        isLoggedIn={Boolean(user)}
                        loginHref={`/login?siguiente=${encodeURIComponent(`/juegos/${gameSlug}`)}`}
                      />
                      {user && user.id !== op.userId && (
                        <ReportButton
                          targetType="post"
                          targetId={op.id}
                          isLoggedIn={Boolean(user)}
                          loginHref={`/login?siguiente=${encodeURIComponent(`/juegos/${gameSlug}`)}`}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Hilos del foro sobre este juego */}
      {threads.length > 0 && (
        <div className="mt-8">
          <SectionHeading
            title="Conversaciones sobre este juego"
            description="Hilos del foro relacionados, no solo opiniones."
            href={`/comunidad?juego=${gameSlug}&tipo=post`}
            hrefLabel="Ver todas"
            icon={<IconChat size={16} className="text-accent-400" />}
          />
          <div className="grid gap-3 md:grid-cols-2">
            {threads.map((p) => (
              <PostCard key={p.id} post={p} currentUserId={user?.id ?? null} compact />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}