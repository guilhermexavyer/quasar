#!/usr/bin/env node
/** Inspeção read-only do documento pat_param_codigo_patrimonio + auditoria. */
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";

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

const snap = await getDocs(collection(db, "pat_param_codigo_patrimonio"));
for (const d of snap.docs) {
  console.log("DOC", d.id, JSON.stringify(d.data(), null, 2));
  const aud = await getDocs(collection(db, "pat_param_codigo_patrimonio", d.id, "auditoria"));
  console.log("auditoria:", aud.size, "entries");
  aud.docs.forEach((a) => console.log("  -", JSON.stringify(a.data())));
}
