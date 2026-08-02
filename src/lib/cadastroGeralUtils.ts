import { formatDate } from "@/lib/pessoaFisicaUtils";

export function formatCadastroGeralCellValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (!stringValue) return '';

  switch (key) {
    case 'dt_criacao':
    case 'dt_alteracao':
      return formatDate(stringValue);
    case 'ie_status':
      switch (stringValue) {
        case 'A':
          return 'Ativo';
        case 'I':
          return 'Inativo';
        default:
          return '';
      }
    default:
      return stringValue;
  }
}
