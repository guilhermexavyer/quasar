"use client";

import type { ToastStatus } from "@/types/pessoaFisica";

type ToastProps = {
  visible: boolean;
  message: string;
  status: ToastStatus;
  onClose: () => void;
};

const toastStyles: Record<ToastStatus, { bg: string; border: string; text: string }> = {
  success: { bg: "#2cc958", border: "#23A146", text: "text-white" },
  warning: { bg: "#f59e0b", border: "#b46a00", text: "text-white" },
  error: { bg: "#ef4444", border: "#9b1230", text: "text-white" },
};

export default function Toast({ visible, message, status, onClose }: ToastProps) {
  const styles = toastStyles[status];

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 min-w-[220px] max-w-[320px] px-4 py-3 pr-8 text-sm rounded-none ${styles.text} ${
        visible ? "animate-toast-fade-in" : "animate-toast-fade-out"
      }`}
      style={{ backgroundColor: styles.bg, borderLeft: `4px solid ${styles.border}` }}
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-2 top-2 cursor-pointer text-sm text-slate-100 hover:text-white"
        aria-label="Fechar mensagem"
      >
        ×
      </button>
      <div>{message}</div>
    </div>
  );
}
