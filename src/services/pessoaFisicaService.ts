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
import type { PessoaFisica } from "@/types/pessoaFisica";
import type { AuditAutor } from "@/services/auditService";

const pessoaFisicaColecao = collection(db, "pessoa_fisica");
const contadorDoc = doc(db, "_counters", "pessoa_fisica_sequence");

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

export async function obterPessoasFisicas(): Promise<PessoaFisica[]> {
  const snapshot = await getDocs(pessoaFisicaColecao);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const { id, ...rest } = data as Record<string, any>;
    return { id: doc.id, ...rest } as PessoaFisica;
  });
}

export async function criarPessoaFisica(
  pessoa: Omit<PessoaFisica, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
  autor?: AuditAutor
): Promise<string> {
  const agora = new Date().toISOString();
  const nr_sequencia = await obterProximoSequencia();
  const nomeAutor = autor?.usuarioNome?.trim() || '-';

  const docRef = await addDoc(pessoaFisicaColecao, {
    ...pessoa,
    nr_sequencia,
    dt_criacao: agora,
    dt_alteracao: agora,
    ds_usuario_criacao: nomeAutor,
    ds_usuario_alteracao: nomeAutor,
  });
  try {
    // registrar auditoria na subcollection pessoa_fisica/{id}/auditoria
    const auditCol = collection(db, "pessoa_fisica", docRef.id, "auditoria");
    const snap = await getDoc(docRef);
    const full = snap.exists() ? snap.data() : { ...pessoa, nr_sequencia, dt_criacao: agora, dt_alteracao: agora };
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

export async function atualizarPessoaFisica(
  id: string,
  pessoa: Partial<Omit<PessoaFisica, "id" | "nr_sequencia" | "dt_criacao" | "ds_usuario_criacao" | "ds_usuario_alteracao">>,
  autor?: AuditAutor
): Promise<void> {
  const docRef = doc(db, "pessoa_fisica", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    return;
  }

  const currentData = snap.data() as Record<string, any>;
  const hasActualChanges = Object.entries(pessoa).some(([key, value]) => {
    const currentValue = currentData[key];
    return String(currentValue ?? '') !== String(value ?? '');
  });

  if (!hasActualChanges) {
    return;
  }

  const agora = new Date().toISOString();
  const nomeAutor = autor?.usuarioNome?.trim() || '-';
  await updateDoc(docRef, {
    ...pessoa,
    dt_alteracao: agora,
    ds_usuario_alteracao: nomeAutor,
  });

  try {
    const auditCol = collection(db, "pessoa_fisica", id, "auditoria");
    const full = { ...currentData, ...pessoa, dt_alteracao: agora, ds_usuario_alteracao: nomeAutor };
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

export async function excluirPessoaFisica(id: string): Promise<void> {
  const docRef = doc(db, "pessoa_fisica", id);
  await deleteDoc(docRef);
}
