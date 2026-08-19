import { createCadastroGeralService } from "@/services/cadastroGeralService";
import type { SistemaOperacional } from "@/types/sistemaOperacional";

const service = createCadastroGeralService<SistemaOperacional>(
  "cg_sistema_operacional",
  "cg_sistema_operacional_sequence"
);

export const obterSistemasOperacionais = service.obterTodos;
export const criarSistemaOperacional = service.criar;
export const atualizarSistemaOperacional = service.atualizar;
export const excluirSistemaOperacional = service.excluir;
