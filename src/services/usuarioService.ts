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
import type { Usuario } from "@/types/usuario";
import type { AuditAutor } from "@/services/auditService";

const usuarioColecao = collection(db, "usuario");
const contadorUsuarioDoc = doc(db, "_counters", "usuario_sequence");

async function obterProximoUsuarioSequencia(): Promise<number> {
  try {
    const resultado = await runTransaction(db, async (transacao) => {
      const docSnap = await transacao.get(contadorUsuarioDoc);
      let proximo = 1;
      if (docSnap.exists()) {
        proximo = (docSnap.data().current ?? 0) + 1;
      }
      transacao.set(contadorUsuarioDoc, { current: proximo }, { merge: true });
      return proximo;
    });
    return resultado;
  } catch {
    try {
      await runTransaction(db, async (transacao) => {
        const docSnap = await transacao.get(contadorUsuarioDoc);
        if (!docSnap.exists()) {
          transacao.set(contadorUsuarioDoc, { current: 1 });
        }
      });
      return 1;
    } catch {
      return Date.now();
    }
  }
}

export async function obterUsuarios(): Promise<Usuario[]> {
  const snapshot = await getDocs(usuarioColecao);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    const { id, ...rest } = data as Record<string, any>;
    return { id: docSnap.id, ...rest } as Usuario;
  });
}

export async function criarUsuario(
  usuario: Omit<Usuario, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
  autor?: AuditAutor
): Promise<string> {
  const agora = new Date().toISOString();
  const nr_sequencia = await obterProximoUsuarioSequencia();
  const nomeAutor = autor?.usuarioNome?.trim() || '-';

  const dados = removerUndefined(usuario);

  const docRef = await addDoc(usuarioColecao, {
    ...dados,
    nr_sequencia,
    dt_criacao: agora,
    dt_alteracao: agora,
    ds_usuario_criacao: nomeAutor,
    ds_usuario_alteracao: nomeAutor,
  });

  try {
    const auditCol = collection(db, "usuario", docRef.id, "auditoria");
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
    console.error('Erro ao registrar auditoria de criação de usuário', e);
  }

  return docRef.id;
}

export async function atualizarUsuario(
  id: string,
  usuario: Partial<Omit<Usuario, "id" | "nr_sequencia" | "dt_criacao" | "ds_usuario_criacao" | "ds_usuario_alteracao">>,
  autor?: AuditAutor
): Promise<void> {
  const docRef = doc(db, "usuario", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    return;
  }

  const currentData = snap.data() as Record<string, any>;
  const hasActualChanges = Object.entries(usuario).some(([key, value]) => {
    const currentValue = currentData[key];
    return String(currentValue ?? '') !== String(value ?? '');
  });

  if (!hasActualChanges) {
    return;
  }

  const { updates, removidos } = montarUpdateComRemocoes(currentData, usuario);
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

    const changedKeys = Object.keys(usuario).filter((key) => {
      const currentValue = currentData[key];
      const newValue = (usuario as any)[key];
      return String(currentValue ?? '') !== String(newValue ?? '');
    });

    const auditCol = collection(db, "usuario", id, "auditoria");
    const isPasswordOnlyUpdate = changedKeys.length === 1 && changedKeys[0] === 'ds_senha';

    await addDoc(auditCol, {
      usuarioId: autor?.usuarioId ?? null,
      usuarioNome: autor?.usuarioNome ?? '-',
      acao: isPasswordOnlyUpdate ? 'password' : 'update',
      timestamp: agora,
      detalhes: updatedData,
    });
  } catch (e) {
    console.error('Erro ao registrar auditoria de atualização de usuário', e);
  }
}

export async function atualizarPreferenciaTema(id: string, config_tema: string): Promise<void> {
  await atualizarPreferenciasUsuario(id, { config_tema });
}

export async function atualizarPreferenciasUsuario(
  id: string,
  preferencias: Record<string, string>
): Promise<void> {
  const docRef = doc(db, "usuario", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    return;
  }
  await updateDoc(docRef, preferencias);
}

export async function excluirUsuario(id: string): Promise<void> {
  const docRef = doc(db, "usuario", id);
  await deleteDoc(docRef);
}
