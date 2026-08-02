import { createCadastroGeralService } from "@/services/cadastroGeralService";
import type { EstadoCivil } from "@/types/estadoCivil";

const service = createCadastroGeralService<EstadoCivil>("cg_estado_civil", "cg_estado_civil_sequence");

export const obterEstadoCivis = service.obterTodos;
export const criarEstadoCivil = service.criar;
export const atualizarEstadoCivil = service.atualizar;
export const excluirEstadoCivil = service.excluir;
