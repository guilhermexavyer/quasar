import { NextResponse, type NextRequest } from "next/server";
import { colunasDoUsuario } from "@/lib/server/colunasUsuario";
import { colunasDe, paraTela } from "@/lib/server/esquema";
import { rotaPublica } from "@/lib/server/http";
import { obterSessao } from "@/lib/server/sessao";

/** Usuário da sessão atual (sem a senha), ou null. Usado para restaurar a sessão no F5. */
export async function GET(request: NextRequest) {
  return rotaPublica(request, async () => {
    const sessao = await obterSessao();
    if (!sessao) return NextResponse.json({ usuario: null });
    // As colunas salvas (usuario_coluna) entram no objeto do usuário, como config_colunas_*.
    return NextResponse.json({
      usuario: { ...paraTela("usuario", await colunasDe("usuario"), sessao.usuario), ...(await colunasDoUsuario(sessao.nrUsuario)) },
    });
  });
}
