"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { Ativo } from "@/types/ativo";
import type { AtivoResponsavel } from "@/types/ativoResponsavel";
import type { Manutencao } from "@/types/manutencao";
import type { AuditAutor } from "@/services/auditService";
import type { CampoStatus } from "@/lib/camposConfigUtils";
import { COLECAO_ATIVO_RESPONSAVEL } from "@/lib/ativoResponsavelUtils";
import { formatCellValue as formatManutencao } from "@/lib/manutencaoUtils";
import { formatDate } from "@/lib/pessoaFisicaUtils";
import { atualizarAtivoResponsavel, criarAtivoResponsavel, excluirAtivoResponsavel, observarResponsaveisDoAtivo } from "@/services/ativoResponsavelService";
import { fetchAuditByDocumentId, type AuditEntry } from "@/services/auditService";
import Select from "@/components/ui/Select";
import ResizableTable, { proximaOrdenacao, type ConfigColunasTabela, type ResizableTableColumn } from "@/components/ui/ResizableTable";
import PaginationFooter, { usePagination } from "@/components/ui/PaginationFooter";
import RotuloCampo from "@/components/ui/RotuloCampo";
import RequiredAsterisk from "@/components/ui/RequiredAsterisk";
import ViewIcon from "@/components/ui/ViewIcon";
import SearchIcon from "@/components/ui/SearchIcon";
import { elementoVisivel } from "@/lib/visibilidade";

type Aba = 'responsaveis' | 'manutencoes' | 'transferencias';

/** Troca de localização do ativo, montada a partir da auditoria do ativo. */
interface Transferencia {
  /** Ordem cronológica (1 = primeira localização registrada). */
  nr_sequencia: number;
  dt_transferencia: string;
  nr_seq_origem?: number;
  nr_seq_destino?: number;
  ds_usuario: string;
  /** Motivo informado no modal "Transferir" (vazio nas trocas feitas antes dele). */
  ds_motivo: string;
}

/** Timestamp da auditoria (ISO ou objeto com seconds/toDate) → ISO. */
function timestampIso(valor: unknown): string {
  if (!valor) return '';
  if (typeof valor === 'string') return valor;
  const t = valor as { toDate?: () => Date; seconds?: number };
  if (typeof t.toDate === 'function') return t.toDate().toISOString();
  if (typeof t.seconds === 'number') return new Date(t.seconds * 1000).toISOString();
  return String(valor);
}

/**
 * Percorre a auditoria do ativo (cada log guarda o estado completo) do mais
 * antigo ao mais novo e registra cada mudança de localização.
 */
function montarTransferencias(logs: AuditEntry[]): Transferencia[] {
  const ordenados = [...logs]
    .map((l) => ({ ...l, iso: timestampIso(l.timestamp) }))
    .sort((a, b) => a.iso.localeCompare(b.iso));
  const lista: Transferencia[] = [];
  let atual: number | undefined;
  for (const log of ordenados) {
    const detalhes = (log.detalhes ?? {}) as Record<string, unknown>;
    const bruto = detalhes.nr_seq_localizacao;
    const destino = bruto === undefined || bruto === null || bruto === '' ? undefined : Number(bruto);
    if (destino === atual) continue;
    lista.push({
      nr_sequencia: lista.length + 1,
      dt_transferencia: log.iso,
      nr_seq_origem: atual,
      nr_seq_destino: destino,
      ds_usuario: log.usuarioNome ?? '',
      ds_motivo: String(detalhes.ds_motivo_transferencia ?? ''),
    });
    atual = destino;
  }
  return lista;
}

interface FormResponsavel {
  /** Documento em edição; ausente = novo responsável. */
  id?: string;
  nr_seq_colaborador: string;
}

