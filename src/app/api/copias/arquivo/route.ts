import { NextResponse, type NextRequest } from "next/server";
import { exigirPermissaoDaFuncao } from "@/lib/server/acesso";
import { corpo, erro, rota } from "@/lib/server/http";
import { assinarEnvio, caminhoValido, urlDeDownload } from "@/lib/server/storageCopias";

/**
 * Arquivos de Controle de Cópias > Cópias.
 *   POST { nome, tamanho } → { url, caminho }: valida o tipo (parâmetro da função) e o tamanho e
 *        devolve a URL assinada para o navegador enviar o arquivo (PUT) direto ao Storage.
 *   GET ?caminho=...&baixar=1 → redireciona para uma URL assinada de validade curta.
 * Exigem sessão e acesso a Cópias.
 */
export async function POST(request: NextRequest) {
  return rota(request, async (sessao) => {
    await exigirPermissaoDaFuncao(sessao, "controleCopias", "acessar_copias");
    const { nome, tamanho } = await corpo(request);
    return NextResponse.json(await assinarEnvio(String(nome ?? ""), Number(tamanho)));
  });
}

export async function GET(request: NextRequest) {
  return rota(request, async (sessao) => {
    await exigirPermissaoDaFuncao(sessao, "controleCopias", "acessar_copias");
    const caminho = caminhoValido(request.nextUrl.searchParams.get("caminho") ?? "");
    if (!caminho) return erro("Caminho inválido", 400);
    const url = await urlDeDownload(caminho, request.nextUrl.searchParams.get("baixar") === "1");
    if (!url) return erro("Arquivo não encontrado", 404);
    return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "no-store" } });
  });
}
