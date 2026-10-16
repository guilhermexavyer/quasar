import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDataSource } from "@/lib/relatorioDataSources";
import type {
  Relatorio,
  RelatorioFiltro,
  RelatorioOrdenacao,
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
    // Datas com horário (ex.: dt_criacao) são comparadas pelo dia, como as DD/MM/AAAA.
    const d = new Date(valor);
    if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }
  return null;
}

/**
 * Converte texto numérico em número, aceitando o formato brasileiro do
 * parâmetro com máscara Decimal (ex.: "1.234,56"). Retorna null se não for número.
 */
function parseNumero(valor: string): number | null {
  const t = valor.trim();
  if (t === '') return null;
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t) || /^-?\d+,\d+$/.test(t)) {
    return Number(t.replace(/\./g, '').replace(',', '.'));
  }
  const n = Number(t);
  return isNaN(n) ? null : n;
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
  // Tenta comparar como números (inclui o formato brasileiro 1.234,56)
  const numA = typeof a === 'number' ? a : parseNumero(sa);
  const numB = typeof b === 'number' ? b : parseNumero(sb);
  if (numA !== null && numB !== null) return numA - numB;
  return sa.localeCompare(sb, 'pt-BR');
}

/** Filtro gravado no formato antigo (campo/valor em vez de ie_campo/vl_padrao). */
type FiltroLegado = RelatorioFiltro & { campo?: string; valor?: string };

/** Chave (ie_campo) de um filtro — compatível com dados antigos (campo). */
function campoDoFiltro(filtro: RelatorioFiltro): string {
  return filtro.ie_campo ?? (filtro as FiltroLegado).campo ?? '';
}

/** Valor do filtro — compatível com dados antigos (valor). */
function valorDoFiltro(filtro: RelatorioFiltro): string | undefined {
  return filtro.vl_padrao ?? (filtro as FiltroLegado).valor;
}

/**
 * O filtro se aplica à consulta quando é da coleção principal (ou não tem
 * coleção, dados antigos) ou de uma coleção ligada a ela por FK. Assim, com
 * bandas de coleções diferentes, cada filtro só afeta as bandas a que pertence.
 */
function filtroAplicavel(filtro: RelatorioFiltro, colecao: string, dsCampos: DataSourceCampo[]): boolean {
  if (!campoDoFiltro(filtro)) return false;
  const col = filtro.ie_colecao;
  if (!col || col === colecao) return true;
  return dsCampos.some((c) => c.isFK && c.fkColecao === col);
}

/** Avalia um filtro contra o valor do campo no registro. */
function testarFiltro(raw: any, filtro: RelatorioFiltro): boolean {
  const { operador, valorFinal } = filtro;
  const valor = valorDoFiltro(filtro);
  const valorCampo = String(raw ?? '').toLowerCase();
  const valorFiltro = (valor ?? '').toLowerCase();
  const temValor = !!valor && String(valor).trim() !== '';
  // Datas (DD/MM/AAAA ou ISO) são comparadas pelo dia; null quando não são datas.
  // Igualdade por data (pelo dia) ou por número (10 = "10,00"); null se não se aplica.
  const mesmaData = (): boolean | null => {
    const a = parseDateToNumber(String(raw ?? ''));
    const b = parseDateToNumber(String(valor ?? ''));
    if (a !== null && b !== null) return a === b;
    const na = typeof raw === 'number' ? raw : parseNumero(String(raw ?? ''));
    const nb = parseNumero(String(valor ?? ''));
    return na !== null && nb !== null ? na === nb : null;
  };

  switch (operador) {
    case 'igual': {
      const data = mesmaData();
      return data !== null ? data : String(raw ?? '') === String(valor ?? '');
    }
    case 'diferente': {
      const data = mesmaData();
      return data !== null ? !data : String(raw ?? '') !== String(valor ?? '');
    }
    case 'maior':
      return compararValores(raw, valor) > 0;
    case 'menor':
      return compararValores(raw, valor) < 0;
    case 'maior_igual':
      return compararValores(raw, valor) >= 0;
    case 'menor_igual':
      return compararValores(raw, valor) <= 0;
    case 'contem':
      return valorCampo.includes(valorFiltro);
    case 'nao_contem':
      return !valorCampo.includes(valorFiltro);
    case 'inicia_com':
      return valorCampo.startsWith(valorFiltro);
    case 'termina_com':
      return valorCampo.endsWith(valorFiltro);
    case 'entre':
      // Sem valor inicial, vale só o limite final (e vice-versa).
      if (temValor && compararValores(raw, valor) < 0) return false;
      if (valorFinal !== undefined && valorFinal !== '' && compararValores(raw, valorFinal) > 0) return false;
      return true;
    case 'vazio':
      return raw === undefined || raw === null || String(raw) === '';
    case 'nao_vazio':
      return !(raw === undefined || raw === null || String(raw) === '');
    default:
      return true;
  }
}

