"use client";

import { useEffect, useRef, useState } from "react";
import type { Ativo } from "@/types/ativo";
import { FIELD_INFOS, STATUS_OPTIONS, formatDate, applyDateMask, applyIPv4Mask } from "@/lib/ativoUtils";
import { CAMPOS_POR_FUNCAO, type CampoStatus } from "@/lib/camposConfigUtils";
import Select from "@/components/ui/Select";
import RequiredAsterisk from "@/components/ui/RequiredAsterisk";
import FieldInfoPopup from "@/components/ui/FieldInfoPopup";
import LoadingModal from "@/components/ui/LoadingModal";
import ViewIcon from "@/components/ui/ViewIcon";
import SearchIcon from "@/components/ui/SearchIcon";

export type AtivoFormData = Omit<Ativo, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao">;

const ARMAZENAMENTO_OPTIONS = [
  { value: 'KB', label: 'KB' },
  { value: 'MB', label: 'MB' },
  { value: 'GB', label: 'GB' },
  { value: 'TB', label: 'TB' },
];

interface FormViewProps {
  message: string;
  editingId: string | null;
  sequence?: number | null;
  form: AtivoFormData;
  setForm: React.Dispatch<React.SetStateAction<AtivoFormData>>;
  submitting: boolean;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  goToList: () => void;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  onOpenAudit?: (ativoId?: string | null) => void;
  onPrevRecord: () => void;
  onNextRecord: () => void;
  hasPrevRecord: boolean;
  hasNextRecord: boolean;
  /** Opções de Cadastros Gerais. */
  categoriasAtivos?: { nr_sequencia: number; descricao: string; ie_status?: string }[];
  localizacoes?: { nr_sequencia: number; descricao: string; ie_status?: string }[];
  marcas?: { nr_sequencia: number; descricao: string; ie_status?: string }[];
  sistemasOperacionais?: { nr_sequencia: number; descricao: string }[];
  selectOptions: { value: string; label: string }[];
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  /** Submódulos permitidos do dropdown PAI (Ativos/...) conforme permissões. */
  allowedSubmodulos?: string[];
  /** Regras de campos por perfil (colecao pat_ativo): campo → status. */
  campoRegras?: Record<string, CampoStatus>;
  /** Campos obrigatórios vazios no último submit (borda vermelha). */
  campoErros?: string[];
  /** Nomes dos responsáveis (Pessoa física) selecionados. */
  responsaveisNames?: string[];
  /** Abre o lookup de Pessoa Física (Responsável) pelo índice. */
  onOpenResponsavelLookup?: (index: number) => void;
  /** Abre o modal de visualização de uma pessoa física. */
  onViewResponsavel?: (nrSequencia: number | undefined) => void;
  /** Nr. sequência da última manutenção do ativo. */
  ultimaManutencaoSeq?: number | null;
  /** Abre o modal de visualização de uma manutenção. */
  onViewManutencao?: (nrSequencia: number | undefined) => void;
}

