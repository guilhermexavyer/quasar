"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface FieldInfoPopupProps {
  /** Elemento âncora (o botão de informações do campo). */
  anchor: HTMLElement | null;
  meta: { type: string; field: string; collection: string };
  onClose: () => void;
}

const WIDTH = 240;
const GAP = 6;
const MARGIN = 8;

/**
 * Pop-up "Informações do campo" renderizado via portal em document.body com
 * posição fixa. Assim não é cortado por containers com overflow (área de
 * rolagem dos formulários) nem fica atrás de outras divs. O infobutton fica
 * na lateral inferior esquerda da pop-up (a borda inferior acompanha a borda
 * inferior do botão, subindo para cima), com uma pontinha na lateral
 * esquerda, bem embaixo, apontando para ele; se faltar espaço à direita,
 * vira para o lado esquerdo. Se o modo escuro estiver ativo (detectado pelo
 * ancestral .dark da âncora), usa as cores escuras — o portal sai do escopo
 * .dark, então os overrides globais não se aplicam. Fecha ao clicar fora,
 * rolar ou redimensionar a janela.
 */
export default function FieldInfoPopup({ anchor, meta, onClose }: FieldInfoPopupProps) {
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; flipX: boolean } | null>(null);
  const dark = !!anchor?.closest('.dark');

  // Posiciona ao lado da âncora (à direita do infobutton), centralizado
  // verticalmente com ele. Na primeira passada o pop-up fica invisível para
  // medir; se faltar espaço à direita, vira para o lado esquerdo.
  useLayoutEffect(() => {
    if (!anchor) return;
    const measure = () => {
      const el = popupRef.current;
      const w = el?.offsetWidth ?? WIDTH;
      const h = el?.offsetHeight ?? 130;
      const rect = anchor.getBoundingClientRect();
      let left = rect.right + GAP;
      let flipX = false;
      if (left + w > window.innerWidth - MARGIN) {
        flipX = true;
        left = Math.max(MARGIN, rect.left - w - GAP);
      }
      // O infobutton fica na lateral inferior esquerda da pop-up (onde a
      // pontinha aponta): a borda inferior da pop-up acompanha a borda
      // inferior do botão, subindo para cima.
      let top = rect.bottom - h;
      if (top < MARGIN) top = MARGIN;
      if (top + h > window.innerHeight - MARGIN) top = window.innerHeight - h - MARGIN;
      setPos({ top, left, flipX });
    };
    measure();
  }, [anchor]);

  // Fecha ao clicar fora (fora do pop-up e fora do botão âncora), rolar a
  // página ou redimensionar a janela. `onCloseRef` evita recriar os listeners
  // a cada re-render do formulário.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    function handleDown(event: MouseEvent) {
      if (anchor && anchor.contains(event.target as Node)) return;
      if (popupRef.current && popupRef.current.contains(event.target as Node)) return;
      onCloseRef.current();
    }
    function handleScroll() {
      onCloseRef.current();
    }
    document.addEventListener('mousedown', handleDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      document.removeEventListener('mousedown', handleDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [anchor]);

  const darkClasses = dark
    ? 'bg-[#27272a] border-[#3f3f46] text-[#e4e4e7]'
    : 'bg-white border-[#ccc] text-slate-900';

  return createPortal(
    <div
      ref={popupRef}
      className={`fixed z-[9999] w-[240px] p-[10px] text-xs border shadow-[0_4px_10px_rgba(0,0,0,0.18)] ${darkClasses}`}
      style={pos ? { top: pos.top, left: pos.left } : { top: 0, left: 0, visibility: 'hidden' }}
      onClick={(event) => event.stopPropagation()}
    >
      {/* Pontinha apontando para o infobutton (lateral voltada para ele),
          com a mesma borda da pop-up: um triângulo maior na cor da borda
          por trás de um triângulo menor na cor do fundo. Todas as
          combinações em literais para o Tailwind gerar as classes. */}
      {pos?.flipX ? (
        <>
          <span
            aria-hidden="true"
            className={`absolute h-0 w-0 border-t-[5px] border-b-[5px] border-t-transparent border-b-transparent -right-[8px] bottom-[6px] border-l-[8px] ${dark ? 'border-l-[#3f3f46]' : 'border-l-[#ccc]'}`}
          />
          <span
            aria-hidden="true"
            className={`absolute h-0 w-0 border-t-[4px] border-b-[4px] border-t-transparent border-b-transparent -right-[7px] bottom-[6px] border-l-[7px] ${dark ? 'border-l-[#27272a]' : 'border-l-[#ffffff]'}`}
          />
        </>
      ) : (
        <>
          <span
            aria-hidden="true"
            className={`absolute h-0 w-0 border-t-[5px] border-b-[5px] border-t-transparent border-b-transparent -left-[8px] bottom-[6px] border-r-[8px] ${dark ? 'border-r-[#3f3f46]' : 'border-r-[#ccc]'}`}
          />
          <span
            aria-hidden="true"
            className={`absolute h-0 w-0 border-t-[4px] border-b-[4px] border-t-transparent border-b-transparent -left-[7px] bottom-[6px] border-r-[7px] ${dark ? 'border-r-[#27272a]' : 'border-r-[#ffffff]'}`}
          />
        </>
      )}
      <div className="mb-2 font-semibold">Informações do campo</div>
      <div className="space-y-1">
        <div className={dark ? 'text-[#a1a1aa]' : 'text-slate-600'}><span className="font-semibold">Tipo:</span> {meta.type}</div>
        <div className={dark ? 'text-[#a1a1aa]' : 'text-slate-600'}><span className="font-semibold">Campo:</span> {meta.field}</div>
        <div className={dark ? 'text-[#a1a1aa]' : 'text-slate-600'}><span className="font-semibold">Coleção:</span> {meta.collection}</div>
      </div>
    </div>,
    document.body
  );
}
