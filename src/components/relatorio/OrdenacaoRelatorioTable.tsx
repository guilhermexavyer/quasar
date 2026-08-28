"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { DataSourceCampo, RelatorioOrdenacao } from "@/types/relatorio";
import { gerarId } from "@/lib/relatorioUtils";
import Select from "@/components/ui/Select";
import ResizableTable from "@/components/ui/ResizableTable";

const inputClass = "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none";

interface OrdenacaoRelatorioTableProps {
  ordenacao: RelatorioOrdenacao[];
  onChange: (ordenacao: RelatorioOrdenacao[]) => void;
  camposDisponiveis: DataSourceCampo[];
  onEditingChange?: (editing: boolean) => void;
  userId?: string;
  initialColumns?: { order: string[]; widths: Record<string, number> } | null;
  onColumnsChange?: (order: string[], widths: Record<string, number>) => void;
}

export default function OrdenacaoRelatorioTable({
  ordenacao,
  onChange,
  camposDisponiveis,
  onEditingChange,
  userId,
  initialColumns,
  onColumnsChange,
}: OrdenacaoRelatorioTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => { onEditingChange?.(editingId !== null); }, [editingId, onEditingChange]);

  useEffect(() => {
    const needsId = ordenacao.some((o) => !o.id);
    if (needsId) {
      onChange(ordenacao.map((o) => (o.id ? o : { ...o, id: gerarId() })));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu]);

  function handleContextMenu(row: RelatorioOrdenacao, e: ReactMouseEvent) {
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

  const sortedOrdenacao = useMemo(() => {
    if (!sortColumn) return ordenacao;
    return [...ordenacao].sort((a, b) => {
      const va = (a as any)[sortColumn] ?? "";
      const vb = (b as any)[sortColumn] ?? "";
      const cmp = String(va).localeCompare(String(vb), "pt-BR");
      return sortAsc ? cmp : -cmp;
    });
  }, [ordenacao, sortColumn, sortAsc]);

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
    const idx = sortedOrdenacao.findIndex((r) => r.id === editingId);
    if (idx >= 0 && idx < sortedOrdenacao.length - 1) {
      advanceTargetId.current = sortedOrdenacao[idx + 1].id;
      setEditingId(sortedOrdenacao[idx + 1].id);
    } else {
      setEditingId(null);
    }
  }, [editingId, sortedOrdenacao]);

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

  function atualizar(id: string, updates: Partial<RelatorioOrdenacao>) {
    onChange(ordenacao.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  }

  function excluir(id: string) {
    if (ordenacao.length <= 1) return;
    onChange(ordenacao.filter((o) => o.id !== id));
    setContextMenu(null);
  }

  function moverParaCima(id: string) {
    const idx = ordenacao.findIndex((o) => o.id === id);
    if (idx <= 0) return;
    const nova = [...ordenacao];
    [nova[idx - 1], nova[idx]] = [nova[idx], nova[idx - 1]];
    onChange(nova);
    setContextMenu(null);
  }

  function moverParaBaixo(id: string) {
    const idx = ordenacao.findIndex((o) => o.id === id);
    if (idx < 0 || idx >= ordenacao.length - 1) return;
    const nova = [...ordenacao];
    [nova[idx], nova[idx + 1]] = [nova[idx + 1], nova[idx]];
    onChange(nova);
    setContextMenu(null);
  }

  const columns = useMemo(() => [
    {
      key: "_actions",
      label: "",
      width: 35,
      fixed: true,
      render: (row: RelatorioOrdenacao) => {
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
      key: "prioridade",
      label: "Prioridade",
      width: 80,
      render: (row: RelatorioOrdenacao) => {
        const idx = ordenacao.findIndex((o) => o.id === row.id);
        return <span className="text-sm">{idx >= 0 ? `${idx + 1}º` : "---"}</span>;
      },
    },
    {
      key: "campo",
      label: "Campo",
      render: (row: RelatorioOrdenacao) => {
        if (editingId === row.id) {
          return (
            <Select
              value={row.campo}
              onChange={(v) => atualizar(row.id, { campo: v })}
              options={camposDisponiveis.map((cd) => ({ value: cd.key, label: cd.label }))}
              showPlaceholder
              className={inputClass}
              visibleOptions={7}
            />
          );
        }
        const found = camposDisponiveis.find((cd) => cd.key === row.campo);
        return <span className="text-sm">{found ? found.label : (row.campo || "---")}</span>;
      },
    },
    {
      key: "direcao",
      label: "Direção",
      width: 150,
      render: (row: RelatorioOrdenacao) => {
        if (editingId === row.id) {
          return (
            <Select
              value={row.direcao}
              onChange={(v) => atualizar(row.id, { direcao: v as "asc" | "desc" })}
              options={[{ value: "asc", label: "Crescente" }, { value: "desc", label: "Decrescente" }]}
              showPlaceholder={false}
              className={inputClass}
              visibleOptions={7}
            />
          );
        }
        return <span className="text-sm">{row.direcao === "desc" ? "Decrescente" : "Crescente"}</span>;
      },
    },
  ], [editingId, camposDisponiveis, ordenacao]);

  return (
    <div>
      <ResizableTable
        columns={columns}
        rows={sortedOrdenacao}
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
            <button type="button" className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer" style={{ padding: "0.2rem 0.4rem" }} onClick={() => { setEditingId(contextMenu.id); setContextMenu(null); }}>Editar</button>
            <button type="button" className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer" style={{ padding: "0.2rem 0.4rem" }} onClick={() => excluir(contextMenu.id)}>Excluir</button>
            {ordenacao.length > 1 && (
              <>
                <div className="border-t border-slate-200 my-[2px]" />
                <button
                  type="button"
                  className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-default"
                  style={{ padding: "0.2rem 0.4rem" }}
                  disabled={ordenacao.findIndex((o) => o.id === contextMenu.id) <= 0}
                  onClick={() => moverParaCima(contextMenu.id)}
                >
                  Mover para cima
                </button>
                <button
                  type="button"
                  className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-default"
                  style={{ padding: "0.2rem 0.4rem" }}
                  disabled={ordenacao.findIndex((o) => o.id === contextMenu.id) >= ordenacao.length - 1}
                  onClick={() => moverParaBaixo(contextMenu.id)}
                >
                  Mover para baixo
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
