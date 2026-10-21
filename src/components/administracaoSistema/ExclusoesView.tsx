"use client";

import { useEffect, useMemo, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Select from "@/components/ui/Select";
import { ADMIN_OPCOES_DROPDOWN } from "@/lib/permissoesUtils";
import ResizableTable, { type ConfigColunasTabela, type ResizableTableColumn } from "@/components/ui/ResizableTable";
import PaineisRedimensionaveis, { type ConfigPaineis } from "@/components/ui/PaineisRedimensionaveis";
import PaginationFooter, { usePagination } from "@/components/ui/PaginationFooter";
import CampoPesquisa from "@/components/ui/CampoPesquisa";
import { filtrarPesquisa } from "@/lib/pesquisaUtils";
import {
  COLUNAS_LOG_EXCLUSAO,
  FILHOS_EXCLUSAO,
  FUNCOES_EXCLUSAO,
  formatDate,
  type AbaFilhosExclusao,
  type FuncaoExclusao,
} from "@/lib/exclusoesUtils";
import { getDataSource } from "@/lib/relatorioDataSources";
import { obterExclusoes, type Exclusao } from "@/services/exclusaoService";

/** Navegação por duplo clique: registros abertos (do mais externo ao atual) e a aba escolhida. */
export interface NavegacaoExclusoes {
  caminho: Exclusao[];
  aba: string | null;
}

interface ExclusoesViewProps {
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  allowedSubmodulos?: string[];
  /** Função selecionada no container da esquerda (mantida pela página). */
  colecaoSelecionada: string | null;
  onColecaoSelecionadaChange: (colecao: string | null) => void;
  /** Registros abertos com duplo clique (mantidos pela página, para voltar do "Ver"). */
  navegacao: NavegacaoExclusoes;
  onNavegacaoChange: (navegacao: NavegacaoExclusoes) => void;
  /** Abre o formulário (somente leitura) do registro excluído. */
  onVer: (exclusao: Exclusao) => void;
  /** Descrições para colunas de referência (nr_seq_* → nome). */
  lookups?: Record<string, Record<number, string>>;
  resolverNomeAutor?: (nome: string) => string;
  onMessage?: (mensagem: string) => void;
  /** Colunas da lista de funções (esquerda). */
  colunasFuncoes?: ConfigColunasTabela;
  /** Colunas da lista de opções do dropdown (centro). */
  colunasDropdowns?: ConfigColunasTabela;
  /** Colunas da lista de registros excluídos, por função (direita). */
  colunasRegistros?: (colecao: string) => ConfigColunasTabela;
  paineis?: ConfigPaineis;
  darkMode?: boolean;
}

const bordaPainel = {
  borderStyle: "solid",
  borderWidth: "1px",
  borderTopColor: "#999",
  borderLeftColor: "#999",
  borderBottomColor: "#ccc",
  borderRightColor: "#ccc",
} as const;

const COLUNAS_DATA = new Set(["dt_criacao", "dt_alteracao", "dt_exclusao"]);

/** Ordenação das tabelas: crescente → decrescente → padrão (sem coluna). */
type Ordem = { coluna: string; asc: boolean } | null;
function proximaOrdem(atual: Ordem, coluna: string): Ordem {
  if (!atual || atual.coluna !== coluna) return { coluna, asc: true };
  return atual.asc ? { coluna, asc: false } : null;
}

/** Valor de uma coluna do registro excluído (dados do registro ou dados da exclusão). */
function valorBruto(ex: Exclusao, key: string): unknown {
  if (key === "dt_exclusao" || key === "ds_usuario_exclusao" || key === "ds_perfil_exclusao") return ex[key];
  return ex.dados?.[key];
}

function comparar(a: unknown, b: unknown, coluna: string): number {
  if (/^(nr_|qt_|vl_)/.test(coluna)) {
    const na = Number(a);
    const nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  }
  return String(a ?? "").localeCompare(String(b ?? ""), "pt-BR");
}

/** Nomes das funções (sem repetir), para o container da esquerda. */
const NOMES_FUNCOES = [...new Set(FUNCOES_EXCLUSAO.map((fx) => fx.funcao))];

/**
 * Administração do Sistema > Exclusões: à esquerda, as funções do sistema; no
 * centro, as opções do dropdown da função; à direita, os registros excluídos
 * da opção selecionada, com as colunas da
 * própria função + as de log e de exclusão. "Ver" (menu de contexto) abre o
 * formulário da função com os dados como estavam na exclusão. Período letivo,
 * relatório e banda abrem com duplo clique os registros-filhos excluídos
 * (feriados; bandas e parâmetros; elementos e ordenação), como nas telas originais.
 */
export default function ExclusoesView({
  manageSelection,
  onManageSelectionChange,
  allowedSubmodulos = ["exclusoes"],
  colecaoSelecionada,
  onColecaoSelecionadaChange,
  navegacao,
  onNavegacaoChange,
  onVer,
  lookups = {},
  resolverNomeAutor = (nome) => nome,
  onMessage,
  colunasFuncoes,
  colunasDropdowns,
  colunasRegistros,
  paineis,
  darkMode = false,
}: ExclusoesViewProps) {
  const [cache, setCache] = useState<Record<string, Exclusao[]>>({});
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [ordemFuncao, setOrdemFuncao] = useState<Ordem>(null);
  const [ordemDropdown, setOrdemDropdown] = useState<Ordem>(null);
  const [pesquisaFuncao, setPesquisaFuncao] = useState("");
  const [pesquisaDropdown, setPesquisaDropdown] = useState("");
  const [pesquisaRegistro, setPesquisaRegistro] = useState("");
  /** Função selecionada (esquerda); começa na função da opção já selecionada. */
  const [funcaoNome, setFuncaoNome] = useState<string | null>(
    () => FUNCOES_EXCLUSAO.find((fx) => fx.colecao === colecaoSelecionada)?.funcao ?? null
  );
  const [ordemRegistro, setOrdemRegistro] = useState<Ordem>(null);

  const { caminho } = navegacao;
  const pai = caminho.length > 0 ? caminho[caminho.length - 1] : null;
  const filhosDoPai = pai ? FILHOS_EXCLUSAO[pai.ds_colecao] : undefined;
  const abasDoPai = (filhosDoPai?.abas ?? []).filter((a) => !a.mostrar || a.mostrar(pai?.dados ?? {}));
  const abaAtual: AbaFilhosExclusao | undefined = pai ? abasDoPai.find((a) => a.aba === navegacao.aba) ?? abasDoPai[0] : undefined;

  /** Coleção cujos registros excluídos estão na tabela da direita. */
  const colecaoTabela = pai ? abaAtual?.colecao ?? null : colecaoSelecionada;
  const funcao = FUNCOES_EXCLUSAO.find((fx) => fx.colecao === colecaoTabela) ?? null;

  // Registros excluídos de cada coleção (carregados uma vez; filhos são filtrados pelo pai).
  useEffect(() => {
    if (!colecaoTabela || cache[colecaoTabela]) return;
    let cancelado = false;
    obterExclusoes(colecaoTabela)
      .then((lista) => { if (!cancelado) setCache((c) => ({ ...c, [colecaoTabela]: lista })); })
      .catch(() => {
        if (cancelado) return;
        setCache((c) => ({ ...c, [colecaoTabela]: [] }));
        onMessage?.("Erro ao carregar registros.");
      });
    return () => { cancelado = true; };
    // onMessage é só para avisar a falha; carrega ao precisar de outra coleção.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colecaoTabela, cache]);

  const carregando = !!colecaoTabela && !cache[colecaoTabela];
  const todosDaColecao = colecaoTabela ? cache[colecaoTabela] ?? [] : [];
  const campoPai = pai ? abaAtual?.campoPai : undefined;
  const seqPai = Number(pai?.dados.nr_sequencia);
  const registros = campoPai ? todosDaColecao.filter((ex) => Number(ex.dados[campoPai]) === seqPai) : todosDaColecao;

  function irPara(nova: NavegacaoExclusoes) {
    setSelecionadoId(null);
    setOrdemRegistro(null);
    onNavegacaoChange(nova);
  }

  function selecionarFuncaoNome(nome: string) {
    if (nome === funcaoNome) return;
    setFuncaoNome(nome);
    irPara({ caminho: [], aba: null });
    onColecaoSelecionadaChange(null);
  }

  function selecionarDropdown(fx: FuncaoExclusao) {
    if (fx.colecao === colecaoSelecionada && caminho.length === 0) return;
    // Recarrega a função ao selecioná-la (pode ter havido exclusões novas).
    setCache((c) => {
      const novo = { ...c };
      delete novo[fx.colecao];
      return novo;
    });
    irPara({ caminho: [], aba: null });
    onColecaoSelecionadaChange(fx.colecao);
  }

  function abrirFilhos(ex: Exclusao) {
    if (!FILHOS_EXCLUSAO[ex.ds_colecao]) return;
    irPara({ caminho: [...caminho, ex], aba: null });
  }

  // Ordem padrão (sem coluna ordenada): alfabética.
  const funcoesOrdenadas = useMemo(() => {
    const lista = [...NOMES_FUNCOES].sort((a, b) => a.localeCompare(b, "pt-BR"));
    return ordemFuncao && !ordemFuncao.asc ? lista.reverse() : lista;
  }, [ordemFuncao]);

  const dropdownsOrdenados = useMemo(() => {
    const lista = FUNCOES_EXCLUSAO.filter((fx) => fx.funcao === funcaoNome)
      .sort((a, b) => a.dropdown.localeCompare(b.dropdown, "pt-BR"));
    return ordemDropdown && !ordemDropdown.asc ? lista.reverse() : lista;
  }, [funcaoNome, ordemDropdown]);

  /** Texto exibido na célula (descrições de referência, datas e status formatados). */
  function textoCelula(ex: Exclusao, key: string): string {
    const valor = valorBruto(ex, key);
    if (valor === undefined || valor === null || valor === "") return "";
    if (COLUNAS_DATA.has(key)) return formatDate(String(valor));
    const lookup = lookups[key];
    if (lookup && key !== "nr_sequencia") return lookup[Number(valor)] ?? String(valor);
    return funcao?.formatar ? funcao.formatar(key, valor) : String(valor);
  }

  const colunasDireita: ResizableTableColumn<Exclusao>[] = useMemo(() => {
    if (!funcao) return [];
    return [...funcao.colunas, ...COLUNAS_LOG_EXCLUSAO].map((c) => ({
      key: c.key,
      label: c.label,
      cellClassName: c.alinharDireita ? "text-right" : undefined,
      render: (ex: Exclusao) => <span className="text-sm">{textoCelula(ex, c.key)}</span>,
    }));
    // textoCelula depende de funcao/lookups/resolverNomeAutor (já nas dependências).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funcao, lookups, resolverNomeAutor]);

  // Padrão: exclusão mais recente primeiro.
  const registrosFiltrados = filtrarPesquisa(registros, pesquisaRegistro, (ex) => colunasDireita.map((c) => textoCelula(ex, c.key)));
  const registrosOrdenados = [...registrosFiltrados].sort((a, b) => {
    if (!ordemRegistro) return String(b.dt_exclusao).localeCompare(String(a.dt_exclusao));
    const cmp = comparar(valorBruto(a, ordemRegistro.coluna), valorBruto(b, ordemRegistro.coluna), ordemRegistro.coluna);
    return ordemRegistro.asc ? cmp : -cmp;
  });

  const paginacao = usePagination(registrosOrdenados.length);

  // Ordenação da banda (fica dentro do próprio registro da banda).
  const ordenacaoDaBanda = pai && abaAtual?.ordenacao && Array.isArray(pai.dados.ordenacao) ? (pai.dados.ordenacao as Record<string, unknown>[]) : [];
  const camposDaBanda = getDataSource(String(pai?.dados.ie_colecao_principal ?? ""))?.campos ?? [];
  const linhasOrdenacao = ordenacaoDaBanda.map((o, i) => ({
    id: String(o.id ?? i),
    nr_sequencia: o.nr_sequencia ?? i + 1,
    campo: camposDaBanda.find((c) => c.key === o.campo)?.label ?? String(o.campo ?? ""),
    direcao: o.direcao === "desc" ? "Decrescente" : "Crescente",
  }));

  const corBreadcrumb = darkMode ? "#ddd" : "#333";
  const sublinhar = {
    onMouseEnter: (e: ReactMouseEvent<HTMLElement>) => { e.currentTarget.style.borderBottomColor = darkMode ? "#fff" : "#000"; },
    onMouseLeave: (e: ReactMouseEvent<HTMLElement>) => { e.currentTarget.style.borderBottomColor = "transparent"; },
  };
  const funcaoRaiz = FUNCOES_EXCLUSAO.find((fx) => fx.colecao === colecaoSelecionada);

  const vazio = (texto: string) => (
    <div className="flex h-full items-center justify-center p-4 text-center text-sm text-slate-500">{texto}</div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-6">
      <div className="flex min-h-[42px] items-center gap-2">
        <Select
          value={manageSelection}
          onChange={onManageSelectionChange}
          options={ADMIN_OPCOES_DROPDOWN.filter((o) => allowedSubmodulos.includes(o.value))}
          showPlaceholder={!manageSelection}
          className="!w-[180px]"
        />
      </div>

      <div className="bg-white flex-1 flex flex-col min-h-0 overflow-hidden">
        <PaineisRedimensionaveis proporcoesPadrao={[7, 7, 16]} config={paineis?.config} onChange={paineis?.onChange}>
          {/* ── Painel 1: Funções ── */}
          <div className="flex min-h-0 flex-col overflow-hidden border p-[5px]" style={bordaPainel}>
            <CampoPesquisa valor={pesquisaFuncao} onChange={setPesquisaFuncao} />
            <div className="overflow-auto flex-1 min-h-0">
              <ResizableTable
                {...colunasFuncoes}
                columns={[{ key: "funcao", label: "Função", render: (nome: string) => nome }]}
                rows={filtrarPesquisa(funcoesOrdenadas, pesquisaFuncao, (nome) => [nome])}
                rowKey={(nome) => nome}
                sortColumn={ordemFuncao?.coluna ?? null}
                sortAsc={ordemFuncao?.asc ?? true}
                onSortChange={(coluna) => setOrdemFuncao((o) => proximaOrdem(o, coluna))}
                rowClassName={(nome) => (nome === funcaoNome ? "row-selected" : "")}
                onRowClick={selecionarFuncaoNome}
              />
            </div>
          </div>

          {/* ── Painel 2: Opções do dropdown da função ── */}
          <div className="flex min-h-0 flex-col overflow-hidden border p-[5px]" style={bordaPainel}>
            {!funcaoNome ? (
              vazio("Selecione uma função.")
            ) : (
              <>
              <CampoPesquisa valor={pesquisaDropdown} onChange={setPesquisaDropdown} />
              <div className="overflow-auto flex-1 min-h-0">
                <ResizableTable
                  {...colunasDropdowns}
                  columns={[{ key: "dropdown", label: "Dropdown", render: (fx: FuncaoExclusao) => fx.dropdown }]}
                  rows={filtrarPesquisa(dropdownsOrdenados, pesquisaDropdown, (fx) => [fx.dropdown])}
                  rowKey={(fx) => fx.colecao}
                  sortColumn={ordemDropdown?.coluna ?? null}
                  sortAsc={ordemDropdown?.asc ?? true}
                  onSortChange={(coluna) => setOrdemDropdown((o) => proximaOrdem(o, coluna))}
                  rowClassName={(fx) => (fx.colecao === colecaoSelecionada ? "row-selected" : "")}
                  onRowClick={selecionarDropdown}
                />
              </div>
              </>
            )}
          </div>

          {/* ── Painel 3: Registros excluídos da opção (ou filhos do registro aberto) ── */}
          <div className="flex min-h-0 flex-col overflow-hidden border p-[5px]" style={bordaPainel}>
            {pai && funcaoRaiz && (
              <div className="mb-[5px] flex items-center justify-between gap-2">
                {/* Breadcrumb: volta para a lista da função ou para um registro aberto antes. */}
                <div
                  className="flex items-center text-xs whitespace-nowrap overflow-hidden px-2 py-1 min-w-0"
                  style={{ color: darkMode ? "#fff" : "#000", border: "1px solid", borderColor: darkMode ? "#2c2c31 #38383e #38383e #2c2c31" : "#999 #ccc #ccc #999" }}
                >
                  <span className="cursor-pointer" style={{ borderBottom: "1px solid transparent", color: corBreadcrumb }} onClick={() => irPara({ caminho: [], aba: null })} {...sublinhar}>
                    {funcaoRaiz.dropdown}
                  </span>
                  {caminho.map((ex, i) => {
                    const def = FILHOS_EXCLUSAO[ex.ds_colecao];
                    const ultimo = i === caminho.length - 1;
                    return (
                      <span key={ex.id} className="inline-flex items-center">
                        <span className="mx-1">&gt;</span>
                        <span
                          className={ultimo ? "" : "cursor-pointer"}
                          style={{ borderBottom: "1px solid transparent", color: corBreadcrumb }}
                          onClick={ultimo ? undefined : () => irPara({ caminho: caminho.slice(0, i + 1), aba: null })}
                          {...(ultimo ? {} : sublinhar)}
                        >
                          {def?.rotulo}: {String(ex.dados.nr_sequencia ?? "")} {String(ex.dados[def?.campoDescricao ?? ""] ?? "")}
                        </span>
                      </span>
                    );
                  })}
                </div>
                {abasDoPai.length > 1 && (
                  <div
                    className="flex items-center text-xs whitespace-nowrap px-2 py-1 gap-2"
                    style={{ border: "1px solid", borderColor: darkMode ? "#2c2c31 #38383e #38383e #2c2c31" : "#999 #ccc #ccc #999", color: darkMode ? "#fff" : "#000" }}
                  >
                    {abasDoPai.map((a) => (
                      <button
                        key={a.aba}
                        type="button"
                        onClick={() => irPara({ caminho, aba: a.aba })}
                        className="text-xs font-medium cursor-pointer transition"
                        style={{ borderBottom: abaAtual?.aba === a.aba ? `1px solid ${darkMode ? "#fff" : "#000"}` : "1px solid transparent", color: darkMode ? "#fff" : "#000" }}
                      >
                        {a.aba}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {pai && abaAtual?.ordenacao ? (
              linhasOrdenacao.length === 0 ? vazio("Nenhuma ordenação.") : (
                <>
                <CampoPesquisa valor={pesquisaRegistro} onChange={setPesquisaRegistro} />
                <div className="overflow-auto flex-1 min-h-0">
                  <ResizableTable
                    columns={[
                      { key: "nr_sequencia", label: "#", cellClassName: "text-right" },
                      { key: "campo", label: "Campo" },
                      { key: "direcao", label: "Direção" },
                    ]}
                    rows={filtrarPesquisa(linhasOrdenacao, pesquisaRegistro, (o) => [o.nr_sequencia, o.campo, o.direcao])}
                    rowKey={(o) => o.id}
                  />
                </div>
                </>
              )
            ) : !funcao ? (
              vazio(funcaoNome ? "Selecione uma opção do dropdown para ver os registros excluídos." : "Selecione uma função.")
            ) : carregando ? (
              vazio("Carregando...")
            ) : registros.length === 0 ? (
              vazio("Nenhum registro excluído.")
            ) : (
              <div className="flex flex-col flex-1 min-h-0">
                <CampoPesquisa valor={pesquisaRegistro} onChange={setPesquisaRegistro} />
                <div className="overflow-auto flex-1 min-h-0">
                  <ResizableTable
                    key={funcao.colecao}
                    {...colunasRegistros?.(funcao.colecao)}
                    columns={colunasDireita}
                    rows={paginacao.slice(registrosOrdenados)}
                    rowKey={(ex) => ex.id}
                    sortColumn={ordemRegistro?.coluna ?? null}
                    sortAsc={ordemRegistro?.asc ?? true}
                    onSortChange={(coluna) => setOrdemRegistro((o) => proximaOrdem(o, coluna))}
                    rowClassName={(ex) => (ex.id === selecionadoId ? "row-selected" : "")}
                    onRowClick={(ex) => setSelecionadoId((atual) => (atual === ex.id ? null : ex.id))}
                    onRowDoubleClick={abrirFilhos}
                    onRowContextMenu={(ex, e) => {
                      e.preventDefault();
                      setSelecionadoId(ex.id);
                      setMenu({ id: ex.id, x: e.clientX, y: e.clientY });
                    }}
                  />
                </div>
                <PaginationFooter
                  totalRecords={registrosOrdenados.length}
                  currentPage={paginacao.currentPage}
                  pageSize={paginacao.pageSize}
                  onPageChange={paginacao.setCurrentPage}
                  onPageSizeChange={paginacao.setPageSize}
                />
              </div>
            )}
          </div>
        </PaineisRedimensionaveis>
      </div>

      {menu && (() => {
        const alvo = registros.find((r) => r.id === menu.id);
        if (!alvo) return null;
        return (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} onContextMenu={(e) => { e.preventDefault(); setMenu(null); }} />
            <div
              className="fixed z-50 min-w-[120px] border border-slate-200 bg-white p-[3px] flex flex-col gap-[3px]"
              style={{ left: menu.x, top: menu.y, boxShadow: "0 4px 10px rgba(0,0,0,0.18)" }}
            >
              <button
                type="button"
                className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer"
                style={{ padding: "0.2rem 0.4rem" }}
                onClick={() => { setMenu(null); onVer(alvo); }}
              >
                Ver
              </button>
            </div>
          </>
        );
      })()}
    </div>
  );
}
