#!/usr/bin/env node
/**
 * Migração — Responsáveis do ativo para pat_ativo_responsavel (colaborador)
 *
 * Os responsáveis saíram do formulário do ativo (array pat_ativo.responsaveis,
 * com a sequência da PESSOA FÍSICA) e passaram para a coleção
 * pat_ativo_responsavel, aberta com duplo clique no ativo, vinculados a um
 * COLABORADOR (nr_seq_colaborador). Este script:
 *
 *   1. Para cada ativo com o array preenchido: cria um documento em
 *      pat_ativo_responsavel por colaborador (sem repetir), com sequência
 *      própria (_counters/pat_ativo_responsavel_sequence) e um log "create" na
 *      auditoria (data/usuário da última alteração do ativo), e remove o campo
 *      responsaveis do ativo.
 *   2. Converte documentos de pat_ativo_responsavel ainda no formato antigo
 *      (nr_seq_responsavel = pessoa física) para nr_seq_colaborador.
 *   3. Troca, nos perfis, o status do campo Responsável
 *      ("pat_ativo.nr_seq_responsavel" / "pat_ativo_responsavel.nr_seq_responsavel")
 *      por "pat_ativo_responsavel.nr_seq_colaborador".
 *
 * Pessoa física → colaborador: o colaborador com aquela pessoa física. Havendo
 * mais de um, prefere o sem pessoa jurídica, depois o ativo (status A), depois a
 * menor sequência. Pessoa física SEM colaborador não tem como ser convertida:
 * é listada e fica de fora (no array, o ativo mantém o campo antigo; na coleção,
 * o documento fica como está). Com --excluir-sem-colaborador, esses vínculos são
 * descartados (o campo antigo sai do ativo; o documento é excluído e registrado
 * em Administração do Sistema > Exclusões).
 *
 * Rodar de novo não duplica. Sem --confirmar, só mostra o que seria feito.
 *
 * Uso (um banco por vez — o .env escolhe qual):
 *   node --env-file=.env.local    scripts/migrar-responsaveis-ativo.mjs               → simula (homologação)
 *   node --env-file=.env.local    scripts/migrar-responsaveis-ativo.mjs --confirmar   → migra
 *   node --env-file=.env.local    scripts/migrar-responsaveis-ativo.mjs --excluir-sem-colaborador --confirmar
 *   node --env-file=.env.producao scripts/migrar-responsaveis-ativo.mjs ...          → produção
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, writeBatch, deleteField } from "firebase/firestore";

const ATIVO = "pat_ativo";
const NOVA = "pat_ativo_responsavel";
const CAMPO_NOVO = `${NOVA}.nr_seq_colaborador`;
const CAMPOS_ANTIGOS = [`${ATIVO}.nr_seq_responsavel`, `${NOVA}.nr_seq_responsavel`];

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
const EXCLUIR_SEM_COLABORADOR = process.argv.includes("--excluir-sem-colaborador");

/** Grava em lotes de até 450 operações (limite do Firestore: 500 por lote). */
async function gravarEmLotes(operacoes) {
  for (let i = 0; i < operacoes.length; i += 450) {
    const batch = writeBatch(db);
    for (const op of operacoes.slice(i, i + 450)) op(batch);
    await batch.commit();
  }
}

/** Troca as chaves antigas do campo Responsável num JSON de configuração de campos. */
function renomearChave(raw) {
  if (!raw) return null;
  let obj;
  try { obj = JSON.parse(raw); } catch { return null; }
  if (!obj || typeof obj !== "object" || !CAMPOS_ANTIGOS.some((k) => k in obj)) return null;
  const novo = {};
  for (const [k, v] of Object.entries(obj)) {
    if (CAMPOS_ANTIGOS.includes(k)) {
      if (!(CAMPO_NOVO in obj) && !(CAMPO_NOVO in novo)) novo[CAMPO_NOVO] = v;
    } else {
      novo[k] = v;
    }
  }
  return JSON.stringify(novo);
}

