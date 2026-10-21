"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Select from "@/components/ui/Select";
import ResizableTable from "@/components/ui/ResizableTable";
import FieldInfoPopup from "@/components/ui/FieldInfoPopup";
import type { ConfigColunasTabela } from "@/components/ui/ResizableTable";
import { formatDate } from "@/lib/ativoUtils";
import {
  COLECAO_PARAM_CODIGO_PATRIMONIO,
  COLECAO_PARAM_COR_PERIODO_LETIVO_ANDAMENTO,
  COLECAO_PARAM_COR_PERIODO_LETIVO_ENCERRADO,
  COLECAO_PARAM_ENCERRAMENTO_AUTOMATICO_PERIODO_LETIVO,
  COLECAO_PARAM_MATRICULA_ALUNO,
  obterParametro,
  salvarParametro,
} from "@/services/parametroFuncaoService";
import { OPCOES_SEGMENTO_REGRA } from "@/lib/regraCodigoUtils";
import { CORES_STATUS_PERIODO_LETIVO_PADRAO } from "@/lib/periodoLetivoUtils";
import type { AuditAutor } from "@/services/auditService";
import { elementoVisivel } from "@/lib/visibilidade";

/**
 * Parâmetro de uma função: linha da lista + coleção onde o valor é salvo.
 * - "regra": regra de geração de código (ds_regra);
 * - "cor": cor de um status (cd_cor), com a cor padrão usada enquanto não for configurada;
 * - "simNao": dropdown "Regra" com ---/Não/Sim (ie_regra; --- equivale a Não).
 */
export interface ParametroDef {
  id: string;
  dropdown: string;
  parametro: string;
  colecao: string;
  tipo: "regra" | "cor" | "simNao";
  corPadrao?: string;
}

/** Parâmetros de configuração da função Patrimônio. */
export const PARAMETROS_PATRIMONIO: ParametroDef[] = [
  {
    id: "geracao_codigo_patrimonio",
    dropdown: "Ativos",
    parametro: "Geração do código de patrimônio",
    colecao: COLECAO_PARAM_CODIGO_PATRIMONIO,
    tipo: "regra",
  },
];

/** Parâmetros de configuração da função Estrutura Acadêmica. */
export const PARAMETROS_ESTRUTURA_ACADEMICA: ParametroDef[] = [
  {
    id: "geracao_matricula_aluno",
    dropdown: "Alunos",
    parametro: "Geração da matrícula de alunos",
    colecao: COLECAO_PARAM_MATRICULA_ALUNO,
    tipo: "regra",
  },
  {
    id: "cor_status_periodo_letivo_andamento",
    dropdown: "Período letivo",
    parametro: "Cor do status 'Em andamento'",
    colecao: COLECAO_PARAM_COR_PERIODO_LETIVO_ANDAMENTO,
    tipo: "cor",
    corPadrao: CORES_STATUS_PERIODO_LETIVO_PADRAO.A,
  },
  {
    id: "cor_status_periodo_letivo_encerrado",
    dropdown: "Período letivo",
    parametro: "Cor do status 'Encerrado'",
    colecao: COLECAO_PARAM_COR_PERIODO_LETIVO_ENCERRADO,
    tipo: "cor",
    corPadrao: CORES_STATUS_PERIODO_LETIVO_PADRAO.E,
  },
  {
    id: "encerramento_automatico_periodo_letivo",
    dropdown: "Período letivo",
    parametro: "A previsão de término encerra o período letivo automaticamente",
    colecao: COLECAO_PARAM_ENCERRAMENTO_AUTOMATICO_PERIODO_LETIVO,
    tipo: "simNao",
  },
];

/** Opções do parâmetro Sim/Não ("---" vale como Não). */
const OPCOES_SIM_NAO = [
  { value: "N", label: "Não" },
  { value: "S", label: "Sim" },
];

const AUDIT_VAZIO = { createdAt: "", updatedAt: "", createdBy: "", updatedBy: "" };

/** Tipo de cada segmento: tipo obrigatório + texto opcional (quando tipo === "texto"). */
interface Segmento {
  tipo: string;
  texto: string;
}

