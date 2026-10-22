#!/usr/bin/env node
/**
 * Auditoria de rodapés (leitura ONLY) — verifica, em todas as coleções de
 * registros do sistema, se os campos exibidos no rodapé dos formulários estão
 * presentes e corretos:
 *   - dt_criacao / dt_alteracao ausentes ou sem componente de hora
 *   - ds_usuario_criacao / ds_usuario_alteracao vazios
 *   - divergência entre o campo do documento e o log de auditoria
 *     (subcollection "auditoria") — caso em que o rodapé mostra dado errado
 *
 * Uso: node --env-file=.env.local scripts/audit-rodapes.mjs
 */
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
  console.error("❌ NEXT_PUBLIC_FIREBASE_* não encontradas. Rode com: node --env-file=.env.local scripts/audit-rodapes.mjs");
  process.exit(1);
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const COLECOES = [
  "pessoa_fisica", "pessoa_juridica", "aluno", "colaborador", "periodo_letivo",
  "pat_ativo", "pat_manutencao", "pat_param_codigo_patrimonio", "pat_param_cor_ativo_descartado", "pat_param_cor_ativo_estoque", "pat_param_cor_ativo_manutencao", "pat_param_cor_ativo_operacional", "pat_param_cor_manutencao_andamento", "pat_param_cor_manutencao_concluida", "pat_param_cor_manutencao_cancelada", "periodo_letivo_feriado", "curso", "ea_param_matricula_aluno", "ea_param_cor_periodo_letivo_andamento", "ea_param_cor_periodo_letivo_encerrado", "ea_param_encerramento_automatico_periodo_letivo",
  "perfil", "usuario", "imagem",
  "relatorio", "relatorio_banda", "relatorio_bandas",
  "relatorio_banda_elemento", "relatorio_parametro",
  "cg_sexo", "cg_estado_civil", "cg_cor_raca", "cg_profissao",
  "cg_orgao_emissor", "cg_logradouro", "cg_grau_parentesco", "cg_cargo",
  "cg_sistema_operacional", "pat_categoria", "cg_localizacao",
  "cg_marca", "cg_vinculo_contratual",
];

/** formatDate (idêntico ao do sistema) só inclui hora em valores ISO com HH:MM:SS. */
function temHora(v) {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v);
}
const vazio = (v) => v === undefined || v === null || String(v).trim() === "";

let problemas = 0;

for (const nome of COLECOES) {
  let snap;
  try {
    snap = await getDocs(collection(db, nome));
  } catch (e) {
    console.log(`— ${nome}: (sem acesso: ${e.code ?? e.message})`);
    continue;
  }
  if (snap.empty) { console.log(`— ${nome}: vazia`); continue; }

  const linhas = [];
  let comAuditoriaDivergente = 0;

  for (const d of snap.docs) {
    const r = d.data();
    const f = [];
    if (vazio(r.dt_criacao)) f.push("dt_criacao ausente");
    else if (!temHora(r.dt_criacao)) f.push(`dt_criacao sem hora (${r.dt_criacao})`);
    if (vazio(r.dt_alteracao)) f.push("dt_alteracao ausente");
    else if (!temHora(r.dt_alteracao)) f.push(`dt_alteracao sem hora (${r.dt_alteracao})`);
    if (vazio(r.ds_usuario_criacao)) f.push("ds_usuario_criacao vazio");
    if (vazio(r.ds_usuario_alteracao)) f.push("ds_usuario_alteracao vazio");

    // Compara com a auditoria do documento (quando houver)
    try {
      const aud = await getDocs(collection(db, nome, d.id, "auditoria"));
      if (!aud.empty) {
        const logs = aud.docs.map((x) => x.data()).sort((a, b) => String(b.timestamp ?? "").localeCompare(String(a.timestamp ?? "")));
        const create = logs.find((l) => String(l.acao ?? "").toLowerCase() === "create");
        const update = logs.find((l) => String(l.acao ?? "").toLowerCase() === "update");
        if (create && !vazio(create.usuarioNome) && vazio(r.ds_usuario_criacao)) {
          f.push(`criação: doc sem usuário mas auditoria="${create.usuarioNome}"`);
          comAuditoriaDivergente++;
        }
        if (update && !vazio(update.usuarioNome) && vazio(r.ds_usuario_alteracao)) {
          f.push(`alteração: doc sem usuário mas auditoria="${update.usuarioNome}"`);
          comAuditoriaDivergente++;
        }
        if (create && !vazio(r.ds_usuario_criacao) && create.usuarioNome !== r.ds_usuario_criacao) {
          f.push(`criação divergente: doc="${r.ds_usuario_criacao}" vs auditoria="${create.usuarioNome}"`);
          comAuditoriaDivergente++;
        }
        if (update && !vazio(r.ds_usuario_alteracao) && update.usuarioNome !== r.ds_usuario_alteracao) {
          f.push(`alteração divergente: doc="${r.ds_usuario_alteracao}" vs auditoria="${update.usuarioNome}"`);
          comAuditoriaDivergente++;
        }
      }
    } catch { /* sem auditoria — ok */ }

    if (f.length > 0) {
      problemas += f.length;
      linhas.push(`   • ${d.id}: ${f.join(" | ")}`);
    }
  }

  if (linhas.length > 0) {
    console.log(`✗ ${nome} (${snap.size} docs, ${linhas.length} com problema${comAuditoriaDivergente ? `, ${comAuditoriaDivergente} divergências c/ auditoria` : ""}):`);
    for (const l of linhas.slice(0, 20)) console.log(l);
    if (linhas.length > 20) console.log(`   ... e mais ${linhas.length - 20}`);
  } else {
    console.log(`✓ ${nome} (${snap.size} docs): rodapé OK`);
  }
}

console.log(problemas === 0 ? "\n🎉 Nenhum problema de rodapé nos dados." : `\n⚠️  ${problemas} problema(s) encontrado(s).`);
