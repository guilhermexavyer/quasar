import * as XLSX from "xlsx";
import { api, atualizarDado, criarDado, excluirDado, listarDados } from "@/lib/apiCliente";
import { nomeDoParametro } from "@/lib/relatorioSql";

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
 *     "Quebrar página por registro", um registro por página);
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
  { campo: "ie_nova_pagina", label: "Quebrar página por registro" },
  { campo: "ie_exibir_label", label: "Exibir labels" },
  { campo: "ie_imprimir_vazio", label: "Imprimir sem registros" },
  { campo: "ie_alternar_background", label: "Alternar background" },
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
  /** 'S' = registros com fundo alternado (transparente e #cccccc). */
  ie_alternar_background?: "S" | "N" | null;
  /** Cor de fundo de todos os registros (com cor, o Alternar background não vale). */
  cd_background_registro?: string | null;
  /** Cor de fundo da linha dos labels (Exibir labels). */
  cd_background_label?: string | null;
  /** Bordas da banda (PDF): 'S' desenha a borda daquele lado. */
  ie_borda_superior?: "S" | "N" | null;
  ie_borda_inferior?: "S" | "N" | null;
  ie_borda_esquerda?: "S" | "N" | null;
  ie_borda_direita?: "S" | "N" | null;
  /** A = ativa; I = inativa (não sai no relatório). */
  ie_status?: "A" | "I" | null;
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
  /** Descrição do parâmetro. */
  ds_parametro?: string;
  /** Atributo: o nome usado no SQL (o :nome, sem os dois-pontos). */
  cd_atributo?: string | null;
  ds_label?: string;
  nr_ordem?: number | null;
  vl_padrao?: string;
  ie_perguntar?: "S" | "N";
  ie_obrigatorio?: "S" | "N";
  /** A = ativo; I = inativo (não é perguntado; o :nome fica vazio). */
  ie_status?: "A" | "I" | null;
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
  const corRegistros = bandaEhDetalhe(banda) ? textoOuNulo(banda.cd_background_registro) : null;
  const dados = {
    nr_seq_relatorio: banda.nr_seq_relatorio,
    ds_banda: banda.ds_banda ?? "",
    ds_sql: banda.ds_sql ?? "",
    ie_status: banda.ie_status === "I" ? "I" : "A",
    ie_tipo: banda.ie_tipo || null,
    qt_altura: banda.qt_altura ?? null,
    ...bordasParaBanco(banda),
    // Banda superior e opções só valem na banda Detalhe.
    nr_seq_banda_superior: bandaEhDetalhe(banda) && banda.nr_seq_banda_superior ? Number(banda.nr_seq_banda_superior) : null,
    // Com cor nos registros, o Alternar background não vale.
    ...Object.fromEntries(OPCOES_DETALHE.map(({ campo }) => [
      campo,
      bandaEhDetalhe(banda) && banda[campo] === "S" && !(campo === "ie_alternar_background" && corRegistros) ? "S" : "N",
    ])),
    // Cores de fundo: só na banda Detalhe; a dos labels, só com Exibir labels.
    cd_background_registro: corRegistros,
    cd_background_label: bandaEhDetalhe(banda) && banda.ie_exibir_label === "S" ? textoOuNulo(banda.cd_background_label) : null,
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
/** Máscara do valor (SQL e Parâmetro), em ordem alfabética. */
export const MASCARAS_ELEMENTO = [
  { value: "cep", label: "CEP" },
  { value: "cnpj", label: "CNPJ" },
  { value: "cpf", label: "CPF" },
  { value: "data", label: "Data" },
  { value: "data_hora", label: "Data e hora" },
  { value: "hora", label: "Hora" },
  { value: "moeda", label: "Moeda" },
  { value: "numero", label: "Número" },
  { value: "porcentagem", label: "Porcentagem" },
];
/** Estilo do texto, em ordem alfabética. */
export const ESTILOS_ELEMENTO = [
  { value: "italico", label: "Itálico" },
  { value: "italico_sublinhado", label: "Itálico + Sublinhado" },
  { value: "negrito", label: "Negrito" },
  { value: "negrito_italico", label: "Negrito + Itálico" },
  { value: "negrito_sublinhado", label: "Negrito + Sublinhado" },
  { value: "sublinhado", label: "Sublinhado" },
  { value: "negrito_italico_sublinhado", label: "Todos" },
];
/** Alinhamento do texto, em ordem alfabética (sem "---": padrão Esquerda). */
export const ALINHAMENTOS_ELEMENTO = [
  { value: "centro", label: "Centro" },
  { value: "direita", label: "Direita" },
  { value: "esquerda", label: "Esquerda" },
];
export const ALINHAMENTO_ELEMENTO_PADRAO = "esquerda";
/** Fontes do elemento (no PDF, cada uma usa a fonte padrão do PDF mais parecida). */
/** Fonte padrão (sem "---"). */
export const FONTE_ELEMENTO_PADRAO = "arial";
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
  /** Padding (px): distância entre a borda da caixa e o texto, em cada direção. */
  qt_padding_superior?: number | string | null;
  qt_padding_inferior?: number | string | null;
  qt_padding_esquerda?: number | string | null;
  qt_padding_direita?: number | string | null;
  /** Bordas do elemento: 'S' desenha a borda daquele lado. */
  ie_borda_superior?: "S" | "N" | null;
  ie_borda_inferior?: "S" | "N" | null;
  ie_borda_esquerda?: "S" | "N" | null;
  ie_borda_direita?: "S" | "N" | null;
  /** A = ativo; I = inativo (não sai no PDF). */
  ie_status?: "A" | "I" | null;
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
    ie_status: elemento.ie_status === "I" ? "I" : "A",
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
    qt_padding_superior: inteiroOuNulo(elemento.qt_padding_superior),
    qt_padding_inferior: inteiroOuNulo(elemento.qt_padding_inferior),
    qt_padding_esquerda: inteiroOuNulo(elemento.qt_padding_esquerda),
    qt_padding_direita: inteiroOuNulo(elemento.qt_padding_direita),
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

/* ── Status e duplicação ── */

/** Tabelas com status (menu de contexto Ativar/Inativar). */
export type TabelaComStatus = "relatorio" | "relatorio_banda" | "relatorio_banda_elemento" | "relatorio_parametro";

/** Ativa ('A') ou inativa ('I') o relatório, a banda, o elemento ou o parâmetro. */
export async function alterarStatusItem<T>(tabela: TabelaComStatus, id: string, status: "A" | "I"): Promise<T | undefined> {
  const { registro } = await atualizarDado<T>(tabela, id, { ie_status: status });
  return registro ?? undefined;
}

/** Dados do registro sem a identificação e os logs (para gravar uma cópia). */
function semIdentificacao<T extends object>(registro: T): T {
  const copia = { ...registro } as Record<string, unknown>;
  for (const c of ["id", "nr_sequencia", "dt_criacao", "dt_alteracao", "ds_usuario_criacao", "ds_usuario_alteracao"]) delete copia[c];
  return copia as T;
}

/** Cópia do elemento na mesma banda (Descrição com "(Cópia)"), com o mesmo status. */
export async function duplicarElementoBanda(elemento: ElementoBanda): Promise<ElementoBanda> {
  return salvarElementoBanda({ ...semIdentificacao(elemento), ds_elemento: `${elemento.ds_elemento ?? ""} (Cópia)`.trim() });
}

/**
 * Cópia da banda no mesmo relatório (Descrição com "(Cópia)"), com os elementos dela e o
 * mesmo status. As bandas dependentes não são copiadas.
 */
export async function duplicarBandaSql(banda: BandaSql): Promise<{ banda: BandaSql; elementos: ElementoBanda[] }> {
  const nova = await salvarBandaSql({ ...semIdentificacao(banda), ds_banda: `${banda.ds_banda ?? ""} (Cópia)`.trim() });
  const elementos: ElementoBanda[] = [];
  if (banda.nr_sequencia != null && nova.nr_sequencia != null) {
    for (const el of await obterElementosDaBanda(Number(banda.nr_sequencia))) {
      elementos.push(await salvarElementoBanda({ ...semIdentificacao(el), nr_seq_banda: Number(nova.nr_sequencia) }));
    }
  }
  return { banda: nova, elementos };
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
    ds_parametro: (parametro.ds_parametro ?? "").trim(),
    cd_atributo: nomeDoParametro(parametro.cd_atributo) || null,
    ds_label: parametro.ds_label ?? "",
    nr_ordem: parametro.nr_ordem ?? null,
    vl_padrao: parametro.vl_padrao ?? "",
    ie_perguntar: parametro.ie_perguntar === "S" ? "S" : "N",
    ie_obrigatorio: parametro.ie_obrigatorio === "S" ? "S" : "N",
    ie_status: parametro.ie_status === "I" ? "I" : "A",
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

/* ── Exportação (XML) ── */

/**
 * "Exportar relatório": baixa um .xml com o relatório, as bandas (com os elementos), os
 * parâmetros e o formato do papel — sem nr_sequencia e sem as imagens (ver
 * src/lib/relatorioXml.ts), para ser importado em outro ambiente.
 */
export async function exportarRelatorioXml(
  relatorio: Record<string, unknown> & { nr_sequencia: number },
  formatosPapel: { nr_sequencia: number; ds_formato_papel?: string; qt_largura?: unknown; qt_altura?: unknown }[],
  versaoSistema: string,
): Promise<void> {
  const { relatorioParaXml, nomeArquivoExportacao } = await import("@/lib/relatorioXml");
  const [bandas, parametros] = await Promise.all([obterBandasSql(relatorio.nr_sequencia), obterParametrosSql(relatorio.nr_sequencia)]);
  const bandasCompletas = await Promise.all(
    bandas.map(async (b) => ({ ...b, elementos: b.nr_sequencia == null ? [] : await obterElementosDaBanda(Number(b.nr_sequencia)) })),
  );
  const formatoPapel = formatosPapel.find((f) => String(f.nr_sequencia) === String(relatorio.nr_seq_formato_papel ?? "")) ?? null;
  const xml = relatorioParaXml({
    relatorio,
    formatoPapel: formatoPapel as Record<string, unknown> | null,
    parametros: parametros as unknown as Record<string, unknown>[],
    bandas: bandasCompletas as unknown as (Record<string, unknown> & { elementos: Record<string, unknown>[] })[],
    versaoSistema,
  });
  const url = URL.createObjectURL(new Blob([xml], { type: "application/xml;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivoExportacao(relatorio);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ── Importação (XML) ── */

/** Registro de uma importação (Gerenciador de Relatórios > Importar relatório). */
export interface ImportacaoRelatorio {
  id?: string;
  nr_sequencia?: number;
  ds_arquivo?: string | null;
  nr_seq_relatorio?: number | null;
  ds_relatorio?: string | null;
  ds_versao_sistema?: string | null;
  /** Quando o relatório foi importado neste ambiente. */
  dt_importacao?: string | null;
  qt_bandas?: number | null;
  qt_elementos?: number | null;
  qt_parametros?: number | null;
  ds_xml?: string | null;
  dt_criacao?: string;
  dt_alteracao?: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}

export async function obterImportacoesRelatorio(): Promise<ImportacaoRelatorio[]> {
  return listarDados<ImportacaoRelatorio>("relatorio_importacao");
}

export async function excluirImportacaoRelatorio(id: string): Promise<void> {
  await excluirDado("relatorio_importacao", id);
}

/** Erro da importação com a lista de problemas do arquivo (para a tela mostrar). */
export class ErroImportacaoRelatorio extends Error {
  constructor(public problemas: string[]) {
    super(problemas.length === 1 ? problemas[0] : `O arquivo tem ${problemas.length} problemas: ${problemas.join(" ")}`);
  }
}

/**
 * Importa um relatório exportado (formato em src/lib/relatorioXml.ts): confere o arquivo e
 * cria o relatório (Origem 'I'), os parâmetros, as bandas (depois a Banda superior de cada
 * uma, pelo ref) e os elementos — com sequências novas. O Formato do papel é procurado pela
 * descrição (ou largura x altura) e criado se não existir. Imagens não vêm no arquivo: o
 * elemento do tipo Imagem fica sem imagem. Se algo falhar no meio, o que já foi criado é
 * excluído (nada fica pela metade). No fim, registra a importação.
 */
export async function importarRelatorioXml(texto: string, nomeArquivo: string): Promise<{ importacao: ImportacaoRelatorio; nrRelatorio: number }> {
  const { lerRelatorioXml } = await import("@/lib/relatorioXml");
  const { dados, problemas } = lerRelatorioXml(texto);
  if (!dados) throw new ErroImportacaoRelatorio(problemas);

  const numeroOuNulo = (v?: string) => (v === undefined || v === "" ? null : Number(v));
  const criados: { tabela: string; id: string; nr?: number }[] = [];
  let formatoCriado: string | null = null;
  try {
    // Formato do papel: o do destino com a mesma descrição (ou medidas); senão, um novo.
    let nrFormatoPapel: number | null = null;
    if (dados.formatoPapel && dados.formatoPapel.ds_formato_papel) {
      const fp = dados.formatoPapel;
      const formatos = await listarDados<{ id: string; nr_sequencia: number; ds_formato_papel?: string; qt_largura?: unknown; qt_altura?: unknown }>("cg_formato_papel");
      const mesmaMedida = (a: unknown, b?: string) => b !== undefined && b !== "" && Number(a) === Number(b);
      const existente = formatos.find((f) => (f.ds_formato_papel ?? "").trim().toLowerCase() === fp.ds_formato_papel.trim().toLowerCase())
        ?? formatos.find((f) => mesmaMedida(f.qt_largura, fp.qt_largura) && mesmaMedida(f.qt_altura, fp.qt_altura));
      if (existente) {
        nrFormatoPapel = existente.nr_sequencia;
      } else {
        const novo = await criarDado<{ id: string; nr_sequencia: number }>("cg_formato_papel", {
          ds_formato_papel: fp.ds_formato_papel, qt_largura: numeroOuNulo(fp.qt_largura), qt_altura: numeroOuNulo(fp.qt_altura), ie_status: "A",
        });
        formatoCriado = novo.id;
        nrFormatoPapel = novo.nr_sequencia;
      }
    }

    const r = dados.relatorio;
    const relatorio = await criarDado<{ id: string; nr_sequencia: number }>("relatorio", {
      ...r,
      ie_formato: r.ie_formato === "pdf" ? "pdf" : "xls",
      ie_status: r.ie_status === "I" ? "I" : "A",
      ie_origem: "I",
      nr_seq_formato_papel: nrFormatoPapel,
      nr_margem_superior: numeroOuNulo(r.nr_margem_superior),
      nr_margem_inferior: numeroOuNulo(r.nr_margem_inferior),
      nr_margem_esquerda: numeroOuNulo(r.nr_margem_esquerda),
      nr_margem_direita: numeroOuNulo(r.nr_margem_direita),
    });
    criados.push({ tabela: "relatorio", id: relatorio.id, nr: relatorio.nr_sequencia });
    const nrRelatorio = relatorio.nr_sequencia;

    for (const p of dados.parametros) {
      const salvo = await salvarParametroSql({
        ...(p.campos as unknown as ParametroSql),
        nr_seq_relatorio: nrRelatorio,
        nr_ordem: numeroOuNulo(p.campos.nr_ordem),
      });
      if (salvo.id) criados.push({ tabela: "relatorio_parametro", id: salvo.id });
    }

    // Bandas na ordem do arquivo (a Sequência nova mantém a ordem); a Banda superior depois.
    const nrDaBanda = new Map<string, number>();
    const idDaBanda = new Map<string, string>();
    let qtElementos = 0;
    for (const b of dados.bandas) {
      const banda = await salvarBandaSql({
        ...(b.campos as unknown as BandaSql),
        nr_seq_relatorio: nrRelatorio,
        qt_altura: numeroOuNulo(b.campos.qt_altura),
        nr_seq_banda_superior: null,
      });
      if (!banda.id || banda.nr_sequencia == null) throw new Error(`Não foi possível criar a banda ${b.campos.ds_banda ?? b.ref}.`);
      criados.push({ tabela: "relatorio_banda", id: banda.id, nr: banda.nr_sequencia });
      nrDaBanda.set(b.ref, banda.nr_sequencia);
      idDaBanda.set(b.ref, banda.id);
      for (const e of b.elementos) {
        const el = await salvarElementoBanda({
          ...(e.campos as unknown as ElementoBanda),
          nr_seq_banda: banda.nr_sequencia,
          nr_seq_relatorio: nrRelatorio,
          nr_seq_imagem: null,
        });
        if (el.id) criados.push({ tabela: "relatorio_banda_elemento", id: el.id });
        qtElementos += 1;
      }
    }
    for (const b of dados.bandas) {
      if (!b.superior) continue;
      await atualizarDado("relatorio_banda", idDaBanda.get(b.ref) as string, { nr_seq_banda_superior: nrDaBanda.get(b.superior) });
    }

    const importacao = await criarDado<ImportacaoRelatorio>("relatorio_importacao", {
      ds_arquivo: nomeArquivo,
      nr_seq_relatorio: nrRelatorio,
      ds_relatorio: r.ds_relatorio ?? "",
      ds_versao_sistema: dados.versaoSistema || null,
      dt_importacao: new Date().toISOString(),
      qt_bandas: dados.bandas.length,
      qt_elementos: qtElementos,
      qt_parametros: dados.parametros.length,
      ds_xml: texto,
    });
    return { importacao, nrRelatorio };
  } catch (e) {
    // Desfaz o que foi criado: primeiro as ligações entre bandas, depois do fim para o começo.
    for (const c of criados.filter((x) => x.tabela === "relatorio_banda")) {
      await atualizarDado("relatorio_banda", c.id, { nr_seq_banda_superior: null }).catch(() => undefined);
    }
    for (const c of [...criados].reverse()) await excluirDado(c.tabela, c.id).catch(() => undefined);
    if (formatoCriado) await excluirDado("cg_formato_papel", formatoCriado).catch(() => undefined);
    throw e;
  }
}
