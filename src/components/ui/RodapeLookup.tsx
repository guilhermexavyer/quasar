"use client";

import type { ReactNode } from "react";
import BotaoSalvarFiltro from "@/components/ui/BotaoSalvarFiltro";

const CLASSE_LINK =
  "mr-auto inline-flex items-center rounded-[3px] border border-transparent bg-transparent px-4 py-2.5 text-sm font-normal text-[#066fc5] transition cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2 active:outline active:outline-1 active:outline-[#066fc5] active:outline-offset-2";

/**
 * Rodapé do filtro dos lookups, numa linha só: "Salvar filtro" e "Adicionar" à esquerda e os
 * botões do filtro (`children`: Limpar e Filtrar) à direita.
 *
 * "Adicionar" (lookups que puxam registros de outra função): abre o formulário de cadastro na
 * função do registro; ao salvar, volta com o registro novo selecionado.
 */
export default function RodapeLookup({
  onSalvarFiltro,
  onAdicionar,
  children,
}: {
  onSalvarFiltro?: () => void;
  onAdicionar?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex-shrink-0 flex items-center justify-end gap-2 p-[15px]">
      {onSalvarFiltro && <BotaoSalvarFiltro semMargem={!!onAdicionar} onClick={onSalvarFiltro} />}
      {onAdicionar && (
        <button type="button" onClick={onAdicionar} className={CLASSE_LINK}>
          Adicionar
        </button>
      )}
      {children}
    </div>
  );
}
