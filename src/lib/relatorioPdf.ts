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
const PAGE_SIZES: Record<string, [number, number]> = {
  a3: [297, 420],
  a4: [210, 297],
  a5: [148, 210],
  letter: [216, 279],
  legal: [216, 356],
};

/**
 * Converte hex para RGB.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace('#', '');
  if (h.length !== 6) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/**
 * Retorna estilo jsPDF a partir de string de estilo do campo.
 */
function estiloPdf(estilo?: string): 'normal' | 'bold' | 'italic' | 'bolditalic' {
  if (!estilo || estilo === '---' || estilo === 'normal') return 'normal';
  const negrito = estilo.includes('negrito');
  const italico = estilo.includes('italico');
  if (negrito && italico) return 'bolditalic';
  if (negrito) return 'bold';
  if (italico) return 'italic';
  return 'normal';
}

/**
 * Verifica se estilo inclui sublinhado.
 */
function temSublinhado(estilo?: string): boolean {
  return !!estilo && estilo.includes('sublinhado');
}

/**
 * Trunca texto para caber na largura disponível.
 */
function truncateText(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string {
  if (!text) return '';
  const measured = doc.getTextWidth(text);
  if (measured <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && doc.getTextWidth(truncated + '…') > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '…';
}

/**
 * Desenha sublinhado manual abaixo do texto.
 */
function desenharSublinhado(
  doc: jsPDF,
  x: number,
  y: number,
  text: string,
  fontSize: number,
  align: 'left' | 'center' | 'right',
  cellWidth: number,
  cor: string,
) {
  const textW = doc.getTextWidth(text);
  const lineY = y + fontSize * 0.12;
  let lineX = x;
  if (align === 'center') lineX = x + (cellWidth - textW) / 2;
  else if (align === 'right') lineX = x + cellWidth - textW - 2;
  const rgb = hexToRgb(cor);
  if (rgb) doc.setDrawColor(rgb.r, rgb.g, rgb.b);
  doc.setLineWidth(0.2);
  doc.line(lineX, lineY, lineX + textW, lineY);
}

/**
 * Converte pixels para mm (96 DPI).
 */
function pxToMm(px: number): number {
  return px * 0.264583;
}

/**
 * Desenha uma borda ao redor da área de conteúdo (margens da página)
 * conforme o estilo selecionado.
 */
function desenharBordaPagina(
  doc: jsPDF,
  estiloBorda: RelatorioConfigPdf['estiloBorda'],
  marginTop: number,
  marginBottom: number,
  marginLeft: number,
  marginRight: number,
): void {
  if (!estiloBorda) return;

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const x1 = marginLeft;
  const y1 = marginTop;
  const x2 = pageW - marginRight;
  const y2 = pageH - marginBottom;

  doc.setDrawColor(0, 0, 0);
  doc.setFillColor(255, 255, 255);

  switch (estiloBorda) {
    case 'solid_fina':
      doc.setLineWidth(0.3);
      doc.setLineDashPattern([], 0);
      doc.rect(x1, y1, x2 - x1, y2 - y1, 'S');
      break;

    case 'solid_grossa':
      doc.setLineWidth(0.8);
      doc.setLineDashPattern([], 0);
      doc.rect(x1, y1, x2 - x1, y2 - y1, 'S');
      break;

    case 'dupla': {
      const gap = 1.2;
      doc.setLineWidth(0.3);
      doc.setLineDashPattern([], 0);
      doc.rect(x1, y1, x2 - x1, y2 - y1, 'S');
      doc.rect(x1 + gap, y1 + gap, (x2 - x1) - gap * 2, (y2 - y1) - gap * 2, 'S');
      break;
    }

    case 'tracejada':
      doc.setLineWidth(0.3);
      doc.setLineDashPattern([3, 2], 0);
      doc.rect(x1, y1, x2 - x1, y2 - y1, 'S');
      doc.setLineDashPattern([], 0);
      break;

    case 'pontilhada':
      doc.setLineWidth(0.3);
      doc.setLineDashPattern([0.8, 1.5], 0);
      doc.rect(x1, y1, x2 - x1, y2 - y1, 'S');
      doc.setLineDashPattern([], 0);
      break;
  }
}

/**
 * Formata valor para exibição (moeda, data, etc).
 */
function formatarValor(valor: any, campo: RelatorioCampo): string {
  if (valor === null || valor === undefined || valor === '') return '';
  const fmt = campo.formatacao;
  if (fmt === 'moeda') {
    const num = typeof valor === 'number' ? valor : parseFloat(String(valor).replace(/[.,]/g, (m) => m === ',' ? '.' : ''));
    if (isNaN(num)) return String(valor);
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  if (fmt === 'data') {
    if (!valor) return '';
    try {
      const d = new Date(valor);
      if (isNaN(d.getTime())) return String(valor);
      return d.toLocaleDateString('pt-BR');
    } catch { return String(valor); }
  }
  return String(valor);
}

/**
 * Renderiza uma tabela (cabeçalho + linhas + soma) de uma banda no PDF.
 */
function renderizarTabelaBanda(
  doc: jsPDF,
  relatorio: Relatorio,
  config: RelatorioConfigPdf,
  campos: RelatorioCampo[],
  registros: Record<string, any>[],
  yStart: number,
  pageW: number,
  pageH: number,
  marginLeft: number,
  marginRight: number,
  marginTop: number,
  marginBottom: number,
  contentW: number,
  mapFontJsPdf: (fonte?: string) => string,
  bordas?: { superior?: boolean; inferior?: boolean; esquerda?: boolean; direita?: boolean },
  bandaConfig?: { espessuraLabel?: number; topoLabel?: number; espessuraCampo?: number; topoRegistro?: number; bgLabel?: string; bgCampo?: string; corLabelGlobal?: string; corCampoGlobal?: string; fonteLabel?: string; tamanhoFonteLabel?: number; fonteCampo?: string; tamanhoFonteCampo?: number },
): number {
  if (campos.length === 0) return yStart;

  // Usar config da banda se disponível, senão usar a do relatório
  const fontLabel = mapFontJsPdf(bandaConfig?.fonteLabel ?? relatorio.fonteLabel);
  const fontCampo = mapFontJsPdf(bandaConfig?.fonteCampo ?? relatorio.fonteCampo);
  const fontSizeLabel = bandaConfig?.tamanhoFonteLabel ?? relatorio.tamanhoFonteLabel ?? 10;
  const fontSizeCampo = bandaConfig?.tamanhoFonteCampo ?? relatorio.tamanhoFonteCampo ?? 10;
  const fontSize = config.tamanhoFonte;
  const cellPadding = 2;
  const headerH = pxToMm(bandaConfig?.espessuraLabel ?? relatorio.espessuraLabel ?? 16);
  const rowH = pxToMm(bandaConfig?.espessuraCampo ?? relatorio.espessuraCampo ?? 24);

  const colWidths = campos.map((c) => pxToMm(c.qt_largura ?? 30));

  let y = yStart;

  const bordaOffset = config.estiloBorda ? 2 : 0;
  function checkPage(needed: number) {
    if (y + needed > pageH - marginBottom) {
      doc.addPage();
      y = marginTop + bordaOffset;
      // Redesenhar borda na nova página
      desenharBordaPagina(doc, config.estiloBorda ?? null, marginTop, marginBottom, marginLeft, marginRight);
      return true;
    }
    return false;
  }

  // Calcula empilhamento de campos
  const xGroupCount: Record<number, number> = {};
  const xGroupIndex: number[] = campos.map((c) => {
    const xPos = c.qt_esquerda ?? 0;
    const idx = xGroupCount[xPos] ?? 0;
    xGroupCount[xPos] = idx + 1;
    return idx;
  });
  const maxXGroups = Math.max(...Object.values(xGroupCount), 1);
  const totalHeaderH = headerH * maxXGroups;

  checkPage(totalHeaderH + 4);

  // ── Cabeçalho da tabela ──
  doc.setFontSize(fontSize);

  campos.forEach((campo, i) => {
    doc.setFont(fontLabel, estiloPdf(campo.ie_estilo_label));
    doc.setFontSize(fontSizeLabel);
    const x = marginLeft + pxToMm(campo.qt_esquerda ?? 0);
    const w = colWidths[i];
    const bg = bandaConfig?.bgLabel ?? relatorio.bgLabel;
    if (bg) {
      const rgb = hexToRgb(bg);
      if (rgb) doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.rect(x, y, w, headerH, 'F');
    }
    if (config.incluirBordas) {
      doc.setDrawColor(51, 51, 51);
      doc.rect(x, y, w, headerH, 'S');
    }
    const labelCor = hexToRgb(bandaConfig?.corLabelGlobal ?? (relatorio.corLabelGlobal || '#1a1a1a'));
    if (labelCor) doc.setTextColor(labelCor.r, labelCor.g, labelCor.b);
    else doc.setTextColor(26, 26, 26);
    const labelAlign = campo.ie_alinhamento ?? 'esquerda';
    const labelTxtX = labelAlign === 'centro' ? x + w / 2 : labelAlign === 'direita' ? x + w - cellPadding : x + cellPadding;
    const labelAlignOpt: 'left' | 'center' | 'right' = labelAlign === 'centro' ? 'center' : labelAlign === 'direita' ? 'right' : 'left';
    const labelTxtY = y + fontSizeLabel * 0.35 + pxToMm(bandaConfig?.topoLabel ?? relatorio.topoLabel ?? 0);
    doc.text(truncateText(doc, campo.label, w - cellPadding * 2, fontSize), labelTxtX, labelTxtY, { align: labelAlignOpt });
    if (temSublinhado(campo.ie_estilo_label)) {
      desenharSublinhado(doc, labelTxtX, labelTxtY, truncateText(doc, campo.label, w - cellPadding * 2, fontSize), fontSize, labelAlignOpt, w, bandaConfig?.corLabelGlobal ?? (relatorio.corLabelGlobal || '#1a1a1a'));
    }
  });

  y += headerH;
  doc.setFont(fontCampo, 'normal');
  doc.setFontSize(fontSizeCampo);

  // ── Linhas de dados ──
  for (let regIdx = 0; regIdx < registros.length; regIdx++) {
    const reg = registros[regIdx];
    checkPage(rowH);

    if (config.zebrado && regIdx % 2 === 1) {
      const zebraCor = hexToRgb(config.corZebra || '#f8fafc');
      if (zebraCor) doc.setFillColor(zebraCor.r, zebraCor.g, zebraCor.b);
      else doc.setFillColor(248, 250, 252);
      doc.rect(marginLeft, y, contentW, rowH, 'F');
    }

    campos.forEach((campo, i) => {
      const x = marginLeft + pxToMm(campo.qt_esquerda ?? 0);
      const w = colWidths[i];
      const chaveResolvida = campo.ie_campo;
      const valor = obterValorCampo(reg, chaveResolvida);
      const valorFmt = formatarValor(valor, campo);

      if (config.incluirBordas) {
        doc.setDrawColor(51, 51, 51);
        doc.rect(x, y, w, rowH, 'S');
      }

      const campoCor = hexToRgb(bandaConfig?.corCampoGlobal ?? (relatorio.corCampoGlobal || '#1a1a1a'));
      if (campoCor) doc.setTextColor(campoCor.r, campoCor.g, campoCor.b);
      else doc.setTextColor(26, 26, 26);

      if ((bandaConfig?.bgCampo ?? relatorio.bgCampo) === 'zebrado') {
        const isOdd = regIdx % 2 === 1;
        const zebraRgb = hexToRgb(isOdd ? '#ccc' : '#fff');
        if (zebraRgb) {
          doc.setFillColor(zebraRgb.r, zebraRgb.g, zebraRgb.b);
          doc.rect(x, y, w, rowH, 'F');
        }
      }

      const campoAlign = campo.ie_alinhamento ?? 'esquerda';
      const campoTxtX = campoAlign === 'centro' ? x + w / 2 : campoAlign === 'direita' ? x + w - cellPadding : x + cellPadding;
      const campoTxtY = y + pxToMm(bandaConfig?.topoRegistro ?? relatorio.topoRegistro ?? 0) + fontSize * 0.35;
      const campoAlignOpt: 'left' | 'center' | 'right' = campoAlign === 'centro' ? 'center' : campoAlign === 'direita' ? 'right' : 'left';
      doc.setFont(fontCampo, estiloPdf(campo.ie_estilo));
      doc.setFontSize(fontSizeCampo);
      doc.text(truncateText(doc, valorFmt, w - cellPadding * 2, fontSize), campoTxtX, campoTxtY, { align: campoAlignOpt });
      if (temSublinhado(campo.ie_estilo)) {
        desenharSublinhado(doc, campoTxtX, campoTxtY, truncateText(doc, valorFmt, w - cellPadding * 2, fontSize), fontSize, campoAlignOpt, w, bandaConfig?.corCampoGlobal ?? (relatorio.corCampoGlobal || '#1a1a1a'));
      }
    });

    y += rowH;
  }

  // ── Linha de Soma ──
  const camposComSoma = campos.filter((c) => !!c.soma);
  if (camposComSoma.length > 0 && registros.length > 0) {
    checkPage(rowH + 4);
    const somas: Record<string, number> = {};
    for (const campo of camposComSoma) {
      let total = 0;
      for (const reg of registros) {
        const val = obterValorCampo(reg, campo.ie_campo);
        const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[.,]/g, (m) => m === ',' ? '.' : ''));
        if (!isNaN(num)) total += num;
      }
      somas[campo.ie_campo] = total;
    }
    campos.forEach((campo, i) => {
      const x = marginLeft + pxToMm(campo.qt_esquerda ?? 0);
      const w = colWidths[i];
      if (config.incluirBordas) {
        doc.setDrawColor(51, 51, 51);
        doc.rect(x, y, w, rowH, 'S');
      }
      const campoCor = hexToRgb(bandaConfig?.corCampoGlobal ?? (relatorio.corCampoGlobal || '#1a1a1a'));
      if (campoCor) doc.setTextColor(campoCor.r, campoCor.g, campoCor.b);
      else doc.setTextColor(26, 26, 26);
      const ie_estilo_somaPdf = campo.ie_estilo_soma || '';
      const isNegritoSoma = ie_estilo_somaPdf.includes('negrito');
      const isItalicSoma = ie_estilo_somaPdf.includes('italico');
      const fontStyleSoma: 'normal' | 'bold' | 'italic' | 'bolditalic' = isNegritoSoma && isItalicSoma ? 'bolditalic' : isNegritoSoma ? 'bold' : isItalicSoma ? 'italic' : 'normal';
      doc.setFont(fontCampo, fontStyleSoma);
      doc.setFontSize(fontSizeCampo);
      const campoAlign = campo.ie_alinhamento ?? 'esquerda';
      const campoTxtX = campoAlign === 'centro' ? x + w / 2 : campoAlign === 'direita' ? x + w - cellPadding : x + cellPadding;
      const campoTxtY = y + pxToMm(bandaConfig?.topoRegistro ?? relatorio.topoRegistro ?? 0) + fontSizeCampo * 0.35;
      const campoAlignOpt: 'left' | 'center' | 'right' = campoAlign === 'centro' ? 'center' : campoAlign === 'direita' ? 'right' : 'left';
      if (campo.soma && somas[campo.ie_campo] !== undefined) {
        const somaTxt = truncateText(doc, formatarValor(somas[campo.ie_campo], campo), w - cellPadding * 2, fontSizeCampo);
        doc.text(somaTxt, campoTxtX, campoTxtY, { align: campoAlignOpt });
        if (temSublinhado(ie_estilo_somaPdf)) {
          desenharSublinhado(doc, campoTxtX, campoTxtY, somaTxt, fontSizeCampo, campoAlignOpt, w, bandaConfig?.corCampoGlobal ?? (relatorio.corCampoGlobal || '#1a1a1a'));
        }
      } else {
        doc.text('', campoTxtX, campoTxtY);
      }
    });
    y += rowH;
  }

  // ── Desenhar bordas da banda (se configuradas) ──
  if (bordas && (bordas.superior || bordas.inferior || bordas.esquerda || bordas.direita)) {
    const totalH = y - yStart;
    const x0 = marginLeft;
    const x1 = marginLeft + contentW;
    const y0 = yStart;
    const y1 = yStart + totalH;
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    if (bordas.superior) doc.line(x0, y0, x1, y0);
    if (bordas.inferior) doc.line(x0, y1, x1, y1);
    if (bordas.esquerda) doc.line(x0, y0, x0, y1);
    if (bordas.direita) doc.line(x1, y0, x1, y1);
  }

  return y;
}

/**
 * Renderiza valores de uma banda Texto/Valor no PDF.
 * Cada campo é posicionado individualmente usando Esquerda (distância da borda esquerda)
 * e Topo (distância do topo da banda).
 */
function renderizarTextoValorBanda(
  doc: jsPDF,
  relatorio: Relatorio,
  config: RelatorioConfigPdf,
  campos: RelatorioCampo[],
  registros: Record<string, any>[],
  yBandStart: number,
  marginLeft: number,
  marginTop: number,
  mapFontJsPdf: (fonte?: string) => string,
  bandHeightMm?: number,
  bordas?: { superior?: boolean; inferior?: boolean; esquerda?: boolean; direita?: boolean },
  contentW?: number,
  usuarioGeracao?: string,
  imagensMap?: Record<string, string>,
): void {
  if (campos.length === 0) return;

  const reg = registros.length > 0 ? registros[0] : null;
  const bordaOff = config.estiloBorda ? 2 : 0;
  const yBandTop = yBandStart - bordaOff;
  const yBandEnd = bandHeightMm != null ? yBandStart + bandHeightMm : Infinity;

  const agora = new Date();
  const fmtData = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  const fmtHora = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;

  campos.forEach((campo) => {
    let texto: string;
    const ie_tipo_elemento = (campo as any).ie_tipo_elemento;
    if (ie_tipo_elemento === 'conteudo') {
      texto = (campo as any).conteudo ?? '';
    } else if (ie_tipo_elemento === 'data_geracao') {
      texto = fmtData(agora);
    } else if (ie_tipo_elemento === 'horario_geracao') {
      texto = fmtHora(agora);
    } else if (ie_tipo_elemento === 'data_horario_geracao') {
      texto = `${fmtData(agora)} ${fmtHora(agora)}`;
    } else if (ie_tipo_elemento === 'usuario_geracao') {
      texto = usuarioGeracao ?? (relatorio as any).ds_usuario_criacao ?? '';
    } else if (ie_tipo_elemento === 'imagem') {
      // Renderizar imagem no PDF
      const nr_seq_imagem = (campo as any).nr_seq_imagem;
      if (!nr_seq_imagem || !imagensMap?.[nr_seq_imagem]) { texto = ''; } else {
        const imgDataUrl = imagensMap[nr_seq_imagem];
        const tamanhoPx = (campo as any).qt_tamanho_imagem ?? 100;
        const tamanhoMm = pxToMm(tamanhoPx);
        const x = marginLeft + pxToMm(campo.qt_esquerda ?? 0);
        const yPos = yBandTop + pxToMm(campo.qt_topo ?? 0);
        if (yPos + tamanhoMm > yBandEnd) return;
        try {
          const fmt = imgDataUrl.includes('png') ? 'PNG' : 'JPEG';
          doc.addImage(imgDataUrl, fmt, x, yPos, tamanhoMm, tamanhoMm);
        } catch (e) { console.error('Erro ao adicionar imagem no PDF:', e); }
        return;
      }
    } else if (reg && campo.ie_campo) {
      const valor = obterValorCampo(reg, campo.ie_campo);
      texto = formatarValor(valor, campo);
    } else {
      return;
    }
    if (!texto) return;

    const fontCampo = mapFontJsPdf((campo as any).ie_fonte || relatorio.fonteCampo);
    const fontSizeCampo = (campo as any).qt_fonte || relatorio.tamanhoFonteCampo || 10;

    const xBase = marginLeft + pxToMm(campo.qt_esquerda ?? 0);
    const larguraMm = pxToMm(campo.qt_largura ?? 0);
    const fontSizeMmCalc = fontSizeCampo * 0.352778;
    const ascMmCalc = fontSizeMmCalc * 1.0;
    const pTCalc = pxToMm((campo as any).qt_padding_superior ?? 2);
    const y = yBandTop + pxToMm(campo.qt_topo ?? 0) + ascMmCalc + pTCalc;

    // Ignorar itens que ultrapassam a altura da banda
    if (y > yBandEnd) return;

    const cd_cor = (campo as any).cd_cor || relatorio.corCampoGlobal || '#1a1a1a';
    const rgb = hexToRgb(cd_cor);
    if (rgb) doc.setTextColor(rgb.r, rgb.g, rgb.b);
    else doc.setTextColor(26, 26, 26);

    doc.setFont(fontCampo, estiloPdf(campo.ie_estilo));
    doc.setFontSize(fontSizeCampo);

    const align = campo.ie_alinhamento === 'centro' ? 'center' : campo.ie_alinhamento === 'direita' ? 'right' : 'left';

    // Calcular x final baseado na largura e alinhamento
    let x = xBase;
    if (align === 'center') x = xBase + larguraMm / 2;
    else if (align === 'right') x = xBase + larguraMm;

    // Caixa do valor (background + bordas), baseada no texto + paddings
    const textStr = String(texto);
    const textWidth = doc.getTextWidth(textStr);
    const fontSizeMm = fontSizeCampo * 0.352778;
    const pT = pxToMm((campo as any).qt_padding_superior ?? 2);
    const pR = pxToMm((campo as any).qt_padding_direita ?? 5);
    const pB = pxToMm((campo as any).qt_padding_inferior ?? 2);
    const pL = pxToMm((campo as any).qt_padding_esquerda ?? 5);
    let bgX = x;
    if (align === 'center') bgX = x - textWidth / 2 - pL;
    else if (align === 'right') bgX = x - textWidth - pL;
    else bgX = x - pL;
    const ascMm = fontSizeMm * 1.0;
    const descMm = fontSizeMm * 0.2;
    const boxX = bgX;
    const boxY = y - ascMm - pT;
    const boxW = textWidth + pL + pR;
    const boxH = ascMm + descMm + pT + pB;
    // Background do valor (ignorado se transparente)
    const bgCampo = (campo as any).cd_background;
    if (!(campo as any).transparentCampo && bgCampo && bgCampo !== '#ffffff' && bgCampo !== '') {
      const bgRgb = hexToRgb(bgCampo);
      if (bgRgb) {
        doc.setFillColor(bgRgb.r, bgRgb.g, bgRgb.b);
        doc.rect(boxX, boxY, boxW, boxH, 'F');
      }
    }
    // Bordas do elemento
    const hasBorder = (campo as any).ie_borda_superior === 'S' || (campo as any).ie_borda_direita === 'S' || (campo as any).ie_borda_inferior === 'S' || (campo as any).ie_borda_esquerda === 'S';
    if (hasBorder) {
      doc.setDrawColor(0);
      doc.setLineWidth(0.2);
      if ((campo as any).ie_borda_superior === 'S') doc.line(boxX, boxY, boxX + boxW, boxY);
      if ((campo as any).ie_borda_inferior === 'S') doc.line(boxX, boxY + boxH, boxX + boxW, boxY + boxH);
      if ((campo as any).ie_borda_esquerda === 'S') doc.line(boxX, boxY, boxX, boxY + boxH);
      if ((campo as any).ie_borda_direita === 'S') doc.line(boxX + boxW, boxY, boxX + boxW, boxY + boxH);
    }

    doc.text(String(texto), x, y, { align: align as 'left' | 'center' | 'right' });

    if (temSublinhado(campo.ie_estilo)) {
      const textWidth = doc.getTextWidth(String(texto));
      const lineY = y + 0.5;
      let lineX = x;
      if (align === 'center') lineX = x - textWidth / 2;
      else if (align === 'right') lineX = x - textWidth;
      if (rgb) doc.setDrawColor(rgb.r, rgb.g, rgb.b);
      doc.setLineWidth(0.2);
      doc.line(lineX, lineY, lineX + textWidth, lineY);
    }
  });

  // ── Desenhar bordas da banda Texto/Valor (se configuradas) ──
  if (bordas && (bordas.superior || bordas.inferior || bordas.esquerda || bordas.direita) && contentW) {
    const pageH = doc.internal.pageSize.getHeight();
    const x0 = marginLeft;
    const x1 = marginLeft + contentW;
    const y0 = yBandStart;
    const y1 = bandHeightMm != null ? yBandStart + bandHeightMm : pageH - 20;
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    if (bordas.superior) doc.line(x0, y0, x1, y0);
    if (bordas.inferior) doc.line(x0, y1, x1, y1);
    if (bordas.esquerda) doc.line(x0, y0, x0, y1);
    if (bordas.direita) doc.line(x1, y0, x1, y1);
  }
}


/**
 * Dados de uma banda para geração do PDF.
 */
export interface BandaPdfData {
  /** Nome da banda (para referência). */
  nome: string;
  /** Posição da banda (ordem). */
  posicao: number;
  /** Tipo da banda: 'lista', 'cabecalho' ou 'rodape'. */
  tipo?: 'lista' | 'cabecalho' | 'rodape';
  /** Altura da banda em pixels (distância até a próxima). */
  altura?: number;
  /** Bordas da banda. */
  ie_borda_superior?: boolean;
  ie_borda_inferior?: boolean;
  ie_borda_esquerda?: boolean;
  ie_borda_direita?: boolean;
  /** Configurações visuais da banda (sobrepõem as do relatório). */
  espessuraLabel?: number;
  topoLabel?: number;
  espessuraCampo?: number;
  topoRegistro?: number;
  bgLabel?: string;
  bgCampo?: string;
  corLabelGlobal?: string;
  corCampoGlobal?: string;
  fonteLabel?: string;
  tamanhoFonteLabel?: number;
  fonteCampo?: string;
  tamanhoFonteCampo?: number;
  /** Campos da banda. */
  campos: RelatorioCampo[];
  /** Registros da banda. */
  registros: Record<string, any>[];
}

export function gerarPdf(
  relatorio: Relatorio,
  registros: Record<string, any>[],
  bandasRegistros?: BandaPdfData[],
  usuarioGeracao?: string,
  imagensMap?: Record<string, string>,
): void {
  const { configPdf } = relatorio;
  const config: RelatorioConfigPdf = configPdf ?? {
    tamanhoPagina: "A4",
    orientacao: "retrato",
    margens: { superior: 15, inferior: 15, esquerda: 15, direita: 15 },
    cabecalho: { incluir: false },
    rodape: { incluir: false },
    incluirBordas: true,
    estiloBorda: null,
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
  const fontSize = config.tamanhoFonte;
  const lineHeight = fontSize * 0.5;

  // ── Offset para o conteúdo ficar dentro da borda (empurra conteúdo abaixo da borda superior) ──
  const BORDA_CONTEUDO_OFFSET = config.estiloBorda ? 2 : 0;

  // ── Borda da página será desenhada após o cabeçalho ──

  function mapFontJsPdf(fonte?: string): string {
    const f = (fonte || '').toLowerCase();
    if (f.includes('courier') || f.includes('console') || f.includes('mono')) return 'courier';
    if (f.includes('times') || f.includes('garamond') || f.includes('palatino') || f.includes('book')) return 'times';
    return 'helvetica';
  }
  const fontCampo = mapFontJsPdf(relatorio.fonteCampo);

  let y = marginTop + BORDA_CONTEUDO_OFFSET;
  let onNewPage: (() => void) | null = null;

  function checkPage(needed: number) {
    if (y + needed > pageH - marginBottom) {
      doc.addPage();
      y = marginTop;
      onNewPage?.();
      return true;
    }
    return false;
  }

  // ── Renderizar bandas ou tabela única ──
  if (bandasRegistros && bandasRegistros.length > 0) {
    // Separar bandas por tipo
    const bandasOrdenadas = [...bandasRegistros].sort((a, b) => a.posicao - b.posicao);
    const bandaCabecalho = bandasOrdenadas.filter((b) => b.tipo === 'cabecalho');
    const bandaRodape = bandasOrdenadas.filter((b) => b.tipo === 'rodape');
    const bandasConteudo = bandasOrdenadas.filter((b) => b.tipo !== 'cabecalho' && b.tipo !== 'rodape');

    // Renderizar cabeçalho de banda no topo de cada página (abaixo da borda)
    function renderCabecalhoBanda() {
      bandaCabecalho.forEach((bc) => {
        renderizarTextoValorBanda(
          doc, relatorio, config, bc.campos, bc.registros,
          y, marginLeft, marginTop, mapFontJsPdf,
          bc.altura ? pxToMm(bc.altura) : undefined,
          { superior: bc.ie_borda_superior, inferior: bc.ie_borda_inferior, esquerda: bc.ie_borda_esquerda, direita: bc.ie_borda_direita },
          contentW, usuarioGeracao, imagensMap,
        );
        if (bc.altura) y += pxToMm(bc.altura);
      });
    }

    // Renderizar rodapé de banda na base de cada página (acima da borda)
    function renderRodapeBanda() {
      bandaRodape.forEach((br) => {
        const rodapeY = pageH - marginBottom - BORDA_CONTEUDO_OFFSET - (br.altura ? pxToMm(br.altura) : 10);
        renderizarTextoValorBanda(
          doc, relatorio, config, br.campos, br.registros,
          rodapeY, marginLeft, marginTop, mapFontJsPdf,
          br.altura ? pxToMm(br.altura) : undefined,
          { superior: br.ie_borda_superior, inferior: br.ie_borda_inferior, esquerda: br.ie_borda_esquerda, direita: br.ie_borda_direita },
          contentW, usuarioGeracao, imagensMap,
        );
      });
    }

    // Re-renderizar cabeçalho/rodapé a cada nova página
    onNewPage = () => {
      renderCabecalhoBanda();
      desenharBordaPagina(doc, config.estiloBorda ?? null, marginTop, marginBottom, marginLeft, marginRight);
      renderRodapeBanda();
    };

    // Renderizar cabeçalho na primeira página
    renderCabecalhoBanda();

    // Borda da página DEPOIS do cabeçalho (para englobá-lo)
    desenharBordaPagina(doc, config.estiloBorda ?? null, marginTop, marginBottom, marginLeft, marginRight);

    let totalRegistros = 0;

    // Separa as bandas de conteúdo: 'lista' gera uma tabela; as demais
    // ('Dados' / texto_valor) formam o desenho de UM registro na página.
    const bandasLista = bandasConteudo.filter((b) => b.tipo === 'lista');
    const bandasDados = bandasConteudo.filter((b) => b.tipo !== 'lista');

    if (bandasLista.length === 0 && bandasDados.length > 0) {
      // Layout de formulário (bandas Dados): quando a consulta retorna mais de
      // um registro, o bloco de bandas é repetido — uma página por registro —
      // repetindo em cada página as bandas Cabeçalho, o rodapé e a borda.
      const qtdPaginas = Math.max(1, ...bandasDados.map((b) => b.registros.length));
      totalRegistros = qtdPaginas;

      for (let r = 0; r < qtdPaginas; r++) {
        if (r > 0) {
          // Nova página com cabeçalho repetido e borda redesenhada
          doc.addPage();
          y = marginTop + BORDA_CONTEUDO_OFFSET;
          renderCabecalhoBanda();
          desenharBordaPagina(doc, config.estiloBorda ?? null, marginTop, marginBottom, marginLeft, marginRight);
        }

        bandasDados.forEach((banda, idx) => {
          // Aplicar offset de altura da banda anterior
          if (idx > 0) {
            const bandaAnterior = bandasDados[idx - 1];
            if (bandaAnterior.altura) {
              y += pxToMm(bandaAnterior.altura);
            } else {
              y += 4; // Pequeno espaço padrão entre bandas
            }
          }

          const registro = banda.registros[r];
          renderizarTextoValorBanda(
            doc, relatorio, config, banda.campos,
            registro !== undefined ? [registro] : [],
            y, marginLeft, marginTop, mapFontJsPdf,
            banda.altura ? pxToMm(banda.altura) : undefined,
            { superior: banda.ie_borda_superior, inferior: banda.ie_borda_inferior, esquerda: banda.ie_borda_esquerda, direita: banda.ie_borda_direita },
            contentW, usuarioGeracao, imagensMap,
          );
        });

        // Renderizar rodapé de banda nesta página
        renderRodapeBanda();
      }
    } else {
      bandasConteudo.forEach((banda, idx) => {
        // Aplicar offset de altura da banda anterior
        if (idx > 0 && bandasConteudo[idx - 1].altura) {
          y += pxToMm(bandasConteudo[idx - 1].altura!);
        } else if (idx > 0) {
          y += 4; // Pequeno espaço padrão entre bandas
        }

        checkPage(8);

        if (banda.tipo === 'lista') {
          y = renderizarTabelaBanda(
            doc, relatorio, config, banda.campos, banda.registros,
            y, pageW, pageH, marginLeft, marginRight, marginTop, marginBottom,
            contentW, mapFontJsPdf,
            { superior: banda.ie_borda_superior, inferior: banda.ie_borda_inferior, esquerda: banda.ie_borda_esquerda, direita: banda.ie_borda_direita },
            { espessuraLabel: banda.espessuraLabel, topoLabel: banda.topoLabel, espessuraCampo: banda.espessuraCampo, topoRegistro: banda.topoRegistro, bgLabel: banda.bgLabel, bgCampo: banda.bgCampo, corLabelGlobal: banda.corLabelGlobal, corCampoGlobal: banda.corCampoGlobal, fonteLabel: banda.fonteLabel, tamanhoFonteLabel: banda.tamanhoFonteLabel, fonteCampo: banda.fonteCampo, tamanhoFonteCampo: banda.tamanhoFonteCampo },
          );
        } else {
          renderizarTextoValorBanda(
            doc, relatorio, config, banda.campos, banda.registros,
            y, marginLeft, marginTop, mapFontJsPdf,
            banda.altura ? pxToMm(banda.altura) : undefined,
            { superior: banda.ie_borda_superior, inferior: banda.ie_borda_inferior, esquerda: banda.ie_borda_esquerda, direita: banda.ie_borda_direita },
            contentW, usuarioGeracao, imagensMap,
          );
        }
        totalRegistros += banda.registros.length;
      });

      // Renderizar rodapé de banda
      renderRodapeBanda();
    }

    // ── Total de registros (opcional) ──
    // Pode ser adicionado via banda Rodapé com ie_tipo_elemento 'data_geracao' etc.
  } else {
    // ── Modo legado: tabela única ──
    // Configurar onNewPage para redesenhar a borda em cada nova página
    if (!onNewPage) {
      onNewPage = () => {
        desenharBordaPagina(doc, config.estiloBorda ?? null, marginTop, marginBottom, marginLeft, marginRight);
      };
    }
    y = renderizarTabelaBanda(
      doc, relatorio, config, relatorio.campos ?? [], registros,
      y, pageW, pageH, marginLeft, marginRight, marginTop, marginBottom,
      contentW, mapFontJsPdf,
    );

    // ── Total de registros (legado) ──
  }

  const filename = `${config.titulo || relatorio.ds_relatorio || 'relatorio'}.pdf`;
  doc.save(filename);
}
