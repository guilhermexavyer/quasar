/**
 * Geração de PDF a partir de dados de relatório.
 *
 * Esta implementação gera HTML formatado e abre o diálogo de impressão do
 * navegador, permitindo salvar como PDF. Esta abordagem:
 * - Não adiciona dependências externas pesadas
 * - Oferece controle total sobre o layout
 * - Funciona em todos os navegadores modernos
 * - Permite configurar página, margens, cabeçalho, rodapé, etc.
 *
 * Para uma geração server-side no futuro, pode-se integrar puppeteer ou similar.
 */
import type { Relatorio, RelatorioCampo, RelatorioConfigPdf } from "@/types/relatorio";
import { obterValorCampo } from "@/lib/relatorioQueryBuilder";
import { jsPDF } from "jspdf";


/**
 * Mapeia tamanhos de página para dimensões CSS.
 */
const PAGE_SIZES: Record<string, string> = {
  A4: "210mm",
  A3: "297mm",
  A5: "148mm",
  letter: "216mm",
  legal: "216mm",
};

const PAGE_HEIGHTS: Record<string, string> = {
  A4: "297mm",
  A3: "420mm",
  A5: "210mm",
  letter: "279mm",
  legal: "356mm",
};

/**
 * Formata um valor para exibição no PDF.
 */
