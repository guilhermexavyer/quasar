import { NextResponse, type NextRequest } from "next/server";
import { exigirPermissaoDaFuncao } from "@/lib/server/acesso";
import { rota } from "@/lib/server/http";
import { listarExclusoes } from "@/lib/server/repositorio";

/** Registros excluídos de uma coleção (Logs > Exclusões). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ colecao: string }> }) {
  const { colecao } = await params;
  return rota(request, async (sessao) => {
    await exigirPermissaoDaFuncao(sessao, "logs", "acessar_exclusoes");
    return NextResponse.json(await listarExclusoes(colecao));
  });
}
