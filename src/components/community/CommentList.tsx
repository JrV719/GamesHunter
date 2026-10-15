import Link from "next/link";
import { Avatar } from "@/components/community/PostCard";
import { RichBody } from "@/components/community/RichBody";
import { VoteButton, ReportButton } from "@/components/community/VoteButton";
import { removeComment } from "@/app/comunidad/actions";
import { timeAgo } from "@/lib/utils";
import { IconTrash, IconEdit, IconMessage } from "@/components/ui/Icon";
import type { CommentRow } from "@/lib/community";

/**
 * Lista de comentarios de una publicación.
 *
 * Solo se admiten dos niveles: las respuestas cuelgan del comentario raíz. El
 * borrado es del autor o de quien tenga rol de moderación; el botón se oculta
 * al resto, pero la Server Action vuelve a comprobarlo igualmente.
 */
export function CommentList({
  comments,
  postId,
  currentUserId,
  viewerIsStaff,
  isLoggedIn,
  loginHref,
}: {
  comments: CommentRow[];
  postId: string;
  currentUserId: string | null;
  viewerIsStaff: boolean;
  isLoggedIn: boolean;
  loginHref: string;
}) {
  if (comments.length === 0) {
    return (
      <p className="gh-card px-4 py-8 text-center text-sm text-base-500">
        Todavía no hay comentarios. Sé la primera persona en responder.
      </p>
    );
  }

  const roots = comments.filter((c) => !c.parentId);
  const childrenOf = (id: string) => comments.filter((c) => c.parentId === id);

  return (
    <ul className="space-y-3">
      {roots.map((c) => (
        <li key={c.id}>
          <CommentItem
            comment={c}
            postId={postId}
            currentUserId={currentUserId}
            viewerIsStaff={viewerIsStaff}
            isLoggedIn={isLoggedIn}
            loginHref={loginHref}
          />
          {childrenOf(c.id).length > 0 && (
            <ul className="mt-2 space-y-2 border-l-2 border-base-700 pl-3 sm:pl-4">
              {childrenOf(c.id).map((child) => (
                <li key={child.id}>
                  <CommentItem
                    comment={child}
                    postId={postId}
                    currentUserId={currentUserId}
                    viewerIsStaff={viewerIsStaff}
                    isLoggedIn={isLoggedIn}
                    loginHref={loginHref}
                    compact
                  />
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

function CommentItem({
  comment,
  postId,
  currentUserId,
  viewerIsStaff,
  isLoggedIn,
  loginHref,
  compact = false,
}: {
  comment: CommentRow;
  postId: string;
  currentUserId: string | null;
  viewerIsStaff: boolean;
  isLoggedIn: boolean;
  loginHref: string;
  compact?: boolean;
}) {
  const isAuthor = currentUserId === comment.userId;
  const canDelete = isAuthor || viewerIsStaff;
  const isStaffAuthor = comment.authorRole === "admin" || comment.authorRole === "moderator";

  return (
    <article
      id={comment.id}
      className={`gh-card p-3 ${compact ? "bg-base-850/60" : ""} ${
        comment.status !== "published" ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-2.5">
        <Link href={`/usuarios/${comment.username}`} className="shrink-0">
          <Avatar name={comment.displayName ?? comment.username} size={compact ? 24 : 28} />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
            <Link
              href={`/usuarios/${comment.username}`}
              className="font-semibold text-base-200 hover:text-accent-300"
            >
              {comment.displayName ?? comment.username}
            </Link>
            {isStaffAuthor && (
              <span className="gh-chip border-accent-500/30 bg-accent-500/10 text-[9px] text-accent-300">
                {comment.authorRole === "admin" ? "Admin" : "Moderación"}
              </span>
            )}
            <span className="text-base-500">·</span>
            <time className="text-base-500" dateTime={comment.createdAt}>
              {timeAgo(comment.createdAt)}
            </time>
            {comment.editedAt && <span className="text-base-600">· editado</span>}
          </div>

          <RichBody text={comment.body} className="mt-1.5" />

          <div className="mt-2 flex flex-wrap items-center gap-1">
            <VoteButton
              targetType="comment"
              targetId={comment.id}
              count={comment.votesCount}
              voted={comment.votedByMe > 0}
              isLoggedIn={isLoggedIn}
              loginHref={loginHref}
            />
            <a
              href={`#responder-${comment.id}`}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-base-500 transition-colors hover:bg-base-750 hover:text-base-300"
            >
              <IconMessage size={12} /> Responder
            </a>
            {!isAuthor && isLoggedIn && (
              <ReportButton
                targetType="comment"
                targetId={comment.id}
                isLoggedIn={isLoggedIn}
                loginHref={loginHref}
              />
            )}
            {canDelete && (
              <form action={removeComment} className="ml-auto">
                <input type="hidden" name="id" value={comment.id} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-base-500 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                  title="Eliminar comentario"
                >
                  <IconTrash size={12} /> Eliminar
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/** Formulario para responder, reutilizado en raíz y en respuestas. */
export function CommentForm({
  postId,
  parentId,
  isLoggedIn,
  loginHref,
  action,
  autoFocus = false,
}: {
  postId: string;
  parentId?: string | null;
  isLoggedIn: boolean;
  loginHref: string;
  action: (fd: FormData) => void | Promise<void>;
  autoFocus?: boolean;
}) {
  if (!isLoggedIn) {
    return (
      <p className="gh-card px-4 py-5 text-center text-[13px] text-base-400">
        <Link href={loginHref} className="gh-link font-semibold">
          Inicia sesión
        </Link>{" "}
        para comentar.
      </p>
    );
  }

  return (
    <form action={action} className="gh-card space-y-2 p-3" id={parentId ? `responder-${parentId}` : undefined}>
      <input type="hidden" name="postId" value={postId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <label className="sr-only" htmlFor={parentId ? `body-${parentId}` : "body"}>
        Tu comentario
      </label>
      <textarea
        id={parentId ? `body-${parentId}` : "body"}
        name="body"
        required
        rows={parentId ? 2 : 4}
        autoFocus={autoFocus}
        maxLength={4000}
        placeholder={
          parentId ? "Escribe tu respuesta..." : "Comparte tu experiencia, pide ayuda o responde..."
        }
        className="gh-input resize-y text-[13px]"
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-base-500">Máximo 4000 caracteres.</p>
        <button type="submit" className="gh-btn gh-btn-primary text-xs">
          {parentId ? "Responder" : "Comentar"}
        </button>
      </div>
    </form>
  );
}

/** Botón de editar publicación, sólo para autor o moderación. */
export function EditPostLink({ postId }: { postId: string }) {
  return (
    <Link href={`/comunidad/${postId}/editar`} className="gh-btn gh-btn-ghost text-xs">
      <IconEdit size={13} /> Editar
    </Link>
  );
}