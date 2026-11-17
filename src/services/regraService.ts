import { atualizarDado, criarDado, listarDados } from "@/lib/apiCliente";
import type { AuditAutor } from "@/services/auditService";

const COLECAO = "regra";

/** Regras do sistema (Administração do Sistema > Regras). Um único documento guarda todas. */
export interface Regra {
  id?: string;
  /** Logout automático: dia da semana ("0" = domingo … "6" = sábado) ou "T" (todos os dias). */
  ie_logout_dia?: string;
  /** Logout automático: horário (HH:MM, hora local). */
  hr_logout?: string;
  /** Logout automático: quando a regra foi salva por último (só vale para horários a partir daí). */
  dt_vigencia_logout?: string;
  /** Badge de teste: "S" mostra o aviso "Homologação (teste)" no menu lateral; "N" ou vazio, não. */
  ie_badge_teste?: string;
  dt_criacao?: string;
  dt_alteracao?: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}

export type IdRegra = "logout_automatico" | "badge_teste";

/** Campos do documento que pertencem a cada regra. */
export const CAMPOS_REGRA: Record<IdRegra, (keyof Regra)[]> = {
  logout_automatico: ["ie_logout_dia", "hr_logout"],
  badge_teste: ["ie_badge_teste"],
};

/**
 * Logs de auditoria de uma regra específica (todas ficam no mesmo documento):
 * cada log guarda a regra alterada em `regra`.
 * Recebe os logs do mais recente para o mais antigo (ordem de fetchAuditByDocumentId).
 */
export function filtrarAuditoriaDaRegra<T extends object>(logs: T[], regra: IdRegra): T[] {
  return logs.filter((log) => (log as { regra?: unknown }).regra === regra);
}

export async function obterRegra(): Promise<Regra | null> {
  return (await listarDados<Regra>(COLECAO))[0] ?? null;
}

/**
 * Salva os campos de uma regra. Cria o registro na primeira vez e registra a
 * auditoria (detalhes = estado completo, para o modal "Detalhe da auditoria";
 * o log guarda qual regra foi alterada). Sem alteração nos valores, nada é gravado.
 * O autor vem da sessão (o parâmetro `autor` é mantido só pela assinatura).
 */
export async function salvarRegra(regra: IdRegra, valores: Partial<Regra>, _autor?: AuditAutor): Promise<Regra> {
  const agora = new Date().toISOString();
  const campos = Object.fromEntries(CAMPOS_REGRA[regra].map((c) => [c, String(valores[c] ?? "")])) as Partial<Regra>;
  // Vigência própria do logout: salvar outra regra não muda a partir de quando ele vale.
  const vigencia: Partial<Regra> = regra === "logout_automatico" ? { dt_vigencia_logout: agora } : {};
  const atual = await obterRegra();

  if (!atual?.id) {
    return criarDado<Regra>(COLECAO, { ...campos, ...vigencia }, { regra });
  }

  const semAlteracao = CAMPOS_REGRA[regra].every((c) => String(atual[c] ?? "") === campos[c]);
  if (semAlteracao) return atual;
  const { registro } = await atualizarDado<Regra>(COLECAO, atual.id, { ...campos, ...vigencia }, { regra });
  return registro ?? atual;
}
