/**
 * Conexão dos scripts com o PostgreSQL (Supabase).
 *
 * Usa DATABASE_URL_MIGRACAO (Session Pooler, porta 5432), com SSL verificado
 * pela CA da Supabase (db/supabase-ca.crt). Nunca exibe a string de conexão.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

export function falhar(mensagem) {
  console.error(`❌ ${mensagem}`);
  process.exit(1);
}

/** Mensagem de erro do driver sem a string de conexão. */
export function textoDoErro(erro) {
  return String(erro?.message ?? erro).replace(/postgres(ql)?:\/\/\S+/gi, "[url omitida]");
}

/** Abre a conexão. `variavel` padrão: DATABASE_URL_MIGRACAO. */
export async function conectar(variavel = "DATABASE_URL_MIGRACAO") {
  const bruta = process.env[variavel];
  if (!bruta) falhar(`${variavel} não está definida. Rode com: node --env-file=.env.local <script>`);
  let url;
  try {
    url = new URL(bruta);
  } catch {
    falhar(`${variavel} não é uma URL válida.`);
  }
  if (url.searchParams.get("sslmode") !== "require") falhar(`${variavel} precisa terminar com ?sslmode=require.`);
  url.searchParams.delete("sslmode");
  const caminhoCa = path.join(process.cwd(), "db", "supabase-ca.crt");
  const ca = existsSync(caminhoCa) ? readFileSync(caminhoCa, "utf8") : undefined;
  const cliente = new pg.Client({
    connectionString: url.toString(),
    ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: true },
    connectionTimeoutMillis: 10_000,
  });
  await cliente.connect();
  // O usuário do pooler contém o ref do projeto (identifica a base sem expor a senha).
  console.log(`→ Banco: ${decodeURIComponent(url.username)}`);
  return cliente;
}

/** Ajusta a sequência de nr_sequencia da tabela para continuar depois do maior número. */
export async function ajustarSequencia(cliente, tabela) {
  await cliente.query(
    `select setval(pg_get_serial_sequence($1, 'nr_sequencia'), greatest((select coalesce(max(nr_sequencia), 0) from ${tabela}), 1), (select count(*) > 0 from ${tabela}))`,
    [tabela]
  );
}

/** Registra a auditoria de criação de um registro do seeder. */
export async function auditarCriacao(cliente, tabela, nrSequencia, autor, momento, detalhes) {
  await cliente.query(
    `insert into auditoria (ds_colecao, nr_seq_registro, nr_seq_usuario, usuario_nome, acao, "timestamp", detalhes)
     values ($1, $2, null, $3, 'create', $4, $5::jsonb)`,
    [tabela, nrSequencia, autor, momento, JSON.stringify(detalhes)]
  );
}
