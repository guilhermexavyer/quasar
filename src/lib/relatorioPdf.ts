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
      const d = parseDate(String(valor));
      if (d) return d.toLocaleDateString("pt-BR");
      return String(valor);
    }
    case "data_hora": {
      if (!valor) return "\u00A0";
      const d = parseDate(String(valor));
      if (d) return d.toLocaleString("pt-BR");
      return String(valor);
    }
    default:
      return String(valor);
  }
}

/**
 * Gera o HTML do relatório para impressão/PDF.
 */
/** Converte estilo para CSS. */
function estiloCss(estilo?: string): string {
  switch (estilo) {
    case 'negrito': return 'font-weight: bold;';
    case 'italico': return 'font-style: italic;';
    case 'sublinhado': return 'text-decoration: underline;';
    case 'negrito_italico': return 'font-weight: bold; font-style: italic;';
    case 'negrito_sublinhado': return 'font-weight: bold; text-decoration: underline;';
    case 'italico_sublinhado': return 'font-style: italic; text-decoration: underline;';
    case 'negrito_italico_sublinhado': return 'font-weight: bold; font-style: italic; text-decoration: underline;';
    default: return '';
  }
}

const pxToMm = (px: number) => px * 0.264583;

export function gerarHtmlRelatorio(
  relatorio: Relatorio,
  registros: Record<string, any>[]
): string {
  const { campos, configPdf } = relatorio;
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

  // Determina alinhamento CSS a partir de um valor
  function alinhamentoCssValor(valor?: string): string {
    switch (valor) {
      case 'centro': return "text-align: center;";
      case 'direita': return "text-align: right;";
      default: return "text-align: left;";
    }
  }

  // Monta cabeçalho da tabela
  const ths = campos.map((campo) => {
    const largura = campo.largura ? `width: ${campo.largura}mm;` : "";
    const bgLabel = relatorio.bgLabel || '';
    const corLabel = relatorio.corLabelGlobal || '#1a1a1a';
    const estilo = estiloCss(campo.estiloLabel);
    const bgThStyle = bgLabel ? `background: ${bgLabel};` : '';
    const fonteLbl = relatorio.fonteLabel || 'Arial';
    const tamLbl = relatorio.tamanhoFonteLabel || config.tamanhoFonte;
    const topoLbl = pxToMm(campo.alinhamentoVertical ?? 0);
    return `<th style="padding: ${6 + topoLbl}mm 8px; border: 1px solid #333; ${bgThStyle} color: ${corLabel}; font-family: '${fonteLbl}', sans-serif; font-size: ${tamLbl}pt; ${largura} ${alinhamentoCssValor(campo.alinhamento)} ${estilo} white-space: nowrap;">${escapeHtml(campo.label)}</th>`;
  }).join("");

  // Monta linhas de dados
  let tbodyHtml = "";

  registros.forEach((reg, ri) => {
    tbodyHtml += gerarLinhaHtml(reg, campos, config, relatorio, ri);
  });

  // ── Linha de Soma ──
  const camposComSoma = campos.filter((c) => !!c.soma);
  if (camposComSoma.length > 0 && registros.length > 0) {
    const somas: Record<string, number> = {};
    for (const campo of camposComSoma) {
      let total = 0;
      for (const reg of registros) {
        const val = obterValorCampo(reg, campo.chave);
        const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[.,]/g, (m) => m === ',' ? '.' : ''));
        if (!isNaN(num)) total += num;
      }
      somas[campo.chave] = total;
    }
    tbodyHtml += '<tr>';
    for (const campo of campos) {
      const valorFmt = campo.soma && somas[campo.chave] !== undefined ? formatarValor(somas[campo.chave], campo) : '';
      const align = campo.alinhamento === 'centro' ? 'center' : campo.alinhamento === 'direita' ? 'right' : 'left';
      const corCampo = relatorio.corCampoGlobal || '#1a1a1a';
      const fonteCamp = relatorio.fonteCampo || 'Arial';
      const tamCamp = relatorio.tamanhoFonteCampo || config.tamanhoFonte;
      const estiloCampo = estiloCss(campo.estiloCampo);
      tbodyHtml += `<td style="padding: 6px 8px; font-family: '${fonteCamp}', sans-serif; font-size: ${tamCamp}pt; font-weight: bold; border: 1px solid #333; color: ${corCampo}; text-align: ${align}; ${estiloCampo}">${escapeHtml(valorFmt)}</td>`;
    }
    tbodyHtml += '</tr>';
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
  config: RelatorioConfigPdf,
  relatorio: Relatorio,
  idx: number
): string {
  const tds = campos.map((campo) => {
    const valor = obterValorCampo(registro, campo.chave);
    const valorFormatado = formatarValor(valor, campo);
    const corCampo = relatorio.corCampoGlobal || '#1a1a1a';
    const bgCampo = relatorio.bgCampo === 'zebrado' ? (idx % 2 === 0 ? '#fff' : '#ccc') : '';
    const bgStyle = bgCampo ? `background: ${bgCampo};` : '';
    const estiloCampo = estiloCss(campo.estiloCampo);
    const fonteCamp = relatorio.fonteCampo || 'Arial';
    const tamCamp = relatorio.tamanhoFonteCampo || config.tamanhoFonte;
    const topoCamp = pxToMm(campo.alinhamentoVertical ?? 0);
    return `<td style="padding: ${4 + topoCamp}mm 8px; font-family: '${fonteCamp}', sans-serif; font-size: ${tamCamp}pt; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: ${corCampo}; ${bgStyle} ${alinhamentoCss(campo)} ${estiloCampo}">${escapeHtml(valorFormatado)}</td>`;
  }).join("");
  return `<tr>${tds}</tr>`;
}

