"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  criarPessoaFisica,
  excluirPessoaFisica,
  obterPessoasFisicas,
  atualizarPessoaFisica,
} from "@/services/pessoaFisicaService";
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
import { fetchAuditByPessoaId, fetchAuditByUsuarioId, fetchAuditByDocumentId, AuditEntry } from "@/services/auditService";
import type { PessoaFisica } from "@/types/pessoaFisica";
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
import AdministracaoSistemaListView from "@/components/administracaoSistema/AdministracaoSistemaListView";
import AdministracaoSistemaFormView from "@/components/administracaoSistema/AdministracaoSistemaFormView";
import PessoaFisicaLookupTable from "@/components/pessoaFisica/PessoaFisicaLookupTable";
import CadastroGeralListView from "@/components/cadastrosGerais/CadastroGeralListView";
import CadastroGeralFormView, { type CadastroGeralFormData } from "@/components/cadastrosGerais/CadastroGeralFormView";
import CadastroGeralFilterModal, { type CadastroGeralFilterForm } from "@/components/cadastrosGerais/CadastroGeralFilterModal";
import Select from "@/components/ui/Select";
import type { Sexo } from "@/types/sexo";
import type { EstadoCivil } from "@/types/estadoCivil";
import type { CorRaca } from "@/types/corRaca";
import type { Profissao } from "@/types/profissao";
import { SEXO_COLUMNS, SEXO_FIELD_INFOS } from "@/lib/sexoUtils";
import { ESTADO_CIVIL_COLUMNS, ESTADO_CIVIL_FIELD_INFOS } from "@/lib/estadoCivilUtils";
import { COR_RACA_COLUMNS, COR_RACA_FIELD_INFOS } from "@/lib/corRacaUtils";
import { PROFISSAO_COLUMNS, PROFISSAO_FIELD_INFOS } from "@/lib/profissaoUtils";
import { formatCadastroGeralCellValue } from "@/lib/cadastroGeralUtils";
import type { Usuario } from "@/types/usuario";
import type { ContextMenuState } from "@/types/contextMenu";

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
};

/* Chave da sessão persistida no localStorage */
const SESSION_KEY = "quasar_session";

/* Chave base da preferência de tema no localStorage (uma por usuário) */
const DARK_MODE_KEY = "quasar_dark_mode";

/* Versão do sistema exibida na pop-up do usuário (sincronizada com package.json) */
const SYSTEM_VERSION = "0.1.0";

function getDarkModeKey(userId?: string | null): string {
  return userId ? `${DARK_MODE_KEY}_${userId}` : DARK_MODE_KEY;
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
};

const CG_SELECT_OPTIONS = [
  { value: 'sexo', label: 'Sexo' },
  { value: 'estadoCivil', label: 'Estado civil' },
  { value: 'corRaca', label: 'Cor/Raça' },
  { value: 'profissao', label: 'Profissão' },
];

type CgItem = Sexo | EstadoCivil | CorRaca | Profissao;

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