interface AtivoDetalheViewProps {
  ativo: Ativo;
  selectOptions: { value: string; label: string }[];
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  allowedSubmodulos?: string[];
  /** Navegação entre os ativos (setas). */
  onPrevRecord: () => void;
  onNextRecord: () => void;
  hasPrevRecord: boolean;
  hasNextRecord: boolean;
  /** Volta para a lista de ativos (breadcrumb). */
  onVoltar: () => void;
  auditAutor?: AuditAutor;
  /** Regras de campos do perfil ativo (coleção pat_ativo_responsavel). */
  campoRegras?: Record<string, CampoStatus>;
  /** Abre o histórico de auditoria de um responsável. */
  onOpenAudit?: (responsavelId: string) => void;
  /** Abre o histórico de auditoria do próprio ativo (de onde vêm as transferências). */
  onOpenAuditAtivo?: () => void;
  resolverNomeAutor?: (nome: string) => string;
  onMessage: (mensagem: string) => void;
  onSavingChange?: (saving: boolean) => void;
  /** Confirmação antes de excluir (modal padrão do sistema). */
  confirmar: (titulo: string, mensagem: string, acao: () => void) => void;
  /** Colaboradores cadastrados (validação do campo e status: Desligado fica riscado na lista). */
  colaboradores: { nr_sequencia: number; ie_status?: string }[];
  /** Nome do colaborador: nome da pessoa física ou razão social da pessoa jurídica. */
  nomeColaborador: (nrSequencia?: number) => string;
  /** Abre o lookup de Pessoa Física; chama aoSelecionar com a sequência escolhida. */
  /** Abre o lookup de Colaborador; chama aoSelecionar com a sequência escolhida. */
  onOpenColaboradorLookup: (aoSelecionar: (nrSequencia: number) => void) => void;
  onViewColaborador: (nrSequencia: number) => void;
  /** Manutenções do sistema (a tela mostra só as deste ativo). */
  manutencoes: Manutencao[];
  /** Nome do prestador de serviço de uma manutenção. */
  nomePrestador: (nrSequencia?: number) => string;
  onViewManutencao: (manutencao: Manutencao) => void;
  coresStatusManutencao?: Record<string, string>;
  /** Localizações (nome exibido nas transferências). */
  localizacoes: { nr_sequencia: number; ds_localizacao?: string }[];
  colunasResponsaveis?: ConfigColunasTabela;
  colunasManutencoes?: ConfigColunasTabela;
  colunasTransferencias?: ConfigColunasTabela;
  darkMode?: boolean;
}

