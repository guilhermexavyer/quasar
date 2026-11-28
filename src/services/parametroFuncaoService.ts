import { atualizarDado, criarDado, listarDados } from "@/lib/apiCliente";
import { fetchAuditByDocumentId, type AuditAutor } from "@/services/auditService";

/**
 * Parâmetros das funções (tela Parâmetros). Cada parâmetro tem a própria
 * tabela com um único registro e a auditoria. O valor fica em
 * ds_regra (texto, ex.: extensões), cd_cor (cor de status), ie_regra (opção Sim/Não) ou,
 * na regra de geração de código (matrículas), nos pares ie_regra_N / ds_regra_N (N = 1 a 10).
 */
export const COLECAO_PARAM_COR_ATIVO_DESCARTADO = "ativo_param_cor_descartado";
export const COLECAO_PARAM_COR_ATIVO_ESTOQUE = "ativo_param_cor_estoque";
export const COLECAO_PARAM_COR_ATIVO_MANUTENCAO = "ativo_param_cor_manutencao";
export const COLECAO_PARAM_COR_ATIVO_OPERACIONAL = "ativo_param_cor_operacional";
export const COLECAO_PARAM_COR_MANUTENCAO_ANDAMENTO = "manutencao_param_cor_andamento";
export const COLECAO_PARAM_COR_MANUTENCAO_CONCLUIDA = "manutencao_param_cor_concluida";
export const COLECAO_PARAM_COR_MANUTENCAO_CANCELADA = "manutencao_param_cor_cancelada";
export const COLECAO_PARAM_MATRICULA_ALUNO = "aluno_param_matricula";
export const COLECAO_PARAM_MATRICULA_COLABORADOR = "colaborador_param_matricula";
export const COLECAO_PARAM_COR_PERIODO_LETIVO_ANDAMENTO = "periodo_letivo_param_cor_andamento";
export const COLECAO_PARAM_COR_PERIODO_LETIVO_ENCERRADO = "periodo_letivo_param_cor_encerrado";
export const COLECAO_PARAM_ENCERRAMENTO_AUTOMATICO_PERIODO_LETIVO = "periodo_letivo_param_encerramento_automatico";
/** Sim: os feriados de um período letivo encerrado podem ser adicionados, alterados e excluídos. */
export const COLECAO_PARAM_FERIADO_PERIODO_ENCERRADO = "periodo_letivo_param_feriado_encerrado";
/** Sim: a turma pode ter um período letivo encerrado. */
export const COLECAO_PARAM_TURMA_PERIODO_ENCERRADO = "turma_param_periodo_letivo_encerrado";
/** Sim: a turma x disciplina pode ter uma turma de período letivo encerrado. */
export const COLECAO_PARAM_TURMA_DISCIPLINA_PERIODO_ENCERRADO = "turma_disciplina_param_periodo_encerrado";
/** Sim: a cópia pode ter uma turma x disciplina de período letivo encerrado. */
export const COLECAO_PARAM_COPIA_PERIODO_ENCERRADO = "copia_param_periodo_letivo_encerrado";
export const COLECAO_PARAM_REDEFINIR_SENHA_PRIMEIRO_LOGIN ="usuario_param_redefinir_senha_primeiro_login";
/** Extensões permitidas no anexo de Controle de Cópias > Cópias (ds_regra: "pdf,docx,..."). */
export const COLECAO_PARAM_TIPOS_ARQUIVO_COPIA = "copia_param_tipos_arquivo";
export const COLECAO_PARAM_COR_COPIA_AGUARDANDO = "copia_param_cor_aguardando";
/** Sim: a Data do recebimento de uma cópia nova já vem com a data atual. */
export const COLECAO_PARAM_DATA_RECEBIMENTO_AUTOMATICA = "copia_param_data_recebimento_automatica";
export const COLECAO_PARAM_COR_COPIA_CANCELADO = "copia_param_cor_cancelado";
export const COLECAO_PARAM_COR_COPIA_ENTREGUE = "copia_param_cor_entregue";
export const COLECAO_PARAM_COR_COPIA_IMPRESSO = "copia_param_cor_impresso";

