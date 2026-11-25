"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Select from "@/components/ui/Select";
import ResizableTable from "@/components/ui/ResizableTable";
import PaineisRedimensionaveis, { type ConfigPaineis } from "@/components/ui/PaineisRedimensionaveis";
import FieldInfoPopup from "@/components/ui/FieldInfoPopup";
import CampoPesquisa from "@/components/ui/CampoPesquisa";
import CampoCorPaleta from "@/components/ui/CampoCorPaleta";
import { filtrarPesquisa } from "@/lib/pesquisaUtils";
import type { ConfigColunasTabela } from "@/components/ui/ResizableTable";
import { formatDate } from "@/lib/ativoUtils";
import {
  COLECAO_PARAM_COR_ATIVO_DESCARTADO,
  COLECAO_PARAM_COR_ATIVO_ESTOQUE,
  COLECAO_PARAM_COR_ATIVO_MANUTENCAO,
  COLECAO_PARAM_COR_ATIVO_OPERACIONAL,
  COLECAO_PARAM_COR_MANUTENCAO_ANDAMENTO,
  COLECAO_PARAM_COR_MANUTENCAO_CANCELADA,
  COLECAO_PARAM_COR_MANUTENCAO_CONCLUIDA,
  COLECAO_PARAM_COR_PERIODO_LETIVO_ANDAMENTO,
  COLECAO_PARAM_COR_PERIODO_LETIVO_ENCERRADO,
  COLECAO_PARAM_REDEFINIR_SENHA_PRIMEIRO_LOGIN,
  COLECAO_PARAM_ENCERRAMENTO_AUTOMATICO_PERIODO_LETIVO,
  COLECAO_PARAM_MATRICULA_ALUNO,
  COLECAO_PARAM_MATRICULA_COLABORADOR,
  COLECAO_PARAM_TIPOS_ARQUIVO_COPIA,
  COLECAO_PARAM_COR_COPIA_AGUARDANDO,
  COLECAO_PARAM_COR_COPIA_CANCELADO,
  COLECAO_PARAM_COR_COPIA_ENTREGUE,
  COLECAO_PARAM_COR_COPIA_IMPRESSO,
  COLECAO_PARAM_DATA_RECEBIMENTO_AUTOMATICA,
  COLECAO_PARAM_FORMATO_PAPEL_PADRAO,
  COLECAO_PARAM_TIPO_PAPEL_PADRAO,
  obterParametro,
  salvarParametro,
  salvarParametroCampos,
  type CampoParametro,
} from "@/services/parametroFuncaoService";
import {
  OPCOES_SEGMENTO_REGRA,
  QTD_SEGMENTOS_REGRA,
  segmentoUsaCampo,
  segmentoUsaDigitos,
  type SegmentoRegra,
} from "@/lib/regraCodigoUtils";
import { CORES_STATUS_PERIODO_LETIVO_PADRAO } from "@/lib/periodoLetivoUtils";
import { CORES_STATUS_ATIVO_PADRAO } from "@/lib/ativoUtils";
import { CORES_STATUS_MANUTENCAO_PADRAO } from "@/lib/manutencaoUtils";
import type { AuditAutor } from "@/services/auditService";
import { elementoVisivel } from "@/lib/visibilidade";
import { CORES_STATUS_COPIA_PADRAO } from "@/lib/copiaUtils";
import { EXTENSOES_ARQUIVO_COPIA, extensoesPermitidasCopia, serializarExtensoesCopia } from "@/lib/copiaArquivoUtils";

/**
 * Parâmetro de uma função: linha da lista + coleção onde o valor é salvo.
 * - "regra": regra de geração de código, 10 segmentos fixos (ie_regra_N: tipo; ds_regra_N: texto ou dígitos);
 * - "cor": cor de um status (cd_cor), com a cor padrão usada enquanto não for configurada;
 * - "simNao": dropdown "Regra" com ---/Não/Sim (ie_regra; --- equivale a Não);
 * - "extensoes": checkboxes com os tipos de arquivo permitidos (ds_regra: extensões separadas por vírgula);
 * - "valorPadrao": dropdown "Valor padrão" com os registros de um cadastro (campoValor: nr_seq_*;
 *   --- = sem valor padrão). As opções vêm da tela (prop opcoesValorPadrao, pelo id do parâmetro).
 */
export interface ParametroDef {
  id: string;
  dropdown: string;
  parametro: string;
  colecao: string;
  tipo: "regra" | "cor" | "simNao" | "extensoes" | "valorPadrao";
  corPadrao?: string;
  /** Tipo "valorPadrao": coluna onde a sequência escolhida é gravada. */
  campoValor?: CampoParametro;
}

