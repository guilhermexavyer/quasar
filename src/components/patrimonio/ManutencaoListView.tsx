"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, MouseEvent as ReactMouseEvent, SetStateAction } from "react";
import type { ContextMenuState } from "@/types/contextMenu";
import type { Manutencao } from "@/types/manutencao";
import { MANUTENCAO_COLUMNS as COLUMNS, formatCellValue } from "@/lib/manutencaoUtils";
import { isValidOrder, type ColunasConfig } from "@/lib/colunasUtils";
import Select from "@/components/ui/Select";
import EmptySelectionMessage from "@/components/ui/EmptySelectionMessage";

interface ListViewProps {
  message: string;
  loading: boolean;
  manutencoes: Manutencao[];
  openNewForm: () => void;
  openEditForm: (manutencao: Manutencao) => void;
  handleDelete: (id: string) => void;
  setContextMenu: Dispatch<SetStateAction<ContextMenuState | null>>;
  selectOptions: { value: string; label: string }[];
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  /** Abre o modal de filtro. */
  openFilter?: () => void;
  /** Submódulos permitidos do dropdown PAI (Manutenções/...) conforme permissões. */
  allowedSubmodulos?: string[];
  sortColumn: number | null;
  sortAsc: boolean | null;
  onSortChange: (logicalIndex: number) => void;
  initialColumns?: ColunasConfig | null;
  onColumnsChange?: (config: ColunasConfig) => void;
  /** Lookups opcionais por coluna: mapa sequência→nome. */
  columnLookups?: Partial<Record<keyof Manutencao, Record<number, string>>>;
}

