"use client";

import { useEffect, useRef, useState } from "react";
import type { Colaborador } from "@/types/colaborador";
import { FIELD_INFOS, STATUS_OPTIONS, applyDateMask, formatDate } from "@/lib/colaboradorUtils";
import type { CampoStatus } from "@/lib/camposConfigUtils";
import Select from "@/components/ui/Select";
import RequiredAsterisk from "@/components/ui/RequiredAsterisk";
import FieldInfoPopup from "@/components/ui/FieldInfoPopup";
import ViewIcon from "@/components/ui/ViewIcon";
import SearchIcon from "@/components/ui/SearchIcon";

export type ColaboradorFormData = Omit<Colaborador, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao">;

interface FormViewProps {
  message: string;
  editingId: string | null;
  sequence?: number | null;
  form: ColaboradorFormData;
  setForm: React.Dispatch<React.SetStateAction<ColaboradorFormData>>;
  submitting: boolean;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  goToList: () => void;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  onOpenAudit?: (colaboradorId?: string | null) => void;
  onPrevRecord: () => void;
  onNextRecord: () => void;
  hasPrevRecord: boolean;
  hasNextRecord: boolean;
  /** Nome da pessoa física vinculada (Identificação). */
  pessoaFisicaName: string;
  onOpenPessoaFisicaLookup: () => void;
  /** Abre o modal de visualização da pessoa física (Identificação). */
  onViewPessoaFisica?: (nrSequencia: number | undefined) => void;
  /** Nome da pessoa jurídica vinculada (Identificação). */
  pessoaJuridicaName: string;
  onOpenPessoaJuridicaLookup: () => void;
  /** Abre o modal de visualização da pessoa jurídica (Identificação). */
  onViewPessoaJuridica?: (nrSequencia: number | undefined) => void;
  /** Opções de Cadastros Gerais > Vínculo contratual. */
  vinculosContratuais?: { nr_sequencia: number; descricao: string; ie_status?: string }[];
  selectOptions: { value: string; label: string }[];
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  /** Submódulos permitidos do dropdown PAI (Alunos/Colaboradores) conforme permissões. */
  allowedSubmodulos?: string[];
  /** Regras de campos por perfil (colecao colaborador): campo → status. */
  campoRegras?: Record<string, CampoStatus>;
  /** Campos obrigatórios vazios no último submit (borda vermelha). */
  campoErros?: string[];
}

