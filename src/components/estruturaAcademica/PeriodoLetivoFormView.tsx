"use client";

import { useEffect, useRef, useState } from "react";
import type { PeriodoLetivo } from "@/types/periodoLetivo";
import { FIELD_INFOS, STATUS_PERIODO_LETIVO_OPTIONS, applyDateMask, formatDate } from "@/lib/periodoLetivoUtils";
import type { CampoStatus } from "@/lib/camposConfigUtils";
import Select from "@/components/ui/Select";
import RequiredAsterisk from "@/components/ui/RequiredAsterisk";
import FieldInfoPopup from "@/components/ui/FieldInfoPopup";
import { elementoVisivel } from "@/lib/visibilidade";

export type PeriodoLetivoFormData = Omit<PeriodoLetivo, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao">;

interface FormViewProps {
  message: string;
  editingId: string | null;
  sequence?: number | null;
  form: PeriodoLetivoFormData;
  setForm: React.Dispatch<React.SetStateAction<PeriodoLetivoFormData>>;
  submitting: boolean;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  goToList: () => void;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  onOpenAudit?: (periodoId?: string | null) => void;
  onPrevRecord: () => void;
  onNextRecord: () => void;
  hasPrevRecord: boolean;
  hasNextRecord: boolean;
  selectOptions: { value: string; label: string }[];
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  /** Submódulos permitidos do dropdown PAI (Alunos/Colaboradores/Período letivo) conforme permissões. */
  allowedSubmodulos?: string[];
  /** Regras de campos por perfil (colecao periodo_letivo): campo → status. */
  campoRegras?: Record<string, CampoStatus>;
  /** Campos obrigatórios vazios no último submit (borda vermelha). */
  campoErros?: string[];
}

export default function PeriodoLetivoFormView({
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
  selectOptions,
  manageSelection,
  onManageSelectionChange,
  allowedSubmodulos = ['alunos', 'colaboradores', 'periodoLetivo'],
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
        // Funções abertas ficam montadas, porém escondidas: só o formulário na tela salva.
        if (!f || !elementoVisivel(f)) return;
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
        <div className="grid gap-[15px] sm:grid-cols-12 pt-2">
          {/* ── Linha 1 ── */}
          <div className="sm:col-span-1 group">
            {renderFieldLabel('nr_sequencia', 'Sequência')}
            <input
              disabled
              value={String(sequence ?? '')}
              className="w-full rounded-[3px] border border-slate-300 px-2 py-1.5 text-sm transition focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 group">
            {renderFieldLabel('nr_ano', 'Ano')}
            <input
              inputMode="numeric"
              maxLength={4}
              placeholder="AAAA"
              disabled={statusDe('nr_ano') === 'D'}
              className={`${inputClass('nr_ano', "w-full rounded-[3px] border bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]")} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
              value={form.nr_ano ? String(form.nr_ano) : ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
                setForm({ ...form, nr_ano: raw ? Number(raw) : undefined });
              }}
            />
          </div>

          <div className="sm:col-span-7 group">
            {renderFieldLabel('ds_periodo_letivo', 'Descrição')}
            <input
              disabled={statusDe('ds_periodo_letivo') === 'D'}
              className={`${inputClass('ds_periodo_letivo')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
              value={form.ds_periodo_letivo ?? ''}
              onChange={(e) => setForm({ ...form, ds_periodo_letivo: e.target.value })}
            />
          </div>

          <div className="sm:col-span-2 group">
            {renderFieldLabel('qt_dias_letivos', 'Dias letivos')}
            <input
              inputMode="numeric"
              maxLength={3}
              disabled={statusDe('qt_dias_letivos') === 'D'}
              className={`${inputClass('qt_dias_letivos')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
              value={form.qt_dias_letivos !== undefined ? String(form.qt_dias_letivos) : ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '').slice(0, 3);
                setForm({ ...form, qt_dias_letivos: raw ? Number(raw) : undefined });
              }}
            />
          </div>

          {/* ── Linha 2 ── */}
          <div className="sm:col-span-12 grid gap-[15px] sm:grid-cols-5">
            {([
              ['dt_inicio', 'Data de início'],
              ['dt_previsao_termino', 'Previsão de término'],
            ] as const).map(([campo, label]) => (
              <div key={campo} className="group">
                {renderFieldLabel(campo, label)}
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  disabled={statusDe(campo) === 'D'}
                  className={`${inputClass(campo, "w-full rounded-[3px] border bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]")} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                  value={form[campo] ?? ''}
                  onChange={(e) => setForm({ ...form, [campo]: applyDateMask(e.target.value) })}
                />
              </div>
            ))}

            <div className="group">
              {renderFieldLabel('dt_termino', 'Data de término')}
              {/* Preenchida pelo "Encerrar" do menu de contexto (ou pelo encerramento automático). */}
              <input
                disabled
                placeholder="DD/MM/AAAA"
                className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 py-1.5 text-sm text-slate-500 transition focus:outline-none placeholder:text-[#999] disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500"
                value={form.dt_termino ?? ''}
              />
            </div>

            <div className="group">
              {renderFieldLabel('dt_reativacao', 'Data de reativação')}
              {/* Preenchida pelo "Reativar" do menu de contexto; placeholder um pouco mais escuro por causa do fundo cinza. */}
              <input
                disabled
                placeholder="DD/MM/AAAA"
                className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 py-1.5 text-sm text-slate-500 transition focus:outline-none placeholder:text-[#999] disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500"
                value={form.dt_reativacao ?? ''}
              />
            </div>

            <div className="group">
              {renderFieldLabel('ie_status', 'Status')}
              {/* Status só é escolhido no cadastro; depois muda pelo menu de contexto (Reativar). */}
              <Select
                disabled={!!editingId || statusDe('ie_status') === 'D'}
                error={campoErros.includes('ie_status')}
                value={form.ie_status ?? 'A'}
                onChange={(v) => setForm({ ...form, ie_status: v })}
                options={STATUS_PERIODO_LETIVO_OPTIONS}
                showPlaceholder={false}
              />
            </div>
          </div>
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
