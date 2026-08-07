"use client";

import { useEffect, useRef, useState } from "react";
import type { Aluno, AlunoResponsavel } from "@/types/aluno";
import { FIELD_INFOS, applyDateMask, formatDate } from "@/lib/alunoUtils";
import type { CampoStatus } from "@/lib/camposConfigUtils";
import Select from "@/components/ui/Select";
import RequiredAsterisk from "@/components/ui/RequiredAsterisk";
import ViewIcon from "@/components/ui/ViewIcon";

export type AlunoFormData = Omit<Aluno, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao">;

interface FormViewProps {
  message: string;
  editingId: string | null;
  sequence?: number | null;
  form: AlunoFormData;
  setForm: React.Dispatch<React.SetStateAction<AlunoFormData>>;
  submitting: boolean;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  goToList: () => void;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  onOpenAudit?: (alunoId?: string | null) => void;
  onPrevRecord: () => void;
  onNextRecord: () => void;
  hasPrevRecord: boolean;
  hasNextRecord: boolean;
  /** Nome da pessoa física vinculada ao aluno (Identificação). */
  pessoaFisicaName: string;
  onOpenPessoaFisicaLookup: () => void;
  /** Abre o modal de visualização da pessoa física (Identificação). */
  onViewPessoaFisica?: (nrSequencia: number | undefined) => void;
  /** Nomes das pessoas físicas responsáveis (Responsáveis), por linha. */
  responsaveisNames: string[];
  onOpenResponsavelLookup: (index: number) => void;
  /** Abre o modal de visualização de um responsável (Responsáveis). */
  onViewResponsavel?: (nrSequencia: number | undefined) => void;
  /** Opções do dropdown "Grau de parentesco" (Responsáveis). */
  grauParentescoOptions?: { value: string; label: string }[];
  selectOptions: { value: string; label: string }[];
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  /** Submódulos permitidos do dropdown PAI (Alunos/Colaboradores) conforme permissões. */
  allowedSubmodulos?: string[];
  /** Regras de campos por perfil (colecao aluno): campo → status. */
  campoRegras?: Record<string, CampoStatus>;
  /** Campos obrigatórios vazios no último submit (borda vermelha). */
  campoErros?: string[];
}

