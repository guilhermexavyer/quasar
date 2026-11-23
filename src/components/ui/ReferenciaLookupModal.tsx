"use client";

import { useMemo, useState } from "react";
import BotaoSalvarFiltro from "@/components/ui/BotaoSalvarFiltro";
import RotuloCampo from "@/components/ui/RotuloCampo";
import Select from "@/components/ui/Select";
import LookupTabela, { type LookupColumn } from "@/components/ui/LookupTabela";
import type { ColunasConfig } from "@/lib/colunasUtils";

export interface ReferenciaLookupItem {
  nr_sequencia: number;
  descricao: string;
  /** Demais colunas do lookup (valores já prontos para exibir). */
  [chave: string]: unknown;
}

/**
 * Filtro do lado esquerdo. Texto: procura o texto digitado na coluna `key`.
 * Com `opcoes`: dropdown, que compara o valor escolhido com `key` (igualdade).
 */
export interface ReferenciaLookupFiltro {
  key: string;
  rotulo: string;
  /** Campo da coleção (informações do rótulo). */
  campo: string;
  /** Coleção do campo, quando não é a do lookup (informações do rótulo). */
  colecao?: string;
  opcoes?: { value: string; label: string }[];
}

interface ReferenciaLookupModalProps {
  /** Título do modal: o nome do item (ex.: "Curso", "Turma x Disciplina"). */
  titulo: string;
  /** Coleção dos registros (usada nas informações dos rótulos). */
  colecao: string;
  /** Campo de descrição da coleção (ex.: ds_curso). */
  campoDescricao: string;
  registros: ReferenciaLookupItem[];
  /** Colunas da tabela (padrão: # e Descrição). */
  colunas?: LookupColumn[];
  /** Filtros além da Sequência (padrão: Descrição). */
  filtros?: ReferenciaLookupFiltro[];
  /** Ordem e largura das colunas salvas no usuário. */
  initialColumns?: ColunasConfig | null;
  onColumnsChange?: (config: ColunasConfig) => void;
  /** Filtro salvo do usuário: ao abrir, vem preenchido e aplicado. */
  filtroSalvo?: Record<string, string> | null;
  /** "Salvar filtro": grava os campos do filtro e chama `aplicar` (como o "Filtrar"). */
  onSalvarFiltro?: (form: Record<string, string>, aplicar: () => void) => void;
  onSelect: (item: ReferenciaLookupItem) => void;
  onClose: () => void;
}

const CLASSE_INPUT = "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none";

/**
 * Lookup de registros de referência, no mesmo visual dos demais lookups: filtros à
 * esquerda (Limpar/Filtrar) e resultados à direita, com colunas redimensionáveis,
 * arrastáveis e ordenáveis; duplo clique em uma linha seleciona o registro.
 */
export default function ReferenciaLookupModal({
  titulo,
  colecao,
  campoDescricao,
  registros,
  colunas,
  filtros,
  initialColumns,
  onColumnsChange,
  filtroSalvo,
  onSalvarFiltro,
  onSelect,
  onClose,
}: ReferenciaLookupModalProps) {
  const camposFiltro = useMemo<ReferenciaLookupFiltro[]>(
    () => filtros ?? [{ key: 'descricao', rotulo: 'Descrição', campo: campoDescricao }],
    [filtros, campoDescricao]
  );
  const colunasTabela = useMemo<LookupColumn[]>(
    () => colunas ?? [{ key: 'nr_sequencia', label: '#', dataClass: 'text-right' }, { key: 'descricao', label: 'Descrição' }],
    [colunas]
  );
  const vazio = useMemo(() => Object.fromEntries([['nr_sequencia', ''], ...camposFiltro.map((f) => [f.key, ''])]) as Record<string, string>, [camposFiltro]);
  // Filtro salvo: só os campos que este lookup conhece, sobre o filtro vazio.
  const [form, setForm] = useState<Record<string, string>>(() =>
    filtroSalvo ? { ...vazio, ...Object.fromEntries(Object.entries(filtroSalvo).filter(([k]) => k in vazio)) } : vazio
  );
  const [filtro, setFiltro] = useState<Record<string, string> | null>(() => (filtroSalvo ? form : null));

  const resultado = useMemo(() => {
    if (!filtro) return [];
    const seq = (filtro.nr_sequencia ?? '').trim();
    return registros.filter((r) => {
      if (seq && String(r.nr_sequencia) !== seq) return false;
      return camposFiltro.every((f) => {
        if (f.opcoes) return !filtro[f.key] || String(r[f.key] ?? '') === filtro[f.key];
        const texto = (filtro[f.key] ?? '').trim().toLowerCase();
        return !texto || String(r[f.key] ?? '').toLowerCase().includes(texto);
      });
    });
  }, [registros, filtro, camposFiltro]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[1200px] bg-white p-0 shadow-xl shadow-black/20 h-[720px] max-h-[90vh] overflow-hidden">
        <div className="flex h-full">
          <form
            className="w-[360px] lookup-left flex flex-col min-h-0"
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
                  <input inputMode="numeric" maxLength={10} className={CLASSE_INPUT} value={form.nr_sequencia ?? ''} onChange={(e) => setForm({ ...form, nr_sequencia: e.target.value.replace(/[^0-9]/g, '') })} />
                </div>
                {camposFiltro.map((f) => (
                  <div key={f.key}>
                    <RotuloCampo texto={f.rotulo} colecao={f.colecao ?? colecao} campo={f.campo} />
                    {f.opcoes ? (
                      <Select value={form[f.key] ?? ''} onChange={(v) => setForm({ ...form, [f.key]: v })} options={f.opcoes} />
                    ) : (
                      <input className={CLASSE_INPUT} value={form[f.key] ?? ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center justify-end gap-2 p-[15px]">
              {onSalvarFiltro && <BotaoSalvarFiltro onClick={() => onSalvarFiltro(form, () => setFiltro(form))} />}
              <button type="button" onClick={() => { setForm(vazio); setFiltro(null); }} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#ddd', borderBottomColor: '#000' }}>Limpar</button>
              <button type="submit" className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#003056', borderBottomColor: '#000' }}>Filtrar</button>
            </div>
          </form>
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col lookup-right">
            {resultado.length === 0 ? (
              <div className="flex h-full items-center justify-center p-[15px] text-sm text-slate-600">Nenhum registro encontrado.</div>
            ) : (
              <LookupTabela
                colunas={colunasTabela}
                linhas={resultado}
                onSelect={onSelect}
                initialColumns={initialColumns}
                onColumnsChange={onColumnsChange}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
