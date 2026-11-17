import { criarDado, criarServicoCrud } from "@/lib/apiCliente";
import type { Manutencao } from "@/types/manutencao";
import type { AuditAutor } from "@/services/auditService";

/**
 * Coleção `pat_manutencao`. Os dados ficam no PostgreSQL e são acessados pelas rotas
 * /api/dados. O servidor gera nr_sequencia, datas de controle e auditoria; o
 * autor vem da sessão (o parâmetro `autor` é mantido só pela assinatura).
 */
const servico = criarServicoCrud<Manutencao>("pat_manutencao");

export async function obterManutencoes(): Promise<Manutencao[]> {
  return servico.obterTodos();
}

export async function criarManutencao(
  dados: Omit<Manutencao, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
  _autor?: AuditAutor
): Promise<{ id: string; nr_sequencia: number }> {
  const criada = await criarDado<Manutencao>("pat_manutencao", dados);
  return { id: String(criada.id), nr_sequencia: Number(criada.nr_sequencia) };
}

export async function atualizarManutencao(
  id: string,
  manutencao: Partial<Omit<Manutencao, "id" | "nr_sequencia" | "dt_criacao" | "ds_usuario_criacao" | "ds_usuario_alteracao">>,
  _autor?: AuditAutor
): Promise<void> {
  await servico.atualizar(id, manutencao);
}

export async function excluirManutencao(id: string): Promise<void> {
  await servico.excluir(id);
}
