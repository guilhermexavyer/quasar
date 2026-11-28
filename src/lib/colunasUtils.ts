/**
 * Versão do formato salvo. Configurações sem versão vieram de antes do
 * cabeçalho compacto da coluna #: a largura salva do # nelas era o mínimo
 * automático antigo (~50px) e é recalculada uma única vez.
 */
export const COLUNAS_CONFIG_VERSAO = 2;
/** Maior largura do # que o mínimo automático antigo produzia. */
const LARGURA_AUTO_SEQUENCIA_ANTIGA = 52;

export interface ColunasConfig {
  order: number[];
  widths: number[];
  v?: number;
}

export function serializeColunasConfig(order: number[], widths: number[]): string {
  return JSON.stringify({ order, widths, v: COLUNAS_CONFIG_VERSAO });
}

export function parseColunasConfig(raw?: string | null): ColunasConfig | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ColunasConfig>;
    if (!Array.isArray(parsed.order)) return null;
    return {
      order: parsed.order,
      widths: Array.isArray(parsed.widths) ? parsed.widths : [],
      v: parsed.v,
    };
  } catch {
    return null;
  }
}

export function isValidOrder(order: number[], length: number): boolean {
  if (!Array.isArray(order) || order.length !== length) return false;
  const seen = new Set<number>();
  for (const idx of order) {
    if (!Number.isInteger(idx) || idx < 0 || idx >= length || seen.has(idx)) return false;
    seen.add(idx);
  }
  return true;
}

/**
 * Adapta a configuração salva quando a tabela ganhou colunas novas no fim
 * (ex.: colunas de auditoria): as colunas novas entram no final da ordem
 * salva, com largura automática (0), preservando a personalização do usuário.
 */
export function ajustarColunasConfig(config: ColunasConfig | null | undefined, length: number): ColunasConfig | null {
  if (!config) return null;
  const antigo = config.order.length;
  if (antigo >= length || !isValidOrder(config.order, antigo)) return config;
  const novas = Array.from({ length: length - antigo }, (_, i) => antigo + i);
  const widths = config.widths.length === antigo ? [...config.widths, ...novas.map(() => 0)] : [];
  return { order: [...config.order, ...novas], widths, v: config.v };
}

/**
 * Configuração salva pronta para uso na tabela: completa colunas novas
 * (ajustarColunasConfig) e, em configurações sem versão, zera a largura do #
 * que veio do mínimo automático antigo, para ela voltar a se ajustar ao número.
 */
export function prepararColunasSalvas(
  config: ColunasConfig | null | undefined,
  columns: { key: string }[]
): ColunasConfig | null {
  const ajustada = ajustarColunasConfig(config, columns.length);
  if (!ajustada || ajustada.v === COLUNAS_CONFIG_VERSAO) return ajustada;
  const widths = [...ajustada.widths];
  const iSeq = columns.findIndex((c) => c.key === 'nr_sequencia');
  if (iSeq >= 0 && widths[iSeq] > 0 && widths[iSeq] <= LARGURA_AUTO_SEQUENCIA_ANTIGA) widths[iSeq] = 0;
  return { ...ajustada, widths };
}

/** Larguras atuais (px) dos cabeçalhos, indexadas pela coluna lógica. */
export function lerLargurasPorColuna(ths: ArrayLike<HTMLElement>, columnOrder: number[], total: number): number[] {
  const larguras = new Array<number>(total).fill(0);
  Array.from(ths).forEach((th, domIdx) => {
    larguras[columnOrder[domIdx]] = th.offsetWidth;
  });
  return larguras;
}

/**
 * CSS do cabeçalho compacto da coluna # (classe th-seq): com o padding padrão,
 * "#" + ícone de ordenação deixavam a coluna mais larga que os números.
 * Só a direita é reduzida; a esquerda mantém os 10px das demais colunas.
 */
export const CSS_CABECALHO_SEQUENCIA =
  'th.th-seq { padding-right: 4px; } th.th-seq .header-content, th.th-seq .rt-header-content { padding-right: 0; }';

