import { createCadastroGeralService } from "@/services/cadastroGeralService";
import type { GrauParentesco } from "@/types/grauParentesco";

const service = createCadastroGeralService<GrauParentesco>("cg_grau_parentesco", "cg_grau_parentesco_sequence");

export const obterGrausParentesco = service.obterTodos;
export const criarGrauParentesco = service.criar;
export const atualizarGrauParentesco = service.atualizar;
export const excluirGrauParentesco = service.excluir;
