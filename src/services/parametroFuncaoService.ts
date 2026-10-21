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

/**
 * Parâmetros das funções (tela Parâmetros). Cada parâmetro tem a própria
 * coleção com um único documento e a subcoleção auditoria. O valor fica em
 * ds_regra (regra de geração de código), cd_cor (cor de status) ou ie_regra (opção Sim/Não).
 */
export const COLECAO_PARAM_CODIGO_PATRIMONIO = "pat_param_codigo_patrimonio";
export const COLECAO_PARAM_MATRICULA_ALUNO = "ea_param_matricula_aluno";
export const COLECAO_PARAM_COR_PERIODO_LETIVO_ANDAMENTO = "ea_param_cor_periodo_letivo_andamento";
export const COLECAO_PARAM_COR_PERIODO_LETIVO_ENCERRADO = "ea_param_cor_periodo_letivo_encerrado";
export const COLECAO_PARAM_ENCERRAMENTO_AUTOMATICO_PERIODO_LETIVO = "ea_param_encerramento_automatico_periodo_letivo";

/** Campo onde o valor do parâmetro é gravado. */
export type CampoParametro = "ds_regra" | "cd_cor" | "ie_regra";

export interface ParametroFuncao {
  id?: string;
  ds_regra?: string;
  cd_cor?: string;
  /** Opção Sim ('S') / Não ('N' ou vazio). */
  ie_regra?: string;
  dt_criacao?: string;
  dt_alteracao?: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}

/**
 * Documentos gravados antes do controle de criação não têm dt_criacao/ds_usuario_criacao.
 * Nesse caso, a criação é inferida do registro de auditoria mais antigo.
 */
async function obterCriacaoPelaAuditoria(colecao: string, id: string): Promise<{ dt_criacao: string; ds_usuario_criacao: string } | null> {
  try {
    const q = query(collection(db, colecao, id, "auditoria"), orderBy("timestamp", "asc"), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const log = snap.docs[0].data();
    if (!log.timestamp) return null;
    return { dt_criacao: String(log.timestamp), ds_usuario_criacao: String(log.usuarioNome ?? "").trim() || "-" };
  } catch {
    return null;
  }
}

export async function obterParametro(colecao: string): Promise<ParametroFuncao | null> {
  const snapshot = await getDocs(collection(db, colecao));
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  const dados = { id: docSnap.id, ...docSnap.data() } as ParametroFuncao;
  if (!dados.dt_criacao || !dados.ds_usuario_criacao) {
    const criacao = await obterCriacaoPelaAuditoria(colecao, docSnap.id);
    if (criacao) {
      dados.dt_criacao = dados.dt_criacao || criacao.dt_criacao;
      dados.ds_usuario_criacao = dados.ds_usuario_criacao || criacao.ds_usuario_criacao;
    }
  }
  return dados;
}

export async function salvarParametro(colecao: string, campo: CampoParametro, valor: string, autor?: AuditAutor): Promise<void> {
  const agora = new Date().toISOString();
  const nomeAutor = autor?.usuarioNome?.trim() || '-';
  const snapshot = await getDocs(collection(db, colecao));
  if (snapshot.empty) {
    const docRef = doc(collection(db, colecao));
    await setDoc(docRef, {
      [campo]: valor,
      dt_criacao: agora,
      dt_alteracao: agora,
      ds_usuario_criacao: nomeAutor,
      ds_usuario_alteracao: nomeAutor,
    });
    // Registrar auditoria na subcollection
    try {
      const auditCol = collection(db, colecao, docRef.id, "auditoria");
      await addDoc(auditCol, {
        usuarioId: autor?.usuarioId ?? null,
        usuarioNome: nomeAutor,
        acao: "create",
        timestamp: agora,
        detalhes: { [campo]: valor },
      });
    } catch (e) {
      console.error("Erro ao registrar auditoria de criação", e);
    }
  } else {
    const docSnap = snapshot.docs[0];
    const dadosAtuais = docSnap.data();
    const atual = dadosAtuais[campo] ?? "";
    if (atual === valor) return;
    // Completa a criação de documentos antigos que não a registravam.
    const criacao = !dadosAtuais.dt_criacao || !dadosAtuais.ds_usuario_criacao
      ? await obterCriacaoPelaAuditoria(colecao, docSnap.id)
      : null;
    await setDoc(doc(db, colecao, docSnap.id), {
      [campo]: valor,
      dt_alteracao: agora,
      ds_usuario_alteracao: nomeAutor,
      ...(criacao ? {
        dt_criacao: dadosAtuais.dt_criacao || criacao.dt_criacao,
        ds_usuario_criacao: dadosAtuais.ds_usuario_criacao || criacao.ds_usuario_criacao,
      } : {}),
    }, { merge: true });
    // Registrar auditoria na subcollection
    try {
      const auditCol = collection(db, colecao, docSnap.id, "auditoria");
      await addDoc(auditCol, {
        usuarioId: autor?.usuarioId ?? null,
        usuarioNome: nomeAutor,
        acao: "update",
        timestamp: agora,
        detalhes: { [campo]: valor },
      });
    } catch (e) {
      console.error("Erro ao registrar auditoria de atualização", e);
    }
  }
}
