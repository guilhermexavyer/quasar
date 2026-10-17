import { collection, getDocs, doc, setDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AuditAutor } from "@/services/auditService";

const COLECAO = "aviso";

/** Avisos do sistema (Administração do Sistema > Avisos). Um único documento guarda todos. */
export interface Aviso {
  id?: string;
  /** Conteúdo (HTML) do aviso "Esqueceu sua senha?" (tela de login). */
  ds_esqueceu_senha?: string;
  /** Conteúdo (HTML) do aviso "Política de Privacidade" (menu do usuário). */
  ds_politica_privacidade?: string;
  dt_criacao?: string;
  dt_alteracao?: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}

export type CampoAviso = "ds_esqueceu_senha" | "ds_politica_privacidade";

/**
 * Logs de auditoria de um aviso específico (os dois avisos ficam no mesmo
 * documento). Logs novos trazem o campo alterado; nos antigos, o aviso é
 * identificado comparando o conteúdo com o log anterior.
 * Recebe os logs do mais recente para o mais antigo (ordem de fetchAuditByDocumentId).
 */
export function filtrarAuditoriaDoAviso<T extends { campo?: string; detalhes?: Record<string, unknown> }>(logs: T[], campo: CampoAviso): T[] {
  return logs.filter((log, i) => {
    if (log.campo) return log.campo === campo;
    const atual = String(log.detalhes?.[campo] ?? "");
    const anterior = i + 1 < logs.length ? String(logs[i + 1].detalhes?.[campo] ?? "") : "";
    return atual !== anterior;
  });
}

export async function obterAviso(): Promise<Aviso | null> {
  const snapshot = await getDocs(collection(db, COLECAO));
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Aviso;
}

/**
 * Salva o conteúdo de um aviso. Cria o documento na primeira vez e registra a
 * auditoria (detalhes = estado completo, para o modal "Detalhe da auditoria").
 * Sem alteração no conteúdo, nada é gravado.
 */
export async function salvarAviso(campo: CampoAviso, conteudo: string, autor?: AuditAutor): Promise<Aviso> {
  const agora = new Date().toISOString();
  const nomeAutor = autor?.usuarioNome?.trim() || "-";
  const atual = await obterAviso();

  if (!atual?.id) {
    const ref = doc(collection(db, COLECAO));
    const dados: Aviso = {
      ds_esqueceu_senha: "",
      ds_politica_privacidade: "",
      [campo]: conteudo,
      dt_criacao: agora,
      dt_alteracao: agora,
      ds_usuario_criacao: nomeAutor,
      ds_usuario_alteracao: nomeAutor,
    };
    await setDoc(ref, dados);
    await registrarAuditoria(ref.id, "create", agora, autor, dados, campo);
    return { id: ref.id, ...dados };
  }

  if ((atual[campo] ?? "") === conteudo) return atual;
  const { id, ...dadosAtuais } = atual;
  const dados: Aviso = { ...dadosAtuais, [campo]: conteudo, dt_alteracao: agora, ds_usuario_alteracao: nomeAutor };
  await setDoc(doc(db, COLECAO, id), { [campo]: conteudo, dt_alteracao: agora, ds_usuario_alteracao: nomeAutor }, { merge: true });
  await registrarAuditoria(id, "update", agora, autor, dados, campo);
  return { id, ...dados };
}

/** O log guarda o aviso alterado (campo): cada aviso tem seu próprio histórico de auditoria. */
async function registrarAuditoria(id: string, acao: "create" | "update", agora: string, autor: AuditAutor | undefined, detalhes: Aviso, campo: CampoAviso) {
  try {
    await addDoc(collection(db, COLECAO, id, "auditoria"), {
      usuarioId: autor?.usuarioId ?? null,
      usuarioNome: autor?.usuarioNome?.trim() || "-",
      acao,
      campo,
      timestamp: agora,
      detalhes,
    });
  } catch (e) {
    console.error(`Erro ao registrar auditoria de aviso (${acao})`, e);
  }
}
