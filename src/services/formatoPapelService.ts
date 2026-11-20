import { createCadastroGeralService } from "@/services/cadastroGeralService";
import type { FormatoPapel } from "@/types/formatoPapel";

const service = createCadastroGeralService<FormatoPapel>("cg_formato_papel", "cg_formato_papel_sequence");

export const obterFormatosPapel = service.obterTodos;
export const criarFormatoPapel = service.criar;
export const atualizarFormatoPapel = service.atualizar;
export const excluirFormatoPapel = service.excluir;
