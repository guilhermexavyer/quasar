import { NextResponse, type NextRequest } from "next/server";
import { exigirAcessoEscrita, perfilEmUso, TABELAS_COM_REGRA_DE_ESCRITA } from "@/lib/server/acesso";
import { ErroValidacao, TABELAS_DADOS, type Registro } from "@/lib/server/esquema";
import { corpo, erro, numeroDaUrl, rota } from "@/lib/server/http";
import { atualizar, excluir, obter, obterLinha, opcoesDeAuditoria } from "@/lib/server/repositorio";

/** Cópias embutidas do construtor de relatórios: gravadas sem auditoria nem dt_alteracao. */
const COPIAS_EMBUTIDAS: Record<string, string[]> = {
  relatorio: ["bandas", "filtros"],
  relatorio_banda: ["campos"],
};

type Contexto = { params: Promise<{ colecao: string; nr: string }> };

export async function GET(request: NextRequest, { params }: Contexto) {
  const { colecao, nr } = await params;
  if (!TABELAS_DADOS.has(colecao)) return erro("Coleção desconhecida.", 404);
  return rota(request, async () => NextResponse.json(await obter(colecao, numeroDaUrl(nr))));
}

/**
 * Atualiza os campos enviados. Corpo: { dados, auditoria? }. Campo com null é
 * limpo. Sem mudança real, nada é gravado. Resposta: { registro, alterado }.
 */
export async function PATCH(request: NextRequest, { params }: Contexto) {
  const { colecao, nr } = await params;
  if (!TABELAS_DADOS.has(colecao)) return erro("Coleção desconhecida.", 404);
  return rota(request, async (sessao) => {
    const numero = numeroDaUrl(nr);
    const { dados, auditoria, copiaEmbutida, trocaPropriaSenha } = await corpo(request);
    const registro = (dados ?? {}) as Registro;
    if (TABELAS_COM_REGRA_DE_ESCRITA.has(colecao)) {
      await exigirAcessoEscrita(sessao, colecao, "atualizar", await obterLinha(colecao, numero), registro);
    }
    if (copiaEmbutida === true) {
      const permitidas = COPIAS_EMBUTIDAS[colecao] ?? [];
      if (!Object.keys(registro).every((c) => permitidas.includes(c))) throw new ErroValidacao("Campos não permitidos como cópia embutida.");
      return NextResponse.json(await atualizar(colecao, numero, registro, sessao, { semAuditoria: true }));
    }
    return NextResponse.json(await atualizar(colecao, numero, registro, sessao, {
      ...opcoesDeAuditoria(auditoria),
      // Senha definida pelo próprio usuário no menu do usuário (o servidor confere que é a dele).
      trocaPropriaSenha: colecao === "usuario" && trocaPropriaSenha === true,
    }));
  });
}

/** Exclui o registro (com cópia em Exclusões). ?perfil=<nr> informa o perfil em uso. */
export async function DELETE(request: NextRequest, { params }: Contexto) {
  const { colecao, nr } = await params;
  if (!TABELAS_DADOS.has(colecao)) return erro("Coleção desconhecida.", 404);
  return rota(request, async (sessao) => {
    const numero = numeroDaUrl(nr);
    if (TABELAS_COM_REGRA_DE_ESCRITA.has(colecao)) {
      await exigirAcessoEscrita(sessao, colecao, "excluir", await obterLinha(colecao, numero));
    }
    const perfilBruto = request.nextUrl.searchParams.get("perfil");
    const perfil = await perfilEmUso(sessao, perfilBruto && /^\d+$/.test(perfilBruto) ? Number(perfilBruto) : null);
    return NextResponse.json({ excluido: await excluir(colecao, numero, sessao, perfil) });
  });
}
