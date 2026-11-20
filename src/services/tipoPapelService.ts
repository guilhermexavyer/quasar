import { createCadastroGeralService } from "@/services/cadastroGeralService";
import type { TipoPapel } from "@/types/tipoPapel";

const service = createCadastroGeralService<TipoPapel>("cg_tipo_papel", "cg_tipo_papel_sequence");

export const obterTiposPapel = service.obterTodos;
export const criarTipoPapel = service.criar;
export const atualizarTipoPapel = service.atualizar;
export const excluirTipoPapel = service.excluir;