export default function ManutencaoListView({
  message,
  loading,
  manutencoes,
  openNewForm,
  openEditForm,
  handleDelete,
  setContextMenu,
  selectOptions,
  manageSelection,
  onManageSelectionChange,
  openFilter,
  allowedSubmodulos = ['manutencoes'],
  sortColumn,
  sortAsc,
  onSortChange,
  initialColumns,
  onColumnsChange,
  columnLookups,
}: ListViewProps) {
  const tableRef = useRef<HTMLTableElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [frozenWidth, setFrozenWidth] = useState<string | null>(null);
  const [columnOrder, setColumnOrder] = useState<number[]>(() =>
    initialColumns && isValidOrder(initialColumns.order, COLUMNS.length)
      ? [...initialColumns.order]
      : Array.from({ length: COLUMNS.length }, (_, i) => i)
  );
  const [dragCol, setDragCol] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState<number | 'all'>(30);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>('1');
  const minWidthsRef = useRef<number[]>([]);
  const dragStartXRef = useRef(0);
  const didDragRef = useRef(false);
  const dropLineRef = useRef<HTMLDivElement | null>(null);
  const currentWidthsRef = useRef<number[]>(
    initialColumns?.widths && initialColumns.widths.length === COLUMNS.length
      ? [...initialColumns.widths]
      : []
  );

  function measureHeaderMinWidth(th: HTMLElement): number {
    const clone = th.cloneNode(true) as HTMLElement;
    clone.querySelector(".resizer-handle")?.remove();

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

  function measureAllMinWidths() {
    const table = tableRef.current;
    if (!table) return [];

    const ths = table.querySelectorAll<HTMLElement>("thead tr th");
    if (ths.length === 0) return [];

    const widths = new Array(COLUMNS.length).fill(0);
    ths.forEach((th, domIdx) => {
      const logicalIdx = columnOrder[domIdx];
      widths[logicalIdx] = measureHeaderMinWidth(th);
    });

    minWidthsRef.current = widths;
    return widths;
  }

  function measureColumnContentWidth(table: HTMLTableElement, domIdx: number): number {
    const cells = table.querySelectorAll<HTMLElement>(
      `tbody tr td:nth-child(${domIdx + 1})`
    );
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

  function setDefaultColumnWidths() {
    const table = tableRef.current;
    if (!table) return;

    if (minWidthsRef.current.length === 0) {
      measureAllMinWidths();
    }

    const ths = freezeTableColumns(table);
    ths.forEach((th, domIdx) => {
      const logicalIdx = columnOrder[domIdx];
      const minW = minWidthsRef.current[logicalIdx] || 0;
      const savedW = currentWidthsRef.current[logicalIdx];
      const contentW = measureColumnContentWidth(table, domIdx);
      const finalWidth = savedW && savedW > 0 ? savedW : Math.max(minW, contentW);
      applyColumnWidth(table, ths, domIdx, finalWidth);
      currentWidthsRef.current[logicalIdx] = finalWidth;
    });

    setFrozenWidth(table.style.width);
  }

  function handleSortClick(logicalIndex: number) {
    onSortChange(logicalIndex);
  }

  function handleHeaderClick(logicalIndex: number, e: ReactMouseEvent<HTMLTableCellElement>) {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if ((e.target as HTMLElement).closest('.resizer-handle')) return;
    handleSortClick(logicalIndex);
  }

  function handleHeaderMouseDown(logicalIndex: number, e: ReactMouseEvent<HTMLTableCellElement>) {
    if ((e.target as HTMLElement).closest('.resizer-handle')) return;
    dragStartXRef.current = e.clientX;
    didDragRef.current = false;
    let currentDropIdx: number | null = null;

    function onMouseMove(ev: globalThis.MouseEvent) {
      if (!tableRef.current) return;
      if (!didDragRef.current && Math.abs(ev.clientX - dragStartXRef.current) > 5) {
        didDragRef.current = true;
        setDragCol(logicalIndex);
      }
      if (!didDragRef.current) return;

      const wrapper = tableRef.current.closest<HTMLElement>('.overflow-x-auto');
      const ths = tableRef.current.querySelectorAll<HTMLElement>("thead tr th");
      let targetIdx = ths.length;
      for (let i = 0; i < ths.length; i++) {
        const rect = ths[i].getBoundingClientRect();
        const midX = rect.left + rect.width / 2;
        if (ev.clientX < midX) {
          targetIdx = i;
          break;
        }
      }

      const curVisualPos = columnOrder.indexOf(logicalIndex);
      currentDropIdx = (targetIdx !== curVisualPos && targetIdx !== curVisualPos + 1) ? targetIdx : null;

      if (dropLineRef.current && currentDropIdx !== null && wrapper) {
        const wrapperRect = wrapper.getBoundingClientRect();
        const th = ths[Math.min(currentDropIdx, ths.length - 1)];
        const thRect = th.getBoundingClientRect();
        const isAfterLast = currentDropIdx >= ths.length;
        const lineX = (isAfterLast ? thRect.right - wrapperRect.left : thRect.left - wrapperRect.left) + wrapper.scrollLeft;
        dropLineRef.current.style.transform = `translateX(${lineX}px)`;
        dropLineRef.current.style.display = 'block';
      } else if (dropLineRef.current) {
        dropLineRef.current.style.display = 'none';
      }
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);

      if (didDragRef.current && currentDropIdx !== null) {
        const newOrder = [...columnOrder];
        const curPos = newOrder.indexOf(logicalIndex);
        newOrder.splice(curPos, 1);
        const adjustedDrop = currentDropIdx > curPos ? currentDropIdx - 1 : currentDropIdx;
        newOrder.splice(adjustedDrop, 0, logicalIndex);
        setColumnOrder(newOrder);
        if (tableRef.current) {
          const ths = tableRef.current.querySelectorAll<HTMLElement>("thead tr th");
          const byLogical = new Array<number>(COLUMNS.length).fill(0);
          ths.forEach((thEl, domIdx) => {
            byLogical[columnOrder[domIdx]] = thEl.offsetWidth;
          });
          currentWidthsRef.current = byLogical;
          onColumnsChange?.({ order: newOrder, widths: byLogical });
        }
      }

      setDragCol(null);
      if (dropLineRef.current) dropLineRef.current.style.display = 'none';
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  const totalRecords = manutencoes.length;
  const pageCount = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPageSafe = Math.min(currentPage, pageCount);
  const firstRecord = totalRecords === 0 ? 0 : (pageSize === 'all' ? 1 : (currentPageSafe - 1) * pageSize + 1);
  const lastRecord = totalRecords === 0 ? 0 : (pageSize === 'all' ? totalRecords : Math.min(totalRecords, currentPageSafe * pageSize));
  const paginatedManutencoes = pageSize === 'all'
    ? manutencoes
    : manutencoes.slice((currentPageSafe - 1) * pageSize, currentPageSafe * pageSize);

  useEffect(() => {
    setCurrentPage(1);
    setPageInput('1');
  }, [pageSize, totalRecords]);

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
      setPageInput(String(pageCount));
    }
  }, [pageCount, currentPage]);

  useLayoutEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    measureAllMinWidths();
    setDefaultColumnWidths();
  }, [columnOrder, loading, manutencoes.length]);

  function SortIcon({ column }: { column: number }) {
    if (sortColumn !== column) {
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-slate-600">
          <path d="m8 7 4-4 4 4" /><path d="m8 17 4 4 4-4" />
        </svg>
      );
    }
    if (sortAsc) {
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0 text-[#001a30]">
          <path d="M12 4.5 20 20H4Z" />
        </svg>
      );
    }
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0 text-[#001a30]">
        <path d="M12 19.5 4 4h16Z" />
      </svg>
    );
  }

  function freezeTableColumns(table: HTMLTableElement) {
    const ths = table.querySelectorAll<HTMLElement>("thead tr th");
    ths.forEach((th) => {
      th.style.boxSizing = "border-box";
      th.style.width = `${th.offsetWidth}px`;
      th.style.maxWidth = `${th.offsetWidth}px`;
      th.style.minWidth = "0px";
    });

    const totalWidth = Array.from(ths).reduce((sum, th) => sum + th.offsetWidth, 0);
    table.style.width = `${totalWidth}px`;
    setFrozenWidth(`${totalWidth}px`);
    return ths;
  }

  function applyColumnWidth(
    table: HTMLTableElement,
    ths: NodeListOf<HTMLElement>,
    domIdx: number,
    width: number
  ) {
    const th = ths[domIdx];
    th.style.width = `${width}px`;
    th.style.maxWidth = `${width}px`;
    th.style.minWidth = "0px";

    table.querySelectorAll<HTMLElement>(
      `tbody tr td:nth-child(${domIdx + 1})`
    ).forEach((td) => {
      td.style.width = `${width}px`;
      td.style.maxWidth = `${width}px`;
      td.style.minWidth = "0px";
    });

    const totalWidth = Array.from(ths).reduce((sum, thEl, i) => {
      if (i === domIdx) return sum + width;
      return sum + (parseFloat(thEl.style.width) || thEl.offsetWidth);
    }, 0);
    table.style.width = `${totalWidth}px`;
    return totalWidth;
  }

  function handleResizeDblClick(logicalIdx: number, e: ReactMouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    const table = tableRef.current;
    if (!table) return;

    const domIdx = columnOrder.indexOf(logicalIdx);
    if (domIdx === -1) return;

    if (minWidthsRef.current.length === 0) measureAllMinWidths();

    const ths = freezeTableColumns(table);
    const cells = table.querySelectorAll<HTMLElement>(
      `tbody tr td:nth-child(${domIdx + 1})`
    );

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

    const minW = minWidthsRef.current[logicalIdx] || 0;
    const finalWidth = Math.max(minW, Math.ceil(maxWidth));
    const totalWidth = applyColumnWidth(table, ths, domIdx, finalWidth);
    setFrozenWidth(`${totalWidth}px`);
  }

  function handleResizeStart(logicalIdx: number, e: ReactMouseEvent<HTMLDivElement>) {
    e.preventDefault();
    const table = tableRef.current;
    if (!table) return;

    const domIdx = columnOrder.indexOf(logicalIdx);
    if (domIdx === -1) return;

    if (minWidthsRef.current.length === 0) measureAllMinWidths();

    const ths = freezeTableColumns(table);
    const th = ths[domIdx];
    const startWidth = th.offsetWidth;
    const startX = e.clientX;
    const minW = minWidthsRef.current[logicalIdx] || 0;

    function onMouseMove(ev: globalThis.MouseEvent) {
      if (!table) return;
      const newWidth = Math.max(minW, startWidth + (ev.clientX - startX));
      applyColumnWidth(table, ths, domIdx, newWidth);
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (table) {
        setFrozenWidth(table.style.width);
        const byLogical = new Array<number>(COLUMNS.length).fill(0);
        ths.forEach((thEl, domIdx) => {
          byLogical[columnOrder[domIdx]] = thEl.offsetWidth;
        });
        currentWidthsRef.current = byLogical;
        onColumnsChange?.({ order: columnOrder, widths: byLogical });
      }
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  return (
    <>
      <style>{`
        .resizer-handle { position: absolute; right: 0; top: 0; bottom: 0; width: 7px; cursor: col-resize; z-index: 10; }
        .resizer-handle::after { content: ""; position: absolute; right: 2px; top: 4px; bottom: 4px; width: 3px; border-radius: 2px; background: transparent; transition: background-color 150ms; }
        .resizer-handle:hover::after { background-color: #94a3b8; }
        th, td { min-width: 0 !important; box-sizing: border-box; }
        th { white-space: nowrap; overflow: hidden; }
        th .header-content { display: flex; align-items: center; justify-content: space-between; gap: 4px; white-space: nowrap; overflow: hidden; width: 100%; }
        th .header-content > span { overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0; }
        th .header-content > svg { flex-shrink: 0; margin-left: auto; }
        td { max-width: 0; overflow: hidden; }
        .cell-content { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; min-width: 0; }
      `}</style>
      <div className="flex-1 flex flex-col min-h-0 space-y-6">
        <div className="flex min-h-[42px] items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Select
              value={manageSelection}
              onChange={onManageSelectionChange}
              options={selectOptions.filter((o) => allowedSubmodulos.includes(o.value))}
              showPlaceholder={!manageSelection}
              className="!w-[180px]"
            />
            {manageSelection && openFilter && (
              <button
                type="button"
                onClick={openFilter}
                className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] bg-transparent text-[#aaa] hover:text-[#777] cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Abrir filtro"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 4h18l-7.5 9.5V20l-3-1.5v-5L3 4z" />
                </svg>
              </button>
            )}
          </div>
          {manageSelection && (
            <button
              type="button"
              onClick={openNewForm}
              className="inline-flex items-center rounded-[3px] border border-transparent bg-transparent px-4 py-2.5 text-sm font-normal text-[#066fc5] transition cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2 active:outline active:outline-1 active:outline-[#066fc5] active:outline-offset-2"
            >
              Adicionar
            </button>
          )}
        </div>

        <div className="bg-white flex-1 flex flex-col min-h-0 overflow-hidden">
          {!manageSelection ? (
            <EmptySelectionMessage />
          ) : loading ? (
            <div className="p-4 space-y-3 flex-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse px-1 py-1">
                  <div className="h-4 w-48 rounded bg-slate-200" />
                  <div className="h-4 w-28 rounded bg-slate-200" />
                  <div className="h-4 w-40 rounded bg-slate-200 hidden sm:block" />
                  <div className="h-4 w-28 rounded bg-slate-200 hidden sm:block" />
                  <div className="h-4 w-24 rounded bg-slate-200 hidden sm:block" />
                  <div className="h-4 w-16 rounded bg-slate-200 ml-auto" />
                </div>
              ))}
            </div>
          ) : manutencoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
              <p className="mt-4 font-medium text-slate-500">Nenhum registro encontrado.</p>
              <p className="mt-1 text-sm text-slate-500">
                Clique em "Adicionar" para cadastrar uma manutenção.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="overflow-x-auto overflow-y-auto relative flex-1 min-h-0 h-full">
                <table ref={tableRef} className="text-sm" style={{ tableLayout: "fixed", width: frozenWidth || "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                  <thead>
                    <tr className="bg-[#bbb]">
                      {columnOrder.map((logicalIdx, visualIdx) => {
                        const col = COLUMNS[logicalIdx];
                        const isDragSource = dragCol === logicalIdx;
                        return (
                          <th
                            key={logicalIdx}
                            scope="col"
                            className={`sticky top-0 z-30 bg-[#bbb] px-[10px] py-[3px] text-left text-sm font-semibold text-slate-900 min-w-0 align-middle border-r border-b last:border-r-0 border-[#666] select-none cursor-pointer ${isDragSource ? 'opacity-50' : ''}`}
                            style={{ borderRightColor: '#666', borderBottomColor: '#999', backgroundClip: 'padding-box', boxShadow: 'inset 0 -1px 0 #999' }}
                            onClick={(e) => handleHeaderClick(logicalIdx, e)}
                            onMouseDown={(e) => handleHeaderMouseDown(logicalIdx, e)}
                            onDragStart={(e) => e.preventDefault()}
                          >
                            <div className="header-content pr-1">
                              <span>{col.label}</span>
                              <SortIcon column={logicalIdx} />
                            </div>
                            <div className="resizer-handle" onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(logicalIdx, e); }} onDoubleClick={(e) => handleResizeDblClick(logicalIdx, e)} />
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedManutencoes.map((m) => (
                      <tr
                        key={m.id}
                        className={`cursor-[context-menu] hover:bg-[#eee] ${selectedId === m.id ? 'row-selected' : ''}`}
                        onClick={() => setSelectedId((prev) => (prev === m.id ? null : m.id ?? null))}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setSelectedId(m.id ?? null);
                          setContextMenu({ x: e.clientX, y: e.clientY, section: 'patrimonio', item: m });
                        }}
                      >
                        {columnOrder.map((logicalIdx) => {
                          const col = COLUMNS[logicalIdx];
                          const value = (m as unknown as Record<string, unknown>)[col.key];
                          const lookup = columnLookups?.[col.key as keyof Manutencao];
                          const displayValue =
                            lookup && typeof value === 'number'
                              ? (lookup[value] ?? formatCellValue(col.key, value))
                              : formatCellValue(col.key, value);
                          const baseClass = `px-[10px] py-[3px] min-w-0 align-middle font-normal ${col.dataClass || ''}`;
                          return (
                            <td key={logicalIdx} className={baseClass} style={{ color: '#333', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                              <span className="cell-content">{displayValue}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div
                  ref={dropLineRef}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '3px',
                    backgroundColor: '#9ca3af',
                    zIndex: 100,
                    pointerEvents: 'none',
                    display: 'none',
                    transform: 'translateX(0)',
                  }}
                />
              </div>
              <div className="bg-white/95 backdrop-blur-sm px-0 pt-3 pb-0 sticky bottom-0 z-10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-0">
                      <input
                        type="text"
                        aria-label="Número da página"
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const targetPage = Number(pageInput);
                            if (!Number.isNaN(targetPage) && targetPage >= 1 && targetPage <= pageCount) {
                              setCurrentPage(targetPage);
                            } else {
                              setPageInput(String(currentPageSafe));
                            }
                          }
                        }}
                        className="w-16 rounded-[3px] border border-slate-300 bg-white px-2 py-1 text-center text-sm text-slate-900 outline-none transition focus:border-[#003056]"
                      />

                      <div className="flex h-10 w-8 flex-col items-center justify-between rounded-[3px] bg-transparent py-1 px-0">
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.min(pageCount, currentPage + 1);
                            setCurrentPage(next);
                            setPageInput(String(next));
                          }}
                          className="flex h-5 w-full cursor-pointer items-center justify-center rounded-sm text-slate-600 transition focus:outline-none focus:ring-0"
                          aria-label="Próxima página"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 4.5 20 20H4Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const prevPage = Math.max(1, currentPage - 1);
                            setCurrentPage(prevPage);
                            setPageInput(String(prevPage));
                          }}
                          className="flex h-5 w-full cursor-pointer items-center justify-center rounded-sm text-slate-600 transition focus:outline-none focus:ring-0"
                          aria-label="Página anterior"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 19.5 4 4h16Z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Select
                        value={String(pageSize)}
                        onChange={(v) => setPageSize(v === 'all' ? 'all' : Number(v))}
                        options={[
                          { value: '30', label: '30 por página' },
                          { value: '50', label: '50 por página' },
                          { value: '100', label: '100 por página' },
                          { value: 'all', label: 'Todos' },
                        ]}
                        showPlaceholder={false}
                        className="min-w-[130px]"
                      />
                    </div>
                  </div>

                  <div className="text-sm text-slate-600 text-right">
                    {firstRecord === 0
                      ? '0 de ' + totalRecords
                      : `${firstRecord}–${lastRecord} de ${totalRecords}`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
