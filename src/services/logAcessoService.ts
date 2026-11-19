import { api } from "@/lib/apiCliente";

/** Um login registrado (Logs > Acessos). Datas em ISO; vazias quando não houve logout. */
export interface LogAcesso {
  id: string;
  nr_sequencia: number;
  nr_seq_usuario: number;
  ds_usuario: string;
  /** Pessoa física do usuário no login (null se não havia). */
  nr_seq_pessoa_fisica: number | null;
  ds_pessoa_fisica: string;
  dt_login: string;
  dt_logout: string;
  /** M = manual (botão Sair), A = automático (regra de logout), vazio = sem logout registrado. */
  ie_tipo_logout: "" | "M" | "A";
}

/** Acessos do mais recente para o mais antigo (somente leitura). */
export function obterAcessos(): Promise<LogAcesso[]> {
  return api.get<LogAcesso[]>("/api/logs/acessos");
}

export function rotuloTipoLogout(tipo: string): string {
  if (tipo === "M") return "Manual";
  if (tipo === "A") return "Automático";
  return "";
}
