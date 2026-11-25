"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Infobutton dos rótulos ("Informações do campo ..."): continua clicável. */
const INFOBUTTON = '[aria-label^="Informações do campo"]';

/**
 * Formulário da própria função só para ver (Detalhe da auditoria): todos os campos,
 * dropdowns, checkboxes, radios, lookups e botões ficam desabilitados (com o estilo de
 * desabilitado do sistema), menos os infobuttons dos rótulos, que seguem abrindo as
 * informações do campo. Um fieldset desabilitado bloquearia também os infobuttons; por isso
 * os controles são desabilitados um a um (inclusive os que aparecem depois, ao trocar o
 * registro exibido).
 *
 * `empilhar`: um campo em cima do outro, na ordem do formulário (a grade vira uma coluna e
 * as linhas de checkboxes viram colunas). `ocultarBarra`: esconde a barra superior do
 * formulário (dropdown Pai, setas e breadcrumb), como no "Ver" de Exclusões.
 */
export default function FormularioSomenteLeitura({ children, empilhar = true, ocultarBarra = false, ativo = true }: { children: ReactNode; empilhar?: boolean; ocultarBarra?: boolean; ativo?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const raiz = ref.current;
    if (!raiz || !ativo) return;
    const desabilitar = () => {
      raiz.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLButtonElement>("input, textarea, select, button").forEach((el) => {
        if (el.matches(INFOBUTTON)) return;
        if (!el.disabled) el.disabled = true;
      });
      raiz.querySelectorAll<HTMLElement>("[contenteditable='true']").forEach((el) => el.setAttribute("contenteditable", "false"));
    };
    desabilitar();
    const observador = new MutationObserver(desabilitar);
    observador.observe(raiz, { subtree: true, childList: true, attributes: true, attributeFilter: ["disabled"] });
    return () => observador.disconnect();
  }, [ativo]);
  // Sem leitura somente (ex.: relatório que pode ser alterado): o conteúdo como é.
  if (!ativo) return <>{children}</>;
  return (
    <div
      ref={ref}
      className={[
        "min-w-0",
        // Sem os botões de gravar/cancelar do formulário.
        "[&_.button-save]:!hidden [&_.button-cancel]:!hidden",
        ocultarBarra ? "[&>div>div:first-child]:!hidden" : "",
        empilhar
          ? [
              // Um campo em cima do outro, na ordem do formulário.
              "[&_.grid]:!grid-cols-1 [&_[class*='col-span-']]:!col-span-1 [&_[class*='col-start-']]:!col-start-auto [&_.flex-wrap]:!flex-col",
              // Mesma distância (15px) entre todos os campos, também entre as seções.
              "[&_.grid]:!gap-[15px] [&_.flex-wrap]:!gap-[15px]",
              "[&_[class*='space-y-']]:!flex [&_[class*='space-y-']]:!flex-col [&_[class*='space-y-']]:!gap-[15px] [&_[class*='space-y-']>*]:!my-0",
              "[&_section>h2]:!mb-[15px]",
              // Sem espaço extra no topo do formulário (logo abaixo de "Antes"/"Depois").
              "[&_.mt-4.flex-1]:!mt-0 [&_.mt-6.flex-1]:!mt-0 [&_.pt-1]:!pt-0 [&_.pt-2]:!pt-0",
              // Radios e checkboxes com a altura dos demais campos (34px), sem margem própria.
              "[&_label:has(>input[type='radio'])]:!min-h-[34px] [&_label:has(>input[type='checkbox'])]:!min-h-[34px]",
              "[&_div:has(>label>input[type='radio'])]:!mb-0",
            ].join(" ")
          : "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
