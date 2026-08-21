"use client";

export default function EmptySelectionMessage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <p className="text-sm font-medium text-slate-700">Nenhuma opção selecionada.</p>
        <p className="text-sm text-slate-500 mt-1">Selecione uma opção no dropdown.</p>
      </div>
    </div>
  );
}
