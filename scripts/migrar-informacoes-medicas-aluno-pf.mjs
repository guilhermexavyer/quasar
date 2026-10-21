#!/usr/bin/env node
/**
 * Migração — Informações médicas de Alunos para Pessoas Físicas
 *
 * A seção "Informações médicas" saiu de Estrutura Acadêmica > Alunos e foi para
 * Cadastro de Pessoas > Pessoas Físicas. Este script:
 *   - copia os campos de cada aluno para a pessoa física vinculada
 *     (aluno.nr_seq_pessoa_fisica → pessoa_fisica.nr_sequencia);
 *   - apaga os campos da coleção aluno;
 *   - move o status dos campos nos perfis (config_campos / config_campos_alteracao:
 *     "aluno.<campo>" → "pessoa_fisica.<campo>").
 *
 * Quando a pessoa física já tem valor:
 *   - listas (alergia, medicamento, restrição, necessidade): junta, sem repetir;
 *   - tipo sanguíneo: mantém o da pessoa física (diferença é avisada);
 *   - observações médicas: junta os dois textos (um por linha).
 * Aluno sem pessoa física vinculada (ou com pessoa física inexistente) e com
 * informações preenchidas NÃO é alterado — o script lista esses casos.
 *
 * Sem --confirmar, só mostra o que seria feito.
 *
 * Uso (um banco por vez — o .env escolhe qual):
 *   node --env-file=.env.local    scripts/migrar-informacoes-medicas-aluno-pf.mjs               → simula (homologação)
 *   node --env-file=.env.local    scripts/migrar-informacoes-medicas-aluno-pf.mjs --confirmar   → grava
 *   node --env-file=.env.producao scripts/migrar-informacoes-medicas-aluno-pf.mjs ...          → produção
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, writeBatch, deleteField } from "firebase/firestore";

const CAMPOS_LISTA = ["ds_alergia", "ds_medicamento_continuo", "ds_restricao_alimentar", "ds_necessidade_especial"];
const CAMPOS = ["ds_tipo_sanguineo", ...CAMPOS_LISTA, "ds_observacao_medica"];

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

/** Grava em lotes de até 450 operações (limite do Firestore: 500 por lote). */
async function gravarEmLotes(operacoes) {
  for (let i = 0; i < operacoes.length; i += 450) {
    const batch = writeBatch(db);
    for (const op of operacoes.slice(i, i + 450)) op(batch);
    await batch.commit();
  }
}

const texto = (v) => (typeof v === "string" ? v.trim() : "");
const lista = (v) => (Array.isArray(v) ? v.map((x) => String(x ?? "").trim()).filter((x) => x !== "") : []);

/** O aluno tem algum valor preenchido nas informações médicas? */
function temValor(dados) {
  return texto(dados.ds_tipo_sanguineo) !== "" || texto(dados.ds_observacao_medica) !== "" || CAMPOS_LISTA.some((c) => lista(dados[c]).length > 0);
}

/** Move as chaves "aluno.<campo>" para "pessoa_fisica.<campo>" de um JSON de configuração. */
function moverChaves(raw) {
  if (!raw) return null;
  let obj;
  try { obj = JSON.parse(raw); } catch { return null; }
  if (!obj || typeof obj !== "object") return null;
  let mudou = false;
  for (const campo of CAMPOS) {
    const antiga = `aluno.${campo}`;
    if (!(antiga in obj)) continue;
    if (!(`pessoa_fisica.${campo}` in obj)) obj[`pessoa_fisica.${campo}`] = obj[antiga];
    delete obj[antiga];
    mudou = true;
  }
  return mudou ? JSON.stringify(obj) : null;
}

