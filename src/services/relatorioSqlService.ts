import * as XLSX from "xlsx";
import { api, atualizarDado, criarDado, excluirDado, listarDados } from "@/lib/apiCliente";

/**
 * Relatórios XLS por SQL (Gerenciador de Relatórios > Relatórios):
 *   - banda (relatorio_banda): Sequência, Descrição e SQL; uma por relatório XLS;
 *   - parâmetros (relatorio_parametro): os :nome usados no SQL;
 *   - geração: o servidor executa o SQL da banda (/api/relatorios/<nr>/gerar) e a tela
 *     monta a planilha com as colunas e linhas, como o SGBD mostraria.
 */

/** Tipo da banda do PDF. */
export type TipoBanda = "cabecalho" | "conteudo" | "lista" | "rodape";
export const TIPOS_BANDA: { value: TipoBanda; label: string }[] = [
  { value: "cabecalho", label: "Cabeçalho" },
  { value: "conteudo", label: "Conteúdo" },
  { value: "lista", label: "Lista" },
  { value: "rodape", label: "Rodapé" },
];

/** Banda do relatório (XLS: uma, só com o SQL; PDF: várias, com Tipo e Altura). */
export interface BandaSql {
  id?: string;
  nr_sequencia?: number;
  nr_seq_relatorio?: number;
  ds_banda?: string;
  ds_sql?: string;
  /** Tipo da banda (PDF). */
  ie_tipo?: TipoBanda | null;
  /** Altura da banda em pixels (PDF). */
  qt_altura?: number | null;
  /** Bordas da banda (PDF): 'S' desenha a borda daquele lado. */
  ie_borda_superior?: "S" | "N" | null;
  ie_borda_inferior?: "S" | "N" | null;
  ie_borda_esquerda?: "S" | "N" | null;
  ie_borda_direita?: "S" | "N" | null;
  dt_criacao?: string;
  dt_alteracao?: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}

/** Parâmetro do relatório (o :nome do SQL). */
export interface ParametroSql {
  id?: string;
  nr_sequencia?: number;
  nr_seq_relatorio?: number;
  /** Nome usado no SQL (sem os dois-pontos). */
  ds_parametro?: string;
  ds_label?: string;
  nr_ordem?: number | null;
  vl_padrao?: string;
  ie_perguntar?: "S" | "N";
  ie_obrigatorio?: "S" | "N";
  dt_criacao?: string;
  dt_alteracao?: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}

/* ── Banda ── */

export async function obterBandasSql(nrRelatorio: number): Promise<BandaSql[]> {
  const lista = await listarDados<BandaSql>("relatorio_banda", { nr_seq_relatorio: nrRelatorio });
  return lista.sort((a, b) => Number(a.nr_sequencia ?? 0) - Number(b.nr_sequencia ?? 0));
}

/** Bordas da banda e do elemento (checkboxes), na ordem do formulário. */
export const CAMPOS_BORDA = [
  { campo: "ie_borda_superior", label: "Borda superior" },
  { campo: "ie_borda_inferior", label: "Borda inferior" },
  { campo: "ie_borda_esquerda", label: "Borda esquerda" },
  { campo: "ie_borda_direita", label: "Borda direita" },
] as const;
export type CampoBorda = (typeof CAMPOS_BORDA)[number]["campo"];

function bordasParaBanco(registro: Partial<Record<CampoBorda, "S" | "N" | null>>): Record<CampoBorda, "S" | "N"> {
  return Object.fromEntries(CAMPOS_BORDA.map(({ campo }) => [campo, registro[campo] === "S" ? "S" : "N"])) as Record<CampoBorda, "S" | "N">;
}

export async function salvarBandaSql(banda: BandaSql): Promise<BandaSql> {
  const dados = {
    nr_seq_relatorio: banda.nr_seq_relatorio,
    ds_banda: banda.ds_banda ?? "",
    ds_sql: banda.ds_sql ?? "",
    ie_tipo: banda.ie_tipo || null,
    qt_altura: banda.qt_altura ?? null,
    ...bordasParaBanco(banda),
  };
  if (banda.id) {
    const { registro } = await atualizarDado<BandaSql>("relatorio_banda", banda.id, dados);
    return registro ?? banda;
  }
  return criarDado<BandaSql>("relatorio_banda", dados);
}

/** Exclui a banda e os elementos dela. */
export async function excluirBandaSql(id: string, nrBanda?: number | null): Promise<void> {
  if (nrBanda != null) {
    for (const elemento of await obterElementosDaBanda(Number(nrBanda))) {
      if (elemento.id) await excluirDado("relatorio_banda_elemento", elemento.id);
    }
  }
  await excluirDado("relatorio_banda", id);
}

/* ── Elementos da banda (PDF) ── */

