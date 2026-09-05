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

/** Retorna todos os parâmetros de um relatório (por nr_seq_relatorio). */
export async function obterParametrosPorRelatorio(nrSeqRelatorio: number): Promise<Record<string, any>[]> {
  const q = query(parametroColecao, where("nr_seq_relatorio", "==", nrSeqRelatorio));
  const snap = await getDocs(q);
  return snap.docs.map((d) => { const { id: _fid, ...rest } = d.data() as any; return { id: d.id, ...rest }; });
}

/** Cria um novo parâmetro. */
export async function criarParametro(
  parametro: Record<string, any>,
  autor?: AuditAutor
): Promise<{ id: string; nr_sequencia: number }> {
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

  return { id: docRef.id, nr_sequencia };
}

/** Atualiza um parâmetro existente. */
export async function atualizarParametro(
  id: string,
  parametro: Record<string, any>,
  autor?: AuditAutor
): Promise<void> {
  const docRef = doc(db, "relatorio_parametro", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;

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
