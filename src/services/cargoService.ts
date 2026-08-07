import { createCadastroGeralService } from "@/services/cadastroGeralService";
import type { Cargo } from "@/types/cargo";

const service = createCadastroGeralService<Cargo>("cg_cargo", "cg_cargo_sequence");

export const obterCargos = service.obterTodos;
export const criarCargo = service.criar;
export const atualizarCargo = service.atualizar;
export const excluirCargo = service.excluir;
