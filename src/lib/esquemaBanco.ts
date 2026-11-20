/**
 * Tipos das colunas do banco (PostgreSQL), para os infobuttons. Carregados uma
 * vez por página da rota /api/esquema; enquanto não chegam (ou para campos que
 * não são colunas, como os dos modais), usa-se o tipo declarado na tela,
 * convertido para o nome equivalente do PostgreSQL.
 */
type Esquema = Record<string, Record<string, string>>;

let cache: Promise<Esquema> | null = null;

export function carregarEsquema(): Promise<Esquema> {
  if (!cache) {
    cache = fetch("/api/esquema", { credentials: "same-origin" })
      .then((r) => (r.ok ? (r.json() as Promise<Esquema>) : {}))
      .catch(() => ({}));
    // Sem sessão a resposta vem vazia: permite tentar de novo depois do login.
    cache.then((e) => {
      if (Object.keys(e).length === 0) cache = null;
    });
  }
  return cache;
}

/** Tipos declarados nos metadados dos campos (string, int64...) → nome do tipo no PostgreSQL. */
const EQUIVALENTES: Record<string, string> = {
  string: "text",
  int64: "bigint",
  float64: "numeric",
  number: "numeric",
  boolean: "boolean",
  array: "jsonb",
  timestamp: "timestamptz",
  map: "jsonb",
};

export function tipoDeclarado(tipo: string): string {
  return EQUIVALENTES[tipo] ?? tipo;
}

/** Tipo real da coluna, ou null se a tabela/coluna não existe no banco. */
export function tipoDaColuna(esquema: Esquema, tabela: string, coluna: string): string | null {
  return esquema[tabela]?.[coluna] ?? null;
}

/* ── Referências (chaves estrangeiras): "Depende de" dos infobuttons ── */

type Referencias = Record<string, Record<string, string>>;

let cacheReferencias: Promise<Referencias> | null = null;

export function carregarReferencias(): Promise<Referencias> {
  if (!cacheReferencias) {
    cacheReferencias = fetch("/api/esquema/referencias", { credentials: "same-origin" })
      .then((r) => (r.ok ? (r.json() as Promise<Referencias>) : {}))
      .catch(() => ({}));
    // Sem sessão a resposta vem vazia: permite tentar de novo depois do login.
    cacheReferencias.then((e) => {
      if (Object.keys(e).length === 0) cacheReferencias = null;
    });
  }
  return cacheReferencias;
}

/**
 * Tabela de onde vem o valor da coluna (null se não depende de outra tabela). Campos que
 * não são colunas de uma tabela (ex.: os dos modais) usam a mesma coluna de outra tabela,
 * quando ela aponta sempre para o mesmo lugar (ex.: nr_seq_prestador_servico → colaborador).
 */
export function tabelaReferenciada(referencias: Referencias, tabela: string, coluna: string): string | null {
  const direta = referencias[tabela]?.[coluna];
  if (direta) return direta;
  if (referencias[tabela]) return null; // tabela real: a coluna não é uma referência
  const alvos = new Set(Object.values(referencias).map((cols) => cols[coluna]).filter(Boolean));
  return alvos.size === 1 ? [...alvos][0] : null;
}
