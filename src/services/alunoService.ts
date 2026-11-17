import { criarServicoCrud } from "@/lib/apiCliente";
import type { Aluno } from "@/types/aluno";
import type { AuditAutor } from "@/services/auditService";

/**
 * Coleção `aluno`. Os dados ficam no PostgreSQL e são acessados pelas rotas
 * /api/dados. O servidor gera nr_sequencia, datas de controle e auditoria; o
 * autor vem da sessão (o parâmetro `autor` é mantido só pela assinatura).
 */
const servico = criarServicoCrud<Aluno>("aluno");

export async function obterAlunos(): Promise<Aluno[]> {
  return servico.obterTodos();
}

export async function criarAluno(
  aluno: Omit<Aluno, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
  _autor?: AuditAutor
): Promise<string> {
  return servico.criar(aluno);
}

export async function atualizarAluno(
  id: string,
  aluno: Partial<Omit<Aluno, "id" | "nr_sequencia" | "dt_criacao" | "ds_usuario_criacao" | "ds_usuario_alteracao">>,
  _autor?: AuditAutor
): Promise<void> {
  await servico.atualizar(id, aluno);
}

export async function excluirAluno(id: string): Promise<void> {
  await servico.excluir(id);
}
