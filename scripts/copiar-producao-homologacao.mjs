#!/usr/bin/env node
/**
 * Copia a PRODUÇÃO para a HOMOLOGAÇÃO (dados do PostgreSQL e imagens do Storage).
 *
 * Origem (só leitura):  .env.producao  → DATABASE_URL_MIGRACAO, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Destino (é apagado):  .env.local     → as mesmas variáveis, da homologação
 *
 * Passos com --confirmar:
 *   1. backup JSON da homologação em backups/;
 *   2. apaga todos os registros da homologação e copia os da produção, tabela
 *      por tabela (na ordem das chaves estrangeiras), numa transação;
 *   3. ajusta a numeração (nr_sequencia) e confere as contagens — qualquer
 *      diferença desfaz tudo;
 *   4. copia as imagens (as da homologação que não existem na produção são removidas).
 * As sessões de login da homologação são encerradas.
 *
 * Uso:
 *   node scripts/copiar-producao-homologacao.mjs                              → só mostra o que seria copiado
 *   node scripts/copiar-producao-homologacao.mjs --confirmar                  → copia de verdade
 *   node scripts/copiar-producao-homologacao.mjs --confirmar --sem-imagens    → copia só o banco
 */
import { ajustarSequencia, conectar, contagens, falhar, fazerBackup, lerEnv, refDaBase, storage, tabelasEmOrdem, textoDoErro } from "./lib/conexao.mjs";

const CONFIRMAR = process.argv.includes("--confirmar");
const SEM_IMAGENS = process.argv.includes("--sem-imagens");

const prod = lerEnv(".env.producao");
const homol = lerEnv(".env.local");
const refProd = refDaBase(prod.DATABASE_URL_MIGRACAO);
const refHomol = refDaBase(homol.DATABASE_URL_MIGRACAO);
if (!prod.DATABASE_URL_MIGRACAO || !homol.DATABASE_URL_MIGRACAO) falhar("DATABASE_URL_MIGRACAO precisa estar em .env.producao e em .env.local.");
if (refProd === refHomol) falhar("Origem e destino são a mesma base. Confira .env.producao e .env.local.");
console.log(`📤 Origem (produção): ${refProd}\n📥 Destino (homologação, será substituída): ${refHomol}\n`);

const origem = await conectar(prod.DATABASE_URL_MIGRACAO, ".env.producao");
const destino = await conectar(homol.DATABASE_URL_MIGRACAO, ".env.local");

/** Colunas jsonb/json de cada tabela (o valor lido vem como objeto e precisa voltar como texto JSON). */
async function colunasJson(db) {
  const { rows } = await db.query("select table_name, column_name from information_schema.columns where table_schema = 'public' and data_type in ('json', 'jsonb')");
  const mapa = new Map();
  for (const r of rows) (mapa.get(r.table_name) ?? mapa.set(r.table_name, new Set()).get(r.table_name)).add(r.column_name);
  return mapa;
}

try {
  const tabelas = await tabelasEmOrdem(origem);
  const tabelasDestino = new Set(await tabelasEmOrdem(destino));
  const faltando = tabelas.filter((t) => !tabelasDestino.has(t));
  if (faltando.length) falhar(`A homologação não tem as tabelas: ${faltando.join(", ")}. Rode as migrações (npm run db:migrar) antes.`);

  const naOrigem = await contagens(origem, tabelas);
  const noDestino = await contagens(destino, tabelas);
  console.log(`   ${"tabela".padEnd(32)} produção  homologação`);
  for (const t of tabelas) if (naOrigem[t] || noDestino[t]) console.log(`   ${t.padEnd(32)} ${String(naOrigem[t]).padStart(8)}  ${String(noDestino[t]).padStart(11)}`);

  const stProd = SEM_IMAGENS ? null : storage(prod.SUPABASE_URL, prod.SUPABASE_SERVICE_ROLE_KEY);
  const stHomol = SEM_IMAGENS ? null : storage(homol.SUPABASE_URL, homol.SUPABASE_SERVICE_ROLE_KEY);
  const imagensProd = stProd ? await stProd.listar() : [];
  const imagensHomol = stHomol ? await stHomol.listar() : [];
  if (!SEM_IMAGENS) console.log(`   ${"imagens (Storage)".padEnd(32)} ${String(imagensProd.length).padStart(8)}  ${String(imagensHomol.length).padStart(11)}`);

  if (!CONFIRMAR) {
    console.log("\n👀 Nada foi alterado. Use --confirmar para copiar (a homologação é substituída).");
  } else {
    const backup = await fazerBackup(destino, refHomol);
    console.log(`\n💾 Backup da homologação: ${backup}`);

    const json = await colunasJson(destino);
    await destino.query("BEGIN");
    try {
      await destino.query(`truncate table ${[...tabelas, "sessao"].map((t) => `"${t}"`).join(", ")} restart identity cascade`);
      for (const t of tabelas) {
        const { rows } = await origem.query(`select * from "${t}" order by 1`);
        if (rows.length === 0) continue;
        const colunas = Object.keys(rows[0]);
        const jsonDaTabela = json.get(t) ?? new Set();
        const porLote = Math.max(1, Math.floor(60000 / colunas.length));
        for (let i = 0; i < rows.length; i += porLote) {
          const lote = rows.slice(i, i + porLote);
          const valores = [];
          const tuplas = lote.map((r) => `(${colunas.map((c) => {
            const v = r[c];
            valores.push(jsonDaTabela.has(c) && v !== null ? JSON.stringify(v) : v);
            return "$" + valores.length + (jsonDaTabela.has(c) ? "::jsonb" : "");
          }).join(", ")})`);
          await destino.query(`insert into "${t}" (${colunas.map((c) => `"${c}"`).join(", ")}) overriding system value values ${tuplas.join(", ")}`, valores);
        }
        await ajustarSequencia(destino, `"${t}"`);
        console.log(`   ✅ ${t.padEnd(32)} ${rows.length}`);
      }
      const copiadas = await contagens(destino, tabelas);
      const divergentes = tabelas.filter((t) => copiadas[t] !== naOrigem[t]);
      if (divergentes.length) throw new Error(`Contagens divergentes: ${divergentes.map((t) => `${t} (${naOrigem[t]} → ${copiadas[t]})`).join(", ")}`);
      await destino.query("COMMIT");
    } catch (erro) {
      await destino.query("ROLLBACK").catch(() => undefined);
      throw erro;
    }
    console.log("✅ Banco copiado e conferido.");

    if (!SEM_IMAGENS) {
      for (const caminho of imagensProd) {
        const { bytes, tipo } = await stProd.baixar(caminho);
        await stHomol.enviar(caminho, bytes, tipo);
      }
      const sobrando = imagensHomol.filter((c) => !imagensProd.includes(c));
      if (sobrando.length) await stHomol.remover(sobrando);
      console.log(`✅ Imagens: ${imagensProd.length} copiada(s), ${sobrando.length} removida(s) da homologação.`);
    }
    console.log("\n🎉 Homologação igual à produção.");
  }
} catch (erro) {
  falhar(`Erro (${erro?.code ?? "sem código"}): ${textoDoErro(erro)}. A homologação não foi alterada pelo passo que falhou.`);
} finally {
  await origem.end().catch(() => undefined);
  await destino.end().catch(() => undefined);
}
