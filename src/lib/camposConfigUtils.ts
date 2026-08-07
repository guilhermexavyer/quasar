/* Configuração de campos por perfil (Administração do Sistema > Campos).
 *
 * A regra é pertinente ao PERFIL: cada perfil guarda um config_campos
 * (JSON) que mapeia a chave composta `colecao.campo` → status.
 * Status possíveis: N (Normal), O (Obrigatório), D (Desabilitado).
 */

export type CampoStatus = "N" | "O" | "D";

export type CamposConfig = Record<string, CampoStatus>;

export const CAMPO_STATUS_LABELS: Record<CampoStatus, string> = {
  N: "Normal",
  O: "Obrigatório",
  D: "Desabilitado",
};

export const CAMPO_STATUS_ORDER: CampoStatus[] = ["N", "O", "D"];

export function parseCamposConfig(raw?: string | null): CamposConfig {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const out: CamposConfig = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (value === "N" || value === "O" || value === "D") {
        out[key] = value;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function serializeCamposConfig(config: CamposConfig): string {
  return JSON.stringify(config);
}

export function campoKey(colecao: string, campo: string): string {
  return `${colecao}.${campo}`;
}

export function getCampoStatus(config: CamposConfig | undefined, colecao: string, campo: string): CampoStatus {
  return config?.[campoKey(colecao, campo)] ?? "N";
}

export function getCampoStatusByKey(config: CamposConfig | undefined, chave: string): CampoStatus {
  return config?.[chave] ?? "N";
}

/** Regras de uma coleção específica no formato `campo` → status (para os forms). */
export function campoRegrasDaColecao(
  config: CamposConfig | undefined,
  colecao: string
): Record<string, CampoStatus> {
  const out: Record<string, CampoStatus> = {};
  if (!config) return out;
  const prefixo = `${colecao}.`;
  for (const [chave, status] of Object.entries(config)) {
    if (chave.startsWith(prefixo)) {
      out[chave.slice(prefixo.length)] = status;
    }
  }
  return out;
}

/** Campos obrigatórios da coleção que estão vazios no formulário (para bloquear o salvar). */
export function camposObrigatoriosVazios(
  form: Record<string, any>,
  regras: Record<string, CampoStatus>
): string[] {
  const faltando: string[] = [];
  for (const [campo, status] of Object.entries(regras)) {
    if (status !== "O") continue;
    const v = form[campo];
    if (v === undefined || v === null || String(v).trim() === "") {
      faltando.push(campo);
    }
  }
  return faltando;
}

export interface CampoDef {
  /** Chave composta usada na config: `colecao.campo` (ex.: pessoa_fisica.ds_nome). */
  key: string;
  /** Nome exibido no painel direito (label do campo no formulário). */
  label: string;
  /** Identificação da coleção (ex.: Pessoa Física, Pessoa Jurídica, Usuário...). */
  tipo: string;
  /** Nome da coleção no Firestore (usada na aplicação das regras nos forms). */
  colecao: string;
}

/** Campos editáveis de cada função do sistema (pessoaFisica, administracaoSistema, cadastrosGerais). */
export const CAMPOS_POR_FUNCAO: Record<string, CampoDef[]> = {
  pessoaFisica: [
    { key: "pessoa_fisica.ds_nome", label: "Nome completo", tipo: "Pessoa Física", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.dt_nascimento", label: "Nascimento", tipo: "Pessoa Física", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.nr_seq_sexo", label: "Sexo", tipo: "Pessoa Física", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.nr_seq_estado_civil", label: "Estado civil", tipo: "Pessoa Física", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.nr_seq_cor_raca", label: "Cor/Raça", tipo: "Pessoa Física", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.nr_seq_profissao", label: "Profissão", tipo: "Pessoa Física", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.cd_ibge_naturalidade", label: "Naturalidade", tipo: "Pessoa Física", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.nr_cpf", label: "CPF", tipo: "Pessoa Física", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.nr_rg", label: "RG", tipo: "Pessoa Física", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.dt_emissao", label: "Data de emissão", tipo: "Pessoa Física", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.nr_seq_orgao_emissor", label: "Órgão emissor", tipo: "Pessoa Física", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.sg_estado", label: "UF", tipo: "Pessoa Física", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.nr_telefone", label: "Telefone", tipo: "Pessoa Física", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.ds_email", label: "E-mail", tipo: "Pessoa Física", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.nr_cep", label: "CEP", tipo: "Pessoa Física", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.ds_endereco", label: "Rua", tipo: "Pessoa Física", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.nr_seq_logradouro", label: "Logradouro", tipo: "Pessoa Física", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.nr_endereco", label: "Número", tipo: "Pessoa Física", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.ds_bairro", label: "Bairro", tipo: "Pessoa Física", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.ds_complemento", label: "Complemento", tipo: "Pessoa Física", colecao: "pessoa_fisica" },

    { key: "pessoa_juridica.ds_razao_social", label: "Razão social", tipo: "Pessoa Jurídica", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.ds_nome_fantasia", label: "Nome fantasia", tipo: "Pessoa Jurídica", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.nr_cnpj", label: "CNPJ", tipo: "Pessoa Jurídica", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.nr_inscricao_estadual", label: "Inscrição estadual", tipo: "Pessoa Jurídica", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.nr_inscricao_municipal", label: "Inscrição municipal", tipo: "Pessoa Jurídica", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.dt_abertura", label: "Data de abertura", tipo: "Pessoa Jurídica", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.nr_telefone", label: "Telefone", tipo: "Pessoa Jurídica", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.ds_email", label: "E-mail", tipo: "Pessoa Jurídica", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.nr_cep", label: "CEP", tipo: "Pessoa Jurídica", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.ds_endereco", label: "Rua", tipo: "Pessoa Jurídica", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.nr_seq_logradouro", label: "Logradouro", tipo: "Pessoa Jurídica", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.nr_endereco", label: "Número", tipo: "Pessoa Jurídica", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.ds_bairro", label: "Bairro", tipo: "Pessoa Jurídica", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.ds_complemento", label: "Complemento", tipo: "Pessoa Jurídica", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.sg_estado", label: "UF", tipo: "Pessoa Jurídica", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.cd_ibge_cidade", label: "Cidade", tipo: "Pessoa Jurídica", colecao: "pessoa_juridica" },
  ],
  administracaoSistema: [
    { key: "usuario.ds_usuario", label: "Usuário", tipo: "Usuário", colecao: "usuario" },
    { key: "usuario.ds_usuario_alternativo", label: "Usuário alternativo", tipo: "Usuário", colecao: "usuario" },
    { key: "usuario.nr_seq_pessoa_fisica", label: "Pessoa física", tipo: "Usuário", colecao: "usuario" },
    { key: "usuario.ds_email", label: "E-mail", tipo: "Usuário", colecao: "usuario" },
    { key: "usuario.ie_status", label: "Status", tipo: "Usuário", colecao: "usuario" },
    { key: "usuario.ds_observacao", label: "Observação", tipo: "Usuário", colecao: "usuario" },

    { key: "perfil.ds_perfil", label: "Perfil", tipo: "Perfil", colecao: "perfil" },
    { key: "perfil.ds_observacao", label: "Observação", tipo: "Perfil", colecao: "perfil" },
    { key: "perfil.ie_status", label: "Status", tipo: "Perfil", colecao: "perfil" },
  ],
  cadastrosGerais: [
    { key: "cg_sexo.ds_sexo", label: "Descrição", tipo: "Sexo", colecao: "cg_sexo" },
    { key: "cg_sexo.ie_status", label: "Status", tipo: "Sexo", colecao: "cg_sexo" },

    { key: "cg_estado_civil.ds_estado_civil", label: "Descrição", tipo: "Estado civil", colecao: "cg_estado_civil" },
    { key: "cg_estado_civil.ie_status", label: "Status", tipo: "Estado civil", colecao: "cg_estado_civil" },

    { key: "cg_cor_raca.ds_cor_raca", label: "Descrição", tipo: "Cor/Raça", colecao: "cg_cor_raca" },
    { key: "cg_cor_raca.ie_status", label: "Status", tipo: "Cor/Raça", colecao: "cg_cor_raca" },

    { key: "cg_profissao.ds_profissao", label: "Descrição", tipo: "Profissão", colecao: "cg_profissao" },
    { key: "cg_profissao.nr_cbo", label: "CBO", tipo: "Profissão", colecao: "cg_profissao" },
    { key: "cg_profissao.ie_status", label: "Status", tipo: "Profissão", colecao: "cg_profissao" },

    { key: "cg_orgao_emissor.sg_orgao_emissor", label: "Sigla", tipo: "Órgão emissor", colecao: "cg_orgao_emissor" },
    { key: "cg_orgao_emissor.ds_orgao_emissor", label: "Descrição", tipo: "Órgão emissor", colecao: "cg_orgao_emissor" },
    { key: "cg_orgao_emissor.ie_status", label: "Status", tipo: "Órgão emissor", colecao: "cg_orgao_emissor" },

    { key: "cg_logradouro.sg_logradouro", label: "Sigla", tipo: "Logradouro", colecao: "cg_logradouro" },
    { key: "cg_logradouro.ds_logradouro", label: "Descrição", tipo: "Logradouro", colecao: "cg_logradouro" },
    { key: "cg_logradouro.ie_status", label: "Status", tipo: "Logradouro", colecao: "cg_logradouro" },

    { key: "cg_grau_parentesco.ds_grau_parentesco", label: "Descrição", tipo: "Grau de parentesco", colecao: "cg_grau_parentesco" },
    { key: "cg_grau_parentesco.ie_status", label: "Status", tipo: "Grau de parentesco", colecao: "cg_grau_parentesco" },
  ],
  estruturaAcademica: [
    // Desligamento, Status e Motivo desligamento não são configuráveis (campos
    // fixos: desabilitados no formulário e sempre Ativo/desligado por regra).
    { key: "aluno.nr_seq_pessoa_fisica", label: "Pessoa física", tipo: "Aluno", colecao: "aluno" },
    { key: "aluno.nr_matricula", label: "Matrícula", tipo: "Aluno", colecao: "aluno" },
    { key: "aluno.dt_ingresso", label: "Data de ingresso", tipo: "Aluno", colecao: "aluno" },
    { key: "aluno.nr_seq_responsavel", label: "Pessoa física (responsável)", tipo: "Aluno", colecao: "aluno" },
    { key: "aluno.nr_seq_grau_parentesco", label: "Grau de parentesco", tipo: "Aluno", colecao: "aluno" },
  ],
};
