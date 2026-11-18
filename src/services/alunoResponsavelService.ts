import { atualizarDado, criarDado, excluirDado, listarDados } from "@/lib/apiCliente";
import { notificarPrefixo, observar } from "@/lib/observador";
import { COLECAO_ALUNO_RESPONSAVEL } from "@/lib/alunoResponsavelUtils";
import type { AlunoResponsavel } from "@/types/alunoResponsavel";

const PREFIXO = `${COLECAO_ALUNO_RESPONSAVEL}:`;

function responsaveisPor(filtro: Record<string, number>): Promise<AlunoResponsavel[]> {
  return listarDados<AlunoResponsavel>(COLECAO_ALUNO_RESPONSAVEL, filtro);
}

/**
 * Acompanha os responsáveis de um aluno (na hora para o que este navegador
 * grava; em até 15 segundos para o que outros usuários alteram). Retorna o cancelamento.
 */
export function observarResponsaveisDoAluno(
  nrSeqAluno: number,
  aoMudar: (responsaveis: AlunoResponsavel[]) => void,
  aoFalhar?: (erro: unknown) => void
): () => void {
  return observar(`${PREFIXO}${nrSeqAluno}`, () => responsaveisPor({ nr_seq_aluno: nrSeqAluno }), aoMudar, aoFalhar);
}

export async function criarAlunoResponsavel(
  responsavel: Pick<AlunoResponsavel, "nr_seq_aluno" | "nr_seq_pessoa_fisica" | "nr_seq_grau_parentesco">
): Promise<string> {
  const criado = await criarDado<AlunoResponsavel>(COLECAO_ALUNO_RESPONSAVEL, responsavel);
  notificarPrefixo(PREFIXO);
  return String(criado.id);
}

export async function atualizarAlunoResponsavel(
  id: string,
  responsavel: Pick<AlunoResponsavel, "nr_seq_pessoa_fisica" | "nr_seq_grau_parentesco">
): Promise<void> {
  // null limpa o grau de parentesco (undefined não seria enviado).
  await atualizarDado(COLECAO_ALUNO_RESPONSAVEL, id, {
    nr_seq_pessoa_fisica: responsavel.nr_seq_pessoa_fisica ?? null,
    nr_seq_grau_parentesco: responsavel.nr_seq_grau_parentesco ?? null,
  });
  notificarPrefixo(PREFIXO);
}

export async function excluirAlunoResponsavel(id: string): Promise<void> {
  await excluirDado(COLECAO_ALUNO_RESPONSAVEL, id);
  notificarPrefixo(PREFIXO);
}

/** Exclui todos os responsáveis de um aluno (usado ao excluir o aluno). */
export async function excluirResponsaveisDoAluno(nrSeqAluno: number): Promise<void> {
  const responsaveis = await responsaveisPor({ nr_seq_aluno: nrSeqAluno });
  await Promise.all(responsaveis.map((r) => excluirDado(COLECAO_ALUNO_RESPONSAVEL, String(r.id))));
  notificarPrefixo(PREFIXO);
}
