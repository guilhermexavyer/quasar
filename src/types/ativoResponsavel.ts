/** Responsável de um ativo (Patrimônio > Ativos > Responsáveis). */
export interface AtivoResponsavel {
  id?: string;
  nr_sequencia: number;
  /** Ativo ao qual o responsável pertence (nr_sequencia do ativo). */
  nr_seq_ativo: number;
  /** Colaborador responsável (nr_sequencia do colaborador: pessoa física ou jurídica) — ou a equipe. */
  nr_seq_colaborador?: number;
  /** Equipe responsável (Pessoas e Relacionamentos > Equipes) — ou o colaborador: só um dos dois. */
  nr_seq_equipe?: number;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
