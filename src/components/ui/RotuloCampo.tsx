"use client";

import { useState, type ReactNode } from "react";
import FieldInfoPopup from "@/components/ui/FieldInfoPopup";
import { tipoDoCampo } from "@/lib/campoInfo";

interface RotuloCampoProps {
  /** Texto do rótulo. */
  texto: ReactNode;
  /** Coleção (ou origem) do campo exibida em "Informações do campo". */
  colecao: string;
  /** Nome do campo no banco. */
  campo: string;
  /** Tipo do campo; se omitido, é deduzido do nome (tipoDoCampo). */
  tipo?: string;
  /** Conteúdo antes do texto (ex.: asterisco de obrigatório). */
  prefixo?: ReactNode;
}

/**
 * Rótulo de campo com infobutton (mesmo visual dos formulários): o botão de
 * informações aparece ao passar o mouse e abre a pop-up "Informações do campo".
 * Usado nos modais (filtros, ações, localizar, visualização).
 */
export default function RotuloCampo({ texto, colecao, campo, tipo, prefixo }: RotuloCampoProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const descricao = typeof texto === "string" ? texto : campo;

  return (
    <div className="block text-sm mb-1" style={{ color: "#666" }}>
      <div className="relative group/rotulo inline-flex items-center gap-2">
        <span className="inline-flex items-center gap-1">
          {prefixo}
          <span>{texto}</span>
        </span>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            const alvo = event.currentTarget;
            setAnchor((atual) => (atual ? null : alvo));
          }}
          aria-label={`Informações do campo ${descricao}`}
          className={`inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer transition-none ${anchor ? "opacity-100" : "opacity-0 group-hover/rotulo:opacity-100"}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <circle cx="12" cy="16" r="0.5" />
          </svg>
        </button>
        {anchor && (
          <FieldInfoPopup
            anchor={anchor}
            meta={{ type: tipo ?? tipoDoCampo(campo), field: campo, collection: colecao }}
            onClose={() => setAnchor(null)}
          />
        )}
      </div>
    </div>
  );
}
