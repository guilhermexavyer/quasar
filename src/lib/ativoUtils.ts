import type { Ativo } from "@/types/ativo";
import { formatDate } from "@/lib/pessoaFisicaUtils";
import { isValidOrder, parseColunasConfig, serializeColunasConfig, type ColunasConfig } from "@/lib/colunasUtils";

export { formatDate, applyDateMask } from "@/lib/pessoaFisicaUtils";

/** Máscara de valor monetário pt-BR: dígitos viram centavos (ex.: 123456 → 1.234,56). */
export function applyMoneyMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  // Sem dígitos ou só zeros (ex.: apagando "0,00") → campo vazio, permitindo limpar o valor.
  if (!digits || Number(digits) === 0) return '';
  return (Number(digits) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Máscara IPv4: ###.###.###.### — aceita apenas dígitos e insere pontos automaticamente. */
export function applyIPv4Mask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 12);
  const groups: string[] = [];
  for (let i = 0; i < digits.length; i += 3) {
    groups.push(digits.slice(i, i + 3));
  }
  return groups.join('.');
}

export interface ColDef {
  key: keyof Ativo;
  label: string;
  headerLabel?: string;
  dataClass?: string;
  headerClass?: string;
}

export const ATIVO_COLUMNS: ColDef[] = [
  { key: 'nr_sequencia', label: '#', dataClass: 'text-right' },
  { key: 'ds_ativo', label: 'Descrição' },
  { key: 'nr_seq_categoria', label: 'Categoria' },
  { key: 'nr_seq_localizacao', label: 'Localização' },
  { key: 'nr_seq_marca', label: 'Marca' },
  { key: 'ds_modelo', label: 'Modelo' },
  { key: 'nr_serie', label: 'Número de série' },
  { key: 'ds_qr_code', label: 'QR Code' },
  { key: 'ds_codigo_barras', label: 'Código de barras' },
  { key: 'ie_status', label: '', dataClass: 'text-center' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
  { key: 'ds_usuario_criacao', label: 'Usuário criação' },
  { key: 'ds_usuario_alteracao', label: 'Usuário alteração' },
  // Colunas novas entram no fim: a ordem/largura salvas são por índice.
  { key: 'cd_patrimonio_externo', label: 'Código externo' },
];

export const FIELD_INFOS = {
  nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'pat_ativo' },
  cd_patrimonio_externo: { type: 'string', field: 'cd_patrimonio_externo', collection: 'pat_ativo' },
  ds_ativo: { type: 'string', field: 'ds_ativo', collection: 'pat_ativo' },
  nr_seq_categoria: { type: 'int64', field: 'nr_seq_categoria', collection: 'pat_ativo' },
  nr_seq_localizacao: { type: 'int64', field: 'nr_seq_localizacao', collection: 'pat_ativo' },
  nr_seq_marca: { type: 'int64', field: 'nr_seq_marca', collection: 'pat_ativo' },
  ds_modelo: { type: 'string', field: 'ds_modelo', collection: 'pat_ativo' },
  nr_serie: { type: 'string', field: 'nr_serie', collection: 'pat_ativo' },
  ds_qr_code: { type: 'string', field: 'ds_qr_code', collection: 'pat_ativo' },
  ds_codigo_barras: { type: 'string', field: 'ds_codigo_barras', collection: 'pat_ativo' },
  vl_aquisicao: { type: 'string', field: 'vl_aquisicao', collection: 'pat_ativo' },
  dt_aquisicao: { type: 'string', field: 'dt_aquisicao', collection: 'pat_ativo' },
  dt_garantia: { type: 'string', field: 'dt_garantia', collection: 'pat_ativo' },
  ie_status: { type: 'string', field: 'ie_status', collection: 'pat_ativo' },
  dt_ultima_manutencao: { type: 'string', field: 'dt_ultima_manutencao', collection: 'pat_ativo' },
  nr_seq_ultima_manutencao: { type: 'int64', field: 'nr_seq_ultima_manutencao', collection: 'pat_ativo' },
  dt_status: { type: 'string', field: 'dt_status', collection: 'pat_ativo' },
  ds_motivo_status: { type: 'string', field: 'ds_motivo_status', collection: 'pat_ativo' },
  ds_processador: { type: 'string', field: 'ds_processador', collection: 'pat_ativo' },
  qt_ram: { type: 'int64', field: 'qt_ram', collection: 'pat_ativo' },
  ie_ram: { type: 'string', field: 'ie_ram', collection: 'pat_ativo' },
  qt_armazenamento: { type: 'int64', field: 'qt_armazenamento', collection: 'pat_ativo' },
  ie_armazenamento: { type: 'string', field: 'ie_armazenamento', collection: 'pat_ativo' },
  ds_endereco_mac: { type: 'string', field: 'ds_endereco_mac', collection: 'pat_ativo' },
  ds_ip: { type: 'string', field: 'ds_ip', collection: 'pat_ativo' },
  nr_seq_sistema_operacional: { type: 'int64', field: 'nr_seq_sistema_operacional', collection: 'pat_ativo' },
  cd_placa: { type: 'string', field: 'cd_placa', collection: 'pat_ativo' },
  cd_renavam: { type: 'string', field: 'cd_renavam', collection: 'pat_ativo' },
  nr_ano: { type: 'int64', field: 'nr_ano', collection: 'pat_ativo' },
  ds_cor: { type: 'string', field: 'ds_cor', collection: 'pat_ativo' },
  nr_seq_combustivel: { type: 'int64', field: 'nr_seq_combustivel', collection: 'pat_ativo' },
  responsaveis: { type: 'array', field: 'responsaveis', collection: 'pat_ativo' },
  ds_observacao: { type: 'string', field: 'ds_observacao', collection: 'pat_ativo' },
  dt_criacao: { type: 'string', field: 'dt_criacao', collection: 'pat_ativo' },
  dt_alteracao: { type: 'string', field: 'dt_alteracao', collection: 'pat_ativo' },
} as const;

