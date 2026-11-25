"use client";

import LoadingModal from "@/components/ui/LoadingModal";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, MouseEvent as ReactMouseEvent, SetStateAction } from "react";
import type { ContextMenuState } from "@/types/contextMenu";
import type { Copia } from "@/types/copia";
import { COPIA_COLUMNS as COLUMNS } from "@/lib/copiaUtils";
import { extensaoDoArquivo, nomeDoArquivoCopia, urlDoArquivoCopia } from "@/lib/copiaArquivoUtils";
import { isValidOrder, prepararColunasSalvas, CSS_CABECALHO_SEQUENCIA, larguraColunaSequencia, type ColunasConfig } from "@/lib/colunasUtils";
import Select from "@/components/ui/Select";
import { usePaginacaoPersistida } from "@/lib/paginacaoPersistida";
import EmptySelectionMessage from "@/components/ui/EmptySelectionMessage";
import { elementoVisivel, useVersaoVisivel } from "@/lib/visibilidade";
import FiltrosAplicados, { type FiltroAplicado } from "@/components/ui/FiltrosAplicados";

/**
 * Coluna Status (bolinha): fixa como a primeira da tabela, com largura fixa
 * (a do ícone + padding) e sem redimensionar/arrastar — só ordena.
 */
const IDX_STATUS = COLUMNS.findIndex((c) => c.key === 'ie_status');
const LARGURA_COLUNA_STATUS = 28;

/**
 * Coluna do clipe (arquivo): fixa logo depois do Status, com largura fixa e sem
 * redimensionar/arrastar/ordenar. O clipe abre a pré-visualização do arquivo,
 * como em Administração do Sistema > Imagens.
 */
const IDX_CLIPE = COLUMNS.findIndex((c) => c.clipe);
const LARGURA_COLUNA_CLIPE = 30;
/** Quantas colunas ficam fixas no início (Status e clipe). */
const COLUNAS_FIXAS = 2;
/** Imagens abrem na pré-visualização; PDF abre num visualizador; os demais tipos só baixam. */
const EXTENSOES_IMAGEM_PREVIA = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];

/** Garante Status e clipe nas primeiras posições (inclusive em ordens salvas antes). */
function comStatusPrimeiro(order: number[]): number[] {
  return [IDX_STATUS, IDX_CLIPE, ...order.filter((i) => i !== IDX_STATUS && i !== IDX_CLIPE)];
}

interface ListViewProps {
  /** Cards dos filtros aplicados (entre o dropdown e a tabela), cada um com o "x" para tirá-lo. */
  filtrosAplicados?: FiltroAplicado[];
  message: string;
  loading: boolean;
  copias: Copia[];
  openNewForm: () => void;
  openEditForm: (copia: Copia) => void;
  openFilter: () => void;
  handleDelete: (id: string) => void;
  setContextMenu: Dispatch<SetStateAction<ContextMenuState | null>>;
  selectOptions: { value: string; label: string }[];
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  /** Submódulos permitidos do dropdown PAI (Cópias/Parâmetros) conforme permissões. */
  allowedSubmodulos?: string[];
  sortColumn: number | null;
  sortAsc: boolean | null;
  onSortChange: (logicalIndex: number) => void;
  initialColumns?: ColunasConfig | null;
  onColumnsChange?: (config: ColunasConfig) => void;
  /** Texto de cada célula (as referências dependem dos cadastros carregados na tela). */
  formatCellValue: (key: string, value: unknown) => string;
  /** Cor da bolinha da coluna Status, por código do status (Controle de Cópias > Parâmetros). */
  coresStatus?: Record<string, string>;
}

/**
 * Lista de Controle de Cópias > Cópias: mesma lista das demais funções, com a coluna
 * Status (bolinha colorida) fixa à esquerda, como em Patrimônio > Ativos.
 */
