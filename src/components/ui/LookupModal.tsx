"use client";

import { useMemo, useState } from "react";
import RodapeLookup from "@/components/ui/RodapeLookup";
import RotuloCampo from "@/components/ui/RotuloCampo";
import Select from "@/components/ui/Select";
import LookupTabela, { type LookupColumn, type LookupLinha } from "@/components/ui/LookupTabela";
import type { ColunasConfig } from "@/lib/colunasUtils";
import { applyCpfMask, applyDateMask, applyPhoneMask } from "@/lib/pessoaFisicaUtils";
import { applyCnpjMask } from "@/lib/pessoaJuridicaUtils";

/**
 * Tipo do campo do filtro (o mesmo controle do filtro da função):
 *   texto, numero (só dígitos), cpf, cnpj, telefone e data (com máscara), opcoes (lista
 *   suspensa), radio (opções lado a lado), referencia (sequência de um registro de outra
 *   tabela, com o nome ao lado — no lookup, sem abrir outro lookup por cima) e checkbox
 *   (marcado = "S").
 */
export type TipoCampoLookup = "texto" | "numero" | "cpf" | "cnpj" | "telefone" | "data" | "opcoes" | "radio" | "referencia" | "checkbox";

export interface CampoLookup {
  /** Chave no filtro (a mesma do filtro da função, para a mesma regra de filtragem valer). */
  key: string;
  rotulo: string;
  /** Campo e tabela das informações do rótulo (infobutton). */
  campo: string;
  colecao?: string;
  tipo?: TipoCampoLookup;
  opcoes?: { value: string; label: string }[];
  /** referencia: descrição do registro da sequência digitada. */
  descricao?: (valor: string) => string;
  /** Metade da largura (ex.: pares início/fim de datas). */
  meia?: boolean;
  maxLength?: number;
}

/** Tudo o que define um lookup de registros: o filtro e as colunas da tela de registros da função. */
export interface ConfigLookup<T extends { nr_sequencia: number }> {
  titulo: string;
  colecao: string;
  campos: CampoLookup[];
  /** Filtro vazio (o da função). */
  vazio: Record<string, string>;
  /** Regra do filtro da função: true se o registro aparece. */
  /** `marcados` (seleção múltipla): as caixas marcadas no momento do Filtrar. */
  filtrar: (registro: T, filtro: Record<string, string>, marcados: ReadonlySet<number>) => boolean;
  registros: T[];
  /** Colunas da tela de registros da função. */
  colunas: LookupColumn[];
  /** Texto de cada coluna do registro (como na tela de registros). */
  linha: (registro: T) => Record<string, unknown>;
  initialColumns?: ColunasConfig | null;
  onColumnsChange?: (config: ColunasConfig) => void;
  /** Filtro salvo do usuário: ao abrir, vem preenchido e aplicado. */
  filtroSalvo?: Record<string, string> | null;
  /** "Salvar filtro": grava os campos do filtro e chama `aplicar` (como o "Filtrar"). */
  onSalvarFiltro?: (form: Record<string, string>, aplicar: () => void) => void;
}

interface LookupModalProps<T extends { nr_sequencia: number }> extends ConfigLookup<T> {
  /** "Adicionar": abre o cadastro do registro na função dele (sem ela, o botão não aparece). */
  onAdicionar?: () => void;
  /** Seleção de um registro (duplo clique). Na seleção múltipla, não é usado. */
  onSelect?: (registro: T) => void;
  onClose: () => void;
  /**
   * Seleção múltipla: coluna de caixas fixa à esquerda (a do título marca todo o resultado do
   * filtro) e, embaixo, a quantidade marcada com Cancelar e Salvar.
   */
  multipla?: {
    /** Sequências que já abrem marcadas (ex.: os ativos de que ele já é responsável). */
    iniciais?: number[];
    /** Recebe os registros marcados ao Salvar (os desmarcados ficam de fora). */
    onConfirmar: (registros: T[]) => void;
    salvando?: boolean;
  };
}

