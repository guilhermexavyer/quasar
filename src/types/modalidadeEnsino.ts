/** Modalidade de ensino (Cadastros Gerais > Modalidade de ensino), ex.: Presencial, EAD. */
export interface ModalidadeEnsino {
  id?: string;
  nr_sequencia: number;
  ds_modalidade_ensino: string;
  /** Status: 'A' (Ativo) / 'I' (Inativo). */
  ie_status?: string;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
