"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { carregarEsquema, carregarReferencias, tabelaReferenciada, tipoDaColuna, tipoDeclarado } from "@/lib/esquemaBanco";
import { FUNCOES_EXCLUSAO } from "@/lib/exclusoesUtils";
import { controleDoCampo, valorDoControle } from "@/lib/valorDoCampo";
import { ajudaDoCampo } from "@/lib/ajudaCampos";

interface FieldInfoPopupProps {
  /** Elemento âncora (o botão de informações do campo). */
  anchor: HTMLElement | null;
  meta: { type: string; field: string; collection: string };
  onClose: () => void;
}

const WIDTH = 240;
const GAP = 6;
const MARGIN = 8;
/** Metade da altura da pontinha (triângulo de 10px). */
const SETA = 5;

/**
 * Pop-up "Informações do campo" renderizado via portal em document.body com
 * posição fixa. Assim não é cortado por containers com overflow (área de
 * rolagem dos formulários) nem fica atrás de outras divs. O infobutton fica
 * na lateral inferior esquerda da pop-up (a borda inferior acompanha a borda
 * inferior do botão, subindo para cima), com uma pontinha na lateral
 * apontando para o centro do ícone; se faltar espaço à direita, vira para o
 * lado esquerdo. Quando a pop-up é empurrada para caber na tela, ou muda de
 * tamanho depois de aberta ("Depende de" carregado), a pontinha acompanha o
 * ícone. Seções: Tipo/Coluna/Tabela, Depende de e Ajuda, separadas por linhas;
 * Depende de e Ajuda ficam ocultos até clicar na seta ao lado do título. Se o modo escuro estiver ativo (detectado pelo
 * ancestral .dark da âncora), usa as cores escuras — o portal sai do escopo
 * .dark, então os overrides globais não se aplicam. Fecha ao clicar fora,
 * rolar ou redimensionar a janela.
 */
