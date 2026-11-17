import { atualizarCopiaEmbutida, atualizarDado, criarDado, excluirDado, listarDados, obterDado } from "@/lib/apiCliente";
import { removerUndefined, removerUndefinedProfundo } from "@/lib/firestoreUtils";
import type { AuditAutor } from "@/services/auditService";

/**
 * Bandas e elementos do construtor de relatórios (tabelas relatorio_banda e
 * relatorio_banda_elemento), acessados pelas rotas /api/dados. O servidor gera
 * nr_sequencia, datas de controle e auditoria; o autor vem da sessão (o
 * parâmetro `autor` é mantido só pela assinatura).
 */

// Registros do construtor de relatórios têm forma livre (como já era no Firestore).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Reg = Record<string, any>;
type Controle = { id: string; nr_sequencia: number; dt_criacao: string; dt_alteracao: string; ds_usuario_criacao: string; ds_usuario_alteracao: string };

function controleDe(registro: Reg): Controle {
  return {
    id: String(registro.id),
    nr_sequencia: Number(registro.nr_sequencia),
    dt_criacao: registro.dt_criacao ?? '',
    dt_alteracao: registro.dt_alteracao ?? '',
    ds_usuario_criacao: registro.ds_usuario_criacao ?? '',
    ds_usuario_alteracao: registro.ds_usuario_alteracao ?? '',
  };
}

async function atualizarRegistro(colecao: string, id: string, dados: Reg): Promise<{ dt_alteracao: string; ds_usuario_alteracao: string }> {
  // Como antes, campo undefined é ignorado (não limpa o valor gravado).
  const { registro } = await atualizarDado<Reg>(colecao, id, removerUndefined(dados));
  return { dt_alteracao: registro?.dt_alteracao ?? '', ds_usuario_alteracao: registro?.ds_usuario_alteracao ?? '' };
}

/* ═══════════════════════════════════════════════ */
/* ── relatorio_banda ──                          */
/* ═══════════════════════════════════════════════ */

/** Retorna todas as bandas de um relatório (por nr_seq_relatorio). */
export async function obterBandasPorRelatorio(nrSeqRelatorio: number): Promise<Reg[]> {
  return listarDados<Reg>("relatorio_banda", { nr_seq_relatorio: nrSeqRelatorio });
}

/** Retorna todas as bandas de um relatório (pelo id do relatório). */
export async function obterBandasPorRelatorioId(relatorioId: string): Promise<Reg[]> {
  const relatorio = await obterDado<Reg>("relatorio", relatorioId);
  if (!relatorio) return [];
  return obterBandasPorRelatorio(Number(relatorio.nr_sequencia));
}

/** Cria uma nova banda. */
export async function criarBanda(banda: Reg, _autor?: AuditAutor): Promise<Controle> {
  return controleDe(await criarDado<Reg>("relatorio_banda", banda));
}

/** Atualiza uma banda existente. Sem alteração, devolve a data e o usuário atuais. */
export async function atualizarBanda(
  id: string,
  banda: Reg,
  _autor?: AuditAutor
): Promise<{ dt_alteracao: string; ds_usuario_alteracao: string }> {
  return atualizarRegistro("relatorio_banda", id, banda);
}

/** Exclui uma banda e seus elementos. */
export async function excluirBanda(id: string): Promise<void> {
  // Excluir elementos filhos
  const elementos = await obterElementosPorBanda(id);
  for (const el of elementos) {
    await excluirElemento(el.id);
  }
  await excluirDado("relatorio_banda", id);
}

/* ═══════════════════════════════════════════════ */
/* ── relatorio_banda_elemento ──                 */
/* ═══════════════════════════════════════════════ */

/** Retorna todos os elementos de uma banda (pelo id da banda). */
export async function obterElementosPorBanda(nrSeqBanda: string): Promise<Reg[]> {
  const banda = await obterDado<Reg>("relatorio_banda", nrSeqBanda);
  if (!banda) return [];
  return obterElementosPorBandaSeq(Number(banda.nr_sequencia));
}

/** Retorna todos os elementos de uma banda pelo nr_sequencia da banda. */
export async function obterElementosPorBandaSeq(nrSeqBanda: number): Promise<Reg[]> {
  return listarDados<Reg>("relatorio_banda_elemento", { nr_seq_banda: nrSeqBanda });
}

/** Cria um novo elemento. */
export async function criarElemento(elemento: Reg, _autor?: AuditAutor): Promise<Controle> {
  return controleDe(await criarDado<Reg>("relatorio_banda_elemento", elemento));
}

/** Atualiza um elemento existente. Sem alteração, devolve a data e o usuário atuais. */
export async function atualizarElemento(
  id: string,
  elemento: Reg,
  _autor?: AuditAutor
): Promise<{ dt_alteracao: string; ds_usuario_alteracao: string }> {
  return atualizarRegistro("relatorio_banda_elemento", id, elemento);
}

/** Exclui um elemento. */
export async function excluirElemento(id: string): Promise<void> {
  await excluirDado("relatorio_banda_elemento", id);
}

/**
 * Exclui um elemento e o remove das cópias embutidas (relatorio_banda.campos e
 * relatorio.bandas[].campos). Sem isso, ao excluir o último elemento de uma
 * banda, a cópia embutida (usada como fallback quando a tabela vem vazia)
 * fazia o elemento reaparecer ao reabrir a banda e no PDF.
 */
export async function excluirElementoComCopias(id: string, relatorioDocId?: string | null): Promise<void> {
  const elemento = await obterDado<Reg>("relatorio_banda_elemento", id);
  const nrSeqBanda = elemento?.nr_seq_banda;
  await excluirElemento(id);

  type Embutido = { id?: string; _firestoreId?: string };
  const semElemento = (campos: Embutido[] | undefined) =>
    (campos ?? []).filter((c) => c?.id !== id && c?._firestoreId !== id);

  if (nrSeqBanda !== undefined && nrSeqBanda !== null) {
    const bandas = await listarDados<Reg>("relatorio_banda", { nr_sequencia: Number(nrSeqBanda) });
    for (const b of bandas) {
      const campos = b.campos;
      if (Array.isArray(campos) && campos.length !== semElemento(campos).length) {
        await atualizarCopiaEmbutida("relatorio_banda", String(b.id), { campos: removerUndefinedProfundo(semElemento(campos)) });
      }
    }
  }

  if (relatorioDocId) {
    const relatorio = await obterDado<Reg>("relatorio", relatorioDocId);
    const bandas = relatorio?.bandas;
    if (Array.isArray(bandas)) {
      await atualizarCopiaEmbutida("relatorio", relatorioDocId, { bandas: removerUndefinedProfundo(bandas.map((b: { campos?: Embutido[] }) => ({ ...b, campos: semElemento(b?.campos) }))) });
    }
  }
}

/** Salva todos os elementos de uma banda (sync: cria, atualiza, exclui). */
export async function syncElementos(
  bandaId: string,
  nrSeqBanda: number,
  elementosExistentes: Reg[],
  elementosNovos: Reg[],
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
    const dados: Reg = { ...el, nr_seq_banda: nrSeqBanda };
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
