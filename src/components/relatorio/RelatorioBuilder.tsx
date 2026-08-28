"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Select from "@/components/ui/Select";
import LoadingModal from "@/components/ui/LoadingModal";
import { DATA_SOURCES, getDataSource } from "@/lib/relatorioDataSources";
import {
  defaultConfigExcel,
  defaultConfigPdf,
  gerarId,
  OPERADORES_FILTRO,
  TAMANHOS_PAGINA,
  ESTILO_CABECALHO_EXCEL,
} from "@/lib/relatorioUtils";
import type {
  Relatorio,
  RelatorioCampo,
  RelatorioFiltro,
  RelatorioOrdenacao,
} from "@/types/relatorio";
import CamposRelatorioTable, { type CamposRelatorioRow } from "@/components/relatorio/CamposRelatorioTable";
import FiltrosRelatorioTable from "@/components/relatorio/FiltrosRelatorioTable";
import OrdenacaoRelatorioTable from "@/components/relatorio/OrdenacaoRelatorioTable";
import BandasRelatorioTable from "@/components/relatorio/BandasRelatorioTable";

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
}

function mapRelatorioCampoToRow(c: any, idx: number, colecaoPrincipal: string): CamposRelatorioRow {
  return {
    id: c.id || gerarId(),
    colecao: c.colecao || colecaoPrincipal,
    chave: c.chave || '',
    label: c.rotulo || c.label || '',
    backgroundLabel: c.backgroundLabel || '#e2e8f0',
    corLabel: c.corLabel || '#1a1a1a',
    corCampo: c.corCampo || '#1a1a1a',
    backgroundCampo: c.backgroundCampo || '',
    posicao: c.posicao ?? idx + 1,
    alinhamentoHorizontal: c.alinhamentoHorizontal ?? 0,
    topoLabel: c.topoLabel ?? 0,
    topoRegistro: c.topoRegistro ?? 0,
    alinhamento: c.alinhamento ?? 'esquerda',
    estiloLabel: c.estiloLabel ?? '',
    estiloCampo: c.estiloCampo ?? '',
    estiloSoma: c.estiloSoma ?? '',
    largura: c.largura ?? 30,
    formatacao: c.formatacao || 'texto',
    statusSistema: c.statusSistema ?? false,
    soma: c.soma ?? false,
  };
}

const EMPTY_FILTRO: () => RelatorioFiltro = () => ({
  id: gerarId(),
  campo: "",
  operador: "igual",
  valor: "",
  valorFinal: "",
  mascara: "texto",
  parametro: false,
});

const RELATORIO_SELECT_OPTIONS = [
  { value: 'relatorios', label: 'Relatórios' },
];

