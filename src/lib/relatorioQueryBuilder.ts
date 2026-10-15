import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDataSource } from "@/lib/relatorioDataSources";
import type {
  Relatorio,
  RelatorioFiltro,
  DataSourceCampo,
} from "@/types/relatorio";

/**
 * Resultado de uma consulta de relatório.
 */
export interface RelatorioResultado {
  /** Dados brutos dos registros. */
  registros: Record<string, any>[];
  /** Dados resolvidos (FKs substituídas por objetos da coleção referenciada). */
  registrosResolvidos: Record<string, any>[];
  /** Lookup tables para resolução de FKs (compatibilidade). */
  lookups: Record<string, Record<number, string>>;
  /** Total de registros encontrados. */
  total: number;
}

/**
 * Converte uma string DD/MM/YYYY em timestamp numérico para comparação.
 */
function parseDateToNumber(valor: string): number | null {
  const brMatch = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    if (d.getFullYear() === Number(year) && d.getMonth() === Number(month) - 1 && d.getDate() === Number(day)) {
      return d.getTime();
    }
  }
  const isoMatch = valor.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const d = /^\d{4}-\d{2}-\d{2}$/.test(valor) ? new Date(Number(year), Number(month) - 1, Number(day)) : new Date(valor);
    if (!isNaN(d.getTime())) return d.getTime();
  }
  return null;
}

/** Valor do filtro é uma data sem hora (DD/MM/AAAA ou AAAA-MM-DD)? */
function ehDataSemHora(valor: string): boolean {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(valor.trim()) || /^\d{4}-\d{2}-\d{2}$/.test(valor.trim());
}

/** Início do dia (hora local) de um timestamp. */
function inicioDoDia(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Compara o valor do registro com o valor do filtro. Quando o filtro é uma data sem
 * hora e o registro tem data e hora (ex.: dt_criacao), compara apenas o dia — senão
 * "igual a 01/01/2026" nunca casaria com "2026-01-01T10:30:00".
 */
function compararComFiltro(raw: unknown, valorFiltro: string): number {
  if (raw != null && ehDataSemHora(valorFiltro)) {
    const dataRegistro = parseDateToNumber(String(raw));
    const dataFiltro = parseDateToNumber(valorFiltro.trim());
    if (dataRegistro !== null && dataFiltro !== null) return inicioDoDia(dataRegistro) - dataFiltro;
  }
  return compararValores(raw, valorFiltro);
}

/**
 * Compara dois valores considerando o tipo.
 */
function compararValores(a: any, b: any): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const sa = String(a);
  const sb = String(b);
  // Tenta comparar como datas
  const dateA = parseDateToNumber(sa);
  const dateB = parseDateToNumber(sb);
  if (dateA !== null && dateB !== null) return dateA - dateB;
  // Tenta comparar como números
  const numA = Number(sa);
  const numB = Number(sb);
  if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
  return sa.localeCompare(sb, 'pt-BR');
}

/** Filtro com o caminho do valor já resolvido para a coleção consultada. */
interface FiltroAplicavel {
  filtro: RelatorioFiltro;
  /** Alias do objeto relacionado (FK) no registro, ou null quando o campo é da própria coleção. */
  alias: string | null;
  campo: string;
}

/**
 * Seleciona os filtros que valem para a coleção consultada: filtros da própria coleção
 * (ou sem coleção, formato antigo) e filtros de coleções relacionadas por FK. Filtros de
 * outras coleções são ignorados — no modo bandas, o filtro de uma banda não pode zerar
 * as demais. A ordem (nr_sequencia) importa por causa do conector E/OU.
 */
function filtrosAplicaveis(filtros: RelatorioFiltro[], colecao: string, dsCampos: DataSourceCampo[]): FiltroAplicavel[] {
  const ordenados = [...filtros].sort((a, b) => (a.nr_sequencia ?? 0) - (b.nr_sequencia ?? 0));
  const out: FiltroAplicavel[] = [];
  for (const filtro of ordenados) {
    // Compatibilidade com dados antigos (campo) e novos (ie_campo)
    const chave = filtro.ie_campo ?? (filtro as any).campo;
    if (!chave) continue;
    const campo = chave.includes('.') ? chave.split('.').pop()! : chave;
    if (!filtro.ie_colecao || filtro.ie_colecao === colecao) {
      out.push({ filtro, alias: null, campo });
      continue;
    }
    const fk = dsCampos.find((c) => c.isFK && c.fkColecao === filtro.ie_colecao);
    if (fk) out.push({ filtro, alias: fk.key.replace(/^nr_seq_/, ''), campo });
  }
  return out;
}

