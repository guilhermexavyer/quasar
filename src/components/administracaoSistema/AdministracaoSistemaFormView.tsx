"use client";

import { useEffect, useRef, useState } from "react";
import type { Usuario } from "@/types/usuario";
import { ADMIN_FIELD_INFOS, formatAdminCellValue } from "@/lib/usuarioUtils";
import type { CampoStatus } from "@/lib/camposConfigUtils";
import Select from "@/components/ui/Select";
import RequiredAsterisk from "@/components/ui/RequiredAsterisk";

export type AdminFormData = Omit<Usuario, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao">;

interface FormViewProps {
  message: string;
  editingId: string | null;
  sequence?: number | null;
  form: AdminFormData;
  setForm: React.Dispatch<React.SetStateAction<AdminFormData>>;
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
  pessoaFisicaName: string;
  onOpenPessoaFisicaLookup: () => void;
  onOpenAudit?: (usuarioId?: string | null) => void;
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  readOnly?: boolean;
  /** Regras de campos por perfil (colecao usuario): campo → status. */
  campoRegras?: Record<string, CampoStatus>;
  /** Campos obrigatórios vazios no último submit (borda vermelha). */
  campoErros?: string[];
}

export default function AdministracaoSistemaFormView({
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
  onPrevRecord,
  onNextRecord,
  hasPrevRecord,
  hasNextRecord,
  pessoaFisicaName,
  onOpenPessoaFisicaLookup,
  onOpenAudit,
  manageSelection,
  onManageSelectionChange,
  readOnly = false,
  campoRegras = {},
  campoErros = [],
}: FormViewProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [infoPopupField, setInfoPopupField] = useState<keyof typeof ADMIN_FIELD_INFOS | null>(null);
  const infoPopupRef = useRef<HTMLDivElement | null>(null);

  function statusDe(campo: string): CampoStatus {
    return campoRegras?.[campo] ?? 'N';
  }

  function inputClass(campo: string, base = "w-full rounded-[3px] border bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"): string {
    return campoErros.includes(campo)
      ? `${base} border-red-500`
      : `${base} border-slate-300`;
  }

  function renderFieldLabel(fieldKey: keyof typeof ADMIN_FIELD_INFOS, label: string) {
    const meta = ADMIN_FIELD_INFOS[fieldKey] ?? {
      type: 'string',
      field: String(fieldKey),
      collection: 'usuario',
    };
    const obrigatorio = statusDe(String(fieldKey)) === 'O';
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
            <div
              ref={infoPopupRef}
              className="absolute left-full bottom-0 z-10 ml-1 w-[240px] bg-white p-[10px] text-xs border border-[#ccc] shadow-[0_4px_10px_rgba(0,0,0,0.18)]"
              onClick={(event) => event.stopPropagation()}
            >
              <span
                aria-hidden="true"
                className="absolute left-[-4px] bottom-[6px] h-[8px] w-[8px] rotate-45 border-l border-b border-[#ccc] bg-white"
              />
              <div className="font-semibold text-slate-900 mb-2">Informações do campo</div>
              <div className="space-y-1">
                <div><span className="font-semibold">Tipo:</span> {meta.type}</div>
                <div><span className="font-semibold">Campo:</span> {meta.field}</div>
                <div><span className="font-semibold">Coleção:</span> {meta.collection}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (submitting || readOnly) return;
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

  useEffect(() => {
    if (!infoPopupField) return;
    function handleClose(event: MouseEvent) {
      // Cliques dentro da pop-up não a fecham — permite selecionar/copiar o texto.
      if (infoPopupRef.current && infoPopupRef.current.contains(event.target as Node)) {
        return;
      }
      setInfoPopupField(null);
    }
    document.addEventListener('click', handleClose);
    return () => document.removeEventListener('click', handleClose);
  }, [infoPopupField]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-5">
          <Select
            value={manageSelection}
            onChange={onManageSelectionChange}
            options={[{ value: 'campos', label: 'Campos' }, { value: 'perfis', label: 'Perfis' }, { value: 'usuarios', label: 'Usuários' }]}
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

          <div className="sm:col-span-5 group">
            {renderFieldLabel('ds_usuario', 'Usuário')}
            <input
              disabled={!!editingId || statusDe('ds_usuario') === 'D'}
              className={`${inputClass('ds_usuario')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
              value={form.ds_usuario}
              onChange={(e) => setForm({ ...form, ds_usuario: e.target.value })}
            />
          </div>

          <div className="sm:col-span-6 group">
            {renderFieldLabel('ds_usuario_alternativo', 'Usuário alternativo')}
            <input
              disabled={readOnly || statusDe('ds_usuario_alternativo') === 'D'}
              className={`${inputClass('ds_usuario_alternativo')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
              value={form.ds_usuario_alternativo}
              onChange={(e) => setForm({ ...form, ds_usuario_alternativo: e.target.value })}
            />
          </div>

          <div className="sm:col-span-6 group">
            {renderFieldLabel('nr_seq_pessoa_fisica', 'Pessoa física')}
            <div className="flex items-center gap-2 flex-nowrap">
              <div style={{ width: 72 }}>
                <label className="sr-only">Código da pessoa física</label>
                <input
                  inputMode="numeric"
                  maxLength={10}
                  disabled={readOnly || statusDe('nr_seq_pessoa_fisica') === 'D'}
                  className={`${inputClass('nr_seq_pessoa_fisica', "w-full rounded-[3px] border bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none")} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                  value={form.nr_seq_pessoa_fisica ? String(form.nr_seq_pessoa_fisica) : ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setForm({
                      ...form,
                      nr_seq_pessoa_fisica: raw ? Number(raw) : undefined,
                    });
                  }}
                />
              </div>
              <div className="relative flex-1 min-w-0">
                <label className="sr-only">Nome da pessoa física</label>
                <input
                  readOnly
                  className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-10 py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none"
                  value={pessoaFisicaName}
                />
                <button
                  type="button"
                  onClick={onOpenPessoaFisicaLookup}
                  disabled={readOnly || statusDe('nr_seq_pessoa_fisica') === 'D'}
                  className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-[34px] w-[34px] items-center justify-center rounded-[3px] cursor-pointer text-black disabled:cursor-default disabled:opacity-40"
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

          <div className="sm:col-span-6 group">
            {renderFieldLabel('ds_email', 'E-mail')}
            <input
              type="email"
              disabled={readOnly || statusDe('ds_email') === 'D'}
              className={`${inputClass('ds_email')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
              value={form.ds_email ?? ""}
              onChange={(e) => setForm({ ...form, ds_email: e.target.value })}
            />
          </div>

          <div className="sm:col-span-12">
            <div className="group w-full">
              {renderFieldLabel('ie_status', 'Status')}
              <div className="flex items-center gap-4 mb-3">
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="ie_status"
                    value="A"
                    disabled={readOnly || statusDe('ie_status') === 'D'}
                    checked={form.ie_status === 'A' || !form.ie_status}
                    onChange={() => setForm({ ...form, ie_status: 'A' })}
                  />
                  <span>Ativo</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="ie_status"
                    value="B"
                    disabled={readOnly || statusDe('ie_status') === 'D'}
                    checked={form.ie_status === 'B'}
                    onChange={() => setForm({ ...form, ie_status: 'B' })}
                  />
                  <span>Bloqueado</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="ie_status"
                    value="I"
                    disabled={readOnly || statusDe('ie_status') === 'D'}
                    checked={form.ie_status === 'I'}
                    onChange={() => setForm({ ...form, ie_status: 'I' })}
                  />
                  <span>Inativo</span>
                </label>
              </div>
            </div>
            <div className="group w-full mt-2">
              {renderFieldLabel('ds_observacao', 'Observação')}
              <textarea
                disabled={readOnly || statusDe('ds_observacao') === 'D'}
                className={`${inputClass('ds_observacao', "w-full rounded-[3px] border bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none resize-none")} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                rows={3}
                value={form.ds_observacao}
                onChange={(e) => setForm({ ...form, ds_observacao: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[13px] text-slate-500">
              <div className="relative group flex items-center gap-2">
                <span>Criado por {createdBy || '-'} em {createdAt ? formatAdminCellValue('dt_criacao', createdAt) : '-'}</span>
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
                <span>Alterado por {updatedBy || '-'} em {updatedAt ? formatAdminCellValue('dt_alteracao', updatedAt) : '-'}</span>
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
            <div className="flex items-center gap-3">
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
                disabled={submitting || readOnly}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-40"
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
