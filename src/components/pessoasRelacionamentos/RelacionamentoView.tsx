"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Select from "@/components/ui/Select";
import LoadingModal from "@/components/ui/LoadingModal";
import EmptySelectionMessage from "@/components/ui/EmptySelectionMessage";
import RotuloCampo from "@/components/ui/RotuloCampo";
import RequiredAsterisk from "@/components/ui/RequiredAsterisk";
import ViewIcon from "@/components/ui/ViewIcon";
import SearchIcon from "@/components/ui/SearchIcon";
import BotaoSalvarEAdicionar from "@/components/ui/BotaoSalvarEAdicionar";
import FiltrosAplicados, { type FiltroAplicado } from "@/components/ui/FiltrosAplicados";
import ResizableTable, { proximaOrdenacao, compararValoresColuna, type ConfigColunasTabela, type ResizableTableColumn } from "@/components/ui/ResizableTable";
import PaginationFooter, { usePagination } from "@/components/ui/PaginationFooter";
import type { CampoStatus } from "@/lib/camposConfigUtils";
import { elementoVisivel } from "@/lib/visibilidade";
import { formatDate, parseDateInput } from "@/lib/pessoaFisicaUtils";
import { useOrdenacaoPersistida } from "@/lib/ordenacaoPersistida";
import {
  NOMES_RELACIONAMENTO,
  STATUS_RELACIONAMENTO_OPTIONS,
  rotuloStatusRelacionamento,
  type TipoRelacionamento,
} from "@/lib/relacionamentoUtils";
import { atualizarRelacionamento, criarRelacionamento, excluirRelacionamento } from "@/services/relacionamentoService";
import type { Relacionamento } from "@/types/relacionamento";

/** Campos do formulário (os de controle são preenchidos pelo servidor). */
interface FormRelacionamento {
  nr_seq_pessoa_fisica: string;
  nr_seq_pessoa_juridica: string;
  ie_status: string;
  dt_status: string;
  ds_motivo_status: string;
  ds_observacao: string;
}

const FORM_VAZIO: FormRelacionamento = {
  nr_seq_pessoa_fisica: "",
  nr_seq_pessoa_juridica: "",
  ie_status: "A",
  dt_status: "",
  ds_motivo_status: "",
  ds_observacao: "",
};

interface FiltroRelacionamento {
  nr_sequencia: string;
  ds_nome: string;
  nr_seq_pessoa_fisica: string;
  nr_seq_pessoa_juridica: string;
  ie_status: string;
}

const FILTRO_VAZIO: FiltroRelacionamento = { nr_sequencia: "", ds_nome: "", nr_seq_pessoa_fisica: "", nr_seq_pessoa_juridica: "", ie_status: "" };

export interface PermissoesRelacionamento {
  adicionar: boolean;
  ver: boolean;
  editar: boolean;
  excluir: boolean;
}

interface RelacionamentoViewProps {
  /** Tabela do cadastro: fornecedor ou prestador_servico. */
  colecao: TipoRelacionamento;
  registros: Relacionamento[];
  carregando: boolean;
  selectOptions: { value: string; label: string }[];
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  allowedSubmodulos: string[];
  permissoes: PermissoesRelacionamento;
  nomePessoaFisica: (nr?: number) => string;
  nomePessoaJuridica: (nr?: number) => string;
  /** Abre o lookup de pessoa física / jurídica; a sequência escolhida volta pelo callback. */
  onOpenPessoaFisicaLookup: (aoSelecionar: (nr: number) => void) => void;
  onOpenPessoaJuridicaLookup: (aoSelecionar: (nr: number) => void) => void;
  onViewPessoaFisica: (nr?: number) => void;
  onViewPessoaJuridica: (nr?: number) => void;
  /** Regras de campos do perfil ativo (Campos x Formulários) da coleção. */
  campoRegras?: Record<string, CampoStatus>;
  onOpenAudit: (colecao: string, id: string) => void;
  resolverNomeAutor?: (nome: string) => string;
  onMessage: (mensagem: string) => void;
  /** Aviso (toast amarelo), ex.: sem permissão. */
  onAviso: (mensagem: string) => void;
  confirmar: (titulo: string, mensagem: string, acao: () => void) => void;
  onSavingChange?: (salvando: boolean) => void;
  colunas?: ConfigColunasTabela;
}

const hoje = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

