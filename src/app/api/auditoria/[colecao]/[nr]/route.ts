import { NextResponse, type NextRequest } from "next/server";
import { numeroDaUrl, rota } from "@/lib/server/http";
import { listarAuditoria } from "@/lib/server/repositorio";

/** Trilha de auditoria de um registro, do mais recente para o mais antigo. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ colecao: string; nr: string }> }) {
  const { colecao, nr } = await params;
  return rota(request, async () => NextResponse.json(await listarAuditoria(colecao, numeroDaUrl(nr))));
}
