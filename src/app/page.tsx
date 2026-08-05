"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useState, useCallback, useRef, useMemo } from "react";
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
import { fetchAuditByPessoaId, fetchAuditByUsuarioId, fetchAuditByDocumentId, AuditEntry } from "@/services/auditService";
import type { PessoaFisica } from "@/types/pessoaFisica";
import type { PessoaJuridica } from "@/types/pessoaJuridica";
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
import { PJ_COLUMNS } from "@/lib/pessoaJuridicaUtils";
import { ADMIN_COLUMNS, formatAdminCellValue } from "@/lib/usuarioUtils";
import {
  parseColunasConfig,
  serializeColunasConfig,
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
import AdministracaoSistemaListView from "@/components/administracaoSistema/AdministracaoSistemaListView";
import AdministracaoSistemaFormView from "@/components/administracaoSistema/AdministracaoSistemaFormView";
import PerfilListView from "@/components/administracaoSistema/PerfilListView";
import PerfilFormView, { type PerfilFormData } from "@/components/administracaoSistema/PerfilFormView";
import CamposView from "@/components/administracaoSistema/CamposView";
import {
  parseCamposConfig,
  serializeCamposConfig,
  campoRegrasDaColecao,
  camposObrigatoriosVazios,
  type CampoStatus,
} from "@/lib/camposConfigUtils";
import PessoaFisicaLookupTable from "@/components/pessoaFisica/PessoaFisicaLookupTable";
import CidadeLookupTable from "@/components/pessoaFisica/CidadeLookupTable";
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
import { SEXO_COLUMNS, SEXO_FIELD_INFOS } from "@/lib/sexoUtils";
import { ESTADO_CIVIL_COLUMNS, ESTADO_CIVIL_FIELD_INFOS } from "@/lib/estadoCivilUtils";
import { COR_RACA_COLUMNS, COR_RACA_FIELD_INFOS } from "@/lib/corRacaUtils";
import { PROFISSAO_COLUMNS, PROFISSAO_FIELD_INFOS } from "@/lib/profissaoUtils";
import { ORGAO_EMISSOR_COLUMNS, ORGAO_EMISSOR_FIELD_INFOS } from "@/lib/orgaoEmissorUtils";
import { LOGRADOURO_COLUMNS, LOGRADOURO_FIELD_INFOS } from "@/lib/logradouroUtils";
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
const SYSTEM_VERSION = "0.1.0";

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
type SectionType = "pessoaFisica" | "administracaoSistema" | "cadastrosGerais";

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
};

const emptyCgForm: CadastroGeralFormData = {
  descricao: "",
  ie_status: 'A',
  nr_cbo: '',
  sg_sigla: '',
};

const CG_SELECT_OPTIONS = [
  { value: 'corRaca', label: 'Cor/Raça' },
  { value: 'estadoCivil', label: 'Estado civil' },
  { value: 'logradouro', label: 'Logradouro' },
  { value: 'orgaoEmissor', label: 'Órgão emissor' },
  { value: 'profissao', label: 'Profissão' },
  { value: 'sexo', label: 'Sexo' },
];

/* Opções do dropdown da função Pessoas Físicas / Pessoas Jurídicas */
const PJ_SELECT_OPTIONS = [
  { value: 'pessoasFisicas', label: 'Pessoas Físicas' },
  { value: 'pessoasJuridicas', label: 'Pessoas Jurídicas' },
];

type PjFormData = Omit<PessoaJuridica, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao">;

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

type CgItem = Sexo | EstadoCivil | CorRaca | Profissao | OrgaoEmissor | Logradouro;

/* ------------------------------------------------------------------ */
/*  Funções do menu lateral (ordenáveis por arrastar)                */
/* ------------------------------------------------------------------ */

