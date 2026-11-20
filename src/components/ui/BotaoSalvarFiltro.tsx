"use client";

/**
 * Botão "Salvar filtro" do rodapé dos modais de filtro: à esquerda (mr-auto, num rodapé
 * justify-end com "Limpar" e "Filtrar") e com o mesmo estilo do botão "Adicionar" das
 * telas de registros. Grava o filtro do usuário para a tela e o aplica.
 */
export default function BotaoSalvarFiltro({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mr-auto inline-flex items-center rounded-[3px] border border-transparent bg-transparent px-4 py-2.5 text-sm font-normal text-[#066fc5] transition cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2 active:outline active:outline-1 active:outline-[#066fc5] active:outline-offset-2"
    >
      Salvar filtro
    </button>
  );
}
