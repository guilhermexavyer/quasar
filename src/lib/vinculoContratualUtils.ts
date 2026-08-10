import type { VinculoContratual } from "@/types/vinculoContratual";

export interface ColDef {
  key: keyof VinculoContratual;
  label: string;
  dataClass?: string;
  headerClass?: string;
}

export const VINCULO_CONTRATUAL_COLUMNS: ColDef[] = [
  { key: 'nr_sequencia', label: '#', dataClass: 'text-center' },
  { key: 'ds_vinculo_contratual', label: 'Descrição' },
  { key: 'ie_status', label: 'Status' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
];

export const VINCULO_CONTRATUAL_FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'cg_vinculo_contratual' },
  ds_vinculo_contratual: { type: 'string', field: 'ds_vinculo_contratual', collection: 'cg_vinculo_contratual' },
  ie_status: { type: 'string', field: 'ie_status', collection: 'cg_vinculo_contratual' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'cg_vinculo_contratual' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'cg_vinculo_contratual' },
} as const;
