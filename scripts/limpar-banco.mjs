#!/usr/bin/env node
/**
 * Limpeza TOTAL do banco de dados (Firestore).
 *
 * Apaga todos os documentos de todas as coleções do sistema, as subcoleções
 * "auditoria" (inclusive as órfãs, via collectionGroup) e os contadores
 * (_counters). Antes de apagar, grava um backup completo em JSON na pasta
 * backups/ (ignorada pelo git).
 *
 * O SDK cliente do Firebase não lista coleções raiz, por isso a lista abaixo
 * precisa acompanhar as coleções usadas pelo sistema.
 *
 * Uso:
 *   node --env-file=.env.local scripts/limpar-banco.mjs              → só mostra o que seria apagado
 *   node --env-file=.env.local scripts/limpar-banco.mjs --confirmar  → faz backup e APAGA tudo
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, collectionGroup, getDocs, writeBatch } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  console.error("❌ Variáveis NEXT_PUBLIC_FIREBASE_* não encontradas. Rode com: node --env-file=.env.local scripts/limpar-banco.mjs");
  process.exit(1);
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const CONFIRMAR = process.argv.includes("--confirmar");

const COLECOES = [
  "_counters",
  "pessoa_fisica", "pessoa_juridica",
  "aluno", "colaborador",
  "pat_ativo", "pat_ativos", "pat_manutencao", "pat_param_codigo_patrimonio",
  "perfil", "usuario", "imagem", "aviso",
  "relatorio", "relatorio_banda", "relatorio_bandas", "relatorio_banda_elemento", "relatorio_parametro",
  "cg_sexo", "cg_estado_civil", "cg_cor_raca", "cg_profissao", "cg_orgao_emissor",
  "cg_logradouro", "cg_grau_parentesco", "cg_cargo", "cg_vinculo_contratual",
  "cg_localizacao", "cg_marca", "pat_categoria", "cg_categoria_ativo" /* antiga, renomeada para pat_categoria */, "cg_sistema_operacional",
];

/** Apaga documentos em lotes (limite do Firestore: 500 operações por batch). */
async function apagarDocs(docs) {
  const LOTE = 450;
  for (let i = 0; i < docs.length; i += LOTE) {
    const batch = writeBatch(db);
    for (const d of docs.slice(i, i + LOTE)) batch.delete(d.ref);
    await batch.commit();
  }
}

async function main() {
  console.log(`🧹 Limpeza do banco — projeto "${firebaseConfig.projectId}"${CONFIRMAR ? "" : " (simulação)"}\n`);

  // 1) Leitura de tudo (para backup e contagem)
  const backup = { projeto: firebaseConfig.projectId, data: new Date().toISOString(), colecoes: {}, auditoria: {} };
  const snaps = {};
  for (const nome of COLECOES) {
    const snap = await getDocs(collection(db, nome));
    snaps[nome] = snap;
    backup.colecoes[nome] = Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]));
  }
  const auditSnap = await getDocs(collectionGroup(db, "auditoria"));
  for (const d of auditSnap.docs) backup.auditoria[d.ref.path] = d.data();

  let total = auditSnap.size;
  for (const nome of COLECOES) {
    const n = snaps[nome].size;
    total += n;
    if (n > 0) console.log(`   ${nome}: ${n}`);
  }
  console.log(`   auditoria (todas as subcoleções): ${auditSnap.size}`);
  console.log(`\n   Total: ${total} documento(s)`);

  if (!CONFIRMAR) {
    console.log("\nℹ️  Nada foi apagado. Para apagar, rode novamente com --confirmar.");
    process.exit(0);
  }

  // 2) Backup
  mkdirSync("backups", { recursive: true });
  const arquivo = `backups/backup-${backup.data.replace(/[:.]/g, "-")}.json`;
  writeFileSync(arquivo, JSON.stringify(backup, null, 2), "utf-8");
  console.log(`\n💾 Backup gravado em ${arquivo}`);

  // 3) Exclusão: auditorias primeiro, depois os documentos de cada coleção
  await apagarDocs(auditSnap.docs);
  console.log(`🗑️  auditoria: ${auditSnap.size} apagados`);
  for (const nome of COLECOES) {
    const docs = snaps[nome].docs;
    if (docs.length === 0) continue;
    await apagarDocs(docs);
    console.log(`🗑️  ${nome}: ${docs.length} apagados`);
  }

  // 4) Verificação
  let restantes = (await getDocs(collectionGroup(db, "auditoria"))).size;
  for (const nome of COLECOES) restantes += (await getDocs(collection(db, nome))).size;
  console.log(restantes === 0 ? "\n✅ Banco limpo." : `\n⚠️  Restaram ${restantes} documento(s).`);
  process.exit(restantes === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("❌ Erro na limpeza:", err?.message ?? err);
  process.exit(1);
});