const DEFAULT_SECTION_ORDER: SectionType[] = ["pessoaFisica", "administracaoSistema", "cadastrosGerais"];

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
    const valid = parsed.filter((s) => s === "pessoaFisica" || s === "administracaoSistema" || s === "cadastrosGerais") as SectionType[];
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
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M8 9h8" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
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
  const [auditDocumentType, setAuditDocumentType] = useState<'pessoa_fisica' | 'pessoa_juridica' | 'usuario' | 'perfil' | 'cg_sexo' | 'cg_estado_civil' | 'cg_cor_raca' | 'cg_profissao' | 'cg_orgao_emissor' | 'cg_logradouro'>('pessoa_fisica');
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
  const [adminManageSelection, setAdminManageSelection] = useState<string>('usuarios');
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
  const [estados, setEstados] = useState<{ value: string; label: string }[]>([]);
  const [cgForm, setCgForm] = useState<CadastroGeralFormData>(emptyCgForm);
  const [cgEditingId, setCgEditingId] = useState<string | null>(null);
  const [cgSubmitting, setCgSubmitting] = useState(false);
  const [cgAuditInfo, setCgAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditCgIdRef = useRef<string | null>(null);
  const [cgFilterModalOpen, setCgFilterModalOpen] = useState(false);
  const [cgFilterForm, setCgFilterForm] = useState<CadastroGeralFilterForm>({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  const [appliedCgFilterForm, setAppliedCgFilterForm] = useState<CadastroGeralFilterForm>({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  const [cgManageSelection, setCgManageSelection] = useState<string>('sexo');
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
  const [pjManageSelection, setPjManageSelection] = useState<string>('pessoasFisicas');
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

  const allowedSections = useMemo(() => {
    // O administrador tem todas as funções liberadas.
    if (isAdministrador) return [...DEFAULT_SECTION_ORDER];

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
  }, [isAdministrador, currentUser?.config_perfis, usuarioPerfisVinculados, activePerfilSequencia]);

  const pfColunasConfig = useMemo(
    () => parseColunasConfig(currentUser?.config_colunas_pessoa_fisica),
    [currentUser?.config_colunas_pessoa_fisica]
  );
  const pjColunasConfig = useMemo(
    () => parseColunasConfig(currentUser?.config_colunas_pessoa_juridica),
    [currentUser?.config_colunas_pessoa_juridica]
  );
  const adminColunasConfig = useMemo(
    () => parseColunasConfig(currentUser?.config_colunas_as_usuario),
    [currentUser?.config_colunas_as_usuario]
  );
  const perfilColunasConfig = useMemo(
    () => parseColunasConfig(currentUser?.config_colunas_as_perfil),
    [currentUser?.config_colunas_as_perfil]
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
  } as const;

  const cgKind = cgManageSelection === 'estadoCivil' ? 'estadoCivil' : cgManageSelection === 'corRaca' ? 'corRaca' : cgManageSelection === 'profissao' ? 'profissao' : cgManageSelection === 'orgaoEmissor' ? 'orgaoEmissor' : cgManageSelection === 'logradouro' ? 'logradouro' : 'sexo';
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

  const loadCgItems = useCallback(async () => {
    if (cgKind === 'sexo') {
      await loadSexos();
    } else if (cgKind === 'estadoCivil') {
      await loadEstadoCivis();
    } else if (cgKind === 'corRaca') {
      await loadCoresRacas();
    } else if (cgKind === 'profissao') {
      await loadProfissoes();
    } else if (cgKind === 'logradouro') {
      await loadLogradouros();
    } else {
      await loadOrgaosEmissores();
    }
  }, [cgKind, loadSexos, loadEstadoCivis, loadCoresRacas, loadProfissoes, loadLogradouros, loadOrgaosEmissores]);

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
    loadPessoasJuridicas();
  }, [loadPessoasFisicas, loadUsuarios, loadPerfis, loadSexos, loadEstadoCivis, loadCoresRacas, loadProfissoes, loadOrgaosEmissores, loadLogradouros, loadPessoasJuridicas]);

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
        })
      );
    } catch {
      /* storage indisponível — sessão não persiste */
    }
  }, [isAuthenticated, currentUser, activeSection, adminManageSelection, cgManageSelection, pjManageSelection]);

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
    setMenuOrder(parsed ? normalizeMenuOrder(parsed) : DEFAULT_SECTION_ORDER);
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
        };

        if (!session?.userId) return;

        const usuariosCadastrados = await obterUsuarios();
        if (cancelled) return;

        const usuarioSalvo = usuariosCadastrados.find((u) => u.id === session.userId);
        if (!usuarioSalvo) {
          window.localStorage.removeItem(SESSION_KEY);
          return;
        }

        setCurrentUser(usuarioSalvo);
        if (session.activeSection === "administracaoSistema" || session.activeSection === "pessoaFisica" || session.activeSection === "cadastrosGerais") {
          setActiveSection(session.activeSection);
        }
        if (typeof session.adminManageSelection === "string" && (session.adminManageSelection === 'usuarios' || session.adminManageSelection === 'perfis' || session.adminManageSelection === 'campos')) {
          setAdminManageSelection(session.adminManageSelection);
        }
        if (typeof session.cgManageSelection === "string" && session.cgManageSelection.trim() !== "") {
          setCgManageSelection(session.cgManageSelection);
        }
        if (typeof session.pjManageSelection === "string" && (session.pjManageSelection === 'pessoasFisicas' || session.pjManageSelection === 'pessoasJuridicas')) {
          setPjManageSelection(session.pjManageSelection);
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
    setCgManageSelection(value);
    // Ao trocar a seleção no meio da edição, zera o registro em edição
    // para nunca salvar contra a coleção errada.
    setCgForm(emptyCgForm);
    setCgEditingId(null);
    setCgAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  }

  function handlePjManageSelectionChange(value: string) {
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
    setAuditDocumentType(cgCollection as 'cg_sexo' | 'cg_estado_civil' | 'cg_cor_raca' | 'cg_profissao' | 'cg_orgao_emissor' | 'cg_logradouro');
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
      };
      if (adminForm.nr_seq_pessoa_fisica !== undefined && adminForm.nr_seq_pessoa_fisica !== null) {
        usuarioPayload.nr_seq_pessoa_fisica = adminForm.nr_seq_pessoa_fisica;
      }

      if (adminEditingId) {
        const currentUsuario = usuarios.find((u) => u.id === adminEditingId);
        const hasChanges = currentUsuario
          ? [
              'nr_seq_pessoa_fisica',
              'ds_usuario',
              'ds_usuario_alternativo',
              'ds_email',
              'ds_observacao',
              'ie_status',
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
      } as Record<string, unknown>;

      if (cgEditingId) {
        const currentItem = cgItems.find((s) => s.id === cgEditingId);
        const changeKeys = cgKind === 'profissao' ? [cgDescKey, 'ie_status', 'nr_cbo'] : cgKind === 'orgaoEmissor' ? [cgDescKey, 'ie_status', 'sg_orgao_emissor'] : cgKind === 'logradouro' ? [cgDescKey, 'ie_status', 'sg_logradouro'] : [cgDescKey, 'ie_status'];
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
      // Duplica o perfil preservando status, observação, funções liberadas
      // e as regras de campos (obrigatórios/desabilitados por função).
      await criarPerfil(
        {
          ds_perfil: nome,
          ds_observacao: duplicatePerfilSource.ds_observacao ?? '',
          ie_status: duplicatePerfilSource.ie_status ?? 'A',
          config_funcoes: duplicatePerfilSource.config_funcoes,
          config_campos: duplicatePerfilSource.config_campos,
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
      } else if (cgKind === 'profissao') {
        await excluirProfissao(id);
      } else if (cgKind === 'logradouro') {
        await excluirLogradouro(id);
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
    if (message.toLowerCase().includes("sucesso")) return "success";
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
          showView={view === 'list'}
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
            } else {
              openCgEditForm(contextMenu.item as Sexo | EstadoCivil | CorRaca | Profissao | Logradouro);
            }
            setContextMenu(null);
          }}
          showChangePassword={contextMenu.section === 'administracaoSistema' && adminManageSelection === 'usuarios' && !isProtectedAdminItem}
          onChangePassword={() => {
            if (contextMenu.section === 'administracaoSistema') {
              openChangePasswordModal(contextMenu.item as Usuario);
            }
            setContextMenu(null);
          }}
          onDelegateFunctions={
            contextMenu.section === 'administracaoSistema' && adminManageSelection === 'perfis' && !isProtectedAdminItem
              ? () => {
                  openDelegateFuncoesModal(contextMenu.item as Perfil);
                  setContextMenu(null);
                }
              : undefined
          }
          onDuplicate={
            contextMenu.section === 'administracaoSistema' && adminManageSelection === 'perfis' && !isProtectedAdminItem
              ? () => {
                  openDuplicatePerfilModal(contextMenu.item as Perfil);
                  setContextMenu(null);
                }
              : undefined
          }
          onDelegatePerfis={
            contextMenu.section === 'administracaoSistema' && adminManageSelection === 'usuarios' && !isProtectedAdminItem
              ? () => {
                  openDelegatePerfisModal(contextMenu.item as Usuario);
                  setContextMenu(null);
                }
              : undefined
          }
          showDelete={!isProtectedAdminItem}
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
            } else {
              const cg = contextMenu.item as Sexo | EstadoCivil | CorRaca | Profissao | OrgaoEmissor | Logradouro;
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
                  setActiveSection(section);
                  setView('list');
                  setContextMenu(null);
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
                  className="fixed bottom-4 left-4 z-50 origin-bottom-left max-w-[320px] w-auto inline-block rounded-[2px] bg-[#003056] p-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.16)]"
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
                      <span className="flex h-6 w-11 shrink-0 items-center rounded-full bg-[#2cc958] p-[2px] transition-colors duration-300">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full shadow transition-transform duration-300 ease-out ${
                            darkMode ? "bg-white translate-x-5" : "bg-[#003056] translate-x-0"
                          }`}
                        >
                          {darkMode ? (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-[#003056]">
                              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                          ) : (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                        className="!bg-[#1A4567] !text-white !border-[#1A4567] !rounded-[2px]"
                      />
                    </div>
                  )}

                  {/* Alterar senha, Base de Conhecimento, Central de Suporte e Política de Privacidade */}
                  <div className="mt-8 flex flex-col gap-2">
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
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center justify-center rounded-[2px] bg-[#1A4567] px-[7px] py-[5px] text-[13px] text-white transition hover:bg-[#173d5c] focus:bg-[#173d5c] outline-none"
                    >
                      Base de Conhecimento
                    </button>
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center justify-center rounded-[2px] bg-[#1A4567] px-[7px] py-[5px] text-[13px] text-white transition hover:bg-[#173d5c] focus:bg-[#173d5c] outline-none"
                    >
                      Central de Suporte
                    </button>
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
                  openNewForm={openPjNewForm}
                  openEditForm={openPjEditForm}
                  openFilter={openPjFilterModal}
                  handleDelete={handlePjDelete}
                  setContextMenu={setContextMenu}
                  selectOptions={PJ_SELECT_OPTIONS}
                  manageSelection={pjManageSelection}
                  onManageSelectionChange={handlePjManageSelectionChange}
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
                  openNewForm={openNewForm}
                  openEditForm={openEditForm}
                  openFilter={openFilterModal}
                  handleDelete={handleDelete}
                  setContextMenu={setContextMenu}
                  selectOptions={PJ_SELECT_OPTIONS}
                  manageSelection={pjManageSelection}
                  onManageSelectionChange={handlePjManageSelectionChange}
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
                />
              ) : adminManageSelection === 'usuarios' ? (
                <AdministracaoSistemaListView
                  message={message}
                  loading={loading}
                  usuarios={filteredSortedUsuarios}
                  pessoasFisicas={pessoasFisicas}
                  openNewForm={openAdminNewForm}
                  openEditForm={openAdminEditForm}
                  setContextMenu={setContextMenu}
                  sortColumn={adminSortColumn}
                  sortAsc={adminSortAsc}
                  onSortChange={handleAdminSortChange}
                  manageSelection={adminManageSelection}
                  onManageSelectionChange={handleAdminManageSelectionChange}
                  openFilter={openAdminFilterModal}
                  initialColumns={adminColunasConfig}
                  onColumnsChange={handleAdminColumnsChange}
                />
              ) : (
                <PerfilListView
                  message={message}
                  loading={loading}
                  perfis={filteredSortedPerfis}
                  openNewForm={openPerfilNewForm}
                  openEditForm={openPerfilEditForm}
                  setContextMenu={setContextMenu}
                  sortColumn={perfilSortColumn}
                  sortAsc={perfilSortAsc}
                  onSortChange={handlePerfilSortChange}
                  manageSelection={adminManageSelection}
                  onManageSelectionChange={handleAdminManageSelectionChange}
                  openFilter={openPerfilFilterModal}
                  initialColumns={perfilColunasConfig}
                  onColumnsChange={handlePerfilColumnsChange}
                />
              )
            ) : (
              (cgManageSelection === 'sexo' || cgManageSelection === 'estadoCivil' || cgManageSelection === 'corRaca' || cgManageSelection === 'profissao' || cgManageSelection === 'orgaoEmissor' || cgManageSelection === 'logradouro') ? (
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
                  openNewForm={openCgNewForm}
                  openEditForm={openCgEditForm}
                  openFilter={openCgFilterModal}
                  setContextMenu={setContextMenu}
                  sortColumn={cgSortColumn}
                  sortAsc={cgSortAsc}
                  onSortChange={handleCgSortChange}
                  initialColumns={cgColunasConfig}
                  onColumnsChange={handleCgColumnsChange}
                />
              ) : (
                <div className="p-6">
                  <h2 className="text-lg font-semibold">Cadastros Gerais</h2>
                  <p className="mt-2 text-sm text-slate-600">Selecione um cadastro para gerenciar nesta seção.</p>
                </div>
              )
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
                campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'pessoa_fisica')}
                campoErros={pfCampoErros}
              />
            )
          ) : activeSection === "administracaoSistema" ? (
            adminManageSelection === 'campos' ? (
              <CamposView
                perfis={perfis}
                onChangeStatus={handleCamposStatusChange}
                manageSelection={adminManageSelection}
                onManageSelectionChange={handleAdminManageSelectionChange}
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
                onOpenAudit={openAdminAuditModal}
                manageSelection={adminManageSelection}
                onManageSelectionChange={handleAdminManageSelectionChange}
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
                readOnly={!isAdministrador && perfilEditingId ? isAdministradorPerfil(perfis.find((a) => a.id === perfilEditingId)) : false}
                campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'perfil')}
                campoErros={perfilCampoErros}
              />
            )
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
              selectOptions={CG_SELECT_OPTIONS}
              fieldInfos={cgFieldInfos}
              descFieldKey={cgDescKey}
              collectionName={cgCollection}
              showCbo={cgKind === 'profissao'}
              showSigla={cgKind === 'orgaoEmissor' || cgKind === 'logradouro'}
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
                      className="flex border bg-white"
                      style={{
                        padding: '10px',
                        borderStyle: 'solid',
                        borderWidth: '1px',
                        borderTopColor: '#999',
                        borderLeftColor: '#999',
                        borderBottomColor: '#ccc',
                        borderRightColor: '#ccc',
                      }}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="text-sm font-medium truncate" style={{ color: '#000' }}>{SECTION_DEFS[section].label}</div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          onClick={() => toggleDelegateFuncao(section)}
                          className={`flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full p-[2px] transition-colors duration-300 ${enabled ? 'bg-[#2cc958]' : 'bg-[#bbb]'}`}
                        >
                          <span
                            className={`flex h-3 w-3 items-center justify-center rounded-full bg-white shadow transition-transform duration-300 ease-out ${enabled ? 'translate-x-3' : 'translate-x-0'}`}
                          />
                        </button>
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
                        className="flex border bg-white"
                        style={{
                          padding: '10px',
                          borderStyle: 'solid',
                          borderWidth: '1px',
                          borderTopColor: '#999',
                          borderLeftColor: '#999',
                          borderBottomColor: '#ccc',
                          borderRightColor: '#ccc',
                        }}
                      >
                        <div className="flex w-full items-center justify-between">
                          <div className="text-sm font-medium truncate text-slate-900">{perfil.ds_perfil}</div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={enabled}
                            onClick={() => toggleDelegatePerfil(perfil.nr_sequencia)}
                            className={`flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full p-[2px] transition-colors duration-300 ${enabled ? 'bg-[#2cc958]' : 'bg-[#bbb]'}`}
                          >
                            <span
                              className={`flex h-3 w-3 items-center justify-center rounded-full bg-white shadow transition-transform duration-300 ease-out ${enabled ? 'translate-x-3' : 'translate-x-0'}`}
                            />
                          </button>
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
                          borderTopColor: '#999',
                          borderLeftColor: '#999',
                          borderBottomColor: '#ccc',
                          borderRightColor: '#ccc',
                        }}
                      >
                        <div className="flex w-full items-center justify-between">
                          <div className="text-sm font-medium truncate" style={{ color: '#000' }}>{log.usuarioNome ?? log.usuarioId ?? ''}</div>
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

      {pessoaFisicaLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closePessoaFisicaLookup} />
          <div className="relative w-full max-w-[960px] bg-white p-0 shadow-xl shadow-black/20 h-[600px] max-h-[90vh] overflow-hidden">
            <div className="flex h-full">
              <div className="w-[320px] border-r border-slate-300 bg-[#fafafa] flex flex-col min-h-0">
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
                    style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
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
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
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

      {adminPessoaFisicaLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAdminPessoaFisicaLookup} />
          <div className="relative w-full max-w-[960px] bg-white p-0 shadow-xl shadow-black/20 h-[600px] max-h-[90vh] overflow-hidden">
            <div className="flex h-full">
              <div className="w-[320px] border-r border-slate-300 bg-[#fafafa] flex flex-col min-h-0">
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
                    style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
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
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
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
              <div className="w-[320px] border-r border-slate-300 bg-[#fafafa] flex flex-col min-h-0">
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
                    style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
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
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
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
              <div className="w-[320px] border-r border-slate-300 bg-[#fafafa] flex flex-col min-h-0">
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
                    style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
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
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
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
        const isCg = auditDocumentType === 'cg_sexo' || auditDocumentType === 'cg_estado_civil' || auditDocumentType === 'cg_cor_raca' || auditDocumentType === 'cg_profissao' || auditDocumentType === 'cg_orgao_emissor' || auditDocumentType === 'cg_logradouro';
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
              'dt_criacao',
              'dt_alteracao',
            ]
          : isCg
          ? [
              'nr_sequencia',
              auditDocumentType === 'cg_estado_civil' ? 'ds_estado_civil' : auditDocumentType === 'cg_cor_raca' ? 'ds_cor_raca' : auditDocumentType === 'cg_profissao' ? 'ds_profissao' : auditDocumentType === 'cg_orgao_emissor' ? 'ds_orgao_emissor' : auditDocumentType === 'cg_logradouro' ? 'ds_logradouro' : 'ds_sexo',
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
            <div className="relative w-full max-w-[800px] bg-white modal-dark p-0 shadow-xl shadow-black/20 max-h-[90vh] flex flex-col">
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
                <div className="grid grid-cols-2 gap-4">
                  {(() => {
                    const FIELD_LABELS: Record<string, string> = {
                      nr_sequencia: 'Sequência',
                      nr_seq_pessoa_fisica: 'Pessoa física',
                      ds_usuario: 'Usuário',
                      ds_usuario_alternativo: 'Usuário alternativo',
                      ie_status: 'Status',
                      ds_observacao: 'Observação',
                      ds_perfil: 'Perfil',
                      config_funcoes: 'Funções',

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
                      ds_sexo: 'Descrição',
                      ds_estado_civil: 'Descrição',
                      ds_cor_raca: 'Descrição',
                      ds_profissao: 'Descrição',
                      ds_orgao_emissor: 'Descrição',
                      sg_orgao_emissor: 'Sigla',
                      ds_logradouro: 'Descrição',
                      sg_logradouro: 'Sigla',
                      dt_criacao: 'Criação',
                      dt_alteracao: 'Alteração',
                    };

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
                      if (field === 'ie_status') return formatAdminCellValue('ie_status', normalized);
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

                    // O campo Funções do "Antes" e do "Depois" deve ter a mesma
                    // altura: usa sempre o maior número de linhas entre os dois.
                    const maxFuncoesRows = Math.max(
                      getFuncoesRows(before ? (before as any).config_funcoes : undefined),
                      getFuncoesRows((after as any).config_funcoes)
                    );

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
                      return (
                        <input
                          disabled
                          value={getDisplay(field, val)}
                          className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm"
                        />
                      );
                    };

                    return (
                      <>
                        <div>
                          <div className="text-sm font-medium mb-2" style={{ color: '#000' }}>Antes</div>
                          <div className="space-y-3 text-sm">
                            {fieldsOrder.map((field) => (
                              <div key={field}>
                                <label className="block text-sm mb-1" style={{ color: '#666' }}>{FIELD_LABELS[field] ?? field}</label>
                                {renderFieldValue(field, before ? (before as any)[field] : undefined)}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-2" style={{ color: '#000' }}>Depois</div>
                          <div className="space-y-3 text-sm">
                            {fieldsOrder.map((field) => (
                              <div key={field}>
                                <label className="block text-sm mb-1" style={{ color: '#666' }}>{FIELD_LABELS[field] ?? field}</label>
                                {renderFieldValue(field, (after as any)[field])}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
