import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { exigirPermissaoDaFuncao } from "@/lib/server/acesso";
import { rota } from "@/lib/server/http";

/**
 * Logs > Acessos: logins registrados (log_acesso), do mais recente para o mais
 * antigo. Somente leitura: nada é criado ou alterado por esta tela.
 */
export async function GET(request: NextRequest) {
  return rota(request, async (sessao) => {
    await exigirPermissaoDaFuncao(sessao, "logs", "acessar_acessos");
    const { rows } = await query<Record<string, unknown>>(
      `select nr_sequencia, nr_seq_usuario, ds_usuario, nr_seq_pessoa_fisica, ds_pessoa_fisica, dt_login, dt_logout, ie_tipo_logout
         from log_acesso
        order by dt_login desc, nr_sequencia desc`
    );
    return NextResponse.json(
      rows.map((r) => ({
        id: String(r.nr_sequencia),
        nr_sequencia: Number(r.nr_sequencia),
        nr_seq_usuario: Number(r.nr_seq_usuario),
        ds_usuario: String(r.ds_usuario ?? ""),
        nr_seq_pessoa_fisica: r.nr_seq_pessoa_fisica == null ? null : Number(r.nr_seq_pessoa_fisica),
        ds_pessoa_fisica: r.ds_pessoa_fisica == null ? "" : String(r.ds_pessoa_fisica),
        dt_login: r.dt_login ? new Date(r.dt_login as string).toISOString() : "",
        dt_logout: r.dt_logout ? new Date(r.dt_logout as string).toISOString() : "",
        ie_tipo_logout: r.ie_tipo_logout == null ? "" : String(r.ie_tipo_logout),
      }))
    );
  });
}
