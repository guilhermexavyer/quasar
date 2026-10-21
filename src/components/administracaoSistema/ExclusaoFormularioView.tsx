"use client";

import type { ReactNode } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Select from "@/components/ui/Select";
import { ADMIN_OPCOES_DROPDOWN } from "@/lib/permissoesUtils";
import { formatDate } from "@/lib/pessoaFisicaUtils";
import type { FuncaoExclusao } from "@/lib/exclusoesUtils";
import type { Exclusao } from "@/services/exclusaoService";

interface ExclusaoFormularioViewProps {
  exclusao: Exclusao;
  funcao: FuncaoExclusao;
  manageSelection: string;
  allowedSubmodulos?: string[];
  /** Volta para a lista de exclusões. */
  onFechar: () => void;
  resolverNomeAutor?: (nome: string) => string;
  darkMode?: boolean;
  /**
   * Formulário da própria função (com os dados da exclusão). Fica dentro de um
   * fieldset desabilitado — todos os campos e botões ficam bloqueados — e a
   * barra superior e os botões Cancelar/Salvar dele ficam ocultos.
   */
  children: ReactNode;
  /** true quando o conteúdo é o formulário genérico (sem barra própria a ocultar). */
  generico?: boolean;
}

/**
 * "Ver" de um registro excluído (Administração do Sistema > Exclusões): o
 * formulário da função, somente leitura, com os dados como estavam na
 * exclusão. A barra superior traz o dropdown pai e o breadcrumb
 * "Exclusões > Função > Dropdown: N" (clicando, volta para a lista).
 */
export default function ExclusaoFormularioView({
  exclusao,
  funcao,
  manageSelection,
  allowedSubmodulos = ["exclusoes"],
  onFechar,
  resolverNomeAutor = (nome) => nome,
  darkMode = false,
  children,
  generico = false,
}: ExclusaoFormularioViewProps) {
  const corBreadcrumb = darkMode ? "#ddd" : "#333";
  const sublinhar = {
    onMouseEnter: (e: ReactMouseEvent<HTMLElement>) => { e.currentTarget.style.borderBottomColor = darkMode ? "#fff" : "#000"; },
    onMouseLeave: (e: ReactMouseEvent<HTMLElement>) => { e.currentTarget.style.borderBottomColor = "transparent"; },
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-3 min-h-[42px]">
        <div className="flex items-center gap-2 min-w-0">
          <Select
            value={manageSelection}
            onChange={() => {}}
            options={ADMIN_OPCOES_DROPDOWN.filter((o) => allowedSubmodulos.includes(o.value))}
            disabled
            showPlaceholder={false}
            className="!w-[180px]"
          />
          <div
            className="flex items-center text-xs ml-2 whitespace-nowrap overflow-hidden px-2 py-1"
            style={{ color: darkMode ? "#fff" : "#000", border: "1px solid", borderColor: darkMode ? "#2c2c31 #38383e #38383e #2c2c31" : "#999 #ccc #ccc #999" }}
          >
            <span className="cursor-pointer" style={{ borderBottom: "1px solid transparent", color: corBreadcrumb }} onClick={onFechar} {...sublinhar}>
              Exclusões: {funcao.funcao} &gt; {funcao.dropdown}
            </span>
            <span className="mx-1">&gt;</span>
            <span style={{ color: corBreadcrumb }}>Registro: {exclusao.nr_sequencia ?? ""}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onFechar}
          className="inline-flex items-center rounded-[3px] border border-transparent bg-transparent px-4 py-2.5 text-sm font-normal text-[#066fc5] transition cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
        >
          Fechar
        </button>
      </div>

      {/* Somente leitura: o fieldset desabilita todos os campos e botões do formulário. */}
      <fieldset
        disabled
        className={`mt-2 flex-1 flex flex-col min-h-0 min-w-0 border-0 p-0 m-0 [&_.button-save]:!hidden [&_.button-cancel]:!hidden ${generico ? "" : "[&>div>div:first-child]:!hidden"}`}
      >
        {children}
      </fieldset>

      <div className="pt-2 text-[13px] text-slate-500">
        Excluído por {resolverNomeAutor(exclusao.ds_usuario_exclusao) || "-"} em {exclusao.dt_exclusao ? formatDate(exclusao.dt_exclusao) : "-"}
      </div>
    </div>
  );
}
