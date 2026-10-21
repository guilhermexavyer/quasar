"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { PeriodoLetivo } from "@/types/periodoLetivo";
import type { PeriodoLetivoFeriado } from "@/types/periodoLetivoFeriado";
import type { AuditAutor } from "@/services/auditService";
import type { CampoStatus } from "@/lib/camposConfigUtils";
import { FIELD_INFOS, TIPO_FERIADO_OPTIONS, rotuloTipoFeriado } from "@/lib/periodoLetivoFeriadoUtils";
import { applyDateMask, formatDate, parseDateInput } from "@/lib/pessoaFisicaUtils";
import { atualizarFeriado, criarFeriado, excluirFeriado, observarFeriadosDoPeriodo } from "@/services/periodoLetivoFeriadoService";
import Select from "@/components/ui/Select";
import ResizableTable, { type ConfigColunasTabela, type ResizableTableColumn } from "@/components/ui/ResizableTable";
import PaginationFooter, { usePagination } from "@/components/ui/PaginationFooter";
import RotuloCampo from "@/components/ui/RotuloCampo";
import RequiredAsterisk from "@/components/ui/RequiredAsterisk";
import { elementoVisivel } from "@/lib/visibilidade";

/** Campos editáveis do feriado (os demais são preenchidos pelo sistema). */
type CampoFeriado = 'dt_feriado' | 'ds_feriado' | 'ie_tipo_feriado';

interface FormFeriado {
  /** Documento do feriado em edição; ausente = novo feriado. */
  id?: string;
  dt_feriado: string;
  ds_feriado: string;
  ie_tipo_feriado: string;
}

const FORM_VAZIO: FormFeriado = { dt_feriado: '', ds_feriado: '', ie_tipo_feriado: '' };

interface PeriodoLetivoFeriadosViewProps {
  periodo: PeriodoLetivo;
  selectOptions: { value: string; label: string }[];
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  allowedSubmodulos?: string[];
  /** Navegação entre os períodos letivos (setas). */
  onPrevRecord: () => void;
  onNextRecord: () => void;
  hasPrevRecord: boolean;
  hasNextRecord: boolean;
  /** Volta para a lista de períodos letivos (breadcrumb). */
  onVoltar: () => void;
  auditAutor?: AuditAutor;
  /** Regras de campos do perfil ativo (coleção periodo_letivo_feriado). */
  campoRegras?: Record<string, CampoStatus>;
  /** Abre o histórico de auditoria de um feriado. */
  onOpenAudit?: (feriadoId: string) => void;
  resolverNomeAutor?: (nome: string) => string;
  /** Mensagem (toast) para o usuário. */
  onMessage: (mensagem: string) => void;
  onSavingChange?: (saving: boolean) => void;
  /** Confirmação antes de excluir (modal padrão do sistema). */
  confirmar: (titulo: string, mensagem: string, acao: () => void) => void;
  colunas?: ConfigColunasTabela;
  darkMode?: boolean;
}

/** Data DD/MM/AAAA → número AAAAMMDD (para ordenar). */
function chaveData(valor?: string): number {
  return valor ? parseDateInput(valor) ?? 0 : 0;
}

/**
 * Feriados de um período letivo, no mesmo molde das Bandas de um relatório:
 * duplo clique no período letivo abre esta tela, com o dropdown pai, as setas
 * (navegam entre os períodos letivos) e o breadcrumb "Período letivo: N ..."
 * (clicando, volta para a lista). Aqui os feriados são listados e cadastrados.
 */
