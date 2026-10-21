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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { montarUpdateComRemocoes, removerUndefined } from "@/lib/firestoreUtils";
import type { PeriodoLetivo } from "@/types/periodoLetivo";
import type { AuditAutor } from "@/services/auditService";
import { registrarExclusao } from "@/services/exclusaoService";

const periodoLetivoColecao = collection(db, "periodo_letivo");
const contadorDoc = doc(db, "_counters", "periodo_letivo_sequence");

async function obterProximoSequencia(): Promise<number> {
  try {
    const resultado = await runTransaction(db, async (transacao) => {
      const docSnap = await transacao.get(contadorDoc);
      let proximo = 1;
      if (docSnap.exists()) {
        proximo = (docSnap.data().current ?? 0) + 1;
      }
      transacao.set(contadorDoc, { current: proximo }, { merge: true });
      return proximo;
    });
    return resultado;
  } catch {
    try {
      await runTransaction(db, async (transacao) => {
        const docSnap = await transacao.get(contadorDoc);
        if (!docSnap.exists()) {
          transacao.set(contadorDoc, { current: 1 });
        }
      });
      return 1;
    } catch {
      return Date.now();
    }
  }
}

/**
 * Escuta a coleção em tempo real: a lista reflete na hora qualquer alteração
 * (ex.: encerramento automático pela previsão de término). Retorna o cancelamento.
 */
export function observarPeriodosLetivos(
  aoMudar: (periodos: PeriodoLetivo[]) => void,
  aoFalhar?: (erro: unknown) => void
): () => void {
  return onSnapshot(
    periodoLetivoColecao,
    (snapshot) => {
      aoMudar(snapshot.docs.map((d) => {
        const { id, ...rest } = d.data() as Record<string, any>;
        void id;
        return { id: d.id, ...rest } as PeriodoLetivo;
      }));
    },
    (erro) => aoFalhar?.(erro)
  );
}

/**
 * Encerra o período pela previsão de término (parâmetro "A previsão de término
 * encerra o período letivo automaticamente"): status Encerrado e Data de término
 * = Previsão de término. Em transação, para que só um usuário com o sistema
 * aberto faça o encerramento. Retorna se encerrou.
 */
export async function encerrarPeriodoLetivoPorPrevisao(id: string, autor?: AuditAutor): Promise<boolean> {
  const docRef = doc(db, "periodo_letivo", id);
  const agora = new Date().toISOString();
  const nomeAutor = autor?.usuarioNome?.trim() || '-';
  const estadoFinal = await runTransaction(db, async (transacao) => {
    const snap = await transacao.get(docRef);
    if (!snap.exists()) return null;
    const atual = snap.data() as Record<string, any>;
    if (atual.ie_status === 'E' || !atual.dt_previsao_termino) return null;
    const updates = {
      ie_status: 'E',
      dt_termino: atual.dt_previsao_termino,
      dt_alteracao: agora,
      ds_usuario_alteracao: nomeAutor,
    };
    transacao.update(docRef, updates);
    return { ...atual, ...updates };
  });
  if (!estadoFinal) return false;

  try {
    await addDoc(collection(db, "periodo_letivo", id, "auditoria"), {
      usuarioId: autor?.usuarioId ?? null,
      usuarioNome: nomeAutor,
      acao: 'update',
      timestamp: agora,
      detalhes: estadoFinal,
    });
  } catch (e) {
    console.error('Erro ao registrar auditoria de encerramento automático', e);
  }
  return true;
}

export async function obterPeriodosLetivos(): Promise<PeriodoLetivo[]> {
  const snapshot = await getDocs(periodoLetivoColecao);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const { id, ...rest } = data as Record<string, any>;
    return { id: doc.id, ...rest } as PeriodoLetivo;
  });
}

export async function criarPeriodoLetivo(
  periodo: Omit<PeriodoLetivo, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
  autor?: AuditAutor
): Promise<string> {
  const agora = new Date().toISOString();
  const nr_sequencia = await obterProximoSequencia();
  const nomeAutor = autor?.usuarioNome?.trim() || '-';

  const dados = removerUndefined(periodo);

  const docRef = await addDoc(periodoLetivoColecao, {
    ...dados,
    nr_sequencia,
    dt_criacao: agora,
    dt_alteracao: agora,
    ds_usuario_criacao: nomeAutor,
    ds_usuario_alteracao: nomeAutor,
  });
  try {
    const auditCol = collection(db, "periodo_letivo", docRef.id, "auditoria");
    const snap = await getDoc(docRef);
    const full = snap.exists() ? snap.data() : { ...dados, nr_sequencia, dt_criacao: agora, dt_alteracao: agora };
    await addDoc(auditCol, {
      usuarioId: autor?.usuarioId ?? null,
      usuarioNome: autor?.usuarioNome ?? '-',
      acao: 'create',
      timestamp: agora,
      detalhes: full,
    });
  } catch (e) {
    console.error('Erro ao registrar auditoria de criação', e);
  }
  return docRef.id;
}

export async function atualizarPeriodoLetivo(
  id: string,
  periodo: Partial<Omit<PeriodoLetivo, "id" | "nr_sequencia" | "dt_criacao" | "ds_usuario_criacao" | "ds_usuario_alteracao">>,
  autor?: AuditAutor
): Promise<void> {
  const docRef = doc(db, "periodo_letivo", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    return;
  }

  const currentData = snap.data() as Record<string, any>;
  const hasActualChanges = Object.entries(periodo).some(([key, value]) => {
    const currentValue = currentData[key];
    const ehObjeto =
      (typeof value === 'object' && value !== null) ||
      (typeof currentValue === 'object' && currentValue !== null);
    if (ehObjeto) {
      return JSON.stringify(currentValue ?? null) !== JSON.stringify(value ?? null);
    }
    return String(currentValue ?? '') !== String(value ?? '');
  });

  if (!hasActualChanges) {
    return;
  }

  const { updates, removidos } = montarUpdateComRemocoes(currentData, periodo);
  const agora = new Date().toISOString();
  const nomeAutor = autor?.usuarioNome?.trim() || '-';
  await updateDoc(docRef, {
    ...updates,
    dt_alteracao: agora,
    ds_usuario_alteracao: nomeAutor,
  });

  try {
    const auditCol = collection(db, "periodo_letivo", id, "auditoria");
    // Estado final do documento para a auditoria (sem os campos removidos).
    const estadoFinal: Record<string, any> = { ...currentData, ...updates, dt_alteracao: agora, ds_usuario_alteracao: nomeAutor };
    for (const key of removidos) delete estadoFinal[key];
    const full = estadoFinal;
    await addDoc(auditCol, {
      usuarioId: autor?.usuarioId ?? null,
      usuarioNome: autor?.usuarioNome ?? '-',
      acao: 'update',
      timestamp: agora,
      detalhes: full,
    });
  } catch (e) {
    console.error('Erro ao registrar auditoria de atualização', e);
  }
}

export async function excluirPeriodoLetivo(id: string): Promise<void> {
  await registrarExclusao("periodo_letivo", id);
  const docRef = doc(db, "periodo_letivo", id);
  await deleteDoc(docRef);
}
