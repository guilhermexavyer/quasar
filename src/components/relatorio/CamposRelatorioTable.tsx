"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from "react";
import type { DataSourceCampo, DataSourceDef } from "@/types/relatorio";
import { gerarId, FORMATOS_CAMPO } from "@/lib/relatorioUtils";
import { getDataSource } from "@/lib/relatorioDataSources";
import Select from "@/components/ui/Select";
import ResizableTable from "@/components/ui/ResizableTable";

interface CamposRelatorioTableProps {
  campos: CamposRelatorioRow[];
  onChange: (campos: CamposRelatorioRow[]) => void;
  camposDisponiveis: DataSourceCampo[];
  /** Coleção principal selecionada no formulário. */
  colecaoPrincipal: string;
  /** Callback quando o estado de edição muda. */
  onEditingChange?: (editing: boolean) => void;
}

export interface CamposRelatorioRow {
  id: string;
  /** Coleção de onde o campo vem (ex.: 'pat_ativo', 'cg_marca'). */
  colecao: string;
  chave: string;
  label: string;
  backgroundLabel: string;
  corLabel: string;
  corCampo: string;
  backgroundCampo: string;
  posicao: number;
  alinhamentoHorizontal: number;
  alinhamentoVertical: number;
  alinhamento: string;
  estiloLabel: string;
  estiloCampo: string;
  largura: number;
  formatacao: 'texto' | 'numero' | 'moeda' | 'data' | 'data_hora' | 'porcentagem';
  statusSistema?: boolean;
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

const ESTILO_OPCOES = [
  { value: '', label: '---' },
  { value: 'negrito', label: 'Negrito' },
  { value: 'italico', label: 'Itálico' },
  { value: 'sublinhado', label: 'Sublinhado' },
  { value: 'negrito_italico', label: 'Negrito + Itálico' },
  { value: 'negrito_sublinhado', label: 'Negrito + Sublinhado' },
  { value: 'italico_sublinhado', label: 'Itálico + Sublinhado' },
  { value: 'negrito_italico_sublinhado', label: 'Negrito + Itálico + Sublinhado' },
];

const inputClass = "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1 text-sm transition focus:border-[#003056] focus:outline-none";

export default function CamposRelatorioTable({
  campos,
  onChange,
  camposDisponiveis,
  colecaoPrincipal,
  onEditingChange,
}: CamposRelatorioTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  // Notificar o pai quando o estado de edição muda
  useEffect(() => {
    onEditingChange?.(editingId !== null);
  }, [editingId, onEditingChange]);
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
        atualizado.statusSistema = false;
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
    e.stopPropagation();
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

  // Rastrear a coluna que está sendo editada (para manter o foco ao avançar)
  const editingColRef = useRef<string | null>(null);
  const nextEditingIdRef = useRef<string | null>(null);

  // Ao focar em um input/select durante edição, registrar a coluna
  const trackColumn = useCallback((colKey: string) => {
    editingColRef.current = colKey;
  }, []);

  // Após avançar para o próximo registro, focar o mesmo campo
  useEffect(() => {
    if (!nextEditingIdRef.current || editingColRef.current === null) return;
    if (editingId !== nextEditingIdRef.current) return;
    const colIdx = parseInt(editingColRef.current, 10);
    nextEditingIdRef.current = null;
    editingColRef.current = null;
    // Esperar o DOM renderizar o novo registro em edição
    requestAnimationFrame(() => {
      const row = document.querySelector('tr.row-selected');
      if (!row) return;
      const cells = row.querySelectorAll<HTMLElement>('td');
      const targetCell = cells[colIdx];
      if (!targetCell) return;
      const input = targetCell.querySelector<HTMLInputElement | HTMLButtonElement>('input, button.cg-select-trigger');
      if (input) input.focus();
    });
  }, [editingId]);

  // ── Salvar e avançar para o próximo registro ──
  const saveAndAdvance = useCallback(() => {
    if (!editingId) return;
    const idx = sortedCampos.findIndex((c) => c.id === editingId);
    if (idx >= 0 && idx < sortedCampos.length - 1) {
      const nextId = sortedCampos[idx + 1].id;
      nextEditingIdRef.current = nextId;
      setEditingId(nextId);
    } else {
      setEditingId(null);
    }
  }, [editingId, sortedCampos]);

  // Atalhos de teclado
  useEffect(() => {
    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if (!editingId) return;
      const target = e.target as HTMLElement;
      const tagName = target?.tagName?.toLowerCase();

      // Ctrl+S → salvar registro
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        target.blur();
        setTimeout(() => setEditingId(null), 0);
        return;
      }

      // Enter → salvar e avançar (apenas em inputs, não em Selects)
      if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
        const isInSelect = target?.closest?.('[data-select]') || target?.getAttribute?.('role') === 'combobox';
        if (tagName === 'input' && !isInSelect) {
          e.preventDefault();
          // Registrar a coluna antes de avançar
          const td = target.closest('td');
          const tr = td?.closest('tr');
          if (tr && td) {
            const cellIndex = Array.from(tr.children).indexOf(td);
            editingColRef.current = String(cellIndex);
          }
          // Forçar blur para que o NumberInput salve o valor via onBlur
          target.blur();
          // Usar setTimeout para avançar depois do blur processar
          setTimeout(() => saveAndAdvance(), 0);
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [editingId, saveAndAdvance]);

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
      
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return (
            <button type="button" onClick={() => setEditingId(null)} className="inline-flex h-5 w-5 items-center justify-center cursor-pointer text-[#555] dark:text-[#ccc]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          );
        }
        return (            <button
            type="button"
            className="campo-edit-icon inline-flex h-5 w-5 items-center justify-center cursor-pointer text-[#555] dark:text-[#ccc]"
            onClick={() => setEditingId(row.id)}
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
          // Gera opções, duplicando ie_status com opção (sistema)
          const opcoes: { value: string; label: string }[] = [];
          for (const cd of camposDaColecao) {
            if (cd.key === 'ie_status' || cd.key === 'ie_status_manutencao') {
              const rawUsado = usadas.has(cd.key);
              const sisUsado = usadas.has(cd.key + '__sistema');
              if (!rawUsado) opcoes.push({ value: cd.key, label: cd.key + ' (banco)' });
              if (!sisUsado) opcoes.push({ value: cd.key + '__sistema', label: cd.key + ' (sistema)' });
            } else {
              if (!usadas.has(cd.key)) opcoes.push({ value: cd.key, label: cd.key });
            }
          }
          return (
            <Select
              value={row.statusSistema ? row.chave + '__sistema' : row.chave}
              onChange={(v) => {
                const isSistema = v.endsWith('__sistema');
                const chave = isSistema ? v.replace('__sistema', '') : v;
                atualizar(row.id, { chave, statusSistema: isSistema });
              }}
              options={opcoes}
              showPlaceholder
              className="!text-xs"
            />
          );
        }
        const display = row.statusSistema ? row.chave + ' (sistema)' : row.chave;
        return <span className="truncate block">{display || '—'}</span>;
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
      key: "posicao",
      label: "Posição",
      
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return <NumberInput value={row.posicao ?? 1} onChange={(v) => atualizar(row.id, { posicao: v })} min={1} className={`${inputClass} !text-xs max-w-[60px]`} />;
        }
        return <span>{row.posicao ?? '—'}</span>;
      },
    },
    {
      key: "alinhamentoHorizontal",
      label: "Esquerda",
      
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return <NumberInput value={row.alinhamentoHorizontal ?? 0} onChange={(v) => atualizar(row.id, { alinhamentoHorizontal: v })} min={0} className={`${inputClass} !text-xs max-w-[60px]`} />;
        }
        return <span>{row.alinhamentoHorizontal ?? 0}</span>;
      },
    },
    {
      key: "alinhamentoVertical",
      label: "Topo",
      
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return <NumberInput value={row.alinhamentoVertical ?? 0} onChange={(v) => atualizar(row.id, { alinhamentoVertical: v })} min={0} className={`${inputClass} !text-xs max-w-[60px]`} />;
        }
        return <span>{row.alinhamentoVertical ?? 0}</span>;
      },
    },
    {
      key: "alinhamento",
      label: "Alinhamento",
      
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return (
            <Select
              value={row.alinhamento || 'esquerda'}
              onChange={(v) => atualizar(row.id, { alinhamento: v })}
              options={[
                { value: 'esquerda', label: 'Esquerda' },
                { value: 'centro', label: 'Centro' },
                { value: 'direita', label: 'Direita' },
              ]}
              showPlaceholder={false}
              className="!text-xs"
            />
          );
        }
        const lbl = row.alinhamento === 'centro' ? 'Centro' : row.alinhamento === 'direita' ? 'Direita' : 'Esquerda';
        return <span className="whitespace-nowrap">{lbl}</span>;
      },
    },
    {
      key: "estiloLabel",
      label: "Estilo label",
      
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return (
            <Select
              value={row.estiloLabel || ''}
              onChange={(v) => atualizar(row.id, { estiloLabel: v })}
              options={ESTILO_OPCOES}
              showPlaceholder={false}
              className="!text-xs"
            />
          );
        }
        const opt = ESTILO_OPCOES.find((o) => o.value === row.estiloLabel);
        return <span className="whitespace-nowrap">{opt?.label || '---'}</span>;
      },
    },
    {
      key: "estiloCampo",
      label: "Estilo campo",
      
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return (
            <Select
              value={row.estiloCampo || ''}
              onChange={(v) => atualizar(row.id, { estiloCampo: v })}
              options={ESTILO_OPCOES}
              showPlaceholder={false}
              className="!text-xs"
            />
          );
        }
        const opt = ESTILO_OPCOES.find((o) => o.value === row.estiloCampo);
        return <span className="whitespace-nowrap">{opt?.label || '---'}</span>;
      },
    },
    {
      key: "largura",
      label: "Largura",
      
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return <NumberInput value={row.largura ?? 30} onChange={(v) => atualizar(row.id, { largura: v })} min={0} className={`${inputClass} !text-xs max-w-[60px]`} />;
        }
        return <span>{row.largura ?? 30}</span>;
      },
    },
  ];

  return (
    <div className="relative">
      <style>{`
        .campo-edit-icon { opacity: 1; }
      `}</style>

      <ResizableTable
        columns={columns}
        rows={sortedCampos}
        rowKey={(row) => row.id}
        sortColumn={sortColumn}
        sortAsc={sortAsc}
        onSortChange={handleSort}
        onRowContextMenu={handleContextMenu}
        rowClassName={(row) => `campo-row${editingId === row.id ? ' row-selected' : ''}`}
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
