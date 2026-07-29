import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Aluno } from "@/types/aluno";

const alunosColecao = collection(db, "pessoa_fisica");
const contadorDoc = doc(db, "_counters", "pessoa_fisica_sequence");

/* ── Obtém o próximo nr_sequencia de forma atômica ── */
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
    // fallback: se falhar (ex: documento não existe), tenta criar
    try {
      await runTransaction(db, async (transacao) => {
        const docSnap = await transacao.get(contadorDoc);
        if (!docSnap.exists()) {
          transacao.set(contadorDoc, { current: 1 });
        }
      });
      return 1;
    } catch {
      return Date.now(); // último fallback
    }
  }
}

export async function obterAlunos(): Promise<Aluno[]> {
  const snapshot = await getDocs(alunosColecao);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Aluno[];
}

export async function criarAluno(
  aluno: Omit<Aluno, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao">
): Promise<string> {
  const agora = new Date().toISOString();
  const nr_sequencia = await obterProximoSequencia();

  const docRef = await addDoc(alunosColecao, {
    ...aluno,
    nr_sequencia,
    dt_criacao: agora,
    dt_alteracao: agora,
  });
  return docRef.id;
}

export async function atualizarAluno(
  id: string,
  aluno: Partial<Omit<Aluno, "id" | "nr_sequencia" | "dt_criacao">>
): Promise<void> {
  const docRef = doc(db, "pessoa_fisica", id);
  await updateDoc(docRef, {
    ...aluno,
    dt_alteracao: new Date().toISOString(),
  });
}

export async function excluirAluno(id: string): Promise<void> {
  const docRef = doc(db, "pessoa_fisica", id);
  await deleteDoc(docRef);
}
