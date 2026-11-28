"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { manterNaTela } from "@/lib/posicaoNaTela";

/**
 * Cores da paleta (60), 10 por linha: a 1ª linha com os cinzas (do branco ao preto); nas
 * demais, cada coluna é uma cor — vermelho, laranja, amarelo, lima, verde, turquesa, ciano,
 * azul, roxo e rosa — e cada linha um tom, do mais claro ao mais escuro, priorizando os
 * tons vivos (saturados). A opção sem cor (Transparente) fica à parte, acima dos quadradinhos.
 */
export const CORES_PALETA = [
  "#ffffff", "#f2f2f2", "#d9d9d9", "#bfbfbf", "#a6a6a6", "#8c8c8c", "#737373", "#595959", "#333333", "#000000",
  "#ff8a80", "#ffab40", "#ffff8d", "#ccff90", "#69f0ae", "#64ffda", "#84ffff", "#82b1ff", "#ea80fc", "#ff80ab",
  "#ff5252", "#ff9100", "#ffea00", "#b2ff59", "#00e676", "#1de9b6", "#18ffff", "#448aff", "#e040fb", "#ff4081",
  "#ff1744", "#ff6d00", "#ffd600", "#76ff03", "#00c853", "#00bfa5", "#00e5ff", "#2979ff", "#d500f9", "#f50057",
  "#d50000", "#e65100", "#ffab00", "#64dd17", "#009e3c", "#00897b", "#00b8d4", "#2962ff", "#aa00ff", "#c51162",
  "#9b0000", "#a33a00", "#b38f00", "#3b8a00", "#00692a", "#005b4f", "#00838f", "#003056", "#6a00b3", "#880e4f",
];

/** Fundo da amostra de cor; sem cor = branco com um traço vermelho na diagonal. */
export function fundoDaAmostra(cor: string | null | undefined): CSSProperties {
  return cor
    ? { backgroundColor: cor }
    : { backgroundColor: "#ffffff", backgroundImage: "linear-gradient(to top right, transparent calc(50% - 1px), #e02424 calc(50% - 1px), #e02424 calc(50% + 1px), transparent calc(50% + 1px))" };
}

/** Tamanho (px) de cada quadradinho da paleta e o espaço entre eles. */
const AMOSTRA = 20;
const ESPACO = 4;
const COLUNAS = 10;
/** Altura da linha da opção sem cor (Transparente), acima dos quadradinhos. */
const LINHA_VAZIO = AMOSTRA + ESPACO + 4;

interface CampoCorPaletaProps {
  valor: string | null | undefined;
  onChange: (cor: string) => void;
  disabled?: boolean;
  erro?: boolean;
  /** Nome do campo (leitores de tela e título da pop-up). */
  rotuloAcessivel: string;
  /** Sem a opção vazia (para cores que não podem ficar sem valor). */
  semTransparente?: boolean;
  /** Nome da opção vazia (padrão "Transparente"; ex.: "Padrão" para a cor do texto). */
  rotuloVazio?: string;
  /** Somente leitura: mostra a cor, sem abrir a paleta (ex.: registros excluídos). */
  somenteLeitura?: boolean;
}

/**
 * Campo de cor do sistema: um quadrado com as bordas e a altura dos demais campos (34px),
 * preenchido com a cor escolhida. O clique abre uma pop-up com as cores pré-definidas
 * (CORES_PALETA, 60 cores) e a opção sem cor acima delas, sem o seletor de cores do navegador. A pop-up segue o visual da pop-up
 * dos infobuttons (FieldInfoPopup): fundo branco, borda #ccc, sombra e padding de 10px; no
 * modo escuro, #27272a com borda #3f3f46. Fica num portal em document.body (posição fixa,
 * abaixo do campo; sem espaço, acima) para não ser cortada pela área de rolagem; fecha ao
 * escolher, ao clicar fora, com Esc, ao rolar ou ao redimensionar a janela.
 */
