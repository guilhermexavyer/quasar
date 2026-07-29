"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  criarAluno,
  excluirAluno,
  obterAlunos,
  atualizarAluno,
} from "@/services/alunosService";
import type { Aluno } from "@/types/aluno";

/* ------------------------------------------------------------------ */
/*  Ícones SVG inline                                                 */
/* ------------------------------------------------------------------ */

const Icons = {
  add: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" /><path d="M5 12h14" />
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  back: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
};

/* ------------------------------------------------------------------ */
/*  Estado inicial do formulário                                      */
/* ------------------------------------------------------------------ */

const emptyForm: Omit<Aluno, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao"> = {
  ds_nome: "",
  nr_cpf: "",
  dt_nascimento: "",
  ds_email: "",
  nr_telefone: "",
};

type ViewType = "list" | "form";

/* ------------------------------------------------------------------ */
/*  Tipos das props dos subcomponentes                                */
/* ------------------------------------------------------------------ */

interface ListViewProps {
  message: string;
  loading: boolean;
  alunos: Aluno[];
  openNewForm: () => void;
  openEditForm: (aluno: Aluno) => void;
  handleDelete: (id: string) => void;
  setContextMenu: React.Dispatch<React.SetStateAction<{
    x: number;
    y: number;
    aluno: Aluno;
  } | null>>;
}

type FormData = Omit<Aluno, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao">;

interface FormViewProps {
  message: string;
  editingId: string | null;
  sequence?: number | null;
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  submitting: boolean;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  goToList: () => void;
}

/* ------------------------------------------------------------------ */
/*  Definição centralizada das colunas                                */
/* ------------------------------------------------------------------ */

interface ColDef {
  key: keyof Aluno;
  label: string;
  headerLabel?: string;
  dataClass?: string;
  headerClass?: string;
}

const COLUMNS: ColDef[] = [
  { key: 'nr_sequencia', label: '#', dataClass: 'text-center' },
  { key: 'ds_nome', label: 'Nome', dataClass: 'text-black' },
  { key: 'nr_cpf', label: 'CPF' },
  { key: 'dt_nascimento', label: 'Nascimento' },
  { key: 'ds_email', label: 'E-mail' },
  { key: 'nr_telefone', label: 'Telefone' },
  { key: 'dt_criacao', label: 'Criação' },
  { key: 'dt_alteracao', label: 'Alteração' },
];

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatDate(value: string): string {
  if (!value) return '';

  // ISO datetime (with time) -> show date + time in local timezone
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const pad = (n: number) => String(n).padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  // ISO date without time or YYYY/MM/DD
  if (/^\d{4}-\d{2}-\d{2}/.test(value) || /^\d{4}\/\d{2}\/\d{2}/.test(value)) {
    const [year, month, day] = value.split('T')[0].split(/[-\/]/);
    return `${day}/${month}/${year}`;
  }

  // Fallback: try to extract DDMMYYYY from digits
  const digits = value.replace(/\D/g, '');
  if (digits.length === 8) {
    const dayFirst = digits.slice(0, 2);
    const monthFirst = digits.slice(2, 4);
    const yearFirst = digits.slice(4, 8);
    const yearSecond = digits.slice(0, 4);
    const monthSecond = digits.slice(4, 6);
    const daySecond = digits.slice(6, 8);

    const isValidDayMonth = (d: number, m: number) => d >= 1 && d <= 31 && m >= 1 && m <= 12;
    if (isValidDayMonth(Number(dayFirst), Number(monthFirst))) {
      return `${dayFirst}/${monthFirst}/${yearFirst}`;
    }

    if (isValidDayMonth(Number(daySecond), Number(monthSecond))) {
      return `${daySecond}/${monthSecond}/${yearSecond}`;
    }
  }

  return value;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function applyCpfMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function applyDateMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  return digits;
}

function applyPhoneMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCellValue(key: keyof Aluno, value: unknown): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);

  if (!stringValue) return '';

  switch (key) {
    case 'nr_cpf':
      return formatCpf(stringValue);
    case 'dt_nascimento':
    case 'dt_criacao':
    case 'dt_alteracao':
      return formatDate(stringValue);
    case 'nr_telefone':
      return formatPhone(stringValue);
    default:
      return stringValue;
  }
}

/* ------------------------------------------------------------------ */
/*  ListView — componente estável, sem remontagem indevida            */
/* ------------------------------------------------------------------ */  function ListView({
  message,
  loading,
  alunos,
  openNewForm,
  openEditForm,
  handleDelete,
  setContextMenu,
}: ListViewProps) {
  const tableRef = useRef<HTMLTableElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean | null>(null);
  const [frozenWidth, setFrozenWidth] = useState<string | null>(null);
  const [columnOrder, setColumnOrder] = useState<number[]>([0, 1, 2, 3, 4, 5, 6, 7]);
  const [dragCol, setDragCol] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState<number | 'all'>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>('1');
  const minWidthsRef = useRef<number[]>([]);
  const dragStartXRef = useRef(0);
  const didDragRef = useRef(false);
  const dropLineRef = useRef<HTMLDivElement | null>(null);

  /* Mede a largura mínima de um <th> usando um clone isolado do cabeçalho,
     sem depender do conteúdo das linhas da tabela. */
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
      const contentW = measureColumnContentWidth(table, domIdx);
      const finalWidth = Math.max(minW, contentW);
      applyColumnWidth(table, ths, domIdx, finalWidth);
    });

    setFrozenWidth(table.style.width);
  }


  /* ── Alternar ordenação ao clicar no cabeçalho ── */
  function handleSortClick(logicalIndex: number) {
    if (sortColumn === logicalIndex) {
      if (sortAsc) {
        setSortAsc(false);
      } else {
        setSortColumn(null);
        setSortAsc(null);
      }
    } else {
      setSortColumn(logicalIndex);
      setSortAsc(true);
    }
  }

  /* ── Evita ordenar durante drag ou clique no resizer ── */
  function handleHeaderClick(logicalIndex: number, e: React.MouseEvent) {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if ((e.target as HTMLElement).closest('.resizer-handle')) return;
    handleSortClick(logicalIndex);
  }

  /* ── Inicia drag da coluna (se não for no resizer handle) ── */
  function handleHeaderMouseDown(logicalIndex: number, e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('.resizer-handle')) return;
    dragStartXRef.current = e.clientX;
    didDragRef.current = false;
    let currentDropIdx: number | null = null;

    function onMouseMove(ev: MouseEvent) {
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

      /* Atualiza a linha indicadora de drop */
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
      }

      setDragCol(null);
      if (dropLineRef.current) dropLineRef.current.style.display = 'none';
      // NOTA: não resetar didDragRef aqui — o evento `click` dispara DEPOIS de `mouseup`.
      // O handleHeaderClick precisa ver didDragRef.current === true para bloquear a ordenação.
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  /* ── Lista ordenada ── */
  const sortedAlunos = useMemo(() => {
    const sorted = [...alunos];
    if (sortColumn === null || sortAsc === null) {
      return sorted.sort((a, b) => {
        const dateA = a.dt_criacao || "";
        const dateB = b.dt_criacao || "";
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return a.nr_sequencia - b.nr_sequencia;
      });
    }

    const key = COLUMNS[sortColumn].key;
    return sorted.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortAsc ? -1 : 1;
      if (strA > strB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [alunos, sortColumn, sortAsc]);

  const totalRecords = sortedAlunos.length;
  const pageCount = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPageSafe = Math.min(currentPage, pageCount);
  const firstRecord = totalRecords === 0 ? 0 : (pageSize === 'all' ? 1 : (currentPageSafe - 1) * pageSize + 1);
  const lastRecord = totalRecords === 0 ? 0 : (pageSize === 'all' ? totalRecords : Math.min(totalRecords, currentPageSafe * pageSize));
  const paginatedAlunos = pageSize === 'all'
    ? sortedAlunos
    : sortedAlunos.slice((currentPageSafe - 1) * pageSize, currentPageSafe * pageSize);

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

  /* ── Mede a largura mínima de cada coluna com base APENAS no cabeçalho ── */
  useLayoutEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    measureAllMinWidths();
    setDefaultColumnWidths();
  }, [columnOrder, loading, alunos.length]);

  /* ── Ícone de ordenação para o cabeçalho (in-flow para entrar na medição) ── */
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

  /* ── Autoajuste da coluna ao dar duplo clique na borda ── */
  function handleResizeDblClick(logicalIdx: number, e: React.MouseEvent) {
    e.stopPropagation();
    const table = tableRef.current;
    if (!table) return;

    const domIdx = columnOrder.indexOf(logicalIdx);
    if (domIdx === -1) return;

    if (minWidthsRef.current.length === 0) measureAllMinWidths();

    /* Congela as colunas na largura atual. */
    const ths = freezeTableColumns(table);

    /* Para o autoajuste, considera o maior conteúdo da coluna entre os registros. */
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

  /* ── Redimensionar coluna ao arrastar ── */
  function handleResizeStart(logicalIdx: number, e: React.MouseEvent) {
    e.preventDefault();
    const table = tableRef.current;
    if (!table) return;

    const domIdx = columnOrder.indexOf(logicalIdx);
    if (domIdx === -1) return;

    if (minWidthsRef.current.length === 0) measureAllMinWidths();

    /* ── 1. Congela todas as colunas na largura atual (sem max-content, que
          forçaria a tabela a considerar o conteúdo das células) ── */
    const ths = freezeTableColumns(table);

    const th = ths[domIdx];
    const startWidth = th.offsetWidth;
    const startX = e.clientX;
    const minW = minWidthsRef.current[logicalIdx] || 0;

    function onMouseMove(ev: MouseEvent) {
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
      }
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  return (
    <>
      {/* Style para o resizer handle - evita gerar CSS complexo via Tailwind */}
      <style>{`
        .resizer-handle { position: absolute; right: 0; top: 0; bottom: 0; width: 7px; cursor: col-resize; z-index: 10; }
        .resizer-handle::after { content: ""; position: absolute; right: 2px; top: 4px; bottom: 4px; width: 3px; border-radius: 2px; background: transparent; transition: background-color 150ms; }
        .resizer-handle:hover::after { background-color: #94a3b8; }
        th, td { min-width: 0 !important; box-sizing: border-box; }
        th { white-space: nowrap; overflow: hidden; }
        th .header-content { display: flex; align-items: center; justify-content: space-between; gap: 4px; white-space: nowrap; overflow: hidden; width: 100%; }
        th .header-content > span { overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0; }
        th .header-content > svg { flex-shrink: 0; margin-left: auto; }
        /* max-width:0 permite que a coluna encolha abaixo do conteúdo das células */
        td { max-width: 0; overflow: hidden; }
        .cell-content { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; min-width: 0; }
      `}</style>
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-semibold">Pessoas Físicas</h1>
        <button
          type="button"
          onClick={openNewForm}
          className="inline-flex items-center rounded-[3px] border border-transparent bg-transparent px-4 py-2.5 text-sm font-normal text-[#066fc5] transition cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2 active:outline active:outline-1 active:outline-[#066fc5] active:outline-offset-2"
        >
          Adicionar
        </button>
      </div>

      {/* Lista */}
      <div className="bg-white flex-1 flex flex-col min-h-0 overflow-hidden">
        {loading ? (
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
        ) : alunos.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-[3px] bg-slate-100">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <p className="mt-4 font-medium text-slate-700">Nenhum registro encontrado</p>
            <p className="mt-1 text-sm text-slate-500">
              Clique em "Adicionar" para cadastrar uma pessoa física.
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
                      const isLast = visualIdx === columnOrder.length - 1;
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
                  {paginatedAlunos.map((aluno) => (
                    <tr
                      key={aluno.id}
                      className="cursor-[context-menu] hover:bg-[#eee]"
                      style={{ backgroundColor: selectedId === aluno.id ? 'rgba(3,102,214,0.10)' : undefined }}
                      onClick={() => setSelectedId((prev) => (prev === aluno.id ? null : aluno.id))}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setSelectedId(aluno.id ?? null);
                        setContextMenu({ x: e.clientX, y: e.clientY, aluno });
                      }}
                    >
                      {columnOrder.map((logicalIdx) => {
                        const col = COLUMNS[logicalIdx];
                        const value = aluno[col.key];
                        const displayValue = formatCellValue(col.key, value);
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
              {/* Linha indicadora de drop (fora da tabela mas dentro do wrapper relative) */}
              <div
                ref={dropLineRef}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '3px',
                  backgroundColor: '#003056',
                  zIndex: 100,
                  pointerEvents: 'none',
                  display: 'none',
                  transform: 'translateX(0)',
                }}
              />
            </div>
            <div className="bg-white/95 backdrop-blur-sm px-0 pt-3 pb-0 sticky bottom-0 z-10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2">
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
                      className="w-24 rounded-[3px] border border-slate-300 bg-white px-2 py-1 text-center text-sm text-slate-900 outline-none transition focus:border-[#003056]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      aria-label="Registros por página"
                      value={pageSize}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPageSize(value === 'all' ? 'all' : Number(value));
                      }}
                      className="rounded-[3px] border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 outline-none transition focus:border-[#003056]"
                    >
                      <option value={25}>25 por página</option>
                      <option value={50}>50 por página</option>
                      <option value={100}>100 por página</option>
                      <option value="all">Todos</option>
                    </select>
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

/* ------------------------------------------------------------------ */
/*  FormView — componente estável, sem remontagem indevida            */
/* ------------------------------------------------------------------ */

function FormView({
  message,
  editingId,
  sequence,
  form,
  setForm,
  submitting,
  handleSubmit,
  goToList,
}: FormViewProps) {
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (submitting) return;
        const f = formRef.current;
        if (!f) return;
        if (typeof (f as any).requestSubmit === 'function') {
          (f as any).requestSubmit();
        } else {
          // fallback: click submit button
          const btn = f.querySelector('button[type="submit"]') as HTMLButtonElement | null;
          if (btn) btn.click();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [submitting]);
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Topo com fechamento */}
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-semibold">Pessoas Físicas</h1>
        <button
          type="button"
          onClick={goToList}
          className="inline-flex items-center rounded-[3px] border border-transparent bg-transparent px-4 py-2.5 text-sm font-normal text-[#066fc5] transition cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2 active:outline active:outline-1 active:outline-[#066fc5] active:outline-offset-2"
        >
          Fechar
        </button>
      </div>

      {/* Formulário */}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="mt-4 flex-1 flex flex-col min-h-0"
      >
        <div className="grid gap-[15px] sm:grid-cols-12 pt-2">
          <div className="sm:col-span-1">
            <label className="block text-sm mb-1" style={{ color: '#666' }}>
              Sequência
            </label>
            <input
              disabled
              value={String(sequence ?? '')}
              className="w-full rounded-[3px] border border-slate-300 px-2 py-1.5 text-sm transition focus:outline-none"
            />
          </div>

          <div className="sm:col-span-11">
            <label className="block text-sm mb-1" style={{ color: '#666' }}>
              Nome completo
            </label>
            <input
              className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
              value={form.ds_nome}
              onChange={(e) => setForm({ ...form, ds_nome: e.target.value })}
            />
          </div>

          <div className="sm:col-span-6">
            <label className="block text-sm mb-1" style={{ color: '#666' }}>
              CPF
            </label>
            <input
              inputMode="numeric"
              maxLength={14}
              className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
              value={form.nr_cpf}
              onChange={(e) => setForm({ ...form, nr_cpf: applyCpfMask(e.target.value) })}
            />
          </div>

          <div className="sm:col-span-6">
            <label className="block text-sm mb-1" style={{ color: '#666' }}>
              Data de nascimento
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="DD/MM/AAAA"
              className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
              value={form.dt_nascimento}
              onChange={(e) =>
                setForm({ ...form, dt_nascimento: applyDateMask(e.target.value) })
              }
            />
          </div>

          <div className="sm:col-span-6">
            <label className="block text-sm mb-1" style={{ color: '#666' }}>
              E-mail
            </label>
            <input
              type="email"
              className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
              value={form.ds_email}
              onChange={(e) => setForm({ ...form, ds_email: e.target.value })}
            />
          </div>

          <div className="sm:col-span-6">
            <label className="block text-sm mb-1" style={{ color: '#666' }}>
              Telefone
            </label>
            <input
              inputMode="numeric"
              maxLength={15}
              className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
              value={form.nr_telefone}
              onChange={(e) => setForm({ ...form, nr_telefone: applyPhoneMask(e.target.value) })}
            />
          </div>
        </div>

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={goToList}
              className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
              style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
              style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
            >
              Salvar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Componente principal                                              */
/* ------------------------------------------------------------------ */

export default function Home() {
  const [form, setForm] = useState<FormData>(emptyForm);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [view, setView] = useState<ViewType>("list");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMounted, setToastMounted] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    aluno: Aluno;
  } | null>(null);

  /* ── Carregar alunos ── */
  const loadAlunos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterAlunos();
      setAlunos(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlunos();
  }, [loadAlunos]);

  /* ── Fechar menu de contexto ao clicar/right-click fora ── */
  useEffect(() => {
    if (!contextMenu) return;
    function handleClose() {
      setContextMenu(null);
    }
    document.addEventListener("click", handleClose);
    document.addEventListener("contextmenu", handleClose);
    return () => {
      document.removeEventListener("click", handleClose);
      document.removeEventListener("contextmenu", handleClose);
    };
  }, [contextMenu]);

  /* ── Abrir formulário para novo registro ── */
  function openNewForm() {
    setForm(emptyForm);
    setEditingId(null);
    setMessage("");
    setView("form");
  }

  /* ── Abrir formulário para editar ── */
  function openEditForm(aluno: Aluno) {
    setForm({
      ds_nome: aluno.ds_nome,
      nr_cpf: aluno.nr_cpf,
      dt_nascimento: aluno.dt_nascimento,
      ds_email: aluno.ds_email,
      nr_telefone: aluno.nr_telefone,
    });
    setEditingId(aluno.id ?? null);
    setMessage("");
    setView("form");
  }

  /* ── Voltar para lista ── */
  function goToList() {
    setForm(emptyForm);
    setEditingId(null);
    setMessage("");
    setView("list");
  }

  /* ── Salvar (criar ou atualizar) ── */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      if (editingId) {
        await atualizarAluno(editingId, form);
        setMessage("Atualizado com sucesso!");
      } else {
        await criarAluno(form);
        setMessage("Cadastrado com sucesso!");
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadAlunos();
      setView("list");
    } catch {
      setMessage("Erro ao salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Excluir ── */
  async function handleDelete(id: string) {
    setMessage("");
    try {
      await excluirAluno(id);
      setMessage("Excluído com sucesso!");
      await loadAlunos();
    } catch {
      setMessage("Erro ao excluir.");
    }
  }

  function getMessageStatus(message: string) {
    if (message.toLowerCase().includes("sucesso")) return "success";
    if (message.toLowerCase().includes("erro")) return "error";
    return "warning";
  }

  const messageStatus = getMessageStatus(message);

  const toastBg = messageStatus === 'success' ? '#2cc958' : messageStatus === 'warning' ? '#f59e0b' : '#ef4444';
  const toastTextClass = messageStatus === 'warning' ? 'text-slate-950' : 'text-white';
  const toastBorderColor = messageStatus === 'success' ? '#23A146' : messageStatus === 'warning' ? '#b46a00' : '#9b1230';

  useEffect(() => {
    if (!message) {
      setToastVisible(false);
      return;
    }

    setToastMounted(true);
    setToastVisible(true);

    const hideTimer = window.setTimeout(() => {
      setToastVisible(false);
    }, 5000);

    return () => window.clearTimeout(hideTimer);
  }, [message]);

  useEffect(() => {
    if (!toastMounted) return;
    if (toastVisible) return;

    const unmountTimer = window.setTimeout(() => {
      setToastMounted(false);
      setMessage("");
    }, 220);

    return () => window.clearTimeout(unmountTimer);
  }, [toastMounted, toastVisible]);

  /* ================================================================ */
  /*  Render principal                                                */
  /* ================================================================ */

  return (
    <div className="relative h-screen overflow-hidden bg-white text-slate-800">
      {/* Overlay do sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Menu de contexto */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[160px] border border-slate-200 bg-white p-1 shadow-lg flex flex-col gap-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="w-full px-2 py-1 text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer"
            onClick={() => {
              openEditForm(contextMenu.aluno);
              setContextMenu(null);
            }}
          >
            Ver
          </button>
          <button
            type="button"
            className="w-full px-2 py-1 text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer"
            onClick={() => {
              if (contextMenu.aluno.id) handleDelete(contextMenu.aluno.id);
              setContextMenu(null);
            }}
          >
            Excluir
          </button>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-[#004a7a] bg-[#003056] shadow-xl shadow-black/20 transition-all duration-300 ease-out ${
          isSidebarOpen ? "w-44" : "w-12"
        }`}
      >
        <div
          className="relative flex items-center border-b border-[#004a7a] cursor-pointer select-none"
          style={{ height: "44px" }}
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsSidebarOpen((prev) => !prev);
            }
          }}
          aria-label="Alternar menu"
        >
          <div className="absolute left-6 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center">
            <Image
              src="/Logo.png"
              alt="Quasar"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
          </div>
          <div
            className={`h-7 flex items-center overflow-hidden transition-all duration-300 ease-out ml-[46px] ${
              isSidebarOpen ? "max-w-[100px] opacity-100" : "max-w-0 opacity-0"
            }`}
          >
            <span className="text-sm font-semibold leading-none text-white whitespace-nowrap">
              Quasar
            </span>
          </div>
        </div>

        <nav className="mt-2 flex flex-col gap-0.5 px-1">
          <button
            type="button"
            className={`flex items-center rounded-[3px] px-1.5 py-1.5 text-blue-200 transition hover:bg-[#004a7a] cursor-pointer ${
              isSidebarOpen ? "justify-start gap-2.5" : "justify-center gap-0"
            }`}
          >
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[3px] bg-white/15 text-white">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <span
              className={`h-7 flex items-center overflow-hidden whitespace-pre transition-all duration-300 ease-out ${
                isSidebarOpen
                  ? "max-w-[120px] opacity-100"
                  : "max-w-0 opacity-0"
              }`}
            >
              <span className="text-sm leading-none text-white">
                Pessoas Físicas
              </span>
            </span>
          </button>
        </nav>
      </aside>

      {/* Conteúdo principal */}
      <div style={{ marginLeft: '3rem' }} className="h-full flex flex-col overflow-hidden">
        <div className="w-full flex-1 flex flex-col min-h-0 px-[15px] py-[15px]">
          {view === "list" ? (
            <ListView
              message={message}
              loading={loading}
              alunos={alunos}
              openNewForm={openNewForm}
              openEditForm={openEditForm}
              handleDelete={handleDelete}
              setContextMenu={setContextMenu}
            />
          ) : (
            <FormView
              message={message}
              editingId={editingId}
                sequence={editingId ? (alunos.find(a => a.id === editingId)?.nr_sequencia ?? null) : null}
                form={form}
              setForm={setForm}
              submitting={submitting}
              handleSubmit={handleSubmit}
              goToList={goToList}
            />
          )}
        </div>
      </div>

      {submitting && view === "form" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6">
          <div className="w-full max-w-[240px] border border-slate-200 bg-white p-6 text-center shadow-xl shadow-black/20">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#003056]/10 text-[#003056]">
              <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
                <path d="M22 12a10 10 0 0 1-10 10" />
              </svg>
            </div>
            <p className="text-sm text-slate-900">Carregando...</p>
          </div>
        </div>
      )}

      {toastMounted && (
        <div
          className={`fixed bottom-4 right-4 z-50 min-w-[220px] max-w-[320px] px-4 py-3 pr-8 text-sm rounded-none ${
            toastVisible ? "animate-toast-fade-in" : "animate-toast-fade-out"
          } ${toastTextClass}`}
          style={{ backgroundColor: toastBg, borderLeft: `4px solid ${toastBorderColor}` }}
        >
          <button
            type="button"
            onClick={() => setToastVisible(false)}
            className="absolute right-2 top-2 cursor-pointer text-sm text-slate-100 hover:text-white"
            aria-label="Fechar mensagem"
          >
            ×
          </button>
          <div>{message}</div>
        </div>
      )}
    </div>
  );
}
