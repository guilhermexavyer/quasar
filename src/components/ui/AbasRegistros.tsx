"use client";

/** Uma aba (ex.: Bandas, Parâmetros). */
export interface Aba<T extends string> {
  valor: T;
  rotulo: string;
}

/**
 * Menu de abas das telas abertas pelo duplo clique (ex.: Relatórios > Bandas e
 * Parâmetros). Mesmos tamanhos do menu de navegação (NavegacaoRegistros); a aba
 * selecionada é sublinhada com a cor do fundo das funções do menu lateral.
 */
export default function AbasRegistros<T extends string>({
  abas,
  ativa,
  onChange,
}: {
  abas: Aba<T>[];
  ativa: T;
  onChange?: (aba: T) => void;
}) {
  return (
    <div role="tablist" className="abas-registros mr-4 inline-flex h-[26px] items-center gap-3 px-2.5 text-sm whitespace-nowrap">
      {abas.map((a) => (
        <button
          key={a.valor}
          type="button"
          role="tab"
          aria-selected={ativa === a.valor}
          onClick={() => onChange?.(a.valor)}
          className={`aba-registro text-sm font-normal leading-[20px] cursor-pointer ${ativa === a.valor ? "aba-registro-ativa" : ""}`}
        >
          {a.rotulo}
        </button>
      ))}
    </div>
  );
}
