import type { Cargo } from "@/types/cargo";

export interface ColDef {
  key: keyof Cargo;
  label: string;
  dataClass?: string;
  headerClass?: string;
}

export const CARGO_COLUMNS: ColDef[] = [
  { key: 'nr_sequencia', label: '#', dataClass: 'text-center' },
  { key: 'ds_cargo', label: 'Descrição' },
  { key: 'ie_status', label: 'Status' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
];

export const CARGO_FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'cg_cargo' },
  ds_cargo: { type: 'string', field: 'ds_cargo', collection: 'cg_cargo' },
  ie_status: { type: 'string', field: 'ie_status', collection: 'cg_cargo' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'cg_cargo' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'cg_cargo' },
} as const;
