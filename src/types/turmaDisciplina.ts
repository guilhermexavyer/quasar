/** Turma x Disciplina (Estrutura Acadêmica > Turmas x Disciplinas). */
export interface TurmaDisciplina {
  id?: string;
  nr_sequencia: number;
  nr_seq_turma?: number;
  nr_seq_disciplina?: number;
  ie_status?: string;
  /*
   * Vêm da turma (nr_seq_turma), não de turma_disciplina: preenchidos só na tela
   * (lista e formulário), para exibição. Nunca são gravados.
   */
  nr_seq_periodo_letivo?: number;
  nr_seq_curso?: number;
  nr_seq_modalidade_ensino?: number;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
