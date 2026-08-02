import { createCadastroGeralService } from "@/services/cadastroGeralService";
import type { Sexo } from "@/types/sexo";

const service = createCadastroGeralService<Sexo>("cg_sexo", "cg_sexo_sequence");

export const obterSexos = service.obterTodos;
export const criarSexo = service.criar;
export const atualizarSexo = service.atualizar;
export const excluirSexo = service.excluir;
