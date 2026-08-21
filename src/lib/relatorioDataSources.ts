import type { DataSourceDef } from "@/types/relatorio";

/**
 * Fontes de dados disponíveis para relatórios.
 * Cada entrada mapeia uma coleção do Firestore aos seus campos.
 */
export const DATA_SOURCES: DataSourceDef[] = [
  {
    value: 'pat_ativos',
    label: 'Ativos (Patrimônio)',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'cd_patrimonio', label: 'Patrimônio', tipo: 'string' },
      { key: 'ds_ativo', label: 'Descrição', tipo: 'string' },
      { key: 'nr_seq_categoria', label: 'Categoria', tipo: 'number', isFK: true, fkColecao: 'cg_categoria_ativo', fkLabel: 'ds_categoria' },
      { key: 'nr_seq_localizacao', label: 'Localização', tipo: 'number', isFK: true, fkColecao: 'cg_localizacao', fkLabel: 'ds_localizacao' },
      { key: 'nr_seq_marca', label: 'Marca', tipo: 'number', isFK: true, fkColecao: 'cg_marca', fkLabel: 'ds_marca' },
      { key: 'ds_modelo', label: 'Modelo', tipo: 'string' },
      { key: 'nr_serie', label: 'Número de série', tipo: 'string' },
      { key: 'ds_qr_code', label: 'QR Code', tipo: 'string' },
      { key: 'ds_codigo_barras', label: 'Código de barras', tipo: 'string' },
      { key: 'dt_aquisicao', label: 'Data de aquisição', tipo: 'date' },
      { key: 'dt_garantia', label: 'Data de garantia', tipo: 'date' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_reativacao', label: 'Reativação', tipo: 'date' },
      { key: 'nr_seq_ultima_manutencao', label: 'Última manutenção', tipo: 'number' },
      { key: 'dt_descarte', label: 'Data do descarte', tipo: 'date' },
      { key: 'ds_descarte', label: 'Motivo do descarte', tipo: 'string' },
      { key: 'ds_processador', label: 'Processador', tipo: 'string' },
      { key: 'qt_ram', label: 'Memória RAM', tipo: 'number' },
      { key: 'ie_ram', label: 'Unidade RAM', tipo: 'string' },
      { key: 'qt_armazenamento', label: 'Armazenamento', tipo: 'number' },
      { key: 'ie_armazenamento', label: 'Unidade armazenamento', tipo: 'string' },
      { key: 'ds_endereco_mac', label: 'Endereço MAC', tipo: 'string' },
      { key: 'ds_ip', label: 'IPv4', tipo: 'string' },
      { key: 'nr_seq_sistema_operacional', label: 'Sistema operacional', tipo: 'number', isFK: true, fkColecao: 'cg_sistema_operacional', fkLabel: 'ds_sistema_operacional' },
      { key: 'ds_observacao', label: 'Observação', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'pat_manutencao',
    label: 'Manutenções',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'nr_seq_ativo', label: 'Ativo', tipo: 'number', isFK: true, fkColecao: 'pat_ativos', fkLabel: 'ds_ativo' },
      { key: 'nr_seq_pessoa_fisica', label: 'Prestador de serviço', tipo: 'number', isFK: true, fkColecao: 'pessoa_fisica', fkLabel: 'ds_nome' },
      { key: 'dt_envio', label: 'Data de envio', tipo: 'date' },
      { key: 'dt_termino', label: 'Data de término', tipo: 'date' },
      { key: 'ie_status_manutencao', label: 'Status', tipo: 'string' },
      { key: 'vl_total', label: 'Valor total', tipo: 'number' },
      { key: 'ds_motivo_manutencao', label: 'Motivo da manutenção', tipo: 'string' },
      { key: 'ds_correcoes', label: 'Correções', tipo: 'string' },
      { key: 'ds_observacao', label: 'Observação', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'pessoa_fisica',
    label: 'Pessoas Físicas',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_nome', label: 'Nome', tipo: 'string' },
      { key: 'ds_cpf', label: 'CPF', tipo: 'string' },
      { key: 'dt_nascimento', label: 'Data de nascimento', tipo: 'date' },
      { key: 'ds_email', label: 'E-mail', tipo: 'string' },
      { key: 'ds_telefone', label: 'Telefone', tipo: 'string' },
      { key: 'nr_seq_sexo', label: 'Sexo', tipo: 'number', isFK: true, fkColecao: 'cg_sexo', fkLabel: 'ds_sexo' },
      { key: 'nr_seq_estado_civil', label: 'Estado civil', tipo: 'number', isFK: true, fkColecao: 'cg_estado_civil', fkLabel: 'ds_estado_civil' },
      { key: 'nr_seq_cor_raca', label: 'Cor/Raça', tipo: 'number', isFK: true, fkColecao: 'cg_cor_raca', fkLabel: 'ds_cor_raca' },
      { key: 'nr_seq_profissao', label: 'Profissão', tipo: 'number', isFK: true, fkColecao: 'cg_profissao', fkLabel: 'ds_profissao' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'aluno',
    label: 'Alunos',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'nr_seq_pessoa_fisica', label: 'Pessoa física', tipo: 'number', isFK: true, fkColecao: 'pessoa_fisica', fkLabel: 'ds_nome' },
      { key: 'dt_ingresso', label: 'Data de ingresso', tipo: 'date' },
      { key: 'nr_seq_responsavel', label: 'Responsável', tipo: 'number', isFK: true, fkColecao: 'pessoa_fisica', fkLabel: 'ds_nome' },
      { key: 'ds_tipo_sanguineo', label: 'Tipo sanguíneo', tipo: 'string' },
      { key: 'ds_alergia', label: 'Alergia', tipo: 'string' },
      { key: 'ds_medicamento_continuo', label: 'Medicamento contínuo', tipo: 'string' },
      { key: 'ds_restricao_alimentar', label: 'Restrição alimentar', tipo: 'string' },
      { key: 'ds_necessidade_especial', label: 'Necessidade especial', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'colaborador',
    label: 'Colaboradores',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'nr_seq_pessoa_fisica', label: 'Pessoa física', tipo: 'number', isFK: true, fkColecao: 'pessoa_fisica', fkLabel: 'ds_nome' },
      { key: 'dt_admissao', label: 'Data de admissão', tipo: 'date' },
      { key: 'nr_seq_cargo', label: 'Cargo', tipo: 'number', isFK: true, fkColecao: 'cg_cargo', fkLabel: 'ds_cargo' },
      { key: 'nr_seq_vinculo_contratual', label: 'Vínculo contratual', tipo: 'number', isFK: true, fkColecao: 'cg_vinculo_contratual', fkLabel: 'ds_vinculo_contratual' },
      { key: 'ie_fornecedor', label: 'Fornecedor', tipo: 'string' },
      { key: 'ie_prestador_servico', label: 'Prestador de serviço', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'pessoa_juridica',
    label: 'Pessoas Jurídicas',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_razao_social', label: 'Razão social', tipo: 'string' },
      { key: 'ds_nome_fantasia', label: 'Nome fantasia', tipo: 'string' },
      { key: 'ds_cnpj', label: 'CNPJ', tipo: 'string' },
      { key: 'ds_email', label: 'E-mail', tipo: 'string' },
      { key: 'ds_telefone', label: 'Telefone', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'cg_categoria_ativo',
    label: 'Categorias (Ativo)',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_categoria', label: 'Descrição', tipo: 'string' },
      { key: 'ds_observacao', label: 'Observação', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
    ],
  },
  {
    value: 'cg_localizacao',
    label: 'Localizações',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_localizacao', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
    ],
  },
  {
    value: 'cg_marca',
    label: 'Marcas',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_marca', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
    ],
  },
  {
    value: 'cg_cargo',
    label: 'Cargos',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_cargo', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
    ],
  },
  {
    value: 'cg_sistema_operacional',
    label: 'Sistemas Operacionais',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_sistema_operacional', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
    ],
  },
];

/**
 * Obtém uma fonte de dados pelo valor da coleção.
 */
export function getDataSource(colecao: string): DataSourceDef | undefined {
  return DATA_SOURCES.find((ds) => ds.value === colecao);
}

/**
 * Obtém a definição de um campo específico de uma fonte de dados.
 */
export function getDataSourceCampo(colecao: string, chave: string): DataSourceCampo | undefined {
  const ds = getDataSource(colecao);
  return ds?.campos.find((c) => c.key === chave);
}

import type { DataSourceCampo } from "@/types/relatorio";
