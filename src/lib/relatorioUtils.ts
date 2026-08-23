import type { Relatorio, RelatorioConfigExcel, RelatorioConfigPdf } from "@/types/relatorio";

/** Label para o status de um relatório (formato legível). */
export function formatRelatorioCellValue(key: keyof Relatorio, value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (!str) return "";

  switch (key) {
    case "formato":
      return str === "excel" ? "Excel (CSV)" : str === "pdf" ? "PDF" : str;
    case "dt_criacao":
    case "dt_alteracao":
      try {
        return new Date(str).toLocaleString("pt-BR");
      } catch {
        return str;
      }
    default:
      return str;
  }
}

/** Configuração padrão para Excel. */
export function defaultConfigExcel(): RelatorioConfigExcel {
  return {
    titulo: '',
    incluirCabecalho: true,
    incluirRodape: true,
    estiloCabecalho: "preenchido" as const,
    corCabecalho: "4472C4",
    corTextoCabecalho: "FFFFFF",
    zebrado: true,
    filtrosAutomaticos: false,
    congelarPrimeiraLinha: true,
    orientacao: "retrato" as const,
  };
}

/** Configuração padrão para PDF. */
export function defaultConfigPdf(): RelatorioConfigPdf {
  return {
    titulo: '',
    subtitulo: '',
    tamanhoPagina: "A4" as const,
    orientacao: "retrato" as const,
    margens: { superior: 15, inferior: 15, esquerda: 15, direita: 15 },
    cabecalho: {
      incluir: true,
      texto: "",
      alinhamento: "centro" as const,
      incluirData: true,
      incluirNumeroPagina: true,
    },
    rodape: {
      incluir: true,
      texto: "",
      alinhamento: "centro" as const,
      incluirData: false,
      incluirNumeroPagina: true,
    },
    incluirBordas: true,
    zebrado: true,
    corZebra: "f8fafc",
    tamanhoFonte: 10,
    quebraPaginaPorGrupo: false,
  };
}

/** Gera um ID único para elementos do relatório (campos, filtros, etc.). */
export function gerarId(): string {
  return `_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Operadores de filtro disponíveis. */
export const OPERADORES_FILTRO = [
  { value: "igual", label: "Igual a" },
  { value: "diferente", label: "Diferente de" },
  { value: "maior", label: "Maior que" },
  { value: "menor", label: "Menor que" },
  { value: "maior_igual", label: "Maior ou igual" },
  { value: "menor_igual", label: "Menor ou igual" },
  { value: "contem", label: "Contém" },
  { value: "nao_contem", label: "Não contém" },
  { value: "inicia_com", label: "Inicia com" },
  { value: "termina_com", label: "Termina com" },
  { value: "entre", label: "Entre" },
  { value: "vazio", label: "Está vazio" },
  { value: "nao_vazio", label: "Não está vazio" },
] as const;

/** Formatos de dados disponíveis para campos. */
export const FORMATOS_CAMPO = [
  { value: "texto", label: "Texto" },
  { value: "numero", label: "Número" },
  { value: "moeda", label: "Moeda (R$)" },
  { value: "data", label: "Data" },
  { value: "data_hora", label: "Data/Hora" },
  { value: "porcentagem", label: "Porcentagem" },
] as const;

/** Alinhamentos disponíveis. */
export const ALINHAMENTOS = [
  { value: "esquerda", label: "Esquerda" },
  { value: "centro", label: "Centro" },
  { value: "direita", label: "Direita" },
] as const;

export const ALINHAMENTOS_VERTICAIS = [
  { value: "cima", label: "Cima" },
  { value: "centro", label: "Centro" },
  { value: "baixo", label: "Baixo" },
] as const;

/** Tamanhos de página PDF. */
export const TAMANHOS_PAGINA = [
  { value: "A4", label: "A4" },
  { value: "A3", label: "A3" },
  { value: "A5", label: "A5" },
  { value: "letter", label: "Letter" },
  { value: "legal", label: "Legal" },
] as const;

/** Opções de formatação de cabeçalho Excel. */
export const ESTILO_CABECALHO_EXCEL = [
  { value: "preenchido", label: "Preenchimento colorido" },
  { value: "borda", label: "Borda inferior" },
  { value: "nenhum", label: "Nenhum" },
] as const;
