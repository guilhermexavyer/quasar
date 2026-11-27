import { COLUMNS as PF_COLUMNS, formatCellValue as formatPf, formatDate } from "@/lib/pessoaFisicaUtils";
import { PJ_COLUMNS, formatCellValuePj } from "@/lib/pessoaJuridicaUtils";
import { ALUNO_COLUMNS, formatCellValue as formatAluno } from "@/lib/alunoUtils";
import { COLABORADOR_COLUMNS, formatCellValue as formatColaborador } from "@/lib/colaboradorUtils";
import { PERIODO_LETIVO_COLUMNS, formatCellValue as formatPeriodoLetivo } from "@/lib/periodoLetivoUtils";
import { ATIVO_COLUMNS, formatCellValue as formatAtivo } from "@/lib/ativoUtils";
import { MANUTENCAO_COLUMNS, formatCellValue as formatManutencao } from "@/lib/manutencaoUtils";
import { CATEGORIA_ATIVO_COLUMNS } from "@/lib/categoriaAtivoUtils";
import { CURSO_COLUMNS } from "@/lib/cursoUtils";
import { DISCIPLINA_COLUMNS } from "@/lib/disciplinaUtils";
import { TURMA_COLUMNS } from "@/lib/turmaUtils";
import { TURMA_DISCIPLINA_COLUMNS } from "@/lib/turmaDisciplinaUtils";
import { MODALIDADE_ENSINO_COLUMNS } from "@/lib/modalidadeEnsinoUtils";
import { FORMATO_PAPEL_COLUMNS } from "@/lib/formatoPapelUtils";
import { TIPO_PAPEL_COLUMNS } from "@/lib/tipoPapelUtils";
import { COPIA_COLUMNS, formatCopiaCellValue } from "@/lib/copiaUtils";
import { formatCadastroGeralCellValue } from "@/lib/cadastroGeralUtils";
import { ADMIN_COLUMNS, formatAdminCellValue } from "@/lib/usuarioUtils";
import { PERFIL_COLUMNS, formatPerfilCellValue } from "@/lib/perfilUtils";
import { CARGO_COLUMNS } from "@/lib/cargoUtils";
import { COR_RACA_COLUMNS } from "@/lib/corRacaUtils";
import { ESTADO_CIVIL_COLUMNS } from "@/lib/estadoCivilUtils";
import { GRAU_PARENTESCO_COLUMNS } from "@/lib/grauParentescoUtils";
import { LOCALIZACAO_COLUMNS } from "@/lib/localizacaoUtils";
import { LOGRADOURO_COLUMNS } from "@/lib/logradouroUtils";
import { COMBUSTIVEL_COLUMNS } from "@/lib/combustivelUtils";
import { MARCA_COLUMNS } from "@/lib/marcaUtils";
import { ORGAO_EMISSOR_COLUMNS } from "@/lib/orgaoEmissorUtils";
import { PROFISSAO_COLUMNS } from "@/lib/profissaoUtils";
import { SEXO_COLUMNS } from "@/lib/sexoUtils";
import { SISTEMA_OPERACIONAL_COLUMNS } from "@/lib/sistemaOperacionalUtils";
import { VINCULO_CONTRATUAL_COLUMNS } from "@/lib/vinculoContratualUtils";
import { rotuloTipoFeriado } from "@/lib/periodoLetivoFeriadoUtils";
import { rotuloStatusRelacionamento } from "@/lib/relacionamentoUtils";

/** Coluna da tabela de registros excluídos. */
export interface ColunaExclusao {
  key: string;
  label: string;
  alinharDireita?: boolean;
}

/** Função/submódulo cujos registros excluídos podem ser consultados. */
export interface FuncaoExclusao {
  /** Tabela do banco (também é o id da linha). */
  colecao: string;
  funcao: string;
  dropdown: string;
  /** Colunas próprias do registro (as de log e de exclusão são acrescentadas no fim). */
  colunas: ColunaExclusao[];
  /** Formata o valor de uma coluna própria. */
  formatar?: (key: string, value: unknown) => string;
}

const COLUNAS_LOG = new Set(["dt_criacao", "dt_alteracao", "ds_usuario_criacao", "ds_usuario_alteracao"]);

/** Colunas da lista da função, sem as de log (entram no fim, junto com as de exclusão). */
function proprias(cols: { key: string; label: string; dataClass?: string }[], rotulos: Record<string, string> = {}): ColunaExclusao[] {
  return cols
    .filter((c) => !COLUNAS_LOG.has(String(c.key)))
    .map((c) => ({
      key: String(c.key),
      label: rotulos[String(c.key)] ?? (c.label || (String(c.key) === "ie_status" || String(c.key) === "ie_status_manutencao" ? "Status" : String(c.key))),
      alinharDireita: c.dataClass?.includes("text-right"),
    }));
}

