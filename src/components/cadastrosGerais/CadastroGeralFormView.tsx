"use client";

import { useEffect, useRef, useState } from "react";
import { formatCadastroGeralCellValue } from "@/lib/cadastroGeralUtils";
import type { CampoStatus } from "@/lib/camposConfigUtils";
import Select from "@/components/ui/Select";
import RequiredAsterisk from "@/components/ui/RequiredAsterisk";
import FieldInfoPopup from "@/components/ui/FieldInfoPopup";

export interface CadastroGeralFormData {
  descricao: string;
  ie_status: string;
  /** Campo extra opcional (ex.: CBO na função Profissão). */
  nr_cbo?: string;
  /** Sigla genérica (funções Órgão emissor e Logradouro). */
  sg_sigla?: string;
  /** Observação (ex.: Categoria ativo). */
  ds_observacao?: string;
}

interface FormViewProps {
  editingId: string | null;
  sequence?: number | null;
  form: CadastroGeralFormData;
  setForm: React.Dispatch<React.SetStateAction<CadastroGeralFormData>>;
  submitting: boolean;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  goToList: () => void;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  onPrevRecord: () => void;
  onNextRecord: () => void;
  hasPrevRecord: boolean;
  hasNextRecord: boolean;
  onOpenAudit?: (id?: string | null) => void;
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  selectOptions: { value: string; label: string }[];
  /** Submódulos permitidos do dropdown PAI (tipos de cadastro) conforme permissões. */
  allowedSubmodulos?: string[];
  fieldInfos: Record<string, { type: string; field: string; collection: string }>;
  descFieldKey: string;
  collectionName: string;
  /** Exibe o campo extra CBO (usado na função Profissão). */
  showCbo?: boolean;
  /** Exibe o campo extra Sigla (funções Órgão emissor e Logradouro). */
  showSigla?: boolean;
  /** Exibe o campo extra Observação (ex.: Categoria ativo). */
  showObservacao?: boolean;
  /** Chave do campo de sigla na coleção atual (ex.: sg_orgao_emissor, sg_logradouro). */
  siglaFieldKey?: string;
  /** Regras de campos por perfil (colecao = collectionName): campo → status. */
  campoRegras?: Record<string, CampoStatus>;
  /** Campos obrigatórios vazios no último submit (borda vermelha). */
  campoErros?: string[];
}

export default function CadastroGeralFormView({
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
  onPrevRecord,
  onNextRecord,
  hasPrevRecord,
  hasNextRecord,
  onOpenAudit,
  manageSelection,
  onManageSelectionChange,
  selectOptions,
  allowedSubmodulos = ['sexo', 'estadoCivil', 'corRaca', 'profissao', 'orgaoEmissor', 'logradouro'],
  fieldInfos,
  descFieldKey,
  collectionName,
  showCbo = false,
  showSigla = false,
  showObservacao = false,
  siglaFieldKey = 'sg_sigla',
  campoRegras = {},
  campoErros = [],
}: FormViewProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [infoPopupField, setInfoPopupField] = useState<string | null>(null);
  const [infoAnchor, setInfoAnchor] = useState<HTMLElement | null>(null);

  function statusDe(campo: string): CampoStatus {
    return campoRegras?.[campo] ?? 'N';
  }

  function inputClass(campo: string, base = "w-full rounded-[3px] border bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"): string {
    return campoErros.includes(campo)
      ? `${base} border-red-500`
      : `${base} border-slate-300`;
  }

  function renderFieldLabel(fieldKey: string, label: string) {
    const meta = fieldInfos[fieldKey] ?? {
      type: 'string',
      field: fieldKey,
      collection: collectionName,
    };
    const obrigatorio = statusDe(fieldKey) === 'O';
    return (
      <div className="relative inline-block text-sm mb-1" style={{ color: '#666' }}>
        <div className="group inline-flex items-center gap-2 w-full">
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
        <div className="grid gap-[15px] sm:grid-cols-12 pt-2">
          <div className="sm:col-span-1 group">
            {renderFieldLabel('nr_sequencia', 'Sequência')}
            <input
              disabled
              value={String(sequence ?? '')}
              className="w-full rounded-[3px] border border-slate-300 px-2 py-1.5 text-sm transition focus:outline-none"
            />
          </div>

          <div className={`${(showCbo || showSigla) ? 'sm:col-span-8' : 'sm:col-span-11'} group`}>
            {renderFieldLabel(descFieldKey, 'Descrição')}
            <input
              disabled={statusDe(descFieldKey) === 'D'}
              className={`${inputClass(descFieldKey)} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </div>

          {showCbo && (
            <div className="sm:col-span-3 group">
              {renderFieldLabel('nr_cbo', 'CBO')}
              <input
                maxLength={7}
                inputMode="numeric"
                disabled={statusDe('nr_cbo') === 'D'}
                className={`${inputClass('nr_cbo')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                value={form.nr_cbo ?? ''}
                onChange={(e) => setForm({ ...form, nr_cbo: e.target.value.replace(/\D/g, '') })}
              />
            </div>
          )}

          {showSigla && (
            <div className="sm:col-span-3 group">
              {renderFieldLabel(siglaFieldKey, 'Sigla')}
              <input
                maxLength={10}
                disabled={statusDe(siglaFieldKey) === 'D'}
                className={`${inputClass(siglaFieldKey)} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                value={form.sg_sigla ?? ''}
                onChange={(e) => setForm({ ...form, sg_sigla: e.target.value })}
              />
            </div>
          )}

          {showObservacao && (
            <div className="sm:col-span-12 group">
              {renderFieldLabel('ds_observacao', 'Observação')}
              <textarea
                rows={3}
                disabled={statusDe('ds_observacao') === 'D'}
                className={`${inputClass('ds_observacao')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500 resize-none`}
                value={form.ds_observacao ?? ''}
                onChange={(e) => setForm({ ...form, ds_observacao: e.target.value })}
              />
            </div>
          )}

          <div className="sm:col-span-12">
            <div className="group w-full">
              {renderFieldLabel('ie_status', 'Status')}
              <div className="flex items-center gap-4 mb-3">
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="ie_status"
                    value="A"
                    disabled={statusDe('ie_status') === 'D'}
                    checked={form.ie_status === 'A' || !form.ie_status}
                    onChange={() => setForm({ ...form, ie_status: 'A' })}
                  />
                  <span>Ativo</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="ie_status"
                    value="I"
                    disabled={statusDe('ie_status') === 'D'}
                    checked={form.ie_status === 'I'}
                    onChange={() => setForm({ ...form, ie_status: 'I' })}
                  />
                  <span>Inativo</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-3">
            {editingId && (
            <div className="text-[13px] text-slate-500">
              <div className="relative group flex items-center gap-2">
                <span>Criado por {createdBy || '-'} em {createdAt ? formatCadastroGeralCellValue('dt_criacao', createdAt) : '-'}</span>
                <button
                  type="button"
                  onClick={() => onOpenAudit?.(editingId)}
                  className="inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none"
                  aria-label="Abrir histórico de auditoria"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4" />
                    <circle cx="12" cy="16" r="0.5" />
                  </svg>
                </button>
              </div>
              <div className="relative group flex items-center gap-2 mt-1">
                <span>Alterado por {updatedBy || '-'} em {updatedAt ? formatCadastroGeralCellValue('dt_alteracao', updatedAt) : '-'}</span>
                <button
                  type="button"
                  onClick={() => onOpenAudit?.(editingId)}
                  className="inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none"
                  aria-label="Abrir histórico de auditoria"
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
            <div className="flex items-center gap-3 ml-auto">
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
