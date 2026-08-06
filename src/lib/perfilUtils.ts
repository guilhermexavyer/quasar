import type { Perfil } from "@/types/perfil";
import { formatDate } from "@/lib/pessoaFisicaUtils";

export type FuncaoId = "pessoaFisica" | "administracaoSistema" | "cadastrosGerais" | "estruturaAcademica";

export function parseFuncoesConfig(raw?: string | null): FuncaoId[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s) => s === "pessoaFisica" || s === "administracaoSistema" || s === "cadastrosGerais" || s === "estruturaAcademica"
    ) as FuncaoId[];
  } catch {
    return [];
  }
}

export interface PerfilColDef {
  key: keyof Perfil;
  label: string;
  dataClass?: string;
  headerClass?: string;
}

export const PERFIL_COLUMNS: PerfilColDef[] = [
  { key: 'nr_sequencia', label: '#', dataClass: 'text-center' },
  { key: 'ds_perfil', label: 'Perfil' },
  { key: 'ie_status', label: 'Status' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
];

export const PERFIL_FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'perfil' },
  ds_perfil: { type: 'string', field: 'ds_perfil', collection: 'perfil' },
  ds_observacao: { type: 'string', field: 'ds_observacao', collection: 'perfil' },
  ie_status: { type: 'string', field: 'ie_status', collection: 'perfil' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'perfil' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'perfil' },
} as const;

export function formatPerfilCellValue(key: keyof Perfil, value: unknown): string {
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
