"use client";

import { useEffect, useRef, useState } from "react";
import type { PessoaJuridica } from "@/types/pessoaJuridica";
import {
  PJ_FIELD_INFOS,
  applyCnpjMask,
} from "@/lib/pessoaJuridicaUtils";
import {
  applyCepMask,
  applyDateMask,
  applyPhoneMask,
  formatDate,
} from "@/lib/pessoaFisicaUtils";
import Select from "@/components/ui/Select";
import { buscarEnderecoPorCep } from "@/services/cepService";

export type FormData = Omit<PessoaJuridica, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao">;

export interface CgSelectOption {
  nr_sequencia: number;
  descricao: string;
  ie_status?: string;
  /** Sigla exibida no rótulo (usada no órgão emissor). */
  sigla?: string;
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
  cidadeNome: string;
  onOpenCidadeLookup: () => void;
  onCidadeCodeChange: (codigo: string) => void;
  logradouros?: CgSelectOption[];
  estados?: { value: string; label: string }[];
  selectOptions: { value: string; label: string }[];
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
}

export default function PessoaJuridicaFormView({
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
  cidadeNome,
  onOpenCidadeLookup,
  onCidadeCodeChange,
  logradouros = [],
  estados = [],
  selectOptions,
  manageSelection,
  onManageSelectionChange,
}: FormViewProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [infoPopupField, setInfoPopupField] = useState<keyof typeof PJ_FIELD_INFOS | null>(null);
  const infoPopupRef = useRef<HTMLDivElement | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const prevCepRef = useRef(form.nr_cep ?? '');

  // Apenas itens Ativos ficam disponíveis no dropdown; itens Inativos
  // (status 'I' em Cadastros Gerais) são ocultados.
  function cgOptions(options: CgSelectOption[]): CgSelectOption[] {
    return options
      .filter((op) => op.ie_status === 'A' || !op.ie_status)
      .sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR', { sensitivity: 'base' }));
  }

  // Normaliza um texto para comparação (remove acentos e pontuação, maiúsculas).
  function normalizeToken(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z]/g, '')
      .toUpperCase();
  }

  // Inferir o tipo de logradouro a partir do nome da rua retornado pelo ViaCEP
  // (ex.: "Rua das Flores" → "Rua", "Rod. Pres. Dutra" → "Rodovia").
  function inferirLogradouro(rua: string): number | undefined {
    const token = normalizeToken(rua.split(' ')[0] ?? '');
    if (!token) return undefined;

    let best: { op: CgSelectOption; score: number } | null = null;
    for (const op of cgOptions(logradouros)) {
      const descNorm = normalizeToken(op.descricao);
      const siglaNorm = normalizeToken(op.sigla ?? '');
      let score = 0;
      if (descNorm === token) score = 3;
      else if (siglaNorm && siglaNorm === token) score = 2;
      else if (descNorm.startsWith(token) && token.length >= 2) score = 1;
      if (score > 0 && (!best || score > best.score)) best = { op, score };
    }
    return best ? best.op.nr_sequencia : undefined;
  }

  function renderFieldLabel(fieldKey: keyof typeof PJ_FIELD_INFOS, label: string) {
    const meta = PJ_FIELD_INFOS[fieldKey];
    return (
      <div className="block text-sm mb-1" style={{ color: '#666' }}>
        <div className="relative group inline-flex items-center gap-2">
          <span>{label}</span>
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

  // Ao informar/altera um CEP completo (8 dígitos), consulta o ViaCEP e preenche
  // Rua, Bairro, Logradouro e UF. Não busca ao abrir um registro já salvo —
  // apenas quando o CEP muda após o mount.
  useEffect(() => {
    const current = form.nr_cep ?? '';
    if (current === prevCepRef.current) return;
    prevCepRef.current = current;

    const digits = current.replace(/\D/g, '');
    if (digits.length !== 8) {
      setCepLoading(false);
      return;
    }

    let cancelled = false;
    setCepLoading(true);
    buscarEnderecoPorCep(digits)
      .then((endereco) => {
        if (cancelled || !endereco) return;
        setForm((prev) => ({
          ...prev,
          ds_endereco: endereco.logradouro,
          ds_bairro: endereco.bairro,
          sg_estado: endereco.uf || prev.sg_estado,
          nr_seq_logradouro: inferirLogradouro(endereco.logradouro) ?? prev.nr_seq_logradouro,
        }));
      })
      .catch(() => {
        /* CEP não encontrado ou sem conexão — mantém os campos como estão */
      })
      .finally(() => {
        if (!cancelled) setCepLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.nr_cep, setForm]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-5">
          <Select
            value={manageSelection}
            onChange={onManageSelectionChange}
            options={selectOptions}
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
          {/* ── Dados da Empresa ── */}
          <section>
            <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Dados da Empresa</h2>
            <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
              <div className="sm:col-span-1 group">
                {renderFieldLabel('nr_sequencia', 'Sequência')}
                <input
                  disabled
                  value={String(sequence ?? '')}
                  className="w-full rounded-[3px] border border-slate-300 px-2 py-1.5 text-sm transition focus:outline-none"
                />
              </div>

              <div className="sm:col-span-11 group">
                {renderFieldLabel('ds_razao_social', 'Razão social')}
                <input
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={form.ds_razao_social}
                  onChange={(e) => setForm({ ...form, ds_razao_social: e.target.value })}
                />
              </div>

              <div className="sm:col-span-8 group">
                {renderFieldLabel('ds_nome_fantasia', 'Nome fantasia')}
                <input
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={form.ds_nome_fantasia}
                  onChange={(e) => setForm({ ...form, ds_nome_fantasia: e.target.value })}
                />
              </div>

              <div className="sm:col-span-4 group">
                {renderFieldLabel('dt_abertura', 'Data de abertura')}
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                  value={form.dt_abertura}
                  onChange={(e) =>
                    setForm({ ...form, dt_abertura: applyDateMask(e.target.value) })
                  }
                />
              </div>
            </div>
          </section>

          {/* ── Documentos ── */}
          <section>
            <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Documentos</h2>
            <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
              <div className="sm:col-span-4 group">
                {renderFieldLabel('nr_cnpj', 'CNPJ')}
                <input
                  inputMode="numeric"
                  maxLength={18}
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={form.nr_cnpj}
                  onChange={(e) => setForm({ ...form, nr_cnpj: applyCnpjMask(e.target.value) })}
                />
              </div>

              <div className="sm:col-span-4 group">
                {renderFieldLabel('nr_inscricao_estadual', 'Inscrição estadual')}
                <input
                  maxLength={20}
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={form.nr_inscricao_estadual}
                  onChange={(e) => setForm({ ...form, nr_inscricao_estadual: e.target.value })}
                />
              </div>

              <div className="sm:col-span-4 group">
                {renderFieldLabel('nr_inscricao_municipal', 'Inscrição municipal')}
                <input
                  maxLength={20}
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={form.nr_inscricao_municipal}
                  onChange={(e) => setForm({ ...form, nr_inscricao_municipal: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* ── Contatos ── */}
          <section>
            <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Contatos</h2>
            <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
              <div className="sm:col-span-6 group">
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
                {renderFieldLabel('ds_email', 'E-mail')}
                <input
                  type="email"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={form.ds_email}
                  onChange={(e) => setForm({ ...form, ds_email: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* ── Endereço ── */}
          <section>
            <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Endereço</h2>
            <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
              <div className="sm:col-span-3 group">
                {renderFieldLabel('nr_cep', 'CEP')}
                <input
                  inputMode="numeric"
                  maxLength={9}
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={form.nr_cep ?? ''}
                  onChange={(e) => setForm({ ...form, nr_cep: applyCepMask(e.target.value) })}
                />
              </div>

              <div className="sm:col-span-3 group">
                {renderFieldLabel('ds_endereco', 'Rua')}
                <input
                  className={`w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none ${cepLoading ? 'opacity-50' : ''}`}
                  value={form.ds_endereco ?? ''}
                  onChange={(e) => setForm({ ...form, ds_endereco: e.target.value })}
                />
              </div>

              <div className="sm:col-span-3 group">
                {renderFieldLabel('nr_seq_logradouro', 'Logradouro')}
                <Select
                  value={form.nr_seq_logradouro ? String(form.nr_seq_logradouro) : ''}
                  onChange={(v) => setForm({ ...form, nr_seq_logradouro: v ? Number(v) : undefined })}
                  options={cgOptions(logradouros).map((op) => ({
                    value: String(op.nr_sequencia),
                    label: op.descricao,
                  }))}
                />
              </div>

              <div className="sm:col-span-3 group">
                {renderFieldLabel('nr_endereco', 'Número')}
                <input
                  maxLength={10}
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={form.nr_endereco ?? ''}
                  onChange={(e) => setForm({ ...form, nr_endereco: e.target.value })}
                />
              </div>

              <div className="sm:col-span-6 group">
                {renderFieldLabel('ds_bairro', 'Bairro')}
                <input
                  className={`w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none ${cepLoading ? 'opacity-50' : ''}`}
                  value={form.ds_bairro ?? ''}
                  onChange={(e) => setForm({ ...form, ds_bairro: e.target.value })}
                />
              </div>

              <div className="sm:col-span-6 group">
                {renderFieldLabel('ds_complemento', 'Complemento')}
                <input
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={form.ds_complemento ?? ''}
                  onChange={(e) => setForm({ ...form, ds_complemento: e.target.value })}
                />
              </div>

              <div className="sm:col-span-3 group">
                {renderFieldLabel('sg_estado', 'UF')}
                <Select
                  value={form.sg_estado ?? ''}
                  onChange={(v) => setForm({ ...form, sg_estado: v })}
                  options={estados}
                />
              </div>

              <div className="sm:col-span-9 group">
                {renderFieldLabel('cd_ibge_cidade', 'Cidade')}
                <div className="flex items-center gap-2 flex-nowrap">
                  <div style={{ width: 100 }}>
                    <label className="sr-only">Código IBGE da cidade</label>
                    <input
                      inputMode="numeric"
                      maxLength={7}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none"
                      value={form.cd_ibge_cidade ?? ''}
                      onChange={(e) => onCidadeCodeChange(e.target.value.replace(/\D/g, '').slice(0, 7))}
                    />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <label className="sr-only">Nome da cidade</label>
                    <input
                      readOnly
                      className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-10 py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none"
                      value={cidadeNome}
                    />
                    <button
                      type="button"
                      onClick={onOpenCidadeLookup}
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
            </div>
          </section>
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
