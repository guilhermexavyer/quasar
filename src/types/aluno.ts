/** Um responsável do aluno (seção Responsáveis). */
export interface AlunoResponsavel {
  /** Pessoa física responsável. */
  nr_seq_responsavel?: number;
  /** Grau de parentesco do responsável. */
  nr_seq_grau_parentesco?: number;
}

export interface Aluno {
  id?: string;
  nr_sequencia: number;
  /** Pessoa física vinculada (Identificação). */
  nr_seq_pessoa_fisica?: number;
  nr_matricula: string;
  dt_ingresso: string;
  dt_status?: string;
  ds_status?: string;
  ie_status?: string;
  /** Responsáveis do aluno (seção Responsáveis). */
  responsaveis?: AlunoResponsavel[];
  /** Tipo sanguíneo (seção Informações médicas) — dropdown. */
  ds_tipo_sanguineo?: string;
  /** Informações médicas (seção Informações médicas) — listas de valores. */
  ds_alergia?: string[];
  ds_medicamento_continuo?: string[];
  ds_restricao_alimentar?: string[];
  ds_necessidade_especial?: string[];
  /** Observações médicas — campo único (sem lista). */
  ds_observacao_medica?: string;
  /* Campos legados (pré-responsaveis): lidos na migração para o array. */
  nr_seq_responsavel?: number;
  nr_seq_grau_parentesco?: number;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
