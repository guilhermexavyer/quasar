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
  /** Número de série. */
  nr_serie?: string;
  /** QR Code. */
  ds_qr_code?: string;
  /** Código de barras. */
  ds_codigo_barras?: string;
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
  /** Responsáveis (Pessoa física). */
  responsaveis?: { nr_seq_responsavel?: number }[];
  /** Observação. */
  ds_observacao?: string;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
