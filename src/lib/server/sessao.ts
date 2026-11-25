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
  // Data e horário do último login (coluna Último login de Administração do Sistema > Usuários).
  try {
    await query("update usuario set dt_ultimo_login = now() where nr_sequencia = $1", [Number(usuario.nr_sequencia)]);
  } catch (e) {
    console.error("[usuario] não foi possível registrar o último login:", e);
  }
}

export async function criarSessao(usuario: Registro): Promise<void> {
  const nrUsuario = Number(usuario.nr_sequencia);
  const token = randomBytes(32).toString("base64url");
  const expira = new Date(Date.now() + DURACAO_DIAS * 24 * 60 * 60 * 1000);
  // Sessões vencidas pela regra de logout automático saem antes (registradas como Automático).
  await aplicarLogoutAutomatico(true);
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

/** Horário de Brasília (sem horário de verão desde 2019): a regra de logout usa a hora local. */
const FUSO_BRASILIA_MS = -3 * 60 * 60 * 1000;

/**
 * Último logout automático programado até `agora`, pela regra de Administração
 * do Sistema > Sistema (dia e horário em hora de Brasília). Mesma conta de
 * ultimoLogoutProgramado (src/lib/regraUtils.ts), feita no servidor.
 */
function ultimoLogoutProgramadoServidor(dia: string, horario: string, agora: Date): Date | null {
  const m = /^(\d{2}):(\d{2})$/.exec(horario);
  if (!m || !/^[0-6T]$/.test(dia)) return null;
  const local = new Date(agora.getTime() + FUSO_BRASILIA_MS);
  for (let atras = 0; atras <= 7; atras++) {
    const candidatoLocal = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - atras, Number(m[1]), Number(m[2]));
    const candidato = new Date(candidatoLocal - FUSO_BRASILIA_MS);
    if (candidato > agora) continue;
    if (dia === "T" || new Date(candidatoLocal).getUTCDay() === Number(dia)) return candidato;
  }
  return null;
}

let ultimaVerificacaoRegra = 0;

/**
 * Logout automático também no servidor: encerra as sessões iniciadas antes do
 * último horário programado (e depois da vigência da regra) e completa o
 * registro em Logs > Acessos com o horário programado e Tipo de logout
 * Automático. Cobre o que a tela não consegue registrar: aba fechada ou
 * computador suspenso no horário, ou o aviso de logout que não chegou ao
 * servidor. Roda no login, no logout e, no máximo a cada 30 s, nos pedidos.
 */
export async function aplicarLogoutAutomatico(forcar = false): Promise<void> {
  const agora = Date.now();
  if (!forcar && agora - ultimaVerificacaoRegra < 30_000) return;
  ultimaVerificacaoRegra = agora;
  try {
    const { rows } = await query<{ ie_logout_dia: string | null; hr_logout: string | null; dt_vigencia_logout: string | null; dt_alteracao: string | null }>(
      "select ie_logout_dia, hr_logout, dt_vigencia_logout, dt_alteracao from regra limit 1"
    );
    const regra = rows[0];
    if (!regra) return;
    const programado = ultimoLogoutProgramadoServidor(String(regra.ie_logout_dia ?? ""), String(regra.hr_logout ?? ""), new Date(agora));
    if (!programado) return;
    const vigencia = Date.parse(String(regra.dt_vigencia_logout ?? regra.dt_alteracao ?? "")) || 0;
    if (programado.getTime() <= vigencia) return;
    await query(
      `with encerradas as (delete from sessao where dt_criacao < $1 returning nr_sequencia)
       update log_acesso set dt_logout = $1, ie_tipo_logout = 'A'
        where nr_seq_sessao in (select nr_sequencia from encerradas) and dt_logout is null`,
      [programado.toISOString()]
    );
  } catch (e) {
    console.error("[log_acesso] não foi possível aplicar o logout automático:", e);
  }
}

export async function encerrarSessao(tipo: TipoLogout = "M"): Promise<void> {
  // Sessão já vencida pela regra fica registrada como Automático, mesmo que o pedido diga outra coisa.
  await aplicarLogoutAutomatico(true);
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
  await aplicarLogoutAutomatico();
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