/** Parâmetros de configuração da função Patrimônio. */
export const PARAMETROS_PATRIMONIO: ParametroDef[] = [
  {
    id: "cor_status_ativo_descartado",
    dropdown: "Ativos",
    parametro: "Cor do status 'Descartado'",
    colecao: COLECAO_PARAM_COR_ATIVO_DESCARTADO,
    tipo: "cor",
    corPadrao: CORES_STATUS_ATIVO_PADRAO.D,
  },
  {
    id: "cor_status_ativo_estoque",
    dropdown: "Ativos",
    parametro: "Cor do status 'Estoque'",
    colecao: COLECAO_PARAM_COR_ATIVO_ESTOQUE,
    tipo: "cor",
    corPadrao: CORES_STATUS_ATIVO_PADRAO.E,
  },
  {
    id: "cor_status_ativo_manutencao",
    dropdown: "Ativos",
    parametro: "Cor do status 'Manutenção'",
    colecao: COLECAO_PARAM_COR_ATIVO_MANUTENCAO,
    tipo: "cor",
    corPadrao: CORES_STATUS_ATIVO_PADRAO.M,
  },
  {
    id: "cor_status_ativo_operacional",
    dropdown: "Ativos",
    parametro: "Cor do status 'Operacional'",
    colecao: COLECAO_PARAM_COR_ATIVO_OPERACIONAL,
    tipo: "cor",
    corPadrao: CORES_STATUS_ATIVO_PADRAO.O,
  },
  {
    id: "cor_status_manutencao_cancelada",
    dropdown: "Manutenções",
    parametro: "Cor do status 'Cancelada'",
    colecao: COLECAO_PARAM_COR_MANUTENCAO_CANCELADA,
    tipo: "cor",
    corPadrao: CORES_STATUS_MANUTENCAO_PADRAO.CA,
  },
  {
    id: "cor_status_manutencao_concluida",
    dropdown: "Manutenções",
    parametro: "Cor do status 'Concluída'",
    colecao: COLECAO_PARAM_COR_MANUTENCAO_CONCLUIDA,
    tipo: "cor",
    corPadrao: CORES_STATUS_MANUTENCAO_PADRAO.CO,
  },
  {
    id: "cor_status_manutencao_andamento",
    dropdown: "Manutenções",
    parametro: "Cor do status 'Em andamento'",
    colecao: COLECAO_PARAM_COR_MANUTENCAO_ANDAMENTO,
    tipo: "cor",
    corPadrao: CORES_STATUS_MANUTENCAO_PADRAO.E,
  },
];

/** Parâmetros de configuração da função Estrutura Acadêmica. */
export const PARAMETROS_ESTRUTURA_ACADEMICA: ParametroDef[] = [
  {
    id: "geracao_matricula_aluno",
    dropdown: "Alunos",
    parametro: "Geração da matrícula de alunos",
    colecao: COLECAO_PARAM_MATRICULA_ALUNO,
    tipo: "regra",
  },
  {
    id: "geracao_matricula_colaborador",
    dropdown: "Colaboradores",
    parametro: "Geração da matrícula de colaboradores",
    colecao: COLECAO_PARAM_MATRICULA_COLABORADOR,
    tipo: "regra",
  },
  {
    id: "cor_status_periodo_letivo_andamento",
    dropdown: "Período letivo",
    parametro: "Cor do status 'Em andamento'",
    colecao: COLECAO_PARAM_COR_PERIODO_LETIVO_ANDAMENTO,
    tipo: "cor",
    corPadrao: CORES_STATUS_PERIODO_LETIVO_PADRAO.A,
  },
  {
    id: "cor_status_periodo_letivo_encerrado",
    dropdown: "Período letivo",
    parametro: "Cor do status 'Encerrado'",
    colecao: COLECAO_PARAM_COR_PERIODO_LETIVO_ENCERRADO,
    tipo: "cor",
    corPadrao: CORES_STATUS_PERIODO_LETIVO_PADRAO.E,
  },
  {
    id: "encerramento_automatico_periodo_letivo",
    dropdown: "Período letivo",
    parametro: "A previsão de término encerra o período letivo automaticamente",
    colecao: COLECAO_PARAM_ENCERRAMENTO_AUTOMATICO_PERIODO_LETIVO,
    tipo: "simNao",
  },
];

