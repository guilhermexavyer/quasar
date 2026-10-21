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
import { removerUndefined, removerUndefinedProfundo, montarUpdateComRemocoes } from "@/lib/firestoreUtils";
import type { Relatorio } from "@/types/relatorio";
import type { AuditAutor } from "@/services/auditService";
import { registrarExclusao } from "@/services/exclusaoService";

const relatorioColecao = collection(db, "relatorio");
const contadorDoc = doc(db, "_counters", "relatorio_sequence");

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
    const auditCol = collection(db, "relatorio", docRef.id, "auditoria");
    const snap = await getDoc(docRef);
    const rawFull = snap.exists()
      ? snap.data()
      : { ...dados, nr_sequencia, dt_criacao: agora, dt_alteracao: agora };
    const { bandas: _b, ...full } = rawFull as any;
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
  const docRef = doc(db, "relatorio", id);
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

  const { updates } = montarUpdateComRemocoes(currentData, relatorio);
  updates.dt_alteracao = new Date().toISOString();
  updates.ds_usuario_alteracao = autor?.usuarioNome?.trim() || "-";

  await updateDoc(docRef, updates);

  try {
    const auditCol = collection(db, "relatorio", id, "auditoria");
    const fullRaw = removerUndefined({ ...currentData, ...relatorio, dt_alteracao: updates.dt_alteracao, ds_usuario_alteracao: updates.ds_usuario_alteracao }) as Record<string, any>;
    // Remove bandas do log do relatório — bandas têm sua própria auditoria
    const { bandas: _bandas, ...full } = fullRaw;
    await addDoc(auditCol, {
      usuarioId: autor?.usuarioId ?? null,
      usuarioNome: autor?.usuarioNome ?? "-",
      acao: "update",
      timestamp: updates.dt_alteracao,
      detalhes: full,
    });
  } catch (e) {
    console.error("Erro ao registrar auditoria de atualização", e);
  }
}

export async function excluirRelatorio(id: string): Promise<void> {
  await registrarExclusao("relatorio", id);
  const docRef = doc(db, "relatorio", id);
  await deleteDoc(docRef);
}

/** Salva auditoria de uma banda específica na coleção relatorio_bandas/{bandId}/auditoria */
export async function salvarBandaAuditoria(
  bandId: string,
  bandaDados: Record<string, any>,
  bandaAnterior: Record<string, any> | null,
  autor?: AuditAutor
): Promise<void> {
  try {
    const auditCol = collection(db, "relatorio_bandas", bandId, "auditoria");
    const agora = new Date().toISOString();
    const acao = bandaAnterior ? "update" : "create";
    await addDoc(auditCol, {
      usuarioId: autor?.usuarioId ?? null,
      usuarioNome: autor?.usuarioNome ?? "-",
      acao,
      timestamp: agora,
      detalhes: bandaDados,
      ...(bandaAnterior ? { antes: bandaAnterior } : {}),
    });
  } catch (e) {
    console.error("Erro ao registrar auditoria de banda", e);
  }
}

/** Remove identificação e auditoria de um registro, para recriá-lo como cópia. */
function semIdentificacao(registro: Record<string, unknown>): Record<string, unknown> {
  const { id: _id, _firestoreId: _fs, nr_sequencia: _seq, dt_criacao: _dc, dt_alteracao: _da, ds_usuario_criacao: _uc, ds_usuario_alteracao: _ua, ...resto } = registro;
  return resto;
}

/**
 * Duplica um relatório com tudo o que pertence a ele: bandas (com ordenação),
 * elementos das bandas e parâmetros. Esses registros ficam em coleções
 * próprias, ligadas pelo nr_sequencia do relatório — copiar só o documento
 * do relatório gerava uma cópia sem bandas nem parâmetros.
 */
