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

  function checkPage(needed: number) {
    if (y + needed > pageH - marginBottom) {
      doc.addPage();
      y = marginTop;
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

  return y;
}


/**
 * Dados de uma banda para geração do PDF.
 */
export interface BandaPdfData {
  /** Nome da banda (para referência). */
  nome: string;
  /** Posição da banda (ordem). */
  posicao: number;
  /** Altura da banda em pixels (distância até a próxima). */
  altura?: number;
  /** Campos da banda. */
  campos: RelatorioCampo[];
  /** Registros da banda. */
  registros: Record<string, any>[];
}

export function gerarPdf(
  relatorio: Relatorio,
  registros: Record<string, any>[],
  bandasRegistros?: BandaPdfData[],
): void {
  const { configPdf } = relatorio;
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
  const fontSize = config.tamanhoFonte;
  const lineHeight = fontSize * 0.5;

  function mapFontJsPdf(fonte?: string): string {
    const f = (fonte || '').toLowerCase();
    if (f.includes('courier') || f.includes('console') || f.includes('mono')) return 'courier';
    if (f.includes('times') || f.includes('garamond') || f.includes('palatino') || f.includes('book')) return 'times';
    return 'helvetica';
  }
  const fontCampo = mapFontJsPdf(relatorio.fonteCampo);

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

  // ── Renderizar bandas ou tabela única ──
  if (bandasRegistros && bandasRegistros.length > 0) {
    // Ordenar bandas por posição
    const bandasOrdenadas = [...bandasRegistros].sort((a, b) => a.posicao - b.posicao);
    let totalRegistros = 0;

    bandasOrdenadas.forEach((banda, idx) => {
      // Aplicar offset de altura da banda anterior
      if (idx > 0 && bandasOrdenadas[idx - 1].altura) {
        y += pxToMm(bandasOrdenadas[idx - 1].altura!);
      } else if (idx > 0) {
        y += 4; // Pequeno espaço padrão entre bandas
      }

      checkPage(8);

      y = renderizarTabelaBanda(
        doc, relatorio, config, banda.campos, banda.registros,
        y, pageW, pageH, marginLeft, marginRight, marginTop, marginBottom,
        contentW, mapFontJsPdf,
      );
      totalRegistros += banda.registros.length;
    });

    // ── Rodapé ──
    if (config.rodape?.incluir) {
      const footerY = pageH - marginBottom + 4;
      doc.setFont(fontCampo, 'normal');
      doc.setFontSize(fontSize - 2);
      doc.setTextColor(102, 102, 102);
      let footerText = `Total de registros: ${totalRegistros}`;
      if (config.rodape.texto) footerText += ` | ${config.rodape.texto}`;
      doc.text(footerText, pageW / 2, footerY, { align: 'center' });
    }
  } else {
    // ── Modo legado: tabela única ──
    y = renderizarTabelaBanda(
      doc, relatorio, config, relatorio.campos ?? [], registros,
      y, pageW, pageH, marginLeft, marginRight, marginTop, marginBottom,
      contentW, mapFontJsPdf,
    );

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
  }

  const filename = `${config.titulo || relatorio.ds_relatorio || 'relatorio'}.pdf`;
  doc.save(filename);
}
