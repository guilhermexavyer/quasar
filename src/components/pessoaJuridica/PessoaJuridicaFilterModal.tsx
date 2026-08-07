"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { applyCnpjMask } from "@/lib/pessoaJuridicaUtils";
import { applyDateMask, applyPhoneMask } from "@/lib/pessoaFisicaUtils";
import { cidadePorCodigo } from "@/services/cidadeService";
import Select from "@/components/ui/Select";
import SearchIcon from "@/components/ui/SearchIcon";

export interface PessoaJuridicaFilterForm {
  nr_sequencia: string;
  ds_razao_social: string;
  ds_nome_fantasia: string;
  nr_cnpj: string;
  nr_inscricao_estadual: string;
  nr_inscricao_municipal: string;
  dt_abertura_inicio: string;
  dt_abertura_fim: string;
  ds_email: string;
  nr_telefone: string;
  sg_estado: string;
  cd_ibge_cidade: string;
}

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  filterForm: PessoaJuridicaFilterForm;
  setFilterForm: Dispatch<SetStateAction<PessoaJuridicaFilterForm>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClear: () => void;
  onOpenCidadeLookup: () => void;
  estados?: { value: string; label: string }[];
}

export default function PessoaJuridicaFilterModal({
  open,
  onClose,
  filterForm,
  setFilterForm,
  onSubmit,
  onClear,
  onOpenCidadeLookup,
  estados = [],
}: FilterModalProps) {
  const [filterCidadeNome, setFilterCidadeNome] = useState('');
  const cidadeCodeRef = useRef('');

  // Resolve o nome da cidade a partir do código IBGE informado no filtro.
  useEffect(() => {
    const codigo = filterForm.cd_ibge_cidade ?? '';
    cidadeCodeRef.current = codigo;
    if (codigo.length < 7) {
      setFilterCidadeNome('');
      return;
    }
    cidadePorCodigo(codigo)
      .then((cidade) => {
        if (cidadeCodeRef.current !== codigo) return;
        setFilterCidadeNome(cidade ? `${cidade.nome} - ${cidade.uf}` : '');
      })
      .catch(() => {
        if (cidadeCodeRef.current === codigo) setFilterCidadeNome('');
      });
  }, [filterForm.cd_ibge_cidade]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form onSubmit={onSubmit} className="relative w-full max-w-[760px] bg-white modal-dark p-0 shadow-xl shadow-black/20">
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

          <div className="sm:col-span-3">
            <label className="block text-sm mb-1" style={{ color: '#666' }}>
              CNPJ
            </label>
            <input
              inputMode="numeric"
              maxLength={18}
              className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
              value={filterForm.nr_cnpj}
              onChange={(e) => setFilterForm({ ...filterForm, nr_cnpj: applyCnpjMask(e.target.value) })}
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm mb-1" style={{ color: '#666' }}>
              Data de abertura (início)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="DD/MM/AAAA"
              className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
              value={filterForm.dt_abertura_inicio}
              onChange={(e) => setFilterForm({ ...filterForm, dt_abertura_inicio: applyDateMask(e.target.value) })}
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm mb-1" style={{ color: '#666' }}>
              Data de abertura (fim)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="DD/MM/AAAA"
              className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
              value={filterForm.dt_abertura_fim}
              onChange={(e) => setFilterForm({ ...filterForm, dt_abertura_fim: applyDateMask(e.target.value) })}
            />
          </div>

          <div className="sm:col-span-6">
            <label className="block text-sm mb-1" style={{ color: '#666' }}>
              Razão social
            </label>
            <input
              className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
              value={filterForm.ds_razao_social}
              onChange={(e) => setFilterForm({ ...filterForm, ds_razao_social: e.target.value })}
            />
          </div>

          <div className="sm:col-span-6">
            <label className="block text-sm mb-1" style={{ color: '#666' }}>
              Nome fantasia
            </label>
            <input
              className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
              value={filterForm.ds_nome_fantasia}
              onChange={(e) => setFilterForm({ ...filterForm, ds_nome_fantasia: e.target.value })}
            />
          </div>

          <div className="sm:col-span-6">
            <label className="block text-sm mb-1" style={{ color: '#666' }}>
              Inscrição estadual
            </label>
            <input
              maxLength={20}
              className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
              value={filterForm.nr_inscricao_estadual}
              onChange={(e) => setFilterForm({ ...filterForm, nr_inscricao_estadual: e.target.value })}
            />
          </div>

          <div className="sm:col-span-6">
            <label className="block text-sm mb-1" style={{ color: '#666' }}>
              Inscrição municipal
            </label>
            <input
              maxLength={20}
              className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
              value={filterForm.nr_inscricao_municipal}
              onChange={(e) => setFilterForm({ ...filterForm, nr_inscricao_municipal: e.target.value })}
            />
          </div>

          <div className="sm:col-span-6">
            <label className="block text-sm mb-1" style={{ color: '#666' }}>
              Telefone
            </label>
            <input
              inputMode="numeric"
              maxLength={15}
              className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
              value={filterForm.nr_telefone}
              onChange={(e) => setFilterForm({ ...filterForm, nr_telefone: applyPhoneMask(e.target.value) })}
            />
          </div>

          <div className="sm:col-span-6">
            <label className="block text-sm mb-1" style={{ color: '#666' }}>
              E-mail
            </label>
            <input
              className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
              value={filterForm.ds_email}
              onChange={(e) => setFilterForm({ ...filterForm, ds_email: e.target.value })}
            />
          </div>

          <div className="sm:col-span-6">
            <label className="block text-sm mb-1" style={{ color: '#666' }}>
              UF
            </label>
            <Select
              value={filterForm.sg_estado}
              onChange={(v) => setFilterForm({ ...filterForm, sg_estado: v })}
              options={estados}
            />
          </div>

          <div className="sm:col-span-6">
            <label className="block text-sm mb-1" style={{ color: '#666' }}>
              Cidade
            </label>
            <div className="flex items-center gap-2 flex-nowrap">
              <div style={{ width: 100 }}>
                <input
                  inputMode="numeric"
                  maxLength={7}
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none"
                  value={filterForm.cd_ibge_cidade}
                  onChange={(e) => setFilterForm({ ...filterForm, cd_ibge_cidade: e.target.value.replace(/\D/g, '').slice(0, 7) })}
                />
              </div>
              <div className="relative flex-1 min-w-0">
                <input
                  readOnly
                  className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-10 py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none"
                  value={filterCidadeNome}
                />
                <button
                  type="button"
                  onClick={onOpenCidadeLookup}
                  className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-[34px] w-[34px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup"
                  aria-label="Localizar cidade"
                >                    <SearchIcon />
                </button>
              </div>
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
