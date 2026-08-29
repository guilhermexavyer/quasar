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
  /** Sufixo para persistência de colunas por usuário. */
  userId?: string;
  /** Configuração inicial de colunas (do Firestore). */
  initialColumns?: { order: string[]; widths: Record<string, number> } | null;
  /** Callback ao alterar ordem/largura das colunas. */
  onColumnsChange?: (order: string[], widths: Record<string, number>) => void;
  /** Variante: 'lista' (padrão) ou 'texto_valor'. Controla quais colunas aparecem. */
  variant?: 'lista' | 'texto_valor';
  /** Se true, oculta as colunas Coleção e Campo (para bandas Cabeçalho/Rodapé). */
  ocultarColecaoCampo?: boolean;
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
  topoLabel: number;
  topoRegistro: number;
  alinhamento: string;
  estiloLabel: string;
  estiloCampo: string;
  estiloSoma: string;
  largura: number;
  formatacao: 'texto' | 'numero' | 'moeda' | 'data' | 'data_hora' | 'porcentagem';
  statusSistema?: boolean;
  soma?: boolean;
  /** Tipo do campo na banda Texto/Valor/Cabeçalho/Rodapé. */
  tipoCampo?: 'valor' | 'conteudo' | 'data_geracao' | 'horario_geracao' | 'data_horario_geracao' | 'usuario_geracao';
  /** Conteúdo livre quando tipoCampo === 'conteudo'. */
  conteudo?: string;
  /** Fonte específica do campo (para banda Texto/Valor). */
  fonteCampo?: string;
  /** Tamanho da fonte do campo em pontos (para banda Texto/Valor). */
  tamanhoFonteCampo?: number;
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

const FONTES_OPCOES = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Calibri', label: 'Calibri' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Tahoma', label: 'Tahoma' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
];

const inputClass = "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none";

