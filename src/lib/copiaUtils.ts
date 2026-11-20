import { formatCadastroGeralCellValue } from "@/lib/cadastroGeralUtils";
import { nomeDoArquivoCopia } from "@/lib/copiaArquivoUtils";
import type { Copia } from "@/types/copia";

export interface ColDef {
  key: keyof Copia;
  label: string;
  dataClass?: string;
  headerClass?: string;
  /** Coluna fixa do clipe (abre o arquivo), como em Administração do Sistema > Imagens. */
  clipe?: boolean;
}

/** Status da cópia: escolhido no cadastro; depois, só pelo menu de contexto "Alterar status". */
export const STATUS_COPIA_OPTIONS = [
  { value: "A", label: "Aguardando" },
  { value: "C", label: "Cancelado" },
  { value: "E", label: "Entregue" },
  { value: "I", label: "Impresso" },
];

/** Cores padrão das bolinhas de status (enquanto não forem configuradas em Controle de Cópias > Parâmetros). */
export const CORES_STATUS_COPIA_PADRAO: Record<"A" | "C" | "E" | "I", string> = {
  A: "#f59e0b",
  C: "#999999",
  E: "#2cc958",
  I: "#3b82f6",
};

/** A coluna Status (bolinha) fica fixa como a primeira da lista. */
export const COPIA_COLUMNS: ColDef[] = [
  { key: "ie_status", label: "Status" },
  { key: "ie_arquivo", label: "", clipe: true },
  { key: "nr_sequencia", label: "#", dataClass: "text-right" },
  { key: "dt_recebimento", label: "Recebimento" },
  { key: "dt_impressao", label: "Impressão" },
  { key: "dt_entrega", label: "Entrega" },
  { key: "nr_seq_solicitante", label: "Solicitante" },
  { key: "nr_seq_turma_disciplina", label: "Turma x Disciplina" },
  { key: "qt_copias", label: "Cópias", dataClass: "text-right" },
  { key: "qt_folhas", label: "Folhas", dataClass: "text-right" },
  { key: "ie_frente_verso", label: "Frente e verso" },
  { key: "ie_grampear", label: "Grampear" },
  { key: "ie_guilhotinar", label: "Guilhotinar" },
  { key: "nr_seq_formato_papel", label: "Formato do papel" },
  { key: "nr_seq_tipo_papel", label: "Tipo de papel" },
  { key: "ie_arquivo", label: "Arquivo" },
  { key: "dt_status", label: "Data do status" },
  { key: "ds_motivo_status", label: "Motivo status" },
  { key: "dt_criacao", label: "Criação" },
  { key: "dt_alteracao", label: "Alteração" },
  { key: "ds_usuario_criacao", label: "Usuário criação" },
  { key: "ds_usuario_alteracao", label: "Usuário alteração" },
];

export const COPIA_FIELD_INFOS = {
  nr_sequencia: { type: "int64", field: "nr_sequencia", collection: "copia" },
  dt_recebimento: { type: "string", field: "dt_recebimento", collection: "copia" },
  dt_impressao: { type: "string", field: "dt_impressao", collection: "copia" },
  dt_entrega: { type: "string", field: "dt_entrega", collection: "copia" },
  ie_status: { type: "string", field: "ie_status", collection: "copia" },
  dt_status: { type: "string", field: "dt_status", collection: "copia" },
  ds_motivo_status: { type: "string", field: "ds_motivo_status", collection: "copia" },
  nr_seq_solicitante: { type: "int64", field: "nr_seq_solicitante", collection: "copia" },
  nr_seq_turma_disciplina: { type: "int64", field: "nr_seq_turma_disciplina", collection: "copia" },
  qt_copias: { type: "int64", field: "qt_copias", collection: "copia" },
  qt_folhas: { type: "int64", field: "qt_folhas", collection: "copia" },
  ie_frente_verso: { type: "string", field: "ie_frente_verso", collection: "copia" },
  ie_grampear: { type: "string", field: "ie_grampear", collection: "copia" },
  ie_guilhotinar: { type: "string", field: "ie_guilhotinar", collection: "copia" },
  nr_seq_formato_papel: { type: "int64", field: "nr_seq_formato_papel", collection: "copia" },
  nr_seq_tipo_papel: { type: "int64", field: "nr_seq_tipo_papel", collection: "copia" },
  ie_arquivo: { type: "string", field: "ie_arquivo", collection: "copia" },
  dt_criacao: { type: "string", field: "dt_criacao", collection: "copia" },
  dt_alteracao: { type: "string", field: "dt_alteracao", collection: "copia" },
} as const;

/** Colunas de referência (sequência → descrição exibida na lista). */
export const COPIA_COLUNAS_REFERENCIA = ["nr_seq_solicitante", "nr_seq_turma_disciplina", "nr_seq_formato_papel", "nr_seq_tipo_papel"] as const;

export function rotuloStatusCopia(valor: unknown): string {
  return STATUS_COPIA_OPTIONS.find((o) => o.value === String(valor ?? ""))?.label ?? "";
}

/** Célula da lista (sem as referências, que dependem dos cadastros carregados na tela). */
export function formatCopiaCellValue(key: string, value: unknown): string {
  if (key === "ie_status") return rotuloStatusCopia(value);
  if (key === "ie_frente_verso" || key === "ie_grampear" || key === "ie_guilhotinar") return value === "S" ? "Sim" : value === "N" ? "Não" : "";
  if (key === "ie_arquivo") return nomeDoArquivoCopia(value as string | undefined);
  return formatCadastroGeralCellValue(key, value);
}