export default function AlunoFormView({
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
  responsaveisNames,
  onOpenResponsavelLookup,
  onViewResponsavel,
  grauParentescoOptions = [],
  selectOptions,
  manageSelection,
  onManageSelectionChange,
  allowedSubmodulos = ['alunos', 'colaboradores'],
  campoRegras = {},
  campoErros = [],
}: FormViewProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [infoPopupField, setInfoPopupField] = useState<keyof typeof FIELD_INFOS | null>(null);
  const infoPopupRef = useRef<HTMLDivElement | null>(null);

  function statusDe(campo: string): CampoStatus {
    return campoRegras?.[campo] ?? 'N';
  }

  function inputClass(campo: string, base = "w-full rounded-[3px] border bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"): string {
    return campoErros.includes(campo)
      ? `${base} border-red-500`
      : `${base} border-slate-300`;
  }

  /** Atualiza um responsável pelo índice. */
  function atualizarResponsavel(index: number, patch: Partial<AlunoResponsavel>): AlunoFormData {
    const responsaveis = [...(form.responsaveis ?? [])];
    responsaveis[index] = { ...(responsaveis[index] ?? {}), ...patch };
    return { ...form, responsaveis };
  }

  /** Adiciona uma nova linha vazia de responsável logo abaixo da atual. */
  function adicionarResponsavel(index: number): AlunoFormData {
    const responsaveis = [...(form.responsaveis ?? [])];
    responsaveis.splice(index + 1, 0, { nr_seq_responsavel: undefined, nr_seq_grau_parentesco: undefined });
    return { ...form, responsaveis };
  }

  /** Remove um responsável pelo índice (mantém ao menos uma linha vazia). */
  function removerResponsavel(index: number): AlunoFormData {
    const responsaveis = [...(form.responsaveis ?? [])];
    responsaveis.splice(index, 1);
    if (responsaveis.length === 0) {
      responsaveis.push({ nr_seq_responsavel: undefined, nr_seq_grau_parentesco: undefined });
    }
    return { ...form, responsaveis };
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

              <div className="sm:col-span-6 group">
                {renderFieldLabel('nr_seq_pessoa_fisica', 'Pessoa física')}
                <div className="flex items-center gap-2 flex-nowrap">
                  <div style={{ width: 110 }}>
                    <label className="sr-only">Sequência da pessoa física</label>
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      disabled={statusDe('nr_seq_pessoa_fisica') === 'D'}
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
                      className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                      value={pessoaFisicaName}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      {form.nr_seq_pessoa_fisica && (
                        <button
                          type="button"
                          onClick={() => onViewPessoaFisica?.(form.nr_seq_pessoa_fisica)}
                          className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer text-black disabled:cursor-default disabled:opacity-40"
                          aria-label="Visualizar pessoa física"
                          title="Visualizar pessoa física"
                        >
                          <ViewIcon />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={onOpenPessoaFisicaLookup}
                        disabled={statusDe('nr_seq_pessoa_fisica') === 'D'}
                        className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer text-black disabled:cursor-default disabled:opacity-40"
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
              </div>

              <div className="sm:col-span-5 group">
                {renderFieldLabel('nr_matricula', 'Matrícula')}
                <input
                  disabled={statusDe('nr_matricula') === 'D'}
                  className={`${inputClass('nr_matricula')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                  value={form.nr_matricula}
                  onChange={(e) => setForm({ ...form, nr_matricula: e.target.value })}
                />
              </div>

              <div className="sm:col-span-4 group">
                {renderFieldLabel('dt_ingresso', 'Data de ingresso')}
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  disabled={!!editingId || statusDe('dt_ingresso') === 'D'}
                  className={`${inputClass('dt_ingresso', "w-full rounded-[3px] border bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]")} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                  value={form.dt_ingresso}
                  onChange={(e) => setForm({ ...form, dt_ingresso: applyDateMask(e.target.value) })}
                />
              </div>

              <div className="sm:col-span-4 group">
                {renderFieldLabel('ie_status', 'Status')}
                <Select
                  disabled
                  error={campoErros.includes('ie_status')}
                  value={form.ie_status ?? 'A'}
                  onChange={(v) => setForm({ ...form, ie_status: v })}
                  options={[
                    { value: 'A', label: 'Ativo' },
                    { value: 'I', label: 'Inativo' },
                    { value: 'C', label: 'Cancelado' },
                    { value: 'T', label: 'Transferido' },
                  ]}
                  showPlaceholder={false}
                />
              </div>

              <div className="sm:col-span-4 group">
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

          {/* ── Responsáveis ── */}
          <section>
            <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Responsáveis</h2>
            <div className="space-y-[15px]">
              {(form.responsaveis ?? []).map((resp, index) => {
                const erroPessoa = campoErros.includes('nr_seq_responsavel') && !resp.nr_seq_responsavel;
                const erroGrau = campoErros.includes('nr_seq_grau_parentesco') && !resp.nr_seq_grau_parentesco;
                return (
                  <div key={index} className="grid gap-[15px] sm:grid-cols-12 items-start">
                    <div className="sm:col-span-7 group">
                      {index === 0 && renderFieldLabel('nr_seq_responsavel', 'Pessoa física')}
                      <div className="flex items-center gap-2 flex-nowrap">
                        <div style={{ width: 110 }}>
                          <label className="sr-only">Sequência da pessoa física responsável</label>
                          <input
                            inputMode="numeric"
                            maxLength={10}
                            disabled={statusDe('nr_seq_responsavel') === 'D'}
                            className={`w-full rounded-[3px] border bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa] ${erroPessoa ? 'border-red-500' : 'border-slate-300'} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                            value={resp.nr_seq_responsavel ? String(resp.nr_seq_responsavel) : ''}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setForm(atualizarResponsavel(index, { nr_seq_responsavel: raw ? Number(raw) : undefined }));
                            }}
                          />
                        </div>
                        <div className="relative flex-1 min-w-0">
                          <label className="sr-only">Nome da pessoa física responsável</label>
                          <input
                            readOnly
                            className={`w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa] ${erroPessoa ? 'border-red-500' : ''}`}
                            value={responsaveisNames[index] ?? ''}
                          />
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                            {resp.nr_seq_responsavel && (
                              <button
                                type="button"
                                onClick={() => onViewResponsavel?.(resp.nr_seq_responsavel)}
                                className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer text-black disabled:cursor-default disabled:opacity-40"
                                aria-label="Visualizar pessoa física responsável"
                                title="Visualizar pessoa física responsável"
                              >
                                <ViewIcon />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onOpenResponsavelLookup(index)}
                              disabled={statusDe('nr_seq_responsavel') === 'D'}
                              className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer text-black disabled:cursor-default disabled:opacity-40"
                              aria-label="Localizar pessoa física responsável"
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

                    <div className="sm:col-span-5 group">
                      {index === 0 && renderFieldLabel('nr_seq_grau_parentesco', 'Grau de parentesco')}
                      <div className="flex items-center gap-1">
                        <div className="flex-1 min-w-0">
                          <Select
                            disabled={statusDe('nr_seq_grau_parentesco') === 'D'}
                            error={erroGrau}
                            value={resp.nr_seq_grau_parentesco ? String(resp.nr_seq_grau_parentesco) : ''}
                            onChange={(v) =>
                              setForm(atualizarResponsavel(index, { nr_seq_grau_parentesco: v ? Number(v) : undefined }))
                            }
                            options={grauParentescoOptions}
                            showPlaceholder
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setForm(adicionarResponsavel(index))}
                          className="btn-responsavel inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center cursor-pointer text-slate-700 hover:border-[#003056] hover:text-[#003056]"
                          aria-label={`Adicionar responsável após o ${index + 1}`}
                          title="Adicionar responsável"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M12 5v14" />
                            <path d="M5 12h14" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm(removerResponsavel(index))}
                          disabled={(form.responsaveis ?? []).length <= 1}
                          className="btn-responsavel inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center cursor-pointer text-slate-700 hover:border-red-500 hover:text-red-600 disabled:cursor-default disabled:opacity-40 disabled:hover:border-[#999] disabled:hover:text-slate-700"
                          aria-label={`Remover responsável ${index + 1}`}
                          title="Remover responsável"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M5 12h14" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {(form.responsaveis ?? []).length === 0 && (
                <p className="text-sm text-slate-500">Nenhum responsável cadastrado.</p>
              )}
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
