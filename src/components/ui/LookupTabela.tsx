"use client";

import { formatDate } from "@/lib/pessoaFisicaUtils";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { isValidOrder, prepararColunasSalvas, CSS_CABECALHO_SEQUENCIA, larguraColunaSequencia, type ColunasConfig } from "@/lib/colunasUtils";
/** Linha do lookup: nr_sequencia + valores já prontos para exibir (texto). */
export interface LookupLinha {
  id?: string;
  nr_sequencia: number;
  [chave: string]: unknown;
}

export interface LookupColumn {
  key: string;
  label: string;
  dataClass?: string;
}

interface LookupTabelaProps<T extends LookupLinha> {
  colunas: LookupColumn[];
  linhas: T[];
  onSelect: (linha: T) => void;
  /** Ordem e largura das colunas salvas no usuário (0 = largura automática). */
  initialColumns?: ColunasConfig | null;
  onColumnsChange?: (config: ColunasConfig) => void;
  /**
   * Seleção múltipla (ex.: Assumir ativos): coluna de caixas fixa à esquerda, com a do título
   * marcando/desmarcando todas as linhas do resultado. Com ela, o duplo clique marca a linha.
   */
  selecao?: {
    marcados: ReadonlySet<number>;
    alternar: (nrSequencia: number, marcar: boolean) => void;
    alternarTodos: (marcar: boolean) => void;
  };
}

/** Largura da coluna de seleção (a mesma das listas com caixas). */
const LARGURA_COLUNA_SELECAO = 32;
/** Cabeçalhos das colunas de dados (a de seleção fica fora da medição e da ordem). */
const SELETOR_TH_DADOS = "thead tr th:not(.col-selecao)";

/**
 * Tabela dos lookups (janelas "Localizar ..."), com o mesmo comportamento das demais:
 * colunas redimensionáveis (duplo clique = largura automática), arrastáveis e ordenáveis
 * (clique no cabeçalho), ordem padrão pela coluna # decrescente e duplo clique na linha
 * para selecionar.
 */
