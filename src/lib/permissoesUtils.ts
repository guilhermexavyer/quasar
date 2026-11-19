/** Permissão disponível de uma função. */
export interface PermissaoDef {
  key: string;
  label: string;
}

/**
 * Permissões por função — a lista é incremental: cada função ganha suas
 * permissões reais aos poucos. Funções sem permissões (lista vazia) exibem
 * o aviso "serão configuradas em breve" no modal.
 */
export const PERMISSOES_POR_FUNCAO: Record<string, PermissaoDef[]> = {
  administracaoSistema: [
    // Acesso aos submódulos (dropdown PAI)
    { key: "acessar_avisos", label: "Permite acessar Avisos" },
    { key: "acessar_campos_formularios", label: "Permite acessar Campos x Formulários" },
    { key: "acessar_campos_modais", label: "Permite acessar Campos x Modais" },
    { key: "acessar_imagens", label: "Permite acessar Imagens" },
    { key: "acessar_parametros", label: "Permite acessar Parâmetros" },
    { key: "acessar_perfis", label: "Permite acessar Perfis" },
    { key: "acessar_regras", label: "Permite acessar Sistema" },
    { key: "acessar_usuarios", label: "Permite acessar Usuários" },
    // Opções Campos x Formulários e Campos x Modais
    { key: "alterar_status_campo_formulario", label: "Permite alterar o status do campo" },
    { key: "alterar_status_campo_modal", label: "Permite alterar o status do campo" },
    // Opção Imagens
    { key: "adicionar_imagem", label: "Permite adicionar" },
    { key: "ver_imagem", label: "Permite ver" },
    { key: "renomear_imagem", label: "Permite renomear" },
    { key: "excluir_imagem", label: "Permite excluir" },
    // Opção Perfis
    { key: "adicionar_perfil", label: "Permite adicionar" },
    { key: "ver_perfil", label: "Permite ver" },
    { key: "delegar_funcoes_perfil", label: "Permite delegar funções" },
    { key: "duplicar_perfil", label: "Permite duplicar" },
    { key: "excluir_perfil", label: "Permite excluir" },
    // Opção Usuários
    { key: "adicionar_usuario", label: "Permite adicionar" },
    { key: "ver_usuario", label: "Permite ver" },
    { key: "alterar_senha_usuario", label: "Permite alterar senha" },
    { key: "delegar_perfis_usuario", label: "Permite delegar perfis" },
    { key: "excluir_usuario", label: "Permite excluir" },
  ],
  pessoaFisica: [
    // Pessoas Físicas
    { key: "acessar_pessoa_fisica", label: "Permite acessar Pessoas Físicas" },
    { key: "adicionar_pessoa_fisica", label: "Permite adicionar" },
    { key: "ver_pessoa_fisica", label: "Permite ver" },
    { key: "detalhes_pessoa_fisica", label: "Permite acessar residencial, comercial e saúde" },
    { key: "excluir_pessoa_fisica", label: "Permite excluir" },
    // Pessoas Jurídicas
    { key: "acessar_pessoa_juridica", label: "Permite acessar Pessoas Jurídicas" },
    { key: "adicionar_pessoa_juridica", label: "Permite adicionar" },
    { key: "ver_pessoa_juridica", label: "Permite ver" },
    { key: "excluir_pessoa_juridica", label: "Permite excluir" },
  ],
  estruturaAcademica: [
    // Parâmetros
    { key: "acessar_parametros_funcao", label: "Permite acessar Parâmetros" },
    // Alunos
    { key: "acessar_aluno", label: "Permite acessar Alunos" },
    { key: "adicionar_aluno", label: "Permite adicionar" },
    { key: "ver_aluno", label: "Permite ver" },
    { key: "gerar_matricula_aluno", label: "Permite gerar matrícula" },
    { key: "alterar_data_ingresso_aluno", label: "Permite alterar data de ingresso" },
    { key: "alterar_status_aluno", label: "Permite alterar status" },
    { key: "detalhes_aluno", label: "Permite acessar responsáveis do aluno" },
    { key: "excluir_aluno", label: "Permite excluir" },
    // Colaboradores
    { key: "acessar_colaborador", label: "Permite acessar Colaboradores" },
    { key: "adicionar_colaborador", label: "Permite adicionar" },
    { key: "ver_colaborador", label: "Permite ver" },
    { key: "gerar_matricula_colaborador", label: "Permite gerar matrícula" },
    { key: "alterar_data_admissao_colaborador", label: "Permite alterar data de admissão" },
    { key: "alterar_status_colaborador", label: "Permite alterar status" },
    { key: "assumir_ativos_colaborador", label: "Permite assumir ativos de outro colaborador" },
    { key: "excluir_colaborador", label: "Permite excluir" },
    // Cursos
    { key: "acessar_curso", label: "Permite acessar Cursos" },
    { key: "adicionar_curso", label: "Permite adicionar" },
    { key: "ver_curso", label: "Permite ver" },
    { key: "excluir_curso", label: "Permite excluir" },
    // Disciplinas
    { key: "acessar_disciplina", label: "Permite acessar Disciplinas" },
    { key: "adicionar_disciplina", label: "Permite adicionar" },
    { key: "ver_disciplina", label: "Permite ver" },
    { key: "excluir_disciplina", label: "Permite excluir" },
    // Período letivo
    { key: "acessar_periodo_letivo", label: "Permite acessar Período letivo" },
    { key: "adicionar_periodo_letivo", label: "Permite adicionar" },
    { key: "ver_periodo_letivo", label: "Permite ver" },
    { key: "encerrar_periodo_letivo", label: "Permite encerrar" },
    { key: "reativar_periodo_letivo", label: "Permite reativar" },
    { key: "feriados_periodo_letivo", label: "Permite configurar feriados" },
    { key: "excluir_periodo_letivo", label: "Permite excluir" },
    // Turmas
    { key: "acessar_turma", label: "Permite acessar Turmas" },
    { key: "adicionar_turma", label: "Permite adicionar" },
    { key: "ver_turma", label: "Permite ver" },
    { key: "excluir_turma", label: "Permite excluir" },
    // Turmas x Disciplinas
    { key: "acessar_turma_disciplina", label: "Permite acessar Turmas x Disciplinas" },
    { key: "adicionar_turma_disciplina", label: "Permite adicionar" },
    { key: "ver_turma_disciplina", label: "Permite ver" },
    { key: "excluir_turma_disciplina", label: "Permite excluir" },
  ],
  patrimonio: [
    // Parâmetros
    { key: "acessar_parametros_funcao", label: "Permite acessar Parâmetros" },
    // Ativos
    { key: "acessar_ativo", label: "Permite acessar Ativos" },
    { key: "adicionar_ativo", label: "Permite adicionar" },
    { key: "ver_ativo", label: "Permite ver" },
    { key: "mudar_para_operacional", label: "Permite mudar para Operacional" },
    { key: "enviar_para_manutencao", label: "Permite enviar para manutenção" },
    { key: "mover_para_estoque", label: "Permite mover para o estoque" },
    { key: "descartar_ativo", label: "Permite descartar" },
    { key: "alterar_status_descartado", label: "Permite alterar status de um ativo descartado" },
    { key: "transferir_ativo", label: "Permite transferir de localização" },
    { key: "detalhes_ativo", label: "Permite acessar responsáveis e manutenções do ativo" },
    { key: "excluir_ativo", label: "Permite excluir" },
    // Categoria
    { key: "acessar_categoria", label: "Permite acessar Categoria" },
    { key: "adicionar_categoria", label: "Permite adicionar" },
    { key: "ver_categoria", label: "Permite ver" },
    { key: "excluir_categoria", label: "Permite excluir" },
    // Manutenções
    { key: "acessar_manutencao", label: "Permite acessar Manutenções" },
    { key: "adicionar_manutencao", label: "Permite adicionar" },
    { key: "ver_manutencao", label: "Permite ver" },
    { key: "concluir_manutencao", label: "Permite concluir manutenção" },
    { key: "concluir_manutencao_registro", label: "Permite concluir manutenção" },
    { key: "cancelar_manutencao", label: "Permite cancelar manutenção" },
    { key: "excluir_manutencao", label: "Permite excluir" },
  ],
  logs: [
    // Acesso aos submódulos (dropdown PAI)
    { key: "acessar_acessos", label: "Permite acessar Acessos" },
    { key: "acessar_exclusoes", label: "Permite acessar Exclusões" },
  ],
  relatorio: [
    { key: "adicionar_relatorio", label: "Permite adicionar" },
    { key: "ver_relatorio", label: "Permite ver" },
    { key: "gerar_relatorio", label: "Permite gerar relatório" },
    { key: "duplicar_relatorio", label: "Permite duplicar" },
    { key: "bandas_relatorio", label: "Permite configurar bandas" },
    { key: "excluir_relatorio", label: "Permite excluir" },
  ],
  cadastrosGerais: [
    // Cor/Raça
    { key: "acessar_cor_raca", label: "Permite acessar Cor/Raça" },
    { key: "adicionar_cor_raca", label: "Permite adicionar" },
    { key: "ver_cor_raca", label: "Permite ver" },
    { key: "excluir_cor_raca", label: "Permite excluir" },
    // Estado civil
    { key: "acessar_estado_civil", label: "Permite acessar Estado civil" },
    { key: "adicionar_estado_civil", label: "Permite adicionar" },
    { key: "ver_estado_civil", label: "Permite ver" },
    { key: "excluir_estado_civil", label: "Permite excluir" },
    // Logradouro
    { key: "acessar_logradouro", label: "Permite acessar Logradouro" },
    { key: "adicionar_logradouro", label: "Permite adicionar" },
    { key: "ver_logradouro", label: "Permite ver" },
    { key: "excluir_logradouro", label: "Permite excluir" },
    // Marca
    { key: "acessar_marca", label: "Permite acessar Marca" },
    { key: "adicionar_marca", label: "Permite adicionar" },
    { key: "ver_marca", label: "Permite ver" },
    { key: "excluir_marca", label: "Permite excluir" },
    // Órgão emissor
    { key: "acessar_orgao_emissor", label: "Permite acessar Órgão emissor" },
    { key: "adicionar_orgao_emissor", label: "Permite adicionar" },
    { key: "ver_orgao_emissor", label: "Permite ver" },
    { key: "excluir_orgao_emissor", label: "Permite excluir" },
    // Profissão
    { key: "acessar_profissao", label: "Permite acessar Profissão" },
    { key: "adicionar_profissao", label: "Permite adicionar" },
    { key: "ver_profissao", label: "Permite ver" },
    { key: "excluir_profissao", label: "Permite excluir" },
    // Sexo
    { key: "acessar_sexo", label: "Permite acessar Sexo" },
    { key: "adicionar_sexo", label: "Permite adicionar" },
    { key: "ver_sexo", label: "Permite ver" },
    { key: "excluir_sexo", label: "Permite excluir" },
    // Grau de parentesco
    { key: "acessar_grau_parentesco", label: "Permite acessar Grau de parentesco" },
    { key: "adicionar_grau_parentesco", label: "Permite adicionar" },
    { key: "ver_grau_parentesco", label: "Permite ver" },
    { key: "excluir_grau_parentesco", label: "Permite excluir" },
    // Localização
    { key: "acessar_localizacao", label: "Permite acessar Localização" },
    { key: "adicionar_localizacao", label: "Permite adicionar" },
    { key: "ver_localizacao", label: "Permite ver" },
    { key: "excluir_localizacao", label: "Permite excluir" },
    // Cargo
    { key: "acessar_cargo", label: "Permite acessar Cargo" },
    { key: "adicionar_cargo", label: "Permite adicionar" },
    { key: "ver_cargo", label: "Permite ver" },
    { key: "excluir_cargo", label: "Permite excluir" },
    // Vínculo contratual
    { key: "acessar_vinculo_contratual", label: "Permite acessar Vínculo contratual" },
    { key: "adicionar_vinculo_contratual", label: "Permite adicionar" },
    { key: "ver_vinculo_contratual", label: "Permite ver" },
    { key: "excluir_vinculo_contratual", label: "Permite excluir" },
    // Combustível
    { key: "acessar_combustivel", label: "Permite acessar Combustível" },
    { key: "adicionar_combustivel", label: "Permite adicionar" },
    { key: "ver_combustivel", label: "Permite ver" },
    { key: "excluir_combustivel", label: "Permite excluir" },
    // Modalidade de ensino
    { key: "acessar_modalidade_ensino", label: "Permite acessar Modalidade de ensino" },
    { key: "adicionar_modalidade_ensino", label: "Permite adicionar" },
    { key: "ver_modalidade_ensino", label: "Permite ver" },
    { key: "excluir_modalidade_ensino", label: "Permite excluir" },
    // Sistema operacional
    { key: "acessar_sistema_operacional", label: "Permite acessar Sistema operacional" },
    { key: "adicionar_sistema_operacional", label: "Permite adicionar" },
    { key: "ver_sistema_operacional", label: "Permite ver" },
    { key: "excluir_sistema_operacional", label: "Permite excluir" },
  ],
};

