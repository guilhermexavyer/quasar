import { api, criarServicoCrud } from "@/lib/apiCliente";
import { notificarMudanca, observar } from "@/lib/observador";
import type { PeriodoLetivo } from "@/types/periodoLetivo";
import type { AuditAutor } from "@/services/auditService";

const ASSUNTO = "periodo_letivo";
const servico = criarServicoCrud<PeriodoLetivo>("periodo_letivo");

/**
 * Acompanha a lista de períodos letivos: reflete na hora o que este navegador
 * grava e, em até 15 segundos, o que outros usuários alteraram (ex.:
 * encerramento automático pela previsão de término). Retorna o cancelamento.
 */
export function observarPeriodosLetivos(
  aoMudar: (periodos: PeriodoLetivo[]) => void,
  aoFalhar?: (erro: unknown) => void
): () => void {
  return observar(ASSUNTO, () => servico.obterTodos(), aoMudar, aoFalhar);
}

/**
 * Encerra o período pela previsão de término (parâmetro "A previsão de término
 * encerra o período letivo automaticamente"): status Encerrado e Data de término
 * = Previsão de término. O servidor trava o registro, para que só um usuário com
 * o sistema aberto faça o encerramento. Retorna se encerrou.
 */
export async function encerrarPeriodoLetivoPorPrevisao(id: string, _autor?: AuditAutor): Promise<boolean> {
  const { encerrou } = await api.post<{ encerrou: boolean }>(`/api/periodos-letivos/${encodeURIComponent(id)}/encerrar`);
  if (encerrou) notificarMudanca(ASSUNTO);
  return encerrou;
}

export async function obterPeriodosLetivos(): Promise<PeriodoLetivo[]> {
  return servico.obterTodos();
}

export async function criarPeriodoLetivo(
  periodo: Omit<PeriodoLetivo, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
  _autor?: AuditAutor
): Promise<string> {
  const id = await servico.criar(periodo);
  notificarMudanca(ASSUNTO);
  return id;
}

export async function atualizarPeriodoLetivo(
  id: string,
  periodo: Partial<Omit<PeriodoLetivo, "id" | "nr_sequencia" | "dt_criacao" | "ds_usuario_criacao" | "ds_usuario_alteracao">>,
  _autor?: AuditAutor
): Promise<void> {
  await servico.atualizar(id, periodo);
  notificarMudanca(ASSUNTO);
}

export async function excluirPeriodoLetivo(id: string): Promise<void> {
  await servico.excluir(id);
  notificarMudanca(ASSUNTO);
}