export default function CampoCorPaleta({ valor, onChange, disabled, erro, rotuloAcessivel, semTransparente, rotuloVazio = "Transparente", somenteLeitura }: CampoCorPaletaProps) {
  const [pos, setPos] = useState<{ top: number; left: number; dark: boolean } | null>(null);
  const botaoRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const cores = CORES_PALETA;
  const aberto = !!pos && !disabled && !somenteLeitura;
  useEffect(() => {
    if (!aberto) return;
    const fechar = () => setPos(null);
    const fora = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (botaoRef.current?.contains(alvo) || popupRef.current?.contains(alvo)) return;
      fechar();
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") fechar(); };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    window.addEventListener("scroll", fechar, true);
    window.addEventListener("resize", fechar);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("scroll", fechar, true);
      window.removeEventListener("resize", fechar);
    };
  }, [aberto]);
  function alternar() {
    if (pos) { setPos(null); return; }
    const botao = botaoRef.current;
    if (!botao) return;
    const rect = botao.getBoundingClientRect();
    // Largura e altura da pop-up: quadradinhos + espaços + padding (10) + borda (1) dos dois lados.
    const linhas = Math.ceil(cores.length / COLUNAS);
    const largura = COLUNAS * AMOSTRA + (COLUNAS - 1) * ESPACO + 22;
    const altura = linhas * AMOSTRA + (linhas - 1) * ESPACO + 22 + (semTransparente ? 0 : LINHA_VAZIO);
    let top = rect.bottom + 4;
    if (top + altura > window.innerHeight - 8) top = Math.max(8, rect.top - altura - 4);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - largura - 8));
    setPos({ top, left, dark: !!botao.closest(".dark") });
  }
  const atual = (valor ?? "").toLowerCase();
  const nomeDe = (cor: string) => cor || rotuloVazio;
  const inativo = disabled && !somenteLeitura;
  return (
    <div className="shrink-0" style={{ width: 34, height: 34 }}>
      <button
        ref={botaoRef}
        type="button"
        disabled={disabled || somenteLeitura}
        onClick={alternar}
        aria-label={rotuloAcessivel}
        aria-haspopup={somenteLeitura ? undefined : "dialog"}
        aria-expanded={somenteLeitura ? undefined : aberto}
        title={nomeDe(valor ?? "")}
        className={`cg-cor block h-full w-full p-0 ${erro ? "border-red-500" : ""} ${inativo ? "cg-cor-desabilitado cursor-default" : somenteLeitura ? "cursor-default" : "cursor-pointer"}`}
        style={inativo ? undefined : fundoDaAmostra(valor)}
      />
      {aberto && pos && createPortal(
        <div
          ref={(el) => { popupRef.current = el; manterNaTela(el); }}
          role="dialog"
          aria-label={rotuloAcessivel}
          className={`fixed z-[9999] border p-[10px] shadow-[0_4px_10px_rgba(0,0,0,0.18)] ${pos.dark ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-[#ccc]"}`}
          style={{ top: pos.top, left: pos.left, display: "grid", gridTemplateColumns: `repeat(${COLUNAS}, ${AMOSTRA}px)`, gap: ESPACO }}
        >
          {/* Sem cor (Transparente / Padrão): linha própria, acima das cores. */}
          {!semTransparente && (
            <button
              type="button"
              onClick={() => { onChange(""); setPos(null); }}
              aria-pressed={atual === ""}
              className={`flex cursor-pointer items-center gap-2 bg-transparent p-0 text-left text-xs ${pos.dark ? "text-[#e4e4e7]" : "text-slate-700"}`}
              style={{ gridColumn: "1 / -1", height: AMOSTRA, marginBottom: 4 }}
            >
              <span
                style={{
                  ...fundoDaAmostra(""),
                  width: AMOSTRA,
                  height: AMOSTRA,
                  border: `1px solid ${pos.dark ? "#3f3f46" : "#ccc"}`,
                  outline: atual === "" ? "2px solid #066fc5" : undefined,
                  outlineOffset: 1,
                }}
              />
              {rotuloVazio}
            </button>
          )}
          {cores.map((cor) => {
            const selecionada = atual === cor;
            return (
              <button
                key={cor}
                type="button"
                onClick={() => { onChange(cor); setPos(null); }}
                title={nomeDe(cor)}
                aria-label={nomeDe(cor)}
                aria-pressed={selecionada}
                className="cursor-pointer p-0"
                style={{
                  ...fundoDaAmostra(cor),
                  width: AMOSTRA,
                  height: AMOSTRA,
                  border: `1px solid ${pos.dark ? "#3f3f46" : "#ccc"}`,
                  borderRadius: 0,
                  outline: selecionada ? "2px solid #066fc5" : undefined,
                  outlineOffset: 1,
                }}
              />
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}
