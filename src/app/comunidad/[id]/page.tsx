import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import {
  getCommentsForPost,
  getPostById,
  getRelatedPosts,
  incrementPostViews,
} from "@/lib/community";
import { RichBody } from "@/components/community/RichBody";
import { PostCard, Avatar } from "@/components/community/PostCard";
import { CommentForm, CommentList } from "@/components/community/CommentList";
import { VoteButton, ReportButton } from "@/components/community/VoteButton";
import { addComment, removePost } from "@/app/comunidad/actions";
import { Chip, SectionHeading } from "@/components/ui/primitives";
import {
  IconEye,
  IconFlag,
  IconMessage,
  IconPin,
  IconTrash,
} from "@/components/ui/Icon";
import { POST_KIND_LABELS, type PostKind } from "@/lib/constants";
import { cn, formatDate, formatDecimal, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

type RouteParams = Promise<{ id: string }>;
type SearchParams = Promise<{ error?: string; guardado?: string }>;

export async function generateMetadata({ params }: { params: RouteParams }): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) return { title: "Publicación no encontrada" };
  return {
    title: post.title,
    description: post.body.slice(0, 155),
    alternates: { canonical: `/comunidad/${id}` },
    // Contenido de usuarios: no se indexa para no duplicar ni enviar aspam.
    robots: { index: false, follow: true },
    openGraph: { type: "article", title: post.title, description: post.body.slice(0, 155) },
  };
}