type Formatador = (key: string, value: unknown) => string;
const f = (fn: (key: never, value: unknown) => string): Formatador => fn as unknown as Formatador;

const CG = (colecao: string, dropdown: string, cols: { key: string; label: string; dataClass?: string }[]): FuncaoExclusao => ({
  colecao, funcao: "Cadastros Gerais", dropdown, colunas: proprias(cols), formatar: formatCadastroGeralCellValue,
});

const SEQ: ColunaExclusao = { key: "nr_sequencia", label: "#", alinharDireita: true };

/** Funções do sistema com registros excluídos (container da esquerda). */
export const FUNCOES_EXCLUSAO: FuncaoExclusao[] = [
  { colecao: "usuario", funcao: "Administração do Sistema", dropdown: "Usuários", colunas: proprias(ADMIN_COLUMNS), formatar: f(formatAdminCellValue) },
  { colecao: "perfil", funcao: "Administração do Sistema", dropdown: "Perfis", colunas: proprias(PERFIL_COLUMNS), formatar: f(formatPerfilCellValue) },
  {
    colecao: "imagem", funcao: "Administração do Sistema", dropdown: "Imagens",
    colunas: [SEQ, { key: "ds_imagem", label: "Descrição" }, { key: "ie_arquivo", label: "Arquivo" }],
  },
  { colecao: "pessoa_fisica", funcao: "Pessoas e Relacionamentos", dropdown: "Pessoas Físicas", colunas: proprias(PF_COLUMNS), formatar: f(formatPf) },
  { colecao: "pessoa_juridica", funcao: "Pessoas e Relacionamentos", dropdown: "Pessoas Jurídicas", colunas: proprias(PJ_COLUMNS), formatar: f(formatCellValuePj) },
  CG("cargo", "Cargo", CARGO_COLUMNS),
  CG("combustivel", "Combustível", COMBUSTIVEL_COLUMNS),
  CG("cor_raca", "Cor/Raça", COR_RACA_COLUMNS),
  CG("estado_civil", "Estado civil", ESTADO_CIVIL_COLUMNS),
  CG("formato_papel", "Formato do papel", FORMATO_PAPEL_COLUMNS),
  CG("grau_parentesco", "Grau de parentesco", GRAU_PARENTESCO_COLUMNS),
  CG("localizacao", "Localização", LOCALIZACAO_COLUMNS),
  CG("logradouro", "Logradouro", LOGRADOURO_COLUMNS),
  CG("marca", "Marca", MARCA_COLUMNS),
  CG("modalidade_ensino", "Modalidade de ensino", MODALIDADE_ENSINO_COLUMNS),
  CG("orgao_emissor", "Órgão emissor", ORGAO_EMISSOR_COLUMNS),
  CG("profissao", "Profissão", PROFISSAO_COLUMNS),
  CG("sexo", "Sexo", SEXO_COLUMNS),
  CG("sistema_operacional", "Sistema operacional", SISTEMA_OPERACIONAL_COLUMNS),
  CG("tipo_papel", "Tipo de papel", TIPO_PAPEL_COLUMNS),
  CG("vinculo_contratual", "Vínculo contratual", VINCULO_CONTRATUAL_COLUMNS),
  { colecao: "copia", funcao: "Controle de Cópias", dropdown: "Cópias", colunas: proprias(COPIA_COLUMNS.filter((c) => !c.clipe)), formatar: formatCopiaCellValue },
  { colecao: "aluno", funcao: "Pessoas e Relacionamentos", dropdown: "Alunos", colunas: proprias(ALUNO_COLUMNS), formatar: f(formatAluno) },
  {
    colecao: "aluno_responsavel", funcao: "Pessoas e Relacionamentos", dropdown: "Alunos > Responsáveis",
    colunas: [SEQ, { key: "nr_seq_aluno", label: "Aluno", alinharDireita: true }, { key: "nr_seq_pessoa_fisica", label: "Pessoa física" }, { key: "nr_seq_grau_parentesco", label: "Grau de parentesco" }],
  },
  { colecao: "curso", funcao: "Estrutura Acadêmica", dropdown: "Cursos", colunas: proprias(CURSO_COLUMNS), formatar: formatCadastroGeralCellValue },
  { colecao: "disciplina", funcao: "Estrutura Acadêmica", dropdown: "Disciplinas", colunas: proprias(DISCIPLINA_COLUMNS), formatar: formatCadastroGeralCellValue },
  { colecao: "turma", funcao: "Estrutura Acadêmica", dropdown: "Turmas", colunas: proprias(TURMA_COLUMNS), formatar: formatCadastroGeralCellValue },
  { colecao: "turma_disciplina", funcao: "Estrutura Acadêmica", dropdown: "Turmas x Disciplinas", colunas: proprias(TURMA_DISCIPLINA_COLUMNS), formatar: formatCadastroGeralCellValue },
  { colecao: "colaborador", funcao: "Pessoas e Relacionamentos", dropdown: "Colaboradores", colunas: proprias(COLABORADOR_COLUMNS), formatar: f(formatColaborador) },
  {
    colecao: "fornecedor", funcao: "Pessoas e Relacionamentos", dropdown: "Fornecedores",
    colunas: [SEQ, { key: "nr_seq_pessoa_fisica", label: "Pessoa física" }, { key: "nr_seq_pessoa_juridica", label: "Pessoa jurídica" }, { key: "ie_status", label: "Status" }],
    formatar: (key, value) => (key === "ie_status" ? rotuloStatusRelacionamento(String(value ?? "")) : String(value ?? "")),
  },
  {
    colecao: "prestador_servico", funcao: "Pessoas e Relacionamentos", dropdown: "Prestadores de Serviço",
    colunas: [SEQ, { key: "nr_seq_pessoa_fisica", label: "Pessoa física" }, { key: "nr_seq_pessoa_juridica", label: "Pessoa jurídica" }, { key: "ie_status", label: "Status" }],
    formatar: (key, value) => (key === "ie_status" ? rotuloStatusRelacionamento(String(value ?? "")) : String(value ?? "")),
  },
  {
    colecao: "equipe", funcao: "Pessoas e Relacionamentos", dropdown: "Equipes",
    colunas: [SEQ, { key: "ds_equipe", label: "Descrição" }, { key: "ie_status", label: "Status" }],
    formatar: (key, value) => (key === "ie_status" ? rotuloStatusRelacionamento(String(value ?? "")) : String(value ?? "")),
  },
  {
    colecao: "equipe_membro", funcao: "Pessoas e Relacionamentos", dropdown: "Equipes > Membros",
    colunas: [SEQ, { key: "nr_seq_equipe", label: "Equipe", alinharDireita: true }, { key: "nr_seq_colaborador", label: "Colaborador" }, { key: "nr_seq_fornecedor", label: "Fornecedor" }, { key: "nr_seq_prestador_servico", label: "Prestador de serviço" }],
  },
  { colecao: "periodo_letivo", funcao: "Estrutura Acadêmica", dropdown: "Período letivo", colunas: proprias(PERIODO_LETIVO_COLUMNS), formatar: f(formatPeriodoLetivo) },
  {
    colecao: "periodo_letivo_feriado", funcao: "Estrutura Acadêmica", dropdown: "Período letivo > Feriados",
    colunas: [SEQ, { key: "nr_seq_periodo_letivo", label: "Período letivo", alinharDireita: true }, { key: "dt_feriado", label: "Data" }, { key: "ds_feriado", label: "Descrição" }, { key: "ie_tipo_feriado", label: "Tipo" }],
    formatar: (key, value) => (key === "ie_tipo_feriado" ? rotuloTipoFeriado(String(value ?? "")) : String(value ?? "")),
  },
  {
    colecao: "relatorio", funcao: "Gerenciador de Relatórios", dropdown: "Relatórios",
    colunas: [SEQ, { key: "ds_relatorio", label: "Descrição" }],
  },
  {
    colecao: "relatorio_importacao", funcao: "Gerenciador de Relatórios", dropdown: "Importar relatório",
    colunas: [SEQ, { key: "ds_arquivo", label: "Arquivo" }, { key: "nr_seq_relatorio", label: "Sequência do relatório", alinharDireita: true }, { key: "ds_relatorio", label: "Descrição do relatório" }],
  },
  {
    colecao: "relatorio_banda", funcao: "Gerenciador de Relatórios", dropdown: "Relatórios > Bandas",
    colunas: [SEQ, { key: "nr_seq_relatorio", label: "Relatório", alinharDireita: true }, { key: "ds_banda", label: "Descrição" }, { key: "ie_tipo_banda", label: "Tipo" }],
  },
  {
    colecao: "relatorio_banda_elemento", funcao: "Gerenciador de Relatórios", dropdown: "Relatórios > Bandas > Elementos",
    colunas: [SEQ, { key: "nr_seq_relatorio", label: "Relatório", alinharDireita: true }, { key: "nr_seq_banda", label: "Banda", alinharDireita: true }, { key: "ds_elemento", label: "Descrição" }, { key: "ie_tipo_elemento", label: "Tipo" }],
  },
  {
    colecao: "relatorio_parametro", funcao: "Gerenciador de Relatórios", dropdown: "Relatórios > Parâmetros",
    colunas: [SEQ, { key: "nr_seq_relatorio", label: "Relatório", alinharDireita: true }, { key: "ie_colecao", label: "Coleção" }, { key: "ie_campo", label: "Campo" }, { key: "ds_label", label: "Label" }],
  },
  { colecao: "ativo", funcao: "Patrimônio", dropdown: "Ativos", colunas: proprias(ATIVO_COLUMNS), formatar: f(formatAtivo) },
  {
    colecao: "ativo_responsavel", funcao: "Patrimônio", dropdown: "Ativos > Responsáveis",
    colunas: [SEQ, { key: "nr_seq_ativo", label: "Ativo", alinharDireita: true }, { key: "nr_seq_colaborador", label: "Colaborador" }],
  },
  { colecao: "categoria", funcao: "Patrimônio", dropdown: "Categoria", colunas: proprias(CATEGORIA_ATIVO_COLUMNS), formatar: formatCadastroGeralCellValue },
  { colecao: "manutencao", funcao: "Patrimônio", dropdown: "Manutenções", colunas: proprias(MANUTENCAO_COLUMNS), formatar: formatManutencao },
];

