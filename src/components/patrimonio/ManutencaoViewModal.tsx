"use client";

import type { Manutencao } from "@/types/manutencao";
import { formatDate } from "@/lib/pessoaFisicaUtils";
import ViewIcon from "@/components/ui/ViewIcon";

interface ManutencaoViewModalProps {
  manutencao: Manutencao | null;
  /** Nome do ativo vinculado. */
  ativoName?: string;
  /** Nome do prestador de serviço (PF ou PJ). */
  prestadorName?: string;
  onClose: () => void;
}

interface CampoDef {
  key: string;
  label: string;
  span: number;
}

const SECOES: { titulo: string; campos: CampoDef[] }[] = [
  {
    titulo: "Dados da manutenção",
    campos: [
      { key: "dt_envio", label: "Data de envio", span: 3 },
      { key: "dt_termino", label: "Data de término", span: 3 },
      { key: "ie_status_manutencao", label: "Status", span: 3 },
      { key: "vl_total", label: "Valor total", span: 3 },
    ],
  },
  {
    titulo: "Observações",
    campos: [
      { key: "ds_motivo_manutencao", label: "Motivo da manutenção", span: 12 },
      { key: "ds_correcoes", label: "Correções", span: 12 },
      { key: "ds_observacao", label: "Observação", span: 12 },
    ],
  },
];

// Tailwind não gera classes dinâmicas — mapa estático de spans usados.
const SPAN_CLASS: Record<number, string> = {
  2: "sm:col-span-2",
  3: "sm:col-span-3",
  4: "sm:col-span-4",
  6: "sm:col-span-6",
  10: "sm:col-span-10",
  12: "sm:col-span-12",
};

function formatCurrencyBRL(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === 'string') return value;
  const num = Number(value);
  if (isNaN(num)) return String(value);
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatCellValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (key === "dt_envio" || key === "dt_termino" || key === "dt_criacao" || key === "dt_alteracao") {
    const str = String(value);
    if (!str) return "";
    try {
      const d = new Date(str);
      if (isNaN(d.getTime())) return str;
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return str;
    }
  }
  if (key === "vl_total") {
    return formatCurrencyBRL(value);
  }
  if (key === "ie_status_manutencao") {
    const map: Record<string, string> = { E: "Em andamento", CO: "Concluída", CA: "Cancelada" };
    return map[String(value)] ?? String(value);
  }
  return String(value);
}

export default function ManutencaoViewModal({ manutencao, ativoName, prestadorName, onClose }: ManutencaoViewModalProps) {
  if (!manutencao) return null;

  const prestadorSeq = manutencao.nr_seq_prestador_servico;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[640px] max-h-[85vh] bg-white modal-dark p-0 shadow-xl shadow-black/20 flex flex-col">
        <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
          <h2 className="text-base font-semibold" style={{ color: '#000' }}>Manutenção</h2>
          <button type="button" onClick={onClose} className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2" aria-label="Fechar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto px-[15px] pt-[15px] pb-[15px] flex-1">
          <section>
            <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Identificação</h2>
            <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
              <div className="sm:col-span-4 group">
                <label className="block text-sm mb-1" style={{ color: "#666" }}>Sequência</label>
                <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={manutencao.nr_sequencia} />
              </div>
              <div className="sm:col-span-8 group">
                <label className="block text-sm mb-1" style={{ color: "#666" }}>Ativo</label>
                <div className="flex items-center gap-2 flex-nowrap">
                  <div style={{ width: 110 }}>
                    <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={manutencao.nr_seq_ativo ?? ""} />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <input readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 pr-[38px] py-1.5 text-sm" value={ativoName ?? ""} />
                    {manutencao.nr_seq_ativo != null && (
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                        <button type="button" className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Visualizar ativo">
                          <ViewIcon size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="sm:col-span-12 group">
                <label className="block text-sm mb-1" style={{ color: "#666" }}>Prestador de serviço</label>
                <div className="flex items-center gap-2 flex-nowrap">
                  <div style={{ width: 110 }}>
                    <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={prestadorSeq ?? ""} />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <input readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 pr-[38px] py-1.5 text-sm" value={prestadorName ?? ""} />
                    {prestadorSeq != null && (
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                        <button type="button" className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Visualizar prestador de serviço">
                          <ViewIcon size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Dados da manutenção ── */}
          <section>
            <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Dados da manutenção</h2>
            <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
              <div className="sm:col-span-3 group">
                <label className="block text-sm mb-1" style={{ color: "#666" }}>Data de envio</label>
                <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={formatCellValue("dt_envio", manutencao.dt_envio)} />
              </div>
              <div className="sm:col-span-3 group">
                <label className="block text-sm mb-1" style={{ color: "#666" }}>Data de término</label>
                <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={formatCellValue("dt_termino", manutencao.dt_termino)} />
              </div>
              <div className="sm:col-span-3 group">
                <label className="block text-sm mb-1" style={{ color: "#666" }}>Status</label>
                <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={formatCellValue("ie_status_manutencao", manutencao.ie_status_manutencao)} />
              </div>
              <div className="sm:col-span-3 group">
                <label className="block text-sm mb-1" style={{ color: "#666" }}>Valor total</label>
                <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={formatCellValue("vl_total", manutencao.vl_total)} />
              </div>
            </div>
          </section>

          {/* ── Observações ── */}
          <section>
            <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Observações</h2>
            <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
              <div className="sm:col-span-12 group">
                <label className="block text-sm mb-1" style={{ color: "#666" }}>Motivo da manutenção</label>
                <textarea disabled readOnly rows={3} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm resize-none" value={manutencao.ds_motivo_manutencao ?? ""} />
              </div>
              <div className="sm:col-span-12 group">
                <label className="block text-sm mb-1" style={{ color: "#666" }}>Correções</label>
                <textarea disabled readOnly rows={3} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm resize-none" value={manutencao.ds_correcoes ?? ""} />
              </div>
              <div className="sm:col-span-12 group">
                <label className="block text-sm mb-1" style={{ color: "#666" }}>Observação</label>
                <textarea disabled readOnly rows={4} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm resize-none" value={manutencao.ds_observacao ?? ""} />
              </div>
            </div>
          </section>

          <div className="text-[13px] text-slate-500 mt-4">
            <div>Criado por {manutencao.ds_usuario_criacao || "-"} em {manutencao.dt_criacao ? formatDate(manutencao.dt_criacao) : "-"}</div>
            <div className="mt-1">Alterado por {manutencao.ds_usuario_alteracao || "-"} em {manutencao.dt_alteracao ? formatDate(manutencao.dt_alteracao) : "-"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