/** Data ISO/DD/MM/AAAA → número (para ordenar). */
function chaveData(valor?: string): number {
  if (!valor) return 0;
  const br = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(valor);
  if (br) return Number(`${br[3]}${br[2]}${br[1]}`);
  const t = new Date(valor).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Responsáveis e manutenções de um ativo, no mesmo molde das Bandas/Parâmetros
 * de um relatório: duplo clique no ativo abre esta tela, com o dropdown pai,
 * as setas (navegam entre os ativos), o breadcrumb "Ativo: N ..." (clicando,
 * volta para a lista) e as abas Responsáveis / Manutenções.
 * Manutenções é somente leitura: lista as manutenções feitas no ativo.
 */
export default function AtivoDetalheView({
  ativo,
  selectOptions,
  manageSelection,
  onManageSelectionChange,
  allowedSubmodulos = ['ativos'],
  onPrevRecord,
  onNextRecord,
  hasPrevRecord,
  hasNextRecord,
  onVoltar,
  auditAutor,
  campoRegras = {},
  onOpenAudit,
  onOpenAuditAtivo,
  resolverNomeAutor = (nome) => nome,
  onMessage,
  onSavingChange,
  confirmar,
  colaboradores,
  nomeColaborador,
  onOpenColaboradorLookup,
  onViewColaborador,
  manutencoes,
  nomePrestador,
  onViewManutencao,
  coresStatusManutencao = {},
  localizacoes,
  colunasResponsaveis,
  colunasManutencoes,
  colunasTransferencias,
  darkMode = false,
}: AtivoDetalheViewProps) {
  const [aba, setAba] = useState<Aba>('responsaveis');
  const [responsaveis, setResponsaveis] = useState<AtivoResponsavel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  // Ordenação por aba (três cliques: crescente → decrescente → padrão).
  // Padrão (coluna null): responsáveis pela sequência; manutenções e
  // transferências da mais recente para a mais antiga.
  const [sortResp, setSortResp] = useState<{ coluna: string | null; asc: boolean }>({ coluna: null, asc: true });
  const [sortManut, setSortManut] = useState<{ coluna: string | null; asc: boolean }>({ coluna: null, asc: true });
  const [sortTransf, setSortTransf] = useState<{ coluna: string | null; asc: boolean }>({ coluna: null, asc: true });
  /** Legenda da bolinha de status (ao passar o mouse), como em Patrimônio > Manutenções. */
  const [legendaStatus, setLegendaStatus] = useState<{ texto: string; x: number; y: number } | null>(null);
  /** Auditoria do ativo (null = ainda não carregada). Carrega ao abrir a aba. */
  const [logsAtivo, setLogsAtivo] = useState<AuditEntry[] | null>(null);
  /** Formulário aberto (null = lista de responsáveis). */
  const [form, setForm] = useState<FormResponsavel | null>(null);
  /** Transferência aberta em "Ver" (somente leitura), pela sequência; null = lista. */
  const [transfAberta, setTransfAberta] = useState<number | null>(null);
  const [erro, setErro] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Responsáveis do ativo em tempo real.
  useEffect(() => {
    setCarregando(true);
    return observarResponsaveisDoAtivo(
      ativo.nr_sequencia,
      (lista) => { setResponsaveis(lista); setCarregando(false); },
      () => { setCarregando(false); onMessage('Erro ao carregar registros.'); }
    );
    // Recarrega só ao trocar de ativo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo.nr_sequencia]);

  // Transferências: auditoria do ativo, lida só quando a aba é aberta.
  useEffect(() => {
    if (aba !== 'transferencias' || logsAtivo !== null || !ativo.id) return;
    let cancelado = false;
    fetchAuditByDocumentId('pat_ativo', ativo.id)
      .then((logs) => { if (!cancelado) setLogsAtivo(logs); })
      .catch(() => {
        if (cancelado) return;
        setLogsAtivo([]);
        onMessage('Erro ao carregar registros.');
      });
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba, logsAtivo, ativo.id]);

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

  const statusColaborador: CampoStatus = campoRegras['nr_seq_colaborador'] ?? 'N';
  const responsavelAberto = form?.id ? responsaveis.find((r) => r.id === form.id) : undefined;
  const manutencoesDoAtivo = useMemo(
    () => manutencoes.filter((m) => m.nr_seq_ativo === ativo.nr_sequencia),
    [manutencoes, ativo.nr_sequencia]
  );

  /** Valor usado para ordenar um responsável pela coluna informada. */
  function valorResp(r: AtivoResponsavel, coluna: string): string | number {
    if (coluna === 'nr_seq_colaborador') return nomeColaborador(r.nr_seq_colaborador);
    if (coluna === 'nr_sequencia') return r.nr_sequencia ?? 0;
    const dados = r as unknown as Record<string, unknown>;
    return String(dados[coluna] ?? '');
  }

  /** Valor usado para ordenar uma manutenção pela coluna informada. */
  function valorManut(m: Manutencao, coluna: string): string | number {
    if (coluna === 'nr_seq_prestador_servico') return nomePrestador(m.nr_seq_prestador_servico);
    if (coluna === 'dt_envio' || coluna === 'dt_termino') return chaveData(coluna === 'dt_envio' ? m.dt_envio : m.dt_termino);
    if (coluna === 'vl_total') return Number(String(m.vl_total ?? '').replace(/\./g, '').replace(',', '.')) || 0;
    const dados = m as unknown as Record<string, unknown>;
    const v = dados[coluna];
    return typeof v === 'number' ? v : String(v ?? '');
  }

  function comparar(a: string | number, b: string | number): number {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b), 'pt-BR');
  }

  const responsaveisOrdenados = useMemo(() => {
    const coluna = sortResp.coluna ?? 'nr_sequencia';
    const asc = sortResp.coluna ? sortResp.asc : true;
    return [...responsaveis].sort((a, b) => {
      const cmp = comparar(valorResp(a, coluna), valorResp(b, coluna));
      return asc ? cmp : -cmp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responsaveis, sortResp, nomeColaborador]);

  const manutencoesOrdenadas = useMemo(() => {
    const coluna = sortManut.coluna ?? 'nr_sequencia';
    const asc = sortManut.coluna ? sortManut.asc : false;
    return [...manutencoesDoAtivo].sort((a, b) => {
      const cmp = comparar(valorManut(a, coluna), valorManut(b, coluna));
      return asc ? cmp : -cmp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manutencoesDoAtivo, sortManut]);

  const nomeLocalizacao = (nr?: number) => (nr ? localizacoes.find((l) => l.nr_sequencia === nr)?.ds_localizacao ?? '' : '');
  const transferencias = useMemo(() => montarTransferencias(logsAtivo ?? []), [logsAtivo]);

  /** Valor usado para ordenar uma transferência pela coluna informada. */
  function valorTransf(t: Transferencia, coluna: string): string | number {
    if (coluna === 'nr_sequencia') return t.nr_sequencia;
    if (coluna === 'dt_transferencia') return t.dt_transferencia;
    if (coluna === 'ds_origem') return nomeLocalizacao(t.nr_seq_origem);
    if (coluna === 'ds_destino') return nomeLocalizacao(t.nr_seq_destino);
    if (coluna === 'ds_usuario') return t.ds_usuario;
    return '';
  }

  const transferenciasOrdenadas = useMemo(() => {
    const coluna = sortTransf.coluna ?? 'nr_sequencia';
    const asc = sortTransf.coluna ? sortTransf.asc : false;
    return [...transferencias].sort((a, b) => {
      const cmp = comparar(valorTransf(a, coluna), valorTransf(b, coluna));
      return asc ? cmp : -cmp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transferencias, sortTransf, localizacoes]);

  const transferenciaAberta = transfAberta !== null ? transferencias.find((t) => t.nr_sequencia === transfAberta) ?? null : null;
  const classeLeitura = 'w-full rounded-[3px] border border-slate-300 px-2 py-1.5 text-sm transition focus:outline-none';

  const paginacaoResp = usePagination(responsaveisOrdenados.length, `ativo-responsaveis:${ativo.id ?? ''}`);
  const paginacaoManut = usePagination(manutencoesOrdenadas.length, `ativo-manutencoes:${ativo.id ?? ''}`);
  const paginacaoTransf = usePagination(transferenciasOrdenadas.length, `ativo-transferencias:${ativo.id ?? ''}`);

  const colunasTransf: ResizableTableColumn<Transferencia>[] = useMemo(() => {
    return [
      { key: 'nr_sequencia', label: '#', cellClassName: 'text-right', render: (t) => <span className="text-sm">{t.nr_sequencia}</span> },
      { key: 'dt_transferencia', label: 'Data', render: (t) => <span className="text-sm">{formatDate(t.dt_transferencia)}</span> },
      { key: 'ds_origem', label: 'Origem', width: 220, render: (t) => <span className="text-sm text-black">{nomeLocalizacao(t.nr_seq_origem)}</span> },
      { key: 'ds_destino', label: 'Destino', width: 220, render: (t) => <span className="text-sm text-black">{nomeLocalizacao(t.nr_seq_destino)}</span> },
      { key: 'ds_usuario', label: 'Usuário', render: (t) => <span className="text-sm">{t.ds_usuario}</span> },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localizacoes]);

  const colunasResp: ResizableTableColumn<AtivoResponsavel>[] = useMemo(() => [
    { key: 'nr_sequencia', label: '#', cellClassName: 'text-right', render: (r) => <span className="text-sm">{r.nr_sequencia}</span> },
    { key: 'nr_seq_colaborador', label: 'Colaborador', width: 260, render: (r) => <span className="text-sm text-black">{nomeColaborador(r.nr_seq_colaborador)}</span> },
    { key: 'dt_criacao', label: 'Criação', render: (r) => <span className="text-sm">{formatDate(String(r.dt_criacao ?? ''))}</span> },
    { key: 'dt_alteracao', label: 'Alteração', render: (r) => <span className="text-sm">{formatDate(String(r.dt_alteracao ?? ''))}</span> },
    { key: 'ds_usuario_criacao', label: 'Usuário criação', render: (r) => <span className="text-sm">{r.ds_usuario_criacao ?? ''}</span> },
    { key: 'ds_usuario_alteracao', label: 'Usuário alteração', render: (r) => <span className="text-sm">{r.ds_usuario_alteracao ?? ''}</span> },
  ], [nomeColaborador]);

  const colunasManut: ResizableTableColumn<Manutencao>[] = useMemo(() => [
    {
      key: 'ie_status_manutencao', label: 'Status', status: true,
      render: (m) => {
        if (!m.ie_status_manutencao) return null;
        const texto = formatManutencao('ie_status_manutencao', m.ie_status_manutencao);
        return (
          <span className="inline-flex items-center justify-center">
            <span
              aria-label={texto}
              className="inline-block h-[10px] w-[10px] rounded-full cursor-pointer"
              style={{ backgroundColor: coresStatusManutencao[m.ie_status_manutencao] ?? '#999999' }}
              onMouseEnter={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setLegendaStatus({ texto, x: r.left + r.width / 2, y: r.top });
              }}
              onMouseLeave={() => setLegendaStatus(null)}
            />
          </span>
        );
      },
    },
    { key: 'nr_sequencia', label: '#', cellClassName: 'text-right', render: (m) => <span className="text-sm">{m.nr_sequencia}</span> },
    { key: 'nr_seq_prestador_servico', label: 'Prestador de serviço', width: 220, render: (m) => <span className="text-sm text-black">{nomePrestador(m.nr_seq_prestador_servico)}</span> },
    { key: 'dt_envio', label: 'Data de envio', render: (m) => <span className="text-sm">{formatManutencao('dt_envio', m.dt_envio)}</span> },
    { key: 'dt_termino', label: 'Data de término', render: (m) => <span className="text-sm">{formatManutencao('dt_termino', m.dt_termino)}</span> },
    { key: 'vl_total', label: 'Valor total', render: (m) => <span className="text-sm">{formatManutencao('vl_total', m.vl_total)}</span> },
    { key: 'dt_criacao', label: 'Criação', render: (m) => <span className="text-sm">{formatDate(String(m.dt_criacao ?? ''))}</span> },
    { key: 'dt_alteracao', label: 'Alteração', render: (m) => <span className="text-sm">{formatDate(String(m.dt_alteracao ?? ''))}</span> },
    { key: 'ds_usuario_criacao', label: 'Usuário criação', render: (m) => <span className="text-sm">{m.ds_usuario_criacao ?? ''}</span> },
    { key: 'ds_usuario_alteracao', label: 'Usuário alteração', render: (m) => <span className="text-sm">{m.ds_usuario_alteracao ?? ''}</span> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [coresStatusManutencao]);

  function abrirTransferencia(t: Transferencia) {
    setSelecionadoId(String(t.nr_sequencia));
    setTransfAberta(t.nr_sequencia);
  }

  function trocarAba(nova: Aba) {
    setTransfAberta(null);
    setMenu(null);
    setSelecionadoId(null);
    setAba(nova);
  }

  function abrirResponsavel(r: AtivoResponsavel) {
    setSelecionadoId(r.id ?? null);
    setErro(false);
    setForm({ id: r.id, nr_seq_colaborador: r.nr_seq_colaborador ? String(r.nr_seq_colaborador) : '' });
  }

  function novoResponsavel() {
    setErro(false);
    setForm({ nr_seq_colaborador: '' });
  }

  function fecharFormulario() {
    setErro(false);
    setForm(null);
  }

  function pedirExclusao(r: AtivoResponsavel) {
    confirmar('Excluir registro', `Deseja mesmo excluir o responsável ${r.nr_sequencia ?? ''}?`, async () => {
      if (!r.id) return;
      try {
        await excluirAtivoResponsavel(r.id);
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
    const nr = Number(form.nr_seq_colaborador);
    if (!form.nr_seq_colaborador || !nr) {
      setErro(true);
      onMessage('Preencha os campos obrigatórios.');
      return;
    }
    if (!colaboradores.some((c) => c.nr_sequencia === nr)) {
      setErro(true);
      onMessage('Colaborador não encontrado.');
      return;
    }
    if (responsaveis.some((r) => r.nr_seq_colaborador === nr && r.id !== form.id)) {
      setErro(true);
      onMessage('Este colaborador já é responsável pelo ativo.');
      return;
    }
    setErro(false);
    setSalvando(true);
    try {
      if (form.id) {
        await atualizarAtivoResponsavel(form.id, { nr_seq_colaborador: nr }, auditAutor);
        onMessage('Registro alterado com sucesso!');
      } else {
        const id = await criarAtivoResponsavel({ nr_seq_ativo: ativo.nr_sequencia, nr_seq_colaborador: nr }, auditAutor);
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
  const nrForm = Number(form?.nr_seq_colaborador || 0);

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
              <span style={{ color: corBreadcrumb }}>Ativo: {ativo.nr_sequencia}</span>
              <span className="ml-1" style={{ color: corBreadcrumb }}>{ativo.ds_ativo}</span>
            </span>
            {transferenciaAberta && (
              <>
                <span className="mx-1">&gt;</span>
                <span className="cursor-pointer" style={{ borderBottom: '1px solid transparent' }} onClick={() => setTransfAberta(null)} {...sublinhar}>
                  <span style={{ color: corBreadcrumb }}>Transferência: {transferenciaAberta.nr_sequencia}</span>
                </span>
              </>
            )}
            {form && (
              <>
                <span className="mx-1">&gt;</span>
                <span className="cursor-pointer" style={{ borderBottom: '1px solid transparent' }} onClick={fecharFormulario} {...sublinhar}>
                  <span style={{ color: corBreadcrumb }}>Responsável{responsavelAberto ? `: ${responsavelAberto.nr_sequencia}` : ''}</span>
                  {responsavelAberto && <span className="ml-1" style={{ color: corBreadcrumb }}>{nomeColaborador(responsavelAberto.nr_seq_colaborador)}</span>}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!form && !transferenciaAberta && (
            <div className="flex items-center text-xs whitespace-nowrap overflow-hidden px-2 py-1 gap-2" style={{ border: '1px solid', borderColor: bordaCaixa, color: corTexto }}>
              <button type="button" onClick={() => trocarAba('responsaveis')} className="text-xs font-medium cursor-pointer transition" style={estiloAba('responsaveis')}>Responsáveis</button>
              <button type="button" onClick={() => trocarAba('manutencoes')} className="text-xs font-medium cursor-pointer transition" style={estiloAba('manutencoes')}>Manutenções</button>
              <button type="button" onClick={() => trocarAba('transferencias')} className="text-xs font-medium cursor-pointer transition" style={estiloAba('transferencias')}>Transferências</button>
            </div>
          )}
          {/* Manutenções e Transferências são só consulta: o botão fica apagado (mantém o layout). */}
          {!form && !transferenciaAberta && (
            <button
              type="button"
              onClick={aba === 'responsaveis' ? novoResponsavel : undefined}
              disabled={aba !== 'responsaveis'}
              title={aba === 'responsaveis' ? undefined : 'Indisponível nesta aba'}
              className="inline-flex items-center rounded-[3px] border border-transparent bg-transparent px-4 py-2.5 text-sm font-normal text-[#066fc5] transition cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2 active:outline active:outline-1 active:outline-[#066fc5] active:outline-offset-2 disabled:cursor-default disabled:opacity-40 disabled:active:outline-none"
            >
              Adicionar
            </button>
          )}
        </div>
      </div>

      {transferenciaAberta ? (
        /* ── Ver transferência (somente leitura) ── */
        <div className="mt-6 flex-1 flex flex-col min-h-0">
          {/* Grade de 24 colunas: Sequência e Data com a mesma proporção dos formulários (1/12 e 2/12),
              Origem e Destino dividem o resto da linha. */}
          <div className="grid gap-[15px] sm:grid-cols-24 pt-2">
            <div className="sm:col-span-2">
              <RotuloCampo texto="Sequência" colecao="pat_ativo" campo="nr_sequencia" />
              <input disabled value={String(transferenciaAberta.nr_sequencia)} className={classeLeitura} />
            </div>
            <div className="sm:col-span-4">
              <RotuloCampo texto="Data" colecao="pat_ativo" campo="dt_alteracao" />
              <input disabled value={formatDate(transferenciaAberta.dt_transferencia)} className={classeLeitura} />
            </div>
            {/* Origem e Destino na mesma linha de Sequência e Data. */}
            {([['Origem', transferenciaAberta.nr_seq_origem], ['Destino', transferenciaAberta.nr_seq_destino]] as const).map(([rotulo, nr]) => (
              <div key={rotulo} className="sm:col-span-9 min-w-0">
                <RotuloCampo texto={rotulo} colecao="pat_ativo" campo="nr_seq_localizacao" />
                <div className="flex items-center gap-2 flex-nowrap">
                  <div style={{ width: 110 }}>
                    <input disabled value={nr ? String(nr) : ''} className={classeLeitura} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <input disabled value={nomeLocalizacao(nr)} className={classeLeitura} />
                  </div>
                </div>
              </div>
            ))}
            <div className="sm:col-span-24">
              <RotuloCampo texto="Motivo" colecao="pat_ativo" campo="ds_motivo_transferencia" />
              <textarea disabled rows={3} value={transferenciaAberta.ds_motivo} className={`${classeLeitura} resize-none`} />
            </div>
          </div>
          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between gap-3">
              {/* Usuário fica no rodapé, como log (nome da pessoa física, como nos demais "Ver"). */}
              <div className="text-[13px] text-slate-500">
                <div className="relative group flex items-center gap-2">
                  <span>Criado por {resolverNomeAutor(transferenciaAberta.ds_usuario) || '-'} em {transferenciaAberta.dt_transferencia ? formatDate(transferenciaAberta.dt_transferencia) : '-'}</span>
                  <button
                    type="button"
                    aria-hidden="true"
                    onClick={() => onOpenAuditAtivo?.()}
                    className="inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4" />
                      <circle cx="12" cy="16" r="0.5" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 ml-auto">
                <button type="button" onClick={() => setTransfAberta(null)} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' }}>
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : form ? (
        /* ── Formulário do responsável ── */
        <form ref={formRef} onSubmit={salvar} className="mt-6 flex-1 flex flex-col min-h-0">
          <div className="grid gap-[15px] sm:grid-cols-12 pt-2">
            <div className="sm:col-span-1">
              <RotuloCampo texto="Sequência" colecao={COLECAO_ATIVO_RESPONSAVEL} campo="nr_sequencia" />
              <input disabled value={String(responsavelAberto?.nr_sequencia ?? '')} className="w-full rounded-[3px] border border-slate-300 px-2 py-1.5 text-sm transition focus:outline-none" />
            </div>
            <div className="sm:col-span-11">
              <RotuloCampo texto="Colaborador" colecao={COLECAO_ATIVO_RESPONSAVEL} campo="nr_seq_colaborador" prefixo={<RequiredAsterisk />} />
              <div className="flex items-center gap-2 flex-nowrap">
                <div style={{ width: 110 }}>
                  <input
                    inputMode="numeric"
                    maxLength={10}
                    disabled={statusColaborador === 'D'}
                    className={`w-full rounded-[3px] border ${erro ? 'border-red-500' : 'border-slate-300'} bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                    value={form.nr_seq_colaborador}
                    onChange={(e) => setForm({ ...form, nr_seq_colaborador: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  />
                </div>
                <div className="relative flex-1 min-w-0">
                  <input readOnly className={`w-full rounded-[3px] border ${erro ? 'border-red-500' : 'border-slate-300'} bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none`} value={nomeColaborador(nrForm)} />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    {nrForm > 0 && nomeColaborador(nrForm) && (
                      <button type="button" onClick={() => onViewColaborador(nrForm)} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Visualizar colaborador">
                        <ViewIcon size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={statusColaborador === 'D'}
                      onClick={() => onOpenColaboradorLookup((nr) => setForm((atual) => (atual ? { ...atual, nr_seq_colaborador: String(nr) } : atual)))}
                      className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup disabled:cursor-default disabled:opacity-40"
                      aria-label="Localizar colaborador"
                    >
                      <SearchIcon size={16} />
                    </button>
                  </div>
                </div>
              </div>
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
      ) : aba === 'responsaveis' ? (
        /* ── Lista de responsáveis ── */
        <div className="mt-6 flex-1 flex flex-col min-h-0">
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
                  rowClassName={(r) => {
                    // Colaborador desligado: letra apagada e linha atravessando o registro.
                    const desligado = colaboradores.find((c) => c.nr_sequencia === r.nr_seq_colaborador)?.ie_status === 'D';
                    return `${selecionadoId === r.id ? 'row-selected' : ''} ${desligado ? 'registro-desligado' : ''}`;
                  }}
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

      ) : aba === 'transferencias' ? (
        /* ── Transferências de localização (somente leitura, a partir da auditoria) ── */
        <div className="mt-6 flex-1 flex flex-col min-h-0">
          {logsAtivo !== null && transferencias.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
              <p className="mt-4 font-medium text-slate-500">Nenhum registro encontrado.</p>
              <p className="mt-1 text-sm text-slate-500">Este ativo ainda não teve localização registrada.</p>
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-auto">
                <ResizableTable
                  key="transferencias"
                  columns={colunasTransf}
                  rows={paginacaoTransf.slice(transferenciasOrdenadas)}
                  rowKey={(t) => String(t.nr_sequencia)}
                  sortColumn={sortTransf.coluna}
                  sortAsc={sortTransf.asc}
                  onSortChange={(key) => setSortTransf((atual) => proximaOrdenacao(atual, key))}
                  onRowClick={(t) => setSelecionadoId((atual) => (atual === String(t.nr_sequencia) ? null : String(t.nr_sequencia)))}
                  onRowDoubleClick={abrirTransferencia}
                  onRowContextMenu={(t, e) => {
                    e.preventDefault();
                    setSelecionadoId(String(t.nr_sequencia));
                    setMenu({ id: String(t.nr_sequencia), x: e.clientX, y: e.clientY });
                  }}
                  rowClassName={(t) => (selecionadoId === String(t.nr_sequencia) ? 'row-selected' : '')}
                  {...colunasTransferencias}
                />
              </div>
              <PaginationFooter
                totalRecords={transferenciasOrdenadas.length}
                currentPage={paginacaoTransf.currentPage}
                pageSize={paginacaoTransf.pageSize}
                onPageChange={paginacaoTransf.setCurrentPage}
                onPageSizeChange={paginacaoTransf.setPageSize}
              />
            </>
          )}
        </div>
      ) : (
        /* ── Manutenções do ativo (somente leitura) ── */
        <div className="mt-6 flex-1 flex flex-col min-h-0">
          {manutencoesDoAtivo.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
              <p className="mt-4 font-medium text-slate-500">Nenhum registro encontrado.</p>
              <p className="mt-1 text-sm text-slate-500">Este ativo ainda não passou por manutenções.</p>
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-auto">
                <ResizableTable
                  key="manutencoes"
                  columns={colunasManut}
                  rows={paginacaoManut.slice(manutencoesOrdenadas)}
                  rowKey={(m) => m.id ?? String(m.nr_sequencia)}
                  sortColumn={sortManut.coluna}
                  sortAsc={sortManut.asc}
                  onSortChange={(key) => setSortManut((atual) => proximaOrdenacao(atual, key))}
                  onRowClick={(m) => setSelecionadoId((atual) => (atual === m.id ? null : m.id ?? null))}
                  onRowDoubleClick={onViewManutencao}
                  onRowContextMenu={(m, e) => {
                    e.preventDefault();
                    setSelecionadoId(m.id ?? null);
                    setMenu({ id: m.id ?? '', x: e.clientX, y: e.clientY });
                  }}
                  rowClassName={(m) => (selecionadoId === m.id ? 'row-selected' : '')}
                  {...colunasManutencoes}
                />
              </div>
              <PaginationFooter
                totalRecords={manutencoesOrdenadas.length}
                currentPage={paginacaoManut.currentPage}
                pageSize={paginacaoManut.pageSize}
                onPageChange={paginacaoManut.setCurrentPage}
                onPageSizeChange={paginacaoManut.setPageSize}
              />
            </>
          )}
        </div>
      )}

      {menu && (() => {
        const itemClasse = "w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer";
        const itemEstilo = { padding: '0.2rem 0.4rem' };
        const resp = aba === 'responsaveis' ? responsaveis.find((r) => r.id === menu.id) : undefined;
        const manut = aba === 'manutencoes' ? manutencoesDoAtivo.find((m) => m.id === menu.id) : undefined;
        const transf = aba === 'transferencias' ? transferencias.find((t) => String(t.nr_sequencia) === menu.id) : undefined;
        if (!resp && !manut && !transf) return null;
        return (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} onContextMenu={(e) => { e.preventDefault(); setMenu(null); }} />
            <div className="fixed z-50 min-w-[120px] border border-slate-200 bg-white p-[3px] flex flex-col gap-[3px]" style={{ left: menu.x, top: menu.y, boxShadow: '0 4px 10px rgba(0,0,0,0.18)' }}>
              {resp && (
                <>
                  <button type="button" className={itemClasse} style={itemEstilo} onClick={() => { abrirResponsavel(resp); setMenu(null); }}>Ver</button>
                  <button type="button" className={itemClasse} style={itemEstilo} onClick={() => { setMenu(null); pedirExclusao(resp); }}>Excluir</button>
                </>
              )}
              {manut && (
                <button type="button" className={itemClasse} style={itemEstilo} onClick={() => { onViewManutencao(manut); setMenu(null); }}>Ver</button>
              )}
              {transf && (
                <button type="button" className={itemClasse} style={itemEstilo} onClick={() => { abrirTransferencia(transf); setMenu(null); }}>Ver</button>
              )}
            </div>
          </>
        );
      })()}

      {legendaStatus && (
        <span
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg shadow-black/25 whitespace-nowrap"
          style={{ left: legendaStatus.x, top: legendaStatus.y - 8 }}
        >
          {legendaStatus.texto}
          <span className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 h-2 w-2 rotate-45 bg-slate-900" />
        </span>
      )}
    </div>
  );
}
