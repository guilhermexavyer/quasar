"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from "react";
import type { DataSourceCampo, DataSourceDef } from "@/types/relatorio";
import { gerarId, FORMATOS_CAMPO } from "@/lib/relatorioUtils";
import { getDataSource } from "@/lib/relatorioDataSources";
import Select from "@/components/ui/Select";
import ResizableTable from "@/components/ui/ResizableTable";
import { formatDate } from "@/lib/pessoaFisicaUtils";
import PaginationFooter, { usePagination } from "@/components/ui/PaginationFooter";

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
  /** Callback ao alterar ordem/qt_largura das colunas. */
  onColumnsChange?: (order: string[], widths: Record<string, number>) => void;
  /** Variante: 'lista' (padrão) ou 'texto_valor'. Controla quais colunas aparecem. */
  variant?: 'lista' | 'texto_valor';
  /** Se true, oculta as colunas Coleção e Campo (para bandas Cabeçalho/Rodapé). */
  ocultarColecaoCampo?: boolean;
  /** Retorna o próximo nr_sequencia (nunca reutiliza). */
  getNextSeq?: () => number;
  /** Lista de imagens cadastradas (para o campo Tipo = Imagem). */
  imagens?: { id: string; ds_imagem: string; ie_arquivo: string }[];
  /** Tipo da banda atual (para desabilitar Tipo em bandas Lista). */
  bandaTipo?: 'lista' | 'texto_valor' | 'cabecalho' | 'rodape';
  /** Callback ao clicar 'Ver' no menu de contexto. */
  onViewCampo?: (campo: CamposRelatorioRow) => void;
  /** Callback ao excluir um campo (para deletar do Firestore). */
  onDeleteCampo?: (campo: CamposRelatorioRow) => void;
  /** Callback ao duplicar um campo (para salvar no Firestore). */
  onDuplicateCampo?: (original: CamposRelatorioRow) => Promise<CamposRelatorioRow | null>;
}

export interface CamposRelatorioRow {
  id: string;
  /** Sequência do campo (nunca reutilizada). */
  nr_sequencia?: number;
  /** Descrição do elemento. */
  ds_elemento?: string;
  /** ID do Firestore (quando o elemento já foi salvo). */
  _firestoreId?: string;
  /** Data de criação do elemento. */
  dt_criacao?: string;
  /** Data da última alteração do elemento. */
  dt_alteracao?: string;
  /** Usuário que criou o elemento. */
  ds_usuario_criacao?: string;
  /** Usuário que alterou o elemento. */
  ds_usuario_alteracao?: string;
  /** Coleção de onde o campo vem (ex.: 'pat_ativo', 'cg_marca'). */
  ie_colecao: string;
  ie_campo: string;
  label: string;
  backgroundLabel: string;
  corLabel: string;
  cd_cor: string;
  cd_background: string;
  transparentCampo?: boolean;
  qt_padding_superior?: number;
  qt_padding_direita?: number;
  qt_padding_inferior?: number;
  qt_padding_esquerda?: number;
  ie_borda_superior?: string;
  ie_borda_direita?: string;
  ie_borda_inferior?: string;
  ie_borda_esquerda?: string;
  qt_esquerda: number;
  topoLabel: number;
  qt_topo: number;
  ie_alinhamento: string;
  ie_estilo_label: string;
  ie_estilo: string;
  ie_estilo_soma: string;
  qt_largura: number;
  formatacao: 'texto' | 'numero' | 'moeda' | 'data' | 'data_hora' | 'porcentagem';
  statusSistema?: boolean;
  soma?: boolean;
  /** Tipo do campo na banda Texto/Valor/Cabeçalho/Rodapé. */
  ie_tipo_elemento?: 'valor' | 'conteudo' | 'data_geracao' | 'horario_geracao' | 'data_horario_geracao' | 'usuario_geracao' | 'imagem';
  /** Conteúdo livre quando ie_tipo_elemento === 'conteudo'. */
  conteudo?: string;
  /** Fonte específica do campo (para banda Texto/Valor). */
  ie_fonte?: string;
  /** Tamanho da fonte do campo em pontos (para banda Texto/Valor). */
  qt_fonte?: number;
  /** ID da imagem selecionada (quando ie_tipo_elemento === 'imagem'). */
  nr_seq_imagem?: string;
  /** Tamanho da imagem em pixels. */
  qt_tamanho_imagem?: number;
}

