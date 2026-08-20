"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Manutencao } from "@/types/manutencao";
import { FIELD_INFOS, formatDate } from "@/lib/manutencaoUtils";
import { applyDateMask } from "@/lib/pessoaFisicaUtils";
import { CAMPOS_POR_FUNCAO, type CampoStatus } from "@/lib/camposConfigUtils";
import Select from "@/components/ui/Select";
import RequiredAsterisk from "@/components/ui/RequiredAsterisk";
import FieldInfoPopup from "@/components/ui/FieldInfoPopup";
import LoadingModal from "@/components/ui/LoadingModal";
import ViewIcon from "@/components/ui/ViewIcon";
import SearchIcon from "@/components/ui/SearchIcon";

export type ManutencaoFormData = Omit<Manutencao, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao" | "ds_usuario_criacao" | "ds_usuario_alteracao">;

interface FormViewProps {
  message: string;
  editingId: string | null;
  sequence?: number | null;
  form: ManutencaoFormData;
  setForm: React.Dispatch<React.SetStateAction<ManutencaoFormData>>;
  submitting: boolean;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  goToList: () => void;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  onOpenAudit?: (manutencaoId?: string | null) => void;
  onPrevRecord: () => void;
  onNextRecord: () => void;
  hasPrevRecord: boolean;
  hasNextRecord: boolean;
  /** Opções de Ativos para o campo locator (nr_sequencia + ds_ativo). */
  ativos?: { nr_sequencia: number; ds_ativo: string }[];
  /** Nome resolvido do ativo selecionado. */
  ativoName?: string;
  /** Abre o lookup de Ativos. */
  onOpenAtivoLookup?: () => void;
  /** Abre o modal de visualização de um ativo. */
  onViewAtivo?: (nrSequencia: number | undefined) => void;
  /** Nome resolvido do prestador de serviço (pessoa física). */
  prestadorName?: string;
  /** Abre o lookup de Prestador de serviço. */
  onOpenPrestadorLookup?: () => void;
  /** Abre o modal de visualização de uma pessoa física (prestador). */
  onViewPrestador?: (nrSequencia: number | undefined) => void;
  selectOptions: { value: string; label: string }[];
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  allowedSubmodulos?: string[];
  campoRegras?: Record<string, CampoStatus>;
  campoErros?: string[];
}