function segmentoVazio(): Segmento {
  return { tipo: "", texto: "" };
}

interface ParametrosDaFuncaoViewProps {
  /** Parâmetros da função (lista do painel esquerdo). */
  parametros: ParametroDef[];
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  selectOptions?: { value: string; label: string }[];
  allowedSubmodulos?: string[];
  onSaveSuccess?: (message: string) => void;
  onSavingChange?: (saving: boolean) => void;
  /** Abre o histórico de auditoria do parâmetro (coleção dele). */
  onOpenAudit?: (colecao: string) => void;
  auditAutor?: AuditAutor;
  /** Chamado depois de salvar um parâmetro (coleção dele). */
  onAfterSave?: (colecao: string) => void;
  /** Nome de exibição do autor nos logs de criação/alteração. */
  resolverNomeAutor?: (nome: string) => string;
  /** Ordem e largura das colunas salvas no usuário. */
  colunas?: ConfigColunasTabela;
}

export default function ParametrosDaFuncaoView({
  parametros,
  manageSelection,
  onManageSelectionChange,
  selectOptions = [],
  allowedSubmodulos = ["parametrosFuncao"],
  onSaveSuccess,
  onSavingChange,
  onOpenAudit,
  auditAutor,
  onAfterSave,
  resolverNomeAutor = (nome) => nome,
  colunas,
}: ParametrosDaFuncaoViewProps) {
  const [selectedParametroId, setSelectedParametroId] = useState<string | null>(null);
  const [segmentos, setSegmentos] = useState<Segmento[]>([segmentoVazio()]);
  const [segmentosDraft, setSegmentosDraft] = useState<Segmento[] | null>(null);
  const [cor, setCor] = useState("");
  const [corDraft, setCorDraft] = useState<string | null>(null);
  const [simNao, setSimNao] = useState("");
  const [simNaoDraft, setSimNaoDraft] = useState<string | null>(null);
  // Logs de criação/alteração do parâmetro selecionado.
  const [auditInfo, setAuditInfo] = useState(AUDIT_VAZIO);
  const [saving, setSaving] = useState(false);
  const [infoAberto, setInfoAberto] = useState(false);
  const [infoAnchor, setInfoAnchor] = useState<HTMLElement | null>(null);
  const handleSalvarRef = useRef<() => void>(() => {});
  const raizRef = useRef<HTMLDivElement>(null);

  const selectedParametro = parametros.find((p) => p.id === selectedParametroId) ?? null;
  const colecaoSelecionada = selectedParametro?.colecao ?? null;
  const segmentosEmEdicao = segmentosDraft ?? segmentos;
  const corPadrao = selectedParametro?.corPadrao ?? "#000000";
  const corEmEdicao = corDraft ?? (cor || corPadrao);
  const simNaoEmEdicao = simNaoDraft ?? simNao;

  /** Lê o documento do parâmetro: valor salvo + logs de criação/alteração. */
  const carregarParametro = useCallback(async (colecao: string) => {
    const doc = await obterParametro(colecao);
    if (doc?.ds_regra) {
      const parsed = parseRegra(doc.ds_regra);
      setSegmentos(parsed.length > 0 ? parsed : [segmentoVazio()]);
    }
    setCor(doc?.cd_cor ?? "");
    setSimNao(doc?.ie_regra ?? "");
    setAuditInfo(doc?.id ? {
      createdAt: doc.dt_criacao ?? "",
      updatedAt: doc.dt_alteracao ?? "",
      createdBy: doc.ds_usuario_criacao ?? "",
      updatedBy: doc.ds_usuario_alteracao ?? "",
    } : AUDIT_VAZIO);
  }, []);

  // Carrega o parâmetro selecionado
  useEffect(() => {
    if (!colecaoSelecionada) return;
    let cancelled = false;
    (async () => {
      try {
        if (!cancelled) await carregarParametro(colecaoSelecionada);
      } catch (e) {
        console.error("Erro ao carregar o parâmetro", e);
      }
    })();
    return () => { cancelled = true; };
  }, [colecaoSelecionada, carregarParametro]);

  /** Serializa segmentos para string (ex.: "AnoAtual-Hifen-Texto:ESCOLA"). */
  function serializarRegra(segs: Segmento[]): string {
    return segs
      .filter((s) => s.tipo !== "")
      .map((s) => {
        if (s.tipo === "texto" && s.texto) return `texto:${s.texto}`;
        if ((s.tipo === "sequencia_digitos" || s.tipo === "sequencial_digitos") && s.texto) return `${s.tipo}:${s.texto}`;
        return s.tipo;
      })
      .join("-");
  }

  /** Faz o parse inverso da string salva para array de segmentos. */
  function parseRegra(regra: string): Segmento[] {
    if (!regra || !regra.trim()) return [segmentoVazio()];
    return regra.split("-").filter((v) => v.trim() !== "").map((parte) => {
      if (parte.toLowerCase().startsWith("texto:")) {
        return { tipo: "texto", texto: parte.slice(6) };
      }
      if (parte.toLowerCase().startsWith("sequencia_digitos:")) {
        return { tipo: "sequencia_digitos", texto: parte.slice(18) };
      }
      if (parte.toLowerCase().startsWith("sequencial_digitos:")) {
        return { tipo: "sequencial_digitos", texto: parte.slice(19) };
      }
      return { tipo: parte, texto: "" };
    });
  }

  function adicionarSegmento(index: number) {
    const next = [...segmentosEmEdicao];
    next.splice(index + 1, 0, segmentoVazio());
    setSegmentosDraft(next);
  }

  function removerSegmento(index: number) {
    const next = [...segmentosEmEdicao];
    next.splice(index, 1);
    if (next.length === 0) next.push(segmentoVazio());
    setSegmentosDraft(next);
  }

  function atualizarSegmentoTipo(index: number, valor: string) {
    const next = [...segmentosEmEdicao];
    next[index] = { ...next[index], tipo: valor, texto: valor === "texto" ? next[index].texto : "" };
    setSegmentosDraft(next);
  }

  function atualizarSegmentoTexto(index: number, valor: string) {
    const next = [...segmentosEmEdicao];
    next[index] = { ...next[index], texto: valor };
    setSegmentosDraft(next);
  }

  function handleCancelar() {
    setSegmentosDraft(null);
    setCorDraft(null);
    setSimNaoDraft(null);
  }

  const handleSalvar = useCallback(async () => {
    if (!selectedParametro || !colecaoSelecionada) return;
    setSaving(true);
    onSavingChange?.(true);
    try {
      if (selectedParametro.tipo === "cor") {
        setCor(corEmEdicao);
        setCorDraft(null);
        await salvarParametro(colecaoSelecionada, "cd_cor", corEmEdicao, auditAutor);
      } else if (selectedParametro.tipo === "simNao") {
        setSimNao(simNaoEmEdicao);
        setSimNaoDraft(null);
        await salvarParametro(colecaoSelecionada, "ie_regra", simNaoEmEdicao, auditAutor);
      } else {
        const limpos = segmentosEmEdicao.filter((s) => s.tipo !== "");
        const salvos = limpos.length > 0 ? limpos : [segmentoVazio()];
        setSegmentos(salvos);
        setSegmentosDraft(null);
        await salvarParametro(colecaoSelecionada, "ds_regra", serializarRegra(salvos), auditAutor);
      }
      onSaveSuccess?.("Parâmetro salvo com sucesso");
      // Atualizar info de auditoria
      await carregarParametro(colecaoSelecionada);
      onAfterSave?.(colecaoSelecionada);
    } catch (e) {
      console.error("Erro ao salvar o parâmetro", e);
    } finally {
      setSaving(false);
      onSavingChange?.(false);
    }
  }, [selectedParametro, colecaoSelecionada, corEmEdicao, simNaoEmEdicao, segmentosEmEdicao, auditAutor, onSaveSuccess, onSavingChange, onAfterSave, carregarParametro]);

  // Manter ref atualizado
  useEffect(() => {
    handleSalvarRef.current = handleSalvar;
  }, [handleSalvar]);

  // Atalho Ctrl+S
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        if (!elementoVisivel(raizRef.current)) return; // função escondida: não salva
        e.preventDefault();
        if (!saving) handleSalvarRef.current();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [saving]);

  return (
    <div ref={raizRef} className="flex-1 flex flex-col min-h-0 space-y-6">
      {/* Header replicando o padrão das listagens */}
      <div className="flex min-h-[42px] items-center gap-2">
        <Select
          value={manageSelection}
          onChange={onManageSelectionChange}
          options={selectOptions.filter((o) => allowedSubmodulos.includes(o.value))}
          showPlaceholder={!manageSelection}
          className="!w-[180px]"
        />
      </div>

      <div className="bg-white flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 grid grid-cols-3 gap-3">
          {/* ── Painel 1: Lista de Parâmetros (1/3) ── */}
          <div
            className="flex min-h-0 flex-col overflow-hidden border p-[5px]"
            style={{
              borderStyle: "solid",
              borderWidth: "1px",
              borderTopColor: "#999",
              borderLeftColor: "#999",
              borderBottomColor: "#ccc",
              borderRightColor: "#ccc",
            }}
          >
            <div className="overflow-auto flex-1 min-h-0">
              <ResizableTable
                {...colunas}
                columns={[
                  { key: "dropdown", label: "Dropdown" },
                  { key: "parametro", label: "Parâmetro" },
                  // Sem colunas de auditoria: os parâmetros são padrão do sistema, não registros criados pelo usuário.
                ]}
                rows={parametros}
                rowKey={(p) => p.id}
                rowClassName={(p) => (p.id === selectedParametroId ? "row-selected" : "")}
                onRowClick={(p) => {
                  if (p.id === selectedParametroId) return;
                  // Troca de parâmetro: descarta o valor/edição do anterior até o novo carregar.
                  setSegmentos([segmentoVazio()]);
                  setSegmentosDraft(null);
                  setCor("");
                  setCorDraft(null);
                  setSimNao("");
                  setSimNaoDraft(null);
                  setAuditInfo(AUDIT_VAZIO);
                  setSelectedParametroId(p.id);
                }}
              />
            </div>
          </div>

          {/* ── Painel 2: Configuração do Parâmetro (2/3) ── */}
          <div
            className="col-span-2 flex min-h-0 flex-col overflow-hidden border p-[5px]"
            style={{
              borderStyle: "solid",
              borderWidth: "1px",
              borderTopColor: "#999",
              borderLeftColor: "#999",
              borderBottomColor: "#ccc",
              borderRightColor: "#ccc",
            }}
          >
            {!selectedParametro ? (
              <div className="flex h-full items-center justify-center p-4 text-center text-sm text-slate-500">
                Selecione um parâmetro para configurar.
              </div>
            ) : (
              <div className="flex flex-col h-full min-h-0">
                <div className="overflow-auto flex-1 min-h-0">
                  {/* Rótulo do campo (com infobutton, como os demais campos do sistema) */}
                  <div className="block text-sm mb-1" style={{ color: "#666" }}>
                    <div className="relative group inline-flex items-center gap-2">
                      <span>{selectedParametro.tipo === "cor" ? "Cor" : "Regra"}</span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setInfoAnchor(event.currentTarget);
                          setInfoAberto((v) => !v);
                        }}
                        aria-label={`Informações do campo ${selectedParametro.tipo === "cor" ? "Cor" : "Regra"}`}
                        className={`inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer transition-none ${infoAberto ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4" />
                          <circle cx="12" cy="16" r="0.5" />
                        </svg>
                      </button>
                      {infoAberto && (
                        <FieldInfoPopup
                          anchor={infoAnchor}
                          meta={{ type: "string", field: selectedParametro.tipo === "cor" ? "cd_cor" : selectedParametro.tipo === "simNao" ? "ie_regra" : "ds_regra", collection: selectedParametro.colecao }}
                          onClose={() => setInfoAberto(false)}
                        />
                      )}
                    </div>
                  </div>
                  {selectedParametro.tipo === "simNao" ? (
                    <div className="w-full">
                      <Select
                        value={simNaoEmEdicao}
                        onChange={(v) => setSimNaoDraft(v)}
                        options={OPCOES_SIM_NAO}
                        showPlaceholder
                      />
                    </div>
                  ) : selectedParametro.tipo === "cor" ? (
                    <div className="relative w-[140px]" style={{ height: 34 }}>
                      <input
                        type="color"
                        id={`cor-parametro-${selectedParametro.id}`}
                        value={corEmEdicao}
                        onChange={(e) => setCorDraft(e.target.value)}
                        className="absolute opacity-0 w-0 h-0 pointer-events-none"
                      />
                      <div
                        className="w-full h-full cursor-pointer border border-slate-300"
                        style={{ backgroundColor: corEmEdicao }}
                        onClick={() => document.getElementById(`cor-parametro-${selectedParametro.id}`)?.click()}
                      />
                    </div>
                  ) : (
                  <div className="space-y-2 w-full">
                    {segmentosEmEdicao.map((seg, index) => {
                      const isTexto = seg.tipo === "texto";
                      const isSequenciaDigitos = seg.tipo === "sequencia_digitos" || seg.tipo === "sequencial_digitos";
                      const mostraInputExtra = isTexto || isSequenciaDigitos;
                      return (
                        <div key={index} className="flex items-center gap-2 w-full">
                          <div className={mostraInputExtra ? "w-1/2 min-w-0" : "flex-1 min-w-0"}>
                            <Select
                              value={seg.tipo}
                              onChange={(v) => atualizarSegmentoTipo(index, v)}
                              options={OPCOES_SEGMENTO_REGRA}
                              showPlaceholder
                              visibleOptions={7}
                            />
                          </div>
                          {mostraInputExtra && (
                            <div className="w-1/2 min-w-0">
                              <input
                                type="text"
                                inputMode={isTexto ? 'text' : 'numeric'}
                                pattern={isTexto ? undefined : '[0-9]*'}
                                value={seg.texto}
                                onChange={(e) => {
                                  const val = isTexto ? e.target.value : e.target.value.replace(/[^0-9]/g, "");
                                  atualizarSegmentoTexto(index, val);
                                }}
                                className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                              />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => adicionarSegmento(index)}
                            className="btn-responsavel inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center cursor-pointer text-slate-700 hover:border-[#003056] hover:text-[#003056]"
                            aria-label={`Adicionar segmento após o ${index + 1}`}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M12 5v14" />
                              <path d="M5 12h14" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => removerSegmento(index)}
                            disabled={segmentosEmEdicao.length <= 1}
                            className="btn-responsavel inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center cursor-pointer text-slate-700 hover:border-red-500 hover:text-red-600 disabled:cursor-default disabled:opacity-40 disabled:hover:border-[#999] disabled:hover:text-slate-700"
                            aria-label={`Remover segmento ${index + 1}`}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M5 12h14" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>

                {/* Botões Cancelar / Salvar — canto inferior direito */}
                <div className="flex items-end justify-between gap-3 pt-[5px]">
                  {/* Logs de criação/alteração: só depois que o parâmetro for salvo pela primeira vez. */}
                  {auditInfo.createdAt && (
                  <div className="text-[13px] text-slate-500">
                    <div className="relative group flex items-center gap-2">
                      <span>Criado por {auditInfo.createdBy ? resolverNomeAutor(auditInfo.createdBy) : '-'} em {auditInfo.createdAt ? formatDate(auditInfo.createdAt) : '-'}</span>
                      <button
                        type="button"
                        aria-hidden="true"
                        onClick={() => onOpenAudit?.(selectedParametro.colecao)}
                        className="inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4" />
                          <circle cx="12" cy="16" r="0.5" />
                        </svg>
                      </button>
                    </div>
                    <div className="relative group flex items-center gap-2 mt-1">
                      <span>Alterado por {auditInfo.updatedBy ? resolverNomeAutor(auditInfo.updatedBy) : '-'} em {auditInfo.updatedAt ? formatDate(auditInfo.updatedAt) : '-'}</span>
                      <button
                        type="button"
                        aria-hidden="true"
                        onClick={() => onOpenAudit?.(selectedParametro.colecao)}
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
                  )}
                  <div className="flex items-center justify-end gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={handleCancelar}
                      className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                      style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSalvar}
                      disabled={saving}
                      className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:opacity-50"
                      style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
