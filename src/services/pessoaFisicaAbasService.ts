import { atualizarDado, criarDado, listarDados } from "@/lib/apiCliente";
import type { PessoaFisicaEndereco, PessoaFisicaSaude } from "@/types/pessoaFisicaAbas";

type RegistroAba = PessoaFisicaEndereco | PessoaFisicaSaude;

/** Registro da aba (Residencial, Comercial ou Saúde) da pessoa física; null se ainda não existe. */
export async function obterRegistroDaAba<T extends RegistroAba>(colecao: string, nrSeqPessoaFisica: number): Promise<T | null> {
  const lista = await listarDados<T>(colecao, { nr_seq_pessoa_fisica: nrSeqPessoaFisica });
  return lista[0] ?? null;
}

/**
 * Salva o registro único da aba: cria na primeira vez e depois só atualiza.
 * Devolve o registro gravado (com sequência e campos de controle).
 */
export async function salvarRegistroDaAba<T extends RegistroAba>(
  colecao: string,
  nrSeqPessoaFisica: number,
  id: string | undefined,
  dados: Partial<T>
): Promise<T | null> {
  if (id) {
    const { registro } = await atualizarDado<T>(colecao, id, dados);
    return registro;
  }
  return criarDado<T>(colecao, { ...dados, nr_seq_pessoa_fisica: nrSeqPessoaFisica });
}
