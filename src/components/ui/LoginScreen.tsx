"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<void> | void;
  errorMessage?: string | null;
  onClearError?: () => void;
  warningMessage?: string | null;
  onClearWarning?: () => void;
  isLoading?: boolean;
}

export default function LoginScreen({ onLogin, errorMessage, onClearError, warningMessage, onClearWarning, isLoading = false }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [shouldRenderError, setShouldRenderError] = useState(false);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [shouldRenderWarning, setShouldRenderWarning] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onLogin(username, password);
  }

  useEffect(() => {
    if (!errorMessage) {
      setShouldRenderError(false);
      setIsErrorVisible(false);
      return;
    }

    setShouldRenderError(true);
    setIsErrorVisible(true);

    const hideTimer = window.setTimeout(() => {
      setIsErrorVisible(false);
    }, 3000);

    const clearTimer = window.setTimeout(() => {
      onClearError?.();
    }, 3520);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(clearTimer);
    };
  }, [errorMessage, onClearError]);

  useEffect(() => {
    if (!warningMessage) {
      setShouldRenderWarning(false);
      setIsWarningVisible(false);
      return;
    }

    setShouldRenderWarning(true);
    setIsWarningVisible(true);

    const hideTimer = window.setTimeout(() => {
      setIsWarningVisible(false);
    }, 3000);

    const clearTimer = window.setTimeout(() => {
      onClearWarning?.();
    }, 3520);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(clearTimer);
    };
  }, [warningMessage, onClearWarning]);

  return (
    <>
      <div
        className={`fixed inset-0 overflow-hidden px-4 py-8 text-white transition-opacity duration-300 ease-out ${isLoading ? "opacity-70" : "opacity-100"}`}
        style={{ backgroundColor: "#003056" }}
      >
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="w-full max-w-[440px] p-7 text-white">
          <div className="flex flex-col items-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 p-3 shadow-[0_0_0_8px_rgba(255,255,255,0.08)]">
              <Image src="/Logo.png" alt="Quasar" width={72} height={72} className="h-16 w-16 object-contain" />
            </div>
            <h1 className="text-[2rem] font-semibold tracking-tight text-white">Quasar</h1>
            <p className="mt-2 text-base text-blue-100">Bem vindo(a)</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col items-center space-y-3">
            <style jsx>{`
              input {
                border: none !important;
                box-shadow: none !important;
                background-color: #fff !important;
              }

              input::placeholder {
                color: #666 !important;
                opacity: 1;
              }
            `}</style>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-[74%] rounded-[6px] border-0 bg-white px-[9px] py-[7px] text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-white/20"
              placeholder="Usuário"
            />

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-[74%] rounded-[6px] border-0 bg-white px-[9px] py-[7px] text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-white/20"
              placeholder="Senha"
            />

            <button
              type="submit"
              className="w-[74%] cursor-pointer rounded-[6px] border-0 border-b border-white/30 bg-[#1A4567] px-[9px] py-[7px] text-sm font-semibold text-white transition hover:bg-[#173d5c]"
            >
              Entrar
            </button>

            <button
              type="button"
              className="cursor-pointer text-center text-sm text-blue-100 transition hover:text-white hover:underline"
            >
              Esqueceu sua senha?
            </button>
          </form>

          {shouldRenderError ? (
            <div
              className={`fixed bottom-4 left-4 z-50 min-w-[220px] max-w-[320px] rounded-none px-4 py-3 pr-8 text-sm text-white ${isErrorVisible ? "animate-toast-fade-in" : "animate-toast-fade-out"}`}
              style={{ backgroundColor: "#ef4444", borderLeft: "4px solid #9b1230" }}
              role="status"
              aria-live="polite"
            >
              <button
                type="button"
                onClick={() => {
                  setIsErrorVisible(false);
                  setShouldRenderError(false);
                  onClearError?.();
                }}
                className="absolute right-2 top-2 cursor-pointer text-sm text-slate-100 hover:text-white"
                aria-label="Fechar mensagem"
              >
                ×
              </button>
              <div>{errorMessage}</div>
            </div>
          ) : null}

          {shouldRenderWarning ? (
            <div
              className={`fixed bottom-4 left-4 z-50 min-w-[220px] max-w-[320px] rounded-none px-4 py-3 pr-8 text-sm text-white ${isWarningVisible ? "animate-toast-fade-in" : "animate-toast-fade-out"}`}
              style={{ backgroundColor: "#f59e0b", borderLeft: "4px solid #b46a00" }}
              role="status"
              aria-live="polite"
            >
              <button
                type="button"
                onClick={() => {
                  setIsWarningVisible(false);
                  setShouldRenderWarning(false);
                  onClearWarning?.();
                }}
                className="absolute right-2 top-2 cursor-pointer text-sm text-slate-100 hover:text-white"
                aria-label="Fechar mensagem"
              >
                ×
              </button>
              <div>{warningMessage}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
    </>
  );
}
