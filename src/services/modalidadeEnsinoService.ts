import { createCadastroGeralService } from "@/services/cadastroGeralService";
import type { ModalidadeEnsino } from "@/types/modalidadeEnsino";

const service = createCadastroGeralService<ModalidadeEnsino>("cg_modalidade_ensino", "cg_modalidade_ensino_sequence");

export const obterModalidadesEnsino = service.obterTodos;
export const criarModalidadeEnsino = service.criar;
export const atualizarModalidadeEnsino = service.atualizar;
export const excluirModalidadeEnsino = service.excluir;
