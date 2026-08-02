import type { PessoaFisica } from "@/types/pessoaFisica";
import type { Usuario } from "@/types/usuario";
import type { Sexo } from "@/types/sexo";
import type { EstadoCivil } from "@/types/estadoCivil";
import type { CorRaca } from "@/types/corRaca";
import type { Profissao } from "@/types/profissao";

export type SectionType = "pessoaFisica" | "administracaoSistema" | "cadastrosGerais";

export interface ContextMenuState {
  x: number;
  y: number;
  section: SectionType;
  item: PessoaFisica | Usuario | Sexo | EstadoCivil | CorRaca | Profissao;
}
