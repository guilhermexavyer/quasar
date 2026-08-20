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
import type { Colaborador } from "@/types/colaborador";
import type { GrauParentesco } from "@/types/grauParentesco";
import type { Cargo } from "@/types/cargo";
import type { VinculoContratual } from "@/types/vinculoContratual";
import type { Localizacao } from "@/types/localizacao";
import type { Marca } from "@/types/marca";
import type { CategoriaAtivo } from "@/types/categoriaAtivo";
import type { Ativo } from "@/types/ativo";
import type { Manutencao } from "@/types/manutencao";

export type SectionType = "pessoaFisica" | "administracaoSistema" | "cadastrosGerais" | "estruturaAcademica" | "patrimonio";

export interface ContextMenuState {
  x: number;
  y: number;
  section: SectionType;
  item: PessoaFisica | PessoaJuridica | Usuario | Perfil | Sexo | EstadoCivil | CorRaca | Profissao | OrgaoEmissor | Logradouro | Aluno | GrauParentesco | Colaborador | Cargo | VinculoContratual | Localizacao | Marca | CategoriaAtivo | Ativo | Manutencao;
}