export default function ColaboradorFormView({
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
  pessoaFisicaName,
  onOpenPessoaFisicaLookup,
  onViewPessoaFisica,
  pessoaJuridicaName,
  onOpenPessoaJuridicaLookup,
  onViewPessoaJuridica,
  vinculosContratuais = [],
  selectOptions,
  manageSelection,
  onManageSelectionChange,
  allowedSubmodulos = ['alunos', 'colaboradores'],
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

  // Quando um dos campos de pessoa (física ou jurídica) está preenchido,
  // o outro fica automaticamente desabilitado.
  const pessoaFisicaPreenchida = !!form.nr_seq_pessoa_fisica;
  const pessoaJuridicaPreenchida = !!form.nr_seq_pessoa_juridica;

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

              <div className="sm:col-span-5 group">
                {renderFieldLabel('nr_seq_pessoa_fisica', 'Pessoa física')}
                <div className="flex items-center gap-2 flex-nowrap">
                  <div style={{ width: 110 }}>
                    <label className="sr-only">Sequência da pessoa física</label>
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      disabled={statusDe('nr_seq_pessoa_fisica') === 'D' || pessoaJuridicaPreenchida}
                      className={`${inputClass('nr_seq_pessoa_fisica', "w-full rounded-[3px] border bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]")} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                      value={form.nr_seq_pessoa_fisica ? String(form.nr_seq_pessoa_fisica) : ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setForm({ ...form, nr_seq_pessoa_fisica: raw ? Number(raw) : undefined });
                      }}
                    />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <label className="sr-only">Nome da pessoa física</label>
                    <input
                      readOnly
                      disabled={pessoaJuridicaPreenchida}
                      className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa] disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500"
                      value={pessoaFisicaName}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      {form.nr_seq_pessoa_fisica && (
                        <button
                          type="button"
                          onClick={() => onViewPessoaFisica?.(form.nr_seq_pessoa_fisica)}
                          className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup disabled:cursor-default disabled:opacity-40"
                          aria-label="Visualizar pessoa física"
                        >
                          <ViewIcon />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={onOpenPessoaFisicaLookup}
                        disabled={statusDe('nr_seq_pessoa_fisica') === 'D' || pessoaJuridicaPreenchida}
                        className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup disabled:cursor-default disabled:opacity-40"
                        aria-label="Localizar pessoa física"
                      >
                        <SearchIcon />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-6 group">
                {renderFieldLabel('nr_seq_pessoa_juridica', 'Pessoa jurídica')}
                <div className="flex items-center gap-2 flex-nowrap">
                  <div style={{ width: 110 }}>
                    <label className="sr-only">Sequência da pessoa jurídica</label>
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      disabled={statusDe('nr_seq_pessoa_juridica') === 'D' || pessoaFisicaPreenchida}
                      className={`${inputClass('nr_seq_pessoa_juridica', "w-full rounded-[3px] border bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]")} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                      value={form.nr_seq_pessoa_juridica ? String(form.nr_seq_pessoa_juridica) : ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setForm({ ...form, nr_seq_pessoa_juridica: raw ? Number(raw) : undefined });
                      }}
                    />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <label className="sr-only">Razão social da pessoa jurídica</label>
                    <input
                      readOnly
                      disabled={pessoaFisicaPreenchida}
                      className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa] disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500"
                      value={pessoaJuridicaName}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      {form.nr_seq_pessoa_juridica && (
                        <button
                          type="button"
                          onClick={() => onViewPessoaJuridica?.(form.nr_seq_pessoa_juridica)}
                          className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup disabled:cursor-default disabled:opacity-40"
                          aria-label="Visualizar pessoa jurídica"
                        >
                          <ViewIcon />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={onOpenPessoaJuridicaLookup}
                        disabled={statusDe('nr_seq_pessoa_juridica') === 'D' || pessoaFisicaPreenchida}
                        className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup disabled:cursor-default disabled:opacity-40"
                        aria-label="Localizar pessoa jurídica"
                      >
                        <SearchIcon />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-12 grid gap-[15px] sm:grid-cols-12">
                <div className="sm:col-span-3 group">
                  {renderFieldLabel('nr_seq_vinculo_contratual', 'Vínculo contratual')}
                  <Select
                    disabled={statusDe('nr_seq_vinculo_contratual') === 'D'}
                    error={campoErros.includes('nr_seq_vinculo_contratual')}
                    value={form.nr_seq_vinculo_contratual ? String(form.nr_seq_vinculo_contratual) : ''}
                    onChange={(v) => setForm({ ...form, nr_seq_vinculo_contratual: v ? Number(v) : undefined })}
                    options={cgOptions(vinculosContratuais).map((op) => ({ value: String(op.nr_sequencia), label: op.descricao }))}
                  />
                </div>

                <div className="sm:col-span-2 group">
                  {renderFieldLabel('nr_matricula', 'Matrícula')}
                  <input
                    disabled
                    className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 py-1.5 text-sm text-slate-500 transition focus:outline-none disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500"
                    value={form.nr_matricula ?? ''}
                  />
                </div>

                <div className="sm:col-span-2 group">
                  {renderFieldLabel('dt_admissao', 'Data de admissão')}
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="DD/MM/AAAA"
                    disabled={!!editingId || statusDe('dt_admissao') === 'D'}
                    className={`${inputClass('dt_admissao', "w-full rounded-[3px] border bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]")} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                    value={form.dt_admissao}
                    onChange={(e) => setForm({ ...form, dt_admissao: applyDateMask(e.target.value) })}
                  />
                </div>

                <div className="sm:col-span-3 group">
                  {renderFieldLabel('ie_status', 'Status')}
                  <Select
                    disabled
                    error={campoErros.includes('ie_status')}
                    value={form.ie_status ?? 'A'}
                    onChange={(v) => setForm({ ...form, ie_status: v })}
                    options={STATUS_OPTIONS}
                    showPlaceholder={false}
                  />
                </div>

                <div className="sm:col-span-2 group">
                  {renderFieldLabel('dt_status', 'Data do status')}
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="DD/MM/AAAA"
                    disabled
                    className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 py-1.5 text-sm text-slate-500 transition focus:outline-none placeholder:text-[#aaa] disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500"
                    value={form.dt_status ?? ''}
                    onChange={(e) => setForm({ ...form, dt_status: applyDateMask(e.target.value) })}
                  />
                </div>
              </div>

              <div className="sm:col-span-12 group">
                <div className="flex gap-8">
                  <div>
                    {renderFieldLabel('ie_fornecedor', 'Fornecedor')}
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        className="cg-checkbox"
                        disabled={statusDe('ie_fornecedor') === 'D'}
                        checked={form.ie_fornecedor === 'S'}
                        onChange={() => setForm({ ...form, ie_fornecedor: form.ie_fornecedor === 'S' ? 'N' : 'S' })}
                      />
                      <span>Sim</span>
                    </label>
                  </div>
                  <div>
                    {renderFieldLabel('ie_prestador_servico', 'Prestador de serviço')}
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        className="cg-checkbox"
                        disabled={statusDe('ie_prestador_servico') === 'D'}
                        checked={form.ie_prestador_servico === 'S'}
                        onChange={() => setForm({ ...form, ie_prestador_servico: form.ie_prestador_servico === 'S' ? 'N' : 'S' })}
                      />
                      <span>Sim</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-12 group">
                {renderFieldLabel('ds_status', 'Motivo do status')}
                <textarea
                  disabled
                  className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 py-1.5 text-sm text-slate-500 transition focus:outline-none resize-none disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500"
                  rows={3}
                  value={form.ds_status ?? ''}
                  onChange={(e) => setForm({ ...form, ds_status: e.target.value })}
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
