import type { ModalidadeEnsino } from "@/types/modalidadeEnsino";

export interface ColDef {
  key: keyof ModalidadeEnsino;
  label: string;
  dataClass?: string;
  headerClass?: string;
}

export const MODALIDADE_ENSINO_COLUMNS: ColDef[] = [
  { key: "nr_sequencia", label: "#", dataClass: "text-right" },
  { key: "ds_modalidade_ensino", label: "Descrição" },
  { key: "ie_status", label: "Status" },
  { key: "dt_criacao", label: "Criação" },
  { key: "dt_alteracao", label: "Alteração" },
  { key: "ds_usuario_criacao", label: "Usuário criação" },
  { key: "ds_usuario_alteracao", label: "Usuário alteração" },
];

export const MODALIDADE_ENSINO_FIELD_INFOS = {
  nr_sequencia: { type: "int64", field: "nr_sequencia", collection: "cg_modalidade_ensino" },
  ds_modalidade_ensino: { type: "string", field: "ds_modalidade_ensino", collection: "cg_modalidade_ensino" },
  ie_status: { type: "string", field: "ie_status", collection: "cg_modalidade_ensino" },
  dt_criacao: { type: "string", field: "dt_criacao", collection: "cg_modalidade_ensino" },
  dt_alteracao: { type: "string", field: "dt_alteracao", collection: "cg_modalidade_ensino" },
} as const;
