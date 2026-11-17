import { atualizarDado, criarDado, excluirDado, listarDados, obterDado } from "@/lib/apiCliente";
import type { Imagem } from "@/types/imagem";

const COLLECTION = "imagem";

export async function obterImagens(): Promise<Imagem[]> {
  const list = await listarDados<Imagem>(COLLECTION);
  list.sort((a, b) => (a.nr_sequencia ?? 0) - (b.nr_sequencia ?? 0));
  return list;
}

/** O autor vem da sessão no servidor (o parâmetro `usuario` é mantido só pela assinatura). */
export async function criarImagem(
  data: Omit<Imagem, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
  _usuario?: string
): Promise<string> {
  return (await criarDado<Imagem>(COLLECTION, data)).id;
}

export async function atualizarImagem(
  id: string,
  data: Partial<Imagem>,
  _usuario?: string
): Promise<void> {
  await atualizarDado(COLLECTION, id, data);
}

export async function excluirImagem(id: string): Promise<void> {
  await excluirDado(COLLECTION, id);
}

/** Exclui o arquivo da imagem no Storage. */
export async function excluirArquivoImagem(filePath: string): Promise<void> {
  if (!filePath) return;
  try {
    await fetch('/api/delete-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath }),
    });
  } catch (e) {
    console.error('Erro ao excluir arquivo de imagem:', e);
  }
}

/** Renomeia o arquivo da imagem no Storage e retorna o novo caminho. */
export async function renomearArquivoImagem(oldPath: string, newFileName: string): Promise<string> {
  const res = await fetch('/api/rename-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldPath, newFileName }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao renomear arquivo');
  }
  const result = await res.json();
  return result.path;
}

export async function obterImagemPorId(id: string): Promise<Imagem | null> {
  return obterDado<Imagem>(COLLECTION, id);
}

/**
 * Upload de imagem para o Supabase Storage (bucket privado).
 * Retorna o caminho que a tela guarda em ie_arquivo (ex.: /api/imagens/arquivo/images/arquivo.png).
 */
export async function uploadImagem(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("directory", "images");

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro ao fazer upload da imagem" }));
    throw new Error(err.error || "Erro ao fazer upload da imagem");
  }

  const result = await res.json();
  return result.path || `/images/${file.name}`;
}