/** Avalia um filtro contra o registro. Retorna null quando o filtro não tem valor (é ignorado). */
function avaliarFiltro(reg: Record<string, unknown>, { filtro, alias, campo }: FiltroAplicavel): boolean | null {
  const { operador, valorFinal } = filtro;
  const valor = filtro.vl_padrao ?? (filtro as any).valor;
  if (operador !== 'vazio' && operador !== 'nao_vazio' && (!valor || valor.trim() === '') && (!valorFinal || valorFinal.trim() === '')) return null;
  const raw = alias ? (reg[alias] as Record<string, unknown> | null | undefined)?.[campo] : reg[campo];
  const valorCampo = String(raw ?? '').toLowerCase();
  const valorFiltro = (valor ?? '').toLowerCase();
  const dataSemHora = valor != null && ehDataSemHora(valor);

  switch (operador) {
    case 'igual':
      return dataSemHora ? compararComFiltro(raw, valor) === 0 : String(raw ?? '') === String(valor ?? '');
    case 'diferente':
      return dataSemHora ? compararComFiltro(raw, valor) !== 0 : String(raw ?? '') !== String(valor ?? '');
    case 'maior':
      return compararComFiltro(raw, valor) > 0;
    case 'menor':
      return compararComFiltro(raw, valor) < 0;
    case 'maior_igual':
      return compararComFiltro(raw, valor) >= 0;
    case 'menor_igual':
      return compararComFiltro(raw, valor) <= 0;
    case 'contem':
      return valorCampo.includes(valorFiltro);
    case 'nao_contem':
      return !valorCampo.includes(valorFiltro);
    case 'inicia_com':
      return valorCampo.startsWith(valorFiltro);
    case 'termina_com':
      return valorCampo.endsWith(valorFiltro);
    case 'entre':
      if (compararComFiltro(raw, valor) < 0) return false;
      return !(valorFinal !== undefined && valorFinal !== '' && compararComFiltro(raw, valorFinal) > 0);
    case 'vazio':
      return raw === undefined || raw === null || String(raw) === '';
    case 'nao_vazio':
      return !(raw === undefined || raw === null || String(raw) === '');
    default:
      return true;
  }
}

/**
 * Aplica os filtros do lado do cliente. O conector (ie_conector) liga cada filtro ao
 * anterior, com a precedência usual: "E" antes de "OU" (A E B OU C = (A E B) OU C).
 */
function applyClientSideFilters(
  registros: Record<string, any>[],
  filtros: FiltroAplicavel[]
): Record<string, any>[] {
  if (filtros.length === 0) return registros;
  return registros.filter((reg) => {
    let algumGrupoVerdadeiro = false;
    let grupoAtual: boolean | null = null; // null = grupo ainda sem filtro avaliado
    for (const f of filtros) {
      const resultado = avaliarFiltro(reg, f);
      if (resultado === null) continue;
      if (f.filtro.ie_conector === 'OU' && grupoAtual !== null) {
        algumGrupoVerdadeiro ||= grupoAtual;
        grupoAtual = null;
      }
      grupoAtual = (grupoAtual ?? true) && resultado;
    }
    return algumGrupoVerdadeiro || (grupoAtual ?? true);
  });
}

/**
 * Busca documentos de uma coleção do Firestore.
 */
