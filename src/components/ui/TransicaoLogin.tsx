"use client";

import { useLayoutEffect, useRef } from "react";

/** Posição e tamanho da logo do menu lateral (centro em 24 x 22, 30px), como no cabeçalho do menu. */
const LOGO_MENU = { left: 9, top: 7, size: 30 };
/** Tamanho da logo na tela de login (imagem de 68px dentro do círculo de 80px). */
const LOGO_LOGIN = 68;

const DURACAO = 800;
const EASING = "cubic-bezier(0.65, 0, 0.35, 1)";

interface TransicaoLoginProps {
  /** Posição da logo na tela de login quando o login foi aprovado (null: centro da tela). */
  origemLogo: { left: number; top: number } | null;
  /** Largura final do painel azul: a largura do menu lateral. */
  larguraFinal: number;
  onFim: () => void;
}

/**
 * Transição depois do login: o fundo azul da tela de login encolhe para a esquerda até virar o menu
 * lateral, revelando o sistema (branco ou escuro), e a logo voa do centro para o cabeçalho do menu.
 */
export default function TransicaoLogin({ origemLogo, larguraFinal, onFim }: TransicaoLoginProps) {
  const painelRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const halo = useRef<HTMLDivElement>(null);
  const onFimRef = useRef(onFim);
  useLayoutEffect(() => {
    onFimRef.current = onFim;
  });

  // Antes da pintura, para a logo não aparecer um quadro já no menu.
  useLayoutEffect(() => {
    const painel = painelRef.current;
    const logo = logoRef.current;
    if (!painel || !logo) return;

    const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduzir || typeof painel.animate !== "function") {
      onFimRef.current();
      return;
    }

    const largura = window.innerWidth;
    const origem = origemLogo ?? {
      left: (largura - LOGO_LOGIN) / 2,
      top: window.innerHeight / 2 - 160,
    };
    const escala = LOGO_LOGIN / LOGO_MENU.size;
    const dx = origem.left - LOGO_MENU.left;
    const dy = origem.top - LOGO_MENU.top;

    const animacoes = [
      // Painel azul: de tela cheia até a largura do menu lateral.
      painel.animate(
        [
          { clipPath: "inset(0px 0px 0px 0px)" },
          { clipPath: `inset(0px ${Math.max(0, largura - larguraFinal)}px 0px 0px)` },
        ],
        { duration: DURACAO, easing: EASING, fill: "forwards" },
      ),
      // Logo: do centro da tela de login para o cabeçalho do menu.
      logo.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${escala})` },
          { transform: "translate(0px, 0px) scale(1)" },
        ],
        { duration: DURACAO, easing: EASING, fill: "forwards" },
      ),
    ];
    // O círculo em volta da logo do login some no começo do voo.
    halo.current?.animate(
      [
        { opacity: 1, transform: "scale(1)" },
        { opacity: 0, transform: "scale(0.6)" },
      ],
      { duration: 260, easing: "ease-out", fill: "forwards" },
    );

    let terminou = false;
    Promise.all(animacoes.map((a) => a.finished))
      .then(() => {
        if (terminou) return;
        terminou = true;
        onFimRef.current();
      })
      .catch(() => {
        /* animação cancelada (desmontado) */
      });
    return () => {
      terminou = true;
      animacoes.forEach((a) => a.cancel());
    };
  }, [origemLogo, larguraFinal]);

  const haloLeft = (origemLogo?.left ?? 0) - 6;
  const haloTop = (origemLogo?.top ?? 0) - 6;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden="true">
      <div ref={painelRef} className="absolute inset-0" style={{ backgroundColor: "#003056" }} />
      {origemLogo && (
        <div
          ref={halo}
          className="fixed rounded-full border border-white/20 bg-white/10 shadow-[0_0_0_8px_rgba(255,255,255,0.08)]"
          style={{ left: haloLeft, top: haloTop, width: 80, height: 80 }}
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- mesma imagem da logo do menu, animada à mão */}
      <img
        ref={logoRef}
        src="/images/Logo%20Quasar%202.0%20-%20Negativa.png"
        alt=""
        className="fixed max-w-none object-contain"
        style={{
          left: LOGO_MENU.left,
          top: LOGO_MENU.top,
          width: LOGO_MENU.size,
          height: LOGO_MENU.size,
          transformOrigin: "0 0",
          willChange: "transform",
        }}
      />
    </div>
  );
}
