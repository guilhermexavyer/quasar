"use client";

import LoadingModal from "@/components/ui/LoadingModal";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { Aluno } from "@/types/aluno";
import type { AlunoResponsavel } from "@/types/alunoResponsavel";
import type { CampoStatus } from "@/lib/camposConfigUtils";
import { COLECAO_ALUNO_RESPONSAVEL } from "@/lib/alunoResponsavelUtils";
import { formatDate } from "@/lib/pessoaFisicaUtils";
import { atualizarAlunoResponsavel, criarAlunoResponsavel, excluirAlunoResponsavel, observarResponsaveisDoAluno } from "@/services/alunoResponsavelService";
import Select from "@/components/ui/Select";
import ResizableTable, { proximaOrdenacao, type ConfigColunasTabela, type ResizableTableColumn } from "@/components/ui/ResizableTable";
import PaginationFooter, { usePagination } from "@/components/ui/PaginationFooter";
import RotuloCampo from "@/components/ui/RotuloCampo";
import RequiredAsterisk from "@/components/ui/RequiredAsterisk";
import ViewIcon from "@/components/ui/ViewIcon";
import SearchIcon from "@/components/ui/SearchIcon";
import { elementoVisivel } from "@/lib/visibilidade";

type Aba = 'responsaveis';

interface FormResponsavel {
  /** Registro em edição; ausente = novo responsável. */
  id?: string;
  nr_seq_pessoa_fisica: string;
  nr_seq_grau_parentesco: string;
}

interface AlunoDetalheViewProps {
  aluno: Aluno;
  /** Nome do aluno (pessoa física vinculada), exibido no breadcrumb. */
  nomeAluno: string;
  selectOptions: { value: string; label: string }[];
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  allowedSubmodulos?: string[];
  /** Navegação entre os alunos (setas). */
  onPrevRecord: () => void;
  onNextRecord: () => void;
  hasPrevRecord: boolean;
  hasNextRecord: boolean;
  /** Volta para a lista de alunos (breadcrumb). */
  onVoltar: () => void;
  /** Regras de campos do perfil ativo (coleção aluno_responsavel). */
  campoRegras?: Record<string, CampoStatus>;
  /** Abre o histórico de auditoria de um responsável. */
  onOpenAudit?: (responsavelId: string) => void;
  resolverNomeAutor?: (nome: string) => string;
  onMessage: (mensagem: string) => void;
  onSavingChange?: (saving: boolean) => void;
  /** Confirmação antes de excluir (modal padrão do sistema). */
  confirmar: (titulo: string, mensagem: string, acao: () => void) => void;
  /** Pessoas físicas cadastradas (validação do campo). */
  pessoasFisicas: { nr_sequencia: number }[];
  nomePessoaFisica: (nrSequencia?: number) => string;
  /** Abre o lookup de Pessoa Física; chama aoSelecionar com a sequência escolhida. */
  onOpenPessoaFisicaLookup: (aoSelecionar: (nrSequencia: number) => void) => void;
  onViewPessoaFisica: (nrSequencia: number) => void;
  grauParentescoOptions: { value: string; label: string }[];
  colunasResponsaveis?: ConfigColunasTabela;
  darkMode?: boolean;
}

/**
 * Responsáveis de um aluno, no mesmo molde dos responsáveis de um ativo:
 * duplo clique no aluno abre esta tela, com o dropdown pai, as setas (navegam
 * entre os alunos), o breadcrumb "Aluno: N ..." (clicando, volta para a lista)
 * e a aba Responsáveis ao lado do botão Adicionar.
 */