/** Parâmetros de configuração da função Administração do Sistema. */
export const PARAMETROS_ADMINISTRACAO_SISTEMA: ParametroDef[] = [
  {
    id: "redefinir_senha_primeiro_login",
    dropdown: "Usuários",
    parametro: "Redefinir senha no primeiro login após alterar senha",
    colecao: COLECAO_PARAM_REDEFINIR_SENHA_PRIMEIRO_LOGIN,
    tipo: "simNao",
  },
];

/** Parâmetros de configuração da função Controle de Cópias. */
export const PARAMETROS_CONTROLE_COPIAS: ParametroDef[] = [
  {
    id: "cor_status_copia_aguardando",
    dropdown: "Cópias",
    parametro: "Cor do status 'Aguardando'",
    colecao: COLECAO_PARAM_COR_COPIA_AGUARDANDO,
    tipo: "cor",
    corPadrao: CORES_STATUS_COPIA_PADRAO.A,
  },
  {
    id: "cor_status_copia_cancelado",
    dropdown: "Cópias",
    parametro: "Cor do status 'Cancelado'",
    colecao: COLECAO_PARAM_COR_COPIA_CANCELADO,
    tipo: "cor",
    corPadrao: CORES_STATUS_COPIA_PADRAO.C,
  },
  {
    id: "cor_status_copia_entregue",
    dropdown: "Cópias",
    parametro: "Cor do status 'Entregue'",
    colecao: COLECAO_PARAM_COR_COPIA_ENTREGUE,
    tipo: "cor",
    corPadrao: CORES_STATUS_COPIA_PADRAO.E,
  },
  {
    id: "cor_status_copia_impresso",
    dropdown: "Cópias",
    parametro: "Cor do status 'Impresso'",
    colecao: COLECAO_PARAM_COR_COPIA_IMPRESSO,
    tipo: "cor",
    corPadrao: CORES_STATUS_COPIA_PADRAO.I,
  },
  {
    id: "data_recebimento_automatica",
    dropdown: "Cópias",
    parametro: "'Data de recebimento' é automaticamente preenchido com a data atual",
    colecao: COLECAO_PARAM_DATA_RECEBIMENTO_AUTOMATICA,
    tipo: "simNao",
  },
  {
    id: "formato_papel_padrao",
    dropdown: "Cópias",
    parametro: "'Formato do papel' padrão",
    colecao: COLECAO_PARAM_FORMATO_PAPEL_PADRAO,
    tipo: "valorPadrao",
    campoValor: "nr_seq_formato_papel",
  },
  {
    id: "tipo_papel_padrao",
    dropdown: "Cópias",
    parametro: "'Tipo de papel' padrão",
    colecao: COLECAO_PARAM_TIPO_PAPEL_PADRAO,
    tipo: "valorPadrao",
    campoValor: "nr_seq_tipo_papel",
  },
  {
    id: "tipos_arquivo_copia",
    dropdown: "Cópias",
    parametro: "Tipos de arquivo para anexar em 'Cópias'",
    colecao: COLECAO_PARAM_TIPOS_ARQUIVO_COPIA,
    tipo: "extensoes",
  },
];

/** Função com parâmetros (painel Funções de Administração do Sistema > Parâmetros). */
export interface FuncaoComParametros {
  /** Chave da função (ex.: "patrimonio"). */
  funcao: string;
  /** Nome exibido. */
  label: string;
  parametros: ParametroDef[];
}

/** Funções com parâmetros, em ordem alfabética. */
export const FUNCOES_COM_PARAMETROS: FuncaoComParametros[] = [
  { funcao: "administracaoSistema", label: "Administração do Sistema", parametros: PARAMETROS_ADMINISTRACAO_SISTEMA },
  { funcao: "controleCopias", label: "Controle de Cópias", parametros: PARAMETROS_CONTROLE_COPIAS },
  { funcao: "estruturaAcademica", label: "Estrutura Acadêmica", parametros: PARAMETROS_ESTRUTURA_ACADEMICA },
  { funcao: "patrimonio", label: "Patrimônio", parametros: PARAMETROS_PATRIMONIO },
];

/** Opções do parâmetro Sim/Não ("---" vale como Não). */
const OPCOES_SIM_NAO = [
  { value: "N", label: "Não" },
  { value: "S", label: "Sim" },
];

const AUDIT_VAZIO = { createdAt: "", updatedAt: "", createdBy: "", updatedBy: "" };

/** Os 10 segmentos da regra, vazios. */
function segmentosVazios(): SegmentoRegra[] {
  return Array.from({ length: QTD_SEGMENTOS_REGRA }, () => ({ tipo: "", texto: "" }));
}

