import * as XLSX from "xlsx";
import { api, atualizarDado, criarDado, excluirDado, listarDados } from "@/lib/apiCliente";

/**
 * Relatórios por SQL (Gerenciador de Relatórios > Relatórios):
 *   - relatório (capa): o SQL principal, usado pelas bandas sem SQL próprio;
 *   - bandas (relatorio_banda): Sequência, Descrição e SQL (no PDF, também Tipo, Altura,
 *     Banda superior e opções); no XLS vale a banda Detalhe de menor Sequência;
 *   - parâmetros (relatorio_parametro): os :nome usados no SQL;
 *   - geração: o servidor executa o SQL (/api/relatorios/<nr>/gerar); o XLS sai com as
 *     colunas e linhas, como o SGBD mostraria, e o PDF com as bandas e os elementos.
 */

/**
 * Tipo da banda do PDF:
 *   - Cabeçalho: no topo de todas as páginas (1ª linha do SQL);
 *   - Detalhe: repete uma vez para cada linha do SQL (elementos lado a lado = lista; com
 *     "Nova página a cada registro", um registro por página);
 *   - Rodapé: no pé de todas as páginas (1ª linha do SQL).
 */
export type TipoBanda = "cabecalho" | "detalhe" | "rodape";
export const TIPOS_BANDA: { value: TipoBanda; label: string }[] = [
  { value: "cabecalho", label: "Cabeçalho" },
  { value: "detalhe", label: "Detalhe" },
  { value: "rodape", label: "Rodapé" },
];
/** Banda sem tipo (criada no XLS) conta como Detalhe. */
export const bandaEhDetalhe = (b: Pick<BandaSql, "ie_tipo">) => !b.ie_tipo || b.ie_tipo === "detalhe";

/** Opções S/N da banda Detalhe (checkboxes), na ordem do formulário. */
export const OPCOES_DETALHE = [
  { campo: "ie_nova_pagina", label: "Nova página a cada registro" },
  { campo: "ie_exibir_label", label: "Exibir labels" },
  { campo: "ie_imprimir_vazio", label: "Imprimir sem registros" },
] as const;
export type CampoOpcaoDetalhe = (typeof OPCOES_DETALHE)[number]["campo"];

