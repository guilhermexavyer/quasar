"use client";

import { useEffect, useRef, useState } from "react";
import type { Ativo } from "@/types/ativo";
import { FIELD_INFOS, STATUS_OPTIONS, formatDate } from "@/lib/ativoUtils";
import type { CampoStatus } from "@/lib/camposConfigUtils";
import Select from "@/components/ui/Select";
import RequiredAsterisk from "@/components/ui/RequiredAsterisk";
import FieldInfoPopup from "@/components/ui/FieldInfoPopup";

export type AtivoFormData = Omit<Ativo, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao">;

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
  selectOptions: { value: string; label: string }[];
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  /** Submódulos permitidos do dropdown PAI (Ativos/...) conforme permissões. */
  allowedSubmodulos?: string[];
  /** Regras de campos por perfil (colecao pat_ativos): campo → status. */
  campoRegras?: Record<string, CampoStatus>;
  /** Campos obrigatórios vazios no último submit (borda vermelha). */
  campoErros?: string[];
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
  selectOptions,
  manageSelection,
  onManageSelectionChange,
  allowedSubmodulos = ['ativos'],
  campoRegras = {},
  campoErros = [],
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

  function renderFieldLabel(fieldKey: keyof typeof FIELD_INFOS, label: string) {
    const meta = FIELD_INFOS[fieldKey];
    const obrigatorio = statusDe(String(fieldKey)) === 'O';
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
                  maxLength={30}
                  disabled={statusDe('cd_patrimonio') === 'D'}
                  className={`${inputClass('cd_patrimonio')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
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

              <div className="sm:col-span-4 group">
                {renderFieldLabel('ds_modelo', 'Modelo')}
                <input
                  disabled={statusDe('ds_modelo') === 'D'}
                  className={`${inputClass('ds_modelo')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                  value={form.ds_modelo ?? ''}
                  onChange={(e) => setForm({ ...form, ds_modelo: e.target.value })}
                />
              </div>

              <div className="sm:col-span-4 group">
                {renderFieldLabel('ds_qr_code', 'QR Code')}
                <input
                  disabled={statusDe('ds_qr_code') === 'D'}
                  className={`${inputClass('ds_qr_code')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                  value={form.ds_qr_code ?? ''}
                  onChange={(e) => setForm({ ...form, ds_qr_code: e.target.value })}
                />
              </div>

              <div className="sm:col-span-4 group">
                {renderFieldLabel('ds_codigo_barras', 'Código de barras')}
                <input
                  disabled={statusDe('ds_codigo_barras') === 'D'}
                  className={`${inputClass('ds_codigo_barras')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                  value={form.ds_codigo_barras ?? ''}
                  onChange={(e) => setForm({ ...form, ds_codigo_barras: e.target.value })}
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

              <div className="sm:col-span-4 group">
                {renderFieldLabel('ie_status', 'Status')}
                <Select
                  disabled={statusDe('ie_status') === 'D'}
                  error={campoErros.includes('ie_status')}
                  value={form.ie_status ?? ''}
                  onChange={(v) => setForm({ ...form, ie_status: v })}
                  options={STATUS_OPTIONS}
                  showPlaceholder={false}
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
