"use client";

import { useEffect, useState } from "react";
import Select from "@/components/ui/Select";
import ResizableTable from "@/components/ui/ResizableTable";
import {
  obterParamCodigoPatrimonio,
  salvarParamCodigoPatrimonio,
} from "@/services/paramCodigoPatrimonioService";

/** Parâmetros de configuração da função Patrimônio. */
const PARAMETROS_PATRIMONIO = [
  {
    id: "geracao_codigo_patrimonio",
    dropdown: "Ativos",
    parametro: "Geração do código de patrimônio",
  },
];

/** Opções disponíveis para os segmentos do código de patrimônio (ordem alfabética). */
const OPCOES_CODIGO = [
  { value: "ano_atual", label: "Ano atual" },
  { value: "ano_atual_2", label: "Ano atual (2 dígitos)" },
  { value: "chave_esquerda", label: "Chave esquerda" },
  { value: "chave_direita", label: "Chave direita" },
  { value: "colchete_esquerdo", label: "Colchete esquerdo" },
  { value: "colchete_direito", label: "Colchete direito" },
  { value: "data_atual", label: "Data atual" },
  { value: "data_atual_2digitos", label: "Data atual (ano com 2 dígitos)" },
  { value: "data_atual_2digitos_mascara", label: "Data atual (ano com 2 dígitos + máscara)" },
  { value: "data_atual_mascara", label: "Data atual (máscara)" },
  { value: "dia_atual", label: "Dia atual" },
  { value: "dois_pontos", label: "Dois pontos" },
  { value: "hifen", label: "Hífen" },
  { value: "mes_atual", label: "Mês atual" },
  { value: "parentese_esquerdo", label: "Parêntese esquerdo" },
  { value: "parentese_direito", label: "Parêntese direito" },
  { value: "ponto", label: "Ponto" },
  { value: "sequencial", label: "Sequencial" },
  { value: "sequencial_ano", label: "Sequencial (por ano)" },
  { value: "sequencial_mes", label: "Sequencial (por mês)" },
  { value: "sequencia", label: "Sequência" },
  { value: "sequencia_digitos", label: "Sequência (dígitos)" },
  { value: "texto", label: "Texto" },
];

/** Tipo de cada segmento: tipo obrigatório + texto opcional (quando tipo === "texto"). */
interface Segmento {
  tipo: string;
  texto: string;
}

function segmentoVazio(): Segmento {
  return { tipo: "", texto: "" };
}

interface ParametrosDaFuncaoViewProps {
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  allowedSubmodulos?: string[];
  onSaveSuccess?: (message: string) => void;
  onSavingChange?: (saving: boolean) => void;
}

export default function ParametrosDaFuncaoView({
  manageSelection,
  onManageSelectionChange,
  allowedSubmodulos = ["parametrosFuncao"],
  onSaveSuccess,
  onSavingChange,
}: ParametrosDaFuncaoViewProps) {
  const [selectedParametroId, setSelectedParametroId] = useState<string | null>(null);
  const [segmentos, setSegmentos] = useState<Segmento[]>([segmentoVazio()]);
  const [segmentosDraft, setSegmentosDraft] = useState<Segmento[] | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedParametro = PARAMETROS_PATRIMONIO.find((p) => p.id === selectedParametroId) ?? null;
  const segmentosEmEdicao = segmentosDraft ?? segmentos;

  // Carrega a regra salva ao montar o componente
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const doc = await obterParamCodigoPatrimonio();
        if (cancelled) return;
        if (doc?.ds_regra) {
          const parsed = parseRegra(doc.ds_regra);
          setSegmentos(parsed.length > 0 ? parsed : [segmentoVazio()]);
        }
      } catch (e) {
        console.error("Erro ao carregar regra de código de patrimônio", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /** Serializa segmentos para string (ex.: "AnoAtual-Hifen-Texto:ESCOLA"). */
  function serializarRegra(segs: Segmento[]): string {
    return segs
      .filter((s) => s.tipo !== "")
      .map((s) => {
        if (s.tipo === "texto" && s.texto) return `texto:${s.texto}`;
        if (s.tipo === "sequencia_digitos" && s.texto) return `sequencia_digitos:${s.texto}`;
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
  }

  async function handleSalvar() {
    const limpos = segmentosEmEdicao.filter((s) => s.tipo !== "");
    const salvos = limpos.length > 0 ? limpos : [segmentoVazio()];
    setSegmentos(salvos);
    setSegmentosDraft(null);
    setSaving(true);
    onSavingChange?.(true);
    try {
      await salvarParamCodigoPatrimonio(serializarRegra(salvos));
      onSaveSuccess?.("Parâmetro salvo com sucesso");
    } catch (e) {
      console.error("Erro ao salvar regra de código de patrimônio", e);
    } finally {
      setSaving(false);
      onSavingChange?.(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      {/* Header replicando o padrão das listagens */}
      <div className="flex min-h-[42px] items-center gap-2">
        <Select
          value={manageSelection}
          onChange={onManageSelectionChange}
          options={[
            { value: "ativos", label: "Ativos" },
            { value: "parametrosFuncao", label: "Parâmetros da função" },
          ].filter((o) => allowedSubmodulos.includes(o.value))}
          showPlaceholder={false}
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
                columns={[
                  { key: "dropdown", label: "Dropdown" },
                  { key: "parametro", label: "Parâmetro" },
                ]}
                rows={PARAMETROS_PATRIMONIO}
                rowKey={(p) => p.id}
                rowClassName={(p) => (p.id === selectedParametroId ? "row-selected" : "")}
                onRowClick={(p) => setSelectedParametroId(p.id)}
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
            ) : selectedParametro.id === "geracao_codigo_patrimonio" ? (
              <div className="flex flex-col h-full min-h-0">
                <div className="overflow-auto flex-1 min-h-0">
                  <div className="space-y-2 w-full">
                    {segmentosEmEdicao.map((seg, index) => {
                      const isTexto = seg.tipo === "texto";
                      const isSequenciaDigitos = seg.tipo === "sequencia_digitos";
                      const mostraInputExtra = isTexto || isSequenciaDigitos;
                      return (
                        <div key={index} className="flex items-center gap-2 w-full">
                          <div className={mostraInputExtra ? "w-1/2 min-w-0" : "flex-1 min-w-0"}>
                            <Select
                              value={seg.tipo}
                              onChange={(v) => atualizarSegmentoTipo(index, v)}
                              options={OPCOES_CODIGO}
                              showPlaceholder
                              visibleOptions={7}
                            />
                          </div>
                          {mostraInputExtra && (
                            <div className="w-1/2 min-w-0">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={seg.texto}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, "");
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
                </div>

                {/* Botões Cancelar / Salvar — canto inferior direito */}
                <div className="flex items-center justify-end gap-2 pt-[5px]">
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
            ) : (
              <div className="overflow-auto flex-1 min-h-0 p-4">
                <h3 className="text-sm font-semibold text-slate-700">
                  {selectedParametro.parametro}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Configuração será disponibilizada em breve.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
