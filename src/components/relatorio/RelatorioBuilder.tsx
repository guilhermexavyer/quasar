"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Select from "@/components/ui/Select";
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
  RelatorioFiltro,
  RelatorioOrdenacao,
  RelatorioAgrupamento,
} from "@/types/relatorio";
import CamposRelatorioTable, { type CamposRelatorioRow } from "@/components/relatorio/CamposRelatorioTable";

interface RelatorioBuilderProps {
  relatorio: Relatorio | null;
  onSave: (relatorio: Omit<Relatorio, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">) => void;
  onCancel: () => void;
  saving?: boolean;
  manageSelection?: string;
  onManageSelectionChange?: (v: string) => void;
  allowedSubmodulos?: string[];
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
    alinhamento: c.alinhamento || 'esquerda',
    largura: c.largura ?? 30,
    formatacao: c.formatacao || 'texto',
  };
}

const EMPTY_FILTRO: () => RelatorioFiltro = () => ({
  id: gerarId(),
  campo: "",
  operador: "igual",
  valor: "",
  valorFinal: "",
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
}: RelatorioBuilderProps) {
  const formRef = useRef<HTMLFormElement | null>(null);

  const [dsRelatorio, setDsRelatorio] = useState(relatorio?.ds_relatorio ?? "");
  const [colecao, setColecao] = useState(relatorio?.colecao ?? "");
  const [campos, setCampos] = useState<CamposRelatorioRow[]>(
    relatorio?.campos?.length
      ? relatorio.campos.map((c, i) => mapRelatorioCampoToRow(c, i, relatorio.colecao))
      : []
  );
  const [filtros, setFiltros] = useState<RelatorioFiltro[]>(relatorio?.filtros?.length ? relatorio.filtros : [EMPTY_FILTRO()]);
  const [ordenacao, setOrdenacao] = useState<RelatorioOrdenacao[]>(relatorio?.ordenacao?.length ? relatorio.ordenacao : [{ campo: "", direcao: "asc" as const }]);
  const [agrupamento, setAgrupamento] = useState<RelatorioAgrupamento | undefined>(relatorio?.agrupamento);
  const [formato, setFormato] = useState<'excel' | 'pdf'>(relatorio?.formato ?? 'excel');
  const [configExcel, setConfigExcel] = useState(relatorio?.configExcel ?? defaultConfigExcel());
  const [configPdf, setConfigPdf] = useState(relatorio?.configPdf ?? defaultConfigPdf());
  const [erros, setErros] = useState<string[]>([]);

  const dataSource = useMemo(() => (colecao ? getDataSource(colecao) : undefined), [colecao]);
  const camposDisponiveis = dataSource?.campos ?? [];
  const opcoesColecao = DATA_SOURCES.map((ds) => ({ value: ds.value, label: ds.value }));

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (saving) return;
        const f = formRef.current;
        if (f && typeof (f as any).requestSubmit === 'function') {
          (f as any).requestSubmit();
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [saving]);

  // ── Handlers ──


  function adicionarFiltro() { setFiltros((prev) => [...prev, EMPTY_FILTRO()]); }
  function removerFiltro(id: string) { setFiltros((prev) => prev.filter((f) => f.id !== id)); }
  function atualizarFiltro(id: string, updates: Partial<RelatorioFiltro>) {
    setFiltros((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }

  function adicionarOrdenacao() { setOrdenacao((prev) => [...prev, { campo: "", direcao: "asc" }]); }
  function removerOrdenacao(idx: number) { setOrdenacao((prev) => prev.filter((_, i) => i !== idx)); }
  function atualizarOrdenacao(idx: number, updates: Partial<RelatorioOrdenacao>) {
    setOrdenacao((prev) => prev.map((o, i) => (i === idx ? { ...o, ...updates } : o)));
  }

  function validar(): boolean {
    const errs: string[] = [];
    if (!dsRelatorio.trim()) errs.push("Descrição é obrigatória.");
    if (!colecao) errs.push("Coleção principal é obrigatória.");
    if (campos.length === 0) errs.push("Selecione pelo menos um campo.");
    if (campos.some((c) => !c.chave)) errs.push("Todos os campos devem ter uma chave selecionada.");
    setErros(errs);
    return errs.length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validar()) return;
    const result: Omit<Relatorio, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao"> = {
      ds_relatorio: dsRelatorio.trim(),
      colecao,
      campos: campos.map((c) => ({
        id: c.id, colecao: c.colecao, chave: c.chave, rotulo: c.label, label: c.label,
        backgroundLabel: c.backgroundLabel, corLabel: c.corLabel, corCampo: c.corCampo, backgroundCampo: c.backgroundCampo,
        posicao: c.posicao, largura: c.largura, alinhamento: c.alinhamento, formatacao: c.formatacao,
      })),
      filtros: filtros.filter((f) => f.campo),
      ordenacao: ordenacao.filter((o) => o.campo),
      agrupamento,
      formato,
      configExcel: formato === "excel" ? configExcel : undefined,
      configPdf: formato === "pdf" ? configPdf : undefined,
    };
    onSave(result);
  }

  const labelClass = "block text-sm mb-1";
  const inputClass = "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none";

  return (
    <div className="flex-1 flex flex-col min-h-0">
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
          />
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center rounded-[3px] border border-transparent bg-transparent px-4 py-2.5 text-sm font-normal text-[#066fc5] transition cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
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
        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-[15px] sm:grid-cols-12 pt-2">

            {/* ── Linha 1: Sequência + Descrição + Formato + Coleção ── */}
            <div className="sm:col-span-1 group">
              <label className={labelClass} style={{ color: '#666' }}>Sequência</label>
              <input disabled value={String(relatorio?.nr_sequencia ?? '')} className={`${inputClass} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`} />
            </div>
            <div className="sm:col-span-5 group">
              <label className={labelClass} style={{ color: '#666' }}>Descrição *</label>
              <input value={dsRelatorio} onChange={(e) => setDsRelatorio(e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-2 group">
              <label className={labelClass} style={{ color: '#666' }}>Formato *</label>
              <Select
                value={formato}
                onChange={(v) => setFormato(v as 'excel' | 'pdf')}
                options={[{ value: "excel", label: "Excel (CSV)" }, { value: "pdf", label: "PDF" }]}
                showPlaceholder={false}
              />
            </div>
            <div className="sm:col-span-4 group">
              <label className={labelClass} style={{ color: '#666' }}>Coleção principal *</label>
              <Select
                value={colecao}
                onChange={(v) => {
                  setColecao(v);
                  setCampos([]);
                  setFiltros([]);
                  setOrdenacao([]);
                  setAgrupamento(undefined);
                }}
                options={opcoesColecao}
                showPlaceholder
              />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════ */}
          {/* ── Seção: Campos do relatório ── */}
          {/* ═══════════════════════════════════════════════ */}
          <section className="mt-[15px]">
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-1">
              <h2 className="text-sm font-semibold text-slate-900">Campos do relatório</h2>
              {colecao && (
                <button type="button" onClick={() => setCampos((prev) => [...prev, { id: gerarId(), colecao, chave: '', label: '', backgroundLabel: '#e2e8f0', corLabel: '#1a1a1a', corCampo: '#1a1a1a', backgroundCampo: '', posicao: prev.length + 1, alinhamento: 'esquerda', largura: 30, formatacao: 'texto' }])} className="text-sm text-[#066fc5] hover:underline cursor-pointer">Adicionar</button>
              )}
            </div>
            {!colecao && (
              <p className="text-sm text-slate-400">Selecione uma fonte de dados primeiro.</p>
            )}
            {colecao && (
              <CamposRelatorioTable
                campos={campos}
                onChange={setCampos}
                camposDisponiveis={camposDisponiveis}
                colecaoPrincipal={colecao}
              />
            )}
          </section>

          {/* ═══════════════════════════════════════════════ */}
          {/* ── Seção: Filtros ── */}
          {/* ═══════════════════════════════════════════════ */}
          <section className="mt-[15px]">
            <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Filtros</h2>
            <div className="space-y-[15px]">
              {filtros.map((filtro, index) => (
                <div key={filtro.id} className="grid gap-[15px] sm:grid-cols-12 items-start">
                  {/* ConECTOR */}
                  {index > 0 && (
                    <div className="sm:col-span-1 group">
                      {index === 1 && <label className={labelClass} style={{ color: '#666' }}>Conector</label>}
                      <Select
                        value={filtro.conector ?? "E"}
                        onChange={(v) => atualizarFiltro(filtro.id, { conector: v as 'E' | 'OU' })}
                        options={[{ value: "E", label: "E" }, { value: "OU", label: "OU" }]}
                        showPlaceholder={false}
                      />
                    </div>
                  )}
                  <div className={index > 0 ? "sm:col-span-3 group" : "sm:col-span-4 group"}>
                    {index === 0 && <label className={labelClass} style={{ color: '#666' }}>Campo</label>}
                    <Select
                      value={filtro.campo}
                      onChange={(v) => atualizarFiltro(filtro.id, { campo: v })}
                      options={camposDisponiveis.map((cd) => ({ value: cd.key, label: cd.label }))}
                      showPlaceholder
                    />
                  </div>
                  <div className="sm:col-span-3 group">
                    {index === 0 && <label className={labelClass} style={{ color: '#666' }}>Operador</label>}
                    <Select
                      value={filtro.operador}
                      onChange={(v) => atualizarFiltro(filtro.id, { operador: v as any })}
                      options={[...OPERADORES_FILTRO]}
                      showPlaceholder={false}
                    />
                  </div>
                  {!["vazio", "nao_vazio"].includes(filtro.operador) && (
                    <div className={filtro.operador === "entre" ? "sm:col-span-3 group" : "sm:col-span-5 group"}>
                      {index === 0 && <label className={labelClass} style={{ color: '#666' }}>Valor</label>}
                      <div className="flex items-center gap-1">
                        <input
                          value={filtro.valor ?? ""}
                          onChange={(e) => atualizarFiltro(filtro.id, { valor: e.target.value })}
                          className={`${inputClass} flex-1 min-w-0`}
                        />
                        <button type="button" onClick={adicionarFiltro} className="btn-responsavel inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center cursor-pointer text-slate-700 hover:border-[#003056] hover:text-[#003056]" title="Adicionar filtro">+</button>
                        <button type="button" onClick={() => removerFiltro(filtro.id)} disabled={filtros.length <= 1} className="btn-responsavel inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center cursor-pointer text-red-500 hover:border-red-500 hover:text-red-600 disabled:cursor-default disabled:opacity-40 disabled:hover:border-[#999] disabled:hover:text-slate-700" title="Remover filtro">−</button>
                      </div>
                    </div>
                  )}
                  {filtro.operador === "entre" && (
                    <div className="sm:col-span-3 group">
                      {index === 0 && <label className={labelClass} style={{ color: '#666' }}>Valor final</label>}
                      <div className="flex items-center gap-1">
                        <input
                          value={filtro.valorFinal ?? ""}
                          onChange={(e) => atualizarFiltro(filtro.id, { valorFinal: e.target.value })}
                          className={`${inputClass} flex-1 min-w-0`}
                        />
                        <button type="button" onClick={adicionarFiltro} className="btn-responsavel inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center cursor-pointer text-slate-700 hover:border-[#003056] hover:text-[#003056]" title="Adicionar filtro">+</button>
                        <button type="button" onClick={() => removerFiltro(filtro.id)} disabled={filtros.length <= 1} className="btn-responsavel inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center cursor-pointer text-red-500 hover:border-red-500 hover:text-red-600 disabled:cursor-default disabled:opacity-40 disabled:hover:border-[#999] disabled:hover:text-slate-700" title="Remover filtro">−</button>
                      </div>
                    </div>
                  )}
                  {["vazio", "nao_vazio"].includes(filtro.operador) && (
                    <div className="sm:col-span-1 group">
                      {index === 0 && <label className={labelClass} style={{ color: '#666' }}>&nbsp;</label>}
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={adicionarFiltro} className="btn-responsavel inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center cursor-pointer text-slate-700 hover:border-[#003056] hover:text-[#003056]" title="Adicionar filtro">+</button>
                        <button type="button" onClick={() => removerFiltro(filtro.id)} disabled={filtros.length <= 1} className="btn-responsavel inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center cursor-pointer text-red-500 hover:border-red-500 hover:text-red-600 disabled:cursor-default disabled:opacity-40 disabled:hover:border-[#999] disabled:hover:text-slate-700" title="Remover filtro">−</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

            </div>
          </section>

          {/* ═══════════════════════════════════════════════ */}
          {/* ── Seção: Ordenação ── */}
          {/* ═══════════════════════════════════════════════ */}
          <section className="mt-[15px]">
            <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Ordenação</h2>
            <div className="space-y-[15px]">
              {ordenacao.map((ord, index) => (
                <div key={index} className="grid gap-[15px] sm:grid-cols-12 items-start">
                  <div className="sm:col-span-1 group">
                    <label className={labelClass} style={{ color: '#666' }}>&nbsp;</label>
                    <span className="text-sm text-slate-500">{index + 1}º</span>
                  </div>
                  <div className="sm:col-span-6 group">
                    {index === 0 && <label className={labelClass} style={{ color: '#666' }}>Campo</label>}
                    <Select
                      value={ord.campo}
                      onChange={(v) => atualizarOrdenacao(index, { campo: v })}
                      options={camposDisponiveis.map((cd) => ({ value: cd.key, label: cd.label }))}
                      showPlaceholder
                    />
                  </div>
                  <div className="sm:col-span-5 group">
                    {index === 0 && <label className={labelClass} style={{ color: '#666' }}>Direção</label>}
                    <div className="flex items-center gap-1">
                      <Select
                        value={ord.direcao}
                        onChange={(v) => atualizarOrdenacao(index, { direcao: v as 'asc' | 'desc' })}
                        options={[{ value: "asc", label: "Crescente" }, { value: "desc", label: "Decrescente" }]}
                        showPlaceholder={false}
                        className="flex-1 min-w-0"
                      />
                      <button type="button" onClick={adicionarOrdenacao} className="btn-responsavel inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center cursor-pointer text-slate-700 hover:border-[#003056] hover:text-[#003056]" title="Adicionar ordenação">+</button>
                      <button type="button" onClick={() => removerOrdenacao(index)} disabled={ordenacao.length <= 1} className="btn-responsavel inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center cursor-pointer text-red-500 hover:border-red-500 hover:text-red-600 disabled:cursor-default disabled:opacity-40 disabled:hover:border-[#999] disabled:hover:text-slate-700" title="Remover ordenação">−</button>
                    </div>
                  </div>
                </div>
              ))}

            </div>
          </section>

          {/* ═══════════════════════════════════════════════ */}
          {/* ── Seção: Agrupamento ── */}
          {/* ═══════════════════════════════════════════════ */}
          <section className="mt-[15px]">
            <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Agrupamento</h2>
            {campos.length > 0 ? (
              <div className="grid gap-[15px] sm:grid-cols-12">
                <div className="sm:col-span-5 group">
                  <label className={labelClass} style={{ color: '#666' }}>Agrupar por</label>
                  <Select
                    value={agrupamento?.campo ?? ""}
                    onChange={(v) => {
                      if (v) {
                        setAgrupamento({ campo: v, incluirSubtotal: agrupamento?.incluirSubtotal ?? true, incluirTotalGeral: agrupamento?.incluirTotalGeral ?? true });
                      } else {
                        setAgrupamento(undefined);
                      }
                    }}
                    options={campos.map((c) => ({ value: c.chave, label: c.label || c.chave }))}
                    showPlaceholder
                  />
                </div>
                {agrupamento && (
                  <>
                    <div className="sm:col-span-7 group">
                      <label className={labelClass} style={{ color: '#666' }}>&nbsp;</label>
                      <div className="flex items-center gap-4">
                        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={agrupamento.incluirSubtotal} onChange={() => setAgrupamento({ ...agrupamento, incluirSubtotal: !agrupamento.incluirSubtotal })} />
                          <span>Subtotal</span>
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={agrupamento.incluirTotalGeral} onChange={() => setAgrupamento({ ...agrupamento, incluirTotalGeral: !agrupamento.incluirTotalGeral })} />
                          <span>Total geral</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Adicione campos primeiro.</p>
            )}
          </section>

          {/* ═══════════════════════════════════════════════ */}
          {/* ── Seção: Configuração de saída ── */}
          {/* ═══════════════════════════════════════════════ */}
          <section className="mt-[15px] mb-4">
            <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">
              Configuração de saída — {formato === "excel" ? "Excel (CSV)" : "PDF"}
            </h2>

            {formato === "excel" ? (
              <div className="grid gap-[15px] sm:grid-cols-12">
                <div className="sm:col-span-4 group">
                  <label className={labelClass} style={{ color: '#666' }}>Título</label>
                  <input value={configExcel.titulo ?? ""} onChange={(e) => setConfigExcel({ ...configExcel, titulo: e.target.value })} className={inputClass} />
                </div>
                <div className="sm:col-span-3 group">
                  <label className={labelClass} style={{ color: '#666' }}>Estilo cabeçalho</label>
                  <Select value={configExcel.estiloCabecalho} onChange={(v) => setConfigExcel({ ...configExcel, estiloCabecalho: v as any })} options={[...ESTILO_CABECALHO_EXCEL]} showPlaceholder={false} />
                </div>
                <div className="sm:col-span-5 group">
                  <label className={labelClass} style={{ color: '#666' }}>&nbsp;</label>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={configExcel.incluirCabecalho} onChange={() => setConfigExcel({ ...configExcel, incluirCabecalho: !configExcel.incluirCabecalho })} /><span>Cabeçalho</span></label>
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={configExcel.incluirRodape} onChange={() => setConfigExcel({ ...configExcel, incluirRodape: !configExcel.incluirRodape })} /><span>Rodapé</span></label>
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={configExcel.zebrado} onChange={() => setConfigExcel({ ...configExcel, zebrado: !configExcel.zebrado })} /><span>Zebrado</span></label>
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={configExcel.filtrosAutomaticos} onChange={() => setConfigExcel({ ...configExcel, filtrosAutomaticos: !configExcel.filtrosAutomaticos })} /><span>Filtros auto</span></label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-[15px]">
                <div className="grid gap-[15px] sm:grid-cols-12">
                  <div className="sm:col-span-3 group">
                    <label className={labelClass} style={{ color: '#666' }}>Título</label>
                    <input value={configPdf.titulo ?? ""} onChange={(e) => setConfigPdf({ ...configPdf, titulo: e.target.value })} className={inputClass} />
                  </div>
                  <div className="sm:col-span-2 group">
                    <label className={labelClass} style={{ color: '#666' }}>Página</label>
                    <Select value={configPdf.tamanhoPagina} onChange={(v) => setConfigPdf({ ...configPdf, tamanhoPagina: v as any })} options={[...TAMANHOS_PAGINA]} showPlaceholder={false} />
                  </div>
                  <div className="sm:col-span-2 group">
                    <label className={labelClass} style={{ color: '#666' }}>Orientação</label>
                    <Select value={configPdf.orientacao} onChange={(v) => setConfigPdf({ ...configPdf, orientacao: v as any })} options={[{ value: "retrato", label: "Retrato" }, { value: "paisagem", label: "Paisagem" }]} showPlaceholder={false} />
                  </div>
                  <div className="sm:col-span-2 group">
                    <label className={labelClass} style={{ color: '#666' }}>Tamanho fonte</label>
                    <input type="number" value={configPdf.tamanhoFonte} onChange={(e) => setConfigPdf({ ...configPdf, tamanhoFonte: Number(e.target.value) })} className={inputClass} min={6} max={20} />
                  </div>
                  <div className="sm:col-span-3 group">
                    <label className={labelClass} style={{ color: '#666' }}>&nbsp;</label>
                    <div className="flex items-center gap-4">
                      <label className="inline-flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={configPdf.incluirBordas} onChange={() => setConfigPdf({ ...configPdf, incluirBordas: !configPdf.incluirBordas })} /><span>Bordas</span></label>
                      <label className="inline-flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={configPdf.zebrado} onChange={() => setConfigPdf({ ...configPdf, zebrado: !configPdf.zebrado })} /><span>Zebrado</span></label>
                    </div>
                  </div>
                </div>

                {/* Margens */}
                <div className="grid gap-[15px] sm:grid-cols-12">
                  {(["superior", "inferior", "esquerda", "direita"] as const).map((lado) => (
                    <div key={lado} className="sm:col-span-3 group">
                      {lado === "superior" && <label className={labelClass} style={{ color: '#666' }}>Margens (mm)</label>}
                      {lado !== "superior" && <label className={labelClass} style={{ color: '#666' }}>&nbsp;</label>}
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-slate-500 capitalize w-16">{lado}:</label>
                        <input
                          type="number"
                          value={configPdf.margens[lado]}
                          onChange={(e) => setConfigPdf({ ...configPdf, margens: { ...configPdf.margens, [lado]: Number(e.target.value) } })}
                          className={`${inputClass} !py-1`}
                          min={5}
                          max={50}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cabeçalho e rodapé */}
                <div className="grid gap-[15px] sm:grid-cols-12">
                  <div className="sm:col-span-6 p-3 bg-slate-50 rounded border border-slate-200">
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer mb-2">
                      <input type="checkbox" checked={configPdf.cabecalho.incluir} onChange={() => setConfigPdf({ ...configPdf, cabecalho: { ...configPdf.cabecalho, incluir: !configPdf.cabecalho.incluir } })} />
                      <span className="font-medium">Cabeçalho</span>
                    </label>
                    {configPdf.cabecalho.incluir && (
                      <div className="space-y-2">
                        <input
                          value={configPdf.cabecalho.texto ?? ""}
                          onChange={(e) => setConfigPdf({ ...configPdf, cabecalho: { ...configPdf.cabecalho, texto: e.target.value } })}
                          className={inputClass}
                          placeholder="Texto do cabeçalho"
                        />
                        <div className="flex gap-3">
                          <label className="inline-flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" checked={configPdf.cabecalho.incluirData} onChange={() => setConfigPdf({ ...configPdf, cabecalho: { ...configPdf.cabecalho, incluirData: !configPdf.cabecalho.incluirData } })} /> Data</label>
                          <label className="inline-flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" checked={configPdf.cabecalho.incluirNumeroPagina} onChange={() => setConfigPdf({ ...configPdf, cabecalho: { ...configPdf.cabecalho, incluirNumeroPagina: !configPdf.cabecalho.incluirNumeroPagina } })} /> Nº página</label>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="sm:col-span-6 p-3 bg-slate-50 rounded border border-slate-200">
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer mb-2">
                      <input type="checkbox" checked={configPdf.rodape.incluir} onChange={() => setConfigPdf({ ...configPdf, rodape: { ...configPdf.rodape, incluir: !configPdf.rodape.incluir } })} />
                      <span className="font-medium">Rodapé</span>
                    </label>
                    {configPdf.rodape.incluir && (
                      <div className="space-y-2">
                        <input
                          value={configPdf.rodape.texto ?? ""}
                          onChange={(e) => setConfigPdf({ ...configPdf, rodape: { ...configPdf.rodape, texto: e.target.value } })}
                          className={inputClass}
                          placeholder="Texto do rodapé"
                        />
                        <div className="flex gap-3">
                          <label className="inline-flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" checked={configPdf.rodape.incluirData} onChange={() => setConfigPdf({ ...configPdf, rodape: { ...configPdf.rodape, incluirData: !configPdf.rodape.incluirData } })} /> Data</label>
                          <label className="inline-flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" checked={configPdf.rodape.incluirNumeroPagina} onChange={() => setConfigPdf({ ...configPdf, rodape: { ...configPdf.rodape, incluirNumeroPagina: !configPdf.rodape.incluirNumeroPagina } })} /> Nº página</label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
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
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
