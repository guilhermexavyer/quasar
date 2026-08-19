import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const COLECAO = "pat_param_codigo_patrimonio";

export interface ParamCodigoPatrimonio {
  id?: string;
  ds_regra: string;
}

export async function obterParamCodigoPatrimonio(): Promise<ParamCodigoPatrimonio | null> {
  const snapshot = await getDocs(collection(db, COLECAO));
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as ParamCodigoPatrimonio;
}

export async function salvarParamCodigoPatrimonio(dsRegra: string): Promise<void> {
  const snapshot = await getDocs(collection(db, COLECAO));
  if (snapshot.empty) {
    const docRef = doc(collection(db, COLECAO));
    await setDoc(docRef, { ds_regra: dsRegra });
  } else {
    const docSnap = snapshot.docs[0];
    const atual = docSnap.data().ds_regra ?? "";
    if (atual === dsRegra) return;
    await setDoc(doc(db, COLECAO, docSnap.id), { ds_regra: dsRegra }, { merge: true });
  }
}
