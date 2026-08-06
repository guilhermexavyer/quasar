#!/usr/bin/env node
/**
 * Script de manutenção (one-off) — renumera os registros de cg_grau_parentesco
 * na ordem da lista oficial (ordem alfabética, com "Outro" por último), para
 * que a listagem do sistema (ordenada por nr_sequencia) exiba na ordem correta.
 *
 * Uso:
 *   node --env-file=.env.local scripts/reordenar-graus-parentesco.mjs
 */

import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  writeBatch,
  doc,
  setDoc,
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
      "   Rode com: node --env-file=.env.local scripts/reordenar-graus-parentesco.mjs"
  );
  process.exit(1);
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

/* Ordem oficial (alfabética, com "Outro" por último) — igual ao seeder */
const GRAUS_ORDEM = [
  "Avó",
  "Avô",
  "Companheira",
  "Companheiro",
  "Curadora",
  "Curador",
  "Enteada",
  "Enteado",
  "Guardiã",
  "Guardião",
  "Irmã",
  "Irmão",
  "Madrasta",
  "Mãe",
  "Mãe adotiva",
  "Pai",
  "Pai adotivo",
  "Padrasto",
  "Prima",
  "Primo",
  "Responsável legal",
  "Tia",
  "Tio",
  "Tutora",
  "Tutor",
  "Outro",
];

async function main() {
  const colRef = collection(db, "cg_grau_parentesco");
  const snap = await getDocs(colRef);

  const porNome = new Map();
  for (const d of snap.docs) {
    porNome.set(String(d.data().ds_grau_parentesco ?? "").trim(), d);
  }

  const batch = writeBatch(db);
  let renum = 0;
  let seq = 1;
  for (const nome of GRAUS_ORDEM) {
    const d = porNome.get(nome);
    if (!d) {
      console.warn(`⚠️  Não encontrado na coleção: ${nome}`);
      continue;
    }
    if (Number(d.data().nr_sequencia) !== seq) {
      batch.update(doc(db, "cg_grau_parentesco", d.id), { nr_sequencia: seq });
      renum += 1;
    }
    seq += 1;
  }

  if (renum > 0) {
    await batch.commit();
  }

  // Sincroniza o contador para o próximo cadastro pela tela continuar correto
  await setDoc(
    doc(db, "_counters", "cg_grau_parentesco_sequence"),
    { current: seq - 1 },
    { merge: true }
  );

  // Verificação: lista final na ordem de nr_sequencia
  const final = await getDocs(colRef);
  const linhas = final.docs
    .map((d) => ({ seq: Number(d.data().nr_sequencia), nome: d.data().ds_grau_parentesco }))
    .sort((a, b) => a.seq - b.seq)
    .map((r) => `${r.seq}. ${r.nome}`);
  console.log(`✅ ${renum} registro(s) renumerado(s) (${snap.size} total)\n`);
  console.log("Ordem final na listagem:");
  console.log(linhas.join("\n"));
}

main().catch((err) => {
  console.error("❌ Erro ao executar:", err?.message ?? err);
  process.exit(1);
});
