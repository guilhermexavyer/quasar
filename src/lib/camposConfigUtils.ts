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
    { key: "pessoa_fisica.nr_cep", label: "CEP", tipo: "Pessoas Físicas", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.ds_endereco", label: "Rua", tipo: "Pessoas Físicas", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.nr_seq_logradouro", label: "Logradouro", tipo: "Pessoas Físicas", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.nr_endereco", label: "Número", tipo: "Pessoas Físicas", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.ds_bairro", label: "Bairro", tipo: "Pessoas Físicas", colecao: "pessoa_fisica" },
    { key: "pessoa_fisica.ds_complemento", label: "Complemento", tipo: "Pessoas Físicas", colecao: "pessoa_fisica" },

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

    { key: "perfil.ds_perfil", label: "Perfil", tipo: "Perfis", colecao: "perfil" },
    { key: "perfil.ds_observacao", label: "Observação", tipo: "Perfis", colecao: "perfil" },

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

    { key: "cg_marca.ds_marca", label: "Descrição", tipo: "Marca", colecao: "cg_marca" },

    { key: "cg_categoria_ativo.ds_categoria", label: "Descrição", tipo: "Categoria (ativo)", colecao: "cg_categoria_ativo" },
    { key: "cg_categoria_ativo.ds_observacao", label: "Observação", tipo: "Categoria (ativo)", colecao: "cg_categoria_ativo" },
    { key: "cg_grau_parentesco.ds_grau_parentesco", label: "Descrição", tipo: "Grau de parentesco", colecao: "cg_grau_parentesco" },
    { key: "cg_localizacao.ds_localizacao", label: "Descrição", tipo: "Localização", colecao: "cg_localizacao" },
    { key: "cg_cargo.ds_cargo", label: "Descrição", tipo: "Cargo", colecao: "cg_cargo" },
    { key: "cg_vinculo_contratual.ds_vinculo_contratual", label: "Descrição", tipo: "Vínculo contratual", colecao: "cg_vinculo_contratual" },
  ],
  patrimonio: [
    { key: "pat_ativo.ds_ativo", label: "Descrição", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.nr_seq_categoria", label: "Categoria", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.nr_seq_localizacao", label: "Localização", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.nr_seq_marca", label: "Marca", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.ds_modelo", label: "Modelo", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.nr_serie", label: "Número de série", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.ds_qr_code", label: "QR Code", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.ds_codigo_barras", label: "Código de barras", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.dt_aquisicao", label: "Data de aquisição", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.dt_garantia", label: "Data de garantia", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.dt_ultima_manutencao", label: "Última manutenção", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.dt_status", label: "Data do status", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.ds_motivo_status", label: "Motivo do status", tipo: "Ativos", colecao: "pat_ativo" },

    { key: "pat_ativo.ds_processador", label: "Processador", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.qt_ram", label: "Memória RAM", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.ie_ram", label: "Unidade (RAM)", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.qt_armazenamento", label: "Armazenamento", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.ie_armazenamento", label: "Unidade", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.ds_endereco_mac", label: "Endereço MAC", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.ds_ip", label: "IPv4", tipo: "Ativos", colecao: "pat_ativo" },
    { key: "pat_ativo.nr_seq_sistema_operacional", label: "Sistema operacional", tipo: "Ativos", colecao: "pat_ativo" },

    { key: "pat_ativo.ds_observacao", label: "Observação", tipo: "Ativos", colecao: "pat_ativo" },

    // Manutenções
    // Ativo, Prestador, Data de envio e Valor total são campos fixos (sempre desabilitados).
    { key: "pat_manutencao.dt_termino", label: "Data de término", tipo: "Manutenções", colecao: "pat_manutencao" },
    { key: "pat_manutencao.ds_motivo_manutencao", label: "Motivo da manutenção", tipo: "Manutenções", colecao: "pat_manutencao" },
    { key: "pat_manutencao.ds_correcoes", label: "Correções", tipo: "Manutenções", colecao: "pat_manutencao" },
    { key: "pat_manutencao.ds_observacao", label: "Observação", tipo: "Manutenções", colecao: "pat_manutencao" },
  ],
  relatorio: [
    // ── Formulário do Relatório ──
    { key: "relatorio.nr_sequencia", label: "Sequência", tipo: "Relatórios", colecao: "relatorio" },
    { key: "relatorio.ds_relatorio", label: "Descrição", tipo: "Relatórios", colecao: "relatorio" },
    { key: "relatorio.ie_formato", label: "Formato", tipo: "Relatórios", colecao: "relatorio" },
    { key: "relatorio.ds_nome_arquivo", label: "Nome do arquivo", tipo: "Relatórios", colecao: "relatorio" },
    { key: "relatorio.ie_pagina", label: "Página", tipo: "Relatórios", colecao: "relatorio" },
    { key: "relatorio.ie_orientacao", label: "Orientação", tipo: "Relatórios", colecao: "relatorio" },
    { key: "relatorio.ie_borda", label: "Borda", tipo: "Relatórios", colecao: "relatorio" },
    { key: "relatorio.nr_margem_superior", label: "Margem superior", tipo: "Relatórios", colecao: "relatorio" },
    { key: "relatorio.nr_margem_inferior", label: "Margem inferior", tipo: "Relatórios", colecao: "relatorio" },
    { key: "relatorio.nr_margem_esquerda", label: "Margem esquerda", tipo: "Relatórios", colecao: "relatorio" },
    { key: "relatorio.nr_margem_direita", label: "Margem direita", tipo: "Relatórios", colecao: "relatorio" },

    // ── Formulário de Bandas ──
    { key: "relatorio_banda.nr_sequencia", label: "Sequência", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.ds_banda", label: "Descrição", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.ie_tipo_banda", label: "Tipo", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.ie_colecao_principal", label: "Coleção principal", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.nr_posicao", label: "Posição", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.nr_altura", label: "Altura", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.ie_borda_superior", label: "Borda superior", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.ie_borda_inferior", label: "Borda inferior", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.ie_borda_esquerda", label: "Borda esquerda", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.ie_borda_direita", label: "Borda direita", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.espessuraLabel", label: "Espessura label", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.topoLabel", label: "Topo label", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.espessuraCampo", label: "Espessura registro", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.topoRegistro", label: "Topo registro", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.bgLabel", label: "Background label", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.bgCampo", label: "Background registro", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.corLabelGlobal", label: "Cor label", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.corCampoGlobal", label: "Cor registro", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.fonteLabel", label: "Fonte label", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.tamanhoFonteLabel", label: "Tamanho fonte label", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.fonteCampo", label: "Fonte registro", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },
    { key: "relatorio_banda.tamanhoFonteCampo", label: "Tamanho fonte registro", tipo: "Relatórios > Bandas", colecao: "relatorio_banda" },

    // ── Formulário de Parâmetros ──
    { key: "relatorio_parametro.nr_sequencia", label: "Sequência", tipo: "Relatórios > Parâmetros", colecao: "relatorio_parametro" },
    { key: "relatorio_parametro.ie_colecao", label: "Coleção", tipo: "Relatórios > Parâmetros", colecao: "relatorio_parametro" },
    { key: "relatorio_parametro.ie_campo", label: "Campo", tipo: "Relatórios > Parâmetros", colecao: "relatorio_parametro" },
    { key: "relatorio_parametro.operador", label: "Operador", tipo: "Relatórios > Parâmetros", colecao: "relatorio_parametro" },
    { key: "relatorio_parametro.ie_mascara", label: "Máscara", tipo: "Relatórios > Parâmetros", colecao: "relatorio_parametro" },
    { key: "relatorio_parametro.vl_padrao", label: "Valor padrão", tipo: "Relatórios > Parâmetros", colecao: "relatorio_parametro" },
    { key: "relatorio_parametro.ie_conector", label: "Conector", tipo: "Relatórios > Parâmetros", colecao: "relatorio_parametro" },
    { key: "relatorio_parametro.ie_parametro", label: "Parâmetro", tipo: "Relatórios > Parâmetros", colecao: "relatorio_parametro" },
    { key: "relatorio_parametro.ds_label", label: "Label", tipo: "Relatórios > Parâmetros", colecao: "relatorio_parametro" },
    { key: "relatorio_parametro.ie_obrigatorio", label: "Obrigatório", tipo: "Relatórios > Parâmetros", colecao: "relatorio_parametro" },

    // ── Formulário de Elementos ──
    { key: "relatorio_banda_elemento.nr_sequencia", label: "Sequência", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ds_elemento", label: "Descrição", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ie_tipo_elemento", label: "Tipo", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ie_colecao", label: "Coleção", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ie_campo", label: "Campo", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.label", label: "Label", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.conteudo", label: "Conteúdo", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ie_fonte", label: "Fonte", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.qt_fonte", label: "Tamanho fonte", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ie_estilo", label: "Estilo", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ie_estilo_label", label: "Estilo label", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ie_estilo_soma", label: "Estilo soma", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.cd_cor", label: "Cor", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.cd_background", label: "Background", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.qt_padding_superior", label: "Padding superior", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.qt_padding_direita", label: "Padding direita", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.qt_padding_inferior", label: "Padding inferior", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.qt_padding_esquerda", label: "Padding esquerda", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ie_borda_superior", label: "Borda superior", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ie_borda_direita", label: "Borda direita", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ie_borda_inferior", label: "Borda inferior", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ie_borda_esquerda", label: "Borda esquerda", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.nr_seq_imagem", label: "Imagem", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.qt_tamanho_imagem", label: "Tamanho imagem", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.qt_largura", label: "Largura", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.qt_esquerda", label: "Esquerda", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.qt_topo", label: "Topo", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.ie_alinhamento", label: "Alinhamento", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },
    { key: "relatorio_banda_elemento.soma", label: "Soma", tipo: "Relatórios > Bandas > Elementos", colecao: "relatorio_banda_elemento" },

    // ── Ordenação (tabela dentro da banda tipo Lista) ──
    { key: "relatorio_banda_ordenacao.nr_sequencia", label: "Sequência", tipo: "Relatórios > Bandas > Ordenação", colecao: "relatorio_banda_ordenacao" },
    { key: "relatorio_banda_ordenacao.campo", label: "Campo", tipo: "Relatórios > Bandas > Ordenação", colecao: "relatorio_banda_ordenacao" },
    { key: "relatorio_banda_ordenacao.direcao", label: "Direção", tipo: "Relatórios > Bandas > Ordenação", colecao: "relatorio_banda_ordenacao" },
  ],
  estruturaAcademica: [
    // Matrícula, Desligamento, Status e Motivo desligamento não são
    // configuráveis (campos fixos: desabilitados no formulário).
    { key: "aluno.nr_seq_pessoa_fisica", label: "Pessoa física", tipo: "Alunos", colecao: "aluno" },
    { key: "aluno.dt_ingresso", label: "Data de ingresso", tipo: "Alunos", colecao: "aluno" },
    { key: "aluno.nr_seq_responsavel", label: "Pessoa física (responsável)", tipo: "Alunos", colecao: "aluno" },
    { key: "aluno.nr_seq_grau_parentesco", label: "Grau de parentesco", tipo: "Alunos", colecao: "aluno" },
    { key: "aluno.ds_tipo_sanguineo", label: "Tipo sanguíneo", tipo: "Alunos", colecao: "aluno" },
    { key: "aluno.ds_alergia", label: "Alergia", tipo: "Alunos", colecao: "aluno" },
    { key: "aluno.ds_medicamento_continuo", label: "Medicamento de uso contínuo", tipo: "Alunos", colecao: "aluno" },
    { key: "aluno.ds_restricao_alimentar", label: "Restrição alimentar", tipo: "Alunos", colecao: "aluno" },
    { key: "aluno.ds_necessidade_especial", label: "Necessidade especial", tipo: "Alunos", colecao: "aluno" },
    { key: "aluno.ds_observacao_medica", label: "Observações médicas", tipo: "Alunos", colecao: "aluno" },
  ],
};
