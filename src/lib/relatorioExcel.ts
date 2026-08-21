/**
 * Geração de planilhas Excel a partir de dados de relatório.
 * 
 * Nota: Esta implementação gera um arquivo CSV que pode ser aberto no Excel.
 * Para uma geração Excel nativa, seria necessário instalar a lib 'xlsx' (SheetJS).
 * O CSV é amplamente compatível e mantém o projeto leve.
 * 
 * Se no futuro precisar de formatação avançada (cores, estilos, agrupamentos),
 * basta instalar 'xlsx' e adaptar esta função.
 */
import type { Relatorio, RelatorioCampo, RelatorioConfigExcel } from "@/types/relatorio";
import { obterValorCampo } from "@/lib/relatorioQueryBuilder";

/**
 * Escapa um valor para CSV (trata vírgulas, aspas e quebras de linha).
 */
function escapeCsv(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Formata um valor de acordo com a formatação do campo.
 */
function formatarValor(valor: any, campo: RelatorioCampo): string {
  if (valor === null || valor === undefined || valor === "") return "";

  switch (campo.formatacao) {
    case "moeda": {
      const num = Number(valor);
      if (isNaN(num)) return String(valor);
      return num.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    }
    case "numero": {
      const num = Number(valor);
      if (isNaN(num)) return String(valor);
      return num.toLocaleString("pt-BR", {
        minimumFractionDigits: campo.casasDecimais ?? 0,
        maximumFractionDigits: campo.casasDecimais ?? 0,
      });
    }
    case "porcentagem": {
      const num = Number(valor);
      if (isNaN(num)) return String(valor);
      return `${num.toLocaleString("pt-BR", {
        minimumFractionDigits: campo.casasDecimais ?? 2,
        maximumFractionDigits: campo.casasDecimais ?? 2,
      })}%`;
    }
    case "data": {
      if (!valor) return "";
      try {
        const d = new Date(valor);
        return d.toLocaleDateString("pt-BR");
      } catch {
        return String(valor);
      }
    }
    case "data_hora": {
      if (!valor) return "";
      try {
        const d = new Date(valor);
        return d.toLocaleString("pt-BR");
      } catch {
        return String(valor);
      }
    }
    default:
      return String(valor);
  }
}

/**
 * Gera o conteúdo CSV de um relatório.
 */
export function gerarCsv(
  relatorio: Relatorio,
  registros: Record<string, any>[]
): string {
  const { campos, configExcel } = relatorio;
  const config: RelatorioConfigExcel = configExcel ?? {
    incluirCabecalho: true,
    incluirRodape: true,
    estiloCabecalho: "preenchido",
    zebrado: true,
    filtrosAutomaticos: false,
    congelarPrimeiraLinha: true,
    orientacao: "retrato",
  };

  const linhas: string[] = [];

  // Cabeçalho do relatório (título)
  if (config.incluirCabecalho && config.titulo) {
    linhas.push(escapeCsv(config.titulo));
    linhas.push(escapeCsv(`Gerado em: ${new Date().toLocaleString("pt-BR")}`));
    linhas.push(""); // linha em branco
  }

  // Cabeçalho das colunas
  const cabecalho = campos.map((campo) => escapeCsv(campo.label));
  linhas.push(cabecalho.join(","));

  // Dados
  for (const registro of registros) {
    const linha = campos.map((campo) => {
      const valor = obterValorCampo(registro, campo.chave);
      return escapeCsv(formatarValor(valor, campo));
    });
    linhas.push(linha.join(","));
  }

  // Rodapé
  if (config.incluirRodape) {
    linhas.push(""); // linha em branco
    linhas.push(escapeCsv(`Total de registros: ${registros.length}`));
  }

  return linhas.join("\r\n");
}

/**
 * Faz o download do CSV gerado.
 */
export function downloadCsv(conteudo: string, nomeArquivo: string): void {
  // Adiciona BOM para UTF-8 (compatibilidade com Excel)
  const bom = "\uFEFF";
  const blob = new Blob([bom + conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo.endsWith(".csv") ? nomeArquivo : `${nomeArquivo}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Gera e faz o download de um relatório em formato Excel (CSV).
 */
export function gerarERealizarDownloadExcel(
  relatorio: Relatorio,
  registros: Record<string, any>[]
): void {
  const conteudo = gerarCsv(relatorio, registros);
  const nomeArquivo = `${relatorio.ds_relatorio || "relatorio"}.csv`;
  downloadCsv(conteudo, nomeArquivo);
}
