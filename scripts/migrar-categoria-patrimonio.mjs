#!/usr/bin/env node
/**
 * Migração — Categoria (ativo) de Cadastros Gerais para Patrimônio
 *
 * A coleção mudou de nome: cg_categoria_ativo → pat_categoria. O Firestore não
 * renomeia coleções, então este script copia, com os mesmos IDs:
 *   - os documentos e a subcoleção auditoria de cada um;
 *   - o contador (_counters/cg_categoria_ativo_sequence → pat_categoria_sequence);
 *   - a configuração de colunas dos usuários (config_colunas_cg_categoria_ativo
 *     → config_colunas_pat_categoria);
 *   - o status dos campos nos perfis (config_campos / config_campos_alteracao:
 *     "cg_categoria_ativo.*" → "pat_categoria.*").
 * As permissões dos perfis são migradas pelo próprio sistema (PERMISSOES_MOVIDAS).
 *
 * Sem --confirmar, só mostra o que seria feito. A coleção antiga só é apagada
 * com --apagar-antiga (rode depois de conferir o sistema com a nova).
 *
 * Uso (um banco por vez — o .env escolhe qual):
 *   node --env-file=.env.local    scripts/migrar-categoria-patrimonio.mjs               → simula (homologação)
 *   node --env-file=.env.local    scripts/migrar-categoria-patrimonio.mjs --confirmar   → copia
 *   node --env-file=.env.local    scripts/migrar-categoria-patrimonio.mjs --apagar-antiga --confirmar
 *   node --env-file=.env.producao scripts/migrar-categoria-patrimonio.mjs ...          → produção
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, writeBatch, deleteField } from "firebase/firestore";

const ANTIGA = "cg_categoria_ativo";
const NOVA = "pat_categoria";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
if (!firebaseConfig.projectId) {
  console.error("❌ Variáveis NEXT_PUBLIC_FIREBASE_* não encontradas. Rode com node --env-file=<arquivo .env> ...");
  process.exit(1);
}
const db = getFirestore(initializeApp(firebaseConfig));
const CONFIRMAR = process.argv.includes("--confirmar");
const APAGAR_ANTIGA = process.argv.includes("--apagar-antiga");

/** Grava em lotes de até 450 operações (limite do Firestore: 500 por lote). */
async function gravarEmLotes(operacoes) {
  for (let i = 0; i < operacoes.length; i += 450) {
    const batch = writeBatch(db);
    for (const op of operacoes.slice(i, i + 450)) op(batch);
    await batch.commit();
  }
}

/** Troca o prefixo das chaves "cg_categoria_ativo.*" de um JSON de configuração. */
function renomearChaves(raw) {
  if (!raw) return null;
  let obj;
  try { obj = JSON.parse(raw); } catch { return null; }
  if (!obj || typeof obj !== "object") return null;
  let mudou = false;
  const novo = {};
  for (const [k, v] of Object.entries(obj)) {
    const chave = k.startsWith(`${ANTIGA}.`) ? `${NOVA}.${k.slice(ANTIGA.length + 1)}` : k;
    if (chave !== k) mudou = true;
    novo[chave] = v;
  }
  return mudou ? JSON.stringify(novo) : null;
}

async function main() {
  console.log(`📦 ${ANTIGA} → ${NOVA} no projeto "${firebaseConfig.projectId}"${CONFIRMAR ? "" : " (simulação)"}\n`);
  const ops = [];

  // 1. Documentos + auditoria
  const antigos = await getDocs(collection(db, ANTIGA));
  const jaNaNova = await getDocs(collection(db, NOVA));
  let logs = 0;
  if (jaNaNova.size > 0) {
    console.log(`ℹ️  ${NOVA} já tem ${jaNaNova.size} documento(s): a cópia é pulada (já migrado).`);
  } else {
    for (const d of antigos.docs) {
      ops.push((b) => b.set(doc(db, NOVA, d.id), d.data()));
      const auditoria = await getDocs(collection(db, ANTIGA, d.id, "auditoria"));
      logs += auditoria.size;
      for (const log of auditoria.docs) ops.push((b) => b.set(doc(db, NOVA, d.id, "auditoria", log.id), log.data()));
    }
    console.log(`   documentos: ${antigos.size} (com ${logs} log(s) de auditoria)`);

    // 2. Contador
    const contador = await getDoc(doc(db, "_counters", `${ANTIGA}_sequence`));
    if (contador.exists()) {
      ops.push((b) => b.set(doc(db, "_counters", `${NOVA}_sequence`), contador.data(), { merge: true }));
      console.log(`   contador: ${JSON.stringify(contador.data())}`);
    }
  }

  // 3. Colunas salvas nos usuários
  let usuarios = 0;
  for (const u of (await getDocs(collection(db, "usuario"))).docs) {
    const valor = u.data()[`config_colunas_${ANTIGA}`];
    if (valor === undefined) continue;
    usuarios++;
    ops.push((b) => b.update(u.ref, { [`config_colunas_${NOVA}`]: valor, [`config_colunas_${ANTIGA}`]: deleteField() }));
  }
  console.log(`   usuários com colunas salvas: ${usuarios}`);

  // 4. Status dos campos nos perfis
  let perfis = 0;
  for (const p of (await getDocs(collection(db, "perfil"))).docs) {
    const campos = renomearChaves(p.data().config_campos);
    const alteracao = renomearChaves(p.data().config_campos_alteracao);
    if (!campos && !alteracao) continue;
    perfis++;
    ops.push((b) => b.update(p.ref, { ...(campos ? { config_campos: campos } : {}), ...(alteracao ? { config_campos_alteracao: alteracao } : {}) }));
  }
  console.log(`   perfis com status de campos: ${perfis}`);

  // 5. Apagar a coleção antiga (opcional, depois de conferir)
  if (APAGAR_ANTIGA) {
    if (jaNaNova.size === 0 && antigos.size > 0 && !CONFIRMAR) {
      console.log("   (a cópia ainda não foi feita: a antiga só seria apagada junto com a cópia)");
    }
    for (const d of antigos.docs) {
      for (const log of (await getDocs(collection(db, ANTIGA, d.id, "auditoria"))).docs) ops.push((b) => b.delete(log.ref));
      ops.push((b) => b.delete(d.ref));
    }
    ops.push((b) => b.delete(doc(db, "_counters", `${ANTIGA}_sequence`)));
    console.log(`   🗑️  ${ANTIGA} será apagada (${antigos.size} documento(s) e auditoria)`);
  }

  if (!CONFIRMAR) {
    console.log(`\n👀 Nada foi gravado (${ops.length} operação(ões)). Rode de novo com --confirmar.`);
    return;
  }
  await gravarEmLotes(ops);
  console.log(`\n✅ Concluído (${ops.length} operação(ões)).`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Erro na migração:", e);
    process.exit(1);
  });
