"use client";

import type { PessoaFisica } from "@/types/pessoaFisica";

type ContextMenuProps = {
  x: number;
  y: number;
  pessoa: PessoaFisica;
  onView: () => void;
  onDelete: () => void;
};

export default function ContextMenu({ x, y, onView, onDelete }: ContextMenuProps) {
  return (
    <div
      className="fixed z-50 min-w-[160px] border border-slate-200 bg-white p-[3px] flex flex-col gap-[3px]"
      style={{ left: x, top: y, boxShadow: '0 4px 10px rgba(0,0,0,0.18)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer"
        style={{ padding: "0.2rem 0.4rem" }}
        onClick={onView}
      >
        Ver
      </button>
      <button
        type="button"
        className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer"
        style={{ padding: "0.2rem 0.4rem" }}
        onClick={onDelete}
      >
        Excluir
      </button>
    </div>
  );
}
