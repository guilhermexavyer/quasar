"use client";

import { useEffect, useRef, useState } from "react";
import Select from "@/components/ui/Select";
import LoadingModal from "@/components/ui/LoadingModal";
import RotuloCampo from "@/components/ui/RotuloCampo";
import ResizableTable, { type ResizableTableColumn } from "@/components/ui/ResizableTable";
import PaginationFooter, { usePagination } from "@/components/ui/PaginationFooter";
import { formatDate } from "@/lib/pessoaFisicaUtils";
import { elementoVisivel } from "@/lib/visibilidade";
import {
  ErroImportacaoRelatorio,
  excluirImportacaoRelatorio,
  importarRelatorioXml,
  obterImportacoesRelatorio,
  type ImportacaoRelatorio,
} from "@/services/relatorioSqlService";

/**
 * Gerenciador de Relatórios > Importar relatório.
 *
 *   - Lista: as importações feitas neste ambiente (arquivo, sequência e descrição do relatório
 *     criado, versão de origem, data da importação, quantidades de bandas, elementos e
 *     parâmetros e os logs).
 *   - Adicionar: um campo só, Arquivo (.xml exportado por "Exportar relatório" em outro
 *     ambiente). O Salvar confere o arquivo e cria o relatório (Origem: Importação) com os
 *     parâmetros, as bandas e os elementos; os problemas do arquivo aparecem abaixo do campo.
 *     As imagens não vêm no arquivo: nos elementos do tipo Imagem, escolha a imagem depois.
 *   - Ver: os dados da importação (somente leitura), com as setas entre os registros.
 */

const INPUT = "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500";
const BOTAO_LINK = "inline-flex items-center rounded-[3px] border border-transparent bg-transparent px-4 py-2.5 text-sm font-normal text-[#066fc5] transition cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2 active:outline active:outline-1 active:outline-[#066fc5] active:outline-offset-2";
const BOTAO_NAV = "inline-flex items-center justify-center rounded-[3px] border border-slate-300 bg-[#ddd] px-[5px] py-[5px] text-sm text-black cursor-pointer hover:bg-slate-300 disabled:opacity-40 disabled:cursor-default disabled:hover:bg-[#ddd]";
const COLECAO = "relatorio_importacao";

interface ImportacaoRelatorioViewProps {
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  /** Opções do dropdown Pai (Relatórios, Importar relatório). */
  selectOptions: { value: string; label: string }[];
  /** Pode importar (Adicionar). */
  podeImportar: boolean;
  podeExcluir: boolean;
  /** Mensagem de sucesso/erro no padrão do sistema. */
  onMensagem: (texto: string) => void;
  /** Depois de importar: recarrega a lista de relatórios. */
  onImportado?: () => void;
  onOpenAudit?: (id: string) => void;
  resolverNomeAutor?: (nome: string) => string;
  /** Abre o modal de confirmação de exclusão; `acao` roda se o usuário confirmar. */
  onConfirmarExclusao?: (mensagem: string, acao: () => void) => void;
  darkMode?: boolean;
}

