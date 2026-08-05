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
    { key: "acessar_campos", label: "Permite acessar Campos" },
    { key: "acessar_perfis", label: "Permite acessar Perfis" },
    { key: "acessar_usuarios", label: "Permite acessar Usuários" },
  ],
  pessoaFisica: [],
  cadastrosGerais: [],
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
