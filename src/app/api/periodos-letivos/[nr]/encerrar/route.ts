import { NextResponse, type NextRequest } from "next/server";
import { dataParaTela } from "@/lib/server/esquema";
import { numeroDaUrl, rota } from "@/lib/server/http";
import { atualizar, obterLinha } from "@/lib/server/repositorio";
import { deveEncerrarPorPrevisao } from "@/lib/periodoLetivoUtils";

/**
 * Encerramento automático pela previsão de término: status Encerrado e data de
 * término = previsão. A linha é travada na transação, então só um usuário com o
 * sistema aberto encerra. Autor na auditoria: "Sistema". Resposta: { encerrou }.
 * Período reativado na data da previsão ou depois dela não é encerrado (o
 * "Reativar" prevalece sobre a previsão).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ nr: string }> }) {
  const { nr } = await params;
  return rota(request, async (sessao) => {
    const numero = numeroDaUrl(nr);
    const linha = await obterLinha("periodo_letivo", numero);
    const hoje = new Date();
    const hojeNum = hoje.getFullYear() * 10000 + (hoje.getMonth() + 1) * 100 + hoje.getDate();
    const podeEncerrar = (registro: Record<string, unknown>) =>
      deveEncerrarPorPrevisao({
        ie_status: registro.ie_status,
        dt_previsao_termino: dataParaTela(registro.dt_previsao_termino),
        dt_reativacao: dataParaTela(registro.dt_reativacao),
      }, hojeNum);
    if (!linha || !podeEncerrar(linha)) return NextResponse.json({ encerrou: false });
    const { alterado } = await atualizar(
      "periodo_letivo", numero,
      { ie_status: "E", dt_termino: dataParaTela(linha.dt_previsao_termino) },
      sessao,
      { sistema: true, condicao: podeEncerrar }
    );
    return NextResponse.json({ encerrou: alterado });
  });
}
