import type { SistemaOperacional } from "@/types/sistemaOperacional";

export interface ColDef {
  key: keyof SistemaOperacional;
  label: string;
  dataClass?: string;
  headerClass?: string;
}

export const SISTEMA_OPERACIONAL_COLUMNS: ColDef[] = [
  { key: "nr_sequencia", label: "#", dataClass: "text-center" },
  { key: "ds_sistema_operacional", label: "Descrição" },
  { key: "ie_status", label: "Status" },
  { key: "dt_criacao", label: "Criação" },
  { key: "dt_alteracao", label: "Alteração" },
];

export const SISTEMA_OPERACIONAL_FIELD_INFOS = {
  nr_sequencia: {
    type: "int64",
    field: "nr_sequencia",
    collection: "cg_sistema_operacional",
  },
  ds_sistema_operacional: {
    type: "string",
    field: "ds_sistema_operacional",
    collection: "cg_sistema_operacional",
  },
  ie_status: {
    type: "string",
    field: "ie_status",
    collection: "cg_sistema_operacional",
  },
  dt_criacao: {
    type: "string",
    field: "dt_criacao",
    collection: "cg_sistema_operacional",
  },
  dt_alteracao: {
    type: "string",
    field: "dt_alteracao",
    collection: "cg_sistema_operacional",
  },
} as const;
