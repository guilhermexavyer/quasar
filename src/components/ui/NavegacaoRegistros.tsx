"use client";

import type { ReactNode } from "react";

/** Um nível do menu de navegação (ex.: "Relatório: 1 Pessoa Física"). */
export interface ItemNavegacao {
  chave: string;
  texto: ReactNode;
  /** Volta para esse nível; sem ele, o card só mostra onde se está. */
  onClick?: () => void;
}

/**
 * Menu de navegação das telas abertas pelo duplo clique (ao lado das setas do dropdown
 * Pai): um card para cada nível, do mais externo ao atual (ex.: [Relatório] [Banda]
 * [Elemento]). Mesmo estilo dos cards de filtros aplicados, sem o "x"; com o cursor em
 * cima, o fundo fica um pouco mais claro.
 */
export default function NavegacaoRegistros({ itens, className = "" }: { itens: ItemNavegacao[]; className?: string }) {
  if (itens.length === 0) return null;
  return (
    <nav aria-label="Navegação" className={`flex min-w-0 items-center gap-1.5 overflow-hidden ${className}`}>
      {itens.map((item) => {
        const classe = "filtro-card navegacao-card inline-flex min-w-0 max-w-[360px] items-center rounded-none border px-2.5 py-[3px] text-xs leading-[18px] text-slate-700 whitespace-nowrap";
        const conteudo = <span className="truncate">{item.texto}</span>;
        return item.onClick ? (
          <button key={item.chave} type="button" onClick={item.onClick} className={`${classe} cursor-pointer`}>
            {conteudo}
          </button>
        ) : (
          <span key={item.chave} className={classe}>
            {conteudo}
          </span>
        );
      })}
    </nav>
  );
}
