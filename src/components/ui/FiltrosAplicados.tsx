"use client";

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
 */
export default function FiltrosAplicados({ filtros }: { filtros?: FiltroAplicado[] }) {
  if (!filtros || filtros.length === 0) return null;
  return (
    <div
      // Ocupa exatamente o espaço até a tabela (space-y-6 = 24px) e centraliza os cards nele.
      className="filtros-aplicados absolute left-0 right-0 top-full flex items-center gap-1.5 overflow-x-auto overflow-y-hidden whitespace-nowrap"
      style={{ height: 24, scrollbarWidth: "none" }}
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
