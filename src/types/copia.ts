/** Cópia (Controle de Cópias > Cópias): registro de uma cópia feita pelo departamento de Xerox. */
export interface Copia {
  id?: string;
  nr_sequencia: number;
  /** Datas do pedido (DD/MM/AAAA). */
  dt_recebimento?: string;
  dt_impressao?: string;
  dt_entrega?: string;
  /** Status: Aguardando (A), Cancelado (C), Entregue (E), Impresso (I). */
  ie_status?: string;
  /** Data e motivo da última alteração de status (menu de contexto "Alterar status"). */
  dt_status?: string;
  ds_motivo_status?: string;
  /** Colaborador que solicitou a cópia. */
  nr_seq_solicitante?: number;
  /** Turma x Disciplina (Estrutura Acadêmica) da atividade. */
  nr_seq_turma_disciplina?: number;
  /** Quantidade de cópias. */
  qt_copias?: number;
  /** Quantidade de folhas (do original). */
  qt_folhas?: number;
  /** Frente e verso (S/N). */
  ie_frente_verso?: string;
  /** Grampear (S/N). */
  ie_grampear?: string;
  /** Guilhotinar (S/N). */
  ie_guilhotinar?: string;
  /** Formato do papel (Cadastros Gerais > Formato do papel). */
  nr_seq_formato_papel?: number;
  /** Tipo de papel (Cadastros Gerais > Tipo de papel). */
  nr_seq_tipo_papel?: number;
  /** Caminho do arquivo no bucket "copias" (arquivos/<uuid>/<nome>). */
  ie_arquivo?: string;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
