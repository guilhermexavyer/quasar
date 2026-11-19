import { createCadastroGeralService } from "@/services/cadastroGeralService";
import type { TurmaDisciplina } from "@/types/turmaDisciplina";

const service = createCadastroGeralService<TurmaDisciplina>("turma_disciplina", "turma_disciplina_sequence");

export const obterTurmasDisciplinas = service.obterTodos;
export const criarTurmaDisciplina = service.criar;
export const atualizarTurmaDisciplina = service.atualizar;
export const excluirTurmaDisciplina = service.excluir;
