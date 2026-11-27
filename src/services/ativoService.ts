import { criarServicoCrud } from "@/lib/apiCliente";
import type { Ativo } from "@/types/ativo";
import type { AuditAutor } from "@/services/auditService";

/**
 * Coleção `ativo`. Os dados ficam no PostgreSQL e são acessados pelas rotas
 * /api/dados. O servidor gera nr_sequencia, datas de controle e auditoria; o
 * autor vem da sessão (o parâmetro `autor` é mantido só pela assinatura).
 */
const servico = criarServicoCrud<Ativo>("ativo");

export async function obterAtivos(): Promise<Ativo[]> {
  return servico.obterTodos();
}

export async function criarAtivo(
  ativo: Omit<Ativo, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
  _autor?: AuditAutor
): Promise<string> {
  return servico.criar(ativo);
}

export async function atualizarAtivo(
  id: string,
  ativo: Partial<Omit<Ativo, "id" | "nr_sequencia" | "dt_criacao" | "ds_usuario_criacao" | "ds_usuario_alteracao">>,
  _autor?: AuditAutor
): Promise<void> {
  await servico.atualizar(id, ativo);
}

export async function excluirAtivo(id: string): Promise<void> {
  await servico.excluir(id);
}
