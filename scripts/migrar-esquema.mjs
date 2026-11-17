#!/usr/bin/env node
/**
 * Aplica as migrações de esquema de db/migrations/*.sql no PostgreSQL (Supabase).
 *
 * Usa DATABASE_URL_MIGRACAO (Session Pooler, porta 5432). Cada arquivo roda numa
 * transação e é registrado na tabela migracao_esquema; arquivos já aplicados são
 * pulados. Nunca exibe a string de conexão.
 *
 * Uso:
 *   node --env-file=.env.local scripts/migrar-esquema.mjs              → mostra o que está pendente (não altera nada)
 *   node --env-file=.env.local scripts/migrar-esquema.mjs --simular    → executa as pendentes e DESFAZ (valida o SQL no banco)
 *   node --env-file=.env.local scripts/migrar-esquema.mjs --confirmar  → aplica de verdade
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const CONFIRMAR = process.argv.includes("--confirmar");
const SIMULAR = process.argv.includes("--simular");
const PASTA = path.join(process.cwd(), "db", "migrations");
const CAMINHO_CA = path.join(process.cwd(), "db", "supabase-ca.crt");

function falhar(mensagem) {
  console.error(`❌ ${mensagem}`);
  process.exit(1);
}

const bruta = process.env.DATABASE_URL_MIGRACAO;
if (!bruta) falhar("DATABASE_URL_MIGRACAO não está definida. Rode com: node --env-file=.env.local scripts/migrar-esquema.mjs");
let url;
try {
  url = new URL(bruta);
} catch {
  falhar("DATABASE_URL_MIGRACAO não é uma URL válida.");
}
if (url.searchParams.get("sslmode") !== "require") falhar("DATABASE_URL_MIGRACAO precisa terminar com ?sslmode=require.");
url.searchParams.delete("sslmode");
const ca = existsSync(CAMINHO_CA) ? readFileSync(CAMINHO_CA, "utf8") : undefined;

const arquivos = readdirSync(PASTA).filter((f) => f.endsWith(".sql")).sort();
if (arquivos.length === 0) falhar("Nenhum arquivo .sql em db/migrations.");

const cliente = new pg.Client({
  connectionString: url.toString(),
  ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: true },
  connectionTimeoutMillis: 10_000,
});

try {
  await cliente.connect();
  // O host identifica o projeto (ex.: postgres.<ref>); mostra só o usuário, que contém o ref.
  console.log(`→ Banco: ${decodeURIComponent(url.username)} (porta ${url.port})`);

  const { rows: existe } = await cliente.query("select to_regclass('public.migracao_esquema') as t");
  const aplicadas = existe[0].t
    ? new Set((await cliente.query("select ds_arquivo from migracao_esquema")).rows.map((r) => r.ds_arquivo))
    : new Set();
  const pendentes = arquivos.filter((f) => !aplicadas.has(f));

  for (const f of arquivos) console.log(`   ${aplicadas.has(f) ? "✔ aplicada " : "• pendente "} ${f}`);
  if (pendentes.length === 0) {
    console.log("✅ Nada a aplicar.");
  } else if (!CONFIRMAR && !SIMULAR) {
    console.log("\nNada foi alterado. Use --simular para validar o SQL no banco (desfaz no fim) ou --confirmar para aplicar.");
  } else {
    await cliente.query("BEGIN");
    try {
      await cliente.query(`
        create table if not exists migracao_esquema (
          ds_arquivo   text primary key,
          dt_aplicacao timestamptz not null default now()
        );
        alter table migracao_esquema enable row level security;
        revoke all on migracao_esquema from anon, authenticated;
      `);
      for (const f of pendentes) {
        await cliente.query(readFileSync(path.join(PASTA, f), "utf8"));
        await cliente.query("insert into migracao_esquema (ds_arquivo) values ($1)", [f]);
        console.log(`   → executada ${f}`);
      }
      const { rows } = await cliente.query(
        "select count(*)::int as n from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'"
      );
      if (CONFIRMAR) {
        await cliente.query("COMMIT");
        console.log(`✅ Migrações aplicadas. Tabelas em public: ${rows[0].n}`);
      } else {
        await cliente.query("ROLLBACK");
        console.log(`✅ Simulação OK (${rows[0].n} tabelas seriam criadas/mantidas). Tudo foi desfeito; nada mudou no banco.`);
      }
    } catch (erro) {
      await cliente.query("ROLLBACK").catch(() => undefined);
      throw erro;
    }
  }
} catch (erro) {
  const texto = String(erro?.message ?? erro).replace(/postgres(ql)?:\/\/\S+/gi, "[url omitida]");
  const onde = erro?.position ? ` (posição ${erro.position} do SQL)` : "";
  falhar(`Falha (${erro?.code ?? "sem código"}): ${texto}${onde}. Nada foi aplicado.`);
} finally {
  await cliente.end().catch(() => undefined);
}
