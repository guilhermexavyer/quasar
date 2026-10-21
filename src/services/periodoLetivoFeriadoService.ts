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
import { COLECAO_PERIODO_LETIVO_FERIADO } from "@/lib/periodoLetivoFeriadoUtils";
import type { PeriodoLetivoFeriado } from "@/types/periodoLetivoFeriado";
import type { AuditAutor } from "@/services/auditService";
import { registrarExclusao } from "@/services/exclusaoService";

const feriadoColecao = collection(db, COLECAO_PERIODO_LETIVO_FERIADO);
const contadorDoc = doc(db, "_counters", "periodo_letivo_feriado_sequence");

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
    await addDoc(collection(db, COLECAO_PERIODO_LETIVO_FERIADO, id, "auditoria"), {
      usuarioId: autor?.usuarioId ?? null,
      usuarioNome: autor?.usuarioNome ?? '-',
      acao,
      timestamp,
      detalhes,
    });
  } catch (e) {
    console.error('Erro ao registrar auditoria do feriado', e);
  }
}

/** Escuta, em tempo real, os feriados de um período letivo. Retorna o cancelamento. */
export function observarFeriadosDoPeriodo(
  nrSeqPeriodoLetivo: number,
  aoMudar: (feriados: PeriodoLetivoFeriado[]) => void,
  aoFalhar?: (erro: unknown) => void
): () => void {
  return onSnapshot(
    query(feriadoColecao, where("nr_seq_periodo_letivo", "==", nrSeqPeriodoLetivo)),
    (snapshot) => {
      aoMudar(snapshot.docs.map((d) => {
        const { id, ...rest } = d.data() as Record<string, unknown>;
        void id;
        return { id: d.id, ...rest } as PeriodoLetivoFeriado;
      }));
    },
    (erro) => aoFalhar?.(erro)
  );
}

export async function criarFeriado(
  feriado: Omit<PeriodoLetivoFeriado, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
  autor?: AuditAutor
): Promise<string> {
  const agora = new Date().toISOString();
  const nr_sequencia = await obterProximoSequencia();
  const nomeAutor = autor?.usuarioNome?.trim() || '-';
  const dados = {
    ...removerUndefined(feriado),
    nr_sequencia,
    dt_criacao: agora,
    dt_alteracao: agora,
    ds_usuario_criacao: nomeAutor,
    ds_usuario_alteracao: nomeAutor,
  };
  const docRef = await addDoc(feriadoColecao, dados);
  await registrarAuditoria(docRef.id, 'create', dados, autor, agora);
  return docRef.id;
}

export async function atualizarFeriado(
  id: string,
  feriado: Partial<Pick<PeriodoLetivoFeriado, "dt_feriado" | "ds_feriado" | "ie_tipo_feriado">>,
  autor?: AuditAutor
): Promise<void> {
  const docRef = doc(db, COLECAO_PERIODO_LETIVO_FERIADO, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;

  const atual = snap.data() as Record<string, unknown>;
  const mudou = Object.entries(feriado).some(([k, v]) => String(atual[k] ?? '') !== String(v ?? ''));
  if (!mudou) return;

  const { updates, removidos } = montarUpdateComRemocoes(atual, feriado);
  const agora = new Date().toISOString();
  const nomeAutor = autor?.usuarioNome?.trim() || '-';
  await updateDoc(docRef, { ...updates, dt_alteracao: agora, ds_usuario_alteracao: nomeAutor });

  const estadoFinal: Record<string, unknown> = { ...atual, ...updates, dt_alteracao: agora, ds_usuario_alteracao: nomeAutor };
  for (const key of removidos) delete estadoFinal[key];
  await registrarAuditoria(id, 'update', estadoFinal, autor, agora);
}

export async function excluirFeriado(id: string): Promise<void> {
  await registrarExclusao(COLECAO_PERIODO_LETIVO_FERIADO, id);
  await deleteDoc(doc(db, COLECAO_PERIODO_LETIVO_FERIADO, id));
}

/** Exclui todos os feriados de um período letivo (usado ao excluir o período). */
export async function excluirFeriadosDoPeriodo(nrSeqPeriodoLetivo: number): Promise<void> {
  const snap = await getDocs(query(feriadoColecao, where("nr_seq_periodo_letivo", "==", nrSeqPeriodoLetivo)));
  await Promise.all(snap.docs.map(async (d) => {
    await registrarExclusao(COLECAO_PERIODO_LETIVO_FERIADO, d.id);
    await deleteDoc(d.ref);
  }));
}
