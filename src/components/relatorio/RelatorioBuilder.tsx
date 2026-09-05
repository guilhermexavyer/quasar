"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Select from "@/components/ui/Select";
import LoadingModal from "@/components/ui/LoadingModal";
import { DATA_SOURCES, getDataSource } from "@/lib/relatorioDataSources";
import {
  defaultConfigPdf,
  gerarId,
  OPERADORES_FILTRO,
  TAMANHOS_PAGINA,
} from "@/lib/relatorioUtils";
import type {
  Relatorio,
  RelatorioCampo,
  RelatorioConfigPdf,
  RelatorioFiltro,
  RelatorioOrdenacao,
} from "@/types/relatorio";
import CamposRelatorioTable, { type CamposRelatorioRow } from "@/components/relatorio/CamposRelatorioTable";
import FiltrosRelatorioTable from "@/components/relatorio/FiltrosRelatorioTable";
import OrdenacaoRelatorioTable from "@/components/relatorio/OrdenacaoRelatorioTable";
import BandasRelatorioTable from "@/components/relatorio/BandasRelatorioTable";
import FieldInfoPopup from "@/components/ui/FieldInfoPopup";
import RequiredAsterisk from "@/components/ui/RequiredAsterisk";
import type { CampoStatus } from "@/lib/camposConfigUtils";

interface ContextMenuItem {
  label: string;
  onClick?: () => void;
  children?: ContextMenuItem[];
}

