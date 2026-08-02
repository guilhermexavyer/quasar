"use client";

import type { Dispatch, SetStateAction } from "react";

export interface CadastroGeralFilterForm {
  nr_sequencia: string;
  descricao: string;
  ie_status: string;
}

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  filterForm: CadastroGeralFilterForm;
  setFilterForm: Dispatch<SetStateAction<CadastroGeralFilterForm>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClear: () => void;
}

export default function CadastroGeralFilterModal({
  open,
  onClose,
  filterForm,
  setFilterForm,
  onSubmit,
  onClear,
}: FilterModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form onSubmit={onSubmit} className="relative w-full max-w-[560px] bg-white modal-dark p-0 shadow-xl shadow-black/20">
        <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
          <h2 className="text-base font-semibold" style={{ color: '#000' }}>Filtro</h2>
          <button
            type="button"
            onClick={onClose}
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
          <div className="sm:col-span-3">
            <label className="block text-sm mb-1" style={{ color: '#666' }}>
              Sequência
            </label>
            <input
              inputMode="numeric"
              maxLength={10}
              className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
              value={filterForm.nr_sequencia}
              onChange={(e) => setFilterForm({ ...filterForm, nr_sequencia: e.target.value.replace(/\D/g, '') })}
            />
          </div>
          <div className="sm:col-span-9">
            <label className="block text-sm mb-1" style={{ color: '#666' }}>
              Descrição
            </label>
            <input
              className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
              value={filterForm.descricao}
              onChange={(e) => setFilterForm({ ...filterForm, descricao: e.target.value })}
            />
          </div>
          <div className="sm:col-span-12">
            <label className="block text-sm mb-1" style={{ color: '#666' }}>
              Status
            </label>
            <div className="flex items-center gap-4 mb-3">
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="cg_ie_status"
                  value="T"
                  checked={filterForm.ie_status === 'T'}
                  onChange={() => setFilterForm({ ...filterForm, ie_status: 'T' })}
                />
                <span>Todos</span>
              </label>
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="cg_ie_status"
                  value="A"
                  checked={filterForm.ie_status === 'A'}
                  onChange={() => setFilterForm({ ...filterForm, ie_status: 'A' })}
                />
                <span>Ativo</span>
              </label>
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="cg_ie_status"
                  value="I"
                  checked={filterForm.ie_status === 'I'}
                  onChange={() => setFilterForm({ ...filterForm, ie_status: 'I' })}
                />
                <span>Inativo</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
          <button
            type="button"
            onClick={onClear}
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
  );
}
