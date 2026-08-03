import type { OrgaoEmissor } from "@/types/orgaoEmissor";

export interface ColDef {
  key: keyof OrgaoEmissor;
  label: string;
  dataClass?: string;
  headerClass?: string;
}

export const ORGAO_EMISSOR_COLUMNS: ColDef[] = [
  { key: 'nr_sequencia', label: '#', dataClass: 'text-center' },
  { key: 'sg_orgao_emissor', label: 'Sigla' },
  { key: 'ds_orgao_emissor', label: 'Descrição' },
  { key: 'ie_status', label: 'Status' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
];

export const ORGAO_EMISSOR_FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'cg_orgao_emissor' },
  sg_orgao_emissor: { type: 'string', field: 'sg_orgao_emissor', collection: 'cg_orgao_emissor' },
  ds_orgao_emissor: { type: 'string', field: 'ds_orgao_emissor', collection: 'cg_orgao_emissor' },
  ie_status: { type: 'string', field: 'ie_status', collection: 'cg_orgao_emissor' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'cg_orgao_emissor' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'cg_orgao_emissor' },
} as const;
