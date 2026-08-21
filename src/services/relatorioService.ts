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
import type { Relatorio } from "@/types/relatorio";
import type { AuditAutor } from "@/services/auditService";

const relatorioColecao = collection(db, "relatorios");
const contadorDoc = doc(db, "_counters", "relatorios_sequence");

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

export async function obterRelatorios(): Promise<Relatorio[]> {
  const snapshot = await getDocs(relatorioColecao);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    const { id, ...rest } = data as Record<string, any>;
    return { id: docSnap.id, ...rest } as Relatorio;
  });
}

export async function criarRelatorio(
  relatorio: Omit<Relatorio, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
  autor?: AuditAutor
): Promise<string> {
  const agora = new Date().toISOString();
  const nr_sequencia = await obterProximoSequencia();
  const nomeAutor = autor?.usuarioNome?.trim() || "-";

  const dados = removerUndefined(relatorio);

  const docRef = await addDoc(relatorioColecao, {
    ...dados,
    nr_sequencia,
    dt_criacao: agora,
    dt_alteracao: agora,
    ds_usuario_criacao: nomeAutor,
    ds_usuario_alteracao: nomeAutor,
  });

  try {
    const auditCol = collection(db, "relatorios", docRef.id, "auditoria");
    const snap = await getDoc(docRef);
    const full = snap.exists()
      ? snap.data()
      : { ...dados, nr_sequencia, dt_criacao: agora, dt_alteracao: agora };
    await addDoc(auditCol, {
      usuarioId: autor?.usuarioId ?? null,
      usuarioNome: autor?.usuarioNome ?? "-",
      acao: "create",
      timestamp: agora,
      detalhes: full,
    });
  } catch (e) {
    console.error("Erro ao registrar auditoria de criação", e);
  }

  return docRef.id;
}

export async function atualizarRelatorio(
  id: string,
  relatorio: Partial<Omit<Relatorio, "id" | "nr_sequencia" | "dt_criacao" | "ds_usuario_criacao" | "ds_usuario_alteracao">>,
  autor?: AuditAutor
): Promise<void> {
  const docRef = doc(db, "relatorios", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;

  const currentData = snap.data() as Record<string, any>;
  const hasChanges = Object.entries(relatorio).some(([key, value]) => {
    const currentValue = currentData[key];
    const ehObjeto =
      (typeof value === "object" && value !== null) ||
      (typeof currentValue === "object" && currentValue !== null);
    if (ehObjeto) {
      return JSON.stringify(currentValue ?? null) !== JSON.stringify(value ?? null);
    }
    return String(currentValue ?? "") !== String(value ?? "");
  });

  if (!hasChanges) return;

  const dados = removerUndefined(relatorio);
  const agora = new Date().toISOString();
  const nomeAutor = autor?.usuarioNome?.trim() || "-";

  await updateDoc(docRef, {
    ...dados,
    dt_alteracao: agora,
    ds_usuario_alteracao: nomeAutor,
  });

  try {
    const auditCol = collection(db, "relatorios", id, "auditoria");
    const full = { ...currentData, ...dados, dt_alteracao: agora, ds_usuario_alteracao: nomeAutor };
    await addDoc(auditCol, {
      usuarioId: autor?.usuarioId ?? null,
      usuarioNome: autor?.usuarioNome ?? "-",
      acao: "update",
      timestamp: agora,
      detalhes: full,
    });
  } catch (e) {
    console.error("Erro ao registrar auditoria de atualização", e);
  }
}

export async function excluirRelatorio(id: string): Promise<void> {
  const docRef = doc(db, "relatorios", id);
  await deleteDoc(docRef);
}
