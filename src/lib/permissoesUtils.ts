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
    { key: "acessar_campos", label: "Permite acessar Campos" },
    { key: "acessar_perfis", label: "Permite acessar Perfis" },
    { key: "acessar_usuarios", label: "Permite acessar Usuários" },
    // Opção Campos
    { key: "adicionar_campo", label: "Permite adicionar" },
    { key: "alterar_status_campo", label: "Permite alterar o status do campo" },
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
    { key: "excluir_pessoa_fisica", label: "Permite excluir" },
    // Pessoas Jurídicas
    { key: "acessar_pessoa_juridica", label: "Permite acessar Pessoas Jurídicas" },
    { key: "adicionar_pessoa_juridica", label: "Permite adicionar" },
    { key: "ver_pessoa_juridica", label: "Permite ver" },
    { key: "excluir_pessoa_juridica", label: "Permite excluir" },
  ],
  estruturaAcademica: [
    // Alunos
    { key: "acessar_aluno", label: "Permite acessar Alunos" },
    { key: "adicionar_aluno", label: "Permite adicionar" },
    { key: "ver_aluno", label: "Permite ver" },
    { key: "alterar_data_ingresso_aluno", label: "Permite alterar data de ingresso" },
    { key: "alterar_status_aluno", label: "Permite alterar status" },
    { key: "excluir_aluno", label: "Permite excluir" },
    // Colaboradores
    { key: "acessar_colaborador", label: "Permite acessar Colaboradores" },
    { key: "adicionar_colaborador", label: "Permite adicionar" },
    { key: "ver_colaborador", label: "Permite ver" },
    { key: "alterar_data_admissao_colaborador", label: "Permite alterar data de admissão" },
    { key: "alterar_status_colaborador", label: "Permite alterar status" },
    { key: "excluir_colaborador", label: "Permite excluir" },
  ],
  patrimonio: [
    // Parâmetros da função
    { key: "acessar_parametros_funcao", label: "Permite acessar Parâmetros da função" },
    // Ativos
    { key: "acessar_ativo", label: "Permite acessar Ativos" },
    { key: "adicionar_ativo", label: "Permite adicionar" },
    { key: "ver_ativo", label: "Permite ver" },
    { key: "gerar_codigo_patrimonio", label: "Permite gerar código de patrimônio" },
    { key: "mudar_para_operacional", label: "Permite mudar para Operacional" },
    { key: "enviar_para_manutencao", label: "Permite enviar para manutenção" },
    { key: "mover_para_estoque", label: "Permite mover para o estoque" },
    { key: "descartar_ativo", label: "Permite descartar" },
    { key: "alterar_status_descartado", label: "Permite alterar status de um ativo descartado" },
    { key: "excluir_ativo", label: "Permite excluir" },
    // Manutenções
    { key: "acessar_manutencao", label: "Permite acessar Manutenções" },
    { key: "adicionar_manutencao", label: "Permite adicionar" },
    { key: "ver_manutencao", label: "Permite ver" },
    { key: "concluir_manutencao", label: "Permite concluir manutenção" },
    { key: "concluir_manutencao_registro", label: "Permite concluir manutenção" },
    { key: "cancelar_manutencao", label: "Permite cancelar manutenção" },
    { key: "excluir_manutencao", label: "Permite excluir" },
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
    // Categoria
    { key: "acessar_categoria_ativo", label: "Permite acessar Categoria (ativo)" },
    { key: "adicionar_categoria_ativo", label: "Permite adicionar" },
    { key: "ver_categoria_ativo", label: "Permite ver" },
    { key: "excluir_categoria_ativo", label: "Permite excluir" },
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
      titulo: 'Campos',
      chaves: ['acessar_campos', 'adicionar_campo', 'alterar_status_campo'],
    },
    {
      titulo: 'Perfis',
      chaves: ['acessar_perfis', 'adicionar_perfil', 'ver_perfil', 'delegar_funcoes_perfil', 'duplicar_perfil', 'excluir_perfil'],
    },
    {
      titulo: 'Usuários',
      chaves: ['acessar_usuarios', 'adicionar_usuario', 'ver_usuario', 'alterar_senha_usuario', 'delegar_perfis_usuario', 'excluir_usuario'],
    },
  ],
  pessoaFisica: [
    {
      titulo: 'Pessoas Físicas',
      chaves: ['acessar_pessoa_fisica', 'adicionar_pessoa_fisica', 'ver_pessoa_fisica', 'excluir_pessoa_fisica'],
    },
    {
      titulo: 'Pessoas Jurídicas',
      chaves: ['acessar_pessoa_juridica', 'adicionar_pessoa_juridica', 'ver_pessoa_juridica', 'excluir_pessoa_juridica'],
    },
  ],
  estruturaAcademica: [
    {
      titulo: 'Alunos',
      chaves: ['acessar_aluno', 'adicionar_aluno', 'ver_aluno', 'alterar_data_ingresso_aluno', 'alterar_status_aluno', 'excluir_aluno'],
    },
    {
      titulo: 'Colaboradores',
      chaves: ['acessar_colaborador', 'adicionar_colaborador', 'ver_colaborador', 'alterar_data_admissao_colaborador', 'alterar_status_colaborador', 'excluir_colaborador'],
    },
  ],
  patrimonio: [
    {
      titulo: 'Ativos',
      chaves: ['acessar_ativo', 'adicionar_ativo', 'ver_ativo', 'gerar_codigo_patrimonio', 'alterar_status_descartado', 'mudar_para_operacional', 'enviar_para_manutencao', 'concluir_manutencao', 'mover_para_estoque', 'descartar_ativo', 'excluir_ativo'],
    },
    {
      titulo: 'Manutenções',
      chaves: ['acessar_manutencao', 'adicionar_manutencao', 'ver_manutencao', 'concluir_manutencao_registro', 'cancelar_manutencao', 'excluir_manutencao'],
    },
    {
      titulo: 'Parâmetros da função',
      chaves: ['acessar_parametros_funcao'],
    },
  ],
  cadastrosGerais: [
    {
      titulo: 'Cargo',
      chaves: ['acessar_cargo', 'adicionar_cargo', 'ver_cargo', 'excluir_cargo'],
    },
    {
      titulo: 'Categoria (ativo)',
      chaves: ['acessar_categoria_ativo', 'adicionar_categoria_ativo', 'ver_categoria_ativo', 'excluir_categoria_ativo'],
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
  { value: 'campos', label: 'Campos', permissao: 'acessar_campos' },
  { value: 'perfis', label: 'Perfis', permissao: 'acessar_perfis' },
  { value: 'usuarios', label: 'Usuários', permissao: 'acessar_usuarios' },
];

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
];

