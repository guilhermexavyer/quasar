import type { Combustivel } from "@/types/combustivel";

export interface ColDef {
  key: keyof Combustivel;
  label: string;
  dataClass?: string;
  headerClass?: string;
}

export const COMBUSTIVEL_COLUMNS: ColDef[] = [
  { key: "nr_sequencia", label: "#", dataClass: "text-right" },
  { key: "ds_combustivel", label: "Descrição" },
  { key: "ie_status", label: "Status" },
  { key: "dt_criacao", label: "Criação" },
  { key: "dt_alteracao", label: "Alteração" },
  { key: "ds_usuario_criacao", label: "Usuário criação" },
  { key: "ds_usuario_alteracao", label: "Usuário alteração" },
];

export const COMBUSTIVEL_FIELD_INFOS = {
  nr_sequencia: {
    type: "int64",
    field: "nr_sequencia",
    collection: "cg_combustivel",
  },
  ds_combustivel: {
    type: "string",
    field: "ds_combustivel",
    collection: "cg_combustivel",
  },
  ie_status: {
    type: "string",
    field: "ie_status",
    collection: "cg_combustivel",
  },
  dt_criacao: {
    type: "string",
    field: "dt_criacao",
    collection: "cg_combustivel",
  },
  dt_alteracao: {
    type: "string",
    field: "dt_alteracao",
    collection: "cg_combustivel",
  },
} as const;
