import type { TipoPapel } from "@/types/tipoPapel";

export interface ColDef {
  key: keyof TipoPapel;
  label: string;
  dataClass?: string;
  headerClass?: string;
}

export const TIPO_PAPEL_COLUMNS: ColDef[] = [
  { key: "nr_sequencia", label: "#", dataClass: "text-right" },
  { key: "ds_tipo_papel", label: "Descrição" },
  { key: "ie_status", label: "Status" },
  { key: "dt_criacao", label: "Criação" },
  { key: "dt_alteracao", label: "Alteração" },
  { key: "ds_usuario_criacao", label: "Usuário criação" },
  { key: "ds_usuario_alteracao", label: "Usuário alteração" },
];

export const TIPO_PAPEL_FIELD_INFOS = {
  nr_sequencia: { type: "int64", field: "nr_sequencia", collection: "cg_tipo_papel" },
  ds_tipo_papel: { type: "string", field: "ds_tipo_papel", collection: "cg_tipo_papel" },
  ie_status: { type: "string", field: "ie_status", collection: "cg_tipo_papel" },
  dt_criacao: { type: "string", field: "dt_criacao", collection: "cg_tipo_papel" },
  dt_alteracao: { type: "string", field: "dt_alteracao", collection: "cg_tipo_papel" },
} as const;
