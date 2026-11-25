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

/** Última alteração de status de cada campo (perfil.config_campos_alteracao). */
export interface CampoAlteracao {
  /** Primeira vez que o status do campo foi definido. */
  dt_criacao: string;
  /** ds_usuario de quem definiu o status pela primeira vez. */
  ds_usuario_criacao: string;
  dt_alteracao: string;
  /** ds_usuario de quem alterou. */
  ds_usuario_alteracao: string;
}

export type CamposAlteracao = Record<string, CampoAlteracao>;

export function parseCamposAlteracao(raw?: string | null): CamposAlteracao {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const out: CamposAlteracao = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (value && typeof value === "object") {
        const v = value as Partial<CampoAlteracao>;
        // Registros antigos não têm criação: usa a alteração (primeira registrada).
        out[key] = {
          dt_criacao: String(v.dt_criacao ?? v.dt_alteracao ?? ""),
          ds_usuario_criacao: String(v.ds_usuario_criacao ?? v.ds_usuario_alteracao ?? ""),
          dt_alteracao: String(v.dt_alteracao ?? ""),
          ds_usuario_alteracao: String(v.ds_usuario_alteracao ?? ""),
        };
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function serializeCamposAlteracao(alteracoes: CamposAlteracao): string {
  return JSON.stringify(alteracoes);
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
  /** Nome da tabela no banco (usada na aplicação das regras nos forms).
   *  Campos de modais usam uma "coleção" própria do modal (prefixo modal_), para
   *  terem regra independente do mesmo campo no formulário. */
  colecao: string;
}

/**
 * Coleções (chaves de regra) dos modais com campos configuráveis. O campo
 * principal de cada modal (ex.: Status em "Alterar status") é fixo e não entra.
 */
export const MODAL_ALUNO_ALTERAR_STATUS = "modal_aluno_alterar_status";
export const MODAL_COLABORADOR_ALTERAR_STATUS = "modal_colaborador_alterar_status";
export const MODAL_COPIA_ALTERAR_STATUS = "modal_copia_alterar_status";
export const MODAL_ATIVO_OPERACIONAL = "modal_ativo_operacional";
export const MODAL_ATIVO_ESTOQUE = "modal_ativo_estoque";
export const MODAL_ATIVO_DESCARTAR = "modal_ativo_descartar";
export const MODAL_ENVIAR_MANUTENCAO = "modal_enviar_manutencao";
export const MODAL_ATIVO_TRANSFERIR = "modal_ativo_transferir";
export const MODAL_CONCLUIR_MANUTENCAO = "modal_concluir_manutencao";

/** Campos editáveis de cada função do sistema (pessoaFisica, administracaoSistema, cadastrosGerais). */
export const CAMPOS_POR_FUNCAO: Record<string, CampoDef[]> = {
  pessoaFisica: [
    { key: "pessoa_fisica.ds_nome", label: "Nome completo", tipo: "Pessoas Físicas", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.dt_nascimento", label: "Nascimento", tipo: "Pessoas Físicas", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.nr_seq_sexo", label: "Sexo", tipo: "Pessoas Físicas", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.nr_seq_estado_civil", label: "Estado civil", tipo: "Pessoas Físicas", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.nr_seq_cor_raca", label: "Cor/Raça", tipo: "Pessoas Físicas", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.nr_seq_profissao", label: "Profissão", tipo: "Pessoas Físicas", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.cd_ibge_naturalidade", label: "Naturalidade", tipo: "Pessoas Físicas", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.nr_cpf", label: "CPF", tipo: "Pessoas Físicas", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.nr_rg", label: "RG", tipo: "Pessoas Físicas", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.dt_emissao", label: "Data de emissão", tipo: "Pessoas Físicas", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.nr_seq_orgao_emissor", label: "Órgão emissor", tipo: "Pessoas Físicas", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.sg_estado", label: "UF", tipo: "Pessoas Físicas", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.nr_telefone", label: "Telefone", tipo: "Pessoas Físicas", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.ds_email", label: "E-mail", tipo: "Pessoas Físicas", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica_residencial.nr_cep", label: "CEP", tipo: "Pessoas Físicas > Residencial", colecao: "pessoa_fisica_residencial" },
    { key: "pessoa_fisica_residencial.ds_endereco", label: "Rua", tipo: "Pessoas Físicas > Residencial", colecao: "pessoa_fisica_residencial" },
    { key: "pessoa_fisica_residencial.nr_seq_logradouro", label: "Logradouro", tipo: "Pessoas Físicas > Residencial", colecao: "pessoa_fisica_residencial" },
    { key: "pessoa_fisica_residencial.nr_endereco", label: "Número", tipo: "Pessoas Físicas > Residencial", colecao: "pessoa_fisica_residencial" },
    { key: "pessoa_fisica_residencial.ds_bairro", label: "Bairro", tipo: "Pessoas Físicas > Residencial", colecao: "pessoa_fisica_residencial" },
    { key: "pessoa_fisica_residencial.ds_complemento", label: "Complemento", tipo: "Pessoas Físicas > Residencial", colecao: "pessoa_fisica_residencial" },
    { key: "pessoa_fisica_comercial.nr_cep", label: "CEP", tipo: "Pessoas Físicas > Comercial", colecao: "pessoa_fisica_comercial" },
    { key: "pessoa_fisica_comercial.ds_endereco", label: "Rua", tipo: "Pessoas Físicas > Comercial", colecao: "pessoa_fisica_comercial" },
    { key: "pessoa_fisica_comercial.nr_seq_logradouro", label: "Logradouro", tipo: "Pessoas Físicas > Comercial", colecao: "pessoa_fisica_comercial" },
    { key: "pessoa_fisica_comercial.nr_endereco", label: "Número", tipo: "Pessoas Físicas > Comercial", colecao: "pessoa_fisica_comercial" },
    { key: "pessoa_fisica_comercial.ds_bairro", label: "Bairro", tipo: "Pessoas Físicas > Comercial", colecao: "pessoa_fisica_comercial" },
    { key: "pessoa_fisica_comercial.ds_complemento", label: "Complemento", tipo: "Pessoas Físicas > Comercial", colecao: "pessoa_fisica_comercial" },
    { key: "pessoa_fisica_saude.ds_tipo_sanguineo", label: "Tipo sanguíneo", tipo: "Pessoas Físicas > Saúde", colecao: "pessoa_fisica_saude" },
    { key: "pessoa_fisica_saude.ds_alergia", label: "Alergia", tipo: "Pessoas Físicas > Saúde", colecao: "pessoa_fisica_saude" },
    { key: "pessoa_fisica_saude.ds_medicamento_continuo", label: "Medicamento de uso contínuo", tipo: "Pessoas Físicas > Saúde", colecao: "pessoa_fisica_saude" },
    { key: "pessoa_fisica_saude.ds_restricao_alimentar", label: "Restrição alimentar", tipo: "Pessoas Físicas > Saúde", colecao: "pessoa_fisica_saude" },
    { key: "pessoa_fisica_saude.ds_necessidade_especial", label: "Necessidade especial", tipo: "Pessoas Físicas > Saúde", colecao: "pessoa_fisica_saude" },
    { key: "pessoa_fisica_saude.ds_observacao_medica", label: "Observações médicas", tipo: "Pessoas Físicas > Saúde", colecao: "pessoa_fisica_saude" },

    { key: "pessoa_juridica.ds_razao_social", label: "Razão social", tipo: "Pessoas Jurídicas", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.ds_nome_fantasia", label: "Nome fantasia", tipo: "Pessoas Jurídicas", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.nr_cnpj", label: "CNPJ", tipo: "Pessoas Jurídicas", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.nr_inscricao_estadual", label: "Inscrição estadual", tipo: "Pessoas Jurídicas", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.nr_inscricao_municipal", label: "Inscrição municipal", tipo: "Pessoas Jurídicas", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.dt_abertura", label: "Data de abertura", tipo: "Pessoas Jurídicas", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.nr_telefone", label: "Telefone", tipo: "Pessoas Jurídicas", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.ds_email", label: "E-mail", tipo: "Pessoas Jurídicas", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.nr_cep", label: "CEP", tipo: "Pessoas Jurídicas", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.ds_endereco", label: "Rua", tipo: "Pessoas Jurídicas", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.nr_seq_logradouro", label: "Logradouro", tipo: "Pessoas Jurídicas", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.nr_endereco", label: "Número", tipo: "Pessoas Jurídicas", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.ds_bairro", label: "Bairro", tipo: "Pessoas Jurídicas", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.ds_complemento", label: "Complemento", tipo: "Pessoas Jurídicas", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.sg_estado", label: "UF", tipo: "Pessoas Jurídicas", colecao: "pessoa_juridica" },
    { key: "pessoa_juridica.cd_ibge_cidade", label: "Cidade", tipo: "Pessoas Jurídicas", colecao: "pessoa_juridica" },
  ],
  administracaoSistema: [
    { key: "usuario.ds_usuario", label: "Usuário", tipo: "Usuários", colecao: "usuario" },
    { key: "usuario.ds_usuario_alternativo", label: "Usuário alternativo", tipo: "Usuários", colecao: "usuario" },
    { key: "usuario.nr_seq_pessoa_fisica", label: "Pessoa física", tipo: "Usuários", colecao: "usuario" },
    { key: "usuario.ds_email", label: "E-mail", tipo: "Usuários", colecao: "usuario" },
    { key: "usuario.ds_observacao", label: "Observação", tipo: "Usuários", colecao: "usuario" },
    { key: "usuario.ie_status", label: "Status", tipo: "Usuários", colecao: "usuario" },
    { key: "usuario.ie_base_conhecimento", label: "Base de Conhecimento", tipo: "Usuários", colecao: "usuario" },
    { key: "usuario.ie_central_suporte", label: "Central de Suporte", tipo: "Usuários", colecao: "usuario" },
    { key: "usuario.ie_parametros_funcao", label: "Parâmetros da Função", tipo: "Usuários", colecao: "usuario" },
    { key: "usuario.ie_ver_auditoria", label: "Ver auditoria", tipo: "Usuários", colecao: "usuario" },

    { key: "perfil.ds_perfil", label: "Perfil", tipo: "Perfis", colecao: "perfil" },
    { key: "perfil.ds_observacao", label: "Observação", tipo: "Perfis", colecao: "perfil" },
    { key: "perfil.ie_status", label: "Status", tipo: "Perfis", colecao: "perfil" },

    { key: "imagem.ds_imagem", label: "Descrição", tipo: "Imagens", colecao: "imagem" },
    { key: "imagem.ie_arquivo", label: "Arquivo", tipo: "Imagens", colecao: "imagem" },
  ],
  cadastrosGerais: [
    { key: "cg_sexo.ds_sexo", label: "Descrição", tipo: "Sexo", colecao: "cg_sexo" },
    { key: "cg_estado_civil.ds_estado_civil", label: "Descrição", tipo: "Estado civil", colecao: "cg_estado_civil" },
    { key: "cg_cor_raca.ds_cor_raca", label: "Descrição", tipo: "Cor/Raça", colecao: "cg_cor_raca" },
    { key: "cg_profissao.ds_profissao", label: "Descrição", tipo: "Profissão", colecao: "cg_profissao" },
    { key: "cg_profissao.nr_cbo", label: "CBO", tipo: "Profissão", colecao: "cg_profissao" },

    { key: "cg_orgao_emissor.sg_orgao_emissor", label: "Sigla", tipo: "Órgão emissor", colecao: "cg_orgao_emissor" },
    { key: "cg_orgao_emissor.ds_orgao_emissor", label: "Descrição", tipo: "Órgão emissor", colecao: "cg_orgao_emissor" },

    { key: "cg_logradouro.sg_logradouro", label: "Sigla", tipo: "Logradouro", colecao: "cg_logradouro" },
    { key: "cg_logradouro.ds_logradouro", label: "Descrição", tipo: "Logradouro", colecao: "cg_logradouro" },

    { key: "cg_combustivel.ds_combustivel", label: "Descrição", tipo: "Combustível", colecao: "cg_combustivel" },
    { key: "cg_combustivel.ie_status", label: "Status", tipo: "Combustível", colecao: "cg_combustivel" },
    { key: "cg_modalidade_ensino.ds_modalidade_ensino", label: "Descrição", tipo: "Modalidade de ensino", colecao: "cg_modalidade_ensino" },
    { key: "cg_modalidade_ensino.ie_status", label: "Status", tipo: "Modalidade de ensino", colecao: "cg_modalidade_ensino" },
    { key: "cg_formato_papel.ds_formato_papel", label: "Descrição", tipo: "Formato do papel", colecao: "cg_formato_papel" },
    { key: "cg_formato_papel.qt_largura", label: "Largura", tipo: "Formato do papel", colecao: "cg_formato_papel" },
    { key: "cg_formato_papel.qt_altura", label: "Altura", tipo: "Formato do papel", colecao: "cg_formato_papel" },
    { key: "cg_formato_papel.ie_status", label: "Status", tipo: "Formato do papel", colecao: "cg_formato_papel" },
    { key: "cg_tipo_papel.ds_tipo_papel", label: "Descrição", tipo: "Tipo de papel", colecao: "cg_tipo_papel" },
    { key: "cg_tipo_papel.ie_status", label: "Status", tipo: "Tipo de papel", colecao: "cg_tipo_papel" },
    { key: "cg_marca.ds_marca", label: "Descrição", tipo: "Marca", colecao: "cg_marca" },

    { key: "cg_grau_parentesco.ds_grau_parentesco", label: "Descrição", tipo: "Grau de parentesco", colecao: "cg_grau_parentesco" },
    { key: "cg_localizacao.ds_localizacao", label: "Descrição", tipo: "Localização", colecao: "cg_localizacao" },
    { key: "cg_cargo.ds_cargo", label: "Descrição", tipo: "Cargo", colecao: "cg_cargo" },
    { key: "cg_vinculo_contratual.ds_vinculo_contratual", label: "Descrição", tipo: "Vínculo contratual", colecao: "cg_vinculo_contratual" },
    { key: "cg_sistema_operacional.ds_sistema_operacional", label: "Descrição", tipo: "Sistema operacional", colecao: "cg_sistema_operacional" },
    { key: "cg_sexo.ie_status", label: "Status", tipo: "Sexo", colecao: "cg_sexo" },
    { key: "cg_estado_civil.ie_status", label: "Status", tipo: "Estado civil", colecao: "cg_estado_civil" },
    { key: "cg_cor_raca.ie_status", label: "Status", tipo: "Cor/Raça", colecao: "cg_cor_raca" },
    { key: "cg_profissao.ie_status", label: "Status", tipo: "Profissão", colecao: "cg_profissao" },
    { key: "cg_orgao_emissor.ie_status", label: "Status", tipo: "Órgão emissor", colecao: "cg_orgao_emissor" },
    { key: "cg_logradouro.ie_status", label: "Status", tipo: "Logradouro", colecao: "cg_logradouro" },
    { key: "cg_marca.ie_status", label: "Status", tipo: "Marca", colecao: "cg_marca" },
    { key: "cg_grau_parentesco.ie_status", label: "Status", tipo: "Grau de parentesco", colecao: "cg_grau_parentesco" },
    { key: "cg_localizacao.ie_status", label: "Status", tipo: "Localização", colecao: "cg_localizacao" },
    { key: "cg_cargo.ie_status", label: "Status", tipo: "Cargo", colecao: "cg_cargo" },
    { key: "cg_vinculo_contratual.ie_status", label: "Status", tipo: "Vínculo contratual", colecao: "cg_vinculo_contratual" },
    { key: "cg_sistema_operacional.ie_status", label: "Status", tipo: "Sistema operacional", colecao: "cg_sistema_operacional" },
  ],
  patrimonio: [
    { key: "pat_ativo.cd_externo", label: "Código externo", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.ds_ativo", label: "Descrição", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.nr_seq_categoria", label: "Categoria", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.nr_seq_localizacao", label: "Localização", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.nr_seq_marca", label: "Marca", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.nr_seq_fornecedor", label: "Fornecedor", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.ds_modelo", label: "Modelo", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.nr_serie", label: "Número de série", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.ds_qr_code", label: "QR Code", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.ds_codigo_barras", label: "Código de barras", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.vl_aquisicao", label: "Valor de aquisição", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.dt_aquisicao", label: "Data de aquisição", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.dt_garantia", label: "Data de garantia", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.ie_status", label: "Status", tipo: "Ativos", colecao: "pat_ativo" },

    { key: "pat_ativo.ds_processador", label: "Processador", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.qt_ram", label: "Memória RAM", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.ie_ram", label: "Unidade (RAM)", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.qt_armazenamento", label: "Armazenamento", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.ie_armazenamento", label: "Unidade", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.ds_endereco_mac", label: "Endereço MAC", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.ds_ip", label: "IPv4", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.nr_seq_sistema_operacional", label: "Sistema operacional", tipo: "Ativos", colecao: "pat_ativo" },

    { key: "pat_ativo.cd_placa", label: "Placa", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.cd_renavam", label: "Renavam", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.nr_ano", label: "Ano", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.ds_cor", label: "Cor", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.nr_seq_combustivel", label: "Combustível", tipo: "Ativos", colecao: "pat_ativo" },

    { key: "pat_ativo.ds_observacao", label: "Observação", tipo: "Ativos", colecao: "pat_ativo" },

    // Categoria
    { key: "pat_categoria.ds_categoria", label: "Descrição", tipo: "Categoria", colecao: "pat_categoria" },
    { key: "pat_categoria.ds_observacao", label: "Observação", tipo: "Categoria", colecao: "pat_categoria" },
    { key: "pat_categoria.ie_status", label: "Status", tipo: "Categoria", colecao: "pat_categoria" },

    // Modais de Ativos
    { key: "modal_ativo_operacional.dt_status", label: "Operacional > Data", tipo: "Ativos", colecao: "modal_ativo_operacional" },
    { key: "modal_ativo_operacional.ds_motivo_status", label: "Operacional > Motivo", tipo: "Ativos", colecao: "modal_ativo_operacional" },
    { key: "modal_ativo_estoque.dt_status", label: "Mover para o estoque > Data", tipo: "Ativos", colecao: "modal_ativo_estoque" },
    { key: "modal_ativo_estoque.ds_motivo_status", label: "Mover para o estoque > Motivo", tipo: "Ativos", colecao: "modal_ativo_estoque" },
    { key: "modal_ativo_descartar.dt_status", label: "Descartar > Data", tipo: "Ativos", colecao: "modal_ativo_descartar" },
    { key: "modal_ativo_descartar.ds_motivo_status", label: "Descartar > Motivo", tipo: "Ativos", colecao: "modal_ativo_descartar" },
    { key: "modal_enviar_manutencao.dt_envio", label: "Enviar para manutenção > Data", tipo: "Ativos", colecao: "modal_enviar_manutencao" },
    { key: "modal_enviar_manutencao.nr_seq_prestador_servico", label: "Enviar para manutenção > Prestador de serviço", tipo: "Ativos", colecao: "modal_enviar_manutencao" },
    { key: "modal_enviar_manutencao.ds_motivo_manutencao", label: "Enviar para manutenção > Motivo", tipo: "Ativos", colecao: "modal_enviar_manutencao" },
    // Transferir: a Localização é o campo principal (fixo, sempre obrigatório).
    { key: "modal_ativo_transferir.ds_motivo_transferencia", label: "Transferir > Motivo", tipo: "Ativos", colecao: "modal_ativo_transferir" },

    // Manutenções
    // Ativo, Prestador, Data de envio, Status, Data de término, Valor total, Motivo e
    // Correções são campos fixos no formulário (preenchidos pelos modais de enviar/concluir).
    // Ativo, Prestador e Data de envio: editáveis só no cadastro (depois, fixos).
    { key: "pat_manutencao.nr_seq_ativo", label: "Ativo", tipo: "Manutenções", colecao: "pat_manutencao" },
    { key: "pat_manutencao.nr_seq_prestador_servico", label: "Prestador de serviço", tipo: "Manutenções", colecao: "pat_manutencao" },
    { key: "pat_manutencao.dt_envio", label: "Data de envio", tipo: "Manutenções", colecao: "pat_manutencao" },
    { key: "pat_manutencao.ds_observacao", label: "Observação", tipo: "Manutenções", colecao: "pat_manutencao" },
    // Responsáveis do ativo (duplo clique em Ativos; Sequência é preenchida pelo sistema).
    { key: "pat_ativo_responsavel.nr_seq_colaborador", label: "Colaborador", tipo: "Ativos > Responsáveis", colecao: "pat_ativo_responsavel" },
    { key: "modal_concluir_manutencao.dt_termino", label: "Concluir manutenção > Data de término", tipo: "Manutenções", colecao: "modal_concluir_manutencao" },
    { key: "modal_concluir_manutencao.ie_isento", label: "Concluir manutenção > Isento", tipo: "Manutenções", colecao: "modal_concluir_manutencao" },
    { key: "modal_concluir_manutencao.vl_total", label: "Concluir manutenção > Valor total", tipo: "Manutenções", colecao: "modal_concluir_manutencao" },
    { key: "modal_concluir_manutencao.ds_correcoes", label: "Concluir manutenção > Correções", tipo: "Manutenções", colecao: "modal_concluir_manutencao" },
  ],
  relatorio: [
    // ── Formulário do Relatório ──
    { key: "relatorio.nr_sequencia", label: "Sequência", tipo: "Relatórios", colecao: "relatorio" },
    { key: "relatorio.ds_relatorio", label: "Descrição", tipo: "Relatórios", colecao: "relatorio" },
    { key: "relatorio.ie_formato", label: "Formato", tipo: "Relatórios", colecao: "relatorio" },
    { key: "relatorio.ie_status", label: "Status", tipo: "Relatórios", colecao: "relatorio" },
    { key: "relatorio.ds_sql", label: "SQL", tipo: "Relatórios", colecao: "relatorio" },
    { key: "relatorio.ds_nome_arquivo", label: "Nome do arquivo", tipo: "Relatórios", colecao: "relatorio" },
    { key: "relatorio.nr_seq_formato_papel", label: "Formato do papel", tipo: "Relatórios", colecao: "relatorio" },
    { key: "relatorio.ie_orientacao", label: "Orientação", tipo: "Relatórios", colecao: "relatorio" },
    { key: "relatorio.ie_borda", label: "Borda", tipo: "Relatórios", colecao: "relatorio" },
    { key: "relatorio.nr_margem_superior", label: "Margem superior", tipo: "Relatórios", colecao: "relatorio" },
    { key: "relatorio.nr_margem_inferior", label: "Margem inferior", tipo: "Relatórios", colecao: "relatorio" },
    { key: "relatorio.nr_margem_esquerda", label: "Margem esquerda", tipo: "Relatórios", colecao: "relatorio" },
    { key: "relatorio.nr_margem_direita", label: "Margem direita", tipo: "Relatórios", colecao: "relatorio" },

    // ── Formulário de Bandas ──
    { key: "relatorio_banda.nr_sequencia", label: "Sequência", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.ds_banda", label: "Descrição", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.nr_ordem", label: "Ordem", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.ie_tipo", label: "Tipo", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.qt_altura", label: "Altura", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.ie_status", label: "Status", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.ds_sql", label: "SQL", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.ie_borda_superior", label: "Borda superior", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.ie_borda_inferior", label: "Borda inferior", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.ie_borda_esquerda", label: "Borda esquerda", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.ie_borda_direita", label: "Borda direita", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.nr_seq_banda_superior", label: "Banda superior", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.ie_nova_pagina", label: "Quebrar página por registro", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.ie_exibir_label", label: "Exibir labels", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.ie_imprimir_vazio", label: "Imprimir sem registros", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.ie_alternar_background", label: "Alternar background", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.cd_background_registro", label: "Registros", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.cd_background_label", label: "Labels", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },

    // ── Formulário de Elementos (bandas do PDF) ──
    { key: "relatorio_banda_elemento.nr_sequencia", label: "Sequência", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ds_elemento", label: "Descrição", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ie_tipo", label: "Tipo", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.nr_seq_imagem", label: "Imagem", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.qt_esquerda", label: "Esquerda", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.qt_topo", label: "Topo", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ie_estilo", label: "Estilo", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.qt_largura", label: "Tamanho", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.qt_altura", label: "Altura", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ie_alinhamento", label: "Alinhamento", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.cd_background", label: "Background", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.cd_cor", label: "Cor", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ie_fonte", label: "Fonte", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.qt_fonte", label: "Tamanho da fonte", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ds_label", label: "Label", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.cd_alias", label: "Atributo", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ds_conteudo", label: "Conteúdo", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ie_mascara", label: "Máscara", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.qt_casas_decimais", label: "Casas decimais", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ie_status", label: "Status", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ie_quebrar_linha", label: "Quebrar linha", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.qt_padding_superior", label: "Padding superior", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.qt_padding_inferior", label: "Padding inferior", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.qt_padding_esquerda", label: "Padding esquerda", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.qt_padding_direita", label: "Padding direita", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ie_borda_superior", label: "Borda superior", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ie_borda_inferior", label: "Borda inferior", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ie_borda_esquerda", label: "Borda esquerda", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ie_borda_direita", label: "Borda direita", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },

    // ── Formulário de Parâmetros (:nome do SQL) ──
    { key: "relatorio_parametro.nr_sequencia", label: "Sequência", tipo: "Relatórios > Parâmetros", colecao: "relatorio_parametro" },
    { key: "relatorio_parametro.ds_parametro", label: "Descrição do parâmetro", tipo: "Relatórios > Parâmetros", colecao: "relatorio_parametro" },
    { key: "relatorio_parametro.cd_atributo", label: "Atributo", tipo: "Relatórios > Parâmetros", colecao: "relatorio_parametro" },
    { key: "relatorio_parametro.ds_label", label: "Label", tipo: "Relatórios > Parâmetros", colecao: "relatorio_parametro" },
    { key: "relatorio_parametro.nr_ordem", label: "Ordem", tipo: "Relatórios > Parâmetros", colecao: "relatorio_parametro" },
    { key: "relatorio_parametro.vl_padrao", label: "Valor padrão", tipo: "Relatórios > Parâmetros", colecao: "relatorio_parametro" },
    { key: "relatorio_parametro.ie_status", label: "Status", tipo: "Relatórios > Parâmetros", colecao: "relatorio_parametro" },
    { key: "relatorio_parametro.ie_perguntar", label: "Perguntar", tipo: "Relatórios > Parâmetros", colecao: "relatorio_parametro" },
    { key: "relatorio_parametro.ie_obrigatorio", label: "Obrigatório", tipo: "Relatórios > Parâmetros", colecao: "relatorio_parametro" },
  ],
  estruturaAcademica: [
    // Matrícula, Desligamento, Status e Motivo desligamento não são
    // configuráveis (campos fixos: desabilitados no formulário).
    { key: "aluno.nr_seq_pessoa_fisica", label: "Pessoa física", tipo: "Alunos", colecao: "aluno" },
    { key: "aluno.dt_ingresso", label: "Data de ingresso", tipo: "Alunos", colecao: "aluno" },
    { key: "aluno_responsavel.nr_seq_pessoa_fisica", label: "Pessoa física", tipo: "Alunos > Responsáveis", colecao: "aluno_responsavel" },
    { key: "aluno_responsavel.nr_seq_grau_parentesco", label: "Grau de parentesco", tipo: "Alunos > Responsáveis", colecao: "aluno_responsavel" },
    { key: "modal_aluno_alterar_status.dt_status", label: "Alterar status > Data", tipo: "Alunos", colecao: "modal_aluno_alterar_status" },
    { key: "modal_aluno_alterar_status.ds_status", label: "Alterar status > Motivo", tipo: "Alunos", colecao: "modal_aluno_alterar_status" },
    { key: "modal_colaborador_alterar_status.dt_status", label: "Alterar status > Data", tipo: "Colaboradores", colecao: "modal_colaborador_alterar_status" },
    { key: "modal_colaborador_alterar_status.ds_motivo_status", label: "Alterar status > Motivo", tipo: "Colaboradores", colecao: "modal_colaborador_alterar_status" },
    // Colaboradores: Matrícula, Status, Data do status e Motivo do status são
    // campos fixos (alterados pelas ações do menu de contexto).
    { key: "colaborador.nr_seq_pessoa_fisica", label: "Pessoa física", tipo: "Colaboradores", colecao: "colaborador" },
    { key: "colaborador.nr_seq_pessoa_juridica", label: "Pessoa jurídica", tipo: "Colaboradores", colecao: "colaborador" },
    { key: "colaborador.nr_seq_vinculo_contratual", label: "Vínculo contratual", tipo: "Colaboradores", colecao: "colaborador" },
    { key: "colaborador.nr_seq_cargo", label: "Cargo", tipo: "Colaboradores", colecao: "colaborador" },
    { key: "colaborador.dt_admissao", label: "Data de admissão", tipo: "Colaboradores", colecao: "colaborador" },
    { key: "colaborador.ie_coordenador", label: "Coordenador", tipo: "Colaboradores", colecao: "colaborador" },
    { key: "colaborador.ie_professor", label: "Professor", tipo: "Colaboradores", colecao: "colaborador" },
    { key: "colaborador.ie_fornecedor", label: "Fornecedor", tipo: "Colaboradores", colecao: "colaborador" },
    { key: "colaborador.ie_prestador_servico", label: "Prestador de serviço", tipo: "Colaboradores", colecao: "colaborador" },
    { key: "curso.ds_curso", label: "Descrição", tipo: "Cursos", colecao: "curso" },
    { key: "curso.ie_status", label: "Status", tipo: "Cursos", colecao: "curso" },
    { key: "curso.ds_observacao", label: "Observação", tipo: "Cursos", colecao: "curso" },
    { key: "disciplina.ds_disciplina", label: "Descrição", tipo: "Disciplinas", colecao: "disciplina" },
    { key: "disciplina.ds_observacao", label: "Observação", tipo: "Disciplinas", colecao: "disciplina" },
    { key: "turma.ds_turma", label: "Descrição", tipo: "Turmas", colecao: "turma" },
    { key: "turma.nr_seq_curso", label: "Curso", tipo: "Turmas", colecao: "turma" },
    { key: "turma.nr_seq_periodo_letivo", label: "Período letivo", tipo: "Turmas", colecao: "turma" },
    { key: "turma.qt_max_alunos", label: "Máximo de alunos", tipo: "Turmas", colecao: "turma" },
    { key: "turma.nr_seq_localizacao", label: "Localização", tipo: "Turmas", colecao: "turma" },
    { key: "turma.nr_seq_modalidade_ensino", label: "Modalidade de ensino", tipo: "Turmas", colecao: "turma" },
    { key: "turma_disciplina.nr_seq_turma", label: "Turma", tipo: "Turmas x Disciplinas", colecao: "turma_disciplina" },
    { key: "turma_disciplina.nr_seq_disciplina", label: "Disciplina", tipo: "Turmas x Disciplinas", colecao: "turma_disciplina" },
    { key: "turma_disciplina.ie_status", label: "Status", tipo: "Turmas x Disciplinas", colecao: "turma_disciplina" },
    { key: "periodo_letivo.nr_ano", label: "Ano", tipo: "Período letivo", colecao: "periodo_letivo" },
    { key: "periodo_letivo.ds_periodo_letivo", label: "Descrição", tipo: "Período letivo", colecao: "periodo_letivo" },
    { key: "periodo_letivo.qt_dias_letivos", label: "Dias letivos", tipo: "Período letivo", colecao: "periodo_letivo" },
    { key: "periodo_letivo.dt_inicio", label: "Data de início", tipo: "Período letivo", colecao: "periodo_letivo" },
    { key: "periodo_letivo.dt_previsao_termino", label: "Previsão de término", tipo: "Período letivo", colecao: "periodo_letivo" },
    { key: "periodo_letivo.ie_status", label: "Status", tipo: "Período letivo", colecao: "periodo_letivo" },
    // Feriados do período letivo (Sequência é preenchida pelo sistema).
    { key: "periodo_letivo_feriado.dt_feriado", label: "Data", tipo: "Período letivo > Feriados", colecao: "periodo_letivo_feriado" },
    { key: "periodo_letivo_feriado.ds_feriado", label: "Descrição", tipo: "Período letivo > Feriados", colecao: "periodo_letivo_feriado" },
    { key: "periodo_letivo_feriado.ie_tipo_feriado", label: "Tipo", tipo: "Período letivo > Feriados", colecao: "periodo_letivo_feriado" },
  ],
  controleCopias: [
    // Status: escolhido só no cadastro. Data do status e Motivo status são fixos (menu de contexto).
    { key: "copia.ie_status", label: "Status", tipo: "Cópias", colecao: "copia" },
    { key: "copia.dt_recebimento", label: "Data do recebimento", tipo: "Cópias", colecao: "copia" },
    { key: "copia.dt_impressao", label: "Data da impressão", tipo: "Cópias", colecao: "copia" },
    { key: "copia.dt_entrega", label: "Data da entrega", tipo: "Cópias", colecao: "copia" },
    { key: "modal_copia_alterar_status.dt_status", label: "Alterar status > Data", tipo: "Cópias", colecao: "modal_copia_alterar_status" },
    { key: "modal_copia_alterar_status.ds_motivo_status", label: "Alterar status > Motivo", tipo: "Cópias", colecao: "modal_copia_alterar_status" },
    { key: "copia.nr_seq_solicitante", label: "Solicitante", tipo: "Cópias", colecao: "copia" },
    { key: "copia.nr_seq_turma_disciplina", label: "Turma x Disciplina", tipo: "Cópias", colecao: "copia" },
    { key: "copia.qt_copias", label: "Cópias", tipo: "Cópias", colecao: "copia" },
    { key: "copia.qt_folhas", label: "Folhas", tipo: "Cópias", colecao: "copia" },
    { key: "copia.ie_frente_verso", label: "Frente e verso", tipo: "Cópias", colecao: "copia" },
    { key: "copia.ie_grampear", label: "Grampear", tipo: "Cópias", colecao: "copia" },
    { key: "copia.ie_guilhotinar", label: "Guilhotinar", tipo: "Cópias", colecao: "copia" },
    { key: "copia.nr_seq_formato_papel", label: "Formato do papel", tipo: "Cópias", colecao: "copia" },
    { key: "copia.nr_seq_tipo_papel", label: "Tipo de papel", tipo: "Cópias", colecao: "copia" },
    { key: "copia.ie_arquivo", label: "Arquivo", tipo: "Cópias", colecao: "copia" },
  ],
};

/**
 * Histórico do status de um campo em um perfil (menu de contexto "Auditoria" em
 * Campos x Formulários/Modais). O status fica dentro de perfil.config_campos, então a
 * auditoria vem dos logs do perfil: entra cada log em que o status do campo mudou em
 * relação ao log anterior. O primeiro vira a criação ("create"), os demais alterações.
 * Recebe e devolve os logs do mais recente para o mais antigo; `detalhes` passa a ter
 * só o campo (ds_campo) e o status (ie_status_campo).
 */
export function auditoriaDoCampo<T extends { acao?: string; detalhes?: unknown }>(logs: T[], chave: string, rotulo: string): T[] {
  const statusDoLog = (log: T): CampoStatus | undefined => {
    const detalhes = log.detalhes as { config_campos?: unknown } | undefined;
    const bruto = detalhes?.config_campos;
    if (bruto === undefined || bruto === null) return undefined;
    return parseCamposConfig(typeof bruto === "string" ? bruto : JSON.stringify(bruto))[chave];
  };
  const resultado: T[] = [];
  let anterior: CampoStatus | undefined;
  for (const log of [...logs].reverse()) {
    const status = statusDoLog(log);
    if (status === undefined || status === anterior) continue;
    resultado.push({
      ...log,
      acao: resultado.length === 0 ? "create" : "update",
      detalhes: { ds_campo: rotulo, ie_status_campo: status },
    });
    anterior = status;
  }
  return resultado.reverse();
}
