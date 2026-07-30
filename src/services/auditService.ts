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

export async function fetchAuditByDocumentId(collectionName: string, documentId: string): Promise<AuditEntry[]> {
  if (!documentId) return [];
  try {
    const colRef = collection(db, collectionName, documentId, "auditoria");
    const q = query(colRef, orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as AuditEntry[];
  } catch (e) {
    console.error("Erro ao buscar auditoria:", e);
    return [];
  }
}

export async function fetchAuditByPessoaId(pessoaId: string): Promise<AuditEntry[]> {
  return fetchAuditByDocumentId("pessoa_fisica", pessoaId);
}

export async function fetchAuditByUsuarioId(usuarioId: string): Promise<AuditEntry[]> {
  return fetchAuditByDocumentId("usuario", usuarioId);
}
