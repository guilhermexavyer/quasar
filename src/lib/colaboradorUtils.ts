import type { Colaborador } from "@/types/colaborador";
import { formatDate } from "@/lib/pessoaFisicaUtils";

export { formatDate, applyDateMask } from "@/lib/pessoaFisicaUtils";

export interface ColDef {
  key: keyof Colaborador;
  label: string;
  headerLabel?: string;
  dataClass?: string;
  headerClass?: string;
}

export const COLABORADOR_COLUMNS: ColDef[] = [
  { key: 'nr_sequencia', label: '#', dataClass: 'text-center' },
  { key: 'nr_seq_pessoa_fisica', label: 'Pessoa física' },
  { key: 'nr_seq_pessoa_juridica', label: 'Pessoa jurídica' },
  { key: 'nr_matricula', label: 'Matrícula' },
  { key: 'dt_admissao', label: 'Data de admissão' },
  { key: 'ie_status', label: 'Status' },
  { key: 'dt_status', label: 'Data do status' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
];

export const FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'colaborador' },
  nr_seq_pessoa_fisica: { type: 'int64', field: 'nr_seq_pessoa_fisica', collection: 'colaborador' },
  nr_seq_pessoa_juridica: { type: 'int64', field: 'nr_seq_pessoa_juridica', collection: 'colaborador' },
  nr_seq_vinculo_contratual: { type: 'int64', field: 'nr_seq_vinculo_contratual', collection: 'colaborador' },
  ie_fornecedor: { type: 'string', field: 'ie_fornecedor', collection: 'colaborador' },
  ie_prestador_servico: { type: 'string', field: 'ie_prestador_servico', collection: 'colaborador' },
  nr_matricula: { type: 'string', field: 'nr_matricula', collection: 'colaborador' },
  dt_admissao: { type: 'string', field: 'dt_admissao', collection: 'colaborador' },
  ie_status: { type: 'string', field: 'ie_status', collection: 'colaborador' },
  dt_status: { type: 'string', field: 'dt_status', collection: 'colaborador' },
  ds_status: { type: 'string', field: 'ds_status', collection: 'colaborador' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'colaborador' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'colaborador' },
} as const;

export const FIELD_LABELS: Record<string, string> = {
  nr_sequencia: 'Sequência',
  nr_seq_pessoa_fisica: 'Pessoa física',
  nr_seq_pessoa_juridica: 'Pessoa jurídica',
  nr_seq_vinculo_contratual: 'Vínculo contratual',
  ie_fornecedor: 'Fornecedor',
  ie_prestador_servico: 'Prestador de serviço',
  nr_matricula: 'Matrícula',
  dt_admissao: 'Data de admissão',
  ie_status: 'Status',
  dt_status: 'Data do status',
  ds_status: 'Motivo do status',
  dt_criacao: 'Criação',
  dt_alteracao: 'Alteração',
};

/** Status possíveis do colaborador (dropdown Status). */
export const STATUS_OPTIONS = [
  { value: 'A', label: 'Ativo' },
  { value: 'AF', label: 'Afastado' },
  { value: 'F', label: 'Férias' },
  { value: 'L', label: 'Licença' },
  { value: 'D', label: 'Desligado' },
];

export function formatCellValue(key: keyof Colaborador, value: unknown): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (!stringValue) return '';

  switch (key) {
    case 'dt_admissao':
    case 'dt_status':
    case 'dt_criacao':
    case 'dt_alteracao':
      return formatDate(stringValue);
    case 'ie_status':
      switch (stringValue) {
        case 'A':
          return 'Ativo';
        case 'AF':
          return 'Afastado';
        case 'F':
          return 'Férias';
        case 'L':
          return 'Licença';
        case 'D':
          return 'Desligado';
        default:
          return '';
      }
    default:
      return stringValue;
  }
}
