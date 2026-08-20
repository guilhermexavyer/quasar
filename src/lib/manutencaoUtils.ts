export { formatDate } from "@/lib/pessoaFisicaUtils";

/** Opções de status da manutenção. */
export const MANUTENCAO_STATUS_OPTIONS = [
  { value: "E", label: "Em andamento" },
  { value: "CO", label: "Concluída" },
  { value: "CA", label: "Cancelada" },
];

/** Definição de coluna da tabela de manutenções. */
export interface ManutencaoColDef {
  key: string;
  label: string;
  dataClass?: string;
}

/** Colunas da tabela de manutenções (ordem padrão). */
export const MANUTENCAO_COLUMNS: ManutencaoColDef[] = [
  { key: "nr_sequencia", label: "#", dataClass: "text-center" },
  { key: "nr_seq_ativo", label: "Ativo" },
  { key: "nr_seq_pessoa_fisica", label: "Prestador" },
  { key: "dt_envio", label: "Data de envio" },
  { key: "dt_termino", label: "Data de término" },
  { key: "ie_status_manutencao", label: "Status" },
  { key: "vl_total", label: "Valor total" },
  { key: "dt_criacao", label: "Criação" },
  { key: "dt_alteracao", label: "Alteração" },
];

/** Metadados dos campos para infobutton / configuração em Admin > Campos. */
export const FIELD_INFOS = {
  nr_sequencia: { type: "int64", field: "nr_sequencia", collection: "pat_manutencao" },
  nr_seq_ativo: { type: "int64", field: "nr_seq_ativo", collection: "pat_manutencao" },
  nr_seq_pessoa_fisica: { type: "int64", field: "nr_seq_pessoa_fisica", collection: "pat_manutencao" },
  dt_envio: { type: "string", field: "dt_envio", collection: "pat_manutencao" },
  dt_termino: { type: "string", field: "dt_termino", collection: "pat_manutencao" },
  ie_status_manutencao: { type: "string", field: "ie_status_manutencao", collection: "pat_manutencao" },
  vl_total: { type: "float64", field: "vl_total", collection: "pat_manutencao" },
  ds_observacao: { type: "string", field: "ds_observacao", collection: "pat_manutencao" },
  ds_motivo_manutencao: { type: "string", field: "ds_motivo_manutencao", collection: "pat_manutencao" },
  ds_correcoes: { type: "string", field: "ds_correcoes", collection: "pat_manutencao" },
  dt_criacao: { type: "string", field: "dt_criacao", collection: "pat_manutencao" },
  dt_alteracao: { type: "string", field: "dt_alteracao", collection: "pat_manutencao" },
} as const;

/** Labels dos campos para exibição. */
export const FIELD_LABELS: Record<string, string> = {
  nr_sequencia: "Sequência",
  nr_seq_ativo: "Ativo",
  nr_seq_pessoa_fisica: "Prestador",
  dt_envio: "Data de envio",
  dt_termino: "Data de término",
  ie_status_manutencao: "Status",
  vl_total: "Valor total",
  ds_observacao: "Observação",
  ds_motivo_manutencao: "Motivo da manutenção",
  ds_correcoes: "Correções",
  dt_criacao: "Criação",
  dt_alteracao: "Alteração",
};

/** Formata valor para exibição na tabela. */
export function formatCellValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "";
  if (key === "dt_envio" || key === "dt_termino" || key === "dt_criacao" || key === "dt_alteracao") {
    const str = String(value);
    if (!str) return "";
    try {
      const d = new Date(str);
      if (isNaN(d.getTime())) return str;
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return str;
    }
  }
  if (key === "vl_total") {
    const num = Number(value);
    if (isNaN(num)) return String(value);
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  if (key === "ie_status_manutencao") {
    const map: Record<string, string> = { E: "Em andamento", CO: "Concluída", CA: "Cancelada" };
    return map[String(value)] ?? String(value);
  }
  return String(value);
}
