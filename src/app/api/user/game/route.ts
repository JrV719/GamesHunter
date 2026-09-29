import { NextResponse } from "next/server";
import { getCurrentUser, toggleFavorite, setUserGameStatus, registerPlatinum, toggleUserTrophy } from "@/lib/auth";
import { one } from "@/lib/db";

/** Acciones del usuario sobre un juego: favorito, estado, platino y trofeo. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Necesitas iniciar sesión." }, { status: 401 });
  }

  let body: {
    gameId?: string;
    action?: string;
    status?: string;
    trophyId?: string;
    platformId?: string;
    grade?: string;
    progress?: number;
    hoursPlayed?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const { gameId, action } = body;
  if (!gameId || !action) {
    return NextResponse.json({ ok: false, error: "Faltan parámetros." }, { status: 400 });
  }
  const game = one<{ id: string; title: string }>("SELECT id, title FROM games WHERE id = ?", [
    gameId,
  ]);
  if (!game) {
    return NextResponse.json({ ok: false, error: "Juego no encontrado." }, { status: 404 });
  }

  switch (action) {
    case "favorite": {
      const active = await toggleFavorite(user.id, gameId);
      return NextResponse.json({ ok: true, value: active });
    }
    case "status": {
      const allowed = ["backlog", "playing", "completed", "abandoned"];
      const status = body.status ?? "backlog";
      if (!allowed.includes(status)) {
        return NextResponse.json({ ok: false, error: "Estado no válido." }, { status: 400 });
      }
      await setUserGameStatus(user.id, gameId, status, {
        progress: body.progress,
        hoursPlayed: body.hoursPlayed,
      });
      return NextResponse.json({ ok: true, value: status });
    }
    case "platinum": {
      await registerPlatinum({
        userId: user.id,
        gameId,
        platformId: body.platformId ?? null,
        grade: body.grade ?? null,
      });
      return NextResponse.json({ ok: true, value: "platinum" });
    }
    case "trophy": {
      if (!body.trophyId) {
        return NextResponse.json({ ok: false, error: "Falta el trofeo." }, { status: 400 });
      }
      const active = await toggleUserTrophy(user.id, gameId, body.trophyId);
      return NextResponse.json({ ok: true, value: active });
    }
    default:
      return NextResponse.json({ ok: false, error: "Acción desconocida." }, { status: 400 });
  }
}
