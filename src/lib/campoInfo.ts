/** Campos gravados como lista no banco. */
const CAMPOS_LISTA = new Set([
  "responsaveis",
  "ds_alergia",
  "ds_medicamento_continuo",
  "ds_restricao_alimentar",
  "ds_necessidade_especial",
]);

/**
 * Tipo provável de uma coluna pelo padrão de nomenclatura, usado no infobutton
 * enquanto o tipo real (lido do banco em /api/esquema) não chega ou quando o
 * campo não é uma coluna: vl_ = numeric; nr_seq_* e nr_sequencia = bigint;
 * nr_ano e qt_ = integer; dt_ = date; listas conhecidas = jsonb; o restante
 * (inclusive nr_cpf, nr_matricula…) = text.
 */
export function tipoDoCampo(campo: string): string {
  if (CAMPOS_LISTA.has(campo)) return "jsonb";
  if (campo.startsWith("vl_")) return "numeric";
  if (campo.startsWith("nr_seq_") || campo === "nr_sequencia") return "bigint";
  if (campo.startsWith("qt_") || campo === "nr_ano") return "integer";
  if (campo.startsWith("dt_")) return "date";
  return "text";
}
