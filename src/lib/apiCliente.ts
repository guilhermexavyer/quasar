/**
 * Acesso do navegador aos dados: tudo passa pelas rotas /api do próprio
 * sistema (o banco só é acessado pelo servidor). Os serviços em src/services
 * usam estas funções e mantêm as assinaturas que as telas já conheciam.
 *
 * O `id` dos registros é o nr_sequencia em texto.
 */

export class ErroApi extends Error {
  status: number;
  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.status = status;
  }
}

/** Evento disparado quando o servidor responde que a sessão acabou (a página volta ao login). */
export const EVENTO_SESSAO_EXPIRADA = "quasar:sessao-expirada";

async function pedir<T>(metodo: string, url: string, corpo?: unknown): Promise<T> {
  const resposta = await fetch(url, {
    method: metodo,
    headers: corpo === undefined ? undefined : { "Content-Type": "application/json" },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
    cache: "no-store",
    credentials: "same-origin",
  });
  if (!resposta.ok) {
    const dados = await resposta.json().catch(() => null);
    if (resposta.status === 401 && !url.startsWith("/api/auth/") && typeof window !== "undefined") {
      window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
    }
    throw new ErroApi((dados as { error?: string } | null)?.error || `Erro ${resposta.status}`, resposta.status);
  }
  return (await resposta.json()) as T;
}

export const api = {
  get: <T>(url: string) => pedir<T>("GET", url),
  post: <T>(url: string, corpo?: unknown) => pedir<T>("POST", url, corpo ?? {}),
  patch: <T>(url: string, corpo?: unknown) => pedir<T>("PATCH", url, corpo ?? {}),
  delete: <T>(url: string) => pedir<T>("DELETE", url),
};

/** Dados extras da auditoria (qual aviso/regra mudou, detalhe do parâmetro). */
export interface AuditoriaExtra {
  campo?: string;
  regra?: string;
  detalhes?: Record<string, unknown>;
}

/**
 * Mandar `undefined` num campo significa limpá-lo. O JSON descarta `undefined`,
 * então ele vira `null` (= limpar a coluna).
 */
function comNulos(dados: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(dados).map(([k, v]) => [k, v === undefined ? null : v]));
}

const rota = (colecao: string, id?: string) =>
  `/api/dados/${encodeURIComponent(colecao)}${id === undefined ? "" : `/${encodeURIComponent(id)}`}`;

/** Perfil em uso pelo usuário (fica registrado em Administração do Sistema > Exclusões). */
let perfilEmUso: number | undefined;
export function definirPerfilEmUso(nrSequencia: number | undefined) {
  perfilEmUso = nrSequencia;
}

export function listarDados<T>(colecao: string, filtros?: Record<string, string | number>): Promise<T[]> {
  const qs = filtros ? `?${new URLSearchParams(Object.entries(filtros).map(([k, v]) => [k, String(v)])).toString()}` : "";
  return api.get<T[]>(rota(colecao) + qs);
}

export function obterDado<T>(colecao: string, id: string): Promise<T | null> {
  return api.get<T | null>(rota(colecao, id));
}

/** Cria e devolve o registro completo (com id, nr_sequencia e campos de controle). */
export function criarDado<T>(colecao: string, dados: object, auditoria?: AuditoriaExtra): Promise<T> {
  return api.post<T>(rota(colecao), { dados, auditoria });
}

/** Atualiza só os campos enviados. `registro` é null se o registro não existe mais. */
export function atualizarDado<T>(
  colecao: string, id: string, dados: object, auditoria?: AuditoriaExtra
): Promise<{ registro: T | null; alterado: boolean }> {
  return api.patch(rota(colecao, id), { dados: comNulos(dados as Record<string, unknown>), auditoria });
}

/**
 * Senha definida pelo próprio usuário no menu do usuário (Alterar senha): tira a
 * marca "Alterar senha no próximo login". O servidor só aceita para a própria senha.
 */
export async function atualizarPropriaSenha(id: string, senha: string): Promise<void> {
  await api.patch(rota("usuario", id), { dados: { ds_senha: senha }, trocaPropriaSenha: true });
}

/**
 * Atualiza as cópias embutidas do construtor de relatórios (relatorio.bandas,
 * relatorio.filtros, relatorio_banda.campos). Isso não conta
 * como alteração do registro: não muda dt_alteracao nem gera auditoria.
 */
export async function atualizarCopiaEmbutida(colecao: string, id: string, dados: object): Promise<void> {
  await api.patch(rota(colecao, id), { dados: comNulos(dados as Record<string, unknown>), copiaEmbutida: true });
}

/** Exclui o registro; o servidor guarda a cópia em Exclusões e recusa se ele estiver em uso. */
export async function excluirDado(colecao: string, id: string): Promise<void> {
  await api.delete(rota(colecao, id) + (perfilEmUso !== undefined ? `?perfil=${perfilEmUso}` : ""));
}

/** As quatro operações de um cadastro, com as assinaturas que os serviços sempre expuseram. */
export function criarServicoCrud<T>(colecao: string) {
  return {
    obterTodos: (): Promise<T[]> => listarDados<T>(colecao),
    criar: async (item: object): Promise<string> => (await criarDado<{ id: string }>(colecao, item)).id,
    atualizar: async (id: string, item: object): Promise<void> => {
      await atualizarDado(colecao, id, item);
    },
    excluir: (id: string): Promise<void> => excluirDado(colecao, id),
  };
}
