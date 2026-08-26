/** Manutenção de ativo (Patrimônio > Manutenções). */
export interface Manutencao {
  id?: string;
  nr_sequencia: number;
  /** Ativo vinculado (nr_sequencia do ativo). */
  nr_seq_ativo?: number;
  /** Data do envio para manutenção. */
  dt_envio?: string;
  /** Data de término da manutenção. */
  dt_termino?: string;
  /** Prestador de serviço vinculado. */
  nr_seq_prestador_servico?: number;
  /** @deprecated Campo antigo no banco. Usar nr_seq_prestador_servico. */
  nr_seq_pessoa_fisica?: number;
  /** Valor total da manutenção. */
  vl_total?: number;
  /** Observação. */
  ds_observacao?: string;
  /** Motivo da manutenção. */
  ds_motivo_manutencao?: string;
  /** Correções realizadas. */
  ds_correcoes?: string;
  /** Status da manutenção (E=Em andamento, CO=Concluída, CA=Cancelada). */
  ie_status_manutencao?: string;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
