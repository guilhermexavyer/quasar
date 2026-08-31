"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Perfil } from "@/types/perfil";
import {
  CAMPO_STATUS_LABELS,
  CAMPOS_POR_FUNCAO,
  getCampoStatusByKey,
  parseCamposConfig,
  type CampoStatus,
} from "@/lib/camposConfigUtils";
import { parseFuncoesConfig, type FuncaoId } from "@/lib/perfilUtils";
import ContextMenu from "@/components/ui/ContextMenu";
import ResizableTable from "@/components/ui/ResizableTable";
import Select from "@/components/ui/Select";

const FUNCAO_LABELS: Record<string, string> = {
  pessoaFisica: "Cadastro de Pessoas",
  administracaoSistema: "Administração do Sistema",
  cadastrosGerais: "Cadastros Gerais",
  estruturaAcademica: "Estrutura Acadêmica",
  patrimonio: "Patrimônio",
  relatorio: "Gerenciador de Relatórios",
};

const FUNCAO_ORDER_ALPHA = Object.keys(FUNCAO_LABELS).sort((a, b) =>
  (FUNCAO_LABELS[a] ?? a).localeCompare(FUNCAO_LABELS[b] ?? b, "pt-BR")
);

/** Funções liberadas de um perfil (config_funcoes), em ordem alfabética. */
function funcoesLiberadasDe(perfil: Perfil | null): string[] {
  if (!perfil) return [];
  const ids = parseFuncoesConfig(perfil.config_funcoes);
  return FUNCAO_ORDER_ALPHA.filter((f) => ids.includes(f as FuncaoId));
}

interface CamposViewProps {
  perfis: Perfil[];
  onChangeStatus: (perfil: Perfil, chave: string, status: CampoStatus) => void;
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  /** Submódulos permitidos do dropdown PAI (Campos/Perfis/Usuários) conforme permissões. */
  allowedSubmodulos?: string[];
  /** Permite ao usuário alterar o status dos campos (menu de contexto). */
  podeAlterarStatusCampo?: boolean;
  /** Seleção de perfil (controlada pelo pai para persistir entre navegações). */
  selectedPerfilId?: string | null;
  onSelectedPerfilIdChange?: (id: string | null) => void;
  /** Seleção de função (controlada pelo pai para persistir entre navegações). */
  selectedFuncao?: string | null;
  onSelectedFuncaoChange?: (fn: string | null) => void;
  /** Indica se uma função já foi selecionada pelo menos uma vez. */
  funcaoJaSelecionada?: boolean;
  onFuncaoJaSelecionadaChange?: (v: boolean) => void;
}

