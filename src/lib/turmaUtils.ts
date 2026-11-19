import type { Turma } from "@/types/turma";

export interface ColDef {
  key: keyof Turma;
  label: string;
  dataClass?: string;
  headerClass?: string;
}

export const TURMA_COLUMNS: ColDef[] = [
  { key: "nr_sequencia", label: "#", dataClass: "text-right" },
  { key: "ds_turma", label: "Descrição" },
  { key: "nr_seq_curso", label: "Curso" },
  { key: "nr_seq_periodo_letivo", label: "Período letivo" },
  { key: "qt_max_alunos", label: "Máximo de alunos", dataClass: "text-right" },
  { key: "nr_seq_localizacao", label: "Localização" },
  { key: "nr_seq_modalidade_ensino", label: "Modalidade de ensino" },
  { key: "dt_criacao", label: "Criação" },
  { key: "dt_alteracao", label: "Alteração" },
  { key: "ds_usuario_criacao", label: "Usuário criação" },
  { key: "ds_usuario_alteracao", label: "Usuário alteração" },
];

export const TURMA_FIELD_INFOS = {
  nr_sequencia: { type: "int64", field: "nr_sequencia", collection: "turma" },
  ds_turma: { type: "string", field: "ds_turma", collection: "turma" },
  nr_seq_curso: { type: "int64", field: "nr_seq_curso", collection: "turma" },
  nr_seq_periodo_letivo: { type: "int64", field: "nr_seq_periodo_letivo", collection: "turma" },
  qt_max_alunos: { type: "int64", field: "qt_max_alunos", collection: "turma" },
  nr_seq_localizacao: { type: "int64", field: "nr_seq_localizacao", collection: "turma" },
  nr_seq_modalidade_ensino: { type: "int64", field: "nr_seq_modalidade_ensino", collection: "turma" },
  dt_criacao: { type: "string", field: "dt_criacao", collection: "turma" },
  dt_alteracao: { type: "string", field: "dt_alteracao", collection: "turma" },
} as const;

/** Colunas de referência da turma (sequência → descrição exibida na lista). */
export const TURMA_COLUNAS_REFERENCIA = ["nr_seq_curso", "nr_seq_periodo_letivo", "nr_seq_localizacao", "nr_seq_modalidade_ensino"] as const;
