#!/usr/bin/env node
/**
 * Seeder — Cadastros Gerais (PostgreSQL)
 *
 * Cria os Cadastros Gerais a partir de scripts/dados/cadastros-gerais.json:
 * sexo, cor/raça, estado civil, grau de parentesco, cargo, vínculo contratual,
 * marca, sistema operacional, logradouro e profissão (com o código CBO).
 * Cada registro mantém o nr_sequencia do arquivo e ganha a auditoria de
 * criação; no fim, a sequência de cada tabela continua a partir do maior número.
 *
 * IDEMPOTENTE: uma tabela que já tem registros é pulada inteira, para não
 * duplicar itens. Tudo roda numa transação.
 *
 * Uso:
 *   node --env-file=.env.local scripts/seed-cadastros-gerais.mjs              → grava
 *   node --env-file=.env.local scripts/seed-cadastros-gerais.mjs --dry-run    → só mostra o que seria feito (desfaz no fim)
 */
import { readFileSync } from "node:fs";
import { ajustarSequencia, conectar, encerrarComErro, textoDoErro } from "./lib/conexao.mjs";

const DRY_RUN = process.argv.includes("--dry-run");

/** Implantação: usuário e data de criação dos registros do seeder (mesmo padrão de seed.mjs) */
const USUARIO_IMPLANTACAO = "implantacao";
const DATA_IMPLANTACAO = new Date().toISOString();

const ARQUIVO = "scripts/dados/cadastros-gerais.json";
/** Colunas que o arquivo pode trazer (as demais são de controle e o seeder preenche). */
const COLUNAS_PERMITIDAS = /^(nr_sequencia|ds_[a-z_]+|sg_[a-z_]+|nr_cbo|ie_status)$/;

async function semearTabela(db, tabela, itens) {
  const { rows } = await db.query(`select count(*)::int as n from ${tabela}`);
  if (rows[0].n > 0) {
    console.log(`ℹ️  ${tabela.padEnd(24)} já tem ${rows[0].n} registro(s) — pulada`);
    return 0;
  }
  // Inserção em lote: uma consulta para os registros e outra para a auditoria.
  const linhas = itens.map((item) => {
    const invalida = Object.keys(item).find((c) => !COLUNAS_PERMITIDAS.test(c));
    if (invalida) throw new Error(`${tabela}: coluna não permitida no arquivo: ${invalida}`);
    return { ...item, dt_criacao: DATA_IMPLANTACAO, dt_alteracao: DATA_IMPLANTACAO, ds_usuario_criacao: USUARIO_IMPLANTACAO, ds_usuario_alteracao: USUARIO_IMPLANTACAO };
  });
  const nomes = [...new Set(linhas.flatMap((l) => Object.keys(l)))];
  const valores = [];
  const tuplas = linhas.map((l) => `(${nomes.map((n) => { valores.push(l[n] ?? null); return "$" + valores.length; }).join(", ")})`);
  await db.query(`insert into ${tabela} (${nomes.join(", ")}) values ${tuplas.join(", ")}`, valores);
  await db.query(
    `insert into auditoria (ds_colecao, nr_seq_registro, nr_seq_usuario, usuario_nome, acao, "timestamp", detalhes)
     select $1, (d->>'nr_sequencia')::bigint, null, $2, 'create', $3, d from jsonb_array_elements($4::jsonb) as d`,
    [tabela, USUARIO_IMPLANTACAO, DATA_IMPLANTACAO, JSON.stringify(linhas)]
  );
  await ajustarSequencia(db, tabela);
  console.log(`✅ ${tabela.padEnd(24)} ${itens.length} registro(s) ${DRY_RUN ? "seriam inseridos" : "inseridos"}`);
  return itens.length;
}

const { colecoes } = JSON.parse(readFileSync(ARQUIVO, "utf8"));
console.log(`🌱 Seeder — Cadastros Gerais${DRY_RUN ? " (dry-run)" : ""}`);
const db = await conectar();
try {
  await db.query("BEGIN");
  let total = 0;
  for (const [tabela, itens] of Object.entries(colecoes)) {
    if (!/^(cg_[a-z_]+|pat_categoria|curso)$/.test(tabela)) throw new Error(`Tabela não permitida no arquivo: ${tabela}`);
    total += await semearTabela(db, tabela, itens);
  }
  if (DRY_RUN) {
    await db.query("ROLLBACK");
    console.log(`\n👀 Dry-run concluído: ${total} registro(s) seriam inseridos. Nada foi gravado.`);
  } else {
    await db.query("COMMIT");
    console.log(`\n🎉 Concluído: ${total} registro(s) inseridos.`);
  }
} catch (erro) {
  await db.query("ROLLBACK").catch(() => undefined);
  encerrarComErro(`Erro ao executar o seeder (${erro?.code ?? "sem código"}): ${textoDoErro(erro)}. Nada foi gravado.`);
} finally {
  await db.end().catch(() => undefined);
}
