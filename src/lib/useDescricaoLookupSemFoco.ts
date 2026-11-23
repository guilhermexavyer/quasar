"use client";

import { useEffect } from "react";

const SELETOR_LOCALIZAR = 'button[aria-label^="Localizar"]';

/**
 * Descrição de um campo de lookup: input somente leitura no mesmo container do botão
 * "Localizar ..." (ex.: nome da pessoa física ao lado da sequência).
 */
function ehDescricaoDeLookup(alvo: EventTarget | null): alvo is HTMLInputElement {
  return alvo instanceof HTMLInputElement && alvo.readOnly && !!alvo.parentElement?.querySelector(SELETOR_LOCALIZAR);
}

/**
 * Nos campos de lookup, só o input do valor (sequência) recebe foco: a descrição não
 * fica selecionada (borda de foco) ao clicar nela nem ao navegar com Tab.
 * Vale para todos os lookups do sistema, sem precisar alterar cada campo.
 */
export function useDescricaoLookupSemFoco() {
  useEffect(() => {
    const aoPressionar = (e: MouseEvent) => {
      if (ehDescricaoDeLookup(e.target)) e.preventDefault();
    };
    const aoFocar = (e: FocusEvent) => {
      if (!ehDescricaoDeLookup(e.target)) return;
      e.target.tabIndex = -1;
      e.target.blur();
    };
    document.addEventListener("mousedown", aoPressionar, true);
    document.addEventListener("focusin", aoFocar, true);
    return () => {
      document.removeEventListener("mousedown", aoPressionar, true);
      document.removeEventListener("focusin", aoFocar, true);
    };
  }, []);
}
