/** Período letivo (Estrutura Acadêmica > Período letivo). */
export interface PeriodoLetivo {
  id?: string;
  nr_sequencia: number;
  nr_ano?: number;
  ds_periodo_letivo: string;
  qt_dias_letivos?: number;
  dt_inicio?: string;
  dt_previsao_termino?: string;
  dt_termino?: string;
  /** Data da última reativação (menu de contexto "Reativar"). */
  dt_reativacao?: string;
  /** Status: 'A' (Em andamento) / 'E' (Encerrado). */
  ie_status?: string;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
