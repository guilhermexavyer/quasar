import "server-only";
import { query } from "@/lib/db";
import { ErroValidacao } from "@/lib/server/esquema";

/**
 * Layout das telas, por usuário, em tabelas próprias:
 *   - config_colunas_<lista> (ordem e largura das colunas) → usuario_coluna (ie_tabela, config_colunas);
 *   - config_paineis_<tela>  (largura dos painéis lado a lado) → usuario_painel (ie_tela, config_paineis).
 * Para a tela, cada item continua sendo o campo config_colunas_* / config_paineis_*
 * do usuário (texto JSON), como quando ficava na tabela usuario.
 */
interface TipoLayout {
  prefixo: string;
  tabela: "usuario_coluna" | "usuario_painel";
  chave: "ie_tabela" | "ie_tela";
  valor: "config_colunas" | "config_paineis";
}

const TIPOS: TipoLayout[] = [
  { prefixo: "config_colunas_", tabela: "usuario_coluna", chave: "ie_tabela", valor: "config_colunas" },
  { prefixo: "config_paineis_", tabela: "usuario_painel", chave: "ie_tela", valor: "config_paineis" },
];
const SUFIXO = /^[a-z0-9_]+$/;

function tipoDaChave(chave: string): TipoLayout | undefined {
  return TIPOS.find((t) => chave.startsWith(t.prefixo) && SUFIXO.test(chave.slice(t.prefixo.length)));
}

/** A preferência fica em usuario_coluna ou usuario_painel (e não na tabela usuario)? */
export function ehPreferenciaDeLayout(chave: string): boolean {
  return tipoDaChave(chave) !== undefined;
}

/** Colunas e painéis salvos do usuário, no formato da tela: { config_colunas_*|config_paineis_*: string JSON }. */
export async function layoutDoUsuario(nrUsuario: number): Promise<Record<string, string>> {
  const resultado: Record<string, string> = {};
  for (const t of TIPOS) {
    const { rows } = await query<{ chave: string; valor: unknown }>(
      `select ${t.chave} as chave, ${t.valor} as valor from ${t.tabela} where nr_seq_usuario = $1 order by ${t.chave}`,
      [nrUsuario]
    );
    for (const r of rows) resultado[t.prefixo + r.chave] = JSON.stringify(r.valor);
  }
  return resultado;
}

/** Grava (ou remove, se vazio) as colunas/painéis informados. */
export async function salvarLayout(nrUsuario: number, autor: string, preferencias: Record<string, unknown>): Promise<void> {
  for (const [chave, valor] of Object.entries(preferencias)) {
    const t = tipoDaChave(chave);
    if (!t) throw new ErroValidacao(`Preferência de layout inválida: ${chave}`);
    const item = chave.slice(t.prefixo.length);
    if (valor === null || valor === undefined || valor === "") {
      await query(`delete from ${t.tabela} where nr_seq_usuario = $1 and ${t.chave} = $2`, [nrUsuario, item]);
      continue;
    }
    let json: string;
    try {
      json = JSON.stringify(typeof valor === "string" ? JSON.parse(valor) : valor);
    } catch {
      throw new ErroValidacao(`Configuração inválida: ${chave}`);
    }
    await query(
      `insert into ${t.tabela} (nr_seq_usuario, ${t.chave}, ${t.valor}, dt_criacao, dt_alteracao, ds_usuario_criacao, ds_usuario_alteracao)
       values ($1, $2, $3::jsonb, now(), now(), $4, $4)
       on conflict (nr_seq_usuario, ${t.chave})
       do update set ${t.valor} = excluded.${t.valor}, dt_alteracao = now(), ds_usuario_alteracao = excluded.ds_usuario_alteracao
       where ${t.tabela}.${t.valor} is distinct from excluded.${t.valor}`,
      [nrUsuario, item, json, autor]
    );
  }
}
