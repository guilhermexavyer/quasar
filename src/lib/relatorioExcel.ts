/**
 * Geração de planilhas Excel a partir de dados de relatório.
 *
 * Utiliza a lib 'xlsx' (SheetJS) para gerar arquivos .xlsx nativos
 * com suporte a formatação (cores, estilos de fonte, agrupamentos, etc.).
 */
import * as XLSX from "xlsx";
import type { Relatorio, RelatorioCampo, RelatorioConfigExcel } from "@/types/relatorio";
import { obterValorCampo } from "@/lib/relatorioQueryBuilder";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Converte uma string DD/MM/YYYY em Date, ou tenta parsear como ISO.
 */
function parseDate(valor: string): Date | null {
  // Tenta formato DD/MM/YYYY
  const brMatch = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    if (d.getFullYear() === Number(year) && d.getMonth() === Number(month) - 1 && d.getDate() === Number(day)) {
      return d;
    }
  }
  // Tenta formato ISO (YYYY-MM-DD)
  const isoMatch = valor.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const d = new Date(valor);
    if (!isNaN(d.getTime())) return d;
  }
  // Último recurso: tenta Date() direto
  const d = new Date(valor);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Converte estilo para objeto de estilo XLSX.
 */
function estiloFonte(estilo?: string): { bold?: boolean; italic?: boolean; underline?: string } {
  if (!estilo || estilo === "normal" || estilo === "") return {};
  const result: { bold?: boolean; italic?: boolean; underline?: string } = {};
  if (estilo.includes("negrito")) result.bold = true;
  if (estilo.includes("italico")) result.italic = true;
  if (estilo.includes("sublinhado")) result.underline = "single";
  return result;
}

/**
 * Converte cor hex para rgb XLSX (sem #).
 */
function hexToRgb(hex: string): string {
  return hex.replace("#", "");
}

/**
 * Cria um estilo de borda.
 */
function makeBorder() {
  return {
    top: { style: "thin" as const, color: { rgb: "333333" } },
    bottom: { style: "thin" as const, color: { rgb: "333333" } },
    left: { style: "thin" as const, color: { rgb: "333333" } },
    right: { style: "thin" as const, color: { rgb: "333333" } },
  };
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
      return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
      const d = parseDate(String(valor));
      if (d) return d.toLocaleDateString("pt-BR");
      return String(valor);
    }
    case "data_hora": {
      if (!valor) return "";
      const d = parseDate(String(valor));
      if (d) return d.toLocaleString("pt-BR");
      return String(valor);
    }
    default:
      return String(valor);
  }
}

/**
 * Gera e faz o download de um relatório em formato Excel (.xlsx).
 */
