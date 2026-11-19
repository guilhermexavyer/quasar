"use client";

import { useMemo, useState } from "react";
import RotuloCampo from "@/components/ui/RotuloCampo";

export interface ReferenciaLookupItem {
  nr_sequencia: number;
  descricao: string;
}

interface ReferenciaLookupModalProps {
  /** Título do modal (ex.: "Localizar curso"). */
  titulo: string;
  /** Coleção dos registros (usada nas informações dos rótulos). */
  colecao: string;
  /** Campo de descrição da coleção (ex.: ds_curso). */
  campoDescricao: string;
  registros: ReferenciaLookupItem[];
  onSelect: (item: ReferenciaLookupItem) => void;
  onClose: () => void;
}

const FILTRO_VAZIO = { nr_sequencia: '', descricao: '' };
const CLASSE_INPUT = "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none";

/**
 * Lookup simples (Sequência + Descrição) para registros de referência, no mesmo visual dos
 * demais lookups: filtros à esquerda (Limpar/Filtrar) e resultados à direita; duplo clique
 * em uma linha seleciona o registro.
 */
export default function ReferenciaLookupModal({ titulo, colecao, campoDescricao, registros, onSelect, onClose }: ReferenciaLookupModalProps) {
  const [form, setForm] = useState(FILTRO_VAZIO);
  const [filtro, setFiltro] = useState<typeof FILTRO_VAZIO | null>(null);

  const resultado = useMemo(() => {
    if (!filtro) return [];
    const seq = filtro.nr_sequencia.trim();
    const desc = filtro.descricao.trim().toLowerCase();
    return registros
      .filter((r) => (!seq || String(r.nr_sequencia) === seq) && (!desc || r.descricao.toLowerCase().includes(desc)))
      .sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR'));
  }, [registros, filtro]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[960px] bg-white p-0 shadow-xl shadow-black/20 h-[600px] max-h-[90vh] overflow-hidden">
        <div className="flex h-full">
          <form
            className="w-[320px] lookup-left flex flex-col min-h-0"
            onSubmit={(e) => { e.preventDefault(); setFiltro(form); }}
          >
            <div className="p-[15px] overflow-auto flex-1 min-h-0">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-base font-semibold" style={{ color: '#000' }}>{titulo}</h2>
                <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0" aria-label={`Fechar ${titulo.toLowerCase()}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <RotuloCampo texto="Sequência" colecao={colecao} campo="nr_sequencia" />
                  <input inputMode="numeric" maxLength={10} className={CLASSE_INPUT} value={form.nr_sequencia} onChange={(e) => setForm({ ...form, nr_sequencia: e.target.value.replace(/[^0-9]/g, '') })} />
                </div>
                <div>
                  <RotuloCampo texto="Descrição" colecao={colecao} campo={campoDescricao} />
                  <input className={CLASSE_INPUT} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center justify-end gap-2 p-[15px]">
              <button type="button" onClick={() => { setForm(FILTRO_VAZIO); setFiltro(null); }} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#ddd', borderBottomColor: '#000' }}>Limpar</button>
              <button type="submit" className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#003056', borderBottomColor: '#000' }}>Filtrar</button>
            </div>
          </form>
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col lookup-right">
            {resultado.length === 0 ? (
              <div className="flex h-full items-center justify-center p-[15px] text-sm text-slate-600">Nenhum registro encontrado.</div>
            ) : (
              <div className="flex-1 p-[15px] min-h-0 overflow-auto">
                <table className="text-sm w-full" style={{ tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr className="bg-[#bbb]">
                      {['#', 'Descrição'].map((rotulo, i) => (
                        <th
                          key={rotulo}
                          scope="col"
                          className="sticky top-0 z-30 bg-[#bbb] px-[10px] py-[3px] text-left text-sm font-semibold text-slate-900 align-middle border-r border-b last:border-r-0 border-[#666] select-none whitespace-nowrap"
                          style={{ borderRightColor: '#666', borderBottomColor: '#999', boxShadow: 'inset 0 -1px 0 #999', width: i === 0 ? 80 : undefined }}
                        >
                          {rotulo}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {resultado.map((r) => (
                      <tr key={r.nr_sequencia} className="cursor-pointer hover:bg-[#eee]" onDoubleClick={() => onSelect(r)}>
                        <td className="px-[10px] py-[3px] align-middle text-right truncate" style={{ color: '#333', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>{r.nr_sequencia}</td>
                        <td className="px-[10px] py-[3px] align-middle truncate" style={{ color: '#333', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>{r.descricao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
