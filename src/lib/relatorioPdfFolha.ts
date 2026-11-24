import { jsPDF } from "jspdf";
import { desenharBordaPagina } from "@/lib/relatorioPdf";
import type { Relatorio } from "@/types/relatorio";
import type { FormatoPapel } from "@/types/formatoPapel";
import type { Imagem } from "@/types/imagem";
import { nomeDoParametro } from "@/lib/relatorioSql";
import {
  bandaEhDetalhe,
  obterParametrosSql,
  obterBandasSql,
  obterDadosPdf,
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
 *   - Detalhe: no espaço entre o Cabeçalho e o Rodapé, na ordem da Sequência, uma vez
 *     para cada linha do SQL (com quebra de página quando não cabe). A banda dependente
 *     (Banda superior) sai logo depois de cada registro da superior, com o SQL rodado
 *     para aquele registro. Opções: Exibir labels, Nova página a cada registro e
 *     Imprimir sem registros (ver desenharDetalhe).
 *   - SQL vazio na banda: vale o SQL do relatório (capa).
 * Elementos (medidas em px; 96 px = 1 polegada):
 *   - Esquerda: distância da margem esquerda; Topo: distância do topo da banda (no Detalhe,
 *     do topo de cada registro); Tamanho (largura) e Altura: a caixa do elemento (Background a preenche);
 *   - SQL: valor da coluna do Alias (Cabeçalho e Rodapé: a 1ª linha do SQL da banda;
 *     Detalhe: a linha do registro; com Exibir labels, o Label é o cabeçalho da coluna);
 *   - Conteúdo: o texto do campo Conteúdo;
 *   - Parâmetro: o valor do parâmetro (Atributo = nome) informado ao gerar (ou o Valor padrão);
 *   - Página: "Página X de Y" (desenhado no fim, quando o total de páginas é conhecido);
 *   - Data/hora: data e hora da geração; Usuário: quem gerou;
 *   - Linha: linha reta no meio da caixa (horizontal se Tamanho >= Altura; senão vertical);
 *   - Máscara (SQL e Parâmetro): Data, Data e hora, Hora, Número, Moeda, Porcentagem;
 *   - Quebrar linha: o texto quebra em linhas no Tamanho (largura), a partir do topo da caixa;
 *   - Imagem: a imagem de Administração do Sistema > Imagens, no tamanho Largura x Altura
 *     (sem um deles, mantém a proporção; sem os dois, o tamanho original em px).
 * Bordas (Borda superior, inferior, esquerda e direita da banda e do elemento): linha
 * igual à "Sólida fina" do campo Borda do relatório, nos lados marcados:
 *   - banda: a faixa entre as margens esquerda e direita, com a altura da banda (no
 *     Detalhe, cada ocorrência: a linha dos labels e cada registro);
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

/** Data de um valor do banco ou digitado: Date, ISO, 'AAAA-MM-DD' ou 'DD/MM/AAAA'. */
function paraData(valor: unknown): Date | null {
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;
  const texto = String(valor ?? "").trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  m = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(texto);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4] ?? 0), Number(m[5] ?? 0), Number(m[6] ?? 0));
  if (!/^\d{4}-\d{2}-\d{2}T/.test(texto)) return null;
  const d = new Date(texto);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Número de um valor do banco ou digitado ("1234.5", "1.234,5"). */
function paraNumero(valor: unknown): number | null {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  const texto = String(valor ?? "").trim();
  if (!texto) return null;
  const n = Number(texto.includes(",") ? texto.replace(/\./g, "").replace(",", ".") : texto);
  return Number.isFinite(n) ? n : null;
}

/**
 * Valor com a Máscara do elemento: Data (dd/mm/aaaa), Data e hora, Hora (hh:mm), Número
 * (separador de milhar e as Casas decimais; vazio = 2), Moeda (R$) e Porcentagem (valor + %).
 * Sem máscara (ou valor que não combina com ela), como o banco devolve.
 */
export function formatarValor(valor: unknown, tipo: DadosRelatorio["colunas"][number]["tipo"] | undefined, elemento: Pick<ElementoBanda, "ie_mascara" | "qt_casas_decimais">): string {
  if (valor === null || valor === undefined || valor === "") return "";
  const mascara = elemento.ie_mascara ?? "";
  if (mascara === "data" || mascara === "data_hora" || mascara === "hora") {
    const d = paraData(valor);
    if (d) {
      if (mascara === "data") return d.toLocaleDateString("pt-BR");
      const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      return mascara === "hora" ? hora : `${d.toLocaleDateString("pt-BR")} ${hora}`;
    }
  } else if (mascara === "numero" || mascara === "moeda" || mascara === "porcentagem") {
    const n = paraNumero(valor);
    if (n !== null) {
      const casas = Math.min(10, Math.max(0, numero(elemento.qt_casas_decimais) ?? 2));
      const opcoes = { minimumFractionDigits: casas, maximumFractionDigits: casas };
      if (mascara === "moeda") return n.toLocaleString("pt-BR", { ...opcoes, style: "currency", currency: "BRL" });
      const texto = n.toLocaleString("pt-BR", opcoes);
      return mascara === "porcentagem" ? `${texto}%` : texto;
    }
  }
  return textoDoValor(valor, tipo);
}