/**
 * Agrupamento das permissões no modal "Permissões da função" (opcional, por
 * função). Funções sem grupos exibem a lista plana de checkboxes.
 */
export const PERMISSOES_GRUPOS: Record<string, { titulo: string; chaves: string[] }[]> = {
  administracaoSistema: [
    {
      titulo: 'Avisos',
      chaves: ['acessar_avisos'],
    },
    {
      titulo: 'Campos x Formulários',
      chaves: ['acessar_campos_formularios', 'alterar_status_campo_formulario'],
    },
    {
      titulo: 'Campos x Modais',
      chaves: ['acessar_campos_modais', 'alterar_status_campo_modal'],
    },
    {
      titulo: 'Imagens',
      chaves: ['acessar_imagens', 'adicionar_imagem', 'ver_imagem', 'renomear_imagem', 'excluir_imagem'],
    },
    {
      titulo: 'Perfis',
      chaves: ['acessar_perfis', 'adicionar_perfil', 'ver_perfil', 'delegar_funcoes_perfil', 'duplicar_perfil', 'excluir_perfil'],
    },
    {
      titulo: 'Parâmetros',
      chaves: ['acessar_parametros'],
    },
    {
      titulo: 'Sistema',
      chaves: ['acessar_regras'],
    },
    {
      titulo: 'Usuários',
      chaves: ['acessar_usuarios', 'adicionar_usuario', 'ver_usuario', 'alterar_senha_usuario', 'delegar_perfis_usuario', 'excluir_usuario'],
    },
  ],
  pessoaFisica: [
    {
      titulo: 'Pessoas Físicas',
      chaves: ['acessar_pessoa_fisica', 'adicionar_pessoa_fisica', 'ver_pessoa_fisica', 'detalhes_pessoa_fisica', 'excluir_pessoa_fisica'],
    },
    {
      titulo: 'Pessoas Jurídicas',
      chaves: ['acessar_pessoa_juridica', 'adicionar_pessoa_juridica', 'ver_pessoa_juridica', 'excluir_pessoa_juridica'],
    },
  ],
  estruturaAcademica: [
    {
      titulo: 'Alunos',
      chaves: ['acessar_aluno', 'adicionar_aluno', 'ver_aluno', 'gerar_matricula_aluno', 'alterar_data_ingresso_aluno', 'alterar_status_aluno', 'detalhes_aluno', 'excluir_aluno'],
    },
    {
      titulo: 'Colaboradores',
      chaves: ['acessar_colaborador', 'adicionar_colaborador', 'ver_colaborador', 'gerar_matricula_colaborador', 'alterar_data_admissao_colaborador', 'alterar_status_colaborador', 'assumir_ativos_colaborador', 'excluir_colaborador'],
    },
    {
      titulo: 'Cursos',
      chaves: ['acessar_curso', 'adicionar_curso', 'ver_curso', 'excluir_curso'],
    },
    {
      titulo: 'Disciplinas',
      chaves: ['acessar_disciplina', 'adicionar_disciplina', 'ver_disciplina', 'excluir_disciplina'],
    },
    {
      titulo: 'Parâmetros',
      chaves: ['acessar_parametros_funcao'],
    },
    {
      titulo: 'Período letivo',
      chaves: ['acessar_periodo_letivo', 'adicionar_periodo_letivo', 'ver_periodo_letivo', 'encerrar_periodo_letivo', 'reativar_periodo_letivo', 'feriados_periodo_letivo', 'excluir_periodo_letivo'],
    },
    {
      titulo: 'Turmas',
      chaves: ['acessar_turma', 'adicionar_turma', 'ver_turma', 'excluir_turma'],
    },
    {
      titulo: 'Turmas x Disciplinas',
      chaves: ['acessar_turma_disciplina', 'adicionar_turma_disciplina', 'ver_turma_disciplina', 'excluir_turma_disciplina'],
    },
  ],
  patrimonio: [
    {
      titulo: 'Ativos',
      chaves: ['acessar_ativo', 'adicionar_ativo', 'ver_ativo', 'alterar_status_descartado', 'mudar_para_operacional', 'enviar_para_manutencao', 'concluir_manutencao', 'mover_para_estoque', 'descartar_ativo', 'transferir_ativo', 'detalhes_ativo', 'excluir_ativo'],
    },
    {
      titulo: 'Categoria',
      chaves: ['acessar_categoria', 'adicionar_categoria', 'ver_categoria', 'excluir_categoria'],
    },
    {
      titulo: 'Manutenções',
      chaves: ['acessar_manutencao', 'adicionar_manutencao', 'ver_manutencao', 'concluir_manutencao_registro', 'cancelar_manutencao', 'excluir_manutencao'],
    },
    {
      titulo: 'Parâmetros',
      chaves: ['acessar_parametros_funcao'],
    },
  ],
  logs: [
    {
      titulo: 'Acessos',
      chaves: ['acessar_acessos'],
    },
    {
      titulo: 'Exclusões',
      chaves: ['acessar_exclusoes'],
    },
  ],
  relatorio: [
    {
      titulo: 'Relatórios',
      chaves: ['adicionar_relatorio', 'ver_relatorio', 'gerar_relatorio', 'duplicar_relatorio', 'bandas_relatorio', 'excluir_relatorio'],
    },
  ],
  cadastrosGerais: [
    {
      titulo: 'Cargo',
      chaves: ['acessar_cargo', 'adicionar_cargo', 'ver_cargo', 'excluir_cargo'],
    },
    {
      titulo: 'Cor/Raça',
      chaves: ['acessar_cor_raca', 'adicionar_cor_raca', 'ver_cor_raca', 'excluir_cor_raca'],
    },
    {
      titulo: 'Estado civil',
      chaves: ['acessar_estado_civil', 'adicionar_estado_civil', 'ver_estado_civil', 'excluir_estado_civil'],
    },
    {
      titulo: 'Grau de parentesco',
      chaves: ['acessar_grau_parentesco', 'adicionar_grau_parentesco', 'ver_grau_parentesco', 'excluir_grau_parentesco'],
    },
    {
      titulo: 'Localização',
      chaves: ['acessar_localizacao', 'adicionar_localizacao', 'ver_localizacao', 'excluir_localizacao'],
    },
    {
      titulo: 'Logradouro',
      chaves: ['acessar_logradouro', 'adicionar_logradouro', 'ver_logradouro', 'excluir_logradouro'],
    },
    {
      titulo: 'Marca',
      chaves: ['acessar_marca', 'adicionar_marca', 'ver_marca', 'excluir_marca'],
    },
    {
      titulo: 'Órgão emissor',
      chaves: ['acessar_orgao_emissor', 'adicionar_orgao_emissor', 'ver_orgao_emissor', 'excluir_orgao_emissor'],
    },
    {
      titulo: 'Profissão',
      chaves: ['acessar_profissao', 'adicionar_profissao', 'ver_profissao', 'excluir_profissao'],
    },
    {
      titulo: 'Sexo',
      chaves: ['acessar_sexo', 'adicionar_sexo', 'ver_sexo', 'excluir_sexo'],
    },
    {
      titulo: 'Vínculo contratual',
      chaves: ['acessar_vinculo_contratual', 'adicionar_vinculo_contratual', 'ver_vinculo_contratual', 'excluir_vinculo_contratual'],
    },
    {
      titulo: 'Combustível',
      chaves: ['acessar_combustivel', 'adicionar_combustivel', 'ver_combustivel', 'excluir_combustivel'],
    },
    {
      titulo: 'Modalidade de ensino',
      chaves: ['acessar_modalidade_ensino', 'adicionar_modalidade_ensino', 'ver_modalidade_ensino', 'excluir_modalidade_ensino'],
    },
    {
      titulo: 'Sistema operacional',
      chaves: ['acessar_sistema_operacional', 'adicionar_sistema_operacional', 'ver_sistema_operacional', 'excluir_sistema_operacional'],
    },
  ],
};

