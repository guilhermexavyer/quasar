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
