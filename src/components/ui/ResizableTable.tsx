"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";

export interface ResizableTableColumn<T = unknown> {
  key: string;
  label: string;
  headerClassName?: string;
  cellClassName?: string;
  align?: "left" | "center";
  render?: (row: T) => ReactNode;
  /** Coluna fixa: não pode ser reordenada, redimensionada ou ordenada. */
  fixed?: boolean;
}

interface ResizableTableProps<T> {
  columns: ResizableTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  sortColumn?: string | null;
  sortAsc?: boolean;
  onSortChange?: (key: string) => void;
  onRowClick?: (row: T) => void;
  onRowContextMenu?: (row: T, e: ReactMouseEvent<HTMLTableRowElement>) => void;
  rowClassName?: (row: T) => string;
  /** Colunas fixas que ficam sempre à esquerda e não podem ser reordenadas/redimensionadas. */
  pinnedColumns?: string[];
  /** Sufixo para a chave de persistência no localStorage (ex.: userId). */
  storageKeySuffix?: string;
  /** Callback chamado quando a ordem ou largura das colunas é alterada. */
  onColumnsChange?: (order: string[], widths: Record<string, number>) => void;
  /** Configuração inicial de colunas vindas do Firestore (quando fornecida, ignora localStorage). */
  initialColumns?: { order: string[]; widths: Record<string, number> } | null;
}

/**
 * Tabela genérica no padrão das tabelas de registro do sistema:
 * colunas com largura ajustável (arrastar a borda do cabeçalho ou dar
 * duplo clique para auto-ajustar), reordenação por arrastar o cabeçalho,
 * ordenação por clique, cabeçalho fixo (sticky) e scroll vertical/horizontal.
 */
