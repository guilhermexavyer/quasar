import type { Marca } from "@/types/marca";

export interface ColDef {
  key: keyof Marca;
  label: string;
  dataClass?: string;
  headerClass?: string;
}

export const MARCA_COLUMNS: ColDef[] = [
  { key: 'nr_sequencia', label: '#', dataClass: 'text-center' },
  { key: 'ds_marca', label: 'Descrição' },
  { key: 'ie_status', label: 'Status' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
];

export const MARCA_FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'cg_marca' },
  ds_marca: { type: 'string', field: 'ds_marca', collection: 'cg_marca' },
  ie_status: { type: 'string', field: 'ie_status', collection: 'cg_marca' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'cg_marca' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'cg_marca' },
} as const;
