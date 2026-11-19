/** Turma x Disciplina (Estrutura Acadêmica > Turmas x Disciplinas). */
export interface TurmaDisciplina {
  id?: string;
  nr_sequencia: number;
  nr_seq_turma?: number;
  nr_seq_disciplina?: number;
  ie_status?: string;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
