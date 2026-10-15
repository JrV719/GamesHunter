import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listTopics } from "@/lib/community";
import { PostForm } from "@/components/community/PostForm";
import { submitPost } from "@/app/comunidad/actions";
import { all } from "@/lib/db";
import { POST_KINDS, type PostKind } from "@/lib/constants";
import { IconChat } from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nueva publicación",
  robots: { index: false },
};

type SearchParams = Promise<{ error?: string; tipo?: string }>;

/** Listado ligero de juegos para el selector. */
async function getGameOptions() {
  return all<{ id: string; title: string; slug: string; subtitle: string | null }>(
    `SELECT g.id, g.title, g.slug, d.name AS subtitle
       FROM games g JOIN developers d ON d.id = g.developer_id
      WHERE g.status IN ('published','upcoming')
      ORDER BY g.title`,
  );
}

export default async function NewPostPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?siguiente=/comunidad/nueva");

  const [topics, games] = await Promise.all([listTopics(), getGameOptions()]);

  return (
    <div className="gh-container max-w-3xl py-8">
      <nav aria-label="Ruta" className="mb-4 text-[11px] text-base-500">
        <Link href="/comunidad" className="gh-link">
          Comunidad
        </Link>
        <span aria-hidden="true"> / </span>
        <span>Nueva publicación</span>
      </nav>

      <header className="mb-6">
        <h1 className="flex items-center gap-2.5 text-2xl font-black tracking-tight text-base-100">
          <IconChat size={21} className="text-accent-400" />
          Nueva publicación
        </h1>
        <p className="mt-1.5 text-sm text-base-400">
          Cuéntale a la comunidad tu platino, pregunta por un trofeo o comparte un consejo. Si lo
          asocias a un juego, también aparecerá en su ficha.
        </p>
      </header>

      <div className="gh-card p-5">
        <PostForm
          action={submitPost}
          topics={topics.map((t) => ({ id: t.id, name: t.name }))}
          games={games}
          defaults={{
            id: "",
            title: "",
            body: "",
            kind: sp.tipo && POST_KINDS.includes(sp.tipo as PostKind) ? sp.tipo : "post",
            topicId: "",
            gameId: "",
            ratingDifficulty: null,
            ratingHours: null,
            ratingOverall: null,
          }}
          submitLabel="Publicar"
          error={sp.error}
        />
      </div>

      <p className="mt-4 text-center text-[11px] text-base-500">
        Publicas como{" "}
        <Link href={`/usuarios/${user.username}`} className="gh-link font-semibold">
          {user.displayName ?? user.username}
        </Link>
        . Puedes editar o borrar tu publicación cuando quieras.
      </p>
    </div>
  );
}