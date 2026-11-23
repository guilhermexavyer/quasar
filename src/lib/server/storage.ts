import "server-only";

/**
 * Imagens no Supabase Storage (bucket privado "imagens"), acessado só pelo
 * servidor com a service role, pela API REST do Storage (sem Data API).
 *
 * Caminho no bucket: "images/<arquivo>". Cada projeto Supabase é um ambiente,
 * então não há mais pastas por base como no Vercel Blob.
 */
export const BUCKET = "imagens";
export const PASTA = "images/";

/** Extensões aceitas pelo cadastro de imagens. */
export const EXTENSOES_IMAGEM = [".jpeg", ".jpg", ".png"];

/** Prefixo da rota que entrega o arquivo à tela (a tela guarda e usa este caminho em ie_arquivo). */
export const PREFIXO_ROTA = "/api/imagens/arquivo/";

/** URLs assinadas valem pouco: só o tempo de o servidor buscar o arquivo. */
const VALIDADE_URL_SEGUNDOS = 60;

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar configuradas.");
  return { base: `${url}/storage/v1`, cabecalhos: { apikey: chave, Authorization: `Bearer ${chave}` } };
}

function codificar(caminho: string): string {
  return caminho.split("/").map(encodeURIComponent).join("/");
}

export class ErroStorage extends Error {
  status: number;
  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.status = status;
  }
}

async function exigirOk(resposta: Response, acao: string): Promise<Response> {
  if (!resposta.ok) {
    const texto = await resposta.text().catch(() => "");
    throw new ErroStorage(`Storage (${acao}): ${resposta.status} ${texto.slice(0, 200)}`, resposta.status);
  }
  return resposta;
}

/** Nome de arquivo seguro: sem barras nem "..", com extensão de imagem aceita. */
export function nomeArquivoValido(nome: string): boolean {
  const n = nome.trim();
  if (!n || n.length > 200 || /[\\/]/.test(n) || n.includes("..") || /[\x00-\x1f]/.test(n)) return false;
  return EXTENSOES_IMAGEM.some((ext) => n.toLowerCase().endsWith(ext));
}

/**
 * Nome aceito pelo Supabase Storage, que recusa chaves com acentos e outros
 * caracteres fora do ASCII: "Açaí 1º.png" vira "Acai 1_.png".
 */
export function nomeParaStorage(nome: string): string {
  return nome
    .trim()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^A-Za-z0-9 ._()\-]/g, "_");
}

export function mimeDoArquivo(nome: string): string {
  return nome.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
}

/** Caminho no bucket a partir do que a tela usa (URL da rota, "images/x.png" ou "/images/x.png"). */
export function caminhoDoStorage(valor: string): string | null {
  let v = String(valor ?? "").trim();
  if (!v) return null;
  if (v.startsWith(PREFIXO_ROTA)) v = v.slice(PREFIXO_ROTA.length);
  try {
    v = decodeURIComponent(v);
  } catch {
    return null;
  }
  v = v.replace(/^\/+/, "");
  if (!v.startsWith(PASTA)) return null;
  return nomeArquivoValido(v.slice(PASTA.length)) ? v : null;
}

/** Caminho do arquivo que a tela usa em <img src>, fetch e download. */
export function urlDaRota(caminho: string): string {
  return PREFIXO_ROTA + codificar(caminho);
}

export interface InfoArquivo {
  tamanho: number;
  mime: string;
}

/** Metadados do arquivo, ou null se não existe. */
export async function infoArquivo(caminho: string): Promise<InfoArquivo | null> {
  const { base, cabecalhos } = config();
  const pasta = caminho.slice(0, caminho.lastIndexOf("/") + 1);
  const nome = caminho.slice(pasta.length);
  const resposta = await exigirOk(
    await fetch(`${base}/object/list/${BUCKET}`, {
      method: "POST",
      headers: { ...cabecalhos, "Content-Type": "application/json" },
      body: JSON.stringify({ prefix: pasta, search: nome, limit: 100 }),
      cache: "no-store",
    }),
    "listar"
  );
  const itens = (await resposta.json()) as { name: string; metadata?: { size?: number; mimetype?: string } }[];
  const item = itens.find((i) => i.name === nome);
  if (!item) return null;
  return { tamanho: Number(item.metadata?.size ?? 0), mime: item.metadata?.mimetype ?? mimeDoArquivo(nome) };
}

/** Envia o arquivo. Não sobrescreve: se já existir, lança ErroStorage com status 409. */
export async function enviarArquivo(caminho: string, conteudo: Buffer, mime: string): Promise<void> {
  if (await infoArquivo(caminho)) throw new ErroStorage("A imagem já existe.", 409);
  const { base, cabecalhos } = config();
  const resposta = await fetch(`${base}/object/${BUCKET}/${codificar(caminho)}`, {
    method: "POST",
    headers: { ...cabecalhos, "Content-Type": mime, "x-upsert": "false", "cache-control": "3600" },
    body: new Uint8Array(conteudo),
  });
  if (resposta.status === 409 || resposta.status === 400) {
    const texto = await resposta.text();
    if (/exists|Duplicate/i.test(texto)) throw new ErroStorage("A imagem já existe.", 409);
    throw new ErroStorage(`Storage (enviar): ${resposta.status} ${texto.slice(0, 200)}`, resposta.status);
  }
  await exigirOk(resposta, "enviar");
}

export async function moverArquivo(origem: string, destino: string): Promise<void> {
  if (await infoArquivo(destino)) throw new ErroStorage("A imagem já existe.", 409);
  const { base, cabecalhos } = config();
  await exigirOk(
    await fetch(`${base}/object/move`, {
      method: "POST",
      headers: { ...cabecalhos, "Content-Type": "application/json" },
      body: JSON.stringify({ bucketId: BUCKET, sourceKey: origem, destinationKey: destino }),
    }),
    "mover"
  );
}

export async function removerArquivo(caminho: string): Promise<void> {
  const { base, cabecalhos } = config();
  await exigirOk(
    await fetch(`${base}/object/${BUCKET}`, {
      method: "DELETE",
      headers: { ...cabecalhos, "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: [caminho] }),
    }),
    "remover"
  );
}

/** Baixa o arquivo por uma URL assinada de validade curta. null se não existe. */
export async function baixarArquivo(caminho: string): Promise<Response | null> {
  const { base, cabecalhos } = config();
  const assinatura = await fetch(`${base}/object/sign/${BUCKET}/${codificar(caminho)}`, {
    method: "POST",
    headers: { ...cabecalhos, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: VALIDADE_URL_SEGUNDOS }),
    cache: "no-store",
  });
  if (assinatura.status === 400 || assinatura.status === 404) return null;
  await exigirOk(assinatura, "assinar");
  const { signedURL } = (await assinatura.json()) as { signedURL: string };
  const arquivo = await fetch(`${base}${signedURL}`, { cache: "no-store" });
  if (arquivo.status === 400 || arquivo.status === 404) return null;
  return exigirOk(arquivo, "baixar");
}
