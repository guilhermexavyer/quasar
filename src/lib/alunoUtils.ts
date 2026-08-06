import type { Aluno } from "@/types/aluno";
import { formatDate, formatPhone } from "@/lib/pessoaFisicaUtils";

export { formatDate, formatPhone, applyDateMask, applyPhoneMask, parseDateInput, parsePersonDateValue } from "@/lib/pessoaFisicaUtils";

export interface ColDef {
  key: keyof Aluno;
  label: string;
  headerLabel?: string;
  dataClass?: string;
  headerClass?: string;
}

export const ALUNO_COLUMNS: ColDef[] = [
  { key: 'nr_sequencia', label: '#', dataClass: 'text-center' },
  { key: 'nr_seq_pessoa_fisica', label: 'Pessoa física' },
  { key: 'nr_matricula', label: 'Matrícula' },
  { key: 'dt_ingresso', label: 'Ingresso' },
  { key: 'dt_desligamento', label: 'Desligamento' },
  { key: 'ds_desligamento', label: 'Motivo desligamento' },
  { key: 'ie_status', label: 'Status' },
  { key: 'nr_seq_responsavel', label: 'Responsável' },
  { key: 'nr_telefone', label: 'Telefone' },
  { key: 'ds_email', label: 'E-mail' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
];

export const FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'aluno' },
  nr_seq_pessoa_fisica: { type: 'int64', field: 'nr_seq_pessoa_fisica', collection: 'aluno' },
  nr_matricula: { type: 'string', field: 'nr_matricula', collection: 'aluno' },
  dt_ingresso: { type: 'string', field: 'dt_ingresso', collection: 'aluno' },
  dt_desligamento: { type: 'string', field: 'dt_desligamento', collection: 'aluno' },
  ds_desligamento: { type: 'string', field: 'ds_desligamento', collection: 'aluno' },
  ie_status: { type: 'string', field: 'ie_status', collection: 'aluno' },
  nr_seq_responsavel: { type: 'int64', field: 'nr_seq_responsavel', collection: 'aluno' },
  nr_telefone: { type: 'string', field: 'nr_telefone', collection: 'aluno' },
  ds_email: { type: 'string', field: 'ds_email', collection: 'aluno' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'aluno' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'aluno' },
} as const;

export const FIELD_LABELS: Record<string, string> = {
  nr_sequencia: 'Sequência',
  nr_seq_pessoa_fisica: 'Pessoa física',
  nr_matricula: 'Matrícula',
  dt_ingresso: 'Ingresso',
  dt_desligamento: 'Desligamento',
  ds_desligamento: 'Motivo desligamento',
  ie_status: 'Status',
  nr_seq_responsavel: 'Pessoa física',
  nr_telefone: 'Telefone',
  ds_email: 'E-mail',
  dt_criacao: 'Criação',
  dt_alteracao: 'Alteração',
};

export function formatCellValue(key: keyof Aluno, value: unknown): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (!stringValue) return '';

  switch (key) {
    case 'dt_ingresso':
    case 'dt_desligamento':
    case 'dt_criacao':
    case 'dt_alteracao':
      return formatDate(stringValue);
    case 'nr_telefone':
      return formatPhone(stringValue);
    case 'ie_status':
      switch (stringValue) {
        case 'A':
          return 'Ativo';
        case 'B':
          return 'Bloqueado';
        case 'I':
          return 'Inativo';
        default:
          return '';
      }
    default:
      return stringValue;
  }
}
