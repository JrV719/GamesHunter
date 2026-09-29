import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina clases de Tailwind resolviendo conflictos. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "8/10" */
export function formatScore(score: number | null | undefined): string {
  if (score == null) return "—";
  return `${score}/10`;
}

/** "45 h" | "45-60 h" | "45 h 30 min" */
export function formatHours(
  min: number | null | undefined,
  max?: number | null,
): string {
  if (min == null) return "—";
  const round = (n: number) => Math.round(n * 10) / 10;
  if (max == null || round(min) === round(max)) return `${formatDecimal(round(min))} h`;
  return `${formatDecimal(round(min))}-${formatDecimal(round(max))} h`;
}

export function formatDecimal(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, "");
}

/** "Sí" / "No" / "—" */
export function yesNo(value: boolean | null | undefined): string {
  if (value == null) return "—";
  return value ? "Sí" : "No";
}

export function formatDate(
  date: Date | string | null | undefined,
  locale = "es-ES",
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatDateShort(
  date: Date | string | null | undefined,
  locale = "es-ES",
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/** "hace 3 días" */
export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "hace un momento";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months} mes${months > 1 ? "es" : ""}`;
  const years = Math.floor(months / 12);
  return `hace ${years} año${years > 1 ? "s" : ""}`;
}

/** Convierte "The Last of Us Part II" -> "the-last-of-us-part-ii" */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¡¿'"’]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Quita acentos para la búsqueda insensible a diacríticos. */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Construye el texto de búsqueda desnormalizado de un juego.
 * Se guarda en `games.searchText` para que la búsqueda sea un único LIKE.
 */
export function buildSearchText(parts: {
  title: string;
  originalTitle?: string | null;
  tagline?: string | null;
  summary?: string | null;
  developer?: string | null;
  categories?: string[];
  platforms?: string[];
}): string {
  return normalizeText(
    [
      parts.title,
      parts.originalTitle,
      parts.tagline,
      parts.summary,
      parts.developer,
      (parts.categories ?? []).join(" "),
      (parts.platforms ?? []).join(" "),
    ]
      .filter(Boolean)
      .join(" | "),
  ).slice(0, 2000);
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/** Normaliza "0.5" -> "50" para inputs de progreso. */
export function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function clampScore(value: number): number {
  return clampInt(value, 1, 10);
}

/** Convierte una lista de terms de búsqueda en un OR de ANDs. */
export function buildQueryTerms(query: string): string[] {
  return normalizeText(query)
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}
