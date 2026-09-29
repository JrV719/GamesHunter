import { revalidatePath } from "next/cache";
import { all, one, run, runMany, type SqlParam } from "@/lib/db";
import { newId } from "@/lib/queries/guides";
import { slugify } from "@/lib/utils";
import { IconPlus, IconTrash, IconEdit, IconExternal } from "@/components/ui/Icon";

export const metadata = { title: "Administrar fuentes", robots: { index: false } };

const POLICIES = [
  { value: "enlace", label: "Solo enlace (no se reproduce contenido)" },
  { value: "resumen", label: "Datos objetivos (recuentos, fechas, nombres)" },
  { value: "texto_parcial", label: "Fragmentos breves con atribución" },
  { value: "desconocido", label: "Sin verificar" },
];

export default function AdminSourcesPage() {
  const sources = all<{
    id: string;
    slug: string;
    name: string;
    homepage: string | null;
    usagePolicy: string;
    allowsCopy: boolean;
    notes: string | null;
    isActive: boolean;
    sortOrder: number;
    usedIn: number;
  }>(
    `SELECT gs.*, (SELECT COUNT(*) FROM data_provenance dp WHERE dp.source_id = gs.id) AS usedIn
       FROM guide_sources gs ORDER BY gs.sort_order, gs.name`,
  );

  async function createSource(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;
    const slug = slugify(name);
    run(
      `INSERT INTO guide_sources (id, slug, name, homepage, usage_policy, allows_copy, notes, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        newId("src"),
        slug,
        name,
        String(formData.get("homepage") ?? "").trim() || null,
        String(formData.get("usagePolicy") ?? "enlace"),
        formData.get("allowsCopy") ? 1 : 0,
        String(formData.get("notes") ?? "").trim() || null,
        Number(formData.get("sortOrder") ?? 99),
      ],
    );
    revalidatePath("/admin/fuentes");
    revalidatePath("/acerca-de");
  }

  async function updateSource(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    run(
      `UPDATE guide_sources SET name = ?, homepage = ?, usage_policy = ?, allows_copy = ?,
              notes = ?, is_active = ?, sort_order = ? WHERE id = ?`,
      [
        String(formData.get("name") ?? "").trim(),
        String(formData.get("homepage") ?? "").trim() || null,
        String(formData.get("usagePolicy") ?? "enlace"),
        formData.get("allowsCopy") ? 1 : 0,
        String(formData.get("notes") ?? "").trim() || null,
        formData.get("isActive") ? 1 : 0,
        Number(formData.get("sortOrder") ?? 0),
        id,
      ],
    );
    revalidatePath("/admin/fuentes");
    revalidatePath("/acerca-de");
  }

  async function deleteSource(formData: FormData) {
    "use server";
    run("DELETE FROM guide_sources WHERE id = ?", [String(formData.get("id") ?? "")]);
    revalidatePath("/admin/fuentes");
  }

  return (
    <div className="space-y-5">
      <div className="gh-card p-5">
        <h2 className="gh-section-title mb-3">Añadir fuente de datos</h2>
        <form action={createSource} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="gh-label">Nombre *</label>
            <input name="name" required className="gh-input" placeholder="Nombre de la fuente" />
          </div>
          <div>
            <label className="gh-label">URL</label>
            <input name="homepage" type="url" className="gh-input" placeholder="https://" />
          </div>
          <div>
            <label className="gh-label">Política de uso</label>
            <select name="usagePolicy" className="gh-input">
              {POLICIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="gh-label">Orden</label>
            <input name="sortOrder" type="number" defaultValue={99} className="gh-input" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="gh-label">Notas de uso</label>
            <input
              name="notes"
              className="gh-input"
              placeholder="Qué datos se toman de aquí y con qué política."
            />
          </div>
          <div className="flex items-end gap-4 pb-1">
            <label className="flex items-center gap-1.5 text-[12px] text-base-300">
              <input
                type="checkbox"
                name="allowsCopy"
                className="accent-[var(--color-accent-500)]"
              />
              Permite reutilizar texto
            </label>
            <button type="submit" className="gh-btn gh-btn-primary text-xs">
              <IconPlus size={14} /> Añadir
            </button>
          </div>
        </form>
      </div>

      <ul className="space-y-2">
        {sources.map((s) => (
          <li key={s.id} className="gh-card p-4">
            <form action={updateSource} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input type="hidden" name="id" value={s.id} />
              <div>
                <label className="gh-label">Nombre</label>
                <input name="name" defaultValue={s.name} className="gh-input" />
              </div>
              <div>
                <label className="gh-label">URL</label>
                <input name="homepage" defaultValue={s.homepage ?? ""} className="gh-input" />
              </div>
              <div>
                <label className="gh-label">Política</label>
                <select name="usagePolicy" defaultValue={s.usagePolicy} className="gh-input">
                  {POLICIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="gh-label">Orden</label>
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={s.sortOrder}
                  className="gh-input"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="gh-label">Notas</label>
                <input name="notes" defaultValue={s.notes ?? ""} className="gh-input" />
              </div>
              <div className="flex items-end gap-3 pb-1">
                <label className="flex items-center gap-1.5 text-[12px] text-base-300">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={s.isActive}
                    className="accent-[var(--color-accent-500)]"
                  />
                  Activa
                </label>
                <label className="flex items-center gap-1.5 text-[12px] text-base-300">
                  <input
                    type="checkbox"
                    name="allowsCopy"
                    defaultChecked={s.allowsCopy}
                    className="accent-[var(--color-accent-500)]"
                  />
                  Permite texto
                </label>
                <button type="submit" className="gh-btn gh-btn-primary text-xs">
                  <IconEdit size={13} /> Guardar
                </button>
              </div>
            </form>
            <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-base-700 pt-2">
              <span className="text-[11px] text-base-500">
                Usada en {s.usedIn} registro{s.usedIn === 1 ? "" : "s"} de trazabilidad · slug{" "}
                <code className="font-mono">{s.slug}</code>
              </span>
              {s.homepage && (
                <a
                  href={s.homepage}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="gh-link inline-flex items-center gap-1 text-[11px]"
                >
                  Abrir <IconExternal size={10} />
                </a>
              )}
              <form action={deleteSource} className="ml-auto">
                <input type="hidden" name="id" value={s.id} />
                <button type="submit" className="gh-btn gh-btn-danger text-[11px]">
                  <IconTrash size={12} /> Eliminar
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
