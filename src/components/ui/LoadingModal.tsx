"use client";

interface LoadingModalProps {
  open?: boolean;
  message?: string;
}

export default function LoadingModal({ open = true, message = "Carregando..." }: LoadingModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6">
      <div className="w-full max-w-[240px] border border-slate-200 bg-white p-6 text-center shadow-xl shadow-black/20">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#003056]/10 text-[#003056]">
          <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
            <path d="M22 12a10 10 0 0 1-10 10" />
          </svg>
        </div>
        <p className="text-sm text-slate-900">{message}</p>
      </div>
    </div>
  );
}
