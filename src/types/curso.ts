/** Curso (Estrutura Acadêmica > Cursos): fases escolares, como Educação Infantil e Ensino Médio. */
export interface Curso {
  id?: string;
  nr_sequencia: number;
  ds_curso: string;
  ds_observacao?: string;
  /** Status: 'A' (Ativo) / 'I' (Inativo). */
  ie_status?: string;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
