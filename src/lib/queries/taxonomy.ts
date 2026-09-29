import "server-only";
import { all, one } from "@/lib/db";
import type { Category, Platform, Developer, GuideSource } from "@/lib/db-types";

export async function getPlatforms(): Promise<Platform[]> {
  return all<Platform>(
    "SELECT id, slug, name, short_name AS shortName, sort_order AS sortOrder FROM platforms ORDER BY sort_order",
  );
}

export async function getPlatformSlugs(): Promise<string[]> {
  return all<{ slug: string }>("SELECT slug FROM platforms ORDER BY sort_order").map((x) => x.slug);
}

export async function getPlatformBySlug(slug: string): Promise<Platform | null> {
  return one<Platform>(
    "SELECT id, slug, name, short_name AS shortName, sort_order AS sortOrder FROM platforms WHERE slug = ?",
    [slug],
  );
}

export async function getCategories(): Promise<Category[]> {
  return all<Category>(
    `SELECT c.id, c.slug, c.name, c.description, c.icon, c.sort_order AS sortOrder,
            (SELECT COUNT(*) FROM game_categories gc WHERE gc.category_id = c.id) AS gameCount
       FROM categories c ORDER BY c.sort_order, c.name`,
  );
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return one<Category>(
    `SELECT c.id, c.slug, c.name, c.description, c.icon, c.sort_order AS sortOrder
       FROM categories c WHERE c.slug = ?`,
    [slug],
  );
}

export async function getDevelopers(): Promise<Developer[]> {
  return all<Developer>("SELECT id, slug, name, country FROM developers ORDER BY name");
}

export async function getSources(): Promise<GuideSource[]> {
  return all<GuideSource>(
    `SELECT id, slug, name, homepage, logo_url AS logoUrl, usage_policy AS usagePolicy,
            allows_copy AS allowsCopy, notes, is_active AS isActive, sort_order AS sortOrder
       FROM guide_sources ORDER BY sort_order, name`,
  );
}

export async function getSourceBySlug(slug: string): Promise<GuideSource | null> {
  return one<GuideSource>(
    `SELECT id, slug, name, homepage, logo_url AS logoUrl, usage_policy AS usagePolicy,
            allows_copy AS allowsCopy, notes, is_active AS isActive, sort_order AS sortOrder
       FROM guide_sources WHERE slug = ?`,
    [slug],
  );
}