export default function AtivoFormView({
  message,
  editingId,
  sequence,
  form,
  setForm,
  submitting,
  handleSubmit,
  goToList,
  createdAt,
  updatedAt,
  createdBy,
  updatedBy,
  onOpenAudit,
  onPrevRecord,
  onNextRecord,
  hasPrevRecord,
  hasNextRecord,
  categoriasAtivos = [],
  localizacoes = [],
  marcas = [],
  sistemasOperacionais = [],
  selectOptions,
  manageSelection,
  onManageSelectionChange,
  allowedSubmodulos = ['ativos'],
  campoRegras = {},
  campoErros = [],
  responsaveisNames = [],
  onOpenResponsavelLookup,
  onViewResponsavel,
  ultimaManutencaoSeq,
  onViewManutencao,
}: FormViewProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [infoPopupField, setInfoPopupField] = useState<keyof typeof FIELD_INFOS | null>(null);
  const [infoAnchor, setInfoAnchor] = useState<HTMLElement | null>(null);

  function statusDe(campo: string): CampoStatus {
    return campoRegras?.[campo] ?? 'N';
  }

  function inputClass(campo: string, base = "w-full rounded-[3px] border bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"): string {
    return campoErros.includes(campo)
      ? `${base} border-red-500`
      : `${base} border-slate-300`;
  }

  // Apenas itens Ativos ficam disponíveis no dropdown; itens Inativos
  // (status 'I' em Cadastros Gerais) são ocultados, e a lista é ordenada
  // alfabeticamente pela descrição.
  function cgOptions(options: { nr_sequencia: number; descricao: string; ie_status?: string }[]): { nr_sequencia: number; descricao: string }[] {
    return options
      .filter((op) => op.ie_status === 'A' || !op.ie_status)
      .filter((op) => op && typeof op.descricao === 'string' && op.descricao.trim() !== '')
      .sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR', { sensitivity: 'base' }));
  }

  /** Campos que são configuráveis em Admin > Campos (apenas esses podem ter o asterisco). */
  const camposConfiguraveis = new Set(
    CAMPOS_POR_FUNCAO.patrimonio?.map((c) => c.key.replace('pat_ativo.', '')) ?? []
  );

  function renderFieldLabel(fieldKey: keyof typeof FIELD_INFOS, label: string) {
    const meta = FIELD_INFOS[fieldKey];
    const obrigatorio = camposConfiguraveis.has(String(fieldKey)) && statusDe(String(fieldKey)) === 'O';
    return (
      <div className="block text-sm mb-1" style={{ color: '#666' }}>
        <div className="relative group inline-flex items-center gap-2">
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

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (submitting) return;
        const f = formRef.current;
        if (!f) return;
        if (typeof (f as any).requestSubmit === 'function') {
          (f as any).requestSubmit();
        } else {
          const btn = f.querySelector('button[type="submit"]') as HTMLButtonElement | null;
          if (btn) btn.click();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [submitting]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {submitting && <LoadingModal open message="Carregando..." />}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-5">
          <Select
            value={manageSelection}
            onChange={onManageSelectionChange}
            options={selectOptions.filter((o) => allowedSubmodulos.includes(o.value))}
            disabled
            showPlaceholder={false}
            className="!w-[180px]"
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
          onClick={goToList}
          className="inline-flex items-center rounded-[3px] border border-transparent bg-transparent px-4 py-2.5 text-sm font-normal text-[#066fc5] transition cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2 active:outline active:outline-1 active:outline-[#066fc5] active:outline-offset-2"
        >
          Fechar
        </button>
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="mt-4 flex-1 flex flex-col min-h-0"
      >
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-9">
          {/* ── Identificação ── */}
          <section>
            <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Identificação</h2>
            <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
              <div className="sm:col-span-1 group">
                {renderFieldLabel('nr_sequencia', 'Sequência')}
                <input
                  disabled
                  value={String(sequence ?? '')}
                  className="w-full rounded-[3px] border border-slate-300 px-2 py-1.5 text-sm transition focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3 group">
                {renderFieldLabel('cd_patrimonio', 'Patrimônio')}
                <input
                  disabled
                  maxLength={30}
                  className="w-full rounded-[3px] border border-slate-300 px-2 py-1.5 text-sm transition focus:outline-none cursor-default bg-slate-100 text-slate-500"
                  value={form.cd_patrimonio ?? ''}
                  onChange={(e) => setForm({ ...form, cd_patrimonio: e.target.value })}
                />
              </div>

              <div className="sm:col-span-8 group">
                {renderFieldLabel('ds_ativo', 'Descrição')}
                <input
                  disabled={statusDe('ds_ativo') === 'D'}
                  className={`${inputClass('ds_ativo')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                  value={form.ds_ativo ?? ''}
                  onChange={(e) => setForm({ ...form, ds_ativo: e.target.value })}
                />
              </div>

              <div className="sm:col-span-3 group">
                {renderFieldLabel('ds_modelo', 'Modelo')}
                <input
                  disabled={statusDe('ds_modelo') === 'D'}
                  className={`${inputClass('ds_modelo')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                  value={form.ds_modelo ?? ''}
                  onChange={(e) => setForm({ ...form, ds_modelo: e.target.value })}
                />
              </div>

              <div className="sm:col-span-3 group">
                {renderFieldLabel('nr_serie', 'Número de série')}
                <input
                  disabled={statusDe('nr_serie') === 'D'}
                  className={`${inputClass('nr_serie')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                  value={form.nr_serie ?? ''}
                  onChange={(e) => setForm({ ...form, nr_serie: e.target.value })}
                />
              </div>

              <div className="sm:col-span-3 group">
                {renderFieldLabel('ds_qr_code', 'QR Code')}
                <input
                  disabled={statusDe('ds_qr_code') === 'D'}
                  className={`${inputClass('ds_qr_code')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                  value={form.ds_qr_code ?? ''}
                  onChange={(e) => setForm({ ...form, ds_qr_code: e.target.value })}
                />
              </div>

              <div className="sm:col-span-3 group">
                {renderFieldLabel('ds_codigo_barras', 'Código de barras')}
                <input
                  disabled={statusDe('ds_codigo_barras') === 'D'}
                  className={`${inputClass('ds_codigo_barras')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                  value={form.ds_codigo_barras ?? ''}
                  onChange={(e) => setForm({ ...form, ds_codigo_barras: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2 group">
                {renderFieldLabel('dt_aquisicao', 'Data de aquisição')}
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  disabled={statusDe('dt_aquisicao') === 'D'}
                  className={`${inputClass('dt_aquisicao')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                  value={form.dt_aquisicao ?? ''}
                  onChange={(e) => setForm({ ...form, dt_aquisicao: applyDateMask(e.target.value) })}
                />
              </div>

              <div className="sm:col-span-2 group">
                {renderFieldLabel('dt_garantia', 'Data de garantia')}
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  disabled={statusDe('dt_garantia') === 'D'}
                  className={`${inputClass('dt_garantia')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                  value={form.dt_garantia ?? ''}
                  onChange={(e) => setForm({ ...form, dt_garantia: applyDateMask(e.target.value) })}
                />
              </div>

              <div className="sm:col-span-2 group">
                {renderFieldLabel('ie_status', 'Status')}
                <Select
                  disabled={statusDe('ie_status') === 'D' || !!editingId}
                  error={campoErros.includes('ie_status')}
                  value={form.ie_status ?? ''}
                  onChange={(v) => setForm({ ...form, ie_status: v })}
                  options={STATUS_OPTIONS}
                  showPlaceholder={false}
                />
              </div>

              <div className="sm:col-span-2 group">
                {renderFieldLabel('dt_reativacao', 'Reativação')}
                <input
                  type="text"
                  placeholder="DD/MM/AAAA"
                  disabled
                  className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 py-1.5 text-sm text-slate-500 transition focus:outline-none disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500"
                  value={form.dt_reativacao ?? ''}
                />
              </div>

              <div className="sm:col-span-2 group">
                {renderFieldLabel('nr_seq_ultima_manutencao', 'Última manutenção')}
                <div className="relative">
                  <input
                    inputMode="numeric"
                    disabled
                    className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[38px] py-1.5 text-sm text-slate-500 transition focus:outline-none cursor-default"
                    value={ultimaManutencaoSeq != null ? String(ultimaManutencaoSeq) : ''}
                  />
                  {ultimaManutencaoSeq != null && (
                    <button
                      type="button"
                      onClick={() => onViewManutencao?.(ultimaManutencaoSeq ?? undefined)}
                      className="absolute right-[2px] top-1/2 -translate-y-1/2 z-10 inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup"
                      aria-label="Visualizar última manutenção"
                    >
                      <ViewIcon size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2 group">
                {renderFieldLabel('dt_descarte', 'Descarte')}
                <input
                  type="text"
                  placeholder="DD/MM/AAAA"
                  disabled
                  className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 py-1.5 text-sm text-slate-500 transition focus:outline-none disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500"
                  value={form.dt_descarte ?? ''}
                />
              </div>

              <div className="sm:col-span-12 group">
                {renderFieldLabel('ds_descarte', 'Motivo do descarte')}
                <textarea
                  disabled
                  className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 py-1.5 text-sm text-slate-500 transition focus:outline-none resize-none disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500"
                  rows={3}
                  value={form.ds_descarte ?? ''}
                />
              </div>
            </div>
          </section>

          {/* ── Classificação ── */}
          <section>
            <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Classificação</h2>
            <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
              <div className="sm:col-span-4 group">
                {renderFieldLabel('nr_seq_categoria', 'Categoria')}
                <Select
                  disabled={statusDe('nr_seq_categoria') === 'D'}
                  error={campoErros.includes('nr_seq_categoria')}
                  value={form.nr_seq_categoria ? String(form.nr_seq_categoria) : ''}
                  onChange={(v) => setForm({ ...form, nr_seq_categoria: v ? Number(v) : undefined })}
                  options={cgOptions(categoriasAtivos).map((op) => ({ value: String(op.nr_sequencia), label: op.descricao }))}
                />
              </div>

              <div className="sm:col-span-4 group">
                {renderFieldLabel('nr_seq_localizacao', 'Localização')}
                <Select
                  disabled={statusDe('nr_seq_localizacao') === 'D'}
                  error={campoErros.includes('nr_seq_localizacao')}
                  value={form.nr_seq_localizacao ? String(form.nr_seq_localizacao) : ''}
                  onChange={(v) => setForm({ ...form, nr_seq_localizacao: v ? Number(v) : undefined })}
                  options={cgOptions(localizacoes).map((op) => ({ value: String(op.nr_sequencia), label: op.descricao }))}
                />
              </div>

              <div className="sm:col-span-4 group">
                {renderFieldLabel('nr_seq_marca', 'Marca')}
                <Select
                  disabled={statusDe('nr_seq_marca') === 'D'}
                  error={campoErros.includes('nr_seq_marca')}
                  value={form.nr_seq_marca ? String(form.nr_seq_marca) : ''}
                  onChange={(v) => setForm({ ...form, nr_seq_marca: v ? Number(v) : undefined })}
                  options={cgOptions(marcas).map((op) => ({ value: String(op.nr_sequencia), label: op.descricao }))}
                />
              </div>

              {(form.responsaveis ?? []).map((resp, index) => (
                <div key={index} className="sm:col-span-12 group">
                  {index === 0 && renderFieldLabel('responsaveis', 'Responsável')}
                  <div className="flex items-center gap-2 flex-nowrap">
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <div style={{ width: 110 }}>
                        <label className="sr-only">Sequência do responsável</label>
                        <input
                          inputMode="numeric"
                          maxLength={10}
                          disabled={statusDe('nr_seq_responsavel') === 'D'}
                          className={`w-full rounded-[3px] border bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa] ${campoErros.includes('nr_seq_responsavel') ? 'border-red-500' : 'border-slate-300'} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                          value={resp.nr_seq_responsavel ? String(resp.nr_seq_responsavel) : ''}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setForm((prev) => {
                              const responsaveis = [...(prev.responsaveis ?? [])];
                              responsaveis[index] = { ...(responsaveis[index] ?? {}), nr_seq_responsavel: raw ? Number(raw) : undefined };
                              return { ...prev, responsaveis };
                            });
                          }}
                        />
                      </div>
                      <div className="relative flex-1 min-w-0">
                        <label className="sr-only">Nome do responsável</label>
                        <input
                          readOnly
                          className={`w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa] ${campoErros.includes('nr_seq_responsavel') ? 'border-red-500' : ''}`}
                          value={responsaveisNames[index] ?? ''}
                        />
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                          {resp.nr_seq_responsavel && (
                            <button
                              type="button"
                              onClick={() => onViewResponsavel?.(resp.nr_seq_responsavel)}
                              className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup disabled:cursor-default disabled:opacity-40"
                              aria-label="Visualizar responsável"
                            >
                              <ViewIcon />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onOpenResponsavelLookup?.(index)}
                            disabled={statusDe('nr_seq_responsavel') === 'D'}
                            className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup disabled:cursor-default disabled:opacity-40"
                            aria-label="Localizar responsável"
                          >
                            <SearchIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const responsaveis = [...(form.responsaveis ?? [])];
                          responsaveis.splice(index + 1, 0, { nr_seq_responsavel: undefined });
                          setForm({ ...form, responsaveis });
                        }}
                        className="btn-responsavel inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center cursor-pointer text-slate-700 hover:border-[#003056] hover:text-[#003056]"
                        aria-label={`Adicionar responsável após o ${index + 1}`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M12 5v14" />
                          <path d="M5 12h14" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const responsaveis = [...(form.responsaveis ?? [])];
                          responsaveis.splice(index, 1);
                          if (responsaveis.length === 0) {
                            responsaveis.push({ nr_seq_responsavel: undefined });
                          }
                          setForm({ ...form, responsaveis });
                        }}
                        disabled={(form.responsaveis ?? []).length <= 1}
                        className="btn-responsavel inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center cursor-pointer text-slate-700 hover:border-red-500 hover:text-red-600 disabled:cursor-default disabled:opacity-40 disabled:hover:border-[#999] disabled:hover:text-slate-700"
                        aria-label={`Remover responsável ${index + 1}`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M5 12h14" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {(form.responsaveis ?? []).length === 0 && (
                <p className="sm:col-span-12 text-sm text-slate-500">Nenhum responsável cadastrado.</p>
              )}
            </div>
          </section>

          {/* ── Dispositivo ── */}
          <section>
            <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Dispositivo</h2>
            <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
              <div className="sm:col-span-4 group">
                {renderFieldLabel('ds_processador', 'Processador')}
                <input
                  disabled={statusDe('ds_processador') === 'D'}
                  className={`${inputClass('ds_processador')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                  value={form.ds_processador ?? ''}
                  onChange={(e) => setForm({ ...form, ds_processador: e.target.value })}
                />
              </div>

              <div className="sm:col-span-4 group">
                <div className="flex gap-2">
                  <div className="flex-1 min-w-0">
                    {renderFieldLabel('qt_ram', 'Memória RAM')}
                    <input
                      disabled={statusDe('qt_ram') === 'D'}
                      className={`${inputClass('qt_ram')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                      value={form.qt_ram ?? ''}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, '');
                        setForm({ ...form, qt_ram: v ? Number(v) : undefined, ...(v ? {} : { ie_ram: undefined }) });
                      }}
                    />
                  </div>
                  <div className="w-24">
                    {renderFieldLabel('ie_ram', 'Unidade')}
                    <Select
                      disabled={statusDe('ie_ram') === 'D' || !form.qt_ram}
                      error={campoErros.includes('ie_ram')}
                      value={form.ie_ram ?? ''}
                      onChange={(v) => setForm({ ...form, ie_ram: v })}
                      options={ARMAZENAMENTO_OPTIONS}
                    />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-4 group">
                <div className="flex gap-2">
                  <div className="flex-1 min-w-0">
                    {renderFieldLabel('qt_armazenamento', 'Armazenamento')}
                    <input
                      disabled={statusDe('qt_armazenamento') === 'D'}
                      className={`${inputClass('qt_armazenamento')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                      value={form.qt_armazenamento ?? ''}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, '');
                        setForm({ ...form, qt_armazenamento: v ? Number(v) : undefined, ...(v ? {} : { ie_armazenamento: undefined }) });
                      }}
                    />
                  </div>
                  <div className="w-24">
                    {renderFieldLabel('ie_armazenamento', 'Unidade')}
                    <Select
                      disabled={statusDe('ie_armazenamento') === 'D' || !form.qt_armazenamento}
                      error={campoErros.includes('ie_armazenamento')}
                      value={form.ie_armazenamento ?? ''}
                      onChange={(v) => setForm({ ...form, ie_armazenamento: v })}
                      options={ARMAZENAMENTO_OPTIONS}
                    />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-4 group">
                {renderFieldLabel('ds_endereco_mac', 'Endereço MAC')}
                <input
                  maxLength={12}
                  disabled={statusDe('ds_endereco_mac') === 'D'}
                  className={`${inputClass('ds_endereco_mac')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                  value={form.ds_endereco_mac ?? ''}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                    setForm({ ...form, ds_endereco_mac: v });
                  }}
                />
              </div>

              <div className="sm:col-span-4 group">
                {renderFieldLabel('ds_ip', 'IPv4')}
                <input
                  disabled={statusDe('ds_ip') === 'D'}
                  className={`${inputClass('ds_ip')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                  value={form.ds_ip ?? ''}
                  onChange={(e) => setForm({ ...form, ds_ip: applyIPv4Mask(e.target.value) })}
                />
              </div>

              <div className="sm:col-span-4 group">
                {renderFieldLabel('nr_seq_sistema_operacional', 'Sistema operacional')}
                <Select
                  visibleOptions={5}
                  disabled={statusDe('nr_seq_sistema_operacional') === 'D'}
                  error={campoErros.includes('nr_seq_sistema_operacional')}
                  value={form.nr_seq_sistema_operacional ? String(form.nr_seq_sistema_operacional) : ''}
                  onChange={(v) => setForm({ ...form, nr_seq_sistema_operacional: v ? Number(v) : undefined })}
                  options={sistemasOperacionais.map((s) => ({ value: String(s.nr_sequencia), label: s.descricao }))}
                />
              </div>
            </div>
          </section>

          {/* ── Observações ── */}
          <section>
            <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Observações</h2>
            <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
              <div className="sm:col-span-12 group">
                {renderFieldLabel('ds_observacao', 'Observação')}
                <textarea
                  rows={4}
                  disabled={statusDe('ds_observacao') === 'D'}
                  className={`${inputClass('ds_observacao', "w-full rounded-[3px] border bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none resize-none")} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                  value={form.ds_observacao ?? ''}
                  onChange={(e) => setForm({ ...form, ds_observacao: e.target.value })}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-3">
            {editingId && (
            <div className="text-[13px] text-slate-500">
              <div className="relative group flex items-center gap-2">
                <span>Criado por {createdBy || '-'} em {createdAt ? formatDate(createdAt) : '-'}</span>
                <button
                  type="button"
                  aria-hidden="true"
                  onClick={() => onOpenAudit?.(editingId)}
                  className="inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4" />
                    <circle cx="12" cy="16" r="0.5" />
                  </svg>
                </button>
              </div>
              <div className="relative group flex items-center gap-2 mt-1">
                <span>Alterado por {updatedBy || '-'} em {updatedAt ? formatDate(updatedAt) : '-'}</span>
                <button
                  type="button"
                  aria-hidden="true"
                  onClick={() => onOpenAudit?.(editingId)}
                  className="inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4" />
                    <circle cx="12" cy="16" r="0.5" />
                  </svg>
                </button>
              </div>
            </div>
            )}
            <div className="flex items-center justify-end gap-3 ml-auto">
              <button
                type="button"
                onClick={goToList}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
