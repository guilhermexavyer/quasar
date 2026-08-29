"use client";

import { useEffect, useRef, useState } from "react";
import type { Imagem } from "@/types/imagem";
import { formatDate } from "@/lib/pessoaFisicaUtils";
import type { ColunasConfig } from "@/lib/colunasUtils";
import Select from "@/components/ui/Select";
import FieldInfoPopup from "@/components/ui/FieldInfoPopup";

const IMAGEM_FIELD_INFOS: Record<string, { type: string; field: string; collection: string }> = {
  nr_sequencia: { type: 'number', field: 'nr_sequencia', collection: 'imagem' },
  ds_imagem: { type: 'string', field: 'ds_imagem', collection: 'imagem' },
  ie_arquivo: { type: 'string', field: 'ie_arquivo', collection: 'imagem' },
};

interface ImagemFormViewProps {
  message: string;
  editingId: string | null;
  imagem: Partial<Imagem>;
  setImagem: (fn: (prev: Partial<Imagem>) => Partial<Imagem>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  goToList: () => void;
  submitting: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  onPrevRecord: () => void;
  onNextRecord: () => void;
  hasPrevRecord: boolean;
  hasNextRecord: boolean;
  onOpenAudit?: (imagemId?: string | null) => void;
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  allowedSubmodulos?: string[];
}

export default function ImagemFormView({
  message,
  editingId,
  imagem,
  setImagem,
  handleSubmit,
  goToList,
  submitting,
  createdAt,
  updatedAt,
  createdBy,
  updatedBy,
  onPrevRecord,
  onNextRecord,
  hasPrevRecord,
  hasNextRecord,
  onOpenAudit,
  manageSelection,
  onManageSelectionChange,
  allowedSubmodulos = ['campos', 'perfis', 'usuarios', 'imagens'],
}: ImagemFormViewProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [infoPopupField, setInfoPopupField] = useState<string | null>(null);
  const [infoAnchor, setInfoAnchor] = useState<HTMLElement | null>(null);

  const inputClass = "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedExtensions = ['.jpeg', '.jpg', '.png'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some((ext) => fileName.endsWith(ext));
    if (!hasValidExtension) {
      alert('Tipo de arquivo não permitido. Aceitos: .jpeg, .jpg, .png');
      e.target.value = '';
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    setImagem((prev) => ({ ...prev, _file: file, ie_arquivo: `/images/${file.name}` } as any));
  }

  function renderFieldLabel(fieldKey: string, label: string) {
    const meta = IMAGEM_FIELD_INFOS[fieldKey] ?? {
      type: 'string',
      field: fieldKey,
      collection: 'imagem',
    };
    return (
      <div className="relative inline-block text-sm mb-1" style={{ color: '#666' }}>
        <div className="group inline-flex items-center gap-2 w-full">
          <span className="inline-flex items-center gap-1">
            <span>{label}</span>
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setInfoAnchor(event.currentTarget);
              setInfoPopupField((current) => (current === fieldKey ? null : fieldKey));
            }}
            aria-label={`Informações do campo ${label}`}
            className={`inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer transition-none ${infoPopupField === fieldKey ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <circle cx="12" cy="16" r="0.5" />
            </svg>
          </button>
          {infoPopupField === fieldKey && (
            <FieldInfoPopup
              anchor={infoAnchor}
              meta={{ type: meta.type, field: meta.field, collection: meta.collection }}
              onClose={() => setInfoPopupField(null)}
            />
          )}
        </div>
      </div>
    );
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (submitting) return;
        const f = formRef.current;
        if (!f) return;
        if (typeof (f as any).requestSubmit === 'function') {
          (f as any).requestSubmit();
        } else {
          const btn = f.querySelector('button[type="submit"]') as HTMLButtonElement | null;
          if (btn) btn.click();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [submitting]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-5">
          <Select
            value={manageSelection}
            onChange={onManageSelectionChange}
            options={[{ value: 'campos', label: 'Campos' }, { value: 'perfis', label: 'Perfis' }, { value: 'usuarios', label: 'Usuários' }, { value: 'imagens', label: 'Imagens' }].filter((o) => allowedSubmodulos.includes(o.value))}
            showPlaceholder={false}
            className="!w-[180px]"
            disabled
          />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrevRecord}
              disabled={!hasPrevRecord}
              className={hasPrevRecord ? 'inline-flex items-center justify-center rounded-[3px] bg-[#ddd] px-[5px] py-[5px] text-sm text-black cursor-pointer hover:bg-slate-300' : 'inline-flex items-center justify-center rounded-[3px] bg-[#ddd] px-[5px] py-[5px] text-sm text-black opacity-40 cursor-pointer'}
              style={{ borderTop: '1px solid transparent', borderLeft: '1px solid transparent', borderRight: '1px solid transparent', borderBottom: '1px solid #000' }}
              aria-label="Registro anterior"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18 9 12l6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onNextRecord}
              disabled={!hasNextRecord}
              className={hasNextRecord ? 'inline-flex items-center justify-center rounded-[3px] bg-[#ddd] px-[5px] py-[5px] text-sm text-black cursor-pointer hover:bg-slate-300' : 'inline-flex items-center justify-center rounded-[3px] bg-[#ddd] px-[5px] py-[5px] text-sm text-black opacity-40 cursor-pointer'}
              style={{ borderTop: '1px solid transparent', borderLeft: '1px solid transparent', borderRight: '1px solid transparent', borderBottom: '1px solid #000' }}
              aria-label="Próximo registro"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={goToList}
          className="inline-flex items-center rounded-[3px] border border-transparent bg-transparent px-4 py-2.5 text-sm font-normal text-[#066fc5] transition cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2 active:outline active:outline-1 active:outline-[#066fc5] active:outline-offset-2"
        >
          Fechar
        </button>
      </div>

      {/* Form */}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="mt-4 flex-1 flex flex-col min-h-0"
      >
        <div className="grid gap-[15px] sm:grid-cols-12 pt-2">
          {/* Sequência */}
          <div className="sm:col-span-1 group">
            {renderFieldLabel('nr_sequencia', 'Sequência')}
            <input
              type="text"
              value={imagem.nr_sequencia ?? ''}
              disabled
              className={`${inputClass} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
            />
          </div>

          {/* Descrição */}
          <div className="sm:col-span-11 group">
            {renderFieldLabel('ds_imagem', 'Descrição')}
            <input
              type="text"
              value={imagem.ds_imagem ?? ''}
              onChange={(e) => setImagem((prev) => ({ ...prev, ds_imagem: e.target.value }))}
              className={inputClass}
            />
          </div>

          {/* Arquivo */}
          <div className="sm:col-span-12 group">
            {renderFieldLabel('ie_arquivo', 'Arquivo')}
            <input type="file" ref={fileInputRef} accept=".jpeg,.jpg,.png" className="hidden" onChange={handleFileChange} />
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => fileInputRef.current?.click()}
                disabled={!!editingId}
                className={editingId
                  ? 'inline-flex items-center justify-center rounded-[3px] bg-[#ddd] px-[5px] py-[5px] text-sm text-black opacity-40 cursor-pointer'
                  : 'inline-flex items-center justify-center rounded-[3px] bg-[#ddd] px-[5px] py-[5px] text-sm text-black cursor-pointer hover:bg-slate-300'}
                style={{ borderTop: '1px solid transparent', borderLeft: '1px solid transparent', borderRight: '1px solid transparent', borderBottom: '1px solid #000' }}
                aria-label="Selecionar arquivo">
                Selecionar arquivo
              </button>
              <input
                type="text"
                value={imagem.ie_arquivo ?? ''}
                disabled
                className={`${inputClass} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500 flex-1 min-w-0`}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-3">
            {editingId && (
              <div className="text-[13px] text-slate-500">
                <div className="relative group flex items-center gap-2">
                  <span>Criado por {createdBy || '-'} em {createdAt ? formatDate(createdAt) : '-'}</span>
                  <button
                    type="button"
                    onClick={() => onOpenAudit?.(editingId)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none"
                    aria-label="Abrir histórico de auditoria"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4" />
                      <circle cx="12" cy="16" r="0.5" />
                    </svg>
                  </button>
                </div>
                <div className="relative group flex items-center gap-2 mt-1">
                  <span>Alterado por {updatedBy || '-'} em {updatedAt ? formatDate(updatedAt) : '-'}</span>
                  <button
                    type="button"
                    onClick={() => onOpenAudit?.(editingId)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none"
                    aria-label="Abrir histórico de auditoria"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4" />
                      <circle cx="12" cy="16" r="0.5" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={goToList}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-40"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
