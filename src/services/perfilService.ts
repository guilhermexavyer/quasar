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
import type { Perfil } from "@/types/perfil";
import type { AuditAutor } from "@/services/auditService";

const perfilColecao = collection(db, "perfil");
const contadorPerfilDoc = doc(db, "_counters", "perfil_sequence");

async function obterProximoPerfilSequencia(): Promise<number> {
  try {
    const resultado = await runTransaction(db, async (transacao) => {
      const docSnap = await transacao.get(contadorPerfilDoc);
      let proximo = 1;
      if (docSnap.exists()) {
        proximo = (docSnap.data().current ?? 0) + 1;
      }
      transacao.set(contadorPerfilDoc, { current: proximo }, { merge: true });
      return proximo;
    });
    return resultado;
  } catch {
    try {
      await runTransaction(db, async (transacao) => {
        const docSnap = await transacao.get(contadorPerfilDoc);
        if (!docSnap.exists()) {
          transacao.set(contadorPerfilDoc, { current: 1 });
        }
      });
      return 1;
    } catch {
      return Date.now();
    }
  }
}

export async function obterPerfis(): Promise<Perfil[]> {
  const snapshot = await getDocs(perfilColecao);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    const { id, ...rest } = data as Record<string, any>;
    return { id: docSnap.id, ...rest } as Perfil;
  });
}

export async function criarPerfil(
  perfil: Omit<Perfil, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
  autor?: AuditAutor
): Promise<string> {
  const agora = new Date().toISOString();
  const nr_sequencia = await obterProximoPerfilSequencia();
  const nomeAutor = autor?.usuarioNome?.trim() || '-';

  const dados = removerUndefined(perfil);

  const docRef = await addDoc(perfilColecao, {
    ...dados,
    nr_sequencia,
    dt_criacao: agora,
    dt_alteracao: agora,
    ds_usuario_criacao: nomeAutor,
    ds_usuario_alteracao: nomeAutor,
  });

  try {
    const auditCol = collection(db, "perfil", docRef.id, "auditoria");
    await addDoc(auditCol, {
      usuarioId: autor?.usuarioId ?? null,
      usuarioNome: autor?.usuarioNome ?? '-',
      acao: 'create',
      timestamp: agora,
      detalhes: {
        ...dados,
        nr_sequencia,
        dt_criacao: agora,
        dt_alteracao: agora,
        ds_usuario_criacao: nomeAutor,
        ds_usuario_alteracao: nomeAutor,
      },
    });
  } catch (e) {
    console.error('Erro ao registrar auditoria de criação de perfil', e);
  }

  return docRef.id;
}

export async function atualizarPerfil(
  id: string,
  perfil: Partial<Omit<Perfil, "id" | "nr_sequencia" | "dt_criacao" | "ds_usuario_criacao" | "ds_usuario_alteracao">>,
  autor?: AuditAutor
): Promise<void> {
  const docRef = doc(db, "perfil", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    return;
  }

  const currentData = snap.data() as Record<string, any>;
  const hasActualChanges = Object.entries(perfil).some(([key, value]) => {
    const currentValue = currentData[key];
    return String(currentValue ?? '') !== String(value ?? '');
  });

  if (!hasActualChanges) {
    return;
  }

  const { updates, removidos } = montarUpdateComRemocoes(currentData, perfil);
  const agora = new Date().toISOString();
  const nomeAutor = autor?.usuarioNome?.trim() || '-';
  await updateDoc(docRef, {
    ...updates,
    dt_alteracao: agora,
    ds_usuario_alteracao: nomeAutor,
  });

  try {
    // Estado final do documento para a auditoria (sem os campos removidos).
    const updatedData: Record<string, any> = {
      ...currentData,
      ...updates,
      dt_alteracao: agora,
      ds_usuario_alteracao: nomeAutor,
    };
    for (const key of removidos) delete updatedData[key];

    const auditCol = collection(db, "perfil", id, "auditoria");
    await addDoc(auditCol, {
      usuarioId: autor?.usuarioId ?? null,
      usuarioNome: autor?.usuarioNome ?? '-',
      acao: 'update',
      timestamp: agora,
      detalhes: updatedData,
    });
  } catch (e) {
    console.error('Erro ao registrar auditoria de atualização de perfil', e);
  }
}

export async function excluirPerfil(id: string): Promise<void> {
  const docRef = doc(db, "perfil", id);
  await deleteDoc(docRef);
}
