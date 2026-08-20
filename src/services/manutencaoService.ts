import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { montarUpdateComRemocoes, removerUndefined } from "@/lib/firestoreUtils";
import type { Manutencao } from "@/types/manutencao";
import type { AuditAutor } from "@/services/auditService";

const colecao = collection(db, "pat_manutencao");
const contadorDoc = doc(db, "_counters", "pat_manutencao_sequence");

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

export async function obterManutencoes(): Promise<Manutencao[]> {
  const snapshot = await getDocs(colecao);
  return snapshot.docs.map((d) => {
    const data = d.data();
    const { id, ...rest } = data as Record<string, any>;
    return { id: d.id, ...rest } as Manutencao;
  });
}

export async function criarManutencao(
  dados: Omit<Manutencao, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
  autor?: AuditAutor
): Promise<string> {
  const agora = new Date().toISOString();
  const nr_sequencia = await obterProximoSequencia();
  const nomeAutor = autor?.usuarioNome?.trim() || "-";

  const limpos = removerUndefined(dados);

  const docRef = await addDoc(colecao, {
    ...limpos,
    nr_sequencia,
    dt_criacao: agora,
    dt_alteracao: agora,
    ds_usuario_criacao: nomeAutor,
    ds_usuario_alteracao: nomeAutor,
  });

  try {
    const auditCol = collection(db, "pat_manutencao", docRef.id, "auditoria");
    const snap = await getDoc(docRef);
    const full = snap.exists() ? snap.data() : { ...limpos, nr_sequencia, dt_criacao: agora, dt_alteracao: agora };
    await addDoc(auditCol, {
      usuarioId: autor?.usuarioId ?? null,
      usuarioNome: nomeAutor,
      acao: "create",
      timestamp: agora,
      detalhes: full,
    });
  } catch (e) {
    console.error("Erro ao registrar auditoria de criação", e);
  }

  return docRef.id;
}

export async function atualizarManutencao(
  id: string,
  dados: Partial<Omit<Manutencao, "id" | "nr_sequencia" | "dt_criacao" | "ds_usuario_criacao" | "ds_usuario_alteracao">>,
  autor?: AuditAutor
): Promise<void> {
  const docRef = doc(db, "pat_manutencao", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;

  const currentData = snap.data() as Record<string, any>;
  const hasActualChanges = Object.entries(dados).some(([key, value]) => {
    const currentValue = currentData[key];
    const ehObjeto =
      (typeof value === "object" && value !== null) ||
      (typeof currentValue === "object" && currentValue !== null);
    if (ehObjeto) {
      return JSON.stringify(currentValue ?? null) !== JSON.stringify(value ?? null);
    }
    return String(currentValue ?? "") !== String(value ?? "");
  });

  if (!hasActualChanges) return;

  const { updates, removidos } = montarUpdateComRemocoes(currentData, dados);
  const agora = new Date().toISOString();
  const nomeAutor = autor?.usuarioNome?.trim() || "-";

  await updateDoc(docRef, {
    ...updates,
    dt_alteracao: agora,
    ds_usuario_alteracao: nomeAutor,
  });

  try {
    const auditCol = collection(db, "pat_manutencao", id, "auditoria");
    const estadoFinal: Record<string, any> = { ...currentData, ...updates, dt_alteracao: agora, ds_usuario_alteracao: nomeAutor };
    for (const key of removidos) delete estadoFinal[key];
    await addDoc(auditCol, {
      usuarioId: autor?.usuarioId ?? null,
      usuarioNome: nomeAutor,
      acao: "update",
      timestamp: agora,
      detalhes: estadoFinal,
    });
  } catch (e) {
    console.error("Erro ao registrar auditoria de atualização", e);
  }
}

export async function excluirManutencao(id: string): Promise<void> {
  const docRef = doc(db, "pat_manutencao", id);
  await deleteDoc(docRef);
}