/** Data DD/MM/AAAA ou instante ISO → número para ordenar. */
function chaveData(valor?: string): number {
  if (!valor) return 0;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) return parseDateInput(valor) ?? 0;
  const t = Date.parse(valor);
  return Number.isNaN(t) ? 0 : t;
}

const CLASSE_CAMPO = "w-full rounded-[3px] border bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa] disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500";
const CLASSE_LINK = "inline-flex items-center rounded-[3px] border border-transparent bg-transparent px-4 py-2.5 text-sm font-normal text-[#066fc5] transition cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2 active:outline active:outline-1 active:outline-[#066fc5] active:outline-offset-2";
const CLASSE_ITEM_MENU = "w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer";

/**
 * Pessoas e Relacionamentos > Fornecedores / Prestadores de Serviço: lista (filtro, ordenação
 * pelo título da coluna, paginação, menu de contexto) e formulário (pessoa física OU jurídica,
 * status com data e motivo, observação). O status Inativo usa o estilo do colaborador Desligado.
 */
export default function RelacionamentoView({
  colecao,
  registros,
  carregando,
  selectOptions,
  manageSelection,
  onManageSelectionChange,
  allowedSubmodulos,
  permissoes,
  nomePessoaFisica,
  nomePessoaJuridica,
  onOpenPessoaFisicaLookup,
  onOpenPessoaJuridicaLookup,
  onViewPessoaFisica,
  onViewPessoaJuridica,
  campoRegras = {},
  onOpenAudit,
  resolverNomeAutor = (nome) => nome,
  onMessage,
  onAviso,
  confirmar,
  onSavingChange,
  colunas,
}: RelacionamentoViewProps) {
  const nomes = NOMES_RELACIONAMENTO[colecao];
  const [ordem, setOrdem] = useOrdenacaoPersistida<{ coluna: string | null; asc: boolean }>(`${colecao}.lista`, { coluna: null, asc: true });
  const [filtro, setFiltro] = useOrdenacaoPersistida<FiltroRelacionamento>(`${colecao}.filtro`, FILTRO_VAZIO);
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [rascunho, setRascunho] = useState<FiltroRelacionamento>(FILTRO_VAZIO);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  /** Formulário aberto: `id` do registro em edição (ausente = novo). null = lista. */
  const [aberto, setAberto] = useState<{ id?: string } | null>(null);
  const [form, setForm] = useState<FormRelacionamento>(FORM_VAZIO);
  const [statusOriginal, setStatusOriginal] = useState("A");
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const novoAposSalvarRef = useRef(false);

  useEffect(() => { onSavingChange?.(salvando); }, [salvando, onSavingChange]);

  // Ctrl+S salva o formulário aberto (só o que está visível na tela).
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
  }, [salvando]);

  const nomeDoRegistro = (r: Relacionamento) =>
    r.nr_seq_pessoa_juridica ? nomePessoaJuridica(r.nr_seq_pessoa_juridica) : nomePessoaFisica(r.nr_seq_pessoa_fisica);

  /* ── Lista ── */

  const filtrados = useMemo(() => {
    const nome = filtro.ds_nome.trim().toLowerCase();
    return registros.filter((r) => {
      if (filtro.nr_sequencia && String(r.nr_sequencia) !== filtro.nr_sequencia.trim()) return false;
      if (filtro.nr_seq_pessoa_fisica && String(r.nr_seq_pessoa_fisica ?? "") !== filtro.nr_seq_pessoa_fisica.trim()) return false;
      if (filtro.nr_seq_pessoa_juridica && String(r.nr_seq_pessoa_juridica ?? "") !== filtro.nr_seq_pessoa_juridica.trim()) return false;
      if (filtro.ie_status && (r.ie_status ?? "A") !== filtro.ie_status) return false;
      if (nome && !nomeDoRegistro(r).toLowerCase().includes(nome)) return false;
      return true;
    });
    // nomeDoRegistro depende só das funções de nome (estáveis o bastante entre as renderizações).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registros, filtro, nomePessoaFisica, nomePessoaJuridica]);

  const ordenados = useMemo(() => {
    const coluna = ordem.coluna;
    if (!coluna) return [...filtrados].sort((a, b) => b.nr_sequencia - a.nr_sequencia); // padrão: mais recente primeiro
    const valor = (r: Relacionamento): unknown => {
      if (coluna === "nr_seq_pessoa_fisica") return nomePessoaFisica(r.nr_seq_pessoa_fisica);
      if (coluna === "nr_seq_pessoa_juridica") return nomePessoaJuridica(r.nr_seq_pessoa_juridica);
      if (coluna === "ie_status") return rotuloStatusRelacionamento(r.ie_status);
      if (coluna === "dt_status" || coluna === "dt_criacao" || coluna === "dt_alteracao") return chaveData(r[coluna]) || null;
      return r[coluna as keyof Relacionamento] ?? null;
    };
    const vazio = (v: unknown) => v === null || v === undefined || v === "";
    return [...filtrados].sort((x, y) => {
      const a = valor(x);
      const b = valor(y);
      if (vazio(a) || vazio(b)) return vazio(a) === vazio(b) ? 0 : vazio(a) ? 1 : -1;
      const cmp = compararValoresColuna(a, b);
      return ordem.asc ? cmp : -cmp;
    });
  }, [filtrados, ordem, nomePessoaFisica, nomePessoaJuridica]);

  const paginacao = usePagination(ordenados.length, colecao);

  const colunasTabela: ResizableTableColumn<Relacionamento>[] = useMemo(() => [
    { key: "nr_sequencia", label: "#", cellClassName: "text-right", render: (r) => <span className="text-sm">{r.nr_sequencia}</span> },
    { key: "nr_seq_pessoa_fisica", label: "Pessoa física", width: 240, render: (r) => <span className="text-sm text-black">{nomePessoaFisica(r.nr_seq_pessoa_fisica)}</span> },
    { key: "nr_seq_pessoa_juridica", label: "Pessoa jurídica", width: 240, render: (r) => <span className="text-sm text-black">{nomePessoaJuridica(r.nr_seq_pessoa_juridica)}</span> },
    { key: "ie_status", label: "Status", render: (r) => <span className="text-sm">{rotuloStatusRelacionamento(r.ie_status ?? "A")}</span> },
    { key: "dt_status", label: "Data do status", render: (r) => <span className="text-sm">{r.dt_status ?? ""}</span> },
    { key: "dt_criacao", label: "Criação", render: (r) => <span className="text-sm">{formatDate(String(r.dt_criacao ?? ""))}</span> },
    { key: "dt_alteracao", label: "Alteração", render: (r) => <span className="text-sm">{formatDate(String(r.dt_alteracao ?? ""))}</span> },
    { key: "ds_usuario_criacao", label: "Usuário criação", render: (r) => <span className="text-sm">{r.ds_usuario_criacao ?? ""}</span> },
    { key: "ds_usuario_alteracao", label: "Usuário alteração", render: (r) => <span className="text-sm">{r.ds_usuario_alteracao ?? ""}</span> },
  ], [nomePessoaFisica, nomePessoaJuridica]);

  const filtroAtivo = Object.values(filtro).some((v) => v.trim() !== "");
  const rotulosFiltro: [keyof FiltroRelacionamento, string, ((v: string) => string)?][] = [
    ["nr_sequencia", "Sequência"],
    ["ds_nome", "Nome"],
    ["nr_seq_pessoa_fisica", "Pessoa física", (v) => nomePessoaFisica(Number(v)) || v],
    ["nr_seq_pessoa_juridica", "Pessoa jurídica", (v) => nomePessoaJuridica(Number(v)) || v],
    ["ie_status", "Status", (v) => rotuloStatusRelacionamento(v) || v],
  ];
  const filtrosAplicados: FiltroAplicado[] = rotulosFiltro
    .filter(([chave]) => filtro[chave].trim() !== "")
    .map(([chave, rotulo, exibir]) => ({
      chave,
      rotulo,
      valor: exibir ? exibir(filtro[chave].trim()) : filtro[chave].trim(),
      onRemover: () => setFiltro({ ...filtro, [chave]: "" }),
    }));

  /* ── Formulário ── */

  const registroAberto = aberto?.id ? registros.find((r) => r.id === aberto.id) : undefined;
  const indiceAberto = registroAberto ? ordenados.findIndex((r) => r.id === registroAberto.id) : -1;

  const statusDe = (campo: string): CampoStatus => campoRegras[campo] ?? "N";
  const asterisco = (campo: string) => (statusDe(campo) === "O" ? <RequiredAsterisk /> : undefined);
  const classeCampo = (campo: string, extra = "") => `${CLASSE_CAMPO} ${erros.includes(campo) ? "border-red-500" : "border-slate-300"} ${extra}`;

  function abrirRegistro(r: Relacionamento) {
    if (!permissoes.ver) {
      onAviso("Você não tem permissão para ver este registro.");
      return;
    }
    setSelecionadoId(r.id ?? null);
    setErros([]);
    setStatusOriginal(r.ie_status ?? "A");
    setForm({
      nr_seq_pessoa_fisica: r.nr_seq_pessoa_fisica ? String(r.nr_seq_pessoa_fisica) : "",
      nr_seq_pessoa_juridica: r.nr_seq_pessoa_juridica ? String(r.nr_seq_pessoa_juridica) : "",
      ie_status: r.ie_status ?? "A",
      dt_status: r.dt_status ?? "",
      ds_motivo_status: r.ds_motivo_status ?? "",
      ds_observacao: r.ds_observacao ?? "",
    });
    setAberto({ id: r.id });
  }

  function novoRegistro() {
    setErros([]);
    setStatusOriginal("A");
    setForm({ ...FORM_VAZIO });
    setAberto({});
  }

  function fecharFormulario() {
    setErros([]);
    setAberto(null);
  }

  function navegar(delta: number) {
    const proximo = ordenados[indiceAberto + delta];
    if (proximo) abrirRegistro(proximo);
  }

  function pedirExclusao(r: Relacionamento) {
    if (!permissoes.excluir) {
      onAviso("Você não tem permissão para excluir este registro.");
      return;
    }
    confirmar("Excluir registro", `Deseja mesmo excluir ${nomes.artigo} ${nomes.singular.toLowerCase()} ${r.nr_sequencia}?`, async () => {
      if (!r.id) return;
      try {
        await excluirRelacionamento(colecao, r.id);
        if (aberto?.id === r.id) fecharFormulario();
        onMessage("Excluído com sucesso!");
      } catch (err) {
        onMessage(err instanceof Error && err.message ? err.message : "Erro ao excluir.");
      }
    });
  }

  function mudarStatus(v: string) {
    // Data do status: o dia em que o status mudou (voltando ao original, volta a data salva).
    const salvo = registroAberto?.dt_status ?? "";
    setForm((f) => ({ ...f, ie_status: v, dt_status: v === statusOriginal ? salvo : hoje() }));
  }

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!aberto || salvando) return;
    if (aberto.id && !permissoes.editar) {
      onAviso("Você não tem permissão para editar este registro.");
      return;
    }
    const faltando = (Object.keys(FORM_VAZIO) as (keyof FormRelacionamento)[])
      .filter((c) => statusDe(c) === "O" && !String(form[c] ?? "").trim());
    setErros(faltando);
    if (faltando.length > 0) {
      onMessage("Preencha os campos obrigatórios.");
      return;
    }
    const pf = Number(form.nr_seq_pessoa_fisica) || null;
    const pj = Number(form.nr_seq_pessoa_juridica) || null;
    if (pf && !nomePessoaFisica(pf)) { setErros(["nr_seq_pessoa_fisica"]); onMessage("Pessoa física não encontrada."); return; }
    if (pj && !nomePessoaJuridica(pj)) { setErros(["nr_seq_pessoa_juridica"]); onMessage("Pessoa jurídica não encontrada."); return; }
    const duplicado = registros.find((r) => r.id !== aberto.id && ((pf && r.nr_seq_pessoa_fisica === pf) || (pj && r.nr_seq_pessoa_juridica === pj)));
    if (duplicado) {
      setErros([pf ? "nr_seq_pessoa_fisica" : "nr_seq_pessoa_juridica"]);
      onMessage(`Esta pessoa já está cadastrada como ${nomes.singular.toLowerCase()} (${duplicado.nr_sequencia}).`);
      return;
    }
    setSalvando(true);
    try {
      const dados = {
        nr_seq_pessoa_fisica: pf,
        nr_seq_pessoa_juridica: pj,
        ie_status: form.ie_status || "A",
        dt_status: form.dt_status || null,
        ds_motivo_status: form.ds_motivo_status.trim() || null,
        ds_observacao: form.ds_observacao.trim() || null,
      } as unknown as Partial<Relacionamento>;
      if (aberto.id) {
        await atualizarRelacionamento(colecao, aberto.id, dados);
        onMessage("Registro alterado com sucesso!");
      } else {
        const criado = await criarRelacionamento(colecao, dados);
        setSelecionadoId(criado.id ?? null);
        onMessage("Registro criado com sucesso!");
      }
      if (novoAposSalvarRef.current) novoRegistro();
      else fecharFormulario();
    } catch (err) {
      onMessage(err instanceof Error && err.message ? `Erro ao salvar: ${err.message}` : "Erro ao salvar.");
    } finally {
      novoAposSalvarRef.current = false;
      setSalvando(false);
    }
  }

  const classeSeta = (ativo: boolean) =>
    `inline-flex items-center justify-center rounded-[3px] border border-slate-300 bg-[#ddd] px-[5px] py-[5px] text-sm text-black cursor-pointer ${ativo ? "hover:bg-slate-300" : "opacity-40"}`;

  /** Pessoa física / jurídica: sequência, nome e botões de ver e localizar (uma desabilita a outra). */
  function campoPessoa(tipo: "pf" | "pj") {
    const chave = tipo === "pf" ? "nr_seq_pessoa_fisica" : "nr_seq_pessoa_juridica";
    const outra = tipo === "pf" ? form.nr_seq_pessoa_juridica : form.nr_seq_pessoa_fisica;
    const valor = form[chave];
    const desabilitado = statusDe(chave) === "D" || !!outra;
    const nome = valor ? (tipo === "pf" ? nomePessoaFisica(Number(valor)) : nomePessoaJuridica(Number(valor))) : "";
    const rotulo = tipo === "pf" ? "Pessoa física" : "Pessoa jurídica";
    return (
      <div className={`${tipo === "pf" ? "sm:col-span-5" : "sm:col-span-6"} group`}>
        <RotuloCampo texto={rotulo} colecao={colecao} campo={chave} prefixo={asterisco(chave)} />
        <div className="flex items-center gap-2 flex-nowrap">
          <div style={{ width: 110 }}>
            <input
              inputMode="numeric"
              maxLength={10}
              disabled={desabilitado}
              className={classeCampo(chave)}
              value={valor}
              onChange={(e) => setForm({ ...form, [chave]: e.target.value.replace(/\D/g, "").slice(0, 10) })}
            />
          </div>
          <div className="relative flex-1 min-w-0">
            <input
              readOnly
              tabIndex={-1}
              disabled={!!outra}
              className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:outline-none disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500"
              value={nome}
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              {valor && (
                <button
                  type="button"
                  onClick={() => (tipo === "pf" ? onViewPessoaFisica(Number(valor)) : onViewPessoaJuridica(Number(valor)))}
                  className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup"
                  aria-label={`Visualizar ${rotulo.toLowerCase()}`}
                >
                  <ViewIcon />
                </button>
              )}
              <button
                type="button"
                disabled={desabilitado}
                onClick={() => {
                  const aoSelecionar = (nr: number) => setForm((f) => ({ ...f, [chave]: String(nr) }));
                  if (tipo === "pf") onOpenPessoaFisicaLookup(aoSelecionar);
                  else onOpenPessoaJuridicaLookup(aoSelecionar);
                }}
                className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup disabled:cursor-default disabled:opacity-40"
                aria-label={`Localizar ${rotulo.toLowerCase()}`}
              >
                <SearchIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => navegar(-1)} disabled={indiceAberto <= 0} className={classeSeta(indiceAberto > 0)} style={{ borderBottomColor: "#000" }} aria-label="Registro anterior">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18 9 12l6-6" /></svg>
              </button>
              <button type="button" onClick={() => navegar(1)} disabled={indiceAberto < 0 || indiceAberto >= ordenados.length - 1} className={classeSeta(indiceAberto >= 0 && indiceAberto < ordenados.length - 1)} style={{ borderBottomColor: "#000" }} aria-label="Próximo registro">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </div>
          <button type="button" onClick={fecharFormulario} className={CLASSE_LINK}>Fechar</button>
        </div>

        <form
          ref={formRef}
          onSubmit={salvar}
          className="mt-4 flex-1 flex flex-col min-h-0"
          onContextMenu={(e) => {
            // "Ver" do registro: o menu dele.
            if (!registroAberto?.id) return;
            e.preventDefault();
            setMenu({ id: registroAberto.id, x: e.clientX, y: e.clientY });
          }}
        >
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-9">
            <section>
              <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Identificação</h2>
              <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
                <div className="sm:col-span-1 group">
                  <RotuloCampo texto="Sequência" colecao={colecao} campo="nr_sequencia" />
                  <input disabled value={String(registroAberto?.nr_sequencia ?? "")} className="w-full rounded-[3px] border border-slate-300 px-2 py-1.5 text-sm transition focus:outline-none" />
                </div>
                {campoPessoa("pf")}
                {campoPessoa("pj")}

                <div className="sm:col-span-2 group">
                  <RotuloCampo texto="Status" colecao={colecao} campo="ie_status" prefixo={asterisco("ie_status")} />
                  <Select
                    disabled={statusDe("ie_status") === "D"}
                    error={erros.includes("ie_status")}
                    value={form.ie_status || "A"}
                    onChange={mudarStatus}
                    options={STATUS_RELACIONAMENTO_OPTIONS}
                    showPlaceholder={false}
                  />
                </div>
                <div className="sm:col-span-2 group">
                  <RotuloCampo texto="Data do status" colecao={colecao} campo="dt_status" />
                  <input disabled placeholder="DD/MM/AAAA" className={`${CLASSE_CAMPO} border-slate-300`} value={form.dt_status} />
                </div>
                <div className="sm:col-span-12 group">
                  <RotuloCampo texto="Motivo do status" colecao={colecao} campo="ds_motivo_status" prefixo={asterisco("ds_motivo_status")} />
                  <textarea
                    rows={3}
                    disabled={statusDe("ds_motivo_status") === "D"}
                    className={classeCampo("ds_motivo_status", "resize-none")}
                    value={form.ds_motivo_status}
                    onChange={(e) => setForm({ ...form, ds_motivo_status: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-12 group">
                  <RotuloCampo texto="Observação" colecao={colecao} campo="ds_observacao" prefixo={asterisco("ds_observacao")} />
                  <textarea
                    rows={4}
                    disabled={statusDe("ds_observacao") === "D"}
                    className={classeCampo("ds_observacao", "resize-none")}
                    value={form.ds_observacao}
                    onChange={(e) => setForm({ ...form, ds_observacao: e.target.value })}
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between gap-3">
              {registroAberto && (
                <div className="text-[13px] text-slate-500">
                  {([
                    ["Criado", registroAberto.ds_usuario_criacao, registroAberto.dt_criacao],
                    ["Alterado", registroAberto.ds_usuario_alteracao, registroAberto.dt_alteracao],
                  ] as const).map(([acao, autor, data], i) => (
                    <div key={acao} className={`relative group flex items-center gap-2 ${i > 0 ? "mt-1" : ""}`}>
                      <span>{acao} por {resolverNomeAutor(autor ?? "") || "-"} em {data ? formatDate(data) : "-"}</span>
                      <button
                        type="button"
                        aria-hidden="true"
                        onClick={() => registroAberto.id && onOpenAudit(colecao, registroAberto.id)}
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
                {permissoes.adicionar && (
                  <BotaoSalvarEAdicionar
                    disabled={salvando}
                    onClick={() => {
                      novoAposSalvarRef.current = true;
                      formRef.current?.requestSubmit();
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={fecharFormulario}
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
        </form>
        {renderMenu(true)}
      </div>
    );
  }

  function renderMenu(noVer = false) {
    if (!menu) return null;
    const alvo = registros.find((r) => r.id === menu.id);
    if (!alvo) return null;
    return (
      <>
        <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} onContextMenu={(e) => { e.preventDefault(); setMenu(null); }} />
        <div
          className="fixed z-50 min-w-[160px] border border-slate-200 bg-white p-[3px] flex flex-col gap-[3px]"
          style={{ left: menu.x, top: menu.y, boxShadow: "0 4px 10px rgba(0,0,0,0.18)" }}
        >
          {!noVer && permissoes.ver && (
            <button type="button" className={CLASSE_ITEM_MENU} style={{ padding: "0.2rem 0.4rem" }} onClick={() => { setMenu(null); abrirRegistro(alvo); }}>Ver</button>
          )}
          {permissoes.excluir && (
            <button type="button" className={CLASSE_ITEM_MENU} style={{ padding: "0.2rem 0.4rem" }} onClick={() => { setMenu(null); pedirExclusao(alvo); }}>Excluir</button>
          )}
        </div>
      </>
    );
  }

  const campoFiltro = "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]";
  const campoPessoaFiltro = (chave: "nr_seq_pessoa_fisica" | "nr_seq_pessoa_juridica", rotulo: string) => (
    <div className="sm:col-span-6">
      <RotuloCampo texto={rotulo} colecao={colecao} campo={chave} />
      <div className="flex items-center gap-2 flex-nowrap">
        <div className="w-[90px] shrink-0">
          <input
            inputMode="numeric"
            maxLength={10}
            className={campoFiltro}
            value={rascunho[chave]}
            onChange={(e) => setRascunho({ ...rascunho, [chave]: e.target.value.replace(/\D/g, "").slice(0, 10) })}
          />
        </div>
        <div className="relative flex-1 min-w-0">
          <input
            readOnly
            tabIndex={-1}
            className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[36px] py-1.5 text-sm text-slate-700 focus:outline-none"
            value={rascunho[chave] ? (chave === "nr_seq_pessoa_fisica" ? nomePessoaFisica(Number(rascunho[chave])) : nomePessoaJuridica(Number(rascunho[chave]))) : ""}
          />
          <button
            type="button"
            onClick={() => {
              const aoSelecionar = (nr: number) => setRascunho((atual) => ({ ...atual, [chave]: String(nr) }));
              if (chave === "nr_seq_pessoa_fisica") onOpenPessoaFisicaLookup(aoSelecionar);
              else onOpenPessoaJuridicaLookup(aoSelecionar);
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup"
            aria-label={`Localizar ${rotulo.toLowerCase()}`}
          >
            <SearchIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );

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
        {permissoes.adicionar && (
          <button type="button" onClick={novoRegistro} className={CLASSE_LINK}>Adicionar</button>
        )}
      </div>

      <div className="bg-white flex-1 flex flex-col min-h-0 overflow-hidden">
        {!manageSelection ? (
          <EmptySelectionMessage />
        ) : carregando ? (
          <div className="flex-1">
            <LoadingModal open message="Carregando..." />
          </div>
        ) : ordenados.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
            <p className="mt-4 font-medium text-slate-500">Nenhum registro encontrado.</p>
            <p className="mt-1 text-sm text-slate-500">
              {filtroAtivo ? "Nenhum registro corresponde ao filtro aplicado." : `Clique em "Adicionar" para cadastrar ${nomes.adicionar}.`}
            </p>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-auto">
              <ResizableTable
                key={`lista-${colecao}`}
                columns={colunasTabela}
                rows={paginacao.slice(ordenados)}
                rowKey={(r) => r.id ?? String(r.nr_sequencia)}
                sortColumn={ordem.coluna}
                sortAsc={ordem.asc}
                onSortChange={(key) => setOrdem((atual) => proximaOrdenacao(atual, key))}
                onRowClick={(r) => setSelecionadoId((atual) => (atual === r.id ? null : r.id ?? null))}
                onRowDoubleClick={abrirRegistro}
                onRowContextMenu={(r, e) => {
                  e.preventDefault();
                  setSelecionadoId(r.id ?? null);
                  setMenu({ id: r.id ?? "", x: e.clientX, y: e.clientY });
                }}
                rowClassName={(r) => `${selecionadoId === r.id ? "row-selected" : ""} ${r.ie_status === "I" ? "registro-desligado" : ""}`}
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
                <RotuloCampo texto="Sequência" colecao={colecao} campo="nr_sequencia" />
                <input
                  inputMode="numeric"
                  maxLength={10}
                  className={campoFiltro}
                  value={rascunho.nr_sequencia}
                  onChange={(e) => setRascunho({ ...rascunho, nr_sequencia: e.target.value.replace(/\D/g, "") })}
                  autoFocus
                />
              </div>
              <div className="sm:col-span-7">
                <RotuloCampo texto="Nome / Razão social" colecao="pessoa_fisica" campo="ds_nome" />
                <input className={campoFiltro} value={rascunho.ds_nome} onChange={(e) => setRascunho({ ...rascunho, ds_nome: e.target.value })} />
              </div>
              <div className="sm:col-span-3">
                <RotuloCampo texto="Status" colecao={colecao} campo="ie_status" />
                <Select value={rascunho.ie_status} onChange={(v) => setRascunho({ ...rascunho, ie_status: v })} options={STATUS_RELACIONAMENTO_OPTIONS} />
              </div>
              {campoPessoaFiltro("nr_seq_pessoa_fisica", "Pessoa física")}
              {campoPessoaFiltro("nr_seq_pessoa_juridica", "Pessoa jurídica")}
            </div>
            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
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
