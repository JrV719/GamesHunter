import type { MetadataRoute } from "next";
import { getAllGameSlugs } from "@/lib/queries/games";
import { getCategories } from "@/lib/queries/taxonomy";
import { all } from "@/lib/db";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [games, categories, guides] = await Promise.all([
    getAllGameSlugs(),
    getCategories(),
    all<{ slug: string; updatedAt: string }>(
      "SELECT slug, updated_at AS updatedAt FROM guides WHERE status = 'published'",
    ),
  ]);

  const now = new Date();

  return [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/juegos`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/guias`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/comparar`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/categorias`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/acerca-de`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    ...games.map((g) => ({
      url: `${BASE}/juegos/${g.slug}`,
      lastModified: new Date(g.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...categories.map((c) => ({
      url: `${BASE}/categorias/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...guides.map((g) => ({
      url: `${BASE}/guias/${g.slug}`,
      lastModified: new Date(g.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
