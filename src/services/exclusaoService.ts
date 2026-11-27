import { api, definirPerfilEmUso } from "@/lib/apiCliente";
import type { AuditAutor } from "@/services/auditService";

/** Tabela com a cópia de cada registro excluído (Administração do Sistema > Exclusões). */
export const COLECAO_EXCLUSAO = "log_exclusao";

/** Registro excluído: cópia do registro como estava no momento da exclusão. */
export interface Exclusao {
  id: string;
  /** Tabela de onde o registro foi excluído (ex.: aluno, ativo). */
  ds_tabela: string;
  /** Id do registro excluído (o nr_sequencia dele, em texto). */
  id_registro: string;
  nr_sequencia?: number;
  /** Dados do registro no momento da exclusão. */
  dados: Record<string, unknown>;
  dt_exclusao: string;
  ds_usuario_exclusao: string;
  usuario_id_exclusao?: string | null;
  /** Perfil que o usuário estava usando ao excluir. */
  nr_seq_perfil_exclusao?: number;
  ds_perfil_exclusao?: string;
}

/**
 * Informa o perfil em uso, que fica registrado em cada exclusão. O autor vem da
 * sessão no servidor (o parâmetro `autor` é mantido só pela assinatura), e a
 * cópia do registro é gravada pelo servidor na mesma transação da exclusão.
 */
export function definirAutorExclusoes(_autor: AuditAutor | undefined, perfil?: { nr_sequencia?: number; ds_perfil?: string }) {
  definirPerfilEmUso(perfil?.nr_sequencia);
}

/** Registros excluídos de uma coleção. */
export async function obterExclusoes(colecao: string): Promise<Exclusao[]> {
  return api.get<Exclusao[]>(`/api/exclusoes/${encodeURIComponent(colecao)}`);
}
