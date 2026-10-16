#!/usr/bin/env node
/**
 * Cópia da PRODUÇÃO para a HOMOLOGAÇÃO (Firestore).
 *
 * Lê todos os documentos das coleções do sistema no banco de produção
 * (origem: .env.producao) e grava no banco de homologação (destino: .env.local),
 * mantendo os mesmos IDs e os campos exatamente como estão (inclusive hashes
 * de senha). As subcoleções "auditoria" de cada documento são copiadas junto.
 *
 * Documentos com o mesmo ID na homologação são sobrescritos; documentos que só
 * existem na homologação não são apagados (para uma cópia exata, limpe antes
 * com `npm run db:limpar -- --confirmar`).
 *
 * Segurança: só grava se o destino for o projeto de homologação (quasar-c3c81)
 * e nunca grava na origem. Sem --confirmar, apenas mostra o que faria.
 *
 * O SDK cliente do Firebase não lista coleções raiz, por isso a lista abaixo
 * precisa acompanhar as coleções usadas pelo sistema (mesma de limpar-banco.mjs,
 * sem as coleções legadas pat_ativos e relatorio_bandas).
 *
 * Uso:
 *   node scripts/copiar-producao-homologacao.mjs --dry-run     → só mostra o que seria copiado
 *   node scripts/copiar-producao-homologacao.mjs --confirmar   → copia de verdade
 */
import { readFileSync, existsSync } from "node:fs";
import { parseEnv } from "node:util";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  collectionGroup,
  doc,
  getDocs,
  query,
  limit,
  startAfter,
  writeBatch,
  DocumentReference,
} from "firebase/firestore";

const PROJETO_ORIGEM = "teste-684cc";
const PROJETO_DESTINO = "quasar-c3c81";

const COLECOES = [
  "_counters",
  "pessoa_fisica", "pessoa_juridica",
  "aluno", "colaborador",
  "pat_ativo", "pat_manutencao", "pat_param_codigo_patrimonio",
  "perfil", "usuario", "imagem",
  "relatorio", "relatorio_banda", "relatorio_banda_elemento", "relatorio_parametro",
  "cg_sexo", "cg_estado_civil", "cg_cor_raca", "cg_profissao", "cg_orgao_emissor",
  "cg_logradouro", "cg_grau_parentesco", "cg_cargo", "cg_vinculo_contratual",
  "cg_localizacao", "cg_marca", "cg_categoria_ativo", "cg_sistema_operacional",
];

/** Tamanho da página de leitura e do lote de escrita (limite do Firestore: 500). */
const PAGINA = 500;
const LOTE = 500;

const DRY_RUN = process.argv.includes("--dry-run");
const CONFIRMAR = process.argv.includes("--confirmar");

if (DRY_RUN && CONFIRMAR) {
  console.error("❌ Use --dry-run OU --confirmar, não os dois juntos.");
  process.exit(1);
}