export const FIELD_LABELS: Record<string, string> = {
  nr_sequencia: 'Sequência',
  cd_patrimonio_externo: 'Código externo',
  ds_ativo: 'Descrição',
  nr_seq_categoria: 'Categoria',
  nr_seq_localizacao: 'Localização',
  nr_seq_marca: 'Marca',
  ds_modelo: 'Modelo',
  nr_serie: 'Número de série',
  ds_qr_code: 'QR Code',
  ds_codigo_barras: 'Código de barras',
  vl_aquisicao: 'Valor de aquisição',
  dt_aquisicao: 'Data de aquisição',
  dt_garantia: 'Data de garantia',
  ie_status: 'Status',
  dt_ultima_manutencao: 'Última manutenção',
  nr_seq_ultima_manutencao: 'Última manutenção',
  dt_status: 'Data do status',
  ds_motivo_status: 'Motivo do status',
  ds_processador: 'Processador',
  qt_ram: 'Memória RAM',
  ie_ram: 'Unidade',
  qt_armazenamento: 'Armazenamento',
  ie_armazenamento: 'Unidade',
  ds_endereco_mac: 'Endereço MAC',
  ds_ip: 'IP',
  nr_seq_sistema_operacional: 'Sistema operacional',
  cd_placa: 'Placa',
  cd_renavam: 'Renavam',
  nr_ano: 'Ano',
  ds_cor: 'Cor',
  nr_seq_combustivel: 'Combustível',
  responsaveis: 'Responsável',
  ds_observacao: 'Observação',
  dt_criacao: 'Criação',
  dt_alteracao: 'Alteração',
};

/** Status possíveis do ativo (dropdown Status). */
export const STATUS_OPTIONS = [
  { value: 'D', label: 'Descartado' },
  { value: 'E', label: 'Estoque' },
  { value: 'M', label: 'Manutenção' },
  { value: 'O', label: 'Operacional' },
];

/**
 * Cores padrão da bolinha de status (coluna Status da lista), usadas enquanto
 * a cor não for configurada em Patrimônio > Parâmetros.
 */
export const CORES_STATUS_ATIVO_PADRAO: Record<'D' | 'E' | 'M' | 'O', string> = {
  D: '#999999',
  E: '#3b82f6',
  M: '#f59e0b',
  O: '#2cc958',
};

export function formatCellValue(key: keyof Ativo, value: unknown): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (!stringValue) return '';

  switch (key) {
    case 'dt_criacao':
    case 'dt_alteracao':
      return formatDate(stringValue);
    case 'ie_status':
      switch (stringValue) {
        case 'D':
          return 'Descartado';
        case 'E':
          return 'Estoque';
        case 'M':
          return 'Manutenção';
        case 'O':
          return 'Operacional';
        default:
          return '';
      }
    default:
      return stringValue;
  }
}

/**
 * Configuração de colunas de Ativos (por índice). A coluna Patrimônio
 * (cd_patrimonio), que ficava no índice 1, foi removida: configurações salvas
 * antes disso (sem a marca semPatrimonio) têm esse índice retirado ao carregar,
 * preservando a ordem e as larguras das demais colunas.
 */
export function lerColunasAtivo(raw?: string | null): ColunasConfig | null {
  const config = parseColunasConfig(raw);
  if (!config) return null;
  let semPatrimonio = false;
  try {
    semPatrimonio = (JSON.parse(raw as string) as { semPatrimonio?: unknown }).semPatrimonio === true;
  } catch {
    return null;
  }
  if (semPatrimonio) return config;
  if (config.order.length < 2 || !isValidOrder(config.order, config.order.length)) return null;
  const order = config.order.filter((i) => i !== 1).map((i) => (i > 1 ? i - 1 : i));
  const widths = config.widths.length === config.order.length ? config.widths.filter((_, i) => i !== 1) : [];
  return { order, widths, v: config.v };
}

/** Serializa a configuração de colunas de Ativos já no formato sem Patrimônio. */
export function serializarColunasAtivo(order: number[], widths: number[]): string {
  return JSON.stringify({ ...JSON.parse(serializeColunasConfig(order, widths)), semPatrimonio: true });
}
