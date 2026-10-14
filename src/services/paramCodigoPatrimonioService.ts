import {
  collection,
  getDocs,
  doc,
  setDoc,
  addDoc,
  query,
  orderBy,
  limit,
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

/**
 * Documentos gravados antes do controle de criação não têm dt_criacao/ds_usuario_criacao.
 * Nesse caso, a criação é inferida do registro de auditoria mais antigo.
 */
async function obterCriacaoPelaAuditoria(id: string): Promise<{ dt_criacao: string; ds_usuario_criacao: string } | null> {
  try {
    const q = query(collection(db, COLECAO, id, "auditoria"), orderBy("timestamp", "asc"), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const log = snap.docs[0].data();
    if (!log.timestamp) return null;
    return { dt_criacao: String(log.timestamp), ds_usuario_criacao: String(log.usuarioNome ?? "").trim() || "-" };
  } catch {
    return null;
  }
}

export async function obterParamCodigoPatrimonio(): Promise<ParamCodigoPatrimonio | null> {
  const snapshot = await getDocs(collection(db, COLECAO));
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  const dados = { id: docSnap.id, ...docSnap.data() } as ParamCodigoPatrimonio;
  if (!dados.dt_criacao || !dados.ds_usuario_criacao) {
    const criacao = await obterCriacaoPelaAuditoria(docSnap.id);
    if (criacao) {
      dados.dt_criacao = dados.dt_criacao || criacao.dt_criacao;
      dados.ds_usuario_criacao = dados.ds_usuario_criacao || criacao.ds_usuario_criacao;
    }
  }
  return dados;
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
    const dadosAtuais = docSnap.data();
    const atual = dadosAtuais.ds_regra ?? "";
    if (atual === dsRegra) return;
    // Completa a criação de documentos antigos que não a registravam.
    const criacao = !dadosAtuais.dt_criacao || !dadosAtuais.ds_usuario_criacao
      ? await obterCriacaoPelaAuditoria(docSnap.id)
      : null;
    await setDoc(doc(db, COLECAO, docSnap.id), {
      ds_regra: dsRegra,
      dt_alteracao: agora,
      ds_usuario_alteracao: nomeAutor,
      ...(criacao ? {
        dt_criacao: dadosAtuais.dt_criacao || criacao.dt_criacao,
        ds_usuario_criacao: dadosAtuais.ds_usuario_criacao || criacao.ds_usuario_criacao,
      } : {}),
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
