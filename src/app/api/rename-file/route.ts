import { NextRequest, NextResponse } from "next/server";
import { put, rename } from "@vercel/blob";
import { readFile } from "fs/promises";
import path from "path";
import {
  EXTENSOES_IMAGEM,
  IMAGENS_PREFIXO,
  ehUrlBlob,
  existeImagemNoBlob,
} from "@/lib/blobImagens";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const oldPath = body.oldPath as string;
    const newFileName = body.newFileName as string;

    if (!oldPath || !newFileName) {
      return NextResponse.json({ error: "Parâmetros não informados" }, { status: 400 });
    }

    // Validar tipo de arquivo
    const lowerName = newFileName.toLowerCase();
    const hasValidExtension = EXTENSOES_IMAGEM.some((ext) => lowerName.endsWith(ext));
    if (!hasValidExtension) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido. Aceitos: .jpeg, .jpg, .png" },
        { status: 400 }
      );
    }

    if (!ehUrlBlob(oldPath) && !oldPath.startsWith("/images/")) {
      return NextResponse.json({ error: "Caminho inválido" }, { status: 400 });
    }

    // Verificar se o novo nome já existe
    if (await existeImagemNoBlob(newFileName)) {
      return NextResponse.json({ error: "A imagem já existe." }, { status: 409 });
    }

    const novoPathname = IMAGENS_PREFIXO + newFileName;

    if (ehUrlBlob(oldPath)) {
      // Renomear dentro do Blob (sem reenviar o arquivo)
      const resultado = await rename(oldPath, novoPathname, { access: "public" });
      return NextResponse.json({ path: resultado.url });
    }

    // Imagem legada do repositório: copia para o Blob com o novo nome
    const arquivoLocal = path.join(process.cwd(), "public", oldPath);
    let conteudo: Buffer;
    try {
      conteudo = await readFile(arquivoLocal);
    } catch {
      return NextResponse.json({ error: "Arquivo original não encontrado" }, { status: 404 });
    }
    const blob = await put(novoPathname, conteudo, {
      access: "public",
      addRandomSuffix: false,
    });
    return NextResponse.json({ path: blob.url });
  } catch (error) {
    console.error("Erro ao renomear arquivo:", error);
    return NextResponse.json({ error: "Erro ao renomear arquivo" }, { status: 500 });
  }
}
