import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import type { Registro } from "@/lib/server/esquema";

/**
 * Sessão de login. O navegador recebe um cookie HttpOnly com um token
 * aleatório; o banco guarda só o SHA-256 do token (tabela sessao).
 */
const COOKIE = "quasar_sessao";
const DURACAO_DIAS = 30;

export interface Sessao {
  /** nr_sequencia do usuário logado. */
  nrUsuario: number;
  /** Nome usado na auditoria (ds_usuario), como a tela sempre gravou. */
  nomeUsuario: string;
  /** Linha completa do usuário (formato do banco). */
  usuario: Registro;
}

export class ErroSemSessao extends Error {}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function nomeParaAuditoria(usuario: Registro): string {
  return String(usuario.ds_usuario ?? "").trim() || "-";
}

export async function criarSessao(nrUsuario: number): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expira = new Date(Date.now() + DURACAO_DIAS * 24 * 60 * 60 * 1000);
  await query("delete from sessao where dt_expiracao < now()");
  await query("insert into sessao (ds_token_hash, nr_seq_usuario, dt_expiracao) values ($1, $2, $3)", [hashToken(token), nrUsuario, expira.toISOString()]);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expira,
  });
}

export async function encerrarSessao(): Promise<void> {
  const loja = await cookies();
  const token = loja.get(COOKIE)?.value;
  if (token) await query("delete from sessao where ds_token_hash = $1", [hashToken(token)]);
  loja.delete(COOKIE);
}

/** Sessão válida do pedido atual, ou null. Usuário bloqueado/inativo perde a sessão. */
export async function obterSessao(): Promise<Sessao | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const { rows } = await query<Registro>(
    `select u.* from sessao s join usuario u on u.nr_sequencia = s.nr_seq_usuario
      where s.ds_token_hash = $1 and s.dt_expiracao > now()`,
    [hashToken(token)]
  );
  const usuario = rows[0];
  if (!usuario) return null;
  const status = String(usuario.ie_status ?? "A").toUpperCase();
  if (status === "B" || status === "I") return null;
  return { nrUsuario: Number(usuario.nr_sequencia), nomeUsuario: nomeParaAuditoria(usuario), usuario };
}

export async function exigirSessao(): Promise<Sessao> {
  const sessao = await obterSessao();
  if (!sessao) throw new ErroSemSessao("Sessão expirada. Entre novamente.");
  return sessao;
}
