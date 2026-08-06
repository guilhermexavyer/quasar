"use client";

import type { ContextMenuState } from "@/types/contextMenu";

interface ContextMenuProps {
  x: number;
  y: number;
  state: ContextMenuState;
  onView: () => void;
  onChangePassword: () => void;
  onChangeStatus?: () => void;
  onDelegateFunctions?: () => void;
  onDelegatePerfis?: () => void;
  onDuplicate?: () => void;
  /** Itens personalizados exibidos após as opções padrão (ex.: status de campo). */
  customItems?: { label: string; onClick: () => void }[];
  showChangePassword?: boolean;
  showChangeStatus?: boolean;
  showView?: boolean;
  showDelete?: boolean;
  onDelete: () => void;
}

export default function ContextMenu({
  x,
  y,
  state,
  onView,
  onChangePassword,
  onChangeStatus,
  onDelegateFunctions,
  onDelegatePerfis,
  onDuplicate,
  customItems,
  showChangePassword = false,
  showChangeStatus = false,
  showView = true,
  showDelete = true,
  onDelete,
}: ContextMenuProps) {
  return (
    <div
      className="fixed z-50 min-w-[160px] border border-slate-200 bg-white p-[3px] flex flex-col gap-[3px]"
      style={{ left: x, top: y, boxShadow: '0 4px 10px rgba(0,0,0,0.18)' }}
      onClick={(e) => e.stopPropagation()}
    >
      {showView && (
        <button
          type="button"
          className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer"
          style={{ padding: "0.2rem 0.4rem" }}
          onClick={onView}
        >
          Ver
        </button>
      )}
      {showChangePassword && (
        <button
          type="button"
          className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer"
          style={{ padding: "0.2rem 0.4rem" }}
          onClick={onChangePassword}
        >
          Alterar senha
        </button>
      )}
      {showChangeStatus && onChangeStatus && (
        <button
          type="button"
          className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer"
          style={{ padding: "0.2rem 0.4rem" }}
          onClick={onChangeStatus}
        >
          Alterar status
        </button>
      )}
      {onDelegateFunctions && (
        <button
          type="button"
          className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer"
          style={{ padding: "0.2rem 0.4rem" }}
          onClick={onDelegateFunctions}
        >
          Delegar funções
        </button>
      )}
      {onDelegatePerfis && (
        <button
          type="button"
          className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer"
          style={{ padding: "0.2rem 0.4rem" }}
          onClick={onDelegatePerfis}
        >
          Delegar perfis
        </button>
      )}
      {onDuplicate && (
        <button
          type="button"
          className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer"
          style={{ padding: "0.2rem 0.4rem" }}
          onClick={onDuplicate}
        >
          Duplicar
        </button>
      )}
      {showDelete && (
        <button
          type="button"
          className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer"
          style={{ padding: "0.2rem 0.4rem" }}
          onClick={onDelete}
        >
          Excluir
        </button>
      )}
      {customItems?.map((item) => (
        <button
          key={item.label}
          type="button"
          className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer"
          style={{ padding: "0.2rem 0.4rem" }}
          onClick={item.onClick}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