export default function LookupTabela<T extends LookupLinha>({ colunas, linhas, onSelect, initialColumns, onColumnsChange, selecao }: LookupTabelaProps<T>) {
  /** A coluna de seleção vem antes das de dados: desloca o nth-child das células. */
  const desloc = selecao ? 1 : 0;
  const larguraSelecao = selecao ? LARGURA_COLUNA_SELECAO : 0;
  const ativos = linhas;
  const tableRef = useRef<HTMLTableElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [frozenWidth, setFrozenWidth] = useState<string | null>(null);
  const lookupColumns = colunas;
  const savedColumns = prepararColunasSalvas(initialColumns, lookupColumns);
  const [columnOrder, setColumnOrder] = useState<number[]>(() =>
    savedColumns && isValidOrder(savedColumns.order, lookupColumns.length)
      ? [...savedColumns.order]
      : lookupColumns.map((_, i) => i)
  );
  /** Larguras ajustadas pelo usuário, por coluna lógica (0 = automática). */
  const currentWidthsRef = useRef<number[]>(
    savedColumns && savedColumns.widths.length === lookupColumns.length ? [...savedColumns.widths] : []
  );
  function largurasAjustadas(): number[] {
    return Array.from({ length: lookupColumns.length }, (_, i) => currentWidthsRef.current[i] || 0);
  }
  const [dragCol, setDragCol] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean | null>(null);
  const minWidthsRef = useRef<number[]>([]);
  const dragStartXRef = useRef(0);
  const didDragRef = useRef(false);
  const dropLineRef = useRef<HTMLDivElement | null>(null);

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
    const ths = table.querySelectorAll<HTMLElement>(SELETOR_TH_DADOS);
    if (ths.length === 0) return [];
    const widths = new Array(lookupColumns.length).fill(0);
    ths.forEach((th, domIdx) => {
      const logicalIdx = columnOrder[domIdx];
      widths[logicalIdx] = measureHeaderMinWidth(th);
    });
    minWidthsRef.current = widths;
    return widths;
  }

  function freezeTableColumns(table: HTMLTableElement) {
    const ths = table.querySelectorAll<HTMLElement>(SELETOR_TH_DADOS);
    ths.forEach((th) => {
      th.style.boxSizing = "border-box";
      th.style.width = `${th.offsetWidth}px`;
      th.style.maxWidth = `${th.offsetWidth}px`;
      th.style.minWidth = "0px";
    });
    const totalWidth = larguraSelecao + Array.from(ths).reduce((sum, th) => sum + th.offsetWidth, 0);
    table.style.width = `${totalWidth}px`;
    setFrozenWidth(`${totalWidth}px`);
    return ths;
  }

  function applyColumnWidth(table: HTMLTableElement, ths: NodeListOf<HTMLElement>, domIdx: number, width: number) {
    const th = ths[domIdx];
    th.style.width = `${width}px`;
    th.style.maxWidth = `${width}px`;
    th.style.minWidth = "0px";
    table.querySelectorAll<HTMLElement>(`tbody tr td:nth-child(${domIdx + 1 + desloc})`).forEach((td) => {
      td.style.width = `${width}px`;
      td.style.maxWidth = `${width}px`;
      td.style.minWidth = "0px";
    });
    const totalWidth = larguraSelecao + Array.from(ths).reduce((sum, thEl, i) => {
      if (i === domIdx) return sum + width;
      return sum + (parseFloat(thEl.style.width) || thEl.offsetWidth);
    }, 0);
    table.style.width = `${totalWidth}px`;
    return totalWidth;
  }

  function handleSortClick(logicalIndex: number) {
    if (sortColumn === logicalIndex) {
      if (sortAsc === true) setSortAsc(false);
      else if (sortAsc === false) { setSortColumn(null); setSortAsc(null); }
      else setSortAsc(true);
    } else {
      setSortColumn(logicalIndex);
      setSortAsc(true);
    }
  }

  function handleHeaderClick(logicalIndex: number, e: ReactMouseEvent<HTMLTableCellElement>) {
    if (didDragRef.current) { didDragRef.current = false; return; }
    if ((e.target as HTMLElement).closest(".resizer-handle")) return;
    handleSortClick(logicalIndex);
  }

  function handleHeaderMouseDown(logicalIndex: number, e: ReactMouseEvent<HTMLTableCellElement>) {
    if ((e.target as HTMLElement).closest(".resizer-handle")) return;
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
      const wrapper = tableRef.current.closest<HTMLElement>(".overflow-x-auto");
      const ths = tableRef.current.querySelectorAll<HTMLElement>(SELETOR_TH_DADOS);
      let targetIdx = ths.length;
      for (let i = 0; i < ths.length; i++) {
        const rect = ths[i].getBoundingClientRect();
        const midX = rect.left + rect.width / 2;
        if (ev.clientX < midX) { targetIdx = i; break; }
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
        const curPos = newOrder.indexOf(logicalIndex);
        newOrder.splice(curPos, 1);
        const adjustedDrop = currentDropIdx > curPos ? currentDropIdx - 1 : currentDropIdx;
        newOrder.splice(adjustedDrop, 0, logicalIndex);
        setColumnOrder(newOrder);
        onColumnsChange?.({ order: newOrder, widths: largurasAjustadas() });
      }
      setDragCol(null);
      if (dropLineRef.current) dropLineRef.current.style.display = "none";
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  function handleResizeDblClick(logicalIdx: number, e: ReactMouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    const table = tableRef.current;
    if (!table) return;
    const domIdx = columnOrder.indexOf(logicalIdx);
    if (domIdx === -1) return;
    if (minWidthsRef.current.length === 0) measureAllMinWidths();
    const ths = freezeTableColumns(table);
    const cells = table.querySelectorAll<HTMLElement>(`tbody tr td:nth-child(${domIdx + 1 + desloc})`);
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
    const finalWidth = Math.max(minW, Math.ceil(maxWidth), larguraColunaSequencia(table, domIdx, ativos));
    const totalWidth = applyColumnWidth(table, ths, domIdx, finalWidth);
    setFrozenWidth(`${totalWidth}px`);
    // Duplo clique = largura automática (acompanha o conteúdo); salvo.
    const larguras = largurasAjustadas();
    larguras[logicalIdx] = 0;
    currentWidthsRef.current = larguras;
    onColumnsChange?.({ order: columnOrder, widths: larguras });
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
        const larguras = largurasAjustadas();
        larguras[logicalIdx] = th.offsetWidth;
        currentWidthsRef.current = larguras;
        onColumnsChange?.({ order: columnOrder, widths: larguras });
      }
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  const enrichedData = ativos;

  const sortedData = useMemo(() => {
    // Ordem padrão: coluna # (nr_sequencia).
    if (sortColumn === null || sortAsc === null) return [...enrichedData].sort((a, b) => b.nr_sequencia - a.nr_sequencia);
    const key = lookupColumns[sortColumn].key;
    return [...enrichedData].sort((a, b) => {
      const valA = (a as unknown as Record<string, unknown>)[key];
      const valB = (b as unknown as Record<string, unknown>)[key];
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      if (typeof valA === "number" && typeof valB === "number") {
        return sortAsc ? valA - valB : valB - valA;
      }
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortAsc ? -1 : 1;
      if (strA > strB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [enrichedData, sortColumn, sortAsc, lookupColumns]);

  useLayoutEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    measureAllMinWidths();
    setDefaultColumnWidths();
  }, [columnOrder, ativos.length]);

  function setDefaultColumnWidths() {
    const table = tableRef.current;
    if (!table) return;
    if (minWidthsRef.current.length === 0) measureAllMinWidths();
    const ths = freezeTableColumns(table);
    ths.forEach((th, domIdx) => {
      const logicalIdx = columnOrder[domIdx];
      const minW = minWidthsRef.current[logicalIdx] || 0;
      const contentW = Math.max(measureColumnContentWidth(table, domIdx), larguraColunaSequencia(table, domIdx, ativos));
      const savedW = currentWidthsRef.current[logicalIdx];
      const finalWidth = savedW && savedW > 0 ? savedW : Math.max(minW, contentW);
      applyColumnWidth(table, ths, domIdx, finalWidth);
    });
    setFrozenWidth(table.style.width);
  }

  function measureColumnContentWidth(table: HTMLTableElement, domIdx: number): number {
    const cells = table.querySelectorAll<HTMLElement>(`tbody tr td:nth-child(${domIdx + 1 + desloc})`);
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

  return (
    <div className="flex-1 p-[15px] min-h-0 flex flex-col">
      {ativos.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-slate-600">
          Nenhum registro encontrado.
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <style>{`
            .resizer-handle { position: absolute; right: 0; top: 0; bottom: 0; width: 7px; cursor: col-resize; z-index: 10; }
            th, td { min-width: 0 !important; box-sizing: border-box; }
            th { white-space: nowrap; overflow: hidden; }
            th .header-content { display: flex; align-items: center; justify-content: space-between; gap: 4px; white-space: nowrap; overflow: hidden; width: 100%; }
            th .header-content > span { overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0; }
            th .header-content > svg { flex-shrink: 0; margin-left: auto; }
            td { max-width: 0; overflow: hidden; }
            .cell-content { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; min-width: 0; }
            ${CSS_CABECALHO_SEQUENCIA}
          `}</style>
          <div className="overflow-x-auto overflow-y-auto relative flex-1 min-h-0 h-full">
            <table ref={tableRef} className="text-sm" style={{ tableLayout: "fixed", width: frozenWidth || "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr className="bg-[#bbb]">
                  {selecao && (
                    <th
                      scope="col"
                      className="col-selecao sticky top-0 left-0 z-40 bg-[#bbb] px-[8px] py-[3px] min-w-0 align-middle border-r border-b border-[#666] select-none"
                      style={{ width: LARGURA_COLUNA_SELECAO, maxWidth: LARGURA_COLUNA_SELECAO, borderRightColor: "#666", borderBottomColor: "#999", backgroundClip: "padding-box", boxShadow: "inset 0 -1px 0 #999" }}
                    >
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="cg-checkbox"
                          aria-label="Selecionar todos os registros do resultado"
                          checked={ativos.length > 0 && ativos.every((l) => selecao.marcados.has(l.nr_sequencia))}
                          onChange={(e) => selecao.alternarTodos(e.target.checked)}
                        />
                      </div>
                    </th>
                  )}
                  {columnOrder.map((logicalIdx) => {
                    const col = lookupColumns[logicalIdx];
                    const isDragSource = dragCol === logicalIdx;
                    return (
                      <th
                        key={logicalIdx}
                        scope="col"
                        className={`sticky top-0 z-30 bg-[#bbb] px-[10px] py-[3px] text-left text-sm font-semibold text-slate-900 min-w-0 align-middle border-r border-b last:border-r-0 border-[#666] select-none cursor-pointer ${isDragSource ? 'opacity-50' : ''} ${col.key === 'nr_sequencia' ? 'th-seq' : ''}`}
                        style={{ borderRightColor: "#666", borderBottomColor: "#999", backgroundClip: "padding-box", boxShadow: "inset 0 -1px 0 #999" }}
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
                {sortedData.map((ativo) => (
                  <tr
                    key={ativo.id ?? ativo.nr_sequencia}
                    className={`cursor-pointer hover:bg-[#eee] ${selectedId === (ativo.id ?? null) ? "row-selected" : ""}`}
                    onDoubleClick={() => {
                      setSelectedId(ativo.id ?? null);
                      if (selecao) selecao.alternar(ativo.nr_sequencia, !selecao.marcados.has(ativo.nr_sequencia));
                      else onSelect(ativo);
                    }}
                  >
                    {selecao && (
                      <td
                        className="col-selecao sticky left-0 z-20 bg-white px-[8px] py-[3px] min-w-0 align-middle"
                        style={{ width: LARGURA_COLUNA_SELECAO, maxWidth: LARGURA_COLUNA_SELECAO, borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}
                        onClick={(e) => e.stopPropagation()}
                        onDoubleClick={(e) => e.stopPropagation()}
                      >
                        <span className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            className="cg-checkbox"
                            aria-label={`Selecionar o registro ${ativo.nr_sequencia}`}
                            checked={selecao.marcados.has(ativo.nr_sequencia)}
                            onChange={(e) => selecao.alternar(ativo.nr_sequencia, e.target.checked)}
                          />
                        </span>
                      </td>
                    )}
                    {columnOrder.map((logicalIdx) => {
                      const col = lookupColumns[logicalIdx];
                      const value = (ativo as unknown as Record<string, unknown>)[col.key];
                      const displayValue = value === null || value === undefined ? "" : col.key.startsWith("dt_") ? formatDate(String(value)) : String(value);
                      return (
                        <td key={logicalIdx} className={`px-[10px] py-[3px] min-w-0 align-middle font-normal ${col.dataClass || ""}`} style={{ color: "#333", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
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
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "3px",
                backgroundColor: "#9ca3af",
                zIndex: 100,
                pointerEvents: "none",
                display: "none",
                transform: "translateX(0)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
