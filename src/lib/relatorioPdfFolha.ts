import { jsPDF } from "jspdf";
import { desenharBordaPagina } from "@/lib/relatorioPdf";
import type { Relatorio } from "@/types/relatorio";
import type { FormatoPapel } from "@/types/formatoPapel";
import type { Imagem } from "@/types/imagem";
import {
  obterBandasSql,
  obterDadosRelatorio,
  obterElementosDaBanda,
  type BandaSql,
  type DadosRelatorio,
  type ElementoBanda,
} from "@/services/relatorioSqlService";

/**
 * PDF dos relatórios do Gerenciador de Relatórios (Formato PDF).
 *
 * Folha:
 *   - tamanho: Largura x Altura (mm) do Formato do papel do relatório (A4 se não houver);
 *   - Orientação 'I' (Invertido) troca largura e altura (o A4 retrato vira paisagem);
 *   - margens em centímetros (vazia = 0): a borda é desenhada na área entre as margens.
 * Bandas (layoutDaFolha):
 *   - Cabeçalho: no topo (abaixo da margem superior); Rodapé: no pé (acima da margem
 *     inferior), crescendo para cima. Os dois se repetem em todas as páginas;
 *   - Conteúdo e Lista: um abaixo do outro, na ordem da Sequência, no espaço entre o
 *     Cabeçalho e o Rodapé, com quebra de página quando não cabem.
 * Elementos (medidas em px; 96 px = 1 polegada):
 *   - Esquerda: distância da margem esquerda; Topo: distância do topo da banda (na Lista,
 *     do topo da linha); Largura e Altura: a caixa do elemento (Background a preenche);
 *   - SQL: valor da coluna do Alias (Cabeçalho, Rodapé e Conteúdo: a 1ª linha do SQL da
 *     banda; Lista: uma linha por registro, com o Label como cabeçalho da coluna);
 *   - Conteúdo: o texto do campo Conteúdo;
 *   - Imagem: a imagem de Administração do Sistema > Imagens, no tamanho Largura x Altura
 *     (sem um deles, mantém a proporção; sem os dois, o tamanho original em px).
 * Bordas (Borda superior, inferior, esquerda e direita da banda e do elemento): linha
 * igual à "Sólida fina" do campo Borda do relatório, nos lados marcados:
 *   - banda: a faixa entre as margens esquerda e direita, com a altura da banda (na
 *     Lista, cada linha: o cabeçalho e cada registro);
 *   - elemento: a caixa dele (Largura x Altura; sem elas, o tamanho do texto/imagem).
 * Os elementos ficam dentro da banda: o que passar da altura da banda (ou das margens
 * esquerda e direita) é cortado.
 */

const A4 = { largura: 210, altura: 297 };
/** Tamanho da fonte (pt) do elemento sem Tamanho da fonte. */
const TAMANHO_FONTE = 10;
const PT_PARA_MM = 25.4 / 72;

