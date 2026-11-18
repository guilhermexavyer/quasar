#!/usr/bin/env node
/**
 * Testa a conexão com o PostgreSQL (Supabase) e mostra a versão do servidor.
 * Nunca exibe a string de conexão.
 *
 * Uso:
 *   node --env-file=.env.local scripts/testar-conexao.mjs              → DATABASE_URL (Transaction Pooler)
 *   node --env-file=.env.local scripts/testar-conexao.mjs --migracao   → DATABASE_URL_MIGRACAO (Session Pooler)
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const VARIAVEL = process.argv.includes("--migracao") ? "DATABASE_URL_MIGRACAO" : "DATABASE_URL";
const CAMINHO_CA = path.join(process.cwd(), "db", "supabase-ca.crt");

function falhar(mensagem) {
  console.error(`❌ ${mensagem}`);
  process.exit(1);
}

/** Erro com a conexão aberta: marca a saída com erro e deixa o finally fechar a conexão (process.exit aqui derruba o Node no Windows). */
function encerrarComErro(mensagem) {
  console.error(`❌ ${mensagem}`);
  process.exitCode = 1;
}

const bruta = process.env[VARIAVEL];
if (!bruta) falhar(`${VARIAVEL} não está definida. Rode com: node --env-file=.env.local scripts/testar-conexao.mjs`);

let url;
try {
  url = new URL(bruta);
} catch {
  falhar(`${VARIAVEL} não é uma URL válida.`);
}
if (url.searchParams.get("sslmode") !== "require") falhar(`${VARIAVEL} precisa terminar com ?sslmode=require.`);
url.searchParams.delete("sslmode");

const ca = existsSync(CAMINHO_CA) ? readFileSync(CAMINHO_CA, "utf8") : undefined;
console.log(`→ Variável: ${VARIAVEL} (porta ${url.port || "padrão"})`);
console.log(`→ Certificado da Supabase: ${ca ? "db/supabase-ca.crt" : "não encontrado (usando as CAs do sistema)"}`);

const cliente = new pg.Client({
  connectionString: url.toString(),
  ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: true },
  connectionTimeoutMillis: 10_000,
});

try {
  await cliente.connect();
  const { rows } = await cliente.query(
    "select version() as versao, current_database() as banco"
  );
  const r = rows[0];
  console.log("✅ Conexão OK");
  console.log(`   PostgreSQL: ${r.versao}`);
  const tls = cliente.connection?.stream;
  console.log(`   Banco: ${r.banco} · TLS até o pooler: ${tls?.encrypted ? (tls.authorized ? "sim, certificado verificado" : "sim, certificado NÃO verificado") : "não"}`);
} catch (erro) {
  // Mostra só o código e a mensagem do driver (sem a string de conexão).
  const texto = String(erro?.message ?? erro).replace(/postgres(ql)?:\/\/\S+/gi, "[url omitida]");
  encerrarComErro(`Falha na conexão (${erro?.code ?? "sem código"}): ${texto}`);
} finally {
  await cliente.end().catch(() => undefined);
}
