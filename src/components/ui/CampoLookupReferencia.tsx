"use client";

import SearchIcon from "@/components/ui/SearchIcon";

interface CampoLookupReferenciaProps {
  /** Rótulo já renderizado (com asterisco e informações do campo). */
  rotulo: React.ReactNode;
  /** Texto do botão de localizar para leitores de tela (ex.: "Localizar curso"). */
  ariaLocalizar: string;
  /** Classe do input (borda de erro etc.), igual à dos demais campos do formulário. */
  inputClass: string;
  /** Sequência digitada/selecionada (texto; vazio = sem valor). */
  valor: string;
  /** Descrição do registro da sequência (somente leitura). */
  descricao: string;
  desabilitado?: boolean;
  onChange: (valor: string) => void;
  onLocalizar: () => void;
  className?: string;
}

/**
 * Campo de referência por lookup: sequência (110px), descrição somente leitura e botão
 * de localizar, no mesmo visual dos lookups do sistema (ex.: Fornecedor em Ativos).
 */
export default function CampoLookupReferencia({
  rotulo,
  ariaLocalizar,
  inputClass,
  valor,
  descricao,
  desabilitado = false,
  onChange,
  onLocalizar,
  className = '',
}: CampoLookupReferenciaProps) {
  return (
    <div className={`${className} group`}>
      {rotulo}
      <div className="flex items-center gap-2 flex-nowrap">
        <div style={{ width: 110 }}>
          <input
            inputMode="numeric"
            maxLength={10}
            disabled={desabilitado}
            className={`${inputClass} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
            value={valor}
            onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
          />
        </div>
        <div className="relative flex-1 min-w-0">
          <input readOnly tabIndex={-1} className={`${inputClass} pr-[34px] !bg-slate-100 text-slate-700`} value={descricao} />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            <button
              type="button"
              onClick={onLocalizar}
              disabled={desabilitado}
              className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup disabled:cursor-default disabled:opacity-40"
              aria-label={ariaLocalizar}
            >
              <SearchIcon size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
