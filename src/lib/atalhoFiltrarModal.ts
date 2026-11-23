"use client";

import { useEffect } from "react";

/** Overlays de modal do sistema (fundo escurecido, z-50). */
const SELETOR_MODAL = ".fixed.inset-0.z-50";

/** Inputs que não são de digitação: Enter neles segue o comportamento normal. */
const TIPOS_IGNORADOS = new Set(["button", "submit", "reset", "file", "hidden", "image"]);

function visivel(el: HTMLElement): boolean {
  return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
}

function ehBotaoFiltrar(el: HTMLButtonElement): boolean {
  return el.textContent?.trim() === "Filtrar" && !el.disabled && visivel(el);
}

/**
 * Enter nos modais de filtro e nos lookups (janelas de localizar): atalho do botão
 * "Filtrar" do modal do topo. Vale com o foco em um campo do filtro (input, checkbox,
 * radio, select nativo); textarea e botões seguem o comportamento normal, e o dropdown
 * customizado (Select) continua usando Enter para abrir/escolher a opção.
 * Um único comportamento para todos: os modais com <form> e os que só têm botões.
 */
export function useAtalhoFiltrarModal(ativo: boolean): void {
  useEffect(() => {
    if (!ativo) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Enter" || e.defaultPrevented || e.isComposing) return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      const alvo = e.target;
      const campo =
        (alvo instanceof HTMLInputElement && !TIPOS_IGNORADOS.has(alvo.type)) || alvo instanceof HTMLSelectElement;
      if (!campo) return;

      const modais = Array.from(document.querySelectorAll<HTMLElement>(SELETOR_MODAL)).filter(visivel);
      // O modal aberto por último fica por cima (mesmo z-index, posterior no DOM).
      const modal = modais[modais.length - 1];
      if (!modal || !modal.contains(alvo)) return;

      // Botão "Filtrar" mais próximo do campo (sobe a partir dele, sem sair do modal).
      let filtrar: HTMLButtonElement | undefined;
      for (let el: HTMLElement | null = alvo.parentElement; el && !filtrar; el = el === modal ? null : el.parentElement) {
        filtrar = Array.from(el.querySelectorAll<HTMLButtonElement>("button")).find(ehBotaoFiltrar);
      }
      if (!filtrar) return;

      // Evita também o envio nativo do <form>, para filtrar uma única vez.
      e.preventDefault();
      if (e.repeat) return;
      // Tira o foco do campo para que valores pendentes (ex.: máscaras no blur) entrem no filtro.
      alvo.blur();
      const botao = filtrar;
      setTimeout(() => botao.click(), 0);
    }

    // Fase de bolha na window: o Select (React) trata o Enter antes e marca defaultPrevented.
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ativo]);
}
