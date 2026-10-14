#!/usr/bin/env node
/**
 * Seeder — Implantação inicial
 *
 * Cria apenas o mínimo para acessar o sistema:
 *   - perfil  → 'Administrador', com todas as funções liberadas. Sem
 *               config_permissoes: o sistema trata a ausência como "tudo
 *               liberado", inclusive permissões criadas no futuro.
 *   - usuario → 'administrador' (senha em SHA-256, mesmo formato do login),
 *               vinculado ao perfil 'Administrador' (também como perfil ativo).
 *
 * O script é IDEMPOTENTE: se o perfil/usuário já existirem, não são recriados
 * (apenas o vínculo do usuário com o perfil é garantido).
 *
 * Uso:
 *   node --env-file=.env.local scripts/seed.mjs
 *   node --env-file=.env.local scripts/seed.mjs --dry-run   → só mostra o que seria feito
 */

import { createHash } from "node:crypto";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, addDoc } from "firebase/firestore";

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
      "   Rode com: node --env-file=.env.local scripts/seed.mjs"
  );
  process.exit(1);
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const DRY_RUN = process.argv.includes("--dry-run");

/* Implantação: usuário e data de criação dos registros do seeder */
const USUARIO_IMPLANTACAO = "implantacao";
const DATA_IMPLANTACAO = new Date().toISOString();

const USUARIO_ADMIN = {
  ds_usuario: "administrador",
  ds_usuario_alternativo: "administrador",
  senha: "quasar@1105",
};

/* Funções do sistema (mesmas chaves de FuncaoId em src/lib/perfilUtils.ts) */
const TODAS_FUNCOES = [
  "pessoaFisica",
  "estruturaAcademica",
  "patrimonio",
  "relatorio",
  "administracaoSistema",
  "cadastrosGerais",
];

function normalizar(valor) {
  return String(valor ?? "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function parseArray(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function maiorSequencia(snap) {
  return snap.docs.reduce((max, d) => Math.max(max, Number(d.data().nr_sequencia) || 0), 0);
}

/** Cria o documento, registra a auditoria de criação e sincroniza o contador. */
async function criarComAuditoria(nomeColecao, contador, dados) {
  const ref = doc(collection(db, nomeColecao));
  await setDoc(ref, dados);
  await addDoc(collection(db, nomeColecao, ref.id, "auditoria"), {
    usuarioId: null,
    usuarioNome: USUARIO_IMPLANTACAO,
    acao: "create",
    timestamp: DATA_IMPLANTACAO,
    detalhes: dados,
  });
  await setDoc(doc(db, "_counters", contador), { current: dados.nr_sequencia }, { merge: true });
  return ref.id;
}

async function semearPerfilAdministrador() {
  const snap = await getDocs(collection(db, "perfil"));
  const existente = snap.docs.find((d) => normalizar(d.data().ds_perfil) === "administrador");
  if (existente) {
    console.log(`ℹ️  perfil: Administrador já existe (${existente.data().nr_sequencia})`);
    return Number(existente.data().nr_sequencia);
  }

  const nr_sequencia = maiorSequencia(snap) + 1;
  if (DRY_RUN) {
    console.log(`👀 perfil: Administrador seria inserido (${nr_sequencia})`);
    return nr_sequencia;
  }

  await criarComAuditoria("perfil", "perfil_sequence", {
    nr_sequencia,
    ds_perfil: "Administrador",
    ds_observacao: "Perfil padrão do sistema com acesso a todas as funções.",
    ie_status: "A",
    config_funcoes: JSON.stringify(TODAS_FUNCOES),
    dt_criacao: DATA_IMPLANTACAO,
    dt_alteracao: DATA_IMPLANTACAO,
    ds_usuario_criacao: USUARIO_IMPLANTACAO,
    ds_usuario_alteracao: USUARIO_IMPLANTACAO,
  });
  console.log(`✅ perfil: Administrador inserido (${nr_sequencia})`);
  return nr_sequencia;
}

async function semearUsuarioAdministrador(perfilSeq) {
  const snap = await getDocs(collection(db, "usuario"));
  const existente = snap.docs.find((d) => normalizar(d.data().ds_usuario) === USUARIO_ADMIN.ds_usuario);

  if (existente) {
    const perfis = parseArray(existente.data().config_perfis);
    if (perfis.includes(perfilSeq)) {
      console.log(`ℹ️  usuario: administrador já existe e já possui o perfil (${perfilSeq})`);
      return;
    }
    if (DRY_RUN) {
      console.log(`👀 usuario: administrador existente receberia o perfil (${perfilSeq})`);
      return;
    }
    await setDoc(
      doc(db, "usuario", existente.id),
      { config_perfis: JSON.stringify([...perfis, perfilSeq]), config_perfil_ativo: String(perfilSeq) },
      { merge: true }
    );
    console.log(`✅ usuario: administrador existente vinculado ao perfil (${perfilSeq})`);
    return;
  }

  const nr_sequencia = maiorSequencia(snap) + 1;
  if (DRY_RUN) {
    console.log(`👀 usuario: administrador seria inserido (${nr_sequencia}) com o perfil (${perfilSeq})`);
    return;
  }

  await criarComAuditoria("usuario", "usuario_sequence", {
    nr_sequencia,
    ds_usuario: USUARIO_ADMIN.ds_usuario,
    ds_usuario_alternativo: USUARIO_ADMIN.ds_usuario_alternativo,
    // SHA-256 em hexadecimal — mesmo formato que o hashPassword do login
    ds_senha: createHash("sha256").update(USUARIO_ADMIN.senha).digest("hex"),
    ds_observacao: "",
    ie_status: "A",
    config_perfis: JSON.stringify([perfilSeq]),
    config_perfil_ativo: String(perfilSeq),
    dt_criacao: DATA_IMPLANTACAO,
    dt_alteracao: DATA_IMPLANTACAO,
    ds_usuario_criacao: USUARIO_IMPLANTACAO,
    ds_usuario_alteracao: USUARIO_IMPLANTACAO,
  });
  console.log(`✅ usuario: administrador inserido (${nr_sequencia}) com o perfil (${perfilSeq})`);
}

async function main() {
  console.log(`🌱 Seeder — Implantação inicial${DRY_RUN ? " (dry-run)" : ""}\n`);
  const perfilSeq = await semearPerfilAdministrador();
  await semearUsuarioAdministrador(perfilSeq);
  console.log(DRY_RUN ? "\n👀 Dry-run concluído. Nada foi escrito." : "\n🎉 Concluído!");
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
