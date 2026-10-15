import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { getCommunityStats, listPosts, listTopics } from "@/lib/community";
import { PostCard } from "@/components/community/PostCard";
import { CommunityPagination } from "@/components/community/CommunityPagination";
import { EmptyState, SectionHeading } from "@/components/ui/primitives";
import { IconChat, IconEdit, IconMessage, IconPlus, IconQuote, IconSearch, IconUsers } from "@/components/ui/Icon";
import { POST_KINDS, POST_KIND_LABELS, POST_SORTS, POST_SORT_LABELS, type PostKind, type PostSort } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { one } from "@/lib/db";

/** Nombre del juego para etiquetar el filtro por juego. */
async function getGameName(slug: string): Promise<string | null> {
  const row = await one<{ title: string }>("SELECT title FROM games WHERE slug = ?", [slug]);
  return row?.title ?? null;
}

// La comunidad cambia constantly: se renderiza en cada petición.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Comunidad",
  description:
    "Foro de la comunidad de GamesHunter: platinos, trofeos, dificultad, tiempos y consejos. Comparte tu experiencia y pregunta lo que necesites.",
  alternates: { canonical: "/comunidad" },
  openGraph: {
    title: "Comunidad · GamesHunter",
    description: "Platinos, trofeos, dificultad y consejos compartidos por la comunidad.",
  },
};

type SearchParams = Promise<{
  q?: string;
  tema?: string;
  tipo?: string;
  orden?: string;
  pagina?: string;
  juego?: string;
  error?: string;
  borrado?: string;
}>;

