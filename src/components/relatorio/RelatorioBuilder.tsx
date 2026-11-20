"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Select from "@/components/ui/Select";
import LoadingModal from "@/components/ui/LoadingModal";
import RotuloCampo from "@/components/ui/RotuloCampo";
import RequiredAsterisk from "@/components/ui/RequiredAsterisk";
import ResizableTable, { type ConfigColunasTabela, type ResizableTableColumn } from "@/components/ui/ResizableTable";
import type { CampoStatus } from "@/lib/camposConfigUtils";
import { elementoVisivel } from "@/lib/visibilidade";
import { formatDate } from "@/lib/pessoaFisicaUtils";
import { nomeDoParametro, parametrosDoSql } from "@/lib/relatorioSql";
import { TAMANHOS_PAGINA } from "@/lib/relatorioUtils";
import {
  excluirBandaSql,
  excluirParametroSql,
  obterBandasSql,
  obterParametrosSql,
  ordenarParametros,
  salvarBandaSql,
  salvarParametroSql,
  type BandaSql,
  type ParametroSql,
} from "@/services/relatorioSqlService";
import type { Relatorio } from "@/types/relatorio";

/**
 * Gerenciador de Relatórios > Relatórios (relatórios XLS por SQL).
 *
 *   - viewMode 'form' (Adicionar / Ver): Sequência, Descrição, Formato (só XLS) e Saída.
 *     Os campos de PDF (Página, Orientação, Borda, margens) ficam desabilitados até o
 *     PDF voltar.
 *   - viewMode 'bandas' (duplo clique no relatório): abas Bandas e Parâmetros.
 *       Bandas: no XLS, uma só (o "Adicionar" fica desabilitado enquanto ela existir);
 *         campos Sequência, Descrição e SQL — a consulta que gera o relatório.
 *       Parâmetros: os :nome usados no SQL (Descrição do parâmetro = o nome), com Label,
 *         Ordem, Valor padrão, Perguntar e Obrigatório.
 *     Bandas e parâmetros são gravados na hora (cada um com auditoria própria).
 */

interface ContextMenuItem {
  label: string;
  onClick?: () => void;
}

/** Dados do relatório gravados pelo formulário. */
export interface DadosRelatorioForm {
  ds_relatorio: string;
  ie_formato: "excel";
  ds_nome_arquivo: string;
}

interface RelatorioBuilderProps {
  relatorio: Relatorio | null;
  /** 'form' mostra o relatório; 'bandas' mostra as abas Bandas e Parâmetros. */
  viewMode?: "form" | "bandas";
  onSave: (dados: DadosRelatorioForm) => void;
  onCancel: () => void;
  saving?: boolean;
  manageSelection?: string;
  onManageSelectionChange?: (v: string) => void;
  allowedSubmodulos?: string[];
  contextMenuItems?: ContextMenuItem[];
  onPrevRecord?: () => void;
  onNextRecord?: () => void;
  hasPrevRecord?: boolean;
  hasNextRecord?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  resolverNomeAutorExibicao?: (dsUsuario: string) => string;
  onOpenAudit?: (relatorioId?: string | null) => void;
  onOpenBandaAudit?: (relatorioId?: string | null, bandaId?: string | null) => void;
  onOpenFiltroAudit?: (relatorioId?: string | null, parametroId?: string | null) => void;
  /** Regras de campo do perfil (N/O/D) do relatório, da banda e do parâmetro. */
  campoRegras?: Record<string, CampoStatus>;
  bandaCampoRegras?: Record<string, CampoStatus>;
  parametroCampoRegras?: Record<string, CampoStatus>;
  campoErros?: string[];
  darkMode?: boolean;
  onNavigateToList?: () => void;
  onToast?: (message: string, status: "success" | "warning" | "error") => void;
  /** Abre o modal de confirmação de exclusão; `acao` roda se o usuário confirmar. */
  onConfirmarExclusao?: (mensagem: string, acao: () => void) => void;
  /** Colunas (ordem e largura) salvas das listas de bandas e de parâmetros. */
  colunasBandas?: ConfigColunasTabela;
  colunasParametros?: ConfigColunasTabela;
}

const RELATORIO_SELECT_OPTIONS = [{ value: "relatorio", label: "Relatórios" }];
const FORMATO_OPTIONS = [{ value: "excel", label: "XLS" }];
const ORIENTACAO_OPTIONS = [{ value: "retrato", label: "Retrato" }, { value: "paisagem", label: "Paisagem" }];
const BORDA_OPTIONS = [
  { value: "", label: "---" },
  { value: "solid_fina", label: "Sólida fina" },
  { value: "solid_grossa", label: "Sólida grossa" },
  { value: "dupla", label: "Dupla" },
  { value: "tracejada", label: "Tracejada" },
  { value: "pontilhada", label: "Pontilhada" },
];

