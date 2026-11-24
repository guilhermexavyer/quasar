import { atualizarCopiaEmbutida, criarDado, criarServicoCrud, obterDado } from "@/lib/apiCliente";
import { removerUndefinedProfundo } from "@/lib/registroUtils";
import type { Relatorio } from "@/types/relatorio";
import type { AuditAutor } from "@/services/auditService";

/**
 * Relatórios. Os dados ficam no PostgreSQL (rotas /api/dados); o servidor gera
 * nr_sequencia, datas de controle e auditoria (sem as bandas, que têm auditoria
 * própria). O autor vem da sessão (`autor` é mantido só pela assinatura).
 */
const servico = criarServicoCrud<Relatorio>("relatorio");

export async function obterRelatorios(): Promise<Relatorio[]> {
  return servico.obterTodos();
}

/** Relatório atualizado direto do banco (usado antes de gerar o PDF/Excel). */
export async function obterRelatorioPorId(id: string): Promise<Relatorio | null> {
  return obterDado<Relatorio>("relatorio", id);
}

export async function criarRelatorio(
  relatorio: Omit<Relatorio, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
  _autor?: AuditAutor
): Promise<string> {
  return servico.criar(relatorio);
}

export async function atualizarRelatorio(
  id: string,
  relatorio: Partial<Omit<Relatorio, "id" | "nr_sequencia" | "dt_criacao" | "ds_usuario_criacao" | "ds_usuario_alteracao">>,
  _autor?: AuditAutor
): Promise<void> {
  await servico.atualizar(id, relatorio);
}

/**
 * Mantém a cópia das bandas dentro do relatório (retrocompatibilidade). Não
 * conta como alteração do relatório: não muda dt_alteracao nem gera auditoria.
 */
export async function atualizarBandasDoRelatorio(id: string, bandas: unknown[]): Promise<void> {
  await atualizarCopiaEmbutida("relatorio", id, { bandas: removerUndefinedProfundo(bandas) });
}

export async function excluirRelatorio(id: string): Promise<void> {
  await servico.excluir(id);
}

/** Remove identificação e auditoria de um registro, para recriá-lo como cópia. */
function semIdentificacao(registro: Record<string, unknown>): Record<string, unknown> {
  const { id: _id, _idRegistro: _fs, nr_sequencia: _seq, dt_criacao: _dc, dt_alteracao: _da, ds_usuario_criacao: _uc, ds_usuario_alteracao: _ua, ...resto } = registro;
  return resto;
}

/**
 * Duplica um relatório com tudo o que pertence a ele: bandas (com ordenação),
 * elementos das bandas e parâmetros. Esses registros ficam em tabelas
 * próprias, ligadas pelo nr_sequencia do relatório — copiar só o registro
 * do relatório gerava uma cópia sem bandas nem parâmetros.
 */
