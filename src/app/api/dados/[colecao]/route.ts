import { NextResponse, type NextRequest } from "next/server";
import { exigirAcessoEscrita } from "@/lib/server/acesso";
import { TABELAS_DADOS, type Registro } from "@/lib/server/esquema";
import { corpo, erro, rota, rotaPublica } from "@/lib/server/http";
import { criar, listar, opcoesDeAuditoria } from "@/lib/server/repositorio";

type Contexto = { params: Promise<{ colecao: string }> };

/** Lista os registros. Filtros de igualdade pela query string (ex.: ?nr_seq_ativo=3). */
export async function GET(request: NextRequest, { params }: Contexto) {
  const { colecao } = await params;
  if (!TABELAS_DADOS.has(colecao)) return erro("Coleção desconhecida.", 404);
  const executar = async () => NextResponse.json(await listar(colecao, Object.fromEntries(request.nextUrl.searchParams)));
  // Os avisos aparecem na tela de login ("Esqueceu sua senha?"): leitura sem sessão.
  return colecao === "aviso" ? rotaPublica(request, executar) : rota(request, executar);
}

/** Cria um registro. Corpo: { dados, auditoria? }. Devolve o registro criado. */
export async function POST(request: NextRequest, { params }: Contexto) {
  const { colecao } = await params;
  if (!TABELAS_DADOS.has(colecao)) return erro("Coleção desconhecida.", 404);
  return rota(request, async (sessao) => {
    const { dados, auditoria } = await corpo(request);
    const registro = (dados ?? {}) as Registro;
    await exigirAcessoEscrita(sessao, colecao, "criar", null, registro);
    return NextResponse.json(await criar(colecao, registro, sessao, opcoesDeAuditoria(auditoria)), { status: 201 });
  });
}
