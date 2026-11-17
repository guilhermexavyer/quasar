import { NextResponse, type NextRequest } from "next/server";
import { rotaPublica } from "@/lib/server/http";
import { encerrarSessao } from "@/lib/server/sessao";

export async function POST(request: NextRequest) {
  return rotaPublica(request, async () => {
    await encerrarSessao();
    return NextResponse.json({ ok: true });
  });
}