async function main() {
  console.log(`📦 Responsáveis do ativo → ${NOVA} (colaborador) no projeto "${firebaseConfig.projectId}"${CONFIRMAR ? "" : " (simulação)"}\n`);
  const ops = [];

  // Pessoa física → colaborador
  const colaboradores = (await getDocs(collection(db, "colaborador"))).docs.map((d) => d.data());
  function colaboradorDaPessoa(nrPessoa) {
    const candidatos = colaboradores
      .filter((c) => Number(c.nr_seq_pessoa_fisica) === nrPessoa)
      .sort((a, b) =>
        (a.nr_seq_pessoa_juridica ? 1 : 0) - (b.nr_seq_pessoa_juridica ? 1 : 0)
        || (a.ie_status === "A" ? 0 : 1) - (b.ie_status === "A" ? 0 : 1)
        || Number(a.nr_sequencia) - Number(b.nr_sequencia));
    return candidatos.length > 0 ? Number(candidatos[0].nr_sequencia) : null;
  }
  const semColaborador = new Set();

  const docsNova = (await getDocs(collection(db, NOVA))).docs;
  // Ativos que já têm responsáveis no formato novo (não recebem cópia do array).
  const comNovo = new Set(docsNova.filter((d) => d.data().nr_seq_colaborador !== undefined || d.data().nr_seq_responsavel !== undefined).map((d) => Number(d.data().nr_seq_ativo)));

  const contadorRef = doc(db, "_counters", `${NOVA}_sequence`);
  const contador = await getDoc(contadorRef);
  let sequencia = contador.exists() ? Number(contador.data().current ?? 0) : 0;
  const sequenciaInicial = sequencia;

  // 1. Array do ativo → coleção
  let ativosMigrados = 0, criados = 0, ativosSoLimpeza = 0, ativosPendentes = 0;
  for (const a of (await getDocs(collection(db, ATIVO))).docs) {
    const dados = a.data();
    if (!("responsaveis" in dados)) continue;
    const nrSeqAtivo = Number(dados.nr_sequencia);
    const pessoas = [...new Set(
      (Array.isArray(dados.responsaveis) ? dados.responsaveis : [])
        .map((r) => Number(r?.nr_seq_responsavel))
        .filter((n) => Number.isFinite(n) && n > 0)
    )];
    if (pessoas.length === 0 || comNovo.has(nrSeqAtivo)) {
      ativosSoLimpeza++;
      ops.push((b) => b.update(a.ref, { responsaveis: deleteField() }));
      continue;
    }
    const sem = pessoas.filter((p) => colaboradorDaPessoa(p) === null);
    sem.forEach((p) => semColaborador.add(p));
    if (sem.length > 0 && !EXCLUIR_SEM_COLABORADOR) {
      ativosPendentes++;
      console.log(`   ⚠️  ativo ${nrSeqAtivo} (${dados.ds_ativo ?? ""}): pessoa(s) física(s) sem colaborador → ${sem.join(", ")} (ativo não migrado)`);
      continue;
    }
    const colabs = [...new Set(pessoas.map(colaboradorDaPessoa).filter((n) => n !== null))];
    const data = dados.dt_alteracao || dados.dt_criacao || new Date().toISOString();
    const usuario = dados.ds_usuario_alteracao || dados.ds_usuario_criacao || "-";
    for (const nrColab of colabs) {
      sequencia++;
      criados++;
      const novoRef = doc(collection(db, NOVA));
      const registro = {
        nr_sequencia: sequencia,
        nr_seq_ativo: nrSeqAtivo,
        nr_seq_colaborador: nrColab,
        dt_criacao: data,
        dt_alteracao: data,
        ds_usuario_criacao: usuario,
        ds_usuario_alteracao: usuario,
      };
      ops.push((b) => b.set(novoRef, registro));
      ops.push((b) => b.set(doc(collection(db, NOVA, novoRef.id, "auditoria")), {
        usuarioId: null, usuarioNome: usuario, acao: "create", timestamp: data, detalhes: registro,
      }));
    }
    ativosMigrados++;
    ops.push((b) => b.update(a.ref, { responsaveis: deleteField() }));
    console.log(`   ativo ${nrSeqAtivo} (${dados.ds_ativo ?? ""}): pessoa(s) ${pessoas.join(", ")} → colaborador(es) ${colabs.join(", ") || "-"}`);
  }
  if (sequencia !== sequenciaInicial) ops.push((b) => b.set(contadorRef, { current: sequencia }, { merge: true }));

  // 2. Documentos já na coleção, no formato antigo (pessoa física)
  let convertidos = 0, excluidos = 0, pendentesNova = 0;
  const agora = new Date().toISOString();
  let restosLimpos = 0;
  for (const d of docsNova) {
    const dados = d.data();
    if (dados.nr_seq_responsavel === undefined) continue;
    // Já salvo pela tela nova (tem o colaborador): só sai o campo antigo que sobrou.
    if (dados.nr_seq_colaborador !== undefined) {
      restosLimpos++;
      ops.push((b) => b.update(d.ref, { nr_seq_responsavel: deleteField() }));
      continue;
    }
    const nrPessoa = Number(dados.nr_seq_responsavel);
    const nrColab = colaboradorDaPessoa(nrPessoa);
    if (nrColab !== null) {
      convertidos++;
      const final = { ...dados, nr_seq_colaborador: nrColab };
      delete final.nr_seq_responsavel;
      ops.push((b) => b.update(d.ref, { nr_seq_colaborador: nrColab, nr_seq_responsavel: deleteField() }));
      ops.push((b) => b.set(doc(collection(db, NOVA, d.id, "auditoria")), {
        usuarioId: null, usuarioNome: "Sistema", acao: "update", timestamp: agora, detalhes: final,
      }));
    } else {
      semColaborador.add(nrPessoa);
      if (EXCLUIR_SEM_COLABORADOR) {
        excluidos++;
        // Mesmo formato de registrarExclusao (src/services/exclusaoService.ts).
        ops.push((b) => b.set(doc(collection(db, "exclusao")), {
          ds_colecao: NOVA,
          id_registro: d.id,
          nr_sequencia: Number(dados.nr_sequencia),
          dados,
          dt_exclusao: agora,
          ds_usuario_exclusao: "Sistema",
          usuario_id_exclusao: null,
          ds_perfil_exclusao: "Migração",
        }));
        ops.push((b) => b.delete(d.ref));
      } else {
        pendentesNova++;
      }
    }
  }

  // 3. Status do campo nos perfis
  let perfis = 0;
  for (const p of (await getDocs(collection(db, "perfil"))).docs) {
    const campos = renomearChave(p.data().config_campos);
    const alteracao = renomearChave(p.data().config_campos_alteracao);
    if (!campos && !alteracao) continue;
    perfis++;
    ops.push((b) => b.update(p.ref, { ...(campos ? { config_campos: campos } : {}), ...(alteracao ? { config_campos_alteracao: alteracao } : {}) }));
  }

  console.log(`\n   array do ativo → coleção: ${ativosMigrados} ativo(s), ${criados} responsável(is) criado(s)`);
  console.log(`   ativos só com o campo antigo a remover: ${ativosSoLimpeza}`);
  if (sequencia !== sequenciaInicial) console.log(`   contador: ${sequenciaInicial} → ${sequencia}`);
  console.log(`   coleção (pessoa física → colaborador): ${convertidos} convertido(s)${EXCLUIR_SEM_COLABORADOR ? `, ${excluidos} excluído(s) sem colaborador` : ""}`);
  if (restosLimpos > 0) console.log(`   já com colaborador (só o campo antigo sai): ${restosLimpos}`);
  console.log(`   perfis com status do campo Responsável: ${perfis}`);
  if (semColaborador.size > 0) {
    console.log(`\n⚠️  Pessoa(s) física(s) sem colaborador: ${[...semColaborador].join(", ")}`);
    if (!EXCLUIR_SEM_COLABORADOR) {
      console.log(`   Ficaram de fora: ${ativosPendentes} ativo(s) do array e ${pendentesNova} documento(s) da coleção.`);
      console.log("   Cadastre o colaborador e rode de novo, ou use --excluir-sem-colaborador para descartar esses vínculos.");
    }
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
