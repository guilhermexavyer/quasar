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
): number {
  if (campos.length === 0) return yStart;

  const fontLabel = mapFontJsPdf(relatorio.fonteLabel);
  const fontCampo = mapFontJsPdf(relatorio.fonteCampo);
  const fontSizeLabel = relatorio.tamanhoFonteLabel || 10;
  const fontSizeCampo = relatorio.tamanhoFonteCampo || 10;
  const fontSize = config.tamanhoFonte;
  const cellPadding = 2;
  const headerH = pxToMm(relatorio.espessuraLabel ?? 16);
  const rowH = pxToMm(relatorio.espessuraCampo ?? 24);

  const colWidths = campos.map((c) => pxToMm(c.largura ?? 30));

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
    const xPos = c.alinhamentoHorizontal ?? 0;
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
    doc.setFont(fontLabel, estiloPdf(campo.estiloLabel));
    doc.setFontSize(fontSizeLabel);
    const x = marginLeft + pxToMm(campo.alinhamentoHorizontal ?? 0);
    const w = colWidths[i];
    const bg = relatorio.bgLabel;
    if (bg) {
      const rgb = hexToRgb(bg);
      if (rgb) doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.rect(x, y, w, headerH, 'F');
    }
    if (config.incluirBordas) {
      doc.setDrawColor(51, 51, 51);
      doc.rect(x, y, w, headerH, 'S');
    }
    const labelCor = hexToRgb(relatorio.corLabelGlobal || '#1a1a1a');
    if (labelCor) doc.setTextColor(labelCor.r, labelCor.g, labelCor.b);
    else doc.setTextColor(26, 26, 26);
    const labelAlign = campo.alinhamento ?? 'esquerda';
    const labelTxtX = labelAlign === 'centro' ? x + w / 2 : labelAlign === 'direita' ? x + w - cellPadding : x + cellPadding;
    const labelAlignOpt: 'left' | 'center' | 'right' = labelAlign === 'centro' ? 'center' : labelAlign === 'direita' ? 'right' : 'left';
    const labelTxtY = y + fontSizeLabel * 0.35 + pxToMm(relatorio.topoLabel ?? 0);
    doc.text(truncateText(doc, campo.label, w - cellPadding * 2, fontSize), labelTxtX, labelTxtY, { align: labelAlignOpt });
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
      const campoTxtY = y + pxToMm(relatorio.topoRegistro ?? 0) + fontSize * 0.35;
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
      const campoCor = hexToRgb(relatorio.corCampoGlobal || '#1a1a1a');
      if (campoCor) doc.setTextColor(campoCor.r, campoCor.g, campoCor.b);
      else doc.setTextColor(26, 26, 26);
      const estiloSomaPdf = campo.estiloSoma || '';
      const isNegritoSoma = estiloSomaPdf.includes('negrito');
      const isItalicSoma = estiloSomaPdf.includes('italico');
      const fontStyleSoma: 'normal' | 'bold' | 'italic' | 'bolditalic' = isNegritoSoma && isItalicSoma ? 'bolditalic' : isNegritoSoma ? 'bold' : isItalicSoma ? 'italic' : 'normal';
      doc.setFont(fontCampo, fontStyleSoma);
      doc.setFontSize(fontSizeCampo);
      const campoAlign = campo.alinhamento ?? 'esquerda';
      const campoTxtX = campoAlign === 'centro' ? x + w / 2 : campoAlign === 'direita' ? x + w - cellPadding : x + cellPadding;
      const campoTxtY = y + pxToMm(relatorio.topoRegistro ?? 0) + fontSizeCampo * 0.35;
      const campoAlignOpt: 'left' | 'center' | 'right' = campoAlign === 'centro' ? 'center' : campoAlign === 'direita' ? 'right' : 'left';
      if (campo.soma && somas[campo.chave] !== undefined) {
        const somaTxt = truncateText(doc, formatarValor(somas[campo.chave], campo), w - cellPadding * 2, fontSizeCampo);
        doc.text(somaTxt, campoTxtX, campoTxtY, { align: campoAlignOpt });
        if (temSublinhado(estiloSomaPdf)) {
          desenharSublinhado(doc, campoTxtX, campoTxtY, somaTxt, fontSizeCampo, campoAlignOpt, w, relatorio.corCampoGlobal || '#1a1a1a');
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
): void {
  if (campos.length === 0) return;

  const reg = registros.length > 0 ? registros[0] : null;
  const yBandEnd = bandHeightMm != null ? yBandStart + bandHeightMm : Infinity;

  const agora = new Date();
  const fmtData = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  const fmtHora = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;

  campos.forEach((campo) => {
    let texto: string;
    const tipoCampo = (campo as any).tipoCampo;
    if (tipoCampo === 'conteudo') {
      texto = (campo as any).conteudo ?? '';
    } else if (tipoCampo === 'data_geracao') {
      texto = fmtData(agora);
    } else if (tipoCampo === 'horario_geracao') {
      texto = fmtHora(agora);
    } else if (tipoCampo === 'data_horario_geracao') {
      texto = `${fmtData(agora)} ${fmtHora(agora)}`;
    } else if (tipoCampo === 'usuario_geracao') {
      texto = usuarioGeracao ?? (relatorio as any).ds_usuario_criacao ?? '';
    } else if (reg && campo.chave) {
      const valor = obterValorCampo(reg, campo.chave);
      texto = formatarValor(valor, campo);
    } else {
      return;
    }
    if (!texto) return;

    const fontCampo = mapFontJsPdf((campo as any).fonteCampo || relatorio.fonteCampo);
    const fontSizeCampo = (campo as any).tamanhoFonteCampo || relatorio.tamanhoFonteCampo || 10;

    const xBase = marginLeft + pxToMm(campo.alinhamentoHorizontal ?? 0);
    const y = yBandStart + pxToMm(campo.topoRegistro ?? 0);
    const larguraMm = pxToMm(campo.largura ?? 0);

    // Ignorar itens que ultrapassam a altura da banda
    if (y > yBandEnd) return;

    const corCampo = (campo as any).corCampo || relatorio.corCampoGlobal || '#1a1a1a';
    const rgb = hexToRgb(corCampo);
    if (rgb) doc.setTextColor(rgb.r, rgb.g, rgb.b);
    else doc.setTextColor(26, 26, 26);

    doc.setFont(fontCampo, estiloPdf(campo.estiloCampo));
    doc.setFontSize(fontSizeCampo);

    const align = campo.alinhamento === 'centro' ? 'center' : campo.alinhamento === 'direita' ? 'right' : 'left';

    // Calcular x final baseado na largura e alinhamento
    let x = xBase;
    if (align === 'center') x = xBase + larguraMm / 2;
    else if (align === 'right') x = xBase + larguraMm;

    doc.text(String(texto), x, y, { align: align as 'left' | 'center' | 'right' });

    if (temSublinhado(campo.estiloCampo)) {
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
          y + BORDA_CONTEUDO_OFFSET, marginLeft, marginTop, mapFontJsPdf,
          bc.altura ? pxToMm(bc.altura) : undefined,
          { superior: bc.ie_borda_superior, inferior: bc.ie_borda_inferior, esquerda: bc.ie_borda_esquerda, direita: bc.ie_borda_direita },
          contentW, usuarioGeracao,
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
          contentW, usuarioGeracao,
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
        );
      } else {
        renderizarTextoValorBanda(
          doc, relatorio, config, banda.campos, banda.registros,
          y, marginLeft, marginTop, mapFontJsPdf,
          banda.altura ? pxToMm(banda.altura) : undefined,
          { superior: banda.ie_borda_superior, inferior: banda.ie_borda_inferior, esquerda: banda.ie_borda_esquerda, direita: banda.ie_borda_direita },
          contentW, usuarioGeracao,
        );
      }
      totalRegistros += banda.registros.length;
    });

    // Renderizar rodapé de banda
    renderRodapeBanda();

    // ── Total de registros (opcional) ──
    // Pode ser adicionado via banda Rodapé com tipoCampo 'data_geracao' etc.
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
