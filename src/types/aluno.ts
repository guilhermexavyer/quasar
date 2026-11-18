/**
 * Formato antigo de um responsável, quando ficavam dentro do aluno (lista
 * responsaveis). Hoje ficam em aluno_responsavel; este tipo só serve para
 * exibir o histórico de auditoria gravado antes da mudança.
 */
export interface AlunoResponsavelLegado {
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
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
