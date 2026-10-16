import { list } from "@vercel/blob";

/** Pasta das imagens dentro do Vercel Blob (equivale ao antigo public/images/). */
export const IMAGENS_PREFIXO = "images/";

/** Extensões de imagem aceitas pelo cadastro. */
export const EXTENSOES_IMAGEM = [".jpeg", ".jpg", ".png"];

/** Imagens novas ficam no Vercel Blob (URL https). Caminhos /images/... são legados do public/. */
export function ehUrlBlob(caminho: string): boolean {
  return /^https?:\/\//i.test(caminho);
}

/** Verifica se já existe um arquivo com este nome no Blob. */
export async function existeImagemNoBlob(nomeArquivo: string): Promise<boolean> {
  const pathname = IMAGENS_PREFIXO + nomeArquivo;
  const resultado = await list({ prefix: pathname, limit: 100 });
  return resultado.blobs.some((blob) => blob.pathname === pathname);
}
