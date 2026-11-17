import { NextResponse, type NextRequest } from "next/server";
import { dataParaTela } from "@/lib/server/esquema";
import { numeroDaUrl, rota } from "@/lib/server/http";
import { atualizar, obterLinha } from "@/lib/server/repositorio";

/**
 * Encerramento automático pela previsão de término: status Encerrado e data de
 * término = previsão. A linha é travada na transação, então só um usuário com o
 * sistema aberto encerra. Autor na auditoria: "Sistema". Resposta: { encerrou }.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ nr: string }> }) {
  const { nr } = await params;
  return rota(request, async (sessao) => {
    const numero = numeroDaUrl(nr);
    const linha = await obterLinha("periodo_letivo", numero);
    if (!linha || linha.ie_status === "E" || !linha.dt_previsao_termino) return NextResponse.json({ encerrou: false });
    const { alterado } = await atualizar(
      "periodo_letivo", numero,
      { ie_status: "E", dt_termino: dataParaTela(linha.dt_previsao_termino) },
      sessao,
      { sistema: true, condicao: (atual) => atual.ie_status !== "E" && Boolean(atual.dt_previsao_termino) }
    );
    return NextResponse.json({ encerrou: alterado });
  });
}
