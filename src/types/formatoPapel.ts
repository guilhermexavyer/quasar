/** Formato do papel (Cadastros Gerais > Formato do papel), usado em Controle de Cópias > Cópias. */
export interface FormatoPapel {
  id?: string;
  nr_sequencia: number;
  ds_formato_papel: string;
  /** Status: 'A' (Ativo) / 'I' (Inativo). */
  ie_status?: string;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
