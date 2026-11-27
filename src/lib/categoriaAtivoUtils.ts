import type { CategoriaAtivo } from "@/types/categoriaAtivo";

export interface ColDef {
  key: keyof CategoriaAtivo;
  label: string;
  dataClass?: string;
  headerClass?: string;
}

export const CATEGORIA_ATIVO_COLUMNS: ColDef[] = [
  { key: 'nr_sequencia', label: '#', dataClass: 'text-right' },
  { key: 'ds_categoria', label: 'Descrição' },
  { key: 'ie_status', label: 'Status' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
  { key: 'ds_usuario_criacao', label: 'Usuário criação' },
  { key: 'ds_usuario_alteracao', label: 'Usuário alteração' },
];

export const CATEGORIA_ATIVO_FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'categoria' },
  ds_categoria: { type: 'string', field: 'ds_categoria', collection: 'categoria' },
  ds_observacao: { type: 'string', field: 'ds_observacao', collection: 'categoria' },
  ie_status: { type: 'string', field: 'ie_status', collection: 'categoria' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'categoria' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'categoria' },
} as const;
