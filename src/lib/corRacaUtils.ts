import type { CorRaca } from "@/types/corRaca";

export interface ColDef {
  key: keyof CorRaca;
  label: string;
  dataClass?: string;
  headerClass?: string;
}

export const COR_RACA_COLUMNS: ColDef[] = [
  { key: 'nr_sequencia', label: '#', dataClass: 'text-center' },
  { key: 'ds_cor_raca', label: 'Descrição' },
  { key: 'ie_status', label: 'Status' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
];

export const COR_RACA_FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'cg_cor_raca' },
  ds_cor_raca: { type: 'string', field: 'ds_cor_raca', collection: 'cg_cor_raca' },
  ie_status: { type: 'string', field: 'ie_status', collection: 'cg_cor_raca' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'cg_cor_raca' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'cg_cor_raca' },
} as const;
