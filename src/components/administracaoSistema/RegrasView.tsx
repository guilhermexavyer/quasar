"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Select from "@/components/ui/Select";
import { ADMIN_OPCOES_DROPDOWN } from "@/lib/permissoesUtils";
import ResizableTable from "@/components/ui/ResizableTable";
import CampoPesquisa from "@/components/ui/CampoPesquisa";
import { filtrarPesquisa } from "@/lib/pesquisaUtils";
import PaineisRedimensionaveis, { type ConfigPaineis } from "@/components/ui/PaineisRedimensionaveis";
import type { ConfigColunasTabela } from "@/components/ui/ResizableTable";
import FieldInfoPopup from "@/components/ui/FieldInfoPopup";
import { formatDate } from "@/lib/pessoaFisicaUtils";
import { DIAS_LOGOUT } from "@/lib/regraUtils";
import { filtrarAuditoriaDaRegra, obterRegra, salvarRegra, CAMPOS_REGRA, type IdRegra, type Regra } from "@/services/regraService";
import { useLogsDoItem } from "@/lib/logsDoItem";
import type { AuditAutor } from "@/services/auditService";
import { elementoVisivel } from "@/lib/visibilidade";

/** Regras configuráveis (tabela da esquerda). Os valores de todas ficam no mesmo documento da coleção regra. */
const REGRAS: { id: IdRegra; regra: string }[] = [
  { id: "badge_teste", regra: "Badge de teste" },
  { id: "logout_automatico", regra: "Logout automático" },
];

/** Máscara HH:MM enquanto digita (só números; os dois pontos entram sozinhos). */
function mascararHorario(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 4);
  return digitos.length > 2 ? `${digitos.slice(0, 2)}:${digitos.slice(2)}` : digitos;
}

const OPCOES_SIM_NAO = [
  { value: "S", label: "Sim" },
  { value: "N", label: "Não" },
];

type CampoInfo = "ie_logout_dia" | "hr_logout" | "ie_badge_teste";
const FIELD_INFOS: Record<CampoInfo, { type: string; field: string; collection: string }> = {
  ie_logout_dia: { type: "string", field: "ie_logout_dia", collection: "regra" },
  hr_logout: { type: "string", field: "hr_logout", collection: "regra" },
  ie_badge_teste: { type: "string", field: "ie_badge_teste", collection: "regra" },
};

interface RegrasViewProps {
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  allowedSubmodulos?: string[];
  auditAutor?: AuditAutor;
  /** Resolve ds_usuario para o nome exibido no rodapé de auditoria. */
  resolverNomeAutorExibicao?: (dsUsuario: string) => string;
  /** Abre o histórico de auditoria somente da regra informada. */
  onOpenAudit?: (regraDocId: string, regra: IdRegra) => void;
  onSaveSuccess?: (message: string) => void;
  onSavingChange?: (saving: boolean) => void;
  /** Avisa a página que a regra mudou (o logout automático passa a seguir a nova configuração). */
  onRegraSalva?: (regra: Regra) => void;
  /** Ordem e largura das colunas salvas no usuário. */
  colunas?: ConfigColunasTabela;
  /** Largura dos painéis (redimensionável), salva no usuário. */
  paineis?: ConfigPaineis;
}

