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
    return `<th style="padding: 6px 8px; border: 1px solid #333; ${bgThStyle} color: ${corLabel}; font-family: '${fonteLbl}', sans-serif; font-size: ${tamLbl}pt; ${largura} ${alinhamentoCssValor(campo.alinhamento)} ${estilo} white-space: nowrap;">${escapeHtml(campo.label)}</th>`;
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
      regsGrupo.forEach((reg, ri) => {
        tbodyHtml += gerarLinhaHtml(reg, campos, config, relatorio, ri);
      });

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
    registros.forEach((reg, ri) => {
      tbodyHtml += gerarLinhaHtml(reg, campos, config, relatorio, ri);
    });
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
    return `<td style="padding: 4px 8px; font-family: '${fonteCamp}', sans-serif; font-size: ${tamCamp}pt; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: ${corCampo}; ${bgStyle} ${alinhamentoCss(campo)} ${estiloCampo}">${escapeHtml(valorFormatado)}</td>`;
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
  const pxToMm = (px: number) => px * 0.264583;

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
    doc.text(truncateText(doc, campo.label, w - cellPadding * 2, fontSize), labelTxtX, y + headerH - cellPadding - 1, { align: labelAlignOpt });
    // Sublinhado manual
    if (temSublinhado(campo.estiloLabel)) {
      desenharSublinhado(doc, labelTxtX, y + headerH - cellPadding - 1, truncateText(doc, campo.label, w - cellPadding * 2, fontSize), fontSize, labelAlignOpt, w, relatorio.corLabelGlobal || '#1a1a1a');
    }
  });

  y += headerH;
  doc.setFont(fontCampo, 'normal');
  doc.setFontSize(fontSizeCampo);

  // ── Linhas de dados ──
  const dataToRender = agrupamento?.campo ? groupData(registros, agrupamento, campos) : [{ rows: registros }];

  for (const grupo of dataToRender) {
    if (grupo.label) {
      checkPage(headerH + 2);
      doc.setFont(fontCampo, 'bold');
      doc.setFontSize(fontSize + 1);
      doc.setTextColor(30, 30, 30);
      doc.text(grupo.label, marginLeft, y + headerH - cellPadding);
      y += headerH;
      doc.setFont(fontCampo, 'normal');
      doc.setFontSize(fontSize);
    }

    for (const reg of grupo.rows) {
      checkPage(rowH);

      // Zebrado
      if (config.zebrado && grupo.rows.indexOf(reg) % 2 === 1) {
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

        // Borda da célula
        // Borda da célula
        if (config.incluirBordas) {
          doc.setDrawColor(51, 51, 51);
          doc.rect(x, y, w, rowH, 'S');
        }

        // Cor do campo
        const campoCor = hexToRgb(relatorio.corCampoGlobal || '#1a1a1a');
        if (campoCor) doc.setTextColor(campoCor.r, campoCor.g, campoCor.b);
        else doc.setTextColor(26, 26, 26);

        // Fundo do campo (zebrado global)
        if (relatorio.bgCampo === 'zebrado') {
          const isOdd = grupo.rows.indexOf(reg) % 2 === 1;
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
        // Aplicar estilo do campo
        doc.setFont(fontCampo, estiloPdf(campo.estiloCampo));
        doc.setFontSize(fontSizeCampo);
        doc.text(truncateText(doc, valorFmt, w - cellPadding * 2, fontSize), campoTxtX, campoTxtY, { align: campoAlignOpt });
        // Sublinhado manual
        if (temSublinhado(campo.estiloCampo)) {
          desenharSublinhado(doc, campoTxtX, campoTxtY, truncateText(doc, valorFmt, w - cellPadding * 2, fontSize), fontSize, campoAlignOpt, w, relatorio.corCampoGlobal || '#1a1a1a');
        }
      });

      y += rowH;
    }

    // Subtotal
    if (grupo.subtotal) {
      checkPage(lineHeight + 4);
      doc.setFont(fontCampo, 'italic');
      doc.setFontSize(fontSize - 1);
      doc.setTextColor(100, 100, 100);
      doc.text(`Subtotal: ${grupo.rows.length} registro(s)`, pageW - marginRight, y + lineHeight + 2, { align: 'right' });
      y += lineHeight + 6;
      doc.setFont(fontCampo, 'normal');
      doc.setFontSize(fontSize);
    }
  }

  // Total geral
  if (agrupamento?.incluirTotalGeral) {
    checkPage(lineHeight + 6);
    doc.setFont(fontCampo, 'bold');
    doc.setFontSize(fontSize + 1);
    doc.setTextColor(30, 30, 30);
    doc.text(`Total: ${registros.length} registro(s)`, pageW - marginRight, y + lineHeight + 2, { align: 'right' });
    y += lineHeight + 6;
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
