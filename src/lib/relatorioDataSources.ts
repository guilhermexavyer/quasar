import type { DataSourceDef } from "@/types/relatorio";

/**
 * Fontes de dados disponíveis para relatórios.
 * Cada entrada mapeia uma coleção do Firestore aos seus campos.
 */
export const DATA_SOURCES: DataSourceDef[] = [
  // ════════════════════════════════════════════════════════════
  //  Patrimônio
  // ════════════════════════════════════════════════════════════
  {
    value: 'pat_ativo',
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
      { key: 'dt_ultima_manutencao', label: 'Última manutenção', tipo: 'date' },
      { key: 'nr_seq_ultima_manutencao', label: 'Nr. última manutenção', tipo: 'number' },
      { key: 'dt_status', label: 'Data do status', tipo: 'date' },
      { key: 'ds_motivo_status', label: 'Motivo do status', tipo: 'string' },
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
      { key: 'nr_seq_ativo', label: 'Ativo', tipo: 'number', isFK: true, fkColecao: 'pat_ativo', fkLabel: 'ds_ativo' },
      { key: 'nr_seq_prestador_servico', label: 'Prestador de serviço', tipo: 'number', isFK: true, fkColecao: 'colaborador', fkLabel: 'nr_sequencia' },
      { key: 'ds_prestador_servico', label: 'Prestador de serviço (nome)', tipo: 'string', computed: true },
      { key: 'dt_envio', label: 'Data de envio', tipo: 'date' },
      { key: 'dt_termino', label: 'Data de término', tipo: 'date' },
      { key: 'ie_status_manutencao', label: 'Status', tipo: 'string' },
      { key: 'vl_total', label: 'Valor total', tipo: 'string' },
      { key: 'ds_motivo_manutencao', label: 'Motivo da manutenção', tipo: 'string' },
      { key: 'ds_correcoes', label: 'Correções', tipo: 'string' },
      { key: 'ds_observacao', label: 'Observação', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'pat_param_codigo_patrimonio',
    label: 'Parâmetros do Código de Patrimônio',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_parametro', label: 'Parâmetro', tipo: 'string' },
      { key: 'ds_valor', label: 'Valor', tipo: 'string' },
      { key: 'ds_observacao', label: 'Observação', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  // ════════════════════════════════════════════════════════════
  //  Cadastro de Pessoas
  // ════════════════════════════════════════════════════════════
  {
    value: 'pessoa_fisica',
    label: 'Pessoas Físicas',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_nome', label: 'Nome', tipo: 'string' },
      { key: 'nr_cpf', label: 'CPF', tipo: 'string' },
      { key: 'dt_nascimento', label: 'Nascimento', tipo: 'date' },
      { key: 'ds_email', label: 'E-mail', tipo: 'string' },
      { key: 'nr_telefone', label: 'Telefone', tipo: 'string' },
      { key: 'nr_seq_sexo', label: 'Sexo', tipo: 'number', isFK: true, fkColecao: 'cg_sexo', fkLabel: 'ds_sexo' },
      { key: 'nr_seq_estado_civil', label: 'Estado civil', tipo: 'number', isFK: true, fkColecao: 'cg_estado_civil', fkLabel: 'ds_estado_civil' },
      { key: 'nr_seq_cor_raca', label: 'Cor/Raça', tipo: 'number', isFK: true, fkColecao: 'cg_cor_raca', fkLabel: 'ds_cor_raca' },
      { key: 'nr_seq_profissao', label: 'Profissão', tipo: 'number', isFK: true, fkColecao: 'cg_profissao', fkLabel: 'ds_profissao' },
      { key: 'nr_rg', label: 'RG', tipo: 'string' },
      { key: 'dt_emissao', label: 'Data de emissão RG', tipo: 'date' },
      { key: 'nr_seq_orgao_emissor', label: 'Órgão emissor', tipo: 'number', isFK: true, fkColecao: 'cg_orgao_emissor', fkLabel: 'ds_orgao_emissor' },
      { key: 'sg_estado', label: 'UF', tipo: 'string' },
      { key: 'cd_ibge_naturalidade', label: 'Naturalidade (IBGE)', tipo: 'string' },
      { key: 'nr_cep', label: 'CEP', tipo: 'string' },
      { key: 'ds_endereco', label: 'Endereço', tipo: 'string' },
      { key: 'nr_endereco', label: 'Número', tipo: 'string' },
      { key: 'ds_bairro', label: 'Bairro', tipo: 'string' },
      { key: 'ds_complemento', label: 'Complemento', tipo: 'string' },
      { key: 'nr_seq_logradouro', label: 'Logradouro', tipo: 'number', isFK: true, fkColecao: 'cg_logradouro', fkLabel: 'ds_logradouro' },
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
  // ════════════════════════════════════════════════════════════
  //  Estrutura Acadêmica
  // ════════════════════════════════════════════════════════════
  {
    value: 'aluno',
    label: 'Alunos',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'nr_seq_pessoa_fisica', label: 'Pessoa física', tipo: 'number', isFK: true, fkColecao: 'pessoa_fisica', fkLabel: 'ds_nome' },
      { key: 'nr_matricula', label: 'Matrícula', tipo: 'string' },
      { key: 'dt_ingresso', label: 'Data de ingresso', tipo: 'date' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_status', label: 'Data do status', tipo: 'date' },
      { key: 'ds_status', label: 'Descrição do status', tipo: 'string' },
      { key: 'ds_tipo_sanguineo', label: 'Tipo sanguíneo', tipo: 'string' },
      { key: 'ds_alergia', label: 'Alergia', tipo: 'string' },
      { key: 'ds_medicamento_continuo', label: 'Medicamento contínuo', tipo: 'string' },
      { key: 'ds_restricao_alimentar', label: 'Restrição alimentar', tipo: 'string' },
      { key: 'ds_necessidade_especial', label: 'Necessidade especial', tipo: 'string' },
      { key: 'ds_observacao_medica', label: 'Observação médica', tipo: 'string' },
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
      { key: 'nr_seq_pessoa_juridica', label: 'Pessoa jurídica', tipo: 'number', isFK: true, fkColecao: 'pessoa_juridica', fkLabel: 'ds_razao_social' },
      { key: 'nr_seq_vinculo_contratual', label: 'Vínculo contratual', tipo: 'number', isFK: true, fkColecao: 'cg_vinculo_contratual', fkLabel: 'ds_vinculo_contratual' },
      { key: 'nr_matricula', label: 'Matrícula', tipo: 'string' },
      { key: 'dt_admissao', label: 'Data de admissão', tipo: 'date' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_status', label: 'Data do status', tipo: 'date' },
      { key: 'ds_motivo_status', label: 'Motivo do status', tipo: 'string' },
      { key: 'ie_fornecedor', label: 'Fornecedor', tipo: 'string' },
      { key: 'ie_prestador_servico', label: 'Prestador de serviço', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  // ════════════════════════════════════════════════════════════
  //  Administração do Sistema
  // ════════════════════════════════════════════════════════════
  {
    value: 'usuario',
    label: 'Usuários',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'nr_seq_pessoa_fisica', label: 'Pessoa física', tipo: 'number', isFK: true, fkColecao: 'pessoa_fisica', fkLabel: 'ds_nome' },
      { key: 'ds_usuario', label: 'Usuário', tipo: 'string' },
      { key: 'ds_usuario_alternativo', label: 'Usuário alternativo', tipo: 'string' },
      { key: 'ds_email', label: 'E-mail', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'ds_observacao', label: 'Observação', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'perfil',
    label: 'Perfis',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_perfil', label: 'Perfil', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'ds_observacao', label: 'Observação', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'relatorio',
    label: 'Relatórios',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_relatorio', label: 'Relatório', tipo: 'string' },
      { key: 'colecao', label: 'Coleção', tipo: 'string' },
      { key: 'formato', label: 'Formato', tipo: 'string' },
      { key: 'ds_observacao', label: 'Observação', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  // ════════════════════════════════════════════════════════════
  //  Cadastros Gerais — Sexo
  // ════════════════════════════════════════════════════════════
  {
    value: 'cg_sexo',
    label: 'Sexo',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_sexo', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'cg_estado_civil',
    label: 'Estado Civil',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_estado_civil', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'cg_cor_raca',
    label: 'Cor/Raça',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_cor_raca', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'cg_profissao',
    label: 'Profissões',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_profissao', label: 'Descrição', tipo: 'string' },
      { key: 'nr_cbo', label: 'CBO', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'cg_vinculo_contratual',
    label: 'Vínculos Contratuais',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_vinculo_contratual', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'cg_orgao_emissor',
    label: 'Órgãos Emissores',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'sg_orgao_emissor', label: 'Sigla', tipo: 'string' },
      { key: 'ds_orgao_emissor', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'cg_grau_parentesco',
    label: 'Graus de Parentesco',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_grau_parentesco', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'cg_logradouro',
    label: 'Logradouros',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'sg_logradouro', label: 'Sigla', tipo: 'string' },
      { key: 'ds_logradouro', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
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
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'cg_localizacao',
    label: 'Localizações',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_localizacao', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'cg_marca',
    label: 'Marcas',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_marca', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'cg_cargo',
    label: 'Cargos',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_cargo', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
    ],
  },
  {
    value: 'cg_sistema_operacional',
    label: 'Sistemas Operacionais',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', tipo: 'number' },
      { key: 'ds_sistema_operacional', label: 'Descrição', tipo: 'string' },
      { key: 'ie_status', label: 'Status', tipo: 'string' },
      { key: 'dt_criacao', label: 'Data de criação', tipo: 'date' },
      { key: 'dt_alteracao', label: 'Data de alteração', tipo: 'date' },
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

/**
 * Mapeamento de campos ie_status por coleção.
 * Chave: coleção. Valor: mapa de abreviação → label.
 */
export const STATUS_LABEL_MAP: Record<string, Record<string, string>> = {
  pat_ativo: { D: 'Descartado', E: 'Estoque', M: 'Manutenção', O: 'Operacional' },
  pat_manutencao: { E: 'Em andamento', CO: 'Concluída', CA: 'Cancelada' },
  aluno: { A: 'Ativo', I: 'Inativo', C: 'Cancelado', T: 'Transferido' },
  colaborador: { A: 'Ativo', AF: 'Afastado', F: 'Férias', L: 'Licença', D: 'Desligado' },
  usuario: { A: 'Ativo', I: 'Inativo' },
  perfil: { A: 'Ativo', I: 'Inativo' },
  cg_sexo: { A: 'Ativo', I: 'Inativo' },
  cg_estado_civil: { A: 'Ativo', I: 'Inativo' },
  cg_cor_raca: { A: 'Ativo', I: 'Inativo' },
  cg_profissao: { A: 'Ativo', I: 'Inativo' },
  cg_vinculo_contratual: { A: 'Ativo', I: 'Inativo' },
  cg_orgao_emissor: { A: 'Ativo', I: 'Inativo' },
  cg_grau_parentesco: { A: 'Ativo', I: 'Inativo' },
  cg_logradouro: { A: 'Ativo', I: 'Inativo' },
  cg_categoria_ativo: { A: 'Ativo', I: 'Inativo' },
  cg_localizacao: { A: 'Ativo', I: 'Inativo' },
  cg_marca: { A: 'Ativo', I: 'Inativo' },
  cg_cargo: { A: 'Ativo', I: 'Inativo' },
  cg_sistema_operacional: { A: 'Ativo', I: 'Inativo' },
};

/**
 * Resolve o valor de um campo ie_status para o label do sistema.
 */
export function resolverStatusLabel(colecao: string, valor: string): string {
  const map = STATUS_LABEL_MAP[colecao];
  if (!map) return valor;
  return map[valor] ?? valor;
}
