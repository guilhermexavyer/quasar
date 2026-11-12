"use client";

import { useEffect } from "react";

/** Overlays de modal do sistema (fundo escurecido, z-50). */
const SELETOR_MODAL = ".fixed.inset-0.z-50";

/** Campos onde o usuário informa dados (inclui o dropdown customizado Select). */
const SELETOR_CAMPOS = [
  'input:not([type="hidden"]):not([readonly]):not([disabled])',
  "textarea:not([readonly]):not([disabled])",
  "select:not([disabled])",
  '[contenteditable="true"]',
  'button[aria-haspopup="listbox"]:not([disabled])',
].join(",");

function visivel(el: HTMLElement): boolean {
  return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
}

/**
 * Ctrl+S (ou Cmd+S) nos modais: com um modal aberto, o atalho age só nele (o
 * formulário por trás não é salvo). Se o modal do topo tem campos para
 * preencher, aciona o seu botão principal (Salvar/Filtrar/Confirmar, classe
 * .button-save), respeitando o estado desabilitado do botão. Modais sem
 * campos (confirmações, visualizações, carregando) apenas ignoram o atalho.
 */
export function useAtalhoSalvarModal(ativo: boolean): void {
  useEffect(() => {
    if (!ativo) return;

    function onKeyDown(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.key.toLowerCase() !== "s") return;

      const modais = Array.from(document.querySelectorAll<HTMLElement>(SELETOR_MODAL)).filter(visivel);
      // O modal aberto por último fica por cima (mesmo z-index, posterior no DOM).
      const modal = modais[modais.length - 1];
      if (!modal) return;

      // Há modal aberto: o atalho não chega aos formulários por trás dele.
      e.preventDefault();
      e.stopPropagation();
      if (e.repeat) return;

      const temCampos = Array.from(modal.querySelectorAll<HTMLElement>(SELETOR_CAMPOS)).some(visivel);
      if (!temCampos) return;

      const botoes = Array.from(modal.querySelectorAll<HTMLButtonElement>("button.button-save")).filter(
        (b) => visivel(b) && !b.disabled
      );
      const salvar = botoes[botoes.length - 1];
      if (!salvar) return;

      // Tira o foco do campo atual para que valores pendentes (ex.: máscaras
      // aplicadas no blur) sejam gravados antes de salvar.
      const foco = document.activeElement as HTMLElement | null;
      if (foco && modal.contains(foco) && foco !== salvar) foco.blur();
      setTimeout(() => salvar.click(), 0);
    }

    // Fase de captura na window: roda antes dos atalhos Ctrl+S dos formulários.
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [ativo]);
}
