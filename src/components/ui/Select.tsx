"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  disabled?: boolean;
  /** Quantas opções ficam visíveis na lista aberta (o restante rola). */
  visibleOptions?: number;
  /** Exibe a opção "---" (vazia) no topo da lista. Padrão: true. */
  showPlaceholder?: boolean;
  /** Borda vermelha — campo obrigatório vazio ao salvar. */
  error?: boolean;
  /** Força o dropdown a abrir sempre para cima. */
  forceOpenUp?: boolean;
  /** Tema do dropdown (afeta a lista de opções aberta). */
  theme?: 'default' | 'sidebar';
  /** Renderização customizada de cada opção. */
  renderOption?: (option: SelectOption) => React.ReactNode;
  /** Classes CSS extras aplicadas à lista de opções (dropdown). */
  dropdownClassName?: string;
  /** Usa position absolute em vez de fixed para o dropdown. */
  absolute?: boolean;
  /** Classes CSS extras aplicadas a cada opção do dropdown. */
  optionClassName?: string;
}

const ROW_HEIGHT = 32; // altura aproximada de cada linha (px)

export default function Select({
  value,
  onChange,
  options,
  className = "",
  disabled = false,
  visibleOptions = 10,
  showPlaceholder = true,
  error = false,
  forceOpenUp = false,
  theme = 'default',
  renderOption,
  dropdownClassName = '',
  absolute = false,
  optionClassName = '',
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [openUp, setOpenUp] = useState(false);
  const [searchBuffer, setSearchBuffer] = useState("");
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const searchTimeoutRef = useRef<number | null>(null);

  // Normaliza para comparação: minúsculas, sem acentos (ex.: "Técnico" ≈ "tecnico").
  function normalizeLabel(label: string): string {
    return label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  const items = useMemo(
    () => (showPlaceholder ? [{ value: "", label: "---" }, ...options] : options),
    [options, showPlaceholder]
  );
  const selected = items.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function handleClose(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClose);
    return () => document.removeEventListener("mousedown", handleClose);
  }, [open]);

  // Calcula posição fixa do dropdown e decide se abre para cima ou para baixo.
  useLayoutEffect(() => {
    if (!open || !rootRef.current) {
      if (!open) setDropdownPos(null);
      return;
    }
    const triggerRect = rootRef.current.getBoundingClientRect();
    const listHeight = Math.min(items.length, visibleOptions) * ROW_HEIGHT;
    const spaceBelow = window.innerHeight - triggerRect.bottom - 12;
    const spaceAbove = triggerRect.top - 12;
    const up = forceOpenUp || (spaceBelow < listHeight && spaceAbove >= spaceBelow);
    setOpenUp(up);
    if (absolute && rootRef.current) {
      const rootRect = rootRef.current.getBoundingClientRect();
      setDropdownPos({
        top: up ? triggerRect.top - rootRect.top - listHeight - 2 : triggerRect.bottom - rootRect.top + 2,
        left: triggerRect.left - rootRect.left,
        width: triggerRect.width,
      });
    } else {
      setDropdownPos({
        top: up ? triggerRect.top - listHeight - 2 : triggerRect.bottom + 2,
        left: triggerRect.left,
        width: triggerRect.width,
      });
    }

    const list = listRef.current;
    if (!list) return;
    const selectedIndex = items.findIndex((o) => o.value === value);
    if (selectedIndex < 0) return;
    const itemEl = list.children[selectedIndex] as HTMLElement | undefined;
    if (!itemEl) return;
    if (itemEl.offsetTop < list.scrollTop) {
      list.scrollTop = itemEl.offsetTop;
    } else if (itemEl.offsetTop + itemEl.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = itemEl.offsetTop + itemEl.offsetHeight - list.clientHeight;
    }
  }, [open, items, value, visibleOptions, forceOpenUp]);
  // Recalculate position on scroll/resize — direct DOM update for zero delay
  useEffect(() => {
    if (!open) return;
    const recalc = () => {
      if (!rootRef.current) return;
      const triggerRect = rootRef.current.getBoundingClientRect();
      const listHeight = Math.min(items.length, visibleOptions) * ROW_HEIGHT;
      const spaceBelow = window.innerHeight - triggerRect.bottom - 12;
      const spaceAbove = triggerRect.top - 12;
      const up = forceOpenUp || (spaceBelow < listHeight && spaceAbove >= spaceBelow);
      setOpenUp(up);
      // Direct DOM update — no React re-render delay
      const list = listRef.current;
      if (absolute && rootRef.current) {
        const rootRect = rootRef.current.getBoundingClientRect();
        const absTop = up ? triggerRect.top - rootRect.top - listHeight - 2 : triggerRect.bottom - rootRect.top + 2;
        const absLeft = triggerRect.left - rootRect.left;
        if (list) {
          list.style.top = absTop + 'px';
          list.style.left = absLeft + 'px';
          list.style.width = triggerRect.width + 'px';
        }
        setDropdownPos({ top: absTop, left: absLeft, width: triggerRect.width });
      } else {
        if (list) {
          list.style.top = (up ? triggerRect.top - listHeight - 2 : triggerRect.bottom + 2) + 'px';
          list.style.left = triggerRect.left + 'px';
          list.style.width = triggerRect.width + 'px';
        }
        setDropdownPos({
          top: up ? triggerRect.top - listHeight - 2 : triggerRect.bottom + 2,
          left: triggerRect.left,
          width: triggerRect.width,
        });
      }
    };
    window.addEventListener('scroll', recalc, true);
    window.addEventListener('resize', recalc);
    return () => {
      window.removeEventListener('scroll', recalc, true);
      window.removeEventListener('resize', recalc);
    };
  }, [open, items, value, visibleOptions, forceOpenUp]);

  // Ao fechar, limpa o buffer da busca por digitação.
  useEffect(() => {
    if (!open) {
      setSearchBuffer("");
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function handleSelect(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setHighlighted(Math.max(0, items.findIndex((o) => o.value === value)));
        setOpen(true);
        return;
      }
      const delta = event.key === "ArrowDown" ? 1 : -1;
      setHighlighted((current) => {
        const next = current + delta;
        if (next < 0 || next >= items.length) return current;
        return next;
      });
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) {
        setHighlighted(Math.max(0, items.findIndex((o) => o.value === value)));
        setOpen(true);
        return;
      }
      if (highlighted >= 0) {
        handleSelect(items[highlighted].value);
      }
    } else if (event.key === "Tab") {
      setOpen(false);
    } else if (
      open &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      (event.key.length === 1 || event.key === "Backspace")
    ) {
      // Busca por digitação (type-ahead): acumula os caracteres digitados e
      // destaca a primeira opção que comece com o texto (ex.: "tec" → "Técnico").
      event.preventDefault();
      const nextBuffer =
        event.key === "Backspace"
          ? searchBuffer.slice(0, -1)
          : searchBuffer + event.key.toLowerCase();
      setSearchBuffer(nextBuffer);

      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = window.setTimeout(() => {
        setSearchBuffer("");
      }, 1200);

      const query = normalizeLabel(nextBuffer);
      if (query) {
        const matchIndex = items.findIndex((o) =>
          o.label && normalizeLabel(o.label).startsWith(query)
        );
        if (matchIndex >= 0) {
          setHighlighted(matchIndex);
        }
      }
    }
  }

  // Mantém o item destacado visível na lista durante a navegação por teclado.
  useEffect(() => {
    const list = listRef.current;
    if (!open || !list || highlighted < 0) return;
    const itemEl = list.children[highlighted] as HTMLElement | undefined;
    if (!itemEl) return;
    if (itemEl.offsetTop < list.scrollTop) {
      list.scrollTop = itemEl.offsetTop;
    } else if (itemEl.offsetTop + itemEl.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = itemEl.offsetTop + itemEl.offsetHeight - list.clientHeight;
    }
  }, [open, highlighted]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!open) setHighlighted(-1);
          setOpen((o) => !o);
        }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`cg-select-trigger w-full border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500 ${error ? "cg-select-error" : ""} ${className}`}
        style={{ textAlign: "left", cursor: disabled ? "default" : "pointer" }}
      >
        <span className="flex items-center justify-between gap-2">
          <span className={`truncate ${selected ? "" : "text-[#aaa]"}`}>
            {selected ? selected.label : (showPlaceholder ? "---" : "")}
          </span>
          <svg
            width="10"
            height="6"
            viewBox="0 0 10 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className={`shrink-0 transition-transform duration-150 ${theme === 'sidebar' ? 'text-white/70' : 'text-[#777]'} ${open ? (openUp ? "-rotate-180" : "rotate-180") : ""}`}
          >
            <path d="M1 1l4 4 4-4" />
          </svg>
        </span>
      </button>

      {open && dropdownPos && (
        <div
          ref={listRef}
          role="listbox"
          onMouseLeave={() => setHighlighted(-1)}
          className={`cg-select-list ${absolute ? 'absolute z-[100]' : 'fixed z-[9999]'} overflow-y-auto shadow-[0_4px_10px_rgba(0,0,0,0.18)] ${
            theme === 'sidebar'
              ? 'border border-[#163a54] bg-[#1A4567]'
              : 'border border-[#ccc] bg-white'
          } ${dropdownClassName}`}
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, maxHeight: visibleOptions * ROW_HEIGHT }}
        >
          {items.map((op, index) => {
            const isSelected = op.value === value;
            const isHighlighted = index === highlighted;
            return (
              <button
                key={op.value || "__placeholder__"}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlighted(index)}
                onClick={() => handleSelect(op.value)}
                className={`block w-full cursor-pointer truncate px-2 py-1.5 text-left text-sm transition ${
                  optionClassName
                    ? (isHighlighted || isSelected ? 'bg-[#1A4567] text-white' : 'text-white')
                    : theme === 'sidebar'
                      ? isHighlighted || isSelected
                        ? 'bg-[#2a5f8a] text-white'
                        : 'text-white'
                      : isHighlighted || isSelected
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-800'
                } ${optionClassName}`}
              >
                {renderOption ? renderOption(op) : op.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
