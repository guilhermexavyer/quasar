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
