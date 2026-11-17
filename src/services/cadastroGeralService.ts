import { criarServicoCrud } from "@/lib/apiCliente";
import type { AuditAutor } from "@/services/auditService";

export interface CadastroGeralRecord {
  id?: string;
  nr_sequencia: number;
  ie_status?: string;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}

/**
 * Serviço de um Cadastro Geral. Os dados ficam no PostgreSQL (rotas /api/dados);
 * o servidor gera nr_sequencia, datas de controle e auditoria. `_counterName` e
 * `autor` são mantidos só pela assinatura (o contador agora é do banco e o autor
 * vem da sessão).
 */
export function createCadastroGeralService<T extends CadastroGeralRecord>(
  collectionName: string,
  _counterName: string
) {
  const servico = criarServicoCrud<T>(collectionName);

  return {
    async obterTodos(): Promise<T[]> {
      return servico.obterTodos();
    },

    async criar(
      item: Omit<T, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
      _autor?: AuditAutor
    ): Promise<string> {
      return servico.criar(item);
    },

    async atualizar(
      id: string,
      item: Partial<Omit<T, "id" | "nr_sequencia" | "dt_criacao" | "ds_usuario_criacao" | "ds_usuario_alteracao">>,
      _autor?: AuditAutor
    ): Promise<void> {
      await servico.atualizar(id, item);
    },

    async excluir(id: string): Promise<void> {
      await servico.excluir(id);
    },
  };
}
