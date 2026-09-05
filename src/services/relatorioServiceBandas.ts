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
/* ── Contadores de sequência ──                  */
/* ═══════════════════════════════════════════════ */

const bandaContadorDoc = doc(db, "_counters", "relatorio_banda_sequence");
const elementoContadorDoc = doc(db, "_counters", "relatorio_banda_elemento_sequence");

async function obterProximoSequenciaBanda(): Promise<number> {
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(bandaContadorDoc);
      const proximo = (snap.exists() ? (snap.data().current ?? 0) : 0) + 1;
      tx.set(bandaContadorDoc, { current: proximo }, { merge: true });
      return proximo;
    });
  } catch {
    return Date.now();
  }
}

async function obterProximoSequenciaElemento(): Promise<number> {
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(elementoContadorDoc);
      const proximo = (snap.exists() ? (snap.data().current ?? 0) : 0) + 1;
      tx.set(elementoContadorDoc, { current: proximo }, { merge: true });
      return proximo;
    });
  } catch {
    return Date.now();
  }
}

/* ═══════════════════════════════════════════════ */
/* ── relatorio_banda ──                          */
/* ═══════════════════════════════════════════════ */

const bandaColecao = collection(db, "relatorio_banda");

/** Retorna todas as bandas de um relatório (por nr_seq_relatorio). */
export async function obterBandasPorRelatorio(nrSeqRelatorio: number): Promise<Record<string, any>[]> {
  const q = query(bandaColecao, where("nr_seq_relatorio", "==", nrSeqRelatorio));
  const snap = await getDocs(q);
  return snap.docs.map((d) => { const { id: _fid, ...rest } = d.data() as any; return { id: d.id, ...rest }; });
}

/** Retorna todas as bandas de um relatório (por docId do relatório). */
export async function obterBandasPorRelatorioId(relatorioId: string): Promise<Record<string, any>[]> {
  // Busca o relatório para obter nr_sequencia
  const relDoc = await getDoc(doc(db, "relatorio", relatorioId));
  if (!relDoc.exists()) return [];
  const nrSeq = relDoc.data().nr_sequencia;
  return obterBandasPorRelatorio(nrSeq);
}

/** Cria uma nova banda. */
export async function criarBanda(
  banda: Record<string, any>,
  autor?: AuditAutor
): Promise<{ id: string; nr_sequencia: number; dt_criacao: string; dt_alteracao: string; ds_usuario_criacao: string; ds_usuario_alteracao: string }> {
  const agora = new Date().toISOString();
  const nr_sequencia = await obterProximoSequenciaBanda();
  const nomeAutor = autor?.usuarioNome?.trim() || "-";

  const { id: _bid, ...bandaSemId } = banda as Record<string, any>;
  const dados = removerUndefined({
    ...bandaSemId,
    nr_sequencia,
    dt_criacao: agora,
    dt_alteracao: agora,
    ds_usuario_criacao: nomeAutor,
    ds_usuario_alteracao: nomeAutor,
  });

  const docRef = await addDoc(bandaColecao, dados);

  // Auditoria
  try {
    const auditCol = collection(db, "relatorio_banda", docRef.id, "auditoria");
    await addDoc(auditCol, {
      usuarioId: autor?.usuarioId ?? null,
      usuarioNome: nomeAutor,
      acao: "create",
      timestamp: agora,
      detalhes: dados,
    });
  } catch (e) {
    console.error("Erro ao registrar auditoria de banda (criação)", e);
  }

  return { id: docRef.id, nr_sequencia, dt_criacao: agora, dt_alteracao: agora, ds_usuario_criacao: nomeAutor, ds_usuario_alteracao: nomeAutor };
}

