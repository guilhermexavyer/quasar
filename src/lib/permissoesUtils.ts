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
  cadastrosGerais: [],
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

/** Configuração de permissões: `funcao` → lista de chaves de permissão concedidas. */
export type PermissoesConfig = Record<string, string[]>;

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
