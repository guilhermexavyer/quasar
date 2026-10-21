/** Feriado de um período letivo (Estrutura Acadêmica > Período letivo > Feriados). */
export interface PeriodoLetivoFeriado {
  id?: string;
  nr_sequencia: number;
  /** Período letivo ao qual o feriado pertence (nr_sequencia do período). */
  nr_seq_periodo_letivo: number;
  /** Data do feriado (DD/MM/AAAA). */
  dt_feriado?: string;
  ds_feriado?: string;
  /** Tipo: 'M' (Municipal) / 'E' (Estadual) / 'F' (Federal). */
  ie_tipo_feriado?: string;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
