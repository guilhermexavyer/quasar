import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { flushSync } from "react-dom";

/**
 * Indica se o elemento está visível na página.
 *
 * As funções já abertas ficam montadas (para o usuário voltar exatamente de
 * onde parou), mas escondidas quando não estão ativas. Atalhos de teclado
 * globais (Ctrl+S, Enter) e medições de largura de tabela usam esta checagem
 * para agir só na função que está na tela.
 */
export function elementoVisivel(elemento: Element | null | undefined): boolean {
  return !!elemento && elemento.isConnected && elemento.getClientRects().length > 0;
}

/**
 * Número que aumenta cada vez que o elemento aparece na tela: quando passa de
 * escondido para visível (ex.: o usuário volta a uma função aberta em segundo
 * plano) ou quando um elemento novo é renderizado já visível (ex.: a tabela que
 * só surge ao escolher uma opção no dropdown PAI). Serve de dependência para
 * refazer medições que não rodaram nesses momentos — como as larguras das
 * colunas de uma tabela.
 *
 * Tudo acontece ANTES de a tela ser pintada, para o usuário nunca ver a tabela
 * com larguras automáticas por um instante (o "piscar" das colunas):
 *   - o observer é ligado num useLayoutEffect (antes da pintura), e não num
 *     useEffect (que roda depois dela);
 *   - a notificação do ResizeObserver chega entre o cálculo do layout e a
 *     pintura; o flushSync faz o React renderizar ali mesmo, então as medições
 *     que dependem da versão (useLayoutEffect das tabelas) aplicam as larguras
 *     salvas no mesmo quadro.
 */
export function useVersaoVisivel(ref: RefObject<Element | null>): number {
  const [versao, setVersao] = useState(0);
  const observado = useRef<{ elemento: Element; observer: ResizeObserver } | null>(null);

  // Sem lista de dependências: o elemento pode ser trocado (ex.: tabela que só
  // aparece depois do carregamento), então confere a cada render.
  useLayoutEffect(() => {
    const elemento = ref.current;
    if (observado.current?.elemento === elemento) return;
    observado.current?.observer.disconnect();
    observado.current = null;
    if (!elemento || typeof ResizeObserver === "undefined") return;
    // Começa como "não visível": a primeira notificação do observer (logo ao
    // observar) já conta se o elemento estiver na tela.
    let visivel = false;
    // Esconder/mostrar (display: none) muda o tamanho do elemento de/para zero.
    const observer = new ResizeObserver(() => {
      const agora = elementoVisivel(elemento);
      if (agora && !visivel) flushSync(() => setVersao((v) => v + 1));
      visivel = agora;
    });
    observer.observe(elemento);
    observado.current = { elemento, observer };
  });

  // Desmontagem (inclusive a simulada pelo Strict Mode em dev): esquece o
  // elemento, para voltar a observá-lo se o componente for montado de novo.
  useEffect(() => () => {
    observado.current?.observer.disconnect();
    observado.current = null;
  }, []);

  return versao;
}
