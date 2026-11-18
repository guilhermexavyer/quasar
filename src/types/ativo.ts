/** Ativo patrimonial (Patrimônio > Ativos). */
export interface Ativo {
  id?: string;
  nr_sequencia: number;
  /** Código externo (código do bem em outro sistema). */
  cd_externo?: string;
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
  /** Número de série. */
  nr_serie?: string;
  /** QR Code. */
  ds_qr_code?: string;
  /** Código de barras. */
  ds_codigo_barras?: string;
  /** Valor de aquisição (formato pt-BR, ex.: 1.234,56). */
  vl_aquisicao?: string;
  /** Data de aquisição. */
  dt_aquisicao?: string;
  /** Data de garantia. */
  dt_garantia?: string;
  /** Status: D (Descartado), E (Estoque), M (Manutenção), O (Operacional). */
  ie_status?: string;
  /** Data do status. */
  dt_status?: string;
  /** Última manutenção. */
  dt_ultima_manutencao?: string;
  /** Nr. sequência da última manutenção. */
  nr_seq_ultima_manutencao?: number;
  /** Motivo do status. */
  ds_motivo_status?: string;
  /** Motivo da última transferência de localização (modal "Transferir"; o histórico fica na auditoria). */
  ds_motivo_transferencia?: string;
  /** Processador. */
  ds_processador?: string;
  /** Memória RAM. */
  qt_ram?: number;
  /** Unidade de RAM: KB, MB, GB, TB. */
  ie_ram?: string;
  /** Armazenamento. */
  qt_armazenamento?: number;
  /** Unidade de armazenamento: KB, MB, GB, TB. */
  ie_armazenamento?: string;
  /** Endereço MAC. */
  ds_endereco_mac?: string;
  /** IP. */
  ds_ip?: string;
  /** Sistema operacional (Cadastros Gerais > Sistema operacional). */
  nr_seq_sistema_operacional?: number;
  /** Veículo: placa. */
  cd_placa?: string;
  /** Veículo: Renavam. */
  cd_renavam?: string;
  /** Veículo: ano. */
  nr_ano?: number;
  /** Veículo: cor. */
  ds_cor?: string;
  /** Veículo: combustível (Cadastros Gerais > Combustível). */
  nr_seq_combustivel?: number;
  /**
   * @deprecated Os responsáveis ficam em pat_ativo_responsavel (duplo clique no ativo).
   * Mantido só para ler documentos antigos ainda não migrados
   * (scripts/migrar-responsaveis-ativo.mjs).
   */
  responsaveis?: { nr_seq_responsavel?: number }[];
  /** Observação. */
  ds_observacao?: string;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
