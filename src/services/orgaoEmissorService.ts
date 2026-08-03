import { createCadastroGeralService } from "@/services/cadastroGeralService";
import type { OrgaoEmissor } from "@/types/orgaoEmissor";

const service = createCadastroGeralService<OrgaoEmissor>(
  "cg_orgao_emissor",
  "cg_orgao_emissor_sequence"
);

export const obterOrgaosEmissores = service.obterTodos;
export const criarOrgaoEmissor = service.criar;
export const atualizarOrgaoEmissor = service.atualizar;
export const excluirOrgaoEmissor = service.excluir;
