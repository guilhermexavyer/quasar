/**
 * Pessoas e Relacionamentos > Fornecedores / Prestadores de Serviço: os dois cadastros têm os
 * mesmos campos (tabelas fornecedor e prestador_servico).
 */
export interface Relacionamento {
  id?: string;
  nr_sequencia: number;
  /** Pessoa física vinculada (ou a pessoa jurídica: só uma das duas). */
  nr_seq_pessoa_fisica?: number;
  nr_seq_pessoa_juridica?: number;
  /** Status: 'A' (Ativo) / 'I' (Inativo). */
  ie_status?: string;
  /** Data do status (DD/MM/AAAA): preenchida ao mudar o status. */
  dt_status?: string;
  ds_motivo_status?: string;
  ds_observacao?: string;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}

export type Fornecedor = Relacionamento;
export type PrestadorServico = Relacionamento;

/** Pessoas e Relacionamentos > Equipes (tabela equipe). */
export interface Equipe {
  id?: string;
  nr_sequencia: number;
  ds_equipe?: string;
  /** Status: 'A' (Ativo) / 'I' (Inativo). */
  ie_status?: string;
  ds_observacao?: string;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}

/** Membro de uma equipe (tabela equipe_membro): um colaborador, um fornecedor ou um prestador de serviço. */
export interface EquipeMembro {
  id?: string;
  nr_sequencia: number;
  nr_seq_equipe: number;
  nr_seq_colaborador?: number;
  nr_seq_fornecedor?: number;
  nr_seq_prestador_servico?: number;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