/** Tipo do elemento: valor de uma coluna do SQL da banda, um texto fixo ou uma imagem. */
export type TipoElemento = "sql" | "conteudo" | "imagem";
export const TIPOS_ELEMENTO: { value: TipoElemento; label: string }[] = [
  { value: "sql", label: "SQL" },
  { value: "conteudo", label: "Conteúdo" },
  { value: "imagem", label: "Imagem" },
];
export const ESTILOS_ELEMENTO = [
  { value: "negrito", label: "Negrito" },
  { value: "italico", label: "Itálico" },
  { value: "sublinhado", label: "Sublinhado" },
  { value: "negrito_italico", label: "Negrito + Itálico" },
  { value: "negrito_sublinhado", label: "Negrito + Sublinhado" },
  { value: "italico_sublinhado", label: "Itálico + Sublinhado" },
  { value: "negrito_italico_sublinhado", label: "Todos" },
];
export const ALINHAMENTOS_ELEMENTO = [
  { value: "esquerda", label: "Esquerda" },
  { value: "direita", label: "Direita" },
  { value: "centro", label: "Centro" },
];
/** Fontes do elemento (no PDF, cada uma usa a fonte padrão do PDF mais parecida). */
export const FONTES_ELEMENTO = [
  { value: "arial", label: "Arial" },
  { value: "calibri", label: "Calibri" },
  { value: "courier_new", label: "Courier New" },
  { value: "times_new_roman", label: "Times New Roman" },
  { value: "verdana", label: "Verdana" },
];

/** Elemento de uma banda do PDF (relatorio_banda_elemento). Medidas em pixels (px). */
export interface ElementoBanda {
  id?: string;
  nr_sequencia?: number;
  nr_seq_banda?: number;
  nr_seq_relatorio?: number;
  ds_elemento?: string | null;
  ie_tipo?: TipoElemento | null;
  /** Imagem (Administração do Sistema > Imagens) do elemento do tipo Imagem. */
  nr_seq_imagem?: number | string | null;
  qt_esquerda?: number | string | null;
  qt_topo?: number | string | null;
  qt_largura?: number | string | null;
  qt_altura?: number | string | null;
  ie_estilo?: string | null;
  ie_alinhamento?: string | null;
  cd_background?: string | null;
  cd_cor?: string | null;
  ie_fonte?: string | null;
  /** Tamanho da fonte em pt (vazio = 10). */
  qt_fonte?: number | string | null;
  ds_label?: string | null;
  cd_alias?: string | null;
  ds_conteudo?: string | null;
  /** Bordas do elemento: 'S' desenha a borda daquele lado. */
  ie_borda_superior?: "S" | "N" | null;
  ie_borda_inferior?: "S" | "N" | null;
  ie_borda_esquerda?: "S" | "N" | null;
  ie_borda_direita?: "S" | "N" | null;
  dt_criacao?: string;
  dt_alteracao?: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}

export async function obterElementosDaBanda(nrBanda: number): Promise<ElementoBanda[]> {
  const lista = await listarDados<ElementoBanda>("relatorio_banda_elemento", { nr_seq_banda: nrBanda });
  return lista.sort((a, b) => Number(a.nr_sequencia ?? 0) - Number(b.nr_sequencia ?? 0));
}

const inteiroOuNulo = (v: unknown) => (v === null || v === undefined || String(v).trim() === "" ? null : Math.round(Number(v)));
const textoOuNulo = (v: unknown) => (v === null || v === undefined || String(v).trim() === "" ? null : String(v));

export async function salvarElementoBanda(elemento: ElementoBanda): Promise<ElementoBanda> {
  const dados = {
    nr_seq_banda: elemento.nr_seq_banda,
    nr_seq_relatorio: elemento.nr_seq_relatorio,
    ds_elemento: textoOuNulo(elemento.ds_elemento),
    ie_tipo: elemento.ie_tipo || null,
    nr_seq_imagem: inteiroOuNulo(elemento.nr_seq_imagem),
    qt_esquerda: inteiroOuNulo(elemento.qt_esquerda),
    qt_topo: inteiroOuNulo(elemento.qt_topo),
    qt_largura: inteiroOuNulo(elemento.qt_largura),
    qt_altura: inteiroOuNulo(elemento.qt_altura),
    ie_estilo: textoOuNulo(elemento.ie_estilo),
    ie_alinhamento: textoOuNulo(elemento.ie_alinhamento),
    cd_background: textoOuNulo(elemento.cd_background),
    cd_cor: textoOuNulo(elemento.cd_cor),
    ie_fonte: textoOuNulo(elemento.ie_fonte),
    qt_fonte: inteiroOuNulo(elemento.qt_fonte),
    ds_label: textoOuNulo(elemento.ds_label),
    cd_alias: textoOuNulo(elemento.cd_alias?.trim()),
    ds_conteudo: textoOuNulo(elemento.ds_conteudo),
    ...bordasParaBanco(elemento),
  };
  if (elemento.id) {
    const { registro } = await atualizarDado<ElementoBanda>("relatorio_banda_elemento", elemento.id, dados);
    return registro ?? elemento;
  }
  return criarDado<ElementoBanda>("relatorio_banda_elemento", dados);
}

export async function excluirElementoBanda(id: string): Promise<void> {
  await excluirDado("relatorio_banda_elemento", id);
}

/* ── Parâmetros ── */