/**
 * Submódulos da função Administração do Sistema (dropdown PAI) e a
 * permissão que libera o acesso a cada um deles.
 */
export const ADMIN_SUBMODULOS: { value: string; label: string; permissao: string }[] = [
  { value: 'avisos', label: 'Avisos', permissao: 'acessar_avisos' },
  { value: 'camposFormularios', label: 'Campos x Formulários', permissao: 'acessar_campos_formularios' },
  { value: 'camposModais', label: 'Campos x Modais', permissao: 'acessar_campos_modais' },
  { value: 'perfis', label: 'Perfis', permissao: 'acessar_perfis' },
  { value: 'usuarios', label: 'Usuários', permissao: 'acessar_usuarios' },
  { value: 'imagens', label: 'Imagens', permissao: 'acessar_imagens' },
  { value: 'regras', label: 'Sistema', permissao: 'acessar_regras' },
  { value: 'parametros', label: 'Parâmetros', permissao: 'acessar_parametros' },
];

/** Opções do dropdown PAI de Administração do Sistema, em ordem alfabética (filtradas pelas permitidas em cada tela). */
export const ADMIN_OPCOES_DROPDOWN: { value: string; label: string }[] = [...ADMIN_SUBMODULOS]
  .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
  .map(({ value, label }) => ({ value, label }));

