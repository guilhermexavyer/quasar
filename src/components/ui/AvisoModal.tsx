"use client";

import { useEffect, useMemo, useState } from "react";
import { obterAviso, type CampoAviso } from "@/services/avisoService";
import { sanitizarHtml } from "@/lib/sanitizarHtml";

/** Título de cada aviso (mesmo texto do botão que o abre). */
export const TITULOS_AVISO: Record<CampoAviso, string> = {
  ds_esqueceu_senha: "Esqueceu sua senha?",
  ds_politica_privacidade: "Política de Privacidade",
};

interface AvisoModalProps {
  /** Aviso a exibir; null = modal fechado. */
  campo: CampoAviso | null;
  onClose: () => void;
}

/**
 * Modal que exibe o conteúdo configurado em Administração do Sistema > Avisos.
 * O HTML passa por sanitizarHtml (só formatação) antes de ser exibido.
 */
export default function AvisoModal({ campo, onClose }: AvisoModalProps) {
  // Resultado guardado junto com o aviso a que pertence: ao abrir outro aviso
  // (ou reabrir), o conteúdo anterior não é exibido enquanto carrega.
  const [carregado, setCarregado] = useState<{ campo: CampoAviso; conteudo: string | null; erro: boolean; abertura: number } | null>(null);
  const [abertura, setAbertura] = useState(0);
  const [campoAnterior, setCampoAnterior] = useState<CampoAviso | null>(null);
  if (campo !== campoAnterior) {
    setCampoAnterior(campo);
    if (campo) setAbertura((n) => n + 1);
  }

  useEffect(() => {
    if (!campo) return;
    let cancelado = false;
    obterAviso()
      .then((aviso) => { if (!cancelado) setCarregado({ campo, conteudo: aviso?.[campo] ?? "", erro: false, abertura }); })
      .catch(() => { if (!cancelado) setCarregado({ campo, conteudo: null, erro: true, abertura }); });
    return () => { cancelado = true; };
  }, [campo, abertura]);

  const atual = carregado && carregado.campo === campo && carregado.abertura === abertura ? carregado : null;
  const conteudo = atual?.conteudo ?? null;
  const erro = atual?.erro ?? false;

  useEffect(() => {
    if (!campo) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [campo, onClose]);

  const html = useMemo(() => (conteudo ? sanitizarHtml(conteudo) : ""), [conteudo]);

  if (!campo) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={TITULOS_AVISO[campo]}
        className="relative w-full max-w-[640px] bg-white modal-dark p-0 shadow-xl shadow-black/20 max-h-[90vh] flex flex-col"
      >
        <div className="flex-shrink-0 flex items-center justify-between bg-[#ccc] px-[15px]">
          <h2 className="text-base font-semibold" style={{ color: "#000" }}>{TITULOS_AVISO[campo]}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
            aria-label="Fechar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-[15px] overflow-auto text-sm text-slate-800">
          {erro ? (
            <p className="text-slate-600">Não foi possível carregar o aviso. Tente novamente.</p>
          ) : conteudo === null ? (
            <p className="text-slate-600">Carregando...</p>
          ) : html.trim() === "" ? (
            <p className="text-slate-600">Nenhum conteúdo cadastrado.</p>
          ) : (
            <div className="aviso-conteudo" dangerouslySetInnerHTML={{ __html: html }} />
          )}
        </div>
      </div>
    </div>
  );
}
