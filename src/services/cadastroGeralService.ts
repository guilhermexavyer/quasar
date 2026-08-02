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
import { removerUndefined } from "@/lib/firestoreUtils";
import type { AuditAutor } from "@/services/auditService";

export interface CadastroGeralRecord {
  id?: string;
  nr_sequencia: number;
  ie_status?: string;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}

async function obterProximoSequencia(contadorDoc: ReturnType<typeof doc>): Promise<number> {
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

export function createCadastroGeralService<T extends CadastroGeralRecord>(
  collectionName: string,
  counterName: string
) {
  const colecao = collection(db, collectionName);
  const contadorDoc = doc(db, "_counters", counterName);

  return {
    async obterTodos(): Promise<T[]> {
      const snapshot = await getDocs(colecao);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        const { id, ...rest } = data as Record<string, any>;
        return { id: doc.id, ...rest } as T;
      });
    },

    async criar(
      item: Omit<T, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
      autor?: AuditAutor
    ): Promise<string> {
      const agora = new Date().toISOString();
      const nr_sequencia = await obterProximoSequencia(contadorDoc);
      const nomeAutor = autor?.usuarioNome?.trim() || '-';

      const dados = removerUndefined(item);

      const docRef = await addDoc(colecao, {
        ...dados,
        nr_sequencia,
        dt_criacao: agora,
        dt_alteracao: agora,
        ds_usuario_criacao: nomeAutor,
        ds_usuario_alteracao: nomeAutor,
      });
      try {
        const auditCol = collection(db, collectionName, docRef.id, "auditoria");
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
    },

    async atualizar(
      id: string,
      item: Partial<Omit<T, "id" | "nr_sequencia" | "dt_criacao" | "ds_usuario_criacao" | "ds_usuario_alteracao">>,
      autor?: AuditAutor
    ): Promise<void> {
      const docRef = doc(db, collectionName, id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return;
      }

      const currentData = snap.data() as Record<string, any>;
      const hasActualChanges = Object.entries(item).some(([key, value]) => {
        const currentValue = currentData[key];
        return String(currentValue ?? '') !== String(value ?? '');
      });

      if (!hasActualChanges) {
        return;
      }

      const dados = removerUndefined(item);
      const agora = new Date().toISOString();
      const nomeAutor = autor?.usuarioNome?.trim() || '-';
      await updateDoc(docRef, {
        ...dados,
        dt_alteracao: agora,
        ds_usuario_alteracao: nomeAutor,
      });

      try {
        const auditCol = collection(db, collectionName, id, "auditoria");
        const full = removerUndefined({ ...currentData, ...dados, dt_alteracao: agora, ds_usuario_alteracao: nomeAutor });
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
    },

    async excluir(id: string): Promise<void> {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    },
  };
}