export default function ResizableTable<T>({
  columns,
  rows,
  rowKey,
  sortColumn = null,
  sortAsc = true,
  onSortChange,
  onRowClick,
  onRowContextMenu,
  rowClassName,
  pinnedColumns = [],
  storageKeySuffix = '',
  onColumnsChange,
  initialColumns,
}: ResizableTableProps<T>) {
  const tableRef = useRef<HTMLTableElement>(null);
  const [columnOrder, setColumnOrder] = useState<string[]>(() => columns.map((c) => c.key));
  const [dragCol, setDragCol] = useState<string | null>(null);
  const minWidthsRef = useRef<Record<string, number>>({});
  const widthsRef = useRef<Record<string, number>>({});
  const dragStartXRef = useRef(0);
  const didDragRef = useRef(false);
  const dropLineRef = useRef<HTMLDivElement | null>(null);

  const columnsKey = columns.map((c) => c.key).join("|");
  const storageKey = `rt-cols:${columnsKey}${storageKeySuffix ? ':' + storageKeySuffix : ''}`;

  function loadSaved(): { order: string[]; widths: Record<string, number> } | null {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { order?: string[]; widths?: Record<string, number> };
      if (parsed && Array.isArray(parsed.order) && parsed.widths) {
        return { order: parsed.order, widths: parsed.widths };
      }
    } catch {
      /* ignora dados corrompidos */
    }
    return null;
  }

  function saveState(order: string[], widths: Record<string, number>) {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ order, widths }));
    } catch {
      /* armazenamento indisponível */
    }
    onColumnsChange?.(order, widths);
  }

  // Quando as colunas mudam (ex.: troca de função), carrega/reseta ordem e
  // larguras. Depende apenas de columnsKey: as props columns são recriadas a cada
  // render do pai (arrays inline), o que apagaria larguras ajustadas pelo usuário.
  // Larguras e ordem são persistidas em localStorage, então sobrevivem a
  // remontagens (ex.: trocar de perfil) e até a recarregar a página.
  useLayoutEffect(() => {
    const keys = columns.map((c) => c.key);
    const pinned = keys.filter((k) => pinnedColumns.includes(k));
    const unpinned = keys.filter((k) => !pinnedColumns.includes(k));
    const saved = initialColumns ?? loadSaved();
    if (saved) {
      const savedOrder = saved.order.filter((k) => unpinned.includes(k));
      const extra = unpinned.filter((k) => !savedOrder.includes(k));
      setColumnOrder([...pinned, ...savedOrder, ...extra]);
      widthsRef.current = saved.widths;
    } else {
      setColumnOrder([...pinned, ...unpinned]);
      widthsRef.current = {};
    }
    minWidthsRef.current = {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnsKey, pinnedColumns.join(','), storageKeySuffix]);

  function measureHeaderMinWidth(th: HTMLElement): number {
    const clone = th.cloneNode(true) as HTMLElement;
    clone.querySelector(".rt-resizer-handle")?.remove();

    const style = window.getComputedStyle(th);
    clone.style.position = "absolute";
    clone.style.left = "0";
    clone.style.top = "0";
    clone.style.visibility = "hidden";
    clone.style.pointerEvents = "none";
    clone.style.display = "inline-block";
    clone.style.width = "auto";
    clone.style.minWidth = "0";
    clone.style.maxWidth = "none";
    clone.style.whiteSpace = "nowrap";
    clone.style.boxSizing = "border-box";
    clone.style.paddingLeft = style.paddingLeft;
    clone.style.paddingRight = style.paddingRight;
    clone.style.borderLeftWidth = style.borderLeftWidth;
    clone.style.borderRightWidth = style.borderRightWidth;
    clone.style.marginLeft = style.marginLeft;
    clone.style.marginRight = style.marginRight;

    document.body.appendChild(clone);
    const width = Math.ceil(
      clone.getBoundingClientRect().width +
        parseFloat(style.marginLeft || "0") +
        parseFloat(style.marginRight || "0")
    );
    document.body.removeChild(clone);
    return width;
  }

  function measureColumnContentWidth(table: HTMLTableElement, domIdx: number): number {
    const cells = table.querySelectorAll<HTMLElement>(`tbody tr td:nth-child(${domIdx + 1})`);
    let maxWidth = 0;

    cells.forEach((cell) => {
      const clone = cell.cloneNode(true) as HTMLElement;
      clone.style.position = "absolute";
      clone.style.left = "0";
      clone.style.top = "0";
      clone.style.visibility = "hidden";
      clone.style.pointerEvents = "none";
      clone.style.display = "inline-block";
      clone.style.whiteSpace = "nowrap";
      clone.style.width = "auto";
      clone.style.maxWidth = "none";
      clone.style.minWidth = "0";
      clone.style.overflow = "visible";
      clone.style.textOverflow = "clip";

      document.body.appendChild(clone);
      const width = clone.getBoundingClientRect().width;
      document.body.removeChild(clone);

      if (width > maxWidth) maxWidth = width;
    });

    return Math.ceil(maxWidth);
  }

  function applyWidths(table: HTMLTableElement, widths: Record<string, number>) {
    const ths = table.querySelectorAll<HTMLElement>("thead tr th");
    ths.forEach((th, domIdx) => {
      const key = columnOrder[domIdx];
      const w = widths[key] || 0;
      th.style.width = `${w}px`;
      th.style.maxWidth = `${w}px`;
      th.style.minWidth = "0px";
      table.querySelectorAll<HTMLElement>(`tbody tr td:nth-child(${domIdx + 1})`).forEach((td) => {
        td.style.width = `${w}px`;
        td.style.maxWidth = `${w}px`;
        td.style.minWidth = "0px";
      });
    });
    const total = columnOrder.reduce((sum, k) => sum + (widths[k] || 0), 0);
    table.style.width = `${total}px`;
  }

  function setDefaultWidths() {
    const table = tableRef.current;
    if (!table) return;
    const ths = table.querySelectorAll<HTMLElement>("thead tr th");
    if (ths.length === 0) return;

    if (Object.keys(minWidthsRef.current).length === 0) {
      ths.forEach((th, domIdx) => {
        const key = columnOrder[domIdx];
        minWidthsRef.current[key] = measureHeaderMinWidth(th);
      });
    }

    const widths: Record<string, number> = {};
    ths.forEach((th, domIdx) => {
      const key = columnOrder[domIdx];
      const minW = minWidthsRef.current[key] || 0;
      const savedW = widthsRef.current[key];
      const contentW = measureColumnContentWidth(table, domIdx);
      widths[key] = savedW && savedW > 0 ? savedW : Math.max(minW, contentW);
    });
    widthsRef.current = widths;
    applyWidths(table, widths);
    saveState(columnOrder, widths);
  }

  useLayoutEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    setDefaultWidths();
  }, [columnOrder, rows.length, columnsKey]);

  function handleResizeStart(key: string, e: ReactMouseEvent<HTMLDivElement>) {
    e.preventDefault();
    const table = tableRef.current;
    if (!table) return;
    const domIdx = columnOrder.indexOf(key);
    if (domIdx === -1) return;
    const ths = table.querySelectorAll<HTMLElement>("thead tr th");
    const th = ths[domIdx];
    const startWidth = th.offsetWidth;
    const startX = e.clientX;
    const minW = minWidthsRef.current[key] || 20;

    function onMouseMove(ev: globalThis.MouseEvent) {
      if (!table) return;
      const newWidth = Math.max(minW, startWidth + (ev.clientX - startX));
      widthsRef.current = { ...widthsRef.current, [key]: newWidth };
      applyWidths(table, widthsRef.current);
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      saveState(columnOrder, widthsRef.current);
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  function handleResizeDblClick(key: string) {
    const table = tableRef.current;
    if (!table) return;
    const domIdx = columnOrder.indexOf(key);
    if (domIdx === -1) return;
    const minW = minWidthsRef.current[key] || 0;
    const contentW = measureColumnContentWidth(table, domIdx);
    const finalWidth = Math.max(minW, contentW);
    widthsRef.current = { ...widthsRef.current, [key]: finalWidth };
    applyWidths(table, widthsRef.current);
    saveState(columnOrder, widthsRef.current);
  }

  function handleHeaderMouseDown(key: string, e: ReactMouseEvent<HTMLTableCellElement>) {
    if ((e.target as HTMLElement).closest(".rt-resizer-handle")) return;
    const col = columns.find((c) => c.key === key);
    if (col?.fixed) return;
    dragStartXRef.current = e.clientX;
    didDragRef.current = false;
    let currentDropIdx: number | null = null;

    function onMouseMove(ev: globalThis.MouseEvent) {
      const table = tableRef.current;
      if (!table) return;
      if (!didDragRef.current && Math.abs(ev.clientX - dragStartXRef.current) > 5) {
        didDragRef.current = true;
        setDragCol(key);
      }
      if (!didDragRef.current) return;

      const wrapper = table.parentElement;
      const ths = table.querySelectorAll<HTMLElement>("thead tr th");
      let targetIdx = ths.length;
      for (let i = 0; i < ths.length; i++) {
        const rect = ths[i].getBoundingClientRect();
        const midX = rect.left + rect.width / 2;
        if (ev.clientX < midX) {
          targetIdx = i;
          break;
        }
      }

      const curVisualPos = columnOrder.indexOf(key);
      currentDropIdx = targetIdx !== curVisualPos && targetIdx !== curVisualPos + 1 ? targetIdx : null;

      if (dropLineRef.current && currentDropIdx !== null && wrapper) {
        const wrapperRect = wrapper.getBoundingClientRect();
        const th = ths[Math.min(currentDropIdx, ths.length - 1)];
        const thRect = th.getBoundingClientRect();
        const isAfterLast = currentDropIdx >= ths.length;
        const lineX = (isAfterLast ? thRect.right - wrapperRect.left : thRect.left - wrapperRect.left) + (wrapper.scrollLeft || 0);
        dropLineRef.current.style.transform = `translateX(${lineX}px)`;
        dropLineRef.current.style.display = "block";
      } else if (dropLineRef.current) {
        dropLineRef.current.style.display = "none";
      }
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);

      if (didDragRef.current && currentDropIdx !== null) {
        const newOrder = [...columnOrder];
        const curPos = newOrder.indexOf(key);
        newOrder.splice(curPos, 1);
        const adjustedDrop = currentDropIdx > curPos ? currentDropIdx - 1 : currentDropIdx;
        newOrder.splice(adjustedDrop, 0, key);
        setColumnOrder(newOrder);
        if (tableRef.current) {
          const ths = tableRef.current.querySelectorAll<HTMLElement>("thead tr th");
          const byLogical: Record<string, number> = {};
          ths.forEach((thEl, domIdx) => {
            byLogical[columnOrder[domIdx]] = thEl.offsetWidth;
          });
          widthsRef.current = byLogical;
          applyWidths(tableRef.current, byLogical);
          saveState(newOrder, byLogical);
        }
      }

      setDragCol(null);
      if (dropLineRef.current) dropLineRef.current.style.display = "none";
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  function handleHeaderClick(key: string, e: ReactMouseEvent<HTMLTableCellElement>) {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if ((e.target as HTMLElement).closest(".rt-resizer-handle")) return;
    const col = columns.find((c) => c.key === key);
    if (col?.fixed) return;
    onSortChange?.(key);
  }

  function SortIcon({ active, asc }: { active: boolean; asc: boolean }) {
    if (!active) {
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-slate-600">
          <path d="m8 7 4-4 4 4" />
          <path d="m8 17 4 4 4-4" />
        </svg>
      );
    }
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0 text-[#001a30]">
        <path d={asc ? "M12 4.5 20 20H4Z" : "M12 19.5 4 4h16Z"} />
      </svg>
    );
  }

  return (
    <>
      <style>{`
        .rt-resizer-handle { position: absolute; right: 0; top: 0; bottom: 0; width: 7px; cursor: col-resize; z-index: 10; }
        .rt-resizer-handle::after { content: ""; position: absolute; right: 2px; top: 4px; bottom: 4px; width: 3px; border-radius: 2px; background: transparent; transition: background-color 150ms; }
        .rt-resizer-handle:hover::after { background-color: #94a3b8; }
        th, td { min-width: 0 !important; box-sizing: border-box; }
        th { white-space: nowrap; overflow: hidden; }
        td { overflow: visible !important; }
        th .rt-header-content { display: flex; align-items: center; justify-content: space-between; gap: 4px; white-space: nowrap; overflow: hidden; width: 100%; }
        th .rt-header-content > span { overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0; }
        th .rt-header-content > svg { flex-shrink: 0; margin-left: auto; }
        td { max-width: 0; }
        .rt-cell-content { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; min-width: 0; }
      `}</style>
      <div className="relative h-full w-full">
        <table ref={tableRef} className="text-sm" style={{ tableLayout: "fixed", width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr className="bg-[#bbb]">
              {columnOrder.map((key) => {
                const col = columns.find((c) => c.key === key);
                if (!col) return null;
                const isDragSource = dragCol === key;
                return (
                  <th
                    key={key}
                    scope="col"
                    className={`sticky top-0 z-30 bg-[#bbb] px-[10px] py-[3px] text-left text-sm font-semibold text-slate-900 min-w-0 align-middle border-r border-b last:border-r-0 border-[#666] select-none cursor-pointer ${col.headerClassName || ""} ${isDragSource ? "opacity-50" : ""}`}
                    style={{ borderRightColor: "#666", borderBottomColor: "#999", backgroundClip: "padding-box", boxShadow: "inset 0 -1px 0 #999" }}
                    onClick={(e) => handleHeaderClick(key, e)}
                    onMouseDown={(e) => handleHeaderMouseDown(key, e)}
                    onDragStart={(e) => e.preventDefault()}
                  >
                    <div className="rt-header-content pr-1">
                      <span>{col.label}</span>
                      <SortIcon active={sortColumn === key} asc={sortAsc} />
                    </div>
                    {!col.fixed && (
                      <div
                        className="rt-resizer-handle"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleResizeStart(key, e);
                        }}
                        onDoubleClick={() => handleResizeDblClick(key)}
                      />
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row) => {
              const rk = rowKey(row);
              return (
                <tr
                  key={rk}
                  className={`cursor-[context-menu] hover:bg-[#eee] ${rowClassName ? rowClassName(row) : ""}`}
                  onClick={() => onRowClick?.(row)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onRowContextMenu?.(row, e);
                  }}
                >
                  {columnOrder.map((key) => {
                    const col = columns.find((c) => c.key === key);
                    if (!col) return null;
                    const value = (row as Record<string, unknown>)[key];
                    const content =
                      col.render !== undefined ? col.render(row) : value === undefined || value === null ? "" : String(value);
                    return (
                      <td
                        key={key}
                        className={`px-[10px] py-[3px] min-w-0 align-middle font-normal ${col.cellClassName || ""} ${col.align === "center" ? "text-center" : ""}`}
                        style={{ color: "#333", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}
                      >
                        <span className="rt-cell-content">{content}</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div
          ref={dropLineRef}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "2px",
            backgroundColor: "#003056",
            zIndex: 100,
            pointerEvents: "none",
            display: "none",
            transform: "translateX(0)",
            boxShadow: "0 0 4px rgba(0,48,86,0.4)",
          }}
        />
      </div>
    </>
  );
}
