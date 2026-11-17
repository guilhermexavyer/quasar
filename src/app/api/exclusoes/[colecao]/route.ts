import { NextResponse, type NextRequest } from "next/server";
import { rota } from "@/lib/server/http";
import { listarExclusoes } from "@/lib/server/repositorio";

/** Registros excluídos de uma coleção (Administração do Sistema > Exclusões). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ colecao: string }> }) {
  const { colecao } = await params;
  return rota(request, async () => NextResponse.json(await listarExclusoes(colecao)));
}