const INPUT = "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500";
const BOTAO_LINK = "inline-flex items-center rounded-[3px] border border-transparent bg-transparent px-4 py-2.5 text-sm font-normal text-[#066fc5] transition cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2 active:outline active:outline-1 active:outline-[#066fc5] active:outline-offset-2 disabled:text-slate-400 disabled:cursor-not-allowed disabled:outline-none";
const BOTAO_NAV = "inline-flex items-center justify-center rounded-[3px] border border-slate-300 bg-[#ddd] px-[5px] py-[5px] text-sm text-black cursor-pointer hover:bg-slate-300 disabled:opacity-40 disabled:cursor-default disabled:hover:bg-[#ddd]";

type Detalhe = { tipo: "banda"; banda: BandaSql } | { tipo: "parametro"; parametro: ParametroSql } | null;

function simNao(v: unknown): string {
  return v === "S" ? "Sim" : v === "N" ? "Não" : "";
}

export default function RelatorioBuilder({
  relatorio,
  viewMode = "form",
  onSave,
  onCancel,
  saving = false,
  manageSelection = "relatorio",
  onManageSelectionChange,
  allowedSubmodulos = ["relatorio"],
  contextMenuItems = [],
  onPrevRecord,
  onNextRecord,
  hasPrevRecord = false,
  hasNextRecord = false,
  createdAt,
  updatedAt,
  createdBy,
  updatedBy,
  resolverNomeAutorExibicao,
  onOpenAudit,
  onOpenBandaAudit,
  onOpenFiltroAudit,
  campoRegras = {},
  bandaCampoRegras = {},
  parametroCampoRegras = {},
  campoErros = [],
  darkMode = false,
  onNavigateToList,
  onToast,
  onConfirmarExclusao,
  colunasBandas,
  colunasParametros,
}: RelatorioBuilderProps) {
  const ehBandas = viewMode === "bandas";
  const formRef = useRef<HTMLFormElement | null>(null);
  const nrRelatorio = relatorio?.nr_sequencia ?? null;
  const pdf = relatorio?.configPdf;

  /* ── Formulário do relatório ── */
  const [dsRelatorio, setDsRelatorio] = useState(relatorio?.ds_relatorio ?? "");
  const [nomeArquivo, setNomeArquivo] = useState(
    relatorio?.ds_nome_arquivo ?? pdf?.titulo ?? ""
  );

  /* ── Bandas e parâmetros ── */
  const [aba, setAba] = useState<"bandas" | "parametros">("bandas");
  const [bandas, setBandas] = useState<BandaSql[]>([]);
  const [parametros, setParametros] = useState<ParametroSql[]>([]);
  const [carregando, setCarregando] = useState(ehBandas);
  const [gravando, setGravando] = useState(false);
  const [detalhe, setDetalhe] = useState<Detalhe>(null);
  const [errosDetalhe, setErrosDetalhe] = useState<string[]>([]);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; acoes: ContextMenuItem[] } | null>(null);

  // Carga das bandas e parâmetros ao abrir (resultado aplicado só se a tela ainda estiver aberta).
  const onToastRef = useRef(onToast);
  useEffect(() => { onToastRef.current = onToast; }, [onToast]);
  useEffect(() => {
    if (!ehBandas || nrRelatorio == null) return;
    let ativo = true;
    Promise.all([obterBandasSql(nrRelatorio), obterParametrosSql(nrRelatorio)])
      .then(([b, p]) => {
        if (!ativo) return;
        setBandas(b);
        setParametros(p);
      })
      .catch(() => { if (ativo) onToastRef.current?.("Erro ao carregar as bandas e os parâmetros.", "error"); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [ehBandas, nrRelatorio]);

  // Menu de contexto fecha com qualquer clique.
  useEffect(() => {
    if (!menu) return;
    const fechar = () => setMenu(null);
    window.addEventListener("click", fechar);
    return () => window.removeEventListener("click", fechar);
  }, [menu]);

  const autor = (nome?: string) => {
    if (!nome) return "-";
    return resolverNomeAutorExibicao ? resolverNomeAutorExibicao(nome) || nome : nome;
  };
  const statusDe = (regras: Record<string, CampoStatus>, campo: string): CampoStatus => regras[campo] ?? "N";
  const rotulo = (texto: string, colecao: string, campo: string, regras: Record<string, CampoStatus>) => (
    <RotuloCampo texto={texto} colecao={colecao} campo={campo} prefixo={statusDe(regras, campo) === "O" ? <RequiredAsterisk /> : undefined} />
  );
  const comErro = (lista: string[], campo: string) => (lista.includes(campo) ? `${INPUT} !border-red-500` : INPUT);

  /* ── Salvar ── */
  function salvarRelatorio() {
    const faltantes = ["ds_relatorio", "ds_nome_arquivo"].filter((c) => statusDe(campoRegras, c) === "O" && !(c === "ds_relatorio" ? dsRelatorio : nomeArquivo).trim());
    if (!dsRelatorio.trim() && !faltantes.includes("ds_relatorio")) faltantes.push("ds_relatorio");
    if (faltantes.length > 0) {
      setErrosDetalhe(faltantes);
      onToast?.("Preencha os campos obrigatórios.", "error");
      return;
    }
    setErrosDetalhe([]);
    onSave({ ds_relatorio: dsRelatorio.trim(), ie_formato: "excel", ds_nome_arquivo: nomeArquivo.trim() });
  }

  async function salvarDetalhe() {
    if (!detalhe || nrRelatorio == null) return;
    if (detalhe.tipo === "banda") {
      const b = detalhe.banda;
      const faltantes = ["ds_banda", "ds_sql"].filter((c) => (c === "ds_sql" || statusDe(bandaCampoRegras, c) === "O") && !String(b[c as keyof BandaSql] ?? "").trim());
      if (faltantes.length > 0) {
        setErrosDetalhe(faltantes);
        onToast?.(faltantes.includes("ds_sql") ? "Informe o SQL da banda." : "Preencha os campos obrigatórios.", "error");
        return;
      }
    } else {
      const p = detalhe.parametro;
      const faltantes = ["ds_parametro", "ds_label", "nr_ordem", "vl_padrao"].filter((c) => {
        const vazio = String(p[c as keyof ParametroSql] ?? "").trim() === "";
        return vazio && (c === "ds_parametro" || statusDe(parametroCampoRegras, c) === "O");
      });
      if (faltantes.length > 0) {
        setErrosDetalhe(faltantes);
        onToast?.("Preencha os campos obrigatórios.", "error");
        return;
      }
      const nome = nomeDoParametro(p.ds_parametro);
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(nome)) {
        setErrosDetalhe(["ds_parametro"]);
        onToast?.("A descrição do parâmetro deve ser o nome usado no SQL (letras, números e _, sem espaços).", "error");
        return;
      }
      if (parametros.some((x) => x.id !== p.id && nomeDoParametro(x.ds_parametro).toLowerCase() === nome.toLowerCase())) {
        setErrosDetalhe(["ds_parametro"]);
        onToast?.(`Já existe o parâmetro :${nome} neste relatório.`, "error");
        return;
      }
    }
    setErrosDetalhe([]);
    setGravando(true);
    try {
      if (detalhe.tipo === "banda") {
        const salva = await salvarBandaSql({ ...detalhe.banda, nr_seq_relatorio: nrRelatorio });
        setBandas((lista) => (detalhe.banda.id ? lista.map((b) => (b.id === salva.id ? salva : b)) : [...lista, salva]));
        setSelecionadoId(salva.id ?? null);
        onToast?.(detalhe.banda.id ? "Banda atualizada com sucesso!" : "Banda cadastrada com sucesso!", "success");
      } else {
        const salvo = await salvarParametroSql({ ...detalhe.parametro, nr_seq_relatorio: nrRelatorio });
        setParametros((lista) => ordenarParametros(detalhe.parametro.id ? lista.map((p) => (p.id === salvo.id ? salvo : p)) : [...lista, salvo]));
        setSelecionadoId(salvo.id ?? null);
        onToast?.(detalhe.parametro.id ? "Parâmetro atualizado com sucesso!" : "Parâmetro cadastrado com sucesso!", "success");
      }
      setDetalhe(null);
    } catch (e) {
      onToast?.(e instanceof Error && e.message ? e.message : "Erro ao salvar.", "error");
    } finally {
      setGravando(false);
    }
  }

  function excluir(tipo: "banda" | "parametro", item: BandaSql | ParametroSql) {
    if (!item.id) return;
    const id = item.id;
    const mensagem = tipo === "banda" ? `Deseja mesmo excluir a banda ${item.nr_sequencia ?? ""}?` : `Deseja mesmo excluir o parâmetro ${item.nr_sequencia ?? ""}?`;
    const acao = async () => {
      setGravando(true);
      try {
        if (tipo === "banda") {
          await excluirBandaSql(id);
          setBandas((lista) => lista.filter((b) => b.id !== id));
          onToast?.("Banda excluída com sucesso!", "success");
        } else {
          await excluirParametroSql(id);
          setParametros((lista) => lista.filter((p) => p.id !== id));
          onToast?.("Parâmetro excluído com sucesso!", "success");
        }
        setDetalhe((d) => (d && ((d.tipo === "banda" && d.banda.id === id) || (d.tipo === "parametro" && d.parametro.id === id)) ? null : d));
      } catch (e) {
        onToast?.(e instanceof Error && e.message ? e.message : "Erro ao excluir.", "error");
      } finally {
        setGravando(false);
      }
    };
    if (onConfirmarExclusao) onConfirmarExclusao(mensagem, () => { void acao(); });
    else if (window.confirm(mensagem)) void acao();
  }

  // Ctrl+S salva o que estiver aberto.
  const salvarRef = useRef<() => void>(() => {});
  useEffect(() => {
    salvarRef.current = () => {
      if (ehBandas) { if (detalhe && !gravando) void salvarDetalhe(); }
      else if (!saving) salvarRelatorio();
    };
  });
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        if (!elementoVisivel(formRef.current)) return;
        e.preventDefault();
        salvarRef.current();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  /* ── Listas ── */
  const colunasAuditoria = <T extends { dt_criacao?: string; dt_alteracao?: string; ds_usuario_criacao?: string; ds_usuario_alteracao?: string }>(): ResizableTableColumn<T>[] => [
    { key: "dt_criacao", label: "Criação", render: (r) => (r.dt_criacao ? formatDate(r.dt_criacao) : "") },
    { key: "dt_alteracao", label: "Alteração", render: (r) => (r.dt_alteracao ? formatDate(r.dt_alteracao) : "") },
    { key: "ds_usuario_criacao", label: "Usuário criação", render: (r) => autor(r.ds_usuario_criacao) },
    { key: "ds_usuario_alteracao", label: "Usuário alteração", render: (r) => autor(r.ds_usuario_alteracao) },
  ];
  const colunasDeBanda: ResizableTableColumn<BandaSql>[] = [
    { key: "nr_sequencia", label: "#", render: (b) => String(b.nr_sequencia ?? "") },
    { key: "ds_banda", label: "Descrição", render: (b) => b.ds_banda ?? "" },
    ...colunasAuditoria<BandaSql>(),
  ];
  const colunasDeParametro: ResizableTableColumn<ParametroSql>[] = [
    { key: "nr_sequencia", label: "#", render: (p) => String(p.nr_sequencia ?? "") },
    { key: "ds_parametro", label: "Descrição do parâmetro", render: (p) => p.ds_parametro ?? "" },
    { key: "ds_label", label: "Label", render: (p) => p.ds_label ?? "" },
    { key: "nr_ordem", label: "Ordem", render: (p) => (p.nr_ordem ?? "") === "" ? "" : String(p.nr_ordem ?? "") },
    { key: "vl_padrao", label: "Valor padrão", render: (p) => p.vl_padrao ?? "" },
    { key: "ie_perguntar", label: "Perguntar", render: (p) => simNao(p.ie_perguntar) },
    { key: "ie_obrigatorio", label: "Obrigatório", render: (p) => simNao(p.ie_obrigatorio) },
    ...colunasAuditoria<ParametroSql>(),
  ];

  const xlsTemBanda = bandas.length >= 1;
  function adicionar() {
    setErrosDetalhe([]);
    if (aba === "bandas") {
      if (xlsTemBanda) return;
      setDetalhe({ tipo: "banda", banda: { ds_banda: "", ds_sql: "" } });
    } else {
      setDetalhe({ tipo: "parametro", parametro: { ds_parametro: "", ds_label: "", nr_ordem: null, vl_padrao: "", ie_perguntar: "N", ie_obrigatorio: "N" } });
    }
  }
  function abrir(item: BandaSql | ParametroSql) {
    setErrosDetalhe([]);
    setSelecionadoId(item.id ?? null);
    setDetalhe(aba === "bandas" ? { tipo: "banda", banda: { ...(item as BandaSql) } } : { tipo: "parametro", parametro: { ...(item as ParametroSql) } });
  }

  /* ── Parâmetros do SQL (ajuda ao editar a banda) ── */
  const sqlEmEdicao = detalhe?.tipo === "banda" ? detalhe.banda.ds_sql ?? "" : "";
  const nomesNoSql = useMemo(() => (sqlEmEdicao ? parametrosDoSql(sqlEmEdicao) : []), [sqlEmEdicao]);
  const naoCadastrados = nomesNoSql.filter((n) => !parametros.some((p) => nomeDoParametro(p.ds_parametro).toLowerCase() === n.toLowerCase()));

  /* ── Rodapé (auditoria do que está aberto) ── */
  const auditoria = ehBandas
    ? detalhe?.tipo === "banda" && detalhe.banda.id
      ? { criadoPor: detalhe.banda.ds_usuario_criacao, criadoEm: detalhe.banda.dt_criacao, alteradoPor: detalhe.banda.ds_usuario_alteracao, alteradoEm: detalhe.banda.dt_alteracao, abrir: () => onOpenBandaAudit?.(relatorio?.id ?? null, detalhe.banda.id ?? null) }
      : detalhe?.tipo === "parametro" && detalhe.parametro.id
        ? { criadoPor: detalhe.parametro.ds_usuario_criacao, criadoEm: detalhe.parametro.dt_criacao, alteradoPor: detalhe.parametro.ds_usuario_alteracao, alteradoEm: detalhe.parametro.dt_alteracao, abrir: () => onOpenFiltroAudit?.(relatorio?.id ?? null, detalhe.parametro.id ?? null) }
        : null
    : relatorio?.id
      ? { criadoPor: createdBy, criadoEm: createdAt, alteradoPor: updatedBy, alteradoEm: updatedAt, abrir: () => onOpenAudit?.(relatorio.id ?? null) }
      : null;

  const iconeInfo = (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <circle cx="12" cy="16" r="0.5" />
    </svg>
  );
  const corBorda = darkMode ? "#2c2c31 #38383e #38383e #2c2c31" : "#999 #ccc #ccc #999";
  const corTexto = darkMode ? "#fff" : "#000";
  const mostraRodape = !ehBandas || !!detalhe;

  return (
    <div
      className="flex-1 flex flex-col min-h-0"
      onContextMenu={(e) => {
        if (ehBandas || contextMenuItems.length === 0) return;
        e.preventDefault();
        setMenu({ x: e.clientX, y: e.clientY, acoes: contextMenuItems });
      }}
    >
      {menu && menu.acoes.length > 0 && (
        <div
          className="fixed z-50 min-w-[160px] border border-slate-200 bg-white p-[3px] flex flex-col gap-[3px]"
          style={{ left: menu.x, top: menu.y, boxShadow: "0 4px 10px rgba(0,0,0,0.18)" }}
        >
          {menu.acoes.map((item) => (
            <button
              key={item.label}
              type="button"
              className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer"
              style={{ padding: "0.2rem 0.4rem" }}
              onClick={() => { item.onClick?.(); setMenu(null); }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Cabeçalho ── */}
      <div className="flex items-center justify-between gap-3 min-h-[42px]">
        <div className="flex items-center gap-2 min-w-0">
          <Select
            value={manageSelection}
            onChange={onManageSelectionChange ?? (() => {})}
            options={RELATORIO_SELECT_OPTIONS.filter((o) => allowedSubmodulos.includes(o.value))}
            showPlaceholder={false}
            className="!w-[180px]"
            disabled
          />
          {!ehBandas && (
            <div className="flex items-center gap-1">
              <button type="button" onClick={onPrevRecord} disabled={!hasPrevRecord} className={BOTAO_NAV} style={{ borderBottomColor: "#000" }} aria-label="Registro anterior">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18 9 12l6-6" /></svg>
              </button>
              <button type="button" onClick={onNextRecord} disabled={!hasNextRecord} className={BOTAO_NAV} style={{ borderBottomColor: "#000" }} aria-label="Próximo registro">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18 15 12 9 6" /></svg>
              </button>
            </div>
          )}
          {relatorio && (
            <div className="flex items-center text-xs ml-2 whitespace-nowrap overflow-hidden px-2 py-1" style={{ color: corTexto, border: "1px solid", borderColor: corBorda }}>
              <button type="button" className="cursor-pointer hover:underline" onClick={() => onNavigateToList?.()}>
                Relatório: {relatorio.nr_sequencia} {relatorio.ds_relatorio}
              </button>
              {detalhe && (
                <>
                  <span className="mx-1">&gt;</span>
                  <button type="button" className="cursor-pointer hover:underline" onClick={() => setDetalhe(null)}>
                    {detalhe.tipo === "banda"
                      ? `Banda: ${detalhe.banda.nr_sequencia ?? "nova"} ${detalhe.banda.ds_banda ?? ""}`
                      : `Parâmetro: ${detalhe.parametro.nr_sequencia ?? "novo"} ${detalhe.parametro.ds_parametro ?? ""}`}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {ehBandas && !detalhe && (
            <div className="flex items-center text-xs whitespace-nowrap px-2 py-1 gap-2" style={{ border: "1px solid", borderColor: corBorda, color: corTexto }}>
              {(["bandas", "parametros"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => { setAba(a); setSelecionadoId(null); }}
                  className="text-xs font-medium cursor-pointer"
                  style={{ borderBottom: `1px solid ${aba === a ? corTexto : "transparent"}`, color: corTexto }}
                >
                  {a === "bandas" ? "Bandas" : "Parâmetros"}
                </button>
              ))}
            </div>
          )}
          {ehBandas && !detalhe && (
            <button
              type="button"
              onClick={adicionar}
              disabled={aba === "bandas" && xlsTemBanda}
              className={BOTAO_LINK}
            >
              Adicionar
            </button>
          )}
        </div>
      </div>

      {/* ── Conteúdo ── */}
      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          if (ehBandas) void salvarDetalhe();
          else salvarRelatorio();
        }}
        className="mt-6 flex-1 flex flex-col min-h-0"
      >
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-9">
          {!ehBandas && (
            <>
              <section>
                <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Relatório</h2>
                <div className="grid gap-[15px] sm:grid-cols-12">
                  <div className="sm:col-span-2">
                    {rotulo("Sequência", "relatorio", "nr_sequencia", campoRegras)}
                    <input disabled value={String(relatorio?.nr_sequencia ?? "")} className={INPUT} />
                  </div>
                  <div className="sm:col-span-7">
                    {rotulo("Descrição", "relatorio", "ds_relatorio", { ...campoRegras, ds_relatorio: campoRegras.ds_relatorio === "D" ? "D" : "O" })}
                    <input
                      value={dsRelatorio}
                      onChange={(e) => setDsRelatorio(e.target.value)}
                      disabled={statusDe(campoRegras, "ds_relatorio") === "D"}
                      className={comErro([...errosDetalhe, ...campoErros], "ds_relatorio")}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    {rotulo("Formato", "relatorio", "ie_formato", campoRegras)}
                    {/* Por enquanto só XLS (o PDF volta depois). */}
                    <Select value="excel" onChange={() => {}} options={FORMATO_OPTIONS} showPlaceholder={false} disabled={statusDe(campoRegras, "ie_formato") === "D"} />
                  </div>
                </div>
              </section>

              <section>
                <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Saída</h2>
                <div className="space-y-[15px]">
                  <div className="grid gap-[15px] sm:grid-cols-4">
                    <div>
                      {rotulo("Nome do arquivo", "relatorio", "ds_nome_arquivo", campoRegras)}
                      <input
                        value={nomeArquivo}
                        onChange={(e) => setNomeArquivo(e.target.value)}
                        disabled={statusDe(campoRegras, "ds_nome_arquivo") === "D"}
                        placeholder={dsRelatorio.trim() || undefined}
                        className={`${comErro(errosDetalhe, "ds_nome_arquivo")} placeholder:text-[#aaa]`}
                      />
                    </div>
                    {/* Campos do PDF: desabilitados até o PDF voltar. */}
                    <div>
                      {rotulo("Página", "relatorio", "ie_pagina", campoRegras)}
                      <Select value={pdf?.tamanhoPagina ?? "A4"} onChange={() => {}} options={[...TAMANHOS_PAGINA]} showPlaceholder={false} disabled />
                    </div>
                    <div>
                      {rotulo("Orientação", "relatorio", "ie_orientacao", campoRegras)}
                      <Select value={pdf?.orientacao ?? "retrato"} onChange={() => {}} options={ORIENTACAO_OPTIONS} showPlaceholder={false} disabled />
                    </div>
                    <div>
                      {rotulo("Borda", "relatorio", "ie_borda", campoRegras)}
                      <Select value={pdf?.estiloBorda ?? ""} onChange={() => {}} options={BORDA_OPTIONS} showPlaceholder={false} disabled />
                    </div>
                  </div>
                  <div className="grid gap-[15px] sm:grid-cols-4">
                    {([
                      ["nr_margem_superior", "Margem superior", pdf?.margens?.superior],
                      ["nr_margem_inferior", "Margem inferior", pdf?.margens?.inferior],
                      ["nr_margem_esquerda", "Margem esquerda", pdf?.margens?.esquerda],
                      ["nr_margem_direita", "Margem direita", pdf?.margens?.direita],
                    ] as const).map(([campo, texto, valor]) => (
                      <div key={campo}>
                        {rotulo(texto, "relatorio", campo, campoRegras)}
                        <input disabled value={valor ?? ""} className={INPUT} />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}

          {ehBandas && !detalhe && (
            <section className="h-full flex min-h-0 flex-col">
              {carregando ? (
                <LoadingModal open message="Carregando..." />
              ) : (aba === "bandas" ? bandas : parametros).length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
                  <p className="mt-4 font-medium text-slate-500">Nenhum registro encontrado.</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {aba === "bandas"
                      ? 'Clique em "Adicionar" para cadastrar a banda com o SQL do relatório.'
                      : 'Clique em "Adicionar" para cadastrar os parâmetros usados no SQL (ex.: :teste).'}
                  </p>
                </div>
              ) : aba === "bandas" ? (
                <ResizableTable<BandaSql>
                  {...colunasBandas}
                  columns={colunasDeBanda}
                  rows={bandas}
                  rowKey={(b) => String(b.id ?? b.nr_sequencia)}
                  onRowClick={(b) => setSelecionadoId(b.id ?? null)}
                  onRowDoubleClick={abrir}
                  rowClassName={(b) => (b.id === selecionadoId ? "row-selected" : "")}
                  onRowContextMenu={(b, e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelecionadoId(b.id ?? null);
                    setMenu({ x: e.clientX, y: e.clientY, acoes: [{ label: "Ver", onClick: () => abrir(b) }, { label: "Excluir", onClick: () => excluir("banda", b) }] });
                  }}
                />
              ) : (
                <ResizableTable<ParametroSql>
                  {...colunasParametros}
                  columns={colunasDeParametro}
                  rows={parametros}
                  rowKey={(p) => String(p.id ?? p.nr_sequencia)}
                  onRowClick={(p) => setSelecionadoId(p.id ?? null)}
                  onRowDoubleClick={abrir}
                  rowClassName={(p) => (p.id === selecionadoId ? "row-selected" : "")}
                  onRowContextMenu={(p, e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelecionadoId(p.id ?? null);
                    setMenu({ x: e.clientX, y: e.clientY, acoes: [{ label: "Ver", onClick: () => abrir(p) }, { label: "Excluir", onClick: () => excluir("parametro", p) }] });
                  }}
                />
              )}
            </section>
          )}

          {detalhe?.tipo === "banda" && (
            <section>
              <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Banda</h2>
              <div className="grid gap-[15px] sm:grid-cols-12">
                <div className="sm:col-span-2">
                  {rotulo("Sequência", "relatorio_banda", "nr_sequencia", bandaCampoRegras)}
                  <input disabled value={String(detalhe.banda.nr_sequencia ?? "")} className={INPUT} />
                </div>
                <div className="sm:col-span-10">
                  {rotulo("Descrição", "relatorio_banda", "ds_banda", bandaCampoRegras)}
                  <input
                    value={detalhe.banda.ds_banda ?? ""}
                    onChange={(e) => setDetalhe({ tipo: "banda", banda: { ...detalhe.banda, ds_banda: e.target.value } })}
                    disabled={statusDe(bandaCampoRegras, "ds_banda") === "D"}
                    className={comErro(errosDetalhe, "ds_banda")}
                  />
                </div>
                <div className="sm:col-span-12">
                  {rotulo("SQL", "relatorio_banda", "ds_sql", { ...bandaCampoRegras, ds_sql: "O" })}
                  <textarea
                    value={detalhe.banda.ds_sql ?? ""}
                    onChange={(e) => setDetalhe({ tipo: "banda", banda: { ...detalhe.banda, ds_sql: e.target.value } })}
                    disabled={statusDe(bandaCampoRegras, "ds_sql") === "D"}
                    rows={16}
                    spellCheck={false}
                    placeholder="select * from pat_ativo where nr_sequencia = :teste"
                    className={`${comErro(errosDetalhe, "ds_sql")} font-mono text-[13px] leading-5 resize-y placeholder:text-[#aaa]`}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Uma consulta (SELECT ou WITH). Parâmetros como <code>:nome</code>, cadastrados na aba Parâmetros.
                    {nomesNoSql.length > 0 && <> Parâmetros neste SQL: {nomesNoSql.map((n) => `:${n}`).join(", ")}.</>}
                    {naoCadastrados.length > 0 && (
                      <span className="text-[#b46a00]"> Ainda não cadastrados: {naoCadastrados.map((n) => `:${n}`).join(", ")}.</span>
                    )}
                  </p>
                </div>
              </div>
            </section>
          )}

          {detalhe?.tipo === "parametro" && (
            <section>
              <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Parâmetro</h2>
              <div className="grid gap-[15px] sm:grid-cols-12">
                <div className="sm:col-span-2">
                  {rotulo("Sequência", "relatorio_parametro", "nr_sequencia", parametroCampoRegras)}
                  <input disabled value={String(detalhe.parametro.nr_sequencia ?? "")} className={INPUT} />
                </div>
                <div className="sm:col-span-5">
                  {rotulo("Descrição do parâmetro", "relatorio_parametro", "ds_parametro", { ...parametroCampoRegras, ds_parametro: "O" })}
                  <input
                    value={detalhe.parametro.ds_parametro ?? ""}
                    onChange={(e) => setDetalhe({ tipo: "parametro", parametro: { ...detalhe.parametro, ds_parametro: e.target.value.replace(/\s/g, "") } })}
                    disabled={statusDe(parametroCampoRegras, "ds_parametro") === "D"}
                    placeholder="teste"
                    className={`${comErro(errosDetalhe, "ds_parametro")} placeholder:text-[#aaa]`}
                  />
                </div>
                <div className="sm:col-span-5">
                  {rotulo("Label", "relatorio_parametro", "ds_label", parametroCampoRegras)}
                  <input
                    value={detalhe.parametro.ds_label ?? ""}
                    onChange={(e) => setDetalhe({ tipo: "parametro", parametro: { ...detalhe.parametro, ds_label: e.target.value } })}
                    disabled={statusDe(parametroCampoRegras, "ds_label") === "D"}
                    className={comErro(errosDetalhe, "ds_label")}
                  />
                </div>
                <div className="sm:col-span-2">
                  {rotulo("Ordem", "relatorio_parametro", "nr_ordem", parametroCampoRegras)}
                  <input
                    inputMode="numeric"
                    value={detalhe.parametro.nr_ordem ?? ""}
                    onChange={(e) => {
                      const digitos = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setDetalhe({ tipo: "parametro", parametro: { ...detalhe.parametro, nr_ordem: digitos === "" ? null : Number(digitos) } });
                    }}
                    disabled={statusDe(parametroCampoRegras, "nr_ordem") === "D"}
                    className={comErro(errosDetalhe, "nr_ordem")}
                  />
                </div>
                <div className="sm:col-span-6">
                  {rotulo("Valor padrão", "relatorio_parametro", "vl_padrao", parametroCampoRegras)}
                  <input
                    value={detalhe.parametro.vl_padrao ?? ""}
                    onChange={(e) => setDetalhe({ tipo: "parametro", parametro: { ...detalhe.parametro, vl_padrao: e.target.value } })}
                    disabled={statusDe(parametroCampoRegras, "vl_padrao") === "D"}
                    className={comErro(errosDetalhe, "vl_padrao")}
                  />
                </div>
                {([
                  ["ie_perguntar", "Perguntar"],
                  ["ie_obrigatorio", "Obrigatório"],
                ] as const).map(([campo, texto]) => (
                  <div key={campo} className="sm:col-span-2">
                    {rotulo(texto, "relatorio_parametro", campo, parametroCampoRegras)}
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        className="cg-checkbox"
                        checked={detalhe.parametro[campo] === "S"}
                        disabled={statusDe(parametroCampoRegras, campo) === "D"}
                        onChange={(e) => setDetalhe({ tipo: "parametro", parametro: { ...detalhe.parametro, [campo]: e.target.checked ? "S" : "N" } })}
                      />
                      <span>Sim</span>
                    </label>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {mostraRodape && (
          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between gap-3">
              {auditoria && (
                <div className="text-[13px] text-slate-500">
                  <div className="relative group flex items-center gap-2">
                    <span>Criado por {autor(auditoria.criadoPor)} em {auditoria.criadoEm ? formatDate(auditoria.criadoEm) : "-"}</span>
                    <button type="button" onClick={auditoria.abrir} className="botao-auditoria inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none" aria-label="Abrir histórico de auditoria">
                      {iconeInfo}
                    </button>
                  </div>
                  <div className="relative group flex items-center gap-2 mt-1">
                    <span>Alterado por {autor(auditoria.alteradoPor)} em {auditoria.alteradoEm ? formatDate(auditoria.alteradoEm) : "-"}</span>
                    <button type="button" onClick={auditoria.abrir} className="botao-auditoria inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none" aria-label="Abrir histórico de auditoria">
                      {iconeInfo}
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => (ehBandas ? setDetalhe(null) : onCancel())}
                  className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                  style={{ backgroundColor: "#bdbdbd", borderBottomColor: "#000" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || gravando}
                  className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                  style={{ backgroundColor: "#003056", borderBottomColor: "#000" }}
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      {gravando && <LoadingModal open message="Carregando..." />}
    </div>
  );
}
