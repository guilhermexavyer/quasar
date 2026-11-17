import { atualizarDado, criarDado, listarDados } from "@/lib/apiCliente";
import { fetchAuditByDocumentId, type AuditAutor } from "@/services/auditService";

/**
 * Parâmetros das funções (tela Parâmetros). Cada parâmetro tem a própria
 * tabela com um único registro e a auditoria. O valor fica em
 * ds_regra (regra de geração de código), cd_cor (cor de status) ou ie_regra (opção Sim/Não).
 */
export const COLECAO_PARAM_COR_ATIVO_DESCARTADO = "pat_param_cor_ativo_descartado";
export const COLECAO_PARAM_COR_ATIVO_ESTOQUE = "pat_param_cor_ativo_estoque";
export const COLECAO_PARAM_COR_ATIVO_MANUTENCAO = "pat_param_cor_ativo_manutencao";
export const COLECAO_PARAM_COR_ATIVO_OPERACIONAL = "pat_param_cor_ativo_operacional";
export const COLECAO_PARAM_COR_MANUTENCAO_ANDAMENTO = "pat_param_cor_manutencao_andamento";
export const COLECAO_PARAM_COR_MANUTENCAO_CONCLUIDA = "pat_param_cor_manutencao_concluida";
export const COLECAO_PARAM_COR_MANUTENCAO_CANCELADA = "pat_param_cor_manutencao_cancelada";
export const COLECAO_PARAM_MATRICULA_ALUNO = "ea_param_matricula_aluno";
export const COLECAO_PARAM_MATRICULA_COLABORADOR = "ea_param_matricula_colaborador";
export const COLECAO_PARAM_COR_PERIODO_LETIVO_ANDAMENTO = "ea_param_cor_periodo_letivo_andamento";
export const COLECAO_PARAM_COR_PERIODO_LETIVO_ENCERRADO = "ea_param_cor_periodo_letivo_encerrado";
export const COLECAO_PARAM_ENCERRAMENTO_AUTOMATICO_PERIODO_LETIVO = "ea_param_encerramento_automatico_periodo_letivo";

/** Campo onde o valor do parâmetro é gravado. */
export type CampoParametro = "ds_regra" | "cd_cor" | "ie_regra";

export interface ParametroFuncao {
  id?: string;
  ds_regra?: string;
  cd_cor?: string;
  /** Opção Sim ('S') / Não ('N' ou vazio). */
  ie_regra?: string;
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
  if ((atual[campo] ?? "") === valor) return;
  await atualizarDado(colecao, atual.id, { [campo]: valor }, auditoria);
}
