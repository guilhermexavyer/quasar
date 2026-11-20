import * as XLSX from "xlsx";
import { api, atualizarDado, criarDado, excluirDado, listarDados } from "@/lib/apiCliente";

/**
 * Relatórios XLS por SQL (Gerenciador de Relatórios > Relatórios):
 *   - banda (relatorio_banda): Sequência, Descrição e SQL; uma por relatório XLS;
 *   - parâmetros (relatorio_parametro): os :nome usados no SQL;
 *   - geração: o servidor executa o SQL da banda (/api/relatorios/<nr>/gerar) e a tela
 *     monta a planilha com as colunas e linhas, como o SGBD mostraria.
 */

/** Banda do relatório XLS. */
export interface BandaSql {
  id?: string;
  nr_sequencia?: number;
  nr_seq_relatorio?: number;
  ds_banda?: string;
  ds_sql?: string;
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

export async function salvarBandaSql(banda: BandaSql): Promise<BandaSql> {
  const dados = { nr_seq_relatorio: banda.nr_seq_relatorio, ds_banda: banda.ds_banda ?? "", ds_sql: banda.ds_sql ?? "" };
  if (banda.id) {
    const { registro } = await atualizarDado<BandaSql>("relatorio_banda", banda.id, dados);
    return registro ?? banda;
  }
  return criarDado<BandaSql>("relatorio_banda", dados);
}

export async function excluirBandaSql(id: string): Promise<void> {
  await excluirDado("relatorio_banda", id);
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
export async function obterDadosRelatorio(nrRelatorio: number, valores: Record<string, string>): Promise<DadosRelatorio> {
  return api.post<DadosRelatorio>(`/api/relatorios/${nrRelatorio}/gerar`, { valores });
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
