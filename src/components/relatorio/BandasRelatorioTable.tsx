"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { gerarId } from "@/lib/relatorioUtils";
import Select from "@/components/ui/Select";
import ResizableTable from "@/components/ui/ResizableTable";

export interface Banda {
  id: string;
  nome: string;
  colecao?: string;
  posicao: number;
  tipo?: 'lista' | 'texto_valor' | 'cabecalho' | 'rodape';
  altura?: number;
  nr_sequencia?: number;
  nr_seq_relatorio?: number;
  campos?: any[];
  filtros?: any[];
  ordenacao?: any[];
}

const inputClass = "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none";

interface BandasRelatorioTableProps {
  bandas: Banda[];
  onChange: (bandas: Banda[]) => void;
  colecaoOptions?: { value: string; label: string }[];
  onEditingChange?: (editing: boolean) => void;
  userId?: string;
  initialColumns?: { order: string[]; widths: Record<string, number> } | null;
  onColumnsChange?: (order: string[], widths: Record<string, number>) => void;
  onViewBanda?: (banda: Banda) => void;
}

export default function BandasRelatorioTable({
  bandas,
  onChange,
  colecaoOptions = [],
  onEditingChange,
  userId,
  initialColumns,
  onColumnsChange,
  onViewBanda,
}: BandasRelatorioTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => { onEditingChange?.(editingId !== null); }, [editingId, onEditingChange]);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu]);

  function handleContextMenu(row: Banda, e: ReactMouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ id: row.id, x: e.clientX, y: e.clientY });
  }

  function handleSort(col: string) {
    if (col === "_actions") return;
    if (sortColumn === col) {
      if (sortAsc) setSortAsc(false);
      else { setSortColumn(null); setSortAsc(true); }
    } else {
      setSortColumn(col);
      setSortAsc(true);
    }
  }

  const sortedBandas = useMemo(() => {
    if (!sortColumn) return bandas;
    return [...bandas].sort((a, b) => {
      const va = (a as any)[sortColumn] ?? "";
      const vb = (b as any)[sortColumn] ?? "";
      const cmp = String(va).localeCompare(String(vb), "pt-BR");
      return sortAsc ? cmp : -cmp;
    });
  }, [bandas, sortColumn, sortAsc]);

  // ── Enter / Ctrl+S ──
  const pendingFocusCol = useRef<number | null>(null);
  const advanceTargetId = useRef<string | null>(null);

  useEffect(() => {
    if (advanceTargetId.current === null || pendingFocusCol.current === null) return;
    if (editingId !== advanceTargetId.current) return;
    const colIdx = pendingFocusCol.current;
    advanceTargetId.current = null;
    pendingFocusCol.current = null;
    const tryFocus = (attempts: number) => {
      if (attempts <= 0) return;
      setTimeout(() => {
        const row = document.querySelector('tr.row-selected');
        if (!row) { tryFocus(attempts - 1); return; }
        const cells = row.querySelectorAll<HTMLElement>('td');
        const targetCell = cells[colIdx];
        if (!targetCell) { tryFocus(attempts - 1); return; }
        const input = targetCell.querySelector<HTMLInputElement>('input');
        if (!input) { tryFocus(attempts - 1); return; }
        input.focus();
        input.select();
        try { input.setSelectionRange(0, input.value.length); } catch { /* ignore */ }
      }, 100);
    };
    tryFocus(5);
  }, [editingId]);

  const saveAndAdvance = useCallback(() => {
    if (!editingId) return;
    const idx = sortedBandas.findIndex((r) => r.id === editingId);
    if (idx >= 0 && idx < sortedBandas.length - 1) {
      advanceTargetId.current = sortedBandas[idx + 1].id;
      setEditingId(sortedBandas[idx + 1].id);
    } else {
      setEditingId(null);
    }
  }, [editingId, sortedBandas]);

  useEffect(() => {
    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if (!editingId) return;
      const target = e.target as HTMLElement;
      const tagName = target?.tagName?.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault(); e.stopPropagation();
        target.blur();
        setTimeout(() => setEditingId(null), 0);
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
        const isInSelect = target?.closest?.('[data-select]') || target?.getAttribute?.('role') === 'combobox';
        if (tagName === 'input' && !isInSelect) {
          e.preventDefault();
          const td = target.closest('td');
          const tr = td?.closest('tr');
          if (tr && td) pendingFocusCol.current = Array.from(tr.children).indexOf(td);
          target.blur();
          setTimeout(() => saveAndAdvance(), 0);
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [editingId, saveAndAdvance]);

  function atualizar(id: string, updates: Partial<Banda>) {
    onChange(bandas.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }

  function excluir(id: string) {
    onChange(bandas.filter((b) => b.id !== id));
    setContextMenu(null);
  }

  const columns = useMemo(() => [
    {
      key: "_actions",
      label: "",
      width: 35,
      fixed: true,
      render: (row: Banda) => {
        const isEditing = editingId === row.id;
        return (
          <span className="flex items-center justify-center gap-1">
            {!isEditing && (
              <button type="button" className="cursor-pointer p-0 bg-transparent border-none"
                onClick={() => { setEditingId(row.id); setContextMenu(null); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
              </button>
            )}
            {isEditing && (
              <button type="button" className="cursor-pointer p-0 bg-transparent border-none"
                onClick={() => setEditingId(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </button>
            )}
          </span>
        );
      },
    },
    {
      key: "nr_sequencia",
      label: "#",
      width: 40,
      render: (row: Banda) => <span className="text-sm">{row.nr_sequencia ?? ''}</span>,
    },
    {
      key: "nome",
      label: "Banda",
      render: (row: Banda) => {
        if (editingId === row.id) {
          return (            <input
              value={row.nome}
              onChange={(e) => atualizar(row.id, { nome: e.target.value })}
              className={inputClass}
            />
          );
        }
        return <span className="text-sm">{row.nome || "---"}</span>;
      },
    },
    {
      key: "colecao",
      label: "Coleção principal",
      render: (row: Banda) => {
        const isCabecalhoOuRodape = row.tipo === 'cabecalho' || row.tipo === 'rodape';
        if (editingId === row.id) {
          return (
            <Select
              value={row.colecao ?? ''}
              onChange={(v) => atualizar(row.id, { colecao: v })}
              options={[{ value: '', label: '---' }, ...colecaoOptions]}
              showPlaceholder={false}
              className={`${inputClass} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
              disabled={isCabecalhoOuRodape}
              visibleOptions={7}
            />
          );
        }
        return <span className="text-sm">{row.colecao || '---'}</span>;
      },
    },
    {
      key: "tipo",
      label: "Tipo",
      render: (row: Banda) => {
        if (editingId === row.id) {
          return (
            <Select
              value={row.tipo ?? ''}
              onChange={(v) => atualizar(row.id, { tipo: v as any })}
              options={[{ value: '', label: '---' }, { value: 'lista', label: 'Lista' }, { value: 'texto_valor', label: 'Texto/Valor' }, { value: 'cabecalho', label: 'Cabeçalho' }, { value: 'rodape', label: 'Rodapé' }]}
              showPlaceholder={false}
              className={inputClass}
              visibleOptions={7}
            />
          );
        }
        const lbl = row.tipo === 'lista' ? 'Lista' : row.tipo === 'texto_valor' ? 'Texto/Valor' : row.tipo === 'cabecalho' ? 'Cabeçalho' : row.tipo === 'rodape' ? 'Rodapé' : '---';
        return <span className="text-sm">{lbl}</span>;
      },
    },
    {
      key: "posicao",
      label: "Posição",
      width: 100,
      render: (row: Banda) => {
        if (editingId === row.id) {
          return (
            <input
              type="text"
              inputMode="numeric"
              value={row.posicao}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "");
                atualizar(row.id, { posicao: v ? Number(v) : 0 });
              }}
              className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`}
            />
          );
        }
        return <span className="text-sm">{row.posicao || "---"}</span>;
      },
    },
    {
      key: "altura",
      label: "Altura",
      width: 80,
      render: (row: Banda) => {
        if (editingId === row.id) {
          return (
            <input
              type="text"
              inputMode="numeric"
              value={row.altura ?? ''}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "");
                atualizar(row.id, { altura: v ? Number(v) : undefined });
              }}
              className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`}
            />
          );
        }
        return <span className="text-sm">{row.altura != null ? row.altura : '---'}</span>;
      },
    },
  ], [editingId, bandas]);

  return (
    <div>
      <ResizableTable
        columns={columns}
        rows={sortedBandas}
        rowKey={(row) => row.id}
        sortColumn={sortColumn}
        sortAsc={sortAsc}
        onSortChange={handleSort}
        onRowContextMenu={handleContextMenu}
        onRowClick={(row) => setSelectedId(row.id === selectedId ? null : row.id)}
        rowClassName={(row) => (selectedId === row.id || editingId === row.id) ? "row-selected" : ""}
        pinnedColumns={["_actions"]}
        storageKeySuffix={userId}
        initialColumns={initialColumns}
        onColumnsChange={onColumnsChange}
      />

      {contextMenu && (
        <>
          <div
            className="fixed z-50 min-w-[120px] border border-slate-200 bg-white p-[3px] flex flex-col gap-[3px]"
            style={{ left: contextMenu.x, top: contextMenu.y, boxShadow: "0 4px 10px rgba(0,0,0,0.18)" }}
          >
            <button type="button" className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer" style={{ padding: "0.2rem 0.4rem" }} onClick={() => { setContextMenu(null); if (onViewBanda) { const b = bandas.find((x) => x.id === contextMenu.id); if (b) onViewBanda(b); } }}>Ver</button>
            <button type="button" className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer" style={{ padding: "0.2rem 0.4rem" }} onClick={() => { setEditingId(contextMenu.id); setContextMenu(null); }}>Editar</button>
            <button type="button" className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer" style={{ padding: "0.2rem 0.4rem" }} onClick={() => excluir(contextMenu.id)}>Excluir</button>
          </div>
        </>
      )}
    </div>
  );
}
