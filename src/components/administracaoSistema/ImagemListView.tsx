"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Imagem } from "@/types/imagem";
import type { ContextMenuState } from "@/types/contextMenu";
import { type StringColunasConfig } from "@/lib/colunasUtils";
import ResizableTable, { type ResizableTableColumn } from "@/components/ui/ResizableTable";
import Select from "@/components/ui/Select";
import EmptySelectionMessage from "@/components/ui/EmptySelectionMessage";
import { formatDate } from "@/lib/pessoaFisicaUtils";

interface ImagemListViewProps {
  loading: boolean;
  imagens: Imagem[];
  openNewForm: () => void;
  openEditForm: (imagem: Imagem) => void;
  handleDelete: (id: string) => void;
  setContextMenu: Dispatch<SetStateAction<ContextMenuState | null>>;
  sortColumn: number | null;
  sortAsc: boolean | null;
  onSortChange: (logicalIndex: number) => void;
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  allowedSubmodulos?: string[];
  initialColumns?: StringColunasConfig | null;
  onColumnsChange?: (order: string[], widths: Record<string, number>) => void;
}

const IMAGEM_COLUMNS: ResizableTableColumn<Imagem>[] = [
  { key: "nr_sequencia", label: "#", width: 50 },
  { key: "ds_imagem", label: "Descrição", width: 250 },
  { key: "ie_arquivo", label: "Arquivo", width: 200, render: (row) => (
    <span className="truncate">{row.ie_arquivo ? row.ie_arquivo.split('/').pop() : '---'}</span>
  )},
  { key: "dt_criacao", label: "Criação", width: 160, render: (row) => row.dt_criacao ? formatDate(row.dt_criacao) : '' },
  { key: "ds_usuario_criacao", label: "Usuário criação", width: 130 },
  { key: "dt_alteracao", label: "Alteração", width: 160, render: (row) => row.dt_alteracao ? formatDate(row.dt_alteracao) : '' },
  { key: "ds_usuario_alteracao", label: "Usuário alteração", width: 130 },
];

export default function ImagemListView({
  loading,
  imagens,
  openNewForm,
  openEditForm,
  handleDelete,
  setContextMenu,
  sortColumn,
  sortAsc,
  onSortChange,
  manageSelection,
  onManageSelectionChange,
  allowedSubmodulos = ['campos', 'perfis', 'usuarios', 'imagens'],
  initialColumns,
  onColumnsChange,
}: ImagemListViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number | 'all'>(30);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>('1');

  const totalRecords = imagens.length;
  const pageCount = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPageSafe = Math.min(currentPage, pageCount);
  const firstRecord = totalRecords === 0 ? 0 : (pageSize === 'all' ? 1 : (currentPageSafe - 1) * pageSize + 1);
  const lastRecord = totalRecords === 0 ? 0 : (pageSize === 'all' ? totalRecords : Math.min(totalRecords, currentPageSafe * pageSize));
  const paginatedImagens = pageSize === 'all'
    ? imagens
    : imagens.slice((currentPageSafe - 1) * pageSize, currentPageSafe * pageSize);

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

  const IMAGEM_SELECT_OPTIONS = useMemo(() => [
    { value: 'campos', label: 'Campos' },
    { value: 'perfis', label: 'Perfis' },
    { value: 'usuarios', label: 'Usuários' },
    { value: 'imagens', label: 'Imagens' },
  ].filter((o) => allowedSubmodulos.includes(o.value)), [allowedSubmodulos]);

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      {/* Header */}
      <div className="flex min-h-[42px] items-center justify-between gap-3">
        <div className="flex items-center gap-5">
          <Select
            value={manageSelection}
            onChange={onManageSelectionChange}
            options={IMAGEM_SELECT_OPTIONS}
            showPlaceholder={false}
            className="!w-[180px]"
          />
        </div>
        <button
          type="button"
          onClick={openNewForm}
          className="inline-flex items-center rounded-[3px] border border-transparent bg-transparent px-4 py-2.5 text-sm font-normal text-[#066fc5] transition cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2 active:outline active:outline-1 active:outline-[#066fc5] active:outline-offset-2"
        >
          Adicionar
        </button>
      </div>

      {/* Content */}
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
        ) : imagens.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
            <p className="mt-4 font-medium text-slate-500">Nenhum registro encontrado.</p>
            <p className="mt-1 text-sm text-slate-500">
              Clique em &quot;Adicionar&quot; para cadastrar uma imagem.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <ResizableTable
              columns={IMAGEM_COLUMNS}
              rows={paginatedImagens}
              rowKey={(row) => row.id}
              sortColumn={sortColumn != null ? IMAGEM_COLUMNS[sortColumn]?.key ?? null : null}
              sortAsc={sortAsc ?? true}
              onSortChange={(key) => {
                const idx = IMAGEM_COLUMNS.findIndex((c) => c.key === key);
                if (idx >= 0) onSortChange(idx);
              }}
              onRowClick={(row) => {
                setSelectedId((prev) => (prev === row.id ? null : row.id ?? null));
              }}
              onRowContextMenu={(row, e) => {
                e.preventDefault();
                setSelectedId(row.id ?? null);
                setContextMenu({ x: e.clientX, y: e.clientY, section: 'administracaoSistema', item: row });
              }}
              rowClassName={(row) => row.id === selectedId ? 'row-selected' : ''}
              initialColumns={initialColumns ?? null}
              onColumnsChange={onColumnsChange}
            />

            {/* Pagination */}
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
  );
}
