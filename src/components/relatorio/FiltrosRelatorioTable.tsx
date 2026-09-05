"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { DataSourceCampo } from "@/types/relatorio";
import { getDataSource } from "@/lib/relatorioDataSources";
import { gerarId } from "@/lib/relatorioUtils";
import { OPERADORES_FILTRO } from "@/lib/relatorioUtils";
import Select from "@/components/ui/Select";
import ResizableTable from "@/components/ui/ResizableTable";
import type { RelatorioFiltro } from "@/types/relatorio";

interface FiltrosRelatorioTableProps {
  filtros: RelatorioFiltro[];
  onChange: (filtros: RelatorioFiltro[]) => void;
  camposDisponiveis: DataSourceCampo[];
  onEditingChange?: (editing: boolean) => void;
  userId?: string;
  initialColumns?: { order: string[]; widths: Record<string, number> } | null;
  onColumnsChange?: (order: string[], widths: Record<string, number>) => void;
  getNextSeq?: () => number;
  /** Opções de coleção do sistema. */
  colecaoOptions?: { value: string; label: string }[];
  /** Callback ao clicar 'Ver' no menu de contexto. */
  onViewFiltro?: (filtro: RelatorioFiltro) => void;
  /** Callback ao excluir um filtro (para deletar do Firestore). */
  onDeleteFiltro?: (filtro: RelatorioFiltro) => void;
}

const MASCARA_OPTIONS = [
  { value: "texto", label: "Texto" },
  { value: "data", label: "Data" },
  { value: "decimal", label: "Decimal" },
  { value: "inteiro", label: "Inteiro" },
  { value: "cpf", label: "CPF" },
  { value: "telefone", label: "Telefone" },
];

const inputClass = "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none";

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

