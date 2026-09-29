import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { all, one, run, type SqlParam } from "@/lib/db";
import type { User } from "@/lib/db-types";
import type { UserRole } from "@/lib/constants";
import { newId } from "@/lib/queries/guides";

const COOKIE_NAME = "gh_session";
const SESSION_DAYS = 30;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET no configurado o demasiado corto.");
    }
    return "dev-only-insecure-secret";
  }
  return secret;
}

/** Token firmado: <selector>.<verificador>.<firma>. El token completo se indexa en la BD. */
function createToken() {
  const selector = randomBytes(9).toString("base64url");
  const verifier = randomBytes(24).toString("base64url");
  const sig = createHmac("sha256", getSecret())
    .update(`${selector}.${verifier}`)
    .digest("base64url");
  return `${selector}.${verifier}.${sig}`;
}

function verifySignature(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [selector, verifier, sig] = parts;
  const expected = createHmac("sha256", getSecret())
    .update(`${selector}.${verifier}`)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// ----------------------------------------------------------------------------
// API
// ----------------------------------------------------------------------------

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function registerUser(input: {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}) {
  const email = input.email.toLowerCase().trim();
  const username = input.username.toLowerCase().trim();
  if (one<{ id: string }>("SELECT id FROM users WHERE email = ?", [email])) {
    throw new Error("Ya existe una cuenta con ese correo.");
  }
  if (one<{ id: string }>("SELECT id FROM users WHERE username = ?", [username])) {
    throw new Error("Ese nombre de usuario ya está en uso.");
  }
  const passwordHash = await hashPassword(input.password);
  const id = newId("user");
  run(
    `INSERT INTO users (id, email, username, display_name, password_hash, role, status, locale, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'user', 'active', 'es', ?, ?)`,
    [id, email, username, input.displayName?.trim() || null, passwordHash, now(), now()],
  );
  return one<User>(
    `SELECT id, email, username, display_name AS displayName, password_hash AS passwordHash,
            role, status, avatar_url AS avatarUrl, bio, locale, created_at AS createdAt, updated_at AS updatedAt
       FROM users WHERE id = ?`,
    [id],
  );
}

export async function verifyCredentials(identifier: string, password: string) {
  const id = identifier.toLowerCase().trim();
  const user = one<User>(
    `SELECT id, email, username, display_name AS displayName, password_hash AS passwordHash,
            role, status, avatar_url AS avatarUrl, bio, locale, created_at AS createdAt, updated_at AS updatedAt
       FROM users WHERE email = ? OR username = ?`,
    [id, id],
  );
  if (!user) return null;
  if (user.status !== "active") return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

export async function createSession(userId: string, meta?: { userAgent?: string; ip?: string }) {
  const token = createToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  run(
    `INSERT INTO sessions (id, token, user_id, expires_at, user_agent, ip, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [newId("sess"), token, userId, expiresAt.toISOString(), meta?.userAgent?.slice(0, 250) ?? null, meta?.ip ?? null, now()],
  );
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) run("DELETE FROM sessions WHERE token = ?", [token]);
  jar.delete(COOKIE_NAME);
}

export async function purgeExpiredSessions() {
  run("DELETE FROM sessions WHERE expires_at < ?", [now()]);
}

// ----------------------------------------------------------------------------
// Lectura del usuario actual (cacheado por petición)
// ----------------------------------------------------------------------------

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  role: UserRole;
  avatarUrl: string | null;
};

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  if (!verifySignature(token)) return null;

  const row = one<{
    id: string;
    email: string;
    username: string;
    display_name: string | null;
    role: string;
    avatar_url: string | null;
    status: string;
  }>(
    `SELECT u.id, u.email, u.username, u.display_name, u.role, u.avatar_url, u.status
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token = ? AND s.expires_at > ?`,
    [token, now()],
  );
  if (!row || row.status !== "active") return null;

  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    role: row.role as UserRole,
    avatarUrl: row.avatar_url,
  };
});

export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === "admin" || user?.role === "moderator";
}

export async function isOwnerAdmin() {
  const user = await getCurrentUser();
  return user?.role === "admin";
}

function now() {
  return new Date().toISOString();
}

// ----------------------------------------------------------------------------
// Actividad del usuario
// ----------------------------------------------------------------------------

export async function toggleFavorite(userId: string, gameId: string): Promise<boolean> {
  const existing = one<{ id: string }>(
    "SELECT id FROM favorites WHERE user_id = ? AND game_id = ?",
    [userId, gameId],
  );
  if (existing) {
    run("DELETE FROM favorites WHERE id = ?", [existing.id]);
    return false;
  }
  run("INSERT INTO favorites (id, user_id, game_id, created_at) VALUES (?, ?, ?, ?)", [
    newId("fav"),
    userId,
    gameId,
    now(),
  ]);
  return true;
}

export async function setUserGameStatus(
  userId: string,
  gameId: string,
  status: string,
  extra: { progress?: number; hoursPlayed?: number; difficulty?: string | null; notes?: string } = {},
) {
  const existing = one<{ id: string }>("SELECT id FROM user_games WHERE user_id = ? AND game_id = ?", [
    userId,
    gameId,
  ]);
  const payload: SqlParam[] = [
    status,
    extra.progress ?? 0,
    extra.hoursPlayed ?? null,
    extra.difficulty ?? null,
    extra.notes ?? null,
    status === "playing" ? now() : null,
    status === "completed" ? now() : null,
  ];
  if (existing) {
    run(
      `UPDATE user_games SET status = ?, progress = ?, hours_played = ?, difficulty = ?, notes = ?,
              started_at = COALESCE(started_at, ?), finished_at = ?, updated_at = ?
        WHERE id = ?`,
      [...payload, now(), existing.id],
    );
  } else {
    run(
      `INSERT INTO user_games (id, user_id, game_id, status, progress, hours_played, difficulty,
                               notes, started_at, finished_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newId("ug"), userId, gameId, ...payload, now(), now()],
    );
  }
}

export async function registerPlatinum(input: {
  userId: string;
  gameId: string;
  platformId?: string | null;
  earnedAt?: string | null;
  grade?: string | null;
  note?: string | null;
}) {
  const isGold = input.grade === "oro";
  run(
    `INSERT INTO user_platinums (id, user_id, game_id, platform_id, earned_at, grade, is_gold, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId("plat"),
      input.userId,
      input.gameId,
      input.platformId ?? null,
      input.earnedAt ?? now(),
      input.grade ?? null,
      isGold,
      input.note ?? null,
      now(),
    ],
  );
}

export async function toggleUserTrophy(userId: string, gameId: string, trophyId: string) {
  const existing = one<{ id: string }>(
    "SELECT id FROM user_trophies WHERE user_id = ? AND trophy_id = ?",
    [userId, trophyId],
  );
  if (existing) {
    run("DELETE FROM user_trophies WHERE id = ?", [existing.id]);
    return false;
  }
  run(
    `INSERT INTO user_trophies (id, user_id, game_id, trophy_id, earned_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [newId("ut"), userId, gameId, trophyId, now(), now()],
  );
  return true;
}

export async function getUserStats(userId: string) {
  const row = one<{
    platinas: number;
    completados: number;
    jugando: number;
    pendientes: number;
    favoritos: number;
    trofeos: number;
  }>(
    `SELECT
      (SELECT COUNT(*) FROM user_platinums WHERE user_id = ?) AS platinas,
      (SELECT COUNT(*) FROM user_games WHERE user_id = ? AND status = 'completed') AS completados,
      (SELECT COUNT(*) FROM user_games WHERE user_id = ? AND status = 'playing') AS jugando,
      (SELECT COUNT(*) FROM user_games WHERE user_id = ? AND status = 'backlog') AS pendientes,
      (SELECT COUNT(*) FROM favorites WHERE user_id = ?) AS favoritos,
      (SELECT COUNT(*) FROM user_trophies WHERE user_id = ?) AS trofeos`,
    [userId, userId, userId, userId, userId, userId],
  );
  return (
    row ?? { platinas: 0, completados: 0, jugando: 0, pendientes: 0, favoritos: 0, trofeos: 0 }
  );
}

export async function getUserCollection(userId: string) {
  const favorites = all(
    `SELECT g.slug, g.title, g.cover_image AS coverImage, g.accent_color AS accentColor
       FROM favorites f JOIN games g ON g.id = f.game_id
      WHERE f.user_id = ? ORDER BY f.created_at DESC`,
    [userId],
  );
  const library = all(
    `SELECT g.slug, g.title, g.cover_image AS coverImage, g.accent_color AS accentColor,
            ug.status, ug.progress, ug.hours_played AS hoursPlayed, ug.finished_at AS finishedAt
       FROM user_games ug JOIN games g ON g.id = ug.game_id
      WHERE ug.user_id = ? ORDER BY ug.updated_at DESC`,
    [userId],
  );
  const platinas = all(
    `SELECT g.slug, g.title, g.cover_image AS coverImage, g.accent_color AS accentColor,
            up.earned_at AS earnedAt, up.grade, p.short_name AS platformName
       FROM user_platinums up JOIN games g ON g.id = up.game_id
       LEFT JOIN platforms p ON p.id = up.platform_id
      WHERE up.user_id = ? ORDER BY up.earned_at DESC`,
    [userId],
  );
  return { favorites, library, platinas };
}

/** Usuarios registrados (panel de administración). */
export async function listUsers(limit = 200) {
  return all<{
    id: string;
    email: string;
    username: string;
    displayName: string | null;
    role: string;
    status: string;
    createdAt: string;
    platinas: number;
  }>(
    `SELECT u.id, u.email, u.username, u.display_name AS displayName, u.role, u.status,
            u.created_at AS createdAt,
            (SELECT COUNT(*) FROM user_platinums WHERE user_id = u.id) AS platinas
       FROM users u ORDER BY u.created_at DESC LIMIT ?`,
    [limit],
  );
}

export async function setUserRole(userId: string, role: string) {
  run("UPDATE users SET role = ?, updated_at = ? WHERE id = ?", [role, now(), userId]);
}

export async function setUserStatus(userId: string, status: string) {
  run("UPDATE users SET status = ?, updated_at = ? WHERE id = ?", [status, now(), userId]);
}
