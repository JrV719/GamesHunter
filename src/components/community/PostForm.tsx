import Link from "next/link";
import { GamePicker, type GameOption } from "@/components/community/GamePicker";
import { POST_KINDS, POST_KIND_LABELS, COMMUNITY_LIMITS, type PostKind } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type TopicOption = { id: string; name: string };

/**
 * Formulario de publicación. Lo usan tanto «nueva publicación» como «editar»,
 * de modo que las reglas de longitud y los campos por tipo de publicación
 * viven en un solo sitio.
 */
export function PostForm({
  action,
  topics,
  games,
  defaults,
  submitLabel = "Publicar",
  error,
  showKind = true,
}: {
  action: (formData: FormData) => void | Promise<void>;
  topics: TopicOption[];
  games: GameOption[];
  defaults?: {
    id: string;
    title: string;
    body: string;
    kind: string;
    topicId: string;
    gameId: string;
    ratingDifficulty: number | null;
    ratingHours: number | null;
    ratingOverall: number | null;
  };
  submitLabel?: string;
  error?: string | null;
  showKind?: boolean;
}) {
  const kind = (defaults?.kind ?? "post") as PostKind;
  const isOpinion = kind === "opinion";

  return (
    <form action={action} className="space-y-4">
      {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/[0.07] px-4 py-2.5 text-[13px] text-rose-200"
        >
          {error}
        </p>
      )}

      {showKind && (
        <div>
          <span className="gh-label">Tipo de publicación</span>
          <div className="flex flex-wrap gap-1.5">
            {POST_KINDS.map((k) => (
              <label key={k} className="cursor-pointer">
                <input
                  type="radio"
                  name="kind"
                  value={k}
                  defaultChecked={kind === k}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "gh-chip cursor-pointer border-base-700 bg-base-850 text-base-300 transition-colors peer-checked:border-accent-500/50 peer-checked:bg-accent-500/15 peer-checked:text-accent-300 peer-focus-visible:ring-2 peer-focus-visible:ring-accent-400",
                  )}
                >
                  {POST_KIND_LABELS[k]}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-base-500">
            Las <strong className="text-base-300">opiniones</strong> también se muestran en la ficha del
            juego si lo asocias a uno.
          </p>
        </div>
      )}
      {!showKind && <input type="hidden" name="kind" value={kind} />}

      <div>
        <label className="gh-label" htmlFor="title">
          Título
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={defaults?.title ?? ""}
          minLength={COMMUNITY_LIMITS.postTitleMin}
          maxLength={COMMUNITY_LIMITS.postTitleMax}
          placeholder="Resume tu publicación en una frase"
          className="gh-input"
        />
      </div>

      <div>
        <label className="gh-label" htmlFor="body">
          Contenido
        </label>
        <textarea
          id="body"
          name="body"
          required
          defaultValue={defaults?.body ?? ""}
          rows={10}
          minLength={COMMUNITY_LIMITS.postBodyMin}
          maxLength={COMMUNITY_LIMITS.postBodyMax}
          placeholder="Cuéntalo con calma. Si pones un trofeo perfecto, avisa antes con «SPOILER»."
          className="gh-input resize-y leading-relaxed"
        />
        <p className="mt-1 text-[11px] text-base-500">
          Entre {COMMUNITY_LIMITS.postBodyMin} y {COMMUNITY_LIMITS.postBodyMax} caracteres. Los saltos
          de línea en blanco separan párrafos y las direcciones se convierten en enlace.
        </p>
      </div>

      {/* Campos propios de una opinión */}
      {isOpinion && (
        <fieldset className="rounded-xl border border-base-700 bg-base-850/50 p-4">
          <legend className="gh-label">Tu experiencia con el platino</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="gh-label" htmlFor="ratingDifficulty">
                Dificultad (1-10)
              </label>
              <input
                id="ratingDifficulty"
                name="ratingDifficulty"
                type="number"
                min={1}
                max={10}
                defaultValue={defaults?.ratingDifficulty ?? ""}
                className="gh-input"
                placeholder="7"
              />
            </div>
            <div>
              <label className="gh-label" htmlFor="ratingHours">
                Horas hasta el platino
              </label>
              <input
                id="ratingHours"
                name="ratingHours"
                type="number"
                min={0}
                step="0.5"
                defaultValue={defaults?.ratingHours ?? ""}
                className="gh-input"
                placeholder="38"
              />
            </div>
            <div>
              <label className="gh-label" htmlFor="ratingOverall">
                Nota general (1-10)
              </label>
              <input
                id="ratingOverall"
                name="ratingOverall"
                type="number"
                min={1}
                max={10}
                defaultValue={defaults?.ratingOverall ?? ""}
                className="gh-input"
                placeholder="8"
              />
            </div>
          </div>
          <p className="mt-2 text-[11px] text-base-500">
            Son tus datos personales, no los datos verificados de la ficha. Ayudan a saber lo que le
            costó a otra persona.
          </p>
        </fieldset>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="gh-label" htmlFor="topicId">
            Tema
          </label>
          <select
            id="topicId"
            name="topicId"
            defaultValue={defaults?.topicId ?? ""}
            className="gh-input"
          >
            <option value="">Sin tema</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="gh-label">Juego relacionado</span>
          <GamePicker
            name="gameId"
            games={games}
            initial={
              games.find((g) => g.id === defaults?.gameId) ??
              null
            }
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-base-700 pt-4">
        <Link href="/comunidad" className="gh-btn gh-btn-ghost text-xs">
          Cancelar
        </Link>
        <button type="submit" className="gh-btn gh-btn-primary text-xs">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}