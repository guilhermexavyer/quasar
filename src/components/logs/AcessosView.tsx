"use client";

import { useEffect, useMemo, useState } from "react";
import Select from "@/components/ui/Select";
import LoadingModal from "@/components/ui/LoadingModal";
import EmptySelectionMessage from "@/components/ui/EmptySelectionMessage";
import SearchIcon from "@/components/ui/SearchIcon";
import ResizableTable, { proximaOrdenacao, type ConfigColunasTabela, type ResizableTableColumn } from "@/components/ui/ResizableTable";
import PaginationFooter, { usePagination } from "@/components/ui/PaginationFooter";
import { LOGS_OPCOES_DROPDOWN } from "@/lib/permissoesUtils";
import { applyDateMask, formatDate } from "@/lib/pessoaFisicaUtils";
import { obterAcessos, rotuloTipoLogout, type LogAcesso } from "@/services/logAcessoService";

/**
 * Filtro de Logs > Acessos. Pessoa física pela sequência (lookup); datas em
 * DD/MM/AAAA; tipo: "" (todos), M, A ou "sem" (sem logout registrado).
 */
export interface FiltroAcessos {
  nr_sequencia: string;
  nr_seq_pessoa_fisica: string;
  ds_usuario: string;
  dt_login_inicio: string;
  dt_login_fim: string;
  dt_logout_inicio: string;
  dt_logout_fim: string;
  ie_tipo_logout: string;
}

export const FILTRO_ACESSOS_VAZIO: FiltroAcessos = {
  nr_sequencia: "",
  nr_seq_pessoa_fisica: "",
  ds_usuario: "",
  dt_login_inicio: "",
  dt_login_fim: "",
  dt_logout_inicio: "",
  dt_logout_fim: "",
  ie_tipo_logout: "",
};

const OPCOES_TIPO_LOGOUT = [
  { value: "M", label: "Manual" },
  { value: "A", label: "Automático" },
  { value: "sem", label: "Sem logout registrado" },
];

/** "DD/MM/AAAA" → AAAAMMDD (número), ou null se incompleta/inválida. */
function chaveDataFiltro(texto: string): number | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!m) return null;
  return Number(`${m[3]}${m[2]}${m[1]}`);
}

/** Instante ISO → AAAAMMDD no fuso do navegador (a mesma data exibida na lista). */
function chaveDataIso(iso: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function dentroDoPeriodo(iso: string, inicio: string, fim: string): boolean {
  const de = chaveDataFiltro(inicio);
  const ate = chaveDataFiltro(fim);
  if (de === null && ate === null) return true;
  const valor = chaveDataIso(iso);
  if (valor === null) return false;
  return (de === null || valor >= de) && (ate === null || valor <= ate);
}

function contem(texto: string, busca: string): boolean {
  const b = busca.trim().toLocaleLowerCase("pt-BR");
  return !b || texto.toLocaleLowerCase("pt-BR").includes(b);
}

/** Completa um filtro guardado em formato antigo (campos ausentes ficam vazios). */
export function normalizarFiltroAcessos(f: Partial<FiltroAcessos> | null | undefined): FiltroAcessos {
  const out = { ...FILTRO_ACESSOS_VAZIO };
  for (const chave of Object.keys(out) as (keyof FiltroAcessos)[]) {
    const valor = f?.[chave];
    out[chave] = typeof valor === "string" ? valor : "";
  }
  return out;
}

export function filtrarAcessos(lista: LogAcesso[], filtro: FiltroAcessos): LogAcesso[] {
  const f = normalizarFiltroAcessos(filtro);
  return lista.filter((a) => {
    if (f.nr_sequencia.trim() && String(a.nr_sequencia) !== f.nr_sequencia.trim()) return false;
    if (f.nr_seq_pessoa_fisica.trim() && String(a.nr_seq_pessoa_fisica ?? "") !== f.nr_seq_pessoa_fisica.trim()) return false;
    if (!contem(a.ds_usuario, f.ds_usuario)) return false;
    if (!dentroDoPeriodo(a.dt_login, f.dt_login_inicio, f.dt_login_fim)) return false;
    if (!dentroDoPeriodo(a.dt_logout, f.dt_logout_inicio, f.dt_logout_fim)) return false;
    if (f.ie_tipo_logout === "sem" && a.ie_tipo_logout) return false;
    if ((f.ie_tipo_logout === "M" || f.ie_tipo_logout === "A") && a.ie_tipo_logout !== f.ie_tipo_logout) return false;
    return true;
  });
}

function filtroAtivo(f: FiltroAcessos): boolean {
  return Object.values(normalizarFiltroAcessos(f)).some((v) => v.trim() !== "");
}

/** Logs sem opção escolhida no dropdown PAI (como as demais funções ao abrir). */
export function LogsSemSelecaoView({
  manageSelection,
  onManageSelectionChange,
  allowedSubmodulos = ["acessos", "exclusoes"],
}: {
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  allowedSubmodulos?: string[];
}) {
  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      <div className="flex min-h-[42px] items-center gap-2">
        <Select
          value={manageSelection}
          onChange={onManageSelectionChange}
          options={LOGS_OPCOES_DROPDOWN.filter((o) => allowedSubmodulos.includes(o.value))}
          showPlaceholder={!manageSelection}
          className="!w-[180px]"
        />
      </div>
      <div className="bg-white flex-1 flex flex-col min-h-0 overflow-hidden">
        <EmptySelectionMessage />
      </div>
    </div>
  );
}

