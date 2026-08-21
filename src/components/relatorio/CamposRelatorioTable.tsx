"use client";

import { useState, useMemo } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { DataSourceCampo, DataSourceDef } from "@/types/relatorio";
import { gerarId, FORMATOS_CAMPO, ALINHAMENTOS } from "@/lib/relatorioUtils";
import { getDataSource } from "@/lib/relatorioDataSources";
import Select from "@/components/ui/Select";
import ResizableTable from "@/components/ui/ResizableTable";

interface CamposRelatorioTableProps {
  campos: CamposRelatorioRow[];
  onChange: (campos: CamposRelatorioRow[]) => void;
  camposDisponiveis: DataSourceCampo[];
  /** Coleção principal selecionada no formulário. */
  colecaoPrincipal: string;
}

export interface CamposRelatorioRow {
  id: string;
  /** Coleção de onde o campo vem (ex.: 'pat_ativos', 'cg_marca'). */
  colecao: string;
  chave: string;
  label: string;
  backgroundLabel: string;
  corLabel: string;
  corCampo: string;
  backgroundCampo: string;
  posicao: number;
  alinhamento: 'esquerda' | 'centro' | 'direita';
  largura: number;
  formatacao: 'texto' | 'numero' | 'moeda' | 'data' | 'data_hora' | 'porcentagem';
}

/** Input numérico sem spinner, que permite apagar o 0. */
function NumberInput({ value, onChange, min, max, className }: { value: number; onChange: (v: number) => void; min?: number; max?: number; className?: string }) {
  const [text, setText] = useState(String(value ?? ''));
  const [focused, setFocused] = useState(false);

  function handleBlur() {
    const num = text === '' ? (min ?? 0) : Number(text);
    const clamped = Math.max(min ?? -Infinity, Math.min(max ?? Infinity, num));
    setText(String(clamped));
    onChange(clamped);
    setFocused(false);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      className={className}
      value={focused ? text : String(value ?? '')}
      onFocus={() => { setText(String(value ?? '')); setFocused(true); }}
      onChange={(e) => setText(e.target.value.replace(/[^0-9-]/g, ''))}
      onBlur={handleBlur}
    />
  );
}

const inputClass = "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1 text-sm transition focus:border-[#003056] focus:outline-none";

