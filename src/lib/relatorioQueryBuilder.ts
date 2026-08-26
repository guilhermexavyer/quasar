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
    const d = new Date(valor);
    if (!isNaN(d.getTime())) return d.getTime();
  }
  return null;
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

/**
 * Aplica filtros do lado do cliente (todos os operadores).
 */
function applyClientSideFilters(
  registros: Record<string, any>[],
  filtros: RelatorioFiltro[]
): Record<string, any>[] {
  return registros.filter((reg) => {
    for (const filtro of filtros) {
      const { campo, operador, valor, valorFinal } = filtro;
      // Ignora filtros sem campo ou sem valor (exceto vazio/nao_vazio)
      if (!campo) continue;
      if (operador !== 'vazio' && operador !== 'nao_vazio' && (!valor || valor.trim() === '') && (!valorFinal || valorFinal.trim() === '')) continue;
      const campoLimpo = campo.includes('.') ? campo.split('.').pop()! : campo;
      const raw = reg[campoLimpo];
      const valorCampo = String(raw ?? '').toLowerCase();
      const valorFiltro = (valor ?? '').toLowerCase();

      switch (operador) {
        case 'igual':
          if (String(raw ?? '') !== String(valor ?? '')) return false;
          break;
        case 'diferente':
          if (String(raw ?? '') === String(valor ?? '')) return false;
          break;
        case 'maior':
          if (compararValores(raw, valor) <= 0) return false;
          break;
        case 'menor':
          if (compararValores(raw, valor) >= 0) return false;
          break;
        case 'maior_igual':
          if (compararValores(raw, valor) < 0) return false;
          break;
        case 'menor_igual':
          if (compararValores(raw, valor) > 0) return false;
          break;
        case 'contem':
          if (!valorCampo.includes(valorFiltro)) return false;
          break;
        case 'nao_contem':
          if (valorCampo.includes(valorFiltro)) return false;
          break;
        case 'inicia_com':
          if (!valorCampo.startsWith(valorFiltro)) return false;
          break;
        case 'termina_com':
          if (!valorCampo.endsWith(valorFiltro)) return false;
          break;
        case 'entre':
          if (compararValores(raw, valor) < 0) return false;
          if (valorFinal !== undefined && valorFinal !== '' && compararValores(raw, valorFinal) > 0) return false;
          break;
        case 'vazio':
          if (raw !== undefined && raw !== null && String(raw) !== '') return false;
          break;
        case 'nao_vazio':
          if (raw === undefined || raw === null || String(raw) === '') return false;
          break;
      }
    }
    return true;
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
  campos: { colecao?: string; chave: string }[],
  colecaoPrincipal: string,
  dsPrincipal: DataSourceCampo[]
): Map<string, { fkFieldKey: string; alias: string }> {
  const fksNecessarias = new Map<string, { fkFieldKey: string; alias: string }>();

  // Quais coleções FK são usadas nos campos do relatório?
  const colecoesUsadas = new Set<string>();
  for (const campo of campos) {
    if (campo.colecao && campo.colecao !== colecaoPrincipal) {
      colecoesUsadas.add(campo.colecao);
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
  camposRelatorio: { colecao?: string; chave: string }[],
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
  let registros: Record<string, any>[] = await fetchColecao(colecao);

  // Aplica filtros do lado do cliente
  registros = applyClientSideFilters(registros, filtros);

  // Aplica ordenação do lado do cliente
  if (ordenacao.length > 0) {
    registros.sort((a, b) => {
      for (const o of ordenacao) {
        const campoLimpo = o.campo.includes('.') ? o.campo.split('.').pop()! : o.campo;
        const diff = compararValores(a[campoLimpo], b[campoLimpo]);
        if (diff !== 0) return o.direcao === 'desc' ? -diff : diff;
      }
      return 0;
    });
  }

  // Resolve coleções FK (substitui nr_seq_* por objetos aninhados)
  const { resolvidos: registrosResolvidos, lookups } = await resolveColecoesFK(
    registros,
    colecao,
    campos,
    ds.campos
  );

  // Resolve campos computados
  console.log('[DEBUG COMPUTED] campos:', campos.map((c) => ({ chave: c.chave, colecao: c.colecao, computed: (c as any).computed })), 'colecao:', colecao);
  const temComputado = campos.some((c) => c.chave === 'ds_prestador_servico');
  console.log('[DEBUG COMPUTED] temComputado:', temComputado, 'isManut:', colecao === 'pat_manutencao');
  if (temComputado && colecao === 'pat_manutencao') {
    console.log('[DEBUG COMPUTED] Resolving ds_prestador_servico...');
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
    console.log('[DEBUG COMPUTED] colMap keys:', Object.keys(colMap).slice(0, 5), 'total:', Object.keys(colMap).length);
    console.log('[DEBUG COMPUTED] Sample record:', registrosResolvidos[0] ? { nr_seq_prestador: registrosResolvidos[0].nr_seq_prestador_servico, ds_prest: registrosResolvidos[0].ds_prestador_servico, prestador: registrosResolvidos[0].prestador_servico } : 'none');
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
  campo: { colecao?: string; chave: string },
  colecaoPrincipal: string,
  dsPrincipalCampos: DataSourceCampo[]
): string {
  if (!campo.colecao || campo.colecao === colecaoPrincipal || campo.chave.includes('.')) {
    return campo.chave;
  }
  // Encontra o campo FK que aponta para esta coleção
  const fkCampo = dsPrincipalCampos.find(
    (c) => c.isFK && c.fkColecao === campo.colecao
  );
  if (!fkCampo) return campo.chave;
  const alias = fkCampo.key.replace(/^nr_seq_/, '');
  return `${alias}.${campo.chave}`;
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
