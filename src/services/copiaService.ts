import { api } from "@/lib/apiCliente";
import { mimeDoArquivoCopia } from "@/lib/copiaArquivoUtils";
import { createCadastroGeralService } from "@/services/cadastroGeralService";
import type { Copia } from "@/types/copia";

const service = createCadastroGeralService<Copia>("copia", "copia_sequence");

export const obterCopias = service.obterTodos;
export const criarCopia = service.criar;
export const atualizarCopia = service.atualizar;
export const excluirCopia = service.excluir;

/**
 * Envia o arquivo da cópia: o servidor valida o tipo (parâmetro de Controle de Cópias) e o
 * tamanho e devolve uma URL assinada; o arquivo vai direto do navegador para o Storage.
 * Devolve o caminho a gravar em ie_arquivo.
 */
export async function enviarArquivoCopia(arquivo: File): Promise<string> {
  const { url, caminho } = await api.post<{ url: string; caminho: string }>("/api/copias/arquivo", {
    nome: arquivo.name,
    tamanho: arquivo.size,
  });
  const resposta = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": arquivo.type || mimeDoArquivoCopia(arquivo.name), "x-upsert": "false" },
    body: arquivo,
  });
  if (!resposta.ok) throw new Error(`Falha ao enviar o arquivo (${resposta.status}).`);
  return caminho;
}