export default function AlunoDetalheView({
  aluno,
  nomeAluno,
  selectOptions,
  manageSelection,
  onManageSelectionChange,
  allowedSubmodulos = ['alunos'],
  onPrevRecord,
  onNextRecord,
  hasPrevRecord,
  hasNextRecord,
  onVoltar,
  campoRegras = {},
  onOpenAudit,
  resolverNomeAutor = (nome) => nome,
  onMessage,
  onSavingChange,
  confirmar,
  pessoasFisicas,
  nomePessoaFisica,
  onOpenPessoaFisicaLookup,
  onViewPessoaFisica,
  grauParentescoOptions,
  colunasResponsaveis,
  darkMode = false,
}: AlunoDetalheViewProps) {
  const [aba, setAba] = useState<Aba>('responsaveis');
  const [responsaveis, setResponsaveis] = useState<AlunoResponsavel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  // Ordenação (três cliques: crescente → decrescente → padrão pela sequência).
  const [sortResp, setSortResp] = useState<{ coluna: string | null; asc: boolean }>({ coluna: null, asc: true });
  /** Formulário aberto (null = lista de responsáveis). */
  const [form, setForm] = useState<FormResponsavel | null>(null);
  /** Campos com erro no último salvar. */
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Responsáveis do aluno em tempo real. (A tela é recriada a cada aluno — key —,
  // então "carregando" já começa verdadeiro.)
  useEffect(() => {
    return observarResponsaveisDoAluno(
      aluno.nr_sequencia,
      (lista) => { setResponsaveis(lista); setCarregando(false); },
      () => { setCarregando(false); onMessage('Erro ao carregar registros.'); }
    );
    // Recarrega só ao trocar de aluno.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aluno.nr_sequencia]);

  useEffect(() => { onSavingChange?.(salvando); }, [salvando, onSavingChange]);

  // Ctrl+S salva o responsável aberto (só o que está visível na tela).
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

  const statusPessoa: CampoStatus = campoRegras['nr_seq_pessoa_fisica'] ?? 'N';
  const statusGrau: CampoStatus = campoRegras['nr_seq_grau_parentesco'] ?? 'N';
  const responsavelAberto = form?.id ? responsaveis.find((r) => r.id === form.id) : undefined;
  const nomeGrau = (nr?: number) => (nr ? grauParentescoOptions.find((o) => o.value === String(nr))?.label ?? '' : '');

  /** Valor usado para ordenar um responsável pela coluna informada. */
  function valorResp(r: AlunoResponsavel, coluna: string): string | number {
    if (coluna === 'nr_seq_pessoa_fisica') return nomePessoaFisica(r.nr_seq_pessoa_fisica);
    if (coluna === 'nr_seq_grau_parentesco') return nomeGrau(r.nr_seq_grau_parentesco);
    if (coluna === 'nr_sequencia') return r.nr_sequencia ?? 0;
    const dados = r as unknown as Record<string, unknown>;
    return String(dados[coluna] ?? '');
  }

  function comparar(a: string | number, b: string | number): number {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b), 'pt-BR');
  }

  const responsaveisOrdenados = useMemo(() => {
    const coluna = sortResp.coluna ?? 'nr_sequencia';
    const asc = sortResp.coluna ? sortResp.asc : false; // padrão: mais recente primeiro
    return [...responsaveis].sort((a, b) => {
      const cmp = comparar(valorResp(a, coluna), valorResp(b, coluna));
      return asc ? cmp : -cmp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responsaveis, sortResp, nomePessoaFisica, grauParentescoOptions]);

  const paginacaoResp = usePagination(responsaveisOrdenados.length, `aluno-responsaveis:${aluno.id ?? ''}`);

  const colunasResp: ResizableTableColumn<AlunoResponsavel>[] = useMemo(() => [
    { key: 'nr_sequencia', label: '#', cellClassName: 'text-right', render: (r) => <span className="text-sm">{r.nr_sequencia}</span> },
    { key: 'nr_seq_pessoa_fisica', label: 'Pessoa física', width: 260, render: (r) => <span className="text-sm text-black">{nomePessoaFisica(r.nr_seq_pessoa_fisica)}</span> },
    { key: 'nr_seq_grau_parentesco', label: 'Grau de parentesco', width: 180, render: (r) => <span className="text-sm">{nomeGrau(r.nr_seq_grau_parentesco)}</span> },
    { key: 'dt_criacao', label: 'Criação', render: (r) => <span className="text-sm">{formatDate(String(r.dt_criacao ?? ''))}</span> },
    { key: 'dt_alteracao', label: 'Alteração', render: (r) => <span className="text-sm">{formatDate(String(r.dt_alteracao ?? ''))}</span> },
    { key: 'ds_usuario_criacao', label: 'Usuário criação', render: (r) => <span className="text-sm">{r.ds_usuario_criacao ?? ''}</span> },
    { key: 'ds_usuario_alteracao', label: 'Usuário alteração', render: (r) => <span className="text-sm">{r.ds_usuario_alteracao ?? ''}</span> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [nomePessoaFisica, grauParentescoOptions]);

  function trocarAba(nova: Aba) {
    setMenu(null);
    setSelecionadoId(null);
    setAba(nova);
  }

  function abrirResponsavel(r: AlunoResponsavel) {
    setSelecionadoId(r.id ?? null);
    setErros([]);
    setForm({
      id: r.id,
      nr_seq_pessoa_fisica: r.nr_seq_pessoa_fisica ? String(r.nr_seq_pessoa_fisica) : '',
      nr_seq_grau_parentesco: r.nr_seq_grau_parentesco ? String(r.nr_seq_grau_parentesco) : '',
    });
  }

  function novoResponsavel() {
    setErros([]);
    setForm({ nr_seq_pessoa_fisica: '', nr_seq_grau_parentesco: '' });
  }

  function fecharFormulario() {
    setErros([]);
    setForm(null);
  }

  function pedirExclusao(r: AlunoResponsavel) {
    confirmar('Excluir registro', `Deseja mesmo excluir o responsável ${r.nr_sequencia ?? ''}?`, async () => {
      if (!r.id) return;
      try {
        await excluirAlunoResponsavel(r.id);
        if (form?.id === r.id) fecharFormulario();
        onMessage('Excluído com sucesso!');
      } catch {
        onMessage('Erro ao excluir.');
      }
    });
  }

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form || salvando) return;
    const nrPessoa = Number(form.nr_seq_pessoa_fisica) || 0;
    const nrGrau = Number(form.nr_seq_grau_parentesco) || 0;
    // Pessoa física é sempre obrigatória; o grau de parentesco segue a regra do perfil.
    const faltando = [
      ...(!nrPessoa ? ['nr_seq_pessoa_fisica'] : []),
      ...(statusGrau === 'O' && !nrGrau ? ['nr_seq_grau_parentesco'] : []),
    ];
    if (faltando.length > 0) {
      setErros(faltando);
      onMessage('Preencha os campos obrigatórios.');
      return;
    }
    if (!pessoasFisicas.some((p) => p.nr_sequencia === nrPessoa)) {
      setErros(['nr_seq_pessoa_fisica']);
      onMessage('Pessoa física não encontrada.');
      return;
    }
    if (nrPessoa === aluno.nr_seq_pessoa_fisica) {
      setErros(['nr_seq_pessoa_fisica']);
      onMessage('O aluno não pode ser responsável por ele mesmo.');
      return;
    }
    if (responsaveis.some((r) => r.nr_seq_pessoa_fisica === nrPessoa && r.id !== form.id)) {
      setErros(['nr_seq_pessoa_fisica']);
      onMessage('Esta pessoa física já é responsável pelo aluno.');
      return;
    }
    setErros([]);
    setSalvando(true);
    try {
      const dados = { nr_seq_pessoa_fisica: nrPessoa, nr_seq_grau_parentesco: nrGrau || undefined };
      if (form.id) {
        await atualizarAlunoResponsavel(form.id, dados);
        onMessage('Registro alterado com sucesso!');
      } else {
        const id = await criarAlunoResponsavel({ nr_seq_aluno: aluno.nr_sequencia, ...dados });
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
  const corTexto = darkMode ? '#fff' : '#000';
  const bordaCaixa = darkMode ? '#2c2c31 #38383e #38383e #2c2c31' : '#999 #ccc #ccc #999';
  const sublinhar = {
    onMouseEnter: (e: ReactMouseEvent<HTMLElement>) => { e.currentTarget.style.borderBottomColor = corTexto; },
    onMouseLeave: (e: ReactMouseEvent<HTMLElement>) => { e.currentTarget.style.borderBottomColor = 'transparent'; },
  };
  const classeSeta = (ativa: boolean) =>
    `inline-flex items-center justify-center rounded-[3px] border border-slate-300 bg-[#ddd] px-[5px] py-[5px] text-sm text-black cursor-pointer ${ativa ? 'hover:bg-slate-300' : 'opacity-40'}`;
  const estiloAba = (a: Aba) => ({ borderBottom: `1px solid ${aba === a ? corTexto : 'transparent'}`, color: corTexto });
  const nrPessoaForm = Number(form?.nr_seq_pessoa_fisica || 0);
  const erroPessoa = erros.includes('nr_seq_pessoa_fisica');
  const erroGrau = erros.includes('nr_seq_grau_parentesco');

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* ── Barra superior: dropdown pai, setas, breadcrumb, abas e Adicionar ── */}
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
          <div className="flex items-center text-xs ml-2 whitespace-nowrap overflow-hidden px-2 py-1" style={{ color: corTexto, border: '1px solid', borderColor: bordaCaixa }}>
            <span className="cursor-pointer" style={{ borderBottom: '1px solid transparent' }} onClick={onVoltar} {...sublinhar}>
              <span style={{ color: corBreadcrumb }}>Aluno: {aluno.nr_sequencia}</span>
              <span className="ml-1" style={{ color: corBreadcrumb }}>{nomeAluno}</span>
            </span>
            {form && (
              <>
                <span className="mx-1">&gt;</span>
                <span className="cursor-pointer" style={{ borderBottom: '1px solid transparent' }} onClick={fecharFormulario} {...sublinhar}>
                  <span style={{ color: corBreadcrumb }}>Responsável{responsavelAberto ? `: ${responsavelAberto.nr_sequencia}` : ''}</span>
                  {responsavelAberto && <span className="ml-1" style={{ color: corBreadcrumb }}>{nomePessoaFisica(responsavelAberto.nr_seq_pessoa_fisica)}</span>}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!form && (
            <div className="flex items-center text-xs whitespace-nowrap overflow-hidden px-2 py-1 gap-2" style={{ border: '1px solid', borderColor: bordaCaixa, color: corTexto }}>
              <button type="button" onClick={() => trocarAba('responsaveis')} className="text-xs font-medium cursor-pointer transition" style={estiloAba('responsaveis')}>Responsáveis</button>
            </div>
          )}
          {!form && (
            <button
              type="button"
              onClick={novoResponsavel}
              className="inline-flex items-center rounded-[3px] border border-transparent bg-transparent px-4 py-2.5 text-sm font-normal text-[#066fc5] transition cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2 active:outline active:outline-1 active:outline-[#066fc5] active:outline-offset-2"
            >
              Adicionar
            </button>
          )}
        </div>
      </div>

      {form ? (
        /* ── Formulário do responsável ── */
        <form ref={formRef} onSubmit={salvar} className="mt-6 flex-1 flex flex-col min-h-0">
          <div className="grid gap-[15px] sm:grid-cols-12 pt-2">
            <div className="sm:col-span-1">
              <RotuloCampo texto="Sequência" colecao={COLECAO_ALUNO_RESPONSAVEL} campo="nr_sequencia" />
              <input disabled value={String(responsavelAberto?.nr_sequencia ?? '')} className="w-full rounded-[3px] border border-slate-300 px-2 py-1.5 text-sm transition focus:outline-none" />
            </div>
            <div className="sm:col-span-7">
              <RotuloCampo texto="Pessoa física" colecao={COLECAO_ALUNO_RESPONSAVEL} campo="nr_seq_pessoa_fisica" prefixo={<RequiredAsterisk />} />
              <div className="flex items-center gap-2 flex-nowrap">
                <div style={{ width: 110 }}>
                  <input
                    inputMode="numeric"
                    maxLength={10}
                    disabled={statusPessoa === 'D'}
                    className={`w-full rounded-[3px] border ${erroPessoa ? 'border-red-500' : 'border-slate-300'} bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                    value={form.nr_seq_pessoa_fisica}
                    onChange={(e) => setForm({ ...form, nr_seq_pessoa_fisica: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  />
                </div>
                <div className="relative flex-1 min-w-0">
                  <input readOnly className={`w-full rounded-[3px] border ${erroPessoa ? 'border-red-500' : 'border-slate-300'} bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none`} value={nomePessoaFisica(nrPessoaForm)} />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    {nrPessoaForm > 0 && nomePessoaFisica(nrPessoaForm) && (
                      <button type="button" onClick={() => onViewPessoaFisica(nrPessoaForm)} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Visualizar pessoa física">
                        <ViewIcon size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={statusPessoa === 'D'}
                      onClick={() => onOpenPessoaFisicaLookup((nr) => setForm((atual) => (atual ? { ...atual, nr_seq_pessoa_fisica: String(nr) } : atual)))}
                      className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup disabled:cursor-default disabled:opacity-40"
                      aria-label="Localizar pessoa física"
                    >
                      <SearchIcon size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="sm:col-span-4">
              <RotuloCampo
                texto="Grau de parentesco"
                colecao={COLECAO_ALUNO_RESPONSAVEL}
                campo="nr_seq_grau_parentesco"
                prefixo={statusGrau === 'O' ? <RequiredAsterisk /> : undefined}
              />
              <Select
                value={form.nr_seq_grau_parentesco}
                onChange={(v) => setForm({ ...form, nr_seq_grau_parentesco: v })}
                options={grauParentescoOptions}
                disabled={statusGrau === 'D'}
                error={erroGrau}
              />
            </div>
          </div>

          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between gap-3">
              {responsavelAberto && (
                <div className="text-[13px] text-slate-500">
                  {([
                    ['Criado', responsavelAberto.ds_usuario_criacao, responsavelAberto.dt_criacao],
                    ['Alterado', responsavelAberto.ds_usuario_alteracao, responsavelAberto.dt_alteracao],
                  ] as const).map(([acao, autor, data], i) => (
                    <div key={acao} className={`relative group flex items-center gap-2 ${i > 0 ? 'mt-1' : ''}`}>
                      <span>{acao} por {resolverNomeAutor(autor ?? '') || '-'} em {data ? formatDate(data) : '-'}</span>
                      <button
                        type="button"
                        aria-hidden="true"
                        onClick={() => responsavelAberto.id && onOpenAudit?.(responsavelAberto.id)}
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
                <button type="button" onClick={fecharFormulario} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={salvando} className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60" style={{ backgroundColor: '#003056', borderBottomColor: '#000' }}>
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* ── Lista de responsáveis ── */
        <div className="mt-6 flex-1 flex flex-col min-h-0">
          {carregando && <LoadingModal open message="Carregando..." />}
          {!carregando && responsaveis.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
              <p className="mt-4 font-medium text-slate-500">Nenhum registro encontrado.</p>
              <p className="mt-1 text-sm text-slate-500">Clique em &quot;Adicionar&quot; para cadastrar um responsável.</p>
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-auto">
                <ResizableTable
                  key="responsaveis"
                  columns={colunasResp}
                  rows={paginacaoResp.slice(responsaveisOrdenados)}
                  rowKey={(r) => r.id ?? String(r.nr_sequencia)}
                  sortColumn={sortResp.coluna}
                  sortAsc={sortResp.asc}
                  onSortChange={(key) => setSortResp((atual) => proximaOrdenacao(atual, key))}
                  onRowClick={(r) => setSelecionadoId((atual) => (atual === r.id ? null : r.id ?? null))}
                  onRowDoubleClick={abrirResponsavel}
                  onRowContextMenu={(r, e) => {
                    e.preventDefault();
                    setSelecionadoId(r.id ?? null);
                    setMenu({ id: r.id ?? '', x: e.clientX, y: e.clientY });
                  }}
                  rowClassName={(r) => (selecionadoId === r.id ? 'row-selected' : '')}
                  {...colunasResponsaveis}
                />
              </div>
              <PaginationFooter
                totalRecords={responsaveisOrdenados.length}
                currentPage={paginacaoResp.currentPage}
                pageSize={paginacaoResp.pageSize}
                onPageChange={paginacaoResp.setCurrentPage}
                onPageSizeChange={paginacaoResp.setPageSize}
              />
            </>
          )}
        </div>
      )}

      {menu && (() => {
        const itemClasse = "w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer";
        const itemEstilo = { padding: '0.2rem 0.4rem' };
        const resp = responsaveis.find((r) => r.id === menu.id);
        if (!resp) return null;
        return (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} onContextMenu={(e) => { e.preventDefault(); setMenu(null); }} />
            <div className="fixed z-50 min-w-[120px] border border-slate-200 bg-white p-[3px] flex flex-col gap-[3px]" style={{ left: menu.x, top: menu.y, boxShadow: '0 4px 10px rgba(0,0,0,0.18)' }}>
              <button type="button" className={itemClasse} style={itemEstilo} onClick={() => { abrirResponsavel(resp); setMenu(null); }}>Ver</button>
              <button type="button" className={itemClasse} style={itemEstilo} onClick={() => { setMenu(null); pedirExclusao(resp); }}>Excluir</button>
            </div>
          </>
        );
      })()}
    </div>
  );
}
