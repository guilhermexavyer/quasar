import type { Sexo } from "@/types/sexo";

export interface ColDef {
  key: keyof Sexo;
  label: string;
  dataClass?: string;
  headerClass?: string;
}

export const SEXO_COLUMNS: ColDef[] = [
  { key: 'nr_sequencia', label: '#', dataClass: 'text-center' },
  { key: 'ds_sexo', label: 'Descrição' },
  { key: 'ie_status', label: 'Status' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
];

export const SEXO_FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'cg_sexo' },
  ds_sexo: { type: 'string', field: 'ds_sexo', collection: 'cg_sexo' },
  ie_status: { type: 'string', field: 'ie_status', collection: 'cg_sexo' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'cg_sexo' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'cg_sexo' },
} as const;

