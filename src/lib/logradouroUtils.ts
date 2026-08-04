import type { Logradouro } from "@/types/logradouro";

export interface ColDef {
  key: keyof Logradouro;
  label: string;
  dataClass?: string;
  headerClass?: string;
}

export const LOGRADOURO_COLUMNS: ColDef[] = [
  { key: 'nr_sequencia', label: '#', dataClass: 'text-center' },
  { key: 'sg_logradouro', label: 'Sigla' },
  { key: 'ds_logradouro', label: 'Descrição' },
  { key: 'ie_status', label: 'Status' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
];

export const LOGRADOURO_FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'cg_logradouro' },
  sg_logradouro: { type: 'string', field: 'sg_logradouro', collection: 'cg_logradouro' },
  ds_logradouro: { type: 'string', field: 'ds_logradouro', collection: 'cg_logradouro' },
  ie_status: { type: 'string', field: 'ie_status', collection: 'cg_logradouro' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'cg_logradouro' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'cg_logradouro' },
} as const;
