import type { CategoriaAtivo } from "@/types/categoriaAtivo";

export interface ColDef {
  key: keyof CategoriaAtivo;
  label: string;
  dataClass?: string;
  headerClass?: string;
}

export const CATEGORIA_ATIVO_COLUMNS: ColDef[] = [
  { key: 'nr_sequencia', label: '#', dataClass: 'text-center' },
  { key: 'ds_categoria', label: 'Descrição' },
  { key: 'ds_observacao', label: 'Observação' },
  { key: 'ie_status', label: 'Status' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
];

export const CATEGORIA_ATIVO_FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'cg_categoria_ativo' },
  ds_categoria: { type: 'string', field: 'ds_categoria', collection: 'cg_categoria_ativo' },
  ds_observacao: { type: 'string', field: 'ds_observacao', collection: 'cg_categoria_ativo' },
  ie_status: { type: 'string', field: 'ie_status', collection: 'cg_categoria_ativo' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'cg_categoria_ativo' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'cg_categoria_ativo' },
} as const;