const SECTION_DEFS: Record<SectionType, { label: string; labelMaxW: string; icon: React.ReactNode }> = {
  pessoaFisica: {
    label: "Pessoas Físicas",
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
  const [auditDocumentType, setAuditDocumentType] = useState<'pessoa_fisica' | 'usuario' | 'cg_sexo' | 'cg_estado_civil' | 'cg_cor_raca' | 'cg_profissao'>('pessoa_fisica');
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
  const [sexos, setSexos] = useState<Sexo[]>([]);
  const [estadoCivis, setEstadoCivis] = useState<EstadoCivil[]>([]);
  const [coresRacas, setCoresRacas] = useState<CorRaca[]>([]);
  const [profissoes, setProfissoes] = useState<Profissao[]>([]);
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
  const [adminOriginalSenhaHash, setAdminOriginalSenhaHash] = useState<string | null>(null);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [pessoaFisicaLookupOpen, setPessoaFisicaLookupOpen] = useState(false);
  const [lookupForm, setLookupForm] = useState({ ds_nome: '', nr_sequencia: '', nr_cpf: '' });
  const [lookupFilter, setLookupFilter] = useState({ ds_nome: '', nr_sequencia: '', nr_cpf: '' });
  const [lookupApplied, setLookupApplied] = useState(false);
  const [passwordChangeValue, setPasswordChangeValue] = useState("");
  const [passwordChangeConfirmValue, setPasswordChangeConfirmValue] = useState("");
  const [passwordChangeUserId, setPasswordChangeUserId] = useState<string | null>(null);
  const [passwordChangeIsSelf, setPasswordChangeIsSelf] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
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

  const pfColunasConfig = useMemo(
    () => parseColunasConfig(currentUser?.config_colunas_pessoa_fisica),
    [currentUser?.config_colunas_pessoa_fisica]
  );
  const adminColunasConfig = useMemo(
    () => parseColunasConfig(currentUser?.config_colunas_as_usuario),
    [currentUser?.config_colunas_as_usuario]
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
  } as const;

  const cgKind = cgManageSelection === 'estadoCivil' ? 'estadoCivil' : cgManageSelection === 'corRaca' ? 'corRaca' : cgManageSelection === 'profissao' ? 'profissao' : 'sexo';
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
    }),
    [sexos, estadoCivis, coresRacas, profissoes]
  );

  /* ── Lookups (nr_sequencia → descrição) para as colunas de Pessoa Física ── */
  const pfCgLookups = useMemo(
    () => ({
      nr_seq_sexo: Object.fromEntries(pfCgOptions.sexos.map((o) => [o.nr_sequencia, o.descricao])),
      nr_seq_estado_civil: Object.fromEntries(pfCgOptions.estadoCivis.map((o) => [o.nr_sequencia, o.descricao])),
      nr_seq_cor_raca: Object.fromEntries(pfCgOptions.coresRacas.map((o) => [o.nr_sequencia, o.descricao])),
      nr_seq_profissao: Object.fromEntries(pfCgOptions.profissoes.map((o) => [o.nr_sequencia, o.descricao])),
    }),
    [pfCgOptions]
  );

  /* ── Carregar pessoas físicas e usuários ── */
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

  const loadCgItems = useCallback(async () => {
    if (cgKind === 'sexo') {
      await loadSexos();
    } else if (cgKind === 'estadoCivil') {
      await loadEstadoCivis();
    } else if (cgKind === 'corRaca') {
      await loadCoresRacas();
    } else {
      await loadProfissoes();
    }
  }, [cgKind, loadSexos, loadEstadoCivis, loadCoresRacas, loadProfissoes]);

  useEffect(() => {
    loadPessoasFisicas();
    loadUsuarios();
    loadSexos();
    loadEstadoCivis();
    loadCoresRacas();
    loadProfissoes();
  }, [loadPessoasFisicas, loadUsuarios, loadSexos, loadEstadoCivis, loadCoresRacas, loadProfissoes]);

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
        })
      );
    } catch {
      /* storage indisponível — sessão não persiste */
    }
  }, [isAuthenticated, currentUser, activeSection, adminManageSelection, cgManageSelection]);

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
        if (typeof session.adminManageSelection === "string" && session.adminManageSelection.trim() !== "") {
          setAdminManageSelection(session.adminManageSelection);
        }
        if (typeof session.cgManageSelection === "string" && session.cgManageSelection.trim() !== "") {
          setCgManageSelection(session.cgManageSelection);
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
    setView("form");
    setActiveSection("pessoaFisica");
  }

  function openAdminNewForm() {
    setAdminForm({ ...emptyAdminForm, nr_seq_pessoa_fisica: undefined });
    setAdminEditingId(null);
    setAdminOriginalSenhaHash(null);
    setAdminAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setView("form");
    setActiveSection("administracaoSistema");
  }

  function openCgNewForm() {
    setCgForm(emptyCgForm);
    setCgEditingId(null);
    setCgAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setView("form");
    setActiveSection("cadastrosGerais");
  }

  function handleCgManageSelectionChange(value: string) {
    setCgManageSelection(value);
    // Ao trocar a seleção no meio da edição, zera o registro em edição
    // para nunca salvar contra a coleção errada.
    setCgForm(emptyCgForm);
    setCgEditingId(null);
    setCgAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
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

  async function openCgAuditModal(cgId?: string | null) {
    if (!cgId) return;
    setAuditDocumentType(cgCollection as 'cg_sexo' | 'cg_estado_civil' | 'cg_cor_raca' | 'cg_profissao');
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

  function openAdminFilterModal() {
    setAdminFilterForm(appliedAdminFilterForm);
    setAdminFilterModalOpen(true);
  }

  function closeAdminFilterModal() {
    setAdminFilterModalOpen(false);
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
    });
    setEditingId(pessoa.id ?? null);
    setAuditInfo({
      createdAt: pessoa.dt_criacao ?? '',
      updatedAt: pessoa.dt_alteracao ?? '',
      createdBy: pessoa.ds_usuario_criacao ?? '',
      updatedBy: pessoa.ds_usuario_alteracao ?? '',
    });
    auditPessoaIdRef.current = pessoa.id ?? null;
    setMessage("");
    setView("form");
    setActiveSection("pessoaFisica");
    if (pessoa.id) {
      carregarAutorAuditoriaPessoa(pessoa.id);
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

  function goToAdminList() {
    setAdminForm(emptyAdminForm);
    setAdminEditingId(null);
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

  const hasPrevRecord = currentEditIndex > 0;
  const hasNextRecord = currentEditIndex >= 0 && currentEditIndex < filteredSortedPessoasFisicas.length - 1;
  const hasPrevAdminRecord = currentAdminEditIndex > 0;
  const hasNextAdminRecord = currentAdminEditIndex >= 0 && currentAdminEditIndex < filteredSortedUsuarios.length - 1;
  const hasPrevCgRecord = currentCgEditIndex > 0;
  const hasNextCgRecord = currentCgEditIndex >= 0 && currentCgEditIndex < filteredSortedCgItems.length - 1;

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

  /* ── Salvar (criar ou atualizar) ── */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
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

  async function handleCgSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setCgSubmitting(true);

    try {
      const payload = {
        [cgDescKey]: cgForm.descricao,
        ie_status: cgForm.ie_status,
        ...(cgKind === 'profissao' ? { nr_cbo: cgForm.nr_cbo ?? '' } : {}),
      } as Record<string, unknown>;

      if (cgEditingId) {
        const currentItem = cgItems.find((s) => s.id === cgEditingId);
        const changeKeys = cgKind === 'profissao' ? [cgDescKey, 'ie_status', 'nr_cbo'] : [cgDescKey, 'ie_status'];
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
        } else {
          await atualizarProfissao(cgEditingId, payload as any, auditAutor);
        }
        setMessage("Atualizado com sucesso!");
      } else {
        if (cgKind === 'sexo') {
          await criarSexo(payload as any, auditAutor);
        } else if (cgKind === 'estadoCivil') {
          await criarEstadoCivil(payload as any, auditAutor);
        } else if (cgKind === 'corRaca') {
          await criarCorRaca(payload as any, auditAutor);
        } else {
          await criarProfissao(payload as any, auditAutor);
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
  async function handleDelete(id: string) {
    setMessage("");
    try {
      await excluirPessoaFisica(id);
      setMessage("Excluído com sucesso!");
      await loadPessoasFisicas();
    } catch {
      setMessage("Erro ao excluir.");
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
      } else {
        await excluirProfissao(id);
      }
      setMessage("Excluído com sucesso!");
      await loadCgItems();
    } catch {
      setMessage("Erro ao excluir.");
    }
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
          onView={() => {
            if (contextMenu.section === 'pessoaFisica') {
              openEditForm(contextMenu.item as PessoaFisica);
            } else if (contextMenu.section === 'administracaoSistema') {
              openAdminEditForm(contextMenu.item as Usuario);
            } else {
              openCgEditForm(contextMenu.item as Sexo | EstadoCivil | CorRaca | Profissao);
            }
            setContextMenu(null);
          }}
          onChangePassword={() => {
            if (contextMenu.section === 'administracaoSistema') {
              openChangePasswordModal(contextMenu.item as Usuario);
            }
            setContextMenu(null);
          }}
          onDelete={() => {
            if (contextMenu.section === 'pessoaFisica') {
              const pessoaId = (contextMenu.item as PessoaFisica).id;
              if (pessoaId) handleDelete(pessoaId);
            } else if (contextMenu.section === 'administracaoSistema') {
              const usuarioId = (contextMenu.item as Usuario).id;
              if (usuarioId) handleAdminDelete(usuarioId);
            } else {
              const cgId = (contextMenu.item as Sexo | EstadoCivil | CorRaca | Profissao).id;
              if (cgId) handleCgDelete(cgId);
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
          {menuOrder.map((section) => {
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
        <div className="w-full flex-1 flex flex-col min-h-0 px-[15px] py-[15px]">
          {view === "list" ? (
            activeSection === "pessoaFisica" ? (
              <PessoaFisicaListView
                message={message}
                loading={loading}
                pessoasFisicas={filteredSortedPessoasFisicas}
                openNewForm={openNewForm}
                openEditForm={openEditForm}
                openFilter={openFilterModal}
                handleDelete={handleDelete}
                setContextMenu={setContextMenu}
                sortColumn={sortColumn}
                sortAsc={sortAsc}
                onSortChange={handleSortChange}
                initialColumns={pfColunasConfig}
                onColumnsChange={handlePfColumnsChange}
                columnLookups={pfCgLookups}
              />
            ) : activeSection === "administracaoSistema" ? (
              adminManageSelection === 'usuarios' ? (
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
                  onManageSelectionChange={setAdminManageSelection}
                  openFilter={openAdminFilterModal}
                  initialColumns={adminColunasConfig}
                  onColumnsChange={handleAdminColumnsChange}
                />
              ) : (
                <div className="p-6">
                  <h2 className="text-lg font-semibold">Área de Administração</h2>
                  <p className="mt-2 text-sm text-slate-600">Selecione uma função para gerenciar nesta seção.</p>
                </div>
              )
            ) : (
              (cgManageSelection === 'sexo' || cgManageSelection === 'estadoCivil' || cgManageSelection === 'corRaca' || cgManageSelection === 'profissao') ? (
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
            />
          ) : activeSection === "administracaoSistema" ? (
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
              onManageSelectionChange={setAdminManageSelection}
              readOnly={adminEditingId ? (usuarios.find((a) => a.id === adminEditingId)?.ds_usuario ?? '').trim().toLowerCase() === 'administrador' : false}
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
              selectOptions={CG_SELECT_OPTIONS}
              fieldInfos={cgFieldInfos}
              descFieldKey={cgDescKey}
              collectionName={cgCollection}
              showCbo={cgKind === 'profissao'}
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
                  Data de nascimento (início)
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
                  Data de nascimento (fim)
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
          <div className="relative w-full max-w-[960px] bg-white p-0 shadow-xl shadow-black/20 max-h-[90vh] overflow-hidden">
            <div className="flex h-full">
              <div className="w-[320px] border-r border-slate-300 p-[15px] bg-[#fafafa] overflow-auto">
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
                <div className="mt-4 flex items-center justify-end gap-2">
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
          <div className="relative w-full max-w-[960px] bg-white p-0 shadow-xl shadow-black/20 max-h-[90vh] overflow-hidden">
            <div className="flex h-full">
              <div className="w-[320px] border-r border-slate-300 p-[15px] bg-[#fafafa] overflow-auto">
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
                <div className="mt-4 flex items-center justify-end gap-2">
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

      {detailModalOpen && selectedAuditIndex !== null && (() => {
        const after = auditLogs[selectedAuditIndex]?.detalhes ?? {};
        const before = auditLogs[selectedAuditIndex + 1]?.detalhes ?? null;
        const isUsuario = auditDocumentType === 'usuario';
        const isCg = auditDocumentType === 'cg_sexo' || auditDocumentType === 'cg_estado_civil' || auditDocumentType === 'cg_cor_raca' || auditDocumentType === 'cg_profissao';
        const fieldsOrder = isUsuario
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
          : isCg
          ? [
              'nr_sequencia',
              auditDocumentType === 'cg_estado_civil' ? 'ds_estado_civil' : auditDocumentType === 'cg_cor_raca' ? 'ds_cor_raca' : auditDocumentType === 'cg_profissao' ? 'ds_profissao' : 'ds_sexo',
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

                      ds_nome: 'Nome completo',
                      nr_cpf: 'CPF',
                      dt_nascimento: 'Data de nascimento',
                      ds_email: 'E-mail',
                      nr_telefone: 'Telefone',
                      ds_sexo: 'Descrição',
                      ds_estado_civil: 'Descrição',
                      ds_cor_raca: 'Descrição',
                      ds_profissao: 'Descrição',
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

                    return (
                      <>
                        <div>
                          <div className="text-sm font-medium mb-2" style={{ color: '#000' }}>Antes</div>
                          <div className="space-y-3 text-sm">
                            {fieldsOrder.map((field) => (
                              <div key={field}>
                                <label className="block text-sm mb-1" style={{ color: '#666' }}>{FIELD_LABELS[field] ?? field}</label>
                                <input
                                  disabled
                                  value={before ? getDisplay(field, (before as any)[field]) : ''}
                                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm"
                                />
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
                                <input
                                  disabled
                                  value={getDisplay(field, (after as any)[field])}
                                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm"
                                />
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

      {(submitting || adminSubmitting || cgSubmitting) && view === "form" && (
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
