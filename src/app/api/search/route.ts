import { NextResponse } from "next/server";
import { searchGamesSuggest } from "@/lib/queries/games";

/** Búsqueda instantánea para el buscador principal. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? 8) || 8, 20);

  if (q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchGamesSuggest(q, limit);
  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } },
  );
}
