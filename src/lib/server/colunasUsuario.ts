import "server-only";
import { query } from "@/lib/db";
import { ErroValidacao } from "@/lib/server/esquema";

/**
 * Largura e ordem das colunas das tabelas de registros, por usuário (tabela
 * usuario_coluna). Para a tela, cada lista continua sendo o campo
 * config_colunas_<ie_tabela> do usuário, como quando ficava na tabela usuario.
 */
const PREFIXO = "config_colunas_";
const CHAVE = /^config_colunas_[a-z0-9_]+$/;

export function ehChaveDeColunas(chave: string): boolean {
  return CHAVE.test(chave);
}

/** Colunas salvas do usuário, no formato da tela: { config_colunas_<lista>: string JSON }. */
export async function colunasDoUsuario(nrUsuario: number): Promise<Record<string, string>> {
  const { rows } = await query<{ ie_tabela: string; config_colunas: unknown }>(
    "select ie_tabela, config_colunas from usuario_coluna where nr_seq_usuario = $1 order by ie_tabela",
    [nrUsuario]
  );
  return Object.fromEntries(rows.map((r) => [PREFIXO + r.ie_tabela, JSON.stringify(r.config_colunas)]));
}

/** Grava (ou remove, se vazio) as colunas das listas informadas. */
export async function salvarColunas(nrUsuario: number, autor: string, preferencias: Record<string, unknown>): Promise<void> {
  for (const [chave, valor] of Object.entries(preferencias)) {
    if (!ehChaveDeColunas(chave)) throw new ErroValidacao(`Campo de colunas inválido: ${chave}`);
    const tabela = chave.slice(PREFIXO.length);
    if (valor === null || valor === undefined || valor === "") {
      await query("delete from usuario_coluna where nr_seq_usuario = $1 and ie_tabela = $2", [nrUsuario, tabela]);
      continue;
    }
    let json: string;
    try {
      json = JSON.stringify(typeof valor === "string" ? JSON.parse(valor) : valor);
    } catch {
      throw new ErroValidacao(`Configuração de colunas inválida: ${chave}`);
    }
    await query(
      `insert into usuario_coluna (nr_seq_usuario, ie_tabela, config_colunas, dt_criacao, dt_alteracao, ds_usuario_criacao, ds_usuario_alteracao)
       values ($1, $2, $3::jsonb, now(), now(), $4, $4)
       on conflict (nr_seq_usuario, ie_tabela)
       do update set config_colunas = excluded.config_colunas, dt_alteracao = now(), ds_usuario_alteracao = excluded.ds_usuario_alteracao
       where usuario_coluna.config_colunas is distinct from excluded.config_colunas`,
      [nrUsuario, tabela, json, autor]
    );
  }
}