export async function duplicarRelatorio(relatorioId: string, autor?: AuditAutor): Promise<string> {
  const snap = await getDoc(doc(db, "relatorio", relatorioId));
  if (!snap.exists()) throw new Error("Relatório não encontrado.");
  const original = snap.data() as Record<string, unknown>;
  const seqOrigem = original.nr_sequencia;
  const { bandas: bandasEmbutidas, filtros: filtrosEmbutidos, ...dadosRelatorio } = semIdentificacao(original);

  const { obterBandasPorRelatorio, obterElementosPorBandaSeq, criarBanda, criarElemento } = await import("@/services/relatorioServiceBandas");
  const { obterParametrosPorRelatorio, criarParametro } = await import("@/services/relatorioServiceParametros");
  const bandasOrigem = seqOrigem != null ? await obterBandasPorRelatorio(Number(seqOrigem)) : [];
  const parametrosOrigem = seqOrigem != null ? await obterParametrosPorRelatorio(Number(seqOrigem)) : [];

  const novoId = await criarRelatorio(
    { ...dadosRelatorio, ds_relatorio: `${dadosRelatorio.ds_relatorio ?? ''} (Cópia)` } as Omit<Relatorio, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
    autor
  );
  const novaSeq = (await getDoc(doc(db, "relatorio", novoId))).data()?.nr_sequencia;

  // Bandas e seus elementos
  const bandasNovas: Record<string, unknown>[] = [];
  for (const banda of bandasOrigem) {
    const elementos = banda.nr_sequencia != null ? await obterElementosPorBandaSeq(Number(banda.nr_sequencia)) : [];
    const { campos: _campos, ...dadosBanda } = semIdentificacao(banda);
    const novaBanda = await criarBanda(removerUndefinedProfundo({ ...dadosBanda, nr_seq_relatorio: novaSeq }), autor);
    const camposNovos: Record<string, unknown>[] = [];
    for (const elemento of elementos) {
      const dadosElemento = { ...semIdentificacao(elemento), nr_seq_banda: novaBanda.nr_sequencia, nr_seq_relatorio: novaSeq };
      const novo = await criarElemento(dadosElemento, autor);
      camposNovos.push({ ...dadosElemento, id: novo.id, _firestoreId: novo.id, nr_sequencia: novo.nr_sequencia, dt_criacao: novo.dt_criacao, dt_alteracao: novo.dt_alteracao, ds_usuario_criacao: novo.ds_usuario_criacao, ds_usuario_alteracao: novo.ds_usuario_alteracao });
    }
    // Cópia embutida dos elementos na banda (mesmo formato do salvamento da banda)
    await updateDoc(doc(db, "relatorio_banda", novaBanda.id), { campos: removerUndefinedProfundo(camposNovos) });
    bandasNovas.push({ ...dadosBanda, nr_seq_relatorio: novaSeq, id: novaBanda.id, _firestoreId: novaBanda.id, nr_sequencia: novaBanda.nr_sequencia, dt_criacao: novaBanda.dt_criacao, dt_alteracao: novaBanda.dt_alteracao, ds_usuario_criacao: novaBanda.ds_usuario_criacao, ds_usuario_alteracao: novaBanda.ds_usuario_alteracao, campos: camposNovos });
  }

  // Parâmetros
  const filtrosNovos: Record<string, unknown>[] = [];
  for (const parametro of parametrosOrigem) {
    const dadosParametro = { ...semIdentificacao(parametro), nr_seq_relatorio: novaSeq };
    const novo = await criarParametro(dadosParametro, autor);
    filtrosNovos.push({ ...dadosParametro, id: novo.id, _firestoreId: novo.id, nr_sequencia: novo.nr_sequencia, dt_criacao: novo.dt_criacao, dt_alteracao: novo.dt_alteracao, ds_usuario_criacao: novo.ds_usuario_criacao, ds_usuario_alteracao: novo.ds_usuario_alteracao });
  }

  // Cópias embutidas no relatório (retrocompatibilidade). Relatórios antigos,
  // sem registros nas coleções, mantêm as cópias embutidas originais.
  await updateDoc(doc(db, "relatorio", novoId), removerUndefinedProfundo({
    bandas: bandasOrigem.length > 0 ? bandasNovas : (bandasEmbutidas ?? []),
    filtros: parametrosOrigem.length > 0 ? filtrosNovos : (filtrosEmbutidos ?? []),
  }));
  return novoId;
}
