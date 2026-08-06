import type { GrauParentesco } from "@/types/grauParentesco";

export interface ColDef {
  key: keyof GrauParentesco;
  label: string;
  dataClass?: string;
  headerClass?: string;
}

export const GRAU_PARENTESCO_COLUMNS: ColDef[] = [
  { key: 'nr_sequencia', label: '#', dataClass: 'text-center' },
  { key: 'ds_grau_parentesco', label: 'Descrição' },
  { key: 'ie_status', label: 'Status' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
];

export const GRAU_PARENTESCO_FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'cg_grau_parentesco' },
  ds_grau_parentesco: { type: 'string', field: 'ds_grau_parentesco', collection: 'cg_grau_parentesco' },
  ie_status: { type: 'string', field: 'ie_status', collection: 'cg_grau_parentesco' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'cg_grau_parentesco' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'cg_grau_parentesco' },
} as const;
