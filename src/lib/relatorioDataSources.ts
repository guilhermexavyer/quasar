import type { DataSourceDef } from "@/types/relatorio";

/**
 * Fontes de dados disponíveis para relatórios.
 * Cada entrada mapeia uma tabela do banco aos seus campos.
 */
export const DATA_SOURCES: DataSourceDef[] = [
  // ════════════════════════════════════════════════════════════
  //  Patrimônio
  // ════════════════════════════════════════════════════════════
  {
    value: 'ativo',
    label: 'Ativos (Patrimônio)',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'cd_externo', label: 'Código externo', tipo: 'string' },
      { key: 'ds_ativo', label: 'Descrição', tipo: 'string' },
      { key: 'nr_seq_categoria', label: 'Categoria', tipo: 'number', isFK: true, fkColecao: 'categoria', fkLabel: 'ds_categoria' },
      { key: 'nr_seq_localizacao', label: 'Localização', tipo: 'number', isFK: true, fkColecao: 'localizacao', fkLabel: 'ds_localizacao' },
      { key: 'nr_seq_marca', label: 'Marca', tipo: 'number', isFK: true, fkColecao: 'marca', fkLabel: 'ds_marca' },
      { key: 'nr_seq_fornecedor', label: 'Fornecedor', tipo: 'number', isFK: true, fkColecao: 'fornecedor', fkLabel: 'nr_sequencia' },
      { key: 'ds_modelo', label: 'Modelo', tipo: 'string' },
      { key: 'nr_serie', label: 'Número de série', tipo: 'string' },
      { key: 'ds_qr_code', label: 'QR Code', tipo: 'string' },
      { key: 'ds_codigo_barras', label: 'Código de barras', tipo: 'string' },
      { key: 'vl_aquisicao', label: 'Valor de aquisição', tipo: 'string' },
      { key: 'dt_aquisicao', label: 'Data de aquisição', tipo: 'date' },
      { key: 'dt_garantia', label: 'Data de garantia', tipo: 'date' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_ultima_manutencao', label: 'Última manutenção', tipo: 'date' },
      { key: 'nr_seq_ultima_manutencao', label: 'Nr. última manutenção', tipo: 'number' },
      { key: 'dt_status', label: 'Data do status', tipo: 'date' },
      { key: 'ds_motivo_status', label: 'Motivo do status', tipo: 'string' },
      { key: 'ds_processador', label: 'Processador', tipo: 'string' },
      { key: 'qt_ram', label: 'Memória RAM', tipo: 'number' },
      { key: 'ie_ram', label: 'Unidade RAM', tipo: 'string' },
      { key: 'qt_armazenamento', label: 'Armazenamento', tipo: 'number' },
      { key: 'ie_armazenamento', label: 'Unidade armazenamento', tipo: 'string' },
      { key: 'ds_endereco_mac', label: 'Endereço MAC', tipo: 'string' },
      { key: 'ds_ip', label: 'IPv4', tipo: 'string' },
      { key: 'nr_seq_sistema_operacional', label: 'Sistema operacional', tipo: 'number', isFK: true, fkColecao: 'sistema_operacional', fkLabel: 'ds_sistema_operacional' },
      { key: 'cd_placa', label: 'Placa', tipo: 'string' },
      { key: 'cd_renavam', label: 'Renavam', tipo: 'string' },
      { key: 'nr_ano', label: 'Ano', tipo: 'number' },
      { key: 'ds_cor', label: 'Cor', tipo: 'string' },
      { key: 'nr_seq_combustivel', label: 'Combustível', tipo: 'number', isFK: true, fkColecao: 'combustivel', fkLabel: 'ds_combustivel' },
      { key: 'ds_observacao', label: 'Observação', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'manutencao',
    label: 'Manutenções',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'nr_seq_ativo', label: 'Ativo', tipo: 'number', isFK: true, fkColecao: 'ativo', fkLabel: 'ds_ativo' },
      { key: 'nr_seq_prestador_servico', label: 'Prestador de serviço', tipo: 'number', isFK: true, fkColecao: 'prestador_servico', fkLabel: 'nr_sequencia' },
      { key: 'ds_prestador_servico', label: 'Prestador de serviço (nome)', tipo: 'string', computed: true },
      { key: 'dt_envio', label: 'Data de envio', tipo: 'date' },
      { key: 'dt_termino', label: 'Data de término', tipo: 'date' },
      { key: 'ie_status_manutencao', label: 'Status', tipo: 'string' },
      { key: 'vl_total', label: 'Valor total', tipo: 'string' },
      { key: 'ds_motivo_manutencao', label: 'Motivo da manutenção', tipo: 'string' },
      { key: 'ds_correcoes', label: 'Correções', tipo: 'string' },
      { key: 'ds_observacao', label: 'Observação', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  // ════════════════════════════════════════════════════════════
  //  Pessoas e Relacionamentos
  // ════════════════════════════════════════════════════════════
  {
    value: 'pessoa_fisica',
    label: 'Pessoas Físicas',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_nome', label: 'Nome', tipo: 'string' },
      { key: 'nr_cpf', label: 'CPF', tipo: 'string' },
      { key: 'dt_nascimento', label: 'Nascimento', tipo: 'date' },
      { key: 'ds_email', label: 'E-mail', tipo: 'string' },
      { key: 'nr_telefone', label: 'Telefone', tipo: 'string' },
      { key: 'nr_seq_sexo', label: 'Sexo', tipo: 'number', isFK: true, fkColecao: 'sexo', fkLabel: 'ds_sexo' },
      { key: 'nr_seq_estado_civil', label: 'Estado civil', tipo: 'number', isFK: true, fkColecao: 'estado_civil', fkLabel: 'ds_estado_civil' },
      { key: 'nr_seq_cor_raca', label: 'Cor/Raça', tipo: 'number', isFK: true, fkColecao: 'cor_raca', fkLabel: 'ds_cor_raca' },
      { key: 'nr_seq_profissao', label: 'Profissão', tipo: 'number', isFK: true, fkColecao: 'profissao', fkLabel: 'ds_profissao' },
      { key: 'nr_rg', label: 'RG', tipo: 'string' },
      { key: 'dt_emissao', label: 'Data de emissão RG', tipo: 'date' },
      { key: 'nr_seq_orgao_emissor', label: 'Órgão emissor', tipo: 'number', isFK: true, fkColecao: 'orgao_emissor', fkLabel: 'ds_orgao_emissor' },
      { key: 'sg_estado', label: 'UF', tipo: 'string' },
      { key: 'cd_ibge_naturalidade', label: 'Naturalidade (IBGE)', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  // Abas do duplo clique em Pessoas Físicas (um registro por pessoa física).
  {
    value: 'pessoa_fisica_residencial',
    label: 'Pessoas Físicas > Residencial',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'nr_seq_pessoa_fisica', label: 'Pessoa física', tipo: 'number', isFK: true, fkColecao: 'pessoa_fisica', fkLabel: 'ds_nome' },
      { key: 'nr_cep', label: 'CEP', tipo: 'string' },
      { key: 'ds_endereco', label: 'Rua', tipo: 'string' },
      { key: 'nr_seq_logradouro', label: 'Logradouro', tipo: 'number', isFK: true, fkColecao: 'logradouro', fkLabel: 'ds_logradouro' },
      { key: 'nr_endereco', label: 'Número', tipo: 'string' },
      { key: 'ds_bairro', label: 'Bairro', tipo: 'string' },
      { key: 'ds_complemento', label: 'Complemento', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'pessoa_fisica_comercial',
    label: 'Pessoas Físicas > Comercial',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'nr_seq_pessoa_fisica', label: 'Pessoa física', tipo: 'number', isFK: true, fkColecao: 'pessoa_fisica', fkLabel: 'ds_nome' },
      { key: 'nr_cep', label: 'CEP', tipo: 'string' },
      { key: 'ds_endereco', label: 'Rua', tipo: 'string' },
      { key: 'nr_seq_logradouro', label: 'Logradouro', tipo: 'number', isFK: true, fkColecao: 'logradouro', fkLabel: 'ds_logradouro' },
      { key: 'nr_endereco', label: 'Número', tipo: 'string' },
      { key: 'ds_bairro', label: 'Bairro', tipo: 'string' },
      { key: 'ds_complemento', label: 'Complemento', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'pessoa_fisica_saude',
    label: 'Pessoas Físicas > Saúde',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'nr_seq_pessoa_fisica', label: 'Pessoa física', tipo: 'number', isFK: true, fkColecao: 'pessoa_fisica', fkLabel: 'ds_nome' },
      { key: 'ds_tipo_sanguineo', label: 'Tipo sanguíneo', tipo: 'string' },
      { key: 'ds_alergia', label: 'Alergia', tipo: 'string' },
      { key: 'ds_medicamento_continuo', label: 'Medicamento contínuo', tipo: 'string' },
      { key: 'ds_restricao_alimentar', label: 'Restrição alimentar', tipo: 'string' },
      { key: 'ds_necessidade_especial', label: 'Necessidade especial', tipo: 'string' },
      { key: 'ds_observacao_medica', label: 'Observação médica', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'pessoa_juridica',
    label: 'Pessoas Jurídicas',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_razao_social', label: 'Razão social', tipo: 'string' },
      { key: 'ds_nome_fantasia', label: 'Nome fantasia', tipo: 'string' },
      { key: 'ds_cnpj', label: 'CNPJ', tipo: 'string' },
      { key: 'ds_email', label: 'E-mail', tipo: 'string' },
      { key: 'ds_telefone', label: 'Telefone', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  // ════════════════════════════════════════════════════════════
  //  Estrutura Acadêmica
  // ════════════════════════════════════════════════════════════
  {
    value: 'aluno',
    label: 'Alunos',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'nr_seq_pessoa_fisica', label: 'Pessoa física', tipo: 'number', isFK: true, fkColecao: 'pessoa_fisica', fkLabel: 'ds_nome' },
      { key: 'nr_matricula', label: 'Matrícula', tipo: 'string' },
      { key: 'dt_ingresso', label: 'Data de ingresso', tipo: 'date' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_status', label: 'Data do status', tipo: 'date' },
      { key: 'ds_status', label: 'Descrição do status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'colaborador',
    label: 'Colaboradores',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'nr_seq_pessoa_fisica', label: 'Pessoa física', tipo: 'number', isFK: true, fkColecao: 'pessoa_fisica', fkLabel: 'ds_nome' },
      { key: 'nr_seq_pessoa_juridica', label: 'Pessoa jurídica', tipo: 'number', isFK: true, fkColecao: 'pessoa_juridica', fkLabel: 'ds_razao_social' },
      { key: 'nr_seq_vinculo_contratual', label: 'Vínculo contratual', tipo: 'number', isFK: true, fkColecao: 'vinculo_contratual', fkLabel: 'ds_vinculo_contratual' },
      { key: 'nr_seq_cargo', label: 'Cargo', tipo: 'number', isFK: true, fkColecao: 'cargo', fkLabel: 'ds_cargo' },
      { key: 'nr_matricula', label: 'Matrícula', tipo: 'string' },
      { key: 'dt_admissao', label: 'Data de admissão', tipo: 'date' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_status', label: 'Data do status', tipo: 'date' },
      { key: 'ds_motivo_status', label: 'Motivo do status', tipo: 'string' },
      { key: 'ie_coordenador', label: 'Coordenador', tipo: 'string' },
      { key: 'ie_professor', label: 'Professor', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'fornecedor',
    label: 'Fornecedores',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'nr_seq_pessoa_fisica', label: 'Pessoa física', tipo: 'number', isFK: true, fkColecao: 'pessoa_fisica', fkLabel: 'ds_nome' },
      { key: 'nr_seq_pessoa_juridica', label: 'Pessoa jurídica', tipo: 'number', isFK: true, fkColecao: 'pessoa_juridica', fkLabel: 'ds_razao_social' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'ds_observacao', label: 'Observação', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'prestador_servico',
    label: 'Prestadores de Serviço',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'nr_seq_pessoa_fisica', label: 'Pessoa física', tipo: 'number', isFK: true, fkColecao: 'pessoa_fisica', fkLabel: 'ds_nome' },
      { key: 'nr_seq_pessoa_juridica', label: 'Pessoa jurídica', tipo: 'number', isFK: true, fkColecao: 'pessoa_juridica', fkLabel: 'ds_razao_social' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'ds_observacao', label: 'Observação', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'equipe',
    label: 'Equipes',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_equipe', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'ds_observacao', label: 'Observação', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'equipe_membro',
    label: 'Equipes > Membros',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'nr_seq_equipe', label: 'Equipe', tipo: 'number', isFK: true, fkColecao: 'equipe', fkLabel: 'ds_equipe' },
      { key: 'nr_seq_colaborador', label: 'Colaborador', tipo: 'number', isFK: true, fkColecao: 'colaborador', fkLabel: 'nr_sequencia' },
      { key: 'nr_seq_fornecedor', label: 'Fornecedor', tipo: 'number', isFK: true, fkColecao: 'fornecedor', fkLabel: 'nr_sequencia' },
      { key: 'nr_seq_prestador_servico', label: 'Prestador de serviço', tipo: 'number', isFK: true, fkColecao: 'prestador_servico', fkLabel: 'nr_sequencia' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'periodo_letivo',
    label: 'Períodos letivos',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'nr_ano', label: 'Ano', tipo: 'number' },
      { key: 'ds_periodo_letivo', label: 'Descrição', tipo: 'string' },
      { key: 'qt_dias_letivos', label: 'Dias letivos', tipo: 'number' },
      { key: 'dt_inicio', label: 'Data de início', tipo: 'date' },
      { key: 'dt_previsao_termino', label: 'Previsão de término', tipo: 'date' },
      { key: 'dt_termino', label: 'Data de término', tipo: 'date' },
      { key: 'dt_reativacao', label: 'Data de reativação', tipo: 'date' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'turma',
    label: 'Turmas',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_turma', label: 'Descrição', tipo: 'string' },
      { key: 'nr_seq_curso', label: 'Curso', tipo: 'number', isFK: true, fkColecao: 'curso', fkLabel: 'ds_curso' },
      { key: 'nr_seq_periodo_letivo', label: 'Período letivo', tipo: 'number', isFK: true, fkColecao: 'periodo_letivo', fkLabel: 'ds_periodo_letivo' },
      { key: 'qt_max_alunos', label: 'Máximo de alunos', tipo: 'number' },
      { key: 'nr_seq_localizacao', label: 'Localização', tipo: 'number', isFK: true, fkColecao: 'localizacao', fkLabel: 'ds_localizacao' },
      { key: 'nr_seq_modalidade_ensino', label: 'Modalidade de ensino', tipo: 'number', isFK: true, fkColecao: 'modalidade_ensino', fkLabel: 'ds_modalidade_ensino' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'turma_disciplina',
    label: 'Turmas x Disciplinas',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'nr_seq_turma', label: 'Turma', tipo: 'number', isFK: true, fkColecao: 'turma', fkLabel: 'ds_turma' },
      { key: 'nr_seq_disciplina', label: 'Disciplina', tipo: 'number', isFK: true, fkColecao: 'disciplina', fkLabel: 'ds_disciplina' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'disciplina',
    label: 'Disciplinas',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_disciplina', label: 'Descrição', tipo: 'string' },
      { key: 'ds_observacao', label: 'Observação', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  // ════════════════════════════════════════════════════════════
  //  Controle de Cópias
  // ════════════════════════════════════════════════════════════
  {
    value: 'copia',
    label: 'Cópias',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'dt_recebimento', label: 'Data do recebimento', tipo: 'date' },
      { key: 'dt_impressao', label: 'Data da impressão', tipo: 'date' },
      { key: 'dt_entrega', label: 'Data da entrega', tipo: 'date' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_status', label: 'Data do status', tipo: 'date' },
      { key: 'ds_motivo_status', label: 'Motivo status', tipo: 'string' },
      { key: 'nr_seq_solicitante', label: 'Solicitante', tipo: 'number', isFK: true, fkColecao: 'colaborador', fkLabel: 'nr_sequencia' },
      { key: 'nr_seq_turma_disciplina', label: 'Turma x Disciplina', tipo: 'number', isFK: true, fkColecao: 'turma_disciplina', fkLabel: 'nr_sequencia' },
      { key: 'qt_copias', label: 'Cópias', tipo: 'number' },
      { key: 'qt_folhas', label: 'Folhas', tipo: 'number' },
      { key: 'ie_frente_verso', label: 'Frente e verso', tipo: 'string' },
      { key: 'ie_grampear', label: 'Grampear', tipo: 'string' },
      { key: 'ie_guilhotinar', label: 'Guilhotinar', tipo: 'string' },
      { key: 'nr_seq_formato_papel', label: 'Formato do papel', tipo: 'number', isFK: true, fkColecao: 'formato_papel', fkLabel: 'ds_formato_papel' },
      { key: 'nr_seq_tipo_papel', label: 'Tipo de papel', tipo: 'number', isFK: true, fkColecao: 'tipo_papel', fkLabel: 'ds_tipo_papel' },
      { key: 'ie_arquivo', label: 'Arquivo', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  // ════════════════════════════════════════════════════════════
  //  Administração do Sistema
  // ════════════════════════════════════════════════════════════
  {
    value: 'usuario',
    label: 'Usuários',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'nr_seq_pessoa_fisica', label: 'Pessoa física', tipo: 'number', isFK: true, fkColecao: 'pessoa_fisica', fkLabel: 'ds_nome' },
      { key: 'ds_usuario', label: 'Usuário', tipo: 'string' },
      { key: 'ds_usuario_alternativo', label: 'Usuário alternativo', tipo: 'string' },
      { key: 'ds_email', label: 'E-mail', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'ds_observacao', label: 'Observação', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'perfil',
    label: 'Perfis',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_perfil', label: 'Perfil', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'ds_observacao', label: 'Observação', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'relatorio',
    label: 'Relatórios',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_relatorio', label: 'Relatório', tipo: 'string' },
      { key: 'colecao', label: 'Coleção', tipo: 'string' },
      { key: 'formato', label: 'Formato', tipo: 'string' },
      { key: 'ds_observacao', label: 'Observação', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  // ════════════════════════════════════════════════════════════
  //  Cadastros Gerais — Sexo
  // ════════════════════════════════════════════════════════════
  {
    value: 'sexo',
    label: 'Sexo',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_sexo', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'estado_civil',
    label: 'Estado Civil',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_estado_civil', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'cor_raca',
    label: 'Cor/Raça',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_cor_raca', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'profissao',
    label: 'Profissões',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_profissao', label: 'Descrição', tipo: 'string' },
      { key: 'nr_cbo', label: 'CBO', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'vinculo_contratual',
    label: 'Vínculos Contratuais',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_vinculo_contratual', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'orgao_emissor',
    label: 'Órgãos Emissores',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'sg_orgao_emissor', label: 'Sigla', tipo: 'string' },
      { key: 'ds_orgao_emissor', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'grau_parentesco',
    label: 'Graus de Parentesco',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_grau_parentesco', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'logradouro',
    label: 'Logradouros',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'sg_logradouro', label: 'Sigla', tipo: 'string' },
      { key: 'ds_logradouro', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'categoria',
    label: 'Categorias (Patrimônio)',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_categoria', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'localizacao',
    label: 'Localizações',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_localizacao', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'marca',
    label: 'Marcas',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_marca', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'cargo',
    label: 'Cargos',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_cargo', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'combustivel',
    label: 'Combustíveis',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_combustivel', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'modalidade_ensino',
    label: 'Modalidades de ensino',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_modalidade_ensino', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'formato_papel',
    label: 'Formatos do papel',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_formato_papel', label: 'Descrição', tipo: 'string' },
      { key: 'qt_largura', label: 'Largura', tipo: 'number' },
      { key: 'qt_altura', label: 'Altura', tipo: 'number' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'tipo_papel',
    label: 'Tipos de papel',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_tipo_papel', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'sistema_operacional',
    label: 'Sistemas Operacionais',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_sistema_operacional', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
];

/**
 * Obtém uma fonte de dados pelo valor da coleção.
 */
export function getDataSource(colecao: string): DataSourceDef | undefined {
  return DATA_SOURCES.find((ds) => ds.value === colecao);
}

/**
 * Obtém a definição de um campo específico de uma fonte de dados.
 */
export function getDataSourceCampo(colecao: string, chave: string): DataSourceCampo | undefined {
  const ds = getDataSource(colecao);
  return ds?.campos.find((c) => c.key === chave);
}

import type { DataSourceCampo } from "@/types/relatorio";

/**
 * Mapeamento de campos ie_status por coleção.
 * Chave: coleção. Valor: mapa de abreviação → label.
 */
export const STATUS_LABEL_MAP: Record<string, Record<string, string>> = {
  ativo: { D: 'Descartado', E: 'Estoque', M: 'Manutenção', O: 'Operacional' },
  manutencao: { E: 'Em andamento', CO: 'Concluída', CA: 'Cancelada' },
  aluno: { P: 'Pré-matriculado', A: 'Matriculado', I: 'Inativo', C: 'Cancelado', T: 'Transferido' },
  colaborador: { A: 'Ativo', AF: 'Afastado', F: 'Férias', L: 'Licença', D: 'Desligado' },
  fornecedor: { A: 'Ativo', I: 'Inativo' },
  prestador_servico: { A: 'Ativo', I: 'Inativo' },
  equipe: { A: 'Ativo', I: 'Inativo' },
  periodo_letivo: { A: 'Em andamento', E: 'Encerrado' },
  usuario: { A: 'Ativo', I: 'Inativo' },
  perfil: { A: 'Ativo', I: 'Inativo' },
  sexo: { A: 'Ativo', I: 'Inativo' },
  estado_civil: { A: 'Ativo', I: 'Inativo' },
  cor_raca: { A: 'Ativo', I: 'Inativo' },
  profissao: { A: 'Ativo', I: 'Inativo' },
  vinculo_contratual: { A: 'Ativo', I: 'Inativo' },
  orgao_emissor: { A: 'Ativo', I: 'Inativo' },
  grau_parentesco: { A: 'Ativo', I: 'Inativo' },
  logradouro: { A: 'Ativo', I: 'Inativo' },
  categoria: { A: 'Ativo', I: 'Inativo' },
  localizacao: { A: 'Ativo', I: 'Inativo' },
  marca: { A: 'Ativo', I: 'Inativo' },
  cargo: { A: 'Ativo', I: 'Inativo' },
  sistema_operacional: { A: 'Ativo', I: 'Inativo' },
  combustivel: { A: 'Ativo', I: 'Inativo' },
  modalidade_ensino: { A: 'Ativo', I: 'Inativo' },
  formato_papel: { A: 'Ativo', I: 'Inativo' },
  copia: { A: 'Aguardando', C: 'Cancelado', E: 'Entregue', I: 'Impresso' },
  tipo_papel: { A: 'Ativo', I: 'Inativo' },
};

/**
 * Resolve o valor de um campo ie_status para o label do sistema.
 */
export function resolverStatusLabel(colecao: string, valor: string): string {
  const map = STATUS_LABEL_MAP[colecao];
  if (!map) return valor;
  return map[valor] ?? valor;
}
