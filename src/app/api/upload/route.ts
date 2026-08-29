import { NextRequest, NextResponse } from "next/server";
import { writeFile, access } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    // Validar tipo de arquivo
    const allowedExtensions = [".jpeg", ".jpg", ".png"];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some((ext) => fileName.endsWith(ext));
    if (!hasValidExtension) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido. Aceitos: .jpeg, .jpg, .png" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "images");
    const filePath = path.join(uploadDir, file.name);

    // Verificar se o arquivo já existe
    try {
      await access(filePath);
      return NextResponse.json(
        { error: "A imagem já existe." },
        { status: 409 }
      );
    } catch {
      // Arquivo não existe, pode prosseguir
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filePath, buffer);

    return NextResponse.json({ path: `/images/${file.name}` });
  } catch (error) {
    console.error("Erro no upload:", error);
    return NextResponse.json({ error: "Erro ao fazer upload" }, { status: 500 });
  }
}
