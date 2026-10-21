import { COLUMNS as PF_COLUMNS, formatCellValue as formatPf, formatDate } from "@/lib/pessoaFisicaUtils";
import { PJ_COLUMNS, formatCellValuePj } from "@/lib/pessoaJuridicaUtils";
import { ALUNO_COLUMNS, formatCellValue as formatAluno } from "@/lib/alunoUtils";
import { COLABORADOR_COLUMNS, formatCellValue as formatColaborador } from "@/lib/colaboradorUtils";
import { PERIODO_LETIVO_COLUMNS, formatCellValue as formatPeriodoLetivo } from "@/lib/periodoLetivoUtils";
import { ATIVO_COLUMNS, formatCellValue as formatAtivo } from "@/lib/ativoUtils";
import { MANUTENCAO_COLUMNS, formatCellValue as formatManutencao } from "@/lib/manutencaoUtils";
import { CATEGORIA_ATIVO_COLUMNS } from "@/lib/categoriaAtivoUtils";
import { formatCadastroGeralCellValue } from "@/lib/cadastroGeralUtils";
import { ADMIN_COLUMNS, formatAdminCellValue } from "@/lib/usuarioUtils";
import { PERFIL_COLUMNS, formatPerfilCellValue } from "@/lib/perfilUtils";
import { CARGO_COLUMNS } from "@/lib/cargoUtils";
import { COR_RACA_COLUMNS } from "@/lib/corRacaUtils";
import { ESTADO_CIVIL_COLUMNS } from "@/lib/estadoCivilUtils";
import { GRAU_PARENTESCO_COLUMNS } from "@/lib/grauParentescoUtils";
import { LOCALIZACAO_COLUMNS } from "@/lib/localizacaoUtils";
import { LOGRADOURO_COLUMNS } from "@/lib/logradouroUtils";
import { MARCA_COLUMNS } from "@/lib/marcaUtils";
import { ORGAO_EMISSOR_COLUMNS } from "@/lib/orgaoEmissorUtils";
import { PROFISSAO_COLUMNS } from "@/lib/profissaoUtils";
import { SEXO_COLUMNS } from "@/lib/sexoUtils";
import { SISTEMA_OPERACIONAL_COLUMNS } from "@/lib/sistemaOperacionalUtils";
import { VINCULO_CONTRATUAL_COLUMNS } from "@/lib/vinculoContratualUtils";
import { rotuloTipoFeriado } from "@/lib/periodoLetivoFeriadoUtils";

/** Coluna da tabela de registros excluídos. */
export interface ColunaExclusao {
  key: string;
  label: string;
  alinharDireita?: boolean;
}

/** Função/submódulo cujos registros excluídos podem ser consultados. */
export interface FuncaoExclusao {
  /** Coleção do Firestore (também é o id da linha). */
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
  { colecao: "pessoa_fisica", funcao: "Cadastro de Pessoas", dropdown: "Pessoas Físicas", colunas: proprias(PF_COLUMNS), formatar: f(formatPf) },
  { colecao: "pessoa_juridica", funcao: "Cadastro de Pessoas", dropdown: "Pessoas Jurídicas", colunas: proprias(PJ_COLUMNS), formatar: f(formatCellValuePj) },
  CG("cg_cargo", "Cargo", CARGO_COLUMNS),
  CG("cg_cor_raca", "Cor/Raça", COR_RACA_COLUMNS),
  CG("cg_estado_civil", "Estado civil", ESTADO_CIVIL_COLUMNS),
  CG("cg_grau_parentesco", "Grau de parentesco", GRAU_PARENTESCO_COLUMNS),
  CG("cg_localizacao", "Localização", LOCALIZACAO_COLUMNS),
  CG("cg_logradouro", "Logradouro", LOGRADOURO_COLUMNS),
  CG("cg_marca", "Marca", MARCA_COLUMNS),
  CG("cg_orgao_emissor", "Órgão emissor", ORGAO_EMISSOR_COLUMNS),
  CG("cg_profissao", "Profissão", PROFISSAO_COLUMNS),
  CG("cg_sexo", "Sexo", SEXO_COLUMNS),
  CG("cg_sistema_operacional", "Sistema operacional", SISTEMA_OPERACIONAL_COLUMNS),
  CG("cg_vinculo_contratual", "Vínculo contratual", VINCULO_CONTRATUAL_COLUMNS),
  { colecao: "aluno", funcao: "Estrutura Acadêmica", dropdown: "Alunos", colunas: proprias(ALUNO_COLUMNS), formatar: f(formatAluno) },
  { colecao: "colaborador", funcao: "Estrutura Acadêmica", dropdown: "Colaboradores", colunas: proprias(COLABORADOR_COLUMNS), formatar: f(formatColaborador) },
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
  { colecao: "pat_ativo", funcao: "Patrimônio", dropdown: "Ativos", colunas: proprias(ATIVO_COLUMNS), formatar: f(formatAtivo) },
  { colecao: "pat_categoria", funcao: "Patrimônio", dropdown: "Categoria", colunas: proprias(CATEGORIA_ATIVO_COLUMNS), formatar: formatCadastroGeralCellValue },
  { colecao: "pat_manutencao", funcao: "Patrimônio", dropdown: "Manutenções", colunas: proprias(MANUTENCAO_COLUMNS), formatar: formatManutencao },
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
 * Registros que abrem outra tela com duplo clique: período letivo (feriados),
 * relatório (bandas e parâmetros) e banda (elementos e ordenação).
 */
export const FILHOS_EXCLUSAO: Record<string, { rotulo: string; campoDescricao: string; abas: AbaFilhosExclusao[] }> = {
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
