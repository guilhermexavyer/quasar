/** Campos gravados como lista (array) no banco. */
const CAMPOS_ARRAY = new Set([
  "responsaveis",
  "ds_alergia",
  "ds_medicamento_continuo",
  "ds_restricao_alimentar",
  "ds_necessidade_especial",
]);

/**
 * Tipo de um campo do banco pelo padrão de nomenclatura (o mesmo dos
 * FIELD_INFOS): vl_ = float64; nr_seq_*, nr_sequencia, nr_ano e qt_ = int64;
 * listas conhecidas = array; o restante (inclusive nr_cpf, nr_matricula…) = string.
 */
export function tipoDoCampo(campo: string): string {
  if (CAMPOS_ARRAY.has(campo)) return "array";
  if (campo.startsWith("vl_")) return "float64";
  if (/^(nr_seq_|qt_)/.test(campo) || campo === "nr_sequencia" || campo === "nr_ano") return "int64";
  return "string";
}
