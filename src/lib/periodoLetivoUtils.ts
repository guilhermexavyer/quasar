import type { PeriodoLetivo } from "@/types/periodoLetivo";
import { formatDate } from "@/lib/pessoaFisicaUtils";

export { formatDate, applyDateMask } from "@/lib/pessoaFisicaUtils";

export interface ColDef {
  key: keyof PeriodoLetivo;
  label: string;
  headerLabel?: string;
  dataClass?: string;
  headerClass?: string;
}

export const PERIODO_LETIVO_COLUMNS: ColDef[] = [
  { key: 'nr_sequencia', label: '#', dataClass: 'text-right' },
  { key: 'nr_ano', label: 'Ano', dataClass: 'text-right' },
  { key: 'ds_periodo_letivo', label: 'Descrição', dataClass: 'text-black' },
  { key: 'qt_dias_letivos', label: 'Dias letivos', dataClass: 'text-right' },
  { key: 'dt_inicio', label: 'Data de início' },
  { key: 'dt_previsao_termino', label: 'Previsão de término' },
  { key: 'dt_termino', label: 'Data de término' },
  { key: 'dt_reativacao', label: 'Data de reativação' },
  { key: 'ie_status', label: '', dataClass: 'text-center' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
  { key: 'ds_usuario_criacao', label: 'Usuário criação' },
  { key: 'ds_usuario_alteracao', label: 'Usuário alteração' },
];

export const FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'periodo_letivo' },
  nr_ano: { type: 'int64', field: 'nr_ano', collection: 'periodo_letivo' },
  ds_periodo_letivo: { type: 'string', field: 'ds_periodo_letivo', collection: 'periodo_letivo' },
  qt_dias_letivos: { type: 'int64', field: 'qt_dias_letivos', collection: 'periodo_letivo' },
  dt_inicio: { type: 'string', field: 'dt_inicio', collection: 'periodo_letivo' },
  dt_previsao_termino: { type: 'string', field: 'dt_previsao_termino', collection: 'periodo_letivo' },
  dt_termino: { type: 'string', field: 'dt_termino', collection: 'periodo_letivo' },
  dt_reativacao: { type: 'string', field: 'dt_reativacao', collection: 'periodo_letivo' },
  ie_status: { type: 'string', field: 'ie_status', collection: 'periodo_letivo' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'periodo_letivo' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'periodo_letivo' },
} as const;

export const FIELD_LABELS: Record<string, string> = {
  nr_sequencia: 'Sequência',
  nr_ano: 'Ano',
  ds_periodo_letivo: 'Descrição',
  qt_dias_letivos: 'Dias letivos',
  dt_inicio: 'Data de início',
  dt_previsao_termino: 'Previsão de término',
  dt_termino: 'Data de término',
  dt_reativacao: 'Data de reativação',
  ie_status: 'Status',
  dt_criacao: 'Criação',
  dt_alteracao: 'Alteração',
};

/** Status possíveis do período letivo (dropdown Status). */
export const STATUS_PERIODO_LETIVO_OPTIONS = [
  { value: 'A', label: 'Em andamento' },
  { value: 'E', label: 'Encerrado' },
];

/**
 * Cores padrão da bolinha de status (coluna Status da lista), usadas enquanto
 * a cor não for configurada em Estrutura Acadêmica > Parâmetros.
 */
export const CORES_STATUS_PERIODO_LETIVO_PADRAO: Record<'A' | 'E', string> = {
  A: '#2cc958',
  E: '#999999',
};

export function formatCellValue(key: keyof PeriodoLetivo, value: unknown): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (!stringValue) return '';

  switch (key) {
    case 'dt_inicio':
    case 'dt_previsao_termino':
    case 'dt_termino':
    case 'dt_reativacao':
    case 'dt_criacao':
    case 'dt_alteracao':
      return formatDate(stringValue);
    case 'ie_status':
      return STATUS_PERIODO_LETIVO_OPTIONS.find((o) => o.value === stringValue)?.label ?? '';
    default:
      return stringValue;
  }
}
