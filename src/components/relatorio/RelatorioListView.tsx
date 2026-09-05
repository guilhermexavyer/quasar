"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { ContextMenuState } from "@/types/contextMenu";
import type { Relatorio } from "@/types/relatorio";
import { DATA_SOURCES } from "@/lib/relatorioDataSources";
import ResizableTable from "@/components/ui/ResizableTable";
import EmptySelectionMessage from "@/components/ui/EmptySelectionMessage";
import Select from "@/components/ui/Select";
import { formatDate } from "@/lib/pessoaFisicaUtils";
import PaginationFooter, { usePagination } from "@/components/ui/PaginationFooter";

const RELATORIO_SELECT_OPTIONS = [
  { value: 'relatorio', label: 'Relatórios' },
];

interface RelatorioListViewProps {
  loading: boolean;
  relatorios: Relatorio[];
  openNewForm: () => void;
  openEditForm: (relatorio: Relatorio) => void;
  openBandas: (relatorio: Relatorio) => void;
  handleDelete: (id: string) => void;
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState | null>>;
  sortColumn: number | null;
  sortAsc: boolean | null;
  onSortChange: (logicalIndex: number) => void;
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  allowedSubmodulos?: string[];
  userId?: string;
  initialColumns?: { order: string[]; widths: Record<string, number> } | null;
  onColumnsChange?: (order: string[], widths: Record<string, number>) => void;
  /** ID do registro selecionado (controlado pelo pai). */
  selectedRecordId?: string | null;
}

function formatCellValue(key: string, value: any): string {
  if (value == null || value === "") return "";
  if (key === "dt_alteracao" || key === "dt_criacao") {
    return formatDate(String(value));
  }
  if (key === "formato") {
    return "PDF";
  }
  return String(value);
}

const COLUMNS = [
  { key: "nr_sequencia", label: "#", align: "center" as const },
  { key: "ds_relatorio", label: "Descrição" },
  { key: "formato", label: "Formato" },
  { key: "dt_criacao", label: "Criação" },
  { key: "dt_alteracao", label: "Alteração" },
  { key: "ds_usuario_criacao", label: "Usuário criação" },
  { key: "ds_usuario_alteracao", label: "Usuário alteração" },
];

const COLUMN_KEYS = COLUMNS.map((c) => c.key);

export default function RelatorioListView({
  loading,
  relatorios,
  openNewForm,
  openEditForm,
  openBandas,
  handleDelete,
  setContextMenu,
  sortColumn,
  sortAsc,
  onSortChange,
  manageSelection,
  onManageSelectionChange,
  allowedSubmodulos = ['relatorio'],
  userId,
  initialColumns,
  onColumnsChange,
  selectedRecordId,
}: RelatorioListViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(selectedRecordId ?? null);
  useEffect(() => { if (selectedRecordId != null) setSelectedId(selectedRecordId); }, [selectedRecordId]);

  function handleRowClick(rel: Relatorio) {
    setSelectedId(rel.id ?? null);
  }

  function handleRowDoubleClick(rel: Relatorio) {
    openBandas(rel);
  }

  function handleContextMenu(rel: Relatorio, e: ReactMouseEvent<HTMLTableRowElement>) {
    e.preventDefault();
    setSelectedId(rel.id ?? null);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      section: "relatorio",
      item: rel,
    } as ContextMenuState);
  }

  const rows = relatorios.map((rel) => ({
    ...rel,
    _id: rel.id ?? String(rel.nr_sequencia),
    formato: rel.ie_formato ?? '',
    colecaoLabel: DATA_SOURCES.find((ds) => ds.value === rel.colecao)?.label ?? rel.colecao,
    qtdCampos: rel.campos?.length ?? 0,
    qtdFiltros: rel.filtros?.length ?? 0,
    qtdOrdenacao: rel.ordenacao?.length ?? 0,
  }));

  const pagination = usePagination(rows.length);
  const paginatedRows = pagination.slice(rows);

  const showPlaceholder = !manageSelection;
  const selectOptions = RELATORIO_SELECT_OPTIONS.filter((o) => allowedSubmodulos.includes(o.value));

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-3 min-h-[42px]">
        <div className="flex items-center gap-2">
          <Select
            value={manageSelection}
            onChange={onManageSelectionChange}
            options={selectOptions}
            showPlaceholder={showPlaceholder}
            className="!w-[180px]"
          />
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

      {/* ── Tabela ── */}
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
              </div>
            ))}
          </div>
        ) : relatorios.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
            <p className="mt-4 font-medium text-slate-500">Nenhum registro encontrado.</p>
            <p className="mt-1 text-sm text-slate-500">
              Clique em "Adicionar" para cadastrar um relatório.
            </p>
          </div>
        ) : (
          <>
          <div className="flex-1 overflow-auto">
            <ResizableTable
              storageKeySuffix={userId}
              initialColumns={initialColumns}
              onColumnsChange={onColumnsChange}
              columns={COLUMNS.map((col) => ({
                key: col.key,
                label: col.label,
                align: col.align,
                render: (row: any) => {
                  if (col.key === "colecao") return row.colecaoLabel;
                  if (col.key === "qtdCampos") return row.qtdCampos;
                  if (col.key === "qtdFiltros") return row.qtdFiltros;
                  if (col.key === "qtdOrdenacao") return row.qtdOrdenacao;
                  return formatCellValue(col.key, row[col.key]);
                },
              }))}
              rows={paginatedRows}
              rowKey={(row) => row._id}
              sortColumn={sortColumn != null ? COLUMN_KEYS[sortColumn] ?? null : null}
              sortAsc={sortAsc ?? true}
              onSortChange={(key) => {
                const idx = COLUMN_KEYS.indexOf(key);
                if (idx >= 0) onSortChange(idx);
              }}
              onRowClick={handleRowClick}
              onRowDoubleClick={handleRowDoubleClick}
              onRowContextMenu={handleContextMenu}
              rowClassName={(row) =>
                row._id === selectedId ? "row-selected" : ""
              }
            />
          </div>
          <PaginationFooter
            totalRecords={rows.length}
            currentPage={pagination.currentPage}
            pageSize={pagination.pageSize}
            onPageChange={pagination.setCurrentPage}
            onPageSizeChange={pagination.setPageSize}
          />
          </>
        )}
      </div>
    </div>
  );
}
