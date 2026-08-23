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
  /* Preferências personalizadas do usuário (nomes padronizados) */
  config_tema?: string;
  config_colunas_pessoa_fisica?: string;
  config_colunas_pessoa_juridica?: string;
  config_colunas_aluno?: string;
  config_colunas_as_usuario?: string;
  config_colunas_as_perfil?: string;
  /* Perfis delegados ao usuário (JSON de nr_sequencia dos perfis) */
  config_perfis?: string;
  /* Perfil ativo do usuário (nr_sequencia do perfil selecionado na pop-up) */
  config_perfil_ativo?: string;
  config_colunas_cg_sexo?: string;
  config_colunas_cg_estado_civil?: string;
  config_colunas_cg_cor_raca?: string;
  config_colunas_cg_profissao?: string;
  config_colunas_cg_orgao_emissor?: string;
  config_colunas_cg_logradouro?: string;
  config_colunas_cg_grau_parentesco?: string;
  config_colunas_cg_cargo?: string;
  config_colunas_cg_vinculo_contratual?: string;
  config_colunas_cg_localizacao?: string;
  config_colunas_cg_marca?: string;
  config_colunas_cg_categoria_ativo?: string;
  config_colunas_cg_sistema_operacional?: string;
  config_colunas_pat_ativo?: string;
  config_colunas_pat_manutencao?: string;
  config_ordem_menu_lateral?: string;
  ie_base_conhecimento?: string;
  ie_central_suporte?: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
  dt_criacao: string;
  dt_alteracao: string;
}
