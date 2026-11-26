/**
 * Pessoas e Relacionamentos > Fornecedores, Prestadores de Serviço e Equipes: coleções,
 * rótulos e metadados dos campos (infobuttons).
 */

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
  dt_status: "Data do status",
  ds_motivo_status: "Motivo do status",
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