/** Input numérico sem spinner, que permite apagar o 0. */
function NumberInput({ value, onChange, min, max, className, disabled }: { value: number; onChange: (v: number) => void; min?: number; max?: number; className?: string; disabled?: boolean }) {
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
      disabled={disabled}
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
  getNextSeq,
  imagens = [],
  bandaTipo,
  onViewCampo,
  onDeleteCampo,
  onDuplicateCampo,
}: CamposRelatorioTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Notificar o pai quando o estado de edição muda
  useEffect(() => {
    onEditingChange?.(editingId !== null);
  }, [editingId, onEditingChange]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);
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
    if (!dsPrincipal) return [{ value: '', label: '---' }, { value: colecaoPrincipal, label: colecaoPrincipal }];
    const result: { value: string; label: string }[] = [
      { value: '', label: '---' },
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
      if (updates.ie_colecao && updates.ie_colecao !== c.ie_colecao) {
        atualizado.ie_campo = '';
        atualizado.label = '';
        atualizado.statusSistema = false;
      }
      // Se mudou a chave, atualiza label e formatação
      if (updates.ie_campo && updates.ie_campo !== c.ie_campo) {
        const camposDaColecao = camposPorColecao[atualizado.ie_colecao] ?? [];
        const campoDef = camposDaColecao.find((cd) => cd.key === updates.ie_campo);
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
    const campo = campos.find((c) => c.id === id);
    if (campo && onDeleteCampo) {
      onDeleteCampo(campo);
    } else {
      onChange(campos.filter((c) => c.id !== id));
    }
    if (editingId === id) setEditingId(null);
    setContextMenu(null);
  }

  function duplicar(id: string) {
    const original = campos.find((c) => c.id === id);
    if (!original) return;
    if (onDuplicateCampo) {
      onDuplicateCampo(original).then((saved) => {
        if (saved) {
          const idx = campos.findIndex((c) => c.id === id);
          const updated = [...campos];
          updated.splice(idx + 1, 0, saved);
          onChange(updated);
        }
      });
    } else {
      const clone: CamposRelatorioRow = { ...original, id: gerarId(), nr_sequencia: getNextSeq ? getNextSeq() : (Math.max(0, ...campos.map((c) => c.nr_sequencia ?? 0)) + 1) };
      const idx = campos.findIndex((c) => c.id === id);
      const updated = [...campos];
      updated.splice(idx + 1, 0, clone);
      onChange(updated);
    }
    setContextMenu(null);
  }

  const sortedCampos = [...campos].sort((a, b) => {
    if (!sortColumn) return 0;
    const av = a[sortColumn as keyof CamposRelatorioRow] ?? '';
    const bv = b[sortColumn as keyof CamposRelatorioRow] ?? '';
    const cmp = String(av).localeCompare(String(bv), 'pt-BR', { numeric: true });
    return sortAsc ? cmp : -cmp;
  });

  const pagination = usePagination(sortedCampos.length);
  const paginatedCampos = pagination.slice(sortedCampos);

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
    {
      key: "nr_sequencia",
      label: "#",
      width: 40,
      render: (row: CamposRelatorioRow) => <span className="text-sm">{row.nr_sequencia ?? ''}</span>,
    },
    {
      key: "ds_elemento",
      label: "Descrição",
      width: 150,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return <input value={row.ds_elemento ?? ''} onChange={(e) => atualizar(row.id, { ds_elemento: e.target.value })} className={inputClass} />;
        }
        return <span className="truncate block">{row.ds_elemento || ''}</span>;
      },
    },
    {
      key: "ie_tipo_elemento",
      label: "Tipo",
      width: 130,
      render: (row: CamposRelatorioRow) => {
        const isLista = bandaTipo === 'lista';
        if (editingId === row.id) {
          return (
            <Select
              value={isLista ? 'valor' : (row.ie_tipo_elemento ?? '')}
              onChange={(v) => atualizar(row.id, { ie_tipo_elemento: (v || undefined) as CamposRelatorioRow['ie_tipo_elemento'] })}
              options={ocultarColecaoCampo
                ? [{ value: 'conteudo', label: 'Conteúdo' }, { value: 'data_geracao', label: 'Data da geração' }, { value: 'horario_geracao', label: 'Horário da geração' }, { value: 'data_horario_geracao', label: 'Data + horário da geração' }, { value: 'usuario_geracao', label: 'Usuário da geração' }, { value: 'imagem', label: 'Imagem' }]
                : [{ value: 'valor', label: 'Valor' }, { value: 'conteudo', label: 'Conteúdo' }, { value: 'data_geracao', label: 'Data da geração' }, { value: 'horario_geracao', label: 'Horário da geração' }, { value: 'data_horario_geracao', label: 'Data + horário da geração' }, { value: 'usuario_geracao', label: 'Usuário da geração' }, { value: 'imagem', label: 'Imagem' }]}
              showPlaceholder={true}
              className={`${inputClass} ${isLista ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLista}
            />
          );
        }
        const tipoLabels: Record<string, string> = { valor: 'Valor', conteudo: 'Conteúdo', data_geracao: 'Data da geração', horario_geracao: 'Horário da geração', data_horario_geracao: 'Data + horário da geração', usuario_geracao: 'Usuário da geração', imagem: 'Imagem' };
        const lbl = tipoLabels[row.ie_tipo_elemento ?? ''] ?? '';
        return <span className="whitespace-nowrap">{lbl}</span>;
      },
    },
    {      key: "colecao",
      label: "Coleção",
      width: 130,
      render: (row: CamposRelatorioRow) => {
        const desabilitado = variant === 'texto_valor' && row.ie_tipo_elemento !== 'valor';
        if (editingId === row.id) {
          return (
            <Select
              value={row.ie_colecao}
              onChange={(v) => atualizar(row.id, { ie_colecao: v })}
              options={colecoesDisponiveis}
              showPlaceholder={false}
              className={`${inputClass} ${desabilitado ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={desabilitado}
            />
          );
        }
        return <span className={`truncate block ${desabilitado ? 'text-slate-400' : ''}`}>{desabilitado ? '' : (row.ie_colecao || '')}</span>;
      },
    },
    {      key: "chave",
      label: "Campo",
      width: 130,
      render: (row: CamposRelatorioRow) => {
        const desabilitadoCampo = variant === 'texto_valor' && row.ie_tipo_elemento !== 'valor';
        if (desabilitadoCampo) {
          return <span className="text-slate-400"></span>;
        }
        if (editingId === row.id) {
          const camposDaColecao = camposPorColecao[row.ie_colecao] ?? [];
          const usadas = new Set(
            campos
              .filter((c) => c.ie_campo && c.ie_colecao === row.ie_colecao && c.ie_campo !== row.ie_campo)
              .map((c) => c.ie_campo)
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
              value={row.statusSistema ? row.ie_campo + '__sistema' : row.ie_campo}
              onChange={(v) => {
                const isSistema = v.endsWith('__sistema');
                const chave = isSistema ? v.replace('__sistema', '') : v;
                atualizar(row.id, { ie_campo: chave, statusSistema: isSistema });
              }}
              options={opcoes}
              showPlaceholder
              className={inputClass}
            />
          );
        }
        const display = row.statusSistema ? row.ie_campo + ' (sistema)' : row.ie_campo;
        return <span className="truncate block">{display || ''}</span>;
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
        return <span className="truncate block">{row.label || ''}</span>;
      },
    },
    {
      key: "qt_esquerda",
      label: "Esquerda",
      width: 130,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return <NumberInput value={row.qt_esquerda ?? 0} onChange={(v) => atualizar(row.id, { qt_esquerda: v })} min={0} className={inputClass} />;
        }
        return <span>{row.qt_esquerda ?? 0}</span>;
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
              value={row.ie_alinhamento || 'esquerda'}
              onChange={(v) => atualizar(row.id, { ie_alinhamento: v })}
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
        const lbl = row.ie_alinhamento === 'centro' ? 'Centro' : row.ie_alinhamento === 'direita' ? 'Direita' : 'Esquerda';
        return <span className="whitespace-nowrap">{lbl}</span>;
      },
    },
    {
      key: "ie_estilo_label",
      label: "Estilo label",
      width: 130,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return (
            <Select
              value={row.ie_estilo_label || ''}
              onChange={(v) => atualizar(row.id, { ie_estilo_label: v })}
              options={ESTILO_OPCOES}
              showPlaceholder={false}
              className={inputClass}
            />
          );
        }
        const opt = ESTILO_OPCOES.find((o) => o.value === row.ie_estilo_label);
        return <span className="whitespace-nowrap">{opt?.label || ''}</span>;
      },
    },
    {
      key: "ie_estilo",
      label: variant === 'texto_valor' ? 'Estilo' : 'Estilo registro',
      width: 130,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return (
            <Select
              value={row.ie_estilo || ''}
              onChange={(v) => atualizar(row.id, { ie_estilo: v })}
              options={ESTILO_OPCOES}
              showPlaceholder={false}
              className={inputClass}
            />
          );
        }
        const opt = ESTILO_OPCOES.find((o) => o.value === row.ie_estilo);
        return <span className="whitespace-nowrap">{opt?.label || ''}</span>;
      },
    },
    {
      key: "ie_estilo_soma",
      label: "Estilo soma",
      width: 130,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return (
            <Select
              value={row.ie_estilo_soma || ''}
              onChange={(v) => atualizar(row.id, { ie_estilo_soma: v })}
              options={ESTILO_OPCOES}
              showPlaceholder={false}
              className={inputClass}
            />
          );
        }
        const opt = ESTILO_OPCOES.find((o) => o.value === row.ie_estilo_soma);
        return <span className="whitespace-nowrap">{opt?.label || ''}</span>;
      },
    },
    {
      key: "qt_largura",
      label: "Largura",
      width: 130,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return <NumberInput value={row.qt_largura ?? 30} onChange={(v) => atualizar(row.id, { qt_largura: v })} min={0} className={inputClass} />;
        }
        return <span>{row.qt_largura ?? 30}</span>;
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
          return <NumberInput value={row.qt_topo ?? 0} onChange={(v) => atualizar(row.id, { qt_topo: v })} min={0} className={inputClass} />;
        }
        return <span>{row.qt_topo ?? 0}</span>;
      },
    },
    {
      key: "cd_cor",
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
                value={row.cd_cor || '#1a1a1a'}
                onChange={(e) => atualizar(row.id, { cd_cor: e.target.value })}
                className="absolute opacity-0 w-0 h-0 pointer-events-none"
              />
              <div
                className="w-full h-full cursor-pointer"
                style={{ backgroundColor: row.cd_cor || '#1a1a1a' }}
                onClick={() => document.getElementById(cid)?.click()}
              />
            </div>
          );
        }
        return (
          <span className="block w-full h-4" style={{ backgroundColor: row.cd_cor || '#1a1a1a' }} />
        );
      },
    },
    {
      key: "cd_background",
      label: "Background",
      width: 130,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          const bid = `bg-${row.id}`;
          return (
            <div className="flex items-center gap-1">
              <div className="relative flex-1" style={{ height: 26 }}>
                <input
                  type="color"
                  id={bid}
                  value={row.cd_background || '#ffffff'}
                  onChange={(e) => atualizar(row.id, { cd_background: e.target.value })}
                  className="absolute opacity-0 w-0 h-0 pointer-events-none"
                />
                <div
                  className="w-full h-full cursor-pointer border border-slate-300"
                  style={{ backgroundColor: row.transparentCampo ? 'transparent' : (row.cd_background || '#ffffff'), backgroundImage: row.transparentCampo ? 'repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 50% / 8px 8px' : 'none' }}
                  onClick={() => document.getElementById(bid)?.click()}
                />
              </div>
              <label className="flex items-center cursor-pointer" title="Fundo transparente">
                <input type="checkbox" checked={row.transparentCampo ?? false}
                  onChange={(e) => atualizar(row.id, { transparentCampo: e.target.checked })}
                  className="cg-checkbox" />
              </label>
            </div>
          );
        }
        return (
          <span className="block w-full h-4 border border-slate-300" style={{ backgroundColor: row.transparentCampo ? 'transparent' : (row.cd_background || '#ffffff'), backgroundImage: row.transparentCampo ? 'repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 50% / 8px 8px' : 'none' }} />
        );
      },
    },
    {
      key: "ie_fonte",
      label: "Fonte",
      width: 130,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return (
            <Select
              value={row.ie_fonte || 'Arial'}
              onChange={(v) => atualizar(row.id, { ie_fonte: v })}
              options={FONTES_OPCOES}
              showPlaceholder={false}
              className={inputClass}
            />
          );
        }
        return <span className="whitespace-nowrap">{row.ie_fonte || 'Arial'}</span>;
      },
    },
    {
      key: "qt_fonte",
      label: "Tamanho fonte",
      width: 90,
      render: (row: CamposRelatorioRow) => {
        if (editingId === row.id) {
          return (
            <NumberInput
              value={row.qt_fonte ?? 10}
              onChange={(v) => atualizar(row.id, { qt_fonte: v })}
              min={1}
              max={72}
              className={inputClass}
            />
          );
        }
        return <span>{row.qt_fonte ?? 10}</span>;
      },
    },
    {
      key: "nr_seq_imagem",
      label: "Imagem",
      width: 150,
      render: (row: CamposRelatorioRow) => {
        const desabilitado = row.ie_tipo_elemento !== 'imagem';
        if (editingId === row.id) {
          return (
            <Select
              value={row.nr_seq_imagem ?? ''}
              onChange={(v) => atualizar(row.id, { nr_seq_imagem: v || undefined })}
              options={imagens.map((img) => ({ value: img.id, label: img.ds_imagem }))}
              showPlaceholder={true}
              disabled={desabilitado}
              className={`${inputClass} ${desabilitado ? 'opacity-50' : ''}`}
            />
          );
        }
        if (desabilitado) return <span className="text-slate-400"></span>;
        const img = imagens.find((i) => i.id === row.nr_seq_imagem);
        return <span className="whitespace-nowrap truncate">{img?.ds_imagem ?? ''}</span>;
      },
    },
    {
      key: "qt_tamanho_imagem",
      label: "Tamanho imagem",
      width: 110,
      render: (row: CamposRelatorioRow) => {
        const desabilitado = row.ie_tipo_elemento !== 'imagem';
        if (editingId === row.id) {
          return (
            <NumberInput
              value={row.qt_tamanho_imagem ?? 100}
              onChange={(v) => atualizar(row.id, { qt_tamanho_imagem: v })}
              min={1}
              max={2000}
              disabled={desabilitado}
              className={`${inputClass} ${desabilitado ? 'opacity-50' : ''}`}
            />
          );
        }
        if (desabilitado) return <span className="text-slate-400"></span>;
        return <span>{row.qt_tamanho_imagem ?? 100}</span>;
      },
    },
    {
      key: "dt_criacao",
      label: "Criação",
      width: 160,
      render: (row: CamposRelatorioRow) => <span className="text-sm">{formatDate(String(row.dt_criacao ?? '')) || ''}</span>,
    },
    {
      key: "dt_alteracao",
      label: "Alteração",
      width: 160,
      render: (row: CamposRelatorioRow) => <span className="text-sm">{formatDate(String(row.dt_alteracao ?? '')) || ''}</span>,
    },
    {
      key: "ds_usuario_criacao",
      label: "Usuário criação",
      render: (row: CamposRelatorioRow) => <span className="text-sm">{row.ds_usuario_criacao || ''}</span>,
    },
    {
      key: "ds_usuario_alteracao",
      label: "Usuário alteração",
      render: (row: CamposRelatorioRow) => <span className="text-sm">{row.ds_usuario_alteracao || ''}</span>,
    },
  ];

  // Filtrar colunas conforme a variante
  const textoValorHidden = new Set(['label', 'soma', 'ie_estilo_label', 'ie_estilo', 'ie_estilo_soma']);
  const listaHidden = new Set(['ie_fonte', 'qt_fonte', 'cd_cor', 'cd_background', 'qt_padding_superior', 'qt_padding_direita', 'qt_padding_inferior', 'qt_padding_esquerda', 'ie_borda_superior', 'ie_borda_direita', 'ie_borda_inferior', 'ie_borda_esquerda', 'nr_seq_imagem', 'qt_tamanho_imagem']);
  const colecaoCampoHidden = ocultarColecaoCampo ? new Set(['colecao', 'chave']) : new Set<string>();
  const visibleColumns = variant === 'texto_valor'
    ? columns.filter((c) => !textoValorHidden.has(c.key) && !colecaoCampoHidden.has(c.key))
    : columns.filter((c) => !listaHidden.has(c.key) && !colecaoCampoHidden.has(c.key));

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <style>{`
        .campo-edit-icon { opacity: 1; }
      `}</style>

      <div className="min-h-0 flex-1 overflow-auto">
      <ResizableTable
        columns={visibleColumns}
        rows={paginatedCampos}
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
      </div>

      <PaginationFooter
        totalRecords={sortedCampos.length}
        currentPage={pagination.currentPage}
        pageSize={pagination.pageSize}
        onPageChange={pagination.setCurrentPage}
        onPageSizeChange={pagination.setPageSize}
      />

      {contextMenu && (
        <>
          <div
            className="fixed z-50 min-w-[120px] border border-slate-200 bg-white p-[3px] flex flex-col gap-[3px]"
            style={{ left: contextMenu.x, top: contextMenu.y, boxShadow: '0 4px 10px rgba(0,0,0,0.18)' }}
          >
            <button type="button" className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer" style={{ padding: '0.2rem 0.4rem' }} onClick={() => { const row = campos.find((c) => c.id === contextMenu.id); if (row && onViewCampo) onViewCampo(row); setContextMenu(null); }}>Ver</button>
            <button type="button" className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer" style={{ padding: '0.2rem 0.4rem' }} onClick={() => { setEditingId(contextMenu.id); setContextMenu(null); }}>Editar</button>
            <button type="button" className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer" style={{ padding: '0.2rem 0.4rem' }} onClick={() => duplicar(contextMenu.id)}>Duplicar</button>
            <button type="button" className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer" style={{ padding: '0.2rem 0.4rem' }} onClick={() => excluir(contextMenu.id)}>Excluir</button>
          </div>
        </>
      )}
    </div>
  );
}
