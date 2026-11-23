import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { corpo, erro, rota } from "@/lib/server/http";
import {
  caminhoDoStorage, enviarArquivo, ErroStorage, mimeDoArquivo, moverArquivo, nomeArquivoValido, nomeParaStorage, PASTA, urlDaRota,
} from "@/lib/server/storage";

/**
 * Renomeia o arquivo de uma imagem no Storage. Exige sessão.
 * Devolve { path } com o novo caminho (a tela grava em ie_arquivo).
 */
export async function POST(request: NextRequest) {
  return rota(request, async () => {
    const { oldPath, newFileName } = await corpo(request);
    if (typeof oldPath !== "string" || typeof newFileName !== "string" || !oldPath || !newFileName) {
      return erro("Parâmetros não informados", 400);
    }
    if (!nomeArquivoValido(newFileName)) {
      return erro("Tipo de arquivo não permitido. Aceitos: .jpeg, .jpg, .png", 400);
    }
    const destino = PASTA + nomeParaStorage(newFileName);

    try {
      // Imagem antiga do repositório (public/images): copia para o Storage com o novo nome.
      if (oldPath.startsWith("/images/")) {
        const local = path.join(process.cwd(), "public", "images", path.basename(oldPath));
        let conteudo: Buffer;
        try {
          conteudo = await readFile(local);
        } catch {
          return erro("Arquivo original não encontrado", 404);
        }
        await enviarArquivo(destino, conteudo, mimeDoArquivo(newFileName));
        return NextResponse.json({ path: urlDaRota(destino) });
      }

      const origem = caminhoDoStorage(oldPath);
      if (!origem) return erro("Caminho inválido", 400);
      if (origem === destino) return NextResponse.json({ path: urlDaRota(destino) });
      await moverArquivo(origem, destino);
      return NextResponse.json({ path: urlDaRota(destino) });
    } catch (e) {
      if (e instanceof ErroStorage && e.status === 409) return erro("A imagem já existe.", 409);
      if (e instanceof ErroStorage && (e.status === 400 || e.status === 404)) return erro("Arquivo original não encontrado", 404);
      console.error("Erro ao renomear arquivo:", e);
      return erro("Erro ao renomear arquivo", 500);
    }
  });
}
