import { createCadastroGeralService } from "@/services/cadastroGeralService";
import type { Turma } from "@/types/turma";

const service = createCadastroGeralService<Turma>("turma", "turma_sequence");

export const obterTurmas = service.obterTodos;
export const criarTurma = service.criar;
export const atualizarTurma = service.atualizar;
export const excluirTurma = service.excluir;
