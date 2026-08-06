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
  { key: 'dt_status', label: 'Data status' },
  { key: 'ds_status', label: 'Motivo status' },
  { key: 'ie_status', label: 'Status' },
  { key: 'responsaveis', label: 'Responsáveis' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
];

export const FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'aluno' },
  nr_seq_pessoa_fisica: { type: 'int64', field: 'nr_seq_pessoa_fisica', collection: 'aluno' },
  nr_matricula: { type: 'string', field: 'nr_matricula', collection: 'aluno' },
  dt_ingresso: { type: 'string', field: 'dt_ingresso', collection: 'aluno' },
  dt_status: { type: 'string', field: 'dt_status', collection: 'aluno' },
  ds_status: { type: 'string', field: 'ds_status', collection: 'aluno' },
  ie_status: { type: 'string', field: 'ie_status', collection: 'aluno' },
  responsaveis: { type: 'array', field: 'responsaveis', collection: 'aluno' },
  // Subcampos do array responsaveis (usados nas labels do formulário).
  nr_seq_responsavel: { type: 'int64', field: 'nr_seq_responsavel', collection: 'aluno' },
  nr_seq_grau_parentesco: { type: 'int64', field: 'nr_seq_grau_parentesco', collection: 'aluno' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'aluno' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'aluno' },
} as const;

export const FIELD_LABELS: Record<string, string> = {
  nr_sequencia: 'Sequência',
  nr_seq_pessoa_fisica: 'Pessoa física',
  nr_matricula: 'Matrícula',
  dt_ingresso: 'Ingresso',
  dt_status: 'Data status',
  ds_status: 'Motivo status',
  ie_status: 'Status',
  responsaveis: 'Responsáveis',
  dt_criacao: 'Criação',
  dt_alteracao: 'Alteração',
};

export function formatCellValue(key: keyof Aluno, value: unknown): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (!stringValue) return '';

  switch (key) {
    case 'dt_ingresso':
    case 'dt_status':
    case 'dt_criacao':
    case 'dt_alteracao':
      return formatDate(stringValue);
    case 'ie_status':
      switch (stringValue) {
        case 'A':
          return 'Ativo';
        case 'I':
          return 'Inativo';
        case 'C':
          return 'Cancelado';
        case 'T':
          return 'Transferido';
        default:
          return '';
      }
    case 'responsaveis': {
      // Fallback sem lookup: mostra a quantidade de responsáveis.
      const arr = Array.isArray(value) ? value : [];
      const validos = arr.filter((r) => r && r.nr_seq_responsavel);
      return validos.length === 0 ? '' : validos.length === 1 ? '1 responsável' : `${validos.length} responsáveis`;
    }
    default:
      return stringValue;
  }
}