export function gerarERealizarDownloadExcel(
  relatorio: Relatorio,
  registros: Record<string, any>[]
): void {
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

  const wb = XLSX.utils.book_new();
  const dados: any[][] = [];
  let rowIdx = 0;

  // ── Título ──
  if (config.incluirCabecalho && config.titulo) {
    dados.push([config.titulo]);
    dados.push([`Gerado em: ${new Date().toLocaleString("pt-BR")}`]);
    dados.push([]);
    rowIdx = 3;
  }

  // ── Cabeçalho das colunas ──
  const headerRowIdx = rowIdx;
  dados.push(campos.map((campo) => campo.label));
  rowIdx++;

  // ── Dados ──
  const dataRowStart = rowIdx;  for (const reg of registros) {
    dados.push(campos.map((campo) => formatarValor(obterValorCampo(reg, campo.ie_campo), campo)));
    rowIdx++;
  }

  // ── Linha de Soma ──
  const camposComSoma = campos.filter((c) => !!c.soma);
  if (camposComSoma.length > 0 && registros.length > 0) {
    const somaRow: any[] = [];
    for (const campo of campos) {
      if (campo.soma) {
        let total = 0;
        for (const reg of registros) {
          const val = obterValorCampo(reg, campo.ie_campo);
          const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[.,]/g, (m) => m === ',' ? '.' : ''));
          if (!isNaN(num)) total += num;
        }
        somaRow.push(total);
      } else {
        somaRow.push('');
      }
    }
    dados.push(somaRow);
    // Aplicar negrito na linha de soma
    somaRow.forEach((_, ci) => {
      if (somaRow[ci] !== '') {
        const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: ci });
        const cell = ws[cellRef];
        if (cell) cell.s = { font: { bold: true, sz: 11, name: 'Calibri' } };
      }
    });
    rowIdx++;
  }

  // ── Rodapé ──
  if (config.incluirRodape) {
    dados.push([]);
    dados.push([`Total de registros: ${registros.length}`]);
  }

  // ── Criar worksheet ──
  const ws = XLSX.utils.aoa_to_sheet(dados);

  // ── Aplicar estilos via propriedade .s em cada célula ──
  const corCabecalho = config.corCabecalho || "003056";
  const corTextoCabecalho = config.corTextoCabecalho || "FFFFFF";

  // Estilo do cabeçalho
  for (let col = 0; col < campos.length; col++) {
    const campo = campos[col];
    const cellRef = XLSX.utils.encode_cell({ r: headerRowIdx, c: col });
    const cell = ws[cellRef];
    if (cell) {
      cell.s = {
        font: {
          name: 'Calibri',
          sz: 11,
          bold: true,
          ...estiloFonte(campo.ie_estilo_label),
          color: { rgb: hexToRgb(corTextoCabecalho) },
        },
        fill: { fgColor: { rgb: hexToRgb(corCabecalho) } },
        alignment: {
          horizontal: campo.ie_alinhamento === "centro" ? "center" : campo.ie_alinhamento === "direita" ? "right" : "left",
          vertical: "center",
        },
        border: (config.estiloCabecalho === "borda" || config.estiloCabecalho === "preenchido") ? makeBorder() : undefined,
      };
    }
  }

  // Estilo dos dados
  for (let r = dataRowStart; r < dados.length; r++) {
    const isDataRow = dados[r]?.length === campos.length;
    if (!isDataRow) continue; // pular linhas de título, subtotal, etc.

    for (let c = 0; c < campos.length; c++) {
      const campo = campos[c];
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const cell = ws[cellRef];
      if (!cell) continue;

      const ie_estilo = estiloFonte(campo.ie_estilo);
      const hasStyle = Object.keys(ie_estilo).length > 0 || campo.cd_cor || campo.cd_background;

      if (hasStyle) {
        const s: any = {};
        if (Object.keys(ie_estilo).length > 0) {
          s.font = { name: 'Calibri', sz: 11, ...ie_estilo };
        }
        if (campo.cd_cor) {
          if (!s.font) s.font = {};
          s.font.color = { rgb: hexToRgb(campo.cd_cor) };
        }
        if (campo.cd_background) {
          s.fill = { fgColor: { rgb: hexToRgb(campo.cd_background) } };
        }
        s.alignment = {
          horizontal: campo.ie_alinhamento === "centro" ? "center" : campo.ie_alinhamento === "direita" ? "right" : "left",
          vertical: "center",
        };
        cell.s = s;
      }

      // Zebrado
      if (config.zebrado && (r - dataRowStart) % 2 === 1) {
        if (!cell.s) cell.s = {};
        if (!cell.s.fill) {
          cell.s.fill = { fgColor: { rgb: "F8FAFC" } };
        }
      }
    }
  }

  // ── Largura das colunas ──
  ws["!cols"] = campos.map((campo) => ({
    wch: campo.qt_largura ? Math.max(campo.qt_largura / 5, 10) : 15,
  }));

  // ── Filtros automáticos ──
  if (config.filtrosAutomaticos && campos.length > 0) {
    ws["!autofilter"] = {
      ref: XLSX.utils.encode_range({
        s: { r: headerRowIdx, c: 0 },
        e: { r: headerRowIdx, c: campos.length - 1 },
      }),
    };
  }

  // ── Congelar primeira linha ──
  if (config.congelarPrimeiraLinha) {
    ws["!freeze"] = { xSplit: 0, ySplit: headerRowIdx + 1 };
  }

  XLSX.utils.book_append_sheet(wb, ws, "Relatório");

  // ── Download ──
  const nomeArquivo = `${config.titulo || relatorio.ds_relatorio || "relatorio"}.xlsx`;
  XLSX.writeFile(wb, nomeArquivo);
}