/**
 * Largura natural (px) de uma célula da tabela: um clone invisível, sem quebra de
 * linha e sem limite de largura, é medido logo ao lado da original, dentro da
 * própria linha. Assim herda a fonte da tabela (ex.: text-sm) e os demais estilos
 * do contexto — medido solto no <body>, saía com a fonte da página (maior) e a
 * coluna ficava mais larga que o texto. `ajustar` altera o clone antes de medir.
 */
export function medirCelula(celula: HTMLElement, ajustar?: (clone: HTMLElement) => void): number {
  const clone = celula.cloneNode(true) as HTMLElement;
  ajustar?.(clone);
  Object.assign(clone.style, {
    position: "absolute", left: "0", top: "0", visibility: "hidden", pointerEvents: "none",
    display: "inline-block", whiteSpace: "nowrap", width: "max-content", minWidth: "0", maxWidth: "none",
    overflow: "visible", textOverflow: "clip", boxSizing: "border-box",
  });
  celula.parentNode?.insertBefore(clone, celula.nextSibling);
  const largura = clone.getBoundingClientRect().width;
  clone.remove();
  return Math.ceil(largura);
}

/**
 * Largura mínima do cabeçalho: nome da coluna + ícones de ordenação (sem ficarem
 * por cima do nome) + padding e borda; a alça de redimensionar não conta.
 */
export function medirCabecalhoColuna(th: HTMLElement): number {
  return medirCelula(th, (clone) => {
    clone.querySelectorAll(".resizer-handle, .rt-resizer-handle").forEach((el) => el.remove());
  });
}

/** Maior largura natural entre as células da coluna (registros da página atual). */
export function medirConteudoColuna(table: HTMLTableElement, domIdx: number): number {
  let maior = 0;
  table.querySelectorAll<HTMLElement>(`tbody tr td:nth-child(${domIdx + 1})`).forEach((td) => {
    maior = Math.max(maior, medirCelula(td));
  });
  return maior;
}

/**
 * Largura do maior número da coluna # (th-seq) entre todos os registros (não
 * só os da página atual), medida com o estilo das células. A largura padrão do
 * # é a maior entre esta e a do cabeçalho. Retorna 0 para as demais colunas ou
 * quando não há linhas.
 */
export function larguraColunaSequencia(table: HTMLTableElement, domIdx: number, registros: ReadonlyArray<unknown>): number {
  const th = table.querySelectorAll<HTMLElement>("thead tr th")[domIdx];
  if (!th?.classList.contains("th-seq")) return 0;
  const td = table.querySelector<HTMLElement>(`tbody tr td:nth-child(${domIdx + 1})`);
  if (!td) return 0;

  let maior = "";
  for (const r of registros) {
    const texto = String((r as { nr_sequencia?: unknown } | null)?.nr_sequencia ?? "");
    if (texto.length > maior.length) maior = texto;
  }
  if (!maior) return 0;

  return medirCelula(td, (clone) => {
    (clone.querySelector<HTMLElement>(".cell-content, .rt-cell-content") ?? clone).textContent = maior;
  });
}

/* ── String-key helpers (para ResizableTable com chaves de coluna) ── */

export interface StringColunasConfig {
  order: string[];
  widths: Record<string, number>;
  v?: number;
}

export function serializeStringColunasConfig(order: string[], widths: Record<string, number>): string {
  return JSON.stringify({ order, widths, v: COLUNAS_CONFIG_VERSAO });
}

export function parseStringColunasConfig(raw?: string | null): StringColunasConfig | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StringColunasConfig>;
    if (!Array.isArray(parsed.order)) return null;
    return {
      order: parsed.order,
      widths: parsed.widths && typeof parsed.widths === 'object' ? parsed.widths : {},
      v: parsed.v,
    };
  } catch {
    return null;
  }
}

/** Mesma migração do # para configurações por chave (ResizableTable). */
export function prepararStringColunasSalvas(config: StringColunasConfig | null | undefined): StringColunasConfig | null {
  if (!config || config.v === COLUNAS_CONFIG_VERSAO) return config ?? null;
  const widths = { ...config.widths };
  if (widths.nr_sequencia > 0 && widths.nr_sequencia <= LARGURA_AUTO_SEQUENCIA_ANTIGA) delete widths.nr_sequencia;
  return { ...config, widths };
}
