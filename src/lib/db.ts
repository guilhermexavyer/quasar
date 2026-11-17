import "server-only";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { Pool, types, type PoolClient, type QueryResultRow } from "pg";

/**
 * Conexão com o PostgreSQL (Supabase). Só roda no servidor (rotas /api).
 *
 * - DATABASE_URL aponta para o Transaction Pooler (porta 6543) com sslmode=require.
 * - O pooler em modo transaction NÃO suporta prepared statements. O `pg` só
 *   prepara uma consulta quando ela recebe `name`; por isso nenhuma consulta
 *   deste projeto pode usar `name` (use sempre `query(texto, valores)`).
 * - `max` baixo: o plano gratuito limita conexões e a Vercel abre várias instâncias.
 */

// Tipos devolvidos à API no mesmo formato que o Firestore guardava.
types.setTypeParser(1082, (v) => v); // date → 'AAAA-MM-DD' (sem fuso)
/** '2025-01-02 03:04:05.678+00' → ISO 8601 aceito por qualquer `Date`. */
function textoTimestampParaIso(v: string, utc = false): string {
  const iso = v.replace(" ", "T").replace(/([+-]\d\d)$/, "$1:00");
  return new Date(utc ? `${iso}Z` : iso).toISOString();
}
types.setTypeParser(1184, (v) => textoTimestampParaIso(v)); // timestamptz → ISO
types.setTypeParser(1114, (v) => textoTimestampParaIso(v, true)); // timestamp → ISO
types.setTypeParser(20, (v) => Number(v)); // bigint (nr_sequencia) → number
types.setTypeParser(1700, (v) => Number(v)); // numeric → number

const CAMINHO_CA = path.join(process.cwd(), "db", "supabase-ca.crt");

/** Lê DATABASE_URL, exige sslmode=require e devolve a URL sem o parâmetro (o SSL é configurado abaixo). */
function configuracaoConexao(variavel: string) {
  const bruta = process.env[variavel];
  if (!bruta) throw new Error(`Variável ${variavel} não configurada.`);
  const url = new URL(bruta);
  if (url.searchParams.get("sslmode") !== "require") {
    throw new Error(`${variavel} precisa conter sslmode=require.`);
  }
  // O `pg` trataria sslmode=require como verificação sem CA; o certificado da
  // Supabase é passado explicitamente para validar a cadeia.
  url.searchParams.delete("sslmode");
  const ca = existsSync(CAMINHO_CA) ? readFileSync(CAMINHO_CA, "utf8") : undefined;
  return {
    connectionString: url.toString(),
    ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: true },
  };
}

const globalParaPool = globalThis as unknown as { __quasarPool?: Pool };

/** Pool único por instância (reaproveitado entre recargas do `next dev`). */
export function pool(): Pool {
  if (!globalParaPool.__quasarPool) {
    globalParaPool.__quasarPool = new Pool({
      ...configuracaoConexao("DATABASE_URL"),
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return globalParaPool.__quasarPool;
}

/** Consulta simples (sem `name`: nada de prepared statements). */
export async function query<T extends QueryResultRow = QueryResultRow>(texto: string, valores: unknown[] = []) {
  return pool().query<T>(texto, valores);
}

/** Executa `fn` numa transação; desfaz tudo se lançar erro. */
export async function transacao<T>(fn: (cliente: PoolClient) => Promise<T>): Promise<T> {
  const cliente = await pool().connect();
  try {
    await cliente.query("BEGIN");
    const resultado = await fn(cliente);
    await cliente.query("COMMIT");
    return resultado;
  } catch (erro) {
    await cliente.query("ROLLBACK").catch(() => undefined);
    throw erro;
  } finally {
    cliente.release();
  }
}
