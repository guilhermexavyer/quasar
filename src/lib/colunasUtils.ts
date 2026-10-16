export interface ColunasConfig {
  order: number[];
  widths: number[];
}

export function serializeColunasConfig(order: number[], widths: number[]): string {
  return JSON.stringify({ order, widths });
}

export function parseColunasConfig(raw?: string | null): ColunasConfig | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ColunasConfig>;
    if (!Array.isArray(parsed.order)) return null;
    return {
      order: parsed.order,
      widths: Array.isArray(parsed.widths) ? parsed.widths : [],
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
  return { order: [...config.order, ...novas], widths };
}

/* ── String-key helpers (para ResizableTable com chaves de coluna) ── */

export interface StringColunasConfig {
  order: string[];
  widths: Record<string, number>;
}

export function serializeStringColunasConfig(order: string[], widths: Record<string, number>): string {
  return JSON.stringify({ order, widths });
}

export function parseStringColunasConfig(raw?: string | null): StringColunasConfig | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StringColunasConfig>;
    if (!Array.isArray(parsed.order)) return null;
    return {
      order: parsed.order,
      widths: parsed.widths && typeof parsed.widths === 'object' ? parsed.widths : {},
    };
  } catch {
    return null;
  }
}
