import { atualizarDado, criarDado, excluirDado, listarDados } from "@/lib/apiCliente";
import { notificarMudanca, notificarPrefixo, observar } from "@/lib/observador";
import { COLECAO_EQUIPE, COLECAO_EQUIPE_MEMBRO, type TipoRelacionamento } from "@/lib/relacionamentoUtils";
import type { Equipe, EquipeMembro, Relacionamento } from "@/types/relacionamento";

/**
 * Pessoas e Relacionamentos > Fornecedores, Prestadores de Serviço e Equipes (rotas genéricas
 * /api/dados). O servidor gera nr_sequencia, datas de controle, auditoria e a cópia em Exclusões.
 * As listas são observadas: na hora para o que este navegador grava; em até 15 segundos para
 * o que outros usuários alteram.
 */

type SemControle<T> = Omit<T, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">;

/* ── Fornecedores e Prestadores de Serviço ── */

export function observarRelacionamentos(
  colecao: TipoRelacionamento,
  aoMudar: (registros: Relacionamento[]) => void,
  aoFalhar?: (erro: unknown) => void
): () => void {
  return observar(colecao, () => listarDados<Relacionamento>(colecao), aoMudar, aoFalhar);
}

export async function criarRelacionamento(colecao: TipoRelacionamento, dados: Partial<SemControle<Relacionamento>>): Promise<Relacionamento> {
  const criado = await criarDado<Relacionamento>(colecao, dados);
  notificarMudanca(colecao);
  return criado;
}

export async function atualizarRelacionamento(colecao: TipoRelacionamento, id: string, dados: Partial<SemControle<Relacionamento>>): Promise<void> {
  await atualizarDado(colecao, id, dados);
  notificarMudanca(colecao);
}

export async function excluirRelacionamento(colecao: TipoRelacionamento, id: string): Promise<void> {
  await excluirDado(colecao, id);
  notificarMudanca(colecao);
}

/* ── Equipes ── */

export function observarEquipes(aoMudar: (equipes: Equipe[]) => void, aoFalhar?: (erro: unknown) => void): () => void {
  return observar(COLECAO_EQUIPE, () => listarDados<Equipe>(COLECAO_EQUIPE), aoMudar, aoFalhar);
}

export async function criarEquipe(dados: Partial<SemControle<Equipe>>): Promise<Equipe> {
  const criada = await criarDado<Equipe>(COLECAO_EQUIPE, dados);
  notificarMudanca(COLECAO_EQUIPE);
  return criada;
}

export async function atualizarEquipe(id: string, dados: Partial<SemControle<Equipe>>): Promise<void> {
  await atualizarDado(COLECAO_EQUIPE, id, dados);
  notificarMudanca(COLECAO_EQUIPE);
}

export async function excluirEquipe(id: string): Promise<void> {
  await excluirDado(COLECAO_EQUIPE, id);
  notificarMudanca(COLECAO_EQUIPE);
}

/* ── Membros da equipe ── */

const assuntoMembros = (nrSeqEquipe: number) => `${COLECAO_EQUIPE_MEMBRO}:${nrSeqEquipe}`;

export function observarMembrosDaEquipe(
  nrSeqEquipe: number,
  aoMudar: (membros: EquipeMembro[]) => void,
  aoFalhar?: (erro: unknown) => void
): () => void {
  return observar(
    assuntoMembros(nrSeqEquipe),
    () => listarDados<EquipeMembro>(COLECAO_EQUIPE_MEMBRO, { nr_seq_equipe: nrSeqEquipe }),
    aoMudar,
    aoFalhar
  );
}

export async function criarMembro(dados: Partial<SemControle<EquipeMembro>> & { nr_seq_equipe: number }): Promise<EquipeMembro> {
  const criado = await criarDado<EquipeMembro>(COLECAO_EQUIPE_MEMBRO, dados);
  notificarMudanca(assuntoMembros(dados.nr_seq_equipe));
  return criado;
}

export async function atualizarMembro(id: string, dados: Partial<SemControle<EquipeMembro>>): Promise<void> {
  const { registro } = await atualizarDado<EquipeMembro>(COLECAO_EQUIPE_MEMBRO, id, dados);
  if (registro) notificarMudanca(assuntoMembros(Number(registro.nr_seq_equipe)));
}

export async function excluirMembro(id: string): Promise<void> {
  await excluirDado(COLECAO_EQUIPE_MEMBRO, id);
  notificarPrefixo(`${COLECAO_EQUIPE_MEMBRO}:`);
}
