import type { Curso } from "@/types/curso";

export interface ColDef {
  key: keyof Curso;
  label: string;
  dataClass?: string;
  headerClass?: string;
}

export const CURSO_COLUMNS: ColDef[] = [
  { key: 'nr_sequencia', label: '#', dataClass: 'text-right' },
  { key: 'ds_curso', label: 'Descrição' },
  { key: 'ds_observacao', label: 'Observação' },
  { key: 'ie_status', label: 'Status' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
  { key: 'ds_usuario_criacao', label: 'Usuário criação' },
  { key: 'ds_usuario_alteracao', label: 'Usuário alteração' },
];

export const CURSO_FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'curso' },
  ds_curso: { type: 'string', field: 'ds_curso', collection: 'curso' },
  ds_observacao: { type: 'string', field: 'ds_observacao', collection: 'curso' },
  ie_status: { type: 'string', field: 'ie_status', collection: 'curso' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'curso' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'curso' },
} as const;
