/**
 * Pessoas e Relacionamentos > Fornecedores, Prestadores de Serviço e Equipes: coleções,
 * rótulos e metadados dos campos (infobuttons).
 */

import { formatDate } from "@/lib/pessoaFisicaUtils";

export const COLECAO_FORNECEDOR = "fornecedor";
export const COLECAO_PRESTADOR_SERVICO = "prestador_servico";
export const COLECAO_EQUIPE = "equipe";
export const COLECAO_EQUIPE_MEMBRO = "equipe_membro";

/** Fornecedores e Prestadores de Serviço: o mesmo cadastro em duas tabelas. */
export type TipoRelacionamento = typeof COLECAO_FORNECEDOR | typeof COLECAO_PRESTADOR_SERVICO;

/** Nomes do cadastro na tela (lista, mensagens, breadcrumb). */
export const NOMES_RELACIONAMENTO: Record<TipoRelacionamento, { singular: string; plural: string; artigo: "o" | "a"; adicionar: string }> = {
  fornecedor: { singular: "Fornecedor", plural: "Fornecedores", artigo: "o", adicionar: "um fornecedor" },
  prestador_servico: { singular: "Prestador de serviço", plural: "Prestadores de Serviço", artigo: "o", adicionar: "um prestador de serviço" },
};

/** Status do fornecedor, do prestador de serviço e da equipe. */
export const STATUS_RELACIONAMENTO_OPTIONS = [
  { value: "A", label: "Ativo" },
  { value: "I", label: "Inativo" },
];

export function rotuloStatusRelacionamento(valor?: string | null): string {
  return STATUS_RELACIONAMENTO_OPTIONS.find((o) => o.value === valor)?.label ?? "";
}

export const ROTULOS_RELACIONAMENTO: Record<string, string> = {
  nr_sequencia: "Sequência",
  nr_seq_pessoa_fisica: "Pessoa física",
  nr_seq_pessoa_juridica: "Pessoa jurídica",
  ie_status: "Status",
  ds_observacao: "Observação",
  dt_criacao: "Criação",
  dt_alteracao: "Alteração",
  ds_usuario_criacao: "Usuário criação",
  ds_usuario_alteracao: "Usuário alteração",
};

export const ROTULOS_EQUIPE: Record<string, string> = {
  nr_sequencia: "Sequência",
  ds_equipe: "Descrição",
  ie_status: "Status",
  ds_observacao: "Observação",
  dt_criacao: "Criação",
  dt_alteracao: "Alteração",
  ds_usuario_criacao: "Usuário criação",
  ds_usuario_alteracao: "Usuário alteração",
};

export const ROTULOS_EQUIPE_MEMBRO: Record<string, string> = {
  nr_sequencia: "Sequência",
  nr_seq_equipe: "Equipe",
  nr_seq_colaborador: "Colaborador",
  nr_seq_fornecedor: "Fornecedor",
  nr_seq_prestador_servico: "Prestador de serviço",
  dt_criacao: "Criação",
  dt_alteracao: "Alteração",
  ds_usuario_criacao: "Usuário criação",
  ds_usuario_alteracao: "Usuário alteração",
};

/** Filtro vazio com os campos do filtro salvo que ele conhece (salvo antes de mudar a tela não quebra). */
export function mesclarFiltro<T extends object>(vazio: T, salvo?: Record<string, string> | null): T {
  if (!salvo) return vazio;
  return { ...vazio, ...Object.fromEntries(Object.entries(salvo).filter(([k, v]) => k in vazio && typeof v === "string")) } as T;
}

/** Filtro de Fornecedores / Prestadores de Serviço (tela e lookup). */
export interface FiltroRelacionamento {
  nr_sequencia: string;
  ds_nome: string;
  nr_seq_pessoa_fisica: string;
  nr_seq_pessoa_juridica: string;
  ie_status: string;
}

export const FILTRO_RELACIONAMENTO_VAZIO: FiltroRelacionamento = { nr_sequencia: "", ds_nome: "", nr_seq_pessoa_fisica: "", nr_seq_pessoa_juridica: "", ie_status: "" };

/**
 * Regra do filtro de Fornecedores / Prestadores de Serviço: a tela e o lookup usam a mesma.
 * `nome`: nome da pessoa física ou razão social da jurídica do registro.
 */
