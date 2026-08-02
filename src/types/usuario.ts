export interface Usuario {
  id?: string;
  nr_sequencia: number;
  nr_seq_pessoa_fisica?: number;
  ie_status?: string;
  ds_usuario: string;
  ds_usuario_alternativo: string;
  ds_email?: string;
  ds_senha: string;
  ds_observacao: string;
  ie_tema?: string;
  ds_config_colunas_pf?: string;
  ds_config_colunas_admin?: string;
  ds_config_colunas_cg_sexo?: string;
  ds_config_colunas_cg_estado_civil?: string;
  ds_config_colunas_cg_cor_raca?: string;
  ds_config_colunas_cg_profissao?: string;
  ds_config_ordem_menu?: string;
  dt_criacao: string;
  dt_alteracao: string;
}