/**
 * Submódulos da função Cadastro de Pessoas (dropdown PAI) e a permissão
 * que libera o acesso a cada um deles.
 */
export const PESSOA_SUBMODULOS: { value: string; label: string; permissao: string }[] = [
  { value: 'pessoasFisicas', label: 'Pessoas Físicas', permissao: 'acessar_pessoa_fisica' },
  { value: 'pessoasJuridicas', label: 'Pessoas Jurídicas', permissao: 'acessar_pessoa_juridica' },
];

/**
 * Submódulos da função Estrutura Acadêmica (dropdown PAI) e a permissão
 * que libera o acesso a cada um deles.
 */
export const EA_SUBMODULOS: { value: string; label: string; permissao: string }[] = [
  { value: 'alunos', label: 'Alunos', permissao: 'acessar_aluno' },
  { value: 'colaboradores', label: 'Colaboradores', permissao: 'acessar_colaborador' },
  { value: 'periodoLetivo', label: 'Período letivo', permissao: 'acessar_periodo_letivo' },
  { value: 'cursos', label: 'Cursos', permissao: 'acessar_curso' },
  { value: 'turmas', label: 'Turmas', permissao: 'acessar_turma' },
  { value: 'disciplinas', label: 'Disciplinas', permissao: 'acessar_disciplina' },
  { value: 'turmasDisciplinas', label: 'Turmas x Disciplinas', permissao: 'acessar_turma_disciplina' },
  { value: 'parametrosFuncao', label: 'Parâmetros', permissao: 'acessar_parametros_funcao' },
];

