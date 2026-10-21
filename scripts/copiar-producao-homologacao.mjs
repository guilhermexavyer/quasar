#!/usr/bin/env node
/**
 * Cópia da PRODUÇÃO para a HOMOLOGAÇÃO (Firestore).
 *
 * Lê todos os documentos das coleções do sistema no banco de produção
 * (origem: .env.producao) e grava no banco de homologação (destino: .env.local),
 * mantendo os mesmos IDs e os campos exatamente como estão (inclusive hashes
 * de senha). As subcoleções "auditoria" de cada documento são copiadas junto.
 *
 * A homologação vira um espelho da produção: antes de copiar, TODOS os dados
 * da homologação são apagados (coleções do sistema, coleções legadas e todas as
 * subcoleções "auditoria"), depois de gravar um backup em JSON na pasta
 * backups/ (ignorada pelo git). Sem isso, registros que só existiam na
 * homologação ficavam junto com os da produção (ex.: dois usuários com o mesmo
 * nr_sequencia).
 *
 * Imagens (Vercel Blob): as imagens cadastradas ficam no Blob, em pastas separadas
 * por base (producao/images/ e homologacao/images/). O script apaga as imagens da
 * pasta da homologação, copia as da produção para ela e reescreve o campo
 * ie_arquivo da coleção "imagem" para apontar para as cópias. A pasta da produção
 * só é lida. Precisa de BLOB_READ_WRITE_TOKEN no .env.local (veja o README);
 * use --sem-imagens para copiar só o Firestore.
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
 *   (opcional) --sem-imagens                                   → não mexe no Vercel Blob
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { list, del, copy } from "@vercel/blob";
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
  "pat_ativo", "pat_manutencao", "pat_param_codigo_patrimonio", "ea_param_matricula_aluno",
  "perfil", "usuario", "imagem", "aviso",
  "relatorio", "relatorio_banda", "relatorio_banda_elemento", "relatorio_parametro",
  "cg_sexo", "cg_estado_civil", "cg_cor_raca", "cg_profissao", "cg_orgao_emissor",
  "cg_logradouro", "cg_grau_parentesco", "cg_cargo", "cg_vinculo_contratual",
  "cg_localizacao", "cg_marca", "pat_categoria", "cg_sistema_operacional",
];

/** Coleções apagadas na homologação antes da cópia: as do sistema e as legadas. */
// Coleções antigas (renomeadas/removidas) também são apagadas do destino.
const COLECOES_LIMPEZA = [...COLECOES, "pat_ativos", "relatorio_bandas", "cg_categoria_ativo"];

/** Tamanho da página de leitura e do lote de escrita (limite do Firestore: 500). */
const PAGINA = 500;
const LOTE = 500;

/** Pastas das imagens no Vercel Blob (mesmos nomes usados por src/lib/blobImagens.ts). */
const PASTA_IMAGENS_ORIGEM = "producao/images/";
const PASTA_IMAGENS_DESTINO = "homologacao/images/";

const SEM_IMAGENS = process.argv.includes("--sem-imagens");
const DRY_RUN = process.argv.includes("--dry-run");
const CONFIRMAR = process.argv.includes("--confirmar");

if (DRY_RUN && CONFIRMAR) {
  console.error("❌ Use --dry-run OU --confirmar, não os dois juntos.");
  process.exit(1);
}

