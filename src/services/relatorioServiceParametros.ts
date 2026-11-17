import { atualizarCopiaEmbutida, atualizarDado, criarDado, excluirDado, listarDados, obterDado } from "@/lib/apiCliente";
import { removerUndefined } from "@/lib/firestoreUtils";
import type { AuditAutor } from "@/services/auditService";

/**
 * Parâmetros (filtros) do construtor de relatórios (tabela relatorio_parametro),
 * acessados pelas rotas /api/dados. O servidor gera nr_sequencia, datas de
 * controle e auditoria; o autor vem da sessão (o parâmetro `autor` é mantido
 * só pela assinatura).
 */

// Registros do construtor de relatórios têm forma livre (como já era no Firestore).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Reg = Record<string, any>;
type Controle = { id: string; nr_sequencia: number; dt_criacao: string; dt_alteracao: string; ds_usuario_criacao: string; ds_usuario_alteracao: string };

/**
 * Normaliza um documento de parâmetro, convertendo os nomes antigos de campos
 * (campo, mascara, valor, conector, parametro) para os novos (ie_campo, ie_mascara,
 * vl_padrao, ie_conector, ie_parametro).
 */
export function normalizarParametroDoc(raw: Reg): Reg {
  const out: Reg = { ...raw };
  if (out.ie_campo === undefined && out.campo !== undefined) out.ie_campo = out.campo;
  if (out.ie_mascara === undefined && out.mascara !== undefined) out.ie_mascara = out.mascara;
  if (out.vl_padrao === undefined && out.valor !== undefined) out.vl_padrao = out.valor;
  if (out.ie_conector === undefined && out.conector !== undefined) out.ie_conector = out.conector;
  if (out.ie_parametro === undefined && out.parametro !== undefined) out.ie_parametro = out.parametro;
  delete out.campo;
  delete out.mascara;
  delete out.valor;
  delete out.conector;
  delete out.parametro;
  return out;
}

/** Retorna todos os parâmetros de um relatório (por nr_seq_relatorio). */
export async function obterParametrosPorRelatorio(nrSeqRelatorio: number): Promise<Reg[]> {
  const lista = await listarDados<Reg>("relatorio_parametro", { nr_seq_relatorio: nrSeqRelatorio });
  return lista.map(({ id, ...rest }) => ({ id, _firestoreId: id, ...normalizarParametroDoc(rest) }));
}

/** Cria um novo parâmetro. */
export async function criarParametro(parametro: Reg, _autor?: AuditAutor): Promise<Controle> {
  const criado = await criarDado<Reg>("relatorio_parametro", parametro);
  return {
    id: String(criado.id),
    nr_sequencia: Number(criado.nr_sequencia),
    dt_criacao: criado.dt_criacao ?? '',
    dt_alteracao: criado.dt_alteracao ?? '',
    ds_usuario_criacao: criado.ds_usuario_criacao ?? '',
    ds_usuario_alteracao: criado.ds_usuario_alteracao ?? '',
  };
}

/** Atualiza um parâmetro existente. Sem alteração, devolve a data e o usuário atuais. */
export async function atualizarParametro(
  id: string,
  parametro: Reg,
  _autor?: AuditAutor
): Promise<{ dt_alteracao: string; ds_usuario_alteracao: string }> {
  // Como antes, campo undefined é ignorado (não limpa o valor gravado).
  const { registro } = await atualizarDado<Reg>("relatorio_parametro", id, removerUndefined(parametro));
  return { dt_alteracao: registro?.dt_alteracao ?? '', ds_usuario_alteracao: registro?.ds_usuario_alteracao ?? '' };
}

/** Exclui um parâmetro. */
export async function excluirParametro(id: string): Promise<void> {
  await excluirDado("relatorio_parametro", id);
}

/**
 * Exclui um parâmetro e o remove da cópia embutida em relatorio.filtros.
 * Sem isso, ao excluir o último parâmetro, a cópia (usada como fallback quando
 * a tabela vem vazia) fazia o parâmetro reaparecer.
 */
export async function excluirParametroComCopia(id: string, relatorioDocId?: string | null): Promise<void> {
  await excluirParametro(id);
  if (!relatorioDocId) return;
  const relatorio = await obterDado<Reg>("relatorio", relatorioDocId);
  const filtros = relatorio?.filtros;
  if (Array.isArray(filtros)) {
    const restantes = filtros.filter((f: { id?: string; _firestoreId?: string }) => f?.id !== id && f?._firestoreId !== id);
    if (restantes.length !== filtros.length) await atualizarCopiaEmbutida("relatorio", relatorioDocId, { filtros: restantes });
  }
}

/** Exclui todos os parâmetros de um relatório. */
export async function excluirParametrosPorRelatorio(nrSeqRelatorio: number): Promise<void> {
  const parametros = await obterParametrosPorRelatorio(nrSeqRelatorio);
  for (const p of parametros) {
    await excluirDado("relatorio_parametro", p.id);
  }
}
