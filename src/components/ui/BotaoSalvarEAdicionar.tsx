"use client";

/**
 * Botão "Salvar e adicionar" do rodapé dos formulários (à esquerda do "Cancelar"), com o
 * mesmo estilo dos botões "Adicionar" e "Salvar filtro": salva o registro e abre o
 * formulário de um registro novo.
 */
export default function BotaoSalvarEAdicionar({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center rounded-[3px] border border-transparent bg-transparent px-4 py-2.5 text-sm font-normal text-[#066fc5] transition cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2 active:outline active:outline-1 active:outline-[#066fc5] active:outline-offset-2 disabled:cursor-default disabled:opacity-40"
    >
      Salvar e adicionar
    </button>
  );
}
