import { createCadastroGeralService } from "@/services/cadastroGeralService";
import type { Disciplina } from "@/types/disciplina";

const service = createCadastroGeralService<Disciplina>("disciplina", "disciplina_sequence");

export const obterDisciplinas = service.obterTodos;
export const criarDisciplina = service.criar;
export const atualizarDisciplina = service.atualizar;
export const excluirDisciplina = service.excluir;