function formatarValor(valor: any, campo: RelatorioCampo): string {
  if (valor === null || valor === undefined || valor === "") return "\u00A0"; // &nbsp;

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
      if (!valor) return "\u00A0";
      try {
        const d = new Date(valor);
        return d.toLocaleDateString("pt-BR");
      } catch {
        return String(valor);
      }
    }
    case "data_hora": {
      if (!valor) return "\u00A0";
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
 * Gera o HTML do relatório para impressão/PDF.
 */
export function gerarHtmlRelatorio(
  relatorio: Relatorio,
  registros: Record<string, any>[]
): string {
  const { campos, configPdf, agrupamento } = relatorio;
  const config: RelatorioConfigPdf = configPdf ?? {
    tamanhoPagina: "A4",
    orientacao: "retrato",
    margens: { superior: 15, inferior: 15, esquerda: 15, direita: 15 },
    cabecalho: { incluir: false },
    rodape: { incluir: false },
    incluirBordas: true,
    zebrado: true,
    tamanhoFonte: 10,
    quebraPaginaPorGrupo: false,
  };

  const pageSize = PAGE_SIZES[config.tamanhoPagina] || "210mm";
  const pageHeight = PAGE_HEIGHTS[config.tamanhoPagina] || "297mm";
  const isPaisagem = config.orientacao === "paisagem";

  // Determina alinhamento da célula
  function alinhamentoCss(campo: RelatorioCampo): string {
    switch (campo.alinhamento) {
      case "centro": return "text-align: center;";
      case "direita": return "text-align: right;";
      default: return "text-align: left;";
    }
  }

  // Monta cabeçalho da tabela
  const ths = campos.map((campo) => {
    const largura = campo.largura ? `width: ${campo.largura}mm;` : "";
    const bgLabel = campo.backgroundLabel || '#e2e8f0';
    const corLabel = campo.corLabel || '#1a1a1a';
    return `<th style="padding: 6px 8px; border: 1px solid #333; background: ${bgLabel}; color: ${corLabel}; font-weight: bold; font-size: ${config.tamanhoFonte}pt; ${largura} ${alinhamentoCss(campo)} white-space: nowrap;">${escapeHtml(campo.label)}</th>`;
  }).join("");

  // Monta linhas de dados
  let tbodyHtml = "";

  if (agrupamento && agrupamento.campo) {
    // Agrupa registros
    const grupos: Record<string, Record<string, any>[]> = {};
    for (const reg of registros) {
      const chaveGrupo = String(obterValorCampo(reg, agrupamento.campo) ?? "(vazio)");
      if (!grupos[chaveGrupo]) grupos[chaveGrupo] = [];
      grupos[chaveGrupo].push(reg);
    }

    for (const [chaveGrupo, regsGrupo] of Object.entries(grupos)) {
      // Cabeçalho do grupo
      tbodyHtml += `<tr><td colspan="${campos.length}" style="padding: 6px 8px; background: #f1f5f9; font-weight: bold; border: 1px solid #333; font-size: ${(config.tamanhoFonte + 1)}pt;">${escapeHtml(chaveGrupo)}</td></tr>`;

      // Linhas do grupo
      for (const reg of regsGrupo) {
        tbodyHtml += gerarLinhaHtml(reg, campos, config);
      }

      // Subtotal
      if (agrupamento.incluirSubtotal) {
        tbodyHtml += `<tr><td colspan="${campos.length}" style="padding: 4px 8px; background: #f8fafc; font-style: italic; border: 1px solid #333; font-size: ${(config.tamanhoFonte - 1)}pt; text-align: right;">Subtotal: ${regsGrupo.length} registro(s)</td></tr>`;
      }
    }

    // Total geral
    if (agrupamento.incluirTotalGeral) {
      tbodyHtml += `<tr><td colspan="${campos.length}" style="padding: 6px 8px; background: #e2e8f0; font-weight: bold; border: 1px solid #333; font-size: ${(config.tamanhoFonte + 1)}pt; text-align: right;">Total: ${registros.length} registro(s)</td></tr>`;
    }
  } else {
    for (const reg of registros) {
      tbodyHtml += gerarLinhaHtml(reg, campos, config);
    }
  }

  // HTML completo
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(relatorio.ds_relatorio || "Relatório")}</title>
  <style>
    @page {
      size: ${isPaisagem ? pageHeight : pageSize} ${isPaisagem ? pageSize : pageHeight};
      margin: ${config.margens.superior}mm ${config.margens.direita}mm ${config.margens.inferior}mm ${config.margens.esquerda}mm;
    }
    @media print {
      html, body { width: ${isPaisagem ? pageHeight : pageSize}; height: ${isPaisagem ? pageSize : pageHeight}; }
    }
    html {
      width: ${isPaisagem ? pageHeight : pageSize};
      margin: 0;
      padding: 0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: ${config.tamanhoFonte}pt;
      color: #1a1a1a;
      width: ${isPaisagem ? pageHeight : pageSize};
      max-width: ${isPaisagem ? pageHeight : pageSize};
      overflow-x: hidden;
    }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .report-header {
      text-align: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #333;
    }
    .report-header h1 {
      font-size: ${(config.tamanhoFonte + 6)}pt;
      margin-bottom: 4px;
    }
    .report-header .subtitle {
      font-size: ${(config.tamanhoFonte - 1)}pt;
      color: #666;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    th, td {
      padding: 4px 8px;
      font-size: ${config.tamanhoFonte}pt;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    ${config.incluirBordas ? `th, td { border: 1px solid #333; }` : `th { border-bottom: 2px solid #333; }`}
    ${config.zebrado ? `tr:nth-child(even) { background: ${config.corZebra || '#f8fafc'}; }` : ""}
    .report-footer {
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px solid #ccc;
      font-size: ${(config.tamanhoFonte - 1)}pt;
      color: #666;
      text-align: center;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${config.cabecalho?.incluir ? `
  <div class="report-header" style="text-align: ${config.cabecalho.alinhamento || 'center'};">
    ${config.titulo ? `<h1>${escapeHtml(config.titulo)}</h1>` : ""}
    ${config.cabecalho.texto ? `<div class="subtitle">${escapeHtml(config.cabecalho.texto)}</div>` : ""}
    ${config.cabecalho.incluirData ? `<div class="subtitle">Gerado em: ${new Date().toLocaleString("pt-BR")}</div>` : ""}
  </div>` : ""}

  <table>
    <thead>
      <tr>${ths}</tr>
    </thead>
    <tbody>
      ${tbodyHtml}
    </tbody>
  </table>

  <div class="report-footer">
    Total de registros: ${registros.length}
    ${config.rodape?.incluir ? ` | ${config.rodape.texto || ""}` : ""}
    ${config.rodape?.incluirNumeroPagina ? " | Página 1 de 1" : ""}
  </div>
</body>
</html>`;

  return html;
}

/**
 * Gera uma linha da tabela HTML.
 */
function gerarLinhaHtml(
  registro: Record<string, any>,
  campos: RelatorioCampo[],
  config: RelatorioConfigPdf
): string {
  const tds = campos.map((campo) => {
    const valor = obterValorCampo(registro, campo.chave);
    const valorFormatado = formatarValor(valor, campo);
    const corCampo = campo.corCampo || '#1a1a1a';
    const bgCampo = campo.backgroundCampo || '';
    const bgStyle = bgCampo ? `background: ${bgCampo};` : '';
    return `<td style="padding: 4px 8px; font-size: ${config.tamanhoFonte}pt; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: ${corCampo}; ${bgStyle} ${alinhamentoCss(campo)}">${escapeHtml(valorFormatado)}</td>`;
  }).join("");
  return `<tr>${tds}</tr>`;
}

function alinhamentoCss(campo: RelatorioCampo): string {
  switch (campo.alinhamento) {
    case "centro": return "text-align: center;";
    case "direita": return "text-align: right;";
    default: return "text-align: left;";
  }
}

/**
 * Escapa HTML para prevenir XSS.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace('#', '');
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return { r, g, b };
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

function alinhamentoPdf(alinhamento?: string): 'left' | 'center' | 'right' {
  switch (alinhamento) {
    case 'centro': return 'center';
    case 'direita': return 'right';
    default: return 'left';
  }
}

function alinhamentoX(alinhamento: string | undefined, x: number, w: number, pad: number): number {
  switch (alinhamento) {
    case 'centro': return x + w / 2;
    case 'direita': return x + w - pad;
    default: return x + pad;
  }
}

function truncateText(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string {
  if (!text) return '';
  const textWidth = doc.getTextWidth(text);
  if (textWidth <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && doc.getTextWidth(truncated + '…') > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated ? truncated + '…' : '';
}

function groupData(
  registros: Record<string, any>[],
  agrupamento: { campo: string; incluirSubtotal: boolean },
  campos: RelatorioCampo[]
): { label?: string; rows: Record<string, any>[]; subtotal?: boolean }[] {
  const grupos: Record<string, Record<string, any>[]> = {};
  for (const reg of registros) {
    const chave = String(obterValorCampo(reg, agrupamento.campo) ?? '(vazio)');
    if (!grupos[chave]) grupos[chave] = [];
    grupos[chave].push(reg);
  }
  return Object.entries(grupos).map(([label, rows]) => ({
    label,
    rows,
    subtotal: agrupamento.incluirSubtotal,
  }));
}

/**
 * Gera o PDF como arquivo e faz download automaticamente usando jsPDF.
 */
export function gerarPdf(
  relatorio: Relatorio,
  registros: Record<string, any>[]
): void {
  const { campos, configPdf, agrupamento } = relatorio;
  const config: RelatorioConfigPdf = configPdf ?? {
    tamanhoPagina: "A4",
    orientacao: "retrato",
    margens: { superior: 15, inferior: 15, esquerda: 15, direita: 15 },
    cabecalho: { incluir: false },
    rodape: { incluir: false },
    incluirBordas: true,
    zebrado: true,
    tamanhoFonte: 10,
    quebraPaginaPorGrupo: false,
  };

  const orientation = config.orientacao === 'paisagem' ? 'landscape' : 'portrait';
  const doc = new jsPDF({
    unit: 'mm',
    format: config.tamanhoPagina.toLowerCase(),
    orientation,
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginLeft = config.margens.esquerda;
  const marginRight = config.margens.direita;
  const marginTop = config.margens.superior;
  const marginBottom = config.margens.inferior;
  const contentW = pageW - marginLeft - marginRight;
  const fontName = 'helvetica';
  const fontSize = config.tamanhoFonte;
  const lineHeight = fontSize * 0.5;
  const cellPadding = 2;

  // Calcula larguras das colunas
  const totalLargura = campos.reduce((sum, c) => sum + (c.largura || 30), 0);
  const colWidths = campos.map((c) => ((c.largura || 30) / totalLargura) * contentW);

  let y = marginTop;

  function checkPage(needed: number) {
    if (y + needed > pageH - marginBottom) {
      doc.addPage();
      y = marginTop;
      return true;
    }
    return false;
  }

  // ── Cabeçalho do relatório ──
  if (config.cabecalho?.incluir) {
    doc.setFont(fontName, 'bold');
    doc.setFontSize(fontSize + 6);
    if (config.titulo) {
      doc.text(config.titulo, pageW / 2, y, { align: 'center' });
      y += lineHeight + 4;
    }
    doc.setFont(fontName, 'normal');
    doc.setFontSize(fontSize - 2);
    if (config.cabecalho.texto) {
      doc.text(config.cabecalho.texto, pageW / 2, y, { align: 'center' });
      y += lineHeight + 2;
    }
    if (config.cabecalho.incluirData) {
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageW / 2, y, { align: 'center' });
      y += lineHeight + 2;
    }
    y += 4;
  }

  // ── Cabeçalho da tabela ──
  doc.setFontSize(fontSize);
  doc.setFont(fontName, 'bold');

  const headerH = fontSize + cellPadding * 2 + 2;
  checkPage(headerH + 4);

  campos.forEach((campo, i) => {
    const x = marginLeft + colWidths.slice(0, i).reduce((s, w) => s + w, 0);
    const w = colWidths[i];
    // Fundo do cabeçalho
    const bg = campo.backgroundLabel || '#e2e8f0';
    const rgb = hexToRgb(bg);
    if (rgb) doc.setFillColor(rgb.r, rgb.g, rgb.b);
    else doc.setFillColor(226, 232, 240);
    doc.rect(x, y, w, headerH, 'F');
    // Borda
    if (config.incluirBordas) {
      doc.setDrawColor(51, 51, 51);
      doc.rect(x, y, w, headerH, 'S');
    }
    // Texto
    const labelCor = hexToRgb(campo.corLabel || '#1a1a1a');
    if (labelCor) doc.setTextColor(labelCor.r, labelCor.g, labelCor.b);
    else doc.setTextColor(26, 26, 26);
    const txtX = alinhamentoX(campo.alinhamento, x, w, cellPadding);
    doc.text(truncateText(doc, campo.label, w - cellPadding * 2, fontSize), txtX, y + headerH - cellPadding - 1, { align: alinhamentoPdf(campo.alinhamento) });
  });

  y += headerH;
  doc.setFont(fontName, 'normal');
  doc.setFontSize(fontSize);

  // ── Linhas de dados ──
  const dataToRender = agrupamento?.campo ? groupData(registros, agrupamento, campos) : [{ rows: registros }];

  for (const grupo of dataToRender) {
    if (grupo.label) {
      checkPage(headerH + 2);
      doc.setFont(fontName, 'bold');
      doc.setFontSize(fontSize + 1);
      doc.setTextColor(30, 30, 30);
      doc.text(grupo.label, marginLeft, y + headerH - cellPadding);
      y += headerH;
      doc.setFont(fontName, 'normal');
      doc.setFontSize(fontSize);
    }

    for (const reg of grupo.rows) {
      const rowH = fontSize + cellPadding * 2 + 1;
      checkPage(rowH);

      // Zebrado
      if (config.zebrado && grupo.rows.indexOf(reg) % 2 === 1) {
        const zebraCor = hexToRgb(config.corZebra || '#f8fafc');
        if (zebraCor) doc.setFillColor(zebraCor.r, zebraCor.g, zebraCor.b);
        else doc.setFillColor(248, 250, 252);
        doc.rect(marginLeft, y, contentW, rowH, 'F');
      }

      campos.forEach((campo, i) => {
        const x = marginLeft + colWidths.slice(0, i).reduce((s, w) => s + w, 0);
        const w = colWidths[i];
        const chaveResolvida = campo.chave;
        const valor = obterValorCampo(reg, chaveResolvida);
        const valorFmt = formatarValor(valor, campo);

        // Borda da célula
        if (config.incluirBordas) {
          doc.setDrawColor(51, 51, 51);
          doc.rect(x, y, w, rowH, 'S');
        }

        // Cor do campo
        const campoCor = hexToRgb(campo.corCampo || '#1a1a1a');
        if (campoCor) doc.setTextColor(campoCor.r, campoCor.g, campoCor.b);
        else doc.setTextColor(26, 26, 26);

        // Fundo do campo
        if (campo.backgroundCampo) {
          const bgRgb = hexToRgb(campo.backgroundCampo);
          if (bgRgb) {
            doc.setFillColor(bgRgb.r, bgRgb.g, bgRgb.b);
            doc.rect(x, y, w, rowH, 'F');
          }
        }

        const txtX = alinhamentoX(campo.alinhamento, x, w, cellPadding);
        doc.text(truncateText(doc, valorFmt, w - cellPadding * 2, fontSize), txtX, y + rowH - cellPadding - 1, { align: alinhamentoPdf(campo.alinhamento) });
      });

      y += rowH;
    }

    // Subtotal
    if (grupo.subtotal) {
      checkPage(lineHeight + 4);
      doc.setFont(fontName, 'italic');
      doc.setFontSize(fontSize - 1);
      doc.setTextColor(100, 100, 100);
      doc.text(`Subtotal: ${grupo.rows.length} registro(s)`, pageW - marginRight, y + lineHeight + 2, { align: 'right' });
      y += lineHeight + 6;
      doc.setFont(fontName, 'normal');
      doc.setFontSize(fontSize);
    }
  }

  // Total geral
  if (agrupamento?.incluirTotalGeral) {
    checkPage(lineHeight + 6);
    doc.setFont(fontName, 'bold');
    doc.setFontSize(fontSize + 1);
    doc.setTextColor(30, 30, 30);
    doc.text(`Total: ${registros.length} registro(s)`, pageW - marginRight, y + lineHeight + 2, { align: 'right' });
    y += lineHeight + 6;
  }

  // ── Rodapé ──
  if (config.rodape?.incluir) {
    const footerY = pageH - marginBottom + 4;
    doc.setFont(fontName, 'normal');
    doc.setFontSize(fontSize - 2);
    doc.setTextColor(102, 102, 102);
    let footerText = `Total de registros: ${registros.length}`;
    if (config.rodape.texto) footerText += ` | ${config.rodape.texto}`;
    doc.text(footerText, pageW / 2, footerY, { align: 'center' });
  }

  const filename = `${config.titulo || relatorio.ds_relatorio || 'relatorio'}.pdf`;
  doc.save(filename);
}