/** Banda do relatório (XLS: vale a Detalhe de menor Sequência; PDF: todas, com Tipo e Altura). */
export interface BandaSql {
  id?: string;
  nr_sequencia?: number;
  nr_seq_relatorio?: number;
  ds_banda?: string;
  /** SQL da banda (vazio = o SQL do relatório). */
  ds_sql?: string;
  /** Tipo da banda (PDF). */
  ie_tipo?: TipoBanda | null;
  /** Altura da banda em pixels (PDF). */
  qt_altura?: number | null;
  /** Banda Detalhe da qual esta depende (o SQL roda para cada linha dela). */
  nr_seq_banda_superior?: number | string | null;
  /** 'S' = cada registro começa numa página nova. */
  ie_nova_pagina?: "S" | "N" | null;
  /** 'S' = linha com o Label dos elementos antes dos registros (cabeçalho da lista). */
  ie_exibir_label?: "S" | "N" | null;
  /** 'S' = sem registros, a banda aparece uma vez (campos do SQL vazios). */
  ie_imprimir_vazio?: "S" | "N" | null;
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
    // Banda superior e opções só valem na banda Detalhe.
    nr_seq_banda_superior: bandaEhDetalhe(banda) && banda.nr_seq_banda_superior ? Number(banda.nr_seq_banda_superior) : null,
    ...Object.fromEntries(OPCOES_DETALHE.map(({ campo }) => [campo, bandaEhDetalhe(banda) && banda[campo] === "S" ? "S" : "N"])),
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

/**
 * Tipo do elemento:
 *   - SQL: valor da coluna (Atributo) do SQL da banda;
 *   - Conteúdo: texto fixo; Imagem: imagem de Administração do Sistema > Imagens;
 *   - Parâmetro: valor do parâmetro (Atributo = nome do parâmetro) informado ao gerar;
 *   - Página: "Página X de Y"; Data/hora: data e hora da geração; Usuário: quem gerou;
 *   - Linha: linha reta na caixa do elemento (horizontal se Tamanho >= Altura; senão vertical).
 */
export type TipoElemento = "sql" | "conteudo" | "imagem" | "parametro" | "pagina" | "data_hora" | "usuario" | "linha";
export const TIPOS_ELEMENTO: { value: TipoElemento; label: string }[] = [
  { value: "sql", label: "SQL" },
  { value: "conteudo", label: "Conteúdo" },
  { value: "imagem", label: "Imagem" },
  { value: "parametro", label: "Parâmetro" },
  { value: "pagina", label: "Página" },
  { value: "data_hora", label: "Data/hora" },
  { value: "usuario", label: "Usuário" },
  { value: "linha", label: "Linha" },
];
/** Máscara do valor (SQL e Parâmetro). */
export const MASCARAS_ELEMENTO = [
  { value: "data", label: "Data" },
  { value: "data_hora", label: "Data e hora" },
  { value: "hora", label: "Hora" },
  { value: "numero", label: "Número" },
  { value: "moeda", label: "Moeda" },
  { value: "porcentagem", label: "Porcentagem" },
];
/** Tamanho (largura) e Altura do elemento novo, como no Tasy (px). */
export const TAMANHO_ELEMENTO_PADRAO = 70;
export const ALTURA_ELEMENTO_PADRAO = 17;
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
  /** Máscara do valor (SQL e Parâmetro); vazio = como o banco devolve. */
  ie_mascara?: string | null;
  /** Casas decimais de Número, Moeda e Porcentagem (vazio = 2). */
  qt_casas_decimais?: number | string | null;
  /** 'S' = o texto quebra em linhas dentro do Tamanho (largura). */
  ie_quebrar_linha?: "S" | "N" | null;
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
    ie_mascara: textoOuNulo(elemento.ie_mascara),
    qt_casas_decimais: inteiroOuNulo(elemento.qt_casas_decimais),
    ie_quebrar_linha: elemento.ie_quebrar_linha === "S" ? "S" : "N",
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

/**
 * "Gerar elementos do SQL": nomes das colunas do SQL da banda (vazio = o do relatório),
 * sem trazer registros. Erro no SQL vem com a mensagem do banco.
 */
export async function obterColunasDaBanda(nrRelatorio: number, nrBanda: number): Promise<string[]> {
  const { colunas } = await api.post<{ colunas: { nome: string }[] }>(`/api/relatorios/${nrRelatorio}/gerar`, { modo: "colunas", nr_banda: nrBanda });
  return (colunas ?? []).map((c) => c.nome);
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
  /** PDF: dados das bandas dependentes, por linha (filhas[i][<nr da banda>]). */
  filhas?: Record<string, DadosRelatorio>[];
}

/** XLS: executa no servidor o SQL da banda Detalhe de menor Sequência (sem banda, o do relatório). */
export async function obterDadosRelatorio(nrRelatorio: number, valores: Record<string, string>): Promise<DadosRelatorio> {
  return api.post<DadosRelatorio>(`/api/relatorios/${nrRelatorio}/gerar`, { valores });
}

/**
 * PDF: dados de todas as bandas, por nr da banda (Cabeçalho, Rodapé e Detalhe sem banda
 * superior); as dependentes vêm dentro da superior, em `filhas`.
 */
export async function obterDadosPdf(nrRelatorio: number, valores: Record<string, string>): Promise<Record<string, DadosRelatorio>> {
  const { bandas } = await api.post<{ bandas: Record<string, DadosRelatorio> }>(`/api/relatorios/${nrRelatorio}/gerar`, { valores, modo: "pdf" });
  return bandas ?? {};
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
