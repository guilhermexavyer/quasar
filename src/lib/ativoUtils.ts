import type { Ativo } from "@/types/ativo";
import { formatDate } from "@/lib/pessoaFisicaUtils";

export { formatDate, applyDateMask } from "@/lib/pessoaFisicaUtils";

export interface ColDef {
  key: keyof Ativo;
  label: string;
  headerLabel?: string;
  dataClass?: string;
  headerClass?: string;
}

export const ATIVO_COLUMNS: ColDef[] = [
  { key: 'nr_sequencia', label: '#', dataClass: 'text-center' },
  { key: 'cd_patrimonio', label: 'Patrimônio' },
  { key: 'ds_ativo', label: 'Descrição' },
  { key: 'nr_seq_categoria', label: 'Categoria' },
  { key: 'nr_seq_localizacao', label: 'Localização' },
  { key: 'nr_seq_marca', label: 'Marca' },
  { key: 'ds_modelo', label: 'Modelo' },
  { key: 'ds_qr_code', label: 'QR Code' },
  { key: 'ds_codigo_barras', label: 'Código de barras' },
  { key: 'ie_status', label: 'Status' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
];

export const FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'pat_ativos' },
  cd_patrimonio: { type: 'string', field: 'cd_patrimonio', collection: 'pat_ativos' },
  ds_ativo: { type: 'string', field: 'ds_ativo', collection: 'pat_ativos' },
  nr_seq_categoria: { type: 'int64', field: 'nr_seq_categoria', collection: 'pat_ativos' },
  nr_seq_localizacao: { type: 'int64', field: 'nr_seq_localizacao', collection: 'pat_ativos' },
  nr_seq_marca: { type: 'int64', field: 'nr_seq_marca', collection: 'pat_ativos' },
  ds_modelo: { type: 'string', field: 'ds_modelo', collection: 'pat_ativos' },
  ds_qr_code: { type: 'string', field: 'ds_qr_code', collection: 'pat_ativos' },
  ds_codigo_barras: { type: 'string', field: 'ds_codigo_barras', collection: 'pat_ativos' },
  ie_status: { type: 'string', field: 'ie_status', collection: 'pat_ativos' },
  ds_observacao: { type: 'string', field: 'ds_observacao', collection: 'pat_ativos' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'pat_ativos' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'pat_ativos' },
} as const;

export const FIELD_LABELS: Record<string, string> = {
  nr_sequencia: 'Sequência',
  cd_patrimonio: 'Patrimônio',
  ds_ativo: 'Descrição',
  nr_seq_categoria: 'Categoria',
  nr_seq_localizacao: 'Localização',
  nr_seq_marca: 'Marca',
  ds_modelo: 'Modelo',
  ds_qr_code: 'QR Code',
  ds_codigo_barras: 'Código de barras',
  ie_status: 'Status',
  ds_observacao: 'Observação',
  dt_criacao: 'Criação',
  dt_alteracao: 'Alteração',
};

/** Status possíveis do ativo (dropdown Status). */
export const STATUS_OPTIONS = [
  { value: 'D', label: 'Descartado' },
  { value: 'E', label: 'Estoque' },
  { value: 'M', label: 'Manutenção' },
  { value: 'O', label: 'Operando' },
];

export function formatCellValue(key: keyof Ativo, value: unknown): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (!stringValue) return '';

  switch (key) {
    case 'dt_criacao':
    case 'dt_alteracao':
      return formatDate(stringValue);
    case 'ie_status':
      switch (stringValue) {
        case 'D':
          return 'Descartado';
        case 'E':
          return 'Estoque';
        case 'M':
          return 'Manutenção';
        case 'O':
          return 'Operando';
        default:
          return '';
      }
    default:
      return stringValue;
  }
}
