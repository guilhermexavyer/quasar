/**
 * Apoio dos scripts de banco (PostgreSQL/Supabase).
 *
 * - Conexão por DATABASE_URL_MIGRACAO (Session Pooler, porta 5432), com SSL
 *   verificado pela CA da Supabase (db/supabase-ca.crt).
 * - Nunca exibe strings de conexão nem chaves; para identificar a base, mostra
 *   só o ref do projeto (parte do usuário do pooler, ex.: postgres.<ref>).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

// Valores como texto: datas sem fuso, bigint e numeric sem perda de precisão.
pg.types.setTypeParser(1082, (v) => v); // date
pg.types.setTypeParser(20, (v) => v); // bigint
pg.types.setTypeParser(1700, (v) => v); // numeric

/** Tabelas internas que os scripts não copiam nem apagam. */
export const TABELAS_INTERNAS = new Set(["migracao_esquema", "sessao"]);

export function falhar(mensagem) {
  console.error(`❌ ${mensagem}`);
  process.exit(1);
}

/** Mensagem de erro do driver sem a string de conexão. */
export function textoDoErro(erro) {
  return String(erro?.message ?? erro).replace(/postgres(ql)?:\/\/\S+/gi, "[url omitida]");
}

/** Lê um arquivo .env (KEY=valor) sem exibir nada. */
export function lerEnv(arquivo) {
  if (!existsSync(arquivo)) falhar(`Arquivo ${arquivo} não encontrado.`);
  const env = {};
  for (const linha of readFileSync(arquivo, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(linha);
    if (!m || linha.trim().startsWith("#")) continue;
    env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return env;
}

/** Ref do projeto Supabase a partir da URL de conexão (sem expor a senha). */
export function refDaBase(urlBruta) {
  try {
    return decodeURIComponent(new URL(urlBruta).username).split(".").pop() || "?";
  } catch {
    return "?";
  }
}

/** Abre a conexão a partir de uma URL (padrão: process.env.DATABASE_URL_MIGRACAO). */
export async function conectar(bruta = process.env.DATABASE_URL_MIGRACAO, rotulo = "DATABASE_URL_MIGRACAO") {
  if (!bruta) falhar(`${rotulo} não está definida. Rode com: node --env-file=.env.local <script>`);
  let url;
  try {
    url = new URL(bruta);
  } catch {
    falhar(`${rotulo} não é uma URL válida.`);
  }
  if (url.searchParams.get("sslmode") !== "require") falhar(`${rotulo} precisa terminar com ?sslmode=require.`);
  url.searchParams.delete("sslmode");
  const caminhoCa = path.join(process.cwd(), "db", "supabase-ca.crt");
  const ca = existsSync(caminhoCa) ? readFileSync(caminhoCa, "utf8") : undefined;
  const cliente = new pg.Client({
    connectionString: url.toString(),
    ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: true },
    connectionTimeoutMillis: 10_000,
  });
  await cliente.connect();
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

/**
 * Tabelas de dados em ordem de chave estrangeira (quem é referenciado vem
 * antes), para inserir nessa ordem e apagar na inversa.
 */
export async function tabelasEmOrdem(cliente) {
  const { rows: tabelas } = await cliente.query("select tablename from pg_tables where schemaname = 'public' order by tablename");
  const nomes = tabelas.map((t) => t.tablename).filter((t) => !TABELAS_INTERNAS.has(t));
  const { rows: fks } = await cliente.query(
    `select c.conrelid::regclass::text as filha, c.confrelid::regclass::text as mae
       from pg_constraint c join pg_namespace n on n.oid = c.connamespace
      where c.contype = 'f' and n.nspname = 'public'`
  );
  const depende = new Map(nomes.map((n) => [n, new Set()]));
  for (const { filha, mae } of fks) if (filha !== mae && depende.has(filha) && depende.has(mae)) depende.get(filha).add(mae);
  const ordem = [];
  const visitados = new Set();
  const visitar = (t) => {
    if (visitados.has(t)) return;
    visitados.add(t);
    for (const m of depende.get(t)) visitar(m);
    ordem.push(t);
  };
  nomes.forEach(visitar);
  return ordem;
}

/** Contagem de registros por tabela. */
export async function contagens(cliente, tabelas) {
  const resultado = {};
  for (const t of tabelas) resultado[t] = (await cliente.query(`select count(*)::int as n from "${t}"`)).rows[0].n;
  return resultado;
}

/** Backup JSON de todas as tabelas de dados em backups/ (fora do Git). Devolve o caminho. */
export async function fazerBackup(cliente, rotulo) {
  const tabelas = await tabelasEmOrdem(cliente);
  const dados = {};
  for (const t of tabelas) dados[t] = (await cliente.query(`select * from "${t}" order by 1`)).rows;
  mkdirSync("backups", { recursive: true });
  const arquivo = path.join("backups", `${new Date().toISOString().replace(/[:.]/g, "-")}-${rotulo}.json`);
  writeFileSync(arquivo, JSON.stringify({ gerado_em: new Date().toISOString(), base: rotulo, tabelas: dados }, null, 1));
  return arquivo;
}

/* ── Supabase Storage (bucket privado "imagens"), pela API REST com a service role ── */

export const BUCKET = "imagens";

export function storage(supabaseUrl, chave) {
  if (!supabaseUrl || !chave) falhar("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidas.");
  const base = `${supabaseUrl.replace(/\/$/, "")}/storage/v1`;
  const h = { apikey: chave, Authorization: `Bearer ${chave}` };
  const codificar = (c) => c.split("/").map(encodeURIComponent).join("/");
  const ok = async (r, acao) => {
    if (!r.ok) throw new Error(`Storage (${acao}): ${r.status} ${(await r.text()).slice(0, 200)}`);
    return r;
  };
  return {
    /** Caminhos de todos os arquivos da pasta (ex.: "images/"). */
    async listar(prefixo = "images/") {
      const caminhos = [];
      for (let offset = 0; ; offset += 1000) {
        const r = await ok(await fetch(`${base}/object/list/${BUCKET}`, {
          method: "POST", headers: { ...h, "Content-Type": "application/json" },
          body: JSON.stringify({ prefix: prefixo, limit: 1000, offset }),
        }), "listar");
        const itens = (await r.json()).filter((i) => i.id);
        caminhos.push(...itens.map((i) => prefixo + i.name));
        if (itens.length < 1000) return caminhos;
      }
    },
    async baixar(caminho) {
      const r = await ok(await fetch(`${base}/object/authenticated/${BUCKET}/${codificar(caminho)}`, { headers: h }), "baixar");
      return { bytes: Buffer.from(await r.arrayBuffer()), tipo: r.headers.get("content-type") ?? "application/octet-stream" };
    },
    async enviar(caminho, bytes, tipo) {
      await ok(await fetch(`${base}/object/${BUCKET}/${codificar(caminho)}`, {
        method: "POST", headers: { ...h, "Content-Type": tipo, "x-upsert": "true" }, body: new Uint8Array(bytes),
      }), "enviar");
    },
    async remover(caminhos) {
      for (let i = 0; i < caminhos.length; i += 100) {
        await ok(await fetch(`${base}/object/${BUCKET}`, {
          method: "DELETE", headers: { ...h, "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: caminhos.slice(i, i + 100) }),
        }), "remover");
      }
    },
  };
}
