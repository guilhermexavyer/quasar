import { deleteField } from "firebase/firestore";

/** Remove campos com valor undefined — o Firestore rejeita undefined ao gravar. */
export function removerUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/**
 * Remove `undefined` em qualquer nível (objetos e arrays aninhados). O
 * Firestore rejeita `undefined` mesmo dentro de arrays/objetos (ex.: os
 * elementos embutidos em `campos` de uma banda).
 */
export function removerUndefinedProfundo<T>(valor: T): T {
  if (Array.isArray(valor)) return valor.map((v) => removerUndefinedProfundo(v)) as unknown as T;
  if (valor && typeof valor === "object" && Object.getPrototypeOf(valor) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(valor as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, removerUndefinedProfundo(v)])
    ) as T;
  }
  return valor;
}

/** Campos de controle que não contam como alteração do registro. */
const CAMPOS_CONTROLE = new Set(["id", "_firestoreId", "dt_criacao", "dt_alteracao", "ds_usuario_criacao", "ds_usuario_alteracao"]);

/**
 * Indica se algum campo de `novos` difere do documento atual (ignora campos de
 * controle). Evita gravar dt_alteracao/ds_usuario_alteracao — e o rodapé
 * mostrar uma alteração — quando nada mudou de fato.
 */
export function temAlteracoes(atuais: Record<string, any>, novos: Record<string, any>): boolean {
  return Object.entries(novos).some(([key, value]) => {
    if (CAMPOS_CONTROLE.has(key) || value === undefined) return false;
    return JSON.stringify(atuais[key] ?? null) !== JSON.stringify(value ?? null);
  });
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
