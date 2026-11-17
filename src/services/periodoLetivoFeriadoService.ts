import { atualizarDado, criarDado, excluirDado, listarDados } from "@/lib/apiCliente";
import { notificarMudanca, notificarPrefixo, observar } from "@/lib/observador";
import { COLECAO_PERIODO_LETIVO_FERIADO } from "@/lib/periodoLetivoFeriadoUtils";
import type { PeriodoLetivoFeriado } from "@/types/periodoLetivoFeriado";
import type { AuditAutor } from "@/services/auditService";

const assunto = (nrSeqPeriodoLetivo: number) => `${COLECAO_PERIODO_LETIVO_FERIADO}:${nrSeqPeriodoLetivo}`;

function feriadosDoPeriodo(nrSeqPeriodoLetivo: number): Promise<PeriodoLetivoFeriado[]> {
  return listarDados<PeriodoLetivoFeriado>(COLECAO_PERIODO_LETIVO_FERIADO, { nr_seq_periodo_letivo: nrSeqPeriodoLetivo });
}

/**
 * Acompanha os feriados de um período letivo (na hora para o que este navegador
 * grava; em até 15 segundos para o que outros usuários alteram). Retorna o cancelamento.
 */
export function observarFeriadosDoPeriodo(
  nrSeqPeriodoLetivo: number,
  aoMudar: (feriados: PeriodoLetivoFeriado[]) => void,
  aoFalhar?: (erro: unknown) => void
): () => void {
  return observar(assunto(nrSeqPeriodoLetivo), () => feriadosDoPeriodo(nrSeqPeriodoLetivo), aoMudar, aoFalhar);
}

export async function criarFeriado(
  feriado: Omit<PeriodoLetivoFeriado, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
  _autor?: AuditAutor
): Promise<string> {
  const criado = await criarDado<PeriodoLetivoFeriado>(COLECAO_PERIODO_LETIVO_FERIADO, feriado);
  notificarMudanca(assunto(Number(criado.nr_seq_periodo_letivo)));
  return String(criado.id);
}

export async function atualizarFeriado(
  id: string,
  feriado: Partial<Pick<PeriodoLetivoFeriado, "dt_feriado" | "ds_feriado" | "ie_tipo_feriado">>,
  _autor?: AuditAutor
): Promise<void> {
  const { registro } = await atualizarDado<PeriodoLetivoFeriado>(COLECAO_PERIODO_LETIVO_FERIADO, id, feriado);
  if (registro) notificarMudanca(assunto(Number(registro.nr_seq_periodo_letivo)));
}

export async function excluirFeriado(id: string): Promise<void> {
  await excluirDado(COLECAO_PERIODO_LETIVO_FERIADO, id);
  // O período do feriado excluído não é conhecido aqui: avisa todos os observadores de feriados.
  notificarPrefixo(`${COLECAO_PERIODO_LETIVO_FERIADO}:`);
}

/** Exclui todos os feriados de um período letivo (usado ao excluir o período). */
export async function excluirFeriadosDoPeriodo(nrSeqPeriodoLetivo: number): Promise<void> {
  const feriados = await feriadosDoPeriodo(nrSeqPeriodoLetivo);
  await Promise.all(feriados.map((f) => excluirDado(COLECAO_PERIODO_LETIVO_FERIADO, String(f.id))));
  notificarMudanca(assunto(nrSeqPeriodoLetivo));
}