export default function CamposView({
  perfis,
  onChangeStatus,
  manageSelection,
  onManageSelectionChange,
  allowedSubmodulos = ['campos', 'perfis', 'usuarios'],
  podeAlterarStatusCampo = true,
  selectedPerfilId: selectedPerfilIdProp,
  onSelectedPerfilIdChange,
  selectedFuncao: selectedFuncaoProp,
  onSelectedFuncaoChange,
  funcaoJaSelecionada: funcaoJaSelecionadaProp,
  onFuncaoJaSelecionadaChange,
}: CamposViewProps) {
  // Estado controlado pelo pai (persiste entre navegações dentro da mesma seção).
  // Fallback para estado local caso as props não sejam fornecidas.
  const selectedPerfilId = selectedPerfilIdProp ?? null;
  const setSelectedPerfilId = onSelectedPerfilIdChange ?? (() => {});
  const selectedFuncao = selectedFuncaoProp ?? null;
  const setSelectedFuncao = onSelectedFuncaoChange ?? (() => {});
  const funcaoJaSelecionada = funcaoJaSelecionadaProp ?? false;
  const setFuncaoJaSelecionada = onFuncaoJaSelecionadaChange ?? (() => {});
  const [selectedCampoKey, setSelectedCampoKey] = useState<string | null>(null);

  // Ordenação em 3 estados (mesma lógica das tabelas de registro):
  // 1º clique = crescente, 2º = decrescente, 3º = padrão (null).
  const [perfilSortKey, setPerfilSortKey] = useState<"nr_sequencia" | "ds_perfil" | null>(null);
  const [perfilSortAsc, setPerfilSortAsc] = useState<boolean | null>(null);
  const [funcaoSortKey, setFuncaoSortKey] = useState<string | null>(null);
  const [funcaoSortAsc, setFuncaoSortAsc] = useState<boolean | null>(null);
  const [campoSortKey, setCampoSortKey] = useState<string | null>(null);
  const [campoSortAsc, setCampoSortAsc] = useState<boolean | null>(null);

  // Menu de contexto do campo (status: Normal/Obrigatório/Desabilitado).
  const [campoMenu, setCampoMenu] = useState<{
    x: number;
    y: number;
    chave: string;
  } | null>(null);
  // Referência do menu aberto: cliques dentro dele não fecham o menu.
  const campoMenuRef = useRef<HTMLDivElement | null>(null);

  // Fecha o menu de contexto ao clicar fora do container de campos (painel 3).
  useEffect(() => {
    if (!campoMenu) return;
    function handleClose(event: MouseEvent) {
      if (campoMenuRef.current && campoMenuRef.current.contains(event.target as Node)) {
        return;
      }
      setCampoMenu(null);
    }
    document.addEventListener("mousedown", handleClose);
    return () => document.removeEventListener("mousedown", handleClose);
  }, [campoMenu]);

  const selectedPerfil = perfis.find((p) => p.id === selectedPerfilId) ?? null;

  // Funções liberadas do perfil selecionado (config_funcoes), em ordem alfabética.
  const funcoesLiberadas = useMemo(() => funcoesLiberadasDe(selectedPerfil), [selectedPerfil]);

  // Nenhuma função vem pré-selecionada: o usuário deve clicar na função para
  // ver os campos. Se a função selecionada deixar de ser liberada, cai para null.
  const funcaoAtiva =
    selectedFuncao && funcoesLiberadas.includes(selectedFuncao)
      ? selectedFuncao
      : null;

  const config = useMemo(
    () => (selectedPerfil ? parseCamposConfig(selectedPerfil.config_campos) : {}),
    [selectedPerfil]
  );

  const campos = useMemo(() => {
    if (!funcaoAtiva) return [];
    return [...(CAMPOS_POR_FUNCAO[funcaoAtiva] ?? [])];
  }, [funcaoAtiva]);

  function togglePerfilSort(key: "nr_sequencia" | "ds_perfil") {
    if (perfilSortKey === key) {
      if (perfilSortAsc) {
        setPerfilSortAsc(false);
      } else {
        setPerfilSortKey(null);
        setPerfilSortAsc(null);
      }
    } else {
      setPerfilSortKey(key);
      setPerfilSortAsc(true);
    }
  }

  function toggleFuncaoSort() {
    if (funcaoSortKey === "funcao") {
      if (funcaoSortAsc) {
        setFuncaoSortAsc(false);
      } else {
        setFuncaoSortKey(null);
        setFuncaoSortAsc(null);
      }
    } else {
      setFuncaoSortKey("funcao");
      setFuncaoSortAsc(true);
    }
  }

  function toggleCampoSort(key: string) {
    if (campoSortKey === key) {
      if (campoSortAsc) {
        setCampoSortAsc(false);
      } else {
        setCampoSortKey(null);
        setCampoSortAsc(null);
      }
    } else {
      setCampoSortKey(key);
      setCampoSortAsc(true);
    }
  }

  const sortedPerfis = useMemo(() => {
    if (perfilSortKey === null || perfilSortAsc === null) {
      // Ordenação padrão: nr_sequencia crescente (mesmo padrão das listagens).
      return [...perfis].sort((a, b) => a.nr_sequencia - b.nr_sequencia);
    }
    const list = [...perfis];
    list.sort((a, b) => {
      const av = String(a[perfilSortKey] ?? "");
      const bv = String(b[perfilSortKey] ?? "");
      const cmp = av.localeCompare(bv, "pt-BR", { numeric: true, sensitivity: "base" });
      return perfilSortAsc ? cmp : -cmp;
    });
    return list;
  }, [perfis, perfilSortKey, perfilSortAsc]);

  const sortedFuncoes = useMemo(() => {
    const list = [...funcoesLiberadas];
    if (funcaoSortKey === null || funcaoSortAsc === null) {
      // Ordenação padrão: alfabética.
      return list;
    }
    list.sort((a, b) => {
      const cmp = (FUNCAO_LABELS[a] ?? a).localeCompare(FUNCAO_LABELS[b] ?? b, "pt-BR");
      return funcaoSortAsc ? cmp : -cmp;
    });
    return list;
  }, [funcoesLiberadas, funcaoSortKey, funcaoSortAsc]);

  const sortedCampos = useMemo(() => {
    const list = [...campos];
    const valorDe = (c: (typeof campos)[number], key: string): string => {
      if (key === "tipo") return c.tipo;
      if (key === "status") return getCampoStatusByKey(config, c.key);
      return c.label;
    };
    if (campoSortKey === null || campoSortAsc === null) {
      // Ordenação padrão: agrupa por tipo (ex.: Pessoa Física), depois por label.
      list.sort((a, b) => {
        let cmp = a.tipo.localeCompare(b.tipo, "pt-BR");
        if (cmp === 0) cmp = a.label.localeCompare(b.label, "pt-BR");
        return cmp;
      });
      return list;
    }
    list.sort((a, b) => {
      const cmp = valorDe(a, campoSortKey).localeCompare(valorDe(b, campoSortKey), "pt-BR");
      return campoSortAsc ? cmp : -cmp;
    });
    return list;
  }, [campos, campoSortKey, campoSortAsc, config]);

  const menuCampo = campoMenu ? sortedCampos.find((c) => c.key === campoMenu.chave) : null;

  return (
    <>
      <div className="flex-1 flex flex-col min-h-0 space-y-6">
      {/* Altura mínima replica o header das listagens (botão Adicionar py-2.5 ≈ 42px):
          mantém o dropdown Pai e o container na mesma posição das demais funções. */}
      <div className="flex min-h-[42px] items-center gap-2">
        <Select
          value={manageSelection}
          onChange={onManageSelectionChange}
          options={[{ value: 'campos', label: 'Campos' }, { value: 'perfis', label: 'Perfis' }, { value: 'usuarios', label: 'Usuários' }, { value: 'imagens', label: 'Imagens' }].filter((o) => allowedSubmodulos.includes(o.value))}
          showPlaceholder={!manageSelection}
          className="!w-[180px]"
        />
      </div>

      <div className="bg-white flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 grid grid-cols-3 gap-3">
          {/* ── Painel 1: Perfis ── */}
          <div
            className="flex min-h-0 flex-col overflow-hidden border p-[5px]"
            style={{
              borderStyle: 'solid',
              borderWidth: '1px',
              borderTopColor: '#999',
              borderLeftColor: '#999',
              borderBottomColor: '#ccc',
              borderRightColor: '#ccc',
            }}
          >
            <div className="overflow-auto flex-1 min-h-0">
              <ResizableTable<Perfil>
                columns={[
                  { key: "nr_sequencia", label: "#", align: "center", render: (p) => p.nr_sequencia },
                  { key: "ds_perfil", label: "Perfil", render: (p) => p.ds_perfil },
                ]}
                rows={sortedPerfis}
                rowKey={(p) => p.id ?? String(p.nr_sequencia)}
                sortColumn={perfilSortKey}
                sortAsc={perfilSortAsc ?? true}
                onSortChange={(key) => togglePerfilSort(key as "nr_sequencia" | "ds_perfil")}
                rowClassName={(p) => (p.id === selectedPerfilId ? "row-selected" : "")}
                onRowClick={(p) => {
                  setSelectedPerfilId(p.id ?? null);
                  setSelectedCampoKey(null);
                  if (funcaoJaSelecionada) {
                    // Campos já estavam sendo exibidos: ao trocar de perfil, mantém a
                    // função escolhida (se o novo perfil a tiver) ou assume a primeira.
                    const liberadas = funcoesLiberadasDe(p);
                    const manter = selectedFuncao && liberadas.includes(selectedFuncao) ? selectedFuncao : null;
                    setSelectedFuncao(manter ?? liberadas[0] ?? null);
                  } else {
                    // Primeira vez: exige que o usuário clique numa função para exibir os campos.
                    setSelectedFuncao(null);
                  }
                }}
              />
            </div>
          </div>

          {/* ── Painel 2: Funções liberadas ── */}
          <div
            className="flex min-h-0 flex-col overflow-hidden border p-[5px]"
            style={{
              borderStyle: 'solid',
              borderWidth: '1px',
              borderTopColor: '#999',
              borderLeftColor: '#999',
              borderBottomColor: '#ccc',
              borderRightColor: '#ccc',
            }}
          >
            {!selectedPerfil ? (
              <div className="flex h-full items-center justify-center p-4 text-center text-sm text-slate-500">
                Selecione um perfil.
              </div>
            ) : funcoesLiberadas.length === 0 ? (
              <div className="flex h-full items-center justify-center p-4 text-center text-sm text-slate-500">
                Nenhuma função liberada para este perfil.
              </div>
            ) : (
              <div className="overflow-auto flex-1 min-h-0">
                <ResizableTable<string>
                  columns={[
                    { key: "funcao", label: "Função", render: (f) => FUNCAO_LABELS[f] ?? f },
                  ]}
                  rows={sortedFuncoes}
                  rowKey={(f) => f}
                  sortColumn={funcaoSortKey}
                  sortAsc={funcaoSortAsc ?? true}
                  onSortChange={toggleFuncaoSort}
                  rowClassName={(f) => (f === funcaoAtiva ? "row-selected" : "")}
                  onRowClick={(f) => {
                    setSelectedFuncao(f);
                    setSelectedCampoKey(null);
                    setFuncaoJaSelecionada(true);
                  }}
                />
              </div>
            )}
          </div>

          {/* ── Painel 3: Campos da função ── */}
          <div
            className="flex min-h-0 flex-col overflow-hidden border p-[5px]"
            style={{
              borderStyle: 'solid',
              borderWidth: '1px',
              borderTopColor: '#999',
              borderLeftColor: '#999',
              borderBottomColor: '#ccc',
              borderRightColor: '#ccc',
            }}
          >
            {!funcaoAtiva ? (
              <div className="flex h-full items-center justify-center p-4 text-center text-sm text-slate-500">
                Selecione uma função.
              </div>
            ) : (
              <div className="overflow-auto flex-1 min-h-0">
                <ResizableTable<(typeof sortedCampos)[number]>
                  columns={[
                    { key: "tipo", label: "Dropdown", render: (c) => c.tipo },
                    { key: "label", label: "Campo", render: (c) => c.label },
                    {
                      key: "status",
                      label: "Status",
                      render: (c) => CAMPO_STATUS_LABELS[getCampoStatusByKey(config, c.key)],
                    },
                  ]}
                  rows={sortedCampos}
                  rowKey={(c) => c.key}
                  sortColumn={campoSortKey}
                  sortAsc={campoSortAsc ?? true}
                  onSortChange={toggleCampoSort}
                  rowClassName={(c) => (c.key === selectedCampoKey ? "row-selected" : "")}
                  onRowClick={(c) => setSelectedCampoKey(c.key)}
                  onRowContextMenu={(c, e) => {
                    // Clique direito também seleciona o campo.
                    setSelectedCampoKey(c.key);
                    // Sem a permissão de alterar status, o menu de contexto não abre.
                    if (podeAlterarStatusCampo) {
                      setCampoMenu({ x: e.clientX, y: e.clientY, chave: c.key });
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {campoMenu && menuCampo && selectedPerfil && podeAlterarStatusCampo && (
        <div ref={campoMenuRef}>
          <ContextMenu
            x={campoMenu.x}
            y={campoMenu.y}
            state={{ x: campoMenu.x, y: campoMenu.y, section: 'administracaoSistema', item: selectedPerfil }}
            showView={false}
            showDelete={false}
            onView={() => setCampoMenu(null)}
            onChangePassword={() => setCampoMenu(null)}
            onDelete={() => setCampoMenu(null)}
            customItems={(
              // Esconde a opção do status atual: não faz sentido escolher o mesmo status.
              ["N", "O", "D"] as CampoStatus[]
            ).filter((s) => s !== getCampoStatusByKey(config, menuCampo.key)).map((s) => ({
              label: CAMPO_STATUS_LABELS[s],
              onClick: () => {
                onChangeStatus(selectedPerfil, menuCampo.key, s);
                setCampoMenu(null);
              },
            }))}
          />
        </div>
      )}
    </>
  );
}
