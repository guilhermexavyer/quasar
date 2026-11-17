import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ErroValidacao } from "@/lib/server/esquema";
import { ErroSemSessao, exigirSessao, type Sessao } from "@/lib/server/sessao";

export class ErroAcesso extends Error {}
export class ErroConflito extends Error {}

export function erro(mensagem: string, status: number) {
  return NextResponse.json({ error: mensagem }, { status });
}

/** Pedidos que alteram dados precisam vir da própria origem do sistema (proteção contra CSRF). */
function origemValida(request: NextRequest): boolean {
  if (request.method === "GET" || request.method === "HEAD") return true;
  const origem = request.headers.get("origin");
  if (!origem) return true; // chamadas sem navegador (scripts, curl)
  try {
    return new URL(origem).host === request.headers.get("host");
  } catch {
    return false;
  }
}

function respostaDeErro(e: unknown) {
  if (e instanceof ErroSemSessao) return erro(e.message, 401);
  if (e instanceof ErroAcesso) return erro(e.message, 403);
  if (e instanceof ErroConflito) return erro(e.message, 409);
  if (e instanceof ErroValidacao) return erro(e.message, 400);
  const codigo = (e as { code?: string } | null)?.code;
  if (codigo === "23503") return erro("O registro está em uso ou referencia um registro que não existe.", 409);
  if (codigo === "23505") return erro("Já existe um registro com este valor.", 409);
  if (codigo === "23514" || codigo === "22P02" || codigo === "22007" || codigo === "22008" || codigo === "22003") {
    return erro("Valor inválido para um dos campos.", 400);
  }
  console.error("[api] erro inesperado:", e);
  return erro("Erro interno.", 500);
}

/** Executa uma rota pública (sem sessão), com tratamento de erro e checagem de origem. */
export async function rotaPublica(request: NextRequest, fn: () => Promise<Response>): Promise<Response> {
  try {
    if (!origemValida(request)) return erro("Origem não permitida.", 403);
    return await fn();
  } catch (e) {
    return respostaDeErro(e);
  }
}

/** Executa uma rota que exige usuário logado. */
export async function rota(request: NextRequest, fn: (sessao: Sessao) => Promise<Response>): Promise<Response> {
  return rotaPublica(request, async () => fn(await exigirSessao()));
}

/** Corpo JSON do pedido como objeto (ou erro 400). */
export async function corpo(request: NextRequest): Promise<Record<string, unknown>> {
  try {
    const dados = await request.json();
    if (dados && typeof dados === "object" && !Array.isArray(dados)) return dados as Record<string, unknown>;
  } catch {
    /* cai no erro abaixo */
  }
  throw new ErroValidacao("Corpo do pedido inválido.");
}

/** nr_sequencia vindo da URL (o `id` que a tela usa). */
export function numeroDaUrl(valor: string): number {
  const n = Number(valor);
  if (!/^\d+$/.test(valor) || !Number.isSafeInteger(n) || n < 1) throw new ErroValidacao("Identificador inválido.");
  return n;
}
