import { NextRequest, NextResponse } from "next/server";
import { rename, access } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const oldPath = body.oldPath as string;
    const newFileName = body.newFileName as string;

    if (!oldPath || !newFileName) {
      return NextResponse.json({ error: "Parâmetros não informados" }, { status: 400 });
    }

    // Validar tipo de arquivo
    const allowedExtensions = [".jpeg", ".jpg", ".png"];
    const lowerName = newFileName.toLowerCase();
    const hasValidExtension = allowedExtensions.some((ext) => lowerName.endsWith(ext));
    if (!hasValidExtension) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido. Aceitos: .jpeg, .jpg, .png" },
        { status: 400 }
      );
    }

    // Sanitizar: aceitar apenas caminhos em /images/
    if (!oldPath.startsWith("/images/")) {
      return NextResponse.json({ error: "Caminho inválido" }, { status: 400 });
    }

    const imagesDir = path.join(process.cwd(), "public", "images");
    const oldFullPath = path.join(process.cwd(), "public", oldPath);
    const newFullPath = path.join(imagesDir, newFileName);

    // Verificar se o arquivo original existe
    try {
      await access(oldFullPath);
    } catch {
      return NextResponse.json({ error: "Arquivo original não encontrado" }, { status: 404 });
    }

    // Verificar se o novo nome já existe
    try {
      await access(newFullPath);
      return NextResponse.json({ error: "A imagem já existe." }, { status: 409 });
    } catch {
      // OK, nome disponível
    }

    await rename(oldFullPath, newFullPath);
    return NextResponse.json({ path: `/images/${newFileName}` });
  } catch (error) {
    console.error("Erro ao renomear arquivo:", error);
    return NextResponse.json({ error: "Erro ao renomear arquivo" }, { status: 500 });
  }
}