export function passaFiltroRelacionamento(
  r: { nr_sequencia: number; nr_seq_pessoa_fisica?: number; nr_seq_pessoa_juridica?: number; ie_status?: string },
  filtro: FiltroRelacionamento,
  nome: string,
): boolean {
  const busca = filtro.ds_nome.trim().toLowerCase();
  if (filtro.nr_sequencia && String(r.nr_sequencia) !== filtro.nr_sequencia.trim()) return false;
  if (filtro.nr_seq_pessoa_fisica && String(r.nr_seq_pessoa_fisica ?? "") !== filtro.nr_seq_pessoa_fisica.trim()) return false;
  if (filtro.nr_seq_pessoa_juridica && String(r.nr_seq_pessoa_juridica ?? "") !== filtro.nr_seq_pessoa_juridica.trim()) return false;
  if (filtro.ie_status && (r.ie_status ?? "A") !== filtro.ie_status) return false;
  if (busca && !nome.toLowerCase().includes(busca)) return false;
  return true;
}

/** Colunas da lista de Fornecedores / Prestadores de Serviço (tela e lookup). */
export const COLUNAS_RELACIONAMENTO: { key: string; label: string; dataClass?: string }[] = [
  { key: "nr_sequencia", label: "#", dataClass: "text-right" },
  { key: "nr_seq_pessoa_fisica", label: "Pessoa física" },
  { key: "nr_seq_pessoa_juridica", label: "Pessoa jurídica" },
  { key: "ie_status", label: "Status" },
  { key: "dt_criacao", label: "Criação" },
  { key: "dt_alteracao", label: "Alteração" },
  { key: "ds_usuario_criacao", label: "Usuário criação" },
  { key: "ds_usuario_alteracao", label: "Usuário alteração" },
];

/** Texto de uma coluna da lista de Fornecedores / Prestadores de Serviço. */
export function celulaRelacionamento(
  r: Record<string, unknown> & { nr_sequencia: number },
  chave: string,
  nomePessoaFisica: (nr?: number) => string,
  nomePessoaJuridica: (nr?: number) => string,
): string {
  switch (chave) {
    case "nr_seq_pessoa_fisica": return nomePessoaFisica(r.nr_seq_pessoa_fisica as number | undefined);
    case "nr_seq_pessoa_juridica": return nomePessoaJuridica(r.nr_seq_pessoa_juridica as number | undefined);
    case "ie_status": return rotuloStatusRelacionamento((r.ie_status as string | undefined) ?? "A");
    case "dt_criacao": case "dt_alteracao": return formatDate(String(r[chave] ?? ""));
    default: return String(r[chave] ?? "");
  }
}

/** Filtro de Equipes (tela e lookup). */
export interface FiltroEquipe {
  nr_sequencia: string;
  ds_equipe: string;
  ie_status: string;
}

export const FILTRO_EQUIPE_VAZIO: FiltroEquipe = { nr_sequencia: "", ds_equipe: "", ie_status: "" };

/** Regra do filtro de Equipes: a tela e o lookup usam a mesma. */
export function passaFiltroEquipe(e: { nr_sequencia: number; ds_equipe?: string; ie_status?: string }, filtro: FiltroEquipe): boolean {
  const desc = filtro.ds_equipe.trim().toLowerCase();
  if (filtro.nr_sequencia && String(e.nr_sequencia) !== filtro.nr_sequencia.trim()) return false;
  if (filtro.ie_status && (e.ie_status ?? "A") !== filtro.ie_status) return false;
  if (desc && !String(e.ds_equipe ?? "").toLowerCase().includes(desc)) return false;
  return true;
}

/** Colunas da lista de Equipes (tela e lookup). */
export const COLUNAS_EQUIPE: { key: string; label: string; dataClass?: string }[] = [
  { key: "nr_sequencia", label: "#", dataClass: "text-right" },
  { key: "ds_equipe", label: "Descrição" },
  { key: "ie_status", label: "Status" },
  { key: "dt_criacao", label: "Criação" },
  { key: "dt_alteracao", label: "Alteração" },
  { key: "ds_usuario_criacao", label: "Usuário criação" },
  { key: "ds_usuario_alteracao", label: "Usuário alteração" },
];

/** Texto de uma coluna da lista de Equipes. */
export function celulaEquipe(e: Record<string, unknown> & { nr_sequencia: number }, chave: string): string {
  switch (chave) {
    case "ie_status": return rotuloStatusRelacionamento((e.ie_status as string | undefined) ?? "A");
    case "dt_criacao": case "dt_alteracao": return formatDate(String(e[chave] ?? ""));
    default: return String(e[chave] ?? "");
  }
}