/**
 * Aplica os filtros a um registro (já com as FKs resolvidas). Os filtros são
 * combinados da esquerda para a direita pelo conector de cada um (E / OU com
 * o filtro anterior). Filtros sem valor (exceto vazio/não vazio) são ignorados.
 */
function registroPassaFiltros(
  reg: Record<string, any>,
  filtros: RelatorioFiltro[],
  colecao: string,
  dsCampos: DataSourceCampo[]
): boolean {
  let resultado: boolean | null = null;
  for (const filtro of filtros) {
    const { operador, valorFinal } = filtro;
    const valor = valorDoFiltro(filtro);
    if (operador !== 'vazio' && operador !== 'nao_vazio' && (!valor || String(valor).trim() === '') && (!valorFinal || valorFinal.trim() === '')) continue;
    const chave = resolverChaveCampo({ ie_colecao: filtro.ie_colecao, ie_campo: campoDoFiltro(filtro) }, colecao, dsCampos);
    const ok = testarFiltro(obterValorCampo(reg, chave), filtro);
    resultado = resultado === null ? ok : filtro.ie_conector === 'OU' ? resultado || ok : resultado && ok;
  }
  return resultado ?? true;
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
    if (campo.ie_colecao && campo.ie_colecao !== colecaoPrincipal) {
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

  for (const [fkColecao, { fkFieldKey, alias }] of fksNecessarias) {
    const docs = await fetchColecao(fkColecao);
    const porSequencia: Record<number, Record<string, any>> = {};
    const lookupLabel: Record<number, string> = {};

    for (const doc of docs) {
      const seq = doc.nr_sequencia;
      if (seq !== undefined) {
        porSequencia[seq] = doc;
        // Para compatibilidade, mantém o lookup de label
        const dsFK = getDataSource(fkColecao);
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
  const todos: Record<string, any>[] = await fetchColecao(colecao);

  // Só os filtros desta coleção (ou de coleções ligadas por FK) se aplicam.
  const filtrosAplicaveis = (filtros ?? []).filter((f) => filtroAplicavel(f, colecao, ds.campos));

  // Resolve coleções FK (substitui nr_seq_* por objetos aninhados), incluindo
  // as coleções usadas pelos filtros, para filtrar por campos relacionados.
  const { resolvidos: todosResolvidos, lookups } = await resolveColecoesFK(
    todos,
    colecao,
    [...campos, ...filtrosAplicaveis.map((f) => ({ ie_colecao: f.ie_colecao, ie_campo: campoDoFiltro(f) }))],
    ds.campos
  );

  // Filtros do lado do cliente (registro bruto e resolvido continuam pareados)
  const pares = todos
    .map((raw, i) => ({ raw, res: todosResolvidos[i] }))
    .filter((p) => registroPassaFiltros(p.res, filtrosAplicaveis, colecao, ds.campos));

  // Ordenação do lado do cliente
  const ordens = (ordenacao ?? []).filter((o) => o.campo);
  if (ordens.length > 0) {
    pares.sort((a, b) => {
      for (const o of ordens) {
        const diff = compararValores(obterValorCampo(a.res, o.campo), obterValorCampo(b.res, o.campo));
        if (diff !== 0) return o.direcao === 'desc' ? -diff : diff;
      }
      return 0;
    });
  }
  const registros = pares.map((p) => p.raw);
  const registrosResolvidos = pares.map((p) => p.res);

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
 * Obtém a coluna de exibição para um campo, resolvendo aliases de joins.
 */
export function resolverCampoColuna(campo: string, registros: Record<string, any>[]): string {
  if (campo.includes('.')) {
    return campo;
  }
  if (campo.endsWith('__label')) {
    return campo;
  }
  return campo;
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
