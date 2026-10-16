import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { EXTENSOES_IMAGEM, IMAGENS_PREFIXO, existeImagemNoBlob } from "@/lib/blobImagens";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    // Validar tipo de arquivo
    const fileName = file.name.toLowerCase();
    const hasValidExtension = EXTENSOES_IMAGEM.some((ext) => fileName.endsWith(ext));
    if (!hasValidExtension) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido. Aceitos: .jpeg, .jpg, .png" },
        { status: 400 }
      );
    }

    // Verificar se o arquivo já existe
    if (await existeImagemNoBlob(file.name)) {
      return NextResponse.json({ error: "A imagem já existe." }, { status: 409 });
    }

    const bytes = await file.arrayBuffer();

    const blob = await put(IMAGENS_PREFIXO + file.name, Buffer.from(bytes), {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type || undefined,
    });

    // Guarda a URL pública do Blob, que é o que a tela e os relatórios usam
    return NextResponse.json({ path: blob.url });
  } catch (error) {
    console.error("Erro no upload:", error);
    return NextResponse.json({ error: "Erro ao fazer upload" }, { status: 500 });
  }
}
