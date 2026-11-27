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
 * "Ativos" (Pessoas e Relacionamentos > Colaboradores e Equipes): deixa o colaborador (ou a
 * equipe: `campo`) responsável exatamente pelos ativos marcados.
 * - marcado e ainda não responsável: entra como mais um responsável (os demais continuam);
 * - responsável e desmarcado: o registro é excluído pela exclusão padrão, que guarda a cópia em
 *   Logs > Exclusões.
 * Retorna quantos ativos ele passou a ter e quantos deixou de ter.
 */
export async function definirAtivosDoResponsavel(
  campo: 'nr_seq_colaborador' | 'nr_seq_equipe',
  nrSeqResponsavel: number,
  nrSeqAtivosMarcados: number[],
  autor?: AuditAutor
): Promise<{ adicionados: number; removidos: number }> {
  const atuais = await responsaveisPor({ [campo]: nrSeqResponsavel });
  const marcados = new Set(nrSeqAtivosMarcados);
  const jaEram = new Set(atuais.map((r) => Number(r.nr_seq_ativo)));
  let adicionados = 0;
  let removidos = 0;
  for (const nrSeqAtivo of marcados) {
    if (jaEram.has(nrSeqAtivo)) continue;
    await criarAtivoResponsavel({ nr_seq_ativo: nrSeqAtivo, [campo]: nrSeqResponsavel }, autor);
    adicionados++;
  }
  for (const r of atuais) {
    if (marcados.has(Number(r.nr_seq_ativo)) || !r.id) continue;
    await excluirAtivoResponsavel(String(r.id));
    removidos++;
  }
  return { adicionados, removidos };
}

/** Exclui todos os responsáveis de um ativo (usado ao excluir o ativo). */
export async function excluirResponsaveisDoAtivo(nrSeqAtivo: number): Promise<void> {
  const responsaveis = await responsaveisPor({ nr_seq_ativo: nrSeqAtivo });
  await Promise.all(responsaveis.map((r) => excluirDado(COLECAO_ATIVO_RESPONSAVEL, String(r.id))));
  notificarPrefixo(PREFIXO);
}
