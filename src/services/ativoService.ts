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
import type { Ativo } from "@/types/ativo";
import type { AuditAutor } from "@/services/auditService";

const ativoColecao = collection(db, "pat_ativo");
const contadorDoc = doc(db, "_counters", "pat_ativo_sequence");

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

export async function obterAtivos(): Promise<Ativo[]> {
  const snapshot = await getDocs(ativoColecao);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const { id, ...rest } = data as Record<string, any>;
    return { id: doc.id, ...rest } as Ativo;
  });
}

export async function criarAtivo(
  ativo: Omit<Ativo, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
  autor?: AuditAutor
): Promise<string> {
  const agora = new Date().toISOString();
  const nr_sequencia = await obterProximoSequencia();
  const nomeAutor = autor?.usuarioNome?.trim() || '-';

  const dados = removerUndefined(ativo);
  // Limpar responsaveis: remover objetos com nr_seq_responsavel undefined.
  if (Array.isArray(dados.responsaveis)) {
    const limpos = dados.responsaveis.filter((r: any) => r?.nr_seq_responsavel !== undefined);
    dados.responsaveis = limpos.length > 0 ? limpos : [];
  }

  const docRef = await addDoc(ativoColecao, {
    ...dados,
    nr_sequencia,
    dt_criacao: agora,
    dt_alteracao: agora,
    ds_usuario_criacao: nomeAutor,
    ds_usuario_alteracao: nomeAutor,
  });
  try {
    // registrar auditoria na subcollection pat_ativo/{id}/auditoria
    const auditCol = collection(db, "pat_ativo", docRef.id, "auditoria");
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
    // não impedir criação se auditoria falhar
    console.error('Erro ao registrar auditoria de criação', e);
  }
  return docRef.id;
}

export async function atualizarAtivo(
  id: string,
  ativo: Partial<Omit<Ativo, "id" | "nr_sequencia" | "dt_criacao" | "ds_usuario_criacao" | "ds_usuario_alteracao">>,
  autor?: AuditAutor
): Promise<void> {
  const docRef = doc(db, "pat_ativo", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    return;
  }

  const currentData = snap.data() as Record<string, any>;

  // Limpar responsaveis: remover objetos com nr_seq_responsavel undefined.
  const ativoLimpo = { ...ativo };
  if (Array.isArray(ativoLimpo.responsaveis)) {
    const limpos = ativoLimpo.responsaveis.filter((r: any) => r?.nr_seq_responsavel !== undefined);
    ativoLimpo.responsaveis = limpos.length > 0 ? limpos : [];
  }

  const hasActualChanges = Object.entries(ativoLimpo).some(([key, value]) => {
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

  const { updates, removidos } = montarUpdateComRemocoes(currentData, ativoLimpo);
  const agora = new Date().toISOString();
  const nomeAutor = autor?.usuarioNome?.trim() || '-';
  await updateDoc(docRef, removerUndefined({
    ...updates,
    dt_alteracao: agora,
    ds_usuario_alteracao: nomeAutor,
  }));

  try {
    const auditCol = collection(db, "pat_ativo", id, "auditoria");
    const estadoFinal: Record<string, any> = { ...currentData, ...updates, dt_alteracao: agora, ds_usuario_alteracao: nomeAutor };
    for (const key of removidos) delete estadoFinal[key];
    const full = estadoFinal;
    await addDoc(auditCol, {
      usuarioId: autor?.usuarioId ?? null,
      usuarioNome: autor?.usuarioNome ?? '-',
      acao: 'update',
      timestamp: agora,
      detalhes: removerUndefined(full),
    });
  } catch (e) {
    console.error('Erro ao registrar auditoria de atualização', e);
  }
}

export async function excluirAtivo(id: string): Promise<void> {
  const docRef = doc(db, "pat_ativo", id);
  await deleteDoc(docRef);
}
