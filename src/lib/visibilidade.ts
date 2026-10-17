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
