import { atualizarDado, criarDado, excluirDado, listarDados } from "@/lib/apiCliente";
import { notificarPrefixo, observar } from "@/lib/observador";
import { COLECAO_ATIVO_RESPONSAVEL } from "@/lib/ativoResponsavelUtils";
import type { AtivoResponsavel } from "@/types/ativoResponsavel";
import type { AuditAutor } from "@/services/auditService";

const PREFIXO = `${COLECAO_ATIVO_RESPONSAVEL}:`;

function responsaveisPor(filtro: Record<string, number>): Promise<AtivoResponsavel[]> {
  return listarDados<AtivoResponsavel>(COLECAO_ATIVO_RESPONSAVEL, filtro);
}

/**
 * Acompanha os responsáveis de um ativo (na hora para o que este navegador
 * grava; em até 15 segundos para o que outros usuários alteram). Retorna o cancelamento.
 */
export function observarResponsaveisDoAtivo(
  nrSeqAtivo: number,
  aoMudar: (responsaveis: AtivoResponsavel[]) => void,
  aoFalhar?: (erro: unknown) => void
): () => void {
  return observar(`${PREFIXO}${nrSeqAtivo}`, () => responsaveisPor({ nr_seq_ativo: nrSeqAtivo }), aoMudar, aoFalhar);
}

/** Todos os responsáveis de ativos (filtro de Ativos por responsável). */
export async function obterResponsaveisAtivos(): Promise<AtivoResponsavel[]> {
  return listarDados<AtivoResponsavel>(COLECAO_ATIVO_RESPONSAVEL);
}

export async function criarAtivoResponsavel(
  responsavel: Omit<AtivoResponsavel, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
  _autor?: AuditAutor
): Promise<string> {
  const criado = await criarDado<AtivoResponsavel>(COLECAO_ATIVO_RESPONSAVEL, responsavel);
  notificarPrefixo(PREFIXO);
  return String(criado.id);
}

export async function atualizarAtivoResponsavel(
  id: string,
  responsavel: Partial<Pick<AtivoResponsavel, "nr_seq_colaborador">>,
  _autor?: AuditAutor
): Promise<void> {
  await atualizarDado(COLECAO_ATIVO_RESPONSAVEL, id, responsavel);
  notificarPrefixo(PREFIXO);
}

export async function excluirAtivoResponsavel(id: string): Promise<void> {
  await excluirDado(COLECAO_ATIVO_RESPONSAVEL, id);
  notificarPrefixo(PREFIXO);
}

/**
 * "Assumir ativos de" (EA > Colaboradores): o colaborador destino assume os
 * ativos em que o colaborador origem é responsável.
 * - adicionar: o destino entra como mais um responsável de cada ativo;
 * - substituir: o destino entra no lugar do origem (o mesmo registro é
 *   alterado, mantendo a sequência e a auditoria). Se o destino já era
 *   responsável do ativo, o registro do origem só é excluído.
 * Ativos em que o destino já é responsável não ganham registro repetido.
 * Retorna quantos ativos o destino assumiu e quantos já eram dele.
 */
export async function assumirAtivosDoColaborador(
  nrSeqOrigem: number,
  nrSeqDestino: number,
  modo: 'adicionar' | 'substituir',
  autor?: AuditAutor
): Promise<{ assumidos: number; jaResponsavel: number }> {
  const [doOrigem, doDestino] = await Promise.all([
    responsaveisPor({ nr_seq_colaborador: nrSeqOrigem }),
    responsaveisPor({ nr_seq_colaborador: nrSeqDestino }),
  ]);
  const ativosDoDestino = new Set(doDestino.map((d) => Number(d.nr_seq_ativo)));
  let assumidos = 0;
  let jaResponsavel = 0;
  for (const d of doOrigem) {
    const nrSeqAtivo = Number(d.nr_seq_ativo);
    const jaEra = ativosDoDestino.has(nrSeqAtivo);
    if (modo === 'adicionar') {
      if (jaEra) { jaResponsavel++; continue; }
      await criarAtivoResponsavel({ nr_seq_ativo: nrSeqAtivo, nr_seq_colaborador: nrSeqDestino }, autor);
    } else if (jaEra) {
      jaResponsavel++;
      await excluirAtivoResponsavel(String(d.id));
      continue;
    } else {
      await atualizarAtivoResponsavel(String(d.id), { nr_seq_colaborador: nrSeqDestino }, autor);
    }
    ativosDoDestino.add(nrSeqAtivo);
    assumidos++;
  }
  return { assumidos, jaResponsavel };
}

/** Exclui todos os responsáveis de um ativo (usado ao excluir o ativo). */
export async function excluirResponsaveisDoAtivo(nrSeqAtivo: number): Promise<void> {
  const responsaveis = await responsaveisPor({ nr_seq_ativo: nrSeqAtivo });
  await Promise.all(responsaveis.map((r) => excluirDado(COLECAO_ATIVO_RESPONSAVEL, String(r.id))));
  notificarPrefixo(PREFIXO);
}
