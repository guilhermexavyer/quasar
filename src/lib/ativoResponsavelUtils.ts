export const COLECAO_ATIVO_RESPONSAVEL = 'ativo_responsavel';

export const FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: COLECAO_ATIVO_RESPONSAVEL },
  nr_seq_ativo: { type: 'int64', field: 'nr_seq_ativo', collection: COLECAO_ATIVO_RESPONSAVEL },
  nr_seq_colaborador: { type: 'int64', field: 'nr_seq_colaborador', collection: COLECAO_ATIVO_RESPONSAVEL },
  nr_seq_equipe: { type: 'int64', field: 'nr_seq_equipe', collection: COLECAO_ATIVO_RESPONSAVEL },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: COLECAO_ATIVO_RESPONSAVEL },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: COLECAO_ATIVO_RESPONSAVEL },
} as const;