interface AcessosViewProps {
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  allowedSubmodulos?: string[];
  /** Filtro aplicado (mantido pela página para sobreviver à troca de opção). */
  filtro: FiltroAcessos;
  onFiltroChange: (filtro: FiltroAcessos) => void;
  onMessage?: (mensagem: string) => void;
  /** Ordem e largura das colunas salvas no usuário. */
  colunas?: ConfigColunasTabela;
  /** Nome da pessoa física pela sequência (campo do filtro). */
  nomePessoaFisica: (nr: number) => string;
  /** Abre o lookup "Localizar pessoa física"; devolve a sequência escolhida. */
  onOpenPessoaFisicaLookup: (aoSelecionar: (nrSequencia: number) => void) => void;
}

/**
 * Logs > Acessos: os logins de cada usuário (pessoa física, usuário, login,
 * logout e se o logout foi manual ou automático). Somente consulta.
 */
export default function AcessosView({
  manageSelection,
  onManageSelectionChange,
  allowedSubmodulos = ["acessos"],
  filtro,
  onFiltroChange,
  onMessage,
  colunas,
  nomePessoaFisica,
  onOpenPessoaFisicaLookup,
}: AcessosViewProps) {
  const [acessos, setAcessos] = useState<LogAcesso[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ordem, setOrdem] = useState<{ coluna: string | null; asc: boolean }>({ coluna: null, asc: true });
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [rascunho, setRascunho] = useState<FiltroAcessos>(() => normalizarFiltroAcessos(filtro));

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    obterAcessos()
      .then((lista) => { if (!cancelado) setAcessos(lista); })
      .catch(() => { if (!cancelado) onMessage?.("Erro ao carregar registros."); })
      .finally(() => { if (!cancelado) setCarregando(false); });
    return () => { cancelado = true; };
    // Carrega ao abrir a opção.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtrados = useMemo(() => filtrarAcessos(acessos, filtro), [acessos, filtro]);

  const ordenados = useMemo(() => {
    // Padrão: login mais recente primeiro.
    if (!ordem.coluna) return filtrados;
    const coluna = ordem.coluna as keyof LogAcesso;
    const valor = (a: LogAcesso): string | number =>
      coluna === "ie_tipo_logout" ? rotuloTipoLogout(a.ie_tipo_logout) : (a[coluna] as string | number);
    return [...filtrados].sort((a, b) => {
      const va = valor(a);
      const vb = valor(b);
      const cmp = typeof va === "number" && typeof vb === "number"
        ? va - vb
        : String(va ?? "").localeCompare(String(vb ?? ""), "pt-BR", { numeric: true });
      return ordem.asc ? cmp : -cmp;
    });
  }, [filtrados, ordem]);

  const paginacao = usePagination(ordenados.length, "logs-acessos");

  const colunasTabela: ResizableTableColumn<LogAcesso>[] = useMemo(() => [
    { key: "nr_sequencia", label: "#", cellClassName: "text-right", render: (a) => <span className="text-sm">{a.nr_sequencia}</span> },
    { key: "ds_pessoa_fisica", label: "Pessoa física", width: 260, render: (a) => <span className="text-sm text-black">{a.ds_pessoa_fisica}</span> },
    { key: "ds_usuario", label: "Usuário", width: 160, render: (a) => <span className="text-sm">{a.ds_usuario}</span> },
    { key: "dt_login", label: "Login", render: (a) => <span className="text-sm">{formatDate(a.dt_login)}</span> },
    { key: "dt_logout", label: "Logout", render: (a) => <span className="text-sm">{formatDate(a.dt_logout)}</span> },
    { key: "ie_tipo_logout", label: "Tipo de logout", render: (a) => <span className="text-sm">{rotuloTipoLogout(a.ie_tipo_logout)}</span> },
  ], []);

  function abrirFiltro() {
    setRascunho(normalizarFiltroAcessos(filtro));
    setFiltroAberto(true);
  }

  function aplicarFiltro(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onFiltroChange(rascunho);
    paginacao.setCurrentPage(1);
    setFiltroAberto(false);
  }

  function limparFiltro() {
    setRascunho(FILTRO_ACESSOS_VAZIO);
    onFiltroChange(FILTRO_ACESSOS_VAZIO);
    paginacao.setCurrentPage(1);
    setFiltroAberto(false);
  }

  const campo = "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]";
  const rotulo = "mb-1 block text-sm text-slate-700";
  const campoData = (chave: keyof FiltroAcessos, texto: string) => (
    <div className="sm:col-span-3">
      <span className={rotulo}>{texto}</span>
      <input
        type="text"
        inputMode="numeric"
        maxLength={10}
        placeholder="DD/MM/AAAA"
        className={campo}
        value={rascunho[chave]}
        onChange={(e) => setRascunho({ ...rascunho, [chave]: applyDateMask(e.target.value) })}
      />
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      {/* Mesma altura do header das listagens (dropdown PAI na mesma posição das demais funções). */}
      <div className="flex min-h-[42px] items-center gap-2">
        <Select
          value={manageSelection}
          onChange={onManageSelectionChange}
          options={LOGS_OPCOES_DROPDOWN.filter((o) => allowedSubmodulos.includes(o.value))}
          showPlaceholder={!manageSelection}
          className="!w-[180px]"
        />
        <button
          type="button"
          onClick={abrirFiltro}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-[3px] bg-transparent cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2 ${filtroAtivo(filtro) ? "text-[#066fc5]" : "text-[#aaa] hover:text-[#777]"}`}
          aria-label="Abrir filtro"
          title={filtroAtivo(filtro) ? "Filtro aplicado" : "Filtro"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 4h18l-7.5 9.5V20l-3-1.5v-5L3 4z" />
          </svg>
        </button>
      </div>

      <div className="bg-white flex-1 flex flex-col min-h-0 overflow-hidden">
        {carregando ? (
          <div className="flex-1">
            <LoadingModal open message="Carregando..." />
          </div>
        ) : ordenados.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
            <p className="mt-4 font-medium text-slate-500">Nenhum registro encontrado.</p>
            <p className="mt-1 text-sm text-slate-500">
              {filtroAtivo(filtro) ? "Nenhum acesso corresponde ao filtro aplicado." : "Os logins feitos no sistema aparecem aqui."}
            </p>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-auto">
              <ResizableTable
                key="logs-acessos"
                columns={colunasTabela}
                rows={paginacao.slice(ordenados)}
                rowKey={(a) => a.id}
                sortColumn={ordem.coluna}
                sortAsc={ordem.asc}
                onSortChange={(key) => setOrdem((atual) => proximaOrdenacao(atual, key))}
                onRowClick={(a) => setSelecionadoId((atual) => (atual === a.id ? null : a.id))}
                rowClassName={(a) => (selecionadoId === a.id ? "row-selected" : "")}
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

      {filtroAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltroAberto(false)} />
          <form onSubmit={aplicarFiltro} className="relative w-full max-w-[760px] bg-white modal-dark p-0 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: "#000" }}>Filtro</h2>
              <button
                type="button"
                onClick={() => setFiltroAberto(false)}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar filtro"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] sm:grid-cols-12 p-[15px]">
              {/* Linha 1: Sequência, Usuário e Pessoa física (lookup). */}
              <div className="sm:col-span-2">
                <span className={rotulo}>Sequência</span>
                <input
                  inputMode="numeric"
                  maxLength={10}
                  className={campo}
                  value={rascunho.nr_sequencia}
                  onChange={(e) => setRascunho({ ...rascunho, nr_sequencia: e.target.value.replace(/\D/g, "") })}
                  autoFocus
                />
              </div>
              <div className="sm:col-span-4">
                <span className={rotulo}>Usuário</span>
                <input
                  className={campo}
                  value={rascunho.ds_usuario}
                  onChange={(e) => setRascunho({ ...rascunho, ds_usuario: e.target.value })}
                />
              </div>
              <div className="sm:col-span-6">
                <span className={rotulo}>Pessoa física</span>
                <div className="flex items-center gap-2 flex-nowrap">
                  <div className="w-[90px] shrink-0">
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      className={campo}
                      value={rascunho.nr_seq_pessoa_fisica}
                      onChange={(e) => setRascunho({ ...rascunho, nr_seq_pessoa_fisica: e.target.value.replace(/[^0-9]/g, "").slice(0, 10) })}
                    />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <input
                      readOnly
                      tabIndex={-1}
                      className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[36px] py-1.5 text-sm text-slate-700 focus:outline-none"
                      value={rascunho.nr_seq_pessoa_fisica ? nomePessoaFisica(Number(rascunho.nr_seq_pessoa_fisica)) : ""}
                    />
                    <button
                      type="button"
                      onClick={() => onOpenPessoaFisicaLookup((nr) => setRascunho((atual) => ({ ...atual, nr_seq_pessoa_fisica: String(nr) })))}
                      className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup"
                      aria-label="Localizar pessoa física"
                    >
                      <SearchIcon size={16} />
                    </button>
                  </div>
                </div>
              </div>
              {/* Linha 2: datas de login e logout. */}
              {campoData("dt_login_inicio", "Login (início)")}
              {campoData("dt_login_fim", "Login (fim)")}
              {campoData("dt_logout_inicio", "Logout (início)")}
              {campoData("dt_logout_fim", "Logout (fim)")}
              {/* Linha 3: Tipo de logout em toda a largura. */}
              <div className="sm:col-span-12">
                <span className={rotulo}>Tipo de logout</span>
                <Select
                  value={rascunho.ie_tipo_logout}
                  onChange={(v) => setRascunho({ ...rascunho, ie_tipo_logout: v })}
                  options={OPCOES_TIPO_LOGOUT}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={limparFiltro}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: "#bdbdbd", borderBottomColor: "#000" }}
              >
                Limpar
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: "#003056", borderBottomColor: "#000" }}
              >
                Filtrar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
