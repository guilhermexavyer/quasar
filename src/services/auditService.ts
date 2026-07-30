import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface AuditEntry {
  id: string;
  usuarioId?: string;
  usuarioNome?: string;
  acao?: string;
  timestamp?: string; // ISO string or Firestore timestamp as string
  detalhes?: any;
}

export async function fetchAuditByPessoaId(pessoaId: string): Promise<AuditEntry[]> {
  if (!pessoaId) return [];
  try {
    const colRef = collection(db, "pessoa_fisica", pessoaId, "auditoria");
    const q = query(colRef, orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as AuditEntry[];
  } catch (e) {
    console.error("Erro ao buscar auditoria:", e);
    return [];
  }
}
