#!/usr/bin/env node
/**
 * Limpeza TOTAL do banco (PostgreSQL/Supabase).
 *
 * Apaga todos os registros de todas as tabelas de dados (inclusive auditoria,
 * exclusões e sessões) e reinicia a numeração (nr_sequencia). O esquema
 * (tabelas e colunas) fica. Antes de apagar, grava um backup completo em JSON
 * na pasta backups/ (ignorada pelo git). As imagens do Storage não são
 * apagadas, a menos que se use --com-imagens.
 *
 * Uso:
 *   node --env-file=.env.local scripts/limpar-banco.mjs                              → só mostra o que seria apagado
 *   node --env-file=.env.local scripts/limpar-banco.mjs --confirmar                  → faz backup e APAGA tudo
 *   node --env-file=.env.local scripts/limpar-banco.mjs --confirmar --com-imagens    → também apaga as imagens do Storage
 */
import { conectar, contagens, falhar, fazerBackup, refDaBase, storage, tabelasEmOrdem, textoDoErro } from "./lib/conexao.mjs";

const CONFIRMAR = process.argv.includes("--confirmar");
const COM_IMAGENS = process.argv.includes("--com-imagens");

const db = await conectar();
try {
  const ref = refDaBase(process.env.DATABASE_URL_MIGRACAO);
  const tabelas = await tabelasEmOrdem(db);
  const antes = await contagens(db, [...tabelas, "sessao"]);
  const total = Object.values(antes).reduce((a, b) => a + b, 0);
  for (const [t, n] of Object.entries(antes)) if (n > 0) console.log(`   ${t.padEnd(32)} ${n}`);
  console.log(`   Total: ${total} registro(s)`);

  const st = COM_IMAGENS ? storage(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null;
  const imagens = st ? await st.listar() : [];
  if (st) console.log(`   Imagens no Storage: ${imagens.length}`);

  if (!CONFIRMAR) {
    console.log("\n👀 Nada foi apagado. Use --confirmar para fazer o backup e apagar.");
  } else {
    const backup = await fazerBackup(db, ref);
    console.log(`💾 Backup: ${backup}`);
    await db.query(`truncate table ${[...tabelas, "sessao"].map((t) => `"${t}"`).join(", ")} restart identity cascade`);
    const depois = await contagens(db, [...tabelas, "sessao"]);
    const restante = Object.values(depois).reduce((a, b) => a + b, 0);
    if (restante !== 0) falhar(`Sobraram ${restante} registro(s).`);
    if (st && imagens.length) await st.remover(imagens);
    console.log(`\n🧹 Banco limpo${st ? ` e ${imagens.length} imagem(ns) removida(s)` : ""}. Rode os seeders para recriar o básico.`);
  }
} catch (erro) {
  falhar(`Erro (${erro?.code ?? "sem código"}): ${textoDoErro(erro)}`);
} finally {
  await db.end().catch(() => undefined);
}
