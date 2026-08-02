#!/usr/bin/env node
/**
 * Migração — Padronização dos campos de configuração do usuário
 *
 * Renomeia os campos antigos de personalização no documento de cada usuário
 * para os novos nomes padronizados (descritivos e consistentes):
 *
 *   ie_tema                          → config_tema
 *   ds_config_colunas_pf             → config_colunas_pessoa_fisica
 *   ds_config_colunas_admin          → config_colunas_as_usuario
 *   ds_config_colunas_cg_sexo        → config_colunas_cg_sexo
 *   ds_config_colunas_cg_estado_civil→ config_colunas_cg_estado_civil
 *   ds_config_colunas_cg_cor_raca    → config_colunas_cg_cor_raca
 *   ds_config_colunas_cg_profissao   → config_colunas_cg_profissao
 *   ds_config_ordem_menu             → config_ordem_menu_lateral
 *
 * O script é IDEMPOTENTE: só renomeia se o campo antigo existir e o novo ainda
 * não estiver preenchido (o novo prevalece). Campos antigos são removidos após
 * a cópia para não ficarem duplicados.
 *
 * Uso:
 *   node --env-file=.env.local scripts/migrate-usuario-config.mjs
 *
 * Para apenas mostrar o que seria migrado (sem escrever nada):
 *   node --env-file=.env.local scripts/migrate-usuario-config.mjs --dry-run
 */

import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteField } from "firebase/firestore";

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
      "   Rode com: node --env-file=.env.local scripts/migrate-usuario-config.mjs"
  );
  process.exit(1);
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

/* Mapeamento: campo antigo → campo novo padronizado */
const MAPA_CAMPOS = {
  ie_tema: "config_tema",
  ds_config_colunas_pf: "config_colunas_pessoa_fisica",
  ds_config_colunas_admin: "config_colunas_as_usuario",
  /* nome intermediário já gravado por uma execução anterior — padroniza para o definitivo */
  config_colunas_administracao_sistema: "config_colunas_as_usuario",
  ds_config_colunas_cg_sexo: "config_colunas_cg_sexo",
  ds_config_colunas_cg_estado_civil: "config_colunas_cg_estado_civil",
  ds_config_colunas_cg_cor_raca: "config_colunas_cg_cor_raca",
  ds_config_colunas_cg_profissao: "config_colunas_cg_profissao",
  ds_config_ordem_menu: "config_ordem_menu_lateral",
};

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  console.log("🔄 Migração — padronização dos campos de configuração do usuário\n");

  const snap = await getDocs(collection(db, "usuario"));
  if (snap.size === 0) {
    console.log("ℹ️  Nenhum usuário encontrado — nada a migrar.");
    process.exit(0);
  }

  let migrados = 0;
  let inalterados = 0;

  for (const d of snap.docs) {
    const data = d.data();
    const updates = {};
    const deletes = [];
    let temMudanca = false;

    for (const [campoAntigo, campoNovo] of Object.entries(MAPA_CAMPOS)) {
      const valorAntigo = data[campoAntigo];
      const valorNovo = data[campoNovo];
      if (valorAntigo === undefined) continue;
      if (valorNovo !== undefined) {
        // O novo já existe — remove apenas o antigo duplicado
        deletes.push(campoAntigo);
        temMudanca = true;
        continue;
      }
      updates[campoNovo] = valorAntigo;
      deletes.push(campoAntigo);
      temMudanca = true;
    }

    if (!temMudanca) {
      inalterados += 1;
      continue;
    }

    for (const campoAntigo of deletes) {
      updates[campoAntigo] = deleteField();
    }

    const usr = data.ds_usuario || data.ds_usuario_alternativo || d.id;
    const qtdRenomeados = Object.keys(updates).filter((k) => !deletes.includes(k)).length;
    console.log(
      `  • ${usr}: ${qtdRenomeados} campo(s) renomeado(s)`
    );

    if (!DRY_RUN) {
      await updateDoc(doc(db, "usuario", d.id), updates);
    }
    migrados += 1;
  }

  if (DRY_RUN) {
    console.log(`\n👀 Dry-run: ${migrados} usuário(s) seriam migrados (${inalterados} sem mudança). Nada foi escrito.`);
  } else {
    console.log(`\n✅ Concluído: ${migrados} usuário(s) migrado(s), ${inalterados} sem mudança.`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erro ao executar a migração:", err?.message ?? err);
  process.exit(1);
});
