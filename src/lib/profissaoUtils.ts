import type { Profissao } from "@/types/profissao";

export interface ColDef {
  key: keyof Profissao;
  label: string;
  dataClass?: string;
  headerClass?: string;
}

export const PROFISSAO_COLUMNS: ColDef[] = [
  { key: 'nr_sequencia', label: '#', dataClass: 'text-center' },
  { key: 'ds_profissao', label: 'Descrição' },
  { key: 'ie_status', label: 'Status' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
];

export const PROFISSAO_FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'cg_profissao' },
  ds_profissao: { type: 'string', field: 'ds_profissao', collection: 'cg_profissao' },
  ie_status: { type: 'string', field: 'ie_status', collection: 'cg_profissao' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'cg_profissao' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'cg_profissao' },
} as const;
