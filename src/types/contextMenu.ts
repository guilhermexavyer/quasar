import type { PessoaFisica } from "@/types/pessoaFisica";
import type { Usuario } from "@/types/usuario";

export type SectionType = "pessoaFisica" | "administracaoSistema";

export interface ContextMenuState {
  x: number;
  y: number;
  section: SectionType;
  item: PessoaFisica | Usuario;
}
