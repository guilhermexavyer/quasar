#!/usr/bin/env node
/**
 * Exclui o contador antigo _counters/pat_ativos_sequence
 */

import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, deleteDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

async function main() {
  const ref = doc(db, "_counters", "pat_ativos_sequence");
  const snap = await getDoc(ref);
  
  if (!snap.exists()) {
    console.log("ℹ️  _counters/pat_ativos_sequence já não existe.");
    return;
  }
  
  console.log(`🗑️  Excluindo _counters/pat_ativos_sequence (valor: ${JSON.stringify(snap.data())})`);
  await deleteDoc(ref);
  console.log("✅ Excluído.");
}

main().catch((err) => {
  console.error("❌ Erro:", err?.message ?? err);
  process.exit(1);
});
