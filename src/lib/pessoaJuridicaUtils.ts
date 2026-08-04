import type { PessoaJuridica } from "@/types/pessoaJuridica";
import { formatDate } from "@/lib/pessoaFisicaUtils";

export interface PjColDef {
  key: keyof PessoaJuridica;
  label: string;
  headerLabel?: string;
  dataClass?: string;
  headerClass?: string;
}

export const PJ_COLUMNS: PjColDef[] = [
  { key: 'nr_sequencia', label: '#', dataClass: 'text-center' },
  { key: 'ds_razao_social', label: 'Razão social', dataClass: 'text-black' },
  { key: 'ds_nome_fantasia', label: 'Nome fantasia' },
  { key: 'nr_cnpj', label: 'CNPJ' },
  { key: 'nr_telefone', label: 'Telefone' },
  { key: 'ds_email', label: 'E-mail' },
  { key: 'sg_estado', label: 'UF' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
];

export const PJ_FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'pessoa_juridica' },
  ds_razao_social: { type: 'string', field: 'ds_razao_social', collection: 'pessoa_juridica' },
  ds_nome_fantasia: { type: 'string', field: 'ds_nome_fantasia', collection: 'pessoa_juridica' },
  nr_cnpj: { type: 'string', field: 'nr_cnpj', collection: 'pessoa_juridica' },
  nr_inscricao_estadual: { type: 'string', field: 'nr_inscricao_estadual', collection: 'pessoa_juridica' },
  nr_inscricao_municipal: { type: 'string', field: 'nr_inscricao_municipal', collection: 'pessoa_juridica' },
  dt_abertura: { type: 'string', field: 'dt_abertura', collection: 'pessoa_juridica' },
  nr_telefone: { type: 'string', field: 'nr_telefone', collection: 'pessoa_juridica' },
  ds_email: { type: 'string', field: 'ds_email', collection: 'pessoa_juridica' },
  nr_cep: { type: 'string', field: 'nr_cep', collection: 'pessoa_juridica' },
  ds_endereco: { type: 'string', field: 'ds_endereco', collection: 'pessoa_juridica' },
  nr_endereco: { type: 'string', field: 'nr_endereco', collection: 'pessoa_juridica' },
  ds_bairro: { type: 'string', field: 'ds_bairro', collection: 'pessoa_juridica' },
  ds_complemento: { type: 'string', field: 'ds_complemento', collection: 'pessoa_juridica' },
  nr_seq_logradouro: { type: 'int64', field: 'nr_seq_logradouro', collection: 'pessoa_juridica' },
  sg_estado: { type: 'string', field: 'sg_estado', collection: 'pessoa_juridica' },
  cd_ibge_cidade: { type: 'string', field: 'cd_ibge_cidade', collection: 'pessoa_juridica' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'pessoa_juridica' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'pessoa_juridica' },
} as const;

export const PJ_FIELD_LABELS: Record<string, string> = {
  nr_sequencia: 'Sequência',
  ds_razao_social: 'Razão social',
  ds_nome_fantasia: 'Nome fantasia',
  nr_cnpj: 'CNPJ',
  nr_inscricao_estadual: 'Inscrição estadual',
  nr_inscricao_municipal: 'Inscrição municipal',
  dt_abertura: 'Data de abertura',
  nr_telefone: 'Telefone',
  ds_email: 'E-mail',
  nr_cep: 'CEP',
  ds_endereco: 'Rua',
  nr_endereco: 'Número',
  ds_bairro: 'Bairro',
  ds_complemento: 'Complemento',
  nr_seq_logradouro: 'Logradouro',
  sg_estado: 'UF',
  cd_ibge_cidade: 'Cidade',
  dt_criacao: 'Criação',
  dt_alteracao: 'Alteração',
};

export function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function applyCnpjMask(value: string): string {
  return formatCnpj(value);
}

export function formatCellValuePj(key: keyof PessoaJuridica, value: unknown): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (!stringValue) return '';

  switch (key) {
    case 'nr_cnpj':
      return formatCnpj(stringValue);
    case 'dt_abertura':
    case 'dt_criacao':
    case 'dt_alteracao':
      return formatDate(stringValue);
    default:
      return stringValue;
  }
}