/** Configuração de permissões: `funcao` → lista de chaves de permissão concedidas. */
export type PermissoesConfig = Record<string, string[]>;

/**
 * Versão atual do formato de `config_permissoes`. Deve ser incrementada sempre
 * que novas permissões forem adicionadas a `PERMISSOES_POR_FUNCAO`: configurações
 * salvas antes da adição são migradas uma única vez (ver `migrarPermissoesConfig`),
 * concedendo as permissões novas por padrão.
 */
export const PERMISSOES_CONFIG_VERSION = 27;

/**
 * Permissões que mudaram de função (e de chave). Na migração, a nova só é
 * concedida a quem tinha a antiga — mover um submódulo não amplia acessos.
 * Versão 14: Categoria (ativo) saiu de Cadastros Gerais e foi para Patrimônio.
 * Versão 22: Campos foi dividido em Campos x Formulários e Campos x Modais
 * (quem tinha a permissão de Campos recebe a mesma nas duas opções).
 * Versão 24: Exclusões saiu de Administração do Sistema e foi para a nova função Logs.
 */
const PERMISSOES_MOVIDAS: { de: [string, string]; para: [string, string] }[] = [
  { de: ["cadastrosGerais", "acessar_categoria_ativo"], para: ["patrimonio", "acessar_categoria"] },
  { de: ["cadastrosGerais", "adicionar_categoria_ativo"], para: ["patrimonio", "adicionar_categoria"] },
  { de: ["cadastrosGerais", "ver_categoria_ativo"], para: ["patrimonio", "ver_categoria"] },
  { de: ["cadastrosGerais", "excluir_categoria_ativo"], para: ["patrimonio", "excluir_categoria"] },
  { de: ["administracaoSistema", "acessar_campos"], para: ["administracaoSistema", "acessar_campos_formularios"] },
  { de: ["administracaoSistema", "acessar_campos"], para: ["administracaoSistema", "acessar_campos_modais"] },
  { de: ["administracaoSistema", "alterar_status_campo"], para: ["administracaoSistema", "alterar_status_campo_formulario"] },
  { de: ["administracaoSistema", "alterar_status_campo"], para: ["administracaoSistema", "alterar_status_campo_modal"] },
  { de: ["administracaoSistema", "acessar_exclusoes"], para: ["logs", "acessar_exclusoes"] },
];

