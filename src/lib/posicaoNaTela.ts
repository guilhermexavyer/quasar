/** Distância mínima (px) entre a pop-up e a borda da janela. */
const MARGEM = 8;

/**
 * Mantém uma pop-up de posição fixa (menu de contexto) inteira na tela: se ela
 * passaria da borda direita, abre para a esquerda do ponto do clique; se passaria
 * da borda de baixo, abre para cima. Sem espaço nem do outro lado, encosta na margem.
 *
 * Uso como ref de callback, criada a cada render para reajustar quando o menu
 * muda de lugar: `ref={(el) => manterNaTela(el)}`. Roda antes da pintura, então
 * a pop-up não chega a aparecer cortada.
 */
export function manterNaTela(el: HTMLElement | null): void {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const largura = window.innerWidth;
  const altura = window.innerHeight;
  if (rect.right > largura - MARGEM) {
    // Abre para a esquerda do ponto; sem espaço também lá, encosta na margem esquerda.
    const esquerda = rect.left - rect.width;
    el.style.left = `${Math.max(MARGEM, esquerda >= MARGEM ? esquerda : largura - rect.width - MARGEM)}px`;
  }
  if (rect.bottom > altura - MARGEM) {
    const acima = rect.top - rect.height;
    el.style.top = `${Math.max(MARGEM, acima >= MARGEM ? acima : altura - rect.height - MARGEM)}px`;
  }
}

/**
 * Submenu (posição absoluta ao lado do item): abre à esquerda do item quando não
 * cabe à direita, e sobe quando passaria da borda de baixo.
 */
export function manterSubmenuNaTela(el: HTMLElement | null): void {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  if (rect.right > window.innerWidth - MARGEM) {
    el.style.left = "auto";
    el.style.right = "100%";
  }
  if (rect.bottom > window.innerHeight - MARGEM) {
    el.style.top = `${Math.min(0, window.innerHeight - MARGEM - rect.bottom)}px`;
  }
}
