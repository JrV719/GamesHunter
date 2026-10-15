import Link from "next/link";
import { cn, formatDecimal, timeAgo } from "@/lib/utils";
import { Chip } from "@/components/ui/primitives";
import { POST_KIND_LABELS, type PostKind } from "@/lib/constants";
import {
  IconChat,
  IconHeart,
  IconMessage,
  IconPin,
  IconQuote,
  IconQuestion,
} from "@/components/ui/Icon";
import type { PostRow } from "@/lib/community";

const KIND_ICON: Record<string, typeof IconChat> = {
  post: IconChat,
  opinion: IconQuote,
  question: IconQuestion,
  tip: IconChat,
};

/** Tarjeta de publicación: se usa en el foro y en la ficha del juego. */
export function PostCard({
  post,
  currentUserId,
  compact = false,
}: {
  post: PostRow;
  currentUserId?: string | null;
  compact?: boolean;
}) {
  const KindIcon = KIND_ICON[post.kind] ?? IconChat;
  const isStaff = post.authorRole === "admin" || post.authorRole === "moderator";
  const hidden = post.status !== "published";

  return (
    <article
      className={cn(
        "gh-card group relative p-4 transition-colors hover:border-accent-500/35",
        hidden && "opacity-60",
      )}
    >
      {post.isPinned && (
        <span
          className="absolute -top-2 left-3 gh-chip border-accent-500/40 bg-base-800 text-accent-300"
          title="Fijado por un moderador"
        >
          <IconPin size={11} /> Fijado
        </span>
      )}

      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-base-750 text-base-400"
          aria-hidden="true"
        >
          <KindIcon size={15} />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold leading-snug tracking-tight">
            <Link href={`/comunidad/${post.id}`} className="text-base-100 hover:text-accent-300">
              {post.title}
            </Link>
          </h3>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-base-500">
            <Link
              href={`/usuarios/${post.username}`}
              className="font-semibold text-base-300 hover:text-accent-300"
            >
              {post.displayName ?? post.username}
            </Link>
            {isStaff && (
              <span className="gh-chip border-accent-500/30 bg-accent-500/10 text-[9px] text-accent-300">
                {post.authorRole === "admin" ? "Admin" : "Moderación"}
              </span>
            )}
            <span aria-hidden="true">·</span>
            <time dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
            {post.editedAt && (
              <>
                <span aria-hidden="true">·</span>
                <span title="Editado">editado</span>
              </>
            )}
          </div>

          {!compact && (
            <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-base-400">
              {post.body}
            </p>
          )}

          {/* Etiquetas de contexto */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Chip className="border-base-700 bg-base-850 text-[10px] text-base-400">
              {POST_KIND_LABELS[post.kind as PostKind] ?? post.kind}
            </Chip>
            {post.topicName && (
              <Chip className="border-base-700 bg-base-850 text-[10px] text-base-400">
                {post.topicName}
              </Chip>
            )}
            {post.gameSlug && post.gameTitle && (
              <Link href={`/juegos/${post.gameSlug}`} className="inline-flex">
                <Chip
                  className="border-accent-500/25 bg-accent-500/[0.07] text-[10px] text-accent-300 hover:border-accent-500/50"
                  title={`Ver la ficha de ${post.gameTitle}`}
                >
                  {post.gameTitle}
                </Chip>
              </Link>
            )}
            {hidden && (
              <Chip className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-300">
                Oculto para el público
              </Chip>
            )}
          </div>

          {/* Métricas propias de una opinión */}
          {post.kind === "opinion" && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {post.ratingDifficulty != null && (
                <Chip
                  className="border-sky-500/25 bg-sky-500/[0.07] text-[10px] text-sky-300"
                  title="Dificultad del platino según quien lo consiguió"
                >
                  Platino {post.ratingDifficulty}/10
                </Chip>
              )}
              {post.ratingHours != null && (
                <Chip
                  className="border-base-700 bg-base-850 text-[10px] text-base-400"
                  title="Horas jugadas hasta el platino"
                >
                  {formatDecimal(post.ratingHours)} h
                </Chip>
              )}
              {post.ratingOverall != null && (
                <Chip
                  className="border-amber-500/25 bg-amber-500/[0.07] text-[10px] text-amber-300"
                  title="Nota general"
                >
                  {post.ratingOverall}/10
                </Chip>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center gap-4 border-t border-base-700/60 pt-2.5 text-[11px] text-base-500">
            <span className="inline-flex items-center gap-1" title="Me gusta">
              <IconHeart size={13} className={post.votedByMe ? "text-rose-400" : ""} />
              <span className="font-mono">{post.votesCount}</span>
            </span>
            <span className="inline-flex items-center gap-1" title="Comentarios">
              <IconMessage size={13} />
              <span className="font-mono">{post.commentsCount}</span>
            </span>
            {currentUserId === post.userId && (
              <Link href={`/comunidad/${post.id}/editar`} className="ml-auto gh-link font-semibold">
                Editar
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/** Avatar de iniciales, sin imágenes externas. */
export function Avatar({
  name,
  size = 32,
  accent,
}: {
  name: string;
  size?: number;
  accent?: string | null;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: accent ?? "linear-gradient(135deg,#0ea5e9,#7c3aed)",
      }}
      aria-hidden="true"
    >
      {initials || "?"}
    </span>
  );
}