/**
 * Migra uma configuração antiga para a versão atual: para cada função com
 * permissões salvas, une as chaves atuais de `PERMISSOES_POR_FUNCAO` — assim as
 * permissões adicionadas depois do último salvamento passam a valer como
 * concedidas (sem quebrar o que já estava marcado).
 */
export function migrarPermissoesConfig(config: PermissoesConfig): PermissoesConfig {
  const destinosMovidos = new Set(PERMISSOES_MOVIDAS.map(({ para }) => para.join(".")));
  const out: PermissoesConfig = {};
  for (const [funcao, salvos] of Object.entries(config)) {
    const defs = PERMISSOES_POR_FUNCAO[funcao] ?? [];
    if (defs.length === 0) {
      out[funcao] = salvos;
      continue;
    }
    // Permissões movidas não entram como "novas": seguem a permissão de origem (abaixo).
    const chavesAtuais = defs.map((d) => d.key).filter((k) => !destinosMovidos.has(`${funcao}.${k}`));
    out[funcao] = [...new Set([...salvos, ...chavesAtuais])];
  }

  // Permissão movida: concedida só se a de origem estava (sem configuração na
  // função de origem = tudo liberado). Se a função de destino não tinha
  // configuração (tudo liberado), passa a ter uma, sem as que não eram concedidas.
  const negadasPorFuncao: Record<string, Set<string>> = {};
  for (const { de: [funcaoDe, chaveDe], para: [funcaoPara, chavePara] } of PERMISSOES_MOVIDAS) {
    const origem = config[funcaoDe];
    const concedida = !origem || origem.includes(chaveDe);
    if (out[funcaoPara]) {
      if (concedida && !out[funcaoPara].includes(chavePara)) out[funcaoPara].push(chavePara);
    } else if (!concedida) {
      (negadasPorFuncao[funcaoPara] ??= new Set()).add(chavePara);
    }
  }
  for (const [funcao, negadas] of Object.entries(negadasPorFuncao)) {
    out[funcao] = (PERMISSOES_POR_FUNCAO[funcao] ?? []).map((d) => d.key).filter((k) => !negadas.has(k));
  }
  return out;
}