/** Lê um .env sem imprimir valores. São dois projetos com as mesmas variáveis, então não dá para usar --env-file. */
function lerConfig(arquivo) {
  if (!existsSync(arquivo)) {
    console.error(`❌ Arquivo ${arquivo} não encontrado na raiz do projeto.`);
    process.exit(1);
  }
  const env = parseEnv(readFileSync(arquivo, "utf-8"));
  const config = {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  if (!config.projectId || !config.apiKey) {
    console.error(`❌ Variáveis NEXT_PUBLIC_FIREBASE_* não encontradas em ${arquivo}.`);
    process.exit(1);
  }
  return config;
}

const configOrigem = lerConfig(".env.producao");
const configDestino = lerConfig(".env.local");

// Travas de segurança: destino tem de ser a homologação; origem, a produção.
if (configDestino.projectId !== PROJETO_DESTINO) {
  console.error(`❌ O destino (.env.local) é "${configDestino.projectId}", mas deveria ser "${PROJETO_DESTINO}". Nada foi feito.`);
  process.exit(1);
}
if (configOrigem.projectId !== PROJETO_ORIGEM) {
  console.error(`❌ A origem (.env.producao) é "${configOrigem.projectId}", mas deveria ser "${PROJETO_ORIGEM}". Nada foi feito.`);
  process.exit(1);
}

const dbOrigem = getFirestore(initializeApp(configOrigem, "origem"));
const dbDestino = getFirestore(initializeApp(configDestino, "destino"));

/** Lê todos os documentos de uma consulta, em páginas. */
async function lerPaginado(base) {
  const docs = [];
  let ultimo = null;
  for (;;) {
    const q = ultimo ? query(base, startAfter(ultimo), limit(PAGINA)) : query(base, limit(PAGINA));
    const snap = await getDocs(q);
    docs.push(...snap.docs);
    if (snap.size < PAGINA) return docs;
    ultimo = snap.docs[snap.docs.length - 1];
  }
}

/**
 * Mantém os dados como estão. A única adaptação é para referências a
 * documentos (DocumentReference), que pertencem ao banco de origem e
 * precisam apontar para o mesmo caminho no destino.
 */
function paraDestino(valor) {
  if (valor instanceof DocumentReference) return doc(dbDestino, valor.path);
  if (Array.isArray(valor)) return valor.map(paraDestino);
  if (valor && typeof valor === "object" && Object.getPrototypeOf(valor) === Object.prototype) {
    return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, paraDestino(v)]));
  }
  return valor;
}

/** Grava documentos no destino em lotes, com os mesmos caminhos (IDs) da origem. */
async function gravar(docs) {
  for (let i = 0; i < docs.length; i += LOTE) {
    const batch = writeBatch(dbDestino);
    for (const d of docs.slice(i, i + LOTE)) batch.set(doc(dbDestino, d.ref.path), paraDestino(d.data()));
    await batch.commit();
  }
}

async function main() {
  const modo = CONFIRMAR ? "" : " (simulação)";
  console.log(`📦 Cópia produção → homologação${modo}`);
  console.log(`   Origem:  ${configOrigem.projectId}`);
  console.log(`   Destino: ${configDestino.projectId}\n`);

  // 1) Leitura da origem (paginada)
  const porColecao = {};
  for (const nome of COLECOES) porColecao[nome] = await lerPaginado(collection(dbOrigem, nome));

  // Auditorias: só as de documentos das coleções copiadas (caminho colecao/id/auditoria/id).
  const auditoriasTodas = await lerPaginado(collectionGroup(dbOrigem, "auditoria"));
  const auditoria = {};
  for (const d of auditoriasTodas) {
    const partes = d.ref.path.split("/");
    if (partes.length !== 4 || !COLECOES.includes(partes[0])) continue;
    (auditoria[partes[0]] ??= []).push(d);
  }

  // 2) Contagem
  let total = 0;
  for (const nome of COLECOES) {
    const n = porColecao[nome].length;
    const a = auditoria[nome]?.length ?? 0;
    total += n + a;
    if (n > 0 || a > 0) console.log(`   ${nome}: ${n}${a > 0 ? ` (+ ${a} de auditoria)` : ""}`);
  }
  console.log(`\n   Total: ${total} documento(s)`);

  if (!CONFIRMAR) {
    console.log(`\n👀 Nada foi gravado. Para copiar, rode novamente com --confirmar.`);
    process.exit(0);
  }

  // 3) Escrita no destino (homologação)
  console.log("");
  for (const nome of COLECOES) {
    const docs = porColecao[nome];
    const audits = auditoria[nome] ?? [];
    if (docs.length === 0 && audits.length === 0) continue;
    await gravar(docs);
    await gravar(audits);
    console.log(`✅ ${nome}: ${docs.length}${audits.length > 0 ? ` (+ ${audits.length} de auditoria)` : ""}`);
  }
  console.log(`\n🎉 Concluído! ${total} documento(s) copiados para ${configDestino.projectId}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erro na cópia:", err?.message ?? err);
  console.error(
    "   Verifique se as regras de segurança do Firestore permitem leitura na produção " +
      "e escrita na homologação, e se as credenciais estão corretas."
  );
  process.exit(1);
});
