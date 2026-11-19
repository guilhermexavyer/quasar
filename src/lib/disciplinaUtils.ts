import type { Disciplina } from "@/types/disciplina";

export interface ColDef {
  key: keyof Disciplina;
  label: string;
  dataClass?: string;
  headerClass?: string;
}

export const DISCIPLINA_COLUMNS: ColDef[] = [
  { key: "nr_sequencia", label: "#", dataClass: "text-right" },
  { key: "ds_disciplina", label: "Descrição" },
  { key: "ds_observacao", label: "Observação" },
  { key: "dt_criacao", label: "Criação" },
  { key: "dt_alteracao", label: "Alteração" },
  { key: "ds_usuario_criacao", label: "Usuário criação" },
  { key: "ds_usuario_alteracao", label: "Usuário alteração" },
];

export const DISCIPLINA_FIELD_INFOS = {
  nr_sequencia: { type: "int64", field: "nr_sequencia", collection: "disciplina" },
  ds_disciplina: { type: "string", field: "ds_disciplina", collection: "disciplina" },
  ds_observacao: { type: "string", field: "ds_observacao", collection: "disciplina" },
  dt_criacao: { type: "string", field: "dt_criacao", collection: "disciplina" },
  dt_alteracao: { type: "string", field: "dt_alteracao", collection: "disciplina" },
} as const;
