/**
 * Tabelas que perderam o prefixo da função no nome (migração 0046): cg_sexo → sexo,
 * pat_ativo → ativo; os parâmetros seguem <tabela>_param_<descrição> (cc_param_cor_copia_aguardando
 * → copia_param_cor_aguardando, pr_param_matricula_aluno → aluno_param_matricula...).
 *
 * O banco já foi atualizado pela migração (inclusive o SQL dos relatórios gravados). Isto
 * serve para o que chega de fora com os nomes antigos — relatórios exportados antes da
 * mudança: o SQL do arquivo é trazido para os nomes novos ao importar.
 */
export const TABELAS_RENOMEADAS: Readonly<Record<string, string>> = {
  as_param_redefinir_senha_primeiro_login: "usuario_param_redefinir_senha_primeiro_login",
  cc_param_cor_copia_aguardando: "copia_param_cor_aguardando",
  cc_param_cor_copia_cancelado: "copia_param_cor_cancelado",
  cc_param_cor_copia_entregue: "copia_param_cor_entregue",
  cc_param_cor_copia_impresso: "copia_param_cor_impresso",
  cc_param_data_recebimento_automatica: "copia_param_data_recebimento_automatica",
  cc_param_formato_papel_padrao: "copia_param_formato_papel_padrao",
  cc_param_tipo_papel_padrao: "copia_param_tipo_papel_padrao",
  cc_param_tipos_arquivo_copia: "copia_param_tipos_arquivo",
  cg_cargo: "cargo",
  cg_combustivel: "combustivel",
  cg_cor_raca: "cor_raca",
  cg_estado_civil: "estado_civil",
  cg_formato_papel: "formato_papel",
  cg_grau_parentesco: "grau_parentesco",
  cg_localizacao: "localizacao",
  cg_logradouro: "logradouro",
  cg_marca: "marca",
  cg_modalidade_ensino: "modalidade_ensino",
  cg_orgao_emissor: "orgao_emissor",
  cg_profissao: "profissao",
  cg_sexo: "sexo",
  cg_sistema_operacional: "sistema_operacional",
  cg_tipo_papel: "tipo_papel",
  cg_vinculo_contratual: "vinculo_contratual",
  ea_param_cor_periodo_letivo_andamento: "periodo_letivo_param_cor_andamento",
  ea_param_cor_periodo_letivo_encerrado: "periodo_letivo_param_cor_encerrado",
  ea_param_encerramento_automatico_periodo_letivo: "periodo_letivo_param_encerramento_automatico",
  pat_ativo: "ativo",
  pat_ativo_responsavel: "ativo_responsavel",
  pat_categoria: "categoria",
  pat_manutencao: "manutencao",
  pat_param_codigo_patrimonio: "ativo_param_codigo_patrimonio",
  pat_param_cor_ativo_descartado: "ativo_param_cor_descartado",
  pat_param_cor_ativo_estoque: "ativo_param_cor_estoque",
  pat_param_cor_ativo_manutencao: "ativo_param_cor_manutencao",
  pat_param_cor_ativo_operacional: "ativo_param_cor_operacional",
  pat_param_cor_manutencao_andamento: "manutencao_param_cor_andamento",
  pat_param_cor_manutencao_cancelada: "manutencao_param_cor_cancelada",
  pat_param_cor_manutencao_concluida: "manutencao_param_cor_concluida",
  pr_param_matricula_aluno: "aluno_param_matricula",
  pr_param_matricula_colaborador: "colaborador_param_matricula",
};

const NOMES_ANTIGOS = new RegExp(
  `(?<![A-Za-z0-9_])(${Object.keys(TABELAS_RENOMEADAS).sort((a, b) => b.length - a.length).join("|")})(?![A-Za-z0-9_])`,
  "gi"
);

/**
 * Administração do Sistema: regra → regra_sistema, auditoria → log_auditoria, exclusao →
 * log_exclusao. São palavras comuns (ie_regra_N, a coluna regra da auditoria), então no SQL
 * só são trocadas como tabela: logo depois de from/join/into/update.
 */
export const TABELAS_SISTEMA_RENOMEADAS: Readonly<Record<string, string>> = {
  regra: "regra_sistema",
  auditoria: "log_auditoria",
  exclusao: "log_exclusao",
};

const NOMES_SISTEMA_ANTIGOS = new RegExp(
  `(?<![A-Za-z0-9_])(from|join|into|update)(\\s+)(${Object.keys(TABELAS_SISTEMA_RENOMEADAS).join("|")})(?![A-Za-z0-9_])`,
  "gi"
);

/** Troca, no texto (ex.: SQL), os nomes antigos das tabelas pelos novos — só o nome inteiro. */
export function atualizarNomesDeTabelas(texto: string): string {
  return texto
    .replace(NOMES_ANTIGOS, (antigo) => TABELAS_RENOMEADAS[antigo.toLowerCase()] ?? antigo)
    .replace(NOMES_SISTEMA_ANTIGOS, (m, palavra: string, espaco: string, antigo: string) =>
      `${palavra}${espaco}${TABELAS_SISTEMA_RENOMEADAS[antigo.toLowerCase()] ?? antigo}`);
}
