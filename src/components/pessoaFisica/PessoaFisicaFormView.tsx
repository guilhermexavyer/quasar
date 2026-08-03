"use client";

import { useEffect, useRef, useState } from "react";
import type { PessoaFisica } from "@/types/pessoaFisica";
import { FIELD_INFOS, applyCpfMask, applyDateMask, applyPhoneMask, formatDate, parseDateInput } from "@/lib/pessoaFisicaUtils";
import Select from "@/components/ui/Select";

export type FormData = Omit<PessoaFisica, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao">;

export interface CgSelectOption {
  nr_sequencia: number;
  descricao: string;
  ie_status?: string;
}

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
  createdBy: string;
  updatedBy: string;
  onOpenAudit?: (pessoaId?: string | null) => void;
  onPrevRecord: () => void;
  onNextRecord: () => void;
  hasPrevRecord: boolean;
  hasNextRecord: boolean;
  naturalidadeNome: string;
  onOpenNaturalidadeLookup: () => void;
  onNaturalidadeCodeChange: (codigo: string) => void;
  sexos?: CgSelectOption[];
  estadoCivis?: CgSelectOption[];
  coresRacas?: CgSelectOption[];
  profissoes?: CgSelectOption[];
}

export default function PessoaFisicaFormView({
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
  naturalidadeNome,
  onOpenNaturalidadeLookup,
  onNaturalidadeCodeChange,
  sexos = [],
  estadoCivis = [],
  coresRacas = [],
  profissoes = [],
}: FormViewProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [infoPopupField, setInfoPopupField] = useState<keyof typeof FIELD_INFOS | null>(null);
  const infoPopupRef = useRef<HTMLDivElement | null>(null);

  // Calcula a idade a partir da data de nascimento (formato DD/MM/AAAA).
  function calcularIdade(dtNascimento: string): string {
    const parsed = parseDateInput(dtNascimento);
    if (parsed === null) return '';
    const day = parsed % 100;
    const month = Math.floor(parsed / 100) % 100;
    const year = Math.floor(parsed / 10000);
    const today = new Date();
    let age = today.getFullYear() - year;
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    if (currentMonth < month || (currentMonth === month && currentDay < day)) {
      age -= 1;
    }
    return age >= 0 ? String(age) : '';
  }

  function cgOptions(options: CgSelectOption[], selected?: number): CgSelectOption[] {
    const active = options
      .filter((op) => op.ie_status === 'A' || !op.ie_status)
      .sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR', { sensitivity: 'base' }));
    const selectedItem = options.find((op) => op.nr_sequencia === selected);
    if (selectedItem && selectedItem.ie_status === 'I' && !active.some((op) => op.nr_sequencia === selectedItem.nr_sequencia)) {
      return [...active, selectedItem];
    }
    return active;
  }

  function renderFieldLabel(fieldKey: keyof typeof FIELD_INFOS, label: string) {
    const meta = FIELD_INFOS[fieldKey];
    return (
      <label className="block text-sm mb-1" style={{ color: '#666' }}>
        <div className="relative group inline-flex items-center gap-2">
          <span>{label}</span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setInfoPopupField((current) => (current === fieldKey ? null : fieldKey));
            }}
            aria-label={`Informações do campo ${label}`}
            className="inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none"
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
              <div className="font-semibold text-slate-900 mb-2">Informações do campo</div>
              <div className="space-y-1">
                <div><span className="font-semibold">Tipo:</span> {meta.type}</div>
                <div><span className="font-semibold">Campo:</span> {meta.field}</div>
                <div><span className="font-semibold">Coleção:</span> {meta.collection}</div>
              </div>
            </div>
          )}
        </div>
      </label>
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
          <h1 className="text-[20px] font-semibold">Pessoas Físicas</h1>
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

          <div className="sm:col-span-11 group">
            {renderFieldLabel('ds_nome', 'Nome completo')}
            <input
              className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
              value={form.ds_nome}
              onChange={(e) => setForm({ ...form, ds_nome: e.target.value })}
            />
          </div>

          <div className="sm:col-span-6 group">
            {renderFieldLabel('nr_cpf', 'CPF')}
            <input
              inputMode="numeric"
              maxLength={14}
              className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
              value={form.nr_cpf}
              onChange={(e) => setForm({ ...form, nr_cpf: applyCpfMask(e.target.value) })}
            />
          </div>

          <div className="sm:col-span-5 group">
            {renderFieldLabel('dt_nascimento', 'Nascimento')}
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="DD/MM/AAAA"
              className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
              value={form.dt_nascimento}
              onChange={(e) =>
                setForm({ ...form, dt_nascimento: applyDateMask(e.target.value) })
              }
            />
          </div>

          <div className="sm:col-span-1 group">
            {renderFieldLabel('qt_idade', 'Idade')}
            <input
              disabled
              maxLength={3}
              className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 py-1.5 text-sm transition focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
              value={calcularIdade(form.dt_nascimento)}
            />
          </div>

          <div className="sm:col-span-3 group">
            {renderFieldLabel('ds_email', 'E-mail')}
            <input
              type="email"
              className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
              value={form.ds_email}
              onChange={(e) => setForm({ ...form, ds_email: e.target.value })}
            />
          </div>

          <div className="sm:col-span-3 group">
            {renderFieldLabel('nr_telefone', 'Telefone')}
            <input
              inputMode="numeric"
              maxLength={15}
              className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
              value={form.nr_telefone}
              onChange={(e) => setForm({ ...form, nr_telefone: applyPhoneMask(e.target.value) })}
            />
          </div>

          <div className="sm:col-span-6 group">
            {renderFieldLabel('cd_ibge_naturalidade', 'Naturalidade')}
            <div className="flex items-center gap-2 flex-nowrap">
              <div style={{ width: 100 }}>
                <label className="sr-only">Código IBGE da cidade</label>
                <input
                  inputMode="numeric"
                  maxLength={7}
                  placeholder="Código"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                  value={form.cd_ibge_naturalidade ?? ''}
                  onChange={(e) => onNaturalidadeCodeChange(e.target.value.replace(/\D/g, '').slice(0, 7))}
                />
              </div>
              <div className="relative flex-1 min-w-0">
                <label className="sr-only">Nome da cidade</label>
                <input
                  readOnly
                  placeholder="Cidade - UF"
                  className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-10 py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                  value={naturalidadeNome}
                />
                <button
                  type="button"
                  onClick={onOpenNaturalidadeLookup}
                  className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-[34px] w-[34px] items-center justify-center rounded-[3px] cursor-pointer text-black"
                  aria-label="Localizar cidade"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="sm:col-span-3 group">
            {renderFieldLabel('nr_seq_sexo', 'Sexo')}
            <Select
              value={form.nr_seq_sexo ? String(form.nr_seq_sexo) : ''}
              onChange={(v) => setForm({ ...form, nr_seq_sexo: v ? Number(v) : undefined })}
              options={cgOptions(sexos, form.nr_seq_sexo).map((op) => ({ value: String(op.nr_sequencia), label: op.descricao }))}
            />
          </div>

          <div className="sm:col-span-3 group">
            {renderFieldLabel('nr_seq_estado_civil', 'Estado civil')}
            <Select
              value={form.nr_seq_estado_civil ? String(form.nr_seq_estado_civil) : ''}
              onChange={(v) => setForm({ ...form, nr_seq_estado_civil: v ? Number(v) : undefined })}
              options={cgOptions(estadoCivis, form.nr_seq_estado_civil).map((op) => ({ value: String(op.nr_sequencia), label: op.descricao }))}
            />
          </div>

          <div className="sm:col-span-3 group">
            {renderFieldLabel('nr_seq_cor_raca', 'Cor/Raça')}
            <Select
              value={form.nr_seq_cor_raca ? String(form.nr_seq_cor_raca) : ''}
              onChange={(v) => setForm({ ...form, nr_seq_cor_raca: v ? Number(v) : undefined })}
              options={cgOptions(coresRacas, form.nr_seq_cor_raca).map((op) => ({ value: String(op.nr_sequencia), label: op.descricao }))}
            />
          </div>

          <div className="sm:col-span-3 group">
            {renderFieldLabel('nr_seq_profissao', 'Profissão')}
            <Select
              value={form.nr_seq_profissao ? String(form.nr_seq_profissao) : ''}
              onChange={(v) => setForm({ ...form, nr_seq_profissao: v ? Number(v) : undefined })}
              options={cgOptions(profissoes, form.nr_seq_profissao).map((op) => ({ value: String(op.nr_sequencia), label: op.descricao }))}
            />
          </div>
        </div>

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-3">
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
            <div className="flex items-center justify-end gap-3">
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
