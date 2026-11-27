import { createCadastroGeralService } from "@/services/cadastroGeralService";
import type { Combustivel } from "@/types/combustivel";

const service = createCadastroGeralService<Combustivel>(
  "combustivel",
  "combustivel_sequence"
);

export const obterCombustiveis = service.obterTodos;
export const criarCombustivel = service.criar;
export const atualizarCombustivel = service.atualizar;
export const excluirCombustivel = service.excluir;