async function fetchColecao(nomeColecao: string): Promise<Record<string, any>[]> {
  const collectionRef = collection(db, nomeColecao);
  const snapshot = await getDocs(collectionRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Identifica quais coleções FK são necessárias com base nos campos do relatório.
 * Retorna um mapa: colecaoFK → { fkFieldKey, alias }
 * O alias é usado para nomear o objeto aninhado no registro (ex.: 'marca' para 'nr_seq_marca').
 */
function identificarFksNecessarias(
  campos: { ie_colecao?: string; ie_campo: string }[],
  colecaoPrincipal: string,
  dsPrincipal: DataSourceCampo[]
): Map<string, { fkFieldKey: string; alias: string }> {
  const fksNecessarias = new Map<string, { fkFieldKey: string; alias: string }>();

  // Quais coleções FK são usadas nos campos do relatório?
  const colecoesUsadas = new Set<string>();
  for (const campo of campos) {
    if (campo?.ie_colecao && campo.ie_colecao !== colecaoPrincipal) {
      colecoesUsadas.add(campo.ie_colecao);
    }
  }

  // Para cada coleção FK usada, encontra o campo FK correspondente na coleção principal
  for (const fkCampo of dsPrincipal) {
    if (fkCampo.isFK && fkCampo.fkColecao && colecoesUsadas.has(fkCampo.fkColecao)) {
      // alias = 'nr_seq_marca' → 'marca', 'nr_seq_categoria' → 'categoria'
      const alias = fkCampo.key.replace(/^nr_seq_/, '');
      fksNecessarias.set(fkCampo.fkColecao, { fkFieldKey: fkCampo.key, alias });
    }
  }

  return fksNecessarias;
}

/**
 * Resolve coleções FK, substituindo nr_seq_* por objetos com todos os campos da coleção referenciada.
 * Os dados ficam acessíveis via notação de ponto: alias.campo (ex.: 'marca.ds_marca').
 */
async function resolveColecoesFK(
  registros: Record<string, any>[],
  colecaoPrincipal: string,
  camposRelatorio: { ie_colecao?: string; ie_campo: string }[],
  dsPrincipalCampos: DataSourceCampo[]
): Promise<{ resolvidos: Record<string, any>[]; lookups: Record<string, Record<number, string>> }> {
  const fksNecessarias = identificarFksNecessarias(camposRelatorio, colecaoPrincipal, dsPrincipalCampos);

  // Busca os dados de cada coleção FK
  const dadosFK: Record<string, Record<number, Record<string, any>>> = {};
  const lookups: Record<string, Record<number, string>> = {};

  for (const [fkColecao, { fkFieldKey }] of fksNecessarias) {
    const docs = await fetchColecao(fkColecao);
    const porSequencia: Record<number, Record<string, any>> = {};
    const lookupLabel: Record<number, string> = {};

    for (const doc of docs) {
      const seq = doc.nr_sequencia;
      if (seq !== undefined) {
        porSequencia[seq] = doc;
        // Para compatibilidade, mantém o lookup de label
        const labelField = dsPrincipalCampos.find((c) => c.fkColecao === fkColecao)?.fkLabel;
        if (labelField) {
          lookupLabel[seq] = doc[labelField] ?? String(seq);
        }
      }
    }

    dadosFK[fkColecao] = porSequencia;
    lookups[fkFieldKey] = lookupLabel;
  }

  // Substitui nr_seq_* por objetos aninhados
  const resolvidos = registros.map((reg) => {
    const copia = { ...reg };

    for (const [fkColecao, { fkFieldKey, alias }] of fksNecessarias) {
      const valorFK = copia[fkFieldKey];
      if (valorFK !== undefined && valorFK !== null && dadosFK[fkColecao]) {
        // Anexa o objeto inteiro da coleção FK sob o alias
        copia[alias] = dadosFK[fkColecao][Number(valorFK)] ?? null;
        // Mantém __label para compatibilidade
        copia[`${fkFieldKey}__label`] = lookups[fkFieldKey]?.[Number(valorFK)] ?? String(valorFK);
      }
    }

    return copia;
  });

  return { resolvidos, lookups };
}

/**
 * Executa a consulta do relatório e retorna os dados processados.
 * Busca todos os documentos da coleção e aplica filtros/ordenação no cliente
 * para evitar a necessidade de índices compostos no Firestore.
 */
export async function executarConsultaRelatorio(relatorio: Relatorio): Promise<RelatorioResultado> {
  const { colecao, campos, filtros, ordenacao } = relatorio;
  const ds = getDataSource(colecao);

  if (!ds) {
    throw new Error(`Fonte de dados "${colecao}" não encontrada.`);
  }

  // Busca todos os documentos da coleção principal (sem where/orderBy server-side)
  const todos = await fetchColecao(colecao);
  const aplicaveis = filtrosAplicaveis(filtros ?? [], colecao, ds.campos);

  // Resolve coleções FK (substitui nr_seq_* por objetos aninhados) — antes de filtrar,
  // para que filtros sobre coleções relacionadas enxerguem o registro relacionado.
  const colecoesDosFiltros = aplicaveis
    .filter((f) => f.alias)
    .map((f) => ({ ie_colecao: f.filtro.ie_colecao, ie_campo: f.campo }));
  const { resolvidos, lookups } = await resolveColecoesFK(todos, colecao, [...campos, ...colecoesDosFiltros], ds.campos);

  // Aplica filtros e ordenação do lado do cliente (mantendo bruto e resolvido alinhados)
  const pares = resolvidos.map((resolvido, i) => ({ bruto: todos[i], resolvido }));
  const mantidos = new Set(applyClientSideFilters(resolvidos, aplicaveis));
  const filtrados = pares.filter((p) => mantidos.has(p.resolvido));
  if (ordenacao.length === 0) {
    filtrados.sort((a, b) => compararValores(a.bruto.nr_sequencia, b.bruto.nr_sequencia));
  } else {
    filtrados.sort((a, b) => {
      for (const o of ordenacao) {
        const campoLimpo = o.campo.includes('.') ? o.campo.split('.').pop()! : o.campo;
        const diff = compararValores(a.bruto[campoLimpo], b.bruto[campoLimpo]);
        if (diff !== 0) return o.direcao === 'desc' ? -diff : diff;
      }
      return 0;
    });
  }
  const registros = filtrados.map((p) => p.bruto);
  const registrosResolvidos = filtrados.map((p) => p.resolvido);

  // Resolve campos computados
  const temComputado = campos.some((c) => c.ie_campo === 'ds_prestador_servico');
  if (temComputado && colecao === 'pat_manutencao') {
    const colaboradoresDocs = await fetchColecao('colaborador');
    const pfDocs = await fetchColecao('pessoa_fisica');
    const pjDocs = await fetchColecao('pessoa_juridica');
    const colMap: Record<number, Record<string, any>> = {};
    const pfMap: Record<number, Record<string, any>> = {};
    const pjMap: Record<number, Record<string, any>> = {};
    for (const d of colaboradoresDocs) { if (d.nr_sequencia !== undefined) colMap[d.nr_sequencia] = d; }
    for (const d of pfDocs) { if (d.nr_sequencia !== undefined) pfMap[d.nr_sequencia] = d; }
    for (const d of pjDocs) { if (d.nr_sequencia !== undefined) pjMap[d.nr_sequencia] = d; }
    for (const reg of registrosResolvidos) {
      const colSeq = reg.nr_seq_prestador_servico ?? reg.nr_seq_pessoa_fisica ?? reg.prestador_servico?.nr_sequencia;
      if (colSeq && colMap[colSeq]) {
        const col = colMap[colSeq];
        if (col.nr_seq_pessoa_fisica && pfMap[col.nr_seq_pessoa_fisica]) {
          reg.ds_prestador_servico = pfMap[col.nr_seq_pessoa_fisica].ds_nome ?? '';
        } else if (col.nr_seq_pessoa_juridica && pjMap[col.nr_seq_pessoa_juridica]) {
          reg.ds_prestador_servico = pjMap[col.nr_seq_pessoa_juridica].ds_razao_social ?? '';
        } else {
          reg.ds_prestador_servico = '';
        }
      } else {
        reg.ds_prestador_servico = '';
      }
    }
  }

  return {
    registros,
    registrosResolvidos,
    lookups,
    total: registros.length,
  };
}

/**
 * Resolve a chave de um campo do relatório para notação de ponto.
 * Se o campo vem de uma coleção FK, converte 'ds_marca' → 'marca.ds_marca'.
 */
export function resolverChaveCampo(
  campo: { ie_colecao?: string; ie_campo: string },
  colecaoPrincipal: string,
  dsPrincipalCampos: DataSourceCampo[]
): string {
  if (!campo.ie_colecao || campo.ie_colecao === colecaoPrincipal || campo.ie_campo.includes('.')) {
    return campo.ie_campo;
  }
  // Encontra o campo FK que aponta para esta coleção
  const fkCampo = dsPrincipalCampos.find(
    (c) => c.isFK && c.fkColecao === campo.ie_colecao
  );
  if (!fkCampo) return campo.ie_campo;
  const alias = fkCampo.key.replace(/^nr_seq_/, '');
  return `${alias}.${campo.ie_campo}`;
}

/**
 * Obtém o valor de um campo de um registro, suportando caminhos compostos.
 * Suporta notação de ponto (ex.: 'marca.ds_marca') para acessar objetos aninhados.
 */
export function obterValorCampo(registro: Record<string, any>, chave: string): any {
  if (chave.endsWith('__label')) {
    return registro[chave] ?? registro[chave.replace('__label', '')] ?? '';
  }
  if (chave.includes('.')) {
    const partes = chave.split('.');
    let valor: any = registro;
    for (const parte of partes) {
      valor = valor?.[parte];
    }
    return valor ?? '';
  }
  return registro[chave] ?? '';
}