export async function duplicarRelatorio(relatorioId: string, autor?: AuditAutor): Promise<string> {
  const original = await obterDado<Record<string, unknown>>("relatorio", relatorioId);
  if (!original) throw new Error("Relatório não encontrado.");
  const seqOrigem = original.nr_sequencia;
  const { bandas: bandasEmbutidas, filtros: filtrosEmbutidos, ...dadosRelatorio } = semIdentificacao(original);

  const { obterBandasPorRelatorio, obterElementosPorBandaSeq, criarBanda, criarElemento } = await import("@/services/relatorioServiceBandas");
  const { obterParametrosPorRelatorio, criarParametro } = await import("@/services/relatorioServiceParametros");

  const bandasOrigem = seqOrigem != null ? await obterBandasPorRelatorio(Number(seqOrigem)) : [];
  const parametrosOrigem = seqOrigem != null ? await obterParametrosPorRelatorio(Number(seqOrigem)) : [];

  // O Código é único: a cópia fica sem código.
  const novo = await criarDado<Relatorio>("relatorio", { ...dadosRelatorio, cd_relatorio: null, ds_relatorio: `${dadosRelatorio.ds_relatorio ?? ''} (Cópia)` });
  const novoId = String(novo.id);
  const novaSeq = novo.nr_sequencia;

  // Bandas e seus elementos. A banda superior é criada antes das dependentes, e a
  // Banda superior da cópia aponta para a cópia da banda superior.
  const nrNovoDe = new Map<string, number>();
  const pendentes = [...bandasOrigem];
  const ordem: typeof bandasOrigem = [];
  while (pendentes.length > 0) {
    const nrs = new Set(pendentes.map((b) => String(b.nr_sequencia)));
    const prontas = pendentes.filter((b) => b.nr_seq_banda_superior == null || !nrs.has(String(b.nr_seq_banda_superior)));
    const lote = prontas.length > 0 ? prontas : pendentes; // ciclo (não deveria existir): sem superior
    ordem.push(...lote);
    for (const b of lote) pendentes.splice(pendentes.indexOf(b), 1);
  }
  const bandasNovas: Record<string, unknown>[] = [];
  for (const banda of ordem) {
    const elementos = banda.nr_sequencia != null ? await obterElementosPorBandaSeq(Number(banda.nr_sequencia)) : [];
    const { campos: _campos, ...dadosBanda } = semIdentificacao(banda);
    dadosBanda.nr_seq_banda_superior = banda.nr_seq_banda_superior == null ? null : nrNovoDe.get(String(banda.nr_seq_banda_superior)) ?? null;
    const novaBanda = await criarBanda(removerUndefinedProfundo({ ...dadosBanda, nr_seq_relatorio: novaSeq }), autor);
    nrNovoDe.set(String(banda.nr_sequencia), novaBanda.nr_sequencia);

    const camposNovos: Record<string, unknown>[] = [];
    for (const elemento of elementos) {
      const dadosElemento = { ...semIdentificacao(elemento), nr_seq_banda: novaBanda.nr_sequencia, nr_seq_relatorio: novaSeq };
      const novoElemento = await criarElemento(dadosElemento, autor);
      camposNovos.push({ ...dadosElemento, id: novoElemento.id, _idRegistro: novoElemento.id, nr_sequencia: novoElemento.nr_sequencia, dt_criacao: novoElemento.dt_criacao, dt_alteracao: novoElemento.dt_alteracao, ds_usuario_criacao: novoElemento.ds_usuario_criacao, ds_usuario_alteracao: novoElemento.ds_usuario_alteracao });
    }
    // Cópia embutida dos elementos na banda (mesmo formato do salvamento da banda)
    await atualizarCopiaEmbutida("relatorio_banda", novaBanda.id, { campos: removerUndefinedProfundo(camposNovos) });

    bandasNovas.push({ ...dadosBanda, nr_seq_relatorio: novaSeq, id: novaBanda.id, _idRegistro: novaBanda.id, nr_sequencia: novaBanda.nr_sequencia, dt_criacao: novaBanda.dt_criacao, dt_alteracao: novaBanda.dt_alteracao, ds_usuario_criacao: novaBanda.ds_usuario_criacao, ds_usuario_alteracao: novaBanda.ds_usuario_alteracao, campos: camposNovos });
  }

  // Parâmetros
  const filtrosNovos: Record<string, unknown>[] = [];
  for (const parametro of parametrosOrigem) {
    const dadosParametro = { ...semIdentificacao(parametro), nr_seq_relatorio: novaSeq };
    const novoParametro = await criarParametro(dadosParametro, autor);
    filtrosNovos.push({ ...dadosParametro, id: novoParametro.id, _idRegistro: novoParametro.id, nr_sequencia: novoParametro.nr_sequencia, dt_criacao: novoParametro.dt_criacao, dt_alteracao: novoParametro.dt_alteracao, ds_usuario_criacao: novoParametro.ds_usuario_criacao, ds_usuario_alteracao: novoParametro.ds_usuario_alteracao });
  }

  // Cópias embutidas no relatório (retrocompatibilidade). Relatórios antigos,
  // sem registros nas tabelas, mantêm as cópias embutidas originais.
  await atualizarCopiaEmbutida("relatorio", novoId, removerUndefinedProfundo({
    bandas: bandasOrigem.length > 0 ? bandasNovas : (bandasEmbutidas ?? []),
    filtros: parametrosOrigem.length > 0 ? filtrosNovos : (filtrosEmbutidos ?? []),
  }));

  return novoId;
}
