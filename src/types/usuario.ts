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
  /** Data e horário do último login (gravada só pelo servidor, no login). */
  dt_ultimo_login?: string;
  /*
   * Preferências personalizadas do usuário (nomes padronizados).
   * config_colunas_* (largura e ordem das colunas de cada lista) ficam na tabela
   * usuario_coluna, e config_paineis_* (largura dos painéis lado a lado) na tabela
   * usuario_painel (uma linha por lista/tela); a API as entrega aqui com o mesmo nome.
   */
  config_tema?: string;
  config_colunas_pessoa_fisica?: string;
  config_colunas_pessoa_juridica?: string;
  config_colunas_aluno?: string;
  config_colunas_colaborador?: string;
  config_colunas_periodo_letivo?: string;
  config_colunas_curso?: string;
  config_colunas_disciplina?: string;
  config_colunas_turma?: string;
  config_colunas_turma_disciplina?: string;
  /* Controle de Cópias */
  config_colunas_copia?: string;
  config_colunas_parametros_funcao_cc?: string;
  config_paineis_parametros_funcao_cc?: string;
  config_colunas_periodo_letivo_feriado?: string;
  /* Estrutura Acadêmica > Alunos > duplo clique (Responsáveis) */
  config_colunas_aluno_responsavel?: string;
  /* Patrimônio > Ativos > duplo clique (Responsáveis / Manutenções) */
  config_colunas_ativo_responsavel?: string;
  config_colunas_ativo_manutencao?: string;
  config_colunas_ativo_transferencia?: string;
  config_colunas_exclusoes_funcao?: string;
  config_colunas_exclusoes_dropdown?: string;
  /** Colunas da lista de registros excluídos: JSON { colecao: config serializada }. */
  config_colunas_exclusoes_registro?: string;
  /* Janelas de busca (lookups) */
  config_colunas_lookup_pessoa_fisica?: string;
  config_colunas_lookup_pessoa_juridica?: string;
  config_colunas_lookup_ativo?: string;
  config_colunas_lookup_turma_disciplina?: string;
  config_colunas_lookup_prestador?: string;
  config_colunas_lookup_cidade?: string;
  /* Administração do Sistema > Campos (painéis) e Patrimônio > Parâmetros */
  config_colunas_campos_perfil?: string;
  config_colunas_campos_funcao?: string;
  config_colunas_campos_campo?: string;
  config_colunas_campos_modais_perfil?: string;
  config_colunas_campos_modais_funcao?: string;
  config_colunas_campos_modais_campo?: string;
  config_colunas_parametros_funcao?: string;
  config_colunas_parametros_funcao_ea?: string;
  /* Largura dos painéis (containers lado a lado), em proporções (JSON) */
  config_paineis_parametros_funcao?: string;
  config_paineis_parametros_funcao_ea?: string;
  config_paineis_avisos?: string;
  config_paineis_regras?: string;
  config_paineis_campos?: string;
  config_paineis_campos_modais?: string;
  config_paineis_parametros_funcao_as?: string;
  config_colunas_parametros_funcao_as?: string;
  config_colunas_logs_acessos?: string;
  config_paineis_exclusoes?: string;
  config_colunas_avisos?: string;
  config_colunas_regras?: string;
  config_colunas_as_usuario?: string;
  config_colunas_as_perfil?: string;
  config_colunas_as_imagem?: string;
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
  config_colunas_pat_categoria?: string;
  config_colunas_cg_sistema_operacional?: string;
  config_colunas_cg_combustivel?: string;
  config_colunas_cg_modalidade_ensino?: string;
  config_colunas_cg_formato_papel?: string;
  config_colunas_cg_tipo_papel?: string;
  config_colunas_pat_ativo?: string;
  config_colunas_pat_manutencao?: string;
  config_colunas_relatorio?: string;
  config_colunas_relatorio_bandas?: string;
  config_colunas_relatorio_lista?: string;
  config_colunas_relatorio_dados?: string;
  config_colunas_relatorio_filtros?: string;
  config_colunas_relatorio_ordenacao?: string;
  config_ordem_menu_lateral?: string;
  /** Filtro salvo de cada tela de registros ("Salvar filtro"), em JSON: tabela usuario_filtro. */
  [filtroSalvo: `config_filtro_${string}`]: string | undefined;
  ie_base_conhecimento?: string;
  ie_central_suporte?: string;
  /** Ver auditoria: S mostra os infobuttons dos logs do rodapé (histórico de auditoria). */
  ie_ver_auditoria?: string;
  /** 'S' = opção "Parâmetros da Função" na pop-up do usuário. */
  ie_parametros_funcao?: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
  dt_criacao: string;
  dt_alteracao: string;
}
