"use client";

import SearchIcon from "@/components/ui/SearchIcon";

interface CampoPesquisaProps {
  valor: string;
  onChange: (valor: string) => void;
  /** Rótulo acessível (o campo não tem placeholder). */
  ariaLabel?: string;
}

/**
 * Campo de pesquisa do topo das listas dos containers (Parâmetros, Avisos,
 * Regras, Campos, Exclusões): filtra a lista em tempo real; % separa partes do
 * termo, como no LIKE do SQL (ver correspondePesquisa). Sem placeholder, com a
 * lupa dentro do campo, à direita.
 */
export default function CampoPesquisa({ valor, onChange, ariaLabel = "Pesquisar" }: CampoPesquisaProps) {
  return (
    <div className="relative mb-[5px] shrink-0">
      <input
        type="text"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="w-full rounded-[3px] border border-slate-300 bg-white py-1.5 pl-2 pr-8 text-sm transition focus:border-[#003056] focus:outline-none"
      />
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">
        <SearchIcon size={16} />
      </span>
    </div>
  );
}
