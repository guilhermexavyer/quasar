"use client";

import Image from "next/image";
import React, { useEffect, useLayoutEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  criarPessoaFisica,
  excluirPessoaFisica,
  obterPessoasFisicas,
  atualizarPessoaFisica,
} from "@/services/pessoaFisicaService";
import {
  criarPessoaJuridica,
  excluirPessoaJuridica,
  obterPessoasJuridicas,
  atualizarPessoaJuridica,
} from "@/services/pessoaJuridicaService";
import {
  criarAluno,
  excluirAluno,
  obterAlunos,
  atualizarAluno,
} from "@/services/alunoService";
import {
  criarColaborador,
  excluirColaborador,
  obterColaboradores,
  atualizarColaborador,
} from "@/services/colaboradorService";
import { obterUsuarios } from "@/services/usuarioService";
import {
  criarUsuario,
  excluirUsuario,
  atualizarUsuario,
  atualizarPreferenciaTema,
  atualizarPreferenciasUsuario,
} from "@/services/usuarioService";
import {
  criarSexo,
  excluirSexo,
  obterSexos,
  atualizarSexo,
} from "@/services/sexoService";
import {
  criarEstadoCivil,
  excluirEstadoCivil,
  obterEstadoCivis,
  atualizarEstadoCivil,
} from "@/services/estadoCivilService";
import {
  criarCorRaca,
  excluirCorRaca,
  obterCoresRacas,
  atualizarCorRaca,
} from "@/services/corRacaService";
import {
  criarProfissao,
  excluirProfissao,
  obterProfissoes,
  atualizarProfissao,
} from "@/services/profissaoService";
import {
  criarOrgaoEmissor,
  excluirOrgaoEmissor,
  obterOrgaosEmissores,
  atualizarOrgaoEmissor,
} from "@/services/orgaoEmissorService";
import {
  criarLogradouro,
  excluirLogradouro,
  obterLogradouros,
  atualizarLogradouro,
} from "@/services/logradouroService";
import {
  criarGrauParentesco,
  excluirGrauParentesco,
  obterGrausParentesco,
  atualizarGrauParentesco,
} from "@/services/grauParentescoService";
import {
  criarCargo,
  excluirCargo,
  obterCargos,
  atualizarCargo,
} from "@/services/cargoService";
import {
  criarVinculoContratual,
  excluirVinculoContratual,
  obterVinculosContratuais,
  atualizarVinculoContratual,
} from "@/services/vinculoContratualService";
import {
  criarLocalizacao,
  excluirLocalizacao,
  obterLocalizacoes,
  atualizarLocalizacao,
} from "@/services/localizacaoService";
import {
  criarMarca,
  excluirMarca,
  obterMarcas,
  atualizarMarca,
} from "@/services/marcaService";
import {
  criarCategoriaAtivo,
  excluirCategoriaAtivo,
  obterCategoriasAtivos,
  atualizarCategoriaAtivo,
} from "@/services/categoriaAtivoService";
import {
  criarSistemaOperacional,
  excluirSistemaOperacional,
  obterSistemasOperacionais,
  atualizarSistemaOperacional,
} from "@/services/sistemaOperacionalService";
import {
  criarAtivo,
  excluirAtivo,
  obterAtivos,
  atualizarAtivo,
} from "@/services/ativoService";
import { obterParamCodigoPatrimonio } from "@/services/paramCodigoPatrimonioService";
import { fetchAuditByPessoaId, fetchAuditByUsuarioId, fetchAuditByDocumentId, AuditEntry } from "@/services/auditService";
import type { PessoaFisica } from "@/types/pessoaFisica";
import type { PessoaJuridica } from "@/types/pessoaJuridica";
import type { Aluno, AlunoResponsavel } from "@/types/aluno";
import type { Colaborador } from "@/types/colaborador";
import {
  applyCpfMask,
  applyDateMask,
  applyPhoneMask,
  formatDate,
  parseDateInput,
  parsePersonDateValue,
  COLUMNS,
  formatCellValue,
} from "@/lib/pessoaFisicaUtils";
import { PJ_COLUMNS, applyCnpjMask } from "@/lib/pessoaJuridicaUtils";
import { ALUNO_COLUMNS, formatCellValue as formatAlunoCellValue } from "@/lib/alunoUtils";
import { COLABORADOR_COLUMNS, STATUS_OPTIONS, formatCellValue as formatColaboradorCellValue } from "@/lib/colaboradorUtils";
import { ADMIN_COLUMNS, formatAdminCellValue } from "@/lib/usuarioUtils";
import {
  parseColunasConfig,
  serializeColunasConfig,
  parseStringColunasConfig,
  serializeStringColunasConfig,
  type ColunasConfig,
} from "@/lib/colunasUtils";
import ContextMenu from "@/components/ui/ContextMenu";
import Toast from "@/components/ui/Toast";
import LoginScreen from "@/components/ui/LoginScreen";
import LoadingModal from "@/components/ui/LoadingModal";
import PessoaFisicaListView from "@/components/pessoaFisica/PessoaFisicaListView";
import PessoaFisicaFormView from "@/components/pessoaFisica/PessoaFisicaFormView";
import PessoaJuridicaListView from "@/components/pessoaJuridica/PessoaJuridicaListView";
import PessoaJuridicaFormView from "@/components/pessoaJuridica/PessoaJuridicaFormView";
import AlunoListView from "@/components/estruturaAcademica/AlunoListView";
import AlunoFormView, { type AlunoFormData } from "@/components/estruturaAcademica/AlunoFormView";
import ColaboradorListView from "@/components/estruturaAcademica/ColaboradorListView";
import ColaboradorFormView, { type ColaboradorFormData } from "@/components/estruturaAcademica/ColaboradorFormView";
import ColaboradorViewModal from "@/components/estruturaAcademica/ColaboradorViewModal";
import AtivoListView from "@/components/patrimonio/AtivoListView";
import AtivoFormView, { type AtivoFormData } from "@/components/patrimonio/AtivoFormView";
import ParametrosDaFuncaoView from "@/components/patrimonio/ParametrosDaFuncaoView";
import ManutencaoListView from "@/components/patrimonio/ManutencaoListView";
import ManutencaoFormView, { type ManutencaoFormData } from "@/components/patrimonio/ManutencaoFormView";
import PrestadorLookupTable from "@/components/patrimonio/PrestadorLookupTable";
import AtivoLookupTable from "@/components/patrimonio/AtivoLookupTable";
import ManutencaoViewModal from "@/components/patrimonio/ManutencaoViewModal";
import type { Manutencao } from "@/types/manutencao";
import { obterManutencoes, criarManutencao, atualizarManutencao, excluirManutencao } from "@/services/manutencaoService";
import { MANUTENCAO_COLUMNS, MANUTENCAO_STATUS_OPTIONS, FIELD_INFOS as MANUTENCAO_FIELD_INFOS } from "@/lib/manutencaoUtils";
import PessoaJuridicaLookupTable from "@/components/pessoaJuridica/PessoaJuridicaLookupTable";
import AdministracaoSistemaListView from "@/components/administracaoSistema/AdministracaoSistemaListView";
import AdministracaoSistemaFormView from "@/components/administracaoSistema/AdministracaoSistemaFormView";
import PerfilListView from "@/components/administracaoSistema/PerfilListView";
import PerfilFormView, { type PerfilFormData } from "@/components/administracaoSistema/PerfilFormView";
import CamposView from "@/components/administracaoSistema/CamposView";
import RelatorioBuilder from "@/components/relatorio/RelatorioBuilder";
import RelatorioListView from "@/components/relatorio/RelatorioListView";
import type { Relatorio, RelatorioFiltro } from "@/types/relatorio";
import { obterRelatorios, criarRelatorio, atualizarRelatorio, excluirRelatorio } from "@/services/relatorioService";
import { gerarERealizarDownloadExcel } from "@/lib/relatorioExcel";
import { gerarPdf } from "@/lib/relatorioPdf";
import { executarConsultaRelatorio, resolverChaveCampo } from "@/lib/relatorioQueryBuilder";
import { OPERADORES_FILTRO } from "@/lib/relatorioUtils";
import { getDataSource, resolverStatusLabel } from "@/lib/relatorioDataSources";

import {
  parseCamposConfig,
  serializeCamposConfig,
  campoRegrasDaColecao,
  camposObrigatoriosVazios,
  type CampoStatus,
} from "@/lib/camposConfigUtils";
import {
  PERMISSOES_POR_FUNCAO,
  PERMISSOES_GRUPOS,
  PERMISSOES_CONFIG_VERSION,
  parsePermissoesConfig,
  serializePermissoesConfig,
  migrarPermissoesConfig,
  parsePermissoesConfigMigrada,
  adminSubmodulosPermitidos,
  pessoaSubmodulosPermitidos,
  cgSubmodulosPermitidos,
  eaSubmodulosPermitidos,
  patrimonioSubmodulosPermitidos,
  temPermissao,
} from "@/lib/permissoesUtils";
import type { PermissaoDef } from "@/lib/permissoesUtils";
import PessoaFisicaLookupTable from "@/components/pessoaFisica/PessoaFisicaLookupTable";
import CidadeLookupTable from "@/components/pessoaFisica/CidadeLookupTable";
import SearchIcon from "@/components/ui/SearchIcon";
import ViewIcon from "@/components/ui/ViewIcon";
import PessoaFisicaViewModal from "@/components/pessoaFisica/PessoaFisicaViewModal";
import PessoaJuridicaViewModal from "@/components/pessoaJuridica/PessoaJuridicaViewModal";
import { buscarCidades, cidadePorCodigo, type Cidade } from "@/services/cidadeService";
import { obterEstados } from "@/services/estadoService";
import CadastroGeralListView from "@/components/cadastrosGerais/CadastroGeralListView";
import CadastroGeralFormView, { type CadastroGeralFormData } from "@/components/cadastrosGerais/CadastroGeralFormView";
import CadastroGeralFilterModal, { type CadastroGeralFilterForm } from "@/components/cadastrosGerais/CadastroGeralFilterModal";
import PessoaJuridicaFilterModal, { type PessoaJuridicaFilterForm } from "@/components/pessoaJuridica/PessoaJuridicaFilterModal";
import Select from "@/components/ui/Select";
import type { Sexo } from "@/types/sexo";
import type { EstadoCivil } from "@/types/estadoCivil";
import type { CorRaca } from "@/types/corRaca";
import type { Profissao } from "@/types/profissao";
import type { OrgaoEmissor } from "@/types/orgaoEmissor";
import type { Logradouro } from "@/types/logradouro";
import type { GrauParentesco } from "@/types/grauParentesco";
import type { Cargo } from "@/types/cargo";
import type { VinculoContratual } from "@/types/vinculoContratual";
import type { Localizacao } from "@/types/localizacao";
import type { Marca } from "@/types/marca";
import type { CategoriaAtivo } from "@/types/categoriaAtivo";
import type { SistemaOperacional } from "@/types/sistemaOperacional";
import type { Ativo } from "@/types/ativo";
import { SEXO_COLUMNS, SEXO_FIELD_INFOS } from "@/lib/sexoUtils";
import { ESTADO_CIVIL_COLUMNS, ESTADO_CIVIL_FIELD_INFOS } from "@/lib/estadoCivilUtils";
import { COR_RACA_COLUMNS, COR_RACA_FIELD_INFOS } from "@/lib/corRacaUtils";
import { PROFISSAO_COLUMNS, PROFISSAO_FIELD_INFOS } from "@/lib/profissaoUtils";
import { ORGAO_EMISSOR_COLUMNS, ORGAO_EMISSOR_FIELD_INFOS } from "@/lib/orgaoEmissorUtils";
import { LOGRADOURO_COLUMNS, LOGRADOURO_FIELD_INFOS } from "@/lib/logradouroUtils";
import { GRAU_PARENTESCO_COLUMNS, GRAU_PARENTESCO_FIELD_INFOS } from "@/lib/grauParentescoUtils";
import { CARGO_COLUMNS, CARGO_FIELD_INFOS } from "@/lib/cargoUtils";
import { VINCULO_CONTRATUAL_COLUMNS, VINCULO_CONTRATUAL_FIELD_INFOS } from "@/lib/vinculoContratualUtils";
import { LOCALIZACAO_COLUMNS, LOCALIZACAO_FIELD_INFOS } from "@/lib/localizacaoUtils";
import { MARCA_COLUMNS, MARCA_FIELD_INFOS } from "@/lib/marcaUtils";
import { CATEGORIA_ATIVO_COLUMNS, CATEGORIA_ATIVO_FIELD_INFOS } from "@/lib/categoriaAtivoUtils";
import { SISTEMA_OPERACIONAL_COLUMNS, SISTEMA_OPERACIONAL_FIELD_INFOS } from "@/lib/sistemaOperacionalUtils";
import { ATIVO_COLUMNS, STATUS_OPTIONS as ATIVO_STATUS_OPTIONS, applyIPv4Mask } from "@/lib/ativoUtils";
import { formatCadastroGeralCellValue } from "@/lib/cadastroGeralUtils";
import type { Usuario } from "@/types/usuario";
import type { Perfil } from "@/types/perfil";
import type { ContextMenuState } from "@/types/contextMenu";
import { PERFIL_COLUMNS, parseFuncoesConfig } from "@/lib/perfilUtils";
import { obterPerfis, criarPerfil, atualizarPerfil, excluirPerfil } from "@/services/perfilService";

/* ------------------------------------------------------------------ */
/*  Estado inicial do formulário                                      */
/* ------------------------------------------------------------------ */

const emptyForm: Omit<PessoaFisica, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao"> = {
  ds_nome: "",
  nr_cpf: "",
  dt_nascimento: "",
  ds_email: "",
  nr_telefone: "",
  nr_seq_sexo: undefined,
  nr_seq_estado_civil: undefined,
  nr_seq_cor_raca: undefined,
  nr_seq_profissao: undefined,
  nr_rg: "",
  dt_emissao: "",
  nr_seq_orgao_emissor: undefined,
  sg_estado: "",
  cd_ibge_naturalidade: "",
  nr_cep: "",
  ds_endereco: "",
  nr_endereco: "",
  ds_bairro: "",
  ds_complemento: "",
  nr_seq_logradouro: undefined,
};

/* Chave da sessão persistida no localStorage */
const SESSION_KEY = "quasar_session";

/* Chave base da preferência de tema no localStorage (uma por usuário) */
const DARK_MODE_KEY = "quasar_dark_mode";

/* Versão do sistema exibida na pop-up do usuário (sincronizada com package.json) */
const SYSTEM_VERSION = "0.62.16";

/* Siglas das UFs para o filtro de Estado do lookup de cidades (IBGE) */
const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
].map((uf) => ({ value: uf, label: uf }));

function getDarkModeKey(userId?: string | null): string {
  return userId ? `${DARK_MODE_KEY}_${userId}` : DARK_MODE_KEY;
}

const ACTIVE_PERFIL_KEY = "quasar_active_perfil";

function getActivePerfilKey(userId?: string | null): string {
  return userId ? `${ACTIVE_PERFIL_KEY}_${userId}` : ACTIVE_PERFIL_KEY;
}

type ViewType = "list" | "form";
type SectionType = "pessoaFisica" | "administracaoSistema" | "cadastrosGerais" | "estruturaAcademica" | "patrimonio" | "relatorio";

type FilterFormData = Omit<
  FormData,
  "nr_sequencia" | "nr_seq_sexo" | "nr_seq_estado_civil" | "nr_seq_cor_raca" | "nr_seq_profissao"
> & {
  nr_sequencia: string;
  dt_nascimento_inicio: string;
  dt_nascimento_fim: string;
  nr_seq_sexo: string;
  nr_seq_estado_civil: string;
  nr_seq_cor_raca: string;
  nr_seq_profissao: string;
};

export type AdminFormData = Omit<Usuario, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao">;

const emptyFilterForm: FilterFormData = {
  ...emptyForm,
  nr_sequencia: "",
  dt_nascimento_inicio: "",
  dt_nascimento_fim: "",
  nr_seq_sexo: "",
  nr_seq_estado_civil: "",
  nr_seq_cor_raca: "",
  nr_seq_profissao: "",
};

const emptyAdminForm: AdminFormData = {
  ds_usuario: "",
  ds_usuario_alternativo: "",
  ds_senha: "",
  ds_observacao: "",
  ie_status: 'A',
  ie_base_conhecimento: 'N',
  ie_central_suporte: 'N',
};

const emptyCgForm: CadastroGeralFormData = {
  descricao: "",
  ie_status: 'A',
  nr_cbo: '',
  sg_sigla: '',
  ds_observacao: '',
};

const CG_SELECT_OPTIONS = [
  { value: 'cargo', label: 'Cargo' },
  { value: 'categoriaAtivo', label: 'Categoria (ativo)' },
  { value: 'corRaca', label: 'Cor/Raça' },
  { value: 'estadoCivil', label: 'Estado civil' },
  { value: 'grauParentesco', label: 'Grau de parentesco' },
  { value: 'localizacao', label: 'Localização' },
  { value: 'logradouro', label: 'Logradouro' },
  { value: 'marca', label: 'Marca' },
  { value: 'orgaoEmissor', label: 'Órgão emissor' },
  { value: 'profissao', label: 'Profissão' },
  { value: 'sexo', label: 'Sexo' },
  { value: 'sistemaOperacional', label: 'Sistema operacional' },
  { value: 'vinculoContratual', label: 'Vínculo contratual' },
];

/* Opções do dropdown da função Pessoas Físicas / Pessoas Jurídicas */
const PJ_SELECT_OPTIONS = [
  { value: 'pessoasFisicas', label: 'Pessoas Físicas' },
  { value: 'pessoasJuridicas', label: 'Pessoas Jurídicas' },
];

/* Opções do dropdown da função Estrutura Acadêmica */
const EA_SELECT_OPTIONS = [
  { value: 'alunos', label: 'Alunos' },
  { value: 'colaboradores', label: 'Colaboradores' },
];

/* Opções do dropdown da função Patrimônio */
const PATRIMONIO_SELECT_OPTIONS = [
  { value: 'ativos', label: 'Ativos' },
  { value: 'manutencoes', label: 'Manutenções' },
  { value: 'parametrosFuncao', label: 'Parâmetros da função' },
];

const RELATORIO_SELECT_OPTIONS = [
  { value: 'relatorio', label: 'Gerenciador de Relatórios' },
];

type PjFormData = Omit<PessoaJuridica, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao">;

const emptyAlunoForm: AlunoFormData = {
  nr_seq_pessoa_fisica: undefined,
  nr_matricula: "",
  dt_ingresso: "",
  dt_status: "",
  ds_status: "",
  ie_status: 'A',
  responsaveis: [{ nr_seq_responsavel: undefined, nr_seq_grau_parentesco: undefined }],
  ds_tipo_sanguineo: '',
  ds_alergia: [],
  ds_medicamento_continuo: [],
  ds_restricao_alimentar: [],
  ds_necessidade_especial: [],
  ds_observacao_medica: "",
};

const emptyColaboradorForm: ColaboradorFormData = {
  nr_seq_pessoa_fisica: undefined,
  nr_seq_pessoa_juridica: undefined,
  nr_seq_vinculo_contratual: undefined,
  ie_fornecedor: 'N',
  ie_prestador_servico: 'N',
  nr_matricula: "",
  dt_admissao: "",
  dt_status: "",
  ds_motivo_status: "",
  ie_status: 'A',
};

const emptyAtivoForm: AtivoFormData = {
  cd_patrimonio: "",
  ds_ativo: "",
  nr_seq_categoria: undefined,
  nr_seq_localizacao: undefined,
  nr_seq_marca: undefined,
  ds_modelo: "",
  nr_serie: "",
  ds_qr_code: "",
  ds_codigo_barras: "",
  ie_status: 'O',
  dt_ultima_manutencao: '',
  nr_seq_ultima_manutencao: undefined,
  dt_status: '',
  ds_motivo_status: '',
  dt_aquisicao: '',
  dt_garantia: '',
  ds_processador: "",
  qt_ram: undefined,
  ie_ram: '',
  qt_armazenamento: undefined,
  ie_armazenamento: "",
  ds_endereco_mac: "",
  ds_ip: "",
  nr_seq_sistema_operacional: undefined,
  responsaveis: [{ nr_seq_responsavel: undefined }],
  ds_observacao: "",
};

/** Chaves da seção Informações médicas com lista de valores (Observações
 * médicas é campo único e fica de fora). */
const CAMPOS_MEDICOS_ALUNO = [
  'ds_alergia',
  'ds_medicamento_continuo',
  'ds_restricao_alimentar',
  'ds_necessidade_especial',
] as const;

/** Extrai os valores preenchidos das listas de informações médicas (descarta vazios). */
function filtroValoresMedicos(aluno: Partial<Aluno>): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const campo of CAMPOS_MEDICOS_ALUNO) {
    const lista = aluno[campo];
    result[campo] = Array.isArray(lista) ? lista.filter((v) => v && v.trim() !== '') : [];
  }
  return result;
}

/** Converte um aluno salvo para o formato responsaveis[] (migra campos legados). */
function migrarResponsaveis(aluno: Aluno): AlunoResponsavel[] {
  // Formato novo gravado (mesmo que vazio — usuário limpou todos): respeita.
  if (Array.isArray(aluno.responsaveis)) {
    return aluno.responsaveis.length > 0
      ? aluno.responsaveis.map((r) => ({ ...r }))
      : [{ nr_seq_responsavel: undefined, nr_seq_grau_parentesco: undefined }];
  }
  // Legado: nr_seq_responsavel/nr_seq_grau_parentesco no documento.
  if (aluno.nr_seq_responsavel || aluno.nr_seq_grau_parentesco) {
    return [{ nr_seq_responsavel: aluno.nr_seq_responsavel, nr_seq_grau_parentesco: aluno.nr_seq_grau_parentesco }];
  }
  return [{ nr_seq_responsavel: undefined, nr_seq_grau_parentesco: undefined }];
}

const emptyPjForm: PjFormData = {
  ds_razao_social: "",
  ds_nome_fantasia: "",
  nr_cnpj: "",
  nr_inscricao_estadual: "",
  nr_inscricao_municipal: "",
  dt_abertura: "",
  nr_telefone: "",
  ds_email: "",
  nr_cep: "",
  ds_endereco: "",
  nr_endereco: "",
  ds_bairro: "",
  ds_complemento: "",
  nr_seq_logradouro: undefined,
  sg_estado: "",
  cd_ibge_cidade: "",
};

type PjFilterFormData = {
  nr_sequencia: string;
  ds_razao_social: string;
  ds_nome_fantasia: string;
  nr_cnpj: string;
  nr_inscricao_estadual: string;
  nr_inscricao_municipal: string;
  dt_abertura_inicio: string;
  dt_abertura_fim: string;
  ds_email: string;
  nr_telefone: string;
  sg_estado: string;
  cd_ibge_cidade: string;
};

const emptyPjFilterForm: PjFilterFormData = {
  nr_sequencia: '',
  ds_razao_social: '',
  ds_nome_fantasia: '',
  nr_cnpj: '',
  nr_inscricao_estadual: '',
  nr_inscricao_municipal: '',
  dt_abertura_inicio: '',
  dt_abertura_fim: '',
  ds_email: '',
  nr_telefone: '',
  sg_estado: '',
  cd_ibge_cidade: '',
};

type CgItem = Sexo | EstadoCivil | CorRaca | Profissao | OrgaoEmissor | Logradouro | GrauParentesco | Cargo | VinculoContratual | Localizacao | Marca | CategoriaAtivo | SistemaOperacional;

/* ------------------------------------------------------------------ */
/*  Funções do menu lateral (ordenáveis por arrastar)                */
/* ------------------------------------------------------------------ */

const DEFAULT_SECTION_ORDER: SectionType[] = ["pessoaFisica", "administracaoSistema", "cadastrosGerais", "estruturaAcademica", "patrimonio", "relatorio"];

function normalizeMenuOrder(parsed: SectionType[]): SectionType[] {
  const result = [...new Set(parsed)];
  for (const section of DEFAULT_SECTION_ORDER) {
    if (!result.includes(section)) result.push(section);
  }
  return result;
}

function parseMenuOrder(raw?: string | null): SectionType[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const valid = parsed.filter((s) => s === "pessoaFisica" || s === "administracaoSistema" || s === "cadastrosGerais" || s === "estruturaAcademica" || s === "patrimonio" || s === "relatorio") as SectionType[];
    if (valid.length === 0) return null;
    return valid;
  } catch {
    return null;
  }
}

function serializeMenuOrder(order: SectionType[]): string {
  return JSON.stringify(order);
}

function serializeFuncoesConfig(funcoes: SectionType[]): string {
  return JSON.stringify(funcoes);
}

function parsePerfisConfig(raw?: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v) => typeof v === 'number').map(Number);
  } catch {
    return [];
  }
}

function serializePerfisConfig(perfis: number[]): string {
  return JSON.stringify(perfis);
}

// Usuário 'administrador' e perfil 'Administrador' são protegidos: outros
// usuários só podem vê-los (não alterar/excluir/delegar).
function isAdministradorUsuario(usuario?: { ds_usuario?: string | null } | null): boolean {
  return (usuario?.ds_usuario ?? '').trim().toLowerCase() === 'administrador';
}

function isAdministradorPerfil(perfil?: { ds_perfil?: string | null } | null): boolean {
  return (perfil?.ds_perfil ?? '').trim().toLowerCase() === 'administrador';
}

const SECTION_DEFS: Record<SectionType, { label: string; labelMaxW: string; icon: React.ReactNode }> = {
  pessoaFisica: {
    label: "Cadastro de Pessoas",
    labelMaxW: "max-w-[200px]",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="7" r="3" />
        <circle cx="6.5" cy="9.5" r="2" />
        <circle cx="17.5" cy="9.5" r="2" />
        <path d="M4 19a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4" />
      </svg>
    ),
  },
  administracaoSistema: {
    label: "Administração do Sistema",
    labelMaxW: "max-w-[220px]",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="5" y="6" width="14" height="12" rx="2" />
        <path d="M8 4v2" />
        <path d="M16 4v2" />
        <path d="M12 4v2" />
        <path d="M8 20v-2" />
        <path d="M16 20v-2" />
        <path d="M4 10h2" />
        <path d="M4 14h2" />
        <path d="M20 10h2" />
        <path d="M20 14h2" />
        <path d="M7 12h10" />
      </svg>
    ),
  },
  cadastrosGerais: {
    label: "Cadastros Gerais",
    labelMaxW: "max-w-[180px]",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  estruturaAcademica: {
    label: "Estrutura Acadêmica",
    labelMaxW: "max-w-[190px]",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m2 9 10-5 10 5-10 5z" />
        <path d="M6 11v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
        <path d="M22 9v5" />
      </svg>
    ),
  },
  patrimonio: {
    label: "Patrimônio",
    labelMaxW: "max-w-[150px]",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
  },
  relatorio: {
    label: "Gerenciador de Relatórios",
    labelMaxW: "max-w-[220px]",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
      </svg>
    ),
  },
};

/* Ordem alfabética das funções (pelos nomes do menu lateral) */
const SECTION_ORDER_ALPHABETICAL: SectionType[] = [...DEFAULT_SECTION_ORDER].sort((a, b) =>
  SECTION_DEFS[a].label.localeCompare(SECTION_DEFS[b].label, 'pt-BR')
);

/* ------------------------------------------------------------------ */
/*  Tipos das props dos subcomponentes                                */
/* ------------------------------------------------------------------ */

interface ListViewProps {
  message: string;
  loading: boolean;
  pessoasFisicas: PessoaFisica[];
  openNewForm: () => void;
  openEditForm: (pessoa: PessoaFisica) => void;
  handleDelete: (id: string) => void;
  openFilter: () => void;
  setContextMenu: React.Dispatch<React.SetStateAction<{
    x: number;
    y: number;
    pessoa: PessoaFisica;
  } | null>>;
  sortColumn: number | null;
  sortAsc: boolean | null;
  onSortChange: (logicalIndex: number) => void;
}

type FormData = Omit<PessoaFisica, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao">;

interface FormViewProps {
  message: string;
  editingId: string | null;
  sequence?: number | null;
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  submitting: boolean;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  goToList: () => void;
  createdAt: string;
  updatedAt: string;
  onOpenAudit?: (pessoaId?: string | null) => void;
  onPrevRecord: () => void;
  onNextRecord: () => void;
  hasPrevRecord: boolean;
  hasNextRecord: boolean;
}

/* ------------------------------------------------------------------ */
/*  Componente principal                                              */
/* ------------------------------------------------------------------ */

export default function Home() {
  const [form, setForm] = useState<FormData>(emptyForm);
  const [filterForm, setFilterForm] = useState<FilterFormData>(emptyFilterForm);
  const [appliedFilterForm, setAppliedFilterForm] = useState<FilterFormData>(emptyFilterForm);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  type AdminFilterFormData = {
    nr_sequencia: string;
    ds_usuario: string;
    ds_usuario_alternativo: string;
    nr_seq_pessoa_fisica: string;
    ie_status: string;
  };
  const emptyAdminFilterForm: AdminFilterFormData = {
    nr_sequencia: '',
    ds_usuario: '',
    ds_usuario_alternativo: '',
    nr_seq_pessoa_fisica: '',
    ie_status: 'T',
  };
  const [adminFilterForm, setAdminFilterForm] = useState<AdminFilterFormData>(emptyAdminFilterForm);
  const [appliedAdminFilterForm, setAppliedAdminFilterForm] = useState<AdminFilterFormData>(emptyAdminFilterForm);
  const [adminFilterModalOpen, setAdminFilterModalOpen] = useState(false);
  const [adminPessoaFisicaLookupOpen, setAdminPessoaFisicaLookupOpen] = useState(false);
  const [adminPessoaFisicaLookupForm, setAdminPessoaFisicaLookupForm] = useState({ ds_nome: '', nr_sequencia: '', nr_cpf: '' });
  const [adminPessoaFisicaLookupFilter, setAdminPessoaFisicaLookupFilter] = useState({ ds_nome: '', nr_sequencia: '', nr_cpf: '' });
  const [adminPessoaFisicaLookupApplied, setAdminPessoaFisicaLookupApplied] = useState(false);
  const [pessoasFisicas, setPessoasFisicas] = useState<PessoaFisica[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [auditInfo, setAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditPessoaIdRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [auditDocumentType, setAuditDocumentType] = useState<'pessoa_fisica' | 'pessoa_juridica' | 'usuario' | 'perfil' | 'aluno' | 'colaborador' | 'pat_ativo' | 'pat_manutencao' | 'pat_parametros' | 'cg_sexo' | 'cg_estado_civil' | 'cg_cor_raca' | 'cg_profissao' | 'cg_orgao_emissor' | 'cg_logradouro' | 'cg_grau_parentesco' | 'cg_cargo' | 'cg_vinculo_contratual' | 'cg_localizacao' | 'cg_marca' | 'cg_categoria_ativo' | 'relatorio'>('pessoa_fisica');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAuditIndex, setSelectedAuditIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionRestoring, setSessionRestoring] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isUserMenuClosing, setIsUserMenuClosing] = useState(false);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginWarning, setLoginWarning] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionType>("pessoaFisica");
  const [view, setView] = useState<ViewType>("list");
  // Lembra em que tela (lista ou formulário) o usuário estava em cada função do
  // menu lateral, para restaurar ao voltar — mesma tela de antes da navegação.
  const [sectionViews, setSectionViews] = useState<Partial<Record<SectionType, ViewType>>>({});
  useEffect(() => {
    setSectionViews((prev) => {
      if (prev[activeSection] === view) return prev;
      return { ...prev, [activeSection]: view };
    });
  }, [activeSection, view]);
  const [adminManageSelection, setAdminManageSelection] = useState<string>('');
  const [adminInteracted, setAdminInteracted] = useState(false);
  const [camposPerfilId, setCamposPerfilId] = useState<string | null>(null);
  const [camposFuncao, setCamposFuncao] = useState<string | null>(null);
  const [camposFuncaoJaSelecionada, setCamposFuncaoJaSelecionada] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMounted, setToastMounted] = useState(false);
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean | null>(null);
  const [adminSortColumn, setAdminSortColumn] = useState<number | null>(null);
  const [adminSortAsc, setAdminSortAsc] = useState<boolean | null>(null);
  const [cgSortColumn, setCgSortColumn] = useState<number | null>(null);
  const [cgSortAsc, setCgSortAsc] = useState<boolean | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [sexos, setSexos] = useState<Sexo[]>([]);
  const [estadoCivis, setEstadoCivis] = useState<EstadoCivil[]>([]);
  const [coresRacas, setCoresRacas] = useState<CorRaca[]>([]);
  const [profissoes, setProfissoes] = useState<Profissao[]>([]);
  const [orgaosEmissores, setOrgaosEmissores] = useState<OrgaoEmissor[]>([]);
  const [logradouros, setLogradouros] = useState<Logradouro[]>([]);
  const [grausParentesco, setGrausParentesco] = useState<GrauParentesco[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [vinculosContratuais, setVinculosContratuais] = useState<VinculoContratual[]>([]);
  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [categoriasAtivos, setCategoriasAtivos] = useState<CategoriaAtivo[]>([]);
  const [sistemasOperacionais, setSistemasOperacionais] = useState<SistemaOperacional[]>([]);
  const [estados, setEstados] = useState<{ value: string; label: string }[]>([]);
  const [cgForm, setCgForm] = useState<CadastroGeralFormData>(emptyCgForm);
  const [cgEditingId, setCgEditingId] = useState<string | null>(null);
  const [cgSubmitting, setCgSubmitting] = useState(false);
  const [cgAuditInfo, setCgAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditCgIdRef = useRef<string | null>(null);
  const [cgFilterModalOpen, setCgFilterModalOpen] = useState(false);
  const [cgFilterForm, setCgFilterForm] = useState<CadastroGeralFilterForm>({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  const [appliedCgFilterForm, setAppliedCgFilterForm] = useState<CadastroGeralFilterForm>({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  const [cgManageSelection, setCgManageSelection] = useState<string>('');
  const [cgInteracted, setCgInteracted] = useState(false);
  const [adminForm, setAdminForm] = useState<AdminFormData>(emptyAdminForm);
  const [adminEditingId, setAdminEditingId] = useState<string | null>(null);
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [adminAuditInfo, setAdminAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditUsuarioIdRef = useRef<string | null>(null);
  const [perfilForm, setPerfilForm] = useState<PerfilFormData>({ ds_perfil: '', ds_observacao: '', ie_status: 'A' });
  const [perfilEditingId, setPerfilEditingId] = useState<string | null>(null);
  const [perfilSubmitting, setPerfilSubmitting] = useState(false);
  const [perfilAuditInfo, setPerfilAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditPerfilIdRef = useRef<string | null>(null);
  const [perfilFilterForm, setPerfilFilterForm] = useState({ nr_sequencia: '', ds_perfil: '', ie_status: 'T' });
  const [appliedPerfilFilterForm, setAppliedPerfilFilterForm] = useState({ nr_sequencia: '', ds_perfil: '', ie_status: 'T' });
  const [perfilFilterModalOpen, setPerfilFilterModalOpen] = useState(false);
  const [perfilSortColumn, setPerfilSortColumn] = useState<number | null>(null);
  const [perfilSortAsc, setPerfilSortAsc] = useState<boolean | null>(null);
  const [delegateFuncoesModalOpen, setDelegateFuncoesModalOpen] = useState(false);
  const [delegateFuncoesPerfil, setDelegateFuncoesPerfil] = useState<Perfil | null>(null);
  const [delegateFuncoes, setDelegateFuncoes] = useState<SectionType[]>([]);
  const [delegateFuncoesSaving, setDelegateFuncoesSaving] = useState(false);
  // Modal "Permissões da função" (aberto pelo card de função no modal Delegar funções).
  const [permissoesModalOpen, setPermissoesModalOpen] = useState(false);
  const [permissoesPerfil, setPermissoesPerfil] = useState<Perfil | null>(null);
  const [permissoesFuncao, setPermissoesFuncao] = useState<SectionType | null>(null);
  const [permissoesSelecionadas, setPermissoesSelecionadas] = useState<string[]>([]);
  const [permissoesSaving, setPermissoesSaving] = useState(false);
  const [delegatePerfisModalOpen, setDelegatePerfisModalOpen] = useState(false);
  const [activePerfilSequencia, setActivePerfilSequencia] = useState<number | null>(null);
  const [duplicatePerfilModalOpen, setDuplicatePerfilModalOpen] = useState(false);
  const [duplicatePerfilSource, setDuplicatePerfilSource] = useState<Perfil | null>(null);
  const [duplicatePerfilName, setDuplicatePerfilName] = useState('');
  const [duplicatePerfilSaving, setDuplicatePerfilSaving] = useState(false);
  // Campos obrigatórios vazios por formulário (Administração > Campos).
  const [pfCampoErros, setPfCampoErros] = useState<string[]>([]);
  const [pjCampoErros, setPjCampoErros] = useState<string[]>([]);
  const [adminCampoErros, setAdminCampoErros] = useState<string[]>([]);
  const [perfilCampoErros, setPerfilCampoErros] = useState<string[]>([]);
  const [cgCampoErros, setCgCampoErros] = useState<string[]>([]);
  const [delegatePerfisUsuario, setDelegatePerfisUsuario] = useState<Usuario | null>(null);

  // Perfis ativos disponíveis no modal "Delegar perfis": ordenados por nome e,
  // para usuários comuns, sem o perfil Administrador (exclusivo do admin).
  const delegatePerfisDisponiveis = useMemo(() => {
    const alvoEhAdministrador = isAdministradorUsuario(delegatePerfisUsuario);
    return perfis
      .filter((p) => String(p.ie_status ?? '').toUpperCase() === 'A')
      .filter((p) => alvoEhAdministrador || !isAdministradorPerfil(p))
      .sort((a, b) => (a.ds_perfil ?? '').localeCompare(b.ds_perfil ?? '', 'pt-BR'));
  }, [delegatePerfisUsuario, perfis]);
  const [delegatePerfis, setDelegatePerfis] = useState<number[]>([]);
  const [delegatePerfisSaving, setDelegatePerfisSaving] = useState(false);
  const [adminOriginalSenhaHash, setAdminOriginalSenhaHash] = useState<string | null>(null);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [pessoaFisicaLookupOpen, setPessoaFisicaLookupOpen] = useState(false);
  // Pessoa física em visualização (modal de leitura, estilo Detalhe da auditoria).
  const [pessoaFisicaView, setPessoaFisicaView] = useState<PessoaFisica | null>(null);
  const [ativoView, setAtivoView] = useState<Ativo | null>(null);
  // Manutenção em visualização (modal de leitura).
  const [manutencaoView, setManutencaoView] = useState<Manutencao | null>(null);
  // Colaborador em visualização (modal de leitura).
  const [colaboradorView, setColaboradorView] = useState<Colaborador | null>(null);
  const [pessoaJuridicaView, setPessoaJuridicaView] = useState<PessoaJuridica | null>(null);
  const [pessoaJuridicaViewCidade, setPessoaJuridicaViewCidade] = useState('');
  const pessoaJuridicaViewCodeRef = useRef<string>('');
  const [lookupForm, setLookupForm] = useState({ ds_nome: '', nr_sequencia: '', nr_cpf: '' });
  const [lookupFilter, setLookupFilter] = useState({ ds_nome: '', nr_sequencia: '', nr_cpf: '' });
  const [lookupApplied, setLookupApplied] = useState(false);
  const [naturalidadeLookupOpen, setNaturalidadeLookupOpen] = useState(false);
  const [cidadeLookupForm, setCidadeLookupForm] = useState({ codigo: '', nome: '', uf: '' });
  const [cidadeLookupApplied, setCidadeLookupApplied] = useState(false);
  const [cidadeResults, setCidadeResults] = useState<Cidade[]>([]);
  const [cidadeLoading, setCidadeLoading] = useState(false);
  const [naturalidadeNome, setNaturalidadeNome] = useState('');
  const naturalidadeCodeRef = useRef('');
  /* ── Estado de Pessoas Jurídicas ── */
  const [pjManageSelection, setPjManageSelection] = useState<string>('');
  const [pjInteracted, setPjInteracted] = useState(false);
  const [pessoasJuridicas, setPessoasJuridicas] = useState<PessoaJuridica[]>([]);
  const [pjForm, setPjForm] = useState<PjFormData>(emptyPjForm);
  const [pjFilterForm, setPjFilterForm] = useState<PjFilterFormData>(emptyPjFilterForm);
  const [appliedPjFilterForm, setAppliedPjFilterForm] = useState<PjFilterFormData>(emptyPjFilterForm);
  const [pjFilterModalOpen, setPjFilterModalOpen] = useState(false);
  const [pjEditingId, setPjEditingId] = useState<string | null>(null);
  const [pjAuditInfo, setPjAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditPjIdRef = useRef<string | null>(null);
  const [pjSubmitting, setPjSubmitting] = useState(false);
  const [pjSortColumn, setPjSortColumn] = useState<number | null>(null);
  const [pjSortAsc, setPjSortAsc] = useState<boolean | null>(null);
  const [pjCidadeLookupOpen, setPjCidadeLookupOpen] = useState(false);
  const [pjCidadeLookupForm, setPjCidadeLookupForm] = useState({ codigo: '', nome: '', uf: '' });
  const [pjCidadeLookupApplied, setPjCidadeLookupApplied] = useState(false);
  const [pjCidadeResults, setPjCidadeResults] = useState<Cidade[]>([]);
  const [pjCidadeLoading, setPjCidadeLoading] = useState(false);
  const [pjCidadeNome, setPjCidadeNome] = useState('');
  const pjCidadeCodeRef = useRef('');
  // Define se o lookup de cidade aberto grava no formulário ou no filtro de PJ.
  const pjCidadeLookupTargetRef = useRef<'form' | 'filter'>('form');
  /* ── Estado de Estrutura Acadêmica (Alunos) ── */
  const [alunoManageSelection, setAlunoManageSelection] = useState<string>('');
  const [alunoInteracted, setAlunoInteracted] = useState(false);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [alunoForm, setAlunoForm] = useState<AlunoFormData>(emptyAlunoForm);
  const [alunoEditingId, setAlunoEditingId] = useState<string | null>(null);
  const [alunoAuditInfo, setAlunoAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditAlunoIdRef = useRef<string | null>(null);
  const [alunoSubmitting, setAlunoSubmitting] = useState(false);
  const [alunoSortColumn, setAlunoSortColumn] = useState<number | null>(null);
  const [alunoSortAsc, setAlunoSortAsc] = useState<boolean | null>(null);
  const [alunoCampoErros, setAlunoCampoErros] = useState<string[]>([]);
  const [alunoFilterModalOpen, setAlunoFilterModalOpen] = useState(false);
  const [alunoFilterForm, setAlunoFilterForm] = useState({ nr_sequencia: '', nr_matricula: '', nr_seq_pessoa_fisica: '', dt_ingresso_inicio: '', dt_ingresso_fim: '' });
  const [appliedAlunoFilterForm, setAppliedAlunoFilterForm] = useState({ nr_sequencia: '', nr_matricula: '', nr_seq_pessoa_fisica: '', dt_ingresso_inicio: '', dt_ingresso_fim: '' });
  const [alunoPessoaFisicaLookupOpen, setAlunoPessoaFisicaLookupOpen] = useState(false);
  const alunoPessoaFisicaLookupTargetRef = useRef<'aluno' | 'responsavel' | 'colaborador' | 'alunoFilter' | 'colaboradorFilter' | 'ativo' | 'ativoFilter' | 'manutencaoFilter'>('aluno');
  const alunoResponsavelLookupIndexRef = useRef(0);
  // Modal "Alterar status" do aluno (menu de contexto de Estrutura Acadêmica).
  const [alterarStatusModalOpen, setAlterarStatusModalOpen] = useState(false);
  const [alterarStatusAluno, setAlterarStatusAluno] = useState<Aluno | null>(null);
  const [alterarStatusForm, setAlterarStatusForm] = useState({ dt_status: '', ie_status: '', ds_status: '' });
  const [alterarStatusSaving, setAlterarStatusSaving] = useState(false);
  // Modal "Alterar data de ingresso" do aluno (menu de contexto de Estrutura Acadêmica).
  const [alterarIngressoModalOpen, setAlterarIngressoModalOpen] = useState(false);
  const [alterarIngressoAluno, setAlterarIngressoAluno] = useState<Aluno | null>(null);
  const [alterarIngressoForm, setAlterarIngressoForm] = useState({ dt_ingresso: '' });
  const [alterarIngressoSaving, setAlterarIngressoSaving] = useState(false);

  // Colaboradores (Estrutura Acadêmica > Colaboradores).
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [colaboradorForm, setColaboradorForm] = useState<ColaboradorFormData>(emptyColaboradorForm);
  const [colaboradorEditingId, setColaboradorEditingId] = useState<string | null>(null);
  const [colaboradorAuditInfo, setColaboradorAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditColaboradorIdRef = useRef<string | null>(null);
  const [colaboradorSubmitting, setColaboradorSubmitting] = useState(false);
  const [colaboradorSortColumn, setColaboradorSortColumn] = useState<number | null>(null);
  const [colaboradorSortAsc, setColaboradorSortAsc] = useState<boolean | null>(null);
  const [colaboradorCampoErros, setColaboradorCampoErros] = useState<string[]>([]);
  const [colaboradorFilterModalOpen, setColaboradorFilterModalOpen] = useState(false);
  const [colaboradorFilterForm, setColaboradorFilterForm] = useState({ nr_sequencia: '', nr_matricula: '', nr_seq_pessoa_fisica: '', nr_seq_pessoa_juridica: '', dt_admissao_inicio: '', dt_admissao_fim: '' });
  const [appliedColaboradorFilterForm, setAppliedColaboradorFilterForm] = useState({ nr_sequencia: '', nr_matricula: '', nr_seq_pessoa_fisica: '', nr_seq_pessoa_juridica: '', dt_admissao_inicio: '', dt_admissao_fim: '' });
  // Modal "Alterar data de admissão" do colaborador (menu de contexto de Estrutura Acadêmica).
  const [alterarAdmissaoModalOpen, setAlterarAdmissaoModalOpen] = useState(false);
  const [alterarAdmissaoColaborador, setAlterarAdmissaoColaborador] = useState<Colaborador | null>(null);
  const [alterarAdmissaoForm, setAlterarAdmissaoForm] = useState({ dt_admissao: '' });
  const [alterarAdmissaoSaving, setAlterarAdmissaoSaving] = useState(false);
  // Modal "Alterar status" do colaborador (menu de contexto de Estrutura Acadêmica).
  const [alterarStatusColaboradorModalOpen, setAlterarStatusColaboradorModalOpen] = useState(false);
  const [alterarStatusColaborador, setAlterarStatusColaborador] = useState<Colaborador | null>(null);
  const [alterarStatusColaboradorForm, setAlterarStatusColaboradorForm] = useState({ dt_status: '', ie_status: '', ds_motivo_status: '' });
  const [alterarStatusColaboradorSaving, setAlterarStatusColaboradorSaving] = useState(false);
  // Modal "Alterar status" do ativo (menu de contexto de Patrimônio).
  const [ativoStatusModalOpen, setAtivoStatusModalOpen] = useState(false);
  const [ativoStatusTarget, setAtivoStatusTarget] = useState<Ativo | null>(null);
  const [ativoStatusValue, setAtivoStatusValue] = useState('');
  const [ativoStatusForm, setAtivoStatusForm] = useState({ dt_data: '', ds_motivo_status: '' });
  const [ativoStatusSaving, setAtivoStatusSaving] = useState(false);
  // Modal "Enviar para manutenção" (menu de contexto de Ativos).
  const [enviarManutModalOpen, setEnviarManutModalOpen] = useState(false);
  const [enviarManutTarget, setEnviarManutTarget] = useState<Ativo | null>(null);
  const [enviarManutForm, setEnviarManutForm] = useState({ dt_data: '', nr_seq_prestador_servico: undefined as number | undefined, ds_motivo_manutencao: '' });
  const [enviarManutSaving, setEnviarManutSaving] = useState(false);
  // Lookup de prestador de serviço (filtra colaboradores com ie_prestador_servico='S').
  const [enviarManutPrestadorLookupOpen, setEnviarManutPrestadorLookupOpen] = useState(false);
  const [enviarManutPrestLookupForm, setEnviarManutPrestLookupForm] = useState({ nr_sequencia: '', ds_nome: '', nr_cpf: '', nr_cnpj: '' });
  const [enviarManutPrestLookupFilter, setEnviarManutPrestLookupFilter] = useState({ nr_sequencia: '', ds_nome: '', nr_cpf: '', nr_cnpj: '' });
  const [enviarManutPrestLookupApplied, setEnviarManutPrestLookupApplied] = useState(false);
  const enviarManutPrestadorLookupTargetRef = useRef<'modal' | 'form'>('modal');
  // Modal "Concluir manutenção" (menu de contexto de Ativos).
  const [concluirManutModalOpen, setConcluirManutModalOpen] = useState(false);
  const [concluirManutTarget, setConcluirManutTarget] = useState<{ ativo: Ativo | null; manutencao: Manutencao } | null>(null);
  const [concluirManutForm, setConcluirManutForm] = useState({ dt_termino: '', vl_total: '', ds_correcoes: '', ie_status_ativo: 'O' });
  const [concluirManutSaving, setConcluirManutSaving] = useState(false);
  const [cancelarManutOpen, setCancelarManutOpen] = useState(false);
  const [cancelarManutTarget, setCancelarManutTarget] = useState<Manutencao | null>(null);
  const enviarManutPrestadores = useMemo(() => {
    // Apenas colaboradores com ie_prestador_servico === 'S'.
    return colaboradores.filter((c) => c.ie_prestador_servico === 'S');
  }, [colaboradores]);
  const enviarManutFilteredPrestadores = useMemo(() => {
    if (!enviarManutPrestLookupApplied) return [];
    return enviarManutPrestadores.filter((c) => {
      const pf = pessoasFisicas.find((p) => p.nr_sequencia === c.nr_seq_pessoa_fisica);
      if (enviarManutPrestLookupFilter.nr_sequencia && String(c.nr_sequencia ?? '') !== enviarManutPrestLookupFilter.nr_sequencia.trim()) return false;
      if (enviarManutPrestLookupFilter.ds_nome && pf && !pf.ds_nome.toLowerCase().includes(enviarManutPrestLookupFilter.ds_nome.toLowerCase())) return false;
      if (enviarManutPrestLookupFilter.nr_cpf && pf) {
        const queryCpf = enviarManutPrestLookupFilter.nr_cpf.replace(/\D/g, '');
        const pessoaCpf = (pf.nr_cpf ?? '').replace(/\D/g, '');
        if (!pessoaCpf.includes(queryCpf)) return false;
      }
      if (enviarManutPrestLookupFilter.nr_cnpj && c.nr_seq_pessoa_juridica) {
        const pj = pessoasJuridicas.find((p) => p.nr_sequencia === c.nr_seq_pessoa_juridica);
        if (pj) {
          const queryCnpj = enviarManutPrestLookupFilter.nr_cnpj.replace(/\D/g, '');
          const pessoaCnpj = (pj.nr_cnpj ?? '').replace(/\D/g, '');
          if (!pessoaCnpj.includes(queryCnpj)) return false;
        } else {
          return false;
        }
      } else if (enviarManutPrestLookupFilter.nr_cnpj) {
        return false;
      }
      return true;
    });
  }, [enviarManutPrestadores, enviarManutPrestLookupFilter, enviarManutPrestLookupApplied, pessoasFisicas]);
  // Nome do prestador derivado do nr_seq_prestador_servico selecionado.
  const enviarManutPrestadorName = useMemo(() => {
    if (!enviarManutForm.nr_seq_prestador_servico) return '';
    const seq = enviarManutForm.nr_seq_prestador_servico;
    const col = colaboradores.find((c) => c.nr_sequencia === seq);
    if (col) {
      if (col.nr_seq_pessoa_juridica) {
        const pj = pessoasJuridicas.find((p) => p.nr_sequencia === col.nr_seq_pessoa_juridica);
        if (pj) return pj.ds_razao_social ?? '';
      }
      const pf = pessoasFisicas.find((p) => p.nr_sequencia === col.nr_seq_pessoa_fisica);
      if (pf) return pf.ds_nome ?? '';
    }
    return pessoasFisicas.find((p) => p.nr_sequencia === seq)?.ds_nome ?? '';
  }, [enviarManutForm.nr_seq_prestador_servico, pessoasFisicas, colaboradores, pessoasJuridicas]);
  const [colaboradorPessoaFisicaLookupOpen, setColaboradorPessoaFisicaLookupOpen] = useState(false);
  const [colaboradorPessoaJuridicaLookupOpen, setColaboradorPessoaJuridicaLookupOpen] = useState(false);
  const [colaboradorPjLookupForm, setColaboradorPjLookupForm] = useState({ nr_sequencia: '', ds_razao_social: '', nr_cnpj: '' });
  const [colaboradorPjLookupFilter, setColaboradorPjLookupFilter] = useState({ nr_sequencia: '', ds_razao_social: '', nr_cnpj: '' });
  const [colaboradorPjLookupApplied, setColaboradorPjLookupApplied] = useState(false);
  const colaboradorPjLookupTargetRef = useRef<'form' | 'filter'>('form');

  // Patrimônio > Ativos.
  const [ativoManageSelection, setAtivoManageSelection] = useState<string>('');
  const [ativoInteracted, setAtivoInteracted] = useState(false);
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [ativoForm, setAtivoForm] = useState<AtivoFormData>(emptyAtivoForm);
  const [ativoEditingId, setAtivoEditingId] = useState<string | null>(null);
  const [ativoAuditInfo, setAtivoAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditAtivoIdRef = useRef<string | null>(null);
  const [ativoSubmitting, setAtivoSubmitting] = useState(false);
  const [gerandoCodigoPatrimonio, setGerandoCodigoPatrimonio] = useState(false);

  // Filtro de Ativos.
  type AtivoFilterFormData = {
    // Identificação
    nr_sequencia: string;
    cd_patrimonio: string;
    ds_ativo: string;
    ds_modelo: string;
    nr_serie: string;
    ds_qr_code: string;
    ds_codigo_barras: string;
    dt_aquisicao_inicio: string;
    dt_aquisicao_fim: string;
    dt_garantia_inicio: string;
    dt_garantia_fim: string;
    ie_status: string;
    // Classificação
    nr_seq_categoria: string;
    nr_seq_localizacao: string;
    nr_seq_marca: string;
    nr_seq_responsavel: string;
    // Dispositivo
    ds_endereco_mac: string;
    ds_ip: string;
    nr_seq_sistema_operacional: string;
  };
  const emptyAtivoFilterForm: AtivoFilterFormData = {
    nr_sequencia: '', cd_patrimonio: '', ds_ativo: '', ds_modelo: '', nr_serie: '', ds_qr_code: '', ds_codigo_barras: '',
    dt_aquisicao_inicio: '', dt_aquisicao_fim: '', dt_garantia_inicio: '', dt_garantia_fim: '', ie_status: 'T',
    nr_seq_categoria: '', nr_seq_localizacao: '', nr_seq_marca: '', nr_seq_responsavel: '',
    ds_endereco_mac: '', ds_ip: '', nr_seq_sistema_operacional: '',
  };
  const [ativoFilterForm, setAtivoFilterForm] = useState<AtivoFilterFormData>(emptyAtivoFilterForm);
  const [appliedAtivoFilterForm, setAppliedAtivoFilterForm] = useState<AtivoFilterFormData>(emptyAtivoFilterForm);
  const [ativoFilterModalOpen, setAtivoFilterModalOpen] = useState(false);
  const [parametrosSaving, setParametrosSaving] = useState(false);
  const [parametrosAuditInfo, setParametrosAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const [parametrosHasDocument, setParametrosHasDocument] = useState(false);

  // Patrimônio > Manutenções.
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [manutencaoForm, setManutencaoForm] = useState<ManutencaoFormData>({ nr_seq_ativo: undefined, dt_envio: '', dt_termino: '', vl_total: undefined, ds_observacao: '', ie_status_manutencao: 'E' });
  const [manutencaoEditingId, setManutencaoEditingId] = useState<string | null>(null);
  const [manutencaoAuditInfo, setManutencaoAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditManutencaoIdRef = useRef<string | null>(null);
  const [manutencaoSubmitting, setManutencaoSubmitting] = useState(false);
  const [manutencaoSortColumn, setManutencaoSortColumn] = useState<number | null>(null);
  const [manutencaoSortAsc, setManutencaoSortAsc] = useState<boolean | null>(null);
  const [manutencaoCampoErros, setManutencaoCampoErros] = useState<string[]>([]);

  // Filtro de Manutenções.
  type ManutencaoFilterFormData = {
    // Identificação
    nr_sequencia: string;
    nr_seq_ativo: string;
    // Dados da manutenção
    nr_seq_prestador_servico: string;
    dt_envio_inicio: string;
    dt_envio_fim: string;
    dt_termino_inicio: string;
    dt_termino_fim: string;
    vl_total_menor: string;
    vl_total_maior: string;
    ie_status_manutencao: string;
  };
  const emptyManutencaoFilterForm: ManutencaoFilterFormData = {
    nr_sequencia: '', nr_seq_ativo: '',
    nr_seq_prestador_servico: '', dt_envio_inicio: '', dt_envio_fim: '', dt_termino_inicio: '', dt_termino_fim: '',
    vl_total_menor: '', vl_total_maior: '', ie_status_manutencao: 'T',
  };
  const [manutencaoFilterForm, setManutencaoFilterForm] = useState<ManutencaoFilterFormData>(emptyManutencaoFilterForm);
  const [appliedManutencaoFilterForm, setAppliedManutencaoFilterForm] = useState<ManutencaoFilterFormData>(emptyManutencaoFilterForm);
  const [manutencaoFilterModalOpen, setManutencaoFilterModalOpen] = useState(false);

  // ── Gerenciador de Relatórios ──
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [relatorioView, setRelatorioView] = useState<'list' | 'builder'>('list');
  const [relatorioEditingId, setRelatorioEditingId] = useState<string | null>(null);
  const [relatorioForm, setRelatorioForm] = useState<Relatorio | null>(null);
  const [relatorioSubmitting, setRelatorioSubmitting] = useState(false);
  const [relatorioGerando, setRelatorioGerando] = useState(false);
  const [relatorioParamModal, setRelatorioParamModal] = useState<{ relatorio: Relatorio; parametros: RelatorioFiltro[] } | null>(null);
  const [relatorioParamValues, setRelatorioParamValues] = useState<Record<string, string>>({});
  const [relatorioManageSelection, setRelatorioManageSelection] = useState('');
  const [relatorioInteracted, setRelatorioInteracted] = useState(false);
  const [relatorioAuditInfo, setRelatorioAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const relatorioAuditIdRef = useRef<string | null>(null);
  const [relatorioAuditModalOpen, setRelatorioAuditModalOpen] = useState(false);
  const [relatorioAuditLoading, setRelatorioAuditLoading] = useState(false);
  const [relatorioAuditLogs, setRelatorioAuditLogs] = useState<AuditEntry[]>([]);
  const [relatorioAuditBandaId, setRelatorioAuditBandaId] = useState<string | null>(null);
  const [relatorioSortColumn, setRelatorioSortColumn] = useState<number | null>(null);
  const [relatorioSortAsc, setRelatorioSortAsc] = useState<boolean | null>(null);
  const bandaJustSavedRef = useRef(false);

  function handleRelatorioManageSelectionChange(v: string) {
    setRelatorioManageSelection(v);
    setRelatorioInteracted(true);
  }

  // When the user navigates to relatorio section, auto-select 'relatorio' if interacted
  useEffect(() => {
    if (activeSection === 'relatorio' && relatorioInteracted && !relatorioManageSelection) {
      setRelatorioManageSelection('relatorio');
    }
  }, [activeSection, relatorioInteracted, relatorioManageSelection]);

  const allowedRelatorioSubmodulos = useMemo(() => {
    return ['relatorio'];
  }, []);

  function handleRelatorioSortChange(logicalIndex: number) {
    // Se já está ordenando por esta coluna
    if (relatorioSortColumn === logicalIndex) {
      if (relatorioSortAsc === true) {
        // asc → desc
        setRelatorioSortAsc(false);
      } else if (relatorioSortAsc === false) {
        // desc → padrão (limpa tudo)
        setRelatorioSortColumn(null);
        setRelatorioSortAsc(null);
      } else {
        // padrão → asc
        setRelatorioSortColumn(logicalIndex);
        setRelatorioSortAsc(true);
      }
    } else {
      // Nova coluna → asc
      setRelatorioSortColumn(logicalIndex);
      setRelatorioSortAsc(true);
    }
  }

  const filteredSortedRelatorios = useMemo(() => {
    const list = [...relatorios];
    if (relatorioSortColumn != null && relatorioSortAsc != null) {
      const keys = ['nr_sequencia', 'ds_relatorio', 'colecao', 'formato', 'dt_alteracao'];
      const key = keys[relatorioSortColumn];
      if (key) {
        list.sort((a, b) => {
          const av = a[key as keyof Relatorio] ?? '';
          const bv = b[key as keyof Relatorio] ?? '';
          const cmp = String(av).localeCompare(String(bv), 'pt-BR', { numeric: true });
          return relatorioSortAsc ? cmp : -cmp;
        });
      }
    }
    return list;
  }, [relatorios, relatorioSortColumn, relatorioSortAsc]);

  // ── Navegação entre registros de relatório ──
  const currentRelatorioEditIndex = useMemo(() => {
    if (!relatorioEditingId) return -1;
    return filteredSortedRelatorios.findIndex((r) => r.id === relatorioEditingId);
  }, [filteredSortedRelatorios, relatorioEditingId]);

  const hasPrevRelatorioRecord = currentRelatorioEditIndex > 0;
  const hasNextRelatorioRecord = currentRelatorioEditIndex >= 0 && currentRelatorioEditIndex < filteredSortedRelatorios.length - 1;

  function goToPrevRelatorioRecord() {
    if (!hasPrevRelatorioRecord) return;
    const previous = filteredSortedRelatorios[currentRelatorioEditIndex - 1];
    openRelatorioEditForm(previous);
  }

  function goToNextRelatorioRecord() {
    if (!hasNextRelatorioRecord) return;
    const next = filteredSortedRelatorios[currentRelatorioEditIndex + 1];
    openRelatorioEditForm(next);
  }

  // Lookup de ativo no formulário de manutenção.
  const [manutencaoAtivoLookupOpen, setManutencaoAtivoLookupOpen] = useState(false);
  const manutencaoAtivoLookupTargetRef = useRef<'manutencao' | 'manutencaoFilter'>('manutencao');
  const [manutencaoAtivoLookupForm, setManutencaoAtivoLookupForm] = useState({ nr_sequencia: '', ds_ativo: '', cd_patrimonio: '', ds_modelo: '', ie_status: '' });
  const [manutencaoAtivoLookupFilter, setManutencaoAtivoLookupFilter] = useState({ nr_sequencia: '', ds_ativo: '', cd_patrimonio: '', ds_modelo: '', ie_status: '' });
  const [manutencaoAtivoLookupApplied, setManutencaoAtivoLookupApplied] = useState(false);
  const manutencaoAtivoName = useMemo(() => {
    if (!manutencaoForm.nr_seq_ativo) return '';
    return ativos.find((a) => a.nr_sequencia === manutencaoForm.nr_seq_ativo)?.ds_ativo ?? '';
  }, [manutencaoForm.nr_seq_ativo, ativos]);
  const manutencaoPrestadorName = useMemo(() => {
    if (!manutencaoForm.nr_seq_prestador_servico) return '';
    const seq = manutencaoForm.nr_seq_prestador_servico;
    // Busca o colaborador que tem esse nr_sequencia (o campo armazena a sequência do colaborador).
    const col = colaboradores.find((c) => c.nr_sequencia === seq);
    if (col) {
      if (col.nr_seq_pessoa_juridica) {
        const pj = pessoasJuridicas.find((p) => p.nr_sequencia === col.nr_seq_pessoa_juridica);
        if (pj) return pj.ds_razao_social ?? '';
      }
      const pf = pessoasFisicas.find((p) => p.nr_sequencia === col.nr_seq_pessoa_fisica);
      return pf?.ds_nome ?? '';
    }
    // Fallback: busca direta na PF (para dados legados).
    return pessoasFisicas.find((p) => p.nr_sequencia === seq)?.ds_nome ?? '';
  }, [manutencaoForm.nr_seq_prestador_servico, pessoasFisicas, colaboradores, pessoasJuridicas]);
  const manutencaoFilteredAtivos = useMemo(() => {
    if (!manutencaoAtivoLookupApplied) return [];
    return ativos.filter((a) => {
      if (manutencaoAtivoLookupFilter.nr_sequencia && String(a.nr_sequencia) !== manutencaoAtivoLookupFilter.nr_sequencia.trim()) return false;
      if (manutencaoAtivoLookupFilter.ds_ativo && !a.ds_ativo?.toLowerCase().includes(manutencaoAtivoLookupFilter.ds_ativo.toLowerCase())) return false;
      if (manutencaoAtivoLookupFilter.cd_patrimonio && !a.cd_patrimonio?.toLowerCase().includes(manutencaoAtivoLookupFilter.cd_patrimonio.toLowerCase())) return false;
      if (manutencaoAtivoLookupFilter.ds_modelo && !a.ds_modelo?.toLowerCase().includes(manutencaoAtivoLookupFilter.ds_modelo.toLowerCase())) return false;
      if (manutencaoAtivoLookupFilter.ie_status) {
        if (a.ie_status !== manutencaoAtivoLookupFilter.ie_status) return false;
      } else {
        // Por padrão, exibir apenas ativos Operacionais e em Estoque.
        if (a.ie_status !== 'O' && a.ie_status !== 'E') return false;
      }
      return true;
    });
  }, [ativos, manutencaoAtivoLookupFilter, manutencaoAtivoLookupApplied]);
  const [ativoSortColumn, setAtivoSortColumn] = useState<number | null>(null);
  const [ativoSortAsc, setAtivoSortAsc] = useState<boolean | null>(null);
  const [ativoCampoErros, setAtivoCampoErros] = useState<string[]>([]);
  const [alunoLookupForm, setAlunoLookupForm] = useState({ ds_nome: '', nr_sequencia: '', nr_cpf: '' });
  const [alunoLookupFilter, setAlunoLookupFilter] = useState({ ds_nome: '', nr_sequencia: '', nr_cpf: '' });
  const [alunoLookupApplied, setAlunoLookupApplied] = useState(false);
  const [passwordChangeValue, setPasswordChangeValue] = useState("");
  const [passwordChangeConfirmValue, setPasswordChangeConfirmValue] = useState("");
  const [passwordChangeUserId, setPasswordChangeUserId] = useState<string | null>(null);
  const [passwordChangeIsSelf, setPasswordChangeIsSelf] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDeleteMessage, setConfirmDeleteMessage] = useState('');
  const [confirmDeleteAction, setConfirmDeleteAction] = useState<(() => void) | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [menuOrder, setMenuOrder] = useState<SectionType[]>(DEFAULT_SECTION_ORDER);
  const [dragSection, setDragSection] = useState<SectionType | null>(null);
  const [dragOverSection, setDragOverSection] = useState<SectionType | null>(null);
  const draggedRef = useRef(false);

  const currentUserPersonName = useMemo(() => {
    if (!currentUser) return "";

    const matchingPerson = pessoasFisicas.find((pessoa) => pessoa.nr_sequencia === currentUser.nr_seq_pessoa_fisica);
    return matchingPerson?.ds_nome?.trim() || currentUser.ds_usuario_alternativo?.trim() || currentUser.ds_usuario?.trim() || "Usuário";
  }, [currentUser, pessoasFisicas]);

  /* ── Funções liberadas ao usuário logado (via perfis vinculados) ── */
  const isAdministrador = useMemo(
    () => (currentUser?.ds_usuario ?? '').trim().toLowerCase() === 'administrador',
    [currentUser]
  );

  // Administrador sem perfis configurados: tem acesso total a tudo.
  // Se o admin configurar perfis para si mesmo, esses perfis são respeitados
  // (as permissões e funções configuradas prevalecem).
  const isAdminSemConfig = useMemo(
    () => isAdministrador && parsePerfisConfig(currentUser?.config_perfis).length === 0,
    [isAdministrador, currentUser?.config_perfis]
  );

  // Item protegido: o usuário 'administrador' ou o perfil 'Administrador' só
  // podem ser vistos por outros usuários (não podem ser alterados/excluídos).
  const isProtectedAdminItem = useMemo(() => {
    if (!contextMenu || contextMenu.section !== 'administracaoSistema' || isAdministrador) return false;
    if (adminManageSelection === 'perfis') {
      return isAdministradorPerfil(contextMenu.item as Perfil);
    }
    return isAdministradorUsuario(contextMenu.item as Usuario);
  }, [contextMenu, adminManageSelection, isAdministrador]);

  // Perfis vinculados ao usuário logado que estão ativos, em ordem alfabética.
  // Para usuários comuns, o perfil Administrador (exclusivo do admin) não entra.
  const usuarioPerfisVinculados = useMemo(() => {
    const perfilIds = parsePerfisConfig(currentUser?.config_perfis);
    if (perfilIds.length === 0) return [];
    return perfis
      .filter(
        (p) =>
          perfilIds.includes(p.nr_sequencia) &&
          String(p.ie_status ?? '').toUpperCase() === 'A' &&
          (isAdministrador || !isAdministradorPerfil(p))
      )
      .sort((a, b) => (a.ds_perfil ?? '').localeCompare(b.ds_perfil ?? '', 'pt-BR'));
  }, [currentUser?.config_perfis, perfis, isAdministrador]);

  // Regras de campos do perfil ATIVO do usuário logado (Administração > Campos).
  const campoRegrasAtivas = useMemo(() => {
    const ativo =
      usuarioPerfisVinculados.find((p) => p.nr_sequencia === activePerfilSequencia) ??
      usuarioPerfisVinculados[0];
    return ativo ? parseCamposConfig(ativo.config_campos) : {};
  }, [usuarioPerfisVinculados, activePerfilSequencia]);

  // Permissões do perfil ATIVO do usuário logado (Administração > Delegar funções).
  // Aplica a migração automática APENAS em configurações antigas (versão anterior
  // à atual): configurações atuais são autoritativas (revogações explícitas valem).
  const permissoesAtivas = useMemo(() => {
    const ativo =
      usuarioPerfisVinculados.find((p) => p.nr_sequencia === activePerfilSequencia) ??
      usuarioPerfisVinculados[0];
    return ativo ? parsePermissoesConfigMigrada(ativo.config_permissoes, ativo.config_permissoes_v) : {};
  }, [usuarioPerfisVinculados, activePerfilSequencia]);

  // Submódulos da função Administração do Sistema liberados ao usuário logado
  // (Campos/Perfis/Usuários) conforme as permissões do perfil ativo.
  const allowedAdminSubmodulos = useMemo(() => {
    // Administrador sem perfis vinculados: acesso total.
    if (isAdminSemConfig) return ['campos', 'perfis', 'usuarios'];
    return adminSubmodulosPermitidos(permissoesAtivas);
  }, [isAdminSemConfig, permissoesAtivas]);

  // Permissões das opções de Administração do Sistema (menu de contexto) para
  // o usuário logado: o administrador tem tudo liberado; os demais seguem o
  // perfil ativo (sem configuração salva = tudo liberado).
  const permissoesAdmin = useMemo(() => {
    const permitida = (permissao: string) =>
      isAdminSemConfig || temPermissao(permissoesAtivas, 'administracaoSistema', permissao);
    return {
      alterarStatusCampo: permitida('alterar_status_campo'),
      adicionarPerfil: permitida('adicionar_perfil'),
      verPerfil: permitida('ver_perfil'),
      delegarFuncoesPerfil: permitida('delegar_funcoes_perfil'),
      duplicarPerfil: permitida('duplicar_perfil'),
      excluirPerfil: permitida('excluir_perfil'),
      adicionarUsuario: permitida('adicionar_usuario'),
      verUsuario: permitida('ver_usuario'),
      alterarSenhaUsuario: permitida('alterar_senha_usuario'),
      delegarPerfisUsuario: permitida('delegar_perfis_usuario'),
      excluirUsuario: permitida('excluir_usuario'),
    };
  }, [isAdminSemConfig, permissoesAtivas]);

  // Permissões da função Cadastro de Pessoas (Pessoas Físicas/Jurídicas) para
  // o usuário logado: o administrador tem tudo liberado; os demais seguem o
  // perfil ativo (sem configuração salva = tudo liberado).
  const permissoesPessoa = useMemo(() => {
    const permitida = (permissao: string) =>
      isAdminSemConfig || temPermissao(permissoesAtivas, 'pessoaFisica', permissao);
    return {
      adicionarPessoaFisica: permitida('adicionar_pessoa_fisica'),
      verPessoaFisica: permitida('ver_pessoa_fisica'),
      excluirPessoaFisica: permitida('excluir_pessoa_fisica'),
      adicionarPessoaJuridica: permitida('adicionar_pessoa_juridica'),
      verPessoaJuridica: permitida('ver_pessoa_juridica'),
      excluirPessoaJuridica: permitida('excluir_pessoa_juridica'),
    };
  }, [isAdminSemConfig, permissoesAtivas]);

  // Submódulos da função Cadastro de Pessoas (Pessoas Físicas/Jurídicas)
  // liberados ao usuário logado conforme as permissões do perfil ativo.
  const allowedPessoaSubmodulos = useMemo(() => {
    // Administrador sem perfis vinculados: acesso total.
    if (isAdminSemConfig) return ['pessoasFisicas', 'pessoasJuridicas'];
    return pessoaSubmodulosPermitidos(permissoesAtivas);
  }, [isAdminSemConfig, permissoesAtivas]);

  // Permissões da função Cadastros Gerais (por seção/tipo de cadastro) para
  // o usuário logado: o administrador tem tudo liberado; os demais seguem o
  // perfil ativo (sem configuração salva = tudo liberado).
  const permissoesCg = useMemo(() => {
    const permitida = (permissao: string) =>
      isAdminSemConfig || temPermissao(permissoesAtivas, 'cadastrosGerais', permissao);
    // Chave de seção (dropdown) → sufixo usado nas chaves de permissão (snake_case).
    const secoes: Record<string, string> = {
      cargo: 'cargo',
      vinculoContratual: 'vinculo_contratual',
      sexo: 'sexo',
      estadoCivil: 'estado_civil',
      corRaca: 'cor_raca',
      grauParentesco: 'grau_parentesco',
      localizacao: 'localizacao',
      marca: 'marca',
      categoriaAtivo: 'categoria_ativo',
      profissao: 'profissao',
      orgaoEmissor: 'orgao_emissor',
      logradouro: 'logradouro',
      sistemaOperacional: 'sistema_operacional',
    };
    const resultado: Record<string, { adicionar: boolean; ver: boolean; excluir: boolean }> = {};
    for (const [chave, sufixo] of Object.entries(secoes)) {
      resultado[chave] = {
        adicionar: permitida(`adicionar_${sufixo}`),
        ver: permitida(`ver_${sufixo}`),
        excluir: permitida(`excluir_${sufixo}`),
      };
    }
    return resultado;
  }, [isAdminSemConfig, permissoesAtivas]);

  // Submódulos da função Cadastros Gerais (dropdown PAI) liberados ao usuário
  // logado conforme as permissões do perfil ativo.
  const allowedCgSubmodulos = useMemo(() => {
    // Administrador sem perfis vinculados: acesso total.
    if (isAdminSemConfig) return ['cargo', 'categoriaAtivo', 'vinculoContratual', 'sexo', 'estadoCivil', 'corRaca', 'grauParentesco', 'localizacao', 'marca', 'profissao', 'orgaoEmissor', 'logradouro', 'sistemaOperacional'];
    return cgSubmodulosPermitidos(permissoesAtivas);
  }, [isAdminSemConfig, permissoesAtivas]);

  // Se o submódulo ativo deixar de ser permitido (ex.: perfil sem a permissão),
  // volta para o primeiro submódulo permitido.
  useEffect(() => {
    if (!currentUser) return;
    if (adminManageSelection && !allowedAdminSubmodulos.includes(adminManageSelection)) {
      setAdminManageSelection(allowedAdminSubmodulos[0] ?? 'usuarios');
    }
  }, [allowedAdminSubmodulos, adminManageSelection, currentUser]);

  // Se o submódulo ativo de Cadastro de Pessoas deixar de ser permitido,
  // volta para o primeiro submódulo permitido.
  useEffect(() => {
    if (!currentUser) return;
    if (pjManageSelection && !allowedPessoaSubmodulos.includes(pjManageSelection)) {
      setPjManageSelection(allowedPessoaSubmodulos[0] ?? 'pessoasFisicas');
    }
  }, [allowedPessoaSubmodulos, pjManageSelection, currentUser]);

  // Se o submódulo ativo de Cadastros Gerais deixar de ser permitido, volta
  // para o primeiro submódulo permitido.
  useEffect(() => {
    if (!currentUser) return;
    if (cgManageSelection && !allowedCgSubmodulos.includes(cgManageSelection)) {
      setCgManageSelection(allowedCgSubmodulos[0] ?? 'sexo');
    }
  }, [allowedCgSubmodulos, cgManageSelection, currentUser]);

  // Submódulos da função Estrutura Acadêmica (Alunos/Colaboradores) liberados
  // ao usuário logado conforme as permissões do perfil ativo.
  const allowedAlunoSubmodulos = useMemo(() => {
    // Administrador sem perfis vinculados: acesso total.
    if (isAdminSemConfig) return ['alunos', 'colaboradores'];
    return eaSubmodulosPermitidos(permissoesAtivas);
  }, [isAdminSemConfig, permissoesAtivas]);

  // Permissões da função Estrutura Acadêmica (Alunos/Colaboradores) para o
  // usuário logado: o administrador tem tudo liberado; os demais seguem o
  // perfil ativo (sem configuração salva = tudo liberado).
  const permissoesEA = useMemo(() => {
    const permitida = (permissao: string) =>
      isAdminSemConfig || temPermissao(permissoesAtivas, 'estruturaAcademica', permissao);
    return {
      acessarAluno: permitida('acessar_aluno'),
      adicionarAluno: permitida('adicionar_aluno'),
      verAluno: permitida('ver_aluno'),
      alterarDataIngresso: permitida('alterar_data_ingresso_aluno'),
      alterarStatusAluno: permitida('alterar_status_aluno'),
      excluirAluno: permitida('excluir_aluno'),
      acessarColaborador: permitida('acessar_colaborador'),
      adicionarColaborador: permitida('adicionar_colaborador'),
      verColaborador: permitida('ver_colaborador'),
      alterarDataAdmissao: permitida('alterar_data_admissao_colaborador'),
      alterarStatusColaborador: permitida('alterar_status_colaborador'),
      excluirColaborador: permitida('excluir_colaborador'),
    };
  }, [isAdminSemConfig, permissoesAtivas]);

  // Se o submódulo ativo de Estrutura Acadêmica deixar de ser permitido,
  // volta para o primeiro submódulo permitido.
  useEffect(() => {
    if (!currentUser) return;
    if (alunoManageSelection && !allowedAlunoSubmodulos.includes(alunoManageSelection)) {
      setAlunoManageSelection(allowedAlunoSubmodulos[0] ?? 'alunos');
    }
  }, [allowedAlunoSubmodulos, alunoManageSelection, currentUser]);

  // Submódulos da função Patrimônio (Ativos/...) liberados ao usuário logado
  // conforme as permissões do perfil ativo.
  const allowedPatrimonioSubmodulos = useMemo(() => {
    // Administrador sem perfis vinculados: acesso total.
    if (isAdminSemConfig) return ['ativos', 'parametrosFuncao'];
    return patrimonioSubmodulosPermitidos(permissoesAtivas);
  }, [isAdminSemConfig, permissoesAtivas]);

  // Permissões da função Patrimônio (Ativos) para o usuário logado: o
  // administrador tem tudo liberado; os demais seguem o perfil ativo.
  const permissoesPatrimonio = useMemo(() => {
    const permitida = (permissao: string) =>
      isAdminSemConfig || temPermissao(permissoesAtivas, 'patrimonio', permissao);
    return {
      acessarAtivo: permitida('acessar_ativo'),
      adicionarAtivo: permitida('adicionar_ativo'),
      verAtivo: permitida('ver_ativo'),
      mudarParaOperacional: permitida('mudar_para_operacional'),
      enviarParaManutencao: permitida('enviar_para_manutencao'),
      moverParaEstoque: permitida('mover_para_estoque'),
      descartarAtivo: permitida('descartar_ativo'),
      excluirAtivo: permitida('excluir_ativo'),
      gerarCodigoPatrimonio: permitida('gerar_codigo_patrimonio'),
      gerarCodigoPatrimonioDescartado: permitida('gerar_codigo_patrimonio_descartado'),
      alterarStatusDescartado: permitida('alterar_status_descartado'),
      acessarParametrosFuncao: permitida('acessar_parametros_funcao'),
      acessarManutencao: permitida('acessar_manutencao'),
      adicionarManutencao: permitida('adicionar_manutencao'),
      verManutencao: permitida('ver_manutencao'),
      concluirManutencao: permitida('concluir_manutencao'),
      concluirManutencaoRegistro: permitida('concluir_manutencao_registro'),
      cancelarManutencao: permitida('cancelar_manutencao'),
      excluirManutencao: permitida('excluir_manutencao'),
    };
  }, [isAdminSemConfig, permissoesAtivas]);

  // Se o submódulo ativo de Patrimônio deixar de ser permitido, volta para
  // o primeiro submódulo permitido.
  useEffect(() => {
    if (!currentUser) return;
    if (ativoManageSelection && !allowedPatrimonioSubmodulos.includes(ativoManageSelection)) {
      setAtivoManageSelection(allowedPatrimonioSubmodulos[0] ?? 'ativos');
    }
  }, [allowedPatrimonioSubmodulos, ativoManageSelection, currentUser]);

  // Migração única de config_permissoes antigas: perfis salvos antes da adição
  // das permissões granulares ganham as permissões novas como concedidas (a
  // runtime já usa a configuração migrada via permissoesAtivas).
  useEffect(() => {
    if (!currentUser) return;
    const atualizados: Perfil[] = [];
    for (const perfil of perfis) {
      if (!perfil.id) continue;
      const versao = Number(perfil.config_permissoes_v ?? 0);
      if (versao >= PERMISSOES_CONFIG_VERSION) continue;
      const config = parsePermissoesConfig(perfil.config_permissoes);
      if (Object.keys(config).length === 0) continue;
      const migrada = migrarPermissoesConfig(config);
      if (JSON.stringify(migrada) === JSON.stringify(config)) continue;
      atualizados.push({
        ...perfil,
        config_permissoes: serializePermissoesConfig(migrada),
        config_permissoes_v: PERMISSOES_CONFIG_VERSION,
      });
      atualizarPerfil(perfil.id, {
        config_permissoes: serializePermissoesConfig(migrada),
        config_permissoes_v: PERMISSOES_CONFIG_VERSION,
      }).catch(() => {});
    }
    if (atualizados.length > 0) {
      setPerfis((prev) =>
        prev.map((p) => atualizados.find((a) => a.id === p.id) ?? p)
      );
    }
  }, [perfis, currentUser]);

  const allowedSections = useMemo(() => {
    // Administrador sem perfis vinculados: todas as funções liberadas.
    if (isAdminSemConfig) return [...DEFAULT_SECTION_ORDER];

    // Sem perfis vinculados = comportamento padrão: todas as funções liberadas.
    const perfilIds = parsePerfisConfig(currentUser?.config_perfis);
    if (perfilIds.length === 0) return [...DEFAULT_SECTION_ORDER];

    // Perfis vinculados, porém todos inativos: sem acesso a nenhuma função.
    if (usuarioPerfisVinculados.length === 0) return [];

    // As funções liberadas vêm do perfil ATIVO selecionado na pop-up do usuário.
    const ativo =
      usuarioPerfisVinculados.find((p) => p.nr_sequencia === activePerfilSequencia) ??
      usuarioPerfisVinculados[0];
    // Perfil sem config_funcoes salvo não libera nenhuma função.
    const funcoes = parseFuncoesConfig(ativo.config_funcoes);
    // Mantém a ordem padrão do sistema, filtrando apenas o que foi liberado.
    return DEFAULT_SECTION_ORDER.filter((s) => funcoes.includes(s));
  }, [isAdminSemConfig, currentUser?.config_perfis, usuarioPerfisVinculados, activePerfilSequencia]);

  const pfColunasConfig = useMemo(
    () => parseColunasConfig(currentUser?.config_colunas_pessoa_fisica),
    [currentUser?.config_colunas_pessoa_fisica]
  );
  const pjColunasConfig = useMemo(
    () => parseColunasConfig(currentUser?.config_colunas_pessoa_juridica),
    [currentUser?.config_colunas_pessoa_juridica]
  );
  const alunoColunasConfig = useMemo(
    () => parseColunasConfig(currentUser?.config_colunas_aluno),
    [currentUser?.config_colunas_aluno]
  );
  const ativoColunasConfig = useMemo(
    () => parseColunasConfig(currentUser?.config_colunas_pat_ativo),
    [currentUser?.config_colunas_pat_ativo]
  );
  const manutencaoColunasConfig = useMemo(
    () => parseColunasConfig(currentUser?.config_colunas_pat_manutencao),
    [currentUser?.config_colunas_pat_manutencao]
  );
  const adminColunasConfig = useMemo(
    () => parseColunasConfig(currentUser?.config_colunas_as_usuario),
    [currentUser?.config_colunas_as_usuario]
  );
  const perfilColunasConfig = useMemo(
    () => parseColunasConfig(currentUser?.config_colunas_as_perfil),
    [currentUser?.config_colunas_as_perfil]
  );
  const relatorioColunasConfig = useMemo(
    () => parseStringColunasConfig(currentUser?.config_colunas_relatorio),
    [currentUser?.config_colunas_relatorio]
  );
  const relatorioBandasColunasConfig = useMemo(
    () => parseStringColunasConfig(currentUser?.config_colunas_relatorio_bandas),
    [currentUser?.config_colunas_relatorio_bandas]
  );
  const relatorioListaColunasConfig = useMemo(
    () => parseStringColunasConfig(currentUser?.config_colunas_relatorio_lista),
    [currentUser?.config_colunas_relatorio_lista]
  );
  const relatorioDadosColunasConfig = useMemo(
    () => parseStringColunasConfig(currentUser?.config_colunas_relatorio_dados),
    [currentUser?.config_colunas_relatorio_dados]
  );
  const relatorioFiltrosColunasConfig = useMemo(
    () => parseStringColunasConfig(currentUser?.config_colunas_relatorio_filtros),
    [currentUser?.config_colunas_relatorio_filtros]
  );
  const relatorioOrdenacaoColunasConfig = useMemo(
    () => parseStringColunasConfig(currentUser?.config_colunas_relatorio_ordenacao),
    [currentUser?.config_colunas_relatorio_ordenacao]
  );
  const CG_DEFS = {
    sexo: {
      descKey: 'ds_sexo',
      collection: 'cg_sexo',
      configKey: 'config_colunas_cg_sexo',
      columns: SEXO_COLUMNS,
      fieldInfos: SEXO_FIELD_INFOS,
      items: (): CgItem[] => sexos,
      emptyMessage: 'Clique em "Adicionar" para cadastrar um sexo.',
    },
    estadoCivil: {
      descKey: 'ds_estado_civil',
      collection: 'cg_estado_civil',
      configKey: 'config_colunas_cg_estado_civil',
      columns: ESTADO_CIVIL_COLUMNS,
      fieldInfos: ESTADO_CIVIL_FIELD_INFOS,
      items: (): CgItem[] => estadoCivis,
      emptyMessage: 'Clique em "Adicionar" para cadastrar um estado civil.',
    },
    corRaca: {
      descKey: 'ds_cor_raca',
      collection: 'cg_cor_raca',
      configKey: 'config_colunas_cg_cor_raca',
      columns: COR_RACA_COLUMNS,
      fieldInfos: COR_RACA_FIELD_INFOS,
      items: (): CgItem[] => coresRacas,
      emptyMessage: 'Clique em "Adicionar" para cadastrar uma cor/raça.',
    },
    profissao: {
      descKey: 'ds_profissao',
      collection: 'cg_profissao',
      configKey: 'config_colunas_cg_profissao',
      columns: PROFISSAO_COLUMNS,
      fieldInfos: PROFISSAO_FIELD_INFOS,
      items: (): CgItem[] => profissoes,
      emptyMessage: 'Clique em "Adicionar" para cadastrar uma profissão.',
    },
    orgaoEmissor: {
      descKey: 'ds_orgao_emissor',
      collection: 'cg_orgao_emissor',
      configKey: 'config_colunas_cg_orgao_emissor',
      columns: ORGAO_EMISSOR_COLUMNS,
      fieldInfos: ORGAO_EMISSOR_FIELD_INFOS,
      items: (): CgItem[] => orgaosEmissores,
      emptyMessage: 'Clique em "Adicionar" para cadastrar um órgão emissor.',
    },
    logradouro: {
      descKey: 'ds_logradouro',
      collection: 'cg_logradouro',
      configKey: 'config_colunas_cg_logradouro',
      columns: LOGRADOURO_COLUMNS,
      fieldInfos: LOGRADOURO_FIELD_INFOS,
      items: (): CgItem[] => logradouros,
      emptyMessage: 'Clique em "Adicionar" para cadastrar um logradouro.',
    },
    grauParentesco: {
      descKey: 'ds_grau_parentesco',
      collection: 'cg_grau_parentesco',
      configKey: 'config_colunas_cg_grau_parentesco',
      columns: GRAU_PARENTESCO_COLUMNS,
      fieldInfos: GRAU_PARENTESCO_FIELD_INFOS,
      items: (): CgItem[] => grausParentesco,
      emptyMessage: 'Clique em "Adicionar" para cadastrar um grau de parentesco.',
    },
    localizacao: {
      descKey: 'ds_localizacao',
      collection: 'cg_localizacao',
      configKey: 'config_colunas_cg_localizacao',
      columns: LOCALIZACAO_COLUMNS,
      fieldInfos: LOCALIZACAO_FIELD_INFOS,
      items: (): CgItem[] => localizacoes,
      emptyMessage: 'Clique em "Adicionar" para cadastrar uma localização.',
    },
    marca: {
      descKey: 'ds_marca',
      collection: 'cg_marca',
      configKey: 'config_colunas_cg_marca',
      columns: MARCA_COLUMNS,
      fieldInfos: MARCA_FIELD_INFOS,
      items: (): CgItem[] => marcas,
      emptyMessage: 'Clique em "Adicionar" para cadastrar uma marca.',
    },
    categoriaAtivo: {
      descKey: 'ds_categoria',
      collection: 'cg_categoria_ativo',
      configKey: 'config_colunas_cg_categoria_ativo',
      columns: CATEGORIA_ATIVO_COLUMNS,
      fieldInfos: CATEGORIA_ATIVO_FIELD_INFOS,
      items: (): CgItem[] => categoriasAtivos,
      emptyMessage: 'Clique em "Adicionar" para cadastrar uma categoria.',
    },
    cargo: {
      descKey: 'ds_cargo',
      collection: 'cg_cargo',
      configKey: 'config_colunas_cg_cargo',
      columns: CARGO_COLUMNS,
      fieldInfos: CARGO_FIELD_INFOS,
      items: (): CgItem[] => cargos,
      emptyMessage: 'Clique em "Adicionar" para cadastrar um cargo.',
    },
    vinculoContratual: {
      descKey: 'ds_vinculo_contratual',
      collection: 'cg_vinculo_contratual',
      configKey: 'config_colunas_cg_vinculo_contratual',
      columns: VINCULO_CONTRATUAL_COLUMNS,
      fieldInfos: VINCULO_CONTRATUAL_FIELD_INFOS,
      items: (): CgItem[] => vinculosContratuais,
      emptyMessage: 'Clique em "Adicionar" para cadastrar um vínculo contratual.',
    },
    sistemaOperacional: {
      descKey: 'ds_sistema_operacional',
      collection: 'cg_sistema_operacional',
      configKey: 'config_colunas_cg_sistema_operacional',
      columns: SISTEMA_OPERACIONAL_COLUMNS,
      fieldInfos: SISTEMA_OPERACIONAL_FIELD_INFOS,
      items: (): CgItem[] => sistemasOperacionais,
      emptyMessage: 'Clique em "Adicionar" para cadastrar um sistema operacional.',
    },
  } as const;

  const cgKind = cgManageSelection === 'estadoCivil' ? 'estadoCivil' : cgManageSelection === 'corRaca' ? 'corRaca' : cgManageSelection === 'grauParentesco' ? 'grauParentesco' : cgManageSelection === 'cargo' ? 'cargo' : cgManageSelection === 'vinculoContratual' ? 'vinculoContratual' : cgManageSelection === 'profissao' ? 'profissao' : cgManageSelection === 'orgaoEmissor' ? 'orgaoEmissor' : cgManageSelection === 'logradouro' ? 'logradouro' : cgManageSelection === 'localizacao' ? 'localizacao' : cgManageSelection === 'marca' ? 'marca' : cgManageSelection === 'categoriaAtivo' ? 'categoriaAtivo' : cgManageSelection === 'sistemaOperacional' ? 'sistemaOperacional' : 'sexo';
  const cgDef = CG_DEFS[cgKind];
  const cgDescKey = cgDef.descKey;
  const cgCollection = cgDef.collection;
  const cgConfigKey = cgDef.configKey;
  const cgColumns = cgDef.columns;
  const cgFieldInfos = cgDef.fieldInfos;
  const cgItems = cgDef.items();
  const cgEmptyMessage = cgDef.emptyMessage;
  const cgColunasConfig = useMemo(
    () => parseColunasConfig(currentUser?.[cgDef.configKey]),
    [currentUser?.[cgDef.configKey], cgKind]
  );

  const auditAutor = useMemo(() => {
    if (!currentUser) return undefined;
    return {
      usuarioId: currentUser.id ?? null,
      usuarioNome: currentUserPersonName || currentUser.ds_usuario_alternativo?.trim() || currentUser.ds_usuario?.trim() || "-",
    };
  }, [currentUser, currentUserPersonName]);

  /* ── Opções de Cadastros Gerais para o dropdown de Vínculo contratual (Colaborador) ── */
  const colaboradorVinculosOptions = useMemo(
    () => vinculosContratuais.map((v) => ({ nr_sequencia: v.nr_sequencia, descricao: v.ds_vinculo_contratual, ie_status: v.ie_status })),
    [vinculosContratuais]
  );

  /* ── Opções de Cadastros Gerais para os dropdowns de Pessoa Física ── */
  const pfCgOptions = useMemo(
    () => ({
      sexos: sexos.map((s) => ({ nr_sequencia: s.nr_sequencia, descricao: s.ds_sexo, ie_status: s.ie_status })),
      estadoCivis: estadoCivis.map((s) => ({ nr_sequencia: s.nr_sequencia, descricao: s.ds_estado_civil, ie_status: s.ie_status })),
      coresRacas: coresRacas.map((s) => ({ nr_sequencia: s.nr_sequencia, descricao: s.ds_cor_raca, ie_status: s.ie_status })),
      profissoes: profissoes.map((s) => ({ nr_sequencia: s.nr_sequencia, descricao: s.ds_profissao, ie_status: s.ie_status })),
      orgaosEmissores: orgaosEmissores.map((o) => ({ nr_sequencia: o.nr_sequencia, descricao: o.ds_orgao_emissor, ie_status: o.ie_status, sigla: o.sg_orgao_emissor ?? '' })),
      logradouros: logradouros.map((l) => ({ nr_sequencia: l.nr_sequencia, descricao: l.ds_logradouro, ie_status: l.ie_status, sigla: l.sg_logradouro ?? '' })),
    }),
    [sexos, estadoCivis, coresRacas, profissoes, orgaosEmissores, logradouros]
  );

  /* ── Lookups (nr_sequencia → descrição) para as colunas de Pessoa Física ── */
  const pfCgLookups = useMemo(
    () => ({
      nr_seq_sexo: Object.fromEntries(pfCgOptions.sexos.map((o) => [o.nr_sequencia, o.descricao])),
      nr_seq_estado_civil: Object.fromEntries(pfCgOptions.estadoCivis.map((o) => [o.nr_sequencia, o.descricao])),
      nr_seq_cor_raca: Object.fromEntries(pfCgOptions.coresRacas.map((o) => [o.nr_sequencia, o.descricao])),
      nr_seq_profissao: Object.fromEntries(pfCgOptions.profissoes.map((o) => [o.nr_sequencia, o.descricao])),
      nr_seq_orgao_emissor: Object.fromEntries(pfCgOptions.orgaosEmissores.map((o) => [o.nr_sequencia, o.descricao])),
      nr_seq_logradouro: Object.fromEntries(pfCgOptions.logradouros.map((o) => [o.nr_sequencia, o.descricao])),
    }),
    [pfCgOptions]
  );

  /* ── Lookups (nr_sequencia → descrição) para as colunas de Pessoa Jurídica ── */
  const pjCgLookups = useMemo(
    () => ({
      nr_seq_logradouro: Object.fromEntries(pfCgOptions.logradouros.map((o) => [o.nr_sequencia, o.descricao])),
    }),
    [pfCgOptions]
  );

  /* ── Lookups (nr_sequencia → nome) para as colunas de Aluno ── */
  const alunoPessoaFisicaLookups = useMemo(() => {
    const nomePessoa = Object.fromEntries(pessoasFisicas.map((p) => [p.nr_sequencia, p.ds_nome]));
    const nomeGrau = Object.fromEntries(grausParentesco.map((g) => [g.nr_sequencia, g.ds_grau_parentesco]));
    return {
      nr_seq_pessoa_fisica: nomePessoa,
      responsaveis: (value: unknown) => {
        const arr = Array.isArray(value) ? (value as AlunoResponsavel[]) : [];
        const validos = arr.filter((r) => r && r.nr_seq_responsavel);
        return validos
          .map((r) => {
            const nome = nomePessoa[r.nr_seq_responsavel!] ?? String(r.nr_seq_responsavel);
            const grau = r.nr_seq_grau_parentesco ? (nomeGrau[r.nr_seq_grau_parentesco] ?? '') : '';
            return grau ? `${nome} (${grau})` : nome;
          })
          .join(', ');
      },
    };
  }, [pessoasFisicas, grausParentesco]);

  /* ── Carregar pessoas físicas, jurídicas e usuários ── */
  const loadPessoasFisicas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterPessoasFisicas();
      setPessoasFisicas(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPessoasJuridicas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterPessoasJuridicas();
      setPessoasJuridicas(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAlunos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterAlunos();
      setAlunos(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadColaboradores = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterColaboradores();
      setColaboradores(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterUsuarios();
      setUsuarios(data);
    } catch {
      setMessage("Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPerfis = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterPerfis();
      setPerfis(data);
    } catch {
      setMessage("Erro ao carregar perfis.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSexos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterSexos();
      setSexos(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEstadoCivis = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterEstadoCivis();
      setEstadoCivis(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCoresRacas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterCoresRacas();
      setCoresRacas(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProfissoes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterProfissoes();
      setProfissoes(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOrgaosEmissores = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterOrgaosEmissores();
      setOrgaosEmissores(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLogradouros = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterLogradouros();
      setLogradouros(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadGrausParentesco = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterGrausParentesco();
      setGrausParentesco(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCargos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterCargos();
      setCargos(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadVinculosContratuais = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterVinculosContratuais();
      setVinculosContratuais(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLocalizacoes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterLocalizacoes();
      setLocalizacoes(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMarcas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterMarcas();
      setMarcas(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategoriasAtivos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterCategoriasAtivos();
      setCategoriasAtivos(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSistemasOperacionais = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterSistemasOperacionais();
      setSistemasOperacionais(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAtivos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterAtivos();
      setAtivos(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadManutencoes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterManutencoes();
      setManutencoes(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRelatorios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterRelatorios();
      setRelatorios(data);
    } catch {
      setMessage("Erro ao carregar relatórios.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCgItems = useCallback(async () => {
    if (cgKind === 'sexo') {
      await loadSexos();
    } else if (cgKind === 'estadoCivil') {
      await loadEstadoCivis();
    } else if (cgKind === 'corRaca') {
      await loadCoresRacas();
    } else if (cgKind === 'grauParentesco') {
      await loadGrausParentesco();
    } else if (cgKind === 'cargo') {
      await loadCargos();
    } else if (cgKind === 'vinculoContratual') {
      await loadVinculosContratuais();
    } else if (cgKind === 'localizacao') {
      await loadLocalizacoes();
    } else if (cgKind === 'marca') {
      await loadMarcas();
    } else if (cgKind === 'categoriaAtivo') {
      await loadCategoriasAtivos();
    } else if (cgKind === 'profissao') {
      await loadProfissoes();
    } else if (cgKind === 'logradouro') {
      await loadLogradouros();
    } else if (cgKind === 'sistemaOperacional') {
      await loadSistemasOperacionais();
    } else {
      await loadOrgaosEmissores();
    }
  }, [cgKind, loadSexos, loadEstadoCivis, loadCoresRacas, loadGrausParentesco, loadCargos, loadVinculosContratuais, loadLocalizacoes, loadMarcas, loadCategoriasAtivos, loadProfissoes, loadLogradouros, loadOrgaosEmissores, loadSistemasOperacionais]);

  useEffect(() => {
    loadPessoasFisicas();
    loadUsuarios();
    loadPerfis();
    loadSexos();
    loadEstadoCivis();
    loadCoresRacas();
    loadProfissoes();
    loadOrgaosEmissores();
    loadLogradouros();
    loadGrausParentesco();
    loadCargos();
    loadVinculosContratuais();
    loadLocalizacoes();
    loadMarcas();
    loadCategoriasAtivos();
    loadSistemasOperacionais();
    loadAtivos();
    loadManutencoes();
    loadRelatorios();
    loadPessoasJuridicas();
    loadAlunos();
    loadColaboradores();
    // Carregar auditoria dos parâmetros de Patrimônio
    (async () => {
      try {
        const paramDoc = await obterParamCodigoPatrimonio();
        if (paramDoc?.id) {
          setParametrosHasDocument(true);
          setParametrosAuditInfo({
            createdAt: paramDoc.dt_criacao ?? '',
            updatedAt: paramDoc.dt_alteracao ?? '',
            createdBy: paramDoc.ds_usuario_criacao ?? '',
            updatedBy: paramDoc.ds_usuario_alteracao ?? '',
          });
        }
      } catch {
        // mantém vazio em caso de falha
      }
    })();
  }, [loadPessoasFisicas, loadUsuarios, loadPerfis, loadSexos, loadEstadoCivis, loadCoresRacas, loadProfissoes, loadOrgaosEmissores, loadLogradouros, loadGrausParentesco, loadCargos, loadVinculosContratuais, loadLocalizacoes, loadMarcas, loadCategoriasAtivos, loadSistemasOperacionais, loadAtivos, loadManutencoes, loadPessoasJuridicas, loadAlunos, loadColaboradores]);

  /* ── Carregar unidades federativas (UF) da API do IBGE para o dropdown do formulário ── */
  useEffect(() => {
    let cancelled = false;
    obterEstados()
      .then((lista) => {
        if (cancelled) return;
        setEstados(lista.map((e) => ({ value: e.sigla, label: `${e.sigla} - ${e.nome}` })));
      })
      .catch(() => {
        /* Sem conexão com a API — usa as siglas estáticas como fallback */
        if (!cancelled) setEstados(UF_OPTIONS);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Persistir sessão: sobrevive à recarga; só quebra no Sair ── */
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) return;
    try {
      window.localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          userId: currentUser.id,
          activeSection,
          adminManageSelection,
          cgManageSelection,
          pjManageSelection,
          alunoManageSelection,
          patrimonioManageSelection: ativoManageSelection,
          relatorioManageSelection,
        })
      );
    } catch {
      /* storage indisponível — sessão não persiste */
    }
  }, [isAuthenticated, currentUser, activeSection, adminManageSelection, cgManageSelection, pjManageSelection, alunoManageSelection, ativoManageSelection, relatorioManageSelection]);

  /* ── Aplicar preferência de tema do usuário logado ── */
  useEffect(() => {
    if (!currentUser?.id) return;
    const userKey = getDarkModeKey(currentUser.id);
    if (currentUser.config_tema) {
      setDarkMode(currentUser.config_tema === 'E');
      try {
        window.localStorage.setItem(userKey, currentUser.config_tema === 'E' ? "1" : "0");
      } catch {
        /* storage indisponível */
      }
      return;
    }
    /* Fallback: preferência local do próprio usuário (nunca a de outro) */
    try {
      const saved = window.localStorage.getItem(userKey);
      setDarkMode(saved === "1");
    } catch {
      /* storage indisponível — mantém claro */
    }
  }, [currentUser]);

  /* ── Aplicar ordem das funções do menu do usuário logado ── */
  useEffect(() => {
    if (!currentUser) return;
    const parsed = parseMenuOrder(currentUser.config_ordem_menu_lateral);
    setMenuOrder(parsed ? normalizeMenuOrder(parsed) : SECTION_ORDER_ALPHABETICAL);
  }, [currentUser]);

  /* ── Perfil ativo do usuário logado (selecionado na pop-up) ── */
  useEffect(() => {
    if (!currentUser) return;
    if (usuarioPerfisVinculados.length === 0) {
      setActivePerfilSequencia(null);
      return;
    }
    const saved = Number(currentUser.config_perfil_ativo);
    const savedOk = usuarioPerfisVinculados.some((p) => p.nr_sequencia === saved);
    if (savedOk) {
      setActivePerfilSequencia(saved);
      return;
    }
    /* Fallback: preferência local do próprio usuário (nunca a de outro) */
    try {
      const local = Number(window.localStorage.getItem(getActivePerfilKey(currentUser.id)));
      const localOk = usuarioPerfisVinculados.some((p) => p.nr_sequencia === local);
      if (localOk) {
        setActivePerfilSequencia(local);
        return;
      }
    } catch {
      /* storage indisponível */
    }
    setActivePerfilSequencia(usuarioPerfisVinculados[0].nr_sequencia);
  }, [currentUser, usuarioPerfisVinculados]);

  function handleActivePerfilChange(nr: number) {
    setActivePerfilSequencia(nr);
    if (!currentUser?.id) return;
    try {
      window.localStorage.setItem(getActivePerfilKey(currentUser.id), String(nr));
    } catch {
      /* storage indisponível */
    }
    atualizarPreferenciasUsuario(currentUser.id, { config_perfil_ativo: String(nr) })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_perfil_ativo: String(nr) } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar perfil ativo no banco', err);
      });
  }

  /* ── Se a seção ativa não está liberada ao usuário, volta à primeira liberada ── */
  useEffect(() => {
    if (!currentUser) return;
    if (allowedSections.length === 0) {
      // Nenhuma função liberada: não deixa nenhuma seção ativa.
      setView('list');
      setContextMenu(null);
      return;
    }
    if (!allowedSections.includes(activeSection)) {
      setActiveSection(allowedSections[0]);
      setView('list');
      setContextMenu(null);
    }
  }, [allowedSections, activeSection, currentUser]);

  /* ── Restaurar sessão ao montar ── */
  useEffect(() => {
    let cancelled = false;

    async function restaurarSessao() {
      try {
        const raw = window.localStorage.getItem(SESSION_KEY);
        if (!raw) return;

        const session = JSON.parse(raw) as {
          userId?: string;
          activeSection?: SectionType;
          adminManageSelection?: string;
          cgManageSelection?: string;
          pjManageSelection?: string;
          alunoManageSelection?: string;
          patrimonioManageSelection?: string;
          relatorioManageSelection?: string;
        };

        if (!session?.userId) return;

        const usuariosCadastrados = await Promise.race([
          obterUsuarios(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000)),
        ]);
        if (cancelled) return;

        const usuarioSalvo = usuariosCadastrados.find((u) => u.id === session.userId);
        if (!usuarioSalvo) {
          window.localStorage.removeItem(SESSION_KEY);
          return;
        }

        setCurrentUser(usuarioSalvo);
        if (session.activeSection === "administracaoSistema" || session.activeSection === "pessoaFisica" || session.activeSection === "cadastrosGerais" || session.activeSection === "estruturaAcademica" || session.activeSection === "patrimonio" || session.activeSection === "relatorio") {
          setActiveSection(session.activeSection);
        }
        if (typeof session.adminManageSelection === "string" && (session.adminManageSelection === 'usuarios' || session.adminManageSelection === 'perfis' || session.adminManageSelection === 'campos')) {
          setAdminManageSelection(session.adminManageSelection);
          setAdminInteracted(true);
        }
        if (typeof session.cgManageSelection === "string" && session.cgManageSelection.trim() !== "") {
          setCgManageSelection(session.cgManageSelection);
          setCgInteracted(true);
        }
        if (typeof session.pjManageSelection === "string" && (session.pjManageSelection === 'pessoasFisicas' || session.pjManageSelection === 'pessoasJuridicas')) {
          setPjManageSelection(session.pjManageSelection);
          setPjInteracted(true);
        }
        if (typeof session.alunoManageSelection === "string" && (session.alunoManageSelection === 'alunos' || session.alunoManageSelection === 'colaboradores')) {
          setAlunoManageSelection(session.alunoManageSelection);
          setAlunoInteracted(true);
        }
        if (typeof session.patrimonioManageSelection === "string" && session.patrimonioManageSelection.trim() !== "") {
          setAtivoManageSelection(session.patrimonioManageSelection);
          setAtivoInteracted(true);
        }
        if (typeof session.relatorioManageSelection === "string" && session.relatorioManageSelection.trim() !== "") {
          setRelatorioManageSelection(session.relatorioManageSelection);
          setRelatorioInteracted(true);
        }
        setView("list");
        setIsAuthenticated(true);
      } catch {
        /* sessão corrompida — cai para a tela de login */
      } finally {
        if (!cancelled) setSessionRestoring(false);
      }
    }

    restaurarSessao();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Fechar menu de contexto ao clicar/right-click fora ── */
  useEffect(() => {
    if (!contextMenu) return;
    function handleClose() {
      setContextMenu(null);
    }
    document.addEventListener("click", handleClose);
    document.addEventListener("contextmenu", handleClose);
    return () => {
      document.removeEventListener("click", handleClose);
      document.removeEventListener("contextmenu", handleClose);
    };
  }, [contextMenu]);


  /* ── Abrir formulário para novo registro ── */
  function openNewForm() {
    setForm(emptyForm);
    setEditingId(null);
    setAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setNaturalidadeNome('');
    setPfCampoErros([]);
    setView("form");
    setActiveSection("pessoaFisica");
  }

  function openPjNewForm() {
    setPjForm(emptyPjForm);
    setPjEditingId(null);
    setPjAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setPjCidadeNome('');
    setPjCampoErros([]);
    setView("form");
    setActiveSection("pessoaFisica");
  }

  function openAdminNewForm() {
    setAdminForm({ ...emptyAdminForm, nr_seq_pessoa_fisica: undefined });
    setAdminEditingId(null);
    setAdminOriginalSenhaHash(null);
    setAdminAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setAdminCampoErros([]);
    setView("form");
    setActiveSection("administracaoSistema");
  }

  function openPerfilNewForm() {
    setPerfilForm({ ds_perfil: '', ds_observacao: '', ie_status: 'A' });
    setPerfilEditingId(null);
    setPerfilAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setPerfilCampoErros([]);
    setView("form");
    setActiveSection("administracaoSistema");
  }

  // Botão "Adicionar" de Usuários: sem a permissão, mostra aviso em vez de abrir o formulário.
  function handleAdminNewForm() {
    if (!permissoesAdmin.adicionarUsuario) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    openAdminNewForm();
  }

  // Botão "Adicionar" de Perfis: sem a permissão, mostra aviso em vez de abrir o formulário.
  function handlePerfilNewForm() {
    if (!permissoesAdmin.adicionarPerfil) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    openPerfilNewForm();
  }

  // Botão "Adicionar" de Pessoas Físicas: sem a permissão, mostra aviso.
  function handlePessoaNewForm() {
    if (!permissoesPessoa.adicionarPessoaFisica) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    openNewForm();
  }

  // Botão "Adicionar" de Pessoas Jurídicas: sem a permissão, mostra aviso.
  function handlePjNewForm() {
    if (!permissoesPessoa.adicionarPessoaJuridica) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    openPjNewForm();
  }

  function openAlunoNewForm() {
    // O campo Data de ingresso já vem preenchido com a data atual (formato DD/MM/AAAA).
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setAlunoForm({
      ...emptyAlunoForm,
      dt_ingresso: `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`,
    });
    setAlunoEditingId(null);
    setAlunoAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setAlunoCampoErros([]);
    setView("form");
    setActiveSection("estruturaAcademica");
  }

  // Botão "Adicionar" de Alunos: sem a permissão, mostra aviso.
  function handleAlunoNewForm() {
    if (!permissoesEA.adicionarAluno) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    openAlunoNewForm();
  }

  function openColaboradorNewForm() {
    // Data de admissão já vem preenchida com a data atual (formato DD/MM/AAAA).
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setColaboradorForm({
      ...emptyColaboradorForm,
      dt_admissao: `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`,
    });
    setColaboradorEditingId(null);
    setColaboradorAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setColaboradorCampoErros([]);
    setView("form");
    setActiveSection("estruturaAcademica");
  }

  // Botão "Adicionar" de Colaboradores: sem a permissão, mostra aviso.
  function handleColaboradorNewForm() {
    if (!permissoesEA.adicionarColaborador) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    openColaboradorNewForm();
  }

  function openAtivoNewForm() {
    setAtivoForm(emptyAtivoForm);
    setAtivoEditingId(null);
    setAtivoAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setAtivoCampoErros([]);
    setView("form");
    setActiveSection("patrimonio");
  }

  // Botão "Adicionar" de Ativos: sem a permissão, mostra aviso.
  function handleAtivoNewForm() {
    if (!permissoesPatrimonio.adicionarAtivo) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    openAtivoNewForm();
  }

  // Botão "Adicionar" de Cadastros Gerais: sem a permissão da seção ativa, mostra aviso.
  function handleCgNewForm() {
    if (!permissoesCg[cgKind]?.adicionar) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    openCgNewForm();
  }

  // ── Relatórios ──
  function openRelatorioNewForm() {
    setRelatorioEditingId(null);
    setRelatorioForm(null);
    setRelatorioView('builder');
    setMessage('');
    setRelatorioAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  }

  function openRelatorioEditForm(relatorio: Relatorio) {
    setRelatorioEditingId(relatorio.id ?? null);
    setRelatorioForm(relatorio);
    setRelatorioView('builder');
    setMessage('');
    setRelatorioAuditInfo({
      createdAt: relatorio.dt_criacao ?? '',
      updatedAt: relatorio.dt_alteracao ?? '',
      createdBy: relatorio.ds_usuario_criacao ?? '',
      updatedBy: relatorio.ds_usuario_alteracao ?? '',
    });
  }

  function closeRelatorioBuilder() {
    setRelatorioView('list');
    setRelatorioEditingId(null);
    setRelatorioForm(null);
  }

  async function handleRelatorioSave(data: Omit<Relatorio, 'id' | 'nr_sequencia' | 'dt_criacao' | 'dt_alteracao' | 'ds_usuario_criacao' | 'ds_usuario_alteracao'>) {
    // Se a banda já salvou e os dados não mudaram, mostrar loading e fechar
    if (bandaJustSavedRef.current) {
      bandaJustSavedRef.current = false;
      setRelatorioSubmitting(true);
      await new Promise((r) => setTimeout(r, 600));
      setRelatorioSubmitting(false);
      closeRelatorioBuilder();
      return;
    }
    setRelatorioSubmitting(true);
    setMessage('');
    try {
      const auditAutor = { usuarioId: currentUser?.id ?? null, usuarioNome: currentUserPersonName || currentUser?.ds_usuario || '' };
      if (relatorioEditingId) {
        await atualizarRelatorio(relatorioEditingId, data, auditAutor);
        setMessage('Relatório atualizado com sucesso!');
      } else {
        await criarRelatorio(data, auditAutor);
        setMessage('Relatório criado com sucesso!');
      }
      await loadRelatorios();
      closeRelatorioBuilder();
    } catch {
      setMessage('Erro ao salvar relatório.');
    } finally {
      setRelatorioSubmitting(false);
    }
  }

  /** Salva a banda diretamente no Firestore (gera log de auditoria) */
  async function handleBandaSave(bandasAtualizadas: any[]) {
    if (!relatorioEditingId || !relatorioForm) return;
    try {
      const auditAutor = { usuarioId: currentUser?.id ?? null, usuarioNome: currentUserPersonName || currentUser?.ds_usuario || '' };
      // Monta o objeto completo do relatório com as bandas atualizadas
      const { id, nr_sequencia, dt_criacao, dt_alteracao, ds_usuario_criacao, ds_usuario_alteracao, ...rest } = relatorioForm as any;
      const agora = new Date().toISOString();
      await atualizarRelatorio(relatorioEditingId, { ...rest, bandas: bandasAtualizadas }, auditAutor);
      bandaJustSavedRef.current = true;
      // Atualiza o estado local com as bandas salvas
      setRelatorioForm((prev) => prev ? { ...prev, bandas: bandasAtualizadas, dt_alteracao: agora, ds_usuario_alteracao: auditAutor.usuarioNome } : prev);
      setRelatorioAuditInfo((prev) => ({ ...prev, updatedAt: agora, updatedBy: auditAutor.usuarioNome }));
      await loadRelatorios();
    } catch (err) {
      console.error('[BANDA SAVE] ERRO:', err);
    }
  }

  async function handleRelatorioDelete(id: string) {
    try {
      await excluirRelatorio(id);
      await loadRelatorios();
      setMessage('Relatório excluído com sucesso!');
    } catch {
      setMessage('Erro ao excluir relatório.');
    }
  }

  function handleRelatorioGerar(relatorio: Relatorio) {
    // Check for parameter filters (from both top-level and bandas)
    const parametrosBandas = (relatorio.bandas ?? []).flatMap((b) => (b.filtros ?? []).filter((f) => f.parametro));
    const parametros = [...parametrosBandas];
    if (parametros.length > 0) {
      setRelatorioParamValues((prev) => {
        const initialValues: Record<string, string> = { ...prev };
        for (const p of parametros) {
          if (initialValues[p.id] === undefined) {
            initialValues[p.id] = p.valor ?? '';
          }
        }
        return initialValues;
      });
      setRelatorioParamModal({ relatorio, parametros });
      return;
    }
    executarRelatorioGerar(relatorio);
  }

  async function executarRelatorioGerar(relatorio: Relatorio) {
    setRelatorioGerando(true);
    setMessage('');
    try {
      const todasBandas = relatorio.bandas ?? [];
      const bandasComColecao = todasBandas.filter((b) => b.ie_colecao_principal);
      const bandasSemColecao = todasBandas.filter((b) => !b.ie_colecao_principal);

      if (relatorio.ie_formato !== 'excel' && todasBandas.length > 0) {
        // Modo Bandas: consultar cada banda separadamente
        const bandasPdfData: import('@/lib/relatorioPdf').BandaPdfData[] = [];
        let totalRegistros = 0;

        for (const banda of bandasComColecao) {
          const relatorioBanda: Relatorio = { ...relatorio, colecao: banda.ie_colecao_principal!, campos: banda.campos ?? [], filtros: banda.filtros ?? [], ordenacao: banda.ordenacao ?? [] };
          const resultado = await executarConsultaRelatorio(relatorioBanda);
          const dsBanda = getDataSource(banda.ie_colecao_principal!);
          const camposResolvidos = (banda.campos ?? []).map((c) => ({
            ...c,
            chave: resolverChaveCampo(c, banda.ie_colecao_principal!, dsBanda?.campos ?? []),
          }));
          const registrosResolvidos = resultado.registrosResolvidos.map((reg) => {
            const regResolvido = { ...reg };
            for (const c of camposResolvidos) {
              if (c.statusSistema && c.chave) {
                const partes = c.chave.split('.');
                let obj: any = regResolvido;
                for (let i = 0; i < partes.length - 1; i++) obj = obj?.[partes[i]];
                const campoFinal = partes[partes.length - 1];
                if (obj && typeof obj[campoFinal] === 'string') {
                  obj[campoFinal] = resolverStatusLabel(c.colecao || banda.ie_colecao_principal!, obj[campoFinal]);
                }
              }
            }
            return regResolvido;
          });
          bandasPdfData.push({ nome: banda.ds_banda || 'Banda', posicao: banda.nr_posicao, tipo: banda.ie_tipo_banda as any, altura: banda.nr_altura, ie_borda_superior: banda.ie_borda_superior, ie_borda_inferior: banda.ie_borda_inferior, ie_borda_esquerda: banda.ie_borda_esquerda, ie_borda_direita: banda.ie_borda_direita, campos: camposResolvidos, registros: registrosResolvidos });
          totalRegistros += registrosResolvidos.length;
        }

        // Bandas sem coleção (Cabeçalho/Rodapé) — sem consulta, apenas dados estáticos
        for (const banda of bandasSemColecao) {
          bandasPdfData.push({ nome: banda.ds_banda || 'Banda', posicao: banda.nr_posicao, tipo: banda.ie_tipo_banda as any, altura: banda.nr_altura, ie_borda_superior: banda.ie_borda_superior, ie_borda_inferior: banda.ie_borda_inferior, ie_borda_esquerda: banda.ie_borda_esquerda, ie_borda_direita: banda.ie_borda_direita, campos: banda.campos ?? [], registros: [{}] });
        }

        gerarPdf(relatorio, [], bandasPdfData, currentUser?.ds_usuario ?? undefined);
        setMessage(`Relatório gerado com sucesso! ${totalRegistros} registro(s) encontrado(s).`);
      } else {
        const resultado = await executarConsultaRelatorio(relatorio);
        if (resultado.total === 0) {
          setMessage('Nenhum registro encontrado com os filtros aplicados.');
          setRelatorioGerando(false);
          return;
        }
        const dsPrincipal = getDataSource(relatorio.colecao);
        const camposResolvidos = relatorio.campos.map((c) => ({
          ...c,
          chave: resolverChaveCampo(c, relatorio.colecao, dsPrincipal?.campos ?? []),
        }));
        const registrosResolvidos = resultado.registrosResolvidos.map((reg) => {
          const regResolvido = { ...reg };
          for (const c of camposResolvidos) {
            if (c.statusSistema && c.chave) {
              const partes = c.chave.split('.');
              let obj: any = regResolvido;
              for (let i = 0; i < partes.length - 1; i++) obj = obj?.[partes[i]];
              const campoFinal = partes[partes.length - 1];
              if (obj && typeof obj[campoFinal] === 'string') {
                obj[campoFinal] = resolverStatusLabel(c.colecao || relatorio.colecao, obj[campoFinal]);
              }
            }
          }
          return regResolvido;
        });
        const relatorioResolvido = { ...relatorio, campos: camposResolvidos };
        if (relatorio.ie_formato === 'excel') {
          gerarERealizarDownloadExcel(relatorioResolvido, registrosResolvidos);
        } else {
          gerarPdf(relatorioResolvido, registrosResolvidos, undefined, currentUser?.ds_usuario ?? undefined);
        }
        setMessage(`Relatório gerado com sucesso! ${resultado.total} registro(s) encontrado(s).`);
      }
    } catch (err: any) {
      setMessage(`Erro ao gerar relatório: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setRelatorioGerando(false);
    }
  }

  function handleRelatorioParamConfirm() {
    if (!relatorioParamModal) return;
    const updatedFiltros = relatorioParamModal.relatorio.filtros.map((f) => {
      if (f.parametro && relatorioParamValues[f.id] !== undefined) {
        return { ...f, valor: relatorioParamValues[f.id] };
      }
      return f;
    });
    const updatedBandas = (relatorioParamModal.relatorio.bandas ?? []).map((b) => ({
      ...b,
      filtros: (b.filtros ?? []).map((f) => {
        if (f.parametro && relatorioParamValues[f.id] !== undefined) {
          return { ...f, valor: relatorioParamValues[f.id] };
        }
        return f;
      }),
    }));
    const updatedRelatorio = { ...relatorioParamModal.relatorio, filtros: updatedFiltros, bandas: updatedBandas };
    setRelatorioParamModal(null);
    executarRelatorioGerar(updatedRelatorio);
  }

  async function handleRelatorioDuplicate(relatorio: Relatorio) {
    try {
      const { id, nr_sequencia, dt_criacao, dt_alteracao, ds_usuario_criacao, ds_usuario_alteracao, ...rest } = relatorio;
      const auditAutor = { usuarioId: currentUser?.id ?? null, usuarioNome: currentUserPersonName || currentUser?.ds_usuario || '' };
      await criarRelatorio({ ...rest, ds_relatorio: `${rest.ds_relatorio} (Cópia)` }, auditAutor);
      await loadRelatorios();
      setMessage('Relatório duplicado com sucesso!');
    } catch {
      setMessage('Erro ao duplicar relatório.');
    }
  }

  // "Ver" do menu de contexto: respeita as permissões da seção ativa.
  function podeVerNoContexto(): boolean {
    if (view !== 'list') return false;
    const s = contextMenu?.section;
    if (!s) return false;
    if (s === 'administracaoSistema') {
      if (adminManageSelection === 'perfis') return permissoesAdmin.verPerfil;
      if (adminManageSelection === 'usuarios') return permissoesAdmin.verUsuario;
      return true;
    }
    if (s === 'pessoaFisica') {
      if (pjManageSelection === 'pessoasJuridicas') return permissoesPessoa.verPessoaJuridica;
      return permissoesPessoa.verPessoaFisica;
    }
    if (s === 'cadastrosGerais') {
      return permissoesCg[cgKind]?.ver ?? true;
    }
    if (s === 'estruturaAcademica') {
      if (alunoManageSelection === 'colaboradores') return permissoesEA.verColaborador;
      return permissoesEA.verAluno;
    }
    if (s === 'patrimonio') {
      if (ativoManageSelection === 'manutencoes') return false; // gerenciado via customItems
      return permissoesPatrimonio.verAtivo;
    }
    if (s === 'relatorio') return true;
    return true;
  }

  // "Excluir" do menu de contexto: respeita as permissões da seção ativa.
  function podeExcluirNoContexto(): boolean {
    if (isProtectedAdminItem) return false;
    const s = contextMenu?.section;
    if (!s) return true;
    if (s === 'administracaoSistema') {
      if (adminManageSelection === 'perfis') return permissoesAdmin.excluirPerfil;
      if (adminManageSelection === 'usuarios') return permissoesAdmin.excluirUsuario;
      return true;
    }
    if (s === 'pessoaFisica') {
      if (pjManageSelection === 'pessoasJuridicas') return permissoesPessoa.excluirPessoaJuridica;
      return permissoesPessoa.excluirPessoaFisica;
    }
    if (s === 'cadastrosGerais') {
      return permissoesCg[cgKind]?.excluir ?? true;
    }
    if (s === 'estruturaAcademica') {
      if (alunoManageSelection === 'colaboradores') return permissoesEA.excluirColaborador;
      return permissoesEA.excluirAluno;
    }
    if (s === 'patrimonio') {
      if (ativoManageSelection === 'manutencoes') return false; // gerenciado via customItems
      return permissoesPatrimonio.excluirAtivo;
    }
    return true;
  }

  function openCgNewForm() {
    setCgForm(emptyCgForm);
    setCgEditingId(null);
    setCgAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setCgCampoErros([]);
    setView("form");
    setActiveSection("cadastrosGerais");
  }

  function handleAdminManageSelectionChange(value: string) {
    setAdminInteracted(true);
    setAdminManageSelection(value);
    // Ao trocar entre Usuários/Perfis/Campos, zera o formulário em edição
    // para nunca salvar contra a coleção errada.
    setAdminForm(emptyAdminForm);
    setAdminEditingId(null);
    setAdminOriginalSenhaHash(null);
    setAdminAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setPerfilForm({ ds_perfil: '', ds_observacao: '', ie_status: 'A' });
    setPerfilEditingId(null);
    setPerfilAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setAdminFilterModalOpen(false);
    setPerfilFilterModalOpen(false);
    setMessage("");
    setView("list");
  }

  // Salva o status de um campo na configuração do perfil (Administração > Campos).
  async function handleCamposStatusChange(perfil: Perfil, chave: string, status: CampoStatus) {
    if (!perfil.id) return;
    setMessage("");
    const config = parseCamposConfig(perfil.config_campos);
    config[chave] = status;
    try {
      await atualizarPerfil(perfil.id, { config_campos: serializeCamposConfig(config) }, auditAutor);
      setMessage(`Campo atualizado com sucesso: ${status === 'O' ? 'Obrigatório' : status === 'D' ? 'Desabilitado' : 'Normal'}`);
      await loadPerfis();
    } catch {
      setMessage("Erro ao salvar configuração do campo.");
    }
  }

  function handleCgManageSelectionChange(value: string) {
    setCgInteracted(true);
    setCgManageSelection(value);
    // Ao trocar a seleção no meio da edição, zera o registro em edição
    // para nunca salvar contra a coleção errada.
    setCgForm(emptyCgForm);
    setCgEditingId(null);
    setCgAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  }

  function handlePjManageSelectionChange(value: string) {
    setPjInteracted(true);
    setPjManageSelection(value);
    // Ao trocar entre Pessoas Físicas/Jurídicas, zera os formulários e
    // retorna à listagem para nunca salvar contra a coleção errada.
    setForm(emptyForm);
    setEditingId(null);
    setAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setPjForm(emptyPjForm);
    setPjEditingId(null);
    setPjAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setFilterModalOpen(false);
    setPjFilterModalOpen(false);
    setMessage("");
    setView("list");
  }

  function handleAlunoManageSelectionChange(value: string) {
    setAlunoInteracted(true);
    setAlunoManageSelection(value);
    // Ao trocar entre Alunos/Colaboradores, zera os formulários em edição
    // para nunca salvar contra a coleção errada.
    setAlunoForm(emptyAlunoForm);
    setAlunoEditingId(null);
    setAlunoAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setAlunoFilterModalOpen(false);
    setColaboradorForm(emptyColaboradorForm);
    setColaboradorEditingId(null);
    setColaboradorAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setView("list");
  }

  function handlePatrimonioManageSelectionChange(value: string) {
    setAtivoInteracted(true);
    setAtivoManageSelection(value);
    // Ao trocar a seleção no meio da edição, zera o registro em edição
    // para nunca salvar contra a coleção errada.
    setAtivoForm(emptyAtivoForm);
    setAtivoEditingId(null);
    setAtivoAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setView("list");
  }

  async function openAuditModal(pessoaId?: string | null) {
    if (!pessoaId) return;
    setAuditDocumentType('pessoa_fisica');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const logs = await fetchAuditByPessoaId(pessoaId);
      setAuditLogs(logs);
    } catch (e) {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function openPjAuditModal(pessoaId?: string | null) {
    if (!pessoaId) return;
    setAuditDocumentType('pessoa_juridica');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const logs = await fetchAuditByDocumentId('pessoa_juridica', pessoaId);
      setAuditLogs(logs);
    } catch (e) {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function openAdminAuditModal(usuarioId?: string | null) {
    if (!usuarioId) return;
    setAuditDocumentType('usuario');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const logs = await fetchAuditByUsuarioId(usuarioId);
      setAuditLogs(logs);
    } catch (e) {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function openPerfilAuditModal(perfilId?: string | null) {
    if (!perfilId) return;
    setAuditDocumentType('perfil');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const logs = await fetchAuditByDocumentId('perfil', perfilId);
      setAuditLogs(logs);
    } catch (e) {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function openCgAuditModal(cgId?: string | null) {
    if (!cgId) return;
    setAuditDocumentType(cgCollection as 'cg_sexo' | 'cg_estado_civil' | 'cg_cor_raca' | 'cg_profissao' | 'cg_orgao_emissor' | 'cg_logradouro' | 'cg_grau_parentesco' | 'cg_cargo' | 'cg_vinculo_contratual' | 'cg_localizacao' | 'cg_marca' | 'cg_categoria_ativo');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const logs = await fetchAuditByDocumentId(cgCollection, cgId);
      setAuditLogs(logs);
    } catch (e) {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function openAlunoAuditModal(alunoId?: string | null) {
    if (!alunoId) return;
    setAuditDocumentType('aluno');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const logs = await fetchAuditByDocumentId('aluno', alunoId);
      setAuditLogs(logs);
    } catch (e) {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function openColaboradorAuditModal(colaboradorId?: string | null) {
    if (!colaboradorId) return;
    setAuditDocumentType('colaborador');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const logs = await fetchAuditByDocumentId('colaborador', colaboradorId);
      setAuditLogs(logs);
    } catch (e) {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function openAtivoAuditModal(ativoId?: string | null) {
    if (!ativoId) return;
    setAuditDocumentType('pat_ativo');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const logs = await fetchAuditByDocumentId('pat_ativo', ativoId);
      setAuditLogs(logs);
    } catch (e) {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function openParametrosAuditModal() {
    setAuditDocumentType('pat_parametros');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const paramDoc = await obterParamCodigoPatrimonio();
      if (paramDoc?.id) {
        const logs = await fetchAuditByDocumentId('pat_param_codigo_patrimonio', paramDoc.id);
        setAuditLogs(logs);
      } else {
        setAuditLogs([]);
      }
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  function closeAuditModal() {
    setAuditModalOpen(false);
    setAuditLogs([]);
  }

  function openFilterModal() {
    setFilterModalOpen(true);
  }

  function closeFilterModal() {
    setFilterModalOpen(false);
  }

  function openAtivoFilterModal() {
    setAtivoFilterForm(appliedAtivoFilterForm);
    setAtivoFilterModalOpen(true);
  }

  function closeAtivoFilterModal() {
    setAtivoFilterModalOpen(false);
  }

  function applyAtivoFilter() {
    setAppliedAtivoFilterForm(ativoFilterForm);
    setAtivoFilterModalOpen(false);
  }

  function clearAtivoFilter() {
    setAtivoFilterForm(emptyAtivoFilterForm);
    setAppliedAtivoFilterForm(emptyAtivoFilterForm);
  }

  function openManutencaoFilterModal() {
    setManutencaoFilterForm(appliedManutencaoFilterForm);
    setManutencaoFilterModalOpen(true);
  }

  function closeManutencaoFilterModal() {
    setManutencaoFilterModalOpen(false);
  }

  function applyManutencaoFilter() {
    setAppliedManutencaoFilterForm(manutencaoFilterForm);
    setManutencaoFilterModalOpen(false);
  }

  function clearManutencaoFilter() {
    setManutencaoFilterForm(emptyManutencaoFilterForm);
    setAppliedManutencaoFilterForm(emptyManutencaoFilterForm);
  }

  function openPjFilterModal() {
    setPjFilterForm(appliedPjFilterForm);
    setPjFilterModalOpen(true);
  }

  function closePjFilterModal() {
    setPjFilterModalOpen(false);
  }

  function applyPjFilter() {
    setAppliedPjFilterForm(pjFilterForm);
    setPjFilterModalOpen(false);
  }

  function clearPjFilter() {
    setPjFilterForm(emptyPjFilterForm);
    setAppliedPjFilterForm(emptyPjFilterForm);
  }

  function handlePjFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyPjFilter();
  }

  function openAlunoFilterModal() {
    setAlunoFilterForm(appliedAlunoFilterForm);
    setAlunoFilterModalOpen(true);
  }

  function closeAlunoFilterModal() {
    setAlunoFilterModalOpen(false);
  }

  function applyAlunoFilter() {
    setAppliedAlunoFilterForm(alunoFilterForm);
    setAlunoFilterModalOpen(false);
  }

  function clearAlunoFilter() {
    const empty = { nr_sequencia: '', nr_matricula: '', nr_seq_pessoa_fisica: '', dt_ingresso_inicio: '', dt_ingresso_fim: '' };
    setAlunoFilterForm(empty);
    setAppliedAlunoFilterForm(empty);
  }

  function handleAlunoFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyAlunoFilter();
  }

  function openColaboradorFilterModal() {
    setColaboradorFilterForm(appliedColaboradorFilterForm);
    setColaboradorFilterModalOpen(true);
  }

  function closeColaboradorFilterModal() {
    setColaboradorFilterModalOpen(false);
  }

  function applyColaboradorFilter() {
    setAppliedColaboradorFilterForm(colaboradorFilterForm);
    setColaboradorFilterModalOpen(false);
  }

  function clearColaboradorFilter() {
    const empty = { nr_sequencia: '', nr_matricula: '', nr_seq_pessoa_fisica: '', nr_seq_pessoa_juridica: '', dt_admissao_inicio: '', dt_admissao_fim: '' };
    setColaboradorFilterForm(empty);
    setAppliedColaboradorFilterForm(empty);
  }

  function handleColaboradorFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyColaboradorFilter();
  }

  function openAdminFilterModal() {
    setAdminFilterForm(appliedAdminFilterForm);
    setAdminFilterModalOpen(true);
  }

  function closeAdminFilterModal() {
    setAdminFilterModalOpen(false);
  }

  function openPerfilFilterModal() {
    setPerfilFilterForm(appliedPerfilFilterForm);
    setPerfilFilterModalOpen(true);
  }

  function closePerfilFilterModal() {
    setPerfilFilterModalOpen(false);
  }

  function applyPerfilFilter() {
    setAppliedPerfilFilterForm({ ...perfilFilterForm, ie_status: perfilFilterForm.ie_status || 'T' });
    setPerfilFilterModalOpen(false);
  }

  function clearPerfilFilter() {
    setPerfilFilterForm({ nr_sequencia: '', ds_perfil: '', ie_status: 'T' });
    setAppliedPerfilFilterForm({ nr_sequencia: '', ds_perfil: '', ie_status: 'T' });
  }

  function handlePerfilFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyPerfilFilter();
  }

  function openCgFilterModal() {
    setCgFilterForm(appliedCgFilterForm);
    setCgFilterModalOpen(true);
  }

  function closeCgFilterModal() {
    setCgFilterModalOpen(false);
  }

  function applyCgFilter() {
    setAppliedCgFilterForm({ ...cgFilterForm, ie_status: cgFilterForm.ie_status || 'T' });
    setCgFilterModalOpen(false);
  }

  function clearCgFilter() {
    setCgFilterForm({ nr_sequencia: '', descricao: '', ie_status: 'T' });
    setAppliedCgFilterForm({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  }

  function handleCgFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyCgFilter();
  }

  function openAdminPessoaFisicaLookup() {
    setAdminPessoaFisicaLookupForm({ ds_nome: '', nr_sequencia: '', nr_cpf: '' });
    setAdminPessoaFisicaLookupFilter({ ds_nome: '', nr_sequencia: '', nr_cpf: '' });
    setAdminPessoaFisicaLookupApplied(false);
    setAdminPessoaFisicaLookupOpen(true);
  }

  function closeAdminPessoaFisicaLookup() {
    setAdminPessoaFisicaLookupOpen(false);
  }

  function applyAdminPessoaFisicaLookupFilter() {
    setAdminPessoaFisicaLookupFilter(adminPessoaFisicaLookupForm);
    setAdminPessoaFisicaLookupApplied(true);
  }

  function clearAdminPessoaFisicaLookupFilter() {
    setAdminPessoaFisicaLookupForm({ ds_nome: '', nr_sequencia: '', nr_cpf: '' });
    setAdminPessoaFisicaLookupFilter({ ds_nome: '', nr_sequencia: '', nr_cpf: '' });
    setAdminPessoaFisicaLookupApplied(false);
  }

  function handleAdminPessoaFisicaSelect(pessoa: PessoaFisica) {
    setAdminFilterForm({ ...adminFilterForm, nr_seq_pessoa_fisica: String(pessoa.nr_sequencia) });
    closeAdminPessoaFisicaLookup();
  }

  function applyAdminFilter() {
    setAppliedAdminFilterForm({ ...adminFilterForm, ie_status: adminFilterForm.ie_status || 'T' });
    setAdminFilterModalOpen(false);
  }

  function clearAdminFilter() {
    setAdminFilterForm(emptyAdminFilterForm);
    setAppliedAdminFilterForm(emptyAdminFilterForm);
  }

  function handleAdminFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyAdminFilter();
  }

  function applyFilter() {
    setAppliedFilterForm(filterForm);
    setFilterModalOpen(false);
  }

  function clearFilter() {
    setFilterForm(emptyFilterForm);
    setAppliedFilterForm(emptyFilterForm);
  }

  function handleFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyFilter();
  }

  function handleSortChange(logicalIndex: number) {
    if (sortColumn === logicalIndex) {
      if (sortAsc) {
        setSortAsc(false);
      } else {
        setSortColumn(null);
        setSortAsc(null);
      }
    } else {
      setSortColumn(logicalIndex);
      setSortAsc(true);
    }
  }

  function handleAdminSortChange(logicalIndex: number) {
    if (adminSortColumn === logicalIndex) {
      if (adminSortAsc) {
        setAdminSortAsc(false);
      } else {
        setAdminSortColumn(null);
        setAdminSortAsc(null);
      }
    } else {
      setAdminSortColumn(logicalIndex);
      setAdminSortAsc(true);
    }
  }

  function handlePerfilSortChange(logicalIndex: number) {
    if (perfilSortColumn === logicalIndex) {
      if (perfilSortAsc) {
        setPerfilSortAsc(false);
      } else {
        setPerfilSortColumn(null);
        setPerfilSortAsc(null);
      }
    } else {
      setPerfilSortColumn(logicalIndex);
      setPerfilSortAsc(true);
    }
  }

  function handleCgSortChange(logicalIndex: number) {
    if (cgSortColumn === logicalIndex) {
      if (cgSortAsc) {
        setCgSortAsc(false);
      } else {
        setCgSortColumn(null);
        setCgSortAsc(null);
      }
    } else {
      setCgSortColumn(logicalIndex);
      setCgSortAsc(true);
    }
  }

  function handlePjSortChange(logicalIndex: number) {
    if (pjSortColumn === logicalIndex) {
      if (pjSortAsc) {
        setPjSortAsc(false);
      } else {
        setPjSortColumn(null);
        setPjSortAsc(null);
      }
    } else {
      setPjSortColumn(logicalIndex);
      setPjSortAsc(true);
    }
  }

  function handleAlunoSortChange(logicalIndex: number) {
    if (alunoSortColumn === logicalIndex) {
      if (alunoSortAsc) {
        setAlunoSortAsc(false);
      } else {
        setAlunoSortColumn(null);
        setAlunoSortAsc(null);
      }
    } else {
      setAlunoSortColumn(logicalIndex);
      setAlunoSortAsc(true);
    }
  }

  function handleColaboradorSortChange(logicalIndex: number) {
    if (colaboradorSortColumn === logicalIndex) {
      if (colaboradorSortAsc) {
        setColaboradorSortAsc(false);
      } else {
        setColaboradorSortColumn(null);
        setColaboradorSortAsc(null);
      }
    } else {
      setColaboradorSortColumn(logicalIndex);
      setColaboradorSortAsc(true);
    }
  }

  function handleAtivoSortChange(logicalIndex: number) {
    if (ativoSortColumn === logicalIndex) {
      if (ativoSortAsc) {
        setAtivoSortAsc(false);
      } else {
        setAtivoSortColumn(null);
        setAtivoSortAsc(null);
      }
    } else {
      setAtivoSortColumn(logicalIndex);
      setAtivoSortAsc(true);
    }
  }

  /* ── Carregar autor da auditoria (para o rodapé do formulário) ── */
  async function carregarAutorAuditoriaPessoa(id: string) {
    try {
      const logs = await fetchAuditByPessoaId(id);
      if (auditPessoaIdRef.current !== id) return;
      const createLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'create');
      const lastChangeLog = logs.find((l) => {
        const acao = String(l.acao ?? '').toLowerCase();
        return acao === 'update' || acao === 'password';
      });
      setAuditInfo((prev) => ({
        ...prev,
        createdBy: createLog?.usuarioNome ?? prev.createdBy,
        updatedBy: lastChangeLog?.usuarioNome ?? prev.updatedBy,
      }));
    } catch {
      // mantém vazio em caso de falha
    }
  }

  async function carregarAutorAuditoriaPessoaJuridica(id: string) {
    try {
      const logs = await fetchAuditByDocumentId('pessoa_juridica', id);
      if (auditPjIdRef.current !== id) return;
      const createLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'create');
      const lastChangeLog = logs.find((l) => {
        const acao = String(l.acao ?? '').toLowerCase();
        return acao === 'update' || acao === 'password';
      });
      setPjAuditInfo((prev) => ({
        ...prev,
        createdBy: createLog?.usuarioNome ?? prev.createdBy,
        updatedBy: lastChangeLog?.usuarioNome ?? prev.updatedBy,
      }));
    } catch {
      // mantém vazio em caso de falha
    }
  }

  async function carregarAutorAuditoriaPerfil(id: string) {
    try {
      const logs = await fetchAuditByDocumentId('perfil', id);
      if (auditPerfilIdRef.current !== id) return;
      const createLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'create');
      const lastChangeLog = logs.find((l) => {
        const acao = String(l.acao ?? '').toLowerCase();
        return acao === 'update';
      });
      setPerfilAuditInfo((prev) => ({
        ...prev,
        createdBy: createLog?.usuarioNome ?? prev.createdBy,
        updatedBy: lastChangeLog?.usuarioNome ?? prev.updatedBy,
      }));
    } catch {
      // mantém vazio em caso de falha
    }
  }

  async function carregarAutorAuditoriaUsuario(id: string) {
    try {
      const logs = await fetchAuditByUsuarioId(id);
      if (auditUsuarioIdRef.current !== id) return;
      const createLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'create');
      const lastChangeLog = logs.find((l) => {
        const acao = String(l.acao ?? '').toLowerCase();
        return acao === 'update' || acao === 'password';
      });
      setAdminAuditInfo((prev) => ({
        ...prev,
        createdBy: createLog?.usuarioNome ?? prev.createdBy,
        updatedBy: lastChangeLog?.usuarioNome ?? prev.updatedBy,
      }));
    } catch {
      // mantém vazio em caso de falha
    }
  }

  async function carregarAutorAuditoriaCg(id: string) {
    try {
      const logs = await fetchAuditByDocumentId(cgCollection, id);
      if (auditCgIdRef.current !== id) return;
      const createLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'create');
      const lastChangeLog = logs.find((l) => {
        const acao = String(l.acao ?? '').toLowerCase();
        return acao === 'update' || acao === 'password';
      });
      setCgAuditInfo((prev) => ({
        ...prev,
        createdBy: createLog?.usuarioNome ?? prev.createdBy,
        updatedBy: lastChangeLog?.usuarioNome ?? prev.updatedBy,
      }));
    } catch {
      // mantém vazio em caso de falha
    }
  }

  async function carregarAutorAuditoriaAluno(id: string) {
    try {
      const logs = await fetchAuditByDocumentId('aluno', id);
      if (auditAlunoIdRef.current !== id) return;
      const createLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'create');
      const lastChangeLog = logs.find((l) => {
        const acao = String(l.acao ?? '').toLowerCase();
        return acao === 'update' || acao === 'password';
      });
      setAlunoAuditInfo((prev) => ({
        ...prev,
        createdBy: createLog?.usuarioNome ?? prev.createdBy,
        updatedBy: lastChangeLog?.usuarioNome ?? prev.updatedBy,
      }));
    } catch {
      // mantém vazio em caso de falha
    }
  }

  async function carregarAutorAuditoriaAtivo(id: string) {
    try {
      const logs = await fetchAuditByDocumentId('pat_ativo', id);
      if (auditAtivoIdRef.current !== id) return;
      const createLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'create');
      const lastChangeLog = logs.find((l) => {
        const acao = String(l.acao ?? '').toLowerCase();
        return acao === 'update' || acao === 'password';
      });
      setAtivoAuditInfo((prev) => ({
        ...prev,
        createdBy: createLog?.usuarioNome ?? prev.createdBy,
        updatedBy: lastChangeLog?.usuarioNome ?? prev.updatedBy,
      }));
    } catch {
      // mantém vazio em caso de falha
    }
  }

  /* ── Abrir formulário para editar ── */
  function openEditForm(pessoa: PessoaFisica) {
    setForm({
      ds_nome: pessoa.ds_nome,
      nr_cpf: pessoa.nr_cpf,
      dt_nascimento: pessoa.dt_nascimento,
      ds_email: pessoa.ds_email,
      nr_telefone: pessoa.nr_telefone,
      nr_seq_sexo: pessoa.nr_seq_sexo,
      nr_seq_estado_civil: pessoa.nr_seq_estado_civil,
      nr_seq_cor_raca: pessoa.nr_seq_cor_raca,
      nr_seq_profissao: pessoa.nr_seq_profissao,
      nr_rg: pessoa.nr_rg ?? '',
      dt_emissao: pessoa.dt_emissao ?? '',
      nr_seq_orgao_emissor: pessoa.nr_seq_orgao_emissor,
      sg_estado: pessoa.sg_estado ?? '',
      cd_ibge_naturalidade: pessoa.cd_ibge_naturalidade ?? '',
      nr_cep: pessoa.nr_cep ?? '',
      ds_endereco: pessoa.ds_endereco ?? '',
      nr_endereco: pessoa.nr_endereco ?? '',
      ds_bairro: pessoa.ds_bairro ?? '',
      ds_complemento: pessoa.ds_complemento ?? '',
      nr_seq_logradouro: pessoa.nr_seq_logradouro,
    });
    // Resolve o nome da cidade a partir do código IBGE salvo
    const codigo = pessoa.cd_ibge_naturalidade ?? '';
    naturalidadeCodeRef.current = codigo;
    setNaturalidadeNome('');
    if (codigo) {
      cidadePorCodigo(codigo)
        .then((cidade) => {
          if (naturalidadeCodeRef.current === codigo) {
            setNaturalidadeNome(cidade ? `${cidade.nome} - ${cidade.uf}` : '');
          }
        })
        .catch(() => {
          if (naturalidadeCodeRef.current === codigo) setNaturalidadeNome('');
        });
    }
    setEditingId(pessoa.id ?? null);
    setAuditInfo({
      createdAt: pessoa.dt_criacao ?? '',
      updatedAt: pessoa.dt_alteracao ?? '',
      createdBy: pessoa.ds_usuario_criacao ?? '',
      updatedBy: pessoa.ds_usuario_alteracao ?? '',
    });
    auditPessoaIdRef.current = pessoa.id ?? null;
    setMessage("");
    setPfCampoErros([]);
    setView("form");
    setActiveSection("pessoaFisica");
    if (pessoa.id) {
      carregarAutorAuditoriaPessoa(pessoa.id);
    }
  }

  function openPjEditForm(pessoa: PessoaJuridica) {
    setPjForm({
      ds_razao_social: pessoa.ds_razao_social,
      ds_nome_fantasia: pessoa.ds_nome_fantasia,
      nr_cnpj: pessoa.nr_cnpj,
      nr_inscricao_estadual: pessoa.nr_inscricao_estadual,
      nr_inscricao_municipal: pessoa.nr_inscricao_municipal,
      dt_abertura: pessoa.dt_abertura,
      nr_telefone: pessoa.nr_telefone,
      ds_email: pessoa.ds_email,
      nr_cep: pessoa.nr_cep ?? '',
      ds_endereco: pessoa.ds_endereco ?? '',
      nr_endereco: pessoa.nr_endereco ?? '',
      ds_bairro: pessoa.ds_bairro ?? '',
      ds_complemento: pessoa.ds_complemento ?? '',
      nr_seq_logradouro: pessoa.nr_seq_logradouro,
      sg_estado: pessoa.sg_estado ?? '',
      cd_ibge_cidade: pessoa.cd_ibge_cidade ?? '',
    });
    // Resolve o nome da cidade a partir do código IBGE salvo
    const codigo = pessoa.cd_ibge_cidade ?? '';
    pjCidadeCodeRef.current = codigo;
    setPjCidadeNome('');
    if (codigo) {
      cidadePorCodigo(codigo)
        .then((cidade) => {
          if (pjCidadeCodeRef.current === codigo) {
            setPjCidadeNome(cidade ? `${cidade.nome} - ${cidade.uf}` : '');
          }
        })
        .catch(() => {
          if (pjCidadeCodeRef.current === codigo) setPjCidadeNome('');
        });
    }
    setPjEditingId(pessoa.id ?? null);
    setPjAuditInfo({
      createdAt: pessoa.dt_criacao ?? '',
      updatedAt: pessoa.dt_alteracao ?? '',
      createdBy: pessoa.ds_usuario_criacao ?? '',
      updatedBy: pessoa.ds_usuario_alteracao ?? '',
    });
    auditPjIdRef.current = pessoa.id ?? null;
    setMessage("");
    setPjCampoErros([]);
    setView("form");
    setActiveSection("pessoaFisica");
    if (pessoa.id) {
      carregarAutorAuditoriaPessoaJuridica(pessoa.id);
    }
  }

  function openAlunoEditForm(aluno: Aluno) {
    setAlunoForm({
      nr_seq_pessoa_fisica: aluno.nr_seq_pessoa_fisica,
      nr_matricula: aluno.nr_matricula ?? '',
      dt_ingresso: aluno.dt_ingresso ?? '',
      dt_status: aluno.dt_status ?? '',
      ds_status: aluno.ds_status ?? '',
      ie_status: aluno.ie_status ?? 'A',
      responsaveis: migrarResponsaveis(aluno),
      ds_tipo_sanguineo: aluno.ds_tipo_sanguineo ?? '',
      ds_alergia: Array.isArray(aluno.ds_alergia) ? [...aluno.ds_alergia] : [],
      ds_medicamento_continuo: Array.isArray(aluno.ds_medicamento_continuo) ? [...aluno.ds_medicamento_continuo] : [],
      ds_restricao_alimentar: Array.isArray(aluno.ds_restricao_alimentar) ? [...aluno.ds_restricao_alimentar] : [],
      ds_necessidade_especial: Array.isArray(aluno.ds_necessidade_especial) ? [...aluno.ds_necessidade_especial] : [],
      ds_observacao_medica: aluno.ds_observacao_medica ?? '',
    });
    setAlunoEditingId(aluno.id ?? null);
    setAlunoAuditInfo({
      createdAt: aluno.dt_criacao ?? '',
      updatedAt: aluno.dt_alteracao ?? '',
      createdBy: aluno.ds_usuario_criacao ?? '',
      updatedBy: aluno.ds_usuario_alteracao ?? '',
    });
    auditAlunoIdRef.current = aluno.id ?? null;
    setMessage("");
    setAlunoCampoErros([]);
    setView("form");
    setActiveSection("estruturaAcademica");
    if (aluno.id) {
      carregarAutorAuditoriaAluno(aluno.id);
    }
  }

  function openColaboradorEditForm(colaborador: Colaborador) {
    setColaboradorForm({
      nr_seq_pessoa_fisica: colaborador.nr_seq_pessoa_fisica,
      nr_seq_pessoa_juridica: colaborador.nr_seq_pessoa_juridica,
      nr_seq_vinculo_contratual: colaborador.nr_seq_vinculo_contratual,
      ie_fornecedor: colaborador.ie_fornecedor ?? 'N',
      ie_prestador_servico: colaborador.ie_prestador_servico ?? 'N',
      nr_matricula: colaborador.nr_matricula ?? '',
      dt_admissao: colaborador.dt_admissao ?? '',
      dt_status: colaborador.dt_status ?? '',
      ds_motivo_status: colaborador.ds_motivo_status ?? '',
      ie_status: colaborador.ie_status ?? 'A',
    });
    setColaboradorEditingId(colaborador.id ?? null);
    setColaboradorAuditInfo({
      createdAt: colaborador.dt_criacao ?? '',
      updatedAt: colaborador.dt_alteracao ?? '',
      createdBy: colaborador.ds_usuario_criacao ?? '',
      updatedBy: colaborador.ds_usuario_alteracao ?? '',
    });
    auditColaboradorIdRef.current = colaborador.id ?? null;
    setMessage("");
    setColaboradorCampoErros([]);
    setView("form");
    setActiveSection("estruturaAcademica");
  }

  function openAtivoEditForm(ativo: Ativo) {
    setAtivoForm({
      cd_patrimonio: ativo.cd_patrimonio ?? '',
      ds_ativo: ativo.ds_ativo ?? '',
      nr_seq_categoria: ativo.nr_seq_categoria,
      nr_seq_localizacao: ativo.nr_seq_localizacao,
      nr_seq_marca: ativo.nr_seq_marca,
      ds_modelo: ativo.ds_modelo ?? '',
      nr_serie: ativo.nr_serie ?? '',
      ds_qr_code: ativo.ds_qr_code ?? '',
      ds_codigo_barras: ativo.ds_codigo_barras ?? '',
      ie_status: ativo.ie_status ?? 'O',
      dt_ultima_manutencao: ativo.dt_ultima_manutencao ?? '',
      nr_seq_ultima_manutencao: ativo.nr_seq_ultima_manutencao,
      dt_status: ativo.dt_status ?? '',
      ds_motivo_status: ativo.ds_motivo_status ?? '',
      dt_aquisicao: ativo.dt_aquisicao ?? '',
      dt_garantia: ativo.dt_garantia ?? '',
      ds_processador: ativo.ds_processador ?? '',
      qt_ram: ativo.qt_ram,
      ie_ram: ativo.ie_ram ?? '',
      qt_armazenamento: ativo.qt_armazenamento,
      ie_armazenamento: ativo.ie_armazenamento ?? '',
      ds_endereco_mac: ativo.ds_endereco_mac ?? '',
      ds_ip: ativo.ds_ip ?? '',
      nr_seq_sistema_operacional: ativo.nr_seq_sistema_operacional,
      responsaveis: ativo.responsaveis?.length ? ativo.responsaveis : [{ nr_seq_responsavel: undefined }],
      ds_observacao: ativo.ds_observacao ?? '',
    });
    setAtivoEditingId(ativo.id ?? null);
    setAtivoAuditInfo({
      createdAt: ativo.dt_criacao ?? '',
      updatedAt: ativo.dt_alteracao ?? '',
      createdBy: ativo.ds_usuario_criacao ?? '',
      updatedBy: ativo.ds_usuario_alteracao ?? '',
    });
    auditAtivoIdRef.current = ativo.id ?? null;
    setMessage("");
    setAtivoCampoErros([]);
    setView("form");
    setActiveSection("patrimonio");
    if (ativo.id) {
      carregarAutorAuditoriaAtivo(ativo.id);
    }
  }

  function openPerfilEditForm(perfil: Perfil) {
    setPerfilForm({
      ds_perfil: perfil.ds_perfil,
      ds_observacao: perfil.ds_observacao,
      ie_status: perfil.ie_status ?? 'A',
    });
    setPerfilEditingId(perfil.id ?? null);
    setPerfilAuditInfo({
      createdAt: perfil.dt_criacao ?? '',
      updatedAt: perfil.dt_alteracao ?? '',
      createdBy: perfil.ds_usuario_criacao ?? '',
      updatedBy: perfil.ds_usuario_alteracao ?? '',
    });
    auditPerfilIdRef.current = perfil.id ?? null;
    setMessage("");
    setPerfilCampoErros([]);
    setView("form");
    setActiveSection("administracaoSistema");
    if (perfil.id) {
      carregarAutorAuditoriaPerfil(perfil.id);
    }
  }

  function openAdminEditForm(usuario: Usuario) {
    setAdminForm({
      ds_usuario: usuario.ds_usuario,
      ds_usuario_alternativo: usuario.ds_usuario_alternativo,
      ds_email: usuario.ds_email ?? '',
      ds_senha: "",
      ds_observacao: usuario.ds_observacao,
      nr_seq_pessoa_fisica: usuario.nr_seq_pessoa_fisica,
      ie_status: usuario.ie_status ?? 'A',
      ie_base_conhecimento: usuario.ie_base_conhecimento ?? 'N',
      ie_central_suporte: usuario.ie_central_suporte ?? 'N',
    });
    setAdminOriginalSenhaHash(usuario.ds_senha ?? null);
    setAdminEditingId(usuario.id ?? null);
    setAdminAuditInfo({
      createdAt: usuario.dt_criacao ?? '',
      updatedAt: usuario.dt_alteracao ?? '',
      createdBy: usuario.ds_usuario_criacao ?? '',
      updatedBy: usuario.ds_usuario_alteracao ?? '',
    });
    auditUsuarioIdRef.current = usuario.id ?? null;
    setMessage("");
    setAdminCampoErros([]);
    setView("form");
    setActiveSection("administracaoSistema");
    if (usuario.id) {
      carregarAutorAuditoriaUsuario(usuario.id);
    }
  }

  function openCgEditForm(item: CgItem) {
    setCgForm({
      descricao: String((item as unknown as Record<string, unknown>)[cgDef.descKey] ?? ''),
      ie_status: item.ie_status ?? 'A',
      nr_cbo: String((item as unknown as Record<string, unknown>).nr_cbo ?? ''),
      sg_sigla: String((item as unknown as Record<string, unknown>).sg_orgao_emissor ?? (item as unknown as Record<string, unknown>).sg_logradouro ?? ''),
      ds_observacao: String((item as unknown as Record<string, unknown>).ds_observacao ?? ''),
    });
    setCgEditingId(item.id ?? null);
    setCgAuditInfo({
      createdAt: item.dt_criacao ?? '',
      updatedAt: item.dt_alteracao ?? '',
      createdBy: (item as unknown as Record<string, unknown>).ds_usuario_criacao ? String((item as unknown as Record<string, unknown>).ds_usuario_criacao) : '',
      updatedBy: (item as unknown as Record<string, unknown>).ds_usuario_alteracao ? String((item as unknown as Record<string, unknown>).ds_usuario_alteracao) : '',
    });
    auditCgIdRef.current = item.id ?? null;
    setMessage("");
    setCgCampoErros([]);
    setView("form");
    setActiveSection("cadastrosGerais");
    if (item.id) {
      carregarAutorAuditoriaCg(item.id);
    }
  }

  /* ── Voltar para lista ── */
  function goToList() {
    setForm(emptyForm);
    setEditingId(null);
    setMessage("");
    setView("list");
    setActiveSection("pessoaFisica");
  }

  function goToPjList() {
    setPjForm(emptyPjForm);
    setPjEditingId(null);
    setMessage("");
    setView("list");
    setActiveSection("pessoaFisica");
  }

  function goToAlunoList() {
    setAlunoForm(emptyAlunoForm);
    setAlunoEditingId(null);
    setMessage("");
    setView("list");
    setActiveSection("estruturaAcademica");
  }

  function goToColaboradorList() {
    setColaboradorForm(emptyColaboradorForm);
    setColaboradorEditingId(null);
    setMessage("");
    setView("list");
    setActiveSection("estruturaAcademica");
  }

  function goToAtivoList() {
    setAtivoForm(emptyAtivoForm);
    setAtivoEditingId(null);
    setMessage("");
    setView("list");
    setActiveSection("patrimonio");
  }

  function goToAdminList() {
    setAdminForm(emptyAdminForm);
    setAdminEditingId(null);
    setMessage("");
    setView("list");
    setActiveSection("administracaoSistema");
  }

  function goToPerfilList() {
    setPerfilForm({ ds_perfil: '', ds_observacao: '', ie_status: 'A' });
    setPerfilEditingId(null);
    setMessage("");
    setView("list");
    setActiveSection("administracaoSistema");
  }

  function goToCgList() {
    setCgForm(emptyCgForm);
    setCgEditingId(null);
    setMessage("");
    setView("list");
    setActiveSection("cadastrosGerais");
  }

  const filteredPessoasFisicas = useMemo(() => {
    return pessoasFisicas.filter((pessoa) => {
      if (appliedFilterForm.ds_nome && !pessoa.ds_nome.toLowerCase().includes(appliedFilterForm.ds_nome.toLowerCase())) {
        return false;
      }
      if (appliedFilterForm.nr_sequencia) {
        if (String(pessoa.nr_sequencia) !== appliedFilterForm.nr_sequencia.trim()) return false;
      }
      if (appliedFilterForm.nr_cpf) {
        const queryCpf = appliedFilterForm.nr_cpf.replace(/\D/g, '');
        const pessoaCpf = pessoa.nr_cpf.replace(/\D/g, '');
        if (!pessoaCpf.includes(queryCpf)) return false;
      }
      if (appliedFilterForm.dt_nascimento_inicio) {
        const startDate = parseDateInput(appliedFilterForm.dt_nascimento_inicio);
        const pessoaDate = parsePersonDateValue(pessoa.dt_nascimento);
        if (!startDate || pessoaDate === null || pessoaDate < startDate) return false;
      }
      if (appliedFilterForm.dt_nascimento_fim) {
        const endDate = parseDateInput(appliedFilterForm.dt_nascimento_fim);
        const pessoaDate = parsePersonDateValue(pessoa.dt_nascimento);
        if (!endDate || pessoaDate === null || pessoaDate > endDate) return false;
      }
      if (appliedFilterForm.ds_email && !pessoa.ds_email.toLowerCase().includes(appliedFilterForm.ds_email.toLowerCase())) {
        return false;
      }
      if (appliedFilterForm.nr_telefone) {
        const queryPhone = appliedFilterForm.nr_telefone.replace(/\D/g, '');
        const pessoaPhone = pessoa.nr_telefone.replace(/\D/g, '');
        if (!pessoaPhone.includes(queryPhone)) return false;
      }
      if (appliedFilterForm.nr_seq_sexo && String(pessoa.nr_seq_sexo ?? '') !== appliedFilterForm.nr_seq_sexo) {
        return false;
      }
      if (appliedFilterForm.nr_seq_estado_civil && String(pessoa.nr_seq_estado_civil ?? '') !== appliedFilterForm.nr_seq_estado_civil) {
        return false;
      }
      if (appliedFilterForm.nr_seq_cor_raca && String(pessoa.nr_seq_cor_raca ?? '') !== appliedFilterForm.nr_seq_cor_raca) {
        return false;
      }
      if (appliedFilterForm.nr_seq_profissao && String(pessoa.nr_seq_profissao ?? '') !== appliedFilterForm.nr_seq_profissao) {
        return false;
      }
      return true;
    });
  }, [pessoasFisicas, appliedFilterForm]);

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((usuario) => {
      if (appliedAdminFilterForm.nr_sequencia) {
        const q = appliedAdminFilterForm.nr_sequencia.replace(/\D/g, '');
        if (!q) return false;
        const seq = Number(q);
        if (usuario.nr_sequencia !== seq) return false;
      }
      if (appliedAdminFilterForm.ds_usuario && !usuario.ds_usuario.toLowerCase().includes(appliedAdminFilterForm.ds_usuario.toLowerCase())) return false;
      if (appliedAdminFilterForm.ds_usuario_alternativo && !usuario.ds_usuario_alternativo.toLowerCase().includes(appliedAdminFilterForm.ds_usuario_alternativo.toLowerCase())) return false;
      if (appliedAdminFilterForm.nr_seq_pessoa_fisica) {
        const q = appliedAdminFilterForm.nr_seq_pessoa_fisica.replace(/\D/g, '');
        if (!q) return false;
        const seq = Number(q);
        if ((usuario.nr_seq_pessoa_fisica ?? null) !== seq) return false;
      }
      if (appliedAdminFilterForm.ie_status && appliedAdminFilterForm.ie_status.toUpperCase() !== 'T') {
        if (String(usuario.ie_status ?? '').toUpperCase() !== appliedAdminFilterForm.ie_status.toUpperCase()) return false;
      }
      return true;
    });
  }, [usuarios, appliedAdminFilterForm]);

  const filteredSortedPessoasFisicas = useMemo(() => {
    const sorted = [...filteredPessoasFisicas];
    if (sortColumn === null || sortAsc === null) {
      return sorted.sort((a, b) => {
        const dateA = a.dt_criacao || "";
        const dateB = b.dt_criacao || "";
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return a.nr_sequencia - b.nr_sequencia;
      });
    }

    const key = COLUMNS[sortColumn].key;
    return sorted.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();
      if (strA < strB) return sortAsc ? -1 : 1;
      if (strA > strB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredPessoasFisicas, sortColumn, sortAsc]);

  const filteredAlunos = useMemo(() => {
    return alunos.filter((aluno) => {
      if (appliedAlunoFilterForm.nr_sequencia) {
        if (String(aluno.nr_sequencia) !== appliedAlunoFilterForm.nr_sequencia.trim()) return false;
      }
      if (appliedAlunoFilterForm.nr_matricula && !aluno.nr_matricula.toLowerCase().includes(appliedAlunoFilterForm.nr_matricula.toLowerCase())) {
        return false;
      }
      if (appliedAlunoFilterForm.nr_seq_pessoa_fisica) {
        if (String(aluno.nr_seq_pessoa_fisica ?? '') !== appliedAlunoFilterForm.nr_seq_pessoa_fisica.trim()) return false;
      }
      if (appliedAlunoFilterForm.dt_ingresso_inicio) {
        const startDate = parseDateInput(appliedAlunoFilterForm.dt_ingresso_inicio);
        const alunoDate = parsePersonDateValue(aluno.dt_ingresso);
        if (!startDate || alunoDate === null || alunoDate < startDate) return false;
      }
      if (appliedAlunoFilterForm.dt_ingresso_fim) {
        const endDate = parseDateInput(appliedAlunoFilterForm.dt_ingresso_fim);
        const alunoDate = parsePersonDateValue(aluno.dt_ingresso);
        if (!endDate || alunoDate === null || alunoDate > endDate) return false;
      }
      return true;
    });
  }, [alunos, appliedAlunoFilterForm]);

  const filteredSortedAlunos = useMemo(() => {
    const sorted = [...filteredAlunos];
    if (alunoSortColumn === null || alunoSortAsc === null) {
      return sorted.sort((a, b) => {
        const dateA = a.dt_criacao || "";
        const dateB = b.dt_criacao || "";
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return a.nr_sequencia - b.nr_sequencia;
      });
    }

    const key = ALUNO_COLUMNS[alunoSortColumn].key;
    return sorted.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return alunoSortAsc ? valA - valB : valB - valA;
      }
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();
      if (strA < strB) return alunoSortAsc ? -1 : 1;
      if (strA > strB) return alunoSortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredAlunos, alunoSortColumn, alunoSortAsc]);

  const filteredColaboradores = useMemo(() => {
    return colaboradores.filter((colaborador) => {
      if (appliedColaboradorFilterForm.nr_sequencia) {
        if (String(colaborador.nr_sequencia) !== appliedColaboradorFilterForm.nr_sequencia.trim()) return false;
      }
      if (appliedColaboradorFilterForm.nr_matricula && !(colaborador.nr_matricula ?? '').toLowerCase().includes(appliedColaboradorFilterForm.nr_matricula.toLowerCase())) {
        return false;
      }
      if (appliedColaboradorFilterForm.nr_seq_pessoa_fisica) {
        if (String(colaborador.nr_seq_pessoa_fisica ?? '') !== appliedColaboradorFilterForm.nr_seq_pessoa_fisica.trim()) return false;
      }
      if (appliedColaboradorFilterForm.nr_seq_pessoa_juridica) {
        if (String(colaborador.nr_seq_pessoa_juridica ?? '') !== appliedColaboradorFilterForm.nr_seq_pessoa_juridica.trim()) return false;
      }
      if (appliedColaboradorFilterForm.dt_admissao_inicio) {
        const startDate = parseDateInput(appliedColaboradorFilterForm.dt_admissao_inicio);
        const colaboradorDate = parsePersonDateValue(colaborador.dt_admissao);
        if (!startDate || colaboradorDate === null || colaboradorDate < startDate) return false;
      }
      if (appliedColaboradorFilterForm.dt_admissao_fim) {
        const endDate = parseDateInput(appliedColaboradorFilterForm.dt_admissao_fim);
        const colaboradorDate = parsePersonDateValue(colaborador.dt_admissao);
        if (!endDate || colaboradorDate === null || colaboradorDate > endDate) return false;
      }
      return true;
    });
  }, [colaboradores, appliedColaboradorFilterForm]);

  const filteredSortedColaboradores = useMemo(() => {
    const sorted = [...filteredColaboradores];
    if (colaboradorSortColumn === null || colaboradorSortAsc === null) {
      return sorted.sort((a, b) => {
        const dateA = a.dt_criacao || "";
        const dateB = b.dt_criacao || "";
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return a.nr_sequencia - b.nr_sequencia;
      });
    }

    const key = COLABORADOR_COLUMNS[colaboradorSortColumn].key;
    return sorted.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return colaboradorSortAsc ? valA - valB : valB - valA;
      }
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();
      if (strA < strB) return colaboradorSortAsc ? -1 : 1;
      if (strA > strB) return colaboradorSortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredColaboradores, colaboradorSortColumn, colaboradorSortAsc]);

  const filteredSortedAtivos = useMemo(() => {
    let sorted = [...ativos].filter((a) => {
      // Identificação
      if (appliedAtivoFilterForm.nr_sequencia) {
        const q = appliedAtivoFilterForm.nr_sequencia.replace(/\D/g, '');
        if (q && String(a.nr_sequencia) !== q) return false;
      }
      if (appliedAtivoFilterForm.cd_patrimonio && !(a.cd_patrimonio ?? '').toLowerCase().includes(appliedAtivoFilterForm.cd_patrimonio.toLowerCase())) return false;
      if (appliedAtivoFilterForm.ds_ativo && !(a.ds_ativo ?? '').toLowerCase().includes(appliedAtivoFilterForm.ds_ativo.toLowerCase())) return false;
      if (appliedAtivoFilterForm.ds_modelo && !(a.ds_modelo ?? '').toLowerCase().includes(appliedAtivoFilterForm.ds_modelo.toLowerCase())) return false;
      if (appliedAtivoFilterForm.nr_serie && !(a.nr_serie ?? '').toLowerCase().includes(appliedAtivoFilterForm.nr_serie.toLowerCase())) return false;
      if (appliedAtivoFilterForm.ds_qr_code && !(a.ds_qr_code ?? '').toLowerCase().includes(appliedAtivoFilterForm.ds_qr_code.toLowerCase())) return false;
      if (appliedAtivoFilterForm.ds_codigo_barras && !(a.ds_codigo_barras ?? '').toLowerCase().includes(appliedAtivoFilterForm.ds_codigo_barras.toLowerCase())) return false;
      if (appliedAtivoFilterForm.dt_aquisicao_inicio && a.dt_aquisicao && a.dt_aquisicao < appliedAtivoFilterForm.dt_aquisicao_inicio) return false;
      if (appliedAtivoFilterForm.dt_aquisicao_fim && a.dt_aquisicao && a.dt_aquisicao > appliedAtivoFilterForm.dt_aquisicao_fim) return false;
      if (appliedAtivoFilterForm.dt_garantia_inicio && a.dt_garantia && a.dt_garantia < appliedAtivoFilterForm.dt_garantia_inicio) return false;
      if (appliedAtivoFilterForm.dt_garantia_fim && a.dt_garantia && a.dt_garantia > appliedAtivoFilterForm.dt_garantia_fim) return false;
      if (appliedAtivoFilterForm.ie_status !== 'T' && a.ie_status !== appliedAtivoFilterForm.ie_status) return false;
      // Classificação
      if (appliedAtivoFilterForm.nr_seq_categoria) {
        const q = appliedAtivoFilterForm.nr_seq_categoria.replace(/\D/g, '');
        if (q && String(a.nr_seq_categoria ?? '') !== q) return false;
      }
      if (appliedAtivoFilterForm.nr_seq_localizacao) {
        const q = appliedAtivoFilterForm.nr_seq_localizacao.replace(/\D/g, '');
        if (q && String(a.nr_seq_localizacao ?? '') !== q) return false;
      }
      if (appliedAtivoFilterForm.nr_seq_marca) {
        const q = appliedAtivoFilterForm.nr_seq_marca.replace(/\D/g, '');
        if (q && String(a.nr_seq_marca ?? '') !== q) return false;
      }
      if (appliedAtivoFilterForm.nr_seq_responsavel) {
        const q = appliedAtivoFilterForm.nr_seq_responsavel.replace(/\D/g, '');
        if (q && !(a.responsaveis ?? []).some((r) => String(r.nr_seq_responsavel ?? '') === q)) return false;
      }
      // Dispositivo
      if (appliedAtivoFilterForm.ds_endereco_mac && !(a.ds_endereco_mac ?? '').toLowerCase().includes(appliedAtivoFilterForm.ds_endereco_mac.toLowerCase())) return false;
      if (appliedAtivoFilterForm.ds_ip && !(a.ds_ip ?? '').toLowerCase().includes(appliedAtivoFilterForm.ds_ip.toLowerCase())) return false;
      if (appliedAtivoFilterForm.nr_seq_sistema_operacional) {
        const q = appliedAtivoFilterForm.nr_seq_sistema_operacional.replace(/\D/g, '');
        if (q && String(a.nr_seq_sistema_operacional ?? '') !== q) return false;
      }
      return true;
    });
    if (ativoSortColumn === null || ativoSortAsc === null) {
      return sorted.sort((a, b) => {
        const dateA = a.dt_criacao || "";
        const dateB = b.dt_criacao || "";
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return a.nr_sequencia - b.nr_sequencia;
      });
    }

    const key = ATIVO_COLUMNS[ativoSortColumn].key;
    return sorted.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return ativoSortAsc ? valA - valB : valB - valA;
      }
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();
      if (strA < strB) return ativoSortAsc ? -1 : 1;
      if (strA > strB) return ativoSortAsc ? 1 : -1;
      return 0;
    });
  }, [ativos, ativoSortColumn, ativoSortAsc, appliedAtivoFilterForm]);

  const filteredPessoasJuridicas = useMemo(() => {
    return pessoasJuridicas.filter((pessoa) => {
      if (appliedPjFilterForm.nr_sequencia) {
        if (String(pessoa.nr_sequencia) !== appliedPjFilterForm.nr_sequencia.trim()) return false;
      }
      if (appliedPjFilterForm.ds_razao_social && !pessoa.ds_razao_social.toLowerCase().includes(appliedPjFilterForm.ds_razao_social.toLowerCase())) {
        return false;
      }
      if (appliedPjFilterForm.ds_nome_fantasia && !pessoa.ds_nome_fantasia.toLowerCase().includes(appliedPjFilterForm.ds_nome_fantasia.toLowerCase())) {
        return false;
      }
      if (appliedPjFilterForm.nr_cnpj) {
        const queryCnpj = appliedPjFilterForm.nr_cnpj.replace(/\D/g, '');
        const pessoaCnpj = pessoa.nr_cnpj.replace(/\D/g, '');
        if (!pessoaCnpj.includes(queryCnpj)) return false;
      }
      if (appliedPjFilterForm.nr_inscricao_estadual && !pessoa.nr_inscricao_estadual.toLowerCase().includes(appliedPjFilterForm.nr_inscricao_estadual.toLowerCase())) {
        return false;
      }
      if (appliedPjFilterForm.nr_inscricao_municipal && !pessoa.nr_inscricao_municipal.toLowerCase().includes(appliedPjFilterForm.nr_inscricao_municipal.toLowerCase())) {
        return false;
      }
      if (appliedPjFilterForm.dt_abertura_inicio) {
        const startDate = parseDateInput(appliedPjFilterForm.dt_abertura_inicio);
        const pessoaDate = parsePersonDateValue(pessoa.dt_abertura);
        if (!startDate || pessoaDate === null || pessoaDate < startDate) return false;
      }
      if (appliedPjFilterForm.dt_abertura_fim) {
        const endDate = parseDateInput(appliedPjFilterForm.dt_abertura_fim);
        const pessoaDate = parsePersonDateValue(pessoa.dt_abertura);
        if (!endDate || pessoaDate === null || pessoaDate > endDate) return false;
      }
      if (appliedPjFilterForm.ds_email && !pessoa.ds_email.toLowerCase().includes(appliedPjFilterForm.ds_email.toLowerCase())) {
        return false;
      }
      if (appliedPjFilterForm.nr_telefone) {
        const queryPhone = appliedPjFilterForm.nr_telefone.replace(/\D/g, '');
        const pessoaPhone = pessoa.nr_telefone.replace(/\D/g, '');
        if (!pessoaPhone.includes(queryPhone)) return false;
      }
      if (appliedPjFilterForm.sg_estado && String(pessoa.sg_estado ?? '') !== appliedPjFilterForm.sg_estado) {
        return false;
      }
      if (appliedPjFilterForm.cd_ibge_cidade && String(pessoa.cd_ibge_cidade ?? '') !== appliedPjFilterForm.cd_ibge_cidade.trim()) {
        return false;
      }
      return true;
    });
  }, [pessoasJuridicas, appliedPjFilterForm]);

  const filteredSortedPessoasJuridicas = useMemo(() => {
    const sorted = [...filteredPessoasJuridicas];
    if (pjSortColumn === null || pjSortAsc === null) {
      return sorted.sort((a, b) => {
        const dateA = a.dt_criacao || "";
        const dateB = b.dt_criacao || "";
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return a.nr_sequencia - b.nr_sequencia;
      });
    }

    const key = PJ_COLUMNS[pjSortColumn].key;
    return sorted.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return pjSortAsc ? valA - valB : valB - valA;
      }
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();
      if (strA < strB) return pjSortAsc ? -1 : 1;
      if (strA > strB) return pjSortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredPessoasJuridicas, pjSortColumn, pjSortAsc]);

  const filteredSortedUsuarios = useMemo(() => {
    const sorted = [...filteredUsuarios];
    if (adminSortColumn === null || adminSortAsc === null) {
      return sorted.sort((a, b) => {
        const dateA = a.dt_criacao || "";
        const dateB = b.dt_criacao || "";
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return a.nr_sequencia - b.nr_sequencia;
      });
    }

    const key = ADMIN_COLUMNS[adminSortColumn].key;
    return sorted.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return adminSortAsc ? valA - valB : valB - valA;
      }
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();
      if (strA < strB) return adminSortAsc ? -1 : 1;
      if (strA > strB) return adminSortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredUsuarios, adminSortColumn, adminSortAsc]);

  const filteredPerfis = useMemo(() => {
    return perfis.filter((perfil) => {
      if (appliedPerfilFilterForm.nr_sequencia) {
        const q = appliedPerfilFilterForm.nr_sequencia.replace(/\D/g, '');
        if (!q) return false;
        const seq = Number(q);
        if (perfil.nr_sequencia !== seq) return false;
      }
      if (appliedPerfilFilterForm.ds_perfil && !perfil.ds_perfil.toLowerCase().includes(appliedPerfilFilterForm.ds_perfil.toLowerCase())) return false;
      if (appliedPerfilFilterForm.ie_status && appliedPerfilFilterForm.ie_status.toUpperCase() !== 'T') {
        if (String(perfil.ie_status ?? '').toUpperCase() !== appliedPerfilFilterForm.ie_status.toUpperCase()) return false;
      }
      return true;
    });
  }, [perfis, appliedPerfilFilterForm]);

  const filteredSortedPerfis = useMemo(() => {
    const sorted = [...filteredPerfis];
    if (perfilSortColumn === null || perfilSortAsc === null) {
      return sorted.sort((a, b) => {
        const dateA = a.dt_criacao || "";
        const dateB = b.dt_criacao || "";
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return a.nr_sequencia - b.nr_sequencia;
      });
    }

    const key = PERFIL_COLUMNS[perfilSortColumn].key;
    return sorted.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return perfilSortAsc ? valA - valB : valB - valA;
      }
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();
      if (strA < strB) return perfilSortAsc ? -1 : 1;
      if (strA > strB) return perfilSortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredPerfis, perfilSortColumn, perfilSortAsc]);

  const filteredCgItems = useMemo(() => {
    return cgItems.filter((item) => {
      const rec = item as unknown as Record<string, unknown>;
      if (appliedCgFilterForm.nr_sequencia) {
        if (String(rec.nr_sequencia) !== appliedCgFilterForm.nr_sequencia.trim()) return false;
      }
      if (appliedCgFilterForm.descricao && !String(rec[cgDescKey] ?? '').toLowerCase().includes(appliedCgFilterForm.descricao.toLowerCase())) return false;
      if (appliedCgFilterForm.ie_status && appliedCgFilterForm.ie_status.toUpperCase() !== 'T') {
        if (String(rec.ie_status ?? '').toUpperCase() !== appliedCgFilterForm.ie_status.toUpperCase()) return false;
      }
      return true;
    });
  }, [cgItems, appliedCgFilterForm, cgDescKey]);

  const filteredSortedCgItems = useMemo(() => {
    const sorted = [...filteredCgItems];
    if (cgSortColumn === null || cgSortAsc === null) {
      return sorted.sort((a, b) => {
        const ra = a as unknown as Record<string, unknown>;
        const rb = b as unknown as Record<string, unknown>;
        const dateA = String(ra.dt_criacao || "");
        const dateB = String(rb.dt_criacao || "");
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return Number(ra.nr_sequencia) - Number(rb.nr_sequencia);
      });
    }

    const key = cgColumns[cgSortColumn].key as string;
    return sorted.sort((a, b) => {
      const ra = a as unknown as Record<string, unknown>;
      const rb = b as unknown as Record<string, unknown>;
      const valA = ra[key];
      const valB = rb[key];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return cgSortAsc ? valA - valB : valB - valA;
      }
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();
      if (strA < strB) return cgSortAsc ? -1 : 1;
      if (strA > strB) return cgSortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredCgItems, cgSortColumn, cgSortAsc, cgColumns]);

  const currentEditIndex = useMemo(() => {
    if (!editingId) return -1;
    return filteredSortedPessoasFisicas.findIndex((p) => p.id === editingId);
  }, [filteredSortedPessoasFisicas, editingId]);

  const currentAdminEditIndex = useMemo(() => {
    if (!adminEditingId) return -1;
    return filteredSortedUsuarios.findIndex((u) => u.id === adminEditingId);
  }, [filteredSortedUsuarios, adminEditingId]);

  const currentCgEditIndex = useMemo(() => {
    if (!cgEditingId) return -1;
    return filteredSortedCgItems.findIndex((s) => s.id === cgEditingId);
  }, [filteredSortedCgItems, cgEditingId]);

  const currentPjEditIndex = useMemo(() => {
    if (!pjEditingId) return -1;
    return filteredSortedPessoasJuridicas.findIndex((p) => p.id === pjEditingId);
  }, [filteredSortedPessoasJuridicas, pjEditingId]);

  const currentAlunoEditIndex = useMemo(() => {
    if (!alunoEditingId) return -1;
    return filteredSortedAlunos.findIndex((a) => a.id === alunoEditingId);
  }, [filteredSortedAlunos, alunoEditingId]);

  const hasPrevRecord = currentEditIndex > 0;
  const hasNextRecord = currentEditIndex >= 0 && currentEditIndex < filteredSortedPessoasFisicas.length - 1;
  const hasPrevAdminRecord = currentAdminEditIndex > 0;
  const hasNextAdminRecord = currentAdminEditIndex >= 0 && currentAdminEditIndex < filteredSortedUsuarios.length - 1;
  const currentPerfilEditIndex = useMemo(() => {
    if (!perfilEditingId) return -1;
    return filteredSortedPerfis.findIndex((p) => p.id === perfilEditingId);
  }, [filteredSortedPerfis, perfilEditingId]);
  const hasPrevPerfilRecord = currentPerfilEditIndex > 0;
  const hasNextPerfilRecord = currentPerfilEditIndex >= 0 && currentPerfilEditIndex < filteredSortedPerfis.length - 1;
  const hasPrevCgRecord = currentCgEditIndex > 0;
  const hasNextCgRecord = currentCgEditIndex >= 0 && currentCgEditIndex < filteredSortedCgItems.length - 1;
  const hasPrevPjRecord = currentPjEditIndex > 0;
  const hasNextPjRecord = currentPjEditIndex >= 0 && currentPjEditIndex < filteredSortedPessoasJuridicas.length - 1;
  const hasPrevAlunoRecord = currentAlunoEditIndex > 0;
  const hasNextAlunoRecord = currentAlunoEditIndex >= 0 && currentAlunoEditIndex < filteredSortedAlunos.length - 1;
  const currentColaboradorEditIndex = useMemo(() => {
    if (!colaboradorEditingId) return -1;
    return filteredSortedColaboradores.findIndex((c) => c.id === colaboradorEditingId);
  }, [filteredSortedColaboradores, colaboradorEditingId]);
  const hasPrevColaboradorRecord = currentColaboradorEditIndex > 0;
  const hasNextColaboradorRecord = currentColaboradorEditIndex >= 0 && currentColaboradorEditIndex < filteredSortedColaboradores.length - 1;

  const currentAtivoEditIndex = useMemo(() => {
    if (!ativoEditingId) return -1;
    return filteredSortedAtivos.findIndex((a) => a.id === ativoEditingId);
  }, [filteredSortedAtivos, ativoEditingId]);
  const hasPrevAtivoRecord = currentAtivoEditIndex > 0;
  const hasNextAtivoRecord = currentAtivoEditIndex >= 0 && currentAtivoEditIndex < filteredSortedAtivos.length - 1;

  function goToPrevRecord() {
    if (!hasPrevRecord) return;
    const previous = filteredSortedPessoasFisicas[currentEditIndex - 1];
    if (previous) openEditForm(previous);
  }

  function goToNextRecord() {
    if (!hasNextRecord) return;
    const next = filteredSortedPessoasFisicas[currentEditIndex + 1];
    if (next) openEditForm(next);
  }

  function goToPrevAdminRecord() {
    if (!hasPrevAdminRecord) return;
    const previous = filteredSortedUsuarios[currentAdminEditIndex - 1];
    if (previous) openAdminEditForm(previous);
  }

  function goToNextAdminRecord() {
    if (!hasNextAdminRecord) return;
    const next = filteredSortedUsuarios[currentAdminEditIndex + 1];
    if (next) openAdminEditForm(next);
  }

  function goToPrevPerfilRecord() {
    if (!hasPrevPerfilRecord) return;
    const previous = filteredSortedPerfis[currentPerfilEditIndex - 1];
    if (previous) openPerfilEditForm(previous);
  }

  function goToNextPerfilRecord() {
    if (!hasNextPerfilRecord) return;
    const next = filteredSortedPerfis[currentPerfilEditIndex + 1];
    if (next) openPerfilEditForm(next);
  }

  function goToPrevCgRecord() {
    if (!hasPrevCgRecord) return;
    const previous = filteredSortedCgItems[currentCgEditIndex - 1];
    if (previous) openCgEditForm(previous);
  }

  function goToNextCgRecord() {
    if (!hasNextCgRecord) return;
    const next = filteredSortedCgItems[currentCgEditIndex + 1];
    if (next) openCgEditForm(next);
  }

  function goToPrevPjRecord() {
    if (!hasPrevPjRecord) return;
    const previous = filteredSortedPessoasJuridicas[currentPjEditIndex - 1];
    if (previous) openPjEditForm(previous);
  }

  function goToNextPjRecord() {
    if (!hasNextPjRecord) return;
    const next = filteredSortedPessoasJuridicas[currentPjEditIndex + 1];
    if (next) openPjEditForm(next);
  }

  function goToPrevAlunoRecord() {
    if (!hasPrevAlunoRecord) return;
    const previous = filteredSortedAlunos[currentAlunoEditIndex - 1];
    if (previous) openAlunoEditForm(previous);
  }

  function goToNextAlunoRecord() {
    if (!hasNextAlunoRecord) return;
    const next = filteredSortedAlunos[currentAlunoEditIndex + 1];
    if (next) openAlunoEditForm(next);
  }

  function goToPrevColaboradorRecord() {
    if (!hasPrevColaboradorRecord) return;
    const previous = filteredSortedColaboradores[currentColaboradorEditIndex - 1];
    if (previous) openColaboradorEditForm(previous);
  }

  function goToNextColaboradorRecord() {
    if (!hasNextColaboradorRecord) return;
    const next = filteredSortedColaboradores[currentColaboradorEditIndex + 1];
    if (next) openColaboradorEditForm(next);
  }

  function goToPrevAtivoRecord() {
    if (!hasPrevAtivoRecord) return;
    const previous = filteredSortedAtivos[currentAtivoEditIndex - 1];
    if (previous) openAtivoEditForm(previous);
  }

  function goToNextAtivoRecord() {
    if (!hasNextAtivoRecord) return;
    const next = filteredSortedAtivos[currentAtivoEditIndex + 1];
    if (next) openAtivoEditForm(next);
  }

  /* ── Salvar (criar ou atualizar) ── */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    // Campos obrigatórios (perfil ativo) precisam estar preenchidos.
    const pfRegras = campoRegrasDaColecao(campoRegrasAtivas, 'pessoa_fisica');
    const pfFaltantes = camposObrigatoriosVazios(form as unknown as Record<string, any>, pfRegras);
    if (pfFaltantes.length > 0) {
      setPfCampoErros(pfFaltantes);
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    setPfCampoErros([]);
    setSubmitting(true);

    try {
      if (editingId) {
        const currentPessoa = pessoasFisicas.find((p) => p.id === editingId);
        const formKeys: Array<keyof FormData> = [
          'ds_nome',
          'nr_cpf',
          'dt_nascimento',
          'ds_email',
          'nr_telefone',
          'nr_seq_sexo',
          'nr_seq_estado_civil',
          'nr_seq_cor_raca',
          'nr_seq_profissao',
          'nr_rg',
          'dt_emissao',
          'nr_seq_orgao_emissor',
          'sg_estado',
          'cd_ibge_naturalidade',
          'nr_cep',
          'ds_endereco',
          'nr_endereco',
          'ds_bairro',
          'ds_complemento',
          'nr_seq_logradouro',
        ];
        const hasChanges = currentPessoa
          ? formKeys.some((key) => String(currentPessoa[key] ?? '') !== String(form[key] ?? ''))
          : true;

        if (!hasChanges) {
          setMessage("Nenhuma alteração detectada.");
          setForm(emptyForm);
          setEditingId(null);
          await loadPessoasFisicas();
          setView("list");
          return;
        }

        await atualizarPessoaFisica(editingId, form, auditAutor);
        setMessage("Atualizado com sucesso!");
      } else {
        await criarPessoaFisica(form, auditAutor);
        setMessage("Cadastrado com sucesso!");
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadPessoasFisicas();
      setView("list");
    } catch {
      setMessage("Erro ao salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Salvar (criar ou atualizar) Aluno ── */
  async function handleAlunoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    // Remove linhas de responsáveis totalmente vazias antes de validar/salvar.
    const responsaveisFiltrados = (alunoForm.responsaveis ?? []).filter(
      (r) => r.nr_seq_responsavel || r.nr_seq_grau_parentesco
    );

    // Campos obrigatórios (perfil ativo) precisam estar preenchidos.
    // nr_seq_responsavel/nr_seq_grau_parentesco ficam dentro do array
    // responsaveis — se o campo é obrigatório, TODAS as linhas adicionadas
    // (não só a primeira) precisam ter o valor preenchido.
    const alunoRegras = campoRegrasDaColecao(campoRegrasAtivas, 'aluno');
    const alunoFaltantes: string[] = [];
    const linhasResponsaveis = alunoForm.responsaveis ?? [];
    if (
      alunoRegras['nr_seq_responsavel'] === 'O' &&
      linhasResponsaveis.some((r) => !r.nr_seq_responsavel)
    ) {
      alunoFaltantes.push('nr_seq_responsavel');
    }
    if (
      alunoRegras['nr_seq_grau_parentesco'] === 'O' &&
      linhasResponsaveis.some((r) => !r.nr_seq_grau_parentesco)
    ) {
      alunoFaltantes.push('nr_seq_grau_parentesco');
    }
    // Demais obrigatórios (campos planos do formulário).
    const regrasPlanas: Record<string, CampoStatus> = {};
    for (const [campo, status] of Object.entries(alunoRegras)) {
      if (campo === 'nr_seq_responsavel' || campo === 'nr_seq_grau_parentesco') continue;
      regrasPlanas[campo] = status;
    }
    const faltantesPlanos = camposObrigatoriosVazios(alunoForm as unknown as Record<string, unknown>, regrasPlanas);
    alunoFaltantes.push(...faltantesPlanos);
    if (alunoFaltantes.length > 0) {
      setAlunoCampoErros(alunoFaltantes);
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    setAlunoCampoErros([]);
    setAlunoSubmitting(true);

    const payloadAluno = {
      ...alunoForm,
      responsaveis: responsaveisFiltrados,
      ...filtroValoresMedicos(alunoForm),
    };

    try {
      if (alunoEditingId) {
        const currentAluno = alunos.find((a) => a.id === alunoEditingId);
        const formKeys: Array<keyof AlunoFormData> = [
          'nr_seq_pessoa_fisica',
          'nr_matricula',
          'dt_ingresso',
          'dt_status',
          'ds_status',
          'ie_status',
          'ds_observacao_medica',
          'ds_tipo_sanguineo',
        ];
        const responsaveisAtuais = migrarResponsaveis(currentAluno ?? ({} as Aluno)).filter(
          (r) => r.nr_seq_responsavel || r.nr_seq_grau_parentesco
        );
        const responsaveisForm = (alunoForm.responsaveis ?? []).filter((r) => r.nr_seq_responsavel || r.nr_seq_grau_parentesco);
        const responsaveisMudaram =
          JSON.stringify(responsaveisAtuais) !== JSON.stringify(responsaveisForm);
        const medicasMudaram =
          JSON.stringify(filtroValoresMedicos(currentAluno ?? ({} as Aluno))) !==
          JSON.stringify(filtroValoresMedicos(alunoForm));
        const hasChanges = currentAluno
          ? formKeys.some((key) => String(currentAluno[key] ?? '') !== String(alunoForm[key] ?? '')) || responsaveisMudaram || medicasMudaram
          : true;

        if (!hasChanges) {
          setMessage("Nenhuma alteração detectada.");
          setAlunoForm(emptyAlunoForm);
          setAlunoEditingId(null);
          await loadAlunos();
          setView("list");
          return;
        }

        await atualizarAluno(alunoEditingId, payloadAluno, auditAutor);
        setMessage("Atualizado com sucesso!");
      } else {
        await criarAluno(payloadAluno, auditAutor);
        setMessage("Cadastrado com sucesso!");
      }

      setAlunoForm(emptyAlunoForm);
      setAlunoEditingId(null);
      await loadAlunos();
      setView("list");
    } catch {
      setMessage("Erro ao salvar.");
    } finally {
      setAlunoSubmitting(false);
    }
  }

  /* ── Salvar (criar ou atualizar) Colaborador ── */
  async function handleColaboradorSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    // Campos obrigatórios (perfil ativo) precisam estar preenchidos.
    const colaboradorRegras = campoRegrasDaColecao(campoRegrasAtivas, 'colaborador');
    const colaboradorFaltantes = camposObrigatoriosVazios(colaboradorForm as unknown as Record<string, any>, colaboradorRegras);
    if (colaboradorFaltantes.length > 0) {
      setColaboradorCampoErros(colaboradorFaltantes);
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    setColaboradorCampoErros([]);
    setColaboradorSubmitting(true);

    try {
      if (colaboradorEditingId) {
        const currentColaborador = colaboradores.find((c) => c.id === colaboradorEditingId);
        const formKeys: Array<keyof ColaboradorFormData> = [
          'nr_seq_pessoa_fisica',
          'nr_seq_pessoa_juridica',
          'nr_seq_vinculo_contratual',
          'ie_fornecedor',
          'ie_prestador_servico',
          'nr_matricula',
          'dt_admissao',
        ];
        const hasChanges = currentColaborador
          ? formKeys.some((key) => String(currentColaborador[key] ?? '') !== String(colaboradorForm[key] ?? ''))
          : true;

        if (!hasChanges) {
          setMessage("Nenhuma alteração detectada.");
          setColaboradorForm(emptyColaboradorForm);
          setColaboradorEditingId(null);
          await loadColaboradores();
          setView("list");
          return;
        }

        await atualizarColaborador(colaboradorEditingId, colaboradorForm, auditAutor);
        setMessage("Atualizado com sucesso!");
      } else {
        await criarColaborador(colaboradorForm, auditAutor);
        setMessage("Cadastrado com sucesso!");
      }

      setColaboradorForm(emptyColaboradorForm);
      setColaboradorEditingId(null);
      await loadColaboradores();
      setView("list");
    } catch {
      setMessage("Erro ao salvar.");
    } finally {
      setColaboradorSubmitting(false);
    }
  }

  /* ── Salvar (criar ou atualizar) Ativo ── */
  async function handleAtivoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    // Campos obrigatórios (perfil ativo) precisam estar preenchidos.
    const ativoRegras = campoRegrasDaColecao(campoRegrasAtivas, 'pat_ativo');
    const ativoFaltantes = camposObrigatoriosVazios(ativoForm as unknown as Record<string, any>, ativoRegras);
    if (ativoFaltantes.length > 0) {
      setAtivoCampoErros(ativoFaltantes);
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    setAtivoCampoErros([]);
    setAtivoSubmitting(true);

    try {
      if (ativoEditingId) {
        const currentAtivo = ativos.find((a) => a.id === ativoEditingId);
        const formKeys: Array<keyof AtivoFormData> = [
          'cd_patrimonio', 'ds_ativo', 'nr_seq_categoria', 'nr_seq_localizacao',
          'nr_seq_marca', 'ds_modelo', 'nr_serie', 'ds_qr_code', 'ds_codigo_barras',
          'dt_aquisicao', 'dt_garantia', 'ie_status', 'ds_processador',
          'qt_ram', 'ie_ram', 'qt_armazenamento', 'ie_armazenamento',
          'ds_endereco_mac', 'ds_ip', 'nr_seq_sistema_operacional', 'ds_observacao',
        ];
        const hasChanges = currentAtivo
          ? formKeys.some((key) => String(currentAtivo[key] ?? '') !== String(ativoForm[key] ?? ''))
            || JSON.stringify(ativoForm.responsaveis ?? []) !== JSON.stringify(currentAtivo.responsaveis ?? [])
          : true;

        if (!hasChanges) {
          setMessage("Nenhuma alteração detectada.");
          setAtivoForm(emptyAtivoForm);
          setAtivoEditingId(null);
          await loadAtivos();
          setView("list");
          return;
        }

        await atualizarAtivo(ativoEditingId, ativoForm, auditAutor);
        setMessage("Atualizado com sucesso!");
      } else {
        await criarAtivo(ativoForm, auditAutor);
        setMessage("Cadastrado com sucesso!");
      }

      setAtivoForm(emptyAtivoForm);
      setAtivoEditingId(null);
      await loadAtivos();
      setView("list");
    } catch (e) {
      console.error('Erro ao salvar ativo:', e);
      setMessage("Erro ao salvar.");
    } finally {
      setAtivoSubmitting(false);
    }
  }

  /* ── Salvar (criar ou atualizar) Pessoa Jurídica ── */
  async function handlePjSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    // Campos obrigatórios (perfil ativo) precisam estar preenchidos.
    const pjRegras = campoRegrasDaColecao(campoRegrasAtivas, 'pessoa_juridica');
    const pjFaltantes = camposObrigatoriosVazios(pjForm as unknown as Record<string, any>, pjRegras);
    if (pjFaltantes.length > 0) {
      setPjCampoErros(pjFaltantes);
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    setPjCampoErros([]);
    setPjSubmitting(true);

    try {
      if (pjEditingId) {
        const currentPessoa = pessoasJuridicas.find((p) => p.id === pjEditingId);
        const formKeys: Array<keyof PjFormData> = [
          'ds_razao_social',
          'ds_nome_fantasia',
          'nr_cnpj',
          'nr_inscricao_estadual',
          'nr_inscricao_municipal',
          'dt_abertura',
          'nr_telefone',
          'ds_email',
          'nr_cep',
          'ds_endereco',
          'nr_endereco',
          'ds_bairro',
          'ds_complemento',
          'nr_seq_logradouro',
          'sg_estado',
          'cd_ibge_cidade',
        ];
        const hasChanges = currentPessoa
          ? formKeys.some((key) => String(currentPessoa[key] ?? '') !== String(pjForm[key] ?? ''))
          : true;

        if (!hasChanges) {
          setMessage("Nenhuma alteração detectada.");
          setPjForm(emptyPjForm);
          setPjEditingId(null);
          await loadPessoasJuridicas();
          setView("list");
          return;
        }

        await atualizarPessoaJuridica(pjEditingId, pjForm, auditAutor);
        setMessage("Atualizado com sucesso!");
      } else {
        await criarPessoaJuridica(pjForm, auditAutor);
        setMessage("Cadastrado com sucesso!");
      }

      setPjForm(emptyPjForm);
      setPjEditingId(null);
      await loadPessoasJuridicas();
      setView("list");
    } catch {
      setMessage("Erro ao salvar.");
    } finally {
      setPjSubmitting(false);
    }
  }

  function createFallbackHash(input: string): string {
    const bytes = new TextEncoder().encode(input);
    let hash = 0;

    for (let index = 0; index < bytes.length; index += 1) {
      hash = (hash << 5) - hash + bytes[index];
      hash |= 0;
    }

    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  function rotr32(value: number, shift: number): number {
    return (value >>> shift) | (value << (32 - shift));
  }

  function sha256Hex(input: string): string {
    // SHA-256 puro em JavaScript: sempre o mesmo resultado, independente de
    // crypto.subtle existir (localhost = contexto seguro) ou não (HTTP rede local).
    const bytes: number[] = Array.from(new TextEncoder().encode(input));

    const bitLength = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    const highLength = Math.floor(bitLength / 0x100000000);
    const lowLength = bitLength >>> 0;
    bytes.push(
      (highLength >>> 24) & 0xff, (highLength >>> 16) & 0xff,
      (highLength >>> 8) & 0xff, highLength & 0xff,
      (lowLength >>> 24) & 0xff, (lowLength >>> 16) & 0xff,
      (lowLength >>> 8) & 0xff, lowLength & 0xff,
    );

    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];

    let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
    let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

    const w: number[] = new Array(64);

    for (let i = 0; i < bytes.length; i += 64) {
      for (let j = 0; j < 16; j++) {
        w[j] =
          (bytes[i + j * 4] << 24) |
          (bytes[i + j * 4 + 1] << 16) |
          (bytes[i + j * 4 + 2] << 8) |
          bytes[i + j * 4 + 3];
      }
      for (let j = 16; j < 64; j++) {
        const s0 = rotr32(w[j - 15], 7) ^ rotr32(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const s1 = rotr32(w[j - 2], 17) ^ rotr32(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

      let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for (let j = 0; j < 64; j++) {
        const S1 = rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + S1 + ch + K[j] + w[j]) | 0;
        const S0 = rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + temp1) | 0;
        d = c; c = b; b = a; a = (temp1 + temp2) | 0;
      }

      h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
      h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
    }

    const toHex = (value: number) => (value >>> 0).toString(16).padStart(8, '0');
    return toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4) + toHex(h5) + toHex(h6) + toHex(h7);
  }

  async function hashPassword(password: string): Promise<string> {
    // Sempre SHA-256: a implementação pura em JS garante o mesmo hash em
    // qualquer contexto (localhost ou HTTP de rede local).
    return sha256Hex(password);
  }

  async function handleAdminSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    // Defesa em profundidade: não-admins não podem alterar o usuário administrador.
    if (!isAdministrador && adminEditingId && isAdministradorUsuario(usuarios.find((a) => a.id === adminEditingId))) {
      setMessage("O usuário administrador não pode ser alterado por outros usuários.");
      return;
    }
    // Campos obrigatórios (perfil ativo) precisam estar preenchidos.
    const adminRegras = campoRegrasDaColecao(campoRegrasAtivas, 'usuario');
    const adminFaltantes = camposObrigatoriosVazios(adminForm as unknown as Record<string, any>, adminRegras);
    if (adminFaltantes.length > 0) {
      setAdminCampoErros(adminFaltantes);
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    setAdminCampoErros([]);
    setAdminSubmitting(true);

    try {
      const senhaHash = adminForm.ds_senha
        ? await hashPassword(adminForm.ds_senha)
        : adminOriginalSenhaHash ?? '';

      const usuarioPayload: Record<string, any> = {
        ds_usuario: adminForm.ds_usuario,
        ds_usuario_alternativo: adminForm.ds_usuario_alternativo,
        ds_email: adminForm.ds_email ?? '',
        ds_senha: senhaHash,
        ds_observacao: adminForm.ds_observacao,
        ie_status: adminForm.ie_status,
        ie_base_conhecimento: adminForm.ie_base_conhecimento ?? 'N',
        ie_central_suporte: adminForm.ie_central_suporte ?? 'N',
      };
      if (adminForm.nr_seq_pessoa_fisica !== undefined && adminForm.nr_seq_pessoa_fisica !== null) {
        usuarioPayload.nr_seq_pessoa_fisica = adminForm.nr_seq_pessoa_fisica;
      }

      if (adminEditingId) {
        const currentUsuario = usuarios.find((u) => u.id === adminEditingId);
        const hasChanges = currentUsuario
          ?          [
              'nr_seq_pessoa_fisica',
              'ds_usuario',
              'ds_usuario_alternativo',
              'ds_email',
              'ds_observacao',
              'ie_status',
              'ie_base_conhecimento',
              'ie_central_suporte',
            ].some((field) => String((currentUsuario as any)[field] ?? '') !== String((adminForm as any)[field] ?? ''))
            || Boolean(adminForm.ds_senha)
          : true;

        if (!hasChanges) {
          setMessage("Nenhuma alteração detectada.");
          setAdminForm(emptyAdminForm);
          setAdminEditingId(null);
          setAdminOriginalSenhaHash(null);
          await loadUsuarios();
          setView("list");
          return;
        }

        const updatePayload = {
          ...usuarioPayload,
          nr_seq_pessoa_fisica: adminForm.nr_seq_pessoa_fisica ?? null,
          ie_status: adminForm.ie_status ?? null,
        };
        await atualizarUsuario(adminEditingId, updatePayload as any, auditAutor);
        // Se o usuário editado é o logado, atualizar o currentUser para
        // refletir as alterações imediatamente (ex.: checkboxes do menu lateral).
        if (adminEditingId === currentUser?.id) {
          setCurrentUser((u) => u ? {
            ...u,
            ds_usuario: adminForm.ds_usuario,
            ds_usuario_alternativo: adminForm.ds_usuario_alternativo,
            ds_email: adminForm.ds_email,
            ds_observacao: adminForm.ds_observacao,
            ie_status: adminForm.ie_status,
            ie_base_conhecimento: adminForm.ie_base_conhecimento,
            ie_central_suporte: adminForm.ie_central_suporte,
            nr_seq_pessoa_fisica: adminForm.nr_seq_pessoa_fisica,
          } : u);
        }
        setMessage("Atualizado com sucesso!");
      } else {
        const novoUsuario = (adminForm.ds_usuario ?? "").trim().toLowerCase();
        const novoAlternativo = (adminForm.ds_usuario_alternativo ?? "").trim().toLowerCase();
        const jaExiste = usuarios.some((u) => {
          const uPrincipal = (u.ds_usuario ?? "").trim().toLowerCase();
          const uAlternativo = (u.ds_usuario_alternativo ?? "").trim().toLowerCase();
          return (
            (novoUsuario !== "" && (novoUsuario === uPrincipal || novoUsuario === uAlternativo)) ||
            (novoAlternativo !== "" && (novoAlternativo === uPrincipal || novoAlternativo === uAlternativo))
          );
        });
        if (jaExiste) {
          setMessage("Usuário já existente.");
          return;
        }
        const id = await criarUsuario(usuarioPayload as any, auditAutor);
        setMessage("Cadastrado com sucesso!");
      }

      await loadUsuarios();
      setAdminForm(emptyAdminForm);
      setAdminEditingId(null);
      setAdminOriginalSenhaHash(null);
      setView("list");
    } catch {
      setMessage("Erro ao salvar.");
    } finally {
      setAdminSubmitting(false);
    }
  }

  async function handlePerfilSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    // Defesa em profundidade: não-admins não podem alterar o perfil Administrador.
    if (!isAdministrador && perfilEditingId && isAdministradorPerfil(perfis.find((a) => a.id === perfilEditingId))) {
      setMessage("O perfil Administrador não pode ser alterado por outros usuários.");
      return;
    }
    // Campos obrigatórios (perfil ativo) precisam estar preenchidos.
    const perfilRegras = campoRegrasDaColecao(campoRegrasAtivas, 'perfil');
    const perfilFaltantes = camposObrigatoriosVazios(perfilForm as unknown as Record<string, any>, perfilRegras);
    if (perfilFaltantes.length > 0) {
      setPerfilCampoErros(perfilFaltantes);
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    setPerfilCampoErros([]);
    setPerfilSubmitting(true);

    try {
      const payload = {
        ds_perfil: perfilForm.ds_perfil,
        ds_observacao: perfilForm.ds_observacao,
        ie_status: perfilForm.ie_status,
      };

      if (perfilEditingId) {
        const currentPerfil = perfis.find((p) => p.id === perfilEditingId);
        const hasChanges = currentPerfil
          ? ['ds_perfil', 'ds_observacao', 'ie_status'].some((field) => String((currentPerfil as any)[field] ?? '') !== String((perfilForm as any)[field] ?? ''))
          : true;

        if (!hasChanges) {
          setMessage("Nenhuma alteração detectada.");
          setPerfilForm({ ds_perfil: '', ds_observacao: '', ie_status: 'A' });
          setPerfilEditingId(null);
          await loadPerfis();
          setView("list");
          return;
        }

        await atualizarPerfil(perfilEditingId, payload as any, auditAutor);
        setMessage("Atualizado com sucesso!");
      } else {
        const novoPerfil = (perfilForm.ds_perfil ?? "").trim().toLowerCase();
        const jaExiste = perfis.some((p) => (p.ds_perfil ?? "").trim().toLowerCase() === novoPerfil);
        if (jaExiste) {
          setMessage("Perfil já existente.");
          return;
        }
        await criarPerfil(payload as any, auditAutor);
        setMessage("Cadastrado com sucesso!");
      }

      await loadPerfis();
      setPerfilForm({ ds_perfil: '', ds_observacao: '', ie_status: 'A' });
      setPerfilEditingId(null);
      setView("list");
    } catch {
      setMessage("Erro ao salvar.");
    } finally {
      setPerfilSubmitting(false);
    }
  }

  async function handleCgSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    // Campos obrigatórios (perfil ativo) precisam estar preenchidos.
    const cgRegras = campoRegrasDaColecao(campoRegrasAtivas, cgCollection);
    const cgSiglaChave = cgKind === 'orgaoEmissor' ? 'sg_orgao_emissor' : cgKind === 'logradouro' ? 'sg_logradouro' : null;
    const cgFaltantes = camposObrigatoriosVazios(
      {
        [cgDescKey]: cgForm.descricao,
        ie_status: cgForm.ie_status,
        nr_cbo: cgForm.nr_cbo ?? '',
        ...(cgSiglaChave ? { [cgSiglaChave]: cgForm.sg_sigla ?? '' } : {}),
      },
      cgRegras
    );
    if (cgFaltantes.length > 0) {
      setCgCampoErros(cgFaltantes);
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    setCgCampoErros([]);
    setCgSubmitting(true);

    try {
      const payload = {
        [cgDescKey]: cgForm.descricao,
        ie_status: cgForm.ie_status,
        ...(cgKind === 'profissao' ? { nr_cbo: cgForm.nr_cbo ?? '' } : {}),
        ...(cgKind === 'orgaoEmissor' ? { sg_orgao_emissor: cgForm.sg_sigla ?? '' } : {}),
        ...(cgKind === 'logradouro' ? { sg_logradouro: cgForm.sg_sigla ?? '' } : {}),
        ...(cgKind === 'categoriaAtivo' ? { ds_observacao: cgForm.ds_observacao ?? '' } : {}),
      } as Record<string, unknown>;

      if (cgEditingId) {
        const currentItem = cgItems.find((s) => s.id === cgEditingId);
        const changeKeys = cgKind === 'profissao' ? [cgDescKey, 'ie_status', 'nr_cbo'] : cgKind === 'orgaoEmissor' ? [cgDescKey, 'ie_status', 'sg_orgao_emissor'] : cgKind === 'logradouro' ? [cgDescKey, 'ie_status', 'sg_logradouro'] : cgKind === 'categoriaAtivo' ? [cgDescKey, 'ie_status', 'ds_observacao'] : [cgDescKey, 'ie_status'];
        const hasChanges = currentItem
          ? changeKeys.some((key) => String((currentItem as any)[key] ?? '') !== String(payload[key] ?? ''))
          : true;

        if (!hasChanges) {
          setMessage("Nenhuma alteração detectada.");
          setCgForm(emptyCgForm);
          setCgEditingId(null);
          await loadCgItems();
          setView("list");
          return;
        }

        if (cgKind === 'sexo') {
          await atualizarSexo(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'estadoCivil') {
          await atualizarEstadoCivil(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'corRaca') {
          await atualizarCorRaca(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'profissao') {
          await atualizarProfissao(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'logradouro') {
          await atualizarLogradouro(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'grauParentesco') {
          await atualizarGrauParentesco(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'cargo') {
          await atualizarCargo(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'vinculoContratual') {
          await atualizarVinculoContratual(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'localizacao') {
          await atualizarLocalizacao(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'marca') {
          await atualizarMarca(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'categoriaAtivo') {
          await atualizarCategoriaAtivo(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'sistemaOperacional') {
          await atualizarSistemaOperacional(cgEditingId, payload as any, auditAutor);
        } else {
          await atualizarOrgaoEmissor(cgEditingId, payload as any, auditAutor);
        }
        setMessage("Atualizado com sucesso!");
      } else {
        if (cgKind === 'sexo') {
          await criarSexo(payload as any, auditAutor);
        } else if (cgKind === 'estadoCivil') {
          await criarEstadoCivil(payload as any, auditAutor);
        } else if (cgKind === 'corRaca') {
          await criarCorRaca(payload as any, auditAutor);
        } else if (cgKind === 'profissao') {
          await criarProfissao(payload as any, auditAutor);
        } else if (cgKind === 'logradouro') {
          await criarLogradouro(payload as any, auditAutor);
        } else if (cgKind === 'grauParentesco') {
          await criarGrauParentesco(payload as any, auditAutor);
        } else if (cgKind === 'cargo') {
          await criarCargo(payload as any, auditAutor);
        } else if (cgKind === 'vinculoContratual') {
          await criarVinculoContratual(payload as any, auditAutor);
        } else if (cgKind === 'localizacao') {
          await criarLocalizacao(payload as any, auditAutor);
        } else if (cgKind === 'marca') {
          await criarMarca(payload as any, auditAutor);
        } else if (cgKind === 'categoriaAtivo') {
          await criarCategoriaAtivo(payload as any, auditAutor);
        } else if (cgKind === 'sistemaOperacional') {
          await criarSistemaOperacional(payload as any, auditAutor);
        } else {
          await criarOrgaoEmissor(payload as any, auditAutor);
        }
        setMessage("Cadastrado com sucesso!");
      }

      setCgForm(emptyCgForm);
      setCgEditingId(null);
      await loadCgItems();
      setView("list");
    } catch {
      setMessage("Erro ao salvar.");
    } finally {
      setCgSubmitting(false);
    }
  }

  function openChangePasswordModal(usuario: Usuario, isSelf = false) {
    setPasswordChangeUserId(usuario.id ?? null);
    setPasswordChangeValue("");
    setPasswordChangeConfirmValue("");
    setPasswordChangeIsSelf(isSelf);
    setChangePasswordModalOpen(true);
  }

  function closeChangePasswordModal() {
    setChangePasswordModalOpen(false);
    setPasswordChangeValue("");
    setPasswordChangeConfirmValue("");
    setPasswordChangeUserId(null);
    setPasswordChangeIsSelf(false);
  }

  function openPessoaFisicaLookup() {
    setLookupForm(lookupFilter);
    setLookupApplied(false);
    setPessoaFisicaLookupOpen(true);
  }

  function closePessoaFisicaLookup() {
    setPessoaFisicaLookupOpen(false);
  }

  function handlePessoaFisicaSelect(pessoa: PessoaFisica) {
    setAdminForm({ ...adminForm, nr_seq_pessoa_fisica: pessoa.nr_sequencia });
    closePessoaFisicaLookup();
  }

  function applyLookupFilter() {
    setLookupFilter(lookupForm);
    setLookupApplied(true);
  }

  function clearLookupFilter() {
    const empty = { ds_nome: '', nr_sequencia: '', nr_cpf: '' };
    setLookupForm(empty);
    setLookupFilter(empty);
    setLookupApplied(false);
  }

  const selectedPessoaFisicaName = useMemo(() => {
    if (!adminForm.nr_seq_pessoa_fisica) return "";
    return pessoasFisicas.find((p) => p.nr_sequencia === adminForm.nr_seq_pessoa_fisica)?.ds_nome ?? "";
  }, [adminForm.nr_seq_pessoa_fisica, pessoasFisicas]);

  const filteredLookupPessoasFisicas = useMemo(() => {
    return pessoasFisicas.filter((pessoa) => {
      if (lookupFilter.nr_sequencia) {
        if (String(pessoa.nr_sequencia) !== lookupFilter.nr_sequencia.trim()) return false;
      }
      if (lookupFilter.ds_nome && !pessoa.ds_nome.toLowerCase().includes(lookupFilter.ds_nome.toLowerCase())) {
        return false;
      }
      if (lookupFilter.nr_cpf) {
        const queryCpf = lookupFilter.nr_cpf.replace(/\D/g, '');
        const pessoaCpf = pessoa.nr_cpf.replace(/\D/g, '');
        if (!pessoaCpf.includes(queryCpf)) return false;
      }
      return true;
    });
  }, [pessoasFisicas, lookupFilter]);

  /* ── Lookup de Pessoa Física para Alunos (aluno / responsável) ── */
  function openAlunoPessoaFisicaLookup(target: 'aluno' | 'responsavel' | 'colaborador' | 'alunoFilter' | 'colaboradorFilter' | 'ativo' | 'ativoFilter' | 'manutencaoFilter', responsavelIndex = 0) {
    alunoPessoaFisicaLookupTargetRef.current = target;
    alunoResponsavelLookupIndexRef.current = responsavelIndex;
    setAlunoLookupForm(alunoLookupFilter);
    setAlunoLookupApplied(false);
    setAlunoPessoaFisicaLookupOpen(true);
  }

  function closeAlunoPessoaFisicaLookup() {
    setAlunoPessoaFisicaLookupOpen(false);
  }

  function handleAlunoPessoaFisicaSelect(pessoa: PessoaFisica) {
    const target = alunoPessoaFisicaLookupTargetRef.current;
    if (target === 'alunoFilter') {
      setAlunoFilterForm((prev) => ({ ...prev, nr_seq_pessoa_fisica: String(pessoa.nr_sequencia) }));
    } else if (target === 'colaboradorFilter') {
      setColaboradorFilterForm((prev) => ({ ...prev, nr_seq_pessoa_fisica: String(pessoa.nr_sequencia) }));
    } else if (target === 'colaborador') {
      setColaboradorForm({ ...colaboradorForm, nr_seq_pessoa_fisica: pessoa.nr_sequencia });
    } else if (target === 'responsavel') {
      const index = alunoResponsavelLookupIndexRef.current;
      setAlunoForm((prev) => {
        const responsaveis = [...(prev.responsaveis ?? [])];
        responsaveis[index] = { ...(responsaveis[index] ?? {}), nr_seq_responsavel: pessoa.nr_sequencia };
        return { ...prev, responsaveis };
      });
    } else if (target === 'ativo') {
      const idx = alunoResponsavelLookupIndexRef.current;
      setAtivoForm((prev) => {
        const responsaveis = [...(prev.responsaveis ?? [])];
        responsaveis[idx] = { ...(responsaveis[idx] ?? {}), nr_seq_responsavel: pessoa.nr_sequencia };
        return { ...prev, responsaveis };
      });
    } else if (target === 'ativoFilter') {
      setAtivoFilterForm((prev) => ({ ...prev, nr_seq_responsavel: String(pessoa.nr_sequencia) }));
    } else if (target === 'manutencaoFilter') {
      setManutencaoFilterForm((prev) => ({ ...prev, nr_seq_prestador_servico: String(pessoa.nr_sequencia) }));
    } else {
      setAlunoForm({ ...alunoForm, nr_seq_pessoa_fisica: pessoa.nr_sequencia });
    }
    closeAlunoPessoaFisicaLookup();
  }

  // Abre o lookup de Pessoa Física a partir do filtro de Alunos.
  function openAlunoFilterPessoaFisicaLookup() {
    openAlunoPessoaFisicaLookup('alunoFilter');
  }

  // Abre o lookup de Pessoa Física a partir do filtro de Colaboradores.
  function openColaboradorFilterPessoaFisicaLookup() {
    openAlunoPessoaFisicaLookup('colaboradorFilter');
  }

  // Abre o lookup de Pessoa Física a partir do filtro de Ativos (Responsável).
  // Helper para filtrar e ordenar opções de Cadastros Gerais (apenas itens Ativos).
  function cgFilterOptions<T extends { nr_sequencia: number; ie_status?: string }>(items: T[], labelFn: (item: T) => string): { value: string; label: string }[] {
    return items
      .filter((op) => op.ie_status === 'A' || !op.ie_status)
      .filter((op) => { const l = labelFn(op); return l && l.trim() !== ''; })
      .sort((a, b) => labelFn(a).localeCompare(labelFn(b), 'pt-BR', { sensitivity: 'base' }))
      .map((op) => ({ value: String(op.nr_sequencia), label: labelFn(op) }));
  }

  function openAtivoFilterResponsavelLookup() {
    openAlunoPessoaFisicaLookup('ativoFilter');
  }

  // Abre o lookup de Pessoa Física a partir do filtro de Manutenções (Prestador de serviço).
  function openManutencaoFilterPrestadorLookup() {
    openAlunoPessoaFisicaLookup('manutencaoFilter');
  }

  function applyAlunoLookupFilter() {
    setAlunoLookupFilter(alunoLookupForm);
    setAlunoLookupApplied(true);
  }

  function clearAlunoLookupFilter() {
    const empty = { ds_nome: '', nr_sequencia: '', nr_cpf: '' };
    setAlunoLookupForm(empty);
    setAlunoLookupFilter(empty);
    setAlunoLookupApplied(false);
  }

  // Nome exibido no campo "Pessoa física" do formulário de Aluno (Identificação).
  const selectedAlunoPessoaFisicaName = useMemo(() => {
    if (!alunoForm.nr_seq_pessoa_fisica) return "";
    return pessoasFisicas.find((p) => p.nr_sequencia === alunoForm.nr_seq_pessoa_fisica)?.ds_nome ?? "";
  }, [alunoForm.nr_seq_pessoa_fisica, pessoasFisicas]);

  // Abre o modal de visualização de uma pessoa física pelo nr_sequencia.
  function openPessoaFisicaView(nrSequencia: number | undefined) {
    if (!nrSequencia) return;
    const pessoa = pessoasFisicas.find((p) => p.nr_sequencia === nrSequencia);
    setPessoaFisicaView(pessoa ?? null);
  }

  // Abre o modal de visualização de uma manutenção pelo nr_sequencia.
  function openManutencaoView(nrSequencia: number | undefined) {
    if (!nrSequencia) return;
    const manut = manutencoes.find((m) => m.nr_sequencia === nrSequencia);
    setManutencaoView(manut ?? null);
  }

  // Abre o modal de visualização de um colaborador pelo nr_sequencia.
  function openColaboradorView(nrSequencia: number | undefined) {
    if (!nrSequencia) return;
    const col = colaboradores.find((c) => c.nr_sequencia === nrSequencia);
    setColaboradorView(col ?? null);
  }

  // Abre o modal de visualização de Pessoa Jurídica, resolvendo o nome da cidade.
  function openPessoaJuridicaView(nrSequencia: number | undefined) {
    if (!nrSequencia) return;
    const pessoa = pessoasJuridicas.find((p) => p.nr_sequencia === nrSequencia);
    setPessoaJuridicaView(pessoa ?? null);
    const codigo = pessoa?.cd_ibge_cidade ?? '';
    pessoaJuridicaViewCodeRef.current = codigo;
    setPessoaJuridicaViewCidade('');
    if (codigo) {
      cidadePorCodigo(codigo)
        .then((cidade) => {
          if (pessoaJuridicaViewCodeRef.current === codigo && cidade) {
            setPessoaJuridicaViewCidade(cidade.nome);
          }
        })
        .catch(() => {});
    }
  }

  // Nome exibido no campo "Pessoa física" do formulário de Colaborador.
  const selectedColaboradorPessoaFisicaName = useMemo(() => {
    if (!colaboradorForm.nr_seq_pessoa_fisica) return "";
    return pessoasFisicas.find((p) => p.nr_sequencia === colaboradorForm.nr_seq_pessoa_fisica)?.ds_nome ?? "";
  }, [colaboradorForm.nr_seq_pessoa_fisica, pessoasFisicas]);

  // Nome exibido no campo "Pessoa jurídica" do formulário de Colaborador.
  const selectedColaboradorPessoaJuridicaName = useMemo(() => {
    if (!colaboradorForm.nr_seq_pessoa_juridica) return "";
    return pessoasJuridicas.find((p) => p.nr_sequencia === colaboradorForm.nr_seq_pessoa_juridica)?.ds_razao_social ?? "";
  }, [colaboradorForm.nr_seq_pessoa_juridica, pessoasJuridicas]);

  /* ── Lookup de Pessoa Jurídica para Colaboradores ── */
  function openColaboradorPessoaJuridicaLookup() {
    colaboradorPjLookupTargetRef.current = 'form';
    setColaboradorPjLookupForm(colaboradorPjLookupFilter);
    setColaboradorPjLookupApplied(false);
    setColaboradorPessoaJuridicaLookupOpen(true);
  }

  // Abre o lookup de Pessoa Jurídica a partir do filtro de Colaboradores.
  function openColaboradorFilterPessoaJuridicaLookup() {
    colaboradorPjLookupTargetRef.current = 'filter';
    setColaboradorPjLookupForm(colaboradorPjLookupFilter);
    setColaboradorPjLookupApplied(false);
    setColaboradorPessoaJuridicaLookupOpen(true);
  }

  function closeColaboradorPessoaJuridicaLookup() {
    setColaboradorPessoaJuridicaLookupOpen(false);
  }

  function handleColaboradorPessoaJuridicaSelect(pessoa: PessoaJuridica) {
    if (colaboradorPjLookupTargetRef.current === 'filter') {
      setColaboradorFilterForm((prev) => ({ ...prev, nr_seq_pessoa_juridica: String(pessoa.nr_sequencia) }));
    } else {
      setColaboradorForm({ ...colaboradorForm, nr_seq_pessoa_juridica: pessoa.nr_sequencia });
    }
    closeColaboradorPessoaJuridicaLookup();
  }

  function applyColaboradorPjLookupFilter() {
    setColaboradorPjLookupFilter(colaboradorPjLookupForm);
    setColaboradorPjLookupApplied(true);
  }

  function clearColaboradorPjLookupFilter() {
    const empty = { nr_sequencia: '', ds_razao_social: '', nr_cnpj: '' };
    setColaboradorPjLookupForm(empty);
    setColaboradorPjLookupFilter(empty);
    setColaboradorPjLookupApplied(false);
  }

  const filteredColaboradorPjLookupPessoasJuridicas = useMemo(() => {
    return pessoasJuridicas.filter((pessoa) => {
      if (colaboradorPjLookupFilter.nr_sequencia) {
        if (String(pessoa.nr_sequencia) !== colaboradorPjLookupFilter.nr_sequencia.trim()) return false;
      }
      if (colaboradorPjLookupFilter.ds_razao_social && !pessoa.ds_razao_social.toLowerCase().includes(colaboradorPjLookupFilter.ds_razao_social.toLowerCase())) {
        return false;
      }
      if (colaboradorPjLookupFilter.nr_cnpj) {
        const queryCnpj = colaboradorPjLookupFilter.nr_cnpj.replace(/\D/g, '');
        const pessoaCnpj = pessoa.nr_cnpj.replace(/\D/g, '');
        if (!pessoaCnpj.includes(queryCnpj)) return false;
      }
      return true;
    });
  }, [pessoasJuridicas, colaboradorPjLookupFilter]);

  // Nomes exibidos nos campos "Pessoa física" de Responsáveis do formulário de Aluno (por linha).
  const selectedAlunoResponsaveisNames = useMemo(() => {
    return (alunoForm.responsaveis ?? []).map((r) => {
      if (!r.nr_seq_responsavel) return "";
      return pessoasFisicas.find((p) => p.nr_sequencia === r.nr_seq_responsavel)?.ds_nome ?? "";
    });
  }, [alunoForm.responsaveis, pessoasFisicas]);

  // Nomes exibidos nos campos "Responsável" do formulário de Ativo (Classificação).
  const selectedAtivoResponsaveisNames = useMemo(() => {
    return (ativoForm.responsaveis ?? []).map((r) => {
      if (!r.nr_seq_responsavel) return "";
      return pessoasFisicas.find((p) => p.nr_sequencia === r.nr_seq_responsavel)?.ds_nome ?? "";
    });
  }, [ativoForm.responsaveis, pessoasFisicas]);

  // Opções do dropdown "Grau de parentesco" (Responsáveis) — apenas os ativos,
  // em ordem alfabética (pt-BR).
  const alunoGrauParentescoOptions = useMemo(
    () =>
      grausParentesco
        .filter((g) => (g.ie_status ?? 'A') === 'A')
        .map((g) => ({ value: String(g.nr_sequencia), label: g.ds_grau_parentesco }))
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
    [grausParentesco]
  );

  const filteredAlunoLookupPessoasFisicas = useMemo(() => {
    return pessoasFisicas.filter((pessoa) => {
      if (alunoLookupFilter.nr_sequencia) {
        if (String(pessoa.nr_sequencia) !== alunoLookupFilter.nr_sequencia.trim()) return false;
      }
      if (alunoLookupFilter.ds_nome && !pessoa.ds_nome.toLowerCase().includes(alunoLookupFilter.ds_nome.toLowerCase())) {
        return false;
      }
      if (alunoLookupFilter.nr_cpf) {
        const queryCpf = alunoLookupFilter.nr_cpf.replace(/\D/g, '');
        const pessoaCpf = pessoa.nr_cpf.replace(/\D/g, '');
        if (!pessoaCpf.includes(queryCpf)) return false;
      }
      return true;
    });
  }, [pessoasFisicas, alunoLookupFilter]);

  /* ── Lookup de cidades (Naturalidade — API IBGE) ── */
  async function openNaturalidadeLookup() {
    setCidadeLookupForm({ codigo: '', nome: '', uf: '' });
    setCidadeLookupApplied(false);
    setCidadeResults([]);
    setNaturalidadeLookupOpen(true);
  }

  function closeNaturalidadeLookup() {
    setNaturalidadeLookupOpen(false);
  }

  async function handleCidadeSearch() {
    setCidadeLoading(true);
    try {
      const results = await buscarCidades(cidadeLookupForm);
      setCidadeResults(results);
      setCidadeLookupApplied(true);
    } catch {
      setCidadeResults([]);
      setCidadeLookupApplied(true);
    } finally {
      setCidadeLoading(false);
    }
  }

  function handleCidadeSelect(cidade: Cidade) {
    const codigo = String(cidade.id);
    naturalidadeCodeRef.current = codigo;
    setForm({ ...form, cd_ibge_naturalidade: codigo });
    setNaturalidadeNome(`${cidade.nome} - ${cidade.uf}`);
    closeNaturalidadeLookup();
  }

  function clearCidadeLookup() {
    setCidadeLookupForm({ codigo: '', nome: '', uf: '' });
    setCidadeResults([]);
    setCidadeLookupApplied(false);
  }

  async function handleNaturalidadeCodeChange(codigo: string) {
    naturalidadeCodeRef.current = codigo;
    setForm({ ...form, cd_ibge_naturalidade: codigo });
    if (codigo.length < 7) {
      setNaturalidadeNome('');
      return;
    }
    try {
      const cidade = await cidadePorCodigo(codigo);
      if (naturalidadeCodeRef.current !== codigo) return;
      setNaturalidadeNome(cidade ? `${cidade.nome} - ${cidade.uf}` : '');
    } catch {
      if (naturalidadeCodeRef.current === codigo) setNaturalidadeNome('');
    }
  }

  /* ── Lookup de cidades da Pessoa Jurídica (Endereço/Filtro — API IBGE) ── */
  async function openPjCidadeLookup() {
    pjCidadeLookupTargetRef.current = 'form';
    setPjCidadeLookupForm({ codigo: '', nome: '', uf: '' });
    setPjCidadeLookupApplied(false);
    setPjCidadeResults([]);
    setPjCidadeLookupOpen(true);
  }

  async function openPjFilterCidadeLookup() {
    pjCidadeLookupTargetRef.current = 'filter';
    setPjCidadeLookupForm({ codigo: '', nome: '', uf: '' });
    setPjCidadeLookupApplied(false);
    setPjCidadeResults([]);
    setPjCidadeLookupOpen(true);
  }

  function closePjCidadeLookup() {
    setPjCidadeLookupOpen(false);
  }

  async function handlePjCidadeSearch() {
    setPjCidadeLoading(true);
    try {
      const results = await buscarCidades(pjCidadeLookupForm);
      setPjCidadeResults(results);
      setPjCidadeLookupApplied(true);
    } catch {
      setPjCidadeResults([]);
      setPjCidadeLookupApplied(true);
    } finally {
      setPjCidadeLoading(false);
    }
  }

  function handlePjCidadeSelect(cidade: Cidade) {
    const codigo = String(cidade.id);
    pjCidadeCodeRef.current = codigo;
    if (pjCidadeLookupTargetRef.current === 'filter') {
      // Grava no filtro de PJ — o nome é resolvido pelo próprio modal de filtro.
      setPjFilterForm((prev) => ({ ...prev, cd_ibge_cidade: codigo }));
    } else {
      setPjForm({ ...pjForm, cd_ibge_cidade: codigo });
      setPjCidadeNome(`${cidade.nome} - ${cidade.uf}`);
    }
    closePjCidadeLookup();
  }

  function clearPjCidadeLookup() {
    setPjCidadeLookupForm({ codigo: '', nome: '', uf: '' });
    setPjCidadeResults([]);
    setPjCidadeLookupApplied(false);
  }

  async function handlePjCidadeCodeChange(codigo: string) {
    pjCidadeCodeRef.current = codigo;
    setPjForm({ ...pjForm, cd_ibge_cidade: codigo });
    if (codigo.length < 7) {
      setPjCidadeNome('');
      return;
    }
    try {
      const cidade = await cidadePorCodigo(codigo);
      if (pjCidadeCodeRef.current !== codigo) return;
      setPjCidadeNome(cidade ? `${cidade.nome} - ${cidade.uf}` : '');
    } catch {
      if (pjCidadeCodeRef.current === codigo) setPjCidadeNome('');
    }
  }

  async function handleChangePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordChangeUserId) return;
    setMessage("");

    if (!passwordChangeValue) {
      setMessage("Informe a nova senha.");
      return;
    }
    if (passwordChangeIsSelf && passwordChangeValue !== passwordChangeConfirmValue) {
      setMessage("As senhas não coincidem.");
      return;
    }

    setAdminSubmitting(true);

    try {
      const senhaHash = await hashPassword(passwordChangeValue);
      await atualizarUsuario(passwordChangeUserId, { ds_senha: senhaHash }, auditAutor);
      await loadUsuarios();
      closeChangePasswordModal();
      setMessage("Senha alterada com sucesso!");
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      setMessage("Erro ao alterar senha.");
    } finally {
      setAdminSubmitting(false);
    }
  }
  function openFormContextMenu(event: React.MouseEvent) {
    if (view !== 'form') return;
    let item: ContextMenuState['item'] | null = null;
    let section: SectionType = activeSection;

    if (activeSection === 'pessoaFisica') {
      if (pjManageSelection === 'pessoasJuridicas') {
        item = pessoasJuridicas.find((p) => p.id === pjEditingId) ?? null;
      } else {
        item = pessoasFisicas.find((p) => p.id === editingId) ?? null;
      }
    } else if (activeSection === 'administracaoSistema') {
      if (adminManageSelection === 'perfis') {
        item = perfis.find((p) => p.id === perfilEditingId) ?? null;
      } else {
        item = usuarios.find((u) => u.id === adminEditingId) ?? null;
      }
    } else if (activeSection === 'estruturaAcademica') {
      if (alunoManageSelection === 'colaboradores') {
        item = colaboradores.find((c) => c.id === colaboradorEditingId) ?? null;
      } else {
        item = alunos.find((a) => a.id === alunoEditingId) ?? null;
      }
    } else if (activeSection === 'patrimonio') {
      item = ativos.find((a) => a.id === ativoEditingId) ?? null;
    } else {
      item = cgItems.find((i) => i.id === cgEditingId) ?? null;
    }

    if (!item) return;
    // Itens protegidos (usuário administrador / perfil Administrador) só podem
    // ser vistos por outros usuários — o menu de contexto não deve abrir aqui.
    if (!isAdministrador && activeSection === 'administracaoSistema') {
      if (adminManageSelection === 'perfis') {
        if (isAdministradorPerfil(item as Perfil)) return;
      } else {
        if (isAdministradorUsuario(item as Usuario)) return;
      }
    }
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, section, item });
  }

  async function handleDelete(id: string) {
    setMessage("");
    try {
      await excluirPessoaFisica(id);
      setMessage("Excluído com sucesso!");
      await loadPessoasFisicas();
    } catch {
      setMessage("Erro ao excluir.");
    }
    if (view === 'form') goToList();
  }

  async function handlePjDelete(id: string) {
    setMessage("");
    try {
      await excluirPessoaJuridica(id);
      setMessage("Excluído com sucesso!");
      await loadPessoasJuridicas();
    } catch {
      setMessage("Erro ao excluir.");
    }
    if (view === 'form') goToPjList();
  }

  async function handleAlunoDelete(id: string) {
    setMessage("");
    try {
      await excluirAluno(id);
      setMessage("Excluído com sucesso!");
      await loadAlunos();
    } catch {
      setMessage("Erro ao excluir.");
    }
    if (view === 'form') goToAlunoList();
  }

  async function handleColaboradorDelete(id: string) {
    setMessage("");
    try {
      await excluirColaborador(id);
      setMessage("Excluído com sucesso!");
      await loadColaboradores();
    } catch {
      setMessage("Erro ao excluir.");
    }
    if (view === 'form') goToColaboradorList();
  }

  async function handleAtivoDelete(id: string) {
    setMessage("");
    try {
      await excluirAtivo(id);
      setMessage("Excluído com sucesso!");
      await loadAtivos();
    } catch {
      setMessage("Erro ao excluir.");
    }
    if (view === 'form') goToAtivoList();
  }

  /** Gera o código de patrimônio de um ativo com base na regra salva. */
  async function handleGerarCodigoPatrimonio(ativo: Ativo) {
    setMessage("");
    setGerandoCodigoPatrimonio(true);
    try {
      const doc = await obterParamCodigoPatrimonio();
      if (!doc?.ds_regra) {
        setMessage("Nenhuma regra de geração de patrimônio configurada.");
        return;
      }

      const segmentos = doc.ds_regra.split("-").filter((v) => v.trim() !== "");
      if (segmentos.length === 0) {
        setMessage("Regra de patrimônio vazia.");
        return;
      }

      const agora = new Date();
      const pad2 = (n: number) => String(n).padStart(2, "0");

      // Encontra o último número sequencial entre todos os ativos
      const todosAtivos = [...ativos];
      const numerosPatrimonio = todosAtivos
        .map((a) => {
          const m = (a.cd_patrimonio ?? "").match(/(\d+)$/);
          return m ? parseInt(m[1], 10) : 0;
        })
        .filter((n) => !isNaN(n));
      const ultimoSequencial = numerosPatrimonio.length > 0 ? Math.max(...numerosPatrimonio) : 0;

      // Encontra o último número sequencial do mês atual
      const mesAtual = pad2(agora.getMonth() + 1);
      const anoAtual = String(agora.getFullYear());
      const numerosSequencialMes = todosAtivos
        .map((a) => {
          const m = (a.cd_patrimonio ?? "").match(new RegExp(`${anoAtual}${mesAtual}(\d+)$`));
          return m ? parseInt(m[1], 10) : 0;
        })
        .filter((n) => !isNaN(n));
      const ultimoSequencialMes = numerosSequencialMes.length > 0 ? Math.max(...numerosSequencialMes) : 0;

      // Encontra o último número sequencial do ano atual
      const prefixoAno = String(agora.getFullYear()).slice(-2);
      const numerosSequencialAno = todosAtivos
        .map((a) => {
          const m = (a.cd_patrimonio ?? "").match(new RegExp(`${prefixoAno}(\d+)$`));
          return m ? parseInt(m[1], 10) : 0;
        })
        .filter((n) => !isNaN(n));
      const ultimoSequencialAno = numerosSequencialAno.length > 0 ? Math.max(...numerosSequencialAno) : 0;

      const partes: string[] = [];
      let textoCustomizado = "";

      for (const seg of segmentos) {
        if (seg.toLowerCase().startsWith("texto:")) {
          textoCustomizado = seg.slice(6);
          partes.push(textoCustomizado);
        } else {
          switch (seg.toLowerCase()) {
            case "ano_atual":
              partes.push(String(agora.getFullYear()));
              break;
            case "ano_atual_2":
              partes.push(String(agora.getFullYear()).slice(-2));
              break;
            case "chave_esquerda":
              partes.push("{");
              break;
            case "chave_direita":
              partes.push("}");
              break;
            case "colchete_esquerdo":
              partes.push("[");
              break;
            case "colchete_direito":
              partes.push("]");
              break;
            case "data_atual":
              partes.push(`${pad2(agora.getDate())}${pad2(agora.getMonth() + 1)}${agora.getFullYear()}`);
              break;
            case "data_atual_2digitos":
              partes.push(`${pad2(agora.getDate())}${pad2(agora.getMonth() + 1)}${String(agora.getFullYear()).slice(-2)}`);
              break;
            case "data_atual_2digitos_mascara":
              partes.push(`${pad2(agora.getDate())}/${pad2(agora.getMonth() + 1)}/${String(agora.getFullYear()).slice(-2)}`);
              break;
            case "data_atual_mascara":
              partes.push(`${pad2(agora.getDate())}/${pad2(agora.getMonth() + 1)}/${agora.getFullYear()}`);
              break;
            case "dia_atual":
              partes.push(pad2(agora.getDate()));
              break;
            case "dois_pontos":
              partes.push(":");
              break;
            case "hifen":
              partes.push("-");
              break;
            case "mes_atual":
              partes.push(pad2(agora.getMonth() + 1));
              break;
            case "parentese_esquerdo":
              partes.push("(");
              break;
            case "parentese_direito":
              partes.push(")");
              break;
            case "ponto":
              partes.push(".");
              break;
            case "sequencial":
              partes.push(String(ultimoSequencial + 1));
              break;
            case "sequencial_mes":
              partes.push(String(ultimoSequencialMes + 1));
              break;
            case "sequencial_ano":
              partes.push(String(ultimoSequencialAno + 1));
              break;
            case "sequencia":
              partes.push(String(ativo.nr_sequencia));
              break;
            default:
              if (seg.toLowerCase().startsWith("sequencia_digitos:")) {
                const digitos = parseInt(seg.slice(18), 10);
                if (!isNaN(digitos) && digitos > 0) {
                  partes.push(String(ativo.nr_sequencia).padStart(digitos, "0"));
                } else {
                  partes.push(String(ativo.nr_sequencia));
                }
              } else {
                partes.push(seg);
              }
              break;
          }
        }
      }

      const codigo = partes.join("");

      if (!ativo.id) {
        setMessage("Erro: ativo sem ID.");
        return;
      }

      await atualizarAtivo(ativo.id, { cd_patrimonio: codigo }, auditAutor);
      await loadAtivos();
      setMessage("Código de patrimônio gerado.");
    } catch (e) {
      console.error("Erro ao gerar código de patrimônio", e);
      setMessage("Erro ao gerar código de patrimônio.");
    } finally {
      setGerandoCodigoPatrimonio(false);
    }
  }

  function openAlterarStatusModal(aluno: Aluno) {
    setAlterarStatusAluno(aluno);
    // Data do status já vem com a data atual; os demais campos começam vazios
    // (o status atual NÃO fica disponível no dropdown e o motivo não é
    // preenchido mesmo se houver valor salvo no banco).
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setAlterarStatusForm({
      dt_status: `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`,
      ie_status: '',
      ds_status: '',
    });
    setMessage("");
    setAlterarStatusModalOpen(true);
  }

  function closeAlterarStatusModal() {
    setAlterarStatusModalOpen(false);
    setAlterarStatusAluno(null);
  }

  async function handleAlterarStatusSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!alterarStatusAluno?.id) return;
    setMessage("");
    if (!alterarStatusForm.ie_status) {
      setMessage("Selecione um status.");
      return;
    }
    setAlterarStatusSaving(true);
    try {
      await atualizarAluno(
        alterarStatusAluno.id,
        {
          dt_status: alterarStatusForm.dt_status,
          ie_status: alterarStatusForm.ie_status,
          ds_status: alterarStatusForm.ds_status,
        },
        auditAutor
      );
      setMessage("Status alterado com sucesso!");
      closeAlterarStatusModal();
      await loadAlunos();
    } catch {
      setMessage("Erro ao alterar o status.");
    } finally {
      setAlterarStatusSaving(false);
    }
  }

  function openAtivoStatusModal(ativo: Ativo, statusValue: string) {
    setAtivoStatusTarget(ativo);
    setAtivoStatusValue(statusValue);
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setAtivoStatusForm({
      dt_data: `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`,
      ds_motivo_status: '',
    });
    setMessage("");
    setAtivoStatusModalOpen(true);
  }

  function closeAtivoStatusModal() {
    setAtivoStatusModalOpen(false);
    setAtivoStatusTarget(null);
    setAtivoStatusValue('');
  }

  async function handleAtivoStatusSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ativoStatusTarget?.id || !ativoStatusValue) return;
    setMessage("");
    setAtivoStatusSaving(true);
    try {
      const updates: Record<string, unknown> = { ie_status: ativoStatusValue, dt_status: ativoStatusForm.dt_data, ds_motivo_status: ativoStatusForm.ds_motivo_status };
      if (ativoStatusValue === 'O') {
        // data do status e motivo já definidos acima
      } else if (ativoStatusValue === 'M') {
        updates.dt_ultima_manutencao = ativoStatusForm.dt_data;
      }
      await atualizarAtivo(ativoStatusTarget.id, updates as any, auditAutor);
      setMessage("Status alterado com sucesso!");
      closeAtivoStatusModal();
      await loadAtivos();
    } catch {
      setMessage("Erro ao alterar o status.");
    } finally {
      setAtivoStatusSaving(false);
    }
  }

  /* ── Enviar para manutenção (modal) ── */

  function openEnviarManutModal(ativo: Ativo) {
    setEnviarManutTarget(ativo);
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setEnviarManutForm({ dt_data: `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`, nr_seq_prestador_servico: undefined, ds_motivo_manutencao: '' });
    setEnviarManutPrestLookupForm({ nr_sequencia: '', ds_nome: '', nr_cpf: '', nr_cnpj: '' });
    setEnviarManutPrestLookupFilter({ nr_sequencia: '', ds_nome: '', nr_cpf: '', nr_cnpj: '' });
    setEnviarManutPrestLookupApplied(false);
    setMessage('');
    setEnviarManutModalOpen(true);
  }

  function closeEnviarManutModal() {
    setEnviarManutModalOpen(false);
    setEnviarManutTarget(null);
  }

  /* ── Concluir manutenção (modal) ── */

  function openConcluirManutModalFromAtivo(ativo: Ativo) {
    const manut = manutencoes.find((m) => m.nr_seq_ativo === ativo.nr_sequencia && m.ie_status_manutencao === 'E');
    if (!manut) return;
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setConcluirManutTarget({ ativo, manutencao: manut });
    setConcluirManutForm({
      dt_termino: `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`,
      vl_total: '',
      ds_correcoes: '',
      ie_status_ativo: 'O',
    });
    setMessage('');
    setConcluirManutModalOpen(true);
  }

  function openConcluirManutModalFromManut(manut: Manutencao) {
    const ativo = ativos.find((a) => a.nr_sequencia === manut.nr_seq_ativo);
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setConcluirManutTarget({ ativo: ativo ?? null, manutencao: manut });
    setConcluirManutForm({
      dt_termino: `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`,
      vl_total: '',
      ds_correcoes: '',
      ie_status_ativo: 'O',
    });
    setMessage('');
    setConcluirManutModalOpen(true);
  }

  function closeConcluirManutModal() {
    setConcluirManutModalOpen(false);
    setConcluirManutTarget(null);
  }

  function openCancelarManutModal(manut: Manutencao) {
    setCancelarManutTarget(manut);
    setCancelarManutOpen(true);
  }

  async function handleCancelarManutSubmit() {
    if (!cancelarManutTarget) return;
    try {
      await atualizarManutencao(cancelarManutTarget.id!, { ie_status_manutencao: 'CA', dt_termino: cancelarManutTarget.dt_termino || new Date().toISOString().slice(0, 10) } as any, auditAutor);
      const ativo = ativos.find((a) => a.nr_sequencia === cancelarManutTarget.nr_seq_ativo);
      if (ativo && ativo.id) {
        await atualizarAtivo(ativo.id, { ie_status: 'O', dt_status: cancelarManutTarget.dt_termino || new Date().toISOString().slice(0, 10) } as any, auditAutor);
      }
      setMessage('Manutenção cancelada com sucesso.');
      setCancelarManutOpen(false);
      setCancelarManutTarget(null);
      await loadAtivos();
      await loadManutencoes();
    } catch {
      setMessage('Erro ao cancelar manutenção.');
    }
  }

  async function handleConcluirManutSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!concluirManutTarget) return;
    setMessage('');
    setConcluirManutSaving(true);
    try {
      const updates: Record<string, unknown> = { dt_termino: concluirManutForm.dt_termino, ie_status_manutencao: 'CO' };
      if (concluirManutForm.vl_total) {
        updates.vl_total = concluirManutForm.vl_total;
      }
      if (concluirManutForm.ds_correcoes) updates.ds_correcoes = concluirManutForm.ds_correcoes;
      await atualizarManutencao(concluirManutTarget.manutencao.id!, updates as any, auditAutor);
      if (concluirManutTarget.ativo) {
        const ativoUpdates: Record<string, unknown> = { ie_status: concluirManutForm.ie_status_ativo || 'O' };
        if (concluirManutForm.ie_status_ativo === 'O') {
          ativoUpdates.dt_status = concluirManutForm.dt_termino;
        }
        await atualizarAtivo(concluirManutTarget.ativo.id!, ativoUpdates as any, auditAutor);
      }
      setMessage('Manutenção concluída com sucesso!');
      closeConcluirManutModal();
      await loadAtivos();
      await loadManutencoes();
    } catch {
      setMessage('Erro ao concluir manutenção.');
    } finally {
      setConcluirManutSaving(false);
    }
  }

  function openEnviarManutPrestadorLookup(target: 'modal' | 'form' = 'modal') {
    enviarManutPrestadorLookupTargetRef.current = target;
    setEnviarManutPrestLookupForm(enviarManutPrestLookupFilter);
    setEnviarManutPrestLookupApplied(false);
    setEnviarManutPrestadorLookupOpen(true);
  }

  function closeEnviarManutPrestadorLookup() {
    setEnviarManutPrestadorLookupOpen(false);
  }

  function applyEnviarManutPrestadorLookup() {
    setEnviarManutPrestLookupFilter(enviarManutPrestLookupForm);
    setEnviarManutPrestLookupApplied(true);
  }

  function clearEnviarManutPrestadorLookup() {
    const empty = { nr_sequencia: '', ds_nome: '', nr_cpf: '', nr_cnpj: '' };
    setEnviarManutPrestLookupForm(empty);
    setEnviarManutPrestLookupFilter(empty);
    setEnviarManutPrestLookupApplied(false);
  }

  function handleEnviarManutPrestadorSelect(colaborador: Colaborador) {
    const target = enviarManutPrestadorLookupTargetRef.current;
    if (target === 'form') {
      setManutencaoForm((prev) => ({ ...prev, nr_seq_prestador_servico: colaborador.nr_sequencia }));
    } else {
      setEnviarManutForm((prev) => ({ ...prev, nr_seq_prestador_servico: colaborador.nr_sequencia }));
    }
    closeEnviarManutPrestadorLookup();
  }

  async function handleEnviarManutSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enviarManutTarget?.id) return;
    setMessage('');
    setEnviarManutSaving(true);
    try {
      const { nr_sequencia: nrSeqManut } = await criarManutencao({
        nr_seq_ativo: enviarManutTarget.nr_sequencia,
        nr_seq_prestador_servico: enviarManutForm.nr_seq_prestador_servico,
        dt_envio: enviarManutForm.dt_data,
        dt_termino: '',
        ie_status_manutencao: 'E',
        vl_total: undefined,
        ds_observacao: '',
        ds_motivo_manutencao: enviarManutForm.ds_motivo_manutencao,
      }, auditAutor);
      await atualizarAtivo(enviarManutTarget.id, { ie_status: 'M', dt_status: enviarManutForm.dt_data, dt_ultima_manutencao: enviarManutForm.dt_data, nr_seq_ultima_manutencao: nrSeqManut, ds_motivo_status: enviarManutForm.ds_motivo_manutencao } as any, auditAutor);
      setMessage('Ativo enviado para manutenção com sucesso.');
      closeEnviarManutModal();
      await loadAtivos();
      await loadManutencoes();
    } catch {
      setMessage('Erro ao enviar para manutenção.');
    } finally {
      setEnviarManutSaving(false);
    }
  }

  /* ── Manutenções: CRUD ── */

  const emptyManutencaoForm: ManutencaoFormData = {
    nr_seq_ativo: undefined,
    nr_seq_prestador_servico: undefined,
    dt_envio: '',
    dt_termino: '',
    ie_status_manutencao: 'E',
    vl_total: undefined,
    ds_observacao: '',
    ds_motivo_manutencao: '',
    ds_correcoes: '',
  };

  function goToManutencaoList() {
    setView('list');
    setManutencaoEditingId(null);
    setManutencaoForm(emptyManutencaoForm);
    setManutencaoCampoErros([]);
    setMessage('');
  }

  function handleManutencaoNewForm() {
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dataAtual = `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`;
    setManutencaoForm({ ...emptyManutencaoForm, dt_envio: dataAtual });
    setManutencaoEditingId(null);
    setManutencaoAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    auditManutencaoIdRef.current = null;
    setMessage('');
    setManutencaoCampoErros([]);
    setView('form');
    setActiveSection('patrimonio');
    setAtivoManageSelection('manutencoes');
  }

  /* ── Lookup de ativo no formulário de manutenção ── */
  function openManutencaoAtivoLookup() {
    manutencaoAtivoLookupTargetRef.current = 'manutencao';
    setManutencaoAtivoLookupForm(manutencaoAtivoLookupFilter);
    setManutencaoAtivoLookupApplied(false);
    setManutencaoAtivoLookupOpen(true);
  }
  function openManutencaoFilterAtivoLookup() {
    manutencaoAtivoLookupTargetRef.current = 'manutencaoFilter';
    setManutencaoAtivoLookupForm(manutencaoAtivoLookupFilter);
    setManutencaoAtivoLookupApplied(false);
    setManutencaoAtivoLookupOpen(true);
  }
  function closeManutencaoAtivoLookup() {
    setManutencaoAtivoLookupOpen(false);
  }
  function applyManutencaoAtivoLookup() {
    setManutencaoAtivoLookupFilter(manutencaoAtivoLookupForm);
    setManutencaoAtivoLookupApplied(true);
  }
  function clearManutencaoAtivoLookup() {
    const empty = { nr_sequencia: '', ds_ativo: '', cd_patrimonio: '', ds_modelo: '', ie_status: '' };
    setManutencaoAtivoLookupForm(empty);
    setManutencaoAtivoLookupFilter(empty);
    setManutencaoAtivoLookupApplied(false);
  }
  function handleManutencaoAtivoSelect(ativo: Ativo) {
    const target = manutencaoAtivoLookupTargetRef.current;
    if (target === 'manutencaoFilter') {
      setManutencaoFilterForm((prev) => ({ ...prev, nr_seq_ativo: String(ativo.nr_sequencia) }));
    } else {
      setManutencaoForm((prev) => ({ ...prev, nr_seq_ativo: ativo.nr_sequencia }));
    }
    closeManutencaoAtivoLookup();
  }

  function openManutencaoEditForm(m: Manutencao) {
    setManutencaoForm({
      nr_seq_ativo: m.nr_seq_ativo,
      nr_seq_prestador_servico: m.nr_seq_prestador_servico ?? m.nr_seq_pessoa_fisica,
      dt_envio: m.dt_envio ?? '',
      dt_termino: m.dt_termino ?? '',
      ie_status_manutencao: m.ie_status_manutencao ?? 'E',
      vl_total: m.vl_total,
      ds_observacao: m.ds_observacao ?? '',
      ds_motivo_manutencao: m.ds_motivo_manutencao ?? '',
      ds_correcoes: m.ds_correcoes ?? '',
    });
    setManutencaoEditingId(m.id ?? null);
    setManutencaoAuditInfo({
      createdAt: m.dt_criacao ?? '',
      updatedAt: m.dt_alteracao ?? '',
      createdBy: m.ds_usuario_criacao ?? '',
      updatedBy: m.ds_usuario_alteracao ?? '',
    });
    auditManutencaoIdRef.current = m.id ?? null;
    setMessage('');
    setManutencaoCampoErros([]);
    setView('form');
    setActiveSection('patrimonio');
    if (m.id) carregarAutorAuditoriaManutencao(m.id);
  }

  const filteredManutencoes = useMemo(() => manutencoes.filter((m) => {
    // Identificação
    if (appliedManutencaoFilterForm.nr_sequencia) {
      const q = appliedManutencaoFilterForm.nr_sequencia.replace(/\D/g, '');
      if (q && String(m.nr_sequencia) !== q) return false;
    }
    if (appliedManutencaoFilterForm.nr_seq_ativo) {
      const q = appliedManutencaoFilterForm.nr_seq_ativo.replace(/\D/g, '');
      if (q && String(m.nr_seq_ativo ?? '') !== q) return false;
    }
    // Dados da manutenção
    if (appliedManutencaoFilterForm.nr_seq_prestador_servico) {
      const q = appliedManutencaoFilterForm.nr_seq_prestador_servico.replace(/\D/g, '');
      if (q && String(m.nr_seq_prestador_servico ?? (m as any).nr_seq_pessoa_fisica ?? '') !== q) return false;
    }
    if (appliedManutencaoFilterForm.dt_envio_inicio && m.dt_envio && m.dt_envio < appliedManutencaoFilterForm.dt_envio_inicio) return false;
    if (appliedManutencaoFilterForm.dt_envio_fim && m.dt_envio && m.dt_envio > appliedManutencaoFilterForm.dt_envio_fim) return false;
    if (appliedManutencaoFilterForm.dt_termino_inicio && m.dt_termino && m.dt_termino < appliedManutencaoFilterForm.dt_termino_inicio) return false;
    if (appliedManutencaoFilterForm.dt_termino_fim && m.dt_termino && m.dt_termino > appliedManutencaoFilterForm.dt_termino_fim) return false;
    if (appliedManutencaoFilterForm.vl_total_menor) {
      const minVal = Number(appliedManutencaoFilterForm.vl_total_menor.replace(/[^\d.,]/g, '').replace(',', '.'));
      const regVal = Number(String(m.vl_total ?? '').replace(/[^\d.,]/g, '').replace(',', '.'));
      if (!isNaN(minVal) && regVal < minVal) return false;
    }
    if (appliedManutencaoFilterForm.vl_total_maior) {
      const maxVal = Number(appliedManutencaoFilterForm.vl_total_maior.replace(/[^\d.,]/g, '').replace(',', '.'));
      const regVal = Number(String(m.vl_total ?? '').replace(/[^\d.,]/g, '').replace(',', '.'));
      if (!isNaN(maxVal) && regVal > maxVal) return false;
    }
    if (appliedManutencaoFilterForm.ie_status_manutencao !== 'T' && m.ie_status_manutencao !== appliedManutencaoFilterForm.ie_status_manutencao) return false;
    return true;
  }), [manutencoes, appliedManutencaoFilterForm]);

  const filteredSortedManutencoes = useMemo(() => {
    const list = [...filteredManutencoes];
    if (manutencaoSortColumn !== null && manutencaoSortAsc !== null) {
      list.sort((a, b) => {
        const colKey = MANUTENCAO_COLUMNS[manutencaoSortColumn]?.key;
        if (!colKey) return 0;
        const av = (a as unknown as Record<string, unknown>)[colKey];
        const bv = (b as unknown as Record<string, unknown>)[colKey];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        const an = Number(av);
        const bn = Number(bv);
        if (!isNaN(an) && !isNaN(bn)) return manutencaoSortAsc ? an - bn : bn - an;
        return manutencaoSortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    return list;
  }, [filteredManutencoes, manutencaoSortColumn, manutencaoSortAsc]);

  const currentManutencaoEditIndex = useMemo(() => {
    if (!manutencaoEditingId) return -1;
    return filteredSortedManutencoes.findIndex((m) => m.id === manutencaoEditingId);
  }, [manutencaoEditingId, filteredSortedManutencoes]);

  const hasPrevManutencaoRecord = currentManutencaoEditIndex > 0;
  const hasNextManutencaoRecord = currentManutencaoEditIndex >= 0 && currentManutencaoEditIndex < filteredSortedManutencoes.length - 1;

  function goToPrevManutencaoRecord() {
    if (currentManutencaoEditIndex > 0) {
      openManutencaoEditForm(filteredSortedManutencoes[currentManutencaoEditIndex - 1]);
    }
  }

  function goToNextManutencaoRecord() {
    if (currentManutencaoEditIndex >= 0 && currentManutencaoEditIndex < filteredSortedManutencoes.length - 1) {
      openManutencaoEditForm(filteredSortedManutencoes[currentManutencaoEditIndex + 1]);
    }
  }

  function handleManutencaoDelete(id: string) {
    const m = manutencoes.find((man) => man.id === id);
    setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${m?.nr_sequencia ?? ''}?`);
    setConfirmDeleteAction(() => async () => {
      try {
        await excluirManutencao(id);
        await loadManutencoes();
      } catch {
        setMessage('Erro ao excluir.');
      }
    });
    setConfirmDeleteOpen(true);
  }

  async function handleManutencaoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setManutencaoCampoErros([]);
    const obrigatorios: string[] = [];
    if (obrigatorios.length > 0) {
      setManutencaoCampoErros(obrigatorios);
      setMessage('Preencha os campos obrigatórios.');
      return;
    }
    setManutencaoSubmitting(true);
    try {
      if (manutencaoEditingId) {
        const current = manutencoes.find((m) => m.id === manutencaoEditingId);
        const formKeys: Array<keyof ManutencaoFormData> = ['nr_seq_ativo', 'nr_seq_prestador_servico', 'dt_envio', 'dt_termino', 'ie_status_manutencao', 'vl_total', 'ds_observacao', 'ds_motivo_manutencao', 'ds_correcoes'];
        const hasChanges = current ? formKeys.some((k) => String((current as unknown as Record<string, unknown>)[k] ?? '') !== String((manutencaoForm as unknown as Record<string, unknown>)[k] ?? '')) : true;
        if (!hasChanges) {
          setMessage('Nenhuma alteração detectada.');
          setManutencaoForm(emptyManutencaoForm);
          setManutencaoEditingId(null);
          await loadManutencoes();
          setView('list');
          return;
        }
        await atualizarManutencao(manutencaoEditingId, manutencaoForm, auditAutor);
      } else {
        await criarManutencao(manutencaoForm, auditAutor);
      }
      await loadManutencoes();
      setView('list');
    } catch {
      setMessage('Erro ao salvar.');
    } finally {
      setManutencaoSubmitting(false);
    }
  }

  function handleManutencaoSortChange(logicalIndex: number) {
    if (manutencaoSortColumn === logicalIndex) {
      setManutencaoSortAsc((prev) => (prev === null ? true : prev ? false : null));
      if (manutencaoSortAsc === false) {
        setManutencaoSortColumn(null);
      }
    } else {
      setManutencaoSortColumn(logicalIndex);
      setManutencaoSortAsc(true);
    }
  }

  async function carregarAutorAuditoriaManutencao(id: string) {
    try {
      const logs = await fetchAuditByDocumentId('pat_manutencao', id);
      if (auditManutencaoIdRef.current !== id) return;
      const createLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'create');
      const lastChangeLog = logs.find((l) => {
        const acao = String(l.acao ?? '').toLowerCase();
        return acao === 'update';
      });
      setManutencaoAuditInfo((prev) => ({
        ...prev,
        createdBy: createLog?.usuarioNome ?? prev.createdBy,
        updatedBy: lastChangeLog?.usuarioNome ?? prev.updatedBy,
      }));
    } catch {
      // mantém vazio
    }
  }

  async function openManutencaoAuditModal(manutencaoId?: string | null) {
    if (!manutencaoId) return;
    setAuditDocumentType('pat_manutencao');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const logs = await fetchAuditByDocumentId('pat_manutencao', manutencaoId);
      setAuditLogs(logs);
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  function openAlterarIngressoModal(aluno: Aluno) {
    setAlterarIngressoAluno(aluno);
    // Igual ao modal "Alterar status": a data já vem preenchida com a data atual.
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setAlterarIngressoForm({
      dt_ingresso: `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`,
    });
    setMessage("");
    setAlterarIngressoModalOpen(true);
  }

  function closeAlterarIngressoModal() {
    setAlterarIngressoModalOpen(false);
    setAlterarIngressoAluno(null);
  }

  async function handleAlterarIngressoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!alterarIngressoAluno?.id) return;
    setMessage("");
    if (!alterarIngressoForm.dt_ingresso) {
      setMessage("Informe a data de ingresso.");
      return;
    }
    setAlterarIngressoSaving(true);
    try {
      await atualizarAluno(
        alterarIngressoAluno.id,
        { dt_ingresso: alterarIngressoForm.dt_ingresso },
        auditAutor
      );
      setMessage("Data de ingresso alterada com sucesso!");
      closeAlterarIngressoModal();
      await loadAlunos();
    } catch {
      setMessage("Erro ao alterar a data de ingresso.");
    } finally {
      setAlterarIngressoSaving(false);
    }
  }

  function openAlterarAdmissaoModal(colaborador: Colaborador) {
    setAlterarAdmissaoColaborador(colaborador);
    // Igual ao modal "Alterar data de ingresso": já vem preenchido com a data atual.
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setAlterarAdmissaoForm({
      dt_admissao: `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`,
    });
    setMessage("");
    setAlterarAdmissaoModalOpen(true);
  }

  function closeAlterarAdmissaoModal() {
    setAlterarAdmissaoModalOpen(false);
    setAlterarAdmissaoColaborador(null);
  }

  async function handleAlterarAdmissaoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!alterarAdmissaoColaborador?.id) return;
    setMessage("");
    if (!alterarAdmissaoForm.dt_admissao) {
      setMessage("Informe a data de admissão.");
      return;
    }
    setAlterarAdmissaoSaving(true);
    try {
      await atualizarColaborador(
        alterarAdmissaoColaborador.id,
        { dt_admissao: alterarAdmissaoForm.dt_admissao },
        auditAutor
      );
      setMessage("Data de admissão alterada com sucesso!");
      closeAlterarAdmissaoModal();
      await loadColaboradores();
    } catch {
      setMessage("Erro ao alterar a data de admissão.");
    } finally {
      setAlterarAdmissaoSaving(false);
    }
  }

  function openAlterarStatusColaboradorModal(colaborador: Colaborador) {
    setAlterarStatusColaborador(colaborador);
    // Igual ao modal "Alterar status" do aluno: a data já vem com a data atual,
    // os demais campos começam vazios (o status atual NÃO fica disponível no
    // dropdown e o motivo não é preenchido mesmo se houver valor salvo no banco).
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setAlterarStatusColaboradorForm({
      dt_status: `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`,
      ie_status: '',
      ds_motivo_status: '',
    });
    setMessage("");
    setAlterarStatusColaboradorModalOpen(true);
  }

  function closeAlterarStatusColaboradorModal() {
    setAlterarStatusColaboradorModalOpen(false);
    setAlterarStatusColaborador(null);
  }

  async function handleAlterarStatusColaboradorSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!alterarStatusColaborador?.id) return;
    setMessage("");
    if (!alterarStatusColaboradorForm.ie_status) {
      setMessage("Selecione um status.");
      return;
    }
    setAlterarStatusColaboradorSaving(true);
    try {
      await atualizarColaborador(
        alterarStatusColaborador.id,
        {
          dt_status: alterarStatusColaboradorForm.dt_status,
          ie_status: alterarStatusColaboradorForm.ie_status,
          ds_motivo_status: alterarStatusColaboradorForm.ds_motivo_status,
        },
        auditAutor
      );
      setMessage("Status alterado com sucesso!");
      closeAlterarStatusColaboradorModal();
      await loadColaboradores();
    } catch {
      setMessage("Erro ao alterar o status.");
    } finally {
      setAlterarStatusColaboradorSaving(false);
    }
  }

  async function handleAdminDelete(id: string) {
    setMessage("");
    try {
      await excluirUsuario(id);
      setMessage("Excluído com sucesso!");
      await loadUsuarios();
    } catch {
      setMessage("Erro ao excluir usuário.");
    }
    if (view === 'form') goToAdminList();
  }

  async function handlePerfilDelete(id: string) {
    setMessage("");
    try {
      await excluirPerfil(id);
      setMessage("Excluído com sucesso!");
      await loadPerfis();
    } catch {
      setMessage("Erro ao excluir perfil.");
    }
    if (view === 'form') goToPerfilList();
  }

  function openDelegateFuncoesModal(perfil: Perfil) {
    const saved = parseFuncoesConfig(perfil.config_funcoes);
    setDelegateFuncoesPerfil(perfil);
    // Perfil novo (sem config_funcoes) não vem com nenhuma função liberada.
    setDelegateFuncoes(saved);
    setMessage("");
    setDelegateFuncoesModalOpen(true);
  }

  function closeDelegateFuncoesModal() {
    setDelegateFuncoesModalOpen(false);
    setDelegateFuncoesPerfil(null);
  }

  function toggleDelegateFuncao(section: SectionType) {
    setDelegateFuncoes((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  }

  async function handleDelegateFuncoesSave() {
    if (!delegateFuncoesPerfil?.id) return;
    setMessage("");

    const current = parseFuncoesConfig(delegateFuncoesPerfil.config_funcoes);
    const sameAsSaved =
      current.length === delegateFuncoes.length &&
      current.every((s) => delegateFuncoes.includes(s));

    if (sameAsSaved) {
      setMessage("Nenhuma alteração detectada.");
      closeDelegateFuncoesModal();
      return;
    }

    setDelegateFuncoesSaving(true);
    try {
      await atualizarPerfil(
        delegateFuncoesPerfil.id,
        { config_funcoes: serializeFuncoesConfig(delegateFuncoes) },
        auditAutor
      );
      setMessage("Funções atualizadas com sucesso!");
      await loadPerfis();
      closeDelegateFuncoesModal();
    } catch {
      setMessage("Erro ao salvar funções.");
    } finally {
      setDelegateFuncoesSaving(false);
    }
  }

  /* ── Permissões da função (modal aberto pelo card de função) ── */
  function openPermissoesModal(perfil: Perfil, funcao: SectionType) {
    // Usa a versão mais recente do perfil: o objeto em memória pode estar
    // desatualizado (ex.: permissões salvas numa edição anterior do mesmo modal).
    const perfilAtual = perfis.find((p) => p.id === perfil.id) ?? perfil;
    const config = parsePermissoesConfigMigrada(perfilAtual.config_permissoes, perfilAtual.config_permissoes_v);
    // Função nunca configurada = tudo liberado por padrão; o modal reflete isso
    // pré-marcando todas as permissões (estado efetivo, não o array salvo).
    const atuais = config[funcao];
    const selecionadas = atuais
      ? [...atuais]
      : (PERMISSOES_POR_FUNCAO[funcao] ?? []).map((p) => p.key);
    setPermissoesPerfil(perfilAtual);
    setPermissoesFuncao(funcao);
    setPermissoesSelecionadas(selecionadas);
    setMessage("");
    setPermissoesModalOpen(true);
  }

  function closePermissoesModal() {
    setPermissoesModalOpen(false);
    setPermissoesPerfil(null);
    setPermissoesFuncao(null);
    setPermissoesSelecionadas([]);
  }

  function togglePermissao(permissao: string) {
    setPermissoesSelecionadas((prev) =>
      prev.includes(permissao) ? prev.filter((p) => p !== permissao) : [...prev, permissao]
    );
  }

  async function handlePermissoesSave() {
    if (!permissoesPerfil?.id || !permissoesFuncao) return;
    setMessage("");
    const config = parsePermissoesConfigMigrada(permissoesPerfil.config_permissoes, permissoesPerfil.config_permissoes_v);
    // Compara com o estado EFETIVO: função nunca configurada conta como todas
    // as permissões marcadas (não apenas o array salvo, que é vazio/ausente).
    const atuaisEfetivas =
      config[permissoesFuncao] ??
      (PERMISSOES_POR_FUNCAO[permissoesFuncao] ?? []).map((p) => p.key);
    const sameAsSaved =
      atuaisEfetivas.length === permissoesSelecionadas.length &&
      atuaisEfetivas.every((p) => permissoesSelecionadas.includes(p));

    if (sameAsSaved) {
      setMessage("Nenhuma alteração detectada.");
      closePermissoesModal();
      return;
    }

    config[permissoesFuncao] = permissoesSelecionadas;
    setPermissoesSaving(true);
    try {
      await atualizarPerfil(
        permissoesPerfil.id,
        {
          config_permissoes: serializePermissoesConfig(config),
          config_permissoes_v: PERMISSOES_CONFIG_VERSION,
        },
        auditAutor
      );
      setMessage("Permissões atualizadas com sucesso!");
      await loadPerfis();
      closePermissoesModal();
    } catch {
      setMessage("Erro ao salvar permissões.");
    } finally {
      setPermissoesSaving(false);
    }
  }

  function openDelegatePerfisModal(usuario: Usuario) {
    const saved = parsePerfisConfig(usuario.config_perfis);
    setDelegatePerfisUsuario(usuario);
    setDelegatePerfis(saved);
    setMessage("");
    setDelegatePerfisModalOpen(true);
  }

  function closeDelegatePerfisModal() {
    setDelegatePerfisModalOpen(false);
    setDelegatePerfisUsuario(null);
  }

  function toggleDelegatePerfil(nr_sequencia: number) {
    setDelegatePerfis((prev) =>
      prev.includes(nr_sequencia)
        ? prev.filter((s) => s !== nr_sequencia)
        : [...prev, nr_sequencia]
    );
  }

  async function handleDelegatePerfisSave() {
    if (!delegatePerfisUsuario?.id) return;
    setMessage("");

    const current = parsePerfisConfig(delegatePerfisUsuario.config_perfis);
    const sameAsSaved =
      current.length === delegatePerfis.length &&
      current.every((s) => delegatePerfis.includes(s));

    if (sameAsSaved) {
      setMessage("Nenhuma alteração detectada.");
      closeDelegatePerfisModal();
      return;
    }

    setDelegatePerfisSaving(true);
    try {
      await atualizarUsuario(
        delegatePerfisUsuario.id,
        { config_perfis: serializePerfisConfig(delegatePerfis) },
        auditAutor
      );
      setMessage("Perfis atualizados com sucesso!");
      await loadUsuarios();
      // Se o usuário delegado é o logado, atualiza o currentUser para refletir na hora.
      if (currentUser?.id === delegatePerfisUsuario.id) {
        setCurrentUser((u) => (u ? { ...u, config_perfis: serializePerfisConfig(delegatePerfis) } : u));
      }
      closeDelegatePerfisModal();
    } catch {
      setMessage("Erro ao salvar perfis.");
    } finally {
      setDelegatePerfisSaving(false);
    }
  }

  function openDuplicatePerfilModal(perfil: Perfil) {
    setDuplicatePerfilSource(perfil);
    setDuplicatePerfilName('');
    setMessage("");
    setDuplicatePerfilModalOpen(true);
  }

  function closeDuplicatePerfilModal() {
    setDuplicatePerfilModalOpen(false);
    setDuplicatePerfilSource(null);
    setDuplicatePerfilName('');
  }

  async function handleDuplicatePerfilSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const nome = duplicatePerfilName.trim();
    if (!nome || !duplicatePerfilSource) return;

    // Não é possível ter perfis com o mesmo nome.
    const jaExiste = perfis.some((p) => (p.ds_perfil ?? '').trim().toLowerCase() === nome.toLowerCase());
    if (jaExiste) {
      setMessage("Perfil já existente.");
      return;
    }

    setDuplicatePerfilSaving(true);
    try {
      // Duplica o perfil preservando status, observação, funções liberadas,
      // as regras de campos e as permissões de cada função.
      await criarPerfil(
        {
          ds_perfil: nome,
          ds_observacao: duplicatePerfilSource.ds_observacao ?? '',
          ie_status: duplicatePerfilSource.ie_status ?? 'A',
          config_funcoes: duplicatePerfilSource.config_funcoes,
          config_campos: duplicatePerfilSource.config_campos,
          config_permissoes: duplicatePerfilSource.config_permissoes,
          config_permissoes_v: duplicatePerfilSource.config_permissoes_v,
        } as any,
        auditAutor
      );
      setMessage("Perfil duplicado com sucesso!");
      // Busca os perfis atualizados do banco (a variável perfis da closure
      // ainda não contém o novo perfil recém-criado) para a listagem refletir.
      const perfisAtualizados = await obterPerfis();
      setPerfis(perfisAtualizados);
      // Permanece na listagem de registros (Perfis).
      closeDuplicatePerfilModal();
    } catch {
      setMessage("Erro ao duplicar perfil.");
    } finally {
      setDuplicatePerfilSaving(false);
    }
  }

  async function handleCgDelete(id: string) {
    setMessage("");
    try {
      if (cgKind === 'sexo') {
        await excluirSexo(id);
      } else if (cgKind === 'estadoCivil') {
        await excluirEstadoCivil(id);
      } else if (cgKind === 'corRaca') {
        await excluirCorRaca(id);
      } else if (cgKind === 'grauParentesco') {
        await excluirGrauParentesco(id);
      } else if (cgKind === 'cargo') {
        await excluirCargo(id);
      } else if (cgKind === 'vinculoContratual') {
        await excluirVinculoContratual(id);
      } else if (cgKind === 'localizacao') {
        await excluirLocalizacao(id);
      } else if (cgKind === 'marca') {
        await excluirMarca(id);
      } else if (cgKind === 'categoriaAtivo') {
        await excluirCategoriaAtivo(id);
      } else if (cgKind === 'profissao') {
        await excluirProfissao(id);
      } else if (cgKind === 'logradouro') {
        await excluirLogradouro(id);
      } else if (cgKind === 'sistemaOperacional') {
        await excluirSistemaOperacional(id);
      } else {
        await excluirOrgaoEmissor(id);
      }
      setMessage("Excluído com sucesso!");
      await loadCgItems();
    } catch {
      setMessage("Erro ao excluir.");
    }
    if (view === 'form') goToCgList();
  }

  function getMessageStatus(message: string) {
    if (message.toLowerCase().includes("sucesso") || message.toLowerCase().includes("gerado")) return "success";
    if (
      message.toLowerCase().includes("erro") ||
      message.toLowerCase().includes("não coincidem") ||
      message.toLowerCase().includes("informe a")
    ) return "error";
    return "warning";
  }

  const messageStatus = getMessageStatus(message);

  const toastBg = messageStatus === 'success' ? '#2cc958' : messageStatus === 'warning' ? '#f59e0b' : '#ef4444';
  const toastTextClass = messageStatus === 'warning' ? 'text-slate-950' : 'text-white';
  const toastBorderColor = messageStatus === 'success' ? '#23A146' : messageStatus === 'warning' ? '#b46a00' : '#9b1230';

  useEffect(() => {
    if (!message) {
      setToastVisible(false);
      return;
    }

    setToastMounted(true);
    setToastVisible(true);

    const hideTimer = window.setTimeout(() => {
      setToastVisible(false);
    }, 3000);

    return () => window.clearTimeout(hideTimer);
  }, [message]);

  useEffect(() => {
    if (!toastMounted) return;
    if (toastVisible) return;

    const unmountTimer = window.setTimeout(() => {
      setToastMounted(false);
      setMessage("");
    }, 220);

    return () => window.clearTimeout(unmountTimer);
  }, [toastMounted, toastVisible]);

  async function handleLogin(username: string, password: string) {
    const normalizedUsername = username.trim();
    const normalizedPassword = password.trim();

    if (!normalizedUsername || !normalizedPassword) {
      setLoginError("Usuário ou senha incorretos");
      return;
    }

    console.log("[Login] origin", window.location.origin);
    console.log("[Login] apiKey", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
    setLoginError(null);
    setLoginWarning(null);
    setIsLoginLoading(true);

    try {
      const usuariosCadastrados = await obterUsuarios();
      console.log("[Login] usuários carregados", usuariosCadastrados.length, usuariosCadastrados.map((u) => u.ds_usuario));
      const hashedPassword = await hashPassword(normalizedPassword);
      const legacyHash = createFallbackHash(normalizedPassword);
      const usuarioValido = usuariosCadastrados.find((usuario) => {
        const storedUser = (usuario.ds_usuario ?? "").trim().toLowerCase();
        const storedUserAlt = (usuario.ds_usuario_alternativo ?? "").trim().toLowerCase();
        const storedPassword = (usuario.ds_senha ?? "").trim();
        const storedPasswordNormalized = storedPassword.toLowerCase();
        const usernameMatches =
          storedUser === normalizedUsername.toLowerCase() ||
          storedUserAlt === normalizedUsername.toLowerCase();

        return usernameMatches
          && (storedPasswordNormalized === normalizedPassword.toLowerCase()
            || storedPasswordNormalized === hashedPassword.toLowerCase()
            || storedPasswordNormalized === legacyHash.toLowerCase());
      });

      if (usuarioValido) {
        const usuarioStatus = String(usuarioValido.ie_status ?? 'A').toUpperCase();
        if (usuarioStatus === 'B' || usuarioStatus === 'I') {
          console.warn("[Login] usuário bloqueado/inativo", {
            normalizedUsername,
            usuarioStatus,
          });
          setLoginWarning(usuarioStatus === 'B' ? "Usuário bloqueado." : "Usuário inativo.");
          setIsLoginLoading(false);
          return;
        }

        // Verifica se o usuário possui ao menos um perfil vinculado.
        const perfisVinculados = parsePerfisConfig(usuarioValido.config_perfis);
        if (perfisVinculados.length === 0) {
          console.warn("[Login] usuário sem perfil vinculado", { normalizedUsername });
          setLoginError("O usuário não possui um perfil.");
          setIsLoginLoading(false);
          return;
        }

        window.setTimeout(() => {
          setCurrentUser(usuarioValido);
          setIsAuthenticated(true);
          setIsLoginLoading(false);
        }, 250);
        return;
      }

      console.warn("[Login] usuário/senha inválidos", {
        normalizedUsername,
        hashedPassword,
      });
      setLoginError("Usuário ou senha incorretos");
    } catch (error) {
      console.error("[Login] erro ao carregar usuários", error);
      setLoginError("Erro ao autenticar. Veja o console para detalhes.");
    }

    setIsLoginLoading(false);
  }

  function handleLogout() {
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignora */
    }
    setIsAuthenticated(false);
    setIsLoginLoading(false);
    setIsUserMenuOpen(false);
    setIsUserMenuClosing(false);
    setCurrentUser(null);
    setLoginError(null);
    setLoginWarning(null);
    setMessage("");
    // Reseta os dropdowns para "---" ao sair
    setAdminManageSelection('');
    setCgManageSelection('');
    setPjManageSelection('');
    setAlunoManageSelection('');
    setAtivoManageSelection('');
    setRelatorioManageSelection('');
    setAdminInteracted(false);
    setCgInteracted(false);
    setPjInteracted(false);
    setAlunoInteracted(false);
    setAtivoInteracted(false);
    setRelatorioInteracted(false);
    setRelatorioParamValues({});
  }

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    try {
      window.localStorage.setItem(getDarkModeKey(currentUser?.id), next ? "1" : "0");
    } catch {
      /* storage indisponível */
    }
    if (currentUser?.id) {
      const config_tema = next ? 'E' : 'C';
      atualizarPreferenciaTema(currentUser.id, config_tema)
        .then(() => {
          setCurrentUser((u) => (u ? { ...u, config_tema } : u));
        })
        .catch((err) => {
          console.error('Erro ao salvar preferência de tema no banco', err);
        });
    }
  }

  function handlePfColumnsChange(config: ColunasConfig) {
    if (!currentUser?.id) return;
    const serialized = serializeColunasConfig(config.order, config.widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_pessoa_fisica: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_pessoa_fisica: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Pessoas Físicas)', err);
      });
  }

  function handlePjColumnsChange(config: ColunasConfig) {
    if (!currentUser?.id) return;
    const serialized = serializeColunasConfig(config.order, config.widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_pessoa_juridica: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_pessoa_juridica: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Pessoas Jurídicas)', err);
      });
  }

  function handleAlunoColumnsChange(config: ColunasConfig) {
    if (!currentUser?.id) return;
    const serialized = serializeColunasConfig(config.order, config.widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_aluno: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_aluno: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Alunos)', err);
      });
  }

  function handleAtivoColumnsChange(config: ColunasConfig) {
    if (!currentUser?.id) return;
    const serialized = serializeColunasConfig(config.order, config.widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_pat_ativo: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_pat_ativo: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Ativos)', err);
      });
  }

  function handleManutencaoColumnsChange(config: ColunasConfig) {
    if (!currentUser?.id) return;
    const serialized = serializeColunasConfig(config.order, config.widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_pat_manutencao: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_pat_manutencao: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Manutenções)', err);
      });
  }

  function handleAdminColumnsChange(config: ColunasConfig) {
    if (!currentUser?.id) return;
    const serialized = serializeColunasConfig(config.order, config.widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_as_usuario: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_as_usuario: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Usuários)', err);
      });
  }

  function handlePerfilColumnsChange(config: ColunasConfig) {
    if (!currentUser?.id) return;
    const serialized = serializeColunasConfig(config.order, config.widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_as_perfil: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_as_perfil: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Perfis)', err);
      });
  }

  function handleRelatorioListaColumnsChange(order: string[], widths: Record<string, number>) {
    if (!currentUser?.id) return;
    const serialized = serializeStringColunasConfig(order, widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_relatorio_lista: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_relatorio_lista: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Relatório Lista)', err);
      });
  }

  function handleRelatorioDadosColumnsChange(order: string[], widths: Record<string, number>) {
    if (!currentUser?.id) return;
    const serialized = serializeStringColunasConfig(order, widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_relatorio_dados: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_relatorio_dados: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Relatório Dados)', err);
      });
  }

  function handleRelatorioFiltrosColumnsChange(order: string[], widths: Record<string, number>) {
    if (!currentUser?.id) return;
    const serialized = serializeStringColunasConfig(order, widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_relatorio_filtros: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_relatorio_filtros: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Relatório Filtros)', err);
      });
  }

  function handleRelatorioOrdenacaoColumnsChange(order: string[], widths: Record<string, number>) {
    if (!currentUser?.id) return;
    const serialized = serializeStringColunasConfig(order, widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_relatorio_ordenacao: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_relatorio_ordenacao: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Relatório Ordenação)', err);
      });
  }

  function handleRelatorioColumnsChange(order: string[], widths: Record<string, number>) {
    if (!currentUser?.id) return;
    const serialized = serializeStringColunasConfig(order, widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_relatorio: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_relatorio: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Relatório)', err);
      });
  }

  function handleRelatorioBandasColumnsChange(order: string[], widths: Record<string, number>) {
    if (!currentUser?.id) return;
    const serialized = serializeStringColunasConfig(order, widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_relatorio_bandas: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_relatorio_bandas: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Relatório Bandas)', err);
      });
  }

  async function openRelatorioAuditModal(relatorioId?: string | null, bandaId?: string | null) {
    if (!relatorioId) return;
    setAuditDocumentType('relatorio' as any);
    setRelatorioAuditBandaId(bandaId ?? null);
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const logs = await fetchAuditByDocumentId('relatorio', relatorioId);
      setAuditLogs(logs);
    } catch (e) {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  function handleCgColumnsChange(config: ColunasConfig) {
    if (!currentUser?.id) return;
    const serialized = serializeColunasConfig(config.order, config.widths);
    atualizarPreferenciasUsuario(currentUser.id, { [cgConfigKey]: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, [cgConfigKey]: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Cadastros Gerais)', err);
      });
  }

  /* ── Ordenar funções do menu lateral (apenas com o menu aberto) ── */
  function handleSectionDragStart(section: SectionType) {
    if (!isSidebarOpen) return;
    draggedRef.current = true;
    setDragSection(section);
  }

  function handleSectionDragOver(section: SectionType) {
    if (!isSidebarOpen || !dragSection) return;
    setDragOverSection(section);
  }

  function handleSectionDrop(target: SectionType) {
    const from = dragSection;
    setDragSection(null);
    setDragOverSection(null);
    if (!isSidebarOpen || !from || from === target) return;

    const next = [...menuOrder];
    const fromIndex = next.indexOf(from);
    const toIndex = next.indexOf(target);
    next.splice(fromIndex, 1);
    next.splice(toIndex, 0, from);
    setMenuOrder(next);
    persistMenuOrder(next);
  }

  function handleSectionDragEnd() {
    draggedRef.current = false;
    setDragSection(null);
    setDragOverSection(null);
  }

  function persistMenuOrder(order: SectionType[]) {
    if (!currentUser?.id) return;
    const serialized = serializeMenuOrder(order);
    atualizarPreferenciasUsuario(currentUser.id, { config_ordem_menu_lateral: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_ordem_menu_lateral: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar ordem do menu', err);
      });
  }

  /* ================================================================ */
  /*  Render principal                                                */
  /* ================================================================ */

  if (sessionRestoring) {
    return (
      <div className={`relative min-h-screen overflow-hidden ${darkMode ? "dark bg-[#18181b]" : "bg-white"}`}>
        <LoadingModal open={true} message="Restaurando sessão..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-white">
        <LoginScreen
          onLogin={handleLogin}
          errorMessage={loginError}
          onClearError={() => setLoginError(null)}
          warningMessage={loginWarning}
          onClearWarning={() => setLoginWarning(null)}
          isLoading={isLoginLoading}
        />

        {isLoginLoading && <LoadingModal open={true} message="Validando login..." />}
      </div>
    );
  }

  return (
    <div className={`relative h-screen overflow-hidden animate-fade-in ${darkMode ? "dark bg-[#18181b] text-slate-200" : "bg-white text-slate-800"}`}>
      {/* Overlay do sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Menu de contexto */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          state={contextMenu}
          showView={podeVerNoContexto()}
          onView={() => {
            if (contextMenu.section === 'pessoaFisica') {
              if (pjManageSelection === 'pessoasJuridicas') {
                openPjEditForm(contextMenu.item as PessoaJuridica);
              } else {
                openEditForm(contextMenu.item as PessoaFisica);
              }
            } else if (contextMenu.section === 'administracaoSistema') {
              if (adminManageSelection === 'perfis') {
                openPerfilEditForm(contextMenu.item as Perfil);
              } else {
                openAdminEditForm(contextMenu.item as Usuario);
              }
            } else if (contextMenu.section === 'estruturaAcademica') {
              if (alunoManageSelection === 'colaboradores') {
                openColaboradorEditForm(contextMenu.item as unknown as Colaborador);
              } else {
                openAlunoEditForm(contextMenu.item as Aluno);
              }
            } else if (contextMenu.section === 'patrimonio') {
              openAtivoEditForm(contextMenu.item as Ativo);
            } else if (contextMenu.section === 'relatorio') {
              openRelatorioEditForm(contextMenu.item as Relatorio);
            } else {
              openCgEditForm(contextMenu.item as Sexo | EstadoCivil | CorRaca | Profissao | OrgaoEmissor | Logradouro | GrauParentesco | Cargo | VinculoContratual | Localizacao | Marca | CategoriaAtivo);
            }
            setContextMenu(null);
          }}
          showChangePassword={
            contextMenu.section === 'administracaoSistema' &&
            adminManageSelection === 'usuarios' &&
            !isProtectedAdminItem &&
            permissoesAdmin.alterarSenhaUsuario
          }
          onChangePassword={() => {
            if (contextMenu.section === 'administracaoSistema') {
              openChangePasswordModal(contextMenu.item as Usuario);
            }
            setContextMenu(null);
          }}
          showChangeIngresso={contextMenu.section === 'estruturaAcademica' && alunoManageSelection === 'alunos' && permissoesEA.alterarDataIngresso}
          onChangeIngresso={() => {
            if (contextMenu.section === 'estruturaAcademica' && alunoManageSelection === 'alunos') {
              openAlterarIngressoModal(contextMenu.item as Aluno);
            }
            setContextMenu(null);
          }}
          showChangeStatus={
            contextMenu.section === 'estruturaAcademica' && alunoManageSelection === 'alunos' && permissoesEA.alterarStatusAluno
          }
          onChangeStatus={() => {
            if (contextMenu.section === 'estruturaAcademica' && alunoManageSelection === 'alunos') {
              openAlterarStatusModal(contextMenu.item as Aluno);
            }
            setContextMenu(null);
          }}
          customItems={(() => {
            if (contextMenu.section === 'patrimonio' && ativoManageSelection === 'ativos') {
              const currentStatus = (contextMenu.item as Ativo)?.ie_status ?? '';
              const items: { label: string; onClick?: () => void; children?: { label: string; onClick: () => void }[] }[] = [];
              const isDescartadoForGerar = currentStatus === 'D';
              if (isDescartadoForGerar ? permissoesPatrimonio.gerarCodigoPatrimonioDescartado : permissoesPatrimonio.gerarCodigoPatrimonio) {
                items.push({ label: 'Gerar código de patrimônio', onClick: () => { handleGerarCodigoPatrimonio(contextMenu.item as Ativo); setContextMenu(null); } });
              }
              const isDescartado = currentStatus === 'D';
              const podeAlterarStatus = !isDescartado || permissoesPatrimonio.alterarStatusDescartado;
              if (currentStatus === 'M' && permissoesPatrimonio.concluirManutencao) {
                items.push({ label: 'Concluir manutenção', onClick: () => { openConcluirManutModalFromAtivo(contextMenu.item as Ativo); setContextMenu(null); } });
              }
              const statusChildren: { label: string; onClick: () => void }[] = [];
              if (podeAlterarStatus && permissoesPatrimonio.mudarParaOperacional && currentStatus !== 'O') {
                statusChildren.push({ label: 'Operacional', onClick: () => { openAtivoStatusModal(contextMenu.item as Ativo, 'O'); setContextMenu(null); } });
              }
              if (podeAlterarStatus && permissoesPatrimonio.enviarParaManutencao && currentStatus !== 'M') {
                statusChildren.push({ label: 'Enviar para manutenção', onClick: () => { openEnviarManutModal(contextMenu.item as Ativo); setContextMenu(null); } });
              }
              if (podeAlterarStatus && permissoesPatrimonio.moverParaEstoque && currentStatus !== 'E') {
                statusChildren.push({ label: 'Mover para o estoque', onClick: () => { openAtivoStatusModal(contextMenu.item as Ativo, 'E'); setContextMenu(null); } });
              }
              if (permissoesPatrimonio.descartarAtivo && !isDescartado) {
                statusChildren.push({ label: 'Descartar', onClick: () => { openAtivoStatusModal(contextMenu.item as Ativo, 'D'); setContextMenu(null); } });
              }
              if (statusChildren.length > 0 && currentStatus !== 'M') {
                items.push({ label: 'Status', children: statusChildren });
              }
              return items.length > 0 ? items : undefined;
            }
            if (contextMenu.section === 'patrimonio' && ativoManageSelection === 'manutencoes') {
              const items: { label: string; onClick: () => void }[] = [];
              if (permissoesPatrimonio.verManutencao) {
                items.push({ label: 'Ver', onClick: () => { openManutencaoEditForm(contextMenu.item as Manutencao); setContextMenu(null); } });
              }
              const manutItem = contextMenu.item as Manutencao;
              if (manutItem.ie_status_manutencao === 'E' && permissoesPatrimonio.concluirManutencaoRegistro) {
                items.push({ label: 'Concluir manutenção', onClick: () => { openConcluirManutModalFromManut(manutItem); setContextMenu(null); } });
              }
              if (manutItem.ie_status_manutencao === 'E' && permissoesPatrimonio.cancelarManutencao) {
                items.push({ label: 'Cancelar manutenção', onClick: () => { openCancelarManutModal(manutItem); setContextMenu(null); } });
              }
              if (permissoesPatrimonio.excluirManutencao) {
                items.push({ label: 'Excluir', onClick: () => { handleManutencaoDelete((contextMenu.item as Manutencao).id!); setContextMenu(null); } });
              }
              return items.length > 0 ? items : undefined;
            }
            if (contextMenu.section === 'estruturaAcademica' && alunoManageSelection === 'colaboradores') {
              const items: { label: string; onClick: () => void }[] = [];
              if (permissoesEA.alterarDataAdmissao) {
                items.push({ label: 'Alterar data de admissão', onClick: () => { openAlterarAdmissaoModal(contextMenu.item as unknown as Colaborador); setContextMenu(null); } });
              }
              if (permissoesEA.alterarStatusColaborador) {
                items.push({ label: 'Alterar status', onClick: () => { openAlterarStatusColaboradorModal(contextMenu.item as unknown as Colaborador); setContextMenu(null); } });
              }
              return items.length > 0 ? items : undefined;
            }
            if (contextMenu.section === 'relatorio') {
              const items: { label: string; onClick: () => void }[] = [];
              items.push({ label: 'Gerar relatório', onClick: () => { handleRelatorioGerar(contextMenu.item as Relatorio); setContextMenu(null); } });
              items.push({ label: 'Duplicar', onClick: () => { handleRelatorioDuplicate(contextMenu.item as Relatorio); setContextMenu(null); } });
              return items;
            }
            return undefined;
          })()}
          onDelegateFunctions={
            contextMenu.section === 'administracaoSistema' &&
            adminManageSelection === 'perfis' &&
            !isProtectedAdminItem &&
            permissoesAdmin.delegarFuncoesPerfil
              ? () => {
                  openDelegateFuncoesModal(contextMenu.item as Perfil);
                  setContextMenu(null);
                }
              : undefined
          }
          onDuplicate={
            contextMenu.section === 'administracaoSistema' &&
            adminManageSelection === 'perfis' &&
            !isProtectedAdminItem &&
            permissoesAdmin.duplicarPerfil
              ? () => {
                  openDuplicatePerfilModal(contextMenu.item as Perfil);
                  setContextMenu(null);
                }
              : undefined
          }
          onDelegatePerfis={
            contextMenu.section === 'administracaoSistema' &&
            adminManageSelection === 'usuarios' &&
            !isProtectedAdminItem &&
            permissoesAdmin.delegarPerfisUsuario
              ? () => {
                  openDelegatePerfisModal(contextMenu.item as Usuario);
                  setContextMenu(null);
                }
              : undefined
          }
          showDelete={podeExcluirNoContexto()}
          onDelete={() => {
            if (contextMenu.section === 'pessoaFisica') {
              if (pjManageSelection === 'pessoasJuridicas') {
                const pj = contextMenu.item as PessoaJuridica;
                if (pj.id) {
                  setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${pj.nr_sequencia}?`);
                  setConfirmDeleteAction(() => () => handlePjDelete(pj.id as string));
                  setConfirmDeleteOpen(true);
                }
              } else {
                const pf = contextMenu.item as PessoaFisica;
                if (pf.id) {
                  setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${pf.nr_sequencia}?`);
                  setConfirmDeleteAction(() => () => handleDelete(pf.id as string));
                  setConfirmDeleteOpen(true);
                }
              }
            } else if (contextMenu.section === 'administracaoSistema') {
              if (adminManageSelection === 'perfis') {
                const perfil = contextMenu.item as Perfil;
                if (perfil.id) {
                  setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${perfil.nr_sequencia}?`);
                  setConfirmDeleteAction(() => () => handlePerfilDelete(perfil.id as string));
                  setConfirmDeleteOpen(true);
                }
              } else {
                const usuario = contextMenu.item as Usuario;
                if (usuario.id) {
                  setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${usuario.nr_sequencia}?`);
                  setConfirmDeleteAction(() => () => handleAdminDelete(usuario.id as string));
                  setConfirmDeleteOpen(true);
                }
              }
            } else if (contextMenu.section === 'estruturaAcademica') {
              if (alunoManageSelection === 'colaboradores') {
                const colaborador = contextMenu.item as unknown as Colaborador;
                if (colaborador.id) {
                  setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${colaborador.nr_sequencia}?`);
                  setConfirmDeleteAction(() => () => handleColaboradorDelete(colaborador.id as string));
                  setConfirmDeleteOpen(true);
                }
              } else {
                const aluno = contextMenu.item as Aluno;
                if (aluno.id) {
                  setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${aluno.nr_sequencia}?`);
                  setConfirmDeleteAction(() => () => handleAlunoDelete(aluno.id as string));
                  setConfirmDeleteOpen(true);
                }
              }
            } else if (contextMenu.section === 'patrimonio') {
              const ativo = contextMenu.item as Ativo;
              if (ativo.id) {
                setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${ativo.nr_sequencia}?`);
                setConfirmDeleteAction(() => () => handleAtivoDelete(ativo.id as string));
                setConfirmDeleteOpen(true);
              }
            } else if (contextMenu.section === 'relatorio') {
              const rel = contextMenu.item as Relatorio;
              if (rel.id) {
                setConfirmDeleteMessage(`Deseja mesmo excluir o relatório ${rel.nr_sequencia}?`);
                setConfirmDeleteAction(() => () => handleRelatorioDelete(rel.id as string));
                setConfirmDeleteOpen(true);
              }
            } else {
              const cg = contextMenu.item as Sexo | EstadoCivil | CorRaca | Profissao | OrgaoEmissor | Logradouro | GrauParentesco | Cargo | VinculoContratual | Localizacao | Marca | CategoriaAtivo;
              if (cg.id) {
                setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${cg.nr_sequencia}?`);
                setConfirmDeleteAction(() => () => handleCgDelete(cg.id as string));
                setConfirmDeleteOpen(true);
              }
            }
            setContextMenu(null);
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-[#004a7a] bg-[#003056] shadow-xl shadow-black/20 transition-all duration-300 ease-out ${
          isSidebarOpen ? "w-[220px]" : "w-12"
        }`}
      >
        <div
          className="relative flex items-center border-b border-[#004a7a] cursor-pointer select-none outline-none"
          style={{ height: "44px" }}
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsSidebarOpen((prev) => !prev);
            }
          }}
          aria-label="Alternar menu"
        >
          <div className="absolute left-6 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center">
            <Image
              src="/Logo.png"
              alt="Quasar"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
          </div>
          <div
            className={`h-7 flex items-center overflow-hidden transition-all duration-300 ease-out ml-[46px] ${
              isSidebarOpen ? "max-w-[100px] opacity-100" : "max-w-0 opacity-0"
            }`}
          >
            <span className="text-sm font-semibold leading-none text-white whitespace-nowrap">
              Quasar
            </span>
          </div>
        </div>

        <nav className="mt-2 flex flex-col gap-0.5 px-1">
          {menuOrder.filter((section) => allowedSections.includes(section)).map((section) => {
            const def = SECTION_DEFS[section];
            const isActive = activeSection === section;
            const isDragging = dragSection === section;
            const isDropTarget = dragOverSection === section && dragSection !== null && dragSection !== section;
            return (
              <button
                key={section}
                type="button"
                draggable={isSidebarOpen}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", section);
                  handleSectionDragStart(section);
                }}
                onDragOver={(e) => {
                  if (!isSidebarOpen || !dragSection) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  handleSectionDragOver(section);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  draggedRef.current = false;
                  handleSectionDrop(section);
                }}
                onDragEnd={handleSectionDragEnd}
                className={`relative group flex items-center rounded-[3px] px-1.5 py-1.5 text-blue-200 transition hover:bg-[#004a7a] focus:bg-[#004a7a] outline-none ${
                  isSidebarOpen ? "justify-start gap-2.5 cursor-grab active:cursor-grabbing" : "justify-center gap-0 cursor-pointer"
                } ${isActive ? 'bg-[#004a7a]' : ''} ${isDragging ? 'opacity-50' : ''} ${isDropTarget ? 'ring-2 ring-inset ring-[#2cc958]' : ''}`}
                onClick={() => {
                  if (draggedRef.current) return;
                  setContextMenu(null);
                  if (section === activeSection) {
                    // Clique na função já ativa: volta para a listagem.
                    setView('list');
                    return;
                  }
                  setActiveSection(section);
                  // Ao voltar para uma função, restaura a tela em que o usuário
                  // estava (formulário aberto, se houver) em vez de sempre cair
                  // na listagem de registros.
                  setView(sectionViews[section] ?? 'list');
                }}
                aria-label={def.label}
              >
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[3px] bg-white/15 text-white">
                  {def.icon}
                </span>
                <span
                  className={`h-7 flex items-center overflow-hidden whitespace-pre transition-all duration-300 ease-out ${
                    isSidebarOpen
                      ? `${def.labelMaxW} opacity-100`
                      : "max-w-0 opacity-0"
                  }`}
                >
                  <span className="text-sm leading-none text-white">
                    {def.label}
                  </span>
                </span>
                {isSidebarOpen && (
                  <span className="ml-auto flex h-4 w-4 shrink-0 items-center justify-center text-white/40 transition group-hover:text-white/70">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="9" cy="12" r="1.4" />
                      <circle cx="15" cy="12" r="1.4" />
                      <circle cx="9" cy="6" r="1.4" />
                      <circle cx="15" cy="6" r="1.4" />
                      <circle cx="9" cy="18" r="1.4" />
                      <circle cx="15" cy="18" r="1.4" />
                    </svg>
                  </span>
                )}
                {!isSidebarOpen && (
                  <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 rounded bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg shadow-black/25 whitespace-nowrap group-hover:block">
                    {def.label}
                    <span className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rotate-45 bg-slate-900" />
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[#004a7a] px-1 py-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (isUserMenuOpen) {
                  setIsUserMenuClosing(true);
                  window.setTimeout(() => {
                    setIsUserMenuOpen(false);
                    setIsUserMenuClosing(false);
                  }, 220);
                } else {
                  setIsUserMenuClosing(false);
                  setIsUserMenuOpen(true);
                }
              }}
              className={`flex w-full items-center rounded-[3px] px-1.5 py-1.5 text-blue-200 transition hover:bg-[#004a7a] focus:bg-[#004a7a] cursor-pointer outline-none ${
                isSidebarOpen ? "justify-start gap-2.5" : "justify-center gap-0"
              } ${isUserMenuOpen ? "bg-[#004a7a]" : ""}`}
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[3px] bg-white/15 text-white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <span className={`ml-0 h-7 flex items-center overflow-hidden whitespace-pre transition-all duration-300 ease-out ${
                isSidebarOpen ? "max-w-[180px] opacity-100" : "max-w-0 opacity-0"
              }`}>
                <span className="text-sm leading-none text-white">
                  {currentUser?.ds_usuario_alternativo || currentUser?.ds_usuario || "Usuário"}
                </span>
              </span>
            </button>

            {(isUserMenuOpen || isUserMenuClosing) && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/40"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsUserMenuClosing(false);
                  }}
                />
                <div
                  className="fixed bottom-4 left-4 z-50 origin-bottom-left max-w-[320px] w-auto inline-block rounded-[2px] bg-[#003056] p-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.16)] overflow-visible"
                  style={{ animation: isUserMenuClosing ? "popupClose 220ms cubic-bezier(0.16, 1, 0.3, 1) both" : "popupOpen 220ms cubic-bezier(0.16, 1, 0.3, 1) both" }}
                >
                  {/* Canto superior: switch à esquerda, sair encostado na borda direita */}
                  <div className="-mr-[10px] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={toggleDarkMode}
                      className="flex cursor-pointer items-center rounded-[2px] bg-transparent text-white transition outline-none"
                      aria-pressed={darkMode}
                    >
                      <span className="flex h-5 w-9 shrink-0 items-center rounded-full bg-[#2cc958] p-[2px] transition-colors duration-300">
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full shadow transition-transform duration-300 ease-out bg-[#27272a] ${
                            darkMode ? "translate-x-4" : "translate-x-0"
                          }`}
                        >
                          {darkMode ? (
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="text-[#003056]">
                              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                          ) : (
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#e4e4e7]">
                              <circle cx="12" cy="12" r="4" />
                              <path d="M12 2v2" />
                              <path d="M12 20v2" />
                              <path d="m4.93 4.93 1.41 1.41" />
                              <path d="m17.66 17.66 1.41 1.41" />
                              <path d="M2 12h2" />
                              <path d="M20 12h2" />
                              <path d="m6.34 17.66-1.41 1.41" />
                              <path d="m19.07 4.93-1.41 1.41" />
                            </svg>
                          )}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-[2px] bg-transparent text-white hover:text-[#2cc958] outline-none"
                      aria-label="Sair"
                    >
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <path d="m16 17 5-5-5-5" />
                        <path d="M21 12H9" />
                      </svg>
                    </button>
                  </div>

                  {/* Avatar e nomes */}
                  <div className="my-3 flex flex-col items-center gap-3">
                    <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                      <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div className="min-w-0 text-center">
                      <p className="text-[15px] font-semibold text-white">
                        {currentUserPersonName}
                      </p>
                      <p className="text-sm text-white/70">
                        {currentUser?.ds_usuario_alternativo || currentUser?.ds_usuario || "Usuário"}
                      </p>
                    </div>
                  </div>

                  {/* Perfil ativo (alternância entre perfis vinculados) */}
                  {usuarioPerfisVinculados.length > 0 && (
                    <div className="mb-1 w-full">
                      <Select
                        value={String(activePerfilSequencia ?? usuarioPerfisVinculados[0].nr_sequencia)}
                        onChange={(v) => {
                          const nr = Number(v);
                          if (Number.isFinite(nr)) handleActivePerfilChange(nr);
                        }}
                        options={usuarioPerfisVinculados.map((p) => ({
                          value: String(p.nr_sequencia),
                          label: p.ds_perfil ?? '',
                        }))}
                        showPlaceholder={false}
                        theme="sidebar"
                        className="!bg-[#1A4567] !text-white !border-[#1A4567] !rounded-[2px] text-center"
                        dropdownClassName="!bg-[#003056] !border-[#1A4567] !shadow-[0_-4px_12px_rgba(0,0,0,0.25)] !rounded-[2px] !text-white !overflow-hidden"
                        optionClassName="!bg-[#003056] hover:!bg-[#1A4567] !text-white !rounded-[2px] !mx-[2px] !my-[1px]"
                        absolute
                      />
                    </div>
                  )}

                  {/* Alterar senha, Base de Conhecimento, Central de Suporte e Política de Privacidade */}
                  <div className="mt-8 flex flex-col gap-2">
                    {!isAdministrador && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsUserMenuClosing(false);
                          if (currentUser) openChangePasswordModal(currentUser, true);
                        }}
                        className="flex w-full cursor-pointer items-center justify-center rounded-[2px] bg-[#1A4567] px-[7px] py-[5px] text-[13px] text-white transition hover:bg-[#173d5c] focus:bg-[#173d5c] outline-none"
                      >
                        Alterar senha
                      </button>
                    )}
                    {currentUser?.ie_base_conhecimento === 'S' && (
                      <button
                        type="button"
                        className="flex w-full cursor-pointer items-center justify-center rounded-[2px] bg-[#1A4567] px-[7px] py-[5px] text-[13px] text-white transition hover:bg-[#173d5c] focus:bg-[#173d5c] outline-none"
                      >
                        Base de Conhecimento
                      </button>
                    )}
                    {currentUser?.ie_central_suporte === 'S' && (
                      <button
                        type="button"
                        className="flex w-full cursor-pointer items-center justify-center rounded-[2px] bg-[#1A4567] px-[7px] py-[5px] text-[13px] text-white transition hover:bg-[#173d5c] focus:bg-[#173d5c] outline-none"
                      >
                        Central de Suporte
                      </button>
                    )}
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center justify-center rounded-[2px] bg-[#1A4567] px-[7px] py-[5px] text-[13px] text-white transition hover:bg-[#173d5c] focus:bg-[#173d5c] outline-none"
                    >
                      Política de Privacidade
                    </button>
                  </div>

                  {/* Versão do sistema */}
                  <div className="mt-4 flex flex-col items-start gap-1 text-[11px]" style={{ color: '#fff' }}>
                    <span>
                      <span className="font-semibold">Versão:</span> {SYSTEM_VERSION}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div style={{ marginLeft: '3rem' }} className="h-full flex flex-col overflow-hidden">
        <div
          className="w-full flex-1 flex flex-col min-h-0 px-[15px] py-[15px]"
          onContextMenu={openFormContextMenu}
        >
          {allowedSections.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-slate-500">Nenhuma função foi liberada para o seu usuário. Contate o administrador.</p>
            </div>
          ) : view === "list" ? (
            activeSection === "pessoaFisica" ? (
              pjManageSelection === 'pessoasJuridicas' ? (
                <PessoaJuridicaListView
                  message={message}
                  loading={loading}
                  pessoasJuridicas={filteredSortedPessoasJuridicas}
                  openNewForm={handlePjNewForm}
                  openEditForm={openPjEditForm}
                  openFilter={openPjFilterModal}
                  handleDelete={handlePjDelete}
                  setContextMenu={setContextMenu}
                  selectOptions={PJ_SELECT_OPTIONS}
                  manageSelection={pjManageSelection}
                  onManageSelectionChange={handlePjManageSelectionChange}
                  allowedSubmodulos={allowedPessoaSubmodulos}
                  sortColumn={pjSortColumn}
                  sortAsc={pjSortAsc}
                  onSortChange={handlePjSortChange}
                  initialColumns={pjColunasConfig}
                  onColumnsChange={handlePjColumnsChange}
                  columnLookups={pjCgLookups}
                />
              ) : (
                <PessoaFisicaListView
                  message={message}
                  loading={loading}
                  pessoasFisicas={filteredSortedPessoasFisicas}
                  openNewForm={handlePessoaNewForm}
                  openEditForm={openEditForm}
                  openFilter={openFilterModal}
                  handleDelete={handleDelete}
                  setContextMenu={setContextMenu}
                  selectOptions={PJ_SELECT_OPTIONS}
                  manageSelection={pjManageSelection}
                  onManageSelectionChange={handlePjManageSelectionChange}
                  allowedSubmodulos={allowedPessoaSubmodulos}
                  sortColumn={sortColumn}
                  sortAsc={sortAsc}
                  onSortChange={handleSortChange}
                  initialColumns={pfColunasConfig}
                  onColumnsChange={handlePfColumnsChange}
                  columnLookups={pfCgLookups}
                />
              )
            ) : activeSection === "administracaoSistema" ? (
            adminManageSelection === 'campos' ? (
              <CamposView
                perfis={perfis}
                onChangeStatus={handleCamposStatusChange}
                manageSelection={adminManageSelection}
                onManageSelectionChange={handleAdminManageSelectionChange}
                allowedSubmodulos={allowedAdminSubmodulos}
                podeAlterarStatusCampo={permissoesAdmin.alterarStatusCampo}
                selectedPerfilId={camposPerfilId}
                onSelectedPerfilIdChange={setCamposPerfilId}
                selectedFuncao={camposFuncao}
                onSelectedFuncaoChange={setCamposFuncao}
                funcaoJaSelecionada={camposFuncaoJaSelecionada}
                onFuncaoJaSelecionadaChange={setCamposFuncaoJaSelecionada}
              />
            ) : adminManageSelection === 'usuarios' ? (
                <AdministracaoSistemaListView
                  message={message}
                  loading={loading}
                  usuarios={filteredSortedUsuarios}
                  pessoasFisicas={pessoasFisicas}
                  openNewForm={handleAdminNewForm}
                  openEditForm={openAdminEditForm}
                  setContextMenu={setContextMenu}
                  sortColumn={adminSortColumn}
                  sortAsc={adminSortAsc}
                  onSortChange={handleAdminSortChange}
                  manageSelection={adminManageSelection}
                  onManageSelectionChange={handleAdminManageSelectionChange}
                  allowedSubmodulos={allowedAdminSubmodulos}
                  openFilter={openAdminFilterModal}
                  initialColumns={adminColunasConfig}
                  onColumnsChange={handleAdminColumnsChange}
                />
              ) : (
                <PerfilListView
                  message={message}
                  loading={loading}
                  perfis={filteredSortedPerfis}
                  openNewForm={handlePerfilNewForm}
                  openEditForm={openPerfilEditForm}
                  setContextMenu={setContextMenu}
                  sortColumn={perfilSortColumn}
                  sortAsc={perfilSortAsc}
                  onSortChange={handlePerfilSortChange}
                  manageSelection={adminManageSelection}
                  onManageSelectionChange={handleAdminManageSelectionChange}
                  allowedSubmodulos={allowedAdminSubmodulos}
                  openFilter={openPerfilFilterModal}
                  initialColumns={perfilColunasConfig}
                  onColumnsChange={handlePerfilColumnsChange}
                />
              )
            ) : activeSection === "estruturaAcademica" ? (
              alunoManageSelection === 'alunos' ? (
                <AlunoListView
                  message={message}
                  loading={loading}
                  alunos={filteredSortedAlunos}
                  openNewForm={handleAlunoNewForm}
                  openEditForm={openAlunoEditForm}
                  openFilter={openAlunoFilterModal}
                  handleDelete={handleAlunoDelete}
                  setContextMenu={setContextMenu}
                  selectOptions={EA_SELECT_OPTIONS}
                  manageSelection={alunoManageSelection}
                  onManageSelectionChange={handleAlunoManageSelectionChange}
                  allowedSubmodulos={allowedAlunoSubmodulos}
                  sortColumn={alunoSortColumn}
                  sortAsc={alunoSortAsc}
                  onSortChange={handleAlunoSortChange}
                  initialColumns={alunoColunasConfig}
                  onColumnsChange={handleAlunoColumnsChange}
                  columnLookups={alunoPessoaFisicaLookups}
                />
              ) : (
                <ColaboradorListView
                  message={message}
                  loading={loading}
                  colaboradores={filteredSortedColaboradores}
                  openNewForm={handleColaboradorNewForm}
                  openEditForm={openColaboradorEditForm}
                  openFilter={openColaboradorFilterModal}
                  handleDelete={handleColaboradorDelete}
                  setContextMenu={setContextMenu}
                  selectOptions={EA_SELECT_OPTIONS}
                  manageSelection={alunoManageSelection}
                  onManageSelectionChange={handleAlunoManageSelectionChange}
                  allowedSubmodulos={allowedAlunoSubmodulos}
                  sortColumn={colaboradorSortColumn}
                  sortAsc={colaboradorSortAsc}
                  onSortChange={handleColaboradorSortChange}
                  columnLookups={{
                    nr_seq_pessoa_fisica: Object.fromEntries(pessoasFisicas.map((p) => [p.nr_sequencia, p.ds_nome])),
                    nr_seq_pessoa_juridica: Object.fromEntries(pessoasJuridicas.map((p) => [p.nr_sequencia, p.ds_razao_social])),
                  }}
                />
              )
            ) : activeSection === "patrimonio" ? (
              ativoManageSelection === 'parametrosFuncao' ? (
                <ParametrosDaFuncaoView
                  manageSelection={ativoManageSelection}
                  onManageSelectionChange={handlePatrimonioManageSelectionChange}
                  selectOptions={PATRIMONIO_SELECT_OPTIONS.filter((o) => (o.value !== 'parametrosFuncao' || permissoesPatrimonio.acessarParametrosFuncao) && (o.value !== 'manutencoes' || permissoesPatrimonio.acessarManutencao))}
                  allowedSubmodulos={allowedPatrimonioSubmodulos}
                  onSaveSuccess={(msg) => setMessage(msg)}
                  onSavingChange={setParametrosSaving}
                  createdAt={parametrosAuditInfo.createdAt}
                  updatedAt={parametrosAuditInfo.updatedAt}
                  createdBy={parametrosAuditInfo.createdBy}
                  updatedBy={parametrosAuditInfo.updatedBy}
                  onOpenAudit={openParametrosAuditModal}
                  auditHasDocument={parametrosHasDocument}
                  auditAutor={auditAutor}
                  onAfterSave={(info) => {
                    setParametrosAuditInfo(info);
                    setParametrosHasDocument(true);
                  }}
                />
              ) : ativoManageSelection === 'manutencoes' ? (
                <ManutencaoListView
                  message={message}
                  loading={loading}
                  manutencoes={filteredSortedManutencoes}
                  openNewForm={handleManutencaoNewForm}
                  openEditForm={openManutencaoEditForm}
                  handleDelete={handleManutencaoDelete}
                  setContextMenu={setContextMenu}
                  selectOptions={PATRIMONIO_SELECT_OPTIONS.filter((o) => (o.value !== 'parametrosFuncao' || permissoesPatrimonio.acessarParametrosFuncao) && (o.value !== 'manutencoes' || permissoesPatrimonio.acessarManutencao))}
                  manageSelection={ativoManageSelection}
                  onManageSelectionChange={handlePatrimonioManageSelectionChange}
                  openFilter={openManutencaoFilterModal}
                  allowedSubmodulos={allowedPatrimonioSubmodulos}
                  sortColumn={manutencaoSortColumn}
                  sortAsc={manutencaoSortAsc}
                  onSortChange={handleManutencaoSortChange}
                  initialColumns={manutencaoColunasConfig}
                  onColumnsChange={handleManutencaoColumnsChange}
                  columnLookups={{
                    nr_seq_ativo: Object.fromEntries(ativos.map((a) => [a.nr_sequencia, a.ds_ativo ?? `#${a.nr_sequencia}`])),
                    ...Object.fromEntries([
                      ['nr_seq_prestador_servico', Object.fromEntries(
                        colaboradores.map((c) => {
                          const pf = pessoasFisicas.find((p) => p.nr_sequencia === c.nr_seq_pessoa_fisica);
                          const pj = c.nr_seq_pessoa_juridica ? pessoasJuridicas.find((p) => p.nr_sequencia === c.nr_seq_pessoa_juridica) : undefined;
                          const nome = c.nr_seq_pessoa_juridica && pj ? pj.ds_razao_social : (pf?.ds_nome ?? '');
                          return [c.nr_sequencia, nome];
                        })
                      )],
                      ['nr_seq_pessoa_fisica', Object.fromEntries(
                        colaboradores.map((c) => {
                          const pf = pessoasFisicas.find((p) => p.nr_sequencia === c.nr_seq_pessoa_fisica);
                          const pj = c.nr_seq_pessoa_juridica ? pessoasJuridicas.find((p) => p.nr_sequencia === c.nr_seq_pessoa_juridica) : undefined;
                          const nome = c.nr_seq_pessoa_juridica && pj ? pj.ds_razao_social : (pf?.ds_nome ?? '');
                          return [c.nr_sequencia, nome];
                        })
                      )],
                    ]),
                  }}
                />
              ) : (
              <AtivoListView
                message={message}
                loading={loading}
                ativos={filteredSortedAtivos}
                openNewForm={handleAtivoNewForm}
                openEditForm={openAtivoEditForm}
                handleDelete={handleAtivoDelete}
                setContextMenu={setContextMenu}
                selectOptions={PATRIMONIO_SELECT_OPTIONS.filter((o) => (o.value !== 'parametrosFuncao' || permissoesPatrimonio.acessarParametrosFuncao) && (o.value !== 'manutencoes' || permissoesPatrimonio.acessarManutencao))}
                manageSelection={ativoManageSelection}
                onManageSelectionChange={handlePatrimonioManageSelectionChange}
                openFilter={openAtivoFilterModal}
                allowedSubmodulos={allowedPatrimonioSubmodulos}
                sortColumn={ativoSortColumn}
                sortAsc={ativoSortAsc}
                onSortChange={handleAtivoSortChange}
                initialColumns={ativoColunasConfig}
                onColumnsChange={handleAtivoColumnsChange}
                columnLookups={{
                  nr_seq_categoria: Object.fromEntries(categoriasAtivos.map((c) => [c.nr_sequencia, c.ds_categoria])),
                  nr_seq_localizacao: Object.fromEntries(localizacoes.map((l) => [l.nr_sequencia, l.ds_localizacao])),
                  nr_seq_marca: Object.fromEntries(marcas.map((m) => [m.nr_sequencia, m.ds_marca])),
                }}
              />
              )
            ) : activeSection === "relatorio" ? (
              relatorioView === 'builder' ? (
                <div className="flex flex-col h-full">                   <RelatorioBuilder
                     relatorio={relatorioForm}
                     onSave={handleRelatorioSave}
                     onCancel={closeRelatorioBuilder}
                     onChange={(r) => setRelatorioForm(r)}
                     saving={relatorioSubmitting}
                     manageSelection={relatorioManageSelection}
                     onManageSelectionChange={handleRelatorioManageSelectionChange}
                     allowedSubmodulos={allowedRelatorioSubmodulos}
                     userId={currentUser?.id}
                     initialListaColumns={relatorioListaColunasConfig}
                     onListaColumnsChange={handleRelatorioListaColumnsChange}
                     initialDadosColumns={relatorioDadosColunasConfig}
                     onDadosColumnsChange={handleRelatorioDadosColumnsChange}
                     initialFiltrosColumns={relatorioFiltrosColunasConfig}
                     onFiltrosColumnsChange={handleRelatorioFiltrosColumnsChange}
                     initialOrdenacaoColumns={relatorioOrdenacaoColunasConfig}                      onOrdenacaoColumnsChange={handleRelatorioOrdenacaoColumnsChange}
                      initialBandasColumns={relatorioBandasColunasConfig}
                      onBandasColumnsChange={handleRelatorioBandasColumnsChange}
                      contextMenuItems={relatorioEditingId ? [
                       { label: 'Gerar relatório', onClick: () => { if (relatorioForm) handleRelatorioGerar(relatorioForm); } },
                       { label: 'Duplicar', onClick: () => { if (relatorioForm) handleRelatorioDuplicate(relatorioForm); } },
                       { label: 'Excluir', onClick: () => { if (relatorioEditingId) handleRelatorioDelete(relatorioEditingId); } },
                     ] : []}
                     onPrevRecord={goToPrevRelatorioRecord}
                     onNextRecord={goToNextRelatorioRecord}
                     hasPrevRecord={hasPrevRelatorioRecord}
                     hasNextRecord={hasNextRelatorioRecord}
                     createdAt={relatorioAuditInfo.createdAt}
                     updatedAt={relatorioAuditInfo.updatedAt}
                     createdBy={relatorioAuditInfo.createdBy}
                     updatedBy={relatorioAuditInfo.updatedBy}
                     onOpenAudit={openRelatorioAuditModal}                      onOpenBandaAudit={openRelatorioAuditModal}
                      onBandaSave={handleBandaSave}
                      campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'relatorio')}
                      bandaCampoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'relatorio_bandas')}
                    />
                </div>
              ) : (
                <RelatorioListView
                  loading={loading}
                  relatorios={filteredSortedRelatorios}
                  openNewForm={openRelatorioNewForm}
                  openEditForm={openRelatorioEditForm}
                  handleDelete={handleRelatorioDelete}
                  setContextMenu={setContextMenu}
                  sortColumn={relatorioSortColumn}
                  sortAsc={relatorioSortAsc}
                  onSortChange={handleRelatorioSortChange}
                  manageSelection={relatorioManageSelection}
                  onManageSelectionChange={handleRelatorioManageSelectionChange}
                  allowedSubmodulos={allowedRelatorioSubmodulos}
                  userId={currentUser?.id}
                  initialColumns={relatorioColunasConfig}
                  onColumnsChange={handleRelatorioColumnsChange}
                />
              )
            ) : (
              <CadastroGeralListView
                key={cgManageSelection}
                loading={loading}
                items={filteredSortedCgItems}
                columns={cgColumns}
                formatCellValue={formatCadastroGeralCellValue}
                emptyMessage={cgEmptyMessage}
                selectOptions={CG_SELECT_OPTIONS}
                manageSelection={cgManageSelection}
                onManageSelectionChange={handleCgManageSelectionChange}
                allowedSubmodulos={allowedCgSubmodulos}
                openNewForm={handleCgNewForm}
                openEditForm={openCgEditForm}
                openFilter={openCgFilterModal}
                setContextMenu={setContextMenu}
                sortColumn={cgSortColumn}
                sortAsc={cgSortAsc}
                onSortChange={handleCgSortChange}
                initialColumns={cgColunasConfig}
                onColumnsChange={handleCgColumnsChange}
              />
            )
          ) : activeSection === "pessoaFisica" ? (
            pjManageSelection === 'pessoasJuridicas' ? (
              <PessoaJuridicaFormView
                message={message}
                editingId={pjEditingId}
                sequence={pjEditingId ? (pessoasJuridicas.find((a) => a.id === pjEditingId)?.nr_sequencia ?? null) : null}
                form={pjForm}
                setForm={setPjForm}
                submitting={pjSubmitting}
                handleSubmit={handlePjSubmit}
                goToList={goToPjList}
                createdAt={pjAuditInfo.createdAt}
                updatedAt={pjAuditInfo.updatedAt}
                createdBy={pjAuditInfo.createdBy}
                updatedBy={pjAuditInfo.updatedBy}
                onOpenAudit={openPjAuditModal}
                onPrevRecord={goToPrevPjRecord}
                onNextRecord={goToNextPjRecord}
                hasPrevRecord={hasPrevPjRecord}
                hasNextRecord={hasNextPjRecord}
                cidadeNome={pjCidadeNome}
                onOpenCidadeLookup={openPjCidadeLookup}
                onCidadeCodeChange={handlePjCidadeCodeChange}
                logradouros={pfCgOptions.logradouros}
                estados={estados}
                selectOptions={PJ_SELECT_OPTIONS}
                manageSelection={pjManageSelection}
                onManageSelectionChange={handlePjManageSelectionChange}
                allowedSubmodulos={allowedPessoaSubmodulos}
                campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'pessoa_juridica')}
                campoErros={pjCampoErros}
              />
            ) : (
              <PessoaFisicaFormView
                message={message}
                editingId={editingId}
                sequence={editingId ? (pessoasFisicas.find((a) => a.id === editingId)?.nr_sequencia ?? null) : null}
                form={form}
                setForm={setForm}
                submitting={submitting}
                handleSubmit={handleSubmit}
                goToList={goToList}
                createdAt={auditInfo.createdAt}
                updatedAt={auditInfo.updatedAt}
                createdBy={auditInfo.createdBy}
                updatedBy={auditInfo.updatedBy}
                onOpenAudit={openAuditModal}
                onPrevRecord={goToPrevRecord}
                onNextRecord={goToNextRecord}
                hasPrevRecord={hasPrevRecord}
                hasNextRecord={hasNextRecord}
                sexos={pfCgOptions.sexos}
                estadoCivis={pfCgOptions.estadoCivis}
                coresRacas={pfCgOptions.coresRacas}
                profissoes={pfCgOptions.profissoes}
                orgaosEmissores={pfCgOptions.orgaosEmissores}
                logradouros={pfCgOptions.logradouros}
                estados={estados}
                naturalidadeNome={naturalidadeNome}
                onOpenNaturalidadeLookup={openNaturalidadeLookup}
                onNaturalidadeCodeChange={handleNaturalidadeCodeChange}
                selectOptions={PJ_SELECT_OPTIONS}
                manageSelection={pjManageSelection}
                onManageSelectionChange={handlePjManageSelectionChange}
                allowedSubmodulos={allowedPessoaSubmodulos}
                campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'pessoa_fisica')}
                campoErros={pfCampoErros}
              />
            )
          ) : activeSection === "administracaoSistema" ? (              adminManageSelection === 'campos' ? (
                <CamposView
                  perfis={perfis}
                  onChangeStatus={handleCamposStatusChange}
                  manageSelection={adminManageSelection}
                  onManageSelectionChange={handleAdminManageSelectionChange}
                  allowedSubmodulos={allowedAdminSubmodulos}
                  podeAlterarStatusCampo={permissoesAdmin.alterarStatusCampo}
                  selectedPerfilId={camposPerfilId}
                  onSelectedPerfilIdChange={setCamposPerfilId}
                  selectedFuncao={camposFuncao}
                  onSelectedFuncaoChange={setCamposFuncao}
                  funcaoJaSelecionada={camposFuncaoJaSelecionada}
                  onFuncaoJaSelecionadaChange={setCamposFuncaoJaSelecionada}
                />
              ) : adminManageSelection === 'usuarios' ? (
                <AdministracaoSistemaFormView
                message={message}
                editingId={adminEditingId}
                sequence={adminEditingId ? (usuarios.find((a) => a.id === adminEditingId)?.nr_sequencia ?? null) : null}
                form={adminForm}
                setForm={setAdminForm}
                submitting={adminSubmitting}
                handleSubmit={handleAdminSubmit}
                goToList={goToAdminList}
                createdAt={adminAuditInfo.createdAt}
                updatedAt={adminAuditInfo.updatedAt}
                createdBy={adminAuditInfo.createdBy}
                updatedBy={adminAuditInfo.updatedBy}
                onPrevRecord={goToPrevAdminRecord}
                onNextRecord={goToNextAdminRecord}
                hasPrevRecord={hasPrevAdminRecord}
                hasNextRecord={hasNextAdminRecord}
                pessoaFisicaName={selectedPessoaFisicaName}
                onOpenPessoaFisicaLookup={openPessoaFisicaLookup}
                onViewPessoaFisica={(seq) => openPessoaFisicaView(seq)}
                onOpenAudit={openAdminAuditModal}
                manageSelection={adminManageSelection}
                onManageSelectionChange={handleAdminManageSelectionChange}
                allowedSubmodulos={allowedAdminSubmodulos}
                readOnly={!isAdministrador && adminEditingId ? isAdministradorUsuario(usuarios.find((a) => a.id === adminEditingId)) : false}
                campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'usuario')}
                campoErros={adminCampoErros}
              />
            ) : (
              <PerfilFormView
                message={message}
                editingId={perfilEditingId}
                sequence={perfilEditingId ? (perfis.find((a) => a.id === perfilEditingId)?.nr_sequencia ?? null) : null}
                form={perfilForm}
                setForm={setPerfilForm}
                submitting={perfilSubmitting}
                handleSubmit={handlePerfilSubmit}
                goToList={goToPerfilList}
                createdAt={perfilAuditInfo.createdAt}
                updatedAt={perfilAuditInfo.updatedAt}
                createdBy={perfilAuditInfo.createdBy}
                updatedBy={perfilAuditInfo.updatedBy}
                onPrevRecord={goToPrevPerfilRecord}
                onNextRecord={goToNextPerfilRecord}
                hasPrevRecord={hasPrevPerfilRecord}
                hasNextRecord={hasNextPerfilRecord}
                onOpenAudit={openPerfilAuditModal}
                manageSelection={adminManageSelection}
                onManageSelectionChange={handleAdminManageSelectionChange}
                allowedSubmodulos={allowedAdminSubmodulos}
                readOnly={!isAdministrador && perfilEditingId ? isAdministradorPerfil(perfis.find((a) => a.id === perfilEditingId)) : false}
                campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'perfil')}
                campoErros={perfilCampoErros}
              />
            )            ) : activeSection === "estruturaAcademica" ? (
              alunoManageSelection === 'alunos' ? (
                <AlunoFormView
                  message={message}
                  editingId={alunoEditingId}
                  sequence={alunoEditingId ? (alunos.find((a) => a.id === alunoEditingId)?.nr_sequencia ?? null) : null}
                  form={alunoForm}
                  setForm={setAlunoForm}
                  submitting={alunoSubmitting}
                  handleSubmit={handleAlunoSubmit}
                  goToList={goToAlunoList}
                  createdAt={alunoAuditInfo.createdAt}
                  updatedAt={alunoAuditInfo.updatedAt}
                  createdBy={alunoAuditInfo.createdBy}
                  updatedBy={alunoAuditInfo.updatedBy}
                  onOpenAudit={openAlunoAuditModal}
                  onPrevRecord={goToPrevAlunoRecord}
                  onNextRecord={goToNextAlunoRecord}
                  hasPrevRecord={hasPrevAlunoRecord}
                  hasNextRecord={hasNextAlunoRecord}
                  pessoaFisicaName={selectedAlunoPessoaFisicaName}
                  onOpenPessoaFisicaLookup={() => openAlunoPessoaFisicaLookup('aluno')}
                  onViewPessoaFisica={(seq) => openPessoaFisicaView(seq)}
                  responsaveisNames={selectedAlunoResponsaveisNames}
                  onOpenResponsavelLookup={(index) => openAlunoPessoaFisicaLookup('responsavel', index)}
                  onViewResponsavel={(seq) => openPessoaFisicaView(seq)}
                  grauParentescoOptions={alunoGrauParentescoOptions}
                  selectOptions={EA_SELECT_OPTIONS}
                  manageSelection={alunoManageSelection}
                  onManageSelectionChange={handleAlunoManageSelectionChange}
                  allowedSubmodulos={allowedAlunoSubmodulos}
                  campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'aluno')}
                  campoErros={alunoCampoErros}
                />
              ) : (
                <ColaboradorFormView
                  message={message}
                  editingId={colaboradorEditingId}
                  sequence={colaboradorEditingId ? (colaboradores.find((c) => c.id === colaboradorEditingId)?.nr_sequencia ?? null) : null}
                  form={colaboradorForm}
                  setForm={setColaboradorForm}
                  submitting={colaboradorSubmitting}
                  handleSubmit={handleColaboradorSubmit}
                  goToList={goToColaboradorList}
                  createdAt={colaboradorAuditInfo.createdAt}
                  updatedAt={colaboradorAuditInfo.updatedAt}
                  createdBy={colaboradorAuditInfo.createdBy}
                  updatedBy={colaboradorAuditInfo.updatedBy}
                  onOpenAudit={openColaboradorAuditModal}
                  onPrevRecord={goToPrevColaboradorRecord}
                  onNextRecord={goToNextColaboradorRecord}
                  hasPrevRecord={hasPrevColaboradorRecord}
                  hasNextRecord={hasNextColaboradorRecord}
                  pessoaFisicaName={selectedColaboradorPessoaFisicaName}
                  onOpenPessoaFisicaLookup={() => openAlunoPessoaFisicaLookup('colaborador')}
                  onViewPessoaFisica={(seq) => openPessoaFisicaView(seq)}
                  pessoaJuridicaName={selectedColaboradorPessoaJuridicaName}
                  onOpenPessoaJuridicaLookup={openColaboradorPessoaJuridicaLookup}
                  onViewPessoaJuridica={(seq) => openPessoaJuridicaView(seq)}
                  vinculosContratuais={colaboradorVinculosOptions}
                  selectOptions={EA_SELECT_OPTIONS}
                  manageSelection={alunoManageSelection}
                  onManageSelectionChange={handleAlunoManageSelectionChange}
                  allowedSubmodulos={allowedAlunoSubmodulos}
                  campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'colaborador')}
                  campoErros={colaboradorCampoErros}
                />
              )
            ) : activeSection === "patrimonio" && ativoManageSelection === 'manutencoes' ? (
              <ManutencaoFormView
                message={message}
                editingId={manutencaoEditingId}
                sequence={manutencaoEditingId ? (manutencoes.find((m) => m.id === manutencaoEditingId)?.nr_sequencia ?? null) : null}
                form={manutencaoForm}
                setForm={setManutencaoForm}
                submitting={manutencaoSubmitting}
                handleSubmit={handleManutencaoSubmit}
                goToList={goToManutencaoList}
                createdAt={manutencaoAuditInfo.createdAt}
                updatedAt={manutencaoAuditInfo.updatedAt}
                createdBy={manutencaoAuditInfo.createdBy}
                updatedBy={manutencaoAuditInfo.updatedBy}
                onOpenAudit={openManutencaoAuditModal}
                onPrevRecord={goToPrevManutencaoRecord}
                onNextRecord={goToNextManutencaoRecord}
                hasPrevRecord={hasPrevManutencaoRecord}
                hasNextRecord={hasNextManutencaoRecord}
                ativos={ativos.map((a) => ({ nr_sequencia: a.nr_sequencia, ds_ativo: a.ds_ativo ?? `#${a.nr_sequencia}` }))}
                ativoName={manutencaoAtivoName}
                onOpenAtivoLookup={openManutencaoAtivoLookup}
                onViewAtivo={(seq) => { const a = ativos.find((at) => at.nr_sequencia === seq); if (a) setAtivoView(a); }}
                prestadorName={manutencaoPrestadorName}
                onOpenPrestadorLookup={() => openEnviarManutPrestadorLookup('form')}
                onViewPrestador={(seq) => openColaboradorView(seq)}
                selectOptions={PATRIMONIO_SELECT_OPTIONS.filter((o) => (o.value !== 'parametrosFuncao' || permissoesPatrimonio.acessarParametrosFuncao) && (o.value !== 'manutencoes' || permissoesPatrimonio.acessarManutencao))}
                manageSelection={ativoManageSelection}
                onManageSelectionChange={handlePatrimonioManageSelectionChange}
                allowedSubmodulos={allowedPatrimonioSubmodulos}
                campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'pat_manutencao')}
                campoErros={manutencaoCampoErros}
              />
            ) : activeSection === "patrimonio" ? (
              <AtivoFormView
                message={message}
                editingId={ativoEditingId}
                sequence={ativoEditingId ? (ativos.find((a) => a.id === ativoEditingId)?.nr_sequencia ?? null) : null}
                form={ativoForm}
                setForm={setAtivoForm}
                submitting={ativoSubmitting}
                handleSubmit={handleAtivoSubmit}
                goToList={goToAtivoList}
                createdAt={ativoAuditInfo.createdAt}
                updatedAt={ativoAuditInfo.updatedAt}
                createdBy={ativoAuditInfo.createdBy}
                updatedBy={ativoAuditInfo.updatedBy}
                onOpenAudit={openAtivoAuditModal}
                onPrevRecord={goToPrevAtivoRecord}
                onNextRecord={goToNextAtivoRecord}
                hasPrevRecord={hasPrevAtivoRecord}
                hasNextRecord={hasNextAtivoRecord}
                categoriasAtivos={categoriasAtivos.map((c) => ({ nr_sequencia: c.nr_sequencia, descricao: c.ds_categoria, ie_status: c.ie_status }))}
                localizacoes={localizacoes.map((l) => ({ nr_sequencia: l.nr_sequencia, descricao: l.ds_localizacao, ie_status: l.ie_status }))}
                marcas={marcas.map((m) => ({ nr_sequencia: m.nr_sequencia, descricao: m.ds_marca, ie_status: m.ie_status }))}
                sistemasOperacionais={sistemasOperacionais.filter((s) => s.ie_status === 'A').sort((a, b) => (a.ds_sistema_operacional ?? '').localeCompare(b.ds_sistema_operacional ?? '', 'pt-BR')).map((s) => ({ nr_sequencia: s.nr_sequencia, descricao: s.ds_sistema_operacional }))}
                selectOptions={PATRIMONIO_SELECT_OPTIONS.filter((o) => (o.value !== 'parametrosFuncao' || permissoesPatrimonio.acessarParametrosFuncao) && (o.value !== 'manutencoes' || permissoesPatrimonio.acessarManutencao))}
                manageSelection={ativoManageSelection}
                onManageSelectionChange={handlePatrimonioManageSelectionChange}
                allowedSubmodulos={allowedPatrimonioSubmodulos}
                campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'pat_ativo')}
                campoErros={ativoCampoErros}
                responsaveisNames={selectedAtivoResponsaveisNames}
                onOpenResponsavelLookup={(index) => openAlunoPessoaFisicaLookup('ativo', index)}
                onViewResponsavel={(seq) => openPessoaFisicaView(seq)}
                ultimaManutencaoSeq={ativos.find((a) => a.id === ativoEditingId)?.nr_seq_ultima_manutencao ?? null}
                onViewManutencao={(seq) => openManutencaoView(seq)}
              />
            ) : (
            <CadastroGeralFormView
              key={cgManageSelection}
              editingId={cgEditingId}
              sequence={cgEditingId ? (cgItems.find((a) => a.id === cgEditingId)?.nr_sequencia ?? null) : null}
              form={cgForm}
              setForm={setCgForm}
              submitting={cgSubmitting}
              handleSubmit={handleCgSubmit}
              goToList={goToCgList}
              createdAt={cgAuditInfo.createdAt}
              updatedAt={cgAuditInfo.updatedAt}
              createdBy={cgAuditInfo.createdBy}
              updatedBy={cgAuditInfo.updatedBy}
              onPrevRecord={goToPrevCgRecord}
              onNextRecord={goToNextCgRecord}
              hasPrevRecord={hasPrevCgRecord}
              hasNextRecord={hasNextCgRecord}
              onOpenAudit={openCgAuditModal}
              manageSelection={cgManageSelection}
              onManageSelectionChange={handleCgManageSelectionChange}
              allowedSubmodulos={allowedCgSubmodulos}
              selectOptions={CG_SELECT_OPTIONS}
              fieldInfos={cgFieldInfos}
              descFieldKey={cgDescKey}
              collectionName={cgCollection}
              showCbo={cgKind === 'profissao'}
              showSigla={cgKind === 'orgaoEmissor' || cgKind === 'logradouro'}
              showObservacao={cgKind === 'categoriaAtivo'}
              siglaFieldKey={cgKind === 'orgaoEmissor' ? 'sg_orgao_emissor' : cgKind === 'logradouro' ? 'sg_logradouro' : undefined}
              campoRegras={campoRegrasDaColecao(campoRegrasAtivas, cgCollection)}
              campoErros={cgCampoErros}
            />
          )}
        </div>
      </div>

      {filterModalOpen && view === "list" && activeSection === "pessoaFisica" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeFilterModal} />
          <form onSubmit={handleFilterSubmit} className="relative w-full max-w-[760px] bg-white modal-dark p-0 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Filtro</h2>
              <button
                type="button"
                onClick={closeFilterModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar filtro"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] sm:grid-cols-12 p-[15px]">
              <div className="sm:col-span-2">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Sequência
                </label>
                <input
                  inputMode="numeric"
                  maxLength={10}
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={filterForm.nr_sequencia}
                  onChange={(e) => setFilterForm({ ...filterForm, nr_sequencia: e.target.value })}
                />
              </div>
              <div className="sm:col-span-7">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Nome completo
                </label>
                <input
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={filterForm.ds_nome}
                  onChange={(e) => setFilterForm({ ...filterForm, ds_nome: e.target.value })}
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  CPF
                </label>
                <input
                  inputMode="numeric"
                  maxLength={14}
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={filterForm.nr_cpf}
                  onChange={(e) => setFilterForm({ ...filterForm, nr_cpf: applyCpfMask(e.target.value) })}
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Nascimento (início)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                  value={filterForm.dt_nascimento_inicio}
                  onChange={(e) => setFilterForm({ ...filterForm, dt_nascimento_inicio: applyDateMask(e.target.value) })}
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Nascimento (fim)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                  value={filterForm.dt_nascimento_fim}
                  onChange={(e) => setFilterForm({ ...filterForm, dt_nascimento_fim: applyDateMask(e.target.value) })}
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  E-mail
                </label>
                <input
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={filterForm.ds_email}
                  onChange={(e) => setFilterForm({ ...filterForm, ds_email: e.target.value })}
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Telefone
                </label>
                <input
                  inputMode="numeric"
                  maxLength={15}
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={filterForm.nr_telefone}
                  onChange={(e) => setFilterForm({ ...filterForm, nr_telefone: applyPhoneMask(e.target.value) })}
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Sexo
                </label>
                <Select
                  value={filterForm.nr_seq_sexo}
                  onChange={(v) => setFilterForm({ ...filterForm, nr_seq_sexo: v })}
                  options={[...pfCgOptions.sexos].sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR', { sensitivity: 'base' })).map((o) => ({ value: String(o.nr_sequencia), label: o.descricao }))}
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Estado civil
                </label>
                <Select
                  value={filterForm.nr_seq_estado_civil}
                  onChange={(v) => setFilterForm({ ...filterForm, nr_seq_estado_civil: v })}
                  options={[...pfCgOptions.estadoCivis].sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR', { sensitivity: 'base' })).map((o) => ({ value: String(o.nr_sequencia), label: o.descricao }))}
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Cor/Raça
                </label>
                <Select
                  value={filterForm.nr_seq_cor_raca}
                  onChange={(v) => setFilterForm({ ...filterForm, nr_seq_cor_raca: v })}
                  options={[...pfCgOptions.coresRacas].sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR', { sensitivity: 'base' })).map((o) => ({ value: String(o.nr_sequencia), label: o.descricao }))}
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Profissão
                </label>
                <Select
                  value={filterForm.nr_seq_profissao}
                  onChange={(v) => setFilterForm({ ...filterForm, nr_seq_profissao: v })}
                  options={[...pfCgOptions.profissoes].sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR', { sensitivity: 'base' })).map((o) => ({ value: String(o.nr_sequencia), label: o.descricao }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={clearFilter}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Limpar
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Filtrar
              </button>
            </div>
          </form>
        </div>
      )}

      {alunoFilterModalOpen && view === "list" && activeSection === "estruturaAcademica" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAlunoFilterModal} />
          <form onSubmit={handleAlunoFilterSubmit} className="relative w-full max-w-[760px] bg-white modal-dark p-0 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Filtro</h2>
              <button
                type="button"
                onClick={closeAlunoFilterModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar filtro"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] sm:grid-cols-12 p-[15px]">
              <div className="sm:col-span-2">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Sequência
                </label>
                <input
                  inputMode="numeric"
                  maxLength={10}
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={alunoFilterForm.nr_sequencia}
                  onChange={(e) => setAlunoFilterForm({ ...alunoFilterForm, nr_sequencia: e.target.value })}
                />
              </div>
              <div className="sm:col-span-10">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Matrícula
                </label>
                <input
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={alunoFilterForm.nr_matricula}
                  onChange={(e) => setAlunoFilterForm({ ...alunoFilterForm, nr_matricula: e.target.value })}
                />
              </div>

              <div className="sm:col-span-12">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Pessoa física
                </label>
                <div className="flex items-center gap-2 flex-nowrap">
                  <div style={{ width: 110 }}>
                    <label className="sr-only">Sequência da pessoa física</label>
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none"
                      value={alunoFilterForm.nr_seq_pessoa_fisica}
                      onChange={(e) => setAlunoFilterForm({ ...alunoFilterForm, nr_seq_pessoa_fisica: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <label className="sr-only">Nome da pessoa física</label>
                    <input
                      readOnly
                      className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none"
                      value={pessoasFisicas.find((p) => String(p.nr_sequencia) === alunoFilterForm.nr_seq_pessoa_fisica)?.ds_nome ?? ''}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      {alunoFilterForm.nr_seq_pessoa_fisica && (
                        <button
                          type="button"
                          onClick={() => openPessoaFisicaView(Number(alunoFilterForm.nr_seq_pessoa_fisica))}
                          className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup"
                          aria-label="Visualizar pessoa física"
                        >
                          <ViewIcon size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={openAlunoFilterPessoaFisicaLookup}
                        className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup"
                        aria-label="Localizar pessoa física"
                      >
                        <SearchIcon size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Data de ingresso (início)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                  value={alunoFilterForm.dt_ingresso_inicio}
                  onChange={(e) => setAlunoFilterForm({ ...alunoFilterForm, dt_ingresso_inicio: applyDateMask(e.target.value) })}
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Data de ingresso (fim)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                  value={alunoFilterForm.dt_ingresso_fim}
                  onChange={(e) => setAlunoFilterForm({ ...alunoFilterForm, dt_ingresso_fim: applyDateMask(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={clearAlunoFilter}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Limpar
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Filtrar
              </button>
            </div>
          </form>
        </div>
      )}

      {colaboradorFilterModalOpen && view === "list" && activeSection === "estruturaAcademica" && alunoManageSelection === 'colaboradores' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeColaboradorFilterModal} />
          <form onSubmit={handleColaboradorFilterSubmit} className="relative w-full max-w-[760px] bg-white modal-dark p-0 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Filtro</h2>
              <button
                type="button"
                onClick={closeColaboradorFilterModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar filtro"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] sm:grid-cols-12 p-[15px]">
              <div className="sm:col-span-2">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Sequência
                </label>
                <input
                  inputMode="numeric"
                  maxLength={10}
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={colaboradorFilterForm.nr_sequencia}
                  onChange={(e) => setColaboradorFilterForm({ ...colaboradorFilterForm, nr_sequencia: e.target.value })}
                />
              </div>
              <div className="sm:col-span-10">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Matrícula
                </label>
                <input
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={colaboradorFilterForm.nr_matricula}
                  onChange={(e) => setColaboradorFilterForm({ ...colaboradorFilterForm, nr_matricula: e.target.value })}
                />
              </div>

              <div className="sm:col-span-12">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Pessoa física
                </label>
                <div className="flex items-center gap-2 flex-nowrap">
                  <div style={{ width: 110 }}>
                    <label className="sr-only">Sequência da pessoa física</label>
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none"
                      value={colaboradorFilterForm.nr_seq_pessoa_fisica}
                      onChange={(e) => setColaboradorFilterForm({ ...colaboradorFilterForm, nr_seq_pessoa_fisica: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <label className="sr-only">Nome da pessoa física</label>
                    <input
                      readOnly
                      className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none"
                      value={pessoasFisicas.find((p) => String(p.nr_sequencia) === colaboradorFilterForm.nr_seq_pessoa_fisica)?.ds_nome ?? ''}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      {colaboradorFilterForm.nr_seq_pessoa_fisica && (
                        <button
                          type="button"
                          onClick={() => openPessoaFisicaView(Number(colaboradorFilterForm.nr_seq_pessoa_fisica))}
                          className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup"
                          aria-label="Visualizar pessoa física"
                        >
                          <ViewIcon size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={openColaboradorFilterPessoaFisicaLookup}
                        className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup"
                        aria-label="Localizar pessoa física"
                      >
                        <SearchIcon size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-12">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Pessoa jurídica
                </label>
                <div className="flex items-center gap-2 flex-nowrap">
                  <div style={{ width: 110 }}>
                    <label className="sr-only">Sequência da pessoa jurídica</label>
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none"
                      value={colaboradorFilterForm.nr_seq_pessoa_juridica}
                      onChange={(e) => setColaboradorFilterForm({ ...colaboradorFilterForm, nr_seq_pessoa_juridica: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <label className="sr-only">Razão social da pessoa jurídica</label>
                    <input
                      readOnly
                      className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none"
                      value={pessoasJuridicas.find((p) => String(p.nr_sequencia) === colaboradorFilterForm.nr_seq_pessoa_juridica)?.ds_razao_social ?? ''}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      {colaboradorFilterForm.nr_seq_pessoa_juridica && (
                        <button
                          type="button"
                          onClick={() => openPessoaJuridicaView(Number(colaboradorFilterForm.nr_seq_pessoa_juridica))}
                          className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup"
                          aria-label="Visualizar pessoa jurídica"
                        >
                          <ViewIcon size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={openColaboradorFilterPessoaJuridicaLookup}
                        className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup"
                        aria-label="Localizar pessoa jurídica"
                      >
                        <SearchIcon size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Data de admissão (início)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                  value={colaboradorFilterForm.dt_admissao_inicio}
                  onChange={(e) => setColaboradorFilterForm({ ...colaboradorFilterForm, dt_admissao_inicio: applyDateMask(e.target.value) })}
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Data de admissão (fim)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                  value={colaboradorFilterForm.dt_admissao_fim}
                  onChange={(e) => setColaboradorFilterForm({ ...colaboradorFilterForm, dt_admissao_fim: applyDateMask(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={clearColaboradorFilter}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Limpar
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Filtrar
              </button>
            </div>
          </form>
        </div>
      )}

      {pjFilterModalOpen && view === "list" && activeSection === "pessoaFisica" && (
        <PessoaJuridicaFilterModal
          open={pjFilterModalOpen}
          onClose={closePjFilterModal}
          filterForm={pjFilterForm}
          setFilterForm={setPjFilterForm}
          onSubmit={handlePjFilterSubmit}
          onClear={clearPjFilter}
          onOpenCidadeLookup={openPjFilterCidadeLookup}
          estados={estados}
        />
      )}

      {adminFilterModalOpen && view === "list" && activeSection === "administracaoSistema" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAdminFilterModal} />
          <form onSubmit={handleAdminFilterSubmit} className="relative w-full max-w-[560px] bg-white modal-dark p-0 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Filtro</h2>
              <button
                type="button"
                onClick={closeAdminFilterModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar filtro"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] sm:grid-cols-12 p-[15px]">
              <div className="sm:col-span-12">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="shrink-0" style={{ flex: '0 0 10%' }}>
                    <label className="block text-sm mb-1" style={{ color: '#666' }}>
                      Sequência
                    </label>
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={adminFilterForm.nr_sequencia}
                      onChange={(e) => setAdminFilterForm({ ...adminFilterForm, nr_sequencia: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <label className="block text-sm mb-1" style={{ color: '#666' }}>
                      Usuário
                    </label>
                    <input
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={adminFilterForm.ds_usuario}
                      onChange={(e) => setAdminFilterForm({ ...adminFilterForm, ds_usuario: e.target.value })}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <label className="block text-sm mb-1" style={{ color: '#666' }}>
                      Usuário alternativo
                    </label>
                    <input
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={adminFilterForm.ds_usuario_alternativo}
                      onChange={(e) => setAdminFilterForm({ ...adminFilterForm, ds_usuario_alternativo: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-12">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Pessoa física
                </label>
                <div className="flex items-center gap-2 flex-nowrap">
                  <div style={{ width: 72 }}>
                    <label className="sr-only">Código da pessoa física</label>
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none"
                      value={adminFilterForm.nr_seq_pessoa_fisica}
                      onChange={(e) => setAdminFilterForm({ ...adminFilterForm, nr_seq_pessoa_fisica: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <label className="sr-only">Nome da pessoa física</label>
                    <input
                      readOnly
                      className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-10 py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none"
                      value={pessoasFisicas.find((p) => String(p.nr_sequencia) === adminFilterForm.nr_seq_pessoa_fisica)?.ds_nome ?? ''}
                    />
                    <button
                      type="button"
                      onClick={openAdminPessoaFisicaLookup}
                      className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-[34px] w-[34px] items-center justify-center rounded-[3px] cursor-pointer text-black"
                      aria-label="Localizar pessoa física"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="7" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-12">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Status
                </label>
                <div className="flex items-center gap-4 mb-3">
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="admin_ie_status"
                      value="T"
                      checked={adminFilterForm.ie_status === 'T'}
                      onChange={() => setAdminFilterForm({ ...adminFilterForm, ie_status: 'T' })}
                    />
                    <span>Todos</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="admin_ie_status"
                      value="A"
                      checked={adminFilterForm.ie_status === 'A'}
                      onChange={() => setAdminFilterForm({ ...adminFilterForm, ie_status: 'A' })}
                    />
                    <span>Ativo</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="admin_ie_status"
                      value="B"
                      checked={adminFilterForm.ie_status === 'B'}
                      onChange={() => setAdminFilterForm({ ...adminFilterForm, ie_status: 'B' })}
                    />
                    <span>Bloqueado</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="admin_ie_status"
                      value="I"
                      checked={adminFilterForm.ie_status === 'I'}
                      onChange={() => setAdminFilterForm({ ...adminFilterForm, ie_status: 'I' })}
                    />
                    <span>Inativo</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={clearAdminFilter}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Limpar
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Filtrar
              </button>
            </div>
          </form>
        </div>
      )}

      {perfilFilterModalOpen && view === "list" && activeSection === "administracaoSistema" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closePerfilFilterModal} />
          <form onSubmit={handlePerfilFilterSubmit} className="relative w-full max-w-[560px] bg-white modal-dark p-0 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Filtro</h2>
              <button
                type="button"
                onClick={closePerfilFilterModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar filtro"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] sm:grid-cols-12 p-[15px]">
              <div className="sm:col-span-3">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Sequência
                </label>
                <input
                  inputMode="numeric"
                  maxLength={10}
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={perfilFilterForm.nr_sequencia}
                  onChange={(e) => setPerfilFilterForm({ ...perfilFilterForm, nr_sequencia: e.target.value.replace(/\D/g, '') })}
                />
              </div>
              <div className="sm:col-span-9">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Perfil
                </label>
                <input
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={perfilFilterForm.ds_perfil}
                  onChange={(e) => setPerfilFilterForm({ ...perfilFilterForm, ds_perfil: e.target.value })}
                />
              </div>

              <div className="sm:col-span-12">
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Status
                </label>
                <div className="flex items-center gap-4 mb-3">
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="perfil_ie_status"
                      value="T"
                      checked={perfilFilterForm.ie_status === 'T'}
                      onChange={() => setPerfilFilterForm({ ...perfilFilterForm, ie_status: 'T' })}
                    />
                    <span>Todos</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="perfil_ie_status"
                      value="A"
                      checked={perfilFilterForm.ie_status === 'A'}
                      onChange={() => setPerfilFilterForm({ ...perfilFilterForm, ie_status: 'A' })}
                    />
                    <span>Ativo</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="perfil_ie_status"
                      value="I"
                      checked={perfilFilterForm.ie_status === 'I'}
                      onChange={() => setPerfilFilterForm({ ...perfilFilterForm, ie_status: 'I' })}
                    />
                    <span>Inativo</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={clearPerfilFilter}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Limpar
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Filtrar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filtro de Ativos ── */}
      {ativoFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAtivoFilterModal} />
          <form onSubmit={(e) => { e.preventDefault(); applyAtivoFilter(); }} className="relative w-full max-w-[900px] bg-white modal-dark p-0 shadow-xl shadow-black/20 max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Filtro</h2>
              <button type="button" onClick={closeAtivoFilterModal} className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2" aria-label="Fechar filtro">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="grid gap-[15px] sm:grid-cols-12 p-[15px]">
                <div className="sm:col-span-3">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>Sequência</label>
                  <input inputMode="numeric" maxLength={10} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.nr_sequencia} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, nr_sequencia: e.target.value })} />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>Patrimônio</label>
                  <input className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.cd_patrimonio} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, cd_patrimonio: e.target.value })} />
                </div>
                <div className="sm:col-span-6">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>Descrição</label>
                  <input className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.ds_ativo} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, ds_ativo: e.target.value })} />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>Modelo</label>
                  <input className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.ds_modelo} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, ds_modelo: e.target.value })} />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>Nº de série</label>
                  <input className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.nr_serie} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, nr_serie: e.target.value })} />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>QR Code</label>
                  <input className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.ds_qr_code} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, ds_qr_code: e.target.value })} />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>Código de barras</label>
                  <input className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.ds_codigo_barras} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, ds_codigo_barras: e.target.value })} />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>Data aquisição (início)</label>
                  <input type="text" inputMode="numeric" maxLength={10} placeholder="DD/MM/AAAA" className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.dt_aquisicao_inicio} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, dt_aquisicao_inicio: applyDateMask(e.target.value) })} />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>Data aquisição (fim)</label>
                  <input type="text" inputMode="numeric" maxLength={10} placeholder="DD/MM/AAAA" className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.dt_aquisicao_fim} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, dt_aquisicao_fim: applyDateMask(e.target.value) })} />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>Data garantia (início)</label>
                  <input type="text" inputMode="numeric" maxLength={10} placeholder="DD/MM/AAAA" className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.dt_garantia_inicio} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, dt_garantia_inicio: applyDateMask(e.target.value) })} />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>Data garantia (fim)</label>
                  <input type="text" inputMode="numeric" maxLength={10} placeholder="DD/MM/AAAA" className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.dt_garantia_fim} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, dt_garantia_fim: applyDateMask(e.target.value) })} />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>Status</label>
                  <Select value={ativoFilterForm.ie_status} onChange={(v) => setAtivoFilterForm({ ...ativoFilterForm, ie_status: v })} options={[{ value: 'T', label: '---' }, ...ATIVO_STATUS_OPTIONS]} showPlaceholder={false} visibleOptions={6} forceOpenUp />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>Categoria</label>
                  <Select value={ativoFilterForm.nr_seq_categoria} onChange={(v) => setAtivoFilterForm({ ...ativoFilterForm, nr_seq_categoria: v })} options={cgFilterOptions(categoriasAtivos, (op) => op.ds_categoria)} visibleOptions={6} forceOpenUp />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>Localização</label>
                  <Select value={ativoFilterForm.nr_seq_localizacao} onChange={(v) => setAtivoFilterForm({ ...ativoFilterForm, nr_seq_localizacao: v })} options={cgFilterOptions(localizacoes, (op) => op.ds_localizacao)} visibleOptions={6} forceOpenUp />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>Marca</label>
                  <Select value={ativoFilterForm.nr_seq_marca} onChange={(v) => setAtivoFilterForm({ ...ativoFilterForm, nr_seq_marca: v })} options={cgFilterOptions(marcas, (op) => op.ds_marca)} visibleOptions={6} forceOpenUp />
                </div>
                <div className="sm:col-span-12">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>Responsável</label>
                  <div className="flex items-center gap-2 flex-nowrap">
                    <div style={{ width: 110 }}>
                      <input inputMode="numeric" maxLength={10} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.nr_seq_responsavel} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, nr_seq_responsavel: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
                    </div>
                    <div className="relative flex-1 min-w-0">
                      <input readOnly className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.nr_seq_responsavel ? (pessoasFisicas.find((p) => String(p.nr_sequencia) === ativoFilterForm.nr_seq_responsavel)?.ds_nome ?? '') : ''} />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                        {ativoFilterForm.nr_seq_responsavel && (
                          <button type="button" onClick={() => openPessoaFisicaView(Number(ativoFilterForm.nr_seq_responsavel))} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Visualizar responsável">
                            <ViewIcon size={16} />
                          </button>
                        )}
                        <button type="button" onClick={openAtivoFilterResponsavelLookup} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Localizar responsável">
                          <SearchIcon size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>Endereço MAC</label>
                  <input maxLength={12} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.ds_endereco_mac} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, ds_endereco_mac: e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() })} />
                </div>
                <div className="sm:col-span-4"><label className="block text-sm mb-1" style={{ color: '#666' }}>IPv4</label>
                   <input className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.ds_ip} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, ds_ip: applyIPv4Mask(e.target.value) })} />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>Sistema operacional</label>
                  <Select value={ativoFilterForm.nr_seq_sistema_operacional} onChange={(v) => setAtivoFilterForm({ ...ativoFilterForm, nr_seq_sistema_operacional: v })} options={sistemasOperacionais.filter((s) => s.ie_status === 'A').sort((a, b) => (a.ds_sistema_operacional ?? '').localeCompare(b.ds_sistema_operacional ?? '', 'pt-BR')).map((s) => ({ value: String(s.nr_sequencia), label: s.ds_sistema_operacional ?? '' }))} visibleOptions={6} forceOpenUp />
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 flex justify-end gap-2 px-[15px] pb-[15px] pt-[15px]">
              <button type="button" onClick={clearAtivoFilter} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' }}>Limpar</button>
              <button type="submit" className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#003056', borderBottomColor: '#000' }}>Filtrar</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filtro de Manutenções ── */}
      {manutencaoFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeManutencaoFilterModal} />
          <form onSubmit={(e) => { e.preventDefault(); applyManutencaoFilter(); }} className="relative w-full max-w-[700px] bg-white modal-dark p-0 shadow-xl shadow-black/20 max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Filtro</h2>
              <button type="button" onClick={closeManutencaoFilterModal} className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2" aria-label="Fechar filtro">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="grid gap-[15px] sm:grid-cols-12 p-[15px]">
                <div className="sm:col-span-3">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>Sequência</label>
                  <input inputMode="numeric" maxLength={10} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={manutencaoFilterForm.nr_sequencia} onChange={(e) => setManutencaoFilterForm({ ...manutencaoFilterForm, nr_sequencia: e.target.value })} />
                </div>
                <div className="sm:col-span-9">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>Ativo</label>
                  <div className="flex items-center gap-2 flex-nowrap">
                    <div style={{ width: 110 }}>
                      <input inputMode="numeric" maxLength={10} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none" value={manutencaoFilterForm.nr_seq_ativo} onChange={(e) => setManutencaoFilterForm({ ...manutencaoFilterForm, nr_seq_ativo: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
                    </div>
                    <div className="relative flex-1 min-w-0">
                      <input readOnly className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none" value={manutencaoFilterForm.nr_seq_ativo ? (ativos.find((a) => String(a.nr_sequencia) === manutencaoFilterForm.nr_seq_ativo)?.ds_ativo ?? '') : ''} />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                        {manutencaoFilterForm.nr_seq_ativo && (
                          <button type="button" onClick={() => { const a = ativos.find((at) => String(at.nr_sequencia) === manutencaoFilterForm.nr_seq_ativo); if (a) setAtivoView(a); }} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Visualizar ativo">
                            <ViewIcon size={16} />
                          </button>
                        )}
                        <button type="button" onClick={openManutencaoFilterAtivoLookup} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Localizar ativo">
                          <SearchIcon size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-12">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>Prestador de serviço</label>
                  <div className="flex items-center gap-2 flex-nowrap">
                    <div style={{ width: 110 }}>
                      <input inputMode="numeric" maxLength={10} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none" value={manutencaoFilterForm.nr_seq_prestador_servico} onChange={(e) => setManutencaoFilterForm({ ...manutencaoFilterForm, nr_seq_prestador_servico: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
                    </div>
                    <div className="relative flex-1 min-w-0">
                      <input readOnly className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none" value={manutencaoFilterForm.nr_seq_prestador_servico ? (() => { const seq = Number(manutencaoFilterForm.nr_seq_prestador_servico); const col = colaboradores.find((c) => c.nr_sequencia === seq); if (col) { const pf = pessoasFisicas.find((p) => p.nr_sequencia === col.nr_seq_pessoa_fisica); return pf?.ds_nome ?? ''; } const pf = pessoasFisicas.find((p) => String(p.nr_sequencia) === manutencaoFilterForm.nr_seq_prestador_servico); return pf?.ds_nome ?? ''; })() : ''} />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                        {manutencaoFilterForm.nr_seq_prestador_servico && (
                          <button type="button" onClick={() => openPessoaFisicaView(Number(manutencaoFilterForm.nr_seq_prestador_servico))} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Visualizar prestador de serviço">
                            <ViewIcon size={16} />
                          </button>
                        )}
                        <button type="button" onClick={openManutencaoFilterPrestadorLookup} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Localizar prestador de serviço">
                          <SearchIcon size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>Data envio (início)</label>
                  <input type="text" inputMode="numeric" maxLength={10} placeholder="DD/MM/AAAA" className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={manutencaoFilterForm.dt_envio_inicio} onChange={(e) => setManutencaoFilterForm({ ...manutencaoFilterForm, dt_envio_inicio: applyDateMask(e.target.value) })} />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>Data envio (fim)</label>
                  <input type="text" inputMode="numeric" maxLength={10} placeholder="DD/MM/AAAA" className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={manutencaoFilterForm.dt_envio_fim} onChange={(e) => setManutencaoFilterForm({ ...manutencaoFilterForm, dt_envio_fim: applyDateMask(e.target.value) })} />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>Data término (início)</label>
                  <input type="text" inputMode="numeric" maxLength={10} placeholder="DD/MM/AAAA" className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={manutencaoFilterForm.dt_termino_inicio} onChange={(e) => setManutencaoFilterForm({ ...manutencaoFilterForm, dt_termino_inicio: applyDateMask(e.target.value) })} />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>Data término (fim)</label>
                  <input type="text" inputMode="numeric" maxLength={10} placeholder="DD/MM/AAAA" className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={manutencaoFilterForm.dt_termino_fim} onChange={(e) => setManutencaoFilterForm({ ...manutencaoFilterForm, dt_termino_fim: applyDateMask(e.target.value) })} />
                </div><div className="sm:col-span-4">
                   <label className="block text-sm mb-1" style={{ color: '#666' }}>Valor total (menor)</label>
                   <input inputMode="decimal" className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={manutencaoFilterForm.vl_total_menor} onChange={(e) => setManutencaoFilterForm({ ...manutencaoFilterForm, vl_total_menor: e.target.value.replace(/[^\d.,]/g, '') })} />
                </div><div className="sm:col-span-4">
                   <label className="block text-sm mb-1" style={{ color: '#666' }}>Valor total (maior)</label>
                   <input inputMode="decimal" className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={manutencaoFilterForm.vl_total_maior} onChange={(e) => setManutencaoFilterForm({ ...manutencaoFilterForm, vl_total_maior: e.target.value.replace(/[^\d.,]/g, '') })} />
                </div><div className="sm:col-span-4">
                   <label className="block text-sm mb-1" style={{ color: '#666' }}>Status</label>
                   <Select value={manutencaoFilterForm.ie_status_manutencao} onChange={(v) => setManutencaoFilterForm({ ...manutencaoFilterForm, ie_status_manutencao: v })} options={[{ value: 'T', label: '---' }, ...MANUTENCAO_STATUS_OPTIONS]} showPlaceholder={false} visibleOptions={6} forceOpenUp />
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 flex justify-end gap-2 px-[15px] pb-[15px] pt-[15px]">
              <button type="button" onClick={clearManutencaoFilter} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' }}>Limpar</button>
              <button type="submit" className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#003056', borderBottomColor: '#000' }}>Filtrar</button>
            </div>
          </form>
        </div>
      )}

      {delegateFuncoesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeDelegateFuncoesModal} />
          <div className="relative w-full max-w-[560px] bg-white modal-dark p-0 shadow-xl shadow-black/20 max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Delegar funções</h2>
              <button
                type="button"
                onClick={closeDelegateFuncoesModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0"
                aria-label="Fechar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-[15px] overflow-auto">
              <div className="grid gap-3">
                {SECTION_ORDER_ALPHABETICAL.map((section) => {
                  const enabled = delegateFuncoes.includes(section);
                  return (
                    <div
                      key={section}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleDelegateFuncao(section)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleDelegateFuncao(section);
                        }
                      }}
                      className="flex cursor-pointer border bg-white transition focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                      style={{
                        padding: '10px',
                        borderStyle: 'solid',
                        borderWidth: '1px',
                        borderTopColor: '#ccc',
                        borderLeftColor: '#ccc',
                        borderBottomColor: '#ccc',
                        borderRightColor: '#ccc',
                      }}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <div className="min-w-0 flex-1 text-sm truncate text-[#444]">{SECTION_DEFS[section].label}</div>
                        <button
                          type="button"
                          onClick={(e) => {
                            // O clique no ícone abre o modal de permissões da
                            // função, sem marcar/desmarcar a função.
                            e.stopPropagation();
                            if (delegateFuncoesPerfil) openPermissoesModal(delegateFuncoesPerfil, section);
                          }}
                          className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-[3px] text-[#999] hover:text-[#666] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                          aria-label={`Permissões da função ${SECTION_DEFS[section].label}`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="21" x2="14" y1="4" y2="4" />
                            <line x1="10" x2="3" y1="4" y2="4" />
                            <line x1="21" x2="12" y1="12" y2="12" />
                            <line x1="8" x2="3" y1="12" y2="12" />
                            <line x1="21" x2="16" y1="20" y2="20" />
                            <line x1="12" x2="3" y1="20" y2="20" />
                            <line x1="14" x2="14" y1="2" y2="6" />
                            <line x1="8" x2="8" y1="10" y2="14" />
                            <line x1="16" x2="16" y1="18" y2="22" />
                          </svg>
                        </button>
                        <label
                          className="flex shrink-0 cursor-pointer items-center"
                          onClick={(e) => {
                            // O clique no checkbox só liga/desliga a função.
                            e.stopPropagation();
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={() => toggleDelegateFuncao(section)}
                            className="cg-checkbox"
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex-shrink-0 flex justify-end gap-2 px-[15px] pb-[15px] pt-[15px]">
              <button
                type="button"
                onClick={closeDelegateFuncoesModal}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelegateFuncoesSave}
                disabled={delegateFuncoesSaving}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-40"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {permissoesModalOpen && permissoesPerfil && permissoesFuncao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closePermissoesModal} />
          <div className="relative w-full max-w-[560px] bg-white modal-dark p-0 shadow-xl shadow-black/20 max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Permissões da função</h2>
              <button
                type="button"
                onClick={closePermissoesModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0"
                aria-label="Fechar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-[15px] overflow-auto">
              {(() => {
                const defs = PERMISSOES_POR_FUNCAO[permissoesFuncao] ?? [];
                if (defs.length === 0) {
                  return (
                    <div className="flex min-h-[120px] items-center justify-center text-center text-sm text-slate-500">
                      As permissões desta função serão configuradas em breve.
                    </div>
                  );
                }
                const checkbox = (perm: PermissaoDef) => {
                  const checked = permissoesSelecionadas.includes(perm.key);
                  return (
                    <label
                      key={perm.key}
                      className="flex cursor-pointer select-none items-center gap-3 rounded-[3px] px-[6px] py-[4px] transition focus-within:outline focus-within:outline-2 focus-within:outline-[#066fc5] focus-within:outline-offset-2"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePermissao(perm.key)}
                        className="cg-checkbox"
                      />
                      <span className="text-sm">{perm.label}</span>
                    </label>
                  );
                };
                // Seções em ordem alfabética pelo título (igual ao Detalhe da auditoria).
                const grupos = [...(PERMISSOES_GRUPOS[permissoesFuncao] ?? [])].sort((a, b) =>
                  a.titulo.localeCompare(b.titulo, 'pt-BR')
                );
                if (grupos.length > 0) {
                  return (
                    <div className="grid gap-4">
                      {grupos.map((grupo) => (
                        <div key={grupo.titulo}>
                          <div className="mb-1 text-sm font-medium" style={{ color: '#444' }}>{grupo.titulo}</div>
                          <div className="grid gap-2">
                            {grupo.chaves.map((chave) => {
                              const perm = defs.find((p) => p.key === chave);
                              return perm ? checkbox(perm) : null;
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                return <div className="grid gap-2">{defs.map(checkbox)}</div>;
              })()}
            </div>

            <div className="flex-shrink-0 flex justify-end gap-2 px-[15px] pb-[15px] pt-[15px]">
              <button
                type="button"
                onClick={closePermissoesModal}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePermissoesSave}
                disabled={permissoesSaving}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-40"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {cgFilterModalOpen && view === "list" && activeSection === "cadastrosGerais" && (
        <CadastroGeralFilterModal
          open={cgFilterModalOpen}
          onClose={closeCgFilterModal}
          filterForm={cgFilterForm}
          setFilterForm={setCgFilterForm}
          onSubmit={handleCgFilterSubmit}
          onClear={clearCgFilter}
        />
      )}

      {delegatePerfisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeDelegatePerfisModal} />
          <div className="relative w-full max-w-[560px] bg-white modal-dark p-0 shadow-xl shadow-black/20 max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Delegar perfis</h2>
              <button
                type="button"
                onClick={closeDelegatePerfisModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0"
                aria-label="Fechar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-[15px] overflow-auto">
              {delegatePerfisDisponiveis.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-600">Nenhum perfil ativo encontrado.</div>
              ) : (
              <div className="grid gap-3">
                {delegatePerfisDisponiveis.map((perfil) => {
                    const enabled = delegatePerfis.includes(perfil.nr_sequencia);
                    return (
                      <div
                        key={perfil.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleDelegatePerfil(perfil.nr_sequencia)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleDelegatePerfil(perfil.nr_sequencia);
                          }
                        }}
                        className="flex cursor-pointer border bg-white transition focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                        style={{
                          padding: '10px',
                          borderStyle: 'solid',
                          borderWidth: '1px',
                          borderTopColor: '#ccc',
                          borderLeftColor: '#ccc',
                          borderBottomColor: '#ccc',
                          borderRightColor: '#ccc',
                        }}
                      >
                        <div className="flex w-full items-center justify-between">
                          <div className="text-sm truncate text-slate-900">{perfil.ds_perfil}</div>
                          <label
                            className="flex shrink-0 cursor-pointer items-center"
                            onClick={(e) => {
                              // O clique no checkbox só liga/desliga o perfil.
                              e.stopPropagation();
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={() => toggleDelegatePerfil(perfil.nr_sequencia)}
                              className="cg-checkbox"
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
              </div>
              )}
            </div>

            <div className="flex-shrink-0 flex justify-end gap-2 px-[15px] pb-[15px] pt-[15px]">
              <button
                type="button"
                onClick={closeDelegatePerfisModal}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelegatePerfisSave}
                disabled={delegatePerfisSaving}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-40"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {duplicatePerfilModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeDuplicatePerfilModal} />
          <form
            onSubmit={handleDuplicatePerfilSubmit}
            className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20"
          >
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Duplicar perfil</h2>
              <button
                type="button"
                onClick={closeDuplicatePerfilModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar duplicar perfil"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] p-[15px]">
              <div>
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Perfil
                </label>
                <input
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={duplicatePerfilName}
                  onChange={(e) => setDuplicatePerfilName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={closeDuplicatePerfilModal}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={duplicatePerfilSaving || !duplicatePerfilName.trim()}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDeleteOpen(false)} />
          <div className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Excluir registro</h2>
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0"
                aria-label="Fechar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-[15px] pt-[15px]">
              <p className="text-sm text-slate-900">{confirmDeleteMessage}</p>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pt-20 pb-[15px]">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Não
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteOpen(false);
                  confirmDeleteAction?.();
                }}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {auditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAuditModal} />
          <div className="relative w-full max-w-[560px] bg-white modal-dark p-0 shadow-xl shadow-black/20 max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Histórico de auditoria</h2>
              <button
                type="button"
                onClick={closeAuditModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0"
                aria-label="Fechar auditoria"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-[15px] overflow-auto">
              {auditLoading ? (
                <div className="text-sm text-slate-600">Carregando...</div>
              ) : auditLogs.length === 0 ? (
                <div className="text-sm text-slate-600">Nenhum registro de auditoria encontrado.</div>
              ) : (
                <div className="grid gap-3">
                  {auditLogs.map((log, idx) => {
                    const action = String(log.acao ?? '').toLowerCase();
                    const isPasswordCard = action === 'password';
                    const actionLabel = action === 'create'
                      ? 'Criação'
                      : action === 'password'
                      ? 'Alteração de senha'
                      : 'Alteração';

                    return (
                      <div
                        key={log.id}
                        role={isPasswordCard ? 'presentation' : 'button'}
                        onClick={isPasswordCard ? undefined : () => { setSelectedAuditIndex(idx); setDetailModalOpen(true); }}
                        className={`flex border ${isPasswordCard ? 'cursor-default' : 'cursor-pointer'} bg-white`}
                        style={{
                          padding: '10px',
                          borderStyle: 'solid',
                          borderWidth: '1px',
                          borderTopColor: '#ccc',
                          borderLeftColor: '#ccc',
                          borderBottomColor: '#ccc',
                          borderRightColor: '#ccc',
                        }}
                      >
                        <div className="flex w-full items-center justify-between">
                          <div className="text-sm font-medium truncate" style={{ color: '#444' }}>{log.usuarioNome ?? log.usuarioId ?? ''}</div>
                          <div className="flex items-center gap-[10px] text-xs">
                            <span className="text-slate-600">{actionLabel}</span>
                            <span className="text-slate-600 whitespace-nowrap" style={{ marginLeft: 10 }}>{log.timestamp ? formatDate(String(log.timestamp)) : ''}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {changePasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeChangePasswordModal} />
          <form
            onSubmit={handleChangePasswordSubmit}
            className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20"
          >
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Alterar senha</h2>
              <button
                type="button"
                onClick={closeChangePasswordModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar alterar senha"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] p-[15px]">
              <div>
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Senha
                </label>
                <input
                  type="password"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={passwordChangeValue}
                  onChange={(e) => setPasswordChangeValue(e.target.value)}
                  autoFocus
                />
              </div>
              {passwordChangeIsSelf && (
                <div>
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>
                    Confirmar senha
                  </label>
                  <input
                    type="password"
                    className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                    value={passwordChangeConfirmValue}
                    onChange={(e) => setPasswordChangeConfirmValue(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={closeChangePasswordModal}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={adminSubmitting || !passwordChangeValue}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {alterarStatusModalOpen && alterarStatusAluno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAlterarStatusModal} />
          <form
            onSubmit={handleAlterarStatusSubmit}
            className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20"
          >
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Alterar status</h2>
              <button
                type="button"
                onClick={closeAlterarStatusModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar alterar status"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] p-[15px]">
              <div>
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Status
                </label>
                <Select
                  value={alterarStatusForm.ie_status}
                  onChange={(v) => setAlterarStatusForm({ ...alterarStatusForm, ie_status: v })}
                  options={[
                    { value: 'A', label: 'Ativo' },
                    { value: 'I', label: 'Inativo' },
                    { value: 'C', label: 'Cancelado' },
                    { value: 'T', label: 'Transferido' },
                    // A opção do status atual do aluno fica fora da lista.
                  ].filter((o) => o.value !== (alterarStatusAluno?.ie_status ?? ''))}
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Data do status
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                  value={alterarStatusForm.dt_status}
                  onChange={(e) => setAlterarStatusForm({ ...alterarStatusForm, dt_status: applyDateMask(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Motivo
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none resize-none"
                  value={alterarStatusForm.ds_status}
                  onChange={(e) => setAlterarStatusForm({ ...alterarStatusForm, ds_status: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={closeAlterarStatusModal}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={alterarStatusSaving}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {alterarIngressoModalOpen && alterarIngressoAluno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAlterarIngressoModal} />
          <form
            onSubmit={handleAlterarIngressoSubmit}
            className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20"
          >
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Alterar data de ingresso</h2>
              <button
                type="button"
                onClick={closeAlterarIngressoModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar alterar data de ingresso"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] p-[15px]">
              <div>
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Data de ingresso
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                  value={alterarIngressoForm.dt_ingresso}
                  onChange={(e) => setAlterarIngressoForm({ ...alterarIngressoForm, dt_ingresso: applyDateMask(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={closeAlterarIngressoModal}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={alterarIngressoSaving}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {alterarAdmissaoModalOpen && alterarAdmissaoColaborador && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAlterarAdmissaoModal} />
          <form
            onSubmit={handleAlterarAdmissaoSubmit}
            className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20"
          >
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Alterar data de admissão</h2>
              <button
                type="button"
                onClick={closeAlterarAdmissaoModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar alterar data de admissão"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] p-[15px]">
              <div>
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Data de admissão
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                  value={alterarAdmissaoForm.dt_admissao}
                  onChange={(e) => setAlterarAdmissaoForm({ ...alterarAdmissaoForm, dt_admissao: applyDateMask(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={closeAlterarAdmissaoModal}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={alterarAdmissaoSaving}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {alterarStatusColaboradorModalOpen && alterarStatusColaborador && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAlterarStatusColaboradorModal} />
          <form
            onSubmit={handleAlterarStatusColaboradorSubmit}
            className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20"
          >
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Alterar status</h2>
              <button
                type="button"
                onClick={closeAlterarStatusColaboradorModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar alterar status"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] p-[15px]">
              <div>
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Status
                </label>
                <Select
                  value={alterarStatusColaboradorForm.ie_status}
                  onChange={(v) => setAlterarStatusColaboradorForm({ ...alterarStatusColaboradorForm, ie_status: v })}
                  options={STATUS_OPTIONS.filter((o) => o.value !== (alterarStatusColaborador?.ie_status ?? ''))}
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Data do status
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                  value={alterarStatusColaboradorForm.dt_status}
                  onChange={(e) => setAlterarStatusColaboradorForm({ ...alterarStatusColaboradorForm, dt_status: applyDateMask(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Motivo
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none resize-none"
                  value={alterarStatusColaboradorForm.ds_motivo_status}
                  onChange={(e) => setAlterarStatusColaboradorForm({ ...alterarStatusColaboradorForm, ds_motivo_status: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={closeAlterarStatusColaboradorModal}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={alterarStatusColaboradorSaving}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {ativoStatusModalOpen && ativoStatusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAtivoStatusModal} />
          <form
            onSubmit={handleAtivoStatusSubmit}
            className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20"
          >
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>
                {ativoStatusValue === 'O' ? 'Operacional' : ativoStatusValue === 'M' ? 'Enviar para manutenção' : ativoStatusValue === 'E' ? 'Mover para o estoque' : 'Descartar'}
              </h2>
              <button
                type="button"
                onClick={closeAtivoStatusModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] p-[15px]">
              <div>
                <label className="block text-sm mb-1" style={{ color: '#666' }}>
                  Data
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                  value={ativoStatusForm.dt_data}
                  onChange={(e) => setAtivoStatusForm({ ...ativoStatusForm, dt_data: applyDateMask(e.target.value) })}
                />
              </div>
              <div>
                  <label className="block text-sm mb-1" style={{ color: '#666' }}>
                    Motivo
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none resize-none"
                    value={ativoStatusForm.ds_motivo_status}
                    onChange={(e) => setAtivoStatusForm({ ...ativoStatusForm, ds_motivo_status: e.target.value })}
                  />
                </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={closeAtivoStatusModal}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={ativoStatusSaving}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modal: Enviar para manutenção ── */}
      {enviarManutModalOpen && enviarManutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeEnviarManutModal} />
          <form onSubmit={handleEnviarManutSubmit} className="relative w-full max-w-[560px] min-h-[280px] bg-white modal-dark p-0 shadow-xl shadow-black/20 flex flex-col">
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Enviar para manutenção</h2>
              <button type="button" onClick={closeEnviarManutModal} className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2" aria-label="Fechar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="grid gap-[15px] p-[15px]">
              <div>
                <label className="block text-sm mb-1" style={{ color: '#666' }}>Data</label>
                <input type="text" inputMode="numeric" maxLength={10} placeholder="DD/MM/AAAA" className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]" value={enviarManutForm.dt_data} onChange={(e) => setEnviarManutForm({ ...enviarManutForm, dt_data: applyDateMask(e.target.value) })} />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: '#666' }}>Prestador de serviço</label>
                <div className="flex items-center gap-2 flex-nowrap">
                  <div style={{ width: 110 }}>
                    <input inputMode="numeric" maxLength={10} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none" value={enviarManutForm.nr_seq_prestador_servico ? String(enviarManutForm.nr_seq_prestador_servico) : ''} onChange={(e) => { const raw = e.target.value.replace(/\D/g, '').slice(0, 10); setEnviarManutForm({ ...enviarManutForm, nr_seq_prestador_servico: raw ? Number(raw) : undefined }); }} />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <input readOnly className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none" value={enviarManutPrestadorName} />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      {enviarManutForm.nr_seq_prestador_servico && (
                        <button type="button" onClick={() => openColaboradorView(enviarManutForm.nr_seq_prestador_servico)} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Visualizar prestador de serviço">
                          <ViewIcon size={16} />
                        </button>
                      )}
                      <button type="button" onClick={() => openEnviarManutPrestadorLookup('modal')} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Localizar prestador de serviço">
                        <SearchIcon size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: '#666' }}>Motivo</label>
                <textarea
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none resize-none"
                  rows={3}
                  value={enviarManutForm.ds_motivo_manutencao ?? ''}
                  onChange={(e) => setEnviarManutForm({ ...enviarManutForm, ds_motivo_manutencao: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-[15px] pb-[15px] mt-auto">
              <button type="button" onClick={closeEnviarManutModal} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}>Cancelar</button>
              <button type="submit" disabled={enviarManutSaving} className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60" style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}>Salvar</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Lookup: Localizar prestador de serviço ── */}
      {enviarManutPrestadorLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeEnviarManutPrestadorLookup} />
          <div className="relative w-full max-w-[960px] bg-white p-0 shadow-xl shadow-black/20 h-[600px] max-h-[90vh] overflow-hidden">
            <div className="flex h-full">
              <div className="w-[320px] lookup-left flex flex-col min-h-0">
                <div className="p-[15px] overflow-auto flex-1 min-h-0">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <h2 className="text-base font-semibold" style={{ color: '#000' }}>Localizar prestador de serviço</h2>
                    <button type="button" onClick={closeEnviarManutPrestadorLookup} className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0" aria-label="Fechar localizar prestador">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Sequência</label>
                      <input inputMode="numeric" maxLength={10} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={enviarManutPrestLookupForm.nr_sequencia} onChange={(e) => setEnviarManutPrestLookupForm({ ...enviarManutPrestLookupForm, nr_sequencia: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Nome</label>
                      <input className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={enviarManutPrestLookupForm.ds_nome} onChange={(e) => setEnviarManutPrestLookupForm({ ...enviarManutPrestLookupForm, ds_nome: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>CPF</label>
                      <input inputMode="numeric" maxLength={14} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={enviarManutPrestLookupForm.nr_cpf} onChange={(e) => setEnviarManutPrestLookupForm({ ...enviarManutPrestLookupForm, nr_cpf: applyCpfMask(e.target.value) })} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>CNPJ</label>
                      <input inputMode="numeric" maxLength={18} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={enviarManutPrestLookupForm.nr_cnpj} onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 14);
                        let masked = digits;
                        if (digits.length > 2) masked = `${digits.slice(0, 2)}.${digits.slice(2)}`;
                        if (digits.length > 5) masked = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
                        if (digits.length > 8) masked = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
                        if (digits.length > 12) masked = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
                        setEnviarManutPrestLookupForm({ ...enviarManutPrestLookupForm, nr_cnpj: masked });
                      }} />
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center justify-end gap-2 p-[15px]">
                  <button type="button" onClick={clearEnviarManutPrestadorLookup} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#ddd', borderBottomColor: '#000' } as React.CSSProperties}>Limpar</button>
                  <button type="button" onClick={applyEnviarManutPrestadorLookup} className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}>Filtrar</button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col lookup-right">
                {!enviarManutPrestLookupApplied || enviarManutFilteredPrestadores.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-[15px] text-sm text-slate-600">Nenhum registro encontrado.</div>
                ) : (                   <PrestadorLookupTable
                     prestadores={enviarManutFilteredPrestadores}
                     pessoasFisicas={pessoasFisicas}
                     pessoasJuridicas={pessoasJuridicas}
                     onSelect={handleEnviarManutPrestadorSelect}
                   />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Lookup: Localizar ativo (manutenções) ── */}
      {manutencaoAtivoLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeManutencaoAtivoLookup} />
          <div className="relative w-full max-w-[960px] bg-white p-0 shadow-xl shadow-black/20 h-[600px] max-h-[90vh] overflow-hidden">
            <div className="flex h-full">
              <div className="w-[320px] lookup-left flex flex-col min-h-0">
                <div className="p-[15px] overflow-auto flex-1 min-h-0">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <h2 className="text-base font-semibold" style={{ color: '#000' }}>Localizar ativo</h2>
                    <button type="button" onClick={closeManutencaoAtivoLookup} className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0" aria-label="Fechar localizar ativo">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Sequência</label>
                      <input inputMode="numeric" maxLength={10} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={manutencaoAtivoLookupForm.nr_sequencia} onChange={(e) => setManutencaoAtivoLookupForm({ ...manutencaoAtivoLookupForm, nr_sequencia: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Patrimônio</label>
                      <input className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={manutencaoAtivoLookupForm.cd_patrimonio} onChange={(e) => setManutencaoAtivoLookupForm({ ...manutencaoAtivoLookupForm, cd_patrimonio: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Descrição</label>
                      <input className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={manutencaoAtivoLookupForm.ds_ativo} onChange={(e) => setManutencaoAtivoLookupForm({ ...manutencaoAtivoLookupForm, ds_ativo: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Modelo</label>
                      <input className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={manutencaoAtivoLookupForm.ds_modelo} onChange={(e) => setManutencaoAtivoLookupForm({ ...manutencaoAtivoLookupForm, ds_modelo: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Status</label>
                      <Select
                        value={manutencaoAtivoLookupForm.ie_status}
                        onChange={(v) => setManutencaoAtivoLookupForm({ ...manutencaoAtivoLookupForm, ie_status: v })}
                        options={[
                          { value: '', label: '---' },
                          { value: 'E', label: 'Estoque' },
                          { value: 'O', label: 'Operacional' },
                        ]}
                        showPlaceholder={false}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center justify-end gap-2 p-[15px]">
                  <button type="button" onClick={clearManutencaoAtivoLookup} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#ddd', borderBottomColor: '#000' } as React.CSSProperties}>Limpar</button>
                  <button type="button" onClick={applyManutencaoAtivoLookup} className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}>Filtrar</button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col lookup-right">
                {!manutencaoAtivoLookupApplied || manutencaoFilteredAtivos.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-[15px] text-sm text-slate-600">Nenhum registro encontrado.</div>
                ) : (                   <AtivoLookupTable
                     ativos={manutencaoFilteredAtivos}
                     onSelect={handleManutencaoAtivoSelect}
                     categoriasAtivos={categoriasAtivos}
                     marcas={marcas}
                   />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {pessoaFisicaLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closePessoaFisicaLookup} />
          <div className="relative w-full max-w-[960px] bg-white p-0 shadow-xl shadow-black/20 h-[600px] max-h-[90vh] overflow-hidden">
            <div className="flex h-full">
              <div className="w-[320px] lookup-left flex flex-col min-h-0">
                <div className="p-[15px] overflow-auto flex-1 min-h-0">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h2 className="text-base font-semibold" style={{ color: '#000' }}>Localizar pessoa física</h2>
                  <button
                    type="button"
                    onClick={closePessoaFisicaLookup}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0"
                    aria-label="Fechar localizar pessoa física"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: '#666' }}>Sequência</label>
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={lookupForm.nr_sequencia}
                      onChange={(e) => setLookupForm({ ...lookupForm, nr_sequencia: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: '#666' }}>Nome</label>
                    <input
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={lookupForm.ds_nome}
                      onChange={(e) => setLookupForm({ ...lookupForm, ds_nome: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: '#666' }}>CPF</label>
                    <input
                      inputMode="numeric"
                      maxLength={14}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={lookupForm.nr_cpf}
                      onChange={(e) => setLookupForm({ ...lookupForm, nr_cpf: applyCpfMask(e.target.value) })}
                    />
                  </div>
                </div>
                </div>
                <div className="flex-shrink-0 flex items-center justify-end gap-2 p-[15px]">
                  <button
                    type="button"
                    onClick={clearLookupFilter}
                    className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: '#ddd', borderBottomColor: '#000' } as React.CSSProperties}
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={applyLookupFilter}
                    className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
                  >
                    Filtrar
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col lookup-right">
                {!lookupApplied || filteredLookupPessoasFisicas.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-[15px] text-sm text-slate-600">
                    Nenhum registro encontrado.
                  </div>
                ) : (
                  <PessoaFisicaLookupTable
                    pessoasFisicas={filteredLookupPessoasFisicas}
                    onSelect={handlePessoaFisicaSelect}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {alunoPessoaFisicaLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAlunoPessoaFisicaLookup} />
          <div className="relative w-full max-w-[960px] bg-white p-0 shadow-xl shadow-black/20 h-[600px] max-h-[90vh] overflow-hidden">
            <div className="flex h-full">
              <div className="w-[320px] lookup-left flex flex-col min-h-0">
                <div className="p-[15px] overflow-auto flex-1 min-h-0">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h2 className="text-base font-semibold" style={{ color: '#000' }}>Localizar pessoa física</h2>
                  <button
                    type="button"
                    onClick={closeAlunoPessoaFisicaLookup}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0"
                    aria-label="Fechar localizar pessoa física"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: '#666' }}>Sequência</label>
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={alunoLookupForm.nr_sequencia}
                      onChange={(e) => setAlunoLookupForm({ ...alunoLookupForm, nr_sequencia: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: '#666' }}>Nome</label>
                    <input
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={alunoLookupForm.ds_nome}
                      onChange={(e) => setAlunoLookupForm({ ...alunoLookupForm, ds_nome: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: '#666' }}>CPF</label>
                    <input
                      inputMode="numeric"
                      maxLength={14}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={alunoLookupForm.nr_cpf}
                      onChange={(e) => setAlunoLookupForm({ ...alunoLookupForm, nr_cpf: applyCpfMask(e.target.value) })}
                    />
                  </div>
                </div>
                </div>
                <div className="flex-shrink-0 flex items-center justify-end gap-2 p-[15px]">
                  <button
                    type="button"
                    onClick={clearAlunoLookupFilter}
                    className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: '#ddd', borderBottomColor: '#000' } as React.CSSProperties}
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={applyAlunoLookupFilter}
                    className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
                  >
                    Filtrar
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col lookup-right">
                {!alunoLookupApplied || filteredAlunoLookupPessoasFisicas.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-[15px] text-sm text-slate-600">
                    Nenhum registro encontrado.
                  </div>
                ) : (
                  <PessoaFisicaLookupTable
                    pessoasFisicas={filteredAlunoLookupPessoasFisicas}
                    onSelect={handleAlunoPessoaFisicaSelect}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {colaboradorPessoaJuridicaLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeColaboradorPessoaJuridicaLookup} />
          <div className="relative w-full max-w-[960px] bg-white p-0 shadow-xl shadow-black/20 h-[600px] max-h-[90vh] overflow-hidden">
            <div className="flex h-full">
              <div className="w-[320px] lookup-left flex flex-col min-h-0">
                <div className="p-[15px] overflow-auto flex-1 min-h-0">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h2 className="text-base font-semibold" style={{ color: '#000' }}>Localizar pessoa jurídica</h2>
                  <button
                    type="button"
                    onClick={closeColaboradorPessoaJuridicaLookup}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0"
                    aria-label="Fechar localizar pessoa jurídica"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: '#666' }}>Sequência</label>
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={colaboradorPjLookupForm.nr_sequencia}
                      onChange={(e) => setColaboradorPjLookupForm({ ...colaboradorPjLookupForm, nr_sequencia: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: '#666' }}>Razão social</label>
                    <input
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={colaboradorPjLookupForm.ds_razao_social}
                      onChange={(e) => setColaboradorPjLookupForm({ ...colaboradorPjLookupForm, ds_razao_social: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: '#666' }}>CNPJ</label>
                    <input
                      inputMode="numeric"
                      maxLength={18}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={colaboradorPjLookupForm.nr_cnpj}
                      onChange={(e) => setColaboradorPjLookupForm({ ...colaboradorPjLookupForm, nr_cnpj: applyCnpjMask(e.target.value) })}
                    />
                  </div>
                </div>
                </div>
                <div className="flex-shrink-0 flex items-center justify-end gap-2 p-[15px]">
                  <button
                    type="button"
                    onClick={clearColaboradorPjLookupFilter}
                    className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: '#ddd', borderBottomColor: '#000' } as React.CSSProperties}
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={applyColaboradorPjLookupFilter}
                    className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
                  >
                    Filtrar
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col lookup-right">
                {!colaboradorPjLookupApplied || filteredColaboradorPjLookupPessoasJuridicas.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-[15px] text-sm text-slate-600">
                    Nenhum registro encontrado.
                  </div>
                ) : (
                  <PessoaJuridicaLookupTable
                    pessoasJuridicas={filteredColaboradorPjLookupPessoasJuridicas}
                    onSelect={handleColaboradorPessoaJuridicaSelect}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {adminPessoaFisicaLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAdminPessoaFisicaLookup} />
          <div className="relative w-full max-w-[960px] bg-white p-0 shadow-xl shadow-black/20 h-[600px] max-h-[90vh] overflow-hidden">
            <div className="flex h-full">
              <div className="w-[320px] lookup-left flex flex-col min-h-0">
                <div className="p-[15px] overflow-auto flex-1 min-h-0">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h2 className="text-base font-semibold" style={{ color: '#000' }}>Localizar pessoa física</h2>
                  <button
                    type="button"
                    onClick={closeAdminPessoaFisicaLookup}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0"
                    aria-label="Fechar localizar pessoa física"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: '#666' }}>Sequência</label>
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={adminPessoaFisicaLookupForm.nr_sequencia}
                      onChange={(e) => setAdminPessoaFisicaLookupForm({ ...adminPessoaFisicaLookupForm, nr_sequencia: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: '#666' }}>Nome</label>
                    <input
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={adminPessoaFisicaLookupForm.ds_nome}
                      onChange={(e) => setAdminPessoaFisicaLookupForm({ ...adminPessoaFisicaLookupForm, ds_nome: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: '#666' }}>CPF</label>
                    <input
                      inputMode="numeric"
                      maxLength={14}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={adminPessoaFisicaLookupForm.nr_cpf}
                      onChange={(e) => setAdminPessoaFisicaLookupForm({ ...adminPessoaFisicaLookupForm, nr_cpf: applyCpfMask(e.target.value) })}
                    />
                  </div>
                </div>
                </div>
                <div className="flex-shrink-0 flex items-center justify-end gap-2 p-[15px]">
                  <button
                    type="button"
                    onClick={clearAdminPessoaFisicaLookupFilter}
                    className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: '#ddd', borderBottomColor: '#000' } as React.CSSProperties}
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={applyAdminPessoaFisicaLookupFilter}
                    className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
                  >
                    Filtrar
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col lookup-right">
                {!adminPessoaFisicaLookupApplied || pessoasFisicas.filter((pessoa) => {
                  if (adminPessoaFisicaLookupFilter.nr_sequencia) {
                    if (String(pessoa.nr_sequencia) !== adminPessoaFisicaLookupFilter.nr_sequencia.trim()) return false;
                  }
                  if (adminPessoaFisicaLookupFilter.ds_nome && !pessoa.ds_nome.toLowerCase().includes(adminPessoaFisicaLookupFilter.ds_nome.toLowerCase())) return false;
                  if (adminPessoaFisicaLookupFilter.nr_cpf) {
                    const queryCpf = adminPessoaFisicaLookupFilter.nr_cpf.replace(/\D/g, '');
                    const pessoaCpf = pessoa.nr_cpf.replace(/\D/g, '');
                    if (!pessoaCpf.includes(queryCpf)) return false;
                  }
                  return true;
                }).length === 0 ? (
                  <div className="flex h-full items-center justify-center p-[15px] text-sm text-slate-600">
                    Nenhum registro encontrado.
                  </div>
                ) : (
                  <PessoaFisicaLookupTable
                    pessoasFisicas={pessoasFisicas.filter((pessoa) => {
                      if (adminPessoaFisicaLookupFilter.nr_sequencia) {
                        if (String(pessoa.nr_sequencia) !== adminPessoaFisicaLookupFilter.nr_sequencia.trim()) return false;
                      }
                      if (adminPessoaFisicaLookupFilter.ds_nome && !pessoa.ds_nome.toLowerCase().includes(adminPessoaFisicaLookupFilter.ds_nome.toLowerCase())) return false;
                      if (adminPessoaFisicaLookupFilter.nr_cpf) {
                        const queryCpf = adminPessoaFisicaLookupFilter.nr_cpf.replace(/\D/g, '');
                        const pessoaCpf = pessoa.nr_cpf.replace(/\D/g, '');
                        if (!pessoaCpf.includes(queryCpf)) return false;
                      }
                      return true;
                    })}
                    onSelect={handleAdminPessoaFisicaSelect}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {naturalidadeLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeNaturalidadeLookup} />
          <div className="relative w-full max-w-[960px] bg-white p-0 shadow-xl shadow-black/20 h-[600px] max-h-[90vh] overflow-hidden">
            <div className="flex h-full">
              <div className="w-[320px] lookup-left flex flex-col min-h-0">
                <div className="p-[15px] overflow-auto flex-1 min-h-0">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h2 className="text-base font-semibold" style={{ color: '#000' }}>Localizar cidade</h2>
                  <button
                    type="button"
                    onClick={closeNaturalidadeLookup}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0"
                    aria-label="Fechar localizar cidade"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: '#666' }}>Código IBGE</label>
                    <input
                      inputMode="numeric"
                      maxLength={7}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={cidadeLookupForm.codigo}
                      onChange={(e) => setCidadeLookupForm({ ...cidadeLookupForm, codigo: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: '#666' }}>Descrição</label>
                    <input
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={cidadeLookupForm.nome}
                      onChange={(e) => setCidadeLookupForm({ ...cidadeLookupForm, nome: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: '#666' }}>Estado</label>
                    <Select
                      value={cidadeLookupForm.uf}
                      onChange={(v) => setCidadeLookupForm({ ...cidadeLookupForm, uf: v })}
                      options={UF_OPTIONS}
                    />
                  </div>
                </div>
                </div>
                <div className="flex-shrink-0 flex items-center justify-end gap-2 p-[15px]">
                  <button
                    type="button"
                    onClick={clearCidadeLookup}
                    className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: '#ddd', borderBottomColor: '#000' } as React.CSSProperties}
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={handleCidadeSearch}
                    className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
                  >
                    Filtrar
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col lookup-right">
                {cidadeLoading ? (
                  <div className="flex h-full items-center justify-center p-[15px] text-sm text-slate-600">
                    Carregando cidades...
                  </div>
                ) : !cidadeLookupApplied || cidadeResults.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-[15px] text-sm text-slate-600">
                    Nenhum registro encontrado.
                  </div>
                ) : (
                  <CidadeLookupTable
                    cidades={cidadeResults}
                    onSelect={handleCidadeSelect}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {pjCidadeLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closePjCidadeLookup} />
          <div className="relative w-full max-w-[960px] bg-white p-0 shadow-xl shadow-black/20 h-[600px] max-h-[90vh] overflow-hidden">
            <div className="flex h-full">
              <div className="w-[320px] lookup-left flex flex-col min-h-0">
                <div className="p-[15px] overflow-auto flex-1 min-h-0">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h2 className="text-base font-semibold" style={{ color: '#000' }}>Localizar cidade</h2>
                  <button
                    type="button"
                    onClick={closePjCidadeLookup}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0"
                    aria-label="Fechar localizar cidade"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: '#666' }}>Código IBGE</label>
                    <input
                      inputMode="numeric"
                      maxLength={7}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={pjCidadeLookupForm.codigo}
                      onChange={(e) => setPjCidadeLookupForm({ ...pjCidadeLookupForm, codigo: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: '#666' }}>Descrição</label>
                    <input
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={pjCidadeLookupForm.nome}
                      onChange={(e) => setPjCidadeLookupForm({ ...pjCidadeLookupForm, nome: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: '#666' }}>Estado</label>
                    <Select
                      value={pjCidadeLookupForm.uf}
                      onChange={(v) => setPjCidadeLookupForm({ ...pjCidadeLookupForm, uf: v })}
                      options={UF_OPTIONS}
                    />
                  </div>
                </div>
                </div>
                <div className="flex-shrink-0 flex items-center justify-end gap-2 p-[15px]">
                  <button
                    type="button"
                    onClick={clearPjCidadeLookup}
                    className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: '#ddd', borderBottomColor: '#000' } as React.CSSProperties}
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={handlePjCidadeSearch}
                    className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
                  >
                    Filtrar
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col lookup-right">
                {pjCidadeLoading ? (
                  <div className="flex h-full items-center justify-center p-[15px] text-sm text-slate-600">
                    Carregando cidades...
                  </div>
                ) : !pjCidadeLookupApplied || pjCidadeResults.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-[15px] text-sm text-slate-600">
                    Nenhum registro encontrado.
                  </div>
                ) : (
                  <CidadeLookupTable
                    cidades={pjCidadeResults}
                    onSelect={handlePjCidadeSelect}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {detailModalOpen && selectedAuditIndex !== null && (() => {
        const after = auditLogs[selectedAuditIndex]?.detalhes ?? {};
        const before = auditLogs[selectedAuditIndex + 1]?.detalhes ?? null;
        const isPj = auditDocumentType === 'pessoa_juridica';
        const isUsuario = auditDocumentType === 'usuario';
        const isPerfil = auditDocumentType === 'perfil';
        const isAluno = auditDocumentType === 'aluno';
        const isColaborador = auditDocumentType === 'colaborador';
        const isAtivo = auditDocumentType === 'pat_ativo';
        const isParametros = auditDocumentType === 'pat_parametros';
        const isManutencao = auditDocumentType === 'pat_manutencao';
        const isRelatorio = auditDocumentType === 'relatorio';
        const isBanda = isRelatorio && !!relatorioAuditBandaId;
        // Para bandas, extrair os dados da banda específica do array bandas
        const extractBanda = (detalhes: any): Record<string, any> | null => {
          if (!detalhes || !relatorioAuditBandaId) return null;
          const bandas = detalhes.bandas;
          if (!Array.isArray(bandas)) return null;
          return bandas.find((b: any) => b.id === relatorioAuditBandaId) ?? null;
        };
        const bandaAfter = isBanda ? extractBanda(after) : null;
        const bandaBefore = isBanda ? extractBanda(before) : null;
        // Flattening: extrair campos aninhados (configPdf.*) para o relatório
        const flattenRelatorio = (detalhes: any): Record<string, any> => {
          if (!detalhes) return {};
          const flat: Record<string, any> = {};
          flat.nr_sequencia = detalhes.nr_sequencia;
          flat.ds_relatorio = detalhes.ds_relatorio;
          flat.formato = detalhes.ie_formato;
          // Nome do arquivo: depende do formato
          const cfg = detalhes.configPdf || detalhes.configExcel || {};
          flat.titulo_arquivo = cfg.titulo || '';
          // Config PDF
          const pdf = detalhes.configPdf || {};
          flat.pdf_pagina = pdf.tamanhoPagina || '';
          flat.pdf_orientacao = pdf.orientacao || '';
          flat.pdf_borda = pdf.estiloBorda || '';
          const margens = pdf.margens || {};
          flat.pdf_margem_superior = margens.superior ?? '';
          flat.pdf_margem_inferior = margens.inferior ?? '';
          flat.pdf_margem_esquerda = margens.esquerda ?? '';
          flat.pdf_margem_direita = margens.direita ?? '';
          // Bandas (resumo)
          const bandas = detalhes.bandas;
          if (Array.isArray(bandas)) {
            flat.bandas_sequencia = bandas.map((b: any, i: number) =>
              `${i + 1}. ${b.ds_banda || '(sem nome)'} [${b.ie_tipo_banda || '?'}]`
            ).join('\n');
          } else {
            flat.bandas_sequencia = '';
          }
          return flat;
        };
        const relatorioFlatAfter = isRelatorio && !isBanda ? flattenRelatorio(after) : null;
        const relatorioFlatBefore = isRelatorio && !isBanda ? flattenRelatorio(before) : null;
        const isCg = auditDocumentType === 'cg_sexo' || auditDocumentType === 'cg_estado_civil' || auditDocumentType === 'cg_cor_raca' || auditDocumentType === 'cg_profissao' || auditDocumentType === 'cg_orgao_emissor' || auditDocumentType === 'cg_logradouro' || auditDocumentType === 'cg_grau_parentesco' || auditDocumentType === 'cg_cargo' || auditDocumentType === 'cg_vinculo_contratual' || auditDocumentType === 'cg_localizacao' || auditDocumentType === 'cg_marca' || auditDocumentType === 'cg_categoria_ativo';
        const fieldsOrder = isPj
          ? [
              'nr_sequencia',
              'ds_razao_social',
              'ds_nome_fantasia',
              'nr_cnpj',
              'nr_inscricao_estadual',
              'nr_inscricao_municipal',
              'dt_abertura',
              'ds_email',
              'nr_telefone',
              'cd_ibge_cidade',
              'dt_criacao',
              'dt_alteracao',
            ]
          : isUsuario
          ? [
              'nr_sequencia',
              'nr_seq_pessoa_fisica',
              'ds_usuario',
              'ds_usuario_alternativo',
              'ie_status',
              'ds_observacao',
              'dt_criacao',
              'dt_alteracao',
            ]
          : isPerfil
          ? [
              'nr_sequencia',
              'ds_perfil',
              'ds_observacao',
              'ie_status',
              'config_funcoes',
              'config_permissoes',
              'dt_criacao',
              'dt_alteracao',
            ]
          : isColaborador
          ? [
              'nr_sequencia',
              'nr_seq_pessoa_fisica',
              'nr_seq_pessoa_juridica',
              'nr_matricula',
              'dt_admissao',
              'ie_status',
              'dt_status',
              'ds_motivo_status',
              'dt_criacao',
              'dt_alteracao',
            ]
          : isAluno
          ? [
              'nr_sequencia',
              'nr_seq_pessoa_fisica',
              'nr_matricula',
              'dt_ingresso',
              'ie_status',
              'dt_status',
              'ds_status',
              'responsaveis',
              'ds_tipo_sanguineo',
              'ds_alergia',
              'ds_medicamento_continuo',
              'ds_restricao_alimentar',
              'ds_necessidade_especial',
              'ds_observacao_medica',
              'dt_criacao',
              'dt_alteracao',
            ]
          : isAtivo
          ? [
              'nr_sequencia', 'cd_patrimonio', 'ds_ativo', 'nr_seq_categoria',
              'nr_seq_localizacao', 'nr_seq_marca', 'ds_modelo', 'nr_serie',
              'ds_qr_code', 'ds_codigo_barras', 'dt_aquisicao', 'dt_garantia',
              'ie_status', 'dt_ultima_manutencao', 'nr_seq_ultima_manutencao', 'dt_status', 'ds_motivo_status',
              'ds_processador', 'qt_ram', 'ie_ram', 'qt_armazenamento', 'ie_armazenamento',
              'ds_endereco_mac', 'ds_ip', 'nr_seq_sistema_operacional',
              'responsaveis', 'ds_observacao',
              'dt_criacao', 'dt_alteracao',
            ]
          : isParametros
          ? [
              'ds_regra',
              'dt_criacao', 'dt_alteracao',
            ]
          : isManutencao
          ? [
              'nr_seq_ativo', 'nr_seq_prestador_servico', 'dt_envio', 'dt_termino', 'ie_status_manutencao', 'vl_total', 'ds_motivo_manutencao', 'ds_correcoes', 'ds_observacao',
              'dt_criacao', 'dt_alteracao',
            ]
          : isRelatorio && isBanda
          ? [
              'nome', 'tipo', 'largura', 'alinhamentoHorizontal', 'topoRegistro',
              'alinhamento', 'estiloCampo', 'estiloLabel', 'estiloSoma', 'soma',
              'corCampo', 'fonteCampo', 'tamanhoFonteCampo', 'posicao', 'colecao', 'chave',
            ]
          : isRelatorio
          ? [
              'nr_sequencia', 'ds_relatorio', 'formato', 'titulo_arquivo',
              'pdf_pagina', 'pdf_orientacao', 'pdf_borda',
              'pdf_margem_superior', 'pdf_margem_inferior', 'pdf_margem_esquerda', 'pdf_margem_direita',
              'bandas_sequencia',
            ]
          : isCg
          ? [
              'nr_sequencia',
              auditDocumentType === 'cg_estado_civil' ? 'ds_estado_civil' : auditDocumentType === 'cg_cor_raca' ? 'ds_cor_raca' : auditDocumentType === 'cg_profissao' ? 'ds_profissao' : auditDocumentType === 'cg_orgao_emissor' ? 'ds_orgao_emissor' : auditDocumentType === 'cg_logradouro' ? 'ds_logradouro' : auditDocumentType === 'cg_grau_parentesco' ? 'ds_grau_parentesco' : auditDocumentType === 'cg_cargo' ? 'ds_cargo' : auditDocumentType === 'cg_vinculo_contratual' ? 'ds_vinculo_contratual' : auditDocumentType === 'cg_localizacao' ? 'ds_localizacao' : auditDocumentType === 'cg_marca' ? 'ds_marca' : auditDocumentType === 'cg_categoria_ativo' ? 'ds_categoria' : 'ds_sexo',
              ...(auditDocumentType === 'cg_orgao_emissor' ? ['sg_orgao_emissor'] : auditDocumentType === 'cg_logradouro' ? ['sg_logradouro'] : []),
              'ie_status',
              'dt_criacao',
              'dt_alteracao',
            ]
          : [
              'nr_sequencia',
              'ds_nome',
              'nr_cpf',
              'dt_nascimento',
              'ds_email',
              'nr_telefone',
              'cd_ibge_naturalidade',
              'dt_criacao',
              'dt_alteracao',
            ];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
            <div className="absolute inset-0" onClick={() => setDetailModalOpen(false)} />
            <div className="relative w-full max-w-[1250px] bg-white modal-dark p-0 shadow-xl shadow-black/20 max-h-[90vh] flex flex-col">
              <div className="flex-shrink-0 flex items-center justify-between bg-[#ccc] px-[15px]">
                <h3 className="text-base font-semibold" style={{ color: '#000' }}>Detalhe da auditoria</h3>
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-[15px] overflow-auto">
                <div>
                  {(() => {
                    const FIELD_LABELS: Record<string, string> = {
                      nr_sequencia: 'Sequência',
                      nr_seq_pessoa_fisica: 'Pessoa física',
                      nr_seq_pessoa_juridica: 'Pessoa jurídica',
                      dt_admissao: 'Data de admissão',
                      ds_usuario: 'Usuário',
                      ds_usuario_alternativo: 'Usuário alternativo',
                      ie_status: 'Status',
                      ds_observacao: 'Observação',
                      ds_motivo_manutencao: 'Motivo da manutenção',
                      ds_correcoes: 'Correções',
                      ds_perfil: 'Perfil',
                      config_funcoes: 'Funções',
                      config_permissoes: 'Permissões',

                      ds_nome: 'Nome completo',
                      nr_cpf: 'CPF',
                      dt_nascimento: 'Nascimento',
                      ds_email: 'E-mail',
                      nr_telefone: 'Telefone',
                      cd_ibge_naturalidade: 'Naturalidade',

                      ds_razao_social: 'Razão social',
                      ds_nome_fantasia: 'Nome fantasia',
                      nr_cnpj: 'CNPJ',
                      nr_inscricao_estadual: 'Inscrição estadual',
                      nr_inscricao_municipal: 'Inscrição municipal',
                      dt_abertura: 'Data de abertura',
                      cd_ibge_cidade: 'Cidade',
                      nr_matricula: 'Matrícula',
                      dt_ingresso: 'Data de ingresso',
                      dt_status: 'Data do status',
                      ds_status: 'Motivo do status',
                      dt_ultima_manutencao: 'Última manutenção',
                      nr_seq_ultima_manutencao: 'Última manutenção (seq.)',
                      ds_motivo_status: 'Motivo do status',
                      responsaveis: 'Responsáveis',
                      ds_tipo_sanguineo: 'Tipo sanguíneo',
                      ds_alergia: 'Alergia',
                      ds_medicamento_continuo: 'Medicamento de uso contínuo',
                      ds_restricao_alimentar: 'Restrição alimentar',
                      ds_necessidade_especial: 'Necessidade especial',
                      ds_observacao_medica: 'Observações médicas',
                      ds_sexo: 'Descrição',
                      ds_estado_civil: 'Descrição',
                      ds_cor_raca: 'Descrição',
                      ds_profissao: 'Descrição',
                      ds_orgao_emissor: 'Descrição',
                      sg_orgao_emissor: 'Sigla',
                      ds_logradouro: 'Descrição',
                      sg_logradouro: 'Sigla',
                      ds_cargo: 'Descrição',
                      ds_vinculo_contratual: 'Descrição',
                      ds_sistema_operacional: 'Descrição',
                      ds_grau_parentesco: 'Descrição',
                      ds_localizacao: 'Descrição',
                      ds_marca: 'Descrição',
                      ds_categoria: 'Descrição',
                      ds_regra: 'Regra',
                      nr_seq_ativo: 'Ativo',
                      dt_envio: 'Data de envio',
                      dt_termino: 'Data de término',
                      ie_status_manutencao: 'Status',
                      vl_total: 'Valor total',
                      ds_relatorio: 'Relatório',
                      colecao: 'Coleção',
                      formato: 'Formato',
                      titulo_arquivo: 'Nome do arquivo',
                      pdf_pagina: 'Página',
                      pdf_orientacao: 'Orientação',
                      pdf_borda: 'Borda',
                      pdf_margem_superior: 'Margem superior',
                      pdf_margem_inferior: 'Margem inferior',
                      pdf_margem_esquerda: 'Margem esquerda',
                      pdf_margem_direita: 'Margem direita',
                      bandas_sequencia: 'Bandas',
                      nome: 'Banda',
                      tipo: 'Tipo',
                      posicao: 'Posição',
                      altura: 'Altura',
                      largura: 'Largura',
                      alinhamentoHorizontal: 'Esquerda',
                      topoRegistro: 'Topo',
                      alinhamento: 'Alinhamento',
                      estiloCampo: 'Estilo registro',
                      estiloLabel: 'Estilo label',
                      estiloSoma: 'Estilo soma',
                      soma: 'Soma',
                      corCampo: 'Cor',
                      fonteCampo: 'Fonte',
                      tamanhoFonteCampo: 'Tamanho',
                      chave: 'Campo',
                      cd_patrimonio: 'Patrimônio',
                      ds_ativo: 'Descrição',
                      nr_seq_categoria: 'Categoria',
                      nr_seq_localizacao: 'Localização',
                      nr_seq_marca: 'Marca',
                      ds_modelo: 'Modelo',
                      nr_serie: 'Número de série',
                      ds_qr_code: 'QR Code',
                      ds_codigo_barras: 'Código de barras',
                      dt_aquisicao: 'Data de aquisição',
                      dt_garantia: 'Data de garantia',
                      ds_processador: 'Processador',
                      qt_ram: 'Memória RAM',
                      ie_ram: 'Unidade (RAM)',
                      qt_armazenamento: 'Armazenamento',
                      ie_armazenamento: 'Unidade',
                      ds_endereco_mac: 'Endereço MAC',
                      ds_ip: 'IPv4',
                      nr_seq_sistema_operacional: 'Sistema operacional',
                      dt_criacao: 'Data de criação',
                      dt_alteracao: 'Data de alteração',
                    };
                    // Em Manutenções, o campo nr_seq_prestador_servico é o Prestador.
                    if (isManutencao) FIELD_LABELS['nr_seq_prestador_servico'] = 'Prestador de serviço';

                    const normalizeAuditValue = (val: any): string | number | null => {
                      if (val === null || val === undefined || val === '') return null;
                      if (typeof val === 'object') {
                        if (typeof val.toDate === 'function') {
                          return val.toDate().toISOString();
                        }
                        if (typeof val.seconds === 'number' && typeof val.nanoseconds === 'number') {
                          const ms = val.seconds * 1000 + Math.floor(val.nanoseconds / 1000000);
                          return new Date(ms).toISOString();
                        }
                      }
                      return val;
                    };

                    const getDisplay = (field: string, val: any) => {
                      const normalized = normalizeAuditValue(val);
                      if (normalized === null || normalized === undefined || normalized === '') return '';
                      if (field.startsWith('dt_')) return formatDate(String(normalized));
                      if (field === 'ie_status') {
                        if (isColaborador) return formatColaboradorCellValue('ie_status', normalized);
                        return isAluno ? formatAlunoCellValue('ie_status', normalized) : formatAdminCellValue('ie_status', normalized);
                      }
                      if (field === 'formato') {
                        return String(normalized) === 'excel' ? 'Excel (CSV)' : String(normalized) === 'pdf' ? 'PDF' : String(normalized);
                      }
                      if (field === 'pdf_borda') {
                        const map: Record<string, string> = { 'solid_fina': 'Sólida fina', 'solid_grossa': 'Sólida grossa', 'dupla': 'Dupla', 'tracejada': 'Tracejada', 'pontilhada': 'Pontilhada' };
                        return map[String(normalized)] ?? (String(normalized) === '' ? '---' : String(normalized));
                      }
                      if (field === 'pdf_orientacao') {
                        return String(normalized) === 'retrato' ? 'Retrato' : String(normalized) === 'paisagem' ? 'Paisagem' : String(normalized);
                      }
                      // Responsáveis: array de { nr_seq_responsavel, nr_seq_grau_parentesco }.
                      if (field === 'responsaveis' && Array.isArray(normalized)) {
                        const nomePessoa = Object.fromEntries(pessoasFisicas.map((p) => [p.nr_sequencia, p.ds_nome]));
                        const nomeGrau = Object.fromEntries(grausParentesco.map((g) => [g.nr_sequencia, g.ds_grau_parentesco]));
                        const respArr = normalized as AlunoResponsavel[];
                        return respArr
                          .filter((r) => r && r.nr_seq_responsavel)
                          .map((r) => {
                            const nome = nomePessoa[r.nr_seq_responsavel!] ?? String(r.nr_seq_responsavel);
                            const grau = r.nr_seq_grau_parentesco ? (nomeGrau[r.nr_seq_grau_parentesco] ?? '') : '';
                            return grau ? `${nome} (${grau})` : nome;
                          })
                          .join('\n');
                      }
                      // Informações médicas e demais arrays de strings: um valor por linha.
                      if (Array.isArray(normalized)) {
                        return (normalized as unknown[])
                          .filter((v) => v !== null && v !== undefined && String(v).trim() !== '')
                          .map((v) => String(v))
                          .join('\n');
                      }
                      return String(normalized);
                    };

                    const getFuncoesDisplay = (val: any): string => {
                      const normalized = normalizeAuditValue(val);
                      if (normalized === null || normalized === undefined || normalized === '') return '';
                      const funcoes = parseFuncoesConfig(String(normalized));
                      return funcoes.map((s) => SECTION_DEFS[s]?.label ?? s).join('\n');
                    };

                    const getFuncoesRows = (val: any): number => {
                      const display = getFuncoesDisplay(val);
                      const lines = display.split('\n').filter((l) => l !== '');
                      return Math.max(1, lines.length);
                    };

                    const getPermissoesDisplay = (val: any): string => {
                      const normalized = normalizeAuditValue(val);
                      if (normalized === null || normalized === undefined || normalized === '') return '';
                      const config = parsePermissoesConfig(String(normalized));
                      const lines: string[] = [];
                      // Funções presentes na configuração, em ordem alfabética pelo rótulo.
                      const funcoes = Object.keys(config)
                        .filter((f) => (PERMISSOES_POR_FUNCAO[f] ?? []).length > 0)
                        .sort((a, b) => {
                          const la = SECTION_DEFS[a as SectionType]?.label ?? a;
                          const lb = SECTION_DEFS[b as SectionType]?.label ?? b;
                          return la.localeCompare(lb, 'pt-BR');
                        });
                      for (const funcao of funcoes) {
                        const perms = config[funcao];
                        if (!perms) continue;
                        const funcaoLabel = SECTION_DEFS[funcao as SectionType]?.label ?? funcao;
                        const defs = PERMISSOES_POR_FUNCAO[funcao] ?? [];
                        // Seções do modal, em ordem alfabética pelo título.
                        const grupos = [...(PERMISSOES_GRUPOS[funcao] ?? [])].sort((a, b) =>
                          a.titulo.localeCompare(b.titulo, 'pt-BR')
                        );
                        if (grupos.length === 0) {
                          // Função sem seções: permissões na ordem do modal (defs).
                          for (const def of defs) {
                            lines.push(`${funcaoLabel} > ${def.label} [${perms.includes(def.key) ? 'SIM' : 'NÃO'}]`);
                          }
                          continue;
                        }
                        for (const grupo of grupos) {
                          // Permissões na mesma ordem do modal (ordem das chaves do grupo).
                          for (const chave of grupo.chaves) {
                            const def = defs.find((d) => d.key === chave);
                            if (!def) continue;
                            lines.push(`${funcaoLabel} > ${grupo.titulo} > ${def.label} [${perms.includes(def.key) ? 'SIM' : 'NÃO'}]`);
                          }
                        }
                      }
                      return lines.join('\n');
                    };

                    const getPermissoesRows = (val: any): number => {
                      const display = getPermissoesDisplay(val);
                      const lines = display.split('\n').filter((l) => l !== '');
                      return Math.max(1, lines.length);
                    };

                    // O campo Funções do "Antes" e do "Depois" deve ter a mesma
                    // altura: usa sempre o maior número de linhas entre os dois.
                    const maxFuncoesRows = Math.max(
                      getFuncoesRows(before ? (before as any).config_funcoes : undefined),
                      getFuncoesRows((after as any).config_funcoes)
                    );

                    // O campo Permissões do "Antes" e do "Depois" deve ter a mesma
                    // altura: usa sempre o maior número de linhas entre os dois.
                    const maxPermissoesRows = Math.max(
                      getPermissoesRows(before ? (before as any).config_permissoes : undefined),
                      getPermissoesRows((after as any).config_permissoes)
                    );

                    // Campos com múltiplos valores (responsáveis, alergias, etc.):
                    // um valor por linha, com a mesma altura nas colunas Antes/Depois.
                    const maxArrayRows = (field: string): number => {
                      const linhas = (v: any) =>
                        getDisplay(field, v)
                          .split('\n')
                          .filter((l) => l !== '').length;
                      return Math.max(
                        linhas(before ? (before as any)[field] : undefined),
                        linhas((after as any)[field]),
                        1
                      );
                    };

                    const renderFieldValue = (field: string, val: any) => {
                      if (field === 'config_funcoes') {
                        return (
                          <textarea
                            disabled
                            rows={maxFuncoesRows}
                            value={getFuncoesDisplay(val)}
                            className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm resize-none"
                          />
                        );
                      }
                      if (field === 'config_permissoes') {
                        return (
                          <textarea
                            disabled
                            rows={maxPermissoesRows}
                            value={getPermissoesDisplay(val)}
                            className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm resize-none"
                          />
                        );
                      }
                      if (field === 'bandas_sequencia') {
                        const displayVal = getDisplay(field, val);
                        const lines = displayVal.split('\n').filter((l: string) => l);
                        return (
                          <textarea
                            disabled
                            rows={Math.max(1, lines.length)}
                            value={displayVal}
                            className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm resize-none"
                          />
                        );
                      }
                      // Valores múltiplos (arrays) são exibidos um em cima do outro.
                      if (Array.isArray(normalizeAuditValue(val))) {
                        return (
                          <textarea
                            disabled
                            rows={maxArrayRows(field)}
                            value={getDisplay(field, val)}
                            className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm resize-none"
                          />
                        );
                      }
                      return (
                        <input
                          disabled
                          value={getDisplay(field, val)}
                          className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm"
                        />
                      );
                    };

                    return (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4 w-full">
                        <div className="text-sm font-medium mb-1" style={{ color: '#000' }}>Antes</div>
                        <div className="text-sm font-medium mb-1" style={{ color: '#000' }}>Depois</div>
                        {fieldsOrder.map((field) => {
                          const effectiveBefore = isBanda ? bandaBefore : isRelatorio ? relatorioFlatBefore : before;
                          const effectiveAfter = isBanda ? bandaAfter : isRelatorio ? relatorioFlatAfter : after;
                          return (
                          <React.Fragment key={field}>
                            <div className="w-full min-w-0">
                              <div className="block text-sm mb-1" style={{ color: '#666' }}>{FIELD_LABELS[field] ?? field}</div>
                              {renderFieldValue(field, effectiveBefore ? (effectiveBefore as any)[field] : undefined)}
                            </div>
                            <div className="w-full min-w-0">
                              <div className="block text-sm mb-1" style={{ color: '#666' }}>{FIELD_LABELS[field] ?? field}</div>
                              {renderFieldValue(field, (effectiveAfter as any)[field])}
                            </div>
                          </React.Fragment>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de visualização de Pessoa Física (leitura) */}
      <PessoaFisicaViewModal
        pessoa={pessoaFisicaView}
        cgLookups={pfCgLookups}
        onClose={() => setPessoaFisicaView(null)}
      />

      {/* Modal de visualização de Ativo (leitura) */}
      {ativoView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="absolute inset-0" onClick={() => setAtivoView(null)} />
          <div className="relative w-full max-w-[1000px] bg-white modal-dark p-0 shadow-xl shadow-black/20 max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between bg-[#ccc] px-[15px]">
              <h3 className="text-base font-semibold" style={{ color: '#000' }}>Ativo</h3>
              <button
                type="button"
                onClick={() => setAtivoView(null)}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-[15px] overflow-auto">
              <div className="space-y-8">
                {/* ── Identificação ── */}
                <section>
                  <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Identificação</h2>
                  <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
                    <div className="sm:col-span-1 group">
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Sequência</label>
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={String(ativoView.nr_sequencia ?? '')} />
                    </div>
                    <div className="sm:col-span-3 group">
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Patrimônio</label>
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.cd_patrimonio ?? ''} />
                    </div>
                    <div className="sm:col-span-8 group">
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Descrição</label>
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.ds_ativo ?? ''} />
                    </div>
                    <div className="sm:col-span-3 group">
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Modelo</label>
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.ds_modelo ?? ''} />
                    </div>
                    <div className="sm:col-span-3 group">
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Número de série</label>
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.nr_serie ?? ''} />
                    </div>
                    <div className="sm:col-span-3 group">
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>QR Code</label>
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.ds_qr_code ?? ''} />
                    </div>
                    <div className="sm:col-span-3 group">
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Código de barras</label>
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.ds_codigo_barras ?? ''} />
                    </div>
                    <div className="sm:col-span-3 group">
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Data de aquisição</label>
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.dt_aquisicao ?? ''} />
                    </div>
                    <div className="sm:col-span-3 group">
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Data de garantia</label>
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.dt_garantia ?? ''} />
                    </div>
                    <div className="sm:col-span-3 group">
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Status</label>
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ATIVO_STATUS_OPTIONS.find((s) => s.value === ativoView.ie_status)?.label ?? ativoView.ie_status ?? ''} />
                    </div>
                    <div className="sm:col-span-3 group">
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Data do status</label>
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.dt_status ?? ''} />
                    </div>
                    <div className="sm:col-span-6 group">
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Última manutenção</label>
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.nr_seq_ultima_manutencao != null ? String(ativoView.nr_seq_ultima_manutencao) : ''} />
                    </div>
                    <div className="sm:col-span-12 group">
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Motivo do status</label>
                      <textarea disabled readOnly rows={2} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm resize-none" value={ativoView.ds_motivo_status ?? ''} />
                    </div>
                  </div>
                </section>
                {/* ── Classificação ── */}
                <section>
                  <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Classificação</h2>
                  <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
                    <div className="sm:col-span-4 group">
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Categoria</label>
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.nr_seq_categoria ? (categoriasAtivos.find((c) => c.nr_sequencia === ativoView.nr_seq_categoria)?.ds_categoria ?? String(ativoView.nr_seq_categoria)) : ''} />
                    </div>
                    <div className="sm:col-span-4 group">
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Localização</label>
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.nr_seq_localizacao ? (localizacoes.find((l) => l.nr_sequencia === ativoView.nr_seq_localizacao)?.ds_localizacao ?? String(ativoView.nr_seq_localizacao)) : ''} />
                    </div>
                    <div className="sm:col-span-4 group">
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Marca</label>
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.nr_seq_marca ? (marcas.find((m) => m.nr_sequencia === ativoView.nr_seq_marca)?.ds_marca ?? String(ativoView.nr_seq_marca)) : ''} />
                    </div>
                    {(ativoView.responsaveis ?? []).length > 0 && (
                      <div className="sm:col-span-12 group">
                        <label className="block text-sm mb-1" style={{ color: '#666' }}>Responsável</label>
                        {(ativoView.responsaveis ?? []).map((resp, idx) => (
                          <input key={idx} disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm mb-1 last:mb-0" value={resp.nr_seq_responsavel ? (pessoasFisicas.find((p) => p.nr_sequencia === resp.nr_seq_responsavel)?.ds_nome ?? String(resp.nr_seq_responsavel)) : ''} />
                        ))}
                      </div>
                    )}
                  </div>
                </section>
                {/* ── Dispositivo ── */}
                <section>
                  <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Dispositivo</h2>
                  <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
                    <div className="sm:col-span-4 group">
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Processador</label>
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.ds_processador ?? ''} />
                    </div>
                    <div className="sm:col-span-4 group">
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Memória RAM</label>
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.qt_ram != null ? `${ativoView.qt_ram} ${ativoView.ie_ram ?? ''}` : ''} />
                    </div>
                    <div className="sm:col-span-4 group">
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Armazenamento</label>
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.qt_armazenamento != null ? `${ativoView.qt_armazenamento} ${ativoView.ie_armazenamento ?? ''}` : ''} />
                    </div>
                    <div className="sm:col-span-4 group">
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Endereço MAC</label>
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.ds_endereco_mac ?? ''} />
                    </div>
                    <div className="sm:col-span-4 group"><label className="block text-sm mb-1" style={{ color: '#666' }}>IPv4</label>
                       <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.ds_ip ?? ''} />
                    </div>
                    <div className="sm:col-span-4 group">
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Sistema operacional</label>
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.nr_seq_sistema_operacional ? (sistemasOperacionais.find((s) => s.nr_sequencia === ativoView.nr_seq_sistema_operacional)?.ds_sistema_operacional ?? String(ativoView.nr_seq_sistema_operacional)) : ''} />
                    </div>
                  </div>
                </section>
                {/* ── Observações ── */}
                <section>
                  <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Observações</h2>
                  <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
                    <div className="sm:col-span-12 group">
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>Observação</label>
                      <textarea disabled readOnly rows={4} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm resize-none" value={ativoView.ds_observacao ?? ''} />
                    </div>
                  </div>
                </section>
                <div className="text-[13px] text-slate-500">
                  <div>Criado por {ativoView.ds_usuario_criacao || '-'} em {ativoView.dt_criacao ? formatDate(ativoView.dt_criacao) : '-'}</div>
                  <div className="mt-1">Alterado por {ativoView.ds_usuario_alteracao || '-'} em {ativoView.dt_alteracao ? formatDate(ativoView.dt_alteracao) : '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de visualização de Pessoa Jurídica (leitura) */}
      <PessoaJuridicaViewModal
        pessoa={pessoaJuridicaView}
        cgLookups={pjCgLookups}
        cidadeNome={pessoaJuridicaViewCidade}
        onClose={() => setPessoaJuridicaView(null)}
      />

      {/* Modal de visualização de Manutenção (leitura) */}
      <ManutencaoViewModal
        manutencao={manutencaoView}
        ativoName={manutencaoView?.nr_seq_ativo ? (ativos.find((a) => a.nr_sequencia === manutencaoView.nr_seq_ativo)?.ds_ativo ?? '') : ''}
        prestadorName={(() => {
          if (!manutencaoView?.nr_seq_prestador_servico) return '';
          const seq = manutencaoView.nr_seq_prestador_servico;
          const col = colaboradores.find((c) => c.nr_sequencia === seq);
          if (col) {
            if (col.nr_seq_pessoa_juridica) {
              const pj = pessoasJuridicas.find((p) => p.nr_sequencia === col.nr_seq_pessoa_juridica);
              if (pj) return pj.ds_razao_social ?? '';
            }
            const pf = pessoasFisicas.find((p) => p.nr_sequencia === col.nr_seq_pessoa_fisica);
            if (pf) return pf.ds_nome ?? '';
          }
          return pessoasFisicas.find((p) => p.nr_sequencia === seq)?.ds_nome ?? '';
        })()}
        onClose={() => setManutencaoView(null)}
      />

      {/* ── Modal: Concluir manutenção ── */}
      {concluirManutModalOpen && concluirManutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeConcluirManutModal} />
          <form onSubmit={handleConcluirManutSubmit} className="relative w-full max-w-[560px] min-h-[280px] bg-white modal-dark p-0 shadow-xl shadow-black/20 flex flex-col">
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Concluir manutenção</h2>
              <button type="button" onClick={closeConcluirManutModal} className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2" aria-label="Fechar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="grid gap-[15px] p-[15px]">
              <div>
                <label className="block text-sm mb-1" style={{ color: '#666' }}>Data de término</label>
                <input type="text" inputMode="numeric" maxLength={10} placeholder="DD/MM/AAAA" className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]" value={concluirManutForm.dt_termino} onChange={(e) => setConcluirManutForm({ ...concluirManutForm, dt_termino: applyDateMask(e.target.value) })} />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: '#666' }}>Status</label>
                <Select
                  value={concluirManutForm.ie_status_ativo}
                  onChange={(v) => setConcluirManutForm({ ...concluirManutForm, ie_status_ativo: v })}
                  options={ATIVO_STATUS_OPTIONS.filter((o) => o.value !== 'M')}
                  showPlaceholder={false}
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: '#666' }}>Valor total</label>
                <input type="text" className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={concluirManutForm.vl_total} onChange={(e) => { const digits = e.target.value.replace(/\D/g, ''); if (!digits) { setConcluirManutForm({ ...concluirManutForm, vl_total: '' }); return; } const num = Number(digits) / 100; setConcluirManutForm({ ...concluirManutForm, vl_total: num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }); }} />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: '#666' }}>Correções</label>
                <textarea
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none resize-none"
                  rows={3}
                  value={concluirManutForm.ds_correcoes}
                  onChange={(e) => setConcluirManutForm({ ...concluirManutForm, ds_correcoes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-[15px] pb-[15px] mt-auto">
              <button type="button" onClick={closeConcluirManutModal} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}>Cancelar</button>
              <button type="submit" disabled={concluirManutSaving} className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60" style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}>Salvar</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modal: Cancelar manutenção ── */}
      {cancelarManutOpen && cancelarManutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setCancelarManutOpen(false); setCancelarManutTarget(null); }} />
          <div className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Cancelar manutenção</h2>
              <button type="button" onClick={() => { setCancelarManutOpen(false); setCancelarManutTarget(null); }} className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0" aria-label="Fechar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-[15px] pt-[15px]">
              <p className="text-sm text-slate-900">Deseja mesmo cancelar a manutenção {cancelarManutTarget.nr_sequencia}?</p>
            </div>
            <div className="flex justify-end gap-2 px-[15px] pt-20 pb-[15px]">
              <button type="button" onClick={() => { setCancelarManutOpen(false); setCancelarManutTarget(null); }} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' }}>Não</button>
              <button type="button" onClick={handleCancelarManutSubmit} className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#003056', borderBottomColor: '#000' }}>Sim</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de visualização de Colaborador (leitura) */}
      <ColaboradorViewModal
        colaborador={colaboradorView}
        pessoaFisicaName={colaboradorView?.nr_seq_pessoa_fisica ? (pessoasFisicas.find((p) => p.nr_sequencia === colaboradorView.nr_seq_pessoa_fisica)?.ds_nome ?? '') : ''}
        pessoaJuridicaName={colaboradorView?.nr_seq_pessoa_juridica ? (pessoasJuridicas.find((p) => p.nr_sequencia === colaboradorView.nr_seq_pessoa_juridica)?.ds_razao_social ?? '') : ''}
        vinculoContratualName={colaboradorView?.nr_seq_vinculo_contratual ? (vinculosContratuais.find((v) => v.nr_sequencia === colaboradorView!.nr_seq_vinculo_contratual)?.ds_vinculo_contratual ?? '') : ''}
        onClose={() => setColaboradorView(null)}
      />

      {(submitting || pjSubmitting || adminSubmitting || cgSubmitting) && view === "form" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6">
          <div className="w-full max-w-[240px] border border-slate-200 bg-white p-6 text-center shadow-xl shadow-black/20">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#003056]/10 text-[#003056]">
              <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
                <path d="M22 12a10 10 0 0 1-10 10" />
              </svg>
            </div>
            <p className="text-sm text-slate-900">Carregando...</p>
          </div>
        </div>
      )}

      {/* ── Modal: Parâmetros do relatório ── */}
      {relatorioParamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRelatorioParamModal(null)} />
          <div className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Parâmetros</h2>
              <button
                type="button"
                onClick={() => setRelatorioParamModal(null)}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] p-[15px]">
              {relatorioParamModal.parametros.map((filtro) => {
                const ds = getDataSource(relatorioParamModal.relatorio.colecao);
                const campoLabel = ds?.campos.find((cd) => cd.key === filtro.campo)?.label || filtro.campo;
                const operadorLabel = OPERADORES_FILTRO.find((o) => o.value === filtro.operador)?.label || filtro.operador;
                return (
                  <div key={filtro.id}>
                    <label className="block text-sm mb-1" style={{ color: '#666' }}>{campoLabel} {operadorLabel}</label>
                    <input
                      type="text"
                      inputMode={filtro.mascara === 'decimal' ? 'decimal' : filtro.mascara === 'inteiro' || filtro.mascara === 'data' || filtro.mascara === 'cpf' || filtro.mascara === 'telefone' ? 'numeric' : undefined}
                      maxLength={filtro.mascara === 'data' ? 10 : filtro.mascara === 'cpf' ? 14 : filtro.mascara === 'telefone' ? 15 : undefined}
                      placeholder={filtro.mascara === 'data' ? 'DD/MM/AAAA' : filtro.mascara === 'cpf' ? 'XXX.XXX.XXX-XX' : filtro.mascara === 'telefone' ? '(XX) XXXXX-XXXX' : undefined}
                      value={relatorioParamValues[filtro.id] ?? ''}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (filtro.mascara === 'data') {
                          const digits = val.replace(/\D/g, '').slice(0, 8);
                          if (digits.length <= 2) val = digits;
                          else if (digits.length <= 4) val = digits.slice(0, 2) + '/' + digits.slice(2);
                          else val = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
                        } else if (filtro.mascara === 'inteiro') {
                          val = val.replace(/\D/g, '');
                        } else if (filtro.mascara === 'decimal') {
                          const digits = val.replace(/\D/g, '');
                          if (digits) val = (Number(digits) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          else val = '';
                        } else if (filtro.mascara === 'cpf') {
                          const digits = val.replace(/\D/g, '').slice(0, 11);
                          if (digits.length <= 3) val = digits;
                          else if (digits.length <= 6) val = digits.slice(0, 3) + '.' + digits.slice(3);
                          else if (digits.length <= 9) val = digits.slice(0, 3) + '.' + digits.slice(3, 6) + '.' + digits.slice(6);
                          else val = digits.slice(0, 3) + '.' + digits.slice(3, 6) + '.' + digits.slice(6, 9) + '-' + digits.slice(9);
                        } else if (filtro.mascara === 'telefone') {
                          const digits = val.replace(/\D/g, '').slice(0, 11);
                          if (digits.length <= 2) val = digits;
                          else if (digits.length <= 6) val = '(' + digits.slice(0, 2) + ') ' + digits.slice(2);
                          else if (digits.length <= 10) val = '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 6) + '-' + digits.slice(6);
                          else val = '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 7) + '-' + digits.slice(7);
                        }
                        setRelatorioParamValues((prev) => ({ ...prev, [filtro.id]: val }));
                      }}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={() => setRelatorioParamModal(null)}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRelatorioParamConfirm}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Gerar
              </button>
            </div>
          </div>
        </div>
      )}

      {(gerandoCodigoPatrimonio || parametrosSaving) && <LoadingModal open message="Carregando..." />}

      {toastMounted && (
        <Toast
          visible={toastVisible}
          message={message}
          status={messageStatus}
          onClose={() => setToastVisible(false)}
        />
      )}
    </div>
  );
}
