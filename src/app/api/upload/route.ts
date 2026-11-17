import { NextResponse, type NextRequest } from "next/server";
import { erro, rota } from "@/lib/server/http";
import { enviarArquivo, ErroStorage, mimeDoArquivo, nomeArquivoValido, PASTA, urlDaRota } from "@/lib/server/storage";

const TAMANHO_MAXIMO = 5 * 1024 * 1024; // mesmo limite do bucket

/**
 * Envia uma imagem para o Supabase Storage (bucket privado). Exige sessão.
 * Devolve { path }: o caminho que a tela guarda em ie_arquivo e usa para exibir.
 */
export async function POST(request: NextRequest) {
  return rota(request, async () => {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return erro("Nenhum arquivo enviado", 400);

    if (!nomeArquivoValido(file.name)) {
      return erro("Tipo de arquivo não permitido. Aceitos: .jpeg, .jpg, .png", 400);
    }
    if (file.size > TAMANHO_MAXIMO) return erro("A imagem deve ter no máximo 5 MB.", 400);

    const caminho = PASTA + file.name.trim();
    try {
      await enviarArquivo(caminho, Buffer.from(await file.arrayBuffer()), mimeDoArquivo(file.name));
    } catch (e) {
      if (e instanceof ErroStorage && e.status === 409) return erro("A imagem já existe.", 409);
      console.error("Erro no upload:", e);
      return erro("Erro ao fazer upload", 500);
    }
    return NextResponse.json({ path: urlDaRota(caminho) });
  });
}
