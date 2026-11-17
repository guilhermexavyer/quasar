import { criarServicoCrud } from "@/lib/apiCliente";
import type { Perfil } from "@/types/perfil";
import type { AuditAutor } from "@/services/auditService";

/**
 * Coleção `perfil`. Os dados ficam no PostgreSQL e são acessados pelas rotas
 * /api/dados. O servidor gera nr_sequencia, datas de controle e auditoria; o
 * autor vem da sessão (o parâmetro `autor` é mantido só pela assinatura).
 */
const servico = criarServicoCrud<Perfil>("perfil");

export async function obterPerfis(): Promise<Perfil[]> {
  return servico.obterTodos();
}

export async function criarPerfil(
  perfil: Omit<Perfil, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
  _autor?: AuditAutor
): Promise<string> {
  return servico.criar(perfil);
}

export async function atualizarPerfil(
  id: string,
  perfil: Partial<Omit<Perfil, "id" | "nr_sequencia" | "dt_criacao" | "ds_usuario_criacao" | "ds_usuario_alteracao">>,
  _autor?: AuditAutor
): Promise<void> {
  await servico.atualizar(id, perfil);
}

export async function excluirPerfil(id: string): Promise<void> {
  await servico.excluir(id);
}
