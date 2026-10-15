import { collection, deleteField, doc, getDoc, getDocs, runTransaction, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Próximo nr_sequencia de uma coleção, pelo contador `_counters/<coleção>_sequence`.
 *
 * Normalmente usa uma transação (atômica). Se a transação falhar (ex.: cota do
 * Firebase esgotada), calcula o próximo número a partir do maior valor entre o
 * contador e o maior nr_sequencia já gravado na coleção, e atualiza o contador.
 * Nunca devolve um número inválido (antes: Date.now() ou 1 repetido).
 */
export async function proximaSequencia(nomeColecao: string, nomeContador = `${nomeColecao}_sequence`): Promise<number> {
  const contadorDoc = doc(db, "_counters", nomeContador);
  try {
    return await runTransaction(db, async (transacao) => {
      const snap = await transacao.get(contadorDoc);
      const proximo = (snap.exists() ? Number(snap.data().current ?? 0) : 0) + 1;
      transacao.set(contadorDoc, { current: proximo }, { merge: true });
      return proximo;
    });
  } catch (erro) {
    console.error(`Transação do contador ${nomeContador} falhou; usando o maior nr_sequencia da coleção.`, erro);
    const [contador, registros] = await Promise.all([getDoc(contadorDoc), getDocs(collection(db, nomeColecao))]);
    const maiorGravado = registros.docs.reduce((max, d) => Math.max(max, Number(d.data().nr_sequencia) || 0), 0);
    const proximo = Math.max(Number(contador.data()?.current ?? 0), maiorGravado) + 1;
    await setDoc(contadorDoc, { current: proximo }, { merge: true });
    return proximo;
  }
}

/** Remove campos com valor undefined — o Firestore rejeita undefined ao gravar. */
export function removerUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/**
 * Como removerUndefined, mas também dentro de listas e objetos aninhados (ex.: os
 * itens de `campos` e `ordenacao` de uma banda). O Firestore rejeita undefined em
 * qualquer nível. Valores que não são objetos simples (ex.: deleteField()) são mantidos.
 */
export function removerUndefinedProfundo<T>(valor: T): T {
  if (Array.isArray(valor)) {
    return valor.filter((v) => v !== undefined).map((v) => removerUndefinedProfundo(v)) as T;
  }
  if (valor !== null && typeof valor === "object" && Object.getPrototypeOf(valor) === Object.prototype) {
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
