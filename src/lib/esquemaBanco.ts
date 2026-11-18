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
