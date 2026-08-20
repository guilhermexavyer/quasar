"use client";

import type { Colaborador } from "@/types/colaborador";
import { formatDate } from "@/lib/pessoaFisicaUtils";

interface ColaboradorViewModalProps {
  colaborador: Colaborador | null;
  /** Nome da pessoa física vinculada. */
  pessoaFisicaName?: string;
  /** Nome da pessoa jurídica vinculada. */
  pessoaJuridicaName?: string;
  /** Descrição do vínculo contratual. */
  vinculoContratualName?: string;
  onClose: () => void;
}

const SPAN_CLASS: Record<number, string> = {
  1: "sm:col-span-1",
  2: "sm:col-span-2",
  3: "sm:col-span-3",
  4: "sm:col-span-4",
  6: "sm:col-span-6",
  9: "sm:col-span-9",
  12: "sm:col-span-12",
};

function formatStatus(value: unknown): string {
  if (value === "A" || value === "a") return "Ativo";
  if (value === "I" || value === "i") return "Inativo";
  return String(value ?? "");
}

export default function ColaboradorViewModal({
  colaborador,
  pessoaFisicaName = "",
  pessoaJuridicaName = "",
  vinculoContratualName = "",
  onClose,
}: ColaboradorViewModalProps) {
  if (!colaborador) return null;

  const col = colaborador;

  function inputVal(key: keyof Colaborador): string {
    const raw = col[key];
    if (raw === null || raw === undefined || raw === "") return "";
    if (key === "nr_seq_pessoa_fisica") return pessoaFisicaName || String(raw);
    if (key === "nr_seq_pessoa_juridica") return pessoaJuridicaName || String(raw);
    if (key === "nr_seq_vinculo_contratual") return vinculoContratualName || String(raw);
    if (key === "ie_status") return formatStatus(raw);
    return String(raw);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-[1000px] bg-white modal-dark p-0 shadow-xl shadow-black/20 max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 flex items-center justify-between bg-[#ccc] px-[15px]">
          <h3 className="text-base font-semibold" style={{ color: "#000" }}>Colaborador</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
            aria-label="Fechar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-[15px] overflow-auto">
          <div className="space-y-8">
            {/* ── Identificação ── */}
            <section>
              <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Identificação</h2>
              <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
                <div className="sm:col-span-1 group">
                  <label className="block text-sm mb-1" style={{ color: "#666" }}>Sequência</label>
                  <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={String(colaborador.nr_sequencia ?? "")} />
                </div>
                <div className="sm:col-span-5 group">
                  <label className="block text-sm mb-1" style={{ color: "#666" }}>Pessoa física</label>
                  <div className="relative">
                    <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 pr-[38px] py-1.5 text-sm" value={inputVal("nr_seq_pessoa_fisica")} />
                  </div>
                </div>
                <div className="sm:col-span-6 group">
                  <label className="block text-sm mb-1" style={{ color: "#666" }}>Pessoa jurídica</label>
                  <div className="relative">
                    <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 pr-[38px] py-1.5 text-sm" value={inputVal("nr_seq_pessoa_juridica")} />
                  </div>
                </div>
                <div className="sm:col-span-4 group">
                  <label className="block text-sm mb-1" style={{ color: "#666" }}>Vínculo contratual</label>
                  <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={inputVal("nr_seq_vinculo_contratual")} />
                </div>
                <div className="sm:col-span-2 group">
                  <label className="block text-sm mb-1" style={{ color: "#666" }}>Matrícula</label>
                  <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={inputVal("nr_matricula")} />
                </div>
                <div className="sm:col-span-3 group">
                  <label className="block text-sm mb-1" style={{ color: "#666" }}>Data de admissão</label>
                  <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={inputVal("dt_admissao")} />
                </div>
                <div className="sm:col-span-3 group">
                  <label className="block text-sm mb-1" style={{ color: "#666" }}>Status</label>
                  <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={inputVal("ie_status")} />
                </div>
                <div className="sm:col-span-12 group">
                  <div className="flex gap-8">
                    <div>
                      <label className="block text-sm mb-1" style={{ color: "#666" }}>Fornecedor</label>
                      <label className="inline-flex items-center gap-2 text-sm opacity-50">
                        <input type="checkbox" className="cg-checkbox" disabled checked={colaborador.ie_fornecedor === "S"} readOnly />
                        <span>Sim</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm mb-1" style={{ color: "#666" }}>Prestador de serviço</label>
                      <label className="inline-flex items-center gap-2 text-sm opacity-50">
                        <input type="checkbox" className="cg-checkbox" disabled checked={colaborador.ie_prestador_servico === "S"} readOnly />
                        <span>Sim</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="text-[13px] text-slate-500">
              <div>Criado por {colaborador.ds_usuario_criacao || "-"} em {colaborador.dt_criacao ? formatDate(colaborador.dt_criacao) : "-"}</div>
              <div className="mt-1">Alterado por {colaborador.ds_usuario_alteracao || "-"} em {colaborador.dt_alteracao ? formatDate(colaborador.dt_alteracao) : "-"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
