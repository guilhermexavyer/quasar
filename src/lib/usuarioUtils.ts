import type { Usuario } from "@/types/usuario";
import { formatDate } from "@/lib/pessoaFisicaUtils";

export interface ColDef {
  key: keyof Usuario;
  label: string;
  dataClass?: string;
  headerClass?: string;
}

export const ADMIN_COLUMNS: ColDef[] = [
  { key: 'nr_sequencia', label: '#', dataClass: 'text-center' },
  { key: 'ds_usuario', label: 'Usuário' },
  { key: 'ds_usuario_alternativo', label: 'Usuário alternativo' },
  { key: 'nr_seq_pessoa_fisica', label: 'Pessoa física', dataClass: '' },
  { key: 'ie_status', label: 'Status' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
];

export const ADMIN_FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'usuario' },
  ds_usuario: { type: 'string', field: 'ds_usuario', collection: 'usuario' },
  ds_usuario_alternativo: { type: 'string', field: 'ds_usuario_alternativo', collection: 'usuario' },
  nr_seq_pessoa_fisica: { type: 'int64', field: 'nr_seq_pessoa_fisica', collection: 'usuario' },
  ie_status: { type: 'string', field: 'ie_status', collection: 'usuario' },
  ds_senha: { type: 'string', field: 'ds_senha', collection: 'usuario' },
  ds_observacao: { type: 'string', field: 'ds_observacao', collection: 'usuario' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'usuario' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'usuario' },
} as const;

export function formatAdminCellValue(key: keyof Usuario, value: unknown): string {
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
        case 'B':
          return 'Bloqueado';
        case 'I':
          return 'Inativo';
        default:
          return '';
      }
    default:
      return stringValue;
  }
}
