import { createCadastroGeralService } from "@/services/cadastroGeralService";
import type { VinculoContratual } from "@/types/vinculoContratual";

const service = createCadastroGeralService<VinculoContratual>("cg_vinculo_contratual", "cg_vinculo_contratual_sequence");

export const obterVinculosContratuais = service.obterTodos;
export const criarVinculoContratual = service.criar;
export const atualizarVinculoContratual = service.atualizar;
export const excluirVinculoContratual = service.excluir;
