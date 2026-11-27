import { createCadastroGeralService } from "@/services/cadastroGeralService";
import type { Profissao } from "@/types/profissao";

const service = createCadastroGeralService<Profissao>("profissao", "profissao_sequence");

export const obterProfissoes = service.obterTodos;
export const criarProfissao = service.criar;
export const atualizarProfissao = service.atualizar;
export const excluirProfissao = service.excluir;