export default function RegrasView({
  manageSelection,
  onManageSelectionChange,
  allowedSubmodulos = ["regras"],
  auditAutor,
  resolverNomeAutorExibicao = (n) => n,
  onOpenAudit,
  onSaveSuccess,
  onSavingChange,
  onRegraSalva,
  colunas,
  paineis,
}: RegrasViewProps) {
  const [regraDoc, setRegraDoc] = useState<Regra | null>(null);
  const [pesquisa, setPesquisa] = useState("");
  const [selecionada, setSelecionada] = useState<IdRegra | null>(null);
  // Logs da regra selecionada (só aparecem depois que ela for salva pela primeira vez).
  const logsRegra = useLogsDoItem("regra", regraDoc?.id, selecionada, filtrarAuditoriaDaRegra, regraDoc?.dt_alteracao);
  const [rascunho, setRascunho] = useState<Partial<Regra> | null>(null);
  const [saving, setSaving] = useState(false);
  const [infoAberto, setInfoAberto] = useState<CampoInfo | null>(null);
  const [infoAnchor, setInfoAnchor] = useState<HTMLElement | null>(null);
  const [erro, setErro] = useState("");
  const handleSalvarRef = useRef<() => void>(() => {});
  const raizRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelado = false;
    obterRegra()
      .then((doc) => { if (!cancelado) setRegraDoc(doc); })
      .catch((e) => console.error("Erro ao carregar regras", e));
    return () => { cancelado = true; };
  }, []);

  // Badge de teste nunca salvo vale "Não".
  const valores = useMemo<Partial<Regra>>(
    () => ({ ...regraDoc, ...rascunho, ie_badge_teste: rascunho?.ie_badge_teste || regraDoc?.ie_badge_teste || "N" }),
    [regraDoc, rascunho]
  );

  function selecionar(regra: IdRegra) {
    // Trocar de regra descarta o que não foi salvo (mesmo comportamento dos formulários).
    setSelecionada(regra);
    setRascunho(null);
    setInfoAberto(null);
    setErro("");
  }

  function alterar(campo: keyof Regra, valor: string) {
    setRascunho((r) => ({ ...r, [campo]: valor }));
    setErro("");
  }

  const handleSalvar = useCallback(async () => {
    if (!selecionada || saving) return;
    const campos = CAMPOS_REGRA[selecionada];
    // Logout: dia e horário andam juntos — os dois preenchidos (regra ativa) ou os dois vazios (desativada).
    const preenchidos = campos.filter((c) => String(valores[c] ?? "") !== "").length;
    if (selecionada === "logout_automatico" && preenchidos > 0 && preenchidos < campos.length) {
      setErro("Informe o dia e o horário, ou deixe os dois vazios para desativar a regra.");
      return;
    }
    if (selecionada === "logout_automatico" && valores.hr_logout && !/^([01]\d|2[0-3]):[0-5]\d$/.test(valores.hr_logout)) {
      setErro("Informe um horário válido no formato HH:MM (00:00 a 23:59).");
      return;
    }
    setSaving(true);
    onSavingChange?.(true);
    try {
      const atualizado = await salvarRegra(selecionada, valores, auditAutor);
      setRegraDoc(atualizado);
      setRascunho(null);
      onRegraSalva?.(atualizado);
      onSaveSuccess?.("Regra salva com sucesso");
    } catch (e) {
      console.error("Erro ao salvar regra", e);
      onSaveSuccess?.("Erro ao salvar regra.");
    } finally {
      setSaving(false);
      onSavingChange?.(false);
    }
  }, [selecionada, saving, valores, auditAutor, onSaveSuccess, onSavingChange, onRegraSalva]);

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

  function rotulo(campo: CampoInfo, texto: string) {
    return (
      <div className="block text-sm mb-1" style={{ color: "#666" }}>
        <div className="relative group inline-flex items-center gap-2">
          <span>{texto}</span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setInfoAnchor(event.currentTarget);
              setInfoAberto((v) => (v === campo ? null : campo));
            }}
            aria-label={`Informações do campo ${texto}`}
            className={`inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer transition-none ${infoAberto === campo ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <circle cx="12" cy="16" r="0.5" />
            </svg>
          </button>
          {infoAberto === campo && (
            <FieldInfoPopup anchor={infoAnchor} meta={FIELD_INFOS[campo]} onClose={() => setInfoAberto(null)} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={raizRef} className="flex-1 flex flex-col min-h-0 space-y-6">
      {/* Header replicando o padrão das listagens */}
      <div className="flex min-h-[42px] items-center gap-2">
        <Select
          value={manageSelection}
          onChange={onManageSelectionChange}
          options={ADMIN_OPCOES_DROPDOWN.filter((o) => allowedSubmodulos.includes(o.value))}
          showPlaceholder={!manageSelection}
          className="!w-[180px]"
        />
      </div>

      <div className="bg-white flex-1 flex flex-col min-h-0 overflow-hidden">
        <PaineisRedimensionaveis proporcoesPadrao={[1, 2]} config={paineis?.config} onChange={paineis?.onChange}>
          {/* ── Painel 1: Regras (1/3) ── */}
          <div className="flex min-h-0 flex-col overflow-hidden border p-[5px]" style={bordaPainel}>
            <CampoPesquisa valor={pesquisa} onChange={setPesquisa} />
            <div className="overflow-auto flex-1 min-h-0">
              <ResizableTable
                {...colunas}
                columns={[{ key: "regra", label: "Regra" }]}
                rows={filtrarPesquisa(REGRAS, pesquisa, (x) => [x.regra])}
                rowKey={(r) => r.id}
                rowClassName={(r) => (r.id === selecionada ? "row-selected" : "")}
                onRowClick={(r) => selecionar(r.id)}
              />
            </div>
          </div>

          {/* ── Painel 2: Configuração da regra (2/3) ── */}
          <div className="flex min-h-0 flex-col overflow-hidden border p-[5px]" style={bordaPainel}>
            {!selecionada ? (
              <div className="flex h-full items-center justify-center p-4 text-center text-sm text-slate-500">
                Selecione uma regra para configurar.
              </div>
            ) : (
              <div className="flex flex-col h-full min-h-0">
                <div className="flex-1 min-h-0 overflow-auto">
                  {selecionada === "logout_automatico" && (
                    <div className="grid grid-cols-10 gap-[15px]">
                      <div className="col-span-7 min-w-0">
                        {rotulo("ie_logout_dia", "Dia")}
                        <Select
                          value={valores.ie_logout_dia ?? ""}
                          onChange={(v) => alterar("ie_logout_dia", v)}
                          options={DIAS_LOGOUT}
                          visibleOptions={8}
                        />
                      </div>
                      <div className="col-span-3 min-w-0">
                        {rotulo("hr_logout", "Horário")}
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={5}
                          placeholder="HH:MM"
                          value={valores.hr_logout ?? ""}
                          onChange={(e) => alterar("hr_logout", mascararHorario(e.target.value))}
                          className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                        />
                      </div>
                    </div>
                  )}
                  {selecionada === "badge_teste" && (
                    <div>
                      {rotulo("ie_badge_teste", "Badge de teste")}
                      <Select
                        value={valores.ie_badge_teste ?? "N"}
                        onChange={(v) => alterar("ie_badge_teste", v)}
                        options={OPCOES_SIM_NAO}
                        showPlaceholder={false}
                      />
                    </div>
                  )}
                  {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}
                </div>

                {/* Auditoria + Cancelar / Salvar — padrão de Avisos */}
                <div className="flex items-end justify-between gap-3 pt-[5px]">
                  {regraDoc?.id && logsRegra && (
                    <div className="text-[13px] text-slate-500">
                      <div className="relative group flex items-center gap-2">
                        <span>Criado por {resolverNomeAutorExibicao(logsRegra.createdBy) || "-"} em {logsRegra.createdAt ? formatDate(logsRegra.createdAt) : "-"}</span>
                        <button type="button" aria-hidden="true" onClick={() => regraDoc.id && selecionada && onOpenAudit?.(regraDoc.id, selecionada)}
                          className="inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><circle cx="12" cy="16" r="0.5" /></svg>
                        </button>
                      </div>
                      <div className="relative group flex items-center gap-2 mt-1">
                        <span>Alterado por {resolverNomeAutorExibicao(logsRegra.updatedBy) || "-"} em {logsRegra.updatedAt ? formatDate(logsRegra.updatedAt) : "-"}</span>
                        <button type="button" aria-hidden="true" onClick={() => regraDoc.id && selecionada && onOpenAudit?.(regraDoc.id, selecionada)}
                          className="inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><circle cx="12" cy="16" r="0.5" /></svg>
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => { setRascunho(null); setErro(""); }}
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
        </PaineisRedimensionaveis>
      </div>
    </div>
  );
}
