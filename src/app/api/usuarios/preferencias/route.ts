import { NextResponse, type NextRequest } from "next/server";
import { ErroValidacao, type Registro } from "@/lib/server/esquema";
import { corpo, rota } from "@/lib/server/http";
import { atualizar } from "@/lib/server/repositorio";

/**
 * Preferências do usuário logado (tema, colunas, painéis, ordem do menu, perfil
 * ativo). Só aceita campos config_* e só altera o próprio usuário. Como antes,
 * não gera auditoria nem muda dt_alteracao.
 */
export async function PATCH(request: NextRequest) {
  return rota(request, async (sessao) => {
    const { dados } = await corpo(request);
    const preferencias = (dados ?? {}) as Registro;
    const invalida = Object.keys(preferencias).find((c) => !c.startsWith("config_") || c === "config_perfis");
    if (invalida) throw new ErroValidacao(`Campo não permitido nas preferências: ${invalida}`);
    await atualizar("usuario", sessao.nrUsuario, preferencias, sessao, { semAuditoria: true });
    return NextResponse.json({ ok: true });
  });
}