/** Atualiza uma banda existente. */
export async function atualizarBanda(
  id: string,
  banda: Record<string, any>,
  autor?: AuditAutor
): Promise<{ dt_alteracao: string; ds_usuario_alteracao: string }> {
  const docRef = doc(db, "relatorio_banda", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return { dt_alteracao: '', ds_usuario_alteracao: '' };

  const currentData = snap.data();
  const agora = new Date().toISOString();
  const nomeAutor = autor?.usuarioNome?.trim() || "-";

  // Mapear campos do form para o banco
  const dadosParaSalvar: Record<string, any> = removerUndefined({
    ...banda,
    dt_alteracao: agora,
    ds_usuario_alteracao: nomeAutor,
  });

  // Remover campos que não devem ser alterados
  delete dadosParaSalvar.id;
  delete dadosParaSalvar.dt_criacao;
  delete dadosParaSalvar.ds_usuario_criacao;

  await updateDoc(docRef, dadosParaSalvar);

  // Auditoria
  try {
    const auditCol = collection(db, "relatorio_banda", id, "auditoria");
    const { id: _id, ...detalhes } = dadosParaSalvar;
    const { id: _aid, ...antes } = currentData;
    await addDoc(auditCol, {
      usuarioId: autor?.usuarioId ?? null,
      usuarioNome: nomeAutor,
      acao: "update",
      timestamp: agora,
      detalhes,
      antes,
    });
  } catch (e) {
    console.error("Erro ao registrar auditoria de banda (atualização)", e);
  }

  return { dt_alteracao: agora, ds_usuario_alteracao: nomeAutor };
}

/** Exclui uma banda e seus elementos. */
export async function excluirBanda(id: string): Promise<void> {
  // Excluir elementos filhos
  const elementos = await obterElementosPorBanda(id);
  for (const el of elementos) {
    await excluirElemento(el.id);
  }
  await deleteDoc(doc(db, "relatorio_banda", id));
}

/* ═══════════════════════════════════════════════ */
/* ── relatorio_banda_elemento ──                 */
/* ═══════════════════════════════════════════════ */

const elementoColecao = collection(db, "relatorio_banda_elemento");

/** Retorna todos os elementos de uma banda. */
export async function obterElementosPorBanda(nrSeqBanda: string): Promise<Record<string, any>[]> {
  // Busca banda para obter nr_sequencia
  const bandaDoc = await getDoc(doc(db, "relatorio_banda", nrSeqBanda));
  if (!bandaDoc.exists()) return [];
  const nrSeq = bandaDoc.data().nr_sequencia;
  const q = query(elementoColecao, where("nr_seq_banda", "==", nrSeq));
  const snap = await getDocs(q);
  return snap.docs.map((d) => { const { id: _fid, ...rest } = d.data() as any; return { id: d.id, ...rest }; });
}

/** Retorna todos os elementos de uma banda pelo nr_sequencia da banda. */
export async function obterElementosPorBandaSeq(nrSeqBanda: number): Promise<Record<string, any>[]> {
  const q = query(elementoColecao, where("nr_seq_banda", "==", nrSeqBanda));
  const snap = await getDocs(q);
  return snap.docs.map((d) => { const { id: _fid, ...rest } = d.data() as any; return { id: d.id, ...rest }; });
}

/** Cria um novo elemento. */
export async function criarElemento(
  elemento: Record<string, any>,
  autor?: AuditAutor
): Promise<{ id: string; nr_sequencia: number; dt_criacao: string; dt_alteracao: string; ds_usuario_criacao: string; ds_usuario_alteracao: string }> {
  const agora = new Date().toISOString();
  const nr_sequencia = await obterProximoSequenciaElemento();
  const nomeAutor = autor?.usuarioNome?.trim() || "-";

  // Excluir 'id' do payload para não salvar UUID do cliente no Firestore
  const { id: _clientid, ...elementoSemId } = elemento as Record<string, any>;
  const dados = removerUndefined({
    ...elementoSemId,
    nr_sequencia,
    dt_criacao: agora,
    dt_alteracao: agora,
    ds_usuario_criacao: nomeAutor,
    ds_usuario_alteracao: nomeAutor,
  });

  const docRef = await addDoc(elementoColecao, dados);

  // Auditoria
  try {
    const auditCol = collection(db, "relatorio_banda_elemento", docRef.id, "auditoria");
    await addDoc(auditCol, {
      usuarioId: autor?.usuarioId ?? null,
      usuarioNome: nomeAutor,
      acao: "create",
      timestamp: agora,
      detalhes: dados,
    });
  } catch (e) {
    console.error("Erro ao registrar auditoria de elemento (criação)", e);
  }

  return { id: docRef.id, nr_sequencia, dt_criacao: agora, dt_alteracao: agora, ds_usuario_criacao: nomeAutor, ds_usuario_alteracao: nomeAutor };
}

/** Atualiza um elemento existente. */
export async function atualizarElemento(
  id: string,
  elemento: Record<string, any>,
  autor?: AuditAutor
): Promise<{ dt_alteracao: string; ds_usuario_alteracao: string }> {
  const docRef = doc(db, "relatorio_banda_elemento", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return { dt_alteracao: '', ds_usuario_alteracao: '' };

  const currentData = snap.data();
  const agora = new Date().toISOString();
  const nomeAutor = autor?.usuarioNome?.trim() || "-";

  const { id: _eid, ...elementoSemId2 } = elemento as Record<string, any>;
  const dadosParaSalvar: Record<string, any> = removerUndefined({
    ...elementoSemId2,
    dt_alteracao: agora,
    ds_usuario_alteracao: nomeAutor,
  });

  delete dadosParaSalvar.dt_criacao;
  delete dadosParaSalvar.ds_usuario_criacao;

  await updateDoc(docRef, dadosParaSalvar);

  // Auditoria
  try {
    const auditCol = collection(db, "relatorio_banda_elemento", id, "auditoria");
    const { id: _id, ...detalhes } = dadosParaSalvar;
    const { id: _aid, ...antes } = currentData;
    await addDoc(auditCol, {
      usuarioId: autor?.usuarioId ?? null,
      usuarioNome: nomeAutor,
      acao: "update",
      timestamp: agora,
      detalhes,
      antes,
    });
  } catch (e) {
    console.error("Erro ao registrar auditoria de elemento (atualização)", e);
  }

  return { dt_alteracao: agora, ds_usuario_alteracao: nomeAutor };
}

/** Exclui um elemento. */
export async function excluirElemento(id: string): Promise<void> {
  await deleteDoc(doc(db, "relatorio_banda_elemento", id));
}

/** Salva todos os elementos de uma banda (sync: cria, atualiza, exclui). */
export async function syncElementos(
  bandaId: string,
  nrSeqBanda: number,
  elementosExistentes: Record<string, any>[],
  elementosNovos: Record<string, any>[],
  autor?: AuditAutor
): Promise<void> {
  const existentesMap = new Map(elementosExistentes.map((e) => [e.id, e]));
  const novosMap = new Map(elementosNovos.map((e) => [e.id, e]));

  // Excluir elementos removidos
  for (const [id] of existentesMap) {
    if (!novosMap.has(id)) {
      await excluirElemento(id);
    }
  }

  // Criar ou atualizar elementos
  for (const el of elementosNovos) {
    const dados = { ...el, nr_seq_banda: nrSeqBanda, nr_seq_relatorio: undefined };
    delete dados.nr_seq_relatorio; // será preenchido pela banda

    if (el.id && existentesMap.has(el.id)) {
      // Atualizar existente
      await atualizarElemento(el.id, dados, autor);
    } else {
      // Criar novo
      await criarElemento(dados, autor);
    }
  }
}
