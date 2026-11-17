import { criarServicoCrud } from "@/lib/apiCliente";
import type { PessoaFisica } from "@/types/pessoaFisica";
import type { AuditAutor } from "@/services/auditService";

/**
 * Coleção `pessoa_fisica`. Os dados ficam no PostgreSQL e são acessados pelas rotas
 * /api/dados. O servidor gera nr_sequencia, datas de controle e auditoria; o
 * autor vem da sessão (o parâmetro `autor` é mantido só pela assinatura).
 */
const servico = criarServicoCrud<PessoaFisica>("pessoa_fisica");

export async function obterPessoasFisicas(): Promise<PessoaFisica[]> {
  return servico.obterTodos();
}

export async function criarPessoaFisica(
  pessoaFisica: Omit<PessoaFisica, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
  _autor?: AuditAutor
): Promise<string> {
  return servico.criar(pessoaFisica);
}

export async function atualizarPessoaFisica(
  id: string,
  pessoaFisica: Partial<Omit<PessoaFisica, "id" | "nr_sequencia" | "dt_criacao" | "ds_usuario_criacao" | "ds_usuario_alteracao">>,
  _autor?: AuditAutor
): Promise<void> {
  await servico.atualizar(id, pessoaFisica);
}

export async function excluirPessoaFisica(id: string): Promise<void> {
  await servico.excluir(id);
}
