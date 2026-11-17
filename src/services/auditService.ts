import { api } from "@/lib/apiCliente";

export interface AuditAutor {
  usuarioId?: string | null;
  usuarioNome?: string;
}

export interface AuditEntry {
  id: string;
  usuarioId?: string;
  usuarioNome?: string;
  acao?: string;
  timestamp?: string; // ISO string
  detalhes?: any;
}

/** Trilha de auditoria de um registro, do mais recente para o mais antigo. */
export async function fetchAuditByDocumentId(collectionName: string, documentId: string): Promise<AuditEntry[]> {
  if (!documentId) return [];
  try {
    return await api.get<AuditEntry[]>(`/api/auditoria/${encodeURIComponent(collectionName)}/${encodeURIComponent(documentId)}`);
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
