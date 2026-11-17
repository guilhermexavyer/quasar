import "server-only";
import { query } from "@/lib/db";
import { parsePermissoesConfigMigrada, temPermissao, type PermissoesConfig } from "@/lib/permissoesUtils";
import type { Registro } from "@/lib/server/esquema";
import { ErroAcesso } from "@/lib/server/http";
import type { PerfilEmUso } from "@/lib/server/repositorio";
import type { Sessao } from "@/lib/server/sessao";

/**
 * Regras de acesso aplicadas no servidor nesta etapa (as mesmas que a tela já
 * aplicava, agora sem depender do navegador):
 *   - o usuário 'administrador' e o perfil 'Administrador' só podem ser
 *     alterados/excluídos pelo próprio administrador;
 *   - gerir usuários e perfis exige a permissão correspondente do perfil ativo.
 * PENDÊNCIA: checagem por função/permissão nas demais tabelas.
 */

export function ehAdministrador(usuario: Registro | null | undefined): boolean {
  return String(usuario?.ds_usuario ?? "").trim().toLowerCase() === "administrador";
}

function ehPerfilAdministrador(perfil: Registro | null | undefined): boolean {
  return String(perfil?.ds_perfil ?? "").trim().toLowerCase() === "administrador";
}

/** nr_sequencia dos perfis delegados ao usuário (config_perfis). */
export function perfisDoUsuario(usuario: Registro): number[] {
  let bruto: unknown = usuario.config_perfis;
  if (typeof bruto === "string") {
    try {
      bruto = JSON.parse(bruto);
    } catch {
      return [];
    }
  }
  return Array.isArray(bruto) ? bruto.filter((v) => typeof v === "number") : [];
}

/** Perfis vinculados e ativos do usuário, na mesma ordem que a tela usa (alfabética). */
async function perfisVinculados(sessao: Sessao): Promise<Registro[]> {
  const ids = perfisDoUsuario(sessao.usuario);
  if (ids.length === 0) return [];
  const { rows } = await query<Registro>("select * from perfil where nr_sequencia = any($1::bigint[])", [ids]);
  const admin = ehAdministrador(sessao.usuario);
  return rows
    .filter((p) => String(p.ie_status ?? "").toUpperCase() === "A" && (admin || !ehPerfilAdministrador(p)))
    .sort((a, b) => String(a.ds_perfil ?? "").localeCompare(String(b.ds_perfil ?? ""), "pt-BR"));
}

/** Permissões do perfil ativo (config_perfil_ativo, ou o primeiro vinculado). null = administrador sem perfis: tudo liberado. */
async function permissoesAtivas(sessao: Sessao): Promise<PermissoesConfig | null> {
  const perfis = await perfisVinculados(sessao);
  if (perfis.length === 0) return ehAdministrador(sessao.usuario) ? null : {};
  const nrAtivo = Number(sessao.usuario.config_perfil_ativo);
  const ativo = perfis.find((p) => Number(p.nr_sequencia) === nrAtivo) ?? perfis[0];
  const bruto = ativo.config_permissoes;
  const texto = bruto == null ? null : typeof bruto === "string" ? bruto : JSON.stringify(bruto);
  const versao = ativo.config_permissoes_v == null ? undefined : Number(ativo.config_permissoes_v);
  return parsePermissoesConfigMigrada(texto, versao);
}

async function exigirPermissao(sessao: Sessao, permissao: string) {
  const config = await permissoesAtivas(sessao);
  if (config !== null && !temPermissao(config, "administracaoSistema", permissao)) {
    throw new ErroAcesso("Você não tem permissão para esta operação.");
  }
}

/** Confere se o usuário logado pode gravar/excluir em `usuario` ou `perfil`. Demais tabelas: basta a sessão. */
export async function exigirAcessoEscrita(
  sessao: Sessao, tabela: string, operacao: "criar" | "atualizar" | "excluir",
  atual: Registro | null, dados?: Registro
): Promise<void> {
  const admin = ehAdministrador(sessao.usuario);
  if (tabela === "usuario") {
    const ehProprio = atual != null && Number(atual.nr_sequencia) === sessao.nrUsuario;
    const chaves = Object.keys(dados ?? {});
    // Trocar a própria senha é sempre permitido.
    if (operacao === "atualizar" && ehProprio && chaves.length === 1 && chaves[0] === "ds_senha") return;
    if (!admin && ehAdministrador(atual)) throw new ErroAcesso("O usuário administrador não pode ser alterado por outros usuários.");
    if (!admin && operacao !== "excluir" && ehAdministrador(dados)) throw new ErroAcesso("Nome de usuário reservado.");
    await exigirPermissao(sessao, "acessar_usuarios");
  } else if (tabela === "perfil") {
    // Migração automática da versão das permissões, feita pela tela de qualquer usuário.
    const chaves = Object.keys(dados ?? {}).sort().join(",");
    if (operacao === "atualizar" && chaves === "config_permissoes,config_permissoes_v") return;
    if (!admin && ehPerfilAdministrador(atual)) throw new ErroAcesso("O perfil Administrador não pode ser alterado por outros usuários.");
    await exigirPermissao(sessao, "acessar_perfis");
  }
}

/** Perfil em uso informado pela tela ao excluir: só vale se for um perfil do próprio usuário. */
export async function perfilEmUso(sessao: Sessao, nrPerfil: number | null): Promise<PerfilEmUso | undefined> {
  if (nrPerfil == null) return undefined;
  const perfil = (await perfisVinculados(sessao)).find((p) => Number(p.nr_sequencia) === nrPerfil);
  return perfil ? { nr_sequencia: Number(perfil.nr_sequencia), ds_perfil: String(perfil.ds_perfil ?? "") } : undefined;
}