interface RelatorioBuilderProps {
  relatorio: Relatorio | null;
  onSave: (relatorio: Omit<Relatorio, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">) => void;
  onCancel: () => void;
  saving?: boolean;
  manageSelection?: string;
  onManageSelectionChange?: (v: string) => void;
  allowedSubmodulos?: string[];
  /** Context menu */
  contextMenuItems?: ContextMenuItem[];
  onChange?: (relatorio: Relatorio) => void;
  userId?: string;
  /** Configuração de colunas salva no Firestore (per-user) */
  initialListaColumns?: { order: string[]; widths: Record<string, number> } | null;
  onListaColumnsChange?: (order: string[], widths: Record<string, number>) => void;
  initialDadosColumns?: { order: string[]; widths: Record<string, number> } | null;
  onDadosColumnsChange?: (order: string[], widths: Record<string, number>) => void;
  initialFiltrosColumns?: { order: string[]; widths: Record<string, number> } | null;
  onFiltrosColumnsChange?: (order: string[], widths: Record<string, number>) => void;
  initialOrdenacaoColumns?: { order: string[]; widths: Record<string, number> } | null;
  onOrdenacaoColumnsChange?: (order: string[], widths: Record<string, number>) => void;
  initialBandasColumns?: { order: string[]; widths: Record<string, number> } | null;
  onBandasColumnsChange?: (order: string[], widths: Record<string, number>) => void;
  /** Navegação entre registros */
  onPrevRecord?: () => void;
  onNextRecord?: () => void;
  hasPrevRecord?: boolean;
  hasNextRecord?: boolean;
  /** Auditoria */
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  onOpenAudit?: (relatorioId?: string | null) => void;
  onOpenBandaAudit?: (relatorioId?: string | null, bandaId?: string | null) => void;
  /** Save direto no Firestore ao salvar a banda (gera log de auditoria) */
  onBandaSave?: (bandas: any[], bandaDetailId?: string | null) => Promise<void> | void;
  /** Regras de campos por perfil (colecao relatorios): campo → status (N/O/D). */
  campoRegras?: Record<string, CampoStatus>;
  /** Regras de campos por perfil (colecao relatorio_banda): campo → status (N/O/D). */
  bandaCampoRegras?: Record<string, CampoStatus>;
  /** Regras de campos por perfil (colecao relatorio_banda_elemento): campo → status (N/O/D). */
  elementoCampoRegras?: Record<string, CampoStatus>;
  /** Regras de campos por perfil (colecao relatorio_parametro): campo → status (N/O/D). */
  parametroCampoRegras?: Record<string, CampoStatus>;
  /** Campos obrigatórios vazios no último submit (borda vermelha). */
  campoErros?: string[];
  /** Lista de imagens cadastradas. */
  imagens?: { id: string; ds_imagem: string; ie_arquivo: string }[];
  /** Modo de exibição: 'form' mostra Relatório+Saída, 'bandas' mostra apenas Bandas. */
  viewMode?: 'form' | 'bandas';
  /** Dark mode ativo. */
  darkMode?: boolean;
  /** Navegação do breadcrumb: volta para a lista de relatórios. */
  onNavigateToList?: () => void;
  /** Excluir elemento (modal de confirmação). */
  onDeleteCampo?: (campo: CamposRelatorioRow) => void;  /** Excluir banda (modal de confirmação). */
  onDeleteBanda?: (banda: any) => void;
  /** Excluir parâmetro (modal de confirmação). */
  onDeleteFiltro?: (filtro: RelatorioFiltro) => void;
  /** Ref para expor funções de exclusão para page.tsx. */
  stateActionsRef?: React.MutableRefObject<{ removeCampo: (id: string) => void; removeBanda: (id: string) => void } | null>;
}

function mapRelatorioCampoToRow(c: any, idx: number, colecaoPrincipal: string): CamposRelatorioRow {
  return {
    id: c.id || gerarId(),
    nr_sequencia: c.nr_sequencia ?? 0,
    ds_elemento: c.ds_elemento ?? '',
    ie_colecao: c.ie_colecao || colecaoPrincipal,
    ie_campo: c.ie_campo || '',
    label: c.rotulo || c.label || '',
    backgroundLabel: c.backgroundLabel || '#e2e8f0',
    corLabel: c.corLabel || '#1a1a1a',
    cd_cor: c.cd_cor || '#1a1a1a',
    cd_background: c.cd_background || '',
    transparentCampo: c.transparentCampo ?? false,
    qt_padding_superior: c.qt_padding_superior ?? 0,
    qt_padding_direita: c.qt_padding_direita ?? 0,
    qt_padding_inferior: c.qt_padding_inferior ?? 0,
    qt_padding_esquerda: c.qt_padding_esquerda ?? 0,
    ie_borda_superior: c.ie_borda_superior ?? 'N',
    ie_borda_direita: c.ie_borda_direita ?? 'N',
    ie_borda_inferior: c.ie_borda_inferior ?? 'N',
    ie_borda_esquerda: c.ie_borda_esquerda ?? 'N',
    qt_esquerda: c.qt_esquerda ?? 0,
    topoLabel: c.topoLabel ?? 0,
    qt_topo: c.qt_topo ?? 0,
    ie_alinhamento: c.ie_alinhamento ?? 'esquerda',
    ie_estilo_label: c.ie_estilo_label ?? '',
    ie_estilo: c.ie_estilo ?? '',
    ie_estilo_soma: c.ie_estilo_soma ?? '',
    qt_largura: c.qt_largura ?? 30,
    formatacao: c.formatacao || 'texto',
    statusSistema: c.statusSistema ?? false,
    soma: c.soma ?? false,
  };
}

const EMPTY_FILTRO: () => RelatorioFiltro = () => ({
  id: gerarId(),
  ie_campo: "",
  operador: "igual",
  vl_padrao: "",
  valorFinal: "",
  ie_mascara: "texto",
  ie_parametro: false,
});

const RELATORIO_SELECT_OPTIONS = [
  { value: 'relatorio', label: 'Relatórios' },
];

export default function RelatorioBuilder({
  relatorio,
  onSave,
  onCancel,
  saving = false,
  manageSelection = 'relatorio',
  onManageSelectionChange,
  allowedSubmodulos = ['relatorio'],
  contextMenuItems = [],
  onChange,
  userId,
  initialListaColumns,
  onListaColumnsChange,
  initialDadosColumns,
  onDadosColumnsChange,
  initialFiltrosColumns,
  onFiltrosColumnsChange,
  initialOrdenacaoColumns,
  onOrdenacaoColumnsChange,
  initialBandasColumns,
  onBandasColumnsChange,
  onPrevRecord,
  onNextRecord,
  hasPrevRecord = false,
  hasNextRecord = false,
  createdAt,
  updatedAt,
  createdBy,
  updatedBy,
  onOpenAudit,
  onOpenBandaAudit,
  onBandaSave,
  campoRegras = {},
  bandaCampoRegras = {},
  elementoCampoRegras = {},
  parametroCampoRegras = {},
  campoErros = [],
  imagens = [],
  viewMode = 'form',
  darkMode = false,
  onNavigateToList,
  onDeleteCampo,
  onDeleteBanda,
  onDeleteFiltro,
  stateActionsRef,
}: RelatorioBuilderProps) {
  const isBandasMode = viewMode === 'bandas';
  const isDark = darkMode;
  const onBandaSaveRef = useRef(onBandaSave);
  useEffect(() => { onBandaSaveRef.current = onBandaSave; }, [onBandaSave]);

  // Expor setters para page.tsx (estável, sem causar re-renders)
  const removeCampoRef = useRef<(campoId: string) => void>(() => {});
  const removeBandaRef = useRef<(bandaId: string) => void>(() => {});
  removeCampoRef.current = (campoId: string) => {
    setCampos((prev) => {
      const next = prev.filter((c) => c.id !== campoId);
      const currentBandaId = bandaDetailIdRef.current;
      if (currentBandaId) {
        setBandas((prevB) => prevB.map((b) => b.id === currentBandaId ? { ...b, campos: next } : b));
      }
      return next;
    });
  };
  removeBandaRef.current = (bandaId: string) => setBandas((prev) => prev.filter((b) => b.id !== bandaId));
  useEffect(() => {
    if (stateActionsRef) {
      stateActionsRef.current = {
        removeCampo: (id: string) => removeCampoRef.current(id),
        removeBanda: (id: string) => removeBandaRef.current(id),
      };
    }
  }, [stateActionsRef]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu]);

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }
  const formRef = useRef<HTMLFormElement | null>(null);

  const [bandaSaving, setBandaSaving] = useState(false);

  // ── Dirty state: detecta alterações não salvas ──
  // Armazena o bandas/campos/filtros/ordenacao no momento do último save/load.
  const savedBandasRef = useRef<string>('');
  const savedCamposRef = useRef<string>('');
  const savedFiltrosRef = useRef<string>('');
  const savedOrdenacaoRef = useRef<string>('');
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNav, setPendingNav] = useState<'prev' | 'next' | null>(null);
  const pendingNavRef = useRef<'prev' | 'next' | null>(null);

  /** Captura o estado "limpo" (salvo) para comparação futura. */
  function refreshSnapshot() {
    savedBandasRef.current = JSON.stringify(bandas);
    savedCamposRef.current = JSON.stringify(campos);
    savedFiltrosRef.current = JSON.stringify(filtros);
    savedOrdenacaoRef.current = JSON.stringify(ordenacao);
  }

  /** Verifica se há alterações em relação ao último snapshot. */
  function computeDirty(): boolean {
    if (JSON.stringify(bandas) !== savedBandasRef.current) return true;
    if (JSON.stringify(campos) !== savedCamposRef.current) return true;
    if (JSON.stringify(filtros) !== savedFiltrosRef.current) return true;
    if (JSON.stringify(ordenacao) !== savedOrdenacaoRef.current) return true;
    return false;
  }

  const [dsRelatorio, setDsRelatorio] = useState(relatorio?.ds_relatorio ?? "");
  const [colecao, setColecao] = useState(relatorio?.colecao ?? "");
  const [campos, setCampos] = useState<CamposRelatorioRow[]>(
    relatorio?.campos?.length
      ? relatorio.campos.map((c, i) => mapRelatorioCampoToRow(c, i, relatorio.colecao))
      : []
  );
  const [filtros, setFiltros] = useState<RelatorioFiltro[]>(relatorio?.filtros?.length ? relatorio.filtros : []);
  const [ordenacao, setOrdenacao] = useState<RelatorioOrdenacao[]>(relatorio?.ordenacao?.length ? relatorio.ordenacao.map((o) => ({ ...o, id: o.id || gerarId() })) : []);
  type BandaState = { id: string; ds_banda: string; ie_colecao_principal?: string; nr_posicao: number; ie_tipo_banda?: 'lista' | 'texto_valor' | 'cabecalho' | 'rodape'; nr_altura?: number; nr_sequencia?: number; nr_seq_relatorio?: number; ie_borda_superior?: boolean; ie_borda_inferior?: boolean; ie_borda_esquerda?: boolean; ie_borda_direita?: boolean; espessuraLabel?: number; topoLabel?: number; espessuraCampo?: number; topoRegistro?: number; bgLabel?: string; bgCampo?: string; corLabelGlobal?: string; corCampoGlobal?: string; fonteLabel?: string; tamanhoFonteLabel?: number; fonteCampo?: string; tamanhoFonteCampo?: number; campos?: any[]; filtros?: any[]; ordenacao?: any[]; _firestoreId?: string; dt_criacao?: string; dt_alteracao?: string; ds_usuario_criacao?: string; ds_usuario_alteracao?: string };
  const [bandas, setBandas] = useState<BandaState[]>(
    relatorio?.bandas?.length ? relatorio.bandas.map((b: any) => ({ ...b, id: b.id || gerarId() })) : []
  );
  // Sincroniza bandas quando o pai atualiza relatorio.bandas (ex.: após fetch async)
  const bandasDataRef = useRef(relatorio?.bandas ?? []);
  useEffect(() => {
    const next = relatorio?.bandas ?? [];
    if (JSON.stringify(next) !== JSON.stringify(bandasDataRef.current)) {
      bandasDataRef.current = next;
      setBandas(next.length ? next.map((b: any) => ({ ...b, id: b.id || gerarId() })) : []);
    }
  }, [relatorio?.bandas]);
  // Sincroniza filtros (parâmetros) quando o pai atualiza relatorio.filtros (ex.: após fetch async)
  const filtrosDataRef = useRef(relatorio?.filtros ?? []);
  useEffect(() => {
    const next = relatorio?.filtros ?? [];
    if (JSON.stringify(next) !== JSON.stringify(filtrosDataRef.current)) {
      filtrosDataRef.current = next;
      setFiltros(next.length ? next : []);
    }
  }, [relatorio?.filtros]);
  const [bandaDetailId, setBandaDetailId] = useState<string | null>(null);
  const lastBandaDetailIdRef = useRef<string | null>(null);
  useEffect(() => { if (bandaDetailId) lastBandaDetailIdRef.current = bandaDetailId; }, [bandaDetailId]);
  const [bandaViewMode, setBandaViewMode] = useState<'ver' | 'content'>('content');
  const [bandasSubView, setBandasSubView] = useState<'bandas' | 'parametros'>('bandas');
  const [bandaContentSubView, setBandaContentSubView] = useState<'dados' | 'ordenacao'>('dados');
  const [campoDetailId, setCampoDetailId] = useState<string | null>(null);
  const [filtroDetailId, setFiltroDetailId] = useState<string | null>(null);
  const [pendingBanda, setPendingBanda] = useState<BandaState | null>(null);
  const [pendingCampo, setPendingCampo] = useState<CamposRelatorioRow | null>(null);
  const [pendingFiltro, setPendingFiltro] = useState<RelatorioFiltro | null>(null);
  const filtroSel = useMemo(() => {
    if (pendingFiltro && pendingFiltro.id === filtroDetailId) return pendingFiltro;
    return filtros.find((f) => f.id === filtroDetailId);
  }, [filtros, filtroDetailId, pendingFiltro]);
  const campoSel = useMemo(() => {
    if (pendingCampo && pendingCampo.id === campoDetailId) return pendingCampo;
    return campos.find((c) => c.id === campoDetailId);
  }, [campos, campoDetailId, pendingCampo]);
  const bandaTipo = useMemo(() => {
    if (pendingBanda && pendingBanda.id === bandaDetailId) return pendingBanda.ie_tipo_banda;
    return bandas.find((b) => b.id === bandaDetailId)?.ie_tipo_banda;
  }, [bandas, bandaDetailId, pendingBanda]);

  // Audit info da banda atual (quando dentro de uma banda)
  const bandaSel = useMemo(() => {
    if (pendingBanda && pendingBanda.id === bandaDetailId) return pendingBanda;
    return bandas.find((b) => b.id === bandaDetailId);
  }, [bandas, bandaDetailId, pendingBanda]);
  const bandaCreatedAt = bandaSel?.dt_criacao ?? '';
  const bandaUpdatedAt = bandaSel?.dt_alteracao ?? '';
  const bandaCreatedBy = bandaSel?.ds_usuario_criacao ?? '';
  const bandaUpdatedBy = bandaSel?.ds_usuario_alteracao ?? '';

  // Refs para evitar stale closures no Ctrl+S do modal banda
  const camposRef = useRef(campos);
  const filtrosRef = useRef(filtros);
  const ordenacaoRef = useRef(ordenacao);
  const bandaDetailIdRef = useRef(bandaDetailId);
  useEffect(() => { camposRef.current = campos; }, [campos]);
  useEffect(() => { filtrosRef.current = filtros; }, [filtros]);
  useEffect(() => { ordenacaoRef.current = ordenacao; }, [ordenacao]);
  useEffect(() => { bandaDetailIdRef.current = bandaDetailId; }, [bandaDetailId]);
  // Contador de sequência de bandas: nunca reutiliza números de bandas excluídas.
  const nextBandaSeqRef = useRef(Math.max(0, ...bandas.map((b) => b.nr_sequencia ?? 0)) + 1);
  useEffect(() => { nextBandaSeqRef.current = Math.max(nextBandaSeqRef.current, Math.max(0, ...bandas.map((b) => b.nr_sequencia ?? 0)) + 1); }, [bandas]);
  function getNextBandaSeq() { const v = nextBandaSeqRef.current; nextBandaSeqRef.current = v + 1; return v; }
  // Contadores de sequência por seção (nunca reutilizam números excluídos).
  const nextCampoSeqRef = useRef(Math.max(0, ...campos.map((c) => c.nr_sequencia ?? 0)) + 1);
  const nextFiltroSeqRef = useRef(Math.max(0, ...filtros.map((f) => f.nr_sequencia ?? 0)) + 1);
  const nextOrdSeqRef = useRef(Math.max(0, ...ordenacao.map((o) => o.nr_sequencia ?? 0)) + 1);
  useEffect(() => { nextCampoSeqRef.current = Math.max(nextCampoSeqRef.current, Math.max(0, ...campos.map((c) => c.nr_sequencia ?? 0)) + 1); }, [campos]);
  useEffect(() => { nextFiltroSeqRef.current = Math.max(nextFiltroSeqRef.current, Math.max(0, ...filtros.map((f) => f.nr_sequencia ?? 0)) + 1); }, [filtros]);
  useEffect(() => { nextOrdSeqRef.current = Math.max(nextOrdSeqRef.current, Math.max(0, ...ordenacao.map((o) => o.nr_sequencia ?? 0)) + 1); }, [ordenacao]);
  function getNextCampoSeq() { const v = nextCampoSeqRef.current; nextCampoSeqRef.current = v + 1; return v; }
  function getNextFiltroSeq() { const v = nextFiltroSeqRef.current; nextFiltroSeqRef.current = v + 1; return v; }
  function getNextOrdSeq() { const v = nextOrdSeqRef.current; nextOrdSeqRef.current = v + 1; return v; }

  /** Sincroniza campos entre o state local e bandas[i].campos */
  const syncCampos = useCallback((updater: React.SetStateAction<CamposRelatorioRow[]>) => {
    setCampos((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const currentBandaId = bandaDetailIdRef.current;
      if (currentBandaId) {
        setBandas((prevB) => prevB.map((b) => b.id === currentBandaId ? { ...b, campos: next } : b));
      }
      return next;
    });
  }, []);

  /** Abre o modal da banda: salva dados globais na banda anterior e carrega dados da banda alvo */
  function openBandaDetail(bandaId: string) {
    const currentBandaId = bandaDetailIdRef.current;
    if (currentBandaId) {
      const c = camposRef.current;
      const f = filtrosRef.current;
      const o = ordenacaoRef.current;
      setBandas((prev) => prev.map((b) => b.id === currentBandaId ? { ...b, campos: [...c] } : b));
    }
    // Limpar estado de campo anterior para não abrir formulário de elemento
    setPendingCampo(null);
    setCampoDetailId(null);
    const target = bandas.find((b) => b.id === bandaId);
    if (target) {
      setCampos(target.campos?.length ? [...target.campos] : []);
    }
    setBandaDetailId(bandaId);
    setBandaViewMode('content');
    setBandaContentSubView('dados');
    // Carregar configurações visuais da banda selecionada
    if (target) {
      setEspessuraLabel(target.espessuraLabel ?? 16);
      setTopoLabelVal(target.topoLabel ?? 0);
      setEspessuraCampo(target.espessuraCampo ?? 24);
      setTopoRegistroVal(target.topoRegistro ?? 0);
      setBgLabel(target.bgLabel ?? '#e2e8f0');
      setBgCampo(target.bgCampo ?? '');
      setCorLabelGlobal(target.corLabelGlobal ?? '#1a1a1a');
      setCorCampoGlobal(target.corCampoGlobal ?? '#1a1a1a');
      setFonteLabel(target.fonteLabel ?? 'Arial');
      setTamanhoFonteLabel(target.tamanhoFonteLabel ?? 10);
      setFonteCampo(target.fonteCampo ?? 'Arial');
      setTamanhoFonteCampo(target.tamanhoFonteCampo ?? 10);
    }
  }

  function openBandaVer(bandaId: string) {
    const currentBandaId = bandaDetailIdRef.current;
    if (currentBandaId && !pendingBanda) {
      const c = camposRef.current;
      setBandas((prev) => prev.map((b) => b.id === currentBandaId ? { ...b, campos: [...c] } : b));
    }
    setBandaDetailId(bandaId);
    setBandaViewMode('ver');
    setBandaContentSubView('dados');
    // Carregar configurações visuais da banda selecionada
    const bSel = (pendingBanda && pendingBanda.id === bandaId) ? pendingBanda : bandas.find((b) => b.id === bandaId);
    if (bSel) {
      setEspessuraLabel(bSel.espessuraLabel ?? 16);
      setTopoLabelVal(bSel.topoLabel ?? 0);
      setEspessuraCampo(bSel.espessuraCampo ?? 24);
      setTopoRegistroVal(bSel.topoRegistro ?? 0);
      setBgLabel(bSel.bgLabel ?? '#e2e8f0');
      setBgCampo(bSel.bgCampo ?? '');
      setCorLabelGlobal(bSel.corLabelGlobal ?? '#1a1a1a');
      setCorCampoGlobal(bSel.corCampoGlobal ?? '#1a1a1a');
      setFonteLabel(bSel.fonteLabel ?? 'Arial');
      setTamanhoFonteLabel(bSel.tamanhoFonteLabel ?? 10);
      setFonteCampo(bSel.fonteCampo ?? 'Arial');
      setTamanhoFonteCampo(bSel.tamanhoFonteCampo ?? 10);
    }
  }

  function openFiltroVer(filtroId: string) {
    setFiltroDetailId(filtroId);
    setPendingFiltro(null);
  }

  /** Atualiza a banda selecionada (funciona tanto para banda existente quanto pendente) */
  function updateBandaSelecionada(updater: (b: BandaState) => BandaState) {
    if (pendingBanda && pendingBanda.id === bandaDetailId) {
      setPendingBanda((prev) => prev ? updater(prev) : prev);
    } else {
      setBandas((prev) => prev.map((b) => b.id === bandaDetailId ? updater(b) : b));
    }
  }

  /** Atualiza o campo selecionado (salva apenas ao clicar Salvar/Ctrl+S) */
  function updateCampoSelecionado(updater: (c: CamposRelatorioRow) => CamposRelatorioRow) {
    if (pendingCampo && pendingCampo.id === campoDetailId) {
      setPendingCampo((prev) => prev ? updater(prev) : prev);
    } else {
      // Atualiza apenas o state local (NÃO sincroniza com bandas)
      // para que Cancelar possa restaurar os dados originais
      setCampos((prev) => prev.map((c) => c.id === campoDetailId ? updater(c) : c));
    }
  }

  /** Fecha o modal da banda: salva dados na banda e limpa. Usa refs para evitar stale closures. */
  function closeBandaDetail() {
    const currentBandaId = bandaDetailIdRef.current;
    if (currentBandaId) {
      const c = camposRef.current;
      const f = filtrosRef.current;
      const o = ordenacaoRef.current;
      setBandas((prev) => prev.map((b) => b.id === currentBandaId ? { ...b, campos: [...c] } : b));
    }
    setBandaDetailId(null);
    setCampoDetailId(null);
    setCampos([]);
    setFiltros([]);
    setOrdenacao([]);
  }
  const [formato] = useState<'pdf'>('pdf');
  const [configPdf, setConfigPdf] = useState(relatorio?.configPdf ?? defaultConfigPdf());
  const [espessuraLabel, setEspessuraLabel] = useState(relatorio?.espessuraLabel ?? 16);
  const [topoLabelVal, setTopoLabelVal] = useState(relatorio?.topoLabel ?? 0);
  const [espessuraCampo, setEspessuraCampo] = useState(relatorio?.espessuraCampo ?? 24);
  const [topoRegistroVal, setTopoRegistroVal] = useState(relatorio?.topoRegistro ?? 0);
  const [bgLabel, setBgLabel] = useState(relatorio?.bgLabel ?? '#e2e8f0');
  const [bgCampo, setBgCampo] = useState(relatorio?.bgCampo ?? '');
  const [corLabelGlobal, setCorLabelGlobal] = useState(relatorio?.corLabelGlobal ?? '#1a1a1a');
  const [corCampoGlobal, setCorCampoGlobal] = useState(relatorio?.corCampoGlobal ?? '#1a1a1a');
  const [fonteLabel, setFonteLabel] = useState(relatorio?.fonteLabel ?? 'Arial');
  const [tamanhoFonteLabel, setTamanhoFonteLabel] = useState(relatorio?.tamanhoFonteLabel ?? 10);
  const [fonteCampo, setFonteCampo] = useState(relatorio?.fonteCampo ?? 'Arial');
  const [tamanhoFonteCampo, setTamanhoFonteCampo] = useState(relatorio?.tamanhoFonteCampo ?? 10);
  const [erros, setErros] = useState<string[]>([]);
  const [editingCampo, setEditingCampo] = useState(false);
  const [editingBanda, setEditingBanda] = useState(false);
  const [editingFiltro, setEditingFiltro] = useState(false);
  const [editingOrdenacao, setEditingOrdenacao] = useState(false);
  const isEditingAnyTable = editingCampo || editingBanda || editingFiltro || editingOrdenacao;

  // ── Infobutton / FieldInfoPopup ──
  const [infoPopupField, setInfoPopupField] = useState<string | null>(null);
  const [infoAnchor, setInfoAnchor] = useState<HTMLElement | null>(null);

  /** fieldInfos para o formulário do relatório */
  const relatorioFieldInfos: Record<string, { type: string; field: string; collection: string }> = {
    nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'relatorio' },
    ds_relatorio: { type: 'string', field: 'ds_relatorio', collection: 'relatorio' },
    ie_formato: { type: 'string', field: 'ie_formato', collection: 'relatorio' },
    ds_nome_arquivo: { type: 'string', field: 'ds_nome_arquivo', collection: 'relatorio' },
    ie_pagina: { type: 'string', field: 'ie_pagina', collection: 'relatorio' },
    ie_orientacao: { type: 'string', field: 'ie_orientacao', collection: 'relatorio' },
    ie_borda: { type: 'string', field: 'ie_borda', collection: 'relatorio' },
    nr_margem_superior: { type: 'int64', field: 'nr_margem_superior', collection: 'relatorio' },
    nr_margem_inferior: { type: 'int64', field: 'nr_margem_inferior', collection: 'relatorio' },
    nr_margem_esquerda: { type: 'int64', field: 'nr_margem_esquerda', collection: 'relatorio' },
    nr_margem_direita: { type: 'int64', field: 'nr_margem_direita', collection: 'relatorio' },
  };

  /** fieldInfos para os campos da banda */
  const bandaFieldInfos: Record<string, { type: string; field: string; collection: string }> = {
    ds_banda: { type: 'string', field: 'ds_banda', collection: 'relatorio_banda' },
    ie_tipo_banda: { type: 'string', field: 'ie_tipo_banda', collection: 'relatorio_banda' },
    ie_colecao_principal: { type: 'string', field: 'ie_colecao_principal', collection: 'relatorio_banda' },
    nr_posicao: { type: 'int64', field: 'nr_posicao', collection: 'relatorio_banda' },
    nr_altura: { type: 'int64', field: 'nr_altura', collection: 'relatorio_banda' },
    ie_borda_superior: { type: 'boolean', field: 'ie_borda_superior', collection: 'relatorio_banda' },
    ie_borda_inferior: { type: 'boolean', field: 'ie_borda_inferior', collection: 'relatorio_banda' },
    ie_borda_esquerda: { type: 'boolean', field: 'ie_borda_esquerda', collection: 'relatorio_banda' },
    ie_borda_direita: { type: 'boolean', field: 'ie_borda_direita', collection: 'relatorio_banda' },
    espessuraLabel: { type: 'int64', field: 'espessuraLabel', collection: 'relatorio_banda' },
    topoLabel: { type: 'int64', field: 'topoLabel', collection: 'relatorio_banda' },
    espessuraCampo: { type: 'int64', field: 'espessuraCampo', collection: 'relatorio_banda' },
    topoRegistro: { type: 'int64', field: 'topoRegistro', collection: 'relatorio_banda' },
    bgLabel: { type: 'string', field: 'bgLabel', collection: 'relatorio_banda' },
    bgCampo: { type: 'string', field: 'bgCampo', collection: 'relatorio_banda' },
    corLabelGlobal: { type: 'string', field: 'corLabelGlobal', collection: 'relatorio_banda' },
    corCampoGlobal: { type: 'string', field: 'corCampoGlobal', collection: 'relatorio_banda' },
    fonteLabel: { type: 'string', field: 'fonteLabel', collection: 'relatorio_banda' },
    tamanhoFonteLabel: { type: 'int64', field: 'tamanhoFonteLabel', collection: 'relatorio_banda' },
    fonteCampo: { type: 'string', field: 'fonteCampo', collection: 'relatorio_banda' },
    tamanhoFonteCampo: { type: 'int64', field: 'tamanhoFonteCampo', collection: 'relatorio_banda' },
    ds_elemento: { type: 'string', field: 'ds_elemento', collection: 'relatorio_banda_elemento' },
  };

  /** fieldInfos para os campos do parâmetro (relatorio_parametro) */
  const parametroFieldInfos: Record<string, { type: string; field: string; collection: string }> = {
    nr_sequencia: { type: 'int64', field: 'nr_sequencia', collection: 'relatorio_parametro' },
    ie_colecao: { type: 'string', field: 'ie_colecao', collection: 'relatorio_parametro' },
    ie_campo: { type: 'string', field: 'ie_campo', collection: 'relatorio_parametro' },
    operador: { type: 'string', field: 'operador', collection: 'relatorio_parametro' },
    ie_mascara: { type: 'string', field: 'ie_mascara', collection: 'relatorio_parametro' },
    vl_padrao: { type: 'string', field: 'vl_padrao', collection: 'relatorio_parametro' },
    ie_conector: { type: 'string', field: 'ie_conector', collection: 'relatorio_parametro' },
    ie_parametro: { type: 'boolean', field: 'ie_parametro', collection: 'relatorio_parametro' },
    ds_label: { type: 'string', field: 'ds_label', collection: 'relatorio_parametro' },
    ie_obrigatorio: { type: 'boolean', field: 'ie_obrigatorio', collection: 'relatorio_parametro' },
  };

  /** Retorna o status (N/O/D) de um campo nas regras do perfil. */
  function statusDe(regras: Record<string, CampoStatus>, campo: string): CampoStatus {
    return regras?.[campo] ?? 'N';
  }

  function renderFieldLabel(fieldKey: string, label: string, infos: Record<string, { type: string; field: string; collection: string }>, collectionName: string, regras?: Record<string, CampoStatus>) {
    const meta = infos[fieldKey] ?? { type: 'string', field: fieldKey, collection: collectionName };
    const obrigatorio = regras ? statusDe(regras, fieldKey) === 'O' : false;
    return (
      <div className="relative inline-block text-sm mb-1" style={{ color: '#666' }}>
        <div className="inline-flex items-center gap-2 w-full">
          <span className="inline-flex items-center gap-1">
            {obrigatorio && <RequiredAsterisk />}
            <span>{label}</span>
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setInfoAnchor(event.currentTarget);
              setInfoPopupField((current) => (current === fieldKey ? null : fieldKey));
            }}
            aria-label={`Informações do campo ${label}`}
            className={`inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer transition-none ${infoPopupField === fieldKey ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <circle cx="12" cy="16" r="0.5" />
            </svg>
          </button>
          {infoPopupField === fieldKey && (
            <FieldInfoPopup
              anchor={infoAnchor}
              meta={{ type: meta.type, field: meta.field, collection: meta.collection }}
              onClose={() => setInfoPopupField(null)}
            />
          )}
        </div>
      </div>
    );
  }

  // Reset estado quando relatório muda (navegação por setas)
  const justNavigatedRef = useRef(false);
  const prevRelatorioIdRef = useRef(relatorio?.id);
  useEffect(() => {
    if (relatorio?.id !== prevRelatorioIdRef.current) {
      prevRelatorioIdRef.current = relatorio?.id;
      setDsRelatorio(relatorio?.ds_relatorio ?? "");
      setColecao(relatorio?.colecao ?? "");
      setCampos(
        relatorio?.campos?.length
          ? relatorio.campos.map((c, i) => mapRelatorioCampoToRow(c, i, relatorio.colecao))
          : []
      );
      setFiltros(relatorio?.filtros?.length ? relatorio.filtros : []);
      setOrdenacao(relatorio?.ordenacao?.length ? relatorio.ordenacao.map((o) => ({ ...o, id: o.id || gerarId() })) : []);
      setBandas(relatorio?.bandas?.length ? relatorio.bandas.map((b: any) => ({ ...b, id: b.id || gerarId() })) : []);
      // formato é sempre 'pdf' (Excel removido)
      setConfigPdf(relatorio?.configPdf ?? defaultConfigPdf());
      setEspessuraLabel(relatorio?.espessuraLabel ?? 16);
      setTopoLabelVal(relatorio?.topoLabel ?? 0);
      setEspessuraCampo(relatorio?.espessuraCampo ?? 24);
      setTopoRegistroVal(relatorio?.topoRegistro ?? 0);
      setBgLabel(relatorio?.bgLabel ?? '#e2e8f0');
      setBgCampo(relatorio?.bgCampo ?? '');
      setCorLabelGlobal(relatorio?.corLabelGlobal ?? '#1a1a1a');
      setCorCampoGlobal(relatorio?.corCampoGlobal ?? '#1a1a1a');
      setFonteLabel(relatorio?.fonteLabel ?? 'Arial');
      setTamanhoFonteLabel(relatorio?.tamanhoFonteLabel ?? 10);
      setFonteCampo(relatorio?.fonteCampo ?? 'Arial');
      setTamanhoFonteCampo(relatorio?.tamanhoFonteCampo ?? 10);
      setEditingCampo(false);
      setEditingBanda(false);
      setEditingFiltro(false);
      setEditingOrdenacao(false);
      // Marca que o relatório mudou — o snapshot será atualizado no próximo
      // render (quando o estado já refletir os novos valores).
      justNavigatedRef.current = true;
    }
  }, [relatorio]);

  // ── Detectar alterações não salvas ──
  // Usa justNavigatedRef para garantir que o snapshot seja capturado AFTER
  // o estado ter sido atualizado pelo reset effect (no render seguinte).
  useEffect(() => {
    if (justNavigatedRef.current) {
      // Navegação recém-ocorrida: o estado agora reflete o novo relatório.
      // Atualizar snapshot e marcar como limpo.
      justNavigatedRef.current = false;
      refreshSnapshot();
      setIsDirty(false);
      return;
    }
    setIsDirty(computeDirty());
  }, [bandas, campos, filtros, ordenacao, dsRelatorio]);

  const dataSource = useMemo(() => (colecao ? getDataSource(colecao) : undefined), [colecao]);
  const camposDisponiveis = dataSource?.campos ?? [];
  // Campos disponíveis baseados na coleção da banda atual (para Filtros dentro do modal)
  const bandaColecaoAtual = bandas.find((b) => b.id === bandaDetailId)?.ie_colecao_principal ?? '';
  const camposDisponiveisBanda = useMemo(() => (bandaColecaoAtual ? (getDataSource(bandaColecaoAtual)?.campos ?? []) : []), [bandaColecaoAtual]);
  const opcoesColecao = DATA_SOURCES.map((ds) => ({ value: ds.value, label: ds.value })).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

  // Ctrl+S handler ref — always points to latest closure values
  const ctrlSHandlerRef = useRef<() => void>(() => {});
  useEffect(() => {
    ctrlSHandlerRef.current = () => {
      if (campoDetailId) {
        if (pendingCampo && pendingCampo.id === campoDetailId) {
          // Salvar campo novo → Firestore
          (async () => {
            setBandaSaving(true);
            try {
              const seq = getNextCampoSeq();
              const nrSeqBanda = bandas.find((b) => b.id === bandaDetailId)?.nr_sequencia;
              const { criarElemento } = await import('@/services/relatorioServiceBandas');
              const auditAutor = { usuarioId: null, usuarioNome: userId ?? '' };
              const campoData = {
                ...pendingCampo,
                nr_sequencia: seq,
                nr_seq_banda: nrSeqBanda ?? 0,
                nr_seq_relatorio: relatorio?.nr_sequencia ?? 0,
              };
              const { id: firestoreId, nr_sequencia: savedSeq } = await criarElemento(campoData, auditAutor);
              const novoCampo = { ...campoData, id: firestoreId, _firestoreId: firestoreId, nr_sequencia: savedSeq };
              syncCampos((prev) => [...prev, novoCampo]);
              setPendingCampo(null);
            } finally {
              setBandaSaving(false);
            }
          })();
          setCampoDetailId(null);
          return;
        }
        // Campo existente: salvar explicitamente no Firestore
        (async () => {
          setBandaSaving(true);
          try {
            const campoAtual = campos.find((c) => c.id === campoDetailId);
            if (campoAtual?._firestoreId) {
              const { atualizarElemento } = await import('@/services/relatorioServiceBandas');
              const auditAutor = { usuarioId: null, usuarioNome: userId ?? '' };
              await atualizarElemento(campoAtual._firestoreId, { ...campoAtual, nr_seq_banda: bandas.find((b) => b.id === bandaDetailId)?.nr_sequencia ?? 0 }, auditAutor);
            }
          } finally {
            setBandaSaving(false);
          }
        })();
        setCampoDetailId(null);
        return;
      }
      if (filtroDetailId) {
        // Salvar filtro no Firestore
        (async () => {
          setBandaSaving(true);
          try {
            const { criarParametro, atualizarParametro } = await import('@/services/relatorioServiceParametros');
            const auditAutor = { usuarioId: null, usuarioNome: userId ?? '' };
            if (pendingFiltro && pendingFiltro.id === filtroDetailId) {
              const { id: _oldId, ...filtroData } = pendingFiltro;
              const { id: newId, nr_sequencia: savedSeq } = await criarParametro({ ...filtroData, nr_seq_relatorio: relatorio?.nr_sequencia ?? 0 }, auditAutor);
              setFiltros((prev) => [...prev, { ...filtroData, id: newId, _firestoreId: newId, nr_sequencia: savedSeq } as any]);
            } else {
              const filtroAtual = filtros.find((f) => f.id === filtroDetailId);
              if ((filtroAtual as any)?._firestoreId) {
                await atualizarParametro((filtroAtual as any)._firestoreId, { ...filtroAtual, nr_seq_relatorio: relatorio?.nr_sequencia ?? 0 }, auditAutor);
              }
            }
          } finally {
            setBandaSaving(false);
          }
        })();
        setPendingFiltro(null);
        setFiltroDetailId(null);
        return;
      }
      if (bandaDetailId && bandaViewMode === 'ver') {
        // Formulário de banda → salvar banda
        (async () => {
          let finalBandas: any[] = bandas;
          if (pendingBanda && pendingBanda.id === bandaDetailId) {
            const seq = getNextBandaSeq();
            const newBanda = { ...pendingBanda, nr_sequencia: seq };
            finalBandas = [...bandas, newBanda];
            setBandas(finalBandas);
            setPendingBanda(null);
          }
          const currentBandaId = bandaDetailIdRef.current;
          if (currentBandaId) {
            const c = camposRef.current;
            finalBandas = finalBandas.map((b) => b.id === currentBandaId ? { ...b, campos: [...c] } : b);
            setBandas(finalBandas);
          }
          setBandaSaving(true);
          try {
            await onBandaSaveRef.current?.(finalBandas, currentBandaId);
          } catch { /* handled inside handleBandaSave */ }
          setBandaDetailId(null);
          setBandaViewMode('content');
          setCampos([]);
          setBandaSaving(false);
          refreshSnapshot();
          setIsDirty(false);
        })();
        return;
      }
      // Tabelas (bandas/elementos) e outros: nada
      if (isBandasMode || saving || isEditingAnyTable) return;
      const f = formRef.current;
      if (f && typeof (f as any).requestSubmit === 'function') {
        (f as any).requestSubmit();
      }
    };
  }); // No deps — runs every render to keep handler current

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        ctrlSHandlerRef.current();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Sync form state back to parent so that "Gerar relatório" uses current data.
  useEffect(() => {
    if (!onChange || !relatorio) return;
    const synced: Relatorio = {
      ...relatorio,
      ds_relatorio: dsRelatorio.trim(),
      colecao,
      campos: campos.map((c) => ({
        id: c.id, nr_sequencia: c.nr_sequencia, ds_elemento: c.ds_elemento, ie_colecao: c.ie_colecao, ie_campo: c.ie_campo, rotulo: c.label, label: c.label,
        backgroundLabel: c.backgroundLabel, corLabel: c.corLabel, cd_cor: c.cd_cor, cd_background: c.cd_background, transparentCampo: c.transparentCampo,
        qt_padding_superior: c.qt_padding_superior, qt_padding_direita: c.qt_padding_direita, qt_padding_inferior: c.qt_padding_inferior, qt_padding_esquerda: c.qt_padding_esquerda,
        ie_borda_superior: c.ie_borda_superior ? 'S' : 'N', ie_borda_direita: c.ie_borda_direita ? 'S' : 'N', ie_borda_inferior: c.ie_borda_inferior ? 'S' : 'N', ie_borda_esquerda: c.ie_borda_esquerda ? 'S' : 'N',
        qt_largura: c.qt_largura, qt_esquerda: c.qt_esquerda, topoLabel: c.topoLabel, qt_topo: c.qt_topo, ie_alinhamento: c.ie_alinhamento as RelatorioCampo["ie_alinhamento"], ie_estilo_label: c.ie_estilo_label as RelatorioCampo['ie_estilo_label'], ie_estilo: c.ie_estilo as RelatorioCampo['ie_estilo'], ie_estilo_soma: c.ie_estilo_soma as RelatorioCampo['ie_estilo_soma'], formatacao: c.formatacao, statusSistema: c.statusSistema, soma: c.soma, ie_tipo_elemento: c.ie_tipo_elemento, conteudo: c.conteudo, ie_fonte: c.ie_fonte, qt_fonte: c.qt_fonte, nr_seq_imagem: c.nr_seq_imagem, qt_tamanho_imagem: c.qt_tamanho_imagem,
      })),
      filtros: filtros.map((f) => ({ ...f })),
      ordenacao: ordenacao.map((o) => ({ id: o.id, campo: o.campo, direcao: o.direcao })),
      bandas: bandas.map((b) => ({ id: b.id, _firestoreId: b._firestoreId, nr_sequencia: b.nr_sequencia, nr_seq_relatorio: b.nr_seq_relatorio, ds_banda: b.ds_banda, ie_colecao_principal: b.ie_colecao_principal, nr_posicao: b.nr_posicao, ie_tipo_banda: b.ie_tipo_banda, nr_altura: b.nr_altura, ie_borda_superior: b.ie_borda_superior, ie_borda_inferior: b.ie_borda_inferior, ie_borda_esquerda: b.ie_borda_esquerda, ie_borda_direita: b.ie_borda_direita, campos: b.campos })),
      ie_formato: formato,
      configExcel: undefined,
      configPdf: formato === 'pdf' ? configPdf : undefined,
      espessuraLabel,
      espessuraCampo,
      bgLabel,
      bgCampo,
      corLabelGlobal,
      corCampoGlobal,
      fonteLabel,
      tamanhoFonteLabel,
      fonteCampo,
      tamanhoFonteCampo,
    };
    onChange(synced);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dsRelatorio, colecao, campos, filtros, ordenacao, bandas, formato, configPdf, espessuraLabel, topoLabelVal, espessuraCampo, topoRegistroVal, bgLabel, bgCampo, corLabelGlobal, corCampoGlobal, fonteLabel, tamanhoFonteLabel, fonteCampo, tamanhoFonteCampo]);

  // ── Handlers ──


  function adicionarFiltro() { setFiltros((prev) => [...prev, EMPTY_FILTRO()]); }
  function removerFiltro(id: string) { setFiltros((prev) => prev.filter((f) => f.id !== id)); }
  function atualizarFiltro(id: string, updates: Partial<RelatorioFiltro>) {
    setFiltros((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }

  function adicionarOrdenacao() { const seq = getNextOrdSeq(); setOrdenacao((prev) => [...prev, { id: gerarId(), nr_sequencia: seq, campo: "", direcao: "asc" }]); }
  function removerOrdenacao(idx: number) { setOrdenacao((prev) => prev.filter((_, i) => i !== idx)); }
  function atualizarOrdenacao(idx: number, updates: Partial<RelatorioOrdenacao>) {
    setOrdenacao((prev) => prev.map((o, i) => (i === idx ? { ...o, ...updates } : o)));
  }

  function validar(): boolean {
    const errs: string[] = [];
    if (!dsRelatorio.trim()) errs.push("Descrição é obrigatória.");
    const todosCampos = bandas.flatMap((b) => b.campos ?? []);
    if (todosCampos.some((c: any) => c.ie_tipo_elemento && c.ie_tipo_elemento !== 'conteudo' && c.ie_tipo_elemento !== 'data_geracao' && c.ie_tipo_elemento !== 'horario_geracao' && c.ie_tipo_elemento !== 'data_horario_geracao' && c.ie_tipo_elemento !== 'usuario_geracao' && c.ie_tipo_elemento !== 'imagem' && !c.chave)) errs.push("Todos os campos devem ter uma chave selecionada.");
    setErros(errs);
    return errs.length === 0;
  }

  /** Remove recursivamente chaves com valor undefined (Firestore rejeita undefined). */
  function deepClean(obj: any): any {
    if (obj === undefined || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(deepClean);
    if (typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, deepClean(v)])
      );
    }
    return obj;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (bandaDetailId || isBandasMode) return; // Don't submit form when inside banda detail or bandas mode
    if (!validar()) return;
    const result: Omit<Relatorio, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao"> = {
      ds_relatorio: dsRelatorio.trim(),
      colecao: bandas[0]?.ie_colecao_principal || '',
      campos: bandas.flatMap((b) => (b.campos ?? []).map((c: any) => ({
        id: c.id, nr_sequencia: c.nr_sequencia, ds_elemento: c.ds_elemento, ie_colecao: c.ie_colecao, ie_campo: c.ie_campo, rotulo: c.label, label: c.label,
        backgroundLabel: c.backgroundLabel, corLabel: c.corLabel, cd_cor: c.cd_cor, cd_background: c.cd_background, transparentCampo: c.transparentCampo,
        qt_padding_superior: c.qt_padding_superior, qt_padding_direita: c.qt_padding_direita, qt_padding_inferior: c.qt_padding_inferior, qt_padding_esquerda: c.qt_padding_esquerda,
        qt_largura: c.qt_largura, qt_esquerda: c.qt_esquerda, topoLabel: c.topoLabel, qt_topo: c.qt_topo, ie_alinhamento: c.ie_alinhamento as RelatorioCampo["ie_alinhamento"], ie_estilo_label: c.ie_estilo_label as RelatorioCampo['ie_estilo_label'], ie_estilo: c.ie_estilo as RelatorioCampo['ie_estilo'], ie_estilo_soma: c.ie_estilo_soma as RelatorioCampo['ie_estilo_soma'], formatacao: c.formatacao, statusSistema: c.statusSistema, soma: c.soma, ie_tipo_elemento: c.ie_tipo_elemento, conteudo: c.conteudo, ie_fonte: c.ie_fonte, qt_fonte: c.qt_fonte, nr_seq_imagem: c.nr_seq_imagem, qt_tamanho_imagem: c.qt_tamanho_imagem,
      }))),
      filtros: filtros,
      ordenacao: ordenacao,
      bandas: bandas.map((b) => ({ ...b })),
      ie_formato: formato,
      configExcel: undefined,
      configPdf: formato === "pdf" ? configPdf : undefined,
    };
    onSave(deepClean(result));
  }

  // ── Navegação com verificação de alterações não salvas ──
  function handleNavClick(direction: 'prev' | 'next') {
    if (isDirty) {
      pendingNavRef.current = direction;
      setPendingNav(direction);
      setShowUnsavedModal(true);
    } else {
      direction === 'prev' ? onPrevRecord?.() : onNextRecord?.();
    }
  }

  async function handleSaveAndNavigate() {
    const dir = pendingNavRef.current;
    if (!dir) return;
    setBandaSaving(true);
    try {
      await onBandaSaveRef.current?.(bandas, undefined);
    } catch { /* error handled inside handleBandaSave */ }
    refreshSnapshot();
    setIsDirty(false);
    setBandaSaving(false);
    setShowUnsavedModal(false);
    pendingNavRef.current = null;
    setPendingNav(null);
    dir === 'prev' ? onPrevRecord?.() : onNextRecord?.();
  }

  const labelClass = "block text-sm mb-1";
  const inputClass = "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none";

  return (
    <div className="flex-1 flex flex-col min-h-0" onContextMenu={handleContextMenu}>
      {contextMenu && contextMenuItems.length > 0 && (
        <>
          <div
            className="fixed z-50 min-w-[160px] border border-slate-200 bg-white p-[3px] flex flex-col gap-[3px]"
            style={{ left: contextMenu.x, top: contextMenu.y, boxShadow: '0 4px 10px rgba(0,0,0,0.18)' }}
          >
            {contextMenuItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer"
                style={{ padding: '0.2rem 0.4rem' }}
                onClick={() => {
                  item.onClick?.();
                  setContextMenu(null);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-3 min-h-[42px]">
        <div className="flex items-center gap-2">
          <Select
            value={manageSelection}
            onChange={onManageSelectionChange ?? (() => {})}
            options={RELATORIO_SELECT_OPTIONS.filter((o) => allowedSubmodulos.includes(o.value))}
            showPlaceholder={false}
            className="!w-[180px]"
            disabled
                              visibleOptions={7}
                  />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleNavClick('prev')}
              disabled={!hasPrevRecord}
              className={hasPrevRecord ? 'inline-flex items-center justify-center rounded-[3px] border border-slate-300 bg-[#ddd] px-[5px] py-[5px] text-sm text-black cursor-pointer hover:bg-slate-300' : 'inline-flex items-center justify-center rounded-[3px] border border-slate-300 bg-[#ddd] px-[5px] py-[5px] text-sm text-black opacity-40 cursor-pointer'}
              style={{ borderBottomColor: '#000' }}
              aria-label="Registro anterior"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18 9 12l6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('next')}
              disabled={!hasNextRecord}
              className={hasNextRecord ? 'inline-flex items-center justify-center rounded-[3px] border border-slate-300 bg-[#ddd] px-[5px] py-[5px] text-sm text-black cursor-pointer hover:bg-slate-300' : 'inline-flex items-center justify-center rounded-[3px] border border-slate-300 bg-[#ddd] px-[5px] py-[5px] text-sm text-black opacity-40 cursor-pointer'}
              style={{ borderBottomColor: '#000' }}
              aria-label="Próximo registro"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
          {/* ── Breadcrumb ── */}
          {relatorio && (
            <div className="flex items-center text-xs ml-2 whitespace-nowrap overflow-hidden px-2 py-1" style={{ color: isDark ? '#fff' : '#000', border: '1px solid', borderColor: isDark ? '#2c2c31 #38383e #38383e #2c2c31' : '#999 #ccc #ccc #999' }}>
              <span
                className="cursor-pointer hover-breadcrumb"
                style={{ borderBottom: '1px solid transparent' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderBottomColor = isDark ? '#fff' : '#000'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderBottomColor = 'transparent'; }}
                onClick={() => onNavigateToList?.()}
              >
                <span className="font-medium" style={{ color: isDark ? '#fff' : '#000' }}>{relatorio.nr_sequencia}</span>
                <span className="ml-1" style={{ color: isDark ? '#ddd' : '#333' }}>{dsRelatorio}</span>
              </span>
              {bandaDetailId && (() => {
                const banda = bandas.find((b) => b.id === bandaDetailId);
                if (!banda) return null;
                return (
                  <>
                    <span className="mx-1" style={{ color: isDark ? '#fff' : '#000' }}>&gt;</span>
                    <span
                      className="cursor-pointer hover-breadcrumb"
                      style={{ borderBottom: '1px solid transparent' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderBottomColor = isDark ? '#fff' : '#000'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderBottomColor = 'transparent'; }}
                      onClick={() => {
                        // Fecha a banda diretamente (sem async) — bandas já estão em state
                        const currentBandaId = bandaDetailIdRef.current;
                        if (currentBandaId) {
                          const c = camposRef.current;
                          setBandas((prev) => prev.map((b) => b.id === currentBandaId ? { ...b, campos: [...c] } : b));
                        }
                        setPendingCampo(null);
                        setCampoDetailId(null);
                        setBandaDetailId(null);
                        setBandaViewMode('content');
                        setBandasSubView('bandas');
                        setCampos([]);
                        setFiltros([]);
                        setOrdenacao([]);
                      }}
                    >
                      <span className="font-medium" style={{ color: isDark ? '#fff' : '#000' }}>{banda.nr_sequencia}</span>
                      <span className="ml-1" style={{ color: isDark ? '#ddd' : '#333' }}>{banda.ds_banda}</span>
                    </span>
                  </>
                );
              })()}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isBandasMode && !bandaDetailId && (
            <div className="flex items-center text-xs whitespace-nowrap overflow-hidden px-2 py-1 gap-2" style={{ border: '1px solid', borderColor: isDark ? '#2c2c31 #38383e #38383e #2c2c31' : '#999 #ccc #ccc #999', color: isDark ? '#fff' : '#000' }}>
              <button type="button" onClick={() => setBandasSubView('bandas')}
                className="text-xs font-medium cursor-pointer transition"
                style={{ borderBottom: bandasSubView === 'bandas' ? `1px solid ${isDark ? '#fff' : '#000'}` : '1px solid transparent', color: isDark ? '#fff' : '#000' }}>Bandas</button>
              <button type="button" onClick={() => setBandasSubView('parametros')}
                className="text-xs font-medium cursor-pointer transition"
                style={{ borderBottom: bandasSubView === 'parametros' ? `1px solid ${isDark ? '#fff' : '#000'}` : '1px solid transparent', color: isDark ? '#fff' : '#000' }}>Parâmetros</button>
            </div>
          )}
          {bandaDetailId && bandaTipo === 'lista' && (
            <div className="flex items-center text-xs whitespace-nowrap overflow-hidden px-2 py-1 gap-2" style={{ border: '1px solid', borderColor: isDark ? '#2c2c31 #38383e #38383e #2c2c31' : '#999 #ccc #ccc #999', color: isDark ? '#fff' : '#000' }}>
              <button type="button" onClick={() => setBandaContentSubView('dados')}
                className="text-xs font-medium cursor-pointer transition"
                style={{ borderBottom: bandaContentSubView === 'dados' ? `1px solid ${isDark ? '#fff' : '#000'}` : '1px solid transparent', color: isDark ? '#fff' : '#000' }}>Elementos</button>
              <button type="button" onClick={() => setBandaContentSubView('ordenacao')}
                className="text-xs font-medium cursor-pointer transition"
                style={{ borderBottom: bandaContentSubView === 'ordenacao' ? `1px solid ${isDark ? '#fff' : '#000'}` : '1px solid transparent', color: isDark ? '#fff' : '#000' }}>Ordenação</button>
            </div>
          )}
          <button
            type="button"
            onClick={
              bandaDetailId ? () => {
                // Adicionar campo na banda → abre tela Ver do elemento (pendente)
                const bColecao = bandas.find((b) => b.id === bandaDetailId)?.ie_colecao_principal || '';
                const newId = gerarId();
                const newCampo: CamposRelatorioRow = { id: newId, ie_colecao: bandaTipo === 'lista' ? bColecao : '', ie_campo: '', ds_elemento: '', label: '', backgroundLabel: '#e2e8f0', corLabel: '#1a1a1a', cd_cor: '#000000', cd_background: '', transparentCampo: true, qt_esquerda: 0, topoLabel: 0, qt_topo: 0, ie_alinhamento: "esquerda", ie_estilo_label: '', ie_estilo: '', ie_estilo_soma: '', qt_largura: 100, formatacao: 'texto', statusSistema: false, soma: false, ie_fonte: 'Arial', qt_fonte: 10, nr_seq_imagem: undefined, qt_tamanho_imagem: 100, qt_padding_superior: 0, qt_padding_direita: 0, qt_padding_inferior: 0, qt_padding_esquerda: 0, ie_borda_superior: 'N', ie_borda_direita: 'N', ie_borda_inferior: 'N', ie_borda_esquerda: 'N' };
                setPendingCampo(newCampo);
                setCampoDetailId(newId);
              }
              : isBandasMode ? () => {
                  if (bandasSubView === 'bandas') {
                    // Criar banda pendente e abrir tela Ver
                    const newId = gerarId();
                    const novaBanda: BandaState = { id: newId, ds_banda: '', ie_colecao_principal: '', nr_posicao: (Math.max(0, ...bandas.map((b) => b.nr_posicao ?? 0)) + 1), nr_seq_relatorio: relatorio?.nr_sequencia, campos: [] };
                    setPendingBanda(novaBanda);
                    openBandaVer(newId);
                  } else {
                    const newId = gerarId();
                    const seq = getNextFiltroSeq();
                    const novoFiltro: RelatorioFiltro = { id: newId, nr_sequencia: seq, ie_campo: '', operador: 'igual' as const, vl_padrao: '', valorFinal: '', ie_conector: 'E' as const, ie_mascara: 'texto' as const };
                    setPendingFiltro(novoFiltro);
                    setFiltroDetailId(newId);
                  }
                }
              : onCancel
            }
            disabled={(!!bandaDetailId || !!campoDetailId) && bandaTipo === 'lista' && !bandas.find((b) => b.id === bandaDetailId)?.ie_colecao_principal}
            className={`inline-flex items-center rounded-[3px] border border-transparent bg-transparent px-4 py-2.5 text-sm font-normal text-[#066fc5] transition cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2 active:outline active:outline-1 active:outline-[#066fc5] active:outline-offset-2 disabled:text-slate-400 disabled:cursor-not-allowed ${campoDetailId ? 'hidden' : ''}`}
          >
            {bandaDetailId ? 'Adicionar' : isBandasMode ? 'Adicionar' : 'Fechar'}
          </button>
        </div>
      </div>

      {/* ── Erros ── */}
      {erros.length > 0 && (
        <div className="mt-2 p-3 bg-red-50 border border-red-300 rounded text-sm text-red-700">
          <ul className="list-disc list-inside">
            {erros.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* ── Formulário ── */}
      <form ref={formRef} onSubmit={handleSubmit} className="mt-6 flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-9">
          {!bandaDetailId && !isBandasMode && (
          <>
          {/* ═══════════════════════════════════════════════ */}
          {/* ── Seção: Relatório ── */}
          {/* ═══════════════════════════════════════════════ */}
          <section>
            <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Relatório</h2>
          <div className="grid gap-[15px] sm:grid-cols-12">

            {/* ── Linha 1: Sequência + Descrição + Formato ── */}
            <div className="sm:col-span-2 group">
              {renderFieldLabel('nr_sequencia', 'Sequência', relatorioFieldInfos, 'relatorio', campoRegras)}
              <input disabled value={String(relatorio?.nr_sequencia ?? '')} className={`${inputClass} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`} />
            </div>
            <div className="sm:col-span-7 group">
              {renderFieldLabel('ds_relatorio', 'Descrição', relatorioFieldInfos, 'relatorio', campoRegras)}
              <input value={dsRelatorio} onChange={(e) => setDsRelatorio(e.target.value)} disabled={statusDe(campoRegras, 'ds_relatorio') === 'D'} className={inputClass} />
            </div>
            <div className="sm:col-span-3 group">
              {renderFieldLabel('ie_formato', 'Formato', relatorioFieldInfos, 'relatorio', campoRegras)}
              <input value="PDF" disabled
                className={`${inputClass} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`} />
            </div>

          </div>
          </section>

          {/* ═══════════════════════════════════════════════ */}
          {/* ── Seção: Saída ── */}
          {/* ═══════════════════════════════════════════════ */}
          <section>
            <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Saída</h2>

            <div className="space-y-[15px]">
                <div className="grid gap-[15px] sm:grid-cols-4">
                  <div className="group">
                    {renderFieldLabel('ds_nome_arquivo', 'Nome do arquivo', relatorioFieldInfos, 'relatorio', campoRegras)}
                    <input value={configPdf.titulo ?? ""} onChange={(e) => setConfigPdf({ ...configPdf, titulo: e.target.value })} disabled={statusDe(campoRegras, 'ds_nome_arquivo') === 'D'} className={inputClass} />
                  </div>
                  <div className="group">
                    {renderFieldLabel('ie_pagina', 'Página', relatorioFieldInfos, 'relatorio', campoRegras)}
                    <Select value={configPdf.tamanhoPagina} onChange={(v) => setConfigPdf({ ...configPdf, tamanhoPagina: v as any })} options={[...TAMANHOS_PAGINA]} showPlaceholder={false} disabled={statusDe(campoRegras, 'ie_pagina') === 'D'} visibleOptions={7} />
                  </div>
                  <div className="group">
                    {renderFieldLabel('ie_orientacao', 'Orientação', relatorioFieldInfos, 'relatorio', campoRegras)}
                    <Select value={configPdf.orientacao} onChange={(v) => setConfigPdf({ ...configPdf, orientacao: v as any })} options={[{ value: "retrato", label: "Retrato" }, { value: "paisagem", label: "Paisagem" }]} showPlaceholder={false} disabled={statusDe(campoRegras, 'ie_orientacao') === 'D'} visibleOptions={7} />
                  </div>
                  <div className="group">
                    {renderFieldLabel('ie_borda', 'Borda', relatorioFieldInfos, 'relatorio', campoRegras)}
                    <Select
                      value={configPdf.estiloBorda ?? ''}
                      onChange={(v) => setConfigPdf({ ...configPdf, estiloBorda: (v || null) as RelatorioConfigPdf['estiloBorda'] })}
                      options={[
                        { value: '', label: '---' },
                        { value: 'solid_fina', label: 'Sólida fina' },
                        { value: 'solid_grossa', label: 'Sólida grossa' },
                        { value: 'dupla', label: 'Dupla' },
                        { value: 'tracejada', label: 'Tracejada' },
                        { value: 'pontilhada', label: 'Pontilhada' },
                      ]}
                      showPlaceholder={false}
                      disabled={statusDe(campoRegras, 'ie_borda') === 'D'}
                      visibleOptions={7}
                    />
                  </div>
                </div>
                {/* Margens */}
                <div className="grid gap-[15px] sm:grid-cols-4">
                  <div className="group">
                    {renderFieldLabel('nr_margem_superior', 'Margem superior', relatorioFieldInfos, 'relatorio', campoRegras)}
                    <input type="text" inputMode="numeric" value={configPdf.margens.superior} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setConfigPdf({ ...configPdf, margens: { ...configPdf.margens, superior: v ? Number(v) : 5 } }); }} disabled={statusDe(campoRegras, 'nr_margem_superior') === 'D'} className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`} />
                  </div>
                  <div className="group">
                    {renderFieldLabel('nr_margem_inferior', 'Margem inferior', relatorioFieldInfos, 'relatorio', campoRegras)}
                    <input type="text" inputMode="numeric" value={configPdf.margens.inferior} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setConfigPdf({ ...configPdf, margens: { ...configPdf.margens, inferior: v ? Number(v) : 5 } }); }} disabled={statusDe(campoRegras, 'nr_margem_inferior') === 'D'} className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`} />
                  </div>
                  <div className="group">
                    {renderFieldLabel('nr_margem_esquerda', 'Margem esquerda', relatorioFieldInfos, 'relatorio', campoRegras)}
                    <input type="text" inputMode="numeric" value={configPdf.margens.esquerda} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setConfigPdf({ ...configPdf, margens: { ...configPdf.margens, esquerda: v ? Number(v) : 5 } }); }} disabled={statusDe(campoRegras, 'nr_margem_esquerda') === 'D'} className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`} />
                  </div>
                  <div className="group">
                    {renderFieldLabel('nr_margem_direita', 'Margem direita', relatorioFieldInfos, 'relatorio', campoRegras)}
                    <input type="text" inputMode="numeric" value={configPdf.margens.direita} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setConfigPdf({ ...configPdf, margens: { ...configPdf.margens, direita: v ? Number(v) : 5 } }); }} disabled={statusDe(campoRegras, 'nr_margem_direita') === 'D'} className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`} />
                  </div>
                </div>
              </div>
          </section>
          </>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/* ── Seção: Bandas (modo bandas) ── */}
          {/* ═══════════════════════════════════════════════ */}
          {!bandaDetailId && isBandasMode && bandasSubView === 'bandas' && (
          <>
          <section className="mb-4">
            <BandasRelatorioTable
              bandas={bandas}
              onChange={setBandas}
              colecaoOptions={opcoesColecao}
              onEditingChange={setEditingBanda}
              userId={userId}
              initialColumns={initialBandasColumns}
              onColumnsChange={onBandasColumnsChange}
              onOpenBanda={(b) => openBandaDetail(b.id)}
              onViewBanda={(b) => openBandaVer(b.id)}
              getNextBandaSeq={getNextBandaSeq}
              selectedRecordId={lastBandaDetailIdRef.current}
              onDeleteBanda={onDeleteBanda}
              onDuplicateBanda={async (original) => {
                setBandaSaving(true);
                try {
                  const { criarBanda, criarElemento } = await import('@/services/relatorioServiceBandas');
                  const auditAutor = { usuarioId: null, usuarioNome: userId ?? '' };
                  const { id: _oldId, _firestoreId: _oldFs, campos: _oldCampos, filtros: _oldFiltros, ordenacao: _oldOrd, ...rest } = original as any;
                  const { id: newBandaId, nr_sequencia: savedSeq } = await criarBanda({ ...rest, nr_seq_relatorio: relatorio?.nr_sequencia ?? 0 }, auditAutor);
                  // Duplicar elementos filhos
                  const novosCampos: any[] = [];
                  for (const c of (_oldCampos ?? [])) {
                    const { id: _cId, _firestoreId: _cFs, ...cRest } = c;
                    const { id: cNewId, nr_sequencia: cSeq } = await criarElemento({ ...cRest, nr_seq_banda: savedSeq, nr_seq_relatorio: relatorio?.nr_sequencia ?? 0 }, auditAutor);
                    novosCampos.push({ ...cRest, id: cNewId, _firestoreId: cNewId, nr_sequencia: cSeq });
                  }
                  return { ...rest, id: newBandaId, _firestoreId: newBandaId, nr_sequencia: savedSeq, campos: novosCampos } as any;
                } finally {
                  setBandaSaving(false);
                }
              }}
            />
          </section>
          </>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/* ── Seção: Parâmetros (modo bandas) ── */}
          {/* ═══════════════════════════════════════════════ */}
          {!bandaDetailId && !filtroDetailId && isBandasMode && bandasSubView === 'parametros' && (
          <>
          <section className="mb-4">
            <FiltrosRelatorioTable
              filtros={filtros}
              onChange={setFiltros}
              camposDisponiveis={camposDisponiveis}
              onEditingChange={setEditingFiltro}
              userId={userId}
              initialColumns={initialFiltrosColumns}
              onColumnsChange={onFiltrosColumnsChange}
              getNextSeq={getNextFiltroSeq}
              colecaoOptions={opcoesColecao}
              onViewFiltro={(f) => openFiltroVer(f.id)}
              onDeleteFiltro={onDeleteFiltro}
            />
          </section>
          </>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/* ── Seção: Filtro Detail View (inline) ── */}
          {/* ═══════════════════════════════════════════════ */}
          {filtroDetailId && !bandaDetailId && isBandasMode && (
          <section className="mb-4">
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-1">
              <h2 className="text-sm font-semibold text-slate-900">Parâmetro</h2>
            </div>
            {filtroSel && (
            <div className="space-y-[15px]">
            <div className="grid grid-cols-7 gap-[15px]">
              <div className="group col-span-1">
                {renderFieldLabel('nr_sequencia', 'Sequência', parametroFieldInfos, 'relatorio_parametro', parametroCampoRegras)}
                <input type="text" inputMode="numeric" value={filtroSel.nr_sequencia ?? ''} disabled
                  className={`${inputClass} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`} />
              </div>
              <div className="group col-span-2">
                {renderFieldLabel('ie_colecao', 'Coleção', parametroFieldInfos, 'relatorio_parametro', parametroCampoRegras)}
                <Select
                  value={filtroSel.ie_colecao ?? ''}
                  onChange={(v) => {
                    if (pendingFiltro && pendingFiltro.id === filtroDetailId) {
                      setPendingFiltro((prev) => prev ? { ...prev, ie_colecao: v, ie_campo: '' } : prev);
                    } else {
                      setFiltros((prev) => prev.map((f) => f.id === filtroDetailId ? { ...f, ie_colecao: v, ie_campo: '' } : f));
                    }
                  }}
                  options={[{ value: '', label: '---' }, ...opcoesColecao]}
                  showPlaceholder={false}
                  visibleOptions={7}
                  className={inputClass}
                />
              </div>
              <div className="group col-span-2">
                {renderFieldLabel('ie_campo', 'Campo', parametroFieldInfos, 'relatorio_parametro', parametroCampoRegras)}
                <Select
                  value={filtroSel.ie_campo}
                  onChange={(v) => {
                    if (pendingFiltro && pendingFiltro.id === filtroDetailId) {
                      setPendingFiltro((prev) => prev ? { ...prev, ie_campo: v } : prev);
                    } else {
                      setFiltros((prev) => prev.map((f) => f.id === filtroDetailId ? { ...f, ie_campo: v } : f));
                    }
                  }}
                  options={(filtroSel.ie_colecao ? (getDataSource(filtroSel.ie_colecao)?.campos ?? []) : []).map((cd) => ({ value: cd.key, label: cd.key }))}
                  showPlaceholder
                  disabled={!filtroSel.ie_colecao}
                  visibleOptions={7}
                  className={inputClass}
                />
              </div>
              <div className="group col-span-2">
                {renderFieldLabel('ds_label', 'Label', parametroFieldInfos, 'relatorio_parametro', parametroCampoRegras)}
                <input type="text" value={filtroSel.ds_label ?? ''}
                  onChange={(e) => {
                    if (pendingFiltro && pendingFiltro.id === filtroDetailId) {
                      setPendingFiltro((prev) => prev ? { ...prev, ds_label: e.target.value } : prev);
                    } else {
                      setFiltros((prev) => prev.map((f) => f.id === filtroDetailId ? { ...f, ds_label: e.target.value } : f));
                    }
                  }}
                  className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-8 gap-[15px] mt-[15px]">
              <div className="group col-span-2">
                {renderFieldLabel('ie_mascara', 'Máscara', parametroFieldInfos, 'relatorio_parametro', parametroCampoRegras)}
                <Select
                  value={filtroSel.ie_mascara ?? 'texto'}
                  onChange={(v) => {
                    if (pendingFiltro && pendingFiltro.id === filtroDetailId) {
                      setPendingFiltro((prev) => prev ? { ...prev, ie_mascara: v as any } : prev);
                    } else {
                      setFiltros((prev) => prev.map((f) => f.id === filtroDetailId ? { ...f, ie_mascara: v as any } : f));
                    }
                  }}
                  options={[
                    { value: 'texto', label: 'Texto' },
                    { value: 'data', label: 'Data' },
                    { value: 'decimal', label: 'Decimal' },
                    { value: 'inteiro', label: 'Inteiro' },
                    { value: 'cpf', label: 'CPF' },
                    { value: 'telefone', label: 'Telefone' },
                  ]}
                  showPlaceholder={false}
                  visibleOptions={7}
                  className={inputClass}
                />
              </div>
              <div className="group col-span-2">
                {renderFieldLabel('vl_padrao', 'Valor padrão', parametroFieldInfos, 'relatorio_parametro', parametroCampoRegras)}
                <input type="text" value={filtroSel.vl_padrao ?? ''}
                  onChange={(e) => {
                    if (pendingFiltro && pendingFiltro.id === filtroDetailId) {
                      setPendingFiltro((prev) => prev ? { ...prev, vl_padrao: e.target.value } : prev);
                    } else {
                      setFiltros((prev) => prev.map((f) => f.id === filtroDetailId ? { ...f, vl_padrao: e.target.value } : f));
                    }
                  }}
                  className={inputClass} />
              </div>
              <div className="group col-span-2">
                {renderFieldLabel('ie_conector', 'Conector', parametroFieldInfos, 'relatorio_parametro', parametroCampoRegras)}
                <Select
                  value={filtroSel.ie_conector ?? 'E'}
                  onChange={(v) => {
                    if (pendingFiltro && pendingFiltro.id === filtroDetailId) {
                      setPendingFiltro((prev) => prev ? { ...prev, ie_conector: v as any } : prev);
                    } else {
                      setFiltros((prev) => prev.map((f) => f.id === filtroDetailId ? { ...f, ie_conector: v as any } : f));
                    }
                  }}
                  options={[{ value: 'E', label: 'E' }, { value: 'OU', label: 'OU' }]}
                  showPlaceholder={false}
                  visibleOptions={7}
                  className={inputClass}
                />
              </div>
              <div className="group col-span-1">
                <label className="flex items-center h-[34px] gap-2 cursor-pointer">
                  <input type="checkbox" checked={filtroSel.ie_parametro ?? false}
                    onChange={(e) => {
                      if (pendingFiltro && pendingFiltro.id === filtroDetailId) {
                        setPendingFiltro((prev) => prev ? { ...prev, ie_parametro: e.target.checked, ie_obrigatorio: e.target.checked ? prev.ie_obrigatorio : false } : prev);
                      } else {
                        setFiltros((prev) => prev.map((f) => f.id === filtroDetailId ? { ...f, ie_parametro: e.target.checked, ie_obrigatorio: e.target.checked ? f.ie_obrigatorio : false } : f));
                      }
                    }}
                    className="cg-checkbox" />
                  {renderFieldLabel('ie_parametro', 'Parâmetro', parametroFieldInfos, 'relatorio_parametro', parametroCampoRegras)}
                </label>
              </div>
              <div className="group col-span-1">
                <label className="flex items-center h-[34px] gap-2 cursor-pointer">
                  <input type="checkbox" checked={filtroSel.ie_obrigatorio ?? false}
                    disabled={!filtroSel.ie_parametro}
                    onChange={(e) => {
                      if (pendingFiltro && pendingFiltro.id === filtroDetailId) {
                        setPendingFiltro((prev) => prev ? { ...prev, ie_obrigatorio: e.target.checked } : prev);
                      } else {
                        setFiltros((prev) => prev.map((f) => f.id === filtroDetailId ? { ...f, ie_obrigatorio: e.target.checked } : f));
                      }
                    }}
                    className="cg-checkbox" />
                  {renderFieldLabel('ie_obrigatorio', 'Obrigatório', parametroFieldInfos, 'relatorio_parametro', parametroCampoRegras)}
                </label>
              </div>
            </div>
            </div>
            )}
          </section>
          )}

          {bandaDetailId ? (
          /* ── Banda Detail View (inline) ── */
          <>

          {/* ═══════════════════════════════════════════════ */}
          {/* ── Seção: Banda (dados da banda selecionada) — somente no modo 'ver' ── */}
          {/* ═══════════════════════════════════════════════ */}
          {bandaViewMode === 'ver' && (() => {
            const bSel = (pendingBanda && pendingBanda.id === bandaDetailId) ? pendingBanda : bandas.find((b) => b.id === bandaDetailId);
            if (!bSel) return null;
            return (
              <section>
                <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-1">
                  <h2 className="text-sm font-semibold text-slate-900">Banda</h2>
                </div>
                <div className="grid grid-cols-6 gap-[15px]">
                  <div className="group">
                    {renderFieldLabel('nr_sequencia', 'Sequência', bandaFieldInfos, 'relatorio_banda', bandaCampoRegras)}
                    <input type="text" inputMode="numeric" value={bSel.nr_sequencia ?? ''} disabled
                      className={`${inputClass} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`} />
                  </div>
                  <div className="group">
                    {renderFieldLabel('ds_banda', 'Descrição', bandaFieldInfos, 'relatorio_banda', bandaCampoRegras)}
                    <input type="text" value={bSel.ds_banda}
                      onChange={(e) => updateBandaSelecionada((b) => ({ ...b, ds_banda: e.target.value }))}
                      className={inputClass} />
                  </div>
                  <div className="group">
                    {renderFieldLabel('ie_tipo_banda', 'Tipo', bandaFieldInfos, 'relatorio_banda', bandaCampoRegras)}
                    <Select
                      value={bSel.ie_tipo_banda ?? ''}
                      onChange={(v) => updateBandaSelecionada((b) => ({ ...b, ie_tipo_banda: v as any }))}
                      options={[
                        { value: '', label: '---' },
                        { value: 'lista', label: 'Lista' },
                        { value: 'texto_valor', label: 'Dados' },
                        ...(!bandas.some((b) => b.id !== bandaDetailId && b.ie_tipo_banda === 'cabecalho') ? [{ value: 'cabecalho', label: 'Cabeçalho' }] : []),
                        ...(!bandas.some((b) => b.id !== bandaDetailId && b.ie_tipo_banda === 'rodape') ? [{ value: 'rodape', label: 'Rodapé' }] : []),
                      ]}
                      showPlaceholder={false}
                      visibleOptions={7}
                    />
                  </div>
                  <div className="group">
                    {renderFieldLabel('ie_colecao_principal', 'Coleção principal', bandaFieldInfos, 'relatorio_banda', bandaCampoRegras)}
                    <Select
                      value={bSel.ie_colecao_principal ?? ''}
                      onChange={(v) => updateBandaSelecionada((b) => ({ ...b, ie_colecao_principal: v }))}
                      options={[{ value: '', label: '---' }, ...opcoesColecao]}
                      showPlaceholder={false}
                      visibleOptions={7}
                      disabled={bandaTipo === 'cabecalho' || bandaTipo === 'rodape'}
                    />
                  </div>
                  <div className="group">
                    {renderFieldLabel('nr_posicao', 'Posição', bandaFieldInfos, 'relatorio_banda', bandaCampoRegras)}
                    <input type="text" inputMode="numeric" value={bSel.nr_posicao ?? ''}
                      onChange={(e) => updateBandaSelecionada((b) => ({ ...b, nr_posicao: Number(e.target.value) || 0 }))}
                      className={inputClass} />
                  </div>
                  <div className="group">
                    {renderFieldLabel('nr_altura', 'Altura', bandaFieldInfos, 'relatorio_banda', bandaCampoRegras)}
                    <input type="text" inputMode="numeric" value={bSel.nr_altura ?? ''}
                      onChange={(e) => updateBandaSelecionada((b) => ({ ...b, nr_altura: Number(e.target.value) || 0 }))}
                      className={inputClass} />
                  </div>
                </div>
                {/* ── Bordas da banda ── */}
                <div className="flex items-center gap-6 mt-3">
                  {([
                    { key: 'ie_borda_superior', label: 'Borda superior', id: 'borda_sup' },
                    { key: 'ie_borda_inferior', label: 'Borda inferior', id: 'borda_inf' },
                    { key: 'ie_borda_esquerda', label: 'Borda esquerda', id: 'borda_esq' },
                    { key: 'ie_borda_direita', label: 'Borda direita', id: 'borda_dir' },
                  ] as const).map(({ key, label, id }) => (
                    <div key={key} className="group flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`${id}_${bSel.id}`}
                        checked={bSel[key] ?? false}
                        onChange={(e) => updateBandaSelecionada((b) => ({ ...b, [key]: e.target.checked }))}
                        className="cg-checkbox"
                      />
                      <label htmlFor={`${id}_${bSel.id}`} className="text-sm text-slate-700 cursor-pointer">
                        {label}
                      </label>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setInfoAnchor(event.currentTarget);
                          setInfoPopupField((current) => (current === key ? null : key));
                        }}
                        aria-label={`Informações do campo ${label}`}
                        className="inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer transition-none opacity-0 group-hover:opacity-100"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4" />
                          <circle cx="12" cy="16" r="0.5" />
                        </svg>
                      </button>
                      {infoPopupField === key && (
                        <FieldInfoPopup
                          anchor={infoAnchor}
                          meta={{ type: 'boolean', field: key, collection: 'relatorio_banda' }}
                          onClose={() => setInfoPopupField(null)}
                        />
                      )}
                    </div>
                  ))}
                </div>
                {/* ── Configurações (somente para banda tipo Lista) ── */}
                {bandaTipo === 'lista' && (
                <>
                  <div className="flex items-center justify-between mb-3 mt-6 border-b border-slate-200 pb-1">
                    <h2 className="text-sm font-semibold text-slate-900">Configurações</h2>
                  </div>
                  <div className="grid grid-cols-6 gap-[15px]">
                    {/* Linha 1: Espessura/Topo/Bg/Cor/Fonte/Tamanho label */}
                    <div className="group">
                      {renderFieldLabel('espessuraLabel', 'Espessura label', bandaFieldInfos, 'relatorio_banda', bandaCampoRegras)}
                      <input type="text" inputMode="numeric" value={espessuraLabel}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9]/g, '');
                          const val = v ? Math.max(1, Number(v)) : 1;
                          setEspessuraLabel(val);
                          updateBandaSelecionada((b) => ({ ...b, espessuraLabel: val }));
                        }}
                        className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`}
                      />
                    </div>
                    <div className="group">
                      {renderFieldLabel('topoLabel', 'Topo label', bandaFieldInfos, 'relatorio_banda', bandaCampoRegras)}
                      <input type="text" inputMode="numeric" value={topoLabelVal}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9]/g, '');
                          const val = v ? Math.max(0, Number(v)) : 0;
                          setTopoLabelVal(val);
                          updateBandaSelecionada((b) => ({ ...b, topoLabel: val }));
                        }}
                        className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`}
                      />
                    </div>
                    <div className="group">
                      {renderFieldLabel('bgLabel', 'Background label', bandaFieldInfos, 'relatorio_banda', bandaCampoRegras)}
                      <Select
                        value={bgLabel}
                        onChange={(v) => { setBgLabel(v); updateBandaSelecionada((b) => ({ ...b, bgLabel: v })); }}
                        options={[{ value: '', label: '---' }, { value: '#e2e8f0', label: '#e2e8f0' }, { value: '#003056', label: '#003056' }, { value: '#1a4567', label: '#1a4567' }, { value: '#334155', label: '#334155' }, { value: '#475569', label: '#475569' }, { value: '#64748b', label: '#64748b' }, { value: '#94a3b8', label: '#94a3b8' }, { value: '#cbd5e1', label: '#cbd5e1' }, { value: '#f1f5f9', label: '#f1f5f9' }, { value: '#fefce8', label: '#fefce8' }]}
                        showPlaceholder={false}
                        renderOption={(opt) => (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {opt.value ? (
                              <span style={{ display: 'inline-block', width: 14, height: 14, background: opt.value, border: '1px solid #ccc', borderRadius: 2, flexShrink: 0 }} />
                            ) : null}
                            <span>{opt.label}</span>
                          </span>
                        )}
                      visibleOptions={7}
                      />
                    </div>
                    <div className="group">
                      {renderFieldLabel('corLabelGlobal', 'Cor label', bandaFieldInfos, 'relatorio_banda', bandaCampoRegras)}
                      <Select
                        value={corLabelGlobal}
                        onChange={(v) => { setCorLabelGlobal(v); updateBandaSelecionada((b) => ({ ...b, corLabelGlobal: v })); }}
                        options={[{ value: '#1a1a1a', label: '#1a1a1a' }, { value: '#000000', label: '#000000' }, { value: '#333333', label: '#333333' }, { value: '#555555', label: '#555555' }, { value: '#666666', label: '#666666' }, { value: '#999999', label: '#999999' }, { value: '#ffffff', label: '#ffffff' }, { value: '#003056', label: '#003056' }, { value: '#1a4567', label: '#1a4567' }, { value: '#c0392b', label: '#c0392b' }]}
                        showPlaceholder={false}
                        renderOption={(opt) => (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ display: 'inline-block', width: 14, height: 14, background: opt.value, border: '1px solid #ccc', borderRadius: 2, flexShrink: 0 }} />
                            <span>{opt.label}</span>
                          </span>
                        )}
                      visibleOptions={7}
                      />
                    </div>
                    <div className="group">
                      {renderFieldLabel('fonteLabel', 'Fonte label', bandaFieldInfos, 'relatorio_banda', bandaCampoRegras)}
                      <Select
                        value={fonteLabel}
                        onChange={(v) => { setFonteLabel(v); updateBandaSelecionada((b) => ({ ...b, fonteLabel: v })); }}
                        options={[{ value: 'Arial', label: 'Arial' }, { value: 'Calibri', label: 'Calibri' }, { value: 'Times New Roman', label: 'Times New Roman' }, { value: 'Courier New', label: 'Courier New' }, { value: 'Tahoma', label: 'Tahoma' }, { value: 'Trebuchet MS', label: 'Trebuchet MS' }]}
                        showPlaceholder={false}
                        visibleOptions={7}
                      />
                    </div>
                    <div className="group">
                      {renderFieldLabel('tamanhoFonteLabel', 'Tamanho fonte label', bandaFieldInfos, 'relatorio_banda', bandaCampoRegras)}
                      <input type="text" inputMode="numeric" value={tamanhoFonteLabel}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9]/g, '');
                          const val = v ? Math.max(1, Number(v)) : 1;
                          setTamanhoFonteLabel(val);
                          updateBandaSelecionada((b) => ({ ...b, tamanhoFonteLabel: val }));
                        }}
                        className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`}
                      />
                    </div>
                    {/* Linha 2: Espessura/Topo/Bg/Cor/Fonte/Tamanho registro */}
                    <div className="group">
                      {renderFieldLabel('espessuraCampo', 'Espessura registro', bandaFieldInfos, 'relatorio_banda', bandaCampoRegras)}
                      <input type="text" inputMode="numeric" value={espessuraCampo}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9]/g, '');
                          const val = v ? Math.max(1, Number(v)) : 1;
                          setEspessuraCampo(val);
                          updateBandaSelecionada((b) => ({ ...b, espessuraCampo: val }));
                        }}
                        className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`}
                      />
                    </div>
                    <div className="group">
                      {renderFieldLabel('topoRegistro', 'Topo registro', bandaFieldInfos, 'relatorio_banda', bandaCampoRegras)}
                      <input type="text" inputMode="numeric" value={topoRegistroVal}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9]/g, '');
                          const val = v ? Math.max(0, Number(v)) : 0;
                          setTopoRegistroVal(val);
                          updateBandaSelecionada((b) => ({ ...b, topoRegistro: val }));
                        }}
                        className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`}
                      />
                    </div>
                    <div className="group">
                      {renderFieldLabel('bgCampo', 'Background registro', bandaFieldInfos, 'relatorio_banda', bandaCampoRegras)}
                      <Select
                        value={bgCampo}
                        onChange={(v) => { setBgCampo(v); updateBandaSelecionada((b) => ({ ...b, bgCampo: v })); }}
                        options={[{ value: '', label: '---' }, { value: 'zebrado', label: 'Linhas zebradas' }]}
                        showPlaceholder={false}
                        renderOption={(opt) => (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {opt.value === 'zebrado' ? (
                              <span style={{ display: 'inline-flex', width: 14, height: 14, flexShrink: 0, border: '1px solid #ccc', borderRadius: 2, overflow: 'hidden' }}>
                                <span style={{ flex: 1, background: '#fff' }} />
                                <span style={{ flex: 1, background: '#ccc' }} />
                              </span>
                            ) : null}
                            <span>{opt.label}</span>
                          </span>
                        )}
                      visibleOptions={7}
                      />
                    </div>
                    <div className="group">
                      {renderFieldLabel('corCampoGlobal', 'Cor registro', bandaFieldInfos, 'relatorio_banda', bandaCampoRegras)}
                      <Select
                        value={corCampoGlobal}
                        onChange={(v) => { setCorCampoGlobal(v); updateBandaSelecionada((b) => ({ ...b, corCampoGlobal: v })); }}
                        options={[{ value: '#1a1a1a', label: '#1a1a1a' }, { value: '#000000', label: '#000000' }, { value: '#333333', label: '#333333' }, { value: '#555555', label: '#555555' }, { value: '#666666', label: '#666666' }, { value: '#999999', label: '#999999' }, { value: '#ffffff', label: '#ffffff' }, { value: '#003056', label: '#003056' }, { value: '#1a4567', label: '#1a4567' }, { value: '#c0392b', label: '#c0392b' }]}
                        showPlaceholder={false}
                        renderOption={(opt) => (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ display: 'inline-block', width: 14, height: 14, background: opt.value, border: '1px solid #ccc', borderRadius: 2, flexShrink: 0 }} />
                            <span>{opt.label}</span>
                          </span>
                        )}
                      visibleOptions={7}
                      />
                    </div>
                    <div className="group">
                      {renderFieldLabel('fonteCampo', 'Fonte registro', bandaFieldInfos, 'relatorio_banda', bandaCampoRegras)}
                      <Select
                        value={fonteCampo}
                        onChange={(v) => { setFonteCampo(v); updateBandaSelecionada((b) => ({ ...b, fonteCampo: v })); }}
                        options={[{ value: 'Arial', label: 'Arial' }, { value: 'Calibri', label: 'Calibri' }, { value: 'Times New Roman', label: 'Times New Roman' }, { value: 'Courier New', label: 'Courier New' }, { value: 'Tahoma', label: 'Tahoma' }, { value: 'Trebuchet MS', label: 'Trebuchet MS' }]}
                        showPlaceholder={false}
                        visibleOptions={7}
                      />
                    </div>
                    <div className="group">
                      {renderFieldLabel('tamanhoFonteCampo', 'Tamanho fonte registro', bandaFieldInfos, 'relatorio_banda', bandaCampoRegras)}
                      <input type="text" inputMode="numeric" value={tamanhoFonteCampo}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9]/g, '');
                          const val = v ? Math.max(1, Number(v)) : 1;
                          setTamanhoFonteCampo(val);
                          updateBandaSelecionada((b) => ({ ...b, tamanhoFonteCampo: val }));
                        }}
                        className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`}
                      />
                    </div>
                  </div>
                </>
                )}
              </section>
            );
          })()}

          {/* ═══════════════════════════════════════════════ */}
          {/* ── Element (Campo) Ver Form ── */}
          {/* ═══════════════════════════════════════════════ */}
          {campoDetailId && campoSel && (() => {
            const tipoBanda = bandas.find((b) => b.id === bandaDetailId)?.ie_tipo_banda;
            const isTextoValor = tipoBanda === 'texto_valor';
            const isCabeOuRodape = tipoBanda === 'cabecalho' || tipoBanda === 'rodape';
            const ocultarColecaoCampo = false;
            const textoValorHidden = tipoBanda !== 'lista';
            const ESTILO_OPTS = [{ value: '', label: '---' }, { value: 'negrito', label: 'Negrito' }, { value: 'italico', label: 'Itálico' }, { value: 'sublinhado', label: 'Sublinhado' }, { value: 'negrito_italico', label: 'Negrito + Itálico' }, { value: 'negrito_sublinhado', label: 'Negrito + Sublinhado' }, { value: 'italico_sublinhado', label: 'Itálico + Sublinhado' }, { value: 'negrito_italico_sublinhado', label: 'Negrito + Itálico + Sublinhado' }];
            const FONTES_OPTS = [{ value: 'Arial', label: 'Arial' }, { value: 'Calibri', label: 'Calibri' }, { value: 'Times New Roman', label: 'Times New Roman' }, { value: 'Courier New', label: 'Courier New' }, { value: 'Tahoma', label: 'Tahoma' }, { value: 'Trebuchet MS', label: 'Trebuchet MS' }];
            return (
              <section>
                {/* ── Identificação ── */}
                <div className="mb-2 mt-2 border-b border-slate-200 pb-1">
                  <h3 className="text-sm font-semibold text-slate-900">Identificação</h3>
                </div>
                <div className="flex flex-wrap gap-[15px]">
                  <div className="group flex-none w-[100px]">
                    {renderFieldLabel('nr_sequencia', 'Sequência', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                    <input type="text" inputMode="numeric" value={campoSel.nr_sequencia ?? ''} disabled
                      className={`${inputClass} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`} />
                  </div>
                  <div className="group flex-1 min-w-[140px]">
                    {renderFieldLabel('ds_elemento', 'Descrição', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                    <input type="text" value={campoSel.ds_elemento ?? ''}
                      onChange={(e) => updateCampoSelecionado((c) => ({ ...c, ds_elemento: e.target.value }))}
                      className={inputClass} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-[15px] mt-2">
                  <div className="group flex-1 min-w-[140px]">
                    {renderFieldLabel('ie_tipo_elemento', 'Tipo', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                    <Select
                      value={campoSel.ie_tipo_elemento ?? ''}
                      onChange={(v) => updateCampoSelecionado((c) => ({ ...c, ie_tipo_elemento: (v || undefined) as any }))}
                      options={
                        tipoBanda === 'lista'
                          ? [{ value: 'valor', label: 'Valor' }]
                          : [{ value: 'conteudo', label: 'Conteúdo' }, { value: 'data_horario_geracao', label: 'Data + horário da geração' }, { value: 'data_geracao', label: 'Data da geração' }, { value: 'horario_geracao', label: 'Horário da geração' }, { value: 'imagem', label: 'Imagem' }, { value: 'usuario_geracao', label: 'Usuário da geração' }, { value: 'valor', label: 'Valor' }]
                      }
                      showPlaceholder={true}
                      className={inputClass}
                    />
                  </div>
                  {!ocultarColecaoCampo && (() => {
                    const campoColecaoPrincipal = bandas.find((b) => b.id === bandaDetailId)?.ie_colecao_principal || '';
                    const dsPrincipal = getDataSource(campoColecaoPrincipal);
                    const fkFields = dsPrincipal?.campos.filter((c) => c.isFK && c.fkColecao) ?? [];
                    const colecoesEl: { value: string; label: string }[] = [
                      { value: campoColecaoPrincipal, label: campoColecaoPrincipal },
                      ...fkFields.map((fk) => ({ value: fk.fkColecao!, label: fk.fkColecao! })).filter((o) => o.value !== campoColecaoPrincipal),
                    ];
                    const dsSel = getDataSource(campoSel.ie_colecao || '');
                    const camposDaColecao = dsSel?.campos ?? [];
                    return (
                      <>
                        <div className="group flex-1 min-w-[140px]">
                          {renderFieldLabel('ie_colecao', 'Coleção', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                          <Select
                            value={campoSel.ie_colecao ?? ''}
                            onChange={(v) => updateCampoSelecionado((c) => ({ ...c, ie_colecao: v, ie_campo: v !== c.ie_colecao ? '' : c.ie_campo }))}
                            options={colecoesEl}
                            showPlaceholder
                            className={`${inputClass} ${textoValorHidden && campoSel.ie_tipo_elemento !== 'valor' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={textoValorHidden && campoSel.ie_tipo_elemento !== 'valor'}
                            visibleOptions={7}
                          />
                        </div>
                        <div className="group flex-1 min-w-[140px]">
                          {renderFieldLabel('ie_campo', 'Campo', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                          <Select
                            value={campoSel.statusSistema ? campoSel.ie_campo + '__sistema' : campoSel.ie_campo}
                            onChange={(v) => {
                              const isSistema = v.endsWith('__sistema');
                              const chave = isSistema ? v.replace('__sistema', '') : v;
                              updateCampoSelecionado((c) => ({ ...c, ie_campo: chave, statusSistema: isSistema }));
                            }}
                            options={camposDaColecao.flatMap((cd) => {
                              if (cd.key === 'ie_status' || cd.key === 'ie_status_manutencao') {
                                return [
                                  { value: cd.key, label: cd.key + ' (banco)' },
                                  { value: cd.key + '__sistema', label: cd.key + ' (sistema)' },
                                ];
                              }
                              return [{ value: cd.key, label: cd.key }];
                            })}
                            showPlaceholder
                            className={`${inputClass} ${textoValorHidden && campoSel.ie_tipo_elemento !== 'valor' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={textoValorHidden && campoSel.ie_tipo_elemento !== 'valor'}
                            visibleOptions={7}
                          />
                        </div>
                      </>
                    );
                  })()}
                  {!textoValorHidden && (
                  <div className="group flex-1 min-w-[140px]">
                    {renderFieldLabel('label', 'Label', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                    <input type="text" value={campoSel.label ?? ''}
                      onChange={(e) => updateCampoSelecionado((c) => ({ ...c, label: e.target.value }))}
                      className={inputClass} />
                  </div>
                  )}
                </div>

                {/* ── Aparência ── */}
                <div className="mb-2 mt-5 border-b border-slate-200 pb-1">
                  <h3 className="text-sm font-semibold text-slate-900">Aparência</h3>
                </div>
                <div>
                  {/* Linha 1: Fonte, Tamanho fonte, Estilo, Estilo label, Estilo registro, Estilo soma, Cor, Background */}
                  <div className="flex flex-wrap gap-[15px]">
                    <div className="group flex-1 min-w-[140px]">
                      {renderFieldLabel('ie_fonte', 'Fonte', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                      <Select value={campoSel.ie_fonte ?? 'Arial'} onChange={(v) => updateCampoSelecionado((c) => ({ ...c, ie_fonte: v }))} options={FONTES_OPTS} showPlaceholder={false} visibleOptions={7} />
                    </div>
                    <div className="group flex-1 min-w-[140px]">
                      {renderFieldLabel('qt_fonte', 'Tamanho fonte', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                      <input type="text" inputMode="numeric" value={campoSel.qt_fonte ?? ''}
                        onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); updateCampoSelecionado((c) => ({ ...c, qt_fonte: v ? Math.max(1, Number(v)) : 1 })); }}
                        className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`} />
                    </div>
                    <div className="group flex-1 min-w-[140px]">
                      {renderFieldLabel('ie_estilo', tipoBanda === 'lista' ? 'Estilo registro' : 'Estilo', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                      <Select value={campoSel.ie_estilo ?? ''} onChange={(v) => updateCampoSelecionado((c) => ({ ...c, ie_estilo: v }))} options={ESTILO_OPTS} showPlaceholder={false} visibleOptions={7} />
                    </div>
                    {!textoValorHidden && (
                    <div className="group flex-1 min-w-[140px]">
                      {renderFieldLabel('ie_estilo_label', 'Estilo label', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                      <Select value={campoSel.ie_estilo_label ?? ''} onChange={(v) => updateCampoSelecionado((c) => ({ ...c, ie_estilo_label: v }))} options={ESTILO_OPTS} showPlaceholder={false} visibleOptions={7} />
                    </div>
                    )}
                    {!textoValorHidden && (
                    <div className="group flex-1 min-w-[140px]">
                      {renderFieldLabel('ie_estilo_soma', 'Estilo soma', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                      <Select value={campoSel.ie_estilo_soma ?? ''} onChange={(v) => updateCampoSelecionado((c) => ({ ...c, ie_estilo_soma: v }))} options={ESTILO_OPTS} showPlaceholder={false} visibleOptions={7} />
                    </div>
                    )}
                    <div className="group flex-1 min-w-[140px]">
                      {renderFieldLabel('cd_cor', 'Cor', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                      <div className="relative" style={{ height: 34 }}>
                        <input type="color" id={`cor-campo-${campoSel.id}`} value={campoSel.cd_cor || '#000000'}
                          onChange={(e) => updateCampoSelecionado((c) => ({ ...c, cd_cor: e.target.value }))}
                          className="absolute opacity-0 w-0 h-0 pointer-events-none" />
                        <div className="w-full h-full cursor-pointer border border-slate-300"
                          style={{ backgroundColor: campoSel.cd_cor || '#000000' }}
                          onClick={() => document.getElementById(`cor-campo-${campoSel.id}`)?.click()} />
                      </div>
                    </div>
                    <div className="group flex-1 min-w-[140px]">
                      {renderFieldLabel('cd_background', 'Background', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                      <div className="flex items-center gap-1">
                        <div className="relative flex-1" style={{ height: 34 }}>
                          <input type="color" id={`bg-campo-${campoSel.id}`} value={campoSel.cd_background || '#ffffff'}
                            onChange={(e) => updateCampoSelecionado((c) => ({ ...c, cd_background: e.target.value }))}
                            className="absolute opacity-0 w-0 h-0 pointer-events-none" />
                          <div className="w-full h-full cursor-pointer border border-slate-300"
                            style={{ backgroundColor: campoSel.transparentCampo ? 'transparent' : (campoSel.cd_background || '#ffffff'), backgroundImage: campoSel.transparentCampo ? 'repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 50% / 8px 8px' : 'none' }}
                            onClick={() => document.getElementById(`bg-campo-${campoSel.id}`)?.click()} />
                        </div>
                        <label className="flex items-center cursor-pointer" title="Fundo transparente">
                          <input type="checkbox" checked={campoSel.transparentCampo ?? false}
                            onChange={(e) => updateCampoSelecionado((c) => ({ ...c, transparentCampo: e.target.checked }))}
                            className="cg-checkbox" />
                        </label>
                      </div>
                    </div>
                  </div>
                  {/* Linha 2: Paddings e Bordas */}
                  <div className="flex flex-wrap gap-[15px] mt-2">
                    <div className="group flex-1 min-w-[140px]">
                      {renderFieldLabel('qt_padding_superior', 'Padding superior', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                      <input type="text" inputMode="numeric"
                        value={campoSel.qt_padding_superior === 0 ? '' : (campoSel.qt_padding_superior ?? '')}
                        onChange={(e) => updateCampoSelecionado((c) => ({ ...c, qt_padding_superior: e.target.value === '' ? 0 : Number(e.target.value) || 0 }))}
                        className={inputClass} />
                    </div>
                    <div className="group flex-1 min-w-[140px]">
                      {renderFieldLabel('qt_padding_direita', 'Padding direita', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                      <input type="text" inputMode="numeric"
                        value={campoSel.qt_padding_direita === 0 ? '' : (campoSel.qt_padding_direita ?? '')}
                        onChange={(e) => updateCampoSelecionado((c) => ({ ...c, qt_padding_direita: e.target.value === '' ? 0 : Number(e.target.value) || 0 }))}
                        className={inputClass} />
                    </div>
                    <div className="group flex-1 min-w-[140px]">
                      {renderFieldLabel('qt_padding_inferior', 'Padding inferior', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                      <input type="text" inputMode="numeric"
                        value={campoSel.qt_padding_inferior === 0 ? '' : (campoSel.qt_padding_inferior ?? '')}
                        onChange={(e) => updateCampoSelecionado((c) => ({ ...c, qt_padding_inferior: e.target.value === '' ? 0 : Number(e.target.value) || 0 }))}
                        className={inputClass} />
                    </div>
                    <div className="group flex-1 min-w-[140px]">
                      {renderFieldLabel('qt_padding_esquerda', 'Padding esquerda', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                      <input type="text" inputMode="numeric"
                        value={campoSel.qt_padding_esquerda === 0 ? '' : (campoSel.qt_padding_esquerda ?? '')}
                        onChange={(e) => updateCampoSelecionado((c) => ({ ...c, qt_padding_esquerda: e.target.value === '' ? 0 : Number(e.target.value) || 0 }))}
                        className={inputClass} />
                    </div>
                    <div className="group flex-none w-auto min-w-[110px]">
                      <div className="flex items-center h-[34px] gap-2">
                        <input type="checkbox" checked={campoSel.ie_borda_superior === 'S'}
                          onChange={(e) => updateCampoSelecionado((c) => ({ ...c, ie_borda_superior: e.target.checked ? 'S' : 'N' }))}
                          className="cg-checkbox" />
                        {renderFieldLabel('ie_borda_superior', 'Borda superior', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                      </div>
                    </div>
                    <div className="group flex-none w-auto min-w-[110px]">
                      <div className="flex items-center h-[34px] gap-2">
                        <input type="checkbox" checked={campoSel.ie_borda_direita === 'S'}
                          onChange={(e) => updateCampoSelecionado((c) => ({ ...c, ie_borda_direita: e.target.checked ? 'S' : 'N' }))}
                          className="cg-checkbox" />
                        {renderFieldLabel('ie_borda_direita', 'Borda direita', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                      </div>
                    </div>
                    <div className="group flex-none w-auto min-w-[110px]">
                      <div className="flex items-center h-[34px] gap-2">
                        <input type="checkbox" checked={campoSel.ie_borda_inferior === 'S'}
                          onChange={(e) => updateCampoSelecionado((c) => ({ ...c, ie_borda_inferior: e.target.checked ? 'S' : 'N' }))}
                          className="cg-checkbox" />
                        {renderFieldLabel('ie_borda_inferior', 'Borda inferior', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                      </div>
                    </div>
                    <div className="group flex-none w-auto min-w-[110px]">
                      <div className="flex items-center h-[34px] gap-2">
                        <input type="checkbox" checked={campoSel.ie_borda_esquerda === 'S'}
                          onChange={(e) => updateCampoSelecionado((c) => ({ ...c, ie_borda_esquerda: e.target.checked ? 'S' : 'N' }))}
                          className="cg-checkbox" />
                        {renderFieldLabel('ie_borda_esquerda', 'Borda esquerda', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                      </div>
                    </div>
                  </div>
                  {/* Linha 3: Imagem, Tamanho imagem */}
                  <div className="flex flex-wrap gap-[15px] mt-2">
                    <div className="group flex-1 min-w-[140px]">
                      {renderFieldLabel('nr_seq_imagem', 'Imagem', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                      <Select
                        value={campoSel.nr_seq_imagem ?? ''}
                        onChange={(v) => updateCampoSelecionado((c) => ({ ...c, nr_seq_imagem: v || undefined }))}
                        options={[{ value: '', label: '---' }, ...(imagens ?? []).map((img: any) => ({ value: img.id || img.nr_sequencia, label: img.ds_imagem || img.ie_arquivo?.split('/').pop() || 'Imagem' }))!]}
                        showPlaceholder={false} visibleOptions={7}
                        disabled={campoSel.ie_tipo_elemento !== 'imagem'}
                        className={`${inputClass} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                      />
                    </div>
                    <div className="group flex-1 min-w-[140px]">
                      {renderFieldLabel('qt_tamanho_imagem', 'Tamanho imagem', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                      <input type="text" inputMode="numeric"
                        value={campoSel.qt_tamanho_imagem === 0 ? '' : (campoSel.qt_tamanho_imagem ?? '')}
                        onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); updateCampoSelecionado((c) => ({ ...c, qt_tamanho_imagem: v ? Math.max(1, Number(v)) : 0 })); }}
                        disabled={campoSel.ie_tipo_elemento !== 'imagem'}
                        className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${campoSel.ie_tipo_elemento !== 'imagem' ? 'disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500' : ''}`} />
                    </div>
                  </div>
                  {/* Linha 4: Conteúdo */}
                  <div className="flex flex-wrap gap-[15px] mt-2">
                    <div className="group flex-1 min-w-full">
                      {renderFieldLabel('conteudo', 'Conteúdo', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                      <textarea
                        value={campoSel.conteudo ?? ''}
                        onChange={(e) => updateCampoSelecionado((c) => ({ ...c, conteudo: e.target.value }))}
                        disabled={campoSel.ie_tipo_elemento !== 'conteudo'}
                        className={`${inputClass} min-h-[80px] resize-none disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Posicionamento ── */}
                <div className="mb-2 mt-5 border-b border-slate-200 pb-1">
                  <h3 className="text-sm font-semibold text-slate-900">Posicionamento</h3>
                </div>
                <div className="flex flex-wrap gap-[15px]">
                  <div className="group flex-1 min-w-[140px]">
                    {renderFieldLabel('qt_esquerda', 'Esquerda', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                    <input type="text" inputMode="numeric"
                      value={campoSel.qt_esquerda === 0 ? '' : (campoSel.qt_esquerda ?? '')}
                      onChange={(e) => updateCampoSelecionado((c) => ({ ...c, qt_esquerda: e.target.value === '' ? 0 : Number(e.target.value) || 0 }))}
                      className={inputClass} />
                  </div>
                  <div className="group flex-1 min-w-[140px]">
                    {renderFieldLabel('qt_topo', 'Topo', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                    <input type="text" inputMode="numeric"
                      value={campoSel.qt_topo === 0 ? '' : (campoSel.qt_topo ?? '')}
                      onChange={(e) => updateCampoSelecionado((c) => ({ ...c, qt_topo: e.target.value === '' ? 0 : Number(e.target.value) || 0 }))}
                      className={inputClass} />
                  </div>
                  <div className="group flex-1 min-w-[140px]">
                    {renderFieldLabel('qt_largura', 'Largura', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                    <input type="text" inputMode="numeric"
                      value={campoSel.qt_largura === 0 ? '' : (campoSel.qt_largura ?? '')}
                      onChange={(e) => updateCampoSelecionado((c) => ({ ...c, qt_largura: e.target.value === '' ? 0 : Number(e.target.value) || 0 }))}
                      className={inputClass} />
                  </div>
                  <div className="group flex-1 min-w-[140px]">
                    {renderFieldLabel('ie_alinhamento', 'Alinhamento', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                    <Select
                      value={campoSel.ie_alinhamento ?? 'esquerda'}
                      onChange={(v) => updateCampoSelecionado((c) => ({ ...c, ie_alinhamento: v }))}
                      options={[{ value: 'esquerda', label: 'Esquerda' }, { value: 'centro', label: 'Centro' }, { value: 'direita', label: 'Direita' }]}
                      showPlaceholder={false} visibleOptions={7}
                    />
                  </div>
                  {!textoValorHidden && (
                  <div className="group flex-1 min-w-[140px]">
                    {renderFieldLabel('soma', 'Soma', bandaFieldInfos, 'relatorio_banda_elemento', elementoCampoRegras)}
                    <div className="flex items-center h-[34px]">
                      <input type="checkbox" checked={campoSel.soma ?? false}
                        onChange={(e) => updateCampoSelecionado((c) => ({ ...c, soma: e.target.checked }))}
                        className="cg-checkbox" />
                    </div>
                  </div>
                  )}
                </div>
              </section>
            );
          })()}

          {bandaViewMode === 'content' && !campoDetailId && bandaContentSubView === 'dados' && (bandas.find((b) => b.id === bandaDetailId)?.ie_tipo_banda === 'lista' || bandas.find((b) => b.id === bandaDetailId)?.ie_tipo_banda === 'texto_valor' || bandas.find((b) => b.id === bandaDetailId)?.ie_tipo_banda === 'cabecalho' || bandas.find((b) => b.id === bandaDetailId)?.ie_tipo_banda === 'rodape') && (
          <>

          {/* ═══════════════════════════════════════════════ */}
          {/* ── Seção: Lista/Dados ── */}
          {/* ═══════════════════════════════════════════════ */}
          <section>
              <CamposRelatorioTable
                campos={campos}
                onChange={syncCampos}
                camposDisponiveis={camposDisponiveis}
                colecaoPrincipal={bandas.find((b) => b.id === bandaDetailId)?.ie_colecao_principal || ''}
                onEditingChange={setEditingCampo}
                userId={userId}
                initialColumns={bandaTipo === 'lista' ? initialListaColumns : (initialDadosColumns ?? initialListaColumns)}
                onColumnsChange={bandaTipo === 'lista' ? onListaColumnsChange : (onDadosColumnsChange ?? onListaColumnsChange)}
                variant={bandaTipo === 'lista' ? 'lista' : 'texto_valor'}
                ocultarColecaoCampo={bandaTipo === 'cabecalho' || bandaTipo === 'rodape'}
                getNextSeq={getNextCampoSeq}
                imagens={imagens}
                bandaTipo={bandaTipo}
                onViewCampo={(campo) => {
                  // Ver elemento: abre o formulário do campo em modo leitura
                  setPendingCampo(null);
                  setCampoDetailId(campo.id);
                }}
                onDeleteCampo={onDeleteCampo}
                onDuplicateCampo={async (original) => {
                  setBandaSaving(true);
                  try {
                    const nrSeqBanda = bandas.find((b) => b.id === bandaDetailId)?.nr_sequencia;
                    const { criarElemento } = await import('@/services/relatorioServiceBandas');
                    const auditAutor = { usuarioId: null, usuarioNome: userId ?? '' };
                    const { id: _oldId, _firestoreId: _oldFs, ...rest } = original;
                    const campoData = { ...rest, nr_seq_banda: nrSeqBanda ?? 0, nr_seq_relatorio: relatorio?.nr_sequencia ?? 0 };
                    const { id: firestoreId, nr_sequencia: savedSeq } = await criarElemento(campoData, auditAutor);
                    return { ...campoData, id: firestoreId, _firestoreId: firestoreId, nr_sequencia: savedSeq } as CamposRelatorioRow;
                  } finally {
                    setBandaSaving(false);
                  }
                }}
              />

          </section>
          </>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/* ── Seção: Ordenação (apenas banda tipo Lista) ── */}
          {/* ═══════════════════════════════════════════════ */}
          {bandaViewMode === 'content' && !campoDetailId && bandaContentSubView === 'ordenacao' && bandaTipo === 'lista' && (
          <>
          <section>
            <OrdenacaoRelatorioTable
              ordenacao={ordenacao}
              onChange={setOrdenacao}
              camposDisponiveis={camposDisponiveisBanda}
              onEditingChange={setEditingOrdenacao}
              userId={userId}
              initialColumns={initialOrdenacaoColumns}
              onColumnsChange={onOrdenacaoColumnsChange}
              getNextSeq={getNextOrdSeq}
            />
          </section>
          </>
          )}


          </>
          ) : null}
        </div>

        {/* ── Auditoria + Botões de ação ── */}
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-3">            {/* Audit info - relatório ou banda (não exibe no modo bandas) */}
            {relatorio && !isBandasMode && (
              <div className="flex flex-col text-[12px] text-slate-500 min-w-0">
                <div className="relative group flex items-center gap-2">
                  <span>Criado por {bandaDetailId ? (bandaCreatedBy || '-') : (createdBy || '-')} em {(bandaDetailId ? bandaCreatedAt : createdAt) ? new Date(bandaDetailId ? (bandaCreatedAt || '') : (createdAt || '')).toLocaleString('pt-BR').replace(',', '') : '-'}</span>
                  <button
                    type="button"
                    onClick={() => bandaDetailId ? onOpenBandaAudit?.(relatorio.id ?? null, bandaDetailId) : onOpenAudit?.(relatorio.id ?? null)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none"
                    aria-label="Abrir histórico de auditoria"
                  >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4" />
                          <path d="M12 16h.01" />
                        </svg>
                  </button>
                </div>
                <div className="relative group flex items-center gap-2 mt-1">
                  <span>Alterado por {bandaDetailId ? (bandaUpdatedBy || '-') : (updatedBy || '-')} em {(bandaDetailId ? bandaUpdatedAt : updatedAt) ? new Date(bandaDetailId ? (bandaUpdatedAt || '') : (updatedAt || '')).toLocaleString('pt-BR').replace(',', '') : '-'}</span>
                  <button
                    type="button"
                    onClick={() => bandaDetailId ? onOpenBandaAudit?.(relatorio.id ?? null, bandaDetailId) : onOpenAudit?.(relatorio.id ?? null)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none"
                    aria-label="Abrir histórico de auditoria"
                  >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4" />
                          <path d="M12 16h.01" />
                        </svg>
                  </button>
                </div>
              </div>
            )}
            {(!isBandasMode || (bandaDetailId && bandaViewMode === 'ver') || campoDetailId || filtroDetailId) && (
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={campoDetailId ? () => {
                  // Cancelar elemento: restaurar dados originais
                  const originalBanda = bandas.find((b) => b.id === bandaDetailId);
                  if (originalBanda?.campos) {
                    syncCampos(originalBanda.campos);
                  }
                  setPendingCampo(null);
                  setCampoDetailId(null);
                } : filtroDetailId ? () => {
                  // Cancelar filtro: restaurar dados originais se existente
                  const originalFiltro = filtros.find((f) => f.id === filtroDetailId);
                  if (pendingFiltro && pendingFiltro.id === filtroDetailId && originalFiltro) {
                    // Filtro novo cancelado: remover do array
                    setFiltros((prev) => prev.filter((f) => f.id !== filtroDetailId));
                  }
                  setPendingFiltro(null);
                  setFiltroDetailId(null);
                } : bandaDetailId ? () => { setPendingBanda(null); closeBandaDetail(); } : onCancel}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                {(bandaDetailId && !campoDetailId && !filtroDetailId) ? 'Voltar' : 'Cancelar'}
              </button>
              <button
                type={(bandaDetailId && !campoDetailId) || isBandasMode ? 'button' : 'submit'}
                disabled={saving}
                onClick={campoDetailId ? () => {
                  // Salvar campo: pendente (novo) → salva direto no Firestore
                  if (pendingCampo && pendingCampo.id === campoDetailId) {
                    (async () => {
                      setBandaSaving(true);
                      try {
                        const seq = getNextCampoSeq();
                        const nrSeqBanda = bandas.find((b) => b.id === bandaDetailId)?.nr_sequencia;
                        const { criarElemento } = await import('@/services/relatorioServiceBandas');
                        const auditAutor = { usuarioId: null, usuarioNome: userId ?? '' };
                        const campoData = { ...pendingCampo, nr_sequencia: seq, nr_seq_banda: nrSeqBanda ?? 0, nr_seq_relatorio: relatorio?.nr_sequencia ?? 0 };
                        const { id: firestoreId, nr_sequencia: savedSeq } = await criarElemento(campoData, auditAutor);
                        const novoCampo = { ...campoData, id: firestoreId, _firestoreId: firestoreId, nr_sequencia: savedSeq };
                        syncCampos((prev) => [...prev, novoCampo]);
                        setPendingCampo(null);
                      } finally {
                        setBandaSaving(false);
                      }
                    })();
                  } else {
                    // Campo existente: salvar explicitamente no Firestore
                    (async () => {
                      setBandaSaving(true);
                      try {
                        const campoAtual = campos.find((c) => c.id === campoDetailId);
                        if (campoAtual?._firestoreId) {
                          const { atualizarElemento } = await import('@/services/relatorioServiceBandas');
                          const auditAutor = { usuarioId: null, usuarioNome: userId ?? '' };
                          await atualizarElemento(campoAtual._firestoreId, { ...campoAtual, nr_seq_banda: bandas.find((b) => b.id === bandaDetailId)?.nr_sequencia ?? 0 }, auditAutor);
                        }
                      } finally {
                        setBandaSaving(false);
                      }
                    })();
                  }
                  setCampoDetailId(null);
                } : filtroDetailId ? () => {
                  // Salvar filtro no Firestore
                  (async () => {
                    setBandaSaving(true);
                    try {
                      const { criarParametro, atualizarParametro } = await import('@/services/relatorioServiceParametros');
                      const auditAutor = { usuarioId: null, usuarioNome: userId ?? '' };
                      if (pendingFiltro && pendingFiltro.id === filtroDetailId) {
                        const { id: _oldId, ...filtroData } = pendingFiltro;
                        const { id: newId, nr_sequencia: savedSeq } = await criarParametro({ ...filtroData, nr_seq_relatorio: relatorio?.nr_sequencia ?? 0 }, auditAutor);
                        setFiltros((prev) => [...prev, { ...filtroData, id: newId, _firestoreId: newId, nr_sequencia: savedSeq } as any]);
                      } else {
                        const filtroAtual = filtros.find((f) => f.id === filtroDetailId);
                        if ((filtroAtual as any)?._firestoreId) {
                          await atualizarParametro((filtroAtual as any)._firestoreId, { ...filtroAtual, nr_seq_relatorio: relatorio?.nr_sequencia ?? 0 }, auditAutor);
                        }
                      }
                    } finally {
                      setBandaSaving(false);
                    }
                  })();
                  setPendingFiltro(null);
                  setFiltroDetailId(null);
                } : bandaDetailId ? async () => {
                  let finalBandas: any[] = bandas;
                  if (pendingBanda && pendingBanda.id === bandaDetailId) {
                    const seq = getNextBandaSeq();
                    const newBanda = { ...pendingBanda, nr_sequencia: seq };
                    finalBandas = [...bandas, newBanda];
                    setBandas(finalBandas);
                    setPendingBanda(null);
                  }
                  const currentBandaId = bandaDetailIdRef.current;
                  if (currentBandaId) {
                    const c = camposRef.current;
                    finalBandas = finalBandas.map((b) => b.id === currentBandaId ? { ...b, campos: [...c] } : b);
                    setBandas(finalBandas);
                  }
                  setBandaSaving(true);
                  try {
                    await onBandaSaveRef.current?.(finalBandas, currentBandaId);
                  } catch { /* handled inside handleBandaSave */ }
                  setBandaDetailId(null);
                  setBandaViewMode('content');
                  setCampos([]);
                  setBandaSaving(false);
                  refreshSnapshot();
                  setIsDirty(false);
                } : undefined}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-40"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
            )}
          </div>
        </div>
      </form>

      {/* ── Modal: Alterações não salvas ── */}
      {showUnsavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="absolute inset-0" onClick={() => { setShowUnsavedModal(false); pendingNavRef.current = null; setPendingNav(null); }} />
          <div className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20">
            <div className="flex-shrink-0 flex items-center justify-between bg-[#ccc] px-[15px]">
              <h3 className="text-base font-semibold" style={{ color: '#000' }}>Alterações não salvas</h3>
              <button
                type="button"
                onClick={() => { setShowUnsavedModal(false); pendingNavRef.current = null; setPendingNav(null); }}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-[15px]">
              <p className="text-sm text-slate-700">As alterações não foram salvas. Deseja salvar?</p>
            </div>
            <div className="flex-shrink-0 flex items-center justify-end gap-3 px-[15px] py-3">
              <button
                type="button"
                onClick={() => { setShowUnsavedModal(false); pendingNavRef.current = null; setPendingNav(null); }}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveAndNavigate}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      <LoadingModal open={saving} message="Carregando..." />
      <LoadingModal open={bandaSaving} message="Carregando..." />
    </div>
  );
}
