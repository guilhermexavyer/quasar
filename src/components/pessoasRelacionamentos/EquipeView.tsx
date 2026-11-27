"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Select from "@/components/ui/Select";
import LoadingModal from "@/components/ui/LoadingModal";
import EmptySelectionMessage from "@/components/ui/EmptySelectionMessage";
import RotuloCampo from "@/components/ui/RotuloCampo";
import RequiredAsterisk from "@/components/ui/RequiredAsterisk";
import BotaoSalvarEAdicionar from "@/components/ui/BotaoSalvarEAdicionar";
import BotaoSalvarFiltro from "@/components/ui/BotaoSalvarFiltro";
import FiltrosAplicados, { type FiltroAplicado } from "@/components/ui/FiltrosAplicados";
import NavegacaoRegistros from "@/components/ui/NavegacaoRegistros";
import AbasRegistros from "@/components/ui/AbasRegistros";
import CampoLookupReferencia from "@/components/ui/CampoLookupReferencia";
import LookupModal, { type ConfigLookup } from "@/components/ui/LookupModal";
import ResizableTable, { proximaOrdenacao, compararValoresColuna, type ConfigColunasTabela, type ResizableTableColumn } from "@/components/ui/ResizableTable";
import PaginationFooter, { usePagination } from "@/components/ui/PaginationFooter";
import type { CampoStatus } from "@/lib/camposConfigUtils";
import { elementoVisivel } from "@/lib/visibilidade";
import { formatDate } from "@/lib/pessoaFisicaUtils";
import { useOrdenacaoPersistida } from "@/lib/ordenacaoPersistida";
import {
  COLECAO_EQUIPE,
  COLUNAS_EQUIPE,
  FILTRO_EQUIPE_VAZIO,
  celulaEquipe,
  passaFiltroEquipe,
  type FiltroEquipe,
  COLECAO_EQUIPE_MEMBRO,
  STATUS_RELACIONAMENTO_OPTIONS,
  mesclarFiltro,
  rotuloStatusRelacionamento,
} from "@/lib/relacionamentoUtils";
import {
  atualizarEquipe,
  atualizarMembro,
  criarEquipe,
  criarMembro,
  excluirEquipe,
  excluirMembro,
  observarMembrosDaEquipe,
} from "@/services/relacionamentoService";
import type { Equipe, EquipeMembro } from "@/types/relacionamento";

const CLASSE_CAMPO = "w-full rounded-[3px] border bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa] disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500";
const CLASSE_LINK = "inline-flex items-center rounded-[3px] border border-transparent bg-transparent px-4 py-2.5 text-sm font-normal text-[#066fc5] transition cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2 active:outline active:outline-1 active:outline-[#066fc5] active:outline-offset-2";
const CLASSE_ITEM_MENU = "w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer";
const ESTILO_ITEM_MENU = { padding: "0.2rem 0.4rem" };

const classeSeta = (ativo: boolean) =>
  `inline-flex items-center justify-center rounded-[3px] border border-slate-300 bg-[#ddd] px-[5px] py-[5px] text-sm text-black cursor-pointer ${ativo ? "hover:bg-slate-300" : "opacity-40"}`;

function Setas({ anterior, proximo, temAnterior, temProximo }: { anterior: () => void; proximo: () => void; temAnterior: boolean; temProximo: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={anterior} disabled={!temAnterior} className={classeSeta(temAnterior)} style={{ borderBottomColor: "#000" }} aria-label="Registro anterior">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18 9 12l6-6" /></svg>
      </button>
      <button type="button" onClick={proximo} disabled={!temProximo} className={classeSeta(temProximo)} style={{ borderBottomColor: "#000" }} aria-label="Próximo registro">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18 15 12 9 6" /></svg>
      </button>
    </div>
  );
}

