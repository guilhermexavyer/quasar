/**
 * Regras de geração de código (Parâmetros das funções): código de patrimônio
 * dos ativos, matrícula dos alunos etc. A regra é salva como uma string de
 * segmentos separados por "-" (ex.: "ano_atual-hifen-texto:ESCOLA-sequencial").
 */

/** Opções disponíveis para os segmentos da regra (ordem alfabética). */
export const OPCOES_SEGMENTO_REGRA = [
  { value: "ano_atual", label: "Ano atual" },
  { value: "ano_atual_2", label: "Ano atual (2 dígitos)" },
  { value: "chave_esquerda", label: "Chave esquerda" },
  { value: "chave_direita", label: "Chave direita" },
  { value: "colchete_esquerdo", label: "Colchete esquerdo" },
  { value: "colchete_direito", label: "Colchete direito" },
  { value: "data_atual", label: "Data atual" },
  { value: "data_atual_2digitos", label: "Data atual (ano com 2 dígitos)" },
  { value: "data_atual_2digitos_mascara", label: "Data atual (ano com 2 dígitos + máscara)" },
  { value: "data_atual_mascara", label: "Data atual (máscara)" },
  { value: "dia_atual", label: "Dia atual" },
  { value: "dois_pontos", label: "Dois pontos" },
  { value: "hifen", label: "Hífen" },
  { value: "mes_atual", label: "Mês atual" },
  { value: "parentese_esquerdo", label: "Parêntese esquerdo" },
  { value: "parentese_direito", label: "Parêntese direito" },
  { value: "ponto", label: "Ponto" },
  { value: "sequencial", label: "Sequencial" },
  { value: "sequencial_digitos", label: "Sequencial (dígitos)" },
  { value: "sequencial_ano", label: "Sequencial (por ano)" },
  { value: "sequencial_mes", label: "Sequencial (por mês)" },
  { value: "sequencia", label: "Sequência" },
  { value: "sequencia_digitos", label: "Sequência (dígitos)" },
  { value: "texto", label: "Texto" },
];

/** Segmentos de símbolo: valor fixo inserido no código. */
const SIMBOLOS: Record<string, string> = {
  chave_esquerda: "{",
  chave_direita: "}",
  colchete_esquerdo: "[",
  colchete_direito: "]",
  dois_pontos: ":",
  hifen: "-",
  parentese_esquerdo: "(",
  parentese_direito: ")",
  ponto: ".",
};

/**
 * Escopo de um segmento Sequencial: "geral" continua a numeração de todos os
 * códigos; "ano"/"mes" reiniciam a cada ano/mês. null = não é Sequencial.
 */
function escopoSequencial(seg: string): "geral" | "ano" | "mes" | null {
  const s = seg.toLowerCase();
  if (s === "sequencial" || s.startsWith("sequencial_digitos")) return "geral";
  if (s === "sequencial_ano") return "ano";
  if (s === "sequencial_mes") return "mes";
  return null;
}

const escaparRegex = (texto: string) => texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Padrão (regex) do trecho que um segmento ocupa no código. No escopo "ano"
 * o ano é fixado no atual (e no escopo "mes", também o mês), para só contar
 * os códigos do período.
 */
function padraoSegmento(seg: string, escopo: "geral" | "ano" | "mes", agora: Date): string {
  const s = seg.toLowerCase();
  if (s.startsWith("texto:")) return escaparRegex(seg.slice(6));
  if (SIMBOLOS[s]) return escaparRegex(SIMBOLOS[s]);
  const anoAtual = String(agora.getFullYear());
  const ano4 = escopo === "geral" ? "\\d{4}" : anoAtual;
  const ano2 = escopo === "geral" ? "\\d{2}" : anoAtual.slice(-2);
  const mes = escopo === "mes" ? String(agora.getMonth() + 1).padStart(2, "0") : "\\d{2}";
  const dia = "\\d{2}";
  switch (s) {
    case "ano_atual": return ano4;
    case "ano_atual_2": return ano2;
    case "mes_atual": return mes;
    case "dia_atual": return dia;
    case "data_atual": return `${dia}${mes}${ano4}`;
    case "data_atual_2digitos": return `${dia}${mes}${ano2}`;
    case "data_atual_mascara": return `${dia}/${mes}/${ano4}`;
    case "data_atual_2digitos_mascara": return `${dia}/${mes}/${ano2}`;
  }
  // Sequência / Sequencial (com ou sem dígitos): números.
  if (s.startsWith("sequencia")) return "\\d+";
  return escaparRegex(seg);
}

/**
 * Último número usado pelo segmento Sequencial de índice `indice`: lê, em cada
 * código existente que segue a regra, só o trecho desse segmento (ignorando
 * texto, ano, etc.). Códigos de outro formato (regra antiga) não contam.
 */
function ultimoSequencial(segmentos: string[], indice: number, codigosExistentes: string[], agora: Date): number {
  const escopo = escopoSequencial(segmentos[indice]) ?? "geral";
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

/** Quantidade de dígitos de um segmento "<tipo>_digitos:N" (0 = sem preenchimento). */
function digitos(seg: string): number {
  if (!seg.includes(":")) return 0;
  const n = parseInt(seg.slice(seg.indexOf(":") + 1), 10);
  return !isNaN(n) && n > 0 ? n : 0;
}

/**
 * Gera o código de um registro a partir da regra salva.
 * - `nrSequencia`: sequência do registro (segmentos Sequência / Sequência (dígitos)).
 * - `codigosExistentes`: códigos já gerados nos demais registros (segmentos Sequencial).
 */
export function gerarCodigoPorRegra(
  regra: string,
  nrSequencia: number,
  codigosExistentes: string[],
  agora: Date = new Date()
): string {
  const segmentos = regra.split("-").filter((v) => v.trim() !== "");
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const anoAtual = String(agora.getFullYear());
  const mesAtual = pad2(agora.getMonth() + 1);
  const diaAtual = pad2(agora.getDate());

  return segmentos.map((seg, indice) => {
    const s = seg.toLowerCase();
    if (s.startsWith("texto:")) return seg.slice(6);
    if (SIMBOLOS[s]) return SIMBOLOS[s];
    if (escopoSequencial(seg)) {
      const proximo = String(ultimoSequencial(segmentos, indice, codigosExistentes, agora) + 1);
      return s.startsWith("sequencial_digitos") ? proximo.padStart(digitos(seg), "0") : proximo;
    }
    switch (s) {
      case "ano_atual": return anoAtual;
      case "ano_atual_2": return anoAtual.slice(-2);
      case "mes_atual": return mesAtual;
      case "dia_atual": return diaAtual;
      case "data_atual": return `${diaAtual}${mesAtual}${anoAtual}`;
      case "data_atual_2digitos": return `${diaAtual}${mesAtual}${anoAtual.slice(-2)}`;
      case "data_atual_mascara": return `${diaAtual}/${mesAtual}/${anoAtual}`;
      case "data_atual_2digitos_mascara": return `${diaAtual}/${mesAtual}/${anoAtual.slice(-2)}`;
      case "sequencia": return String(nrSequencia);
    }
    if (s.startsWith("sequencia_digitos")) return String(nrSequencia).padStart(digitos(seg), "0");
    return seg;
  }).join("");
}
