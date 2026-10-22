import { createCadastroGeralService } from "@/services/cadastroGeralService";
import type { Curso } from "@/types/curso";

const service = createCadastroGeralService<Curso>("curso", "curso_sequence");

export const obterCursos = service.obterTodos;
export const criarCurso = service.criar;
export const atualizarCurso = service.atualizar;
export const excluirCurso = service.excluir;