/** Configuração de permissões: `funcao` → lista de chaves de permissão concedidas. */
export type PermissoesConfig = Record<string, string[]>;

/**
 * Versão atual do formato de `config_permissoes`. Deve ser incrementada sempre
 * que novas permissões forem adicionadas a `PERMISSOES_POR_FUNCAO`: configurações
 * salvas antes da adição são migradas uma única vez (ver `migrarPermissoesConfig`),
 * concedendo as permissões novas por padrão.
 */
export const PERMISSOES_CONFIG_VERSION = 11;

/**
 * Migra uma configuração antiga para a versão atual: para cada função com
 * permissões salvas, une as chaves atuais de `PERMISSOES_POR_FUNCAO` — assim as
 * permissões adicionadas depois do último salvamento passam a valer como
 * concedidas (sem quebrar o que já estava marcado).
 */
export function migrarPermissoesConfig(config: PermissoesConfig): PermissoesConfig {
  const out: PermissoesConfig = {};
  for (const [funcao, salvos] of Object.entries(config)) {
    const defs = PERMISSOES_POR_FUNCAO[funcao] ?? [];
    if (defs.length === 0) {
      out[funcao] = salvos;
      continue;
    }
    const chavesAtuais = defs.map((d) => d.key);
    out[funcao] = [...new Set([...salvos, ...chavesAtuais])];
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
  { value: 'manutencoes', label: 'Manutenções', permissao: 'acessar_manutencao' },
  { value: 'parametrosFuncao', label: 'Parâmetros da função', permissao: 'acessar_parametros_funcao' },
];

/**
 * Valores do dropdown PAI da função Patrimônio (Ativos/...) liberados conforme
 * as permissões salvas. Sem configuração (lista vazia) = tudo liberado.
 */
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
  { value: 'categoriaAtivo', label: 'Categoria (ativo)', permissao: 'acessar_categoria_ativo' },
  { value: 'corRaca', label: 'Cor/Raça', permissao: 'acessar_cor_raca' },
  { value: 'estadoCivil', label: 'Estado civil', permissao: 'acessar_estado_civil' },
  { value: 'grauParentesco', label: 'Grau de parentesco', permissao: 'acessar_grau_parentesco' },
  { value: 'localizacao', label: 'Localização', permissao: 'acessar_localizacao' },
  { value: 'logradouro', label: 'Logradouro', permissao: 'acessar_logradouro' },
  { value: 'marca', label: 'Marca', permissao: 'acessar_marca' },
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
