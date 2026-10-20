import { collection, getDocs, doc, setDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AuditAutor } from "@/services/auditService";

const COLECAO = "regra";

/** Regras do sistema (Administração do Sistema > Regras). Um único documento guarda todas. */
export interface Regra {
  id?: string;
  /** Logout automático: dia da semana ("0" = domingo … "6" = sábado) ou "T" (todos os dias). */
  ie_logout_dia?: string;
  /** Logout automático: horário (HH:MM, hora local). */
  hr_logout?: string;
  /** Logout automático: quando a regra foi salva por último (só vale para horários a partir daí). */
  dt_vigencia_logout?: string;
  /** Badge de teste: "S" mostra o aviso "Homologação (teste)" no menu lateral; "N" ou vazio, não. */
  ie_badge_teste?: string;
  dt_criacao?: string;
  dt_alteracao?: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}

export type IdRegra = "logout_automatico" | "badge_teste";

/** Campos do documento que pertencem a cada regra. */
export const CAMPOS_REGRA: Record<IdRegra, (keyof Regra)[]> = {
  logout_automatico: ["ie_logout_dia", "hr_logout"],
  badge_teste: ["ie_badge_teste"],
};

/**
 * Logs de auditoria de uma regra específica (todas ficam no mesmo documento):
 * cada log guarda a regra alterada em `regra`.
 * Recebe os logs do mais recente para o mais antigo (ordem de fetchAuditByDocumentId).
 */
export function filtrarAuditoriaDaRegra<T extends object>(logs: T[], regra: IdRegra): T[] {
  return logs.filter((log) => (log as { regra?: unknown }).regra === regra);
}

export async function obterRegra(): Promise<Regra | null> {
  const snapshot = await getDocs(collection(db, COLECAO));
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Regra;
}

/**
 * Salva os campos de uma regra. Cria o documento na primeira vez e registra a
 * auditoria (detalhes = estado completo, para o modal "Detalhe da auditoria").
 * Sem alteração nos valores, nada é gravado.
 */
export async function salvarRegra(regra: IdRegra, valores: Partial<Regra>, autor?: AuditAutor): Promise<Regra> {
  const agora = new Date().toISOString();
  const nomeAutor = autor?.usuarioNome?.trim() || "-";
  const campos = Object.fromEntries(CAMPOS_REGRA[regra].map((c) => [c, String(valores[c] ?? "")])) as Partial<Regra>;
  // Vigência própria do logout: salvar outra regra não muda a partir de quando ele vale.
  const vigencia: Partial<Regra> = regra === "logout_automatico" ? { dt_vigencia_logout: agora } : {};
  const atual = await obterRegra();

  if (!atual?.id) {
    const ref = doc(collection(db, COLECAO));
    const dados: Regra = {
      ...campos,
      ...vigencia,
      dt_criacao: agora,
      dt_alteracao: agora,
      ds_usuario_criacao: nomeAutor,
      ds_usuario_alteracao: nomeAutor,
    };
    await setDoc(ref, dados);
    await registrarAuditoria(ref.id, "create", agora, autor, dados, regra);
    return { id: ref.id, ...dados };
  }

  const semAlteracao = CAMPOS_REGRA[regra].every((c) => String(atual[c] ?? "") === campos[c]);
  if (semAlteracao) return atual;
  const { id, ...dadosAtuais } = atual;
  const alteracao = { ...campos, ...vigencia, dt_alteracao: agora, ds_usuario_alteracao: nomeAutor };
  await setDoc(doc(db, COLECAO, id), alteracao, { merge: true });
  const dados: Regra = { ...dadosAtuais, ...alteracao };
  await registrarAuditoria(id, "update", agora, autor, dados, regra);
  return { id, ...dados };
}

/** O log guarda a regra alterada: cada regra tem seu próprio histórico de auditoria. */
async function registrarAuditoria(id: string, acao: "create" | "update", agora: string, autor: AuditAutor | undefined, detalhes: Regra, regra: IdRegra) {
  try {
    await addDoc(collection(db, COLECAO, id, "auditoria"), {
      usuarioId: autor?.usuarioId ?? null,
      usuarioNome: autor?.usuarioNome?.trim() || "-",
      acao,
      regra,
      timestamp: agora,
      detalhes,
    });
  } catch (e) {
    console.error(`Erro ao registrar auditoria de regra (${acao})`, e);
  }
}