/** Colunas de log e de exclusão (sempre no fim da tabela de registros excluídos). */
export const COLUNAS_LOG_EXCLUSAO: ColunaExclusao[] = [
  { key: "dt_criacao", label: "Criação" },
  { key: "dt_alteracao", label: "Alteração" },
  { key: "ds_usuario_criacao", label: "Usuário criação" },
  { key: "ds_usuario_alteracao", label: "Usuário alteração" },
  { key: "dt_exclusao", label: "Exclusão" },
  { key: "ds_usuario_exclusao", label: "Usuário exclusão" },
  { key: "ds_perfil_exclusao", label: "Perfil" },
];

export { formatDate };

/** Aba de registros-filhos de um registro excluído (duplo clique, como nas telas originais). */
export interface AbaFilhosExclusao {
  aba: string;
  /** Coleção dos filhos (registros excluídos) e o campo que aponta para o pai (nr_sequencia). */
  colecao?: string;
  campoPai?: string;
  /** Ordenação da banda: fica dentro do próprio registro (dados.ordenacao). */
  ordenacao?: true;
  /** Aba condicional (ex.: Ordenação só para banda do tipo Lista). */
  mostrar?: (dados: Record<string, unknown>) => boolean;
}

/**
 * Registros que abrem outra tela com duplo clique: aluno (responsáveis), período letivo (feriados), ativo (responsáveis),
 * relatório (bandas e parâmetros) e banda (elementos e ordenação).
 */
