import { createCadastroGeralService } from "@/services/cadastroGeralService";
import type { Logradouro } from "@/types/logradouro";

const service = createCadastroGeralService<Logradouro>("logradouro", "logradouro_sequence");

export const obterLogradouros = service.obterTodos;
export const criarLogradouro = service.criar;
export const atualizarLogradouro = service.atualizar;
export const excluirLogradouro = service.excluir;
