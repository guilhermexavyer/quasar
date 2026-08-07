import { deleteField } from "firebase/firestore";

/** Remove campos com valor undefined — o Firestore rejeita undefined ao gravar. */
export function removerUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/**
 * Monta o objeto de update do Firestore a partir dos dados do formulário,
 * garantindo que campos que existiam no documento mas vieram como undefined
 * (foram limpos pelo usuário) sejam removidos de verdade com deleteField() —
 * o updateDoc não remove campos ausentes, então sem isso o valor antigo
 * permaneceria no documento (ex.: trocar a pessoa física de um Colaborador).
 * Retorna o objeto de updates e a lista de campos que serão removidos.
 */
export function montarUpdateComRemocoes<T extends Record<string, any>>(
  atuais: Record<string, any>,
  novos: Partial<T>
): { updates: Record<string, any>; removidos: string[] } {
  const updates: Record<string, any> = { ...removerUndefined(novos) };
  const removidos: string[] = [];
  for (const [key, value] of Object.entries(novos)) {
    if (value === undefined && key in atuais && atuais[key] !== undefined) {
      updates[key] = deleteField();
      removidos.push(key);
    }
  }
  return { updates, removidos };
}
