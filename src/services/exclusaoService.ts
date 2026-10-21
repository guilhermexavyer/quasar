import { addDoc, collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { removerUndefinedProfundo } from "@/lib/firestoreUtils";
import type { AuditAutor } from "@/services/auditService";

/** Coleção com a cópia de cada registro excluído (Administração do Sistema > Exclusões). */
export const COLECAO_EXCLUSAO = "exclusao";

/** Registro excluído: cópia do documento como estava no momento da exclusão. */
export interface Exclusao {
  id: string;
  /** Coleção de onde o registro foi excluído (ex.: aluno, pat_ativo). */
  ds_colecao: string;
  /** Id do documento excluído. */
  id_registro: string;
  nr_sequencia?: number;
  /** Dados do registro no momento da exclusão. */
  dados: Record<string, unknown>;
  dt_exclusao: string;
  ds_usuario_exclusao: string;
  usuario_id_exclusao?: string | null;
  /** Perfil que o usuário estava usando ao excluir. */
  nr_seq_perfil_exclusao?: number;
  ds_perfil_exclusao?: string;
}

/**
 * Autor das exclusões: definido pela página quando o usuário entra no sistema,
 * para que os serviços registrem quem excluiu sem precisar receber o autor em
 * cada chamada.
 */
let autorAtual: AuditAutor | undefined;
let perfilAtual: { nr_sequencia?: number; ds_perfil?: string } | undefined;

export function definirAutorExclusoes(autor: AuditAutor | undefined, perfil?: { nr_sequencia?: number; ds_perfil?: string }) {
  autorAtual = autor;
  perfilAtual = perfil;
}

/**
 * Guarda a cópia do registro antes de excluí-lo. Deve ser chamada ANTES do
 * deleteDoc. Se a cópia não puder ser gravada, lança o erro e a exclusão não
 * acontece (nenhum registro é excluído sem ficar documentado).
 */
export async function registrarExclusao(colecao: string, id: string): Promise<void> {
  const snap = await getDoc(doc(db, colecao, id));
  if (!snap.exists()) return;
  const dados = snap.data() as Record<string, unknown>;
  const nr = Number(dados.nr_sequencia);
  await addDoc(collection(db, COLECAO_EXCLUSAO), removerUndefinedProfundo({
    ds_colecao: colecao,
    id_registro: id,
    nr_sequencia: Number.isFinite(nr) ? nr : undefined,
    dados,
    dt_exclusao: new Date().toISOString(),
    ds_usuario_exclusao: autorAtual?.usuarioNome?.trim() || '-',
    usuario_id_exclusao: autorAtual?.usuarioId ?? null,
    nr_seq_perfil_exclusao: perfilAtual?.nr_sequencia,
    ds_perfil_exclusao: perfilAtual?.ds_perfil ?? '',
  }));
}

/** Registros excluídos de uma coleção. */
export async function obterExclusoes(colecao: string): Promise<Exclusao[]> {
  const snap = await getDocs(query(collection(db, COLECAO_EXCLUSAO), where("ds_colecao", "==", colecao)));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<Exclusao, "id">), id: d.id }));
}
