"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Select from "@/components/ui/Select";
import ResizableTable from "@/components/ui/ResizableTable";
import type { ConfigColunasTabela } from "@/components/ui/ResizableTable";
import FieldInfoPopup from "@/components/ui/FieldInfoPopup";
import { formatDate } from "@/lib/pessoaFisicaUtils";
import { obterAviso, salvarAviso, type Aviso, type CampoAviso } from "@/services/avisoService";
import { TITULOS_AVISO } from "@/components/ui/AvisoModal";
import type { AuditAutor } from "@/services/auditService";
import { elementoVisivel } from "@/lib/visibilidade";

/** Avisos configuráveis (tabela da esquerda). O texto de cada um fica em um campo da coleção aviso. */
const AVISOS: { id: CampoAviso; aviso: string }[] = [
  { id: "ds_esqueceu_senha", aviso: TITULOS_AVISO.ds_esqueceu_senha },
  { id: "ds_politica_privacidade", aviso: TITULOS_AVISO.ds_politica_privacidade },
];

const FIELD_INFOS: Record<CampoAviso, { type: string; field: string; collection: string }> = {
  ds_esqueceu_senha: { type: "string", field: "ds_esqueceu_senha", collection: "aviso" },
  ds_politica_privacidade: { type: "string", field: "ds_politica_privacidade", collection: "aviso" },
};

interface AvisosViewProps {
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  allowedSubmodulos?: string[];
  auditAutor?: AuditAutor;
  /** Resolve ds_usuario para o nome exibido no rodapé de auditoria. */
  resolverNomeAutorExibicao?: (dsUsuario: string) => string;
  /** Abre o histórico de auditoria somente do aviso informado. */
  onOpenAudit?: (avisoId: string, campo: CampoAviso) => void;
  onSaveSuccess?: (message: string) => void;
  onSavingChange?: (saving: boolean) => void;
  /** Ordem e largura das colunas salvas no usuário. */
  colunas?: ConfigColunasTabela;
}

