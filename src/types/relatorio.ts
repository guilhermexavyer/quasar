/** 
 * Configuração de um relatório personalizado.
 * Armazenado na coleção 'relatorios' do Firestore.
 */
export interface Relatorio {
  id?: string;
  nr_sequencia: number;
  /** Nome do relatório. */
  ds_relatorio: string;
  /** Descrição/observação. */
  ds_observacao?: string;

  /* ── Fonte de dados ── */
  /** Coleção principal do Firestore (ex.: 'pat_ativo'). */
  colecao: string;
  /** Joins com outras coleções. */
  joins?: RelatorioJoin[];

  /* ── Campos ── */
  /** Campos selecionados para exibição no relatório. */
  campos: RelatorioCampo[];

  /* ── Filtros ── */
  /** Filtros aplicados aos dados. */
  filtros: RelatorioFiltro[];

  /* ── Ordenação ── */
  /** Ordenação dos registros. */
  ordenacao: RelatorioOrdenacao[];

  /* ── Agrupamento ── */
  /** Agrupamento de registros. */
  agrupamento?: RelatorioAgrupamento;

  /* ── Configuração de saída ── */
  /** Formato de saída: 'excel' ou 'pdf'. */
  formato: 'excel' | 'pdf';
  /** Configurações específicas para Excel. */
  configExcel?: RelatorioConfigExcel;
  /** Configurações específicas para PDF. */
  configPdf?: RelatorioConfigPdf;

  /* ── Espessura (PDF) ── */
  /** Espessura da linha do cabeçalho (label). */
  espessuraLabel?: number;
  /** Espessura da linha dos dados (campo). */
  espessuraCampo?: number;

  /* ── Metadados ── */
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}

/**
 * Join com outra coleção.
 * Permite trazer dados relacionados (ex.: categoria de um ativo).
 */
export interface RelatorioJoin {
  /** Identificador único do join (para referência nos campos). */
  id: string;
  /** Coleção alvo do join. */
  colecao: string;
  /** Campo na coleção principal que contém o nr_sequencia da coleção alvo. */
  campoChave: string;
  /** Alias para referência nos campos (ex.: 'categoria'). */
  alias: string;
  /** Tipo de join: 'left' mantém o registro principal mesmo sem correspondência. */
  tipo: 'left';
}

/**
 * Campo selecionado para exibição no relatório.
 */
export interface RelatorioCampo {
  /** Identificador único do campo. */
  id: string;
  /** Coleção de onde o campo vem (ex.: 'pat_ativo', 'cg_marca'). */
  colecao?: string;
  /** Chave do campo na coleção (ex.: 'ds_ativo'). Se vier de join, usar 'alias.campo'. */
  chave: string;
  /** Label exibido no cabeçalho da coluna. */
  label: string;
  /** Cor de fundo do label (cabeçalho). */
  backgroundLabel?: string;
  /** Cor do texto do label (cabeçalho). */
  corLabel?: string;
  /** Cor do texto do campo (dados). */
  corCampo?: string;
  /** Cor de fundo do campo (dados). */
  backgroundCampo?: string;
  /** Posição/ordem do campo no relatório. */
  posicao?: number;
  /** Largura da coluna (em caracteres para Excel, em pontos para PDF). */
  largura?: number;
  /** Distância em pixels da margem esquerda. */
  alinhamentoHorizontal?: number;
  /** Distância em pixels do topo da linha. */
  alinhamentoVertical?: number;
  /** Formatação especial do dado. */
  formatacao?: 'texto' | 'numero' | 'moeda' | 'data' | 'data_hora' | 'porcentagem';
  /** Casas decimais (apenas para número/moeda). */
  casasDecimais?: number;
  /** Se true, o campo é used como agrupador. */
  ehAgrupador?: boolean;
}

/**
 * Filtro aplicado aos dados do relatório.
 */
export interface RelatorioFiltro {
  /** Identificador único do filtro. */
  id: string;
  /** Chave do campo a ser filtrado. */
  campo: string;
  /** Operador de comparação. */
  operador: 'igual' | 'diferente' | 'maior' | 'menor' | 'maior_igual' | 'menor_igual' 
    | 'contem' | 'nao_contem' | 'inicia_com' | 'termina_com'
    | 'entre' | 'vazio' | 'nao_vazio';
  /** Valor de comparação (para operadores binários). */
  valor?: string;
  /** Valor final (para operador 'entre'). */
  valorFinal?: string;
  /** Conector lógico com o filtro anterior. */
  conector?: 'E' | 'OU';
}

