/** Ativo patrimonial (Patrimônio > Ativos). */
export interface Ativo {
  id?: string;
  nr_sequencia: number;
  /** Patrimônio (código do bem). */
  cd_patrimonio?: string;
  /** Descrição do ativo. */
  ds_ativo?: string;
  /** Categoria (Cadastros Gerais > Categoria (ativo)). */
  nr_seq_categoria?: number;
  /** Localização (Cadastros Gerais > Localização). */
  nr_seq_localizacao?: number;
  /** Marca (Cadastros Gerais > Marca). */
  nr_seq_marca?: number;
  /** Modelo. */
  ds_modelo?: string;
  /** QR Code. */
  ds_qr_code?: string;
  /** Código de barras. */
  ds_codigo_barras?: string;
  /** Status: D (Descartado), E (Estoque), M (Manutenção), O (Operando). */
  ie_status?: string;
  /** Observação. */
  ds_observacao?: string;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
