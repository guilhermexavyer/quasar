import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { ehUrlBlob, blobDoAmbienteAtual } from "@/lib/blobImagens";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filePath = body.path as string;

    if (!filePath) {
      return NextResponse.json({ error: "Caminho não informado" }, { status: 400 });
    }

    // Imagens novas estão no Vercel Blob
    if (ehUrlBlob(filePath)) {
      // Só apaga arquivos da pasta deste ambiente; os de outra base (ex.: registros
      // copiados da produção) são preservados.
      if (!blobDoAmbienteAtual(filePath)) {
        console.warn("Exclusão ignorada: imagem pertence a outra base:", filePath);
        return NextResponse.json({ ok: true });
      }
      await del(filePath);
      return NextResponse.json({ ok: true });
    }

    // Imagens antigas (/images/...) ficam no código e não podem ser apagadas no Vercel
    if (!filePath.startsWith("/images/")) {
      return NextResponse.json({ error: "Caminho inválido" }, { status: 400 });
    }
    console.warn("Exclusão ignorada para imagem legada no repositório:", filePath);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir arquivo:", error);
    return NextResponse.json({ error: "Erro ao excluir arquivo" }, { status: 500 });
  }
}