export default function CamposRelatorioTable({
  campos,
  onChange,
  camposDisponiveis,
  colecaoPrincipal,
  onEditingChange,
  userId,
  initialColumns,
  onColumnsChange,
  variant = 'lista',
  ocultarColecaoCampo = false,
}: CamposRelatorioTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Notificar o pai quando o estado de edição muda
  useEffect(() => {
    onEditingChange?.(editingId !== null);
  }, [editingId, onEditingChange]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [conteudoModal, setConteudoModal] = useState<{ id: string; value: string } | null>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu]);

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

  function duplicar(id: string) {
    const original = campos.find((c) => c.id === id);
    if (!original) return;
    const clone: CamposRelatorioRow = { ...original, id: gerarId() };
    const idx = campos.findIndex((c) => c.id === id);
    const updated = [...campos];
    updated.splice(idx + 1, 0, clone);
    onChange(updated);
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
  const pendingFocusCol = useRef<number | null>(null);
  const advanceTargetId = useRef<string | null>(null);

  // Quando editingId muda para o registro alvo, focar o campo
  useEffect(() => {
    if (advanceTargetId.current === null || pendingFocusCol.current === null) return;
    if (editingId !== advanceTargetId.current) return;
    const colIdx = pendingFocusCol.current;
    advanceTargetId.current = null;
    pendingFocusCol.current = null;
    // Esperar o React renderizar o novo estado de edição
    const tryFocus = (attempts: number) => {
      if (attempts <= 0) return;
      setTimeout(() => {
        const row = document.querySelector('tr.row-selected');
        if (!row) { tryFocus(attempts - 1); return; }
        const cells = row.querySelectorAll<HTMLElement>('td');
        const targetCell = cells[colIdx];
        if (!targetCell) { tryFocus(attempts - 1); return; }
        const input = targetCell.querySelector<HTMLInputElement>('input');
        if (!input) { tryFocus(attempts - 1); return; }
        input.focus();
        input.select();
        try { input.setSelectionRange(0, input.value.length); } catch { /* ignore */ }
      }, 100);
    };
    tryFocus(5);
  }, [editingId]);

  // ── Salvar e avançar para o próximo registro ──
  const saveAndAdvance = useCallback(() => {
    if (!editingId) return;
    const idx = sortedCampos.findIndex((c) => c.id === editingId);
    if (idx >= 0 && idx < sortedCampos.length - 1) {
      const nextId = sortedCampos[idx + 1].id;
      advanceTargetId.current = nextId;
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
        e.stopPropagation();
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
            pendingFocusCol.current = cellIndex;
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
      width: 35,
      fixed: true,
      
      render: (row: CamposRelatorioRow) => {
        const isEditing = editingId === row.id;
        return (
          <span className="flex items-center justify-center gap-1">
            {!isEditing && (
              <button
                type="button"
                className="cursor-pointer p-0 bg-transparent border-none"
                title="Editar"
                onClick={() => { setEditingId(row.id); setContextMenu(null); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
              </button>
            )}
            {isEditing && (
              <button
                type="button"
                className="cursor-pointer p-0 bg-transparent border-none"
                title="Salvar"
                onClick={() => setEditingId(null)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </button>
            )}
          </span>
        );
      },
    },
    {      key: "tipoCampo",
      label: "Tipo",
      width: 130,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return (
            <Select
              value={row.tipoCampo ?? ''}
              onChange={(v) => atualizar(row.id, { tipoCampo: (v || undefined) as CamposRelatorioRow['tipoCampo'] })}
              options={ocultarColecaoCampo
                ? [{ value: 'conteudo', label: 'Conteúdo' }, { value: 'data_geracao', label: 'Data da geração' }, { value: 'horario_geracao', label: 'Horário da geração' }, { value: 'data_horario_geracao', label: 'Data + horário da geração' }, { value: 'usuario_geracao', label: 'Usuário da geração' }]
                : [{ value: 'valor', label: 'Valor' }, { value: 'conteudo', label: 'Conteúdo' }, { value: 'data_geracao', label: 'Data da geração' }, { value: 'horario_geracao', label: 'Horário da geração' }, { value: 'data_horario_geracao', label: 'Data + horário da geração' }, { value: 'usuario_geracao', label: 'Usuário da geração' }]
              }
              showPlaceholder={true}
              className={inputClass}
            />
          );
        }
        const tipoLabels: Record<string, string> = { valor: 'Valor', conteudo: 'Conteúdo', data_geracao: 'Data da geração', horario_geracao: 'Horário da geração', data_horario_geracao: 'Data + horário da geração', usuario_geracao: 'Usuário da geração' };
        const lbl = tipoLabels[row.tipoCampo ?? ''] ?? '---';
        return <span className="whitespace-nowrap">{lbl}</span>;
      },
    },
    {      key: "colecao",
      label: "Coleção",
      width: 130,
      render: (row: CamposRelatorioRow) => {
        const desabilitado = variant === 'texto_valor' && row.tipoCampo !== 'valor';
        if (editingId === row.id) {
          return (
            <Select
              value={row.colecao}
              onChange={(v) => atualizar(row.id, { colecao: v })}
              options={colecoesDisponiveis}
              showPlaceholder={false}
              className={`${inputClass} ${desabilitado ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={desabilitado}
            />
          );
        }
        return <span className={`truncate block ${desabilitado ? 'text-slate-400' : ''}`}>{desabilitado ? '---' : (row.colecao || '---')}</span>;
      },
    },
    {      key: "chave",
      label: "Campo",
      width: 130,
      render: (row: CamposRelatorioRow) => {
        const desabilitadoCampo = variant === 'texto_valor' && row.tipoCampo !== 'valor';
        if (desabilitadoCampo) {
          return <span className="text-slate-400">---</span>;
        }
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
              className={inputClass}
            />
          );
        }
        const display = row.statusSistema ? row.chave + ' (sistema)' : row.chave;
        return <span className="truncate block">{display || '---'}</span>;
      },
    },
    {
      key: "label",
      label: "Label",
      width: 130,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return <input value={row.label} onChange={(e) => atualizar(row.id, { label: e.target.value })} className={inputClass} />;
        }
        return <span className="truncate block">{row.label || '---'}</span>;
      },
    },
    {
      key: "posicao",
      label: "Posição",
      width: 130,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return <NumberInput value={row.posicao ?? 1} onChange={(v) => atualizar(row.id, { posicao: v })} min={1} className={inputClass} />;
        }
        return <span>{row.posicao ?? '—'}</span>;
      },
    },
    {
      key: "alinhamentoHorizontal",
      label: "Esquerda",
      width: 130,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return <NumberInput value={row.alinhamentoHorizontal ?? 0} onChange={(v) => atualizar(row.id, { alinhamentoHorizontal: v })} min={0} className={inputClass} />;
        }
        return <span>{row.alinhamentoHorizontal ?? 0}</span>;
      },
    },

    {
      key: "alinhamento",
      label: "Alinhamento",
      width: 130,
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
              className={inputClass}
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
      width: 130,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return (
            <Select
              value={row.estiloLabel || ''}
              onChange={(v) => atualizar(row.id, { estiloLabel: v })}
              options={ESTILO_OPCOES}
              showPlaceholder={false}
              className={inputClass}
            />
          );
        }
        const opt = ESTILO_OPCOES.find((o) => o.value === row.estiloLabel);
        return <span className="whitespace-nowrap">{opt?.label || '---'}</span>;
      },
    },
    {
      key: "estiloCampo",
      label: variant === 'texto_valor' ? 'Estilo' : 'Estilo registro',
      width: 130,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return (
            <Select
              value={row.estiloCampo || ''}
              onChange={(v) => atualizar(row.id, { estiloCampo: v })}
              options={ESTILO_OPCOES}
              showPlaceholder={false}
              className={inputClass}
            />
          );
        }
        const opt = ESTILO_OPCOES.find((o) => o.value === row.estiloCampo);
        return <span className="whitespace-nowrap">{opt?.label || '---'}</span>;
      },
    },
    {
      key: "estiloSoma",
      label: "Estilo soma",
      width: 130,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return (
            <Select
              value={row.estiloSoma || ''}
              onChange={(v) => atualizar(row.id, { estiloSoma: v })}
              options={ESTILO_OPCOES}
              showPlaceholder={false}
              className={inputClass}
            />
          );
        }
        const opt = ESTILO_OPCOES.find((o) => o.value === row.estiloSoma);
        return <span className="whitespace-nowrap">{opt?.label || '---'}</span>;
      },
    },
    {
      key: "largura",
      label: "Largura",
      width: 130,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return <NumberInput value={row.largura ?? 30} onChange={(v) => atualizar(row.id, { largura: v })} min={0} className={inputClass} />;
        }
        return <span>{row.largura ?? 30}</span>;
      },
    },
    {
      key: "soma",
      label: "Soma",
      width: 130,
      render: (row: CamposRelatorioRow) => {
        return (
          <span className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={row.soma ?? false}
              onChange={(e) => atualizar(row.id, { soma: e.target.checked })}
              className="cg-checkbox"
            />
          </span>
        );
      },
    },
    {
      key: "topoRegistro",
      label: "Topo",
      width: 130,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return <NumberInput value={row.topoRegistro ?? 0} onChange={(v) => atualizar(row.id, { topoRegistro: v })} min={0} className={inputClass} />;
        }
        return <span>{row.topoRegistro ?? 0}</span>;
      },
    },
    {
      key: "corCampo",
      label: "Cor",
      width: 130,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          const cid = `cor-${row.id}`;
          return (
            <div className="relative" style={{ height: 26 }}>
              <input
                type="color"
                id={cid}
                value={row.corCampo || '#1a1a1a'}
                onChange={(e) => atualizar(row.id, { corCampo: e.target.value })}
                className="absolute opacity-0 w-0 h-0 pointer-events-none"
              />
              <div
                className="w-full h-full cursor-pointer"
                style={{ backgroundColor: row.corCampo || '#1a1a1a' }}
                onClick={() => document.getElementById(cid)?.click()}
              />
            </div>
          );
        }
        return (
          <span className="block w-full h-4" style={{ backgroundColor: row.corCampo || '#1a1a1a' }} />
        );
      },
    },
    {
      key: "backgroundCampo",
      label: "Background",
      width: 130,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          const bid = `bg-${row.id}`;
          return (
            <div className="relative" style={{ height: 26 }}>
              <input
                type="color"
                id={bid}
                value={row.backgroundCampo || '#ffffff'}
                onChange={(e) => atualizar(row.id, { backgroundCampo: e.target.value })}
                className="absolute opacity-0 w-0 h-0 pointer-events-none"
              />
              <div
                className="w-full h-full cursor-pointer border border-slate-300"
                style={{ backgroundColor: row.backgroundCampo || '#ffffff' }}
                onClick={() => document.getElementById(bid)?.click()}
              />
            </div>
          );
        }
        return (
          <span className="block w-full h-4 border border-slate-300" style={{ backgroundColor: row.backgroundCampo || '#ffffff' }} />
        );
      },
    },
    {
      key: "fonteCampo",
      label: "Fonte",
      width: 130,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return (
            <Select
              value={row.fonteCampo || 'Arial'}
              onChange={(v) => atualizar(row.id, { fonteCampo: v })}
              options={FONTES_OPCOES}
              showPlaceholder={false}
              className={inputClass}
            />
          );
        }
        return <span className="whitespace-nowrap">{row.fonteCampo || 'Arial'}</span>;
      },
    },
    {
      key: "tamanhoFonteCampo",
      label: "Tamanho",
      width: 90,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return (
            <NumberInput
              value={row.tamanhoFonteCampo ?? 10}
              onChange={(v) => atualizar(row.id, { tamanhoFonteCampo: v })}
              min={1}
              max={72}
              className={inputClass}
            />
          );
        }
        return <span>{row.tamanhoFonteCampo ?? 10}</span>;
      },
    },
  ];

  // Filtrar colunas conforme a variante
  const textoValorHidden = new Set(['posicao', 'label', 'soma', 'estiloLabel', 'estiloSoma']);
  const listaHidden = new Set(['fonteCampo', 'tamanhoFonteCampo', 'corCampo', 'backgroundCampo']);
  const colecaoCampoHidden = ocultarColecaoCampo ? new Set(['colecao', 'chave']) : new Set<string>();
  const visibleColumns = variant === 'texto_valor'
    ? columns.filter((c) => !textoValorHidden.has(c.key) && !colecaoCampoHidden.has(c.key))
    : columns.filter((c) => !listaHidden.has(c.key) && !colecaoCampoHidden.has(c.key));

  return (
    <div className="relative">
      <style>{`
        .campo-edit-icon { opacity: 1; }
      `}</style>

      <ResizableTable
        columns={visibleColumns}
        rows={sortedCampos}
        rowKey={(row) => row.id}
        sortColumn={sortColumn}
        sortAsc={sortAsc}
        onSortChange={handleSort}
        onRowContextMenu={handleContextMenu}
        onRowClick={(row) => setSelectedId(row.id === selectedId ? null : row.id)}
        rowClassName={(row) => `campo-row${(selectedId === row.id || editingId === row.id) ? ' row-selected' : ''}`}
        pinnedColumns={["_actions"]}
        storageKeySuffix={userId}
        initialColumns={initialColumns}
        onColumnsChange={onColumnsChange}
      />

      {contextMenu && (
        <>
          <div
            className="fixed z-50 min-w-[120px] border border-slate-200 bg-white p-[3px] flex flex-col gap-[3px]"
            style={{ left: contextMenu.x, top: contextMenu.y, boxShadow: '0 4px 10px rgba(0,0,0,0.18)' }}
          >
            <button type="button" className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer" style={{ padding: '0.2rem 0.4rem' }} onClick={() => { setEditingId(contextMenu.id); setContextMenu(null); }}>Editar</button>
            <button type="button" className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer" style={{ padding: '0.2rem 0.4rem' }} onClick={() => duplicar(contextMenu.id)}>Duplicar</button>
            <button type="button" className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer" style={{ padding: '0.2rem 0.4rem' }} onClick={() => excluir(contextMenu.id)}>Excluir</button>
            {variant === 'texto_valor' && (() => { const row = campos.find((c) => c.id === contextMenu.id); if (row?.tipoCampo === 'conteudo') { return (
              <button type="button" className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer" style={{ padding: '0.2rem 0.4rem' }} onClick={() => { setConteudoModal({ id: contextMenu.id, value: row.conteudo ?? '' }); setContextMenu(null); }}>Conteúdo</button>
            ); } return null; })()}
          </div>
        </>
      )}
      {conteudoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="absolute inset-0" onClick={() => setConteudoModal(null)} />
          <div className="relative w-full max-w-[700px] bg-white modal-dark p-0 shadow-xl shadow-black/20 max-h-[80vh] flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between bg-[#ccc] px-[15px]">
              <h3 className="text-base font-semibold" style={{ color: '#000' }}>Conteúdo</h3>
              <button type="button" onClick={() => setConteudoModal(null)} className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2" aria-label="Fechar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-[15px] overflow-auto flex-1">
              <textarea
                className="w-full min-h-[300px] rounded-[3px] border border-slate-300 bg-white px-3 py-2 text-sm resize-y focus:border-[#003056] focus:outline-none"
                value={conteudoModal.value}
                onChange={(e) => setConteudoModal((prev) => prev ? { ...prev, value: e.target.value } : null)}
                placeholder="Digite o conteúdo..."
              />
            </div>
            <div className="flex-shrink-0 flex items-center justify-end gap-3 px-[15px] py-3">
              <button type="button" onClick={() => setConteudoModal(null)} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer" style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}>Cancelar</button>
              <button type="button" onClick={() => { if (conteudoModal) { atualizar(conteudoModal.id, { conteudo: conteudoModal.value }); setConteudoModal(null); } }} className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer" style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
