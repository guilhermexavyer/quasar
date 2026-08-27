import type { Ativo } from "@/types/ativo";
import { formatDate } from "@/lib/pessoaFisicaUtils";

export { formatDate, applyDateMask } from "@/lib/pessoaFisicaUtils";

/** Máscara IPv4: ###.###.###.### — aceita apenas dígitos e insere pontos automaticamente. */
export function applyIPv4Mask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 12);
  const groups: string[] = [];
  for (let i = 0; i < digits.length; i += 3) {
    groups.push(digits.slice(i, i + 3));
  }
  return groups.join('.');
}

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
  { key: 'nr_serie', label: 'Número de série' },
  { key: 'ds_qr_code', label: 'QR Code' },
  { key: 'ds_codigo_barras', label: 'Código de barras' },
  { key: 'ie_status', label: 'Status' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
];

export const FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'pat_ativo' },
  cd_patrimonio: { type: 'string', field: 'cd_patrimonio', collection: 'pat_ativo' },
  ds_ativo: { type: 'string', field: 'ds_ativo', collection: 'pat_ativo' },
  nr_seq_categoria: { type: 'int64', field: 'nr_seq_categoria', collection: 'pat_ativo' },
  nr_seq_localizacao: { type: 'int64', field: 'nr_seq_localizacao', collection: 'pat_ativo' },
  nr_seq_marca: { type: 'int64', field: 'nr_seq_marca', collection: 'pat_ativo' },
  ds_modelo: { type: 'string', field: 'ds_modelo', collection: 'pat_ativo' },
  nr_serie: { type: 'string', field: 'nr_serie', collection: 'pat_ativo' },
  ds_qr_code: { type: 'string', field: 'ds_qr_code', collection: 'pat_ativo' },
  ds_codigo_barras: { type: 'string', field: 'ds_codigo_barras', collection: 'pat_ativo' },
  dt_aquisicao: { type: 'string', field: 'dt_aquisicao', collection: 'pat_ativo' },
  dt_garantia: { type: 'string', field: 'dt_garantia', collection: 'pat_ativo' },
  ie_status: { type: 'string', field: 'ie_status', collection: 'pat_ativo' },
  dt_ultima_manutencao: { type: 'string', field: 'dt_ultima_manutencao', collection: 'pat_ativo' },
  nr_seq_ultima_manutencao: { type: 'int64', field: 'nr_seq_ultima_manutencao', collection: 'pat_ativo' },
  dt_status: { type: 'string', field: 'dt_status', collection: 'pat_ativo' },
  ds_motivo_status: { type: 'string', field: 'ds_motivo_status', collection: 'pat_ativo' },
  ds_processador: { type: 'string', field: 'ds_processador', collection: 'pat_ativo' },
  qt_ram: { type: 'int64', field: 'qt_ram', collection: 'pat_ativo' },
  ie_ram: { type: 'string', field: 'ie_ram', collection: 'pat_ativo' },
  qt_armazenamento: { type: 'int64', field: 'qt_armazenamento', collection: 'pat_ativo' },
  ie_armazenamento: { type: 'string', field: 'ie_armazenamento', collection: 'pat_ativo' },
  ds_endereco_mac: { type: 'string', field: 'ds_endereco_mac', collection: 'pat_ativo' },
  ds_ip: { type: 'string', field: 'ds_ip', collection: 'pat_ativo' },
  nr_seq_sistema_operacional: { type: 'int64', field: 'nr_seq_sistema_operacional', collection: 'pat_ativo' },
  responsaveis: { type: 'array', field: 'responsaveis', collection: 'pat_ativo' },
  ds_observacao: { type: 'string', field: 'ds_observacao', collection: 'pat_ativo' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'pat_ativo' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'pat_ativo' },
} as const;

export const FIELD_LABELS: Record<string, string> = {
  nr_sequencia: 'Sequência',
  cd_patrimonio: 'Patrimônio',
  ds_ativo: 'Descrição',
  nr_seq_categoria: 'Categoria',
  nr_seq_localizacao: 'Localização',
  nr_seq_marca: 'Marca',
  ds_modelo: 'Modelo',
  nr_serie: 'Número de série',
  ds_qr_code: 'QR Code',
  ds_codigo_barras: 'Código de barras',
  dt_aquisicao: 'Data de aquisição',
  dt_garantia: 'Data de garantia',
  ie_status: 'Status',
  dt_ultima_manutencao: 'Última manutenção',
  nr_seq_ultima_manutencao: 'Última manutenção',
  dt_status: 'Data do status',
  ds_motivo_status: 'Motivo do status',
  ds_processador: 'Processador',
  qt_ram: 'Memória RAM',
  ie_ram: 'Unidade',
  qt_armazenamento: 'Armazenamento',
  ie_armazenamento: 'Unidade',
  ds_endereco_mac: 'Endereço MAC',
  ds_ip: 'IP',
  nr_seq_sistema_operacional: 'Sistema operacional',
  responsaveis: 'Responsável',
  ds_observacao: 'Observação',
  dt_criacao: 'Criação',
  dt_alteracao: 'Alteração',
};

/** Status possíveis do ativo (dropdown Status). */
export const STATUS_OPTIONS = [
  { value: 'D', label: 'Descartado' },
  { value: 'E', label: 'Estoque' },
  { value: 'M', label: 'Manutenção' },
  { value: 'O', label: 'Operacional' },
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
          return 'Operacional';
        default:
          return '';
      }
    default:
      return stringValue;
  }
}
