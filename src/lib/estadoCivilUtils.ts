import type { EstadoCivil } from "@/types/estadoCivil";

export interface ColDef {
  key: keyof EstadoCivil;
  label: string;
  dataClass?: string;
  headerClass?: string;
}

export const ESTADO_CIVIL_COLUMNS: ColDef[] = [
  { key: 'nr_sequencia', label: '#', dataClass: 'text-center' },
  { key: 'ds_estado_civil', label: 'Descrição' },
  { key: 'ie_status', label: 'Status' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
];

export const ESTADO_CIVIL_FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'cg_estado_civil' },
  ds_estado_civil: { type: 'string', field: 'ds_estado_civil', collection: 'cg_estado_civil' },
  ie_status: { type: 'string', field: 'ie_status', collection: 'cg_estado_civil' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'cg_estado_civil' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'cg_estado_civil' },
} as const;

