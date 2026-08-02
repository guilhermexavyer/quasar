import type { PessoaFisica } from "@/types/pessoaFisica";

export interface ColDef {
  key: keyof PessoaFisica;
  label: string;
  headerLabel?: string;
  dataClass?: string;
  headerClass?: string;
}

export const COLUMNS: ColDef[] = [
  { key: 'nr_sequencia', label: '#', dataClass: 'text-center' },
  { key: 'ds_nome', label: 'Nome', dataClass: 'text-black' },
  { key: 'nr_cpf', label: 'CPF' },
  { key: 'dt_nascimento', label: 'Nascimento' },
  { key: 'ds_email', label: 'E-mail' },
  { key: 'nr_telefone', label: 'Telefone' },
  { key: 'nr_seq_sexo', label: 'Sexo' },
  { key: 'nr_seq_estado_civil', label: 'Estado civil' },
  { key: 'nr_seq_cor_raca', label: 'Cor/Raça' },
  { key: 'nr_seq_profissao', label: 'Profissão' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
];

export const FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'pessoa_fisica' },
  ds_nome: { type: 'string', field: 'ds_nome', collection: 'pessoa_fisica' },
  nr_cpf: { type: 'string', field: 'nr_cpf', collection: 'pessoa_fisica' },
  dt_nascimento: { type: 'string', field: 'dt_nascimento', collection: 'pessoa_fisica' },
  ds_email: { type: 'string', field: 'ds_email', collection: 'pessoa_fisica' },
  nr_telefone: { type: 'string', field: 'nr_telefone', collection: 'pessoa_fisica' },
  nr_seq_sexo: { type: 'int64', field: 'nr_seq_sexo', collection: 'pessoa_fisica' },
  nr_seq_estado_civil: { type: 'int64', field: 'nr_seq_estado_civil', collection: 'pessoa_fisica' },
  nr_seq_cor_raca: { type: 'int64', field: 'nr_seq_cor_raca', collection: 'pessoa_fisica' },
  nr_seq_profissao: { type: 'int64', field: 'nr_seq_profissao', collection: 'pessoa_fisica' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'pessoa_fisica' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'pessoa_fisica' },
} as const;

export const FIELD_LABELS: Record<string, string> = {
  nr_sequencia: 'Sequência',
  ds_nome: 'Nome completo',
  nr_cpf: 'CPF',
  dt_nascimento: 'Data de nascimento',
  ds_email: 'E-mail',
  nr_telefone: 'Telefone',
  nr_seq_sexo: 'Sexo',
  nr_seq_estado_civil: 'Estado civil',
  nr_seq_cor_raca: 'Cor/Raça',
  nr_seq_profissao: 'Profissão',
  dt_criacao: 'Criação',
  dt_alteracao: 'Alteração',
};

export function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatDate(value: string): string {
  if (!value) return '';

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    const pad = (n: number) => String(n).padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(value) || /^\d{4}\/\d{2}\/\d{2}/.test(value)) {
    const [year, month, day] = value.split('T')[0].split(/[-\/]/);
    return `${day}/${month}/${year}`;
  }

  const digits = value.replace(/\D/g, '');
  if (digits.length === 8) {
    const dayFirst = digits.slice(0, 2);
    const monthFirst = digits.slice(2, 4);
    const yearFirst = digits.slice(4, 8);
    const yearSecond = digits.slice(0, 4);
    const monthSecond = digits.slice(4, 6);
    const daySecond = digits.slice(6, 8);
    const isValidDayMonth = (d: number, m: number) => d >= 1 && d <= 31 && m >= 1 && m <= 12;
    if (isValidDayMonth(Number(dayFirst), Number(monthFirst))) {
      return `${dayFirst}/${monthFirst}/${yearFirst}`;
    }
    if (isValidDayMonth(Number(daySecond), Number(monthSecond))) {
      return `${daySecond}/${monthSecond}/${yearSecond}`;
    }
  }

  return value;
}

export function parseDateInput(value: string): number | null {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return year * 10000 + month * 100 + day;
}

export function parsePersonDateValue(value: string): number | null {
  if (!value) return null;
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    return year * 10000 + month * 100 + day;
  }

  const digits = value.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return year * 10000 + month * 100 + day;
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function applyCpfMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function applyDateMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  return digits;
}

export function applyPhoneMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatCellValue(key: keyof PessoaFisica, value: unknown): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (!stringValue) return '';

  switch (key) {
    case 'nr_cpf':
      return formatCpf(stringValue);
    case 'dt_nascimento':
    case 'dt_criacao':
    case 'dt_alteracao':
      return formatDate(stringValue);
    case 'nr_telefone':
      return formatPhone(stringValue);
    default:
      return stringValue;
  }
}
