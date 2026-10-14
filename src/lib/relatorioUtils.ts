import type { RelatorioConfigPdf } from "@/types/relatorio";

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
    estiloBorda: null,
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

/** Tamanhos de página PDF. */
export const TAMANHOS_PAGINA = [
  { value: "A4", label: "A4" },
  { value: "A3", label: "A3" },
  { value: "A5", label: "A5" },
  { value: "letter", label: "Letter" },
  { value: "legal", label: "Legal" },
] as const;


