import { api, criarServicoCrud, ErroApi } from "@/lib/apiCliente";
import type { Usuario } from "@/types/usuario";
import type { AuditAutor } from "@/services/auditService";

/**
 * Usuários. O servidor nunca devolve `ds_senha`: a lista vem sem o hash, e a
 * senha digitada (criação/troca) é enviada em texto e transformada em hash lá.
 * Login, sessão e conferência de senha também acontecem no servidor.
 */
const servico = criarServicoCrud<Usuario>("usuario");

/** Resultado do login, com as mesmas situações que a tela já tratava. */
export type ResultadoLogin =
  | { status: "ok"; usuario: Usuario }
  | { status: "invalido" | "bloqueado" | "inativo" | "sem_perfil" | "alterar_senha" };

/** Resultado da troca de senha pedida no login ("Alterar senha no próximo login"). */
export type ResultadoAlterarSenhaLogin = "ok" | "invalido" | "mesma_senha" | "nova_vazia";

/** Troca a senha no login (sem abrir sessão): exige a senha atual. */
export async function alterarSenhaNoLogin(usuario: string, senhaAtual: string, novaSenha: string): Promise<ResultadoAlterarSenhaLogin> {
  const resposta = await fetch("/api/auth/alterar-senha", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, senhaAtual, novaSenha }),
    cache: "no-store",
    credentials: "same-origin",
  });
  const dados = (await resposta.json().catch(() => null)) as { status?: ResultadoAlterarSenhaLogin } | null;
  if (dados && typeof dados.status === "string") return dados.status;
  throw new ErroApi("Erro ao alterar a senha.", resposta.status);
}

/** Confere usuário e senha no servidor e abre a sessão (cookie HttpOnly). */
export async function entrar(usuario: string, senha: string): Promise<ResultadoLogin> {
  const resposta = await fetch("/api/auth/entrar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, senha }),
    cache: "no-store",
    credentials: "same-origin",
  });
  const dados = (await resposta.json().catch(() => null)) as ResultadoLogin | null;
  if (dados && typeof dados.status === "string") return dados;
  throw new ErroApi("Erro ao autenticar.", resposta.status);
}

/** Encerra a sessão no servidor. */
export async function sair(): Promise<void> {
  await api.post("/api/auth/sair");
}

/** Usuário da sessão atual (para restaurar o login ao recarregar a página), ou null. */
export async function obterSessao(): Promise<Usuario | null> {
  return (await api.get<{ usuario: Usuario | null }>("/api/auth/sessao")).usuario;
}

export async function obterUsuarios(): Promise<Usuario[]> {
  return servico.obterTodos();
}

export async function criarUsuario(
  usuario: Omit<Usuario, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
  _autor?: AuditAutor
): Promise<string> {
  return servico.criar(usuario);
}

/** `ds_senha`, quando enviada e não vazia, é a nova senha em texto; vazia mantém a atual. */
export async function atualizarUsuario(
  id: string,
  usuario: Partial<Omit<Usuario, "id" | "nr_sequencia" | "dt_criacao" | "ds_usuario_criacao" | "ds_usuario_alteracao">>,
  _autor?: AuditAutor
): Promise<void> {
  await servico.atualizar(id, usuario);
}

export async function atualizarPreferenciaTema(id: string, config_tema: string): Promise<void> {
  await atualizarPreferenciasUsuario(id, { config_tema });
}

/** Preferências (config_*) do usuário logado. O servidor só altera o próprio usuário da sessão. */
export async function atualizarPreferenciasUsuario(
  _id: string,
  preferencias: Record<string, string>
): Promise<void> {
  await api.patch("/api/usuarios/preferencias", { dados: preferencias });
}

export async function excluirUsuario(id: string): Promise<void> {
  await servico.excluir(id);
}