export default async function PostPage({
  params,
  searchParams,
}: {
  params: RouteParams;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const user = await getCurrentUser();
  const viewerIsStaff = isStaff(user);

  const post = await getPostById(id, { viewerId: user?.id ?? null, viewerIsStaff });
  if (!post) notFound();

  const [comments, related] = await Promise.all([
    getCommentsForPost(id, { viewerId: user?.id ?? null, viewerIsStaff }),
    getRelatedPosts(id, post.gameId),
  ]);

  // Contador de visitas. Se hace fuera del render que se prerenderiza, pero
  // esta página es dinámica, así que escribir aquí es seguro.
  await incrementPostViews(id).catch(() => {});

  const isAuthor = user?.id === post.userId;
  const canDelete = isAuthor || viewerIsStaff;
  const loginHref = `/login?siguiente=${encodeURIComponent(`/comunidad/${id}`)}`;
  const kindLabel = POST_KIND_LABELS[post.kind as PostKind] ?? post.kind;

  return (
    <div className="gh-container py-8">
      <nav aria-label="Ruta" className="mb-4 flex items-center gap-1.5 text-[11px] text-base-500">
        <Link href="/comunidad" className="gh-link">
          Comunidad
        </Link>
        {post.topicSlug && (
          <>
            <span aria-hidden="true">/</span>
            <Link href={`/comunidad?tema=${post.topicSlug}`} className="gh-link">
              {post.topicName}
            </Link>
          </>
        )}
      </nav>

      {(sp.error || sp.guardado) && (
        <p
          role="alert"
          className={cn(
            "mb-5 rounded-xl border px-4 py-2.5 text-sm",
            sp.error
              ? "border-rose-500/30 bg-rose-500/[0.07] text-rose-200"
              : "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-200",
          )}
        >
          {sp.error ? sp.error : "Cambios guardados."}
        </p>
      )}

      {post.status !== "published" && (
        <p className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-2.5 text-sm text-amber-200">
          Esta publicación está oculta para el público. Solo la ven moderadores y su autor.
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <article className="min-w-0">
          {/* Post */}
          <div className="gh-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              {post.isPinned && (
                <Chip className="border-accent-500/40 bg-accent-500/10 text-accent-300">
                  <IconPin size={11} /> Fijado
                </Chip>
              )}
              <Chip className="border-base-700 bg-base-850 text-base-400">{kindLabel}</Chip>
              {post.topicName && (
                <Link href={`/comunidad?tema=${post.topicSlug}`}>
                  <Chip className="border-base-700 bg-base-850 text-base-400 hover:text-accent-300">
                    {post.topicName}
                  </Chip>
                </Link>
              )}
              {post.gameSlug && post.gameTitle && (
                <Link href={`/juegos/${post.gameSlug}`}>
                  <Chip className="border-accent-500/25 bg-accent-500/[0.07] text-accent-300">
                    {post.gameTitle}
                  </Chip>
                </Link>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-black leading-tight tracking-tight text-base-100">
              {post.title}
            </h1>

            <div className="mt-4 flex items-center gap-3 border-b border-base-700 pb-4">
              <Link href={`/usuarios/${post.username}`}>
                <Avatar name={post.displayName ?? post.username} size={36} />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 text-[13px]">
                  <Link
                    href={`/usuarios/${post.username}`}
                    className="font-semibold text-base-100 hover:text-accent-300"
                  >
                    {post.displayName ?? post.username}
                  </Link>
                  {(post.authorRole === "admin" || post.authorRole === "moderator") && (
                    <span className="gh-chip border-accent-500/30 bg-accent-500/10 text-[9px] text-accent-300">
                      {post.authorRole === "admin" ? "Admin" : "Moderación"}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-base-500">
                  <time dateTime={post.createdAt} title={formatDate(post.createdAt)}>
                    {timeAgo(post.createdAt)}
                  </time>
                  {post.editedAt && " · editada"}
                </p>
              </div>
            </div>

            {/* Datos de una opinión */}
            {post.kind === "opinion" &&
              (post.ratingDifficulty != null ||
                post.ratingHours != null ||
                post.ratingOverall != null) && (
                <div className="mt-4 grid gap-2 rounded-xl border border-base-700 bg-base-850/50 p-3.5 sm:grid-cols-3">
                  {post.ratingDifficulty != null && (
                    <div>
                      <p className="gh-label">Dificultad del platino</p>
                      <p className="font-mono text-lg font-black text-sky-300">
                        {post.ratingDifficulty}/10
                      </p>
                    </div>
                  )}
                  {post.ratingHours != null && (
                    <div>
                      <p className="gh-label">Horas jugadas</p>
                      <p className="font-mono text-lg font-black text-base-100">
                        {formatDecimal(post.ratingHours)} h
                      </p>
                    </div>
                  )}
                  {post.ratingOverall != null && (
                    <div>
                      <p className="gh-label">Nota general</p>
                      <p className="font-mono text-lg font-black text-amber-300">
                        {post.ratingOverall}/10
                      </p>
                    </div>
                  )}
                  <p className="text-[11px] text-base-500 sm:col-span-3">
                    Opinion personal de quien lo consiguió. No sustituye a los datos verificados de la
                    ficha del juego.
                  </p>
                </div>
              )}

            <RichBody text={post.body} className="mt-5" />

            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-base-700 pt-4">
              <VoteButton
                targetType="post"
                targetId={post.id}
                count={post.votesCount}
                voted={post.votedByMe > 0}
                isLoggedIn={Boolean(user)}
                loginHref={loginHref}
              />
              <span className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] text-base-500">
                <IconMessage size={13} />
                <span className="font-mono">{post.commentsCount}</span> comentarios
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] text-base-500">
                <IconEye size={13} />
                <span className="font-mono">{post.viewsCount}</span> visitas
              </span>

              <div className="ml-auto flex items-center gap-1.5">
                {isAuthor && (
                  <Link href={`/comunidad/${post.id}/editar`} className="gh-btn gh-btn-ghost text-xs">
                    Editar
                  </Link>
                )}
                {!isAuthor && user && (
                  <ReportButton
                    targetType="post"
                    targetId={post.id}
                    isLoggedIn={Boolean(user)}
                    loginHref={loginHref}
                  />
                )}
                {canDelete && (
                  <form action={removePost}>
                    <input type="hidden" name="id" value={post.id} />
                    <button type="submit" className="gh-btn gh-btn-danger text-xs">
                      <IconTrash size={13} />
                      <span className="sr-only sm:not-sr-only">Eliminar</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Comentarios */}
          <section id="comentarios" className="mt-8 scroll-mt-20">
            <SectionHeading
              title={`Comentarios (${comments.length})`}
              description="Puedes responder a cualquier comentario."
              icon={<IconMessage size={16} className="text-accent-400" />}
            />
            <div className="space-y-4">
              <CommentList
                comments={comments}
                postId={post.id}
                currentUserId={user?.id ?? null}
                viewerIsStaff={viewerIsStaff}
                isLoggedIn={Boolean(user)}
                loginHref={loginHref}
              />
              <CommentForm
                postId={post.id}
                isLoggedIn={Boolean(user)}
                loginHref={loginHref}
                action={addComment}
              />
            </div>
          </section>
        </article>

        {/* Lateral */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {post.gameSlug && post.gameTitle && (
            <Link href={`/juegos/${post.gameSlug}`} className="gh-card block p-4 transition-colors hover:border-accent-500/40">
              <p className="gh-label">Juego relacionado</p>
              <p className="text-sm font-bold text-base-100">{post.gameTitle}</p>
              <p className="mt-1 text-[11px] text-accent-300">Ver ficha, trofeos y guía →</p>
            </Link>
          )}

          {related.length > 0 && (
            <div>
              <p className="gh-label mb-2">Sobre el mismo juego</p>
              <ul className="space-y-2">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/comunidad/${r.id}`}
                      className="gh-card block p-3 transition-colors hover:border-accent-500/40"
                    >
                      <p className="line-clamp-2 text-[12.5px] font-semibold text-base-100">
                        {r.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-base-500">
                        {r.displayName ?? r.username} · {timeAgo(r.createdAt)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="flex items-start gap-2 text-[11px] leading-relaxed text-base-500">
            <IconFlag size={13} className="mt-0.5 shrink-0" />
            ¿Ves algo que no cuadra? Denúncialo con el botón de la bandera. Un administrador lo
            revisará.
          </p>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <SectionHeading
            title="Más sobre este juego"
            href={`/comunidad?juego=${post.gameSlug}`}
            hrefLabel="Ver todo"
          />
          <div className="grid gap-3 md:grid-cols-3">
            {related.map((r) => (
              <PostCard key={r.id} post={r} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}