import { atualizarDado, criarDado, listarDados } from "@/lib/apiCliente";
import type { AuditAutor } from "@/services/auditService";

const COLECAO = "aviso";

/** Avisos do sistema (Administração do Sistema > Avisos). Um único documento guarda todos. */
export interface Aviso {
  id?: string;
  /** Conteúdo (HTML) do aviso "Esqueceu sua senha?" (tela de login). */
  ds_esqueceu_senha?: string;
  /** Conteúdo (HTML) do aviso "Política de Privacidade" (menu do usuário). */
  ds_politica_privacidade?: string;
  dt_criacao?: string;
  dt_alteracao?: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}

export type CampoAviso = "ds_esqueceu_senha" | "ds_politica_privacidade";

/**
 * Logs de auditoria de um aviso específico (os dois avisos ficam no mesmo
 * documento). Logs novos trazem o campo alterado; nos antigos, o aviso é
 * identificado comparando o conteúdo com o log anterior.
 * Recebe os logs do mais recente para o mais antigo (ordem de fetchAuditByDocumentId).
 */
export function filtrarAuditoriaDoAviso<T extends { campo?: string; detalhes?: Record<string, unknown> }>(logs: T[], campo: CampoAviso): T[] {
  return logs.filter((log, i) => {
    if (log.campo) return log.campo === campo;
    const atual = String(log.detalhes?.[campo] ?? "");
    const anterior = i + 1 < logs.length ? String(logs[i + 1].detalhes?.[campo] ?? "") : "";
    return atual !== anterior;
  });
}

export async function obterAviso(): Promise<Aviso | null> {
  return (await listarDados<Aviso>(COLECAO))[0] ?? null;
}

/**
 * Salva o conteúdo de um aviso. Cria o registro na primeira vez e registra a
 * auditoria (detalhes = estado completo, para o modal "Detalhe da auditoria";
 * o log guarda qual aviso foi alterado). Sem alteração no conteúdo, nada é gravado.
 * O autor vem da sessão (o parâmetro `autor` é mantido só pela assinatura).
 */
export async function salvarAviso(campo: CampoAviso, conteudo: string, _autor?: AuditAutor): Promise<Aviso> {
  const atual = await obterAviso();
  if (!atual?.id) {
    return criarDado<Aviso>(COLECAO, { ds_esqueceu_senha: "", ds_politica_privacidade: "", [campo]: conteudo }, { campo });
  }
  if ((atual[campo] ?? "") === conteudo) return atual;
  const { registro } = await atualizarDado<Aviso>(COLECAO, atual.id, { [campo]: conteudo }, { campo });
  return registro ?? atual;
}