/**
 * Ordenação dos registros.
 */
export interface RelatorioOrdenacao {
  /** Chave do campo por qual ordenar. */
  campo: string;
  /** Direção da ordenação. */
  direcao: 'asc' | 'desc';
}

/**
 * Agrupamento de registros.
 */
export interface RelatorioAgrupamento {
  /** Campo pelo qual agrupar. */
  campo: string;
  /** Se true, inclui subtotal ao final de cada grupo. */
  incluirSubtotal: boolean;
  /** Se true, inclui total geral ao final. */
  incluirTotalGeral: boolean;
}

/**
 * Configurações de saída para Excel.
 */
export interface RelatorioConfigExcel {
  /** Título do relatório (cabeçalho na primeira linha). */
  titulo?: string;
  /** Se true, inclui cabeçalho com título e data de geração. */
  incluirCabecalho: boolean;
  /** Se true, inclui rodapé com total de registros. */
  incluirRodape: boolean;
  /** Estilo do cabeçalho das colunas. */
  estiloCabecalho: 'preenchido' | 'borda' | 'nenhum';
  /** Cor de preenchimento do cabeçalho (hex sem #). */
  corCabecalho?: string;
  /** Cor do texto do cabeçalho. */
  corTextoCabecalho?: string;
  /** Se true, alterna cores nas linhas. */
  zebrado: boolean;
  /** Se true, inclui filtros automáticos nas colunas. */
  filtrosAutomaticos: boolean;
  /** Se true, congela a primeira linha (cabeçalho). */
  congelarPrimeiraLinha: boolean;
  /** Orientação da planilha. */
  orientacao: 'retrato' | 'paisagem';
}

/**
 * Configurações de saída para PDF.
 */
export interface RelatorioConfigPdf {
  /** Título do relatório. */
  titulo?: string;
  /** Subtítulo. */
  subtitulo?: string;
  /** Tamanho da página. */
  tamanhoPagina: 'A4' | 'A3' | 'A5' | 'letter' | 'legal';
  /** Orientação da página. */
  orientacao: 'retrato' | 'paisagem';
  /** Margens (em mm). */
  margens: {
    superior: number;
    inferior: number;
    esquerda: number;
    direita: number;
  };
  /** Configuração do cabeçalho. */
  cabecalho: {
    incluir: boolean;
    texto?: string;
    alinhamento?: 'esquerda' | 'centro' | 'direita';
    incluirData?: boolean;
    incluirNumeroPagina?: boolean;
  };
  /** Configuração do rodapé. */
  rodape: {
    incluir: boolean;
    texto?: string;
    alinhamento?: 'esquerda' | 'centro' | 'direita';
    incluirData?: boolean;
    incluirNumeroPagina?: boolean;
  };
  /** Se true, inclui bordas na tabela. */
  incluirBordas: boolean;
  /** Se true, alterna cores nas linhas. */
  zebrado: boolean;
  /** Cor de preenchimento alternada (hex). */
  corZebra?: string;
  /** Tamanho da fonte (em pt). */
  tamanhoFonte: number;
  /** Se true, agrupa por página quando há agrupamento. */
  quebraPaginaPorGrupo: boolean;
}

/** 
 * Definição de uma fonte de dados disponível para relatórios.
 * Usado internamente para popular o seletor de coleções.
 */
export interface DataSourceDef {
  /** Valor da coleção no Firestore. */
  value: string;
  /** Nome exibido ao usuário. */
  label: string;
  /** Campos disponíveis nesta coleção. */
  campos: DataSourceCampo[];
}

/**
 * Definição de um campo dentro de uma fonte de dados.
 */
export interface DataSourceCampo {
  /** Chave do campo. */
  key: string;
  /** Rótulo exibido. */
  label: string;
  /** Tipo do dado. */
  tipo: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  /** Se true, o campo é uma chave estrangeira (nr_seq_*). */
  isFK?: boolean;
  /** Coleção referenciada (se isFK). */
  fkColecao?: string;
  /** Campo exibido da coleção referenciada (ex.: 'ds_categoria'). */
  fkLabel?: string;
}
