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

/** Tipo do logout registrado em Logs > Acessos: M = manual (botão Sair), A = automático (regra de logout). */
export type TipoLogout = "M" | "A";

/**
 * Registra o login em Logs > Acessos (log_acesso), com o usuário e a pessoa física
 * como estão agora. Falha no log nunca impede o login.
 */
async function registrarLogin(usuario: Registro, nrSessao: number): Promise<void> {
  try {
    await query(
      `insert into log_acesso (nr_seq_usuario, nr_seq_sessao, ds_usuario, nr_seq_pessoa_fisica, ds_pessoa_fisica)
       select $1, $2, $3, $4::bigint, (select pf.ds_nome from pessoa_fisica pf where pf.nr_sequencia = $4::bigint)`,
      [Number(usuario.nr_sequencia), nrSessao, nomeParaAuditoria(usuario), usuario.nr_seq_pessoa_fisica ?? null]
    );
  } catch (e) {
    console.error("[log_acesso] não foi possível registrar o login:", e);
  }
}

export async function criarSessao(usuario: Registro): Promise<void> {
  const nrUsuario = Number(usuario.nr_sequencia);
  const token = randomBytes(32).toString("base64url");
  const expira = new Date(Date.now() + DURACAO_DIAS * 24 * 60 * 60 * 1000);
  await query("delete from sessao where dt_expiracao < now()");
  const { rows } = await query<{ nr_sequencia: string }>(
    "insert into sessao (ds_token_hash, nr_seq_usuario, dt_expiracao) values ($1, $2, $3) returning nr_sequencia",
    [hashToken(token), nrUsuario, expira.toISOString()]
  );
  await registrarLogin(usuario, Number(rows[0].nr_sequencia));
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expira,
  });
}

export async function encerrarSessao(tipo: TipoLogout = "M"): Promise<void> {
  const loja = await cookies();
  const token = loja.get(COOKIE)?.value;
  if (token) {
    const { rows } = await query<{ nr_sequencia: string }>(
      "delete from sessao where ds_token_hash = $1 returning nr_sequencia",
      [hashToken(token)]
    );
    // Completa o registro do login em Logs > Acessos (falha no log não impede o logout).
    if (rows[0]) {
      await query(
        "update log_acesso set dt_logout = now(), ie_tipo_logout = $2 where nr_seq_sessao = $1 and dt_logout is null",
        [Number(rows[0].nr_sequencia), tipo]
      ).catch((e) => console.error("[log_acesso] não foi possível registrar o logout:", e));
    }
  }
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
