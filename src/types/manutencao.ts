/** Manutenção de ativo (Patrimônio > Manutenções). */
export interface Manutencao {
  id?: string;
  nr_sequencia: number;
  /** Ativo vinculado (nr_sequencia do ativo). */
  nr_seq_ativo?: number;
  /** Data do envio para manutenção. */
  dt_envio?: string;
  /** Data de retorno da manutenção. */
  dt_retorno?: string;
  /** Pessoa física (prestador de serviço) vinculada. */
  nr_seq_pessoa_fisica?: number;
  /** Valor total da manutenção. */
  vl_total?: number;
  /** Observação. */
  ds_observacao?: string;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