export default function AvisosView({
  manageSelection,
  onManageSelectionChange,
  allowedSubmodulos = ["avisos"],
  auditAutor,
  resolverNomeAutorExibicao = (n) => n,
  onOpenAudit,
  onSaveSuccess,
  onSavingChange,
  colunas,
}: AvisosViewProps) {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [selecionado, setSelecionado] = useState<CampoAviso | null>(null);
  const [rascunho, setRascunho] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [infoAberto, setInfoAberto] = useState(false);
  const [infoAnchor, setInfoAnchor] = useState<HTMLElement | null>(null);
  const handleSalvarRef = useRef<() => void>(() => {});
  const raizRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelado = false;
    obterAviso()
      .then((doc) => { if (!cancelado) setAviso(doc); })
      .catch((e) => console.error("Erro ao carregar avisos", e));
    return () => { cancelado = true; };
  }, []);

  const valorSalvo = selecionado ? aviso?.[selecionado] ?? "" : "";
  const valorEmEdicao = rascunho ?? valorSalvo;

  function selecionar(campo: CampoAviso) {
    // Trocar de aviso descarta o que não foi salvo (mesmo comportamento dos formulários).
    setSelecionado(campo);
    setRascunho(null);
    setInfoAberto(false);
  }

  const handleSalvar = useCallback(async () => {
    if (!selecionado || saving) return;
    setSaving(true);
    onSavingChange?.(true);
    try {
      const atualizado = await salvarAviso(selecionado, valorEmEdicao, auditAutor);
      setAviso(atualizado);
      setRascunho(null);
      onSaveSuccess?.("Aviso salvo com sucesso");
    } catch (e) {
      console.error("Erro ao salvar aviso", e);
      onSaveSuccess?.("Erro ao salvar aviso.");
    } finally {
      setSaving(false);
      onSavingChange?.(false);
    }
  }, [selecionado, saving, valorEmEdicao, auditAutor, onSaveSuccess, onSavingChange]);

  useEffect(() => { handleSalvarRef.current = handleSalvar; }, [handleSalvar]);

  // Atalho Ctrl+S
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        if (!elementoVisivel(raizRef.current)) return; // função escondida: não salva
        e.preventDefault();
        handleSalvarRef.current();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const bordaPainel = {
    borderStyle: "solid",
    borderWidth: "1px",
    borderTopColor: "#999",
    borderLeftColor: "#999",
    borderBottomColor: "#ccc",
    borderRightColor: "#ccc",
  } as const;

  return (
    <div ref={raizRef} className="flex-1 flex flex-col min-h-0 space-y-6">
      {/* Header replicando o padrão das listagens */}
      <div className="flex min-h-[42px] items-center gap-2">
        <Select
          value={manageSelection}
          onChange={onManageSelectionChange}
          options={[{ value: 'avisos', label: 'Avisos' }, { value: 'campos', label: 'Campos' }, { value: 'imagens', label: 'Imagens' }, { value: 'perfis', label: 'Perfis' }, { value: 'usuarios', label: 'Usuários' }].filter((o) => allowedSubmodulos.includes(o.value))}
          showPlaceholder={!manageSelection}
          className="!w-[180px]"
        />
      </div>

      <div className="bg-white flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 grid grid-cols-3 gap-3">
          {/* ── Painel 1: Avisos (1/3) ── */}
          <div className="flex min-h-0 flex-col overflow-hidden border p-[5px]" style={bordaPainel}>
            <div className="overflow-auto flex-1 min-h-0">
              <ResizableTable
                {...colunas}
                columns={[{ key: "aviso", label: "Aviso" }]}
                rows={AVISOS}
                rowKey={(a) => a.id}
                rowClassName={(a) => (a.id === selecionado ? "row-selected" : "")}
                onRowClick={(a) => selecionar(a.id)}
              />
            </div>
          </div>

          {/* ── Painel 2: Conteúdo do aviso (2/3) ── */}
          <div className="col-span-2 flex min-h-0 flex-col overflow-hidden border p-[5px]" style={bordaPainel}>
            {!selecionado ? (
              <div className="flex h-full items-center justify-center p-4 text-center text-sm text-slate-500">
                Selecione um aviso para configurar.
              </div>
            ) : (
              <div className="flex flex-col h-full min-h-0">
                <div className="flex-1 min-h-0 flex flex-col">
                  <div className="block text-sm mb-1" style={{ color: "#666" }}>
                    <div className="relative group inline-flex items-center gap-2">
                      <span>Conteúdo</span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setInfoAnchor(event.currentTarget);
                          setInfoAberto((v) => !v);
                        }}
                        aria-label="Informações do campo Conteúdo"
                        className={`inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer transition-none ${infoAberto ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4" />
                          <circle cx="12" cy="16" r="0.5" />
                        </svg>
                      </button>
                      {infoAberto && (
                        <FieldInfoPopup anchor={infoAnchor} meta={FIELD_INFOS[selecionado]} onClose={() => setInfoAberto(false)} />
                      )}
                    </div>
                  </div>
                  <textarea
                    value={valorEmEdicao}
                    onChange={(e) => setRascunho(e.target.value)}
                    spellCheck={false}
                    className="flex-1 min-h-[160px] w-full resize-none rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm font-mono transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                  />
                </div>

                {/* Auditoria + Cancelar / Salvar — padrão de Parâmetros da função */}
                <div className="flex items-end justify-between gap-3 pt-[5px]">
                  {aviso?.id && (
                    <div className="text-[13px] text-slate-500">
                      <div className="relative group flex items-center gap-2">
                        <span>Criado por {resolverNomeAutorExibicao(aviso.ds_usuario_criacao ?? "") || "-"} em {aviso.dt_criacao ? formatDate(aviso.dt_criacao) : "-"}</span>
                        <button type="button" aria-hidden="true" onClick={() => aviso.id && selecionado && onOpenAudit?.(aviso.id, selecionado)}
                          className="inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><circle cx="12" cy="16" r="0.5" /></svg>
                        </button>
                      </div>
                      <div className="relative group flex items-center gap-2 mt-1">
                        <span>Alterado por {resolverNomeAutorExibicao(aviso.ds_usuario_alteracao ?? "") || "-"} em {aviso.dt_alteracao ? formatDate(aviso.dt_alteracao) : "-"}</span>
                        <button type="button" aria-hidden="true" onClick={() => aviso.id && selecionado && onOpenAudit?.(aviso.id, selecionado)}
                          className="inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><circle cx="12" cy="16" r="0.5" /></svg>
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setRascunho(null)}
                      className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                      style={{ backgroundColor: "#bdbdbd", borderBottomColor: "#000" } as React.CSSProperties}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSalvar}
                      disabled={saving}
                      className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:opacity-50"
                      style={{ backgroundColor: "#003056", borderBottomColor: "#000" } as React.CSSProperties}
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
