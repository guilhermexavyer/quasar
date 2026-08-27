"use client";

import { useState, useMemo, useEffect } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { gerarId } from "@/lib/relatorioUtils";
import ResizableTable from "@/components/ui/ResizableTable";

export interface Banda {
  id: string;
  nome: string;
  posicao: number;
}

interface BandasRelatorioTableProps {
  bandas: Banda[];
  onChange: (bandas: Banda[]) => void;
  userId?: string;
  initialColumns?: { order: string[]; widths: Record<string, number> } | null;
  onColumnsChange?: (order: string[], widths: Record<string, number>) => void;
}

export default function BandasRelatorioTable({
  bandas,
  onChange,
  userId,
  initialColumns,
  onColumnsChange,
}: BandasRelatorioTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

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
      width: 70,
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
      key: "nome",
      label: "Banda",
      render: (row: Banda) => {
        if (editingId === row.id) {
          return (
            <input
              value={row.nome}
              onChange={(e) => atualizar(row.id, { nome: e.target.value })}
              className="w-full bg-transparent outline-none text-sm"
              placeholder="Nome da banda"
            />
          );
        }
        return <span className="text-sm">{row.nome || "---"}</span>;
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
              className="w-full bg-transparent outline-none text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
            />
          );
        }
        return <span className="text-sm">{row.posicao || "---"}</span>;
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
        rowClassName={(row) => selectedId === row.id ? "row-selected" : ""}
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
          </div>
        </>
      )}
    </div>
  );
}
