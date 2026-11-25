/**
 * Regras de geração de código (Parâmetros das funções): matrícula dos alunos
 * e dos colaboradores. A regra tem até 10 segmentos, cada um em duas colunas
 * da tabela do parâmetro:
 *   - ie_regra_N: tipo do segmento (opções abaixo);
 *   - ds_regra_N: o texto (tipo Texto) ou a quantidade de dígitos (Sequência e
 *     Sequencial, com zeros à esquerda; vazio = sem zeros).
 * Os segmentos sem tipo são ignorados; o código é a junção dos demais, na ordem.
 */

/** Quantidade de segmentos (pares ie_regra_N / ds_regra_N). */
export const QTD_SEGMENTOS_REGRA = 10;

export interface SegmentoRegra {
  tipo: string;
  texto: string;
}

/** Opções do dropdown Regra de cada segmento (ordem alfabética). */
export const OPCOES_SEGMENTO_REGRA = [
  { value: "ano_atual_2", label: "Ano atual (2 dígitos)" },
  { value: "ano_atual", label: "Ano atual (4 dígitos)" },
  { value: "dia_atual", label: "Dia atual" },
  { value: "mes_atual", label: "Mês atual" },
  { value: "sequencia", label: "Sequência do cadastro" },
  { value: "sequencial", label: "Sequencial (contínuo)" },
  { value: "sequencial_ano", label: "Sequencial (reinicia a cada ano)" },
  { value: "sequencial_mes", label: "Sequencial (reinicia a cada mês)" },
  { value: "texto", label: "Texto" },
];

/** Tipos em que o campo ao lado guarda a quantidade de dígitos. */
export function segmentoUsaDigitos(tipo: string): boolean {
  return tipo === "sequencia" || tipo.startsWith("sequencial");
}

/** Tipos em que o campo ao lado fica habilitado (Texto e os de dígitos). */
export function segmentoUsaCampo(tipo: string): boolean {
  return tipo === "texto" || segmentoUsaDigitos(tipo);
}

/** Lê os segmentos preenchidos (com tipo) de um registro do parâmetro. */
export function segmentosDoParametro(doc: Record<string, unknown> | null | undefined): SegmentoRegra[] {
  if (!doc) return [];
  const segmentos: SegmentoRegra[] = [];
  for (let i = 1; i <= QTD_SEGMENTOS_REGRA; i++) {
    const tipo = String(doc[`ie_regra_${i}`] ?? "").trim();
    if (!tipo) continue;
    segmentos.push({ tipo, texto: String(doc[`ds_regra_${i}`] ?? "") });
  }
  return segmentos;
}

/**
 * Escopo de um segmento Sequencial: "geral" continua a numeração de todos os
 * códigos; "ano"/"mes" reiniciam a cada ano/mês. null = não é Sequencial.
 */
function escopoSequencial(tipo: string): "geral" | "ano" | "mes" | null {
  if (tipo === "sequencial") return "geral";
  if (tipo === "sequencial_ano") return "ano";
  if (tipo === "sequencial_mes") return "mes";
  return null;
}

const escaparRegex = (texto: string) => texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Quantidade de dígitos do segmento (0 = sem zeros à esquerda). */
function digitos(seg: SegmentoRegra): number {
  const n = parseInt(seg.texto, 10);
  return !isNaN(n) && n > 0 ? n : 0;
}

/**
 * Padrão (regex) do trecho que um segmento ocupa no código. No escopo "ano"
 * o ano é fixado no atual (e no escopo "mes", também o mês), para só contar
 * os códigos do período.
 */
function padraoSegmento(seg: SegmentoRegra, escopo: "geral" | "ano" | "mes", agora: Date): string {
  const anoAtual = String(agora.getFullYear());
  switch (seg.tipo) {
    case "texto": return escaparRegex(seg.texto);
    case "ano_atual": return escopo === "geral" ? "\\d{4}" : anoAtual;
    case "ano_atual_2": return escopo === "geral" ? "\\d{2}" : anoAtual.slice(-2);
    case "mes_atual": return escopo === "mes" ? String(agora.getMonth() + 1).padStart(2, "0") : "\\d{2}";
    case "dia_atual": return "\\d{2}";
  }
  // Sequência / Sequencial: números.
  if (segmentoUsaDigitos(seg.tipo)) return "\\d+";
  return "";
}

/**
 * Último número usado pelo segmento Sequencial de índice `indice`: lê, em cada
 * código existente que segue a regra, só o trecho desse segmento (ignorando
 * texto, ano, etc.). Códigos de outro formato (regra antiga) não contam.
 */
function ultimoSequencial(segmentos: SegmentoRegra[], indice: number, codigosExistentes: string[], agora: Date): number {
  const escopo = escopoSequencial(segmentos[indice].tipo) ?? "geral";
  const padrao = new RegExp(
    "^" + segmentos.map((seg, i) => (i === indice ? "(\\d+)" : padraoSegmento(seg, escopo, agora))).join("") + "$"
  );
  let ultimo = 0;
  for (const codigo of codigosExistentes) {
    const m = (codigo ?? "").trim().match(padrao);
    if (m) ultimo = Math.max(ultimo, parseInt(m[1], 10));
  }
  return ultimo;
}

/**
 * Gera o código de um registro a partir dos segmentos da regra.
 * - `nrSequencia`: sequência do registro (segmento Sequência do cadastro).
 * - `codigosExistentes`: códigos já gerados nos demais registros (segmentos Sequencial).
 */
export function gerarCodigoPorRegra(
  segmentos: SegmentoRegra[],
  nrSequencia: number,
  codigosExistentes: string[],
  agora: Date = new Date()
): string {
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const anoAtual = String(agora.getFullYear());

  return segmentos.map((seg, indice) => {
    if (escopoSequencial(seg.tipo)) {
      return String(ultimoSequencial(segmentos, indice, codigosExistentes, agora) + 1).padStart(digitos(seg), "0");
    }
    switch (seg.tipo) {
      case "texto": return seg.texto;
      case "ano_atual": return anoAtual;
      case "ano_atual_2": return anoAtual.slice(-2);
      case "mes_atual": return pad2(agora.getMonth() + 1);
      case "dia_atual": return pad2(agora.getDate());
      case "sequencia": return String(nrSequencia).padStart(digitos(seg), "0");
    }
    return "";
  }).join("");
}