function numero(valor: unknown): number | null {
  if (valor === null || valor === undefined || String(valor).trim() === "") return null;
  const n = Number(String(valor).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Medidas da folha em mm, já com a orientação aplicada. */
export function medidasDaFolha(relatorio: Relatorio, formato: FormatoPapel | undefined): { largura: number; altura: number } {
  const largura = numero(formato?.qt_largura);
  const altura = numero(formato?.qt_altura);
  const base = largura && largura > 0 && altura && altura > 0 ? { largura, altura } : A4;
  return relatorio.ie_orientacao === "I" ? { largura: base.altura, altura: base.largura } : base;
}

/** Nome de arquivo seguro (sem caracteres proibidos no Windows). */
function nomeDeArquivo(nome: string): string {
  const limpo = nome.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim();
  return limpo || "relatorio";
}

/** px → mm (96 DPI, como no navegador). */
export const pxParaMm = (px: number) => (px * 25.4) / 96;

/** Retângulo na folha, em mm. */
export interface AreaMm { x: number; y: number; largura: number; altura: number }

/** Banda posicionada na folha. */
export interface BandaNaFolha { banda: BandaSql; area: AreaMm }

type Margens = { superior: number; inferior: number; esquerda: number; direita: number };

/**
 * Posição do Cabeçalho (grudado no topo, crescendo para baixo) e do Rodapé (grudado no
 * pé, crescendo para cima) e o espaço que sobra entre eles (conteudo).
 */
export function layoutDaFolha(
  margens: Margens,
  folha: { largura: number; altura: number },
  bandas: BandaSql[],
): { cabecalho: BandaNaFolha | null; rodape: BandaNaFolha | null; conteudo: AreaMm } {
  const x = margens.esquerda;
  const largura = Math.max(0, folha.largura - margens.esquerda - margens.direita);
  const alturaMm = (b: BandaSql) => pxParaMm(Math.max(0, Number(b.qt_altura ?? 0)));
  const bandaCabecalho = bandas.find((b) => b.ie_tipo === "cabecalho");
  const bandaRodape = bandas.find((b) => b.ie_tipo === "rodape");

  const cabecalho = bandaCabecalho ? { banda: bandaCabecalho, area: { x, y: margens.superior, largura, altura: alturaMm(bandaCabecalho) } } : null;
  const topo = margens.superior + (cabecalho?.area.altura ?? 0);
  const alturaRodape = bandaRodape ? alturaMm(bandaRodape) : 0;
  const pe = folha.altura - margens.inferior - alturaRodape;
  const rodape = bandaRodape ? { banda: bandaRodape, area: { x, y: pe, largura, altura: alturaRodape } } : null;

  return { cabecalho, rodape, conteudo: { x, y: topo, largura, altura: Math.max(0, pe - topo) } };
}

/* ── Elementos ── */

const FONTES_PDF: Record<string, string> = {
  arial: "helvetica", calibri: "helvetica", verdana: "helvetica", times_new_roman: "times", courier_new: "courier",
};

function estiloDaFonte(estilo: string | null | undefined): { fontStyle: string; sublinhado: boolean } {
  const e = estilo ?? "";
  const negrito = e.includes("negrito");
  const italico = e.includes("italico");
  return {
    fontStyle: negrito && italico ? "bolditalic" : negrito ? "bold" : italico ? "italic" : "normal",
    sublinhado: e.includes("sublinhado"),
  };
}

/** Valor de uma célula do SQL como texto do relatório. */
function textoDoValor(valor: unknown, tipo: DadosRelatorio["colunas"][number]["tipo"] | undefined): string {
  if (valor === null || valor === undefined) return "";
  if (tipo === "booleano") return valor === true ? "Sim" : valor === false ? "Não" : String(valor);
  if ((tipo === "data" || tipo === "datahora") && typeof valor === "string") {
    const soData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
    if (soData) return `${soData[3]}/${soData[2]}/${soData[1]}`;
    const d = new Date(valor);
    if (!Number.isNaN(d.getTime())) return tipo === "data" ? d.toLocaleDateString("pt-BR") : d.toLocaleString("pt-BR");
  }
  if (tipo === "numero" && valor !== "") {
    const n = Number(valor);
    if (Number.isFinite(n)) return n.toLocaleString("pt-BR", { maximumFractionDigits: 10, useGrouping: false });
  }
  return String(valor);
}

/** Valor do Alias numa linha do SQL (nome da coluna sem diferenciar maiúsculas). */
function valorDoAlias(dados: DadosRelatorio | undefined, linha: unknown[] | undefined, alias: string | null | undefined): string {
  if (!dados || !linha || !alias) return "";
  const alvo = alias.trim().toLowerCase();
  const i = dados.colunas.findIndex((c) => c.nome.toLowerCase() === alvo);
  return i < 0 ? "" : textoDoValor(linha[i], dados.colunas[i].tipo);
}

/** Tamanho da fonte do elemento em pt (Tamanho da fonte; vazio = 10). */
function tamanhoDaFonte(elemento: ElementoBanda): number {
  const tamanho = numero(elemento.qt_fonte);
  return tamanho && tamanho > 0 ? tamanho : TAMANHO_FONTE;
}

/** Altura (px) que os elementos ocupam: o maior Topo + Altura (sem altura, uma linha de texto). */
function alturaDosElementosPx(elementos: ElementoBanda[]): number {
  const linhaPx = (e: ElementoBanda) => (tamanhoDaFonte(e) * PT_PARA_MM * 1.4 * 96) / 25.4;
  return elementos.reduce((max, e) => Math.max(max, (numero(e.qt_topo) ?? 0) + (numero(e.qt_altura) ?? linhaPx(e))), 0);
}

/** Lados marcados (Borda superior, inferior, esquerda e direita) da banda ou do elemento. */
type ComBordas = Partial<Record<"ie_borda_superior" | "ie_borda_inferior" | "ie_borda_esquerda" | "ie_borda_direita", string | null>>;

/** Desenha as bordas marcadas em volta da caixa, com a linha da "Sólida fina" (0,3 mm, preta, contínua). */
function desenharBordas(doc: jsPDF, lados: ComBordas, x: number, y: number, largura: number, altura: number): void {
  const superior = lados.ie_borda_superior === "S";
  const inferior = lados.ie_borda_inferior === "S";
  const esquerda = lados.ie_borda_esquerda === "S";
  const direita = lados.ie_borda_direita === "S";
  if (!(superior || inferior || esquerda || direita) || largura <= 0 || altura <= 0) return;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([], 0);
  if (superior && inferior && esquerda && direita) {
    doc.rect(x, y, largura, altura, "S");
    return;
  }
  if (superior) doc.line(x, y, x + largura, y);
  if (inferior) doc.line(x, y + altura, x + largura, y + altura);
  if (esquerda) doc.line(x, y, x, y + altura);
  if (direita) doc.line(x + largura, y, x + largura, y + altura);
}

/** Desenha um elemento: caixa em (margem esquerda + Esquerda, topo + Topo), Background, texto com fonte, estilo, cor e alinhamento. */
function desenharElemento(doc: jsPDF, elemento: ElementoBanda, xBase: number, yBase: number, texto: string): void {
  doc.setFont(FONTES_PDF[elemento.ie_fonte ?? ""] ?? "helvetica", estiloDaFonte(elemento.ie_estilo).fontStyle);
  doc.setFontSize(tamanhoDaFonte(elemento));
  const linhaMm = tamanhoDaFonte(elemento) * PT_PARA_MM * 1.4;
  const x = xBase + pxParaMm(numero(elemento.qt_esquerda) ?? 0);
  const y = yBase + pxParaMm(numero(elemento.qt_topo) ?? 0);
  const larguraPx = numero(elemento.qt_largura);
  const largura = larguraPx ? pxParaMm(larguraPx) : doc.getTextWidth(texto);
  const alturaPx = numero(elemento.qt_altura);
  const altura = alturaPx ? pxParaMm(alturaPx) : linhaMm;

  if (elemento.cd_background) {
    doc.setFillColor(elemento.cd_background);
    doc.rect(x, y, largura, altura, "F");
  }
  if (texto) desenharTexto(doc, elemento, texto, x, largura, y, altura);
  desenharBordas(doc, elemento, x, y, largura, altura);
}

function desenharTexto(doc: jsPDF, elemento: ElementoBanda, texto: string, x: number, largura: number, y: number, altura: number): void {
  const alinhamento = elemento.ie_alinhamento === "centro" ? "center" : elemento.ie_alinhamento === "direita" ? "right" : "left";
  const xTexto = alinhamento === "center" ? x + largura / 2 : alinhamento === "right" ? x + largura : x;
  const yTexto = y + altura / 2;
  doc.setTextColor(elemento.cd_cor || "#000000");
  doc.text(texto, xTexto, yTexto, { align: alinhamento, baseline: "middle" });

  if (estiloDaFonte(elemento.ie_estilo).sublinhado) {
    const larguraTexto = doc.getTextWidth(texto);
    const inicio = alinhamento === "center" ? xTexto - larguraTexto / 2 : alinhamento === "right" ? xTexto - larguraTexto : xTexto;
    const yLinha = yTexto + (tamanhoDaFonte(elemento) * PT_PARA_MM) / 2;
    doc.setDrawColor(elemento.cd_cor || "#000000");
    doc.setLineWidth(0.2);
    doc.line(inicio, yLinha, inicio + larguraTexto, yLinha);
  }
}

/** Imagem carregada (convertida para PNG) com o tamanho original em px. */
export interface ImagemCarregada { dataUrl: string; largura: number; altura: number }

/** Baixa a imagem (com a sessão do usuário) e converte para PNG pelo canvas (aceita PNG, JPEG, WEBP, SVG...). */
async function carregarImagem(url: string): Promise<ImagemCarregada | null> {
  try {
    const resposta = await fetch(url, { credentials: "same-origin" });
    if (!resposta.ok) return null;
    const objeto = URL.createObjectURL(await resposta.blob());
    try {
      const img = await new Promise<HTMLImageElement>((ok, falha) => {
        const i = new Image();
        i.onload = () => ok(i);
        i.onerror = falha;
        i.src = objeto;
      });
      const largura = img.naturalWidth || 1;
      const altura = img.naturalHeight || 1;
      const canvas = document.createElement("canvas");
      canvas.width = largura;
      canvas.height = altura;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
      return { dataUrl: canvas.toDataURL("image/png"), largura, altura };
    } finally {
      URL.revokeObjectURL(objeto);
    }
  } catch {
    return null;
  }
}

/** Elemento do tipo Imagem: em (margem esquerda + Esquerda, topo + Topo), no tamanho Largura x Altura. */
function desenharImagem(doc: jsPDF, elemento: ElementoBanda, xBase: number, yBase: number, imagem: ImagemCarregada | undefined): void {
  if (!imagem) return;
  const larguraPx = numero(elemento.qt_largura);
  const alturaPx = numero(elemento.qt_altura);
  const largura = larguraPx ?? (alturaPx ? (alturaPx * imagem.largura) / imagem.altura : imagem.largura);
  const altura = alturaPx ?? (larguraPx ? (larguraPx * imagem.altura) / imagem.largura : imagem.altura);
  const x = xBase + pxParaMm(numero(elemento.qt_esquerda) ?? 0);
  const y = yBase + pxParaMm(numero(elemento.qt_topo) ?? 0);
  doc.addImage(imagem.dataUrl, "PNG", x, y, pxParaMm(largura), pxParaMm(altura));
  desenharBordas(doc, elemento, x, y, pxParaMm(largura), pxParaMm(altura));
}

/* ── Geração ── */

interface BandaCompleta { banda: BandaSql; elementos: ElementoBanda[]; dados?: DadosRelatorio }

/**
 * Gera e baixa o PDF do relatório. Busca as bandas, os elementos e, das bandas que têm
 * elementos do tipo SQL (ou são Lista), o resultado do SQL (com os valores dos parâmetros).
 */
export async function gerarPdfRelatorio(
  relatorio: Relatorio, formato: FormatoPapel | undefined, valores: Record<string, string>, nome: string, imagens: Imagem[] = [],
): Promise<void> {
  const bandas = await obterBandasSql(relatorio.nr_sequencia);
  const completas: BandaCompleta[] = await Promise.all(
    bandas.map(async (banda) => {
      const elementos = banda.nr_sequencia == null ? [] : await obterElementosDaBanda(Number(banda.nr_sequencia));
      const usaSql = banda.ie_tipo === "lista" || elementos.some((e) => e.ie_tipo !== "conteudo" && e.ie_tipo !== "imagem");
      const dados = usaSql && banda.nr_sequencia != null ? await obterDadosRelatorio(relatorio.nr_sequencia, valores, Number(banda.nr_sequencia)) : undefined;
      return { banda, elementos, dados };
    })
  );
  // Imagens usadas pelos elementos (cada uma baixada uma vez).
  const usadas = new Set(completas.flatMap((b) => b.elementos).filter((e) => e.ie_tipo === "imagem" && e.nr_seq_imagem != null).map((e) => String(e.nr_seq_imagem)));
  const carregadas = new Map<string, ImagemCarregada>();
  await Promise.all([...usadas].map(async (nr) => {
    const arquivo = imagens.find((i) => String(i.nr_sequencia) === nr)?.ie_arquivo;
    const carregada = arquivo ? await carregarImagem(arquivo) : null;
    if (carregada) carregadas.set(nr, carregada);
  }));
  const doc = montarPdf(relatorio, formato, completas, carregadas);
  doc.save(`${nomeDeArquivo(nome)}.pdf`);
}

export function montarPdf(relatorio: Relatorio, formato: FormatoPapel | undefined, bandas: BandaCompleta[], imagens: Map<string, ImagemCarregada> = new Map()): jsPDF {
  const folha = medidasDaFolha(relatorio, formato);
  const orientacao = folha.largura > folha.altura ? "landscape" : "portrait";
  // Orientação do jsPDF conforme as medidas finais, para ele não trocar largura e altura.
  const doc = new jsPDF({ unit: "mm", format: [folha.largura, folha.altura], orientation: orientacao });
  const margemMm = (v: unknown) => Math.max(0, (numero(v) ?? 0) * 10);
  const margens: Margens = {
    superior: margemMm(relatorio.nr_margem_superior),
    inferior: margemMm(relatorio.nr_margem_inferior),
    esquerda: margemMm(relatorio.nr_margem_esquerda),
    direita: margemMm(relatorio.nr_margem_direita),
  };
  const ordenadas = [...bandas].sort((a, b) => Number(a.banda.nr_sequencia ?? 0) - Number(b.banda.nr_sequencia ?? 0));
  const layout = layoutDaFolha(margens, folha, ordenadas.map((b) => b.banda));
  const porNr = new Map(ordenadas.map((b) => [b.banda.nr_sequencia, b]));

  /** Bordas da banda: a faixa entre as margens esquerda e direita, com a altura dada. */
  const bordasDaBanda = (b: BandaCompleta, y: number, altura: number) =>
    desenharBordas(doc, b.banda, layout.conteudo.x, y, layout.conteudo.largura, altura);
  /** Desenha só dentro da banda (entre as margens, com a altura dada): o que passar é cortado. */
  const dentroDaBanda = (y: number, altura: number, desenhar: () => void) => {
    if (altura <= 0) { desenhar(); return; }
    doc.saveGraphicsState();
    doc.rect(layout.conteudo.x, y, layout.conteudo.largura, altura, null);
    doc.clip();
    doc.discardPath();
    try {
      desenhar();
    } finally {
      doc.restoreGraphicsState();
    }
  };
  /** Elementos de Cabeçalho, Rodapé e Conteúdo: o SQL usa a 1ª linha. */
  const desenharBandaFixa = (b: BandaCompleta, y: number, altura: number) => {
    dentroDaBanda(y, altura, () => {
      for (const el of b.elementos) {
        if (el.ie_tipo === "imagem") {
          desenharImagem(doc, el, margens.esquerda, y, imagens.get(String(el.nr_seq_imagem ?? "")));
          continue;
        }
        const texto = el.ie_tipo === "conteudo" ? el.ds_conteudo ?? "" : valorDoAlias(b.dados, b.dados?.linhas[0], el.cd_alias);
        desenharElemento(doc, el, margens.esquerda, y, texto);
      }
    });
    // Por último, para o Background dos elementos não cobrir a borda.
    bordasDaBanda(b, y, altura);
  };
  const prepararPagina = () => {
    desenharBordaPagina(doc, relatorio.ie_borda ?? null, margens.superior, margens.inferior, margens.esquerda, margens.direita);
    if (layout.cabecalho) { const b = porNr.get(layout.cabecalho.banda.nr_sequencia); if (b) desenharBandaFixa(b, layout.cabecalho.area.y, layout.cabecalho.area.altura); }
    if (layout.rodape) { const b = porNr.get(layout.rodape.banda.nr_sequencia); if (b) desenharBandaFixa(b, layout.rodape.area.y, layout.rodape.area.altura); }
  };
  const fimDoConteudo = layout.conteudo.y + layout.conteudo.altura;
  let y = layout.conteudo.y;
  const novaPagina = () => {
    doc.addPage([folha.largura, folha.altura], orientacao);
    prepararPagina();
    y = layout.conteudo.y;
  };
  /** Quebra a página se `altura` não couber (e a página já tiver algo). */
  const garantirEspaco = (altura: number) => {
    if (y + altura > fimDoConteudo + 0.01 && y > layout.conteudo.y + 0.01) novaPagina();
  };

  prepararPagina();
  for (const b of ordenadas) {
    if (b.banda.ie_tipo === "conteudo") {
      const alturaPx = numero(b.banda.qt_altura) ?? alturaDosElementosPx(b.elementos);
      const altura = pxParaMm(alturaPx);
      garantirEspaco(altura);
      desenharBandaFixa(b, y, altura);
      y += altura;
    } else if (b.banda.ie_tipo === "lista") {
      // Cada linha (o cabeçalho com os Labels e um registro) tem a Altura da banda
      // (sem ela, o espaço que os elementos ocupam).
      const alturaLinha = pxParaMm(numero(b.banda.qt_altura) ?? alturaDosElementosPx(b.elementos));
      if (alturaLinha <= 0) continue;
      const desenharCabecalhoDaLista = () => {
        dentroDaBanda(y, alturaLinha, () => { for (const el of b.elementos) desenharElemento(doc, el, margens.esquerda, y, el.ds_label ?? ""); });
        bordasDaBanda(b, y, alturaLinha);
        y += alturaLinha;
      };
      garantirEspaco(alturaLinha * 2);
      desenharCabecalhoDaLista();
      for (const linha of b.dados?.linhas ?? []) {
        if (y + alturaLinha > fimDoConteudo + 0.01) { novaPagina(); desenharCabecalhoDaLista(); }
        dentroDaBanda(y, alturaLinha, () => { for (const el of b.elementos) desenharElemento(doc, el, margens.esquerda, y, valorDoAlias(b.dados, linha, el.cd_alias)); });
        bordasDaBanda(b, y, alturaLinha);
        y += alturaLinha;
      }
    }
  }
  return doc;
}