/** Valor do Atributo numa linha do SQL (nome da coluna sem diferenciar maiúsculas), com a Máscara. */
function valorDoAlias(dados: DadosRelatorio | undefined, linha: unknown[] | undefined, elemento: ElementoBanda): string {
  const alias = elemento.cd_alias;
  if (!dados || !linha || !alias) return "";
  const alvo = alias.trim().toLowerCase();
  const i = dados.colunas.findIndex((c) => c.nome.toLowerCase() === alvo);
  return i < 0 ? "" : formatarValor(linha[i], dados.colunas[i].tipo, elemento);
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

/**
 * Texto do elemento na caixa. Uma linha: centralizada na Altura. Quebrar linha (ou texto com
 * várias linhas): as linhas que cabem no Tamanho (largura), a partir do topo da caixa.
 */
function desenharTexto(doc: jsPDF, elemento: ElementoBanda, texto: string, x: number, largura: number, y: number, altura: number): void {
  const alinhamento = elemento.ie_alinhamento === "centro" ? "center" : elemento.ie_alinhamento === "direita" ? "right" : "left";
  const xTexto = alinhamento === "center" ? x + largura / 2 : alinhamento === "right" ? x + largura : x;
  const linhaMm = tamanhoDaFonte(elemento) * PT_PARA_MM * 1.4;
  const linhas: string[] = elemento.ie_quebrar_linha === "S" && largura > 0
    ? doc.splitTextToSize(texto, largura)
    : texto.split(/\r?\n/);
  const cor = elemento.cd_cor || "#000000";
  doc.setTextColor(cor);
  linhas.forEach((linha, i) => {
    const yTexto = linhas.length === 1 ? y + altura / 2 : y + linhaMm * (i + 0.5);
    doc.text(linha, xTexto, yTexto, { align: alinhamento, baseline: "middle" });
    if (estiloDaFonte(elemento.ie_estilo).sublinhado && linha) {
      const larguraTexto = doc.getTextWidth(linha);
      const inicio = alinhamento === "center" ? xTexto - larguraTexto / 2 : alinhamento === "right" ? xTexto - larguraTexto : xTexto;
      const yLinha = yTexto + (tamanhoDaFonte(elemento) * PT_PARA_MM) / 2;
      doc.setDrawColor(cor);
      doc.setLineWidth(0.2);
      doc.line(inicio, yLinha, inicio + larguraTexto, yLinha);
    }
  });
}

/** Elemento Linha: horizontal no meio da caixa (Tamanho >= Altura) ou vertical, na Cor do elemento. */
function desenharLinha(doc: jsPDF, elemento: ElementoBanda, xBase: number, yBase: number): void {
  const x = xBase + pxParaMm(numero(elemento.qt_esquerda) ?? 0);
  const y = yBase + pxParaMm(numero(elemento.qt_topo) ?? 0);
  const largura = pxParaMm(numero(elemento.qt_largura) ?? 0);
  const altura = pxParaMm(numero(elemento.qt_altura) ?? 0);
  if (largura <= 0 && altura <= 0) return;
  doc.setDrawColor(elemento.cd_cor || "#000000");
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([], 0);
  if (largura >= altura) doc.line(x, y + altura / 2, x + largura, y + altura / 2);
  else doc.line(x + largura / 2, y, x + largura / 2, y + altura);
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

interface BandaCompleta { banda: BandaSql; elementos: ElementoBanda[] }

/**
 * Gera e baixa o PDF do relatório. Busca as bandas, os elementos e os dados de todas as
 * bandas numa chamada só (com os valores dos parâmetros; as dependentes dentro da superior).
 */
export async function gerarPdfRelatorio(
  relatorio: Relatorio, formato: FormatoPapel | undefined, valores: Record<string, string>, nome: string, imagens: Imagem[] = [],
  usuario = "",
): Promise<void> {
  const [bandas, dados, parametros] = await Promise.all([
    obterBandasSql(relatorio.nr_sequencia), obterDadosPdf(relatorio.nr_sequencia, valores), obterParametrosSql(relatorio.nr_sequencia),
  ]);
  // Valor de cada parâmetro (para o elemento Parâmetro): o informado ao gerar ou o Valor padrão.
  const valoresParametros: Record<string, string> = {};
  for (const p of parametros) {
    const nomeParametro = nomeDoParametro(p.ds_parametro);
    if (!nomeParametro) continue;
    const perguntado = p.ie_perguntar === "S" && Object.prototype.hasOwnProperty.call(valores, nomeParametro);
    valoresParametros[nomeParametro.toLowerCase()] = String((perguntado ? valores[nomeParametro] : p.vl_padrao) ?? "");
  }
  const completas: BandaCompleta[] = await Promise.all(
    bandas.map(async (banda) => ({
      banda,
      elementos: banda.nr_sequencia == null ? [] : await obterElementosDaBanda(Number(banda.nr_sequencia)),
    }))
  );
  // Imagens usadas pelos elementos (cada uma baixada uma vez).
  const usadas = new Set(completas.flatMap((b) => b.elementos).filter((e) => e.ie_tipo === "imagem" && e.nr_seq_imagem != null).map((e) => String(e.nr_seq_imagem)));
  const carregadas = new Map<string, ImagemCarregada>();
  await Promise.all([...usadas].map(async (nr) => {
    const arquivo = imagens.find((i) => String(i.nr_sequencia) === nr)?.ie_arquivo;
    const carregada = arquivo ? await carregarImagem(arquivo) : null;
    if (carregada) carregadas.set(nr, carregada);
  }));
  const doc = montarPdf(relatorio, formato, completas, dados, carregadas, { parametros: valoresParametros, usuario, geradoEm: new Date() });
  doc.save(`${nomeDeArquivo(nome)}.pdf`);
}

/** Informações da geração usadas pelos elementos Parâmetro, Data/hora e Usuário. */
export interface ContextoGeracao {
  /** Valor de cada parâmetro (nome em minúsculas). */
  parametros: Record<string, string>;
  usuario: string;
  geradoEm: Date;
}

/**
 * Monta o PDF. `dados`: resultado do SQL por nr da banda (Cabeçalho, Rodapé e Detalhe sem
 * banda superior); as dependentes vêm em `filhas` da superior.
 */
export function montarPdf(
  relatorio: Relatorio, formato: FormatoPapel | undefined, bandas: BandaCompleta[], dados: Record<string, DadosRelatorio>,
  imagens: Map<string, ImagemCarregada> = new Map(),
  contexto: ContextoGeracao = { parametros: {}, usuario: "", geradoEm: new Date() },
): jsPDF {
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
  /** Texto dos elementos SQL, Conteúdo, Parâmetro, Data/hora e Usuário. */
  const textoDoElemento = (el: ElementoBanda, dadosBanda: DadosRelatorio | undefined, linha: unknown[] | undefined): string => {
    switch (el.ie_tipo) {
      case "conteudo": return el.ds_conteudo ?? "";
      case "parametro": return formatarValor(contexto.parametros[(el.cd_alias ?? "").trim().replace(/^:+/, "").toLowerCase()], "texto", el);
      case "data_hora": return formatarValor(contexto.geradoEm, "datahora", { ie_mascara: el.ie_mascara || "data_hora" });
      case "usuario": return contexto.usuario;
      default: return valorDoAlias(dadosBanda, linha, el);
    }
  };
  /** Elementos Página: "Página X de Y", desenhados no fim (quando o total é conhecido). */
  const paginasPendentes: { pagina: number; elemento: ElementoBanda; y: number; altura: number }[] = [];
  /**
   * Uma ocorrência da banda (Cabeçalho e Rodapé: a 1ª linha do SQL; Detalhe: a linha do
   * registro; sem linha, os elementos SQL ficam vazios).
   */
  const desenharBandaFixa = (b: BandaCompleta, y: number, altura: number, dadosBanda: DadosRelatorio | undefined, linha: unknown[] | undefined) => {
    dentroDaBanda(y, altura, () => {
      for (const el of b.elementos) {
        if (el.ie_tipo === "imagem") {
          desenharImagem(doc, el, margens.esquerda, y, imagens.get(String(el.nr_seq_imagem ?? "")));
          continue;
        }
        if (el.ie_tipo === "linha") {
          desenharLinha(doc, el, margens.esquerda, y);
          continue;
        }
        if (el.ie_tipo === "pagina") {
          // O total de páginas só é conhecido no fim: desenhado depois (paginasPendentes).
          paginasPendentes.push({ pagina: doc.getCurrentPageInfo().pageNumber, elemento: el, y, altura });
          continue;
        }
        desenharElemento(doc, el, margens.esquerda, y, textoDoElemento(el, dadosBanda, linha));
      }
    });
    // Por último, para o Background dos elementos não cobrir a borda.
    bordasDaBanda(b, y, altura);
  };
  const desenharFixa = (area: BandaNaFolha | null) => {
    const b = area ? porNr.get(area.banda.nr_sequencia) : undefined;
    if (!area || !b) return;
    const dadosBanda = dados[String(b.banda.nr_sequencia)];
    desenharBandaFixa(b, area.area.y, area.area.altura, dadosBanda, dadosBanda?.linhas[0]);
  };
  const prepararPagina = () => {
    desenharBordaPagina(doc, relatorio.ie_borda ?? null, margens.superior, margens.inferior, margens.esquerda, margens.direita);
    desenharFixa(layout.cabecalho);
    desenharFixa(layout.rodape);
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

  // Bandas Detalhe (ou sem tipo): as sem banda superior saem na ordem da Sequência; cada
  // dependente sai logo depois de cada registro da superior (na ordem da Sequência).
  const detalhes = ordenadas.filter((b) => bandaEhDetalhe(b.banda));
  const nrsDetalhe = new Set(detalhes.map((b) => String(b.banda.nr_sequencia)));
  const superiorDe = (b: BandaCompleta) => {
    const sup = b.banda.nr_seq_banda_superior;
    return sup != null && sup !== "" && nrsDetalhe.has(String(sup)) ? String(sup) : null;
  };
  const dependentesDe = (b: BandaCompleta) => detalhes.filter((d) => superiorDe(d) === String(b.banda.nr_sequencia));

  /**
   * Banda Detalhe: uma ocorrência (com a Altura da banda; sem ela, o espaço que os
   * elementos ocupam) para cada linha do SQL, seguida das bandas dependentes daquela linha.
   *   - Exibir labels: antes dos registros (e no topo de cada página nova da banda), uma
   *     linha com o Label de cada elemento;
   *   - Nova página a cada registro: cada registro começa numa página nova;
   *   - Imprimir sem registros: sem linhas, a banda sai uma vez (elementos SQL vazios).
   */
  const desenharDetalhe = (b: BandaCompleta, dadosBanda: DadosRelatorio | undefined, nivel: number) => {
    const altura = pxParaMm(numero(b.banda.qt_altura) ?? alturaDosElementosPx(b.elementos));
    if (altura <= 0) return;
    const linhas = dadosBanda?.linhas ?? [];
    const semRegistros = linhas.length === 0;
    if (semRegistros && b.banda.ie_imprimir_vazio !== "S") return;
    const comLabels = b.banda.ie_exibir_label === "S";
    const novaPaginaPorRegistro = b.banda.ie_nova_pagina === "S";
    const desenharLabels = () => {
      dentroDaBanda(y, altura, () => {
        for (const el of b.elementos) if (el.ie_tipo !== "imagem" && el.ie_tipo !== "linha") desenharElemento(doc, el, margens.esquerda, y, el.ds_label ?? "");
      });
      bordasDaBanda(b, y, altura);
      y += altura;
    };
    /** Quebra a página (se preciso) antes de um registro; na página nova, repete os labels. */
    const quebrar = (forcar: boolean) => {
      const naoCabe = y + altura > fimDoConteudo + 0.01 && y > layout.conteudo.y + 0.01;
      if (!forcar && !naoCabe) return;
      if (y > layout.conteudo.y + 0.01) novaPagina();
      if (comLabels) desenharLabels();
    };

    // A banda começa numa página nova quando cada registro tem a sua.
    if (novaPaginaPorRegistro && y > layout.conteudo.y + 0.01) novaPagina();
    if (comLabels) { garantirEspaco(altura * 2); desenharLabels(); }
    const dependentes = nivel < 10 ? dependentesDe(b) : [];
    const total = semRegistros ? 1 : linhas.length;
    for (let i = 0; i < total; i++) {
      quebrar(novaPaginaPorRegistro && i > 0);
      desenharBandaFixa(b, y, altura, dadosBanda, linhas[i]);
      y += altura;
      for (const dependente of dependentes) {
        desenharDetalhe(dependente, dadosBanda?.filhas?.[i]?.[String(dependente.banda.nr_sequencia)], nivel + 1);
      }
    }
  };

  prepararPagina();
  for (const b of detalhes) {
    if (superiorDe(b) !== null) continue;
    desenharDetalhe(b, dados[String(b.banda.nr_sequencia)], 0);
  }
  const total = doc.getNumberOfPages();
  for (const { pagina, elemento, y: yBanda, altura } of paginasPendentes) {
    doc.setPage(pagina);
    dentroDaBanda(yBanda, altura, () => desenharElemento(doc, elemento, margens.esquerda, yBanda, `Página ${pagina} de ${total}`));
  }
  return doc;
}
