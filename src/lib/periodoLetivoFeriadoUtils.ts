export const COLECAO_PERIODO_LETIVO_FERIADO = 'periodo_letivo_feriado';

export const FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: COLECAO_PERIODO_LETIVO_FERIADO },
  nr_seq_periodo_letivo: { type: 'int64', field: 'nr_seq_periodo_letivo', collection: COLECAO_PERIODO_LETIVO_FERIADO },
  dt_feriado: { type: 'string', field: 'dt_feriado', collection: COLECAO_PERIODO_LETIVO_FERIADO },
  ds_feriado: { type: 'string', field: 'ds_feriado', collection: COLECAO_PERIODO_LETIVO_FERIADO },
  ie_tipo_feriado: { type: 'string', field: 'ie_tipo_feriado', collection: COLECAO_PERIODO_LETIVO_FERIADO },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: COLECAO_PERIODO_LETIVO_FERIADO },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: COLECAO_PERIODO_LETIVO_FERIADO },
} as const;

/** Tipos de feriado (dropdown Tipo). */
export const TIPO_FERIADO_OPTIONS = [
  { value: 'E', label: 'Estadual' },
  { value: 'F', label: 'Federal' },
  { value: 'M', label: 'Municipal' },
];

export function rotuloTipoFeriado(valor?: string | null): string {
  return TIPO_FERIADO_OPTIONS.find((o) => o.value === valor)?.label ?? '';
}
