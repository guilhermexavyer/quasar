import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Imagem } from "@/types/imagem";

const COLLECTION = "imagem";

export async function obterImagens(): Promise<Imagem[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Imagem));
  list.sort((a, b) => (a.nr_sequencia ?? 0) - (b.nr_sequencia ?? 0));
  return list;
}

const contadorDoc = doc(db, "_counters", "imagem_sequence");

async function obterProximaImagemSequencia(): Promise<number> {
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

export async function criarImagem(
  data: Omit<Imagem, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
  usuario?: string
): Promise<string> {
  const nrSeq = await obterProximaImagemSequencia();
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    nr_sequencia: nrSeq,
    dt_criacao: now,
    ds_usuario_criacao: usuario || "",
    dt_alteracao: now,
    ds_usuario_alteracao: usuario || "",
  });

  // Registrar auditoria de criação
  try {
    const auditCol = collection(db, COLLECTION, docRef.id, "auditoria");
    await addDoc(auditCol, {
      usuarioNome: usuario || "-",
      acao: "create",
      timestamp: now,
      detalhes: {
        ...data,
        nr_sequencia: nrSeq,
        dt_criacao: now,
        dt_alteracao: now,
        ds_usuario_criacao: usuario || "",
        ds_usuario_alteracao: usuario || "",
      },
    });
  } catch (e) {
    console.error("Erro ao registrar auditoria de criação de imagem", e);
  }

  return docRef.id;
}

export async function atualizarImagem(
  id: string,
  data: Partial<Imagem>,
  usuario?: string
): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;

  const now = new Date().toISOString();
  const antes = snap.data() as Record<string, any>;
  const atualizacoes = { ...data, dt_alteracao: now, ds_usuario_alteracao: usuario || "" };
  await updateDoc(docRef, atualizacoes);

  // Registrar auditoria de alteração
  try {
    const auditCol = collection(db, COLLECTION, id, "auditoria");
    await addDoc(auditCol, {
      usuarioNome: usuario || "-",
      acao: "update",
      timestamp: now,
      antes,
      depois: { ...antes, ...atualizacoes },
    });
  } catch (e) {
    console.error("Erro ao registrar auditoria de atualização de imagem", e);
  }
}

export async function excluirImagem(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

/** Exclui o arquivo de imagem do diretório public/images/. */
export async function excluirArquivoImagem(filePath: string): Promise<void> {
  if (!filePath) return;
  try {
    await fetch('/api/delete-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath }),
    });
  } catch (e) {
    console.error('Erro ao excluir arquivo de imagem:', e);
  }
}

/** Renomeia o arquivo de imagem no diretório e retorna o novo caminho. */
export async function renomearArquivoImagem(oldPath: string, newFileName: string): Promise<string> {
  const res = await fetch('/api/rename-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldPath, newFileName }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao renomear arquivo');
  }
  const result = await res.json();
  return result.path;
}

export async function obterImagemPorId(id: string): Promise<Imagem | null> {
  const docRef = doc(db, COLLECTION, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Imagem;
}

/**
 * Upload de imagem para o diretório public/images/.
 * Retorna o caminho relativo salvo no Firestore (ex.: /images/arquivo.png).
 */
export async function uploadImagem(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("directory", "images");

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro ao fazer upload da imagem" }));
    throw new Error(err.error || "Erro ao fazer upload da imagem");
  }

  const result = await res.json();
  return result.path || `/images/${file.name}`;
}