export const FILHOS_EXCLUSAO: Record<string, { rotulo: string; campoDescricao: string; abas: AbaFilhosExclusao[] }> = {
  aluno: {
    rotulo: "Aluno",
    campoDescricao: "nr_matricula",
    abas: [{ aba: "Responsáveis", colecao: "aluno_responsavel", campoPai: "nr_seq_aluno" }],
  },
  ativo: {
    rotulo: "Ativo",
    campoDescricao: "ds_ativo",
    abas: [{ aba: "Responsáveis", colecao: "ativo_responsavel", campoPai: "nr_seq_ativo" }],
  },
  periodo_letivo: {
    rotulo: "Período letivo",
    campoDescricao: "ds_periodo_letivo",
    abas: [{ aba: "Feriados", colecao: "periodo_letivo_feriado", campoPai: "nr_seq_periodo_letivo" }],
  },
  relatorio: {
    rotulo: "Relatório",
    campoDescricao: "ds_relatorio",
    abas: [
      { aba: "Bandas", colecao: "relatorio_banda", campoPai: "nr_seq_relatorio" },
      { aba: "Parâmetros", colecao: "relatorio_parametro", campoPai: "nr_seq_relatorio" },
    ],
  },
  relatorio_banda: {
    rotulo: "Banda",
    campoDescricao: "ds_banda",
    abas: [
      { aba: "Elementos", colecao: "relatorio_banda_elemento", campoPai: "nr_seq_banda" },
      { aba: "Ordenação", ordenacao: true, mostrar: (d) => d.ie_tipo_banda === "lista" },
    ],
  },
};
