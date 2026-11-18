import { NextResponse, type NextRequest } from "next/server";
import { ErroValidacao, type Registro } from "@/lib/server/esquema";
import { corpo, rota } from "@/lib/server/http";
import { ehPreferenciaDeLayout, salvarLayout } from "@/lib/server/layoutUsuario";
import { atualizar } from "@/lib/server/repositorio";

/**
 * Preferências do usuário logado. Só altera o próprio usuário e, como antes,
 * não gera auditoria nem muda dt_alteracao do usuário.
 *   - config_colunas_* (largura e ordem das colunas) → tabela usuario_coluna;
 *   - config_paineis_* (largura dos painéis lado a lado) → tabela usuario_painel;
 *   - demais config_* (tema, ordem do menu, perfil ativo) → tabela usuario.
 */
export async function PATCH(request: NextRequest) {
  return rota(request, async (sessao) => {
    const { dados } = await corpo(request);
    const preferencias = (dados ?? {}) as Registro;
    const invalida = Object.keys(preferencias).find((c) => !c.startsWith("config_") || c === "config_perfis");
    if (invalida) throw new ErroValidacao(`Campo não permitido nas preferências: ${invalida}`);

    const layout: Registro = {};
    const doUsuario: Registro = {};
    for (const [chave, valor] of Object.entries(preferencias)) {
      if (ehPreferenciaDeLayout(chave)) layout[chave] = valor;
      else doUsuario[chave] = valor;
    }
    if (Object.keys(layout).length > 0) await salvarLayout(sessao.nrUsuario, sessao.nomeUsuario, layout);
    if (Object.keys(doUsuario).length > 0) {
      await atualizar("usuario", sessao.nrUsuario, doUsuario, sessao, { semAuditoria: true });
    }
    return NextResponse.json({ ok: true });
  });
}