const vazio = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export default function ImportacaoRelatorioView({
  manageSelection,
  onManageSelectionChange,
  selectOptions,
  podeImportar,
  podeExcluir,
  onMensagem,
  onImportado,
  onOpenAudit,
  resolverNomeAutor = (nome) => nome,
  onConfirmarExclusao,
  darkMode = false,
}: ImportacaoRelatorioViewProps) {
  const [registros, setRegistros] = useState<ImportacaoRelatorio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [gravando, setGravando] = useState(false);
  /** null = lista; "novo" = Adicionar; registro = Ver. */
  const [aberto, setAberto] = useState<ImportacaoRelatorio | "novo" | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [problemas, setProblemas] = useState<string[]>([]);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; item: ImportacaoRelatorio } | null>(null);
  const inputArquivo = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Mais recente primeiro.
  const ordenados = [...registros].sort((a, b) => Number(b.nr_sequencia ?? 0) - Number(a.nr_sequencia ?? 0));
  const paginacao = usePagination(ordenados.length, "relatorio_importacao");

  useEffect(() => {
    let ativo = true;
    obterImportacoesRelatorio()
      .then((lista) => { if (ativo) setRegistros(lista); })
      .catch(() => { if (ativo) onMensagem("Erro ao carregar as importações."); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Menu de contexto fecha com qualquer clique.
  useEffect(() => {
    if (!menu) return;
    const fechar = () => setMenu(null);
    window.addEventListener("click", fechar);
    return () => window.removeEventListener("click", fechar);
  }, [menu]);

  function abrirNovo() {
    setArquivo(null);
    setProblemas([]);
    setAberto("novo");
  }
  function ver(item: ImportacaoRelatorio) {
    setSelecionadoId(item.id ?? null);
    setProblemas([]);
    setAberto(item);
  }

  async function salvar() {
    if (aberto !== "novo" || gravando) return;
    if (!arquivo) {
      setProblemas(["Selecione o arquivo .xml do relatório exportado."]);
      return;
    }
    setProblemas([]);
    setGravando(true);
    try {
      const { importacao } = await importarRelatorioXml(await arquivo.text(), arquivo.name);
      setRegistros((lista) => [...lista, importacao]);
      setSelecionadoId(importacao.id ?? null);
      setAberto(null);
      onImportado?.();
      onMensagem(`Relatório "${importacao.ds_relatorio ?? ""}" importado com sucesso!`);
    } catch (e) {
      if (e instanceof ErroImportacaoRelatorio) setProblemas(e.problemas);
      else setProblemas([e instanceof Error && e.message ? `Erro ao importar: ${e.message}` : "Erro ao importar o relatório."]);
    } finally {
      setGravando(false);
    }
  }

  function excluir(item: ImportacaoRelatorio) {
    if (!item.id) return;
    const id = item.id;
    const acao = async () => {
      setGravando(true);
      try {
        await excluirImportacaoRelatorio(id);
        setRegistros((lista) => lista.filter((r) => r.id !== id));
        if (aberto !== "novo" && aberto?.id === id) setAberto(null);
        onMensagem("Importação excluída com sucesso! O relatório importado continua cadastrado.");
      } catch (e) {
        onMensagem(e instanceof Error && e.message ? `Erro ao excluir: ${e.message}` : "Erro ao excluir.");
      } finally {
        setGravando(false);
      }
    };
    const mensagem = `Deseja mesmo excluir o registro da importação ${item.nr_sequencia ?? ""}? O relatório importado não é excluído.`;
    if (onConfirmarExclusao) onConfirmarExclusao(mensagem, () => { void acao(); });
    else if (window.confirm(mensagem)) void acao();
  }

  // Ctrl+S salva (só no Adicionar).
  const salvarRef = useRef<() => void>(() => {});
  useEffect(() => { salvarRef.current = () => { void salvar(); }; });
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

  const colunas: ResizableTableColumn<ImportacaoRelatorio>[] = [
    { key: "nr_sequencia", label: "#", render: (r) => vazio(r.nr_sequencia) },
    { key: "ds_arquivo", label: "Arquivo", render: (r) => vazio(r.ds_arquivo) },
    { key: "nr_seq_relatorio", label: "Sequência do relatório", render: (r) => (r.nr_seq_relatorio == null ? "(excluído)" : vazio(r.nr_seq_relatorio)) },
    { key: "ds_relatorio", label: "Descrição do relatório", render: (r) => vazio(r.ds_relatorio) },
    { key: "ds_versao_sistema", label: "Versão de origem", render: (r) => vazio(r.ds_versao_sistema) },
    { key: "dt_importacao", label: "Importação", render: (r) => (r.dt_importacao ? formatDate(r.dt_importacao) : "") },
    { key: "qt_bandas", label: "Bandas", render: (r) => vazio(r.qt_bandas) },
    { key: "qt_elementos", label: "Elementos", render: (r) => vazio(r.qt_elementos) },
    { key: "qt_parametros", label: "Parâmetros", render: (r) => vazio(r.qt_parametros) },
    { key: "dt_criacao", label: "Criação", render: (r) => (r.dt_criacao ? formatDate(r.dt_criacao) : "") },
    { key: "dt_alteracao", label: "Alteração", render: (r) => (r.dt_alteracao ? formatDate(r.dt_alteracao) : "") },
    { key: "ds_usuario_criacao", label: "Usuário criação", render: (r) => vazio(r.ds_usuario_criacao) },
    { key: "ds_usuario_alteracao", label: "Usuário alteração", render: (r) => vazio(r.ds_usuario_alteracao) },
  ];

  const registroAberto = aberto && aberto !== "novo" ? aberto : null;
  const indiceAberto = registroAberto ? ordenados.findIndex((r) => r.id === registroAberto.id) : -1;
  const corBorda = darkMode ? "#2c2c31 #38383e #38383e #2c2c31" : "#999 #ccc #ccc #999";
  const corTexto = darkMode ? "#fff" : "#000";
  const campoLeitura = (texto: string, campo: string, valor: string, span: string) => (
    <div className={span || undefined}>
      <RotuloCampo texto={texto} colecao={COLECAO} campo={campo} />
      <input disabled value={valor} className={INPUT} />
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {menu && (
        <div className="fixed z-50 min-w-[160px] border border-slate-200 bg-white p-[3px] flex flex-col gap-[3px]" style={{ left: menu.x, top: menu.y, boxShadow: "0 4px 10px rgba(0,0,0,0.18)" }}>
          {[
            { label: "Ver", onClick: () => ver(menu.item) },
            ...(podeExcluir ? [{ label: "Excluir", onClick: () => excluir(menu.item) }] : []),
          ].map((acao) => (
            <button key={acao.label} type="button" className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer" style={{ padding: "0.2rem 0.4rem" }} onClick={() => { acao.onClick(); setMenu(null); }}>
              {acao.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Cabeçalho: dropdown Pai, setas (no Ver), breadcrumb e Adicionar ── */}
      <div className="flex items-center justify-between gap-3 min-h-[42px]">
        <div className="flex items-center gap-2 min-w-0">
          <Select value={manageSelection} onChange={onManageSelectionChange} options={selectOptions} showPlaceholder={!manageSelection} className="!w-[180px]" disabled={!!aberto} />
          {registroAberto && (
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => ver(ordenados[indiceAberto - 1])} disabled={indiceAberto <= 0} className={BOTAO_NAV} style={{ borderBottomColor: "#000" }} aria-label="Registro anterior">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18 9 12l6-6" /></svg>
              </button>
              <button type="button" onClick={() => ver(ordenados[indiceAberto + 1])} disabled={indiceAberto < 0 || indiceAberto >= ordenados.length - 1} className={BOTAO_NAV} style={{ borderBottomColor: "#000" }} aria-label="Próximo registro">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18 15 12 9 6" /></svg>
              </button>
            </div>
          )}
          {aberto && (
            <div className="flex items-center text-xs ml-2 whitespace-nowrap overflow-hidden px-2 py-1" style={{ color: corTexto, border: "1px solid", borderColor: corBorda }}>
              <button type="button" className="cursor-pointer hover:underline" onClick={() => setAberto(null)}>
                Importação: {registroAberto ? registroAberto.nr_sequencia : "nova"}
              </button>
            </div>
          )}
        </div>
        {!aberto && manageSelection && podeImportar && (
          <button type="button" onClick={abrirNovo} className={BOTAO_LINK}>Adicionar</button>
        )}
        {aberto && (
          <button type="button" onClick={() => setAberto(null)} className={BOTAO_LINK}>Fechar</button>
        )}
      </div>

      {!aberto ? (
        <div className="mt-6 bg-white flex-1 flex flex-col min-h-0 overflow-hidden">
          {carregando ? (
            <LoadingModal open message="Carregando..." />
          ) : ordenados.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
              <p className="mt-4 font-medium text-slate-500">Nenhum registro encontrado.</p>
              <p className="mt-1 text-sm text-slate-500">Clique em &quot;Adicionar&quot; para importar um relatório exportado por outro ambiente (arquivo .xml).</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto">
                <ResizableTable<ImportacaoRelatorio>
                  columns={colunas}
                  rows={paginacao.slice(ordenados)}
                  rowKey={(r) => String(r.id ?? r.nr_sequencia)}
                  onRowClick={(r) => setSelecionadoId(r.id ?? null)}
                  onRowDoubleClick={ver}
                  rowClassName={(r) => (r.id === selecionadoId ? "row-selected" : "")}
                  onRowContextMenu={(r, e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelecionadoId(r.id ?? null);
                    setMenu({ x: e.clientX, y: e.clientY, item: r });
                  }}
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
      ) : (
        <form
          ref={formRef}
          onSubmit={(e) => { e.preventDefault(); void salvar(); }}
          className="mt-6 flex-1 flex flex-col min-h-0"
        >
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <section>
              <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Importação</h2>
              {aberto === "novo" ? (
                // Adicionar: só o arquivo (como o campo Arquivo de Administração do Sistema > Imagens).
                <div className="grid gap-[15px] sm:grid-cols-12">
                  <div className="sm:col-span-12 group">
                    <RotuloCampo texto="Arquivo" colecao={COLECAO} campo="ds_arquivo" />
                    <input
                      type="file"
                      ref={inputArquivo}
                      accept=".xml,application/xml,text/xml"
                      className="hidden"
                      onChange={(e) => { setArquivo(e.target.files?.[0] ?? null); setProblemas([]); e.target.value = ""; }}
                    />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => inputArquivo.current?.click()}
                        className="inline-flex items-center justify-center rounded-[3px] bg-[#ddd] px-[5px] py-[5px] text-sm text-black cursor-pointer hover:bg-slate-300 whitespace-nowrap"
                        style={{ borderTop: "1px solid transparent", borderLeft: "1px solid transparent", borderRight: "1px solid transparent", borderBottom: "1px solid #000" }}
                        aria-label="Selecionar arquivo"
                      >
                        Selecionar arquivo
                      </button>
                      <input type="text" value={arquivo?.name ?? ""} disabled className={`${INPUT} ${problemas.length > 0 ? "!border-red-500" : ""} flex-1 min-w-0`} />
                    </div>
                  </div>
                  {problemas.length > 0 && (
                    <div className="sm:col-span-12 rounded-[3px] border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                      <div className="font-medium mb-1">Não foi possível importar o relatório:</div>
                      <ul className="list-disc pl-5 space-y-0.5">
                        {problemas.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ) : registroAberto && (
                // Ver: os dados da importação, só para consulta.
                <div className="space-y-[15px]">
                  {/* Linha 1: Sequência e Arquivo (como o Ver de Administração do Sistema > Imagens). */}
                  <div className="grid gap-[15px] sm:grid-cols-12">
                    {campoLeitura("Sequência", "nr_sequencia", vazio(registroAberto.nr_sequencia), "sm:col-span-2")}
                    <div className="sm:col-span-10 group">
                      <RotuloCampo texto="Arquivo" colecao={COLECAO} campo="ds_arquivo" />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center justify-center rounded-[3px] bg-[#ddd] px-[5px] py-[5px] text-sm text-black opacity-40 cursor-pointer whitespace-nowrap"
                          style={{ borderTop: "1px solid transparent", borderLeft: "1px solid transparent", borderRight: "1px solid transparent", borderBottom: "1px solid #000" }}
                          aria-label="Selecionar arquivo"
                        >
                          Selecionar arquivo
                        </button>
                        <input type="text" value={vazio(registroAberto.ds_arquivo)} disabled className={`${INPUT} flex-1 min-w-0`} />
                      </div>
                    </div>
                  </div>
                  {/* Linha 2: Sequência e Descrição do relatório criado. */}
                  <div className="grid gap-[15px] sm:grid-cols-12">
                    {campoLeitura("Sequência do relatório", "nr_seq_relatorio", registroAberto.nr_seq_relatorio == null ? "(excluído)" : vazio(registroAberto.nr_seq_relatorio), "sm:col-span-2")}
                    {campoLeitura("Descrição do relatório", "ds_relatorio", vazio(registroAberto.ds_relatorio), "sm:col-span-10")}
                  </div>
                  {/* Linha 3: Versão de origem, Importação, Bandas, Elementos e Parâmetros. */}
                  <div className="grid gap-[15px] sm:grid-cols-5">
                    {campoLeitura("Versão de origem", "ds_versao_sistema", vazio(registroAberto.ds_versao_sistema), "")}
                    {campoLeitura("Importação", "dt_importacao", registroAberto.dt_importacao ? formatDate(registroAberto.dt_importacao) : "", "")}
                    {campoLeitura("Bandas", "qt_bandas", vazio(registroAberto.qt_bandas), "")}
                    {campoLeitura("Elementos", "qt_elementos", vazio(registroAberto.qt_elementos), "")}
                    {campoLeitura("Parâmetros", "qt_parametros", vazio(registroAberto.qt_parametros), "")}
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between gap-3">
              {registroAberto && (
                <div className="text-[13px] text-slate-500">
                  {(["criacao", "alteracao"] as const).map((tipo) => (
                    <div key={tipo} className={`relative group flex items-center gap-2 ${tipo === "alteracao" ? "mt-1" : ""}`}>
                      <span>
                        {tipo === "criacao" ? "Criado" : "Alterado"} por {resolverNomeAutor(vazio(tipo === "criacao" ? registroAberto.ds_usuario_criacao : registroAberto.ds_usuario_alteracao)) || "-"} em{" "}
                        {(tipo === "criacao" ? registroAberto.dt_criacao : registroAberto.dt_alteracao) ? formatDate(String(tipo === "criacao" ? registroAberto.dt_criacao : registroAberto.dt_alteracao)) : "-"}
                      </span>
                      {onOpenAudit && registroAberto.id && (
                        <button type="button" onClick={() => onOpenAudit(registroAberto.id as string)} className="botao-auditoria inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none" aria-label="Abrir histórico de auditoria">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v4" />
                            <circle cx="12" cy="16" r="0.5" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 ml-auto">
                {aberto === "novo" && (
                <button
                  type="button"
                  onClick={() => setAberto(null)}
                  className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                  style={{ backgroundColor: "#bdbdbd", borderBottomColor: "#000" }}
                >
                  Cancelar
                </button>
                )}
                {aberto === "novo" && (
                  <button
                    type="submit"
                    disabled={gravando}
                    className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: "#003056", borderBottomColor: "#000" }}
                  >
                    Salvar
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      )}

      {gravando && <LoadingModal open message="Carregando..." />}
    </div>
  );
}
