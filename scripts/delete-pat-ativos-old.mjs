#!/usr/bin/env node
/**
 * Exclui a coleção antiga "pat_ativos" do Firestore.
 * Execute APÓS validar que a migração pat_ativos → pat_ativo foi bem-sucedida.
 *
 * Uso:
 *   node --env-file=.env.local scripts/delete-pat-ativos-old.mjs
 *
 * Dry-run:
 *   node --env-file=.env.local scripts/delete-pat-ativos-old.mjs --dry-run
 */

import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  deleteDoc,
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
  console.error("❌ Variáveis NEXT_PUBLIC_FIREBASE_* não encontradas.");
  process.exit(1);
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const DRY_RUN = process.argv.includes("--dry-run");
const COLLECTION = "pat_ativos";

async function deleteSubcollections(docRef) {
  // Excluir subcollection "auditoria"
  const auditSnap = await getDocs(collection(db, COLLECTION, docRef.id, "auditoria"));
  for (const auditDoc of auditSnap.docs) {
    if (!DRY_RUN) {
      await deleteDoc(doc(db, COLLECTION, docRef.id, "auditoria", auditDoc.id));
    }
  }
  return auditSnap.size;
}

async function main() {
  console.log(`🗑️  Excluindo coleção antiga "${COLLECTION}"\n`);

  const snap = await getDocs(collection(db, COLLECTION));
  if (snap.size === 0) {
    console.log(`ℹ️  Coleção "${COLLECTION}" já está vazia ou não existe.`);
    process.exit(0);
  }

  console.log(`📋 ${snap.size} documento(s) encontrado(s)\n`);

  let excluidos = 0;
  let auditoriasExcluidas = 0;

  for (const d of snap.docs) {
    const auditCount = await deleteSubcollections(d);
    auditoriasExcluidas += auditCount;

    if (!DRY_RUN) {
      await deleteDoc(doc(db, COLLECTION, d.id));
    }
    console.log(`  🗑️  ${d.id} — excluído (${auditCount} auditorias)`);
    excluidos += 1;
  }

  console.log(`\n${"═".repeat(50)}`);
  if (DRY_RUN) {
    console.log(`👀 Dry-run: ${excluidos} documento(s) e ${auditoriasExcluidas} auditorias seriam excluídos.`);
  } else {
    console.log(`✅ Concluído: ${excluidos} documento(s) e ${auditoriasExcluidas} auditorias excluídos.`);
  }
  console.log("═".repeat(50));

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erro:", err?.message ?? err);
  process.exit(1);
});
