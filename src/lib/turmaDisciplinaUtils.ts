import type { TurmaDisciplina } from "@/types/turmaDisciplina";

export interface ColDef {
  key: keyof TurmaDisciplina;
  label: string;
  dataClass?: string;
  headerClass?: string;
}

export const TURMA_DISCIPLINA_COLUMNS: ColDef[] = [
  { key: "nr_sequencia", label: "#", dataClass: "text-right" },
  { key: "nr_seq_turma", label: "Turma" },
  { key: "nr_seq_disciplina", label: "Disciplina" },
  { key: "ie_status", label: "Status" },
  { key: "dt_criacao", label: "Criação" },
  { key: "dt_alteracao", label: "Alteração" },
  { key: "ds_usuario_criacao", label: "Usuário criação" },
  { key: "ds_usuario_alteracao", label: "Usuário alteração" },
];

export const TURMA_DISCIPLINA_FIELD_INFOS = {
  nr_sequencia: { type: "int64", field: "nr_sequencia", collection: "turma_disciplina" },
  nr_seq_turma: { type: "int64", field: "nr_seq_turma", collection: "turma_disciplina" },
  nr_seq_disciplina: { type: "int64", field: "nr_seq_disciplina", collection: "turma_disciplina" },
  ie_status: { type: "string", field: "ie_status", collection: "turma_disciplina" },
  dt_criacao: { type: "string", field: "dt_criacao", collection: "turma_disciplina" },
  dt_alteracao: { type: "string", field: "dt_alteracao", collection: "turma_disciplina" },
} as const;

/** Colunas de referência (sequência → descrição exibida na lista). */
export const TURMA_DISCIPLINA_COLUNAS_REFERENCIA = ["nr_seq_turma", "nr_seq_disciplina"] as const;
