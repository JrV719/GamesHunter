import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, type SessionUser } from "@/lib/auth";

// ============================================================================
// Autorización
// ----------------------------------------------------------------------------
// Estas funciones son la ÚNICA fuente de verdad sobre permisos.
//
// Importa esto en cada Server Action y en cada handler de API. El layout de
// /admin protege la navegación, pero no protege las acciones: una Server Action
// es un endpoint HTTP público que cualquiera puede invocar con un POSTforjado,
// así que el chequeo tiene que repetirse dentro de la propia acción.
// ============================================================================

/** Admin o moderador: puede entrar al panel y moderar contenido. */
export function isStaff(user: SessionUser | null): boolean {
  return user?.role === "admin" || user?.role === "moderator";
}

/** Solo administrador: puede gestionar usuarios, juegos y el resto del panel. */
export function isAdminUser(user: SessionUser | null): boolean {
  return user?.role === "admin";
}

/** Moderador o el propio autor. */
export function canEditUserContent(
  user: SessionUser | null,
  authorId: string,
): boolean {
  if (!user) return false;
  return user.id === authorId || isStaff(user);
}

/** Exige sesión. Redirige al login conservando la URL de destino. */
export async function requireUser(returnTo = ""): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    const next = encodeURIComponent(returnTo || "/comunidad");
    redirect(`/login?siguiente=${next}`);
  }
  return user;
}

/**
 * Exige rol admin o moderador.
 *
 * `redirect()` está tipado como `never`, así que el analizador de control de
 * flujo sabe que, si se supera esta línea, `user` no es `null`.
 */
export async function requireStaff(returnTo = "/admin"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?siguiente=${encodeURIComponent(returnTo)}`);
  }
  if (!isStaff(user)) {
    redirect("/?error=sin-permisos");
  }
  return user;
}

/** Exige rol admin. Para acciones irreversibles (borrar juegos, cambiar roles). */
export async function requireAdmin(returnTo = "/admin"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?siguiente=${encodeURIComponent(returnTo)}`);
  }
  if (!isAdminUser(user)) {
    redirect("/?error=sin-permisos");
  }
  return user;
}

/**
 * Como `requireStaff`, pero para API routes: no redirige, lanza.
 * Un endpoint devuelve 403/401 en lugar de una página de login.
 */
export async function requireStaffApi(): Promise<
  { ok: true; user: SessionUser } | { ok: false; status: 401 | 403; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, status: 401, error: "Necesitas iniciar sesión." };
  if (!isStaff(user)) return { ok: false, status: 403, error: "Sin permisos de moderación." };
  return { ok: true, user };
}

export async function requireAdminApi(): Promise<
  { ok: true; user: SessionUser } | { ok: false; status: 401 | 403; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, status: 401, error: "Necesitas iniciar sesión." };
  if (!isAdminUser(user)) return { ok: false, status: 403, error: "Sin permisos." };
  return { ok: true, user };
}

/**
 * Verifica que el usuario pueda tocar un contenido concreto.
 * Devuelve un mensaje de error en vez de lanzar, para poder mostrarlo.
 */
export async function authorizeContentEdit(authorId: string): Promise<
  { ok: true; user: SessionUser } | { ok: false; status: 401 | 403; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, status: 401, error: "Necesitas iniciar sesión." };
  if (!canEditUserContent(user, authorId)) {
    return { ok: false, status: 403, error: "Solo puedes editar tu propio contenido." };
  }
  return { ok: true, user };
}