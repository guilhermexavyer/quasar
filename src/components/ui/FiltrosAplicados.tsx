"use client";

import { useLayoutEffect, useRef, useState } from "react";

/** Um filtro em uso na tela de registros (card com o "x" para tirá-lo). */
export interface FiltroAplicado {
  chave: string;
  rotulo: string;
  valor: string;
  onRemover: () => void;
}

/**
 * Cards dos filtros aplicados, no espaço entre o dropdown da função e a tabela de
 * registros. Ficam posicionados sobre esse espaço (o pai do cabeçalho é `relative`),
 * então não empurram a tabela; com muitos filtros, a faixa rola na horizontal.
 *
 * O dropdown é mais baixo que o cabeçalho (fica centralizado nele), então o espaço
 * visível vai da borda de baixo do dropdown até o topo da tabela: a faixa é medida
 * na tela para ocupar exatamente esse espaço, com os cards centralizados no meio.
 */
export default function FiltrosAplicados({ filtros }: { filtros?: FiltroAplicado[] }) {
  const faixaRef = useRef<HTMLDivElement>(null);
  const [posicao, setPosicao] = useState<{ top: number; height: number } | null>(null);
  const temFiltros = !!filtros && filtros.length > 0;

  useLayoutEffect(() => {
    if (!temFiltros) return;
    const cabecalho = faixaRef.current?.parentElement;
    if (!cabecalho) return;
    const medir = () => {
      const caixa = cabecalho.getBoundingClientRect();
      const dropdown = cabecalho.querySelector(".cg-select-trigger");
      const inicio = dropdown ? dropdown.getBoundingClientRect().bottom : caixa.bottom;
      const tabela = cabecalho.nextElementSibling;
      const fim = tabela ? tabela.getBoundingClientRect().top : caixa.bottom + 24;
      // Tela escondida (função aberta em segundo plano): mede quando ela aparecer.
      if (fim <= inicio) return;
      const nova = { top: inicio - caixa.top, height: fim - inicio };
      setPosicao((atual) => (atual && atual.top === nova.top && atual.height === nova.height ? atual : nova));
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(cabecalho);
    if (cabecalho.nextElementSibling) observador.observe(cabecalho.nextElementSibling);
    return () => observador.disconnect();
  }, [temFiltros]);

  if (!temFiltros) return null;
  return (
    <div
      ref={faixaRef}
      className="filtros-aplicados absolute left-0 right-0 flex items-center gap-1.5 overflow-x-auto overflow-y-hidden whitespace-nowrap"
      // Até medir: logo abaixo do cabeçalho, nos 24px do space-y-6.
      style={{ top: posicao?.top ?? "100%", height: posicao?.height ?? 24, scrollbarWidth: "none" }}
      aria-label="Filtros aplicados"
    >
      {filtros.map((f) => (
        <span
          key={f.chave}
          className="filtro-card inline-flex flex-shrink-0 items-center gap-1 rounded-[3px] border pl-2 pr-0.5 text-[11px] leading-[17px] text-slate-700"
        >
          <span className="text-slate-500">{f.rotulo}:</span>
          <span className="max-w-[220px] truncate font-medium">{f.valor}</span>
          <button
            type="button"
            onClick={f.onRemover}
            className="inline-flex h-[15px] w-[15px] items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
            aria-label={`Remover filtro ${f.rotulo}`}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </span>
      ))}
    </div>
  );
}
