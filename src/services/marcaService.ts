import { createCadastroGeralService } from "@/services/cadastroGeralService";
import type { Marca } from "@/types/marca";

const service = createCadastroGeralService<Marca>("cg_marca", "cg_marca_sequence");

export const obterMarcas = service.obterTodos;
export const criarMarca = service.criar;
export const atualizarMarca = service.atualizar;
export const excluirMarca = service.excluir;