export default function RelatorioBuilder({
  relatorio,
  onSave,
  onCancel,
  saving = false,
  manageSelection = 'relatorios',
  onManageSelectionChange,
  allowedSubmodulos = ['relatorios'],
  contextMenuItems = [],
  onChange,
  userId,
  initialListaColumns,
  onListaColumnsChange,
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
}: RelatorioBuilderProps) {
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

  const [dsRelatorio, setDsRelatorio] = useState(relatorio?.ds_relatorio ?? "");
  const [colecao, setColecao] = useState(relatorio?.colecao ?? "");
  const [campos, setCampos] = useState<CamposRelatorioRow[]>(
    relatorio?.campos?.length
      ? relatorio.campos.map((c, i) => mapRelatorioCampoToRow(c, i, relatorio.colecao))
      : []
  );
  const [filtros, setFiltros] = useState<RelatorioFiltro[]>(relatorio?.filtros?.length ? relatorio.filtros : []);
  const [ordenacao, setOrdenacao] = useState<RelatorioOrdenacao[]>(relatorio?.ordenacao?.length ? relatorio.ordenacao.map((o) => ({ ...o, id: o.id || gerarId() })) : []);
  type BandaState = { id: string; nome: string; colecao?: string; posicao: number; tipo?: 'lista' | 'texto_valor' | 'cabecalho' | 'rodape'; altura?: number; nr_sequencia?: number; nr_seq_relatorio?: number; campos?: any[]; filtros?: any[]; ordenacao?: any[] };
  const [bandas, setBandas] = useState<BandaState[]>(
    relatorio?.bandas?.length ? relatorio.bandas.map((b: any) => ({ ...b, id: b.id || gerarId() })) : []
  );
  const [bandaDetailId, setBandaDetailId] = useState<string | null>(null);
  const bandaTipo = useMemo(() => bandas.find((b) => b.id === bandaDetailId)?.tipo, [bandas, bandaDetailId]);

  // Refs para evitar stale closures no Ctrl+S do modal banda
  const camposRef = useRef(campos);
  const filtrosRef = useRef(filtros);
  const ordenacaoRef = useRef(ordenacao);
  const bandaDetailIdRef = useRef(bandaDetailId);
  useEffect(() => { camposRef.current = campos; }, [campos]);
  useEffect(() => { filtrosRef.current = filtros; }, [filtros]);
  useEffect(() => { ordenacaoRef.current = ordenacao; }, [ordenacao]);
  useEffect(() => { bandaDetailIdRef.current = bandaDetailId; }, [bandaDetailId]);

  /** Abre o modal da banda: salva dados globais na banda anterior e carrega dados da banda alvo */
  function openBandaDetail(bandaId: string) {
    const currentBandaId = bandaDetailIdRef.current;
    if (currentBandaId) {
      const c = camposRef.current;
      const f = filtrosRef.current;
      const o = ordenacaoRef.current;
      setBandas((prev) => prev.map((b) => b.id === currentBandaId ? { ...b, campos: [...c], filtros: [...f], ordenacao: [...o] } : b));
    }
    const target = bandas.find((b) => b.id === bandaId);
    if (target) {
      setCampos(target.campos?.length ? [...target.campos] : []);
      setFiltros(target.filtros?.length ? [...target.filtros] : []);
      setOrdenacao(target.ordenacao?.length ? [...target.ordenacao] : []);
    }
    setBandaDetailId(bandaId);
  }

  /** Fecha o modal da banda: salva dados na banda e limpa. Usa refs para evitar stale closures. */
  function closeBandaDetail() {
    const currentBandaId = bandaDetailIdRef.current;
    if (currentBandaId) {
      const c = camposRef.current;
      const f = filtrosRef.current;
      const o = ordenacaoRef.current;
      setBandas((prev) => prev.map((b) => b.id === currentBandaId ? { ...b, campos: [...c], filtros: [...f], ordenacao: [...o] } : b));
    }
    setBandaDetailId(null);
    setCampos([]);
    setFiltros([]);
    setOrdenacao([]);
  }
  const [formato, setFormato] = useState<'excel' | 'pdf'>(relatorio?.formato ?? 'excel');
  const [configExcel, setConfigExcel] = useState(relatorio?.configExcel ?? defaultConfigExcel());
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

  // Reset estado quando relatório muda (navegação por setas)
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
      setFormato(relatorio?.formato ?? 'excel');
      setConfigExcel(relatorio?.configExcel ?? defaultConfigExcel());
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
    }
  }, [relatorio]);

  const dataSource = useMemo(() => (colecao ? getDataSource(colecao) : undefined), [colecao]);
  const camposDisponiveis = dataSource?.campos ?? [];
  const opcoesColecao = DATA_SOURCES.map((ds) => ({ value: ds.value, label: ds.value })).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        // Se o modal da banda está aberto, salva o modal
        if (bandaDetailId) {
          closeBandaDetail();
          return;
        }
        if (saving || isEditingAnyTable) return;
        const f = formRef.current;
        if (f && typeof (f as any).requestSubmit === 'function') {
          (f as any).requestSubmit();
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [saving, isEditingAnyTable, bandaDetailId]);

  // Sync form state back to parent so that "Gerar relatório" uses current data.
  useEffect(() => {
    if (!onChange || !relatorio) return;
    const synced: Relatorio = {
      ...relatorio,
      ds_relatorio: dsRelatorio.trim(),
      colecao,
      campos: campos.map((c) => ({
        id: c.id, colecao: c.colecao, chave: c.chave, rotulo: c.label, label: c.label,
        backgroundLabel: c.backgroundLabel, corLabel: c.corLabel, corCampo: c.corCampo, backgroundCampo: c.backgroundCampo,
        posicao: c.posicao, largura: c.largura, alinhamentoHorizontal: c.alinhamentoHorizontal, topoLabel: c.topoLabel, topoRegistro: c.topoRegistro, alinhamento: c.alinhamento as RelatorioCampo['alinhamento'], estiloLabel: c.estiloLabel as RelatorioCampo['estiloLabel'], estiloCampo: c.estiloCampo as RelatorioCampo['estiloCampo'], estiloSoma: c.estiloSoma as RelatorioCampo['estiloSoma'], formatacao: c.formatacao, statusSistema: c.statusSistema, soma: c.soma, tipoCampo: c.tipoCampo, conteudo: c.conteudo, fonteCampo: c.fonteCampo, tamanhoFonteCampo: c.tamanhoFonteCampo,
      })),
      filtros: [],
      ordenacao: [],
      formato,
      configExcel: formato === 'excel' ? configExcel : undefined,
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
  }, [dsRelatorio, colecao, campos, filtros, ordenacao, bandas, formato, configExcel, configPdf, espessuraLabel, topoLabelVal, espessuraCampo, topoRegistroVal, bgLabel, bgCampo, corLabelGlobal, corCampoGlobal, fonteLabel, tamanhoFonteLabel, fonteCampo, tamanhoFonteCampo]);

  // ── Handlers ──


  function adicionarFiltro() { setFiltros((prev) => [...prev, EMPTY_FILTRO()]); }
  function removerFiltro(id: string) { setFiltros((prev) => prev.filter((f) => f.id !== id)); }
  function atualizarFiltro(id: string, updates: Partial<RelatorioFiltro>) {
    setFiltros((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }

  function adicionarOrdenacao() { setOrdenacao((prev) => [...prev, { id: gerarId(), campo: "", direcao: "asc" }]); }
  function removerOrdenacao(idx: number) { setOrdenacao((prev) => prev.filter((_, i) => i !== idx)); }
  function atualizarOrdenacao(idx: number, updates: Partial<RelatorioOrdenacao>) {
    setOrdenacao((prev) => prev.map((o, i) => (i === idx ? { ...o, ...updates } : o)));
  }

  function validar(): boolean {
    const errs: string[] = [];
    if (!dsRelatorio.trim()) errs.push("Descrição é obrigatória.");
    const todosCampos = bandas.flatMap((b) => b.campos ?? []);
    if (todosCampos.length === 0) errs.push("Selecione pelo menos um campo.");
    if (todosCampos.some((c: any) => c.tipoCampo && c.tipoCampo !== 'conteudo' && c.tipoCampo !== 'data_geracao' && c.tipoCampo !== 'horario_geracao' && c.tipoCampo !== 'data_horario_geracao' && !c.chave)) errs.push("Todos os campos devem ter uma chave selecionada.");
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
    if (!validar()) return;
    const result: Omit<Relatorio, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao"> = {
      ds_relatorio: dsRelatorio.trim(),
      colecao: bandas[0]?.colecao || '',
      campos: bandas.flatMap((b) => (b.campos ?? []).map((c: any) => ({
        id: c.id, colecao: c.colecao, chave: c.chave, rotulo: c.label, label: c.label,
        backgroundLabel: c.backgroundLabel, corLabel: c.corLabel, corCampo: c.corCampo, backgroundCampo: c.backgroundCampo,
        posicao: c.posicao, largura: c.largura, alinhamentoHorizontal: c.alinhamentoHorizontal, topoLabel: c.topoLabel, topoRegistro: c.topoRegistro, alinhamento: c.alinhamento as RelatorioCampo['alinhamento'], estiloLabel: c.estiloLabel as RelatorioCampo['estiloLabel'], estiloCampo: c.estiloCampo as RelatorioCampo['estiloCampo'], estiloSoma: c.estiloSoma as RelatorioCampo['estiloSoma'], formatacao: c.formatacao, statusSistema: c.statusSistema, soma: c.soma, tipoCampo: c.tipoCampo, conteudo: c.conteudo, fonteCampo: c.fonteCampo, tamanhoFonteCampo: c.tamanhoFonteCampo,
      }))),
      filtros: bandas.flatMap((b) => (b.filtros ?? []).filter((f: any) => f.campo)),
      ordenacao: bandas.flatMap((b) => (b.ordenacao ?? []).filter((o: any) => o.campo)),
      bandas: bandas.map((b) => ({ ...b })),
      formato,
      configExcel: formato === "excel" ? configExcel : undefined,
      configPdf: formato === "pdf" ? configPdf : undefined,
      espessuraLabel,
      topoLabel: topoLabelVal,
      espessuraCampo,
      topoRegistro: topoRegistroVal,
      bgLabel,
      bgCampo,
      corLabelGlobal,
      corCampoGlobal,
      fonteLabel,
      tamanhoFonteLabel,
      fonteCampo,
      tamanhoFonteCampo,
    };
    onSave(deepClean(result));
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
              onClick={onPrevRecord}
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
              onClick={onNextRecord}
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
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center rounded-[3px] border border-transparent bg-transparent px-4 py-2.5 text-sm font-normal text-[#066fc5] transition cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2 active:outline active:outline-1 active:outline-[#066fc5] active:outline-offset-2"
        >
          Fechar
        </button>
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
      <form ref={formRef} onSubmit={handleSubmit} className="mt-4 flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-9">
          {/* ═══════════════════════════════════════════════ */}
          {/* ── Seção: Relatório ── */}
          {/* ═══════════════════════════════════════════════ */}
          <section>
            <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Relatório</h2>
          <div className="grid gap-[15px] sm:grid-cols-12">

            {/* ── Linha 1: Sequência + Descrição + Formato ── */}
            <div className="sm:col-span-2 group">
              <label className={labelClass} style={{ color: '#666' }}>Sequência</label>
              <input disabled value={String(relatorio?.nr_sequencia ?? '')} className={`${inputClass} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`} />
            </div>
            <div className="sm:col-span-7 group">
              <label className={labelClass} style={{ color: '#666' }}>Descrição *</label>
              <input value={dsRelatorio} onChange={(e) => setDsRelatorio(e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-3 group">
              <label className={labelClass} style={{ color: '#666' }}>Formato *</label>
              <Select
                value={formato}
                onChange={(v) => setFormato(v as 'excel' | 'pdf')}
                options={[{ value: "excel", label: "Excel (CSV)" }, { value: "pdf", label: "PDF" }]}
                showPlaceholder={false}
                                  visibleOptions={7}
                  />
            </div>

          </div>
          </section>

          {/* ═══════════════════════════════════════════════ */}
          {/* ── Seção: Saída ── */}
          {/* ═══════════════════════════════════════════════ */}
          <section>
            <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Saída</h2>

            {formato === "excel" ? (
              <div className="grid gap-[15px] sm:grid-cols-12">
                <div className="sm:col-span-4 group">
                  <label className={labelClass} style={{ color: '#666' }}>Nome do arquivo</label>
                  <input value={configExcel.titulo ?? ""} onChange={(e) => setConfigExcel({ ...configExcel, titulo: e.target.value })} className={inputClass} />
                </div>
                <div className="sm:col-span-3 group">
                  <label className={labelClass} style={{ color: '#666' }}>Estilo cabeçalho</label>
                  <Select value={configExcel.estiloCabecalho} onChange={(v) => setConfigExcel({ ...configExcel, estiloCabecalho: v as any })} options={[...ESTILO_CABECALHO_EXCEL]} showPlaceholder={false} visibleOptions={7} />
                </div>
                <div className="sm:col-span-5 group">
                  <label className={labelClass} style={{ color: '#666' }}>&nbsp;</label>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={configExcel.zebrado} onChange={() => setConfigExcel({ ...configExcel, zebrado: !configExcel.zebrado })} /><span>Zebrado</span></label>
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={configExcel.filtrosAutomaticos} onChange={() => setConfigExcel({ ...configExcel, filtrosAutomaticos: !configExcel.filtrosAutomaticos })} /><span>Filtros auto</span></label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-[15px]">
                <div className="grid gap-[15px] sm:grid-cols-4">
                  <div className="group">
                    <label className={labelClass} style={{ color: '#666' }}>Nome do arquivo</label>
                    <input value={configPdf.titulo ?? ""} onChange={(e) => setConfigPdf({ ...configPdf, titulo: e.target.value })} className={inputClass} />
                  </div>
                  <div className="group">
                    <label className={labelClass} style={{ color: '#666' }}>Página</label>
                    <Select value={configPdf.tamanhoPagina} onChange={(v) => setConfigPdf({ ...configPdf, tamanhoPagina: v as any })} options={[...TAMANHOS_PAGINA]} showPlaceholder={false} visibleOptions={7} />
                  </div>
                  <div className="group">
                    <label className={labelClass} style={{ color: '#666' }}>Orientação</label>
                    <Select value={configPdf.orientacao} onChange={(v) => setConfigPdf({ ...configPdf, orientacao: v as any })} options={[{ value: "retrato", label: "Retrato" }, { value: "paisagem", label: "Paisagem" }]} showPlaceholder={false} visibleOptions={7} />
                  </div>
                  <div className="group">
                    <label className={labelClass} style={{ color: '#666' }}>Tamanho fonte</label>
                    <input type="text" inputMode="numeric" value={configPdf.tamanhoFonte} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setConfigPdf({ ...configPdf, tamanhoFonte: v ? Number(v) : 6 }); }} className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`} />
                  </div>
                </div>
                {/* Margens */}
                <div className="grid gap-[15px] sm:grid-cols-4">
                  <div className="group">
                    <label className={labelClass} style={{ color: '#666' }}>Margem superior</label>
                    <input type="text" inputMode="numeric" value={configPdf.margens.superior} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setConfigPdf({ ...configPdf, margens: { ...configPdf.margens, superior: v ? Number(v) : 5 } }); }} className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`} />
                  </div>
                  <div className="group">
                    <label className={labelClass} style={{ color: '#666' }}>Margem inferior</label>
                    <input type="text" inputMode="numeric" value={configPdf.margens.inferior} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setConfigPdf({ ...configPdf, margens: { ...configPdf.margens, inferior: v ? Number(v) : 5 } }); }} className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`} />
                  </div>
                  <div className="group">
                    <label className={labelClass} style={{ color: '#666' }}>Margem esquerda</label>
                    <input type="text" inputMode="numeric" value={configPdf.margens.esquerda} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setConfigPdf({ ...configPdf, margens: { ...configPdf.margens, esquerda: v ? Number(v) : 5 } }); }} className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`} />
                  </div>
                  <div className="group">
                    <label className={labelClass} style={{ color: '#666' }}>Margem direita</label>
                    <input type="text" inputMode="numeric" value={configPdf.margens.direita} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setConfigPdf({ ...configPdf, margens: { ...configPdf.margens, direita: v ? Number(v) : 5 } }); }} className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`} />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ═══════════════════════════════════════════════ */}
          {/* ── Seção: Bandas ── */}
          {/* ═══════════════════════════════════════════════ */}
          <section className="mb-4">
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-1">
              <h2 className="text-sm font-semibold text-slate-900">Bandas</h2>
              <button type="button" onClick={() => setBandas((prev) => [...prev, { id: gerarId(), nome: '', colecao: '', posicao: (Math.max(0, ...prev.map((b) => b.posicao ?? 0)) + 1), nr_sequencia: (Math.max(0, ...prev.map((b) => b.nr_sequencia ?? 0)) + 1), nr_seq_relatorio: relatorio?.nr_sequencia, campos: [], filtros: [], ordenacao: [] }])} className="text-sm text-[#066fc5] hover:underline cursor-pointer">Adicionar</button>
            </div>
            <BandasRelatorioTable
              bandas={bandas}
              onChange={setBandas}
              colecaoOptions={opcoesColecao}
              onEditingChange={setEditingBanda}
              userId={userId}
              initialColumns={initialBandasColumns}
              onColumnsChange={onBandasColumnsChange}
              onViewBanda={(b) => openBandaDetail(b.id)}
            />
          </section>

          {bandaDetailId ? (
          /* ── Banda Detail Modal ── */
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">              <div className="absolute inset-0" onClick={() => closeBandaDetail()} />
            <div className="relative w-full max-w-[95vw] bg-white modal-dark p-0 shadow-xl shadow-black/20 max-h-[90vh] flex flex-col">
              <div className="flex-shrink-0 flex items-center justify-between bg-[#ccc] px-[15px]">
                <h3 className="text-base font-semibold" style={{ color: '#000' }}>Banda</h3>
                <button type="button" onClick={() => closeBandaDetail()} className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2" aria-label="Fechar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-[15px] overflow-auto flex-1 space-y-9 min-h-[70vh]">

          {(bandas.find((b) => b.id === bandaDetailId)?.tipo === 'lista' || bandas.find((b) => b.id === bandaDetailId)?.tipo === 'texto_valor' || bandas.find((b) => b.id === bandaDetailId)?.tipo === 'cabecalho' || bandas.find((b) => b.id === bandaDetailId)?.tipo === 'rodape') && (
          <>

          {/* ═══════════════════════════════════════════════ */}
          {/* ── Seção: Lista/Dados ── */}
          {/* ═══════════════════════════════════════════════ */}
          <section>
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-1">
              <h2 className="text-sm font-semibold text-slate-900">{bandaTipo === 'lista' ? 'Lista' : 'Dados'}</h2>
              <button type="button" disabled={bandaTipo === 'lista' && !bandas.find((b) => b.id === bandaDetailId)?.colecao} onClick={() => { const bColecao = bandas.find((b) => b.id === bandaDetailId)?.colecao || ''; setCampos((prev) => [...prev, { id: gerarId(), colecao: bColecao, chave: '', label: '', backgroundLabel: '#e2e8f0', corLabel: '#1a1a1a', corCampo: '#1a1a1a', backgroundCampo: '', posicao: prev.length + 1, alinhamentoHorizontal: 0, topoLabel: 0, topoRegistro: 0, alinhamento: 'esquerda', estiloLabel: '', estiloCampo: '', estiloSoma: '', largura: 30, formatacao: 'texto', statusSistema: false, soma: false, fonteCampo: 'Arial', tamanhoFonteCampo: 10 }]); }} className={`text-sm cursor-pointer ${bandaTipo === 'lista' && !bandas.find((b) => b.id === bandaDetailId)?.colecao ? 'text-slate-400 dark:text-[#3f3f46] cursor-not-allowed' : 'text-[#066fc5] hover:underline'}`}>Adicionar</button>
            </div>
            <div className="overflow-x-auto">
              <CamposRelatorioTable
                campos={campos}
                onChange={setCampos}
                camposDisponiveis={camposDisponiveis}
                colecaoPrincipal={bandas.find((b) => b.id === bandaDetailId)?.colecao || ''}
                onEditingChange={setEditingCampo}
                userId={userId}
                initialColumns={initialListaColumns}
                onColumnsChange={onListaColumnsChange}
                variant={bandaTipo === 'lista' ? 'lista' : 'texto_valor'}
                ocultarColecaoCampo={bandaTipo === 'cabecalho' || bandaTipo === 'rodape'}
              />
              </div>
              {bandaTipo === 'lista' && colecao && (
              <div className="grid grid-cols-6 gap-[15px] mt-3">
                {/* Linha 1: Espessura/Bg/Cor/Fonte/Tamanho label */}
                <div className="group">
                  <label className={labelClass} style={{ color: '#666' }}>Espessura label</label>
                  <input type="text" inputMode="numeric" disabled={formato === "excel"} value={espessuraLabel}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '');
                      setEspessuraLabel(v ? Math.max(1, Number(v)) : 1);
                    }}
                    className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`}
                  />
                </div>
                <div className="group">
                  <label className={labelClass} style={{ color: '#666' }}>Topo label</label>
                  <input type="text" inputMode="numeric" disabled={formato === "excel"} value={topoLabelVal}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '');
                      setTopoLabelVal(v ? Math.max(0, Number(v)) : 0);
                    }}
                    className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`}
                  />
                </div>
                <div className="group">
                  <label className={labelClass} style={{ color: '#666' }}>Background label</label>
                  <Select
                    value={bgLabel}
                    onChange={(v) => setBgLabel(v)}
                    options={[{ value: '', label: '---' }, { value: '#e2e8f0', label: '#e2e8f0' }, { value: '#003056', label: '#003056' }, { value: '#1a4567', label: '#1a4567' }, { value: '#334155', label: '#334155' }, { value: '#475569', label: '#475569' }, { value: '#64748b', label: '#64748b' }, { value: '#94a3b8', label: '#94a3b8' }, { value: '#cbd5e1', label: '#cbd5e1' }, { value: '#f1f5f9', label: '#f1f5f9' }, { value: '#fefce8', label: '#fefce8' }]}
                    showPlaceholder={false} disabled={formato === "excel"}
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
                  <label className={labelClass} style={{ color: '#666' }}>Cor label</label>
                  <Select
                    value={corLabelGlobal}
                    onChange={(v) => setCorLabelGlobal(v)}
                    options={[{ value: '#1a1a1a', label: '#1a1a1a' }, { value: '#000000', label: '#000000' }, { value: '#333333', label: '#333333' }, { value: '#555555', label: '#555555' }, { value: '#666666', label: '#666666' }, { value: '#999999', label: '#999999' }, { value: '#ffffff', label: '#ffffff' }, { value: '#003056', label: '#003056' }, { value: '#1a4567', label: '#1a4567' }, { value: '#c0392b', label: '#c0392b' }]}
                    showPlaceholder={false} disabled={formato === "excel"}
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
                  <label className={labelClass} style={{ color: '#666' }}>Fonte label</label>
                  <Select
                    value={fonteLabel}
                    onChange={(v) => setFonteLabel(v)}
                    options={[{ value: 'Arial', label: 'Arial' }, { value: 'Calibri', label: 'Calibri' }, { value: 'Times New Roman', label: 'Times New Roman' }, { value: 'Courier New', label: 'Courier New' }, { value: 'Tahoma', label: 'Tahoma' }, { value: 'Trebuchet MS', label: 'Trebuchet MS' }]}
                    showPlaceholder={false} disabled={formato === "excel"}
                                      visibleOptions={7}
                  />
                </div>
                <div className="group">
                  <label className={labelClass} style={{ color: '#666' }}>Tamanho fonte label</label>
                  <input type="text" inputMode="numeric" disabled={formato === "excel"} value={tamanhoFonteLabel}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '');
                      setTamanhoFonteLabel(v ? Math.max(1, Number(v)) : 1);
                    }}
                    className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`}
                  />
                </div>
                {/* Linha 2: Espessura/Bg/Cor/Fonte/Tamanho registro */}
                <div className="group">
                  <label className={labelClass} style={{ color: '#666' }}>Espessura registro</label>
                  <input type="text" inputMode="numeric" disabled={formato === "excel"} value={espessuraCampo}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '');
                      setEspessuraCampo(v ? Math.max(1, Number(v)) : 1);
                    }}
                    className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`}
                  />
                </div>
                <div className="group">
                  <label className={labelClass} style={{ color: '#666' }}>Topo registro</label>
                  <input type="text" inputMode="numeric" disabled={formato === "excel"} value={topoRegistroVal}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '');
                      setTopoRegistroVal(v ? Math.max(0, Number(v)) : 0);
                    }}
                    className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`}
                  />
                </div>
                <div className="group">
                  <label className={labelClass} style={{ color: '#666' }}>Background registro</label>
                  <Select
                    value={bgCampo}
                    onChange={(v) => setBgCampo(v)}
                    options={[{ value: '', label: '---' }, { value: 'zebrado', label: 'Linhas zebradas' }]}
                    showPlaceholder={false} disabled={formato === "excel"}
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
                  <label className={labelClass} style={{ color: '#666' }}>Cor registro</label>
                  <Select
                    value={corCampoGlobal}
                    onChange={(v) => setCorCampoGlobal(v)}
                    options={[{ value: '#1a1a1a', label: '#1a1a1a' }, { value: '#000000', label: '#000000' }, { value: '#333333', label: '#333333' }, { value: '#555555', label: '#555555' }, { value: '#666666', label: '#666666' }, { value: '#999999', label: '#999999' }, { value: '#ffffff', label: '#ffffff' }, { value: '#003056', label: '#003056' }, { value: '#1a4567', label: '#1a4567' }, { value: '#c0392b', label: '#c0392b' }]}
                    showPlaceholder={false} disabled={formato === "excel"}
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
                  <label className={labelClass} style={{ color: '#666' }}>Fonte registro</label>
                  <Select
                    value={fonteCampo}
                    onChange={(v) => setFonteCampo(v)}
                    options={[{ value: 'Arial', label: 'Arial' }, { value: 'Calibri', label: 'Calibri' }, { value: 'Times New Roman', label: 'Times New Roman' }, { value: 'Courier New', label: 'Courier New' }, { value: 'Tahoma', label: 'Tahoma' }, { value: 'Trebuchet MS', label: 'Trebuchet MS' }]}
                    showPlaceholder={false} disabled={formato === "excel"}
                                      visibleOptions={7}
                  />
                </div>
                <div className="group">
                  <label className={labelClass} style={{ color: '#666' }}>Tamanho fonte registro</label>
                  <input type="text" inputMode="numeric" disabled={formato === "excel"} value={tamanhoFonteCampo}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '');
                      setTamanhoFonteCampo(v ? Math.max(1, Number(v)) : 1);
                    }}
                    className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`}
                  />                </div>
              </div>
              )}

          </section>

          {(bandaTipo === 'lista' || bandaTipo === 'texto_valor') && (
          <>
          {/* ═══════════════════════════════════════════════ */}
          {/* ── Seção: Filtros ── */}
          {/* ═══════════════════════════════════════════════ */}
          <section>
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-1">
              <h2 className="text-sm font-semibold text-slate-900">Filtros</h2>
              <button type="button" onClick={() => setFiltros((prev) => [...prev, { id: gerarId(), campo: '', operador: 'igual' as const, valor: '', valorFinal: '', conector: 'E' as const, mascara: 'texto' as const }])} className="text-sm text-[#066fc5] hover:underline cursor-pointer">Adicionar</button>
            </div>
            <FiltrosRelatorioTable
              filtros={filtros}
              onChange={setFiltros}
              camposDisponiveis={camposDisponiveis}
              onEditingChange={setEditingFiltro}
              userId={userId}
              initialColumns={initialFiltrosColumns}
              onColumnsChange={onFiltrosColumnsChange}
            />
          </section>
          </>
          )}

          {bandaTipo === 'lista' && (
          <>
          {/* ═══════════════════════════════════════════════ */}
          {/* ── Seção: Ordenação ── */}
          {/* ═══════════════════════════════════════════════ */}
          <section>
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-1">
              <h2 className="text-sm font-semibold text-slate-900">Ordenação</h2>
              <button type="button" onClick={() => setOrdenacao((prev) => [...prev, { id: gerarId(), campo: "", direcao: "asc" }])} className="text-sm text-[#066fc5] hover:underline cursor-pointer">Adicionar</button>
            </div>
            <OrdenacaoRelatorioTable
              ordenacao={ordenacao}
              onChange={setOrdenacao}
              camposDisponiveis={camposDisponiveis}
              onEditingChange={setEditingOrdenacao}
              userId={userId}
              initialColumns={initialOrdenacaoColumns}
              onColumnsChange={onOrdenacaoColumnsChange}
            />
          </section>
          </>
          )}
          </>
          )}
          </div>
              <div className="flex-shrink-0 flex items-center justify-between gap-3 px-[15px] py-3">
                <div />
                <div className="flex items-center gap-3 ml-auto">
                  <button type="button" onClick={() => closeBandaDetail()} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}>Cancelar</button>
                  <button type="button" onClick={() => closeBandaDetail()} className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}>Salvar</button>
                </div>
              </div>
            </div>
          </div>
          ) : null}
        </div>

        {/* ── Botões de ação ── */}
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-3">
            <div />
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-40"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </form>
      <LoadingModal open={saving} message="Salvando..." />
    </div>
  );
}
