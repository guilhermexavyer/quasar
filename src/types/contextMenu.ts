import type { PessoaFisica } from "@/types/pessoaFisica";
import type { PessoaJuridica } from "@/types/pessoaJuridica";
import type { Usuario } from "@/types/usuario";
import type { Perfil } from "@/types/perfil";
import type { Sexo } from "@/types/sexo";
import type { EstadoCivil } from "@/types/estadoCivil";
import type { CorRaca } from "@/types/corRaca";
import type { Profissao } from "@/types/profissao";
import type { Logradouro } from "@/types/logradouro";
import type { OrgaoEmissor } from "@/types/orgaoEmissor";
import type { Aluno } from "@/types/aluno";

export type SectionType = "pessoaFisica" | "administracaoSistema" | "cadastrosGerais" | "estruturaAcademica";

export interface ContextMenuState {
  x: number;
  y: number;
  section: SectionType;
  item: PessoaFisica | PessoaJuridica | Usuario | Perfil | Sexo | EstadoCivil | CorRaca | Profissao | OrgaoEmissor | Logradouro | Aluno;
}
