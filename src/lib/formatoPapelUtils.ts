import type { FormatoPapel } from "@/types/formatoPapel";

export interface ColDef {
  key: keyof FormatoPapel;
  label: string;
  dataClass?: string;
  headerClass?: string;
}

export const FORMATO_PAPEL_COLUMNS: ColDef[] = [
  { key: "nr_sequencia", label: "#", dataClass: "text-right" },
  { key: "ds_formato_papel", label: "Descrição" },
  { key: "qt_largura", label: "Largura", dataClass: "text-right" },
  { key: "qt_altura", label: "Altura", dataClass: "text-right" },
  { key: "ie_status", label: "Status" },
  { key: "dt_criacao", label: "Criação" },
  { key: "dt_alteracao", label: "Alteração" },
  { key: "ds_usuario_criacao", label: "Usuário criação" },
  { key: "ds_usuario_alteracao", label: "Usuário alteração" },
];

export const FORMATO_PAPEL_FIELD_INFOS = {
  nr_sequencia: { type: "int64", field: "nr_sequencia", collection: "formato_papel" },
  ds_formato_papel: { type: "string", field: "ds_formato_papel", collection: "formato_papel" },
  qt_largura: { type: "float64", field: "qt_largura", collection: "formato_papel" },
  qt_altura: { type: "float64", field: "qt_altura", collection: "formato_papel" },
  ie_status: { type: "string", field: "ie_status", collection: "formato_papel" },
  dt_criacao: { type: "string", field: "dt_criacao", collection: "formato_papel" },
  dt_alteracao: { type: "string", field: "dt_alteracao", collection: "formato_papel" },
} as const;