export default function CamposRelatorioTable({
  campos,
  onChange,
  camposDisponiveis,
  colecaoPrincipal,
}: CamposRelatorioTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // ── Coleções disponíveis (principal + FKs) ──
  const colecoesDisponiveis = useMemo(() => {
    const dsPrincipal = getDataSource(colecaoPrincipal);
    if (!dsPrincipal) return [{ value: colecaoPrincipal, label: colecaoPrincipal }];
    const result: { value: string; label: string }[] = [
      { value: dsPrincipal.value, label: dsPrincipal.value },
    ];
    const fkFields = dsPrincipal.campos.filter((c) => c.isFK && c.fkColecao);
    for (const fk of fkFields) {
      const fkDs = getDataSource(fk.fkColecao!);
      if (fkDs && !result.some((r) => r.value === fkDs.value)) {
        result.push({ value: fkDs.value, label: fkDs.value });
      }
    }
    return result;
  }, [colecaoPrincipal]);

  // ── Mapeia coleção → campos disponíveis ──
  const camposPorColecao = useMemo(() => {
    const map: Record<string, DataSourceCampo[]> = {};
    for (const opt of colecoesDisponiveis) {
      const ds = getDataSource(opt.value);
      map[opt.value] = ds?.campos ?? [];
    }
    return map;
  }, [colecoesDisponiveis]);

  // ── Mapeia coleção → FK field key na coleção principal (para joins) ──
  const fkFieldMap = useMemo(() => {
    const dsPrincipal = getDataSource(colecaoPrincipal);
    const map: Record<string, string> = {};
    if (!dsPrincipal) return map;
    for (const fk of dsPrincipal.campos) {
      if (fk.isFK && fk.fkColecao) {
        map[fk.fkColecao] = fk.key; // ex.: 'cg_marca' → 'nr_seq_marca'
      }
    }
    return map;
  }, [colecaoPrincipal]);

  function atualizar(id: string, updates: Partial<CamposRelatorioRow>) {
    onChange(campos.map((c) => {
      if (c.id !== id) return c;
      const atualizado = { ...c, ...updates };
      // Se mudou a coleção, reseta a chave
      if (updates.colecao && updates.colecao !== c.colecao) {
        atualizado.chave = '';
        atualizado.label = '';
      }
      // Se mudou a chave, atualiza label e formatação
      if (updates.chave && updates.chave !== c.chave) {
        const camposDaColecao = camposPorColecao[atualizado.colecao] ?? [];
        const campoDef = camposDaColecao.find((cd) => cd.key === updates.chave);
        if (campoDef) {
          atualizado.label = campoDef.label;
          if (campoDef.tipo === "number") atualizado.formatacao = "numero";
          else if (campoDef.tipo === "date") atualizado.formatacao = "data";
          else atualizado.formatacao = "texto";
        }
      }
      return atualizado;
    }));
  }

  function handleContextMenu(row: CamposRelatorioRow, e: ReactMouseEvent<HTMLTableRowElement>) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, id: row.id });
  }

  function excluir(id: string) {
    onChange(campos.filter((c) => c.id !== id));
    if (editingId === id) setEditingId(null);
    setContextMenu(null);
  }

  const sortedCampos = [...campos].sort((a, b) => {
    if (!sortColumn) return 0;
    const av = a[sortColumn as keyof CamposRelatorioRow] ?? '';
    const bv = b[sortColumn as keyof CamposRelatorioRow] ?? '';
    const cmp = String(av).localeCompare(String(bv), 'pt-BR', { numeric: true });
    return sortAsc ? cmp : -cmp;
  });

  function handleSort(key: string) {
    if (sortColumn === key) {
      if (sortAsc) {
        // asc → desc
        setSortAsc(false);
      } else {
        // desc → padrão (remove ordenação)
        setSortColumn(null);
      }
    } else {
      setSortColumn(key);
      setSortAsc(true);
    }
  }

  const columns = [
    {
      key: "_actions",
      label: " ",
      fixed: true,
      align: "center" as const,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return (
            <button type="button" onClick={() => setEditingId(null)} className="inline-flex h-5 w-5 items-center justify-center cursor-pointer text-[#333] hover:text-[#003056]" title="Concluir edição">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          );
        }
        return (
          <button
            type="button"
            className="campo-edit-icon inline-flex h-5 w-5 items-center justify-center cursor-pointer text-[#333] hover:text-[#003056]"
            onClick={() => setEditingId(row.id)}
            title="Editar campo"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </button>
        );
      },
    },
    {
      key: "colecao",
      label: "Coleção",
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return (
            <Select
              value={row.colecao}
              onChange={(v) => atualizar(row.id, { colecao: v })}
              options={colecoesDisponiveis}
              showPlaceholder={false}
              className="!text-xs"
            />
          );
        }
        return <span className="truncate block">{row.colecao || '—'}</span>;
      },
    },
    {
      key: "chave",
      label: "Campo",
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          const camposDaColecao = camposPorColecao[row.colecao] ?? [];
          const usadas = new Set(
            campos
              .filter((c) => c.chave && c.colecao === row.colecao && c.chave !== row.chave)
              .map((c) => c.chave)
          );
          return (
            <Select
              value={row.chave}
              onChange={(v) => atualizar(row.id, { chave: v })}
              options={camposDaColecao.map((cd) => ({ value: cd.key, label: cd.key })).filter((o) => !usadas.has(o.value))}
              showPlaceholder
              className="!text-xs"
            />
          );
        }
        return <span className="truncate block">{row.chave || '—'}</span>;
      },
    },
    {
      key: "label",
      label: "Label",
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return <input value={row.label} onChange={(e) => atualizar(row.id, { label: e.target.value })} className={`${inputClass} !text-xs`} />;
        }
        return <span className="truncate block">{row.label || '—'}</span>;
      },
    },
    {
      key: "backgroundLabel",
      label: "Fundo label",
      align: "center" as const,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return <input type="color" value={row.backgroundLabel || '#e2e8f0'} onChange={(e) => atualizar(row.id, { backgroundLabel: e.target.value })} className="w-full h-[26px] cursor-pointer border border-slate-300 rounded" />;
        }
        return <span className="inline-block w-8 h-4 mx-auto" style={{ background: row.backgroundLabel || '#e2e8f0' }} />;
      },
    },
    {
      key: "corLabel",
      label: "Cor label",
      align: "center" as const,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return <input type="color" value={row.corLabel || '#1a1a1a'} onChange={(e) => atualizar(row.id, { corLabel: e.target.value })} className="w-full h-[26px] cursor-pointer border border-slate-300 rounded" />;
        }
        return <span className="inline-block w-8 h-4 mx-auto" style={{ background: row.corLabel || '#1a1a1a' }} />;
      },
    },
    {
      key: "corCampo",
      label: "Cor campo",
      align: "center" as const,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return <input type="color" value={row.corCampo || '#1a1a1a'} onChange={(e) => atualizar(row.id, { corCampo: e.target.value })} className="w-full h-[26px] cursor-pointer border border-slate-300 rounded" />;
        }
        return <span className="inline-block w-8 h-4 mx-auto" style={{ background: row.corCampo || '#1a1a1a' }} />;
      },
    },
    {
      key: "backgroundCampo",
      label: "Fundo campo",
      align: "center" as const,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return <input type="color" value={row.backgroundCampo || '#ffffff'} onChange={(e) => atualizar(row.id, { backgroundCampo: e.target.value })} className="w-full h-[26px] cursor-pointer border border-slate-300 rounded" />;
        }
        return <span className="inline-block w-8 h-4 mx-auto" style={{ background: row.backgroundCampo || '#ffffff' }} />;
      },
    },
    {
      key: "posicao",
      label: "Posição",
      align: "center" as const,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return <NumberInput value={row.posicao ?? 1} onChange={(v) => atualizar(row.id, { posicao: v })} min={1} className={`${inputClass} !text-xs text-center`} />;
        }
        return <span>{row.posicao ?? '—'}</span>;
      },
    },
    {
      key: "alinhamento",
      label: "Alinhamento",
      align: "center" as const,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return <Select value={row.alinhamento ?? 'esquerda'} onChange={(v) => atualizar(row.id, { alinhamento: v as any })} options={[...ALINHAMENTOS]} showPlaceholder={false} className="!text-xs" />;
        }
        return <span className="capitalize">{row.alinhamento ?? 'esquerda'}</span>;
      },
    },
    {
      key: "largura",
      label: "Largura",
      align: "center" as const,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return <NumberInput value={row.largura ?? 30} onChange={(v) => atualizar(row.id, { largura: v })} min={5} max={200} className={`${inputClass} !text-xs text-center`} />;
        }
        return <span>{row.largura ?? 30}</span>;
      },
    },
    {
      key: "formatacao",
      label: "Fmt",
      align: "center" as const,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return <Select value={row.formatacao ?? 'texto'} onChange={(v) => atualizar(row.id, { formatacao: v as any })} options={[...FORMATOS_CAMPO]} showPlaceholder={false} className="!text-xs" />;
        }
        return <span>{row.formatacao ?? 'texto'}</span>;
      },
    },
  ];

  return (
    <div className="relative">
      <style>{`
        .campo-row:hover .campo-edit-icon { opacity: 1; }
        .campo-edit-icon { opacity: 0; }
      `}</style>

      <ResizableTable
        columns={columns}
        rows={sortedCampos}
        rowKey={(row) => row.id}
        sortColumn={sortColumn}
        sortAsc={sortAsc}
        onSortChange={handleSort}
        onRowContextMenu={handleContextMenu}
        rowClassName={(row) => `campo-row${editingId === row.id ? ' bg-blue-50/50' : ''}`}
        pinnedColumns={["_actions"]}
      />

      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 min-w-[120px] border border-slate-200 bg-white p-[3px] flex flex-col gap-[3px]"
            style={{ left: contextMenu.x, top: contextMenu.y, boxShadow: '0 4px 10px rgba(0,0,0,0.18)' }}
          >
            <button type="button" className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer" style={{ padding: '0.2rem 0.4rem' }} onClick={() => { setEditingId(contextMenu.id); setContextMenu(null); }}>Editar</button>
            <button type="button" className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer" style={{ padding: '0.2rem 0.4rem' }} onClick={() => excluir(contextMenu.id)}>Excluir</button>
          </div>
        </>
      )}
    </div>
  );
}
