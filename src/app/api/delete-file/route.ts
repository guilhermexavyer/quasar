import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { corpo, erro, rota } from "@/lib/server/http";
import { caminhoDoStorage, removerArquivo } from "@/lib/server/storage";

/**
 * Apaga o arquivo de uma imagem no Storage. Exige sessão.
 * Se a imagem cadastrada com este arquivo estiver em uso num relatório, o
 * arquivo é mantido (o banco também recusará excluir o cadastro).
 */
export async function POST(request: NextRequest) {
  return rota(request, async () => {
    const { path } = await corpo(request);
    if (!path || typeof path !== "string") return erro("Caminho não informado", 400);

    // Imagens antigas que ficavam no repositório (/images/...) não podem ser apagadas.
    if (path.startsWith("/images/")) return NextResponse.json({ ok: true });

    const caminho = caminhoDoStorage(path);
    if (!caminho) return erro("Caminho inválido", 400);

    const { rows } = await query<{ n: number }>(
      `select count(*)::int as n from relatorio_banda_elemento e
         join imagem i on i.nr_sequencia = e.nr_seq_imagem
        where i.ds_caminho_storage = $1`,
      [caminho]
    );
    if (rows[0].n > 0) return erro("A imagem está em uso em um relatório.", 409);

    await removerArquivo(caminho);
    return NextResponse.json({ ok: true });
  });
}
