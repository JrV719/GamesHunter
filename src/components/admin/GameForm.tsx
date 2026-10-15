import type { Platform, Category, Developer } from "@/lib/db-types";

type Defaults = {
  id?: string;
  title?: string;
  summary?: string;
  developerId?: string;
  releaseDate?: string;
  status?: string;
  dataStatus?: string;
  platformIds?: string[];
  categoryIds?: string[];
};

/**
 * Formulario reutilizable para crear y editar juegos.
 * `action` es una Server Action definida en la página que lo usa.
 */
export function GameForm({
  platforms,
  categories,
  developers,
  action,
  defaults = {},
  deleteAction,
}: {
  platforms: Platform[];
  categories: Category[];
  developers: Developer[];
  action: (formData: FormData) => Promise<void>;
  defaults?: Defaults;
  deleteAction?: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="space-y-4">
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className="gh-label">
            Título *
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={defaults.title ?? ""}
            className="gh-input"
            placeholder="God of War Ragnarök"
          />
        </div>
        <div>
          <label htmlFor="developerId" className="gh-label">
            Desarrolladora *
          </label>
          <select
            id="developerId"
            name="developerId"
            required
            defaultValue={defaults.developerId ?? ""}
            className="gh-input"
          >
            <option value="">Selecciona...</option>
            {developers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="releaseDate" className="gh-label">
            Fecha de lanzamiento
          </label>
          <input
            id="releaseDate"
            name="releaseDate"
            type="date"
            defaultValue={defaults.releaseDate ?? ""}
            className="gh-input"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="status" className="gh-label">
              Estado
            </label>
            <select
              id="status"
              name="status"
              defaultValue={defaults.status ?? "draft"}
              className="gh-input"
            >
              <option value="draft">Borrador</option>
              <option value="upcoming">Próximamente</option>
              <option value="published">Publicado</option>
              <option value="archived">Archivado</option>
            </select>
            <p className="mt-1 text-[10px] leading-relaxed text-base-500">
              Sólo «Publicado» aparece en el catálogo, la búsqueda y el sitemap. «Próximamente» deja el
              juego preparado pero sin mostrarlo al público.
            </p>
          </div>
          <div>
            <label htmlFor="dataStatus" className="gh-label">
              Estado del dato
            </label>
            <select
              id="dataStatus"
              name="dataStatus"
              defaultValue={defaults.dataStatus ?? "provisional"}
              className="gh-input"
            >
              <option value="verified">Verificado</option>
              <option value="provisional">Provisional</option>
              <option value="demo">Demo</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="summary" className="gh-label">
          Resumen (una o dos frases)
        </label>
        <textarea
          id="summary"
          name="summary"
          rows={2}
          defaultValue={defaults.summary ?? ""}
          className="gh-input resize-y"
          placeholder="Aparece en las tarjetas y en el meta description."
        />
      </div>

      <div>
        <label htmlFor="description" className="gh-label">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={defaults.summary ?? ""}
          className="gh-input resize-y"
          placeholder="Descripción más larga de la ficha."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="gh-label">Plataformas</legend>
          <div className="space-y-1">
            {platforms.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-2 text-[13px] text-base-300"
              >
                <input
                  type="checkbox"
                  name="platformIds"
                  value={p.id}
                  defaultChecked={defaults.platformIds?.includes(p.id)}
                  className="accent-[var(--color-accent-500)]"
                />
                {p.name}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="gh-label">Categorías (la primera es la principal)</legend>
          <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
            {categories.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-2 text-[13px] text-base-300"
              >
                <input
                  type="checkbox"
                  name="categoryIds"
                  value={c.id}
                  defaultChecked={defaults.categoryIds?.includes(c.id)}
                  className="accent-[var(--color-accent-500)]"
                />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-base-700 pt-4">
        <button type="submit" className="gh-btn gh-btn-primary text-xs">
          {defaults.id ? "Guardar cambios" : "Crear juego"}
        </button>
        {defaults.id && (
          <a href="/admin/juegos" className="gh-btn gh-btn-ghost text-xs">
            Cancelar
          </a>
        )}
        {defaults.id && deleteAction && (
          <form action={deleteAction} className="ml-auto">
            <input type="hidden" name="id" value={defaults.id} />
            <button type="submit" className="gh-btn gh-btn-danger text-xs">
              Eliminar juego
            </button>
          </form>
        )}
      </div>
    </form>
  );
}
