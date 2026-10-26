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

  try {
    const results = await searchGamesSuggest(q, limit);
    return NextResponse.json(
      { results },
      { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } },
    );
  } catch (e) {
    // Sin esto el buscador recibía un 500 con el cuerpo vacío y fallaba sin
    // explicación. Se devuelve JSON para que la interfaz pueda avisar.
    console.error("[GamesHunter] Fallo en /api/search:", (e as Error).message);
    return NextResponse.json(
      { results: [], error: "No se pudo consultar el catálogo." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
