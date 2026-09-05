import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  runTransaction,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { removerUndefined } from "@/lib/firestoreUtils";
import type { AuditAutor } from "@/services/auditService";

/* ═══════════════════════════════════════════════ */
/* ── Contador de sequência ──                    */
/* ═══════════════════════════════════════════════ */

const parametroContadorDoc = doc(db, "_counters", "relatorio_parametro_sequence");

async function obterProximoSequenciaParametro(): Promise<number> {
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(parametroContadorDoc);
      const proximo = (snap.exists() ? (snap.data().current ?? 0) : 0) + 1;
      tx.set(parametroContadorDoc, { current: proximo }, { merge: true });
      return proximo;
    });
  } catch {
    return Date.now();
  }
}

/* ═══════════════════════════════════════════════ */
/* ── relatorio_parametro ──                      */
/* ═══════════════════════════════════════════════ */

const parametroColecao = collection(db, "relatorio_parametro");

/**
 * Normaliza um documento de parâmetro, convertendo os nomes antigos de campos
 * (campo, mascara, valor, conector, parametro) para os novos (ie_campo, ie_mascara,
 * vl_padrao, ie_conector, ie_parametro).
 */
export function normalizarParametroDoc(raw: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...raw };
  if (out.ie_campo === undefined && out.campo !== undefined) out.ie_campo = out.campo;
  if (out.ie_mascara === undefined && out.mascara !== undefined) out.ie_mascara = out.mascara;
  if (out.vl_padrao === undefined && out.valor !== undefined) out.vl_padrao = out.valor;
  if (out.ie_conector === undefined && out.conector !== undefined) out.ie_conector = out.conector;
  if (out.ie_parametro === undefined && out.parametro !== undefined) out.ie_parametro = out.parametro;
  delete out.campo;
  delete out.mascara;
  delete out.valor;
  delete out.conector;
  delete out.parametro;
  return out;
}

/** Retorna todos os parâmetros de um relatório (por nr_seq_relatorio). */
export async function obterParametrosPorRelatorio(nrSeqRelatorio: number): Promise<Record<string, any>[]> {
  const q = query(parametroColecao, where("nr_seq_relatorio", "==", nrSeqRelatorio));
  const snap = await getDocs(q);
  return snap.docs.map((d) => { const { id: _fid, ...rest } = d.data() as any; return { id: d.id, _firestoreId: d.id, ...normalizarParametroDoc(rest) }; });
}

/** Cria um novo parâmetro. */
export async function criarParametro(
  parametro: Record<string, any>,
  autor?: AuditAutor
): Promise<{ id: string; nr_sequencia: number; dt_criacao: string; dt_alteracao: string; ds_usuario_criacao: string; ds_usuario_alteracao: string }> {
  const agora = new Date().toISOString();
  const nr_sequencia = await obterProximoSequenciaParametro();
  const nomeAutor = autor?.usuarioNome?.trim() || "-";

  const { id: _pid, ...parametroSemId } = parametro as Record<string, any>;
  const dados = removerUndefined({
    ...parametroSemId,
    nr_sequencia,
    dt_criacao: agora,
    dt_alteracao: agora,
    ds_usuario_criacao: nomeAutor,
    ds_usuario_alteracao: nomeAutor,
  });

  const docRef = await addDoc(parametroColecao, dados);

  // Auditoria
  try {
    const auditCol = collection(db, "relatorio_parametro", docRef.id, "auditoria");
    await addDoc(auditCol, {
      usuarioId: autor?.usuarioId ?? null,
      usuarioNome: nomeAutor,
      acao: "create",
      timestamp: agora,
      detalhes: dados,
    });
  } catch (e) {
    console.error("Erro ao registrar auditoria de parâmetro (criação)", e);
  }

  return { id: docRef.id, nr_sequencia, dt_criacao: agora, dt_alteracao: agora, ds_usuario_criacao: nomeAutor, ds_usuario_alteracao: nomeAutor };
}

/** Atualiza um parâmetro existente. */
export async function atualizarParametro(
  id: string,
  parametro: Record<string, any>,
  autor?: AuditAutor
): Promise<{ dt_alteracao: string; ds_usuario_alteracao: string }> {
  const docRef = doc(db, "relatorio_parametro", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return { dt_alteracao: '', ds_usuario_alteracao: '' };

  const currentData = snap.data();
  const agora = new Date().toISOString();
  const nomeAutor = autor?.usuarioNome?.trim() || "-";

  const { id: _eid, ...parametroSemId } = parametro as Record<string, any>;
  const dadosParaSalvar: Record<string, any> = removerUndefined({
    ...parametroSemId,
    dt_alteracao: agora,
    ds_usuario_alteracao: nomeAutor,
  });

  delete dadosParaSalvar.dt_criacao;
  delete dadosParaSalvar.ds_usuario_criacao;

  await updateDoc(docRef, dadosParaSalvar);

  // Auditoria
  try {
    const auditCol = collection(db, "relatorio_parametro", id, "auditoria");
    const { id: _aid, ...antes } = currentData;
    const { id: _did, ...detalhes } = dadosParaSalvar;
    await addDoc(auditCol, {
      usuarioId: autor?.usuarioId ?? null,
      usuarioNome: nomeAutor,
      acao: "update",
      timestamp: agora,
      detalhes,
      antes,
    });
  } catch (e) {
    console.error("Erro ao registrar auditoria de parâmetro (atualização)", e);
  }

  return { dt_alteracao: agora, ds_usuario_alteracao: nomeAutor };
}

/** Exclui um parâmetro. */
export async function excluirParametro(id: string): Promise<void> {
  await deleteDoc(doc(db, "relatorio_parametro", id));
}

/** Exclui todos os parâmetros de um relatório. */
export async function excluirParametrosPorRelatorio(nrSeqRelatorio: number): Promise<void> {
  const parametros = await obterParametrosPorRelatorio(nrSeqRelatorio);
  for (const p of parametros) {
    await deleteDoc(doc(db, "relatorio_parametro", p.id));
  }
}
