import type { NextRequest } from "next/server";
import { erro, rota } from "@/lib/server/http";
import { baixarArquivo, caminhoDoStorage, PASTA } from "@/lib/server/storage";

/**
 * Entrega o arquivo de uma imagem a quem está logado. O servidor gera uma URL
 * assinada de validade curta no Supabase Storage, busca o arquivo e o repassa.
 * Como a resposta vem do próprio site, <img>, download e a geração de PDF
 * (jspdf/html2pdf) funcionam sem depender de CORS.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ caminho: string[] }> }) {
  const { caminho: partes } = await params;
  return rota(request, async () => {
    const caminho = caminhoDoStorage(partes.join("/"));
    if (!caminho || !caminho.startsWith(PASTA)) return erro("Caminho inválido", 400);

    const arquivo = await baixarArquivo(caminho);
    if (!arquivo || !arquivo.body) return erro("Imagem não encontrada", 404);

    return new Response(arquivo.body, {
      headers: {
        "Content-Type": arquivo.headers.get("content-type") ?? "application/octet-stream",
        ...(arquivo.headers.get("content-length") ? { "Content-Length": arquivo.headers.get("content-length")! } : {}),
        // Só o próprio navegador guarda, por pouco tempo (a imagem pode ser trocada).
        "Cache-Control": "private, max-age=60",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