function alinhamentoCss(campo: RelatorioCampo): string {
  switch (campo.alinhamento) {
    case 'centro': return "text-align: center;";
    case 'direita': return "text-align: right;";
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

/** Converte estilo para estilo jsPDF. */
function estiloPdf(estilo?: string): 'normal' | 'bold' | 'italic' | 'bolditalic' {
  switch (estilo) {
    case 'negrito': return 'bold';
    case 'italico': return 'italic';
    case 'negrito_italico': return 'bolditalic';
    case 'sublinhado': return 'normal';
    case 'negrito_sublinhado': return 'bold';
    case 'italico_sublinhado': return 'italic';
    case 'negrito_italico_sublinhado': return 'bolditalic';
    default: return 'normal';
  }
}

/** Verifica se o estilo contém sublinhado. */
function temSublinhado(estilo?: string): boolean {
  return estilo === 'sublinhado' || estilo === 'negrito_sublinhado' || estilo === 'italico_sublinhado' || estilo === 'negrito_italico_sublinhado';
}

/** Desenha uma linha sob o texto (sublinhado manual) na cor do texto. */
function desenharSublinhado(doc: jsPDF, x: number, y: number, text: string, fontSize: number, align: 'left' | 'center' | 'right', cellW: number, corHex?: string) {
  const textWidth = doc.getTextWidth(text);
  let lineX = x;
  if (align === 'center') lineX = x - textWidth / 2;
  else if (align === 'right') lineX = x - textWidth;
  const lineY = y + 0.8;
  // Usa a cor do texto para a linha
  if (corHex) {
    const rgb = hexToRgb(corHex);
    if (rgb) doc.setDrawColor(rgb.r, rgb.g, rgb.b);
  }
  doc.setLineWidth(0.2);
  doc.line(lineX, lineY, lineX + textWidth, lineY);
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

/**
 * Gera o PDF como arquivo e faz download automaticamente usando jsPDF.
 */
export function gerarPdf(
  relatorio: Relatorio,
  registros: Record<string, any>[]
): void {
  const { campos, configPdf } = relatorio;
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

  // Mapear fontes do usuário para fontes jsPDF (helvetica, courier, times)
  function mapFontJsPdf(fonte?: string): string {
    const f = (fonte || '').toLowerCase();
    if (f.includes('courier') || f.includes('console') || f.includes('mono')) return 'courier';
    if (f.includes('times') || f.includes('garamond') || f.includes('palatino') || f.includes('book')) return 'times';
    return 'helvetica';
  }
  const fontLabel = mapFontJsPdf(relatorio.fonteLabel);
  const fontCampo = mapFontJsPdf(relatorio.fonteCampo);
  const fontSizeLabel = relatorio.tamanhoFonteLabel || fontSize;
  const fontSizeCampo = relatorio.tamanhoFonteCampo || fontSize;
  const cellPadding = 2;

  // Conversão pixels → mm (96 DPI: 1px = 0.264583mm)


  // Calcula larguras das colunas (valores em pixels → mm)
  // Largura é absoluta: se o conteúdo não cabe, é cortado.
  const colWidths = campos.map((c) => pxToMm(c.largura ?? 30));

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
    doc.setFont(fontCampo, 'bold');
    doc.setFontSize(fontSize + 6);
    if (config.titulo) {
      doc.text(config.titulo, pageW / 2, y, { align: 'center' });
      y += lineHeight + 4;
    }
    doc.setFont(fontCampo, 'normal');
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

  const headerH = pxToMm(relatorio.espessuraLabel ?? 16);
  const rowH = pxToMm(relatorio.espessuraCampo ?? 24);

  // Calcula quantos campos compartilham a mesma posição X (Esquerda)
  // e o índice de cada um dentro do seu grupo (para empilhamento)
  const xGroupCount: Record<number, number> = {};
  const xGroupIndex: number[] = campos.map((c) => {
    const xPos = c.alinhamentoHorizontal ?? 0;
    const idx = xGroupCount[xPos] ?? 0;
    xGroupCount[xPos] = idx + 1;
    return idx;
  });
  // Altura total necessária para acomodar todos os campos empilhados
  const maxXGroups = Math.max(...Object.values(xGroupCount), 1);
  const totalHeaderH = headerH * maxXGroups;

  checkPage(totalHeaderH + 4);

  campos.forEach((campo, i) => {
    // Aplicar estilo da label
    doc.setFont(fontLabel, estiloPdf(campo.estiloLabel));
    doc.setFontSize(fontSizeLabel);
    const x = marginLeft + pxToMm(campo.alinhamentoHorizontal ?? 0);
    const w = colWidths[i];
    // Fundo do cabeçalho
    const bg = relatorio.bgLabel;
    if (bg) {
      const rgb = hexToRgb(bg);
      if (rgb) doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.rect(x, y, w, headerH, 'F');
    }
    // Borda
    if (config.incluirBordas) {
      doc.setDrawColor(51, 51, 51);
      doc.rect(x, y, w, headerH, 'S');
    }
    // Texto
    const labelCor = hexToRgb(relatorio.corLabelGlobal || '#1a1a1a');
    if (labelCor) doc.setTextColor(labelCor.r, labelCor.g, labelCor.b);
    else doc.setTextColor(26, 26, 26);
    const labelAlign = campo.alinhamento ?? 'esquerda';
    const labelTxtX = labelAlign === 'centro' ? x + w / 2 : labelAlign === 'direita' ? x + w - cellPadding : x + cellPadding;
    const labelAlignOpt: 'left' | 'center' | 'right' = labelAlign === 'centro' ? 'center' : labelAlign === 'direita' ? 'right' : 'left';
    const labelTxtY = y + fontSizeLabel * 0.35 + pxToMm(campo.alinhamentoVertical ?? 0);
    doc.text(truncateText(doc, campo.label, w - cellPadding * 2, fontSize), labelTxtX, labelTxtY, { align: labelAlignOpt });
    // Sublinhado manual
    if (temSublinhado(campo.estiloLabel)) {
      desenharSublinhado(doc, labelTxtX, labelTxtY, truncateText(doc, campo.label, w - cellPadding * 2, fontSize), fontSize, labelAlignOpt, w, relatorio.corLabelGlobal || '#1a1a1a');
    }
  });

  y += headerH;
  doc.setFont(fontCampo, 'normal');
  doc.setFontSize(fontSizeCampo);

  // ── Linhas de dados ──
  for (let regIdx = 0; regIdx < registros.length; regIdx++) {
    const reg = registros[regIdx];
    checkPage(rowH);

    // Zebrado
    if (config.zebrado && regIdx % 2 === 1) {
      const zebraCor = hexToRgb(config.corZebra || '#f8fafc');
      if (zebraCor) doc.setFillColor(zebraCor.r, zebraCor.g, zebraCor.b);
      else doc.setFillColor(248, 250, 252);
      doc.rect(marginLeft, y, contentW, rowH, 'F');
    }

    campos.forEach((campo, i) => {
      const x = marginLeft + pxToMm(campo.alinhamentoHorizontal ?? 0);
      const w = colWidths[i];
      const chaveResolvida = campo.chave;
      const valor = obterValorCampo(reg, chaveResolvida);
      const valorFmt = formatarValor(valor, campo);

      if (config.incluirBordas) {
        doc.setDrawColor(51, 51, 51);
        doc.rect(x, y, w, rowH, 'S');
      }

      const campoCor = hexToRgb(relatorio.corCampoGlobal || '#1a1a1a');
      if (campoCor) doc.setTextColor(campoCor.r, campoCor.g, campoCor.b);
      else doc.setTextColor(26, 26, 26);

      if (relatorio.bgCampo === 'zebrado') {
        const isOdd = regIdx % 2 === 1;
        const zebraRgb = hexToRgb(isOdd ? '#ccc' : '#fff');
        if (zebraRgb) {
          doc.setFillColor(zebraRgb.r, zebraRgb.g, zebraRgb.b);
          doc.rect(x, y, w, rowH, 'F');
        }
      }

      const campoAlign = campo.alinhamento ?? 'esquerda';
      const campoTxtX = campoAlign === 'centro' ? x + w / 2 : campoAlign === 'direita' ? x + w - cellPadding : x + cellPadding;
      const campoTxtY = y + pxToMm(campo.alinhamentoVertical ?? 0) + fontSize * 0.35;
      const campoAlignOpt: 'left' | 'center' | 'right' = campoAlign === 'centro' ? 'center' : campoAlign === 'direita' ? 'right' : 'left';
      doc.setFont(fontCampo, estiloPdf(campo.estiloCampo));
      doc.setFontSize(fontSizeCampo);
      doc.text(truncateText(doc, valorFmt, w - cellPadding * 2, fontSize), campoTxtX, campoTxtY, { align: campoAlignOpt });
      if (temSublinhado(campo.estiloCampo)) {
        desenharSublinhado(doc, campoTxtX, campoTxtY, truncateText(doc, valorFmt, w - cellPadding * 2, fontSize), fontSize, campoAlignOpt, w, relatorio.corCampoGlobal || '#1a1a1a');
      }
    });

    y += rowH;
  }

  // ── Linha de Soma ──
  const camposComSoma = campos.filter((c) => !!c.soma);
  if (camposComSoma.length > 0 && registros.length > 0) {
    checkPage(rowH + 4);
    // Calcular somatórios
    const somas: Record<string, number> = {};
    for (const campo of camposComSoma) {
      let total = 0;
      for (const reg of registros) {
        const val = obterValorCampo(reg, campo.chave);
        const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[.,]/g, (m) => m === ',' ? '.' : ''));
        if (!isNaN(num)) total += num;
      }
      somas[campo.chave] = total;
    }
    campos.forEach((campo, i) => {
      const x = marginLeft + pxToMm(campo.alinhamentoHorizontal ?? 0);
      const w = colWidths[i];
      if (config.incluirBordas) {
        doc.setDrawColor(51, 51, 51);
        doc.rect(x, y, w, rowH, 'S');
      }
      // Usar propriedades de registro (cor, fonte, tamanho)
      const campoCor = hexToRgb(relatorio.corCampoGlobal || '#1a1a1a');
      if (campoCor) doc.setTextColor(campoCor.r, campoCor.g, campoCor.b);
      else doc.setTextColor(26, 26, 26);
      doc.setFont(fontCampo, 'bold');
      doc.setFontSize(fontSizeCampo);
      const campoAlign = campo.alinhamento ?? 'esquerda';
      const campoTxtX = campoAlign === 'centro' ? x + w / 2 : campoAlign === 'direita' ? x + w - cellPadding : x + cellPadding;
      const campoTxtY = y + pxToMm(campo.alinhamentoVertical ?? 0) + fontSizeCampo * 0.35;
      const campoAlignOpt: 'left' | 'center' | 'right' = campoAlign === 'centro' ? 'center' : campoAlign === 'direita' ? 'right' : 'left';
      if (campo.soma && somas[campo.chave] !== undefined) {
        doc.text(truncateText(doc, formatarValor(somas[campo.chave], campo), w - cellPadding * 2, fontSizeCampo), campoTxtX, campoTxtY, { align: campoAlignOpt });
      } else {
        doc.text('', campoTxtX, campoTxtY);
      }
    });
    y += rowH;
  }

  // ── Rodapé ──
  if (config.rodape?.incluir) {
    const footerY = pageH - marginBottom + 4;
    doc.setFont(fontCampo, 'normal');
    doc.setFontSize(fontSize - 2);
    doc.setTextColor(102, 102, 102);
    let footerText = `Total de registros: ${registros.length}`;
    if (config.rodape.texto) footerText += ` | ${config.rodape.texto}`;
    doc.text(footerText, pageW / 2, footerY, { align: 'center' });
  }

  const filename = `${config.titulo || relatorio.ds_relatorio || 'relatorio'}.pdf`;
  doc.save(filename);
}
