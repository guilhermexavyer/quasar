#!/usr/bin/env node
/**
 * Exporta os Cadastros Gerais (coleções cg_*) para scripts/dados/cadastros-gerais.json,
 * arquivo usado pelo seeder seed-cadastros-gerais.mjs.
 *
 * Grava só os campos de negócio e o nr_sequencia original (outros registros
 * apontam para os cadastros gerais por ele). Campos de controle (dt_criacao,
 * dt_alteracao, ds_usuario_*) ficam de fora: o seeder grava os da implantação.
 * Só lê o banco; não altera nada.
 *
 * Uso:
 *   node --env-file=.env.producao scripts/exportar-cadastros-gerais.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  console.error("❌ Variáveis NEXT_PUBLIC_FIREBASE_* não encontradas. Rode com: node --env-file=.env.producao scripts/exportar-cadastros-gerais.mjs");
  process.exit(1);
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const COLECOES_CG = [
  "cg_sexo", "cg_estado_civil", "cg_cor_raca", "cg_profissao", "cg_orgao_emissor",
  "cg_logradouro", "cg_grau_parentesco", "cg_cargo", "cg_vinculo_contratual",
  "cg_localizacao", "cg_marca", "cg_categoria_ativo", "cg_sistema_operacional",
];
const CAMPOS_CONTROLE = new Set(["id", "_firestoreId", "dt_criacao", "dt_alteracao", "ds_usuario_criacao", "ds_usuario_alteracao"]);
const ARQUIVO = "scripts/dados/cadastros-gerais.json";

async function main() {
  console.log(`📤 Exportação dos Cadastros Gerais — projeto "${firebaseConfig.projectId}"\n`);
  const dados = {};
  let total = 0;
  for (const nome of COLECOES_CG) {
    const snap = await getDocs(collection(db, nome));
    dados[nome] = snap.docs
      .map((d) => Object.fromEntries(Object.entries(d.data()).filter(([k]) => !CAMPOS_CONTROLE.has(k))))
      .sort((a, b) => (a.nr_sequencia ?? 0) - (b.nr_sequencia ?? 0));
    total += dados[nome].length;
    console.log(`   ${nome}: ${dados[nome].length}`);
  }
  mkdirSync("scripts/dados", { recursive: true });
  writeFileSync(ARQUIVO, JSON.stringify(dados, null, 2) + "\n", "utf-8");
  console.log(`\n💾 ${total} registro(s) gravados em ${ARQUIVO}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erro na exportação:", err?.message ?? err);
  process.exit(1);
});
