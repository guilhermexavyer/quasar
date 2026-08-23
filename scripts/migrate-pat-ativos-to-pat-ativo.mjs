#!/usr/bin/env node
/**
 * Migração — Renomeação da coleção pat_ativos → pat_ativo
 *
 * 1. Move TODOS os documentos da coleção "pat_ativos" para "pat_ativo",
 *    incluindo a subcollection "auditoria" de cada documento.
 * 2. Migra o contador de sequência (_counters/pat_ativos_sequence → pat_ativo_sequence).
 * 3. Renomeia o campo config_colunas_pat_ativos → config_colunas_pat_ativo
 *    em todos os documentos da coleção "usuario".
 *
 * O script é IDEMPOTENTE: pula documentos que já existem na coleção destino.
 *
 * Uso:
 *   node --env-file=.env.local scripts/migrate-pat-ativos-to-pat-ativo.mjs
 *
 * Para apenas mostrar o que seria migrado (sem escrever nada):
 *   node --env-file=.env.local scripts/migrate-pat-ativos-to-pat-ativo.mjs --dry-run
 */

import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  deleteField,
} from "firebase/firestore";

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
      "   Rode com: node --env-file=.env.local scripts/migrate-pat-ativos-to-pat-ativo.mjs"
  );
  process.exit(1);
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const OLD_COLLECTION = "pat_ativos";
const NEW_COLLECTION = "pat_ativo";
const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  console.log(`🔄 Migração — ${OLD_COLLECTION} → ${NEW_COLLECTION}\n`);

  // ═══════════════════════════════════════════════════════════
  //  1. Migrar documentos da coleção de ativos
  // ═══════════════════════════════════════════════════════════
  const oldSnap = await getDocs(collection(db, OLD_COLLECTION));
  if (oldSnap.size === 0) {
    console.log(`ℹ️  Nenhum documento encontrado em "${OLD_COLLECTION}" — nada a migrar.`);
  } else {
    console.log(`📋 ${oldSnap.size} documento(s) encontrado(s) em "${OLD_COLLECTION}"\n`);

    let migrados = 0;
    let pulados = 0;
    let auditoriaTotal = 0;

    for (const oldDoc of oldSnap.docs) {
      const data = oldDoc.data();
      const newDocRef = doc(db, NEW_COLLECTION, oldDoc.id);

      // Verificar se já existe no destino
      const existing = await getDoc(newDocRef);
      if (existing.exists()) {
        console.log(`  ⏭️  ${oldDoc.id} — já existe em "${NEW_COLLECTION}", pulando...`);
        pulados += 1;
      } else {
        if (!DRY_RUN) {
          await setDoc(newDocRef, data);
        }
        console.log(`  ✅ ${oldDoc.id} — migrado`);
        migrados += 1;
      }

      // Migrar subcollection "auditoria"
      try {
        const auditSnap = await getDocs(collection(db, OLD_COLLECTION, oldDoc.id, "auditoria"));
        if (auditSnap.size > 0) {
          let auditMigrados = 0;

          for (const auditDoc of auditSnap.docs) {
            const auditData = auditDoc.data();
            const newAuditRef = doc(db, NEW_COLLECTION, oldDoc.id, "auditoria", auditDoc.id);

            // Pular se já existe
            const existingAudit = await getDoc(newAuditRef);
            if (!existingAudit.exists()) {
              if (!DRY_RUN) {
                await setDoc(newAuditRef, auditData);
              }
              auditMigrados += 1;
            }
          }

          auditoriaTotal += auditMigrados;
          if (auditMigrados > 0) {
            console.log(`    📎 ${auditMigrados} registro(s) de auditoria migrado(s)`);
          }
        }
      } catch (err) {
        console.log(`    ⚠️  Erro ao migrar auditoria de ${oldDoc.id}: ${err.message}`);
      }
    }

    console.log(`\n  Resumo ativos: ${migrados} migrado(s), ${pulados} já existiam, ${auditoriaTotal} auditorias migradas`);
  }

  // ═══════════════════════════════════════════════════════════
  //  2. Migrar contador de sequência
  // ═══════════════════════════════════════════════════════════
  console.log("\n─".repeat(50));
  try {
    const oldCounterRef = doc(db, "_counters", `${OLD_COLLECTION}_sequence`);
    const oldCounterSnap = await getDoc(oldCounterRef);

    if (oldCounterSnap.exists()) {
      const counterData = oldCounterSnap.data();
      const newCounterRef = doc(db, "_counters", `${NEW_COLLECTION}_sequence`);
      const existingCounter = await getDoc(newCounterRef);

      if (!existingCounter.exists()) {
        if (!DRY_RUN) {
          await setDoc(newCounterRef, counterData);
        }
        console.log(`🔢 Contador migrado: ${OLD_COLLECTION}_sequence → ${NEW_COLLECTION}_sequence`);
      } else {
        console.log(`🔢 Contador ${NEW_COLLECTION}_sequence já existe — mantido`);
      }
    } else {
      console.log(`ℹ️  Contador ${OLD_COLLECTION}_sequence não encontrado`);
    }
  } catch (err) {
    console.log(`⚠️  Erro ao migrar contador: ${err.message}`);
  }

  // ═══════════════════════════════════════════════════════════
  //  3. Renomear campo config no usuário
  // ═══════════════════════════════════════════════════════════
  console.log("\n─".repeat(50));
  console.log("👤 Renomeando config_colunas_pat_ativos → config_colunas_pat_ativo nos usuários\n");

  const OLD_FIELD = "config_colunas_pat_ativos";
  const NEW_FIELD = "config_colunas_pat_ativo";

  const userSnap = await getDocs(collection(db, "usuario"));
  let usuariosMigrados = 0;
  let usuariosSemMudanca = 0;

  for (const userDoc of userSnap.docs) {
    const data = userDoc.data();
    const oldVal = data[OLD_FIELD];

    if (oldVal === undefined) {
      usuariosSemMudanca += 1;
      continue;
    }

    const updates = {};
    updates[NEW_FIELD] = oldVal;
    updates[OLD_FIELD] = deleteField();

    const usr = data.ds_usuario || data.ds_usuario_alternativo || userDoc.id;
    console.log(`  • ${usr}: campo renomeado`);

    if (!DRY_RUN) {
      await setDoc(doc(db, "usuario", userDoc.id), updates, { merge: true });
    }
    usuariosMigrados += 1;
  }

  console.log(`\n  Resumo usuários: ${usuariosMigrados} migrado(s), ${usuariosSemMudanca} sem mudança`);

  // ═══════════════════════════════════════════════════════════
  //  Resumo final
  // ═══════════════════════════════════════════════════════════
  console.log("\n" + "═".repeat(50));
  if (DRY_RUN) {
    console.log("👀 Dry-run concluído. Nada foi escrito.");
  } else {
    console.log("✅ Migração concluída com sucesso!");
  }
  console.log("═".repeat(50));

  if (!DRY_RUN) {
    console.log(`\n⚠️  IMPORTANTE: Os dados foram copiados, mas a coleção antiga "${OLD_COLLECTION}"`);
    console.log(`   NÃO foi removida automaticamente. Após validar, remova manualmente no Firebase Console.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erro ao executar a migração:", err?.message ?? err);
  process.exit(1);
});
