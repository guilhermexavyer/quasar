import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AuditAutor } from "@/services/auditService";

const COLECAO = "pat_param_codigo_patrimonio";

export interface ParamCodigoPatrimonio {
  id?: string;
  ds_regra: string;
  dt_criacao?: string;
  dt_alteracao?: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}

export async function obterParamCodigoPatrimonio(): Promise<ParamCodigoPatrimonio | null> {
  const snapshot = await getDocs(collection(db, COLECAO));
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as ParamCodigoPatrimonio;
}

export async function salvarParamCodigoPatrimonio(dsRegra: string, autor?: AuditAutor): Promise<void> {
  const agora = new Date().toISOString();
  const nomeAutor = autor?.usuarioNome?.trim() || '-';
  const snapshot = await getDocs(collection(db, COLECAO));
  if (snapshot.empty) {
    const docRef = doc(collection(db, COLECAO));
    await setDoc(docRef, {
      ds_regra: dsRegra,
      dt_criacao: agora,
      dt_alteracao: agora,
      ds_usuario_criacao: nomeAutor,
      ds_usuario_alteracao: nomeAutor,
    });
    // Registrar auditoria na subcollection
    try {
      const auditCol = collection(db, COLECAO, docRef.id, "auditoria");
      await addDoc(auditCol, {
        usuarioId: autor?.usuarioId ?? null,
        usuarioNome: nomeAutor,
        acao: "create",
        timestamp: agora,
        detalhes: { ds_regra: dsRegra },
      });
    } catch (e) {
      console.error("Erro ao registrar auditoria de criação", e);
    }
  } else {
    const docSnap = snapshot.docs[0];
    const atual = docSnap.data().ds_regra ?? "";
    if (atual === dsRegra) return;
    await setDoc(doc(db, COLECAO, docSnap.id), {
      ds_regra: dsRegra,
      dt_alteracao: agora,
      ds_usuario_alteracao: nomeAutor,
    }, { merge: true });
    // Registrar auditoria na subcollection
    try {
      const auditCol = collection(db, COLECAO, docSnap.id, "auditoria");
      await addDoc(auditCol, {
        usuarioId: autor?.usuarioId ?? null,
        usuarioNome: nomeAutor,
        acao: "update",
        timestamp: agora,
        detalhes: { ds_regra: dsRegra },
      });
    } catch (e) {
      console.error("Erro ao registrar auditoria de atualização", e);
    }
  }
}
