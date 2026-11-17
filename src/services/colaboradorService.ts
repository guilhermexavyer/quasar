import { criarServicoCrud } from "@/lib/apiCliente";
import type { Colaborador } from "@/types/colaborador";
import type { AuditAutor } from "@/services/auditService";

/**
 * Coleção `colaborador`. Os dados ficam no PostgreSQL e são acessados pelas rotas
 * /api/dados. O servidor gera nr_sequencia, datas de controle e auditoria; o
 * autor vem da sessão (o parâmetro `autor` é mantido só pela assinatura).
 */
const servico = criarServicoCrud<Colaborador>("colaborador");

export async function obterColaboradores(): Promise<Colaborador[]> {
  return servico.obterTodos();
}

export async function criarColaborador(
  colaborador: Omit<Colaborador, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
  _autor?: AuditAutor
): Promise<string> {
  return servico.criar(colaborador);
}

export async function atualizarColaborador(
  id: string,
  colaborador: Partial<Omit<Colaborador, "id" | "nr_sequencia" | "dt_criacao" | "ds_usuario_criacao" | "ds_usuario_alteracao">>,
  _autor?: AuditAutor
): Promise<void> {
  await servico.atualizar(id, colaborador);
}

export async function excluirColaborador(id: string): Promise<void> {
  await servico.excluir(id);
}
