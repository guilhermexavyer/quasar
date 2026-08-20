"use client";

import { useRef, useState } from "react";
import type { ContextMenuState } from "@/types/contextMenu";

interface ContextMenuItem {
  label: string;
  onClick?: () => void;
  children?: ContextMenuItem[];
}

interface ContextMenuProps {
  x: number;
  y: number;
  state: ContextMenuState;
  onView: () => void;
  onChangePassword: () => void;
  onChangeStatus?: () => void;
  onChangeIngresso?: () => void;
  onDelegateFunctions?: () => void;
  onDelegatePerfis?: () => void;
  onDuplicate?: () => void;
  /** Itens personalizados exibidos após as opções padrão (ex.: status de campo). */
  customItems?: ContextMenuItem[];
  showChangePassword?: boolean;
  showChangeStatus?: boolean;
  showChangeIngresso?: boolean;
  showView?: boolean;
  showDelete?: boolean;
  onDelete: () => void;
}

function MenuButton({ item, onAction }: { item: ContextMenuItem; onAction: () => void }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div
      className="relative"
      onMouseEnter={() => hasChildren && setOpen(true)}
      onMouseLeave={() => hasChildren && setOpen(false)}
    >
      <button
        ref={btnRef}
        type="button"
        className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer flex items-center justify-between gap-2"
        style={{ padding: "0.2rem 0.4rem" }}
        onClick={() => {
          if (!hasChildren && item.onClick) {
            item.onClick();
            onAction();
          }
        }}
      >
        <span>{item.label}</span>
        {hasChildren && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0" style={{ color: '#555' }}>
            <path d="M9 6l6 6-6 6" />
          </svg>
        )}
      </button>
      {hasChildren && open && (
        <div
          className="absolute left-full top-0 min-w-[160px] border border-slate-200 bg-white p-[3px] flex flex-col gap-[3px] z-10"
          style={{ boxShadow: "0 4px 10px rgba(0,0,0,0.18)" }}
        >
          {item.children!.map((child) => (
            <MenuButton key={child.label} item={child} onAction={onAction} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ContextMenu({
  x,
  y,
  state,
  onView,
  onChangePassword,
  onChangeStatus,
  onChangeIngresso,
  onDelegateFunctions,
  onDelegatePerfis,
  onDuplicate,
  customItems,
  showChangePassword = false,
  showChangeStatus = false,
  showChangeIngresso = false,
  showView = true,
  showDelete = true,
  onDelete,
}: ContextMenuProps) {
  const close = () => {
    // Dispara evento para fechar o menu
    document.dispatchEvent(new MouseEvent("mousedown"));
  };

  return (
    <div
      className="fixed z-50 min-w-[160px] border border-slate-200 bg-white p-[3px] flex flex-col gap-[3px]"
      style={{ left: x, top: y, boxShadow: "0 4px 10px rgba(0,0,0,0.18)" }}
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
      {showChangeIngresso && onChangeIngresso && (
        <button
          type="button"
          className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer"
          style={{ padding: "0.2rem 0.4rem" }}
          onClick={onChangeIngresso}
        >
          Alterar data de ingresso
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
      {customItems?.map((item) => (
        <MenuButton key={item.label} item={item} onAction={close} />
      ))}
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
    </div>
  );
}
