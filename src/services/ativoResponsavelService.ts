import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  runTransaction,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { montarUpdateComRemocoes, removerUndefined } from "@/lib/firestoreUtils";
import { COLECAO_ATIVO_RESPONSAVEL } from "@/lib/ativoResponsavelUtils";
import type { AtivoResponsavel } from "@/types/ativoResponsavel";
import type { AuditAutor } from "@/services/auditService";
import { registrarExclusao } from "@/services/exclusaoService";

const responsavelColecao = collection(db, COLECAO_ATIVO_RESPONSAVEL);
const contadorDoc = doc(db, "_counters", "pat_ativo_responsavel_sequence");

async function obterProximoSequencia(): Promise<number> {
  try {
    return await runTransaction(db, async (transacao) => {
      const docSnap = await transacao.get(contadorDoc);
      const proximo = docSnap.exists() ? (docSnap.data().current ?? 0) + 1 : 1;
      transacao.set(contadorDoc, { current: proximo }, { merge: true });
      return proximo;
    });
  } catch {
    return Date.now();
  }
}

async function registrarAuditoria(id: string, acao: 'create' | 'update', detalhes: Record<string, unknown>, autor: AuditAutor | undefined, timestamp: string) {
  try {
    await addDoc(collection(db, COLECAO_ATIVO_RESPONSAVEL, id, "auditoria"), {
      usuarioId: autor?.usuarioId ?? null,
      usuarioNome: autor?.usuarioNome ?? '-',
      acao,
      timestamp,
      detalhes,
    });
  } catch (e) {
    console.error('Erro ao registrar auditoria do responsável', e);
  }
}

/** Escuta, em tempo real, os responsáveis de um ativo. Retorna o cancelamento. */
export function observarResponsaveisDoAtivo(
  nrSeqAtivo: number,
  aoMudar: (responsaveis: AtivoResponsavel[]) => void,
  aoFalhar?: (erro: unknown) => void
): () => void {
  return onSnapshot(
    query(responsavelColecao, where("nr_seq_ativo", "==", nrSeqAtivo)),
    (snapshot) => {
      aoMudar(snapshot.docs.map((d) => {
        const { id, ...rest } = d.data() as Record<string, unknown>;
        void id;
        return { id: d.id, ...rest } as AtivoResponsavel;
      }));
    },
    (erro) => aoFalhar?.(erro)
  );
}

/** Todos os responsáveis de ativos (filtro de Ativos por responsável). */
export async function obterResponsaveisAtivos(): Promise<AtivoResponsavel[]> {
  const snap = await getDocs(responsavelColecao);
  return snap.docs.map((d) => ({ ...(d.data() as Record<string, unknown>), id: d.id }) as AtivoResponsavel);
}

export async function criarAtivoResponsavel(
  responsavel: Omit<AtivoResponsavel, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
  autor?: AuditAutor
): Promise<string> {
  const agora = new Date().toISOString();
  const nr_sequencia = await obterProximoSequencia();
  const nomeAutor = autor?.usuarioNome?.trim() || '-';
  const dados = {
    ...removerUndefined(responsavel),
    nr_sequencia,
    dt_criacao: agora,
    dt_alteracao: agora,
    ds_usuario_criacao: nomeAutor,
    ds_usuario_alteracao: nomeAutor,
  };
  const docRef = await addDoc(responsavelColecao, dados);
  await registrarAuditoria(docRef.id, 'create', dados, autor, agora);
  return docRef.id;
}

export async function atualizarAtivoResponsavel(
  id: string,
  responsavel: Partial<Pick<AtivoResponsavel, "nr_seq_colaborador">>,
  autor?: AuditAutor
): Promise<void> {
  const docRef = doc(db, COLECAO_ATIVO_RESPONSAVEL, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;

  const atual = snap.data() as Record<string, unknown>;
  const mudou = Object.entries(responsavel).some(([k, v]) => String(atual[k] ?? '') !== String(v ?? ''));
  if (!mudou) return;

  const { updates, removidos } = montarUpdateComRemocoes(atual, responsavel);
  const agora = new Date().toISOString();
  const nomeAutor = autor?.usuarioNome?.trim() || '-';
  await updateDoc(docRef, { ...updates, dt_alteracao: agora, ds_usuario_alteracao: nomeAutor });

  const estadoFinal: Record<string, unknown> = { ...atual, ...updates, dt_alteracao: agora, ds_usuario_alteracao: nomeAutor };
  for (const key of removidos) delete estadoFinal[key];
  await registrarAuditoria(id, 'update', estadoFinal, autor, agora);
}

export async function excluirAtivoResponsavel(id: string): Promise<void> {
  await registrarExclusao(COLECAO_ATIVO_RESPONSAVEL, id);
  await deleteDoc(doc(db, COLECAO_ATIVO_RESPONSAVEL, id));
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
    getDocs(query(responsavelColecao, where("nr_seq_colaborador", "==", nrSeqOrigem))),
    getDocs(query(responsavelColecao, where("nr_seq_colaborador", "==", nrSeqDestino))),
  ]);
  const ativosDoDestino = new Set(doDestino.docs.map((d) => Number(d.data().nr_seq_ativo)));
  let assumidos = 0;
  let jaResponsavel = 0;
  for (const d of doOrigem.docs) {
    const nrSeqAtivo = Number(d.data().nr_seq_ativo);
    const jaEra = ativosDoDestino.has(nrSeqAtivo);
    if (modo === 'adicionar') {
      if (jaEra) { jaResponsavel++; continue; }
      await criarAtivoResponsavel({ nr_seq_ativo: nrSeqAtivo, nr_seq_colaborador: nrSeqDestino }, autor);
    } else if (jaEra) {
      jaResponsavel++;
      await excluirAtivoResponsavel(d.id);
      continue;
    } else {
      await atualizarAtivoResponsavel(d.id, { nr_seq_colaborador: nrSeqDestino }, autor);
    }
    ativosDoDestino.add(nrSeqAtivo);
    assumidos++;
  }
  return { assumidos, jaResponsavel };
}

/** Exclui todos os responsáveis de um ativo (usado ao excluir o ativo). */
export async function excluirResponsaveisDoAtivo(nrSeqAtivo: number): Promise<void> {
  const snap = await getDocs(query(responsavelColecao, where("nr_seq_ativo", "==", nrSeqAtivo)));
  await Promise.all(snap.docs.map(async (d) => {
    await registrarExclusao(COLECAO_ATIVO_RESPONSAVEL, d.id);
    await deleteDoc(d.ref);
  }));
}
