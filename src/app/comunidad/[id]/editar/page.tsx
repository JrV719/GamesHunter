import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canEditUserContent } from "@/lib/permissions";
import { getPostById, listTopics } from "@/lib/community";
import { PostForm } from "@/components/community/PostForm";
import { savePostEdit } from "@/app/comunidad/actions";
import { all } from "@/lib/db";
import { IconChat } from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Editar publicación", robots: { index: false } };

type RouteParams = Promise<{ id: string }>;
type SearchParams = Promise<{ error?: string }>;

async function getGameOptions() {
  return all<{ id: string; title: string; slug: string; subtitle: string | null }>(
    `SELECT g.id, g.title, g.slug, d.name AS subtitle
       FROM games g JOIN developers d ON d.id = g.developer_id
      WHERE g.status IN ('published','upcoming')
      ORDER BY g.title`,
  );
}

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: RouteParams;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?siguiente=${encodeURIComponent(`/comunidad/${id}/editar`)}`);

  const post = await getPostById(id, { viewerId: user.id, viewerIsStaff: true });
  if (!post) notFound();

  // El chequeo real: sólo el autor o un moderador pueden entrar aquí.
  if (!canEditUserContent(user, post.userId)) {
    return (
      <div className="gh-container max-w-2xl py-12">
        <div className="gh-card px-6 py-12 text-center">
          <h1 className="text-lg font-bold text-base-100">No puedes editar esta publicación</h1>
          <p className="mt-2 text-sm text-base-400">
            Sólo su autor y los administradores tienen permiso para cambiarla.
          </p>
          <Link href={`/comunidad/${id}`} className="gh-btn gh-btn-ghost mt-5 text-xs">
            Volver a la publicación
          </Link>
        </div>
      </div>
    );
  }

  const [topics, games] = await Promise.all([listTopics(), getGameOptions()]);

  return (
    <div className="gh-container max-w-3xl py-8">
      <nav aria-label="Ruta" className="mb-4 text-[11px] text-base-500">
        <Link href="/comunidad" className="gh-link">
          Comunidad
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href={`/comunidad/${id}`} className="gh-link line-clamp-1">
          {post.title}
        </Link>
        <span aria-hidden="true"> / </span>
        <span>Editar</span>
      </nav>

      <header className="mb-6">
        <h1 className="flex items-center gap-2.5 text-2xl font-black tracking-tight text-base-100">
          <IconChat size={21} className="text-accent-400" />
          Editar publicación
        </h1>
        <p className="mt-1.5 text-sm text-base-400">
          Los cambios se ven al instante. Queda constancia de que la publicación fue editada.
        </p>
      </header>

      <div className="gh-card p-5">
        <PostForm
          action={savePostEdit}
          topics={topics.map((t) => ({ id: t.id, name: t.name }))}
          games={games}
          defaults={{
            id: post.id,
            title: post.title,
            body: post.body,
            kind: post.kind,
            topicId: post.topicId ?? "",
            gameId: post.gameId ?? "",
            ratingDifficulty: post.ratingDifficulty,
            ratingHours: post.ratingHours,
            ratingOverall: post.ratingOverall,
          }}
          submitLabel="Guardar cambios"
          error={sp.error}
          showKind={false}
        />
      </div>
    </div>
  );
}