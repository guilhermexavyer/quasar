"use client";

import { useEffect, useState } from "react";
import Select from "@/components/ui/Select";

export type PageSize = number | "all";

interface PaginationState {
  currentPage: number;
  pageSize: PageSize;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: PageSize) => void;
  slice: <T>(rows: T[]) => T[];
}

/** Estado de paginação compartilhado: página atual, registros por página e recorte da lista. */
export function usePagination(totalRecords: number): PaginationState {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(30);

  const pageCount = pageSize === "all" ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPageSafe = Math.min(currentPage, pageCount);

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [currentPage, pageCount]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, totalRecords]);

  const slice = <T,>(rows: T[]): T[] =>
    pageSize === "all" ? rows : rows.slice((currentPageSafe - 1) * pageSize, currentPageSafe * pageSize);

  return { currentPage: currentPageSafe, pageSize, setCurrentPage, setPageSize, slice };
}

interface PaginationFooterProps {
  totalRecords: number;
  currentPage: number;
  pageSize: PageSize;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
}

/** Rodapé de paginação (mesmo estilo do rodapé de Administração do Sistema > Usuários). */
export default function PaginationFooter({
  totalRecords,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationFooterProps) {
  const pageCount = pageSize === "all" ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPageSafe = Math.min(currentPage, pageCount);
  const firstRecord = totalRecords === 0 ? 0 : pageSize === "all" ? 1 : (currentPageSafe - 1) * pageSize + 1;
  const lastRecord = totalRecords === 0 ? 0 : pageSize === "all" ? totalRecords : Math.min(totalRecords, currentPageSafe * pageSize);

  const [pageInput, setPageInput] = useState(String(currentPageSafe));

  useEffect(() => {
    setPageInput(String(currentPageSafe));
  }, [currentPageSafe, pageSize]);

  return (
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
                if (e.key === "Enter") {
                  e.preventDefault();
                  const targetPage = Number(pageInput);
                  if (!Number.isNaN(targetPage) && targetPage >= 1 && targetPage <= pageCount) {
                    onPageChange(targetPage);
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
                  onPageChange(next);
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
                  onPageChange(prevPage);
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
              onChange={(v) => onPageSizeChange(v === "all" ? "all" : Number(v))}
              options={[
                { value: "30", label: "30 por página" },
                { value: "50", label: "50 por página" },
                { value: "100", label: "100 por página" },
                { value: "all", label: "Todos" },
              ]}
              showPlaceholder={false}
              className="min-w-[130px]"
            />
          </div>
        </div>

        <div className="text-sm text-slate-600 text-right">
          {firstRecord === 0 ? `0 de ${totalRecords}` : `${firstRecord}–${lastRecord} de ${totalRecords}`}
        </div>
      </div>
    </div>
  );
}