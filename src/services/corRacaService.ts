import { createCadastroGeralService } from "@/services/cadastroGeralService";
import type { CorRaca } from "@/types/corRaca";

const service = createCadastroGeralService<CorRaca>("cg_cor_raca", "cg_cor_raca_sequence");

export const obterCoresRacas = service.obterTodos;
export const criarCorRaca = service.criar;
export const atualizarCorRaca = service.atualizar;
export const excluirCorRaca = service.excluir;