export default function PeriodoLetivoFeriadosView({
  periodo,
  selectOptions,
  manageSelection,
  onManageSelectionChange,
  allowedSubmodulos = ['alunos', 'colaboradores', 'periodoLetivo'],
  onPrevRecord,
  onNextRecord,
  hasPrevRecord,
  hasNextRecord,
  onVoltar,
  auditAutor,
  campoRegras = {},
  onOpenAudit,
  resolverNomeAutor = (nome) => nome,
  onMessage,
  onSavingChange,
  confirmar,
  colunas,
  darkMode = false,
}: PeriodoLetivoFeriadosViewProps) {
  const [feriados, setFeriados] = useState<PeriodoLetivoFeriado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>('dt_feriado');
  const [sortAsc, setSortAsc] = useState(true);
  /** Formulário aberto (null = lista de feriados). */
  const [form, setForm] = useState<FormFeriado | null>(null);
  const [erros, setErros] = useState<CampoFeriado[]>([]);
  const [salvando, setSalvando] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Feriados do período em tempo real.
  useEffect(() => {
    return observarFeriadosDoPeriodo(
      periodo.nr_sequencia,
      (lista) => { setFeriados(lista); setCarregando(false); },
      () => { setCarregando(false); onMessage('Erro ao carregar registros.'); }
    );
    // onMessage é estável o suficiente; recarrega só ao trocar de período.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo.nr_sequencia]);

  useEffect(() => { onSavingChange?.(salvando); }, [salvando, onSavingChange]);

  // Ctrl+S salva o feriado aberto (só o que está visível na tela).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 's') return;
      const f = formRef.current;
      if (!f || !elementoVisivel(f)) return;
      e.preventDefault();
      if (!salvando) f.requestSubmit();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [salvando]);

  const statusDe = (campo: CampoFeriado): CampoStatus => campoRegras[campo] ?? 'N';
  const asterisco = (campo: CampoFeriado) => (statusDe(campo) === 'O' ? <RequiredAsterisk /> : undefined);
  const classeCampo = (campo: CampoFeriado) =>
    `w-full rounded-[3px] border ${erros.includes(campo) ? 'border-red-500' : 'border-slate-300'} bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]`;

  const feriadoAberto = form?.id ? feriados.find((f) => f.id === form.id) : undefined;

  const ordenados = useMemo(() => {
    const lista = [...feriados];
    if (!sortColumn) return lista;
    return lista.sort((a, b) => {
      let cmp: number;
      if (sortColumn === 'dt_feriado') cmp = chaveData(a.dt_feriado) - chaveData(b.dt_feriado);
      else if (sortColumn === 'nr_sequencia') cmp = (a.nr_sequencia ?? 0) - (b.nr_sequencia ?? 0);
      else if (sortColumn === 'ie_tipo_feriado') cmp = rotuloTipoFeriado(a.ie_tipo_feriado).localeCompare(rotuloTipoFeriado(b.ie_tipo_feriado), 'pt-BR');
      else cmp = String(a[sortColumn as keyof PeriodoLetivoFeriado] ?? '').localeCompare(String(b[sortColumn as keyof PeriodoLetivoFeriado] ?? ''), 'pt-BR');
      return sortAsc ? cmp : -cmp;
    });
  }, [feriados, sortColumn, sortAsc]);

  const paginacao = usePagination(ordenados.length);

  const columns: ResizableTableColumn<PeriodoLetivoFeriado>[] = useMemo(() => [
    { key: 'nr_sequencia', label: '#', cellClassName: 'text-right', render: (f) => <span className="text-sm">{f.nr_sequencia}</span> },
    { key: 'dt_feriado', label: 'Data', render: (f) => <span className="text-sm">{f.dt_feriado ?? ''}</span> },
    { key: 'ds_feriado', label: 'Descrição', width: 260, render: (f) => <span className="text-sm text-black">{f.ds_feriado ?? ''}</span> },
    { key: 'ie_tipo_feriado', label: 'Tipo', render: (f) => <span className="text-sm">{rotuloTipoFeriado(f.ie_tipo_feriado)}</span> },
    { key: 'dt_criacao', label: 'Criação', render: (f) => <span className="text-sm">{formatDate(String(f.dt_criacao ?? ''))}</span> },
    { key: 'dt_alteracao', label: 'Alteração', render: (f) => <span className="text-sm">{formatDate(String(f.dt_alteracao ?? ''))}</span> },
    { key: 'ds_usuario_criacao', label: 'Usuário criação', render: (f) => <span className="text-sm">{resolverNomeAutor(f.ds_usuario_criacao ?? '')}</span> },
    { key: 'ds_usuario_alteracao', label: 'Usuário alteração', render: (f) => <span className="text-sm">{resolverNomeAutor(f.ds_usuario_alteracao ?? '')}</span> },
  ], [resolverNomeAutor]);

  function abrirFeriado(f: PeriodoLetivoFeriado) {
    setSelecionadoId(f.id ?? null);
    setErros([]);
    setForm({ id: f.id, dt_feriado: f.dt_feriado ?? '', ds_feriado: f.ds_feriado ?? '', ie_tipo_feriado: f.ie_tipo_feriado ?? '' });
  }

  function novoFeriado() {
    setErros([]);
    setForm({ ...FORM_VAZIO });
  }

  function fecharFormulario() {
    setErros([]);
    setForm(null);
  }

  function pedirExclusao(f: PeriodoLetivoFeriado) {
    confirmar('Excluir registro', `Deseja mesmo excluir o feriado ${f.nr_sequencia ?? ''}?`, async () => {
      if (!f.id) return;
      try {
        await excluirFeriado(f.id);
        if (form?.id === f.id) fecharFormulario();
        onMessage('Excluído com sucesso!');
      } catch {
        onMessage('Erro ao excluir.');
      }
    });
  }

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form || salvando) return;
    const faltando = (['dt_feriado', 'ds_feriado', 'ie_tipo_feriado'] as CampoFeriado[])
      .filter((c) => statusDe(c) === 'O' && !String(form[c] ?? '').trim());
    setErros(faltando);
    if (faltando.length > 0) {
      onMessage('Preencha os campos obrigatórios.');
      return;
    }
    if (form.dt_feriado && parseDateInput(form.dt_feriado) === null) {
      setErros(['dt_feriado']);
      onMessage('Informe uma data válida.');
      return;
    }
    setSalvando(true);
    try {
      const dados = { dt_feriado: form.dt_feriado, ds_feriado: form.ds_feriado.trim(), ie_tipo_feriado: form.ie_tipo_feriado };
      if (form.id) {
        await atualizarFeriado(form.id, dados, auditAutor);
        onMessage('Registro alterado com sucesso!');
      } else {
        const id = await criarFeriado({ ...dados, nr_seq_periodo_letivo: periodo.nr_sequencia }, auditAutor);
        setSelecionadoId(id);
        onMessage('Registro criado com sucesso!');
      }
      fecharFormulario();
    } catch {
      onMessage('Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  const corBreadcrumb = darkMode ? '#ddd' : '#333';
  const sublinhar = {
    onMouseEnter: (e: ReactMouseEvent<HTMLElement>) => { e.currentTarget.style.borderBottomColor = darkMode ? '#fff' : '#000'; },
    onMouseLeave: (e: ReactMouseEvent<HTMLElement>) => { e.currentTarget.style.borderBottomColor = 'transparent'; },
  };
  const classeSeta = (ativo: boolean) =>
    `inline-flex items-center justify-center rounded-[3px] border border-slate-300 bg-[#ddd] px-[5px] py-[5px] text-sm text-black cursor-pointer ${ativo ? 'hover:bg-slate-300' : 'opacity-40'}`;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* ── Barra superior: dropdown pai, setas e breadcrumb ── */}
      <div className="flex items-center justify-between gap-3 min-h-[42px]">
        <div className="flex items-center gap-2 min-w-0">
          <Select
            value={manageSelection}
            onChange={onManageSelectionChange}
            options={selectOptions.filter((o) => allowedSubmodulos.includes(o.value))}
            disabled
            showPlaceholder={false}
            className="!w-[180px]"
          />
          <div className="flex items-center gap-1">
            <button type="button" onClick={onPrevRecord} disabled={!hasPrevRecord} className={classeSeta(hasPrevRecord)} style={{ borderBottomColor: '#000' }} aria-label="Registro anterior">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18 9 12l6-6" /></svg>
            </button>
            <button type="button" onClick={onNextRecord} disabled={!hasNextRecord} className={classeSeta(hasNextRecord)} style={{ borderBottomColor: '#000' }} aria-label="Próximo registro">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18 15 12 9 6" /></svg>
            </button>
          </div>
          <div
            className="flex items-center text-xs ml-2 whitespace-nowrap overflow-hidden px-2 py-1"
            style={{ color: darkMode ? '#fff' : '#000', border: '1px solid', borderColor: darkMode ? '#2c2c31 #38383e #38383e #2c2c31' : '#999 #ccc #ccc #999' }}
          >
            <span className="cursor-pointer" style={{ borderBottom: '1px solid transparent' }} onClick={onVoltar} {...sublinhar}>
              <span style={{ color: corBreadcrumb }}>Período letivo: {periodo.nr_sequencia}</span>
              <span className="ml-1" style={{ color: corBreadcrumb }}>{periodo.ds_periodo_letivo}</span>
            </span>
            {feriadoAberto && (
              <>
                <span className="mx-1">&gt;</span>
                <span className="cursor-pointer" style={{ borderBottom: '1px solid transparent' }} onClick={fecharFormulario} {...sublinhar}>
                  <span style={{ color: corBreadcrumb }}>Feriado: {feriadoAberto.nr_sequencia}</span>
                  <span className="ml-1" style={{ color: corBreadcrumb }}>{feriadoAberto.ds_feriado}</span>
                </span>
              </>
            )}
          </div>
        </div>
        {!form && (
          <button
            type="button"
            onClick={novoFeriado}
            className="inline-flex items-center rounded-[3px] border border-transparent bg-transparent px-4 py-2.5 text-sm font-normal text-[#066fc5] transition cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2 active:outline active:outline-1 active:outline-[#066fc5] active:outline-offset-2"
          >
            Adicionar
          </button>
        )}
      </div>

      {form ? (
        /* ── Formulário do feriado ── */
        <form ref={formRef} onSubmit={salvar} className="mt-4 flex-1 flex flex-col min-h-0">
          <div className="grid gap-[15px] sm:grid-cols-12 pt-2">
            <div className="sm:col-span-1">
              <RotuloCampo texto="Sequência" colecao={FIELD_INFOS.nr_sequencia.collection} campo="nr_sequencia" />
              <input disabled value={String(feriadoAberto?.nr_sequencia ?? '')} className="w-full rounded-[3px] border border-slate-300 px-2 py-1.5 text-sm transition focus:outline-none" />
            </div>
            <div className="sm:col-span-2">
              <RotuloCampo texto="Data" colecao={FIELD_INFOS.dt_feriado.collection} campo="dt_feriado" prefixo={asterisco('dt_feriado')} />
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder="DD/MM/AAAA"
                disabled={statusDe('dt_feriado') === 'D'}
                className={classeCampo('dt_feriado')}
                value={form.dt_feriado}
                onChange={(e) => setForm({ ...form, dt_feriado: applyDateMask(e.target.value) })}
              />
            </div>
            <div className="sm:col-span-6">
              <RotuloCampo texto="Descrição" colecao={FIELD_INFOS.ds_feriado.collection} campo="ds_feriado" prefixo={asterisco('ds_feriado')} />
              <input
                disabled={statusDe('ds_feriado') === 'D'}
                className={classeCampo('ds_feriado')}
                value={form.ds_feriado}
                onChange={(e) => setForm({ ...form, ds_feriado: e.target.value })}
              />
            </div>
            <div className="sm:col-span-3">
              <RotuloCampo texto="Tipo" colecao={FIELD_INFOS.ie_tipo_feriado.collection} campo="ie_tipo_feriado" prefixo={asterisco('ie_tipo_feriado')} />
              <Select
                disabled={statusDe('ie_tipo_feriado') === 'D'}
                error={erros.includes('ie_tipo_feriado')}
                value={form.ie_tipo_feriado}
                onChange={(v) => setForm({ ...form, ie_tipo_feriado: v })}
                options={TIPO_FERIADO_OPTIONS}
                showPlaceholder
              />
            </div>
          </div>

          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between gap-3">
              {feriadoAberto && (
                <div className="text-[13px] text-slate-500">
                  {([
                    ['Criado', feriadoAberto.ds_usuario_criacao, feriadoAberto.dt_criacao],
                    ['Alterado', feriadoAberto.ds_usuario_alteracao, feriadoAberto.dt_alteracao],
                  ] as const).map(([acao, autor, data], i) => (
                    <div key={acao} className={`relative group flex items-center gap-2 ${i > 0 ? 'mt-1' : ''}`}>
                      <span>{acao} por {resolverNomeAutor(autor ?? '') || '-'} em {data ? formatDate(data) : '-'}</span>
                      <button
                        type="button"
                        aria-hidden="true"
                        onClick={() => feriadoAberto.id && onOpenAudit?.(feriadoAberto.id)}
                        className="inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4" />
                          <circle cx="12" cy="16" r="0.5" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-end gap-3 ml-auto">
                <button
                  type="button"
                  onClick={fecharFormulario}
                  className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                  style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60"
                  style={{ backgroundColor: '#003056', borderBottomColor: '#000' }}
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* ── Lista de feriados ── */
        <div className="mt-4 flex-1 flex flex-col min-h-0">
          {!carregando && feriados.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
              <p className="mt-4 font-medium text-slate-500">Nenhum registro encontrado.</p>
              <p className="mt-1 text-sm text-slate-500">Clique em &quot;Adicionar&quot; para cadastrar um feriado.</p>
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-auto">
                <ResizableTable
                  columns={columns}
                  rows={paginacao.slice(ordenados)}
                  rowKey={(f) => f.id ?? String(f.nr_sequencia)}
                  sortColumn={sortColumn}
                  sortAsc={sortAsc}
                  onSortChange={(key) => {
                    if (sortColumn === key) setSortAsc((v) => !v);
                    else { setSortColumn(key); setSortAsc(true); }
                  }}
                  onRowClick={(f) => setSelecionadoId((atual) => (atual === f.id ? null : f.id ?? null))}
                  onRowDoubleClick={abrirFeriado}
                  onRowContextMenu={(f, e) => {
                    e.preventDefault();
                    setSelecionadoId(f.id ?? null);
                    setMenu({ id: f.id ?? '', x: e.clientX, y: e.clientY });
                  }}
                  rowClassName={(f) => (selecionadoId === f.id ? 'row-selected' : '')}
                  {...colunas}
                />
              </div>
              <PaginationFooter
                totalRecords={ordenados.length}
                currentPage={paginacao.currentPage}
                pageSize={paginacao.pageSize}
                onPageChange={paginacao.setCurrentPage}
                onPageSizeChange={paginacao.setPageSize}
              />
            </>
          )}
        </div>
      )}

      {menu && (() => {
        const alvo = feriados.find((f) => f.id === menu.id);
        if (!alvo) return null;
        return (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} onContextMenu={(e) => { e.preventDefault(); setMenu(null); }} />
            <div
              className="fixed z-50 min-w-[120px] border border-slate-200 bg-white p-[3px] flex flex-col gap-[3px]"
              style={{ left: menu.x, top: menu.y, boxShadow: '0 4px 10px rgba(0,0,0,0.18)' }}
            >
              <button type="button" className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer" style={{ padding: '0.2rem 0.4rem' }} onClick={() => { abrirFeriado(alvo); setMenu(null); }}>Ver</button>
              <button type="button" className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer" style={{ padding: '0.2rem 0.4rem' }} onClick={() => { setMenu(null); pedirExclusao(alvo); }}>Excluir</button>
            </div>
          </>
        );
      })()}
    </div>
  );
}
