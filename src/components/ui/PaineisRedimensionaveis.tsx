"use client";

import { Children, Fragment, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";

/** Largura mínima de cada painel ao redimensionar (px). */
const LARGURA_MINIMA_PAINEL = 160;
/** Largura do divisor entre os painéis (mesmo espaço do antigo gap-3). */
const LARGURA_DIVISOR = 12;

/** Proporções (somam 1) a partir dos pesos informados. */
function normalizar(pesos: number[]): number[] {
  const total = pesos.reduce((s, p) => s + p, 0) || 1;
  return pesos.map((p) => p / total);
}

/** Lê as proporções salvas no usuário; null se ausentes ou de outro layout. */
export function parsePaineisConfig(raw: string | null | undefined, quantidade: number): number[] | null {
  if (!raw) return null;
  try {
    const valores = JSON.parse(raw) as unknown;
    if (!Array.isArray(valores) || valores.length !== quantidade) return null;
    if (!valores.every((v) => typeof v === "number" && Number.isFinite(v) && v > 0)) return null;
    return normalizar(valores as number[]);
  } catch {
    return null;
  }
}

export function serializePaineisConfig(proporcoes: number[]): string {
  return JSON.stringify(proporcoes.map((p) => Math.round(p * 10000) / 10000));
}

/** Persistência da largura dos painéis (salva por usuário). */
export interface ConfigPaineis {
  config?: string | null;
  onChange?: (serialized: string) => void;
}

interface PaineisRedimensionaveisProps extends ConfigPaineis {
  /** Pesos padrão de cada painel (ex.: [1, 2] = 1/3 e 2/3). */
  proporcoesPadrao: number[];
  /** Um filho por painel. */
  children: ReactNode;
}

/**
 * Painéis lado a lado (ex.: lista à esquerda e configuração à direita) com
 * divisores arrastáveis entre eles, como as colunas das tabelas. Arrastar o
 * divisor redistribui a largura entre os dois painéis vizinhos; duplo clique
 * volta às proporções padrão. As proporções são salvas por usuário (onChange).
 */
export default function PaineisRedimensionaveis({ proporcoesPadrao, config, onChange, children }: PaineisRedimensionaveisProps) {
  const paineis = Children.toArray(children);
  const quantidade = paineis.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const [proporcoes, setProporcoes] = useState<number[]>(
    () => parsePaineisConfig(config, quantidade) ?? normalizar(proporcoesPadrao)
  );
  const [arrastando, setArrastando] = useState<number | null>(null);

  // Durante o arraste: cursor de redimensionar na página toda e sem seleção de texto.
  useEffect(() => {
    if (arrastando === null) return;
    const estilo = document.body.style;
    estilo.cursor = "col-resize";
    estilo.userSelect = "none";
    return () => {
      estilo.cursor = "";
      estilo.userSelect = "";
    };
  }, [arrastando]);

  function iniciarArraste(indice: number, e: ReactMouseEvent<HTMLDivElement>) {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const larguraUtil = container.clientWidth - (quantidade - 1) * LARGURA_DIVISOR;
    if (larguraUtil <= 0) return;
    const inicio = [...proporcoes];
    const xInicial = e.clientX;
    const somaDoPar = inicio[indice] + inicio[indice + 1];
    const minimo = Math.min(LARGURA_MINIMA_PAINEL / larguraUtil, somaDoPar / 2);
    let atual = inicio;

    function aoMover(ev: globalThis.MouseEvent) {
      const delta = (ev.clientX - xInicial) / larguraUtil;
      const esquerda = Math.min(Math.max(inicio[indice] + delta, minimo), somaDoPar - minimo);
      atual = [...inicio];
      atual[indice] = esquerda;
      atual[indice + 1] = somaDoPar - esquerda;
      setProporcoes(atual);
    }

    function aoSoltar() {
      document.removeEventListener("mousemove", aoMover);
      document.removeEventListener("mouseup", aoSoltar);
      setArrastando(null);
      if (atual !== inicio) onChange?.(serializePaineisConfig(atual));
    }

    setArrastando(indice);
    document.addEventListener("mousemove", aoMover);
    document.addEventListener("mouseup", aoSoltar);
  }

  function restaurarPadrao() {
    const padrao = normalizar(proporcoesPadrao);
    setProporcoes(padrao);
    onChange?.(serializePaineisConfig(padrao));
  }

  return (
    <div ref={containerRef} className="flex-1 min-h-0 flex">
      {paineis.map((painel, i) => (
        <Fragment key={i}>
          {/* O painel (filho) ocupa toda a área da sua fatia. */}
          <div className="min-w-0 min-h-0 flex flex-col [&>*]:flex-1" style={{ flex: `${proporcoes[i] ?? 1} 1 0px` }}>
            {painel}
          </div>
          {i < quantidade - 1 && (
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Redimensionar painéis"
              title="Arraste para redimensionar (duplo clique restaura o padrão)"
              className={`group flex shrink-0 cursor-col-resize items-center justify-center select-none ${arrastando === i ? "text-slate-600" : "text-slate-400 hover:text-slate-600"}`}
              style={{ width: LARGURA_DIVISOR }}
              onMouseDown={(e) => iniciarArraste(i, e)}
              onDoubleClick={restaurarPadrao}
            >
              {/* Alça de arraste (mesmo ícone de pontos usado no menu lateral). */}
              <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
                <circle cx="3" cy="3" r="1.2" />
                <circle cx="7" cy="3" r="1.2" />
                <circle cx="3" cy="7" r="1.2" />
                <circle cx="7" cy="7" r="1.2" />
                <circle cx="3" cy="11" r="1.2" />
                <circle cx="7" cy="11" r="1.2" />
              </svg>
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}
