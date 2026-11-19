"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import AvisoModal from "@/components/ui/AvisoModal";
import LoadingModal from "@/components/ui/LoadingModal";

/** Resposta do login para a tela: "alterar_senha" abre o modal de troca de senha. */
export type ResultadoLoginTela = "alterar_senha" | void;

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<ResultadoLoginTela> | ResultadoLoginTela;
  /**
   * Troca de senha pedida no login ("Alterar senha no próximo login").
   * Devolve null quando deu certo, ou a mensagem de erro.
   */
  onAlterarSenha?: (username: string, senhaAtual: string, novaSenha: string) => Promise<string | null>;
  errorMessage?: string | null;
  onClearError?: () => void;
  warningMessage?: string | null;
  onClearWarning?: () => void;
  isLoading?: boolean;
}

export default function LoginScreen({ onLogin, onAlterarSenha, errorMessage, onClearError, warningMessage, onClearWarning, isLoading = false }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [shouldRenderError, setShouldRenderError] = useState(false);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [shouldRenderWarning, setShouldRenderWarning] = useState(false);
  const [avisoAberto, setAvisoAberto] = useState(false);

  // Modal "Alterar senha" (parâmetro "Alterar senha no próximo login").
  const [trocaAberta, setTrocaAberta] = useState(false);
  const [trocaUsuario, setTrocaUsuario] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [trocaErro, setTrocaErro] = useState<string | null>(null);
  const [trocaSalvando, setTrocaSalvando] = useState(false);
  const [sucesso, setSucesso] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (trocaAberta) return;
    const resultado = await onLogin(username, password);
    if (resultado === "alterar_senha") {
      setTrocaUsuario(username);
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      setTrocaErro(null);
      setTrocaAberta(true);
    }
  }

  function fecharTroca() {
    if (trocaSalvando) return;
    setTrocaAberta(false);
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");
    setTrocaErro(null);
  }

  async function handleSalvarTroca(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!senhaAtual.trim()) return setTrocaErro("Informe a senha atual.");
    if (!novaSenha.trim()) return setTrocaErro("Informe a nova senha.");
    if (novaSenha !== confirmarSenha) return setTrocaErro("As senhas não coincidem.");
    if (!onAlterarSenha) return;
    setTrocaErro(null);
    setTrocaSalvando(true);
    const erro = await onAlterarSenha(trocaUsuario, senhaAtual, novaSenha);
    setTrocaSalvando(false);
    if (erro) {
      setTrocaErro(erro);
      return;
    }
    // Senha trocada: o usuário entra com a nova senha pelo formulário de login.
    setTrocaAberta(false);
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");
    setPassword("");
    setSucesso("Senha alterada com sucesso! Entre com a nova senha.");
    window.setTimeout(() => passwordRef.current?.focus(), 0);
  }

  // Mensagem de sucesso da troca de senha (some sozinha, como as demais).
  useEffect(() => {
    if (!sucesso) return;
    const t = window.setTimeout(() => setSucesso(null), 3500);
    return () => window.clearTimeout(t);
  }, [sucesso]);

  // O gerenciador de senhas do navegador pode preencher os campos direto no DOM
  // sem disparar onChange. Sem isso, o React apagaria o valor no próximo
  // render. Este efeito sincroniza qualquer preenchimento automático no estado.
  useEffect(() => {
    function syncAutofill() {
      setUsername((prev) => prev || usernameRef.current?.value || "");
      setPassword((prev) => prev || passwordRef.current?.value || "");
    }
    const timers = [250, 750, 1500].map((ms) => window.setTimeout(syncAutofill, ms));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

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
              {/* Logo negativa (anel branco) para o fundo azul. O anel ocupa 75% da imagem: 68px deixam o anel
                  com o mesmo diâmetro do disco da logo anterior (80% de 64px). */}
              <Image src="/images/Logo%20Quasar%202.0%20-%20Negativa.png" alt="Quasar" width={68} height={68} className="h-[68px] w-[68px] max-w-none object-contain" />
            </div>
            <h1 className="text-[2rem] font-semibold tracking-tight text-white">Quasar</h1>
            <p className="mt-2 text-base text-blue-100">Bem vindo(a)</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form mt-8 flex flex-col items-center space-y-3">
            <style jsx>{`
              .login-form input {
                border: none !important;
                box-shadow: none !important;
                background-color: #fff !important;
              }

              .login-form input::placeholder {
                color: #666 !important;
                opacity: 1;
              }
            `}</style>
            <input
              type="text"
              id="username"
              name="username"
              autoComplete="username"
              ref={usernameRef}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-[74%] rounded-[6px] border-0 bg-white px-[9px] py-[7px] text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-white/20"
              placeholder="Usuário"
            />

            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              ref={passwordRef}
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
              onClick={() => setAvisoAberto(true)}
              className="cursor-pointer text-center text-sm text-blue-100 transition hover:text-white hover:underline"
            >
              Esqueceu sua senha?
            </button>
          </form>
          <AvisoModal campo={avisoAberto ? "ds_esqueceu_senha" : null} onClose={() => setAvisoAberto(false)} />

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

          {sucesso ? (
            <div
              className="fixed bottom-4 left-4 z-50 min-w-[220px] max-w-[320px] rounded-none px-4 py-3 pr-8 text-sm text-white animate-toast-fade-in"
              style={{ backgroundColor: "#2cc958", borderLeft: "4px solid #23A146" }}
              role="status"
              aria-live="polite"
            >
              <button
                type="button"
                onClick={() => setSucesso(null)}
                className="absolute right-2 top-2 cursor-pointer text-sm text-slate-100 hover:text-white"
                aria-label="Fechar mensagem"
              >
                ×
              </button>
              <div>{sucesso}</div>
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

    {trocaAberta && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
        <div className="absolute inset-0 bg-black/40" onClick={fecharTroca} />
        <form
          onSubmit={handleSalvarTroca}
          className="relative w-full max-w-[420px] bg-white p-0 text-slate-800 shadow-xl shadow-black/20"
        >
          <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
            <h2 className="text-base font-semibold" style={{ color: "#000" }}>Alterar senha</h2>
            <button
              type="button"
              onClick={fecharTroca}
              className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
              aria-label="Fechar alterar senha"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid gap-[15px] p-[15px]">
            {(
              [
                ["Senha atual", senhaAtual, setSenhaAtual, "current-password"],
                ["Nova senha", novaSenha, setNovaSenha, "new-password"],
                ["Confirmar nova senha", confirmarSenha, setConfirmarSenha, "new-password"],
              ] as const
            ).map(([rotulo, valor, definir, autoComplete], i) => (
              <label key={rotulo} className="block">
                <span className="mb-1 block text-sm text-slate-700">{rotulo}</span>
                <input
                  type="password"
                  autoComplete={autoComplete}
                  autoFocus={i === 0}
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none"
                  value={valor}
                  onChange={(e) => {
                    definir(e.target.value);
                    setTrocaErro(null);
                  }}
                />
              </label>
            ))}
            {trocaErro && <p className="text-sm text-red-600" role="alert">{trocaErro}</p>}
          </div>

          <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
            <button
              type="button"
              onClick={fecharTroca}
              className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
              style={{ backgroundColor: "#bdbdbd", borderBottomColor: "#000" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={trocaSalvando}
              className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60"
              style={{ backgroundColor: "#003056", borderBottomColor: "#000" }}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    )}
    {trocaSalvando && <LoadingModal open message="Carregando..." />}
    </>
  );
}
