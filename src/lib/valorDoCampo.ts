/**
 * Valor selecionado no momento em um campo que não é de texto/número (dropdown, lookup,
 * checkbox, radio), lido da tela a partir do infobutton do campo. É o valor que será
 * gravado no banco (ex.: "1" no lookup, "N" no checkbox), e não o que já está gravado.
 *
 * O campo é procurado subindo a partir do infobutton até o primeiro container que tenha
 * um controle; a busca para antes de chegar a um container com o infobutton de outro campo.
 * Campos de texto/número (e o de arquivo) devolvem null: o infobutton não mostra valor.
 */

const SELETOR_INFOBUTTON = 'button[aria-label^="Informações do campo"]';
const SELETOR_LOCALIZAR = 'button[aria-label^="Localizar"]';
const NIVEIS_MAXIMOS = 6;

export type ControleDoCampo = { tipo: "lookup" | "dropdown" | "checkbox" | "radio"; elemento: HTMLElement; container: HTMLElement };

/** Controle (não textual) do campo do infobutton, ou null. */
export function controleDoCampo(infobutton: HTMLElement | null): ControleDoCampo | null {
  let container = infobutton?.parentElement ?? null;
  for (let nivel = 0; container && nivel < NIVEIS_MAXIMOS; nivel++, container = container.parentElement) {
    // Subiu demais: o container já tem o infobutton de outro campo.
    const outros = Array.from(container.querySelectorAll<HTMLElement>(SELETOR_INFOBUTTON)).filter((b) => b !== infobutton);
    if (outros.length > 0) return null;

    const localizar = container.querySelector<HTMLElement>(SELETOR_LOCALIZAR);
    if (localizar) {
      // Lookup: o campo da sequência é o primeiro editável (a descrição é somente leitura).
      const sequencia = Array.from(container.querySelectorAll<HTMLInputElement>("input")).find((i) => !i.readOnly && i.type !== "hidden");
      if (sequencia) return { tipo: "lookup", elemento: sequencia, container };
    }
    const dropdown = container.querySelector<HTMLElement>(".cg-select-trigger[data-valor], select");
    if (dropdown) return { tipo: "dropdown", elemento: dropdown, container };
    const radio = container.querySelector<HTMLInputElement>('input[type="radio"]');
    if (radio) return { tipo: "radio", elemento: radio, container };
    const checkbox = container.querySelector<HTMLInputElement>('input[type="checkbox"]');
    if (checkbox) return { tipo: "checkbox", elemento: checkbox, container };
    if (container.querySelector("input, textarea")) return null; // campo de texto/número
  }
  return null;
}

/**
 * Valor que será gravado. Vazio devolve null (o infobutton não mostra parênteses).
 * Checkbox: "S"/"N", ou true/false quando a coluna do banco é boolean.
 */
export function valorDoControle(controle: ControleDoCampo, tipoColuna: string): string | null {
  const { tipo, elemento, container } = controle;
  let valor = "";
  if (tipo === "lookup") {
    valor = (elemento as HTMLInputElement).value.trim();
  } else if (tipo === "dropdown") {
    valor = elemento instanceof HTMLSelectElement ? elemento.value : (elemento.getAttribute("data-valor") ?? "");
  } else if (tipo === "radio") {
    const nome = (elemento as HTMLInputElement).name;
    const radios = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="radio"]')).filter((r) => !nome || r.name === nome);
    valor = radios.find((r) => r.checked)?.value ?? "";
  } else {
    const marcado = (elemento as HTMLInputElement).checked;
    return tipoColuna === "boolean" ? String(marcado) : marcado ? "S" : "N";
  }
  return valor === "" ? null : valor;
}
