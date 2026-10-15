import { revalidatePath } from "next/cache";
import Link from "next/link";
import { listUsers, setUserRole, setUserStatus } from "@/lib/auth";
import { requireAdmin } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import { IconUsers } from "@/components/ui/Icon";
import { USER_ROLES } from "@/lib/constants";

export const metadata = { title: "Administrar usuarios", robots: { index: false } };

export default async function AdminUsersPage() {
  const me = await requireAdmin();
  const users = await listUsers();

  async function changeRole(formData: FormData) {
    "use server";
    // La comprobación va DENTRO de la acción, no solo en el layout: una Server
    // Action es un endpoint público y cualquiera puede invocarla con un POST.
    const admin = await requireAdmin();
    const id = String(formData.get("id") ?? "");
    const role = String(formData.get("role") ?? "user");
    if (!USER_ROLES.includes(role as (typeof USER_ROLES)[number])) return;
    // Evita quedarse fuera del panel por error propio.
    if (id === admin.id && role !== "admin") return;
    await setUserRole(id, role);
    revalidatePath("/admin/usuarios");
  }

  async function changeStatus(formData: FormData) {
    "use server";
    const admin = await requireAdmin();
    const id = String(formData.get("id") ?? "");
    if (id === admin.id) return;
    const status = String(formData.get("status") ?? "active");
    if (!["active", "suspended"].includes(status)) return;
    await setUserStatus(id, status);
    revalidatePath("/admin/usuarios");
  }

  return (
    <div className="space-y-5">
      <p className="flex items-center gap-2 text-sm text-base-400">
        <IconUsers size={15} className="text-accent-400" />
        {users.length} usuario{users.length === 1 ? "" : "s"} registrado
        {users.length === 1 ? "" : "s"}
      </p>

      <div className="gh-card overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-[13px]">
          <thead>
            <tr className="border-b border-base-700 text-[10px] uppercase tracking-wider text-base-500">
              <th className="px-4 py-2.5 font-bold">Usuario</th>
              <th className="px-4 py-2.5 font-bold">Correo</th>
              <th className="px-4 py-2.5 font-bold">Platinos</th>
              <th className="px-4 py-2.5 font-bold">Alta</th>
              <th className="px-4 py-2.5 font-bold">Rol</th>
              <th className="px-4 py-2.5 font-bold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-700/60">
            {users.map((u) => (
              <tr key={u.id} className="transition-colors hover:bg-base-850/50">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/admin/usuarios/${u.id}`}
                    className="font-semibold text-base-100 hover:text-accent-300"
                  >
                    {u.displayName ?? u.username}
                    {u.id === me?.id && (
                      <span className="ml-2 text-[10px] text-accent-300">(tú)</span>
                    )}
                  </Link>
                  <p className="text-[11px] text-base-500">@{u.username}</p>
                </td>
                <td className="px-4 py-2.5 text-base-300">{u.email}</td>
                <td className="px-4 py-2.5 font-mono text-base-200">{u.platinas}</td>
                <td className="px-4 py-2.5 text-[11px] text-base-400">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-2.5">
                  <form action={changeRole}>
                    <input type="hidden" name="id" value={u.id} />
                    <select
                      name="role"
                      defaultValue={u.role}
                      className="gh-input w-auto py-1 text-xs"
                    >
                      {USER_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="gh-btn gh-btn-ghost ml-1 py-1 text-[11px]">
                      Guardar
                    </button>
                  </form>
                </td>
                <td className="px-4 py-2.5">
                  <form action={changeStatus}>
                    <input type="hidden" name="id" value={u.id} />
                    <select
                      name="status"
                      defaultValue={u.status}
                      className="gh-input w-auto py-1 text-xs"
                    >
                      <option value="active">Activo</option>
                      <option value="suspended">Suspendido</option>
                    </select>
                    <button
                      type="submit"
                      disabled={u.id === me?.id}
                      className="gh-btn gh-btn-ghost ml-1 py-1 text-[11px] disabled:opacity-40"
                    >
                      Guardar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