async function main() {
  console.log(`📦 Informações médicas: aluno → pessoa_fisica no projeto "${firebaseConfig.projectId}"${CONFIRMAR ? "" : " (simulação)"}\n`);
  const ops = [];

  const pessoas = await getDocs(collection(db, "pessoa_fisica"));
  const pessoaPorSeq = new Map(pessoas.docs.map((d) => [Number(d.data().nr_sequencia), d]));
  // Estado acumulado por pessoa física (uma pessoa pode estar em mais de um aluno).
  const novosDadosPf = new Map();

  let alunosLimpos = 0;
  const pendentes = [];
  const avisos = [];

  for (const a of (await getDocs(collection(db, "aluno"))).docs) {
    const dados = a.data();
    const presentes = CAMPOS.filter((c) => c in dados);
    if (presentes.length === 0) continue;

    if (temValor(dados)) {
      const pf = pessoaPorSeq.get(Number(dados.nr_seq_pessoa_fisica));
      if (!pf) {
        pendentes.push(`aluno #${dados.nr_sequencia} (pessoa física ${dados.nr_seq_pessoa_fisica ?? "não vinculada"})`);
        continue;
      }
      const atual = novosDadosPf.get(pf.id) ?? { ...pf.data() };
      const rotulo = `aluno #${dados.nr_sequencia} → pessoa física #${pf.data().nr_sequencia} (${pf.data().ds_nome ?? ""})`;

      const tipoAluno = texto(dados.ds_tipo_sanguineo);
      const tipoPf = texto(atual.ds_tipo_sanguineo);
      if (tipoAluno && !tipoPf) atual.ds_tipo_sanguineo = tipoAluno;
      else if (tipoAluno && tipoPf !== tipoAluno) avisos.push(`${rotulo}: tipo sanguíneo ${tipoAluno} ignorado (pessoa física já tem ${tipoPf})`);

      for (const c of CAMPOS_LISTA) {
        const unidos = [...lista(atual[c])];
        for (const v of lista(dados[c])) if (!unidos.includes(v)) unidos.push(v);
        if (unidos.length > 0) atual[c] = unidos;
      }

      const obsAluno = texto(dados.ds_observacao_medica);
      const obsPf = texto(atual.ds_observacao_medica);
      if (obsAluno && !obsPf) atual.ds_observacao_medica = obsAluno;
      else if (obsAluno && !obsPf.includes(obsAluno)) atual.ds_observacao_medica = `${obsPf}\n${obsAluno}`;

      novosDadosPf.set(pf.id, atual);
      console.log(`   ${rotulo}`);
    }

    // Apaga os campos do aluno (com valor já copiado, ou vazios).
    alunosLimpos++;
    ops.push((b) => b.update(a.ref, Object.fromEntries(presentes.map((c) => [c, deleteField()]))));
  }

  for (const [id, atual] of novosDadosPf) {
    const updates = {};
    for (const c of CAMPOS) if (atual[c] !== undefined) updates[c] = atual[c];
    ops.push((b) => b.update(doc(db, "pessoa_fisica", id), updates));
  }
  console.log(`\n   pessoas físicas atualizadas: ${novosDadosPf.size}`);
  console.log(`   alunos com os campos apagados: ${alunosLimpos}`);

  // Status dos campos nos perfis
  let perfis = 0;
  for (const p of (await getDocs(collection(db, "perfil"))).docs) {
    const campos = moverChaves(p.data().config_campos);
    const alteracao = moverChaves(p.data().config_campos_alteracao);
    if (!campos && !alteracao) continue;
    perfis++;
    ops.push((b) => b.update(p.ref, { ...(campos ? { config_campos: campos } : {}), ...(alteracao ? { config_campos_alteracao: alteracao } : {}) }));
  }
  console.log(`   perfis com status de campos: ${perfis}`);

  if (avisos.length > 0) {
    console.log(`\n⚠️  Avisos:`);
    for (const a of avisos) console.log(`   - ${a}`);
  }
  if (pendentes.length > 0) {
    console.log(`\n⚠️  Alunos com informações médicas e sem pessoa física válida (NÃO alterados):`);
    for (const p of pendentes) console.log(`   - ${p}`);
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
