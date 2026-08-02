/** Remove campos com valor undefined — o Firestore rejeita undefined ao gravar. */
export function removerUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}
