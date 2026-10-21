import { useEffect, useState } from "react";
import { fetchAuditByDocumentId, type AuditEntry } from "@/services/auditService";

/** Logs de criação/alteração exibidos no rodapé de um item. */
export interface LogsDoItem {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

/**
 * Logs de um item que divide o documento com outros (ex.: cada aviso / cada
 * regra é um conjunto de campos do mesmo documento): a criação é o log mais
 * antigo do item e a alteração, o mais recente. null = item nunca salvo (ou
 * ainda carregando), e o rodapé não deve aparecer.
 *
 * - `filtrar(logs, item)`: separa os logs do item (ex.: filtrarAuditoriaDaRegra);
 * - `versao`: muda a cada salvamento (ex.: dt_alteracao do documento), para recarregar.
 */
export function useLogsDoItem<I extends string>(
  colecao: string,
  docId: string | undefined,
  item: I | null,
  filtrar: (logs: AuditEntry[], item: I) => AuditEntry[],
  versao?: string
): LogsDoItem | null {
  const [logs, setLogs] = useState<{ chave: string; resumo: LogsDoItem | null } | null>(null);
  const chave = `${docId ?? ""}|${item ?? ""}|${versao ?? ""}`;

  useEffect(() => {
    if (!docId || !item) return;
    let cancelado = false;
    fetchAuditByDocumentId(colecao, docId)
      .then((todos) => {
        if (cancelado) return;
        // fetchAuditByDocumentId devolve do mais recente para o mais antigo.
        const doItem = filtrar(todos, item);
        const recente = doItem[0];
        const antigo = doItem[doItem.length - 1];
        setLogs({
          chave,
          resumo: doItem.length === 0 ? null : {
            createdAt: String(antigo.timestamp ?? ""),
            createdBy: antigo.usuarioNome ?? "",
            updatedAt: String(recente.timestamp ?? ""),
            updatedBy: recente.usuarioNome ?? "",
          },
        });
      })
      .catch(() => { if (!cancelado) setLogs({ chave, resumo: null }); });
    return () => { cancelado = true; };
    // docId, item e versao já compõem a chave; filtrar é uma função fixa do serviço.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colecao, chave]);

  // Ignora o resultado de outro item/versão enquanto o atual carrega.
  return logs && logs.chave === chave ? logs.resumo : null;
}