/** Ordem dos parâmetros: Ordem (menor primeiro); empate (ou sem ordem) pela Sequência. */
export function ordenarParametros(lista: ParametroSql[]): ParametroSql[] {
  const ordem = (p: ParametroSql) => (p.nr_ordem === null || p.nr_ordem === undefined ? Number.MAX_SAFE_INTEGER : Number(p.nr_ordem));
  return [...lista].sort((a, b) => ordem(a) - ordem(b) || Number(a.nr_sequencia ?? 0) - Number(b.nr_sequencia ?? 0));
}

export async function obterParametrosSql(nrRelatorio: number): Promise<ParametroSql[]> {
  return ordenarParametros(await listarDados<ParametroSql>("relatorio_parametro", { nr_seq_relatorio: nrRelatorio }));
}

export async function salvarParametroSql(parametro: ParametroSql): Promise<ParametroSql> {
  const dados = {
    nr_seq_relatorio: parametro.nr_seq_relatorio,
    ds_parametro: (parametro.ds_parametro ?? "").trim().replace(/^:+/, ""),
    ds_label: parametro.ds_label ?? "",
    nr_ordem: parametro.nr_ordem ?? null,
    vl_padrao: parametro.vl_padrao ?? "",
    ie_perguntar: parametro.ie_perguntar === "S" ? "S" : "N",
    ie_obrigatorio: parametro.ie_obrigatorio === "S" ? "S" : "N",
  };
  if (parametro.id) {
    const { registro } = await atualizarDado<ParametroSql>("relatorio_parametro", parametro.id, dados);
    return registro ?? parametro;
  }
  return criarDado<ParametroSql>("relatorio_parametro", dados);
}

export async function excluirParametroSql(id: string): Promise<void> {
  await excluirDado("relatorio_parametro", id);
}

/* ── Geração ── */

export interface DadosRelatorio {
  colunas: { nome: string; tipo: "numero" | "data" | "datahora" | "booleano" | "texto" }[];
  linhas: unknown[][];
}

/** Executa o SQL do relatório no servidor (valores dos parâmetros perguntados). */
/** Executa o SQL do relatório no servidor (valores dos parâmetros perguntados). Com `nrBanda`, o SQL daquela banda (PDF). */
export async function obterDadosRelatorio(nrRelatorio: number, valores: Record<string, string>, nrBanda?: number): Promise<DadosRelatorio> {
  return api.post<DadosRelatorio>(`/api/relatorios/${nrRelatorio}/gerar`, nrBanda == null ? { valores } : { valores, nr_banda: nrBanda });
}

/** 'AAAA-MM-DD' → Date (meia-noite local); ISO com hora → Date. */
function paraData(valor: unknown, comHora: boolean): Date | unknown {
  if (typeof valor !== "string") return valor;
  if (!comHora) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : valor;
  }
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? valor : d;
}

/** Nome de arquivo seguro (sem caracteres proibidos no Windows). */
function nomeDeArquivo(nome: string): string {
  const limpo = nome.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim();
  return limpo || "relatorio";
}

/**
 * Monta e baixa a planilha: 1ª linha com o nome das colunas, depois uma linha por
 * registro, como o resultado da consulta no SGBD. Datas e números ficam como data e
 * número no Excel.
 */
export function baixarPlanilha(dados: DadosRelatorio, nome: string): void {
  const cabecalho = dados.colunas.map((c) => c.nome);
  const linhas = dados.linhas.map((linha) =>
    linha.map((valor, i) => {
      const tipo = dados.colunas[i]?.tipo;
      if (valor === null || valor === undefined) return null;
      if (tipo === "data") return paraData(valor, false);
      if (tipo === "datahora") return paraData(valor, true);
      if (tipo === "booleano") return valor === true ? "Sim" : valor === false ? "Não" : valor;
      return valor;
    })
  );
  const planilha = XLSX.utils.aoa_to_sheet([cabecalho, ...linhas], { cellDates: true });
  // Formato das datas na planilha (o padrão do Excel seria m/d/aa).
  dados.colunas.forEach((coluna, c) => {
    if (coluna.tipo !== "data" && coluna.tipo !== "datahora") return;
    for (let r = 1; r <= linhas.length; r++) {
      const celula = planilha[XLSX.utils.encode_cell({ r, c })];
      if (celula && celula.t === "d") celula.z = coluna.tipo === "data" ? "dd/mm/yyyy" : "dd/mm/yyyy hh:mm:ss";
    }
  });
  // Largura das colunas pelo maior conteúdo (até 60 caracteres).
  planilha["!cols"] = cabecalho.map((titulo, c) => {
    let largura = String(titulo).length;
    for (const linha of linhas.slice(0, 500)) {
      const v = linha[c];
      const texto = v instanceof Date ? "00/00/0000 00:00:00" : v === null ? "" : String(v);
      largura = Math.max(largura, texto.length);
    }
    return { wch: Math.min(60, largura + 2) };
  });
  const pasta = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(pasta, planilha, "Relatório");
  XLSX.writeFile(pasta, `${nomeDeArquivo(nome)}.xlsx`, { compression: true });
}
