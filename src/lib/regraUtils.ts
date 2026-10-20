import type { Regra } from "@/services/regraService";

/** Opções do dia do logout automático (valor = Date.getDay(), "T" = todos os dias). */
export const DIAS_LOGOUT: { value: string; label: string }[] = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Segunda-feira" },
  { value: "2", label: "Terça-feira" },
  { value: "3", label: "Quarta-feira" },
  { value: "4", label: "Quinta-feira" },
  { value: "5", label: "Sexta-feira" },
  { value: "6", label: "Sábado" },
  { value: "T", label: "Todos os dias" },
];

export function rotuloDiaLogout(valor?: string | null): string {
  return DIAS_LOGOUT.find((d) => d.value === valor)?.label ?? "";
}

/**
 * Último logout automático programado até `agora` (hora local do navegador),
 * ou null quando a regra não está configurada (dia e horário são obrigatórios).
 */
export function ultimoLogoutProgramado(regra: Pick<Regra, "ie_logout_dia" | "hr_logout"> | null | undefined, agora: Date): Date | null {
  const dia = regra?.ie_logout_dia ?? "";
  const m = /^(\d{2}):(\d{2})$/.exec(regra?.hr_logout ?? "");
  if (!m || !DIAS_LOGOUT.some((d) => d.value === dia)) return null;

  // Volta até 7 dias: cobre "todos os dias" (hoje ou ontem) e um dia da semana específico.
  for (let atras = 0; atras <= 7; atras++) {
    const candidato = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - atras, Number(m[1]), Number(m[2]));
    if (candidato > agora) continue;
    if (dia === "T" || candidato.getDay() === Number(dia)) return candidato;
  }
  return null;
}