function applyCurrencyMask(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const num = Number(digits) / 100;
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ManutencaoFormView({
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
  ativos = [],
  ativoName = "",
  onOpenAtivoLookup,
  onViewAtivo,
  prestadorName = "",
  onOpenPrestadorLookup,
  onViewPrestador,
  selectOptions,
  manageSelection,
  onManageSelectionChange,
  allowedSubmodulos = ["manutencoes"],
  campoRegras,
  campoErros = [],
}: FormViewProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [infoPopupField, setInfoPopupField] = useState<string | null>(null);
  const [infoAnchor, setInfoAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (submitting) return;
        const f = formRef.current;
        if (!f) return;
        if (typeof (f as any).requestSubmit === "function") {
          (f as any).requestSubmit();
        } else {
          const btn = f.querySelector('button[type="submit"]') as HTMLButtonElement | null;
          if (btn) btn.click();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [submitting]);

  function statusDe(campo: string): CampoStatus {
    return campoRegras?.[campo] ?? "N";
  }

  function inputClass(campo: string, base = "w-full rounded-[3px] border bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"): string {
    return campoErros.includes(campo) ? `${base} border-red-500` : `${base} border-slate-300`;
  }

  const camposConfiguraveis = new Set(
    CAMPOS_POR_FUNCAO.manutencoes?.map((c) => c.key.replace("pat_manutencao.", "")) ?? []
  );

  function renderFieldLabel(fieldKey: keyof typeof FIELD_INFOS, label: string) {
    const meta = FIELD_INFOS[fieldKey];
    const obrigatorio = camposConfiguraveis.has(String(fieldKey)) && statusDe(String(fieldKey)) === "O";
    return (
      <div className="block text-sm mb-1" style={{ color: "#666" }}>
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
            className={`inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer transition-none ${infoPopupField === fieldKey ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <circle cx="12" cy="16" r="0.5" />
            </svg>
          </button>
          {infoPopupField === fieldKey && meta && (
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

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {submitting && <LoadingModal open message="Carregando..." />}
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
              className={hasPrevRecord ? "inline-flex items-center justify-center rounded-[3px] border border-slate-300 bg-[#ddd] px-[5px] py-[5px] text-sm text-black cursor-pointer hover:bg-slate-300" : "inline-flex items-center justify-center rounded-[3px] border border-slate-300 bg-[#ddd] px-[5px] py-[5px] text-sm text-black opacity-40 cursor-pointer"}
              style={{ borderBottomColor: "#000" }}
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
              className={hasNextRecord ? "inline-flex items-center justify-center rounded-[3px] border border-slate-300 bg-[#ddd] px-[5px] py-[5px] text-sm text-black cursor-pointer hover:bg-slate-300" : "inline-flex items-center justify-center rounded-[3px] border border-slate-300 bg-[#ddd] px-[5px] py-[5px] text-sm text-black opacity-40 cursor-pointer"}
              style={{ borderBottomColor: "#000" }}
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
                {renderFieldLabel("nr_sequencia", "Sequência")}
                <input disabled value={String(sequence ?? "")} className="w-full rounded-[3px] border border-slate-300 px-2 py-1.5 text-sm transition focus:outline-none" />
              </div>

              <div className="sm:col-span-11 group">
                {renderFieldLabel("nr_seq_ativo", "Ativo")}
                <div className="flex items-center gap-2 flex-nowrap">
                  <div style={{ width: 110 }}>
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      disabled
                      className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 py-1.5 text-sm text-slate-500 transition focus:outline-none cursor-default"
                      value={form.nr_seq_ativo ? String(form.nr_seq_ativo) : ""}
                    />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <input
                      readOnly
                      className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none"
                      value={ativoName}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      {form.nr_seq_ativo && (
                        <button type="button" onClick={() => onViewAtivo?.(form.nr_seq_ativo)} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Visualizar ativo">
                          <ViewIcon size={16} />
                        </button>
                      )}
                      <button type="button" disabled className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-default opacity-40" aria-label="Localizar ativo">
                        <SearchIcon size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Dados da manutenção ── */}
          <section>
            <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Dados da manutenção</h2>
            <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
              <div className="sm:col-span-6 group">
                {renderFieldLabel("nr_seq_pessoa_fisica", "Prestador de serviço")}
                <div className="flex items-center gap-2 flex-nowrap">
                  <div style={{ width: 110 }}>
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      disabled
                      className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 py-1.5 text-sm text-slate-500 transition focus:outline-none cursor-default"
                      value={form.nr_seq_pessoa_fisica ? String(form.nr_seq_pessoa_fisica) : ""}
                    />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <input
                      readOnly
                      className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none"
                      value={prestadorName}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      {form.nr_seq_pessoa_fisica && (
                        <button type="button" onClick={() => onViewPrestador?.(form.nr_seq_pessoa_fisica)} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Visualizar prestador de serviço">
                          <ViewIcon size={16} />
                        </button>
                      )}
                      <button type="button" disabled className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-default opacity-40" aria-label="Localizar prestador de serviço">
                        <SearchIcon size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-6 group">
                {renderFieldLabel("vl_total", "Valor total")}
                <input
                  type="text"
                  disabled
                  className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 py-1.5 text-sm text-slate-500 transition focus:outline-none cursor-default"
                  value={form.vl_total != null ? applyCurrencyMask(String(form.vl_total)) : ""}
                />
              </div>

              <div className="sm:col-span-6 group">
                {renderFieldLabel("dt_envio", "Data de envio")}
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  disabled
                  className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 py-1.5 text-sm text-slate-500 transition focus:outline-none cursor-default"
                  value={form.dt_envio ?? ""}
                />
              </div>

              <div className="sm:col-span-6 group">
                {renderFieldLabel("dt_retorno", "Data de retorno")}
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  disabled={statusDe("dt_retorno") === "D"}
                  className={`${inputClass("dt_retorno")} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                  value={form.dt_retorno ?? ""}
                  onChange={(e) => setForm({ ...form, dt_retorno: applyDateMask(e.target.value) })}
                />
              </div>
            </div>
          </section>

          {/* ── Observações ── */}
          <section>
            <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Observações</h2>
            <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
              <div className="sm:col-span-12 group">
                {renderFieldLabel("ds_observacao", "Observação")}
                <textarea
                  rows={4}
                  disabled={statusDe("ds_observacao") === "D"}
                  className={`${inputClass("ds_observacao", "w-full rounded-[3px] border bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none resize-none")} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                  value={form.ds_observacao ?? ""}
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
                  <span>Criado por {createdBy || "-"} em {createdAt ? formatDate(createdAt) : "-"}</span>
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
                  <span>Alterado por {updatedBy || "-"} em {updatedAt ? formatDate(updatedAt) : "-"}</span>
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
              <button type="button" onClick={goToList} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: "#bdbdbd", borderBottomColor: "#000" } as React.CSSProperties}>
                Cancelar
              </button>
              <button type="submit" disabled={submitting} className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:opacity-50" style={{ backgroundColor: "#003056", borderBottomColor: "#000" } as React.CSSProperties}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
