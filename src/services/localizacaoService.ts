import { createCadastroGeralService } from "@/services/cadastroGeralService";
import type { Localizacao } from "@/types/localizacao";

const service = createCadastroGeralService<Localizacao>("cg_localizacao", "cg_localizacao_sequence");

export const obterLocalizacoes = service.obterTodos;
export const criarLocalizacao = service.criar;
export const atualizarLocalizacao = service.atualizar;
export const excluirLocalizacao = service.excluir;