/** Rodapé do formulário: "Criado/Alterado por ... em ..." (com a auditoria) e os botões. */
function RodapeFormulario({
  registro,
  onAuditoria,
  resolverNomeAutor,
  salvando,
  onCancelar,
  onSalvarEAdicionar,
}: {
  registro?: { ds_usuario_criacao?: string; ds_usuario_alteracao?: string; dt_criacao?: string; dt_alteracao?: string };
  onAuditoria: () => void;
  resolverNomeAutor: (nome: string) => string;
  salvando: boolean;
  onCancelar: () => void;
  onSalvarEAdicionar?: () => void;
}) {
  return (
    <div className="mt-auto pt-4">
      <div className="flex items-center justify-between gap-3">
        {registro && (
          <div className="text-[13px] text-slate-500">
            {([
              ["Criado", registro.ds_usuario_criacao, registro.dt_criacao],
              ["Alterado", registro.ds_usuario_alteracao, registro.dt_alteracao],
            ] as const).map(([acao, autor, data], i) => (
              <div key={acao} className={`relative group flex items-center gap-2 ${i > 0 ? "mt-1" : ""}`}>
                <span>{acao} por {resolverNomeAutor(autor ?? "") || "-"} em {data ? formatDate(data) : "-"}</span>
                <button
                  type="button"
                  aria-hidden="true"
                  onClick={onAuditoria}
                  className="botao-auditoria inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none"
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
          {onSalvarEAdicionar && <BotaoSalvarEAdicionar disabled={salvando} onClick={onSalvarEAdicionar} />}
          <button
            type="button"
            onClick={onCancelar}
            className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
            style={{ backgroundColor: "#bdbdbd", borderBottomColor: "#000" }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60"
            style={{ backgroundColor: "#003056", borderBottomColor: "#000" }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

/** Ctrl+S envia o formulário visível. */
function useCtrlS(formRef: React.RefObject<HTMLFormElement | null>, salvando: boolean) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "s") return;
      const f = formRef.current;
      if (!f || !elementoVisivel(f)) return;
      e.preventDefault();
      if (!salvando) f.requestSubmit();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [formRef, salvando]);
}

/** Vazio sempre no fim; números como números; o resto como texto. */
function ordenarPor<T>(lista: T[], ordem: { coluna: string | null; asc: boolean }, valor: (item: T, coluna: string) => unknown, padrao: (a: T, b: T) => number): T[] {
  const coluna = ordem.coluna;
  if (!coluna) return [...lista].sort(padrao);
  const vazio = (v: unknown) => v === null || v === undefined || v === "";
  return [...lista].sort((x, y) => {
    const a = valor(x, coluna);
    const b = valor(y, coluna);
    if (vazio(a) || vazio(b)) return vazio(a) === vazio(b) ? 0 : vazio(a) ? 1 : -1;
    const cmp = compararValoresColuna(a, b);
    return ordem.asc ? cmp : -cmp;
  });
}

const chaveInstante = (v?: string) => {
  const t = v ? Date.parse(v) : NaN;
  return Number.isNaN(t) ? null : t;
};

/** Registro que pode ser membro (colaborador, fornecedor ou prestador de serviço), já com o nome. */
export interface OpcaoMembro {
  nr_sequencia: number;
  descricao: string;
  /** Desligado/Inativo: não aparece no lookup (o nome continua aparecendo nos membros). */
  inativo?: boolean;
}

export interface PermissoesEquipe {
  adicionar: boolean;
  ver: boolean;
  editar: boolean;
  membros: boolean;
  /** "Assumir ativos" (menu de contexto): a equipe assume os ativos de outra equipe. */
  assumirAtivos?: boolean;
  excluir: boolean;
}

type CampoMembro = "nr_seq_colaborador" | "nr_seq_fornecedor" | "nr_seq_prestador_servico";

const TIPOS_MEMBRO: { campo: CampoMembro; rotulo: string; colecao: string }[] = [
  { campo: "nr_seq_colaborador", rotulo: "Colaborador", colecao: "colaborador" },
  { campo: "nr_seq_fornecedor", rotulo: "Fornecedor", colecao: "fornecedor" },
  { campo: "nr_seq_prestador_servico", rotulo: "Prestador de serviço", colecao: "prestador_servico" },
];

interface EquipeViewProps {
  registros: Equipe[];
  carregando: boolean;
  selectOptions: { value: string; label: string }[];
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  allowedSubmodulos: string[];
  permissoes: PermissoesEquipe;
  /** Opções dos lookups dos membros, já com o nome de cada registro. */
  opcoesMembro: Record<CampoMembro, OpcaoMembro[]>;
  campoRegras?: Record<string, CampoStatus>;
  campoRegrasMembro?: Record<string, CampoStatus>;
  onOpenAudit: (colecao: string, id: string) => void;
  resolverNomeAutor?: (nome: string) => string;
  onMessage: (mensagem: string) => void;
  onAviso: (mensagem: string) => void;
  confirmar: (titulo: string, mensagem: string, acao: () => void) => void;
  onSavingChange?: (salvando: boolean) => void;
  colunas?: ConfigColunasTabela;
  colunasMembros?: ConfigColunasTabela;
  /** Filtro salvo do usuário para a lista de Equipes: vira o filtro inicial. */
  filtroSalvo?: Record<string, string> | null;
  /** "Salvar filtro": grava o filtro para o usuário e o aplica (como o "Filtrar"). */
  onSalvarFiltro?: (form: Record<string, string>, aplicar: () => void) => void;
  /**
   * "Adicionar" do lookup de membros: devolve o handler do botão (ou undefined, sem permissão).
   * Ele abre o cadastro na função do registro; ao salvar, `aoCriar` recebe a sequência do novo.
   */
  adicionarPeloLookup?: (colecao: string, fecharLookup: () => void, aoCriar: (nr: number) => void) => (() => void) | undefined;
  /** Lookup de membros: o filtro e as colunas da tela de registros (Colaboradores, Fornecedores, Prestadores). */
  configLookup?: (colecao: string) => ConfigLookup<{ nr_sequencia: number }>;
  /**
   * "Adicionar" de um lookup de outra tela: preenchido, a tela já monta com o formulário de uma
   * equipe nova aberto (a tela usa um key com este valor, para montar de novo a cada pedido).
   */
  novoAoAbrir?: number;
  /** Chamado quando o formulário da equipe fecha (Salvar, Cancelar, Fechar): o lookup de origem retoma. */
  onFormularioFechado?: () => void;
  /** "Assumir ativos" do menu de contexto: abre o modal para a equipe assumir os ativos de outra. */
  onAssumirAtivos?: (equipe: Equipe) => void;
}

const FILTRO_VAZIO = FILTRO_EQUIPE_VAZIO;

/**
 * Pessoas e Relacionamentos > Equipes. Capa (Sequência, Descrição, Status e Observação) e,
 * pelo duplo clique, a aba Membros: colaboradores, fornecedores ou prestadores de serviço da
 * equipe, no mesmo molde das Bandas de um relatório (dropdown Pai, setas, navegação).
 */
export default function EquipeView(props: EquipeViewProps) {
  const {
    registros,
    carregando,
    selectOptions,
    manageSelection,
    onManageSelectionChange,
    allowedSubmodulos,
    permissoes,
    campoRegras = {},
    onOpenAudit,
    resolverNomeAutor = (nome: string) => nome,
    onMessage,
    onAviso,
    confirmar,
    onSavingChange,
    colunas,
    filtroSalvo,
    onSalvarFiltro,
    novoAoAbrir,
    onFormularioFechado,
    onAssumirAtivos,
  } = props;

  const [ordem, setOrdem] = useOrdenacaoPersistida<{ coluna: string | null; asc: boolean }>("equipe.lista", { coluna: null, asc: true });
  const [filtro, setFiltro] = useOrdenacaoPersistida<FiltroEquipe>("equipe.filtro", mesclarFiltro(FILTRO_VAZIO, filtroSalvo));
  /** Equipe com os membros abertos (duplo clique); null = lista ou formulário. */
  const [membrosDe, setMembrosDe] = useOrdenacaoPersistida<string | null>("equipe.membrosDe", null);
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [rascunho, setRascunho] = useState<FiltroEquipe>(FILTRO_VAZIO);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number; noVer?: boolean } | null>(null);
  const [aberto, setAberto] = useState<{ id?: string } | null>(novoAoAbrir ? {} : null);
  const [form, setForm] = useState({ ds_equipe: "", ie_status: "A", ds_observacao: "" });
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const novoAposSalvarRef = useRef(false);

  useEffect(() => { onSavingChange?.(salvando); }, [salvando, onSavingChange]);
  useCtrlS(formRef, salvando);

  const filtradas = useMemo(() => registros.filter((e) => passaFiltroEquipe(e, filtro)), [registros, filtro]);

  const ordenadas = useMemo(
    () => ordenarPor(filtradas, ordem, (e, coluna) => {
      if (coluna === "ie_status") return rotuloStatusRelacionamento(e.ie_status ?? "A");
      if (coluna === "dt_criacao" || coluna === "dt_alteracao") return chaveInstante(e[coluna]);
      return e[coluna as keyof Equipe] ?? null;
    }, (a, b) => b.nr_sequencia - a.nr_sequencia),
    [filtradas, ordem]
  );

  const paginacao = usePagination(ordenadas.length, "equipes");

  // As mesmas colunas do lookup de Equipes (COLUNAS_EQUIPE).
  const colunasTabela: ResizableTableColumn<Equipe>[] = useMemo(() => COLUNAS_EQUIPE.map((c) => ({
    key: c.key,
    label: c.label,
    ...(c.dataClass ? { cellClassName: c.dataClass } : {}),
    ...(c.key === "ds_equipe" ? { width: 280 } : {}),
    render: (e: Equipe) => (
      <span className={`text-sm${c.key === "ds_equipe" ? " text-black" : ""}`}>
        {celulaEquipe(e as unknown as Record<string, unknown> & { nr_sequencia: number }, c.key)}
      </span>
    ),
  })), []);

  const filtroAtivo = Object.values(filtro).some((v) => v.trim() !== "");
  const filtrosAplicados: FiltroAplicado[] = ([
    ["nr_sequencia", "Sequência"],
    ["ds_equipe", "Descrição"],
    ["ie_status", "Status", (v: string) => rotuloStatusRelacionamento(v) || v],
  ] as [keyof FiltroEquipe, string, ((v: string) => string)?][])
    .filter(([chave]) => filtro[chave].trim() !== "")
    .map(([chave, rotulo, exibir]) => ({
      chave,
      rotulo,
      valor: exibir ? exibir(filtro[chave].trim()) : filtro[chave].trim(),
      onRemover: () => setFiltro({ ...filtro, [chave]: "" }),
    }));

  const equipeAberta = aberto?.id ? registros.find((e) => e.id === aberto.id) : undefined;
  const indiceAberta = equipeAberta ? ordenadas.findIndex((e) => e.id === equipeAberta.id) : -1;
  // Formulário de uma equipe nova pedido por um lookup: aparece mesmo com os membros abertos.
  const equipeDosMembros = membrosDe && !(novoAoAbrir && aberto) ? registros.find((e) => e.id === membrosDe) : undefined;
  const indiceMembros = equipeDosMembros ? ordenadas.findIndex((e) => e.id === equipeDosMembros.id) : -1;

  const statusDe = (campo: string): CampoStatus => campoRegras[campo] ?? "N";
  const asterisco = (campo: string) => (statusDe(campo) === "O" ? <RequiredAsterisk /> : undefined);
  const classeCampo = (campo: string, extra = "") => `${CLASSE_CAMPO} ${erros.includes(campo) ? "border-red-500" : "border-slate-300"} ${extra}`;

  function abrirEquipe(e: Equipe) {
    if (!permissoes.ver) {
      onAviso("Você não tem permissão para ver este registro.");
      return;
    }
    setSelecionadoId(e.id ?? null);
    setErros([]);
    setForm({ ds_equipe: e.ds_equipe ?? "", ie_status: e.ie_status ?? "A", ds_observacao: e.ds_observacao ?? "" });
    setAberto({ id: e.id });
  }

  function abrirMembros(e: Equipe) {
    if (!permissoes.membros) {
      onAviso("Você não tem permissão para acessar os membros da equipe.");
      return;
    }
    setSelecionadoId(e.id ?? null);
    onMessage("");
    setMembrosDe(e.id ?? null);
  }

  function novaEquipe() {
    setErros([]);
    setForm({ ds_equipe: "", ie_status: "A", ds_observacao: "" });
    setAberto({});
  }

  function fecharFormulario() {
    setErros([]);
    setAberto(null);
    onFormularioFechado?.();
  }

  function pedirExclusao(e: Equipe) {
    if (!permissoes.excluir) {
      onAviso("Você não tem permissão para excluir este registro.");
      return;
    }
    confirmar("Excluir registro", `Deseja mesmo excluir a equipe ${e.nr_sequencia}?`, async () => {
      if (!e.id) return;
      try {
        await excluirEquipe(e.id);
        if (aberto?.id === e.id) fecharFormulario();
        onMessage("Excluído com sucesso!");
      } catch (err) {
        onMessage(err instanceof Error && err.message ? err.message : "Erro ao excluir.");
      }
    });
  }

  async function salvar(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    // "Salvar e adicionar": lido e zerado já no início (se a validação barrar, o próximo Salvar não abre um novo).
    const novoAposSalvar = novoAposSalvarRef.current;
    novoAposSalvarRef.current = false;
    if (!aberto || salvando) return;
    if (aberto.id && !permissoes.editar) {
      onAviso("Você não tem permissão para editar este registro.");
      return;
    }
    const faltando = (["ds_equipe", "ie_status", "ds_observacao"] as const).filter((c) => statusDe(c) === "O" && !form[c].trim());
    setErros(faltando);
    if (faltando.length > 0) {
      onMessage("Preencha os campos obrigatórios.");
      return;
    }
    setSalvando(true);
    try {
      const dados = { ds_equipe: form.ds_equipe.trim(), ie_status: form.ie_status || "A", ds_observacao: form.ds_observacao.trim() || null } as unknown as Partial<Equipe>;
      if (aberto.id) {
        await atualizarEquipe(aberto.id, dados);
        onMessage("Registro alterado com sucesso!");
      } else {
        const criada = await criarEquipe(dados);
        setSelecionadoId(criada.id ?? null);
        onMessage("Registro criado com sucesso!");
      }
      if (novoAposSalvar) novaEquipe();
      else fecharFormulario();
    } catch (err) {
      onMessage(err instanceof Error && err.message ? `Erro ao salvar: ${err.message}` : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  function renderMenu() {
    if (!menu) return null;
    const alvo = registros.find((e) => e.id === menu.id);
    if (!alvo) return null;
    return (
      <>
        <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} onContextMenu={(e) => { e.preventDefault(); setMenu(null); }} />
        <div
          className="fixed z-50 min-w-[160px] border border-slate-200 bg-white p-[3px] flex flex-col gap-[3px]"
          style={{ left: menu.x, top: menu.y, boxShadow: "0 4px 10px rgba(0,0,0,0.18)" }}
        >
          {!menu.noVer && permissoes.ver && (
            <button type="button" className={CLASSE_ITEM_MENU} style={ESTILO_ITEM_MENU} onClick={() => { setMenu(null); abrirEquipe(alvo); }}>Ver</button>
          )}
          {/* Membros: só pelo duplo clique. Ativos (assumir ativos): só equipe ativa. */}
          {permissoes.assumirAtivos && onAssumirAtivos && (alvo.ie_status ?? "A") !== "I" && (
            <button type="button" className={CLASSE_ITEM_MENU} style={ESTILO_ITEM_MENU} onClick={() => { setMenu(null); onAssumirAtivos(alvo); }}>Ativos</button>
          )}
          {permissoes.excluir && (
            <button type="button" className={CLASSE_ITEM_MENU} style={ESTILO_ITEM_MENU} onClick={() => { setMenu(null); pedirExclusao(alvo); }}>Excluir</button>
          )}
        </div>
      </>
    );
  }

  /* ── Membros da equipe (duplo clique) ── */
  if (equipeDosMembros) {
    return (
      <MembrosDaEquipe
        {...props}
        equipe={equipeDosMembros}
        temAnterior={indiceMembros > 0}
        temProximo={indiceMembros >= 0 && indiceMembros < ordenadas.length - 1}
        anterior={() => { const e = ordenadas[indiceMembros - 1]; if (e) setMembrosDe(e.id ?? null); }}
        proximo={() => { const e = ordenadas[indiceMembros + 1]; if (e) setMembrosDe(e.id ?? null); }}
        onVoltar={() => { onMessage(""); setMembrosDe(null); }}
      />
    );
  }

  /* ── Formulário da equipe ── */
  if (aberto) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-5">
            <Select
              value={manageSelection}
              onChange={onManageSelectionChange}
              options={selectOptions.filter((o) => allowedSubmodulos.includes(o.value))}
              disabled
              showPlaceholder={false}
              className="!w-[220px]"
            />
            <Setas
              anterior={() => { const e = ordenadas[indiceAberta - 1]; if (e) abrirEquipe(e); }}
              proximo={() => { const e = ordenadas[indiceAberta + 1]; if (e) abrirEquipe(e); }}
              temAnterior={indiceAberta > 0}
              temProximo={indiceAberta >= 0 && indiceAberta < ordenadas.length - 1}
            />
          </div>
          <button type="button" onClick={fecharFormulario} className={CLASSE_LINK}>Fechar</button>
        </div>

        <form
          ref={formRef}
          onSubmit={salvar}
          className="mt-4 flex-1 flex flex-col min-h-0"
          onContextMenu={(e) => {
            if (!equipeAberta?.id) return;
            e.preventDefault();
            setMenu({ id: equipeAberta.id, x: e.clientX, y: e.clientY, noVer: true });
          }}
        >
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
              <div className="sm:col-span-1 group">
                <RotuloCampo texto="Sequência" colecao={COLECAO_EQUIPE} campo="nr_sequencia" />
                <input disabled value={String(equipeAberta?.nr_sequencia ?? "")} className="w-full rounded-[3px] border border-slate-300 px-2 py-1.5 text-sm transition focus:outline-none" />
              </div>
              <div className="sm:col-span-9 group">
                <RotuloCampo texto="Descrição" colecao={COLECAO_EQUIPE} campo="ds_equipe" prefixo={asterisco("ds_equipe")} />
                <input
                  disabled={statusDe("ds_equipe") === "D"}
                  className={classeCampo("ds_equipe")}
                  value={form.ds_equipe}
                  onChange={(e) => setForm({ ...form, ds_equipe: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2 group">
                <RotuloCampo texto="Status" colecao={COLECAO_EQUIPE} campo="ie_status" prefixo={asterisco("ie_status")} />
                <Select
                  disabled={statusDe("ie_status") === "D"}
                  error={erros.includes("ie_status")}
                  value={form.ie_status || "A"}
                  onChange={(v) => setForm({ ...form, ie_status: v })}
                  options={STATUS_RELACIONAMENTO_OPTIONS}
                  showPlaceholder={false}
                />
              </div>
              <div className="sm:col-span-12 group">
                <RotuloCampo texto="Observação" colecao={COLECAO_EQUIPE} campo="ds_observacao" prefixo={asterisco("ds_observacao")} />
                <textarea
                  rows={4}
                  disabled={statusDe("ds_observacao") === "D"}
                  className={classeCampo("ds_observacao", "resize-none")}
                  value={form.ds_observacao}
                  onChange={(e) => setForm({ ...form, ds_observacao: e.target.value })}
                />
              </div>
            </div>
          </div>
          <RodapeFormulario
            registro={equipeAberta}
            onAuditoria={() => equipeAberta?.id && onOpenAudit(COLECAO_EQUIPE, equipeAberta.id)}
            resolverNomeAutor={resolverNomeAutor}
            salvando={salvando}
            onCancelar={fecharFormulario}
            onSalvarEAdicionar={permissoes.adicionar ? () => { novoAposSalvarRef.current = true; formRef.current?.requestSubmit(); } : undefined}
          />
        </form>
        {renderMenu()}
      </div>
    );
  }

  /* ── Lista de equipes ── */
  const campoFiltro = "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]";
  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      <div className="relative flex min-h-[42px] items-center justify-between gap-3">
        {manageSelection && <FiltrosAplicados filtros={filtrosAplicados} />}
        <div className="flex items-center gap-2">
          <Select
            value={manageSelection}
            onChange={onManageSelectionChange}
            options={selectOptions.filter((o) => allowedSubmodulos.includes(o.value))}
            showPlaceholder={!manageSelection}
            className="!w-[220px]"
          />
          <button
            type="button"
            onClick={() => { setRascunho(filtro); setFiltroAberto(true); }}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-[3px] bg-transparent cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2 ${filtroAtivo ? "text-[#066fc5]" : "text-[#aaa] hover:text-[#777]"}`}
            aria-label="Abrir filtro"
            title={filtroAtivo ? "Filtro aplicado" : "Filtro"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 4h18l-7.5 9.5V20l-3-1.5v-5L3 4z" />
            </svg>
          </button>
        </div>
        {permissoes.adicionar && <button type="button" onClick={novaEquipe} className={CLASSE_LINK}>Adicionar</button>}
      </div>

      <div className="bg-white flex-1 flex flex-col min-h-0 overflow-hidden">
        {!manageSelection ? (
          <EmptySelectionMessage />
        ) : carregando ? (
          <div className="flex-1">
            <LoadingModal open message="Carregando..." />
          </div>
        ) : ordenadas.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
            <p className="mt-4 font-medium text-slate-500">Nenhum registro encontrado.</p>
            <p className="mt-1 text-sm text-slate-500">
              {filtroAtivo ? "Nenhum registro corresponde ao filtro aplicado." : 'Clique em "Adicionar" para cadastrar uma equipe.'}
            </p>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-auto">
              <ResizableTable
                key="lista-equipes"
                columns={colunasTabela}
                rows={paginacao.slice(ordenadas)}
                rowKey={(e) => e.id ?? String(e.nr_sequencia)}
                sortColumn={ordem.coluna}
                sortAsc={ordem.asc}
                onSortChange={(key) => setOrdem((atual) => proximaOrdenacao(atual, key))}
                onRowClick={(e) => setSelecionadoId((atual) => (atual === e.id ? null : e.id ?? null))}
                onRowDoubleClick={abrirMembros}
                rowPointer={() => permissoes.membros}
                onRowContextMenu={(e, ev) => {
                  ev.preventDefault();
                  setSelecionadoId(e.id ?? null);
                  setMenu({ id: e.id ?? "", x: ev.clientX, y: ev.clientY });
                }}
                rowClassName={(e) => `${selecionadoId === e.id ? "row-selected" : ""} ${e.ie_status === "I" ? "registro-desligado" : ""}`}
                {...colunas}
              />
            </div>
            <PaginationFooter
              totalRecords={ordenadas.length}
              currentPage={paginacao.currentPage}
              pageSize={paginacao.pageSize}
              onPageChange={paginacao.setCurrentPage}
              onPageSizeChange={paginacao.setPageSize}
            />
          </>
        )}
      </div>

      {renderMenu()}

      {filtroAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltroAberto(false)} />
          <form
            onSubmit={(e) => { e.preventDefault(); setFiltro(rascunho); paginacao.setCurrentPage(1); setFiltroAberto(false); }}
            className="relative w-full max-w-[980px] bg-white modal-dark p-0 shadow-xl shadow-black/20"
          >
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
              <div className="sm:col-span-2">
                <RotuloCampo texto="Sequência" colecao={COLECAO_EQUIPE} campo="nr_sequencia" />
                <input inputMode="numeric" maxLength={10} className={campoFiltro} value={rascunho.nr_sequencia} onChange={(e) => setRascunho({ ...rascunho, nr_sequencia: e.target.value.replace(/\D/g, "") })} autoFocus />
              </div>
              <div className="sm:col-span-7">
                <RotuloCampo texto="Descrição" colecao={COLECAO_EQUIPE} campo="ds_equipe" />
                <input className={campoFiltro} value={rascunho.ds_equipe} onChange={(e) => setRascunho({ ...rascunho, ds_equipe: e.target.value })} />
              </div>
              <div className="sm:col-span-3">
                <RotuloCampo texto="Status" colecao={COLECAO_EQUIPE} campo="ie_status" />
                <Select value={rascunho.ie_status} onChange={(v) => setRascunho({ ...rascunho, ie_status: v })} options={STATUS_RELACIONAMENTO_OPTIONS} />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              {onSalvarFiltro && (
                <BotaoSalvarFiltro
                  onClick={() => onSalvarFiltro({ ...rascunho }, () => { setFiltro(rascunho); paginacao.setCurrentPage(1); setFiltroAberto(false); })}
                />
              )}
              <button
                type="button"
                onClick={() => { setRascunho(FILTRO_VAZIO); setFiltro(FILTRO_VAZIO); paginacao.setCurrentPage(1); setFiltroAberto(false); }}
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

type FormMembro = Record<CampoMembro, string>;
const FORM_MEMBRO_VAZIO: FormMembro = { nr_seq_colaborador: "", nr_seq_fornecedor: "", nr_seq_prestador_servico: "" };

/** Aba Membros da equipe: lista e formulário (um lookup por tipo de membro; preenchido um, os outros desabilitam). */
function MembrosDaEquipe({
  equipe,
  selectOptions,
  manageSelection,
  onManageSelectionChange,
  allowedSubmodulos,
  opcoesMembro,
  campoRegrasMembro = {},
  onOpenAudit,
  resolverNomeAutor = (nome: string) => nome,
  onMessage,
  confirmar,
  onSavingChange,
  colunasMembros,
  configLookup,
  adicionarPeloLookup,
  temAnterior,
  temProximo,
  anterior,
  proximo,
  onVoltar,
}: EquipeViewProps & {
  equipe: Equipe;
  temAnterior: boolean;
  temProximo: boolean;
  anterior: () => void;
  proximo: () => void;
  onVoltar: () => void;
}) {
  const [membros, setMembros] = useState<EquipeMembro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ordem, setOrdem] = useOrdenacaoPersistida<{ coluna: string | null; asc: boolean }>("equipe.membros", { coluna: null, asc: true });
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number; noVer?: boolean } | null>(null);
  const [aberto, setAberto] = useState<{ id?: string } | null>(null);
  const [form, setForm] = useState<FormMembro>(FORM_MEMBRO_VAZIO);
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [lookup, setLookup] = useState<CampoMembro | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const novoAposSalvarRef = useRef(false);

  useEffect(() => {
    return observarMembrosDaEquipe(
      equipe.nr_sequencia,
      (lista) => { setMembros(lista); setCarregando(false); },
      () => { setCarregando(false); onMessage("Erro ao carregar registros."); }
    );
    // onMessage é estável o suficiente; recarrega só ao trocar de equipe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipe.nr_sequencia]);

  useEffect(() => { onSavingChange?.(salvando); }, [salvando, onSavingChange]);
  useCtrlS(formRef, salvando);

  const nomeDe = (campo: CampoMembro, nr?: number) =>
    nr ? opcoesMembro[campo].find((o) => o.nr_sequencia === nr)?.descricao ?? "" : "";

  const ordenados = useMemo(
    () => ordenarPor(membros, ordem, (m, coluna) => {
      if (coluna === "nr_seq_colaborador" || coluna === "nr_seq_fornecedor" || coluna === "nr_seq_prestador_servico") return nomeDe(coluna, m[coluna]) || null;
      if (coluna === "dt_criacao" || coluna === "dt_alteracao") return chaveInstante(m[coluna]);
      return m[coluna as keyof EquipeMembro] ?? null;
    }, (a, b) => b.nr_sequencia - a.nr_sequencia),
    // nomeDe depende de opcoesMembro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [membros, ordem, opcoesMembro]
  );

  const paginacao = usePagination(ordenados.length, `equipe_membros:${equipe.id ?? ""}`);

  const colunasTabela: ResizableTableColumn<EquipeMembro>[] = useMemo(() => [
    { key: "nr_sequencia", label: "#", cellClassName: "text-right", render: (m) => <span className="text-sm">{m.nr_sequencia}</span> },
    ...TIPOS_MEMBRO.map(({ campo, rotulo }) => ({
      key: campo,
      label: rotulo,
      width: 220,
      render: (m: EquipeMembro) => <span className="text-sm text-black">{nomeDe(campo, m[campo])}</span>,
    })),
    { key: "dt_criacao", label: "Criação", render: (m) => <span className="text-sm">{formatDate(String(m.dt_criacao ?? ""))}</span> },
    { key: "dt_alteracao", label: "Alteração", render: (m) => <span className="text-sm">{formatDate(String(m.dt_alteracao ?? ""))}</span> },
    { key: "ds_usuario_criacao", label: "Usuário criação", render: (m) => <span className="text-sm">{m.ds_usuario_criacao ?? ""}</span> },
    { key: "ds_usuario_alteracao", label: "Usuário alteração", render: (m) => <span className="text-sm">{m.ds_usuario_alteracao ?? ""}</span> },
    // nomeDe depende de opcoesMembro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [opcoesMembro]);

  const membroAberto = aberto?.id ? membros.find((m) => m.id === aberto.id) : undefined;
  const statusDe = (campo: string): CampoStatus => campoRegrasMembro[campo] ?? "N";

  /** Nome do membro (para mensagens e breadcrumb). */
  const nomeDoMembro = (m: EquipeMembro) => {
    const tipo = TIPOS_MEMBRO.find(({ campo }) => m[campo]);
    return tipo ? nomeDe(tipo.campo, m[tipo.campo]) : "";
  };

  function abrirMembro(m: EquipeMembro) {
    setSelecionadoId(m.id ?? null);
    setErros([]);
    setForm({
      nr_seq_colaborador: m.nr_seq_colaborador ? String(m.nr_seq_colaborador) : "",
      nr_seq_fornecedor: m.nr_seq_fornecedor ? String(m.nr_seq_fornecedor) : "",
      nr_seq_prestador_servico: m.nr_seq_prestador_servico ? String(m.nr_seq_prestador_servico) : "",
    });
    setAberto({ id: m.id });
  }

  function novoMembro() {
    setErros([]);
    setForm({ ...FORM_MEMBRO_VAZIO });
    setAberto({});
  }

  function fecharFormulario() {
    setErros([]);
    setAberto(null);
  }

  function pedirExclusao(m: EquipeMembro) {
    confirmar("Excluir registro", `Deseja mesmo excluir o membro ${m.nr_sequencia}?`, async () => {
      if (!m.id) return;
      try {
        await excluirMembro(m.id);
        if (aberto?.id === m.id) fecharFormulario();
        onMessage("Excluído com sucesso!");
      } catch (err) {
        onMessage(err instanceof Error && err.message ? err.message : "Erro ao excluir.");
      }
    });
  }

  async function salvar(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    // "Salvar e adicionar": lido e zerado já no início (se a validação barrar, o próximo Salvar não abre um novo).
    const novoAposSalvar = novoAposSalvarRef.current;
    novoAposSalvarRef.current = false;
    if (!aberto || salvando) return;
    // Obrigatório só o que estiver configurado em Campos x Formulários.
    const faltando = TIPOS_MEMBRO.filter(({ campo }) => statusDe(campo) === "O" && !form[campo]).map(({ campo }) => campo);
    if (faltando.length > 0) {
      setErros(faltando);
      onMessage("Preencha os campos obrigatórios.");
      return;
    }
    const preenchido = TIPOS_MEMBRO.find(({ campo }) => form[campo]);
    const nr = preenchido ? Number(form[preenchido.campo]) : 0;
    if (preenchido && !nomeDe(preenchido.campo, nr)) {
      setErros([preenchido.campo]);
      onMessage(`${preenchido.rotulo} não encontrado.`);
      return;
    }
    const repetido = preenchido ? membros.find((m) => m.id !== aberto.id && m[preenchido.campo] === nr) : undefined;
    if (preenchido && repetido) {
      setErros([preenchido.campo]);
      onMessage(`Este ${preenchido.rotulo.toLowerCase()} já é membro da equipe (${repetido.nr_sequencia}).`);
      return;
    }
    setErros([]);
    setSalvando(true);
    try {
      const dados = Object.fromEntries(TIPOS_MEMBRO.map(({ campo }) => [campo, campo === preenchido?.campo ? nr : null])) as Partial<EquipeMembro>;
      if (aberto.id) {
        await atualizarMembro(aberto.id, dados);
        onMessage("Registro alterado com sucesso!");
      } else {
        const criado = await criarMembro({ ...dados, nr_seq_equipe: equipe.nr_sequencia });
        setSelecionadoId(criado.id ?? null);
        onMessage("Registro criado com sucesso!");
      }
      if (novoAposSalvar) novoMembro();
      else fecharFormulario();
    } catch (err) {
      onMessage(err instanceof Error && err.message ? `Erro ao salvar: ${err.message}` : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  const tipoLookup = lookup ? TIPOS_MEMBRO.find((t) => t.campo === lookup) : undefined;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* ── Barra superior: dropdown pai, setas (entre as equipes) e navegação ── */}
      <div className="flex items-center justify-between gap-3 min-h-[42px]">
        <div className="flex items-center gap-2 min-w-0">
          <Select
            value={manageSelection}
            onChange={onManageSelectionChange}
            options={selectOptions.filter((o) => allowedSubmodulos.includes(o.value))}
            disabled
            showPlaceholder={false}
            className="!w-[220px]"
          />
          <Setas anterior={() => { fecharFormulario(); anterior(); }} proximo={() => { fecharFormulario(); proximo(); }} temAnterior={temAnterior} temProximo={temProximo} />
          <NavegacaoRegistros
            className="ml-2"
            itens={[
              { chave: "equipe", texto: `Equipe: ${equipe.nr_sequencia ?? ""} ${equipe.ds_equipe ?? ""}`, onClick: onVoltar },
              ...(membroAberto ? [{ chave: "membro", texto: `Membro: ${membroAberto.nr_sequencia ?? ""} ${nomeDoMembro(membroAberto)}`, onClick: fecharFormulario }] : []),
            ]}
          />
        </div>
        <div className="flex items-center gap-3">
          {!aberto && <AbasRegistros abas={[{ valor: "membros", rotulo: "Membros" }]} ativa="membros" />}
          {!aberto && <button type="button" onClick={novoMembro} className={CLASSE_LINK}>Adicionar</button>}
        </div>
      </div>

      {aberto ? (
        <form
          ref={formRef}
          onSubmit={salvar}
          className="mt-6 flex-1 flex flex-col min-h-0"
          onContextMenu={(e) => {
            if (!membroAberto?.id) return;
            e.preventDefault();
            e.stopPropagation();
            setMenu({ id: membroAberto.id, x: e.clientX, y: e.clientY, noVer: true });
          }}
        >
          <div className="grid gap-[15px] sm:grid-cols-12 pt-2">
            <div className="sm:col-span-1">
              <RotuloCampo texto="Sequência" colecao={COLECAO_EQUIPE_MEMBRO} campo="nr_sequencia" />
              <input disabled value={String(membroAberto?.nr_sequencia ?? "")} className="w-full rounded-[3px] border border-slate-300 px-2 py-1.5 text-sm transition focus:outline-none" />
            </div>
            {TIPOS_MEMBRO.map(({ campo, rotulo }, i) => {
              const outroPreenchido = TIPOS_MEMBRO.some((t) => t.campo !== campo && form[t.campo]);
              return (
                <CampoLookupReferencia
                  key={campo}
                  className={i === 0 ? "sm:col-span-11" : "sm:col-span-6"}
                  rotulo={<RotuloCampo texto={rotulo} colecao={COLECAO_EQUIPE_MEMBRO} campo={campo} prefixo={statusDe(campo) === "O" ? <RequiredAsterisk /> : undefined} />}
                  ariaLocalizar={`Localizar ${rotulo.toLowerCase()}`}
                  inputClass={`${CLASSE_CAMPO} ${erros.includes(campo) ? "border-red-500" : "border-slate-300"}`}
                  valor={form[campo]}
                  descricao={form[campo] ? nomeDe(campo, Number(form[campo])) : ""}
                  desabilitado={outroPreenchido || statusDe(campo) === "D"}
                  onChange={(v) => setForm({ ...form, [campo]: v })}
                  onLocalizar={() => setLookup(campo)}
                />
              );
            })}
          </div>
          <RodapeFormulario
            registro={membroAberto}
            onAuditoria={() => membroAberto?.id && onOpenAudit(COLECAO_EQUIPE_MEMBRO, membroAberto.id)}
            resolverNomeAutor={resolverNomeAutor}
            salvando={salvando}
            onCancelar={fecharFormulario}
            onSalvarEAdicionar={() => { novoAposSalvarRef.current = true; formRef.current?.requestSubmit(); }}
          />
        </form>
      ) : (
        <div className="mt-6 flex-1 flex flex-col min-h-0">
          {carregando && <LoadingModal open message="Carregando..." />}
          {!carregando && membros.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
              <p className="mt-4 font-medium text-slate-500">Nenhum registro encontrado.</p>
              <p className="mt-1 text-sm text-slate-500">Clique em &quot;Adicionar&quot; para cadastrar um membro.</p>
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-auto">
                <ResizableTable
                  columns={colunasTabela}
                  rows={paginacao.slice(ordenados)}
                  rowKey={(m) => m.id ?? String(m.nr_sequencia)}
                  sortColumn={ordem.coluna}
                  sortAsc={ordem.asc}
                  onSortChange={(key) => setOrdem((atual) => proximaOrdenacao(atual, key))}
                  onRowClick={(m) => setSelecionadoId((atual) => (atual === m.id ? null : m.id ?? null))}
                  onRowDoubleClick={abrirMembro}
                  onRowContextMenu={(m, e) => {
                    e.preventDefault();
                    setSelecionadoId(m.id ?? null);
                    setMenu({ id: m.id ?? "", x: e.clientX, y: e.clientY });
                  }}
                  rowClassName={(m) => (selecionadoId === m.id ? "row-selected" : "")}
                  {...colunasMembros}
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
        const alvo = membros.find((m) => m.id === menu.id);
        if (!alvo) return null;
        return (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} onContextMenu={(e) => { e.preventDefault(); setMenu(null); }} />
            <div
              className="fixed z-50 min-w-[120px] border border-slate-200 bg-white p-[3px] flex flex-col gap-[3px]"
              style={{ left: menu.x, top: menu.y, boxShadow: "0 4px 10px rgba(0,0,0,0.18)" }}
            >
              {!menu.noVer && (
                <button type="button" className={CLASSE_ITEM_MENU} style={ESTILO_ITEM_MENU} onClick={() => { setMenu(null); abrirMembro(alvo); }}>Ver</button>
              )}
              <button type="button" className={CLASSE_ITEM_MENU} style={ESTILO_ITEM_MENU} onClick={() => { setMenu(null); pedirExclusao(alvo); }}>Excluir</button>
            </div>
          </>
        );
      })()}

      {lookup && tipoLookup && configLookup && (
        <LookupModal
          key={lookup}
          {...configLookup(tipoLookup.colecao)}
          onAdicionar={adicionarPeloLookup?.(tipoLookup.colecao, () => setLookup(null), (nr) => {
            const campo = lookup;
            setForm((f) => ({ ...f, [campo]: String(nr) }));
          })}
          onClose={() => setLookup(null)}
          onSelect={(item) => {
            setForm((f) => ({ ...f, [lookup]: String(item.nr_sequencia) }));
            setLookup(null);
          }}
        />
      )}
    </div>
  );
}
