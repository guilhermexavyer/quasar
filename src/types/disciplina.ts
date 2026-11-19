/** Disciplina (Estrutura Acadêmica > Disciplinas). */
export interface Disciplina {
  id?: string;
  nr_sequencia: number;
  ds_disciplina: string;
  ds_observacao?: string;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
