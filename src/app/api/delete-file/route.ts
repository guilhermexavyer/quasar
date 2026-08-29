import { NextRequest, NextResponse } from "next/server";
import { unlink, access } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filePath = body.path as string;

    if (!filePath) {
      return NextResponse.json({ error: "Caminho não informado" }, { status: 400 });
    }

    // Sanitizar: aceitar apenas caminhos em /images/
    if (!filePath.startsWith("/images/")) {
      return NextResponse.json({ error: "Caminho inválido" }, { status: 400 });
    }

    const fullPath = path.join(process.cwd(), "public", filePath);

    try {
      await access(fullPath);
    } catch {
      // Arquivo não existe, nada a fazer
      return NextResponse.json({ ok: true });
    }

    await unlink(fullPath);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir arquivo:", error);
    return NextResponse.json({ error: "Erro ao excluir arquivo" }, { status: 500 });
  }
}