export default function FieldInfoPopup({ anchor, meta, onClose }: FieldInfoPopupProps) {
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; flipX: boolean; seta: number; largura: number | null } | null>(null);
  // Largura reduzida quando a pop-up não cabe inteira em nenhum dos lados do ícone (tela estreita).
  const larguraRef = useRef<number | null>(null);
  const ajuda = ajudaDoCampo(meta.collection, meta.field);
  // "Depende de" e "Ajuda" começam ocultos; a seta ao lado do título mostra/oculta.
  const [expandido, setExpandido] = useState(false);
  const dark = !!anchor?.closest('.dark');

  // Tipo real da coluna no banco (PostgreSQL); até chegar, ou para campos que
  // não são colunas (ex.: modais), mostra o tipo declarado na tela.
  const [tipoReal, setTipoReal] = useState<string | null>(null);
  useEffect(() => {
    let ativo = true;
    carregarEsquema().then((esquema) => {
      if (ativo) setTipoReal(tipoDaColuna(esquema, meta.collection, meta.field));
    });
    return () => {
      ativo = false;
    };
  }, [meta.collection, meta.field]);
  const tipo = tipoReal ?? tipoDeclarado(meta.type);

  // Campos que guardam a sequência de um registro de outra tabela (nr_seq_...): de onde ele vem,
  // como "Função > Opção do dropdown" (ex.: Cadastros Gerais > Sexo).
  const [dependeDe, setDependeDe] = useState<string | null>(null);
  useEffect(() => {
    let ativo = true;
    carregarReferencias().then((referencias) => {
      if (!ativo) return;
      const tabela = tabelaReferenciada(referencias, meta.collection, meta.field);
      const origem = tabela ? FUNCOES_EXCLUSAO.find((f) => f.colecao === tabela) : undefined;
      setDependeDe(origem ? `${origem.funcao} > ${origem.dropdown}` : null);
    });
    return () => {
      ativo = false;
    };
  }, [meta.collection, meta.field]);

  // Campos que não são de texto/número (dropdown, lookup, checkbox, radio): valor selecionado
  // no momento (o que será gravado), exibido entre parênteses depois do nome da coluna.
  // O valor fica junto do infobutton a que pertence: outro campo não mostra o valor anterior.
  const [lido, setLido] = useState<{ anchor: HTMLElement | null; valor: string | null } | null>(null);
  const valorAtual = lido && lido.anchor === anchor ? lido.valor : null;
  useEffect(() => {
    const controle = controleDoCampo(anchor);
    if (!controle) return;
    const atualizar = () => setLido({ anchor, valor: valorDoControle(controle, tipo) });
    // Primeira leitura fora do corpo do efeito (evita renderização em cascata).
    const inicial = window.requestAnimationFrame(atualizar);
    // Acompanha mudanças com o pop-up aberto (teclado, troca do dropdown).
    const observador = new MutationObserver(atualizar);
    observador.observe(controle.container, { subtree: true, attributes: true, attributeFilter: ['data-valor', 'value', 'checked'] });
    controle.container.addEventListener('input', atualizar);
    controle.container.addEventListener('change', atualizar);
    return () => {
      window.cancelAnimationFrame(inicial);
      observador.disconnect();
      controle.container.removeEventListener('input', atualizar);
      controle.container.removeEventListener('change', atualizar);
    };
  }, [anchor, tipo]);

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
      // À direita do ícone; sem espaço, à esquerda. Se não couber inteira em nenhum
      // dos lados, fica no lado com mais espaço e estreita (o texto quebra linha), para
      // nunca cobrir o ícone e a pontinha continuar apontando para ele.
      const espacoDireita = window.innerWidth - MARGIN - (rect.right + GAP);
      const espacoEsquerda = rect.left - GAP - MARGIN;
      let flipX = false;
      if (w > espacoDireita) {
        if (w <= espacoEsquerda) {
          flipX = true;
        } else {
          flipX = espacoEsquerda > espacoDireita;
          larguraRef.current = Math.max(160, Math.floor(flipX ? espacoEsquerda : espacoDireita));
        }
      }
      const largura = larguraRef.current;
      const larguraFinal = largura !== null ? Math.min(w, largura) : w;
      const left = flipX ? Math.max(MARGIN, rect.left - larguraFinal - GAP) : rect.right + GAP;
      // O infobutton fica na lateral inferior esquerda da pop-up (onde a
      // pontinha aponta): a borda inferior da pop-up acompanha a borda
      // inferior do botão, subindo para cima.
      let top = rect.bottom - h;
      if (top + h > window.innerHeight - MARGIN) top = window.innerHeight - h - MARGIN;
      if (top < MARGIN) top = MARGIN;
      // Pontinha no centro vertical do ícone (distância a partir da base interna da pop-up, sem a borda de 1px),
      // sem sair das quinas da pop-up.
      const centro = rect.top + rect.height / 2;
      const seta = Math.min(Math.max(top + h - 1 - centro - SETA, 4), Math.max(4, h - 2 * SETA - 4));
      setPos((atual) =>
        atual && atual.top === top && atual.left === left && atual.flipX === flipX && atual.seta === seta && atual.largura === largura
          ? atual
          : { top, left, flipX, seta, largura }
      );
    };
    larguraRef.current = null;
    measure();
    // Conteúdo que chega depois (tipo real, "Depende de", valor atual) muda a altura:
    // reposiciona para a base continuar alinhada ao ícone.
    const el = popupRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observador = new ResizeObserver(measure);
    observador.observe(el);
    return () => observador.disconnect();
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

  const corTexto = dark ? 'text-[#a1a1aa]' : 'text-slate-600';
  const divisoria = `my-2 border-0 border-t ${dark ? 'border-[#3f3f46]' : 'border-[#e5e5e5]'}`;
  const darkClasses = dark
    ? 'bg-[#27272a] border-[#3f3f46] text-[#e4e4e7]'
    : 'bg-white border-[#ccc] text-slate-900';

  return createPortal(
    <div
      ref={popupRef}
      // Largura mínima de 240px e máxima de 320px: textos longos (Ajuda, tabela) quebram linha.
      className={`fixed z-[9999] w-max min-w-[240px] max-w-[min(320px,calc(100vw-16px))] [overflow-wrap:anywhere] p-[10px] text-xs border shadow-[0_4px_10px_rgba(0,0,0,0.18)] ${darkClasses}`}
      style={{
        ...(pos ? { top: pos.top, left: pos.left } : { top: 0, left: 0, visibility: 'hidden' as const }),
        ...(pos?.largura ? { maxWidth: pos.largura, minWidth: Math.min(240, pos.largura) } : {}),
      }}
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
            style={{ bottom: pos?.seta ?? 6 }}
            className={`absolute h-0 w-0 border-t-[5px] border-b-[5px] border-t-transparent border-b-transparent -right-[8px] border-l-[8px] ${dark ? 'border-l-[#3f3f46]' : 'border-l-[#ccc]'}`}
          />
          <span
            aria-hidden="true"
            style={{ bottom: (pos?.seta ?? 6) + 1 }}
            className={`absolute h-0 w-0 border-t-[4px] border-b-[4px] border-t-transparent border-b-transparent -right-[7px] border-l-[7px] ${dark ? 'border-l-[#27272a]' : 'border-l-[#ffffff]'}`}
          />
        </>
      ) : (
        <>
          <span
            aria-hidden="true"
            style={{ bottom: pos?.seta ?? 6 }}
            className={`absolute h-0 w-0 border-t-[5px] border-b-[5px] border-t-transparent border-b-transparent -left-[8px] border-r-[8px] ${dark ? 'border-r-[#3f3f46]' : 'border-r-[#ccc]'}`}
          />
          <span
            aria-hidden="true"
            style={{ bottom: (pos?.seta ?? 6) + 1 }}
            className={`absolute h-0 w-0 border-t-[4px] border-b-[4px] border-t-transparent border-b-transparent -left-[7px] border-r-[7px] ${dark ? 'border-r-[#27272a]' : 'border-r-[#ffffff]'}`}
          />
        </>
      )}
      {/* Cabeçalho clicável (título + seta): mostra/oculta "Depende de" e "Ajuda". */}
      {dependeDe || ajuda ? (
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          aria-expanded={expandido}
          title={expandido ? 'Ocultar detalhes' : 'Mostrar detalhes'}
          className="mb-2 flex w-full items-center justify-between gap-2 bg-transparent p-0 text-left cursor-pointer"
        >
          <span className="font-semibold">Informações do campo</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={`shrink-0 ${dark ? 'text-[#a1a1aa]' : 'text-slate-500'}`}
          >
            {expandido ? <path d="m18 15-6-6-6 6" /> : <path d="m6 9 6 6 6-6" />}
          </svg>
        </button>
      ) : (
        <div className="mb-2 font-semibold">Informações do campo</div>
      )}
      <div className="space-y-1">
        <div className={corTexto}><span className="font-semibold">Tipo:</span> {tipo}</div>
        <div className={corTexto}><span className="font-semibold">Coluna:</span> {meta.field}{valorAtual !== null && ` (${valorAtual})`}</div>
        <div className={corTexto}><span className="font-semibold">Tabela:</span> {meta.collection}</div>
      </div>
      {expandido && dependeDe && (
        <>
          <hr className={divisoria} />
          <div className={corTexto}><span className="font-semibold">Depende de:</span> {dependeDe}</div>
        </>
      )}
      {expandido && ajuda && (
        <>
          <hr className={divisoria} />
          <div className={corTexto}><span className="font-semibold">Ajuda:</span> {ajuda}</div>
        </>
      )}
    </div>,
    document.body
  );
}
