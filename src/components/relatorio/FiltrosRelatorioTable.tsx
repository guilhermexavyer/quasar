"use client";

import { useState, useMemo, useEffect } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { DataSourceCampo } from "@/types/relatorio";
import { gerarId } from "@/lib/relatorioUtils";
import { OPERADORES_FILTRO } from "@/lib/relatorioUtils";
import Select from "@/components/ui/Select";
import ResizableTable from "@/components/ui/ResizableTable";
import type { RelatorioFiltro } from "@/types/relatorio";

interface FiltrosRelatorioTableProps {
  filtros: RelatorioFiltro[];
  onChange: (filtros: RelatorioFiltro[]) => void;
  camposDisponiveis: DataSourceCampo[];
}

const MASCARA_OPTIONS = [
  { value: "texto", label: "Texto" },
  { value: "data", label: "Data" },
  { value: "decimal", label: "Decimal" },
  { value: "inteiro", label: "Inteiro" },
];

const inputClass = "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1 text-sm transition focus:border-[#003056] focus:outline-none";

/** Apply date mask DD/MM/AAAA */
function applyDateMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
}

/** Apply decimal mask (currency-like: 1.234,56) */
function applyDecimalMask(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const num = Number(digits) / 100;
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Apply integer mask (only digits) */
function applyIntegerMask(value: string): string {
  return value.replace(/\D/g, "");
}

export default function FiltrosRelatorioTable({
  filtros,
  onChange,
  camposDisponiveis,
}: FiltrosRelatorioTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu]);

  function handleContextMenu(row: RelatorioFiltro, e: ReactMouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ id: row.id, x: e.clientX, y: e.clientY });
  }

  function handleSort(col: string) {
    if (sortColumn === col) {
      if (sortAsc) setSortAsc(false);
      else { setSortColumn(null); setSortAsc(true); }
    } else {
      setSortColumn(col);
      setSortAsc(true);
    }
  }

  const sortedFiltros = useMemo(() => {
    if (!sortColumn) return filtros;
    return [...filtros].sort((a, b) => {
      const va = (a as any)[sortColumn] ?? "";
      const vb = (b as any)[sortColumn] ?? "";
      const cmp = String(va).localeCompare(String(vb), "pt-BR");
      return sortAsc ? cmp : -cmp;
    });
  }, [filtros, sortColumn, sortAsc]);

  function atualizar(id: string, updates: Partial<RelatorioFiltro>) {
    onChange(filtros.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }

  function excluir(id: string) {
    if (filtros.length <= 1) return;
    onChange(filtros.filter((f) => f.id !== id));
    setContextMenu(null);
  }

  function renderValorInput(row: RelatorioFiltro) {
    if (["vazio", "nao_vazio"].includes(row.operador)) {
      return <span className="text-xs text-slate-400">—</span>;
    }

    const mascara = row.mascara ?? "texto";

    if (row.operador === "entre") {
      return (
        <div className="flex items-center gap-1">
          {renderValorField(row, "valor", mascara, "De")}
          {renderValorField(row, "valorFinal", mascara, "Até")}
        </div>
      );
    }

    return renderValorField(row, "valor", mascara);
  }

  function renderValorField(row: RelatorioFiltro, field: "valor" | "valorFinal", mascara: string, placeholder?: string) {
    const val = field === "valor" ? (row.valor ?? "") : (row.valorFinal ?? "");

    if (mascara === "data") {
      return (
        <input
          type="text"
          inputMode="numeric"
          maxLength={10}
          placeholder="DD/MM/AAAA"
          value={val}
          onChange={(e) => atualizar(row.id, { [field]: applyDateMask(e.target.value) })}
          className={`${inputClass} !text-xs flex-1 min-w-0 placeholder:text-[#aaa]`}
        />
      );
    }

    if (mascara === "decimal") {
      return (
        <input
          type="text"
          inputMode="decimal"
          placeholder={placeholder}
          value={val}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            if (!digits) { atualizar(row.id, { [field]: "" }); return; }
            atualizar(row.id, { [field]: applyDecimalMask(digits) });
          }}
          className={`${inputClass} !text-xs flex-1 min-w-0`}
        />
      );
    }

    if (mascara === "inteiro") {
      return (
        <input
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          value={val}
          onChange={(e) => atualizar(row.id, { [field]: applyIntegerMask(e.target.value) })}
          className={`${inputClass} !text-xs flex-1 min-w-0`}
        />
      );
    }

    // texto (default)
    return (
      <input
        type="text"
        placeholder={placeholder}
        value={val}
        onChange={(e) => atualizar(row.id, { [field]: e.target.value })}
        className={`${inputClass} !text-xs flex-1 min-w-0`}
      />
    );
  }

  const columns = useMemo(() => [
    {
      key: "_actions",
      label: "",
      width: 70,
      render: (row: RelatorioFiltro) => {
        const isEditing = editingId === row.id;
        return (
          <span className="flex items-center justify-center gap-1">
            {!isEditing && (
              <button type="button" className="cursor-pointer p-0 bg-transparent border-none" title="Editar"
                onClick={() => { setEditingId(row.id); setContextMenu(null); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
              </button>
            )}
            {isEditing && (
              <button type="button" className="cursor-pointer p-0 bg-transparent border-none" title="Salvar"
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
      key: "campo",
      label: "Campo",
      render: (row: RelatorioFiltro) => {
        if (editingId === row.id) {
          return (
            <Select
              value={row.campo}
              onChange={(v) => atualizar(row.id, { campo: v })}
              options={camposDisponiveis.map((cd) => ({ value: cd.key, label: cd.label }))}
              showPlaceholder
              className="!text-xs"
            />
          );
        }
        const found = camposDisponiveis.find((cd) => cd.key === row.campo);
        return <span className="truncate block">{found?.label || "---"}</span>;
      },
    },
    {
      key: "operador",
      label: "Operador",
      render: (row: RelatorioFiltro) => {
        if (editingId === row.id) {
          return (
            <Select
              value={row.operador}
              onChange={(v) => atualizar(row.id, { operador: v as any })}
              options={[...OPERADORES_FILTRO]}
              showPlaceholder={false}
              className="!text-xs"
            />
          );
        }
        const found = OPERADORES_FILTRO.find((o) => o.value === row.operador);
        return <span className="truncate block">{found?.label || "---"}</span>;
      },
    },
    {
      key: "mascara",
      label: "Máscara",
      render: (row: RelatorioFiltro) => {
        if (editingId === row.id) {
          return (
            <Select
              value={row.mascara ?? "texto"}
              onChange={(v) => atualizar(row.id, { mascara: v as any })}
              options={MASCARA_OPTIONS}
              showPlaceholder={false}
              className="!text-xs"
            />
          );
        }
        const found = MASCARA_OPTIONS.find((o) => o.value === (row.mascara ?? "texto"));
        return <span className="truncate block">{found?.label || "Texto"}</span>;
      },
    },
    {
      key: "valor",
      label: "Valor",
      render: (row: RelatorioFiltro) => {
        if (editingId === row.id) {
          return renderValorInput(row);
        }
        if (["vazio", "nao_vazio"].includes(row.operador)) return <span>—</span>;
        if (row.operador === "entre") {
          return <span className="truncate block">{row.valor ?? "---"} até {row.valorFinal ?? "---"}</span>;
        }
        return <span className="truncate block">{row.valor ?? "---"}</span>;
      },
    },
    {
      key: "parametro",
      label: "Parâmetro",
      width: 90,
      render: (row: RelatorioFiltro) => {
        return (
          <span className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={row.parametro ?? false}
              onChange={(e) => atualizar(row.id, { parametro: e.target.checked })}
              className="h-4 w-4 cursor-pointer accent-[#066fc5]"
            />
          </span>
        );
      },
    },
  ], [editingId, filtros, camposDisponiveis]);

  return (
    <div className="relative">
      <ResizableTable
        columns={columns}
        rows={sortedFiltros}
        rowKey={(row) => row.id}
        sortColumn={sortColumn}
        sortAsc={sortAsc}
        onSortChange={handleSort}
        onRowContextMenu={handleContextMenu}
        rowClassName={(row) => editingId === row.id ? "row-selected" : ""}
        pinnedColumns={["_actions"]}
      />

      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
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
