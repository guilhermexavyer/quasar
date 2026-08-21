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
import html2pdf from "html2pdf.js";


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

/**
 * Gera o PDF como arquivo e faz download automaticamente.
 */
export function gerarPdf(
  relatorio: Relatorio,
  registros: Record<string, any>[]
): void {
  const config: RelatorioConfigPdf = relatorio.configPdf ?? {
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

  const fullHtml = gerarHtmlRelatorio(relatorio, registros);

  // Extrai CSS e conteúdo do body
  const styleMatch = fullHtml.match(/<style>([\s\S]*?)<\/style>/);
  const bodyMatch = fullHtml.match(/<body>([\s\S]*?)<\/body>/);
  const css = styleMatch ? styleMatch[1] : '';
  const bodyContent = bodyMatch ? bodyMatch[1] : fullHtml;

  // Cria container off-screen (visível para html2canvas)
  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;left:-9999px;top:0;background:white;';
  container.innerHTML = `<style>${css}</style>${bodyContent}`;
  document.body.appendChild(container);

  const filename = `${config.titulo || relatorio.ds_relatorio || 'relatorio'}.pdf`;

  html2pdf()
    .set({
      margin: [
        config.margens.superior,
        config.margens.direita,
        config.margens.inferior,
        config.margens.esquerda,
      ] as [number, number, number, number],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: {
        unit: 'mm',
        format: config.tamanhoPagina.toLowerCase(),
        orientation: config.orientacao === 'retrato' ? 'portrait' : 'landscape',
      },
    })
    .from(container)
    .save()
    .finally(() => {
      document.body.removeChild(container);
    });
}
