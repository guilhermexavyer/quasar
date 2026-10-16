import { list } from "@vercel/blob";

/**
 * As imagens ficam no Vercel Blob, separadas por base (ambiente):
 *   producao/images/...     → site de produção (branch producao)
 *   homologacao/images/...  → homologação, previews e desenvolvimento local
 * Assim a mesma imagem pode existir nas duas bases sem conflito, e uma base
 * nunca apaga nem renomeia arquivos da outra.
 */
export type AmbienteBlob = "producao" | "homologacao";

/** Extensões de imagem aceitas pelo cadastro. */
export const EXTENSOES_IMAGEM = [".jpeg", ".jpg", ".png"];

/**
 * Ambiente atual. Em produção na Vercel (VERCEL_ENV=production) usa "producao";
 * em qualquer outro caso (preview, dev local) usa "homologacao".
 * BLOB_AMBIENTE=producao|homologacao força o valor (uso opcional).
 */
export function ambienteBlob(): AmbienteBlob {
  const forcado = process.env.BLOB_AMBIENTE;
  if (forcado === "producao" || forcado === "homologacao") return forcado;
  return process.env.VERCEL_ENV === "production" ? "producao" : "homologacao";
}

/** Pasta das imagens do ambiente atual dentro do Blob (ex.: "producao/images/"). */
export function pastaImagens(): string {
  return `${ambienteBlob()}/images/`;
}

/** Só URLs públicas do Vercel Blob são tratadas como Blob (evita buscar/apagar URLs de terceiros). */
export function ehUrlBlob(caminho: string): boolean {
  return /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(caminho);
}

/** Caminho do arquivo dentro do Blob (ex.: "producao/images/a.png") a partir da URL. */
export function pathnameDoBlob(url: string): string | null {
  try {
    return decodeURIComponent(new URL(url).pathname.replace(/^\//, ""));
  } catch {
    return null;
  }
}

/** Indica se a URL do Blob está na pasta do ambiente atual (só estes arquivos podem ser alterados). */
export function blobDoAmbienteAtual(url: string): boolean {
  const pathname = pathnameDoBlob(url);
  return !!pathname && pathname.startsWith(pastaImagens());
}

/** Verifica se já existe um arquivo com este nome na pasta do ambiente atual. */
export async function existeImagemNoBlob(nomeArquivo: string): Promise<boolean> {
  const pathname = pastaImagens() + nomeArquivo;
  const resultado = await list({ prefix: pathname, limit: 100 });
  return resultado.blobs.some((blob) => blob.pathname === pathname);
}
