/** Colaborador (Estrutura Acadêmica > Colaboradores). */
export interface Colaborador {
  id?: string;
  nr_sequencia: number;
  /** Pessoa física vinculada (Identificação). */
  nr_seq_pessoa_fisica?: number;
  /** Pessoa jurídica vinculada (Identificação). */
  nr_seq_pessoa_juridica?: number;
  /** Vínculo contratual (Cadastros Gerais > Vínculo contratual). */
  nr_seq_vinculo_contratual?: number;
  /** Indica se o colaborador é fornecedor (S/N). */
  ie_fornecedor?: string;
  nr_matricula?: string;
  dt_admissao: string;
  ie_status?: string;
  dt_status?: string;
  ds_status?: string;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
