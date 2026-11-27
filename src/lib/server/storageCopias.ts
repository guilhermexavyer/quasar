import "server-only";
import { randomUUID } from "node:crypto";
import { query } from "@/lib/db";
import { ErroValidacao } from "@/lib/server/esquema";
import {
  extensaoDoArquivo,
  extensoesPermitidasCopia,
  TAMANHO_MAXIMO_ARQUIVO_COPIA,
} from "@/lib/copiaArquivoUtils";

/**
 * Arquivos de Controle de Cópias > Cópias no Supabase Storage (bucket privado "copias"),
 * acessado só pelo servidor com a service role.
 *
 * O envio vai direto do navegador para o Storage por uma URL assinada de envio (assim o
 * arquivo não passa pelo limite de corpo das funções da Vercel). O download redireciona para
 * uma URL assinada de validade curta. O bucket é criado na primeira vez que for preciso.
 *
 * Caminho no bucket: "arquivos/<uuid>/<nome do arquivo>".
 */
export const BUCKET_COPIAS = "copias";
const PASTA_COPIAS = "arquivos/";
const VALIDADE_DOWNLOAD_SEGUNDOS = 60;

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar configuradas.");
  return { base: `${url}/storage/v1`, cabecalhos: { apikey: chave, Authorization: `Bearer ${chave}` } };
}

function codificar(caminho: string): string {
  return caminho.split("/").map(encodeURIComponent).join("/");
}

async function exigirOk(resposta: Response, acao: string): Promise<Response> {
  if (!resposta.ok) {
    const texto = await resposta.text().catch(() => "");
    throw new Error(`Storage cópias (${acao}): ${resposta.status} ${texto.slice(0, 200)}`);
  }
  return resposta;
}

const globalBucket = globalThis as unknown as { __quasarBucketCopias?: Promise<void> };

/** Cria o bucket privado "copias" se ainda não existir (uma vez por instância). */
function garantirBucket(): Promise<void> {
  if (!globalBucket.__quasarBucketCopias) {
    globalBucket.__quasarBucketCopias = (async () => {
      const { base, cabecalhos } = config();
      const existe = await fetch(`${base}/bucket/${BUCKET_COPIAS}`, { headers: cabecalhos, cache: "no-store" });
      if (existe.ok) return;
      const criado = await fetch(`${base}/bucket`, {
        method: "POST",
        headers: { ...cabecalhos, "Content-Type": "application/json" },
        body: JSON.stringify({ id: BUCKET_COPIAS, name: BUCKET_COPIAS, public: false, file_size_limit: TAMANHO_MAXIMO_ARQUIVO_COPIA }),
      });
      // Outra instância pode ter criado ao mesmo tempo.
      if (!criado.ok && !/exists|Duplicate/i.test(await criado.clone().text())) await exigirOk(criado, "criar bucket");
    })().catch((e) => {
      globalBucket.__quasarBucketCopias = undefined;
      throw e;
    });
  }
  return globalBucket.__quasarBucketCopias;
}

/** Extensões permitidas pelo parâmetro "Tipos de arquivo para anexar em 'Cópias'". */
export async function extensoesPermitidas(): Promise<string[]> {
  const { rows } = await query<{ ds_regra: string | null }>("select ds_regra from copia_param_tipos_arquivo where nr_sequencia = 1");
  return extensoesPermitidasCopia(rows.length === 0 ? null : rows[0].ds_regra ?? "");
}

/**
 * Nome aceito pelo Storage: sem acentos e só com caracteres seguros (o Storage recusa
 * chaves com caracteres fora do ASCII). A extensão é mantida.
 */
function nomeSeguro(nome: string): string {
  const limpo = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ._()\-]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  const ext = extensaoDoArquivo(limpo);
  const base = (ext ? limpo.slice(0, -(ext.length + 1)) : limpo).replace(/^[.\s]+/, "").slice(0, 150) || "arquivo";
  return ext ? `${base}.${ext}` : base;
}

/** Caminho válido de um arquivo de cópia (ou null). */
export function caminhoValido(valor: string): string | null {
  const v = String(valor ?? "").trim().replace(/^\/+/, "");
  if (!v.startsWith(PASTA_COPIAS) || v.includes("..") || /[\\\x00-\x1f]/.test(v)) return null;
  const partes = v.slice(PASTA_COPIAS.length).split("/");
  if (partes.length !== 2 || !/^[0-9a-f-]{36}$/.test(partes[0]) || !partes[1]) return null;
  return v;
}

/** Valida o arquivo e devolve a URL assinada para o navegador enviá-lo (PUT) e o caminho a gravar em ie_arquivo. */
export async function assinarEnvio(nome: string, tamanho: number): Promise<{ url: string; caminho: string }> {
  const n = String(nome ?? "").trim();
  if (!n || n.length > 255) throw new ErroValidacao("Nome de arquivo inválido.");
  const permitidas = await extensoesPermitidas();
  const ext = extensaoDoArquivo(n);
  if (!ext || !permitidas.includes(ext)) {
    throw new ErroValidacao(
      permitidas.length === 0
        ? "Nenhum tipo de arquivo está liberado em Controle de Cópias > Parâmetros."
        : `Tipo de arquivo não permitido. Aceitos: ${permitidas.map((e) => `.${e}`).join(", ")}`
    );
  }
  if (!Number.isFinite(tamanho) || tamanho <= 0) throw new ErroValidacao("Arquivo vazio.");
  if (tamanho > TAMANHO_MAXIMO_ARQUIVO_COPIA) {
    throw new ErroValidacao(`O arquivo deve ter no máximo ${TAMANHO_MAXIMO_ARQUIVO_COPIA / 1024 / 1024} MB.`);
  }
  await garantirBucket();
  const caminho = `${PASTA_COPIAS}${randomUUID()}/${nomeSeguro(n)}`;
  const { base, cabecalhos } = config();
  const resposta = await exigirOk(
    await fetch(`${base}/object/upload/sign/${BUCKET_COPIAS}/${codificar(caminho)}`, {
      method: "POST",
      headers: { ...cabecalhos, "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store",
    }),
    "assinar envio"
  );
  const { url } = (await resposta.json()) as { url: string };
  return { url: `${base}${url.startsWith("/") ? "" : "/"}${url}`, caminho };
}

/** URL assinada (curta) para baixar ou abrir o arquivo; null se não existe. */
export async function urlDeDownload(caminho: string, baixar: boolean): Promise<string | null> {
  const { base, cabecalhos } = config();
  const resposta = await fetch(`${base}/object/sign/${BUCKET_COPIAS}/${codificar(caminho)}`, {
    method: "POST",
    headers: { ...cabecalhos, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: VALIDADE_DOWNLOAD_SEGUNDOS }),
    cache: "no-store",
  });
  if (resposta.status === 400 || resposta.status === 404) return null;
  await exigirOk(resposta, "assinar download");
  const { signedURL } = (await resposta.json()) as { signedURL: string };
  const nome = caminho.slice(caminho.lastIndexOf("/") + 1);
  const sufixo = baixar ? `&download=${encodeURIComponent(nome)}` : "";
  return `${base}${signedURL.startsWith("/") ? "" : "/"}${signedURL}${sufixo}`;
}