/** Valor padrão do Formato do papel / Tipo de papel de uma cópia nova (vazio = sem padrão). */
export const COLECAO_PARAM_FORMATO_PAPEL_PADRAO = "copia_param_formato_papel_padrao";
export const COLECAO_PARAM_TIPO_PAPEL_PADRAO = "copia_param_tipo_papel_padrao";

/** Campo onde o valor do parâmetro é gravado. */
export type CampoParametro = "ds_regra" | "cd_cor" | "ie_regra" | "nr_seq_formato_papel" | "nr_seq_tipo_papel" | CampoSegmentoRegra;

/** Segmentos da regra de geração de código: tipo (ie_regra_N) e texto/dígitos (ds_regra_N). */
export type CampoSegmentoRegra = `ie_regra_${number}` | `ds_regra_${number}`;

export interface ParametroFuncao extends Partial<Record<CampoSegmentoRegra, string>> {
  id?: string;
  ds_regra?: string;
  cd_cor?: string;
  /** Opção Sim ('S') / Não ('N' ou vazio). */
  ie_regra?: string;
  /** Valor padrão (parâmetros "Valor padrão"): sequência do cadastro escolhido. */
  nr_seq_formato_papel?: number;
  nr_seq_tipo_papel?: number;
  dt_criacao?: string;
  dt_alteracao?: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}

/**
 * Registros gravados antes do controle de criação não têm dt_criacao/ds_usuario_criacao.
 * Nesse caso, a criação é inferida do registro de auditoria mais antigo.
 */
async function obterCriacaoPelaAuditoria(colecao: string, id: string): Promise<{ dt_criacao: string; ds_usuario_criacao: string } | null> {
  const logs = await fetchAuditByDocumentId(colecao, id); // do mais recente para o mais antigo
  const log = logs[logs.length - 1];
  if (!log?.timestamp) return null;
  return { dt_criacao: String(log.timestamp), ds_usuario_criacao: String(log.usuarioNome ?? "").trim() || "-" };
}

export async function obterParametro(colecao: string): Promise<ParametroFuncao | null> {
  const dados = (await listarDados<ParametroFuncao>(colecao))[0];
  if (!dados) return null;
  if (dados.id && (!dados.dt_criacao || !dados.ds_usuario_criacao)) {
    const criacao = await obterCriacaoPelaAuditoria(colecao, dados.id);
    if (criacao) {
      dados.dt_criacao = dados.dt_criacao || criacao.dt_criacao;
      dados.ds_usuario_criacao = dados.ds_usuario_criacao || criacao.ds_usuario_criacao;
    }
  }
  return dados;
}

/**
 * Grava o valor do parâmetro. Cria o registro na primeira vez; sem alteração no
 * valor, nada é gravado. A auditoria guarda só o campo alterado, como sempre.
 * O autor vem da sessão (o parâmetro `autor` é mantido só pela assinatura).
 */
export async function salvarParametro(colecao: string, campo: CampoParametro, valor: string, _autor?: AuditAutor): Promise<void> {
  const atual = (await listarDados<ParametroFuncao>(colecao))[0];
  const auditoria = { detalhes: { [campo]: valor } };
  if (!atual?.id) {
    await criarDado(colecao, { [campo]: valor }, auditoria);
    return;
  }
  if (String(atual[campo] ?? "") === valor) return;
  await atualizarDado(colecao, atual.id, { [campo]: valor }, auditoria);
}

/**
 * Grava vários campos do parâmetro de uma vez (ex.: os segmentos da regra de
 * geração de código). Só os campos alterados são gravados e vão para a auditoria;
 * sem alteração, nada é gravado.
 */
export async function salvarParametroCampos(colecao: string, valores: Partial<Record<CampoParametro, string>>): Promise<void> {
  const atual = (await listarDados<ParametroFuncao>(colecao))[0];
  const alterados: Record<string, string> = {};
  for (const [campo, valor] of Object.entries(valores) as [CampoParametro, string][]) {
    if (String(atual?.[campo] ?? "") !== valor) alterados[campo] = valor;
  }
  if (Object.keys(alterados).length === 0) return;
  const auditoria = { detalhes: alterados };
  if (!atual?.id) {
    await criarDado(colecao, alterados, auditoria);
    return;
  }
  await atualizarDado(colecao, atual.id, alterados, auditoria);
}