/** Os 10 segmentos do registro do parâmetro (ie_regra_N / ds_regra_N), na posição de cada um. */
function segmentosDoRegistro(doc: Record<string, unknown> | null | undefined): SegmentoRegra[] {
  return segmentosVazios().map((_, i) => ({
    tipo: String(doc?.[`ie_regra_${i + 1}`] ?? ""),
    texto: String(doc?.[`ds_regra_${i + 1}`] ?? ""),
  }));
}

/** Rótulo de um campo do parâmetro com infobutton (como os demais campos do sistema). */
function RotuloCampo({ texto, campo, colecao }: { texto: string; campo: string; colecao: string }) {
  const [aberto, setAberto] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <div className="block text-sm mb-1" style={{ color: "#666" }}>
      <div className="relative group inline-flex items-center gap-2">
        <span>{texto}</span>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setAnchor(event.currentTarget);
            setAberto((v) => !v);
          }}
          tabIndex={-1}
          aria-label={`Informações do campo ${texto}`}
          className={`inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer transition-none ${aberto ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <circle cx="12" cy="16" r="0.5" />
          </svg>
        </button>
        {aberto && (
          <FieldInfoPopup
            anchor={anchor}
            meta={{ type: "string", field: campo, collection: colecao }}
            onClose={() => setAberto(false)}
          />
        )}
      </div>
    </div>
  );
}

interface ParametrosDaFuncaoViewProps {
  /** Funções (painel da esquerda); cada uma com os seus parâmetros (painel do centro). */
  funcoes?: FuncaoComParametros[];
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  selectOptions?: { value: string; label: string }[];
  allowedSubmodulos?: string[];
  onSaveSuccess?: (message: string) => void;
  onSavingChange?: (saving: boolean) => void;
  /** Abre o histórico de auditoria do parâmetro (coleção dele). */
  onOpenAudit?: (colecao: string) => void;
  auditAutor?: AuditAutor;
  /** Chamado depois de salvar um parâmetro (coleção dele). */
  onAfterSave?: (colecao: string) => void;
  /** Nome de exibição do autor nos logs de criação/alteração. */
  resolverNomeAutor?: (nome: string) => string;
  /** Ordem e largura das colunas salvas no usuário. */
  colunas?: ConfigColunasTabela;
  /** Largura dos painéis (redimensionável), salva no usuário. */
  paineis?: ConfigPaineis;
  /** Opções do dropdown "Valor padrão" de cada parâmetro do tipo "valorPadrao" (pelo id). */
  opcoesValorPadrao?: Record<string, { value: string; label: string }[]>;
  /** Função já selecionada ao abrir (ex.: "Parâmetros da Função" da pop-up do usuário). */
  funcaoInicial?: string | null;
}

/**
 * Administração do Sistema > Parâmetros, no layout de Campos x Formulários: três painéis
 * redimensionáveis — Funções (as que têm parâmetros), Parâmetros da função selecionada
 * (Dropdown e Parâmetro) e a Regra do parâmetro selecionado (valor, logs e Cancelar/Salvar).
 */
export default function ParametrosDaFuncaoView({
  funcoes = FUNCOES_COM_PARAMETROS,
  manageSelection,
  onManageSelectionChange,
  selectOptions = [],
  allowedSubmodulos = ["parametrosFuncao"],
  onSaveSuccess,
  onSavingChange,
  onOpenAudit,
  auditAutor,
  onAfterSave,
  resolverNomeAutor = (nome) => nome,
  colunas,
  paineis,
  opcoesValorPadrao = {},
  funcaoInicial = null,
}: ParametrosDaFuncaoViewProps) {
  const [funcaoSelecionada, setFuncaoSelecionada] = useState<string | null>(
    funcaoInicial && funcoes.some((f) => f.funcao === funcaoInicial) ? funcaoInicial : null,
  );
  const [pesquisaFuncao, setPesquisaFuncao] = useState("");
  const [selectedParametroId, setSelectedParametroId] = useState<string | null>(null);
  const [pesquisa, setPesquisa] = useState("");
  const [segmentos, setSegmentos] = useState<SegmentoRegra[]>(segmentosVazios);
  const [segmentosDraft, setSegmentosDraft] = useState<SegmentoRegra[] | null>(null);
  const [cor, setCor] = useState("");
  const [corDraft, setCorDraft] = useState<string | null>(null);
  const [simNao, setSimNao] = useState("");
  const [simNaoDraft, setSimNaoDraft] = useState<string | null>(null);
  // Tipo "valorPadrao": sequência salva ("" = ---) e edição.
  const [valorPadrao, setValorPadrao] = useState("");
  const [valorPadraoDraft, setValorPadraoDraft] = useState<string | null>(null);
  // Tipo "extensoes": valor salvo (null = nunca salvo, usa o padrão) e edição.
  const [extensoesSalvas, setExtensoesSalvas] = useState<string | null>(null);
  const [extensoesDraft, setExtensoesDraft] = useState<string[] | null>(null);
  // Logs de criação/alteração do parâmetro selecionado.
  const [auditInfo, setAuditInfo] = useState(AUDIT_VAZIO);
  const [saving, setSaving] = useState(false);
  const [infoAberto, setInfoAberto] = useState(false);
  const [infoAnchor, setInfoAnchor] = useState<HTMLElement | null>(null);
  const handleSalvarRef = useRef<() => void>(() => {});
  const raizRef = useRef<HTMLDivElement>(null);

  const funcaoAtiva = funcoes.find((f) => f.funcao === funcaoSelecionada) ?? null;
  const parametros = funcaoAtiva?.parametros ?? [];
  const selectedParametro = parametros.find((p) => p.id === selectedParametroId) ?? null;
  const colecaoSelecionada = selectedParametro?.colecao ?? null;
  const segmentosEmEdicao = segmentosDraft ?? segmentos;
  const corPadrao = selectedParametro?.corPadrao ?? "#000000";
  const corEmEdicao = corDraft ?? (cor || corPadrao);
  const simNaoEmEdicao = simNaoDraft ?? simNao;
  const campoValorSelecionado = selectedParametro?.campoValor;
  const valorPadraoEmEdicao = valorPadraoDraft ?? valorPadrao;
  /** Nome do campo de valor exibido à direita (rótulo e infobutton). */
  const rotuloValor = selectedParametro?.tipo === "cor" ? "Cor"
    : selectedParametro?.tipo === "extensoes" ? "Tipos de arquivo"
    : selectedParametro?.tipo === "valorPadrao" ? "Valor padrão"
    : "Regra";
  const extensoesEmEdicao = extensoesDraft ?? extensoesPermitidasCopia(extensoesSalvas);

  /** Lê o documento do parâmetro: valor salvo + logs de criação/alteração. */
  const carregarParametro = useCallback(async (colecao: string, campoValor?: CampoParametro) => {
    const doc = await obterParametro(colecao);
    setSegmentos(segmentosDoRegistro(doc as Record<string, unknown> | null));
    setCor(doc?.cd_cor ?? "");
    setSimNao(doc?.ie_regra ?? "");
    setValorPadrao(campoValor && doc?.[campoValor] != null ? String(doc[campoValor]) : "");
    // Registro sem valor (salvo sem nenhuma marcada) = nenhuma; sem registro = padrão.
    setExtensoesSalvas(doc?.id ? (doc.ds_regra ?? "") : null);
    setAuditInfo(doc?.id ? {
      createdAt: doc.dt_criacao ?? "",
      updatedAt: doc.dt_alteracao ?? "",
      createdBy: doc.ds_usuario_criacao ?? "",
      updatedBy: doc.ds_usuario_alteracao ?? "",
    } : AUDIT_VAZIO);
  }, []);

  // Carrega o parâmetro selecionado
  useEffect(() => {
    if (!colecaoSelecionada) return;
    let cancelled = false;
    (async () => {
      try {
        if (!cancelled) await carregarParametro(colecaoSelecionada, campoValorSelecionado);
      } catch (e) {
        console.error("Erro ao carregar o parâmetro", e);
      }
    })();
    return () => { cancelled = true; };
  }, [colecaoSelecionada, campoValorSelecionado, carregarParametro]);

  /** Troca de parâmetro (ou de função): descarta o valor/edição do anterior até o novo carregar. */
  function selecionarParametro(id: string | null) {
    setSegmentos(segmentosVazios());
    setSegmentosDraft(null);
    setCor("");
    setCorDraft(null);
    setSimNao("");
    setSimNaoDraft(null);
    setValorPadrao("");
    setValorPadraoDraft(null);
    setExtensoesSalvas(null);
    setExtensoesDraft(null);
    setAuditInfo(AUDIT_VAZIO);
    setSelectedParametroId(id);
  }

  function atualizarSegmentoTipo(index: number, valor: string) {
    const next = [...segmentosEmEdicao];
    // O campo ao lado guarda texto (Texto) ou dígitos (Sequência/Sequencial): trocar de um para o outro limpa.
    const mantem = (valor === "texto" && next[index].tipo === "texto")
      || (segmentoUsaDigitos(valor) && segmentoUsaDigitos(next[index].tipo));
    next[index] = { ...next[index], tipo: valor, texto: mantem ? next[index].texto : "" };
    setSegmentosDraft(next);
  }

  function atualizarSegmentoTexto(index: number, valor: string) {
    const next = [...segmentosEmEdicao];
    next[index] = { ...next[index], texto: valor };
    setSegmentosDraft(next);
  }

  function handleCancelar() {
    setSegmentosDraft(null);
    setCorDraft(null);
    setSimNaoDraft(null);
    setValorPadraoDraft(null);
    setExtensoesDraft(null);
  }

  function alternarExtensao(ext: string) {
    const atual = new Set(extensoesEmEdicao);
    if (atual.has(ext)) atual.delete(ext);
    else atual.add(ext);
    setExtensoesDraft([...atual]);
  }

  const handleSalvar = useCallback(async () => {
    if (!selectedParametro || !colecaoSelecionada) return;
    setSaving(true);
    onSavingChange?.(true);
    try {
      if (selectedParametro.tipo === "cor") {
        setCor(corEmEdicao);
        setCorDraft(null);
        await salvarParametro(colecaoSelecionada, "cd_cor", corEmEdicao, auditAutor);
      } else if (selectedParametro.tipo === "simNao") {
        setSimNao(simNaoEmEdicao);
        setSimNaoDraft(null);
        await salvarParametro(colecaoSelecionada, "ie_regra", simNaoEmEdicao, auditAutor);
      } else if (selectedParametro.tipo === "valorPadrao" && selectedParametro.campoValor) {
        setValorPadrao(valorPadraoEmEdicao);
        setValorPadraoDraft(null);
        await salvarParametro(colecaoSelecionada, selectedParametro.campoValor, valorPadraoEmEdicao, auditAutor);
      } else if (selectedParametro.tipo === "extensoes") {
        const valor = serializarExtensoesCopia(extensoesEmEdicao);
        setExtensoesSalvas(valor);
        setExtensoesDraft(null);
        await salvarParametro(colecaoSelecionada, "ds_regra", valor, auditAutor);
      } else {
        // Cada segmento fica na própria posição; sem tipo, o campo ao lado não é gravado.
        const valores: Partial<Record<CampoParametro, string>> = {};
        segmentosEmEdicao.forEach((seg, i) => {
          valores[`ie_regra_${i + 1}`] = seg.tipo;
          valores[`ds_regra_${i + 1}`] = segmentoUsaCampo(seg.tipo) ? seg.texto : "";
        });
        setSegmentos(segmentosEmEdicao);
        setSegmentosDraft(null);
        await salvarParametroCampos(colecaoSelecionada, valores);
      }
      onSaveSuccess?.("Parâmetro salvo com sucesso");
      // Atualizar info de auditoria
      await carregarParametro(colecaoSelecionada, selectedParametro.campoValor);
      onAfterSave?.(colecaoSelecionada);
    } catch (e) {
      console.error("Erro ao salvar o parâmetro", e);
    } finally {
      setSaving(false);
      onSavingChange?.(false);
    }
  }, [selectedParametro, colecaoSelecionada, corEmEdicao, simNaoEmEdicao, valorPadraoEmEdicao, extensoesEmEdicao, segmentosEmEdicao, auditAutor, onSaveSuccess, onSavingChange, onAfterSave, carregarParametro]);

  // Manter ref atualizado
  useEffect(() => {
    handleSalvarRef.current = handleSalvar;
  }, [handleSalvar]);

  // Atalho Ctrl+S
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        if (!elementoVisivel(raizRef.current)) return; // função escondida: não salva
        e.preventDefault();
        if (!saving) handleSalvarRef.current();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [saving]);

  return (
    <div ref={raizRef} className="flex-1 flex flex-col min-h-0 space-y-6">
      {/* Header replicando o padrão das listagens */}
      <div className="flex min-h-[42px] items-center gap-2">
        <Select
          value={manageSelection}
          onChange={onManageSelectionChange}
          options={selectOptions.filter((o) => allowedSubmodulos.includes(o.value))}
          showPlaceholder={!manageSelection}
          className="!w-[180px]"
        />
      </div>

      <div className="bg-white flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Padrão como em Campos x Formulários: Funções 7/30, Parâmetros 9/30 e a Regra com o restante. */}
        <PaineisRedimensionaveis proporcoesPadrao={[7, 9, 14]} config={paineis?.config} onChange={paineis?.onChange}>
          {/* ── Painel 1: Funções com parâmetros ── */}
          <div
            className="flex min-h-0 flex-col overflow-hidden border p-[5px]"
            style={{
              borderStyle: "solid",
              borderWidth: "1px",
              borderTopColor: "#999",
              borderLeftColor: "#999",
              borderBottomColor: "#ccc",
              borderRightColor: "#ccc",
            }}
          >
            <CampoPesquisa valor={pesquisaFuncao} onChange={setPesquisaFuncao} />
            <div className="overflow-auto flex-1 min-h-0">
              <ResizableTable<FuncaoComParametros>
                columns={[{ key: "funcao", label: "Função", render: (f) => f.label }]}
                rows={filtrarPesquisa(funcoes, pesquisaFuncao, (f) => [f.label])}
                rowKey={(f) => f.funcao}
                rowClassName={(f) => (f.funcao === funcaoSelecionada ? "row-selected" : "")}
                onRowClick={(f) => {
                  if (f.funcao === funcaoSelecionada) return;
                  setFuncaoSelecionada(f.funcao);
                  setPesquisa("");
                  selecionarParametro(null);
                }}
              />
            </div>
          </div>

          {/* ── Painel 2: Parâmetros da função ── */}
          <div
            className="flex min-h-0 flex-col overflow-hidden border p-[5px]"
            style={{
              borderStyle: "solid",
              borderWidth: "1px",
              borderTopColor: "#999",
              borderLeftColor: "#999",
              borderBottomColor: "#ccc",
              borderRightColor: "#ccc",
            }}
          >
            {!funcaoAtiva ? (
              <div className="flex h-full items-center justify-center p-4 text-center text-sm text-slate-500">
                Selecione uma função.
              </div>
            ) : (
            <>
            <CampoPesquisa valor={pesquisa} onChange={setPesquisa} />
            <div className="overflow-auto flex-1 min-h-0">
              <ResizableTable
                {...colunas}
                columns={[
                  { key: "dropdown", label: "Dropdown" },
                  { key: "parametro", label: "Parâmetro" },
                  // Sem colunas de auditoria: os parâmetros são padrão do sistema, não registros criados pelo usuário.
                ]}
                rows={filtrarPesquisa(parametros, pesquisa, (p) => [p.dropdown, p.parametro])}
                rowKey={(p) => p.id}
                rowClassName={(p) => (p.id === selectedParametroId ? "row-selected" : "")}
                onRowClick={(p) => {
                  if (p.id === selectedParametroId) return;
                  selecionarParametro(p.id);
                }}
              />
            </div>
            </>
            )}
          </div>

          {/* ── Painel 3: Regra do parâmetro ── */}
          <div
            className="flex min-h-0 flex-col overflow-hidden border p-[5px]"
            style={{
              borderStyle: "solid",
              borderWidth: "1px",
              borderTopColor: "#999",
              borderLeftColor: "#999",
              borderBottomColor: "#ccc",
              borderRightColor: "#ccc",
            }}
          >
            {!selectedParametro ? (
              <div className="flex h-full items-center justify-center p-4 text-center text-sm text-slate-500">
                Selecione um parâmetro para configurar.
              </div>
            ) : (
              <div className="flex flex-col h-full min-h-0">
                <div className="overflow-auto flex-1 min-h-0">
                  {/* Rótulo do campo (com infobutton, como os demais campos do sistema); na regra, cada campo tem o seu. */}
                  {selectedParametro.tipo !== "regra" && (
                  <div className="block text-sm mb-1" style={{ color: "#666" }}>
                    <div className="relative group inline-flex items-center gap-2">
                      <span>{rotuloValor}</span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setInfoAnchor(event.currentTarget);
                          setInfoAberto((v) => !v);
                        }}
                        tabIndex={-1}
                        aria-label={`Informações do campo ${rotuloValor}`}
                        className={`inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer transition-none ${infoAberto ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4" />
                          <circle cx="12" cy="16" r="0.5" />
                        </svg>
                      </button>
                      {infoAberto && (
                        <FieldInfoPopup
                          anchor={infoAnchor}
                          meta={selectedParametro.tipo === "valorPadrao" && selectedParametro.campoValor
                            ? { type: "int64", field: selectedParametro.campoValor, collection: selectedParametro.colecao }
                            : { type: "string", field: selectedParametro.tipo === "cor" ? "cd_cor" : selectedParametro.tipo === "simNao" ? "ie_regra" : "ds_regra", collection: selectedParametro.colecao }}
                          onClose={() => setInfoAberto(false)}
                        />
                      )}
                    </div>
                  </div>
                  )}
                  {selectedParametro.tipo === "extensoes" ? (
                    <div className="grid w-full grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-2">
                      {[...EXTENSOES_ARQUIVO_COPIA].sort((a, b) => a.ext.localeCompare(b.ext, "pt-BR")).map((e) => (
                        <label key={e.ext} className="inline-flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            className="cg-checkbox"
                            checked={extensoesEmEdicao.includes(e.ext)}
                            onChange={() => alternarExtensao(e.ext)}
                          />
                          <span>.{e.ext}</span>
                        </label>
                      ))}
                    </div>
                  ) : selectedParametro.tipo === "valorPadrao" ? (
                    <div className="w-full">
                      <Select
                        value={valorPadraoEmEdicao}
                        onChange={(v) => setValorPadraoDraft(v)}
                        options={opcoesValorPadrao[selectedParametro.id] ?? []}
                        showPlaceholder
                      />
                    </div>
                  ) : selectedParametro.tipo === "simNao" ? (
                    <div className="w-full">
                      <Select
                        value={simNaoEmEdicao}
                        onChange={(v) => setSimNaoDraft(v)}
                        options={OPCOES_SIM_NAO}
                        showPlaceholder
                      />
                    </div>
                  ) : selectedParametro.tipo === "cor" ? (
                    // A cor do status não pode ficar vazia: paleta sem a opção Transparente.
                    <CampoCorPaleta
                      valor={corEmEdicao}
                      onChange={(v) => setCorDraft(v)}
                      rotuloAcessivel={selectedParametro.parametro}
                      semTransparente
                    />
                  ) : (
                  <div className="space-y-2 w-full">
                    {segmentosEmEdicao.map((seg, index) => {
                      const isTexto = seg.tipo === "texto";
                      // Texto sempre visível; habilitado com Texto (texto livre) ou Sequência/Sequencial (dígitos).
                      const habilitado = segmentoUsaCampo(seg.tipo);
                      return (
                        <div key={index} className="flex items-end gap-2 w-full">
                          <div className="w-1/2 min-w-0">
                            <RotuloCampo texto={`Regra ${index + 1}`} campo={`ie_regra_${index + 1}`} colecao={selectedParametro.colecao} />
                            <Select
                              value={seg.tipo}
                              onChange={(v) => atualizarSegmentoTipo(index, v)}
                              options={OPCOES_SEGMENTO_REGRA}
                              showPlaceholder
                              visibleOptions={9}
                            />
                          </div>
                          <div className="w-1/2 min-w-0">
                            <RotuloCampo texto={`Texto ${index + 1}`} campo={`ds_regra_${index + 1}`} colecao={selectedParametro.colecao} />
                            <input
                              type="text"
                              aria-label={`Texto ${index + 1}`}
                              disabled={!habilitado}
                              inputMode={isTexto || !habilitado ? "text" : "numeric"}
                              pattern={isTexto || !habilitado ? undefined : "[0-9]*"}
                              value={seg.texto}
                              onChange={(e) => {
                                const val = isTexto ? e.target.value : e.target.value.replace(/[^0-9]/g, "");
                                atualizarSegmentoTexto(index, val);
                              }}
                              className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>

                {/* Botões Cancelar / Salvar — canto inferior direito */}
                <div className="flex items-end justify-between gap-3 pt-[5px]">
                  {/* Logs de criação/alteração: só depois que o parâmetro for salvo pela primeira vez. */}
                  {auditInfo.createdAt && (
                  <div className="text-[13px] text-slate-500">
                    <div className="relative group flex items-center gap-2">
                      <span>Criado por {auditInfo.createdBy ? resolverNomeAutor(auditInfo.createdBy) : '-'} em {auditInfo.createdAt ? formatDate(auditInfo.createdAt) : '-'}</span>
                      <button
                        type="button"
                        aria-hidden="true"
                        onClick={() => onOpenAudit?.(selectedParametro.colecao)}
                        className="botao-auditoria inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4" />
                          <circle cx="12" cy="16" r="0.5" />
                        </svg>
                      </button>
                    </div>
                    <div className="relative group flex items-center gap-2 mt-1">
                      <span>Alterado por {auditInfo.updatedBy ? resolverNomeAutor(auditInfo.updatedBy) : '-'} em {auditInfo.updatedAt ? formatDate(auditInfo.updatedAt) : '-'}</span>
                      <button
                        type="button"
                        aria-hidden="true"
                        onClick={() => onOpenAudit?.(selectedParametro.colecao)}
                        className="botao-auditoria inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none"
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
                  <div className="flex items-center justify-end gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={handleCancelar}
                      className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                      style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSalvar}
                      disabled={saving}
                      className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:opacity-50"
                      style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
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
