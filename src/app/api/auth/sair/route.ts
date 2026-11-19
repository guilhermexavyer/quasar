import { NextResponse, type NextRequest } from "next/server";
import { rotaPublica } from "@/lib/server/http";
import { encerrarSessao } from "@/lib/server/sessao";

/**
 * Logout. Corpo opcional { motivo: "automatico" } quando a sessão foi encerrada
 * pela regra de logout automático (Administração do Sistema > Sistema); sem ele,
 * o logout é manual. Fica registrado em Logs > Acessos.
 */
export async function POST(request: NextRequest) {
  return rotaPublica(request, async () => {
    const dados = (await request.json().catch(() => null)) as { motivo?: unknown } | null;
    await encerrarSessao(dados?.motivo === "automatico" ? "A" : "M");
    return NextResponse.json({ ok: true });
  });
}