/** Apply CPF mask XXX.XXX.XXX-XX */
function applyCpfMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** Apply phone mask (XX) XXXXX-XXXX or (XX) XXXX-XXXX */
function applyPhoneMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function FiltrosRelatorioTable({
  filtros,
  onChange,
  camposDisponiveis,
  onEditingChange,
  userId,
  initialColumns,
  onColumnsChange,
  getNextSeq,
  colecaoOptions = [],
  onViewFiltro,
  onDeleteFiltro,
}: FiltrosRelatorioTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  // Notificar o pai quando o estado de edição muda
  useEffect(() => { onEditingChange?.(editingId !== null); }, [editingId, onEditingChange]);

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
    if (col === '_actions') return; // coluna fixa não ordena
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
    const idx = sortedFiltros.findIndex((r) => r.id === editingId);
    if (idx >= 0 && idx < sortedFiltros.length - 1) {
      advanceTargetId.current = sortedFiltros[idx + 1].id;
      setEditingId(sortedFiltros[idx + 1].id);
    } else {
      setEditingId(null);
    }
  }, [editingId, sortedFiltros]);

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

  function atualizar(id: string, updates: Partial<RelatorioFiltro>) {
    onChange(filtros.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }

  function excluir(id: string) {
    if (filtros.length <= 1) return;
    const filtro = filtros.find((f) => f.id === id);
    if (onDeleteFiltro && filtro) {
      onDeleteFiltro(filtro);
    } else {
      onChange(filtros.filter((f) => f.id !== id));
    }
    setContextMenu(null);
  }

  function duplicar(id: string) {
    const original = filtros.find((f) => f.id === id);
    if (!original) return;
    const clone: RelatorioFiltro = { ...original, id: gerarId(), nr_sequencia: getNextSeq ? getNextSeq() : (Math.max(0, ...filtros.map((f) => f.nr_sequencia ?? 0)) + 1) };
    const idx = filtros.findIndex((f) => f.id === id);
    const updated = [...filtros];
    updated.splice(idx + 1, 0, clone);
    onChange(updated);
    setContextMenu(null);
  }

  function renderValorInput(row: RelatorioFiltro) {
    if (["vazio", "nao_vazio"].includes(row.operador)) {
      return <span className="text-xs text-slate-400">—</span>;
    }

    const mascara = row.ie_mascara ?? "texto";

    if (row.operador === "entre") {
      return (
        <div className="flex items-center gap-1">
          {renderValorField(row, "vl_padrao", mascara, "De")}
          {renderValorField(row, "valorFinal", mascara, "Até")}
        </div>
      );
    }

    return renderValorField(row, "vl_padrao", mascara);
  }

  function renderValorField(row: RelatorioFiltro, field: "vl_padrao" | "valorFinal", mascara: string, placeholder?: string) {
    const val = field === "vl_padrao" ? (row.vl_padrao ?? "") : (row.valorFinal ?? "");

    if (mascara === "data") {
      return (
        <input
          type="text"
          inputMode="numeric"
          maxLength={10}
          placeholder="DD/MM/AAAA"
          value={val}
          onChange={(e) => atualizar(row.id, { [field]: applyDateMask(e.target.value) })}
          className={`${inputClass} flex-1 min-w-0 placeholder:text-[#aaa]`}
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
          className={`${inputClass} flex-1 min-w-0`}
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
          className={`${inputClass} flex-1 min-w-0`}
        />
      );
    }

    if (mascara === "cpf") {
      return (
        <input
          type="text"
          inputMode="numeric"
          maxLength={14}
          placeholder="XXX.XXX.XXX-XX"
          value={val}
          onChange={(e) => atualizar(row.id, { [field]: applyCpfMask(e.target.value) })}
          className={`${inputClass} flex-1 min-w-0 placeholder:text-[#aaa]`}
        />
      );
    }

    if (mascara === "telefone") {
      return (
        <input
          type="text"
          inputMode="numeric"
          maxLength={15}
          placeholder="(XX) XXXXX-XXXX"
          value={val}
          onChange={(e) => atualizar(row.id, { [field]: applyPhoneMask(e.target.value) })}
          className={`${inputClass} flex-1 min-w-0 placeholder:text-[#aaa]`}
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
        className={`${inputClass} flex-1 min-w-0`}
      />
    );
  }

  const columns = useMemo(() => [
    {
      key: "_actions",
      label: "",
      width: 35,
      fixed: true,
      render: (row: RelatorioFiltro) => {
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
      render: (row: RelatorioFiltro) => <span className="text-sm">{row.nr_sequencia ?? ''}</span>,
    },
    {
      key: "ie_colecao",
      label: "Coleção",
      width: 150,
      render: (row: RelatorioFiltro) => {
        if (editingId === row.id) {
          return (
            <Select
              value={row.ie_colecao ?? ''}
              onChange={(v) => atualizar(row.id, { ie_colecao: v, ie_campo: '' })}
              options={[{ value: '', label: '---' }, ...colecaoOptions]}
              showPlaceholder={false}
              className={inputClass}
            />
          );
        }
        return <span className="truncate block">{row.ie_colecao || '---'}</span>;
      },
    },
    {
      key: "ie_campo",
      label: "Campo",
      render: (row: RelatorioFiltro) => {
        if (editingId === row.id) {
          const camposDaColecao = row.ie_colecao ? (getDataSource(row.ie_colecao)?.campos ?? []) : [];
          return (
            <Select
              value={row.ie_campo}
              onChange={(v) => atualizar(row.id, { ie_campo: v })}
              options={camposDaColecao.map((cd) => ({ value: cd.key, label: cd.key }))}
              showPlaceholder
              disabled={!row.ie_colecao}
              className={inputClass}
            />
          );
        }
        return <span className="truncate block">{row.ie_campo || "---"}</span>;
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
              className={inputClass}
            />
          );
        }
        const found = OPERADORES_FILTRO.find((o) => o.value === row.operador);
        return <span className="truncate block">{found?.label || "---"}</span>;
      },
    },
    {
      key: "ie_mascara",
      label: "Máscara",
      render: (row: RelatorioFiltro) => {
        if (editingId === row.id) {
          return (
            <Select
              value={row.ie_mascara ?? "texto"}
              onChange={(v) => atualizar(row.id, { ie_mascara: v as any })}
              options={MASCARA_OPTIONS}
              showPlaceholder={false}
              className={inputClass}
            />
          );
        }
        const found = MASCARA_OPTIONS.find((o) => o.value === (row.ie_mascara ?? "texto"));
        return <span className="truncate block">{found?.label || "Texto"}</span>;
      },
    },
    {
      key: "vl_padrao",
      label: "Valor padrão",
      render: (row: RelatorioFiltro) => {
        if (editingId === row.id) {
          return renderValorInput(row);
        }
        if (["vazio", "nao_vazio"].includes(row.operador)) return <span>—</span>;
        if (row.operador === "entre") {
          return <span className="truncate block">{row.vl_padrao ?? "---"} até {row.valorFinal ?? "---"}</span>;
        }
        return <span className="truncate block">{row.vl_padrao ?? "---"}</span>;
      },
    },
    {
      key: "ie_conector",
      label: "Conector",
      width: 90,
      render: (row: RelatorioFiltro) => {
        if (editingId === row.id) {
          return (
            <Select
              value={row.ie_conector ?? 'E'}
              onChange={(v) => atualizar(row.id, { ie_conector: v as any })}
              options={[{ value: 'E', label: 'E' }, { value: 'OU', label: 'OU' }]}
              showPlaceholder={false}
              className={inputClass}
            />
          );
        }
        return <span className="truncate block">{row.ie_conector ?? '---'}</span>;
      },
    },
    {
      key: "ie_parametro",
      label: "Parâmetro",
      width: 90,
      render: (row: RelatorioFiltro) => {
        return (
          <span className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={row.ie_parametro ?? false}
              onChange={(e) => atualizar(row.id, { ie_parametro: e.target.checked, ie_obrigatorio: e.target.checked ? row.ie_obrigatorio : false })}
              className="cg-checkbox"
            />
          </span>
        );
      },
    },
    {
      key: "ds_label",
      label: "Label",
      width: 150,
      render: (row: RelatorioFiltro) => {
        if (editingId === row.id) {
          return (
            <input
              type="text"
              value={row.ds_label ?? ''}
              onChange={(e) => atualizar(row.id, { ds_label: e.target.value })}
              className={`${inputClass} flex-1 min-w-0`}
            />
          );
        }
        return <span className="truncate block">{row.ds_label || "---"}</span>;
      },
    },
    {
      key: "ie_obrigatorio",
      label: "Obrigatório",
      width: 90,
      render: (row: RelatorioFiltro) => {
        return (
          <span className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={row.ie_obrigatorio ?? false}
              disabled={!row.ie_parametro}
              onChange={(e) => atualizar(row.id, { ie_obrigatorio: e.target.checked })}
              className="cg-checkbox"
            />
          </span>
        );
      },
    },
  ], [editingId, filtros, camposDisponiveis, colecaoOptions]);

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
            <button type="button" className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer" style={{ padding: "0.2rem 0.4rem" }} onClick={() => { const f = filtros.find((x) => x.id === contextMenu.id); if (f && onViewFiltro) onViewFiltro(f); setContextMenu(null); }}>Ver</button>
            <button type="button" className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer" style={{ padding: "0.2rem 0.4rem" }} onClick={() => { setEditingId(contextMenu.id); setContextMenu(null); }}>Editar</button>
            <button type="button" className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer" style={{ padding: "0.2rem 0.4rem" }} onClick={() => duplicar(contextMenu.id)}>Duplicar</button>
            <button type="button" className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer" style={{ padding: "0.2rem 0.4rem" }} onClick={() => excluir(contextMenu.id)}>Excluir</button>
          </div>
        </>
      )}
    </div>
  );
}
