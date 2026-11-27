import type { Cargo } from "@/types/cargo";

export interface ColDef {
  key: keyof Cargo;
  label: string;
  dataClass?: string;
  headerClass?: string;
}

export const CARGO_COLUMNS: ColDef[] = [
  { key: 'nr_sequencia', label: '#', dataClass: 'text-right' },
  { key: 'ds_cargo', label: 'Descrição' },
  { key: 'ie_status', label: 'Status' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
  { key: 'ds_usuario_criacao', label: 'Usuário criação' },
  { key: 'ds_usuario_alteracao', label: 'Usuário alteração' },
];

export const CARGO_FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'cargo' },
  ds_cargo: { type: 'string', field: 'ds_cargo', collection: 'cargo' },
  ie_status: { type: 'string', field: 'ie_status', collection: 'cargo' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'cargo' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'cargo' },
} as const;