export default function CopiaListView({
  filtrosAplicados,
  message,
  loading,
  copias,
  openNewForm,
  openEditForm,
  openFilter,
  handleDelete,
  setContextMenu,
  selectOptions,
  manageSelection,
  onManageSelectionChange,
  allowedSubmodulos = ['copias'],
  sortColumn,
  sortAsc,
  onSortChange,
  initialColumns,
  onColumnsChange,
  formatCellValue,
  coresStatus = {},
}: ListViewProps) {
  const tableRef = useRef<HTMLTableElement>(null);
  // Refaz as larguras quando a função volta a aparecer (montada escondida, ex.: após o F5).
  const versaoVisivel = useVersaoVisivel(tableRef);
  const savedColumns = prepararColunasSalvas(initialColumns, COLUMNS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Legenda da bolinha de status (mesmo visual da legenda das funções no menu lateral),
  // exibida por cima do ícone. Fica em position: fixed para não ser cortada pelas células.
  const [legendaStatus, setLegendaStatus] = useState<{ texto: string; x: number; y: number } | null>(null);
  // Cópia cujo arquivo está na pré-visualização (clipe).
  const [previewCopia, setPreviewCopia] = useState<Copia | null>(null);
  const [frozenWidth, setFrozenWidth] = useState<string | null>(null);
  const [columnOrder, setColumnOrder] = useState<number[]>(() =>
    comStatusPrimeiro(
      savedColumns && isValidOrder(savedColumns.order, COLUMNS.length)
        ? [...savedColumns.order]
        : Array.from({ length: COLUMNS.length }, (_, i) => i)
    )
  );
  const [dragCol, setDragCol] = useState<number | null>(null);
  // Página e quantidade por página persistem até fechar a função (X no menu lateral).
  const { pageSize, setPageSize, currentPage, setCurrentPage } = usePaginacaoPersistida(manageSelection);
  const [pageInput, setPageInput] = useState<string>(() => String(currentPage));
  const minWidthsRef = useRef<number[]>([]);
  const dragStartXRef = useRef(0);
  const didDragRef = useRef(false);
  const dropLineRef = useRef<HTMLDivElement | null>(null);
  const currentWidthsRef = useRef<number[]>(
    savedColumns?.widths && savedColumns.widths.length === COLUMNS.length
      ? [...savedColumns.widths]
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

  /** Larguras ajustadas pelo usuário, por coluna lógica (0 = automática). */
  function largurasAjustadas(): number[] {
    return Array.from({ length: COLUMNS.length }, (_, i) => currentWidthsRef.current[i] || 0);
  }

  function setDefaultColumnWidths() {
    const table = tableRef.current;
    if (!table) return;

    if (minWidthsRef.current.length === 0) {
      measureAllMinWidths();
    }

    // Medição/ajuste de larguras altera estilos do DOM da tabela de propósito.
    // eslint-disable-next-line react-hooks/immutability
    const ths = freezeTableColumns(table);
    ths.forEach((th, domIdx) => {
      const logicalIdx = columnOrder[domIdx];
      const minW = minWidthsRef.current[logicalIdx] || 0;
      const savedW = currentWidthsRef.current[logicalIdx];
      const contentW = Math.max(measureColumnContentWidth(table, domIdx), larguraColunaSequencia(table, domIdx, copias));
      // Largura ajustada pelo usuário (salva) ou automática (maior conteúdo / cabeçalho).
      // A coluna Status tem largura fixa.
      const finalWidth = logicalIdx === IDX_STATUS
        ? LARGURA_COLUNA_STATUS
        : logicalIdx === IDX_CLIPE
        ? LARGURA_COLUNA_CLIPE
        : savedW && savedW > 0 ? savedW : Math.max(minW, contentW);
      // eslint-disable-next-line react-hooks/immutability
      applyColumnWidth(table, ths, domIdx, finalWidth);
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
    if (logicalIndex === IDX_STATUS || logicalIndex === IDX_CLIPE) return; // posição fixa
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
      // Nenhuma coluna pode ir antes do Status e do clipe (posições fixas).
      targetIdx = Math.max(COLUNAS_FIXAS, targetIdx);

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
        onColumnsChange?.({ order: newOrder, widths: largurasAjustadas() });
      }

      setDragCol(null);
      if (dropLineRef.current) dropLineRef.current.style.display = 'none';
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  const totalRecords = copias.length;
  const pageCount = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPageSafe = Math.min(currentPage, pageCount);
  const firstRecord = totalRecords === 0 ? 0 : (pageSize === 'all' ? 1 : (currentPageSafe - 1) * pageSize + 1);
  const lastRecord = totalRecords === 0 ? 0 : (pageSize === 'all' ? totalRecords : Math.min(totalRecords, currentPageSafe * pageSize));
  const paginatedCopias = pageSize === 'all'
    ? copias
    : copias.slice((currentPageSafe - 1) * pageSize, currentPageSafe * pageSize);

  // O campo de página acompanha a página exibida (já limitada ao total de páginas).
  useEffect(() => {
    setPageInput(String(currentPageSafe));
  }, [currentPageSafe]);

  useLayoutEffect(() => {
    const table = tableRef.current;
    // Escondida (função aberta em segundo plano): mantém as larguras atuais.
    if (!table || !elementoVisivel(table)) return;
    measureAllMinWidths();
    setDefaultColumnWidths();
  }, [columnOrder, loading, copias.length, versaoVisivel]);

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
    const finalWidth = Math.max(minW, Math.ceil(maxWidth), larguraColunaSequencia(table, domIdx, copias));
    const totalWidth = applyColumnWidth(table, ths, domIdx, finalWidth);
    setFrozenWidth(`${totalWidth}px`);
    // O auto-ajuste (duplo clique) também é salvo, como o arrastar da borda.
    const larguras = largurasAjustadas();
    larguras[logicalIdx] = 0; // 0 = automática: continua acompanhando o conteúdo
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

  return (
    <>
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
      <div className="flex-1 flex flex-col min-h-0 space-y-6">
        <div className="relative flex min-h-[42px] items-center justify-between gap-3">
          {manageSelection && <FiltrosAplicados filtros={filtrosAplicados} />}
          <div className="flex items-center gap-2">
            <Select
              value={manageSelection}
              onChange={onManageSelectionChange}
              options={selectOptions.filter((o) => allowedSubmodulos.includes(o.value))}
              showPlaceholder={!manageSelection}
              className="!w-[180px]"
            />
            {manageSelection && (
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
              {/* Enquanto os registros carregam, só o modal "Carregando..." (sem animação na lista). */}
              <LoadingModal open message="Carregando..." />
            </div>
          ) : copias.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
              <p className="mt-4 font-medium text-slate-500">Nenhum registro encontrado.</p>
              <p className="mt-1 text-sm text-slate-500">
                Clique em "Adicionar" para cadastrar uma cópia.
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
                        if (logicalIdx === IDX_CLIPE) {
                          return (
                            <th
                              key={logicalIdx}
                              scope="col"
                              aria-label="Arquivo"
                              className="sticky top-0 z-30 bg-[#bbb] px-[8px] py-[3px] text-sm font-semibold text-slate-900 min-w-0 align-middle border-r border-b border-[#666] select-none"
                              style={{ borderRightColor: '#666', borderBottomColor: '#999', backgroundClip: 'padding-box', boxShadow: 'inset 0 -1px 0 #999' }}
                              onDragStart={(e) => e.preventDefault()}
                            />
                          );
                        }
                        if (logicalIdx === IDX_STATUS) {
                          return (
                            <th
                              key={logicalIdx}
                              scope="col"
                              aria-label="Status"
                              className="sticky top-0 z-30 bg-[#bbb] px-[8px] py-[3px] text-sm font-semibold text-slate-900 min-w-0 align-middle border-r border-b border-[#666] select-none cursor-pointer"
                              style={{ borderRightColor: '#666', borderBottomColor: '#999', backgroundClip: 'padding-box', boxShadow: 'inset 0 -1px 0 #999' }}
                              onClick={(e) => handleHeaderClick(logicalIdx, e)}
                              onDragStart={(e) => e.preventDefault()}
                            >
                              <div className="flex items-center justify-center">
                                <SortIcon column={logicalIdx} />
                              </div>
                            </th>
                          );
                        }
                        return (
                          <th
                            key={logicalIdx}
                            scope="col"
                            className={`sticky top-0 z-30 bg-[#bbb] px-[10px] py-[3px] text-left text-sm font-semibold text-slate-900 min-w-0 align-middle border-r border-b last:border-r-0 border-[#666] select-none cursor-pointer ${isDragSource ? 'opacity-50' : ''} ${col.key === 'nr_sequencia' ? 'th-seq' : ''}`}
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
                    {paginatedCopias.map((copia) => (
                      <tr
                        key={copia.id}
                        className={`cursor-[context-menu] hover:bg-[#eee] ${selectedId === copia.id ? 'row-selected' : ''}`}
                        onClick={() => setSelectedId((prev) => (prev === copia.id ? null : copia.id ?? null))}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setSelectedId(copia.id ?? null);
                          setContextMenu({ x: e.clientX, y: e.clientY, section: 'controleCopias', item: copia as unknown as ContextMenuState['item'] });
                        }}
                      >
                        {columnOrder.map((logicalIdx) => {
                          const col = COLUMNS[logicalIdx];
                          const value = copia[col.key];
                          const displayValue = formatCellValue(col.key, value);
                          const baseClass = `${col.key === 'ie_status' ? 'px-[8px]' : 'px-[10px]'} py-[3px] min-w-0 align-middle font-normal ${col.dataClass || ''}`;
                          // Status: bolinha colorida, com a descrição do status como legenda (ao passar o mouse).
                          const corStatus = col.key === 'ie_status' && value ? coresStatus[String(value)] : undefined;
                          return (
                            <td key={logicalIdx} className={logicalIdx === IDX_CLIPE ? 'px-[8px] py-[3px] min-w-0 align-middle' : baseClass} style={{ color: '#333', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                              {logicalIdx === IDX_CLIPE ? (
                                copia.ie_arquivo ? (
                                  <button type="button" onClick={(e) => { e.stopPropagation(); setPreviewCopia(copia); }} className="cursor-pointer p-0 bg-transparent border-none flex items-center justify-center" title="Pré-visualizar arquivo">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                                  </button>
                                ) : null
                              ) : col.key === 'ie_status' ? (
                                <span className="cell-content inline-flex items-center justify-center">
                                  {value ? (
                                    <span
                                      aria-label={displayValue}
                                      className="inline-block h-[10px] w-[10px] rounded-full cursor-pointer"
                                      style={{ backgroundColor: corStatus ?? '#999999' }}
                                      onMouseEnter={(e) => {
                                        const r = e.currentTarget.getBoundingClientRect();
                                        setLegendaStatus({ texto: displayValue, x: r.left + r.width / 2, y: r.top });
                                      }}
                                      onMouseLeave={() => setLegendaStatus(null)}
                                    />
                                  ) : null}
                                </span>
                              ) : (
                                <span className="cell-content">{displayValue}</span>
                              )}
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
                            const next = Math.min(pageCount, currentPageSafe + 1);
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
                            const prevPage = Math.max(1, currentPageSafe - 1);
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
      {/* Pré-visualização do arquivo (coluna do clipe), como em Administração do Sistema > Imagens. */}
      {previewCopia && previewCopia.ie_arquivo && (() => {
        const caminho = previewCopia.ie_arquivo;
        const nome = nomeDoArquivoCopia(caminho);
        const ext = extensaoDoArquivo(nome);
        const url = urlDoArquivoCopia(caminho);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="absolute inset-0 bg-black/40" onClick={() => setPreviewCopia(null)} />
            <div className="relative w-full bg-white modal-dark p-0 shadow-xl shadow-black/20 flex flex-col" style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
              <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
                <h2 className="text-base font-semibold" style={{ color: '#000' }}>{nome}</h2>
                <button type="button" onClick={() => setPreviewCopia(null)} className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0" aria-label="Fechar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
                </button>
              </div>
              <div style={{ flex: '1 1 0%', minHeight: 0, overflow: 'hidden', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {ext === 'pdf' ? (
                  <iframe src={url} title={nome} style={{ width: 'min(85vw, 1000px)', height: '75vh', border: 'none', display: 'block' }} />
                ) : EXTENSOES_IMAGEM_PREVIA.includes(ext) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={nome} style={{ maxWidth: 'min(87vw, 87vh)', maxHeight: 'min(75vh, 75vw)', objectFit: 'contain', display: 'block' }} />
                ) : (
                  <p className="px-6 py-10 text-sm text-slate-500">Pré-visualização indisponível para arquivos .{ext}. Use &quot;Baixar&quot; para abrir o arquivo.</p>
                )}
              </div>
              <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
                <button type="button" onClick={() => setPreviewCopia(null)} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}>
                  Fechar
                </button>
                <button type="button" onClick={() => { window.location.href = `${url}&baixar=1`; }} className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}>
                  Baixar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {legendaStatus && (
        <span
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg shadow-black/25 whitespace-nowrap"
          style={{ left: legendaStatus.x, top: legendaStatus.y - 8 }}
        >
          {legendaStatus.texto}
          <span className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 h-2 w-2 rotate-45 bg-slate-900" />
        </span>
      )}
    </>
  );
}
