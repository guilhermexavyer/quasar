#!/usr/bin/env node
/**
 * Seeder — Cadastros Gerais
 *
 * Recria os Cadastros Gerais (coleções cg_*) a partir de
 * scripts/dados/cadastros-gerais.json, mantendo o nr_sequencia original de
 * cada item. Para cada registro grava a auditoria de criação e, por coleção,
 * ajusta o contador (_counters/<colecao>_sequence) para o maior nr_sequencia.
 *
 * O script é IDEMPOTENTE: uma coleção que já tem registros é pulada inteira,
 * para não duplicar itens. Use depois de limpar a base (db:limpar).
 *
 * Para atualizar o arquivo de dados com os cadastros atuais de uma base:
 *   node --env-file=.env.producao scripts/exportar-cadastros-gerais.mjs
 *
 * Uso:
 *   node --env-file=.env.local scripts/seed-cadastros-gerais.mjs
 *   node --env-file=.env.local scripts/seed-cadastros-gerais.mjs --dry-run   → só mostra o que seria feito
 */
import { readFileSync } from "node:fs";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, doc, query, limit, writeBatch } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  console.error(
    "❌ Variáveis NEXT_PUBLIC_FIREBASE_* não encontradas.\n" +
      "   Rode com: node --env-file=.env.local scripts/seed-cadastros-gerais.mjs"
  );
  process.exit(1);
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const DRY_RUN = process.argv.includes("--dry-run");

/** Implantação: usuário e data de criação dos registros do seeder (mesmo padrão de seed.mjs) */
const USUARIO_IMPLANTACAO = "implantacao";
const DATA_IMPLANTACAO = new Date().toISOString();

const ARQUIVO = "scripts/dados/cadastros-gerais.json";
/** Cada registro gera 2 escritas (documento + auditoria): 200 registros = 400 operações por lote (limite 500). */
const REGISTROS_POR_LOTE = 200;

async function semearColecao(nome, itens) {
  const existentes = await getDocs(query(collection(db, nome), limit(1)));
  if (!existentes.empty) {
    console.log(`ℹ️  ${nome}: já tem registros — pulada (nada inserido)`);
    return 0;
  }
  if (DRY_RUN) {
    console.log(`👀 ${nome}: ${itens.length} registro(s) seriam inseridos`);
    return itens.length;
  }

  for (let i = 0; i < itens.length; i += REGISTROS_POR_LOTE) {
    const batch = writeBatch(db);
    for (const item of itens.slice(i, i + REGISTROS_POR_LOTE)) {
      const dados = {
        ...item,
        dt_criacao: DATA_IMPLANTACAO,
        dt_alteracao: DATA_IMPLANTACAO,
        ds_usuario_criacao: USUARIO_IMPLANTACAO,
        ds_usuario_alteracao: USUARIO_IMPLANTACAO,
      };
      const ref = doc(collection(db, nome));
      batch.set(ref, dados);
      batch.set(doc(collection(db, nome, ref.id, "auditoria")), {
        usuarioId: null,
        usuarioNome: USUARIO_IMPLANTACAO,
        acao: "create",
        timestamp: DATA_IMPLANTACAO,
        detalhes: dados,
      });
    }
    await batch.commit();
  }

  // Contador: o próximo cadastro continua depois do maior nr_sequencia
  const maior = itens.reduce((max, it) => Math.max(max, Number(it.nr_sequencia) || 0), 0);
  const batchContador = writeBatch(db);
  batchContador.set(doc(db, "_counters", `${nome}_sequence`), { current: maior }, { merge: true });
  await batchContador.commit();

  console.log(`✅ ${nome}: ${itens.length} registro(s) inseridos (contador em ${maior})`);
  return itens.length;
}

async function main() {
  console.log(`🌱 Seeder — Cadastros Gerais — projeto "${firebaseConfig.projectId}"${DRY_RUN ? " (dry-run)" : ""}\n`);
  const dados = JSON.parse(readFileSync(ARQUIVO, "utf-8"));
  let total = 0;
  for (const [nome, itens] of Object.entries(dados)) {
    total += await semearColecao(nome, itens);
  }
  console.log(DRY_RUN ? `\n👀 Dry-run concluído. ${total} registro(s) seriam inseridos; nada foi escrito.` : `\n🎉 Concluído! ${total} registro(s) inseridos.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erro ao executar o seeder:", err?.message ?? err);
  console.error(
    "   Verifique se as regras de segurança do Firestore permitem escrita " +
      "e se as credenciais estão corretas."
  );
  process.exit(1);
});
