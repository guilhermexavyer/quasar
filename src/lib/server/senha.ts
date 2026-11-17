import "server-only";
import { createHash } from "node:crypto";

/**
 * Hash de senha: o MESMO algoritmo que o sistema já usava no navegador
 * (SHA-256 em hexadecimal, sem sal), agora calculado só no servidor.
 * PENDÊNCIA: trocar por um hash próprio para senhas (bcrypt/argon2) com
 * re-hash no login.
 */
export function hashSenha(senha: string): string {
  return createHash("sha256").update(senha, "utf8").digest("hex");
}

/** Hash legado de 32 bits (usuários muito antigos), igual ao createFallbackHash da tela. */
function hashLegado(entrada: string): string {
  const bytes = new TextEncoder().encode(entrada);
  let hash = 0;
  for (let i = 0; i < bytes.length; i += 1) {
    hash = (hash << 5) - hash + bytes[i];
    hash |= 0;
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * Confere a senha digitada com o valor guardado, com as mesmas regras do login
 * antigo: SHA-256, hash legado ou (registros antigos) a própria senha em texto.
 */
export function senhaConfere(senhaDigitada: string, guardado: string | null | undefined): boolean {
  const armazenado = (guardado ?? "").trim().toLowerCase();
  if (!armazenado) return false;
  return (
    armazenado === hashSenha(senhaDigitada).toLowerCase() ||
    armazenado === hashLegado(senhaDigitada).toLowerCase() ||
    armazenado === senhaDigitada.toLowerCase()
  );
}
