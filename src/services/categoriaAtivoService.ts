import { createCadastroGeralService } from "@/services/cadastroGeralService";
import type { CategoriaAtivo } from "@/types/categoriaAtivo";

const service = createCadastroGeralService<CategoriaAtivo>("cg_categoria_ativo", "cg_categoria_ativo_sequence");

export const obterCategoriasAtivos = service.obterTodos;
export const criarCategoriaAtivo = service.criar;
export const atualizarCategoriaAtivo = service.atualizar;
export const excluirCategoriaAtivo = service.excluir;
