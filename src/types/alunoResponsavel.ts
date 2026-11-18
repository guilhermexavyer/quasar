/** Responsável de um aluno (Estrutura Acadêmica > Alunos > Responsáveis). */
export interface AlunoResponsavel {
  id?: string;
  nr_sequencia: number;
  /** Aluno ao qual o responsável pertence (nr_sequencia do aluno). */
  nr_seq_aluno: number;
  /** Pessoa física responsável. */
  nr_seq_pessoa_fisica?: number;
  /** Grau de parentesco do responsável com o aluno. */
  nr_seq_grau_parentesco?: number;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
