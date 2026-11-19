/** Turma (Estrutura Acadêmica > Turmas). */
export interface Turma {
  id?: string;
  nr_sequencia: number;
  ds_turma: string;
  nr_seq_curso?: number;
  nr_seq_periodo_letivo?: number;
  qt_max_alunos?: number;
  nr_seq_localizacao?: number;
  nr_seq_modalidade_ensino?: number;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