const CLASSE_INPUT = "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none";

/** Valor digitado com a máscara do tipo do campo. */
function comMascara(tipo: TipoCampoLookup, valor: string, maxLength?: number): string {
  switch (tipo) {
    case "numero": case "referencia": return valor.replace(/\D/g, "").slice(0, maxLength ?? 10);
    case "cpf": return applyCpfMask(valor);
    case "cnpj": return applyCnpjMask(valor);
    case "telefone": return applyPhoneMask(valor);
    case "data": return applyDateMask(valor);
    default: return maxLength ? valor.slice(0, maxLength) : valor;
  }
}

/**
 * Lookup de registros (janelas "Localizar ..."): à esquerda, os mesmos campos do filtro da
 * função (Salvar filtro, Adicionar, Limpar e Filtrar no rodapé); à direita, as mesmas colunas
 * da tela de registros, redimensionáveis, arrastáveis e ordenáveis. Duplo clique seleciona.
 */
export default function LookupModal<T extends { nr_sequencia: number }>({
  titulo,
  colecao,
  campos,
  vazio,
  filtrar,
  registros,
  colunas,
  linha,
  initialColumns,
  onColumnsChange,
  filtroSalvo,
  onSalvarFiltro,
  onAdicionar,
  onSelect,
  onClose,
  multipla,
}: LookupModalProps<T>) {
  // Filtro salvo: só os campos que este lookup conhece, sobre o filtro vazio.
  const [form, setForm] = useState<Record<string, string>>(() =>
    filtroSalvo ? { ...vazio, ...Object.fromEntries(Object.entries(filtroSalvo).filter(([k, v]) => k in vazio && typeof v === "string")) } : vazio
  );
  const [filtro, setFiltro] = useState<Record<string, string> | null>(() => (filtroSalvo ? form : null));

  const porSequencia = useMemo(() => new Map(registros.map((r) => [r.nr_sequencia, r])), [registros]);
  /** Seleção múltipla: as sequências marcadas (continuam marcadas ao filtrar de novo). */
  const [marcados, setMarcados] = useState<Set<number>>(() => new Set(multipla?.iniciais ?? []));
  /** Marcados no momento do Filtrar: o resultado não muda enquanto se marca ou desmarca. */
  const [marcadosAoFiltrar, setMarcadosAoFiltrar] = useState<ReadonlySet<number>>(() => new Set(multipla?.iniciais ?? []));
  function aplicarFiltro(f: Record<string, string> | null) {
    setFiltro(f);
    setMarcadosAoFiltrar(new Set(marcados));
  }
  /** Salvar só com alguma mudança na seleção (marcou ou desmarcou algo). */
  const alterado = useMemo(() => {
    const iniciais = new Set(multipla?.iniciais ?? []);
    return marcados.size !== iniciais.size || [...marcados].some((nr) => !iniciais.has(nr));
  }, [marcados, multipla?.iniciais]);
  const resultado = useMemo<LookupLinha[]>(() => {
    if (!filtro) return [];
    return registros.filter((r) => filtrar(r, filtro, marcadosAoFiltrar)).map((r) => ({ ...linha(r), id: String(r.nr_sequencia), nr_sequencia: r.nr_sequencia }));
  }, [registros, filtro, filtrar, linha, marcadosAoFiltrar]);

  function campo(c: CampoLookup) {
    const tipo = c.tipo ?? "texto";
    const valor = form[c.key] ?? "";
    const mudar = (v: string) => setForm({ ...form, [c.key]: v });
    if (tipo === "opcoes") {
      return <Select value={valor} onChange={mudar} options={c.opcoes ?? []} />;
    }
    if (tipo === "checkbox") {
      return (
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer py-1.5">
          <input type="checkbox" className="cg-checkbox" checked={valor === "S"} onChange={(e) => mudar(e.target.checked ? "S" : "")} />
          <span>Sim</span>
        </label>
      );
    }
    if (tipo === "radio") {
      return (
        <div className="flex flex-wrap items-center gap-4 py-1.5">
          {(c.opcoes ?? []).map((o) => (
            <label key={o.value} className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name={`lookup_${c.key}`} value={o.value} checked={valor === o.value} onChange={() => mudar(o.value)} />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      );
    }
    const input = (
      <input
        inputMode={tipo === "texto" ? undefined : "numeric"}
        placeholder={tipo === "data" ? "DD/MM/AAAA" : undefined}
        className={CLASSE_INPUT}
        value={valor}
        onChange={(e) => mudar(comMascara(tipo, e.target.value, c.maxLength))}
      />
    );
    if (tipo !== "referencia") return input;
    return (
      <div className="flex items-center gap-2">
        <div className="w-[90px] shrink-0">{input}</div>
        <input readOnly tabIndex={-1} className={`${CLASSE_INPUT} bg-slate-100 text-slate-700`} value={valor && c.descricao ? c.descricao(valor) : ""} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[1280px] bg-white p-0 shadow-xl shadow-black/20 h-[720px] max-h-[90vh] overflow-hidden">
        <div className="flex h-full">
          <form
            className="w-[480px] shrink-0 lookup-left flex flex-col min-h-0"
            onSubmit={(e) => { e.preventDefault(); aplicarFiltro(form); }}
          >
            <div className="p-[15px] overflow-auto flex-1 min-h-0">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-base font-semibold" style={{ color: "#000" }}>{titulo}</h2>
                <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0" aria-label={`Fechar ${titulo.toLowerCase()}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-[15px] gap-y-4">
                {campos.map((c) => (
                  <div key={c.key} className={c.meia ? "col-span-1" : "col-span-2"}>
                    <RotuloCampo texto={c.rotulo} colecao={c.colecao ?? colecao} campo={c.campo} />
                    {campo(c)}
                  </div>
                ))}
              </div>
            </div>
            <RodapeLookup onSalvarFiltro={onSalvarFiltro ? () => onSalvarFiltro(form, () => aplicarFiltro(form)) : undefined} onAdicionar={onAdicionar}>
              <button type="button" onClick={() => { setForm(vazio); aplicarFiltro(null); }} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: "#ddd", borderBottomColor: "#000" }}>Limpar</button>
              <button type="submit" className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: "#003056", borderBottomColor: "#000" }}>Filtrar</button>
            </RodapeLookup>
          </form>
          <div className="flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col lookup-right">
            {resultado.length === 0 ? (
              <div className="flex flex-1 items-center justify-center p-[15px] text-sm text-slate-600">Nenhum registro encontrado.</div>
            ) : (
              <LookupTabela
                colunas={colunas}
                linhas={resultado}
                onSelect={(l) => { const r = porSequencia.get(l.nr_sequencia); if (r) onSelect?.(r); }}
                initialColumns={initialColumns}
                onColumnsChange={onColumnsChange}
                selecao={multipla ? {
                  marcados,
                  alternar: (nr, marcar) => setMarcados((atual) => {
                    const novo = new Set(atual);
                    if (marcar) novo.add(nr); else novo.delete(nr);
                    return novo;
                  }),
                  alternarTodos: (marcar) => setMarcados((atual) => {
                    const novo = new Set(atual);
                    for (const l of resultado) { if (marcar) novo.add(l.nr_sequencia); else novo.delete(l.nr_sequencia); }
                    return novo;
                  }),
                } : undefined}
              />
            )}
            {multipla && (
              <div className="flex-shrink-0 flex items-center justify-end gap-2 p-[15px] pt-0">
                <span className="mr-auto text-sm text-slate-600">{marcados.size} selecionado(s)</span>
                <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: "#bdbdbd", borderBottomColor: "#000" }}>Cancelar</button>
                <button
                  type="button"
                  disabled={!alterado || multipla.salvando}
                  onClick={() => multipla.onConfirmar(registros.filter((r) => marcados.has(r.nr_sequencia)))}
                  className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60"
                  style={{ backgroundColor: "#003056", borderBottomColor: "#000" }}
                >
                  Salvar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