export default async function CommunityPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;

  const q = (sp.q ?? "").trim();
  const topic = sp.tema || undefined;
  const sort = (POST_SORTS.includes(sp.orden as PostSort) ? sp.orden : "recientes") as PostSort;
  const kind = POST_KINDS.includes(sp.tipo as PostKind) ? (sp.tipo as PostKind) : undefined;
  const game = sp.juego || undefined;
  const page = Math.max(1, Number(sp.pagina ?? 1) || 1);

  const user = await getCurrentUser();
  const viewerIsStaff = isStaff(user);

  const [topics, stats, result, gameName] = await Promise.all([
    listTopics(),
    getCommunityStats(),
    listPosts({ q, topic, kind, sort, page, game, viewerIsStaff, viewerId: user?.id ?? null }),
    game ? getGameName(game) : Promise.resolve(null),
  ]);

  return (
    <div className="gh-container py-8">
      {/* Cabecera */}
      <header className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2.5 text-2xl font-black tracking-tight text-base-100">
              <IconChat size={22} className="text-accent-400" />
              Comunidad
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-base-400">
              El sitio de los que buscan el platino: rutas, trofeos concretos, tiempos reales
              y avisos. Todo lo que escriben los usuarios es opinión suya: los datos verificados están
              en la ficha de cada juego.
            </p>
          </div>

          {user ? (
            <Link href="/comunidad/nueva" className="gh-btn gh-btn-primary text-xs">
              <IconPlus size={14} /> Nueva publicación
            </Link>
          ) : (
            <Link href="/login?siguiente=/comunidad/nueva" className="gh-btn gh-btn-primary text-xs">
              <IconPlus size={14} /> Únete para publicar
            </Link>
          )}
        </div>

        {/* Métricas */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Publicaciones", value: stats.posts, icon: IconMessage },
            { label: "Opiniones", value: stats.opinions, icon: IconQuote },
            { label: "Comentarios", value: stats.comments, icon: IconChat },
            { label: "Miembros", value: stats.members, icon: IconUsers },
          ].map((s) => (
            <div key={s.label} className="gh-card p-3.5">
              <s.icon size={15} className="text-accent-400" />
              <p className="mt-1.5 font-mono text-xl font-black text-base-100">{s.value}</p>
              <p className="text-[11px] text-base-500">{s.label}</p>
            </div>
          ))}
        </div>
      </header>

      {(sp.error || sp.borrado) && (
        <p
          role="alert"
          className={cn(
            "mb-6 rounded-xl border px-4 py-2.5 text-sm",
            sp.error
              ? "border-rose-500/30 bg-rose-500/[0.07] text-rose-200"
              : "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-200",
          )}
        >
          {sp.error ? sp.error : "Contenido eliminado correctamente."}
        </p>
      )}

      {/* Filtros */}
      <div className="gh-card mb-5 p-3.5">
        <form action="/comunidad" method="get" className="flex flex-wrap items-end gap-2.5">
          <div className="relative min-w-[14rem] flex-1">
            <label className="gh-label" htmlFor="q">
              Buscar
            </label>
            <IconSearch
              size={14}
              className="pointer-events-none absolute left-3 top-[34px] text-base-400"
            />
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Buscar en títulos y textos..."
              className="gh-input pl-9"
            />
          </div>
          <div className="w-40">
            <label className="gh-label" htmlFor="tema">
              Tema
            </label>
            <select id="tema" name="tema" defaultValue={topic ?? ""} className="gh-input">
              <option value="">Todos</option>
              {topics.map((t) => (
                <option key={t.id} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="gh-label" htmlFor="tipo">
              Tipo
            </label>
            <select id="tipo" name="tipo" defaultValue={kind ?? ""} className="gh-input">
              <option value="">Todos</option>
              {POST_KINDS.map((k) => (
                <option key={k} value={k}>
                  {POST_KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="w-44">
            <label className="gh-label" htmlFor="orden">
              Orden
            </label>
            <select id="orden" name="orden" defaultValue={sort} className="gh-input">
              {POST_SORTS.map((s) => (
                <option key={s} value={s}>
                  {POST_SORT_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="gh-btn gh-btn-ghost h-[38px] text-xs">
            Filtrar
          </button>
          {(q || topic || kind) && (
            <a href="/comunidad" className="gh-btn gh-btn-ghost h-[38px] text-xs">
              Limpiar
            </a>
          )}
        </form>
      </div>

      {/* Temas */}
      {topics.length > 0 && (
        <div className="no-scrollbar -mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">
          <Link
            href="/comunidad"
            className={cn(
              "shrink-0 rounded-xl border px-3 py-2 text-[12px] font-semibold transition-colors",
              !topic
                ? "border-accent-500/50 bg-accent-500/10 text-accent-300"
                : "gh-card text-base-300 hover:border-accent-500/40",
            )}
          >
            Todos los temas
          </Link>
          {topics.map((t) => (
            <Link
              key={t.id}
              href={`/comunidad?tema=${t.slug}`}
              className={cn(
                "shrink-0 rounded-xl border px-3 py-2 text-[12px] font-semibold transition-colors",
                topic === t.slug
                  ? "border-accent-500/50 bg-accent-500/10 text-accent-300"
                  : "gh-card text-base-300 hover:border-accent-500/40",
              )}
            >
              {t.name}
              {t.postCount != null && (
                <span className="ml-1.5 font-mono text-[10px] opacity-60">{t.postCount}</span>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Listado */}
      <SectionHeading
        title={
          gameName
            ? `Publicaciones · ${gameName}`
            : topic
              ? `Publicaciones · ${topics.find((t) => t.slug === topic)?.name ?? ""}`
              : "Publicaciones recientes"
        }
        description={`${result.total} ${result.total === 1 ? "resultado" : "resultados"}`}
        icon={<IconMessage size={16} className="text-accent-400" />}
      />

      {game && (
        <p className="-mt-3 mb-5 text-xs text-base-500">
          Filtrando por juego.{" "}
          <Link href="/comunidad" className="gh-link font-semibold">
            Ver todas las publicaciones
          </Link>
        </p>
      )}

      {result.posts.length === 0 ? (
        <EmptyState
          title="Todavía no hay publicaciones aquí"
          description={
            q || topic || kind
              ? "Prueba a quitar algún filtro o usa otra búsqueda."
              : "Sé la primera persona en abrir un hilo sobre platinos, trofeos o cualquier duda."
          }
          icon={<IconMessage size={22} />}
          action={
            user ? (
              <Link href="/comunidad/nueva" className="gh-btn gh-btn-primary text-xs">
                <IconPlus size={14} /> Crear publicación
              </Link>
            ) : (
              <Link href="/login?siguiente=/comunidad/nueva" className="gh-btn gh-btn-primary text-xs">
                Iniciar sesión
              </Link>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {result.posts.map((p) => (
            <PostCard key={p.id} post={p} currentUserId={user?.id ?? null} />
          ))}
        </div>
      )}

      <CommunityPagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        query={{
          q: q || undefined,
          tema: topic,
          tipo: kind,
          juego: game,
          orden: sort === "recientes" ? undefined : sort,
        }}
      />

      {viewerIsStaff && (
        <p className="mt-8 flex items-center justify-center gap-2 text-xs text-base-500">
          <IconEdit size={13} />
          <Link href="/admin/comunidad" className="gh-link font-semibold">
            Ir a moderar la comunidad
          </Link>
        </p>
      )}
    </div>
  );
}