/** Tipo de papel (Cadastros Gerais > Tipo de papel), usado em Controle de Cópias > Cópias. */
export interface TipoPapel {
  id?: string;
  nr_sequencia: number;
  ds_tipo_papel: string;
  /** Status: 'A' (Ativo) / 'I' (Inativo). */
  ie_status?: string;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