/** Lê um .env e devolve as variáveis (vazio se o arquivo não existir). */
function existeEnv(arquivo) {
  return existsSync(arquivo) ? parseEnv(readFileSync(arquivo, "utf-8")) : {};
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

/** Token do Vercel Blob (loja quasar-blob), lido do .env.local. Não é impresso. */
const tokenBlob = existeEnv(".env.local").BLOB_READ_WRITE_TOKEN;
if (!SEM_IMAGENS && !tokenBlob) {
  console.error(
    "❌ BLOB_READ_WRITE_TOKEN não encontrado no .env.local, necessário para copiar as imagens.\n" +
      "   Copie o valor em Vercel → projeto quasar → Storage → quasar-blob → aba .env.local\n" +
      "   (ou rode `vercel env pull .env.local`), ou use --sem-imagens para copiar só o Firestore."
  );
  process.exit(1);
}

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

/** Lista todos os arquivos do Blob em uma pasta (paginado). */
async function listarBlobs(prefixo) {
  const blobs = [];
  let cursor;
  do {
    const r = await list({ prefix: prefixo, limit: 1000, cursor, token: tokenBlob });
    blobs.push(...r.blobs);
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return blobs;
}

/**
 * Apaga as imagens da pasta da homologação e copia as da produção para ela.
 * Retorna um mapa URL da produção → URL da cópia na homologação.
 * Só apaga em PASTA_IMAGENS_DESTINO e só lê de PASTA_IMAGENS_ORIGEM.
 */
async function copiarImagens(origem, destinoAtual) {
  if (destinoAtual.length > 0) {
    await del(destinoAtual.map((b) => b.url), { token: tokenBlob });
  }
  const mapa = new Map();
  for (const b of origem) {
    const novoPathname = PASTA_IMAGENS_DESTINO + b.pathname.slice(PASTA_IMAGENS_ORIGEM.length);
    const r = await copy(b.url, novoPathname, { access: "public", allowOverwrite: true, token: tokenBlob });
    mapa.set(b.url, r.url);
  }
  return mapa;
}

/** Aponta ie_arquivo para a cópia da imagem na homologação (caminhos antigos /images/... ficam como estão). */
function ajustarImagem(dados, mapaImagens) {
  const url = dados.ie_arquivo;
  if (typeof url !== "string" || !mapaImagens.has(url)) return dados;
  return { ...dados, ie_arquivo: mapaImagens.get(url) };
}

/** Apaga documentos do destino em lotes. Só recebe documentos lidos de dbDestino. */
async function apagar(docs) {
  for (let i = 0; i < docs.length; i += LOTE) {
    const batch = writeBatch(dbDestino);
    for (const d of docs.slice(i, i + LOTE)) batch.delete(doc(dbDestino, d.ref.path));
    await batch.commit();
  }
}

/** Grava documentos no destino em lotes, com os mesmos caminhos (IDs) da origem. */
async function gravar(docs, ajustar = (dados) => dados) {
  for (let i = 0; i < docs.length; i += LOTE) {
    const batch = writeBatch(dbDestino);
    for (const d of docs.slice(i, i + LOTE)) batch.set(doc(dbDestino, d.ref.path), ajustar(paraDestino(d.data())));
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
  console.log(`\n   Total a copiar: ${total} documento(s)`);

  // 3) Leitura do destino: tudo o que existe hoje na homologação será apagado
  const atuaisPorColecao = {};
  let totalAtual = 0;
  for (const nome of COLECOES_LIMPEZA) {
    atuaisPorColecao[nome] = await lerPaginado(collection(dbDestino, nome));
    totalAtual += atuaisPorColecao[nome].length;
  }
  const auditoriasAtuais = await lerPaginado(collectionGroup(dbDestino, "auditoria"));
  totalAtual += auditoriasAtuais.length;
  console.log(`\n🗑️  A homologação (${configDestino.projectId}) tem hoje ${totalAtual} documento(s), que serão apagados antes da cópia.`);

  // Imagens no Vercel Blob
  let imagensOrigem = [];
  let imagensDestino = [];
  if (!SEM_IMAGENS) {
    imagensOrigem = await listarBlobs(PASTA_IMAGENS_ORIGEM);
    imagensDestino = await listarBlobs(PASTA_IMAGENS_DESTINO);
    console.log(`\n🖼️  Imagens no Blob: ${imagensOrigem.length} em ${PASTA_IMAGENS_ORIGEM} (serão copiadas) e ${imagensDestino.length} em ${PASTA_IMAGENS_DESTINO} (serão apagadas, sem backup).`);
  } else {
    console.log("\n🖼️  --sem-imagens: o Vercel Blob não será alterado (os registros de imagem continuarão apontando para os arquivos da produção).");
  }

  if (!CONFIRMAR) {
    console.log(`\n👀 Nada foi apagado nem gravado. Para copiar, rode novamente com --confirmar.`);
    process.exit(0);
  }

  // 4) Backup da homologação
  const dataBackup = new Date().toISOString();
  const backup = { projeto: configDestino.projectId, data: dataBackup, colecoes: {}, auditoria: {} };
  for (const nome of COLECOES_LIMPEZA) {
    backup.colecoes[nome] = Object.fromEntries(atuaisPorColecao[nome].map((d) => [d.id, d.data()]));
  }
  for (const d of auditoriasAtuais) backup.auditoria[d.ref.path] = d.data();
  mkdirSync("backups", { recursive: true });
  const arquivoBackup = `backups/backup-homologacao-${dataBackup.replace(/[:.]/g, "-")}.json`;
  writeFileSync(arquivoBackup, JSON.stringify(backup, null, 2), "utf-8");
  console.log(`\n💾 Backup da homologação gravado em ${arquivoBackup}`);

  // 5) Limpeza da homologação (auditorias primeiro, depois os documentos)
  await apagar(auditoriasAtuais);
  for (const nome of COLECOES_LIMPEZA) await apagar(atuaisPorColecao[nome]);
  let restantes = (await lerPaginado(collectionGroup(dbDestino, "auditoria"))).length;
  for (const nome of COLECOES_LIMPEZA) restantes += (await lerPaginado(collection(dbDestino, nome))).length;
  if (restantes > 0) {
    console.error(`❌ A limpeza deixou ${restantes} documento(s) na homologação. A cópia não foi feita (backup em ${arquivoBackup}).`);
    process.exit(1);
  }
  console.log(`🗑️  Homologação limpa: ${totalAtual} documento(s) apagados.`);

  // 5b) Imagens: apaga as da pasta da homologação e copia as da produção
  let mapaImagens = new Map();
  if (!SEM_IMAGENS) {
    mapaImagens = await copiarImagens(imagensOrigem, imagensDestino);
    console.log(`🖼️  Imagens: ${imagensDestino.length} apagadas e ${mapaImagens.size} copiadas para ${PASTA_IMAGENS_DESTINO}`);
  }

  // 6) Escrita no destino (homologação)
  console.log("");
  for (const nome of COLECOES) {
    const docs = porColecao[nome];
    const audits = auditoria[nome] ?? [];
    if (docs.length === 0 && audits.length === 0) continue;
    await gravar(docs, nome === "imagem" ? (dados) => ajustarImagem(dados, mapaImagens) : undefined);
    await gravar(audits);
    console.log(`✅ ${nome}: ${docs.length}${audits.length > 0 ? ` (+ ${audits.length} de auditoria)` : ""}`);
  }
  console.log(`\n🎉 Concluído! ${total} documento(s) copiados para ${configDestino.projectId}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erro na cópia:", err?.message ?? err);
  console.error("   Se o erro ocorreu depois da limpeza, restaure a partir do backup em backups/ ou rode a cópia novamente.");
  console.error(
    "   Verifique se as regras de segurança do Firestore permitem leitura na produção " +
      "e escrita na homologação, e se as credenciais estão corretas."
  );
  process.exit(1);
});
