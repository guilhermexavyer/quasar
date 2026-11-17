import { criarServicoCrud } from "@/lib/apiCliente";
import type { PessoaJuridica } from "@/types/pessoaJuridica";
import type { AuditAutor } from "@/services/auditService";

/**
 * Coleção `pessoa_juridica`. Os dados ficam no PostgreSQL e são acessados pelas rotas
 * /api/dados. O servidor gera nr_sequencia, datas de controle e auditoria; o
 * autor vem da sessão (o parâmetro `autor` é mantido só pela assinatura).
 */
const servico = criarServicoCrud<PessoaJuridica>("pessoa_juridica");

export async function obterPessoasJuridicas(): Promise<PessoaJuridica[]> {
  return servico.obterTodos();
}

export async function criarPessoaJuridica(
  pessoaJuridica: Omit<PessoaJuridica, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">,
  _autor?: AuditAutor
): Promise<string> {
  return servico.criar(pessoaJuridica);
}

export async function atualizarPessoaJuridica(
  id: string,
  pessoaJuridica: Partial<Omit<PessoaJuridica, "id" | "nr_sequencia" | "dt_criacao" | "ds_usuario_criacao" | "ds_usuario_alteracao">>,
  _autor?: AuditAutor
): Promise<void> {
  await servico.atualizar(id, pessoaJuridica);
}

export async function excluirPessoaJuridica(id: string): Promise<void> {
  await servico.excluir(id);
}