/**
 * Faz o parse aplicando a migração apenas quando a configuração é ANTIGA
 * (versão anterior à atual). Configurações já migradas/salvas na versão atual
 * são autoritativas: revogações explícitas continuam valendo (nada é
 * re-concedido automaticamente).
 */
export function parsePermissoesConfigMigrada(
  raw: string | null | undefined,
  versao: number | undefined
): PermissoesConfig {
  const config = parsePermissoesConfig(raw);
  if (versao !== undefined && versao >= PERMISSOES_CONFIG_VERSION) return config;
  return migrarPermissoesConfig(config);
}

export function parsePermissoesConfig(raw?: string | null): PermissoesConfig {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const out: PermissoesConfig = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (Array.isArray(value)) {
        out[key] = value.filter((v): v is string => typeof v === "string");
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function serializePermissoesConfig(config: PermissoesConfig): string {
  return JSON.stringify(config);
}

/** Permissões concedidas de uma função na configuração. */
export function getPermissoes(config: PermissoesConfig | undefined, funcao: string): string[] {
  return config?.[funcao] ?? [];
}

/**
 * Verifica se uma permissão está concedida na configuração. Sem configuração
 * salva para a função (chave ausente) = tudo liberado (comportamento padrão);
 * com configuração salva (mesmo vazia) = libera apenas o que está marcado.
 */
export function temPermissao(
  config: PermissoesConfig | undefined,
  funcao: string,
  permissao: string
): boolean {
  const salvos = config?.[funcao];
  if (!salvos) return true;
  return salvos.includes(permissao);
}

/**
 * Valores do dropdown PAI da função Administração do Sistema liberados
 * conforme as permissões salvas. Sem configuração (lista vazia) = tudo
 * liberado (comportamento padrão).
 */
export function adminSubmodulosPermitidos(config: PermissoesConfig | undefined): string[] {
  const salvos = config?.["administracaoSistema"];
  // Sem configuração salva para a função: comportamento padrão (tudo liberado).
  if (!salvos) return ADMIN_SUBMODULOS.map((s) => s.value);
  // Configuração salva (mesmo vazia): libera apenas o que está marcado.
  return ADMIN_SUBMODULOS.filter((s) => salvos.includes(s.permissao)).map((s) => s.value);
}

/**
 * Valores do dropdown PAI da função Cadastro de Pessoas (Pessoas Físicas /
 * Pessoas Jurídicas) liberados conforme as permissões salvas. Sem
 * configuração (lista vazia) = tudo liberado (comportamento padrão).
 */
export function pessoaSubmodulosPermitidos(config: PermissoesConfig | undefined): string[] {
  const salvos = config?.["pessoaFisica"];
  // Sem configuração salva para a função: comportamento padrão (tudo liberado).
  if (!salvos) return PESSOA_SUBMODULOS.map((s) => s.value);
  // Configuração salva (mesmo vazia): libera apenas o que está marcado.
  return PESSOA_SUBMODULOS.filter((s) => salvos.includes(s.permissao)).map((s) => s.value);
}

/**
 * Valores do dropdown PAI da função Estrutura Acadêmica (Alunos /
 * Colaboradores) liberados conforme as permissões salvas. Sem configuração
 * (lista vazia) = tudo liberado (comportamento padrão).
 */
export function eaSubmodulosPermitidos(config: PermissoesConfig | undefined): string[] {
  const salvos = config?.["estruturaAcademica"];
  // Sem configuração salva para a função: comportamento padrão (tudo liberado).
  if (!salvos) return EA_SUBMODULOS.map((s) => s.value);
  // Configuração salva (mesmo vazia): libera apenas o que está marcado.
  return EA_SUBMODULOS.filter((s) => salvos.includes(s.permissao)).map((s) => s.value);
}

/**
 * Submódulos da função Patrimônio (dropdown PAI) e a permissão que
 * libera o acesso a cada um deles.
 */
export const PATRIMONIO_SUBMODULOS: { value: string; label: string; permissao: string }[] = [
  { value: 'ativos', label: 'Ativos', permissao: 'acessar_ativo' },
  { value: 'categoria', label: 'Categoria', permissao: 'acessar_categoria' },
  { value: 'manutencoes', label: 'Manutenções', permissao: 'acessar_manutencao' },
  { value: 'parametrosFuncao', label: 'Parâmetros', permissao: 'acessar_parametros_funcao' },
];

/**
 * Valores do dropdown PAI da função Patrimônio (Ativos/...) liberados conforme
 * as permissões salvas. Sem configuração (lista vazia) = tudo liberado.
 */
/** Submódulos da função Logs (dropdown PAI) e a permissão que libera o acesso a cada um deles. */
export const LOGS_SUBMODULOS: { value: string; label: string; permissao: string }[] = [
  { value: 'acessos', label: 'Acessos', permissao: 'acessar_acessos' },
  { value: 'exclusoes', label: 'Exclusões', permissao: 'acessar_exclusoes' },
];

/** Opções do dropdown PAI de Logs, em ordem alfabética. */
export const LOGS_OPCOES_DROPDOWN: { value: string; label: string }[] = LOGS_SUBMODULOS.map(({ value, label }) => ({ value, label }));

/** Submódulos de Logs liberados conforme as permissões salvas (sem configuração = tudo liberado). */
export function logsSubmodulosPermitidos(config: PermissoesConfig | undefined): string[] {
  const salvos = config?.["logs"];
  if (!salvos) return LOGS_SUBMODULOS.map((s) => s.value);
  return LOGS_SUBMODULOS.filter((s) => salvos.includes(s.permissao)).map((s) => s.value);
}

export function patrimonioSubmodulosPermitidos(config: PermissoesConfig | undefined): string[] {
  const salvos = config?.["patrimonio"];
  // Sem configuração salva para a função: comportamento padrão (tudo liberado).
  if (!salvos) return PATRIMONIO_SUBMODULOS.map((s) => s.value);
  // Configuração salva (mesmo vazia): libera apenas o que está marcado.
  return PATRIMONIO_SUBMODULOS.filter((s) => salvos.includes(s.permissao)).map((s) => s.value);
}

/**
 * Submódulos da função Cadastros Gerais (dropdown PAI) e a permissão que
 * libera o acesso a cada um deles.
 */
export const CG_SUBMODULOS: { value: string; label: string; permissao: string }[] = [
  { value: 'cargo', label: 'Cargo', permissao: 'acessar_cargo' },
  { value: 'combustivel', label: 'Combustível', permissao: 'acessar_combustivel' },
  { value: 'corRaca', label: 'Cor/Raça', permissao: 'acessar_cor_raca' },
  { value: 'estadoCivil', label: 'Estado civil', permissao: 'acessar_estado_civil' },
  { value: 'grauParentesco', label: 'Grau de parentesco', permissao: 'acessar_grau_parentesco' },
  { value: 'localizacao', label: 'Localização', permissao: 'acessar_localizacao' },
  { value: 'logradouro', label: 'Logradouro', permissao: 'acessar_logradouro' },
  { value: 'marca', label: 'Marca', permissao: 'acessar_marca' },
  { value: 'modalidadeEnsino', label: 'Modalidade de ensino', permissao: 'acessar_modalidade_ensino' },
  { value: 'orgaoEmissor', label: 'Órgão emissor', permissao: 'acessar_orgao_emissor' },
  { value: 'profissao', label: 'Profissão', permissao: 'acessar_profissao' },
  { value: 'sexo', label: 'Sexo', permissao: 'acessar_sexo' },
  { value: 'sistemaOperacional', label: 'Sistema operacional', permissao: 'acessar_sistema_operacional' },
  { value: 'vinculoContratual', label: 'Vínculo contratual', permissao: 'acessar_vinculo_contratual' },
];

/**
 * Valores do dropdown PAI da função Cadastros Gerais liberados conforme as
 * permissões salvas. Sem configuração (lista vazia) = tudo liberado.
 */
export function cgSubmodulosPermitidos(config: PermissoesConfig | undefined): string[] {
  const salvos = config?.["cadastrosGerais"];
  // Sem configuração salva para a função: comportamento padrão (tudo liberado).
  if (!salvos) return CG_SUBMODULOS.map((s) => s.value);
  // Configuração salva (mesmo vazia): libera apenas o que está marcado.
  return CG_SUBMODULOS.filter((s) => salvos.includes(s.permissao)).map((s) => s.value);
}
