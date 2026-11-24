"use client";

import { useEffect, useRef, useState } from "react";
import Select from "@/components/ui/Select";
import LoadingModal from "@/components/ui/LoadingModal";
import RotuloCampo from "@/components/ui/RotuloCampo";
import RequiredAsterisk from "@/components/ui/RequiredAsterisk";
import ResizableTable, { type ConfigColunasTabela, type ResizableTableColumn } from "@/components/ui/ResizableTable";
import type { CampoStatus } from "@/lib/camposConfigUtils";
import { elementoVisivel } from "@/lib/visibilidade";
import { formatDate } from "@/lib/pessoaFisicaUtils";
import { nomeDoParametro } from "@/lib/relatorioSql";
import { formatarMedida, mascararMedida, medidaParaBanco } from "@/lib/cadastroGeralUtils";
import {
  excluirBandaSql,
  excluirParametroSql,
  obterBandasSql,
  obterElementosDaBanda,
  salvarElementoBanda,
  excluirElementoBanda,
  ALINHAMENTOS_ELEMENTO,
  ESTILOS_ELEMENTO,
  FONTES_ELEMENTO,
  TIPOS_ELEMENTO,
  MASCARAS_ELEMENTO,
  TAMANHO_ELEMENTO_PADRAO,
  ALTURA_ELEMENTO_PADRAO,
  obterColunasDaBanda,
  type TipoElemento,
  obterParametrosSql,
  ordenarParametros,
  salvarBandaSql,
  salvarParametroSql,
  TIPOS_BANDA,
  CAMPOS_BORDA,
  OPCOES_DETALHE,
  bandaEhDetalhe,
  type BandaSql,
  type ElementoBanda,
  type TipoBanda,
  type ParametroSql,
} from "@/services/relatorioSqlService";
import type { Relatorio } from "@/types/relatorio";

/**
 * Gerenciador de Relatórios > Relatórios (relatórios por SQL, no modelo do Tasy).
 *
 *   - viewMode 'form' (Adicionar / Ver): Sequência, Código, Descrição, Formato (XLS ou PDF),
 *     SQL (o SQL principal, usado pelas bandas sem SQL próprio) e Saída.
 *     Os campos do PDF (Formato do papel, Orientação, Borda e margens) só ficam habilitados
 *     com o Formato PDF. Orientação 'P' usa as medidas do formato do papel; 'I' as inverte
 *     (largura e altura trocadas). Margens em centímetros.
 *   - viewMode 'bandas' (duplo clique no relatório): abas Bandas e Parâmetros.
 *       Bandas: várias em qualquer formato; campos Sequência, Descrição e SQL (vazio = o SQL
 *         do relatório). No XLS vale a banda Detalhe de menor Sequência.
 *         No PDF, também Tipo (Cabeçalho, Detalhe, Rodapé), Altura (px), bordas e, na banda
 *         Detalhe, Banda superior (dependência: o SQL roda para cada registro da superior,
 *         com :COLUNA = valor da coluna) e as opções Nova página a cada registro, Exibir
 *         labels e Imprimir sem registros. O duplo clique numa banda abre os Elementos
 *         dela (Relatório > Banda > Elemento).
 *       Parâmetros: os :nome usados no SQL (Descrição do parâmetro = o nome), com Label,
 *         Ordem, Valor padrão, Perguntar e Obrigatório.
 *     Bandas e parâmetros são gravados na hora (cada um com auditoria própria).
 */

interface ContextMenuItem {
  label: string;
  onClick?: () => void;
}

/** Dados do relatório gravados pelo formulário. */
export interface DadosRelatorioForm {
  /** Código do relatório (único; null = sem código). */
  cd_relatorio: string | null;
  ds_relatorio: string;
  ie_formato: "xls" | "pdf";
  /** SQL principal (usado pelas bandas sem SQL próprio). */
  ds_sql: string;
  ds_nome_arquivo: string;
  /** Campos do PDF (null quando o formato é XLS). Margens em centímetros. */
  nr_seq_formato_papel: number | null;
  ie_orientacao: "P" | "I" | null;
  ie_borda: string | null;
  nr_margem_superior: number | null;
  nr_margem_inferior: number | null;
  nr_margem_esquerda: number | null;
  nr_margem_direita: number | null;
}

const MARGENS = [
  ["nr_margem_superior", "Margem superior"],
  ["nr_margem_inferior", "Margem inferior"],
  ["nr_margem_esquerda", "Margem esquerda"],
  ["nr_margem_direita", "Margem direita"],
] as const;
type CampoMargem = (typeof MARGENS)[number][0];

interface RelatorioBuilderProps {
  relatorio: Relatorio | null;
  /** 'form' mostra o relatório; 'bandas' mostra as abas Bandas e Parâmetros. */
  viewMode?: "form" | "bandas";
  onSave: (dados: DadosRelatorioForm) => void;
  onCancel: () => void;
  saving?: boolean;
  manageSelection?: string;
  onManageSelectionChange?: (v: string) => void;
  allowedSubmodulos?: string[];
  contextMenuItems?: ContextMenuItem[];
  onPrevRecord?: () => void;
  onNextRecord?: () => void;
  hasPrevRecord?: boolean;
  hasNextRecord?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  resolverNomeAutorExibicao?: (dsUsuario: string) => string;
  onOpenAudit?: (relatorioId?: string | null) => void;
  onOpenBandaAudit?: (relatorioId?: string | null, bandaId?: string | null) => void;
  onOpenFiltroAudit?: (relatorioId?: string | null, parametroId?: string | null) => void;
  onOpenElementoAudit?: (relatorioId?: string | null, elementoId?: string | null) => void;
  /** Regras de campo do perfil (N/O/D) do relatório, da banda, do elemento e do parâmetro. */
  campoRegras?: Record<string, CampoStatus>;
  bandaCampoRegras?: Record<string, CampoStatus>;
  elementoCampoRegras?: Record<string, CampoStatus>;
  parametroCampoRegras?: Record<string, CampoStatus>;
  campoErros?: string[];
  darkMode?: boolean;
  onNavigateToList?: () => void;
  onToast?: (message: string, status: "success" | "warning" | "error") => void;
  /** Abre o modal de confirmação de exclusão; `acao` roda se o usuário confirmar. */
  onConfirmarExclusao?: (mensagem: string, acao: () => void) => void;
  /** Colunas (ordem e largura) salvas das listas de bandas e de parâmetros. */
  colunasBandas?: ConfigColunasTabela;
  colunasParametros?: ConfigColunasTabela;
  /** Opções do dropdown Formato do papel (Cadastros Gerais > Formato do papel). */
  opcoesFormatoPapel?: { value: string; label: string }[];
  /** Opções do dropdown Imagem dos elementos (Administração do Sistema > Imagens). */
  opcoesImagem?: { value: string; label: string }[];
}

const RELATORIO_SELECT_OPTIONS = [{ value: "relatorio", label: "Relatórios" }];
const FORMATO_OPTIONS = [{ value: "xls", label: "XLS" }, { value: "pdf", label: "PDF" }];
const ORIENTACAO_OPTIONS = [{ value: "P", label: "Padrão" }, { value: "I", label: "Invertido" }];
const BORDA_OPTIONS = [
  { value: "", label: "---" },
  { value: "solid_fina", label: "Sólida fina" },
  { value: "solid_grossa", label: "Sólida grossa" },
  { value: "dupla", label: "Dupla" },
  { value: "tracejada", label: "Tracejada" },
  { value: "pontilhada", label: "Pontilhada" },
];

const INPUT = "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500";
const BOTAO_LINK = "inline-flex items-center rounded-[3px] border border-transparent bg-transparent px-4 py-2.5 text-sm font-normal text-[#066fc5] transition cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2 active:outline active:outline-1 active:outline-[#066fc5] active:outline-offset-2 disabled:text-slate-400 disabled:cursor-not-allowed disabled:outline-none";
const BOTAO_NAV = "inline-flex items-center justify-center rounded-[3px] border border-slate-300 bg-[#ddd] px-[5px] py-[5px] text-sm text-black cursor-pointer hover:bg-slate-300 disabled:opacity-40 disabled:cursor-default disabled:hover:bg-[#ddd]";

type Detalhe = { tipo: "banda"; banda: BandaSql } | { tipo: "parametro"; parametro: ParametroSql } | { tipo: "elemento"; elemento: ElementoBanda } | null;

/**
 * Campo de cor no padrão do sistema (como em Patrimônio > Parâmetros): a amostra da cor
 * ocupa o campo e o clique abre o seletor de cor. Sem cor, a amostra fica branca; o ×
 * (só com cor escolhida) volta para sem cor.
 */
function CampoCor({ valor, onChange, disabled, erro }: { valor: string; onChange: (v: string) => void; disabled?: boolean; erro?: boolean }) {
  const ref = useRef<HTMLInputElement | null>(null);
  return (
    <div className="flex w-full items-center gap-2" style={{ height: 34 }}>
      <div className="relative h-full min-w-0 flex-1">
        <input ref={ref} type="color" value={valor || "#000000"} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="absolute opacity-0 w-0 h-0 pointer-events-none" tabIndex={-1} />
        <div
          className={`cg-cor w-full h-full ${erro ? "border-red-500" : ""} ${disabled ? "cg-cor-desabilitado cursor-default" : "cursor-pointer"}`}
          style={disabled ? undefined : { backgroundColor: valor || "#ffffff" }}
          onClick={() => { if (!disabled) ref.current?.click(); }}
        />
      </div>
      {/* Botão separado (padrão dos botões + e − do sistema): limpa a cor. */}
      <button
        type="button"
        onClick={() => onChange("")}
        disabled={disabled || !valor}
        className="btn-responsavel inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center cursor-pointer text-slate-700 hover:border-red-500 hover:text-red-600 disabled:cursor-default disabled:opacity-40 disabled:hover:border-[#999] disabled:hover:text-slate-700"
        aria-label="Remover cor"
        title="Remover cor"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  );
}

/** Só dígitos (px), sem zeros à esquerda; `minimo1` impede o 0 (largura e altura). */
function mascararPx(texto: string, minimo1: boolean): string {
  const digitos = texto.replace(/\D/g, "").slice(0, 5);
  const sem0 = digitos.replace(/^0+(?=\d)/, "");
  return minimo1 ? sem0.replace(/^0$/, "") : sem0;
}

function simNao(v: unknown): string {
  return v === "S" ? "Sim" : v === "N" ? "Não" : "";
}

export default function RelatorioBuilder({
  relatorio,
  viewMode = "form",
  onSave,
  onCancel,
  saving = false,
  manageSelection = "relatorio",
  onManageSelectionChange,
  allowedSubmodulos = ["relatorio"],
  contextMenuItems = [],
  onPrevRecord,
  onNextRecord,
  hasPrevRecord = false,
  hasNextRecord = false,
  createdAt,
  updatedAt,
  createdBy,
  updatedBy,
  resolverNomeAutorExibicao,
  onOpenAudit,
  onOpenBandaAudit,
  onOpenFiltroAudit,
  onOpenElementoAudit,
  campoRegras = {},
  bandaCampoRegras = {},
  elementoCampoRegras = {},
  parametroCampoRegras = {},
  campoErros = [],
  darkMode = false,
  onNavigateToList,
  onToast,
  onConfirmarExclusao,
  colunasBandas,
  colunasParametros,
  opcoesFormatoPapel = [],
  opcoesImagem = [],
}: RelatorioBuilderProps) {
  const ehBandas = viewMode === "bandas";
  const formRef = useRef<HTMLFormElement | null>(null);
  const nrRelatorio = relatorio?.nr_sequencia ?? null;
  const pdf = relatorio?.configPdf;

  /* ── Formulário do relatório ── */
  const [dsRelatorio, setDsRelatorio] = useState(relatorio?.ds_relatorio ?? "");
  const [codigo, setCodigo] = useState(relatorio?.cd_relatorio ?? "");
  const [sqlCapa, setSqlCapa] = useState(relatorio?.ds_sql ?? "");
  const [nomeArquivo, setNomeArquivo] = useState(
    relatorio?.ds_nome_arquivo ?? pdf?.titulo ?? ""
  );
  const [formato, setFormato] = useState<"xls" | "pdf">(relatorio?.ie_formato === "pdf" ? "pdf" : "xls");
  const [formatoPapel, setFormatoPapel] = useState(relatorio?.nr_seq_formato_papel != null ? String(relatorio.nr_seq_formato_papel) : "");
  const [orientacao, setOrientacao] = useState<"P" | "I">(relatorio?.ie_orientacao === "I" ? "I" : "P");
  const [borda, setBorda] = useState<string>(relatorio?.ie_borda ?? "");
  const [margens, setMargens] = useState<Record<CampoMargem, string>>(() => ({
    nr_margem_superior: formatarMedida(relatorio?.nr_margem_superior),
    nr_margem_inferior: formatarMedida(relatorio?.nr_margem_inferior),
    nr_margem_esquerda: formatarMedida(relatorio?.nr_margem_esquerda),
    nr_margem_direita: formatarMedida(relatorio?.nr_margem_direita),
  }));
  const ehPdf = formato === "pdf";

  /* ── Bandas e parâmetros ── */
  const [aba, setAba] = useState<"bandas" | "parametros">("bandas");
  const [bandas, setBandas] = useState<BandaSql[]>([]);
  const [parametros, setParametros] = useState<ParametroSql[]>([]);
  const [carregando, setCarregando] = useState(ehBandas);
  const [gravando, setGravando] = useState(false);
  const [detalhe, setDetalhe] = useState<Detalhe>(null);
  const [errosDetalhe, setErrosDetalhe] = useState<string[]>([]);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  /** PDF: banda cujos elementos estão abertos (duplo clique na banda). */
  const [bandaElementos, setBandaElementos] = useState<BandaSql | null>(null);
  const [elementos, setElementos] = useState<ElementoBanda[]>([]);
  const [carregandoElementos, setCarregandoElementos] = useState(false);
  const relatorioPdf = relatorio?.ie_formato === "pdf";
  /** Banda com Exibir labels: o Label do elemento é o cabeçalho da coluna. */
  const bandaComLabels = !!bandaElementos && bandaEhDetalhe(bandaElementos) && bandaElementos.ie_exibir_label === "S";
  const [menu, setMenu] = useState<{ x: number; y: number; acoes: ContextMenuItem[] } | null>(null);

  // Carga das bandas e parâmetros ao abrir (resultado aplicado só se a tela ainda estiver aberta).
  const onToastRef = useRef(onToast);
  useEffect(() => { onToastRef.current = onToast; }, [onToast]);
  useEffect(() => {
    if (!ehBandas || nrRelatorio == null) return;
    let ativo = true;
    Promise.all([obterBandasSql(nrRelatorio), obterParametrosSql(nrRelatorio)])
      .then(([b, p]) => {
        if (!ativo) return;
        setBandas(b);
        setParametros(p);
      })
      .catch(() => { if (ativo) onToastRef.current?.("Erro ao carregar as bandas e os parâmetros.", "error"); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [ehBandas, nrRelatorio]);

  // Menu de contexto fecha com qualquer clique.
  useEffect(() => {
    if (!menu) return;
    const fechar = () => setMenu(null);
    window.addEventListener("click", fechar);
    return () => window.removeEventListener("click", fechar);
  }, [menu]);

  const autor = (nome?: string) => {
    if (!nome) return "-";
    return resolverNomeAutorExibicao ? resolverNomeAutorExibicao(nome) || nome : nome;
  };
  const statusDe = (regras: Record<string, CampoStatus>, campo: string): CampoStatus => regras[campo] ?? "N";
  const rotulo = (texto: string, colecao: string, campo: string, regras: Record<string, CampoStatus>) => (
    <RotuloCampo texto={texto} colecao={colecao} campo={campo} prefixo={statusDe(regras, campo) === "O" ? <RequiredAsterisk /> : undefined} />
  );
  const comErro = (lista: string[], campo: string) => (lista.includes(campo) ? `${INPUT} !border-red-500` : INPUT);
  /** Borda superior, inferior, esquerda e direita (banda e elemento), lado a lado como Perguntar/Obrigatório. */
  const checkboxesBorda = (
    valores: Partial<Record<(typeof CAMPOS_BORDA)[number]["campo"], "S" | "N" | null>>,
    onChange: (campo: (typeof CAMPOS_BORDA)[number]["campo"], marcado: boolean) => void,
    colecao: string,
    regras: Record<string, CampoStatus>,
  ) => (
    <div className="sm:col-span-12 flex flex-wrap gap-8">
      {CAMPOS_BORDA.map(({ campo, label }) => (
        <div key={campo} className="flex flex-col">
          {rotulo(label, colecao, campo, regras)}
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="cg-checkbox"
              checked={valores[campo] === "S"}
              disabled={statusDe(regras, campo) === "D"}
              onChange={(e) => onChange(campo, e.target.checked)}
            />
            <span>Sim</span>
          </label>
        </div>
      ))}
    </div>
  );

  /* ── Salvar ── */
  // Obrigatoriedade só pelas regras de Campos x Formulários (nenhum campo é obrigatório por padrão).
  // Os campos do PDF só contam (e só são gravados) com o Formato PDF.
  function salvarRelatorio() {
    const valores: Record<string, string> = {
      cd_relatorio: codigo,
      ds_relatorio: dsRelatorio,
      ds_sql: sqlCapa,
      ds_nome_arquivo: nomeArquivo,
      ie_formato: formato,
      ...(ehPdf ? { nr_seq_formato_papel: formatoPapel, ie_orientacao: orientacao, ie_borda: borda, ...margens } : {}),
    };
    const faltantes = Object.keys(valores).filter((c) => statusDe(campoRegras, c) === "O" && !valores[c].trim());
    if (faltantes.length > 0) {
      setErrosDetalhe(faltantes);
      onToast?.("Preencha os campos obrigatórios.", "error");
      return;
    }
    setErrosDetalhe([]);
    const margem = (c: CampoMargem) => (ehPdf ? medidaParaBanco(margens[c]) : null);
    onSave({
      cd_relatorio: codigo.trim() || null,
      ds_relatorio: dsRelatorio.trim(),
      ie_formato: formato,
      ds_sql: sqlCapa,
      ds_nome_arquivo: nomeArquivo.trim(),
      nr_seq_formato_papel: ehPdf && formatoPapel ? Number(formatoPapel) : null,
      ie_orientacao: ehPdf ? orientacao : null,
      ie_borda: ehPdf && borda ? borda : null,
      nr_margem_superior: margem("nr_margem_superior"),
      nr_margem_inferior: margem("nr_margem_inferior"),
      nr_margem_esquerda: margem("nr_margem_esquerda"),
      nr_margem_direita: margem("nr_margem_direita"),
    });
  }
  /** Campo do PDF: habilitado só com o Formato PDF (e se a regra do perfil não o desabilitar). */
  const pdfDesabilitado = (campo: string) => !ehPdf || statusDe(campoRegras, campo) === "D";

  /* ── Elemento: campos habilitados pelo tipo da banda e do elemento ── */
  const CAMPOS_ELEMENTO = ["ds_elemento", "ie_tipo", "nr_seq_imagem", "qt_esquerda", "qt_topo", "ie_estilo", "qt_largura", "qt_altura", "ie_alinhamento", "cd_background", "cd_cor", "ie_fonte", "qt_fonte", "ds_label", "cd_alias", "ds_conteudo", "ie_mascara", "qt_casas_decimais", "qt_padding_superior", "qt_padding_inferior", "qt_padding_esquerda", "qt_padding_direita"] as const;
  type CampoElemento = (typeof CAMPOS_ELEMENTO)[number];
  function tipoDoElemento(el: ElementoBanda): TipoElemento {
    return TIPOS_ELEMENTO.some((t) => t.value === el.ie_tipo) ? (el.ie_tipo as TipoElemento) : "sql";
  }
  function elementoNormalizado(el: ElementoBanda): ElementoBanda {
    const normalizado: ElementoBanda = { ...el, ie_tipo: tipoDoElemento(el) };
    // Campos desabilitados pelo tipo não são gravados.
    (["nr_seq_imagem", "ie_estilo", "ie_alinhamento", "ie_fonte", "qt_fonte", "cd_cor", "cd_background", "ds_label", "cd_alias", "ds_conteudo", "ie_mascara", "qt_casas_decimais", "qt_padding_superior", "qt_padding_inferior", "qt_padding_esquerda", "qt_padding_direita"] as const)
      .forEach((c) => { if (elementoDesabilitadoPeloTipo(normalizado, c)) normalizado[c] = null; });
    if (!quebraHabilitada(normalizado)) normalizado.ie_quebrar_linha = "N";
    return normalizado;
  }
  /**
   * Campos de cada tipo:
   *   - Atributo: SQL (a coluna) e Parâmetro (o nome); Conteúdo: só Conteúdo; Imagem: só Imagem;
   *   - Máscara: SQL, Parâmetro e Data/hora; Casas decimais: com Máscara Número, Moeda ou Porcentagem;
   *   - Imagem e Linha não têm texto (Estilo, Alinhamento, Fonte e Background desabilitados;
   *     a Linha usa a Cor);
   *   - Label (o cabeçalho da coluna): só na banda Detalhe com Exibir labels.
   */
  function elementoDesabilitadoPeloTipo(el: ElementoBanda, campo: CampoElemento): boolean {
    const tipo = tipoDoElemento(el);
    const semTexto = tipo === "imagem" || tipo === "linha";
    if (campo === "nr_seq_imagem") return tipo !== "imagem";
    if (campo === "ds_label") return !bandaComLabels || semTexto;
    if (campo === "cd_alias") return tipo !== "sql" && tipo !== "parametro";
    if (campo === "ds_conteudo") return tipo !== "conteudo";
    if (campo === "ie_mascara") return tipo !== "sql" && tipo !== "parametro" && tipo !== "data_hora";
    if (campo === "qt_casas_decimais") return (tipo !== "sql" && tipo !== "parametro") || !["numero", "moeda", "porcentagem"].includes(el.ie_mascara ?? "");
    if (campo === "cd_cor") return tipo === "imagem";
    if (campo === "ie_estilo" || campo === "ie_alinhamento" || campo === "ie_fonte" || campo === "qt_fonte" || campo === "cd_background") return semTexto;
    if (campo === "qt_padding_superior" || campo === "qt_padding_inferior" || campo === "qt_padding_esquerda" || campo === "qt_padding_direita") return semTexto;
    return false;
  }
  /** Quebrar linha: só nos textos que podem ser longos (SQL, Conteúdo e Parâmetro). */
  const quebraHabilitada = (el: ElementoBanda) => ["sql", "conteudo", "parametro"].includes(tipoDoElemento(el));
  const elementoDesabilitado = (el: ElementoBanda, campo: CampoElemento) =>
    elementoDesabilitadoPeloTipo(el, campo) || statusDe(elementoCampoRegras, campo) === "D";

  async function salvarDetalhe() {
    if (!detalhe || nrRelatorio == null) return;
    if (detalhe.tipo === "banda") {
      const b = detalhe.banda;
      const campos = relatorioPdf
        ? ["ds_banda", "ie_tipo", "qt_altura", "ds_sql", ...(bandaEhDetalhe(b) ? ["nr_seq_banda_superior"] : [])]
        : ["ds_banda", "ds_sql"];
      const faltantes = campos.filter((c) => statusDe(bandaCampoRegras, c) === "O" && !String(b[c as keyof BandaSql] ?? "").trim());
      if (faltantes.length > 0) {
        setErrosDetalhe(faltantes);
        onToast?.("Preencha os campos obrigatórios.", "error");
        return;
      }
      // Um Cabeçalho e um Rodapé por relatório.
      if (relatorioPdf && (b.ie_tipo === "cabecalho" || b.ie_tipo === "rodape") && bandas.some((x) => x.id !== b.id && x.ie_tipo === b.ie_tipo)) {
        setErrosDetalhe(["ie_tipo"]);
        onToast?.(`O relatório já tem uma banda do tipo ${b.ie_tipo === "cabecalho" ? "Cabeçalho" : "Rodapé"}.`, "error");
        return;
      }
      // Banda superior de outras: continua Detalhe (as dependentes saem dentro dela).
      if (relatorioPdf && !bandaEhDetalhe(b) && b.id && dependentesDe(b).length > 0) {
        setErrosDetalhe(["ie_tipo"]);
        onToast?.("A banda é a banda superior de outras bandas: o tipo precisa ser Detalhe.", "error");
        return;
      }
      if (relatorioPdf && bandaEhDetalhe(b) && b.nr_seq_banda_superior && !opcoesBandaSuperior(b).some((o) => o.value === String(b.nr_seq_banda_superior))) {
        setErrosDetalhe(["nr_seq_banda_superior"]);
        onToast?.("A banda superior precisa ser outra banda Detalhe, que não dependa desta.", "error");
        return;
      }
    } else if (detalhe.tipo === "elemento") {
      const el = elementoNormalizado(detalhe.elemento);
      const faltantes = CAMPOS_ELEMENTO.filter((c) => !elementoDesabilitado(el, c) && statusDe(elementoCampoRegras, c) === "O" && !String(el[c] ?? "").trim());
      if (faltantes.length > 0) {
        setErrosDetalhe(faltantes);
        onToast?.("Preencha os campos obrigatórios.", "error");
        return;
      }
    } else {
      const p = detalhe.parametro;
      const faltantes = ["ds_parametro", "ds_label", "nr_ordem", "vl_padrao"].filter((c) => {
        const vazio = String(p[c as keyof ParametroSql] ?? "").trim() === "";
        return vazio && statusDe(parametroCampoRegras, c) === "O";
      });
      if (faltantes.length > 0) {
        setErrosDetalhe(faltantes);
        onToast?.("Preencha os campos obrigatórios.", "error");
        return;
      }
      // Preenchida, a descrição precisa ser um nome válido de parâmetro (o :nome do SQL).
      const nome = nomeDoParametro(p.ds_parametro);
      if (nome && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(nome)) {
        setErrosDetalhe(["ds_parametro"]);
        onToast?.("A descrição do parâmetro deve ser o nome usado no SQL (letras, números e _, sem espaços).", "error");
        return;
      }
      if (nome && parametros.some((x) => x.id !== p.id && nomeDoParametro(x.ds_parametro).toLowerCase() === nome.toLowerCase())) {
        setErrosDetalhe(["ds_parametro"]);
        onToast?.(`Já existe o parâmetro :${nome} neste relatório.`, "error");
        return;
      }
    }
    setErrosDetalhe([]);
    setGravando(true);
    try {
      if (detalhe.tipo === "banda") {
        // Tipo, Altura, bordas, Banda superior e opções só existem nas bandas do PDF.
        const banda = relatorioPdf
          ? detalhe.banda
          : {
              ...detalhe.banda, ie_tipo: null, qt_altura: null, nr_seq_banda_superior: null,
              ...Object.fromEntries([...CAMPOS_BORDA, ...OPCOES_DETALHE].map(({ campo }) => [campo, "N"])),
            };
        const salva = await salvarBandaSql({ ...banda, nr_seq_relatorio: nrRelatorio });
        setBandas((lista) => (detalhe.banda.id ? lista.map((b) => (b.id === salva.id ? salva : b)) : [...lista, salva]));
        setSelecionadoId(salva.id ?? null);
        onToast?.(detalhe.banda.id ? "Banda atualizada com sucesso!" : "Banda cadastrada com sucesso!", "success");
      } else if (detalhe.tipo === "elemento") {
        if (!bandaElementos?.nr_sequencia) return;
        const salvo = await salvarElementoBanda({ ...elementoNormalizado(detalhe.elemento), nr_seq_banda: Number(bandaElementos.nr_sequencia), nr_seq_relatorio: nrRelatorio });
        setElementos((lista) => (detalhe.elemento.id ? lista.map((x) => (x.id === salvo.id ? salvo : x)) : [...lista, salvo]));
        setSelecionadoId(salvo.id ?? null);
        onToast?.(detalhe.elemento.id ? "Elemento atualizado com sucesso!" : "Elemento cadastrado com sucesso!", "success");
      } else {
        const salvo = await salvarParametroSql({ ...detalhe.parametro, nr_seq_relatorio: nrRelatorio });
        setParametros((lista) => ordenarParametros(detalhe.parametro.id ? lista.map((p) => (p.id === salvo.id ? salvo : p)) : [...lista, salvo]));
        setSelecionadoId(salvo.id ?? null);
        onToast?.(detalhe.parametro.id ? "Parâmetro atualizado com sucesso!" : "Parâmetro cadastrado com sucesso!", "success");
      }
      setDetalhe(null);
    } catch (e) {
      onToast?.(e instanceof Error && e.message ? e.message : "Erro ao salvar.", "error");
    } finally {
      setGravando(false);
    }
  }

  function excluir(tipo: "banda" | "parametro" | "elemento", item: BandaSql | ParametroSql | ElementoBanda) {
    if (!item.id) return;
    const id = item.id;
    if (tipo === "banda" && dependentesDe(item as BandaSql).length > 0) {
      onToast?.("A banda é a banda superior de outras bandas. Altere ou exclua as bandas dependentes primeiro.", "error");
      return;
    }
    const nome = tipo === "banda" ? "a banda" : tipo === "elemento" ? "o elemento" : "o parâmetro";
    const mensagem = `Deseja mesmo excluir ${nome} ${item.nr_sequencia ?? ""}?`;
    const acao = async () => {
      setGravando(true);
      try {
        if (tipo === "banda") {
          // Os elementos da banda saem junto.
          await excluirBandaSql(id, item.nr_sequencia);
          setBandas((lista) => lista.filter((b) => b.id !== id));
          onToast?.("Banda excluída com sucesso!", "success");
        } else if (tipo === "elemento") {
          await excluirElementoBanda(id);
          setElementos((lista) => lista.filter((x) => x.id !== id));
          onToast?.("Elemento excluído com sucesso!", "success");
        } else {
          await excluirParametroSql(id);
          setParametros((lista) => lista.filter((p) => p.id !== id));
          onToast?.("Parâmetro excluído com sucesso!", "success");
        }
        setDetalhe((d) => (d && ((d.tipo === "banda" && d.banda.id === id) || (d.tipo === "parametro" && d.parametro.id === id) || (d.tipo === "elemento" && d.elemento.id === id)) ? null : d));
      } catch (e) {
        onToast?.(e instanceof Error && e.message ? e.message : "Erro ao excluir.", "error");
      } finally {
        setGravando(false);
      }
    };
    if (onConfirmarExclusao) onConfirmarExclusao(mensagem, () => { void acao(); });
    else if (window.confirm(mensagem)) void acao();
  }

  // Ctrl+S salva o que estiver aberto.
  const salvarRef = useRef<() => void>(() => {});
  useEffect(() => {
    salvarRef.current = () => {
      if (ehBandas) { if (detalhe && !gravando) void salvarDetalhe(); }
      else if (!saving) salvarRelatorio();
    };
  });
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        if (!elementoVisivel(formRef.current)) return;
        e.preventDefault();
        salvarRef.current();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  /* ── Listas ── */
  const colunasAuditoria = <T extends { dt_criacao?: string; dt_alteracao?: string; ds_usuario_criacao?: string; ds_usuario_alteracao?: string }>(): ResizableTableColumn<T>[] => [
    { key: "dt_criacao", label: "Criação", render: (r) => (r.dt_criacao ? formatDate(r.dt_criacao) : "") },
    { key: "dt_alteracao", label: "Alteração", render: (r) => (r.dt_alteracao ? formatDate(r.dt_alteracao) : "") },
    // Colunas de usuário mostram o ds_usuario (o nome da pessoa física só nos logs do rodapé).
    { key: "ds_usuario_criacao", label: "Usuário criação", render: (r) => r.ds_usuario_criacao ?? "" },
    { key: "ds_usuario_alteracao", label: "Usuário alteração", render: (r) => r.ds_usuario_alteracao ?? "" },
  ];
  const colunasDeBanda: ResizableTableColumn<BandaSql>[] = [
    { key: "nr_sequencia", label: "#", render: (b) => String(b.nr_sequencia ?? "") },
    { key: "ds_banda", label: "Descrição", render: (b) => b.ds_banda ?? "" },
    ...(relatorioPdf
      ? [
          { key: "ie_tipo", label: "Tipo", render: (b: BandaSql) => TIPOS_BANDA.find((t) => t.value === b.ie_tipo)?.label ?? "" },
          { key: "qt_altura", label: "Altura", render: (b: BandaSql) => (b.qt_altura == null ? "" : `${b.qt_altura} px`) },
        ]
      : []),
    ...colunasAuditoria<BandaSql>(),
    // Coluna nova no fim: a ordem e a largura salvas das colunas são por posição.
    ...(relatorioPdf ? [{ key: "nr_seq_banda_superior", label: "Banda superior", render: (b: BandaSql) => (b.nr_seq_banda_superior == null ? "" : String(b.nr_seq_banda_superior)) }] : []),
  ];
  const px = (v: unknown) => (v === null || v === undefined || v === "" ? "" : `${v} px`);
  const colunasDeElemento: ResizableTableColumn<ElementoBanda>[] = [
    { key: "nr_sequencia", label: "#", render: (e) => String(e.nr_sequencia ?? "") },
    { key: "ds_elemento", label: "Descrição", render: (e) => e.ds_elemento ?? "" },
    { key: "ie_tipo", label: "Tipo", render: (e) => TIPOS_ELEMENTO.find((t) => t.value === e.ie_tipo)?.label ?? "" },
    ...(bandaComLabels ? [{ key: "ds_label", label: "Label", render: (e: ElementoBanda) => e.ds_label ?? "" }] : []),
    { key: "cd_alias", label: "Atributo", render: (e) => e.cd_alias ?? "" },
    { key: "qt_esquerda", label: "Esquerda", render: (e) => px(e.qt_esquerda) },
    { key: "qt_topo", label: "Topo", render: (e) => px(e.qt_topo) },
    { key: "qt_largura", label: "Tamanho", render: (e) => px(e.qt_largura) },
    { key: "qt_altura", label: "Altura", render: (e) => px(e.qt_altura) },
    ...colunasAuditoria<ElementoBanda>(),
  ];
  const colunasDeParametro: ResizableTableColumn<ParametroSql>[] = [
    { key: "nr_sequencia", label: "#", render: (p) => String(p.nr_sequencia ?? "") },
    { key: "ds_parametro", label: "Descrição do parâmetro", render: (p) => p.ds_parametro ?? "" },
    { key: "ds_label", label: "Label", render: (p) => p.ds_label ?? "" },
    { key: "nr_ordem", label: "Ordem", render: (p) => (p.nr_ordem ?? "") === "" ? "" : String(p.nr_ordem ?? "") },
    { key: "vl_padrao", label: "Valor padrão", render: (p) => p.vl_padrao ?? "" },
    { key: "ie_perguntar", label: "Perguntar", render: (p) => simNao(p.ie_perguntar) },
    { key: "ie_obrigatorio", label: "Obrigatório", render: (p) => simNao(p.ie_obrigatorio) },
    ...colunasAuditoria<ParametroSql>(),
  ];

  /** Bandas que dependem diretamente desta (Banda superior = esta). */
  function dependentesDe(banda: BandaSql): BandaSql[] {
    if (banda.nr_sequencia == null) return [];
    return bandas.filter((b) => b.nr_seq_banda_superior != null && String(b.nr_seq_banda_superior) === String(banda.nr_sequencia));
  }
  /** Opções de Banda superior: as outras bandas Detalhe, menos as que dependem desta (direta ou indiretamente). */
  function opcoesBandaSuperior(banda: BandaSql): { value: string; label: string }[] {
    const bloqueadas = new Set<string>();
    if (banda.nr_sequencia != null) {
      const fila = [banda];
      while (fila.length > 0) {
        const atual = fila.shift() as BandaSql;
        bloqueadas.add(String(atual.nr_sequencia));
        for (const d of dependentesDe(atual)) if (!bloqueadas.has(String(d.nr_sequencia))) fila.push(d);
      }
    }
    return bandas
      .filter((b) => b.nr_sequencia != null && bandaEhDetalhe(b) && !bloqueadas.has(String(b.nr_sequencia)))
      .map((b) => ({ value: String(b.nr_sequencia), label: `${b.nr_sequencia} - ${b.ds_banda ?? ""}`.trim() }));
  }

  /** PDF: duplo clique na banda abre os elementos dela. */
  function abrirElementos(banda: BandaSql) {
    if (banda.nr_sequencia == null) return;
    setSelecionadoId(banda.id ?? null);
    setBandaElementos(banda);
    setElementos([]);
    setCarregandoElementos(true);
    obterElementosDaBanda(Number(banda.nr_sequencia))
      .then(setElementos)
      .catch(() => onToast?.("Erro ao carregar os elementos.", "error"))
      .finally(() => setCarregandoElementos(false));
  }
  function adicionar() {
    setErrosDetalhe([]);
    if (bandaElementos) {
      // Como no Tasy: o elemento novo vem ao lado do último, com 70 x 17.
      setDetalhe({ tipo: "elemento", elemento: { ie_tipo: "sql", ...proximaPosicao(), qt_largura: TAMANHO_ELEMENTO_PADRAO, qt_altura: ALTURA_ELEMENTO_PADRAO } });
      return;
    }
    if (aba === "bandas") {
      setDetalhe({ tipo: "banda", banda: { ds_banda: "", ds_sql: "", ie_tipo: relatorioPdf ? "detalhe" : null, qt_altura: null } });
    } else {
      setDetalhe({ tipo: "parametro", parametro: { ds_parametro: "", ds_label: "", nr_ordem: null, vl_padrao: "", ie_perguntar: "N", ie_obrigatorio: "N" } });
    }
  }
  /** Posição do elemento novo: à direita do último (Esquerda + Tamanho + 5), no mesmo Topo. */
  function proximaPosicao(lista: ElementoBanda[] = elementos): { qt_esquerda: number; qt_topo: number } {
    const ultimo = lista[lista.length - 1];
    if (!ultimo) return { qt_esquerda: 0, qt_topo: 0 };
    const n = (v: unknown) => (v === null || v === undefined || v === "" ? 0 : Number(v) || 0);
    return { qt_esquerda: n(ultimo.qt_esquerda) + n(ultimo.qt_largura) + 5, qt_topo: n(ultimo.qt_topo) };
  }
  /**
   * "Gerar elementos do SQL" (o "Gerar Campos SQL" do Tasy): um elemento SQL para cada coluna
   * do SQL da banda que ainda não tem elemento, lado a lado, com Descrição, Atributo e (com
   * Exibir labels) Label = nome da coluna.
   */
  async function gerarElementosDoSql() {
    if (!bandaElementos?.nr_sequencia || nrRelatorio == null) return;
    setGravando(true);
    try {
      const colunas = await obterColunasDaBanda(nrRelatorio, Number(bandaElementos.nr_sequencia));
      const existentes = new Set(elementos.map((e) => (e.cd_alias ?? "").trim().toLowerCase()).filter(Boolean));
      const novas = colunas.filter((c, i) => !existentes.has(c.toLowerCase()) && colunas.findIndex((x) => x.toLowerCase() === c.toLowerCase()) === i);
      if (colunas.length === 0) { onToast?.("O SQL da banda não tem colunas.", "warning"); return; }
      if (novas.length === 0) { onToast?.("Todas as colunas do SQL já têm elemento.", "warning"); return; }
      let lista = [...elementos];
      for (const coluna of novas) {
        const salvo = await salvarElementoBanda({
          ie_tipo: "sql", ds_elemento: coluna, cd_alias: coluna, ds_label: bandaComLabels ? coluna : null,
          ...proximaPosicao(lista), qt_largura: TAMANHO_ELEMENTO_PADRAO, qt_altura: ALTURA_ELEMENTO_PADRAO,
          nr_seq_banda: Number(bandaElementos.nr_sequencia), nr_seq_relatorio: nrRelatorio,
        });
        lista = [...lista, salvo];
        setElementos(lista);
      }
      onToast?.(`${novas.length} elemento(s) gerado(s) com sucesso!`, "success");
    } catch (e) {
      onToast?.(e instanceof Error && e.message ? e.message : "Erro ao gerar os elementos.", "error");
    } finally {
      setGravando(false);
    }
  }
  function abrirElemento(el: ElementoBanda) {
    setErrosDetalhe([]);
    setSelecionadoId(el.id ?? null);
    setDetalhe({ tipo: "elemento", elemento: { ...el } });
  }
  function abrir(item: BandaSql | ParametroSql) {
    setErrosDetalhe([]);
    setSelecionadoId(item.id ?? null);
    setDetalhe(aba === "bandas" ? { tipo: "banda", banda: { ...(item as BandaSql) } } : { tipo: "parametro", parametro: { ...(item as ParametroSql) } });
  }

  /* ── Rodapé (auditoria do que está aberto) ── */
  const auditoria = ehBandas
    ? detalhe?.tipo === "banda" && detalhe.banda.id
      ? { criadoPor: detalhe.banda.ds_usuario_criacao, criadoEm: detalhe.banda.dt_criacao, alteradoPor: detalhe.banda.ds_usuario_alteracao, alteradoEm: detalhe.banda.dt_alteracao, abrir: () => onOpenBandaAudit?.(relatorio?.id ?? null, detalhe.banda.id ?? null) }
      : detalhe?.tipo === "parametro" && detalhe.parametro.id
        ? { criadoPor: detalhe.parametro.ds_usuario_criacao, criadoEm: detalhe.parametro.dt_criacao, alteradoPor: detalhe.parametro.ds_usuario_alteracao, alteradoEm: detalhe.parametro.dt_alteracao, abrir: () => onOpenFiltroAudit?.(relatorio?.id ?? null, detalhe.parametro.id ?? null) }
        : detalhe?.tipo === "elemento" && detalhe.elemento.id
          ? { criadoPor: detalhe.elemento.ds_usuario_criacao, criadoEm: detalhe.elemento.dt_criacao, alteradoPor: detalhe.elemento.ds_usuario_alteracao, alteradoEm: detalhe.elemento.dt_alteracao, abrir: () => onOpenElementoAudit?.(relatorio?.id ?? null, detalhe.elemento.id ?? null) }
          : null
    : relatorio?.id
      ? { criadoPor: createdBy, criadoEm: createdAt, alteradoPor: updatedBy, alteradoEm: updatedAt, abrir: () => onOpenAudit?.(relatorio.id ?? null) }
      : null;

  const iconeInfo = (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <circle cx="12" cy="16" r="0.5" />
    </svg>
  );
  const corBorda = darkMode ? "#2c2c31 #38383e #38383e #2c2c31" : "#999 #ccc #ccc #999";
  const corTexto = darkMode ? "#fff" : "#000";
  const mostraRodape = !ehBandas || !!detalhe;

  return (
    <div
      className="flex-1 flex flex-col min-h-0"
      onContextMenu={(e) => {
        // Menu do relatório no "Ver" e nas listas de Bandas/Parâmetros (o clique numa banda
        // ou num parâmetro abre o menu do item, que não chega aqui).
        if ((ehBandas && detalhe) || contextMenuItems.length === 0) return;
        e.preventDefault();
        setMenu({ x: e.clientX, y: e.clientY, acoes: contextMenuItems });
      }}
    >
      {menu && menu.acoes.length > 0 && (
        <div
          className="fixed z-50 min-w-[160px] border border-slate-200 bg-white p-[3px] flex flex-col gap-[3px]"
          style={{ left: menu.x, top: menu.y, boxShadow: "0 4px 10px rgba(0,0,0,0.18)" }}
        >
          {menu.acoes.map((item) => (
            <button
              key={item.label}
              type="button"
              className="w-full text-[0.8rem] text-[#222] hover:bg-[#eee] text-left bg-transparent cursor-pointer"
              style={{ padding: "0.2rem 0.4rem" }}
              onClick={() => { item.onClick?.(); setMenu(null); }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Cabeçalho ── */}
      <div className="flex items-center justify-between gap-3 min-h-[42px]">
        <div className="flex items-center gap-2 min-w-0">
          <Select
            value={manageSelection}
            onChange={onManageSelectionChange ?? (() => {})}
            options={RELATORIO_SELECT_OPTIONS.filter((o) => allowedSubmodulos.includes(o.value))}
            showPlaceholder={false}
            className="!w-[180px]"
            disabled
          />
          {!ehBandas && (
            <div className="flex items-center gap-1">
              <button type="button" onClick={onPrevRecord} disabled={!hasPrevRecord} className={BOTAO_NAV} style={{ borderBottomColor: "#000" }} aria-label="Registro anterior">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18 9 12l6-6" /></svg>
              </button>
              <button type="button" onClick={onNextRecord} disabled={!hasNextRecord} className={BOTAO_NAV} style={{ borderBottomColor: "#000" }} aria-label="Próximo registro">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18 15 12 9 6" /></svg>
              </button>
            </div>
          )}
          {relatorio && (
            <div className="flex items-center text-xs ml-2 whitespace-nowrap overflow-hidden px-2 py-1" style={{ color: corTexto, border: "1px solid", borderColor: corBorda }}>
              <button type="button" className="cursor-pointer hover:underline" onClick={() => onNavigateToList?.()}>
                Relatório: {relatorio.nr_sequencia} {relatorio.ds_relatorio}
              </button>
              {bandaElementos && (
                <>
                  <span className="mx-1">&gt;</span>
                  <button type="button" className="cursor-pointer hover:underline" onClick={() => { setDetalhe(null); setBandaElementos(null); }}>
                    Banda: {bandaElementos.nr_sequencia} {bandaElementos.ds_banda ?? ""}
                  </button>
                </>
              )}
              {detalhe && (
                <>
                  <span className="mx-1">&gt;</span>
                  <button type="button" className="cursor-pointer hover:underline" onClick={() => setDetalhe(null)}>
                    {detalhe.tipo === "banda"
                      ? `Banda: ${detalhe.banda.nr_sequencia ?? "nova"} ${detalhe.banda.ds_banda ?? ""}`
                      : detalhe.tipo === "elemento"
                        ? `Elemento: ${detalhe.elemento.nr_sequencia ?? "novo"} ${detalhe.elemento.ds_elemento ?? ""}`
                        : `Parâmetro: ${detalhe.parametro.nr_sequencia ?? "novo"} ${detalhe.parametro.ds_parametro ?? ""}`}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {ehBandas && !detalhe && !bandaElementos && (
            <div className="flex items-center text-xs whitespace-nowrap px-2 py-1 gap-2" style={{ border: "1px solid", borderColor: corBorda, color: corTexto }}>
              {(["bandas", "parametros"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => { setAba(a); setSelecionadoId(null); }}
                  className="text-xs font-medium cursor-pointer"
                  style={{ borderBottom: `1px solid ${aba === a ? corTexto : "transparent"}`, color: corTexto }}
                >
                  {a === "bandas" ? "Bandas" : "Parâmetros"}
                </button>
              ))}
            </div>
          )}
          {ehBandas && !detalhe && bandaElementos && (
            <button type="button" onClick={() => void gerarElementosDoSql()} disabled={gravando} className={BOTAO_LINK}>
              Gerar elementos do SQL
            </button>
          )}
          {ehBandas && !detalhe && (
            <button
              type="button"
              onClick={adicionar}
              className={BOTAO_LINK}
            >
              Adicionar
            </button>
          )}
        </div>
      </div>

      {/* ── Conteúdo ── */}
      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          if (ehBandas) void salvarDetalhe();
          else salvarRelatorio();
        }}
        className="mt-6 flex-1 flex flex-col min-h-0"
      >
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-9">
          {!ehBandas && (
            <>
              <section>
                <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Relatório</h2>
                <div className="grid gap-[15px] sm:grid-cols-12">
                  <div className="sm:col-span-2">
                    {rotulo("Sequência", "relatorio", "nr_sequencia", campoRegras)}
                    <input disabled value={String(relatorio?.nr_sequencia ?? "")} className={INPUT} />
                  </div>
                  <div className="sm:col-span-2">
                    {rotulo("Código", "relatorio", "cd_relatorio", campoRegras)}
                    <input
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value.replace(/\s/g, "").slice(0, 30))}
                      disabled={statusDe(campoRegras, "cd_relatorio") === "D"}
                      spellCheck={false}
                      className={comErro([...errosDetalhe, ...campoErros], "cd_relatorio")}
                    />
                  </div>
                  <div className="sm:col-span-5">
                    {rotulo("Descrição", "relatorio", "ds_relatorio", campoRegras)}
                    <input
                      value={dsRelatorio}
                      onChange={(e) => setDsRelatorio(e.target.value)}
                      disabled={statusDe(campoRegras, "ds_relatorio") === "D"}
                      className={comErro([...errosDetalhe, ...campoErros], "ds_relatorio")}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    {rotulo("Formato", "relatorio", "ie_formato", campoRegras)}
                    <Select value={formato} onChange={(v) => setFormato(v === "pdf" ? "pdf" : "xls")} options={FORMATO_OPTIONS} showPlaceholder={false} disabled={statusDe(campoRegras, "ie_formato") === "D"} />
                  </div>
                  <div className="sm:col-span-12">
                    {rotulo("SQL", "relatorio", "ds_sql", campoRegras)}
                    <textarea
                      value={sqlCapa}
                      onChange={(e) => setSqlCapa(e.target.value)}
                      disabled={statusDe(campoRegras, "ds_sql") === "D"}
                      rows={3}
                      spellCheck={false}
                      className={`${comErro(errosDetalhe, "ds_sql")} resize-none`}
                    />
                  </div>
                </div>
              </section>

              <section>
                <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Saída</h2>
                <div className="space-y-[15px]">
                  <div className="grid gap-[15px] sm:grid-cols-4">
                    <div>
                      {rotulo("Nome do arquivo", "relatorio", "ds_nome_arquivo", campoRegras)}
                      <input
                        value={nomeArquivo}
                        onChange={(e) => setNomeArquivo(e.target.value)}
                        disabled={statusDe(campoRegras, "ds_nome_arquivo") === "D"}
                        placeholder={dsRelatorio.trim() || undefined}
                        className={`${comErro(errosDetalhe, "ds_nome_arquivo")} placeholder:text-[#aaa]`}
                      />
                    </div>
                    {/* Campos do PDF: só habilitados com o Formato PDF. */}
                    <div>
                      {rotulo("Formato do papel", "relatorio", "nr_seq_formato_papel", campoRegras)}
                      <Select
                        value={formatoPapel}
                        onChange={setFormatoPapel}
                        options={opcoesFormatoPapel}
                        disabled={pdfDesabilitado("nr_seq_formato_papel")}
                        error={errosDetalhe.includes("nr_seq_formato_papel")}
                      />
                    </div>
                    <div>
                      {rotulo("Orientação", "relatorio", "ie_orientacao", campoRegras)}
                      <Select value={orientacao} onChange={(v) => setOrientacao(v === "I" ? "I" : "P")} options={ORIENTACAO_OPTIONS} showPlaceholder={false} disabled={pdfDesabilitado("ie_orientacao")} />
                    </div>
                    <div>
                      {rotulo("Borda", "relatorio", "ie_borda", campoRegras)}
                      <Select value={borda} onChange={setBorda} options={BORDA_OPTIONS} showPlaceholder={false} disabled={pdfDesabilitado("ie_borda")} />
                    </div>
                  </div>
                  <div className="grid gap-[15px] sm:grid-cols-4">
                    {MARGENS.map(([campo, texto]) => (
                      <div key={campo}>
                        {rotulo(texto, "relatorio", campo, campoRegras)}
                        <input
                          inputMode="decimal"
                          maxLength={7}
                          value={margens[campo]}
                          onChange={(e) => setMargens((m) => ({ ...m, [campo]: mascararMedida(e.target.value, 4) }))}
                          disabled={pdfDesabilitado(campo)}
                          className={comErro(errosDetalhe, campo)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}

          {ehBandas && !detalhe && bandaElementos && (
            <section className="h-full flex min-h-0 flex-col">
              {carregandoElementos ? (
                <LoadingModal open message="Carregando..." />
              ) : elementos.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
                  <p className="mt-4 font-medium text-slate-500">Nenhum registro encontrado.</p>
                  <p className="mt-1 text-sm text-slate-500">Clique em &quot;Adicionar&quot; para cadastrar os elementos da banda (o estilo, o alinhamento e a posição das informações).</p>
                </div>
              ) : (
                <ResizableTable<ElementoBanda>
                  columns={colunasDeElemento}
                  rows={elementos}
                  rowKey={(e) => String(e.id ?? e.nr_sequencia)}
                  onRowClick={(e) => setSelecionadoId(e.id ?? null)}
                  onRowDoubleClick={abrirElemento}
                  rowClassName={(e) => (e.id === selecionadoId ? "row-selected" : "")}
                  onRowContextMenu={(el, e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelecionadoId(el.id ?? null);
                    setMenu({ x: e.clientX, y: e.clientY, acoes: [{ label: "Ver", onClick: () => abrirElemento(el) }, { label: "Excluir", onClick: () => excluir("elemento", el) }] });
                  }}
                />
              )}
            </section>
          )}

          {ehBandas && !detalhe && !bandaElementos && (
            <section className="h-full flex min-h-0 flex-col">
              {carregando ? (
                <LoadingModal open message="Carregando..." />
              ) : (aba === "bandas" ? bandas : parametros).length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
                  <p className="mt-4 font-medium text-slate-500">Nenhum registro encontrado.</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {aba === "bandas"
                      ? 'Clique em "Adicionar" para cadastrar as bandas do relatório.'
                      : 'Clique em "Adicionar" para cadastrar os parâmetros usados no SQL (ex.: :teste).'}
                  </p>
                </div>
              ) : aba === "bandas" ? (
                <ResizableTable<BandaSql>
                  {...colunasBandas}
                  columns={colunasDeBanda}
                  rows={bandas}
                  rowKey={(b) => String(b.id ?? b.nr_sequencia)}
                  onRowClick={(b) => setSelecionadoId(b.id ?? null)}
                  // PDF: o duplo clique abre os elementos da banda. XLS: a banda não tem
                  // conteúdo próprio para abrir no duplo clique (só "Ver" no menu).
                  onRowDoubleClick={relatorioPdf ? abrirElementos : undefined}
                  rowClassName={(b) => (b.id === selecionadoId ? "row-selected" : "")}
                  onRowContextMenu={(b, e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelecionadoId(b.id ?? null);
                    setMenu({ x: e.clientX, y: e.clientY, acoes: [{ label: "Ver", onClick: () => abrir(b) }, { label: "Excluir", onClick: () => excluir("banda", b) }] });
                  }}
                />
              ) : (
                <ResizableTable<ParametroSql>
                  {...colunasParametros}
                  columns={colunasDeParametro}
                  rows={parametros}
                  rowKey={(p) => String(p.id ?? p.nr_sequencia)}
                  onRowClick={(p) => setSelecionadoId(p.id ?? null)}
                  onRowDoubleClick={abrir}
                  rowClassName={(p) => (p.id === selecionadoId ? "row-selected" : "")}
                  onRowContextMenu={(p, e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelecionadoId(p.id ?? null);
                    setMenu({ x: e.clientX, y: e.clientY, acoes: [{ label: "Ver", onClick: () => abrir(p) }, { label: "Excluir", onClick: () => excluir("parametro", p) }] });
                  }}
                />
              )}
            </section>
          )}

          {detalhe?.tipo === "banda" && (
            <section>
              <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Banda</h2>
              <div className="grid gap-[15px] sm:grid-cols-12">
                <div className="sm:col-span-2">
                  {rotulo("Sequência", "relatorio_banda", "nr_sequencia", bandaCampoRegras)}
                  <input disabled value={String(detalhe.banda.nr_sequencia ?? "")} className={INPUT} />
                </div>
                <div className={relatorioPdf ? "sm:col-span-6" : "sm:col-span-10"}>
                  {rotulo("Descrição", "relatorio_banda", "ds_banda", bandaCampoRegras)}
                  <input
                    value={detalhe.banda.ds_banda ?? ""}
                    onChange={(e) => setDetalhe({ tipo: "banda", banda: { ...detalhe.banda, ds_banda: e.target.value } })}
                    disabled={statusDe(bandaCampoRegras, "ds_banda") === "D"}
                    className={comErro(errosDetalhe, "ds_banda")}
                  />
                </div>
                {relatorioPdf && (
                  <>
                    <div className="sm:col-span-2">
                      {rotulo("Tipo", "relatorio_banda", "ie_tipo", bandaCampoRegras)}
                      <Select
                        value={detalhe.banda.ie_tipo ?? ""}
                        onChange={(v) => setDetalhe({ tipo: "banda", banda: { ...detalhe.banda, ie_tipo: (v || null) as TipoBanda | null } })}
                        options={TIPOS_BANDA}
                        disabled={statusDe(bandaCampoRegras, "ie_tipo") === "D"}
                        error={errosDetalhe.includes("ie_tipo")}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      {rotulo("Altura", "relatorio_banda", "qt_altura", bandaCampoRegras)}
                      <input
                        inputMode="numeric"
                        value={detalhe.banda.qt_altura ?? ""}
                        onChange={(e) => {
                          const digitos = e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 5);
                          setDetalhe({ tipo: "banda", banda: { ...detalhe.banda, qt_altura: digitos === "" ? null : Number(digitos) } });
                        }}
                        disabled={statusDe(bandaCampoRegras, "qt_altura") === "D"}
                        className={comErro(errosDetalhe, "qt_altura")}
                      />
                    </div>
                    {checkboxesBorda(
                      detalhe.banda,
                      (campo, marcado) => setDetalhe({ tipo: "banda", banda: { ...detalhe.banda, [campo]: marcado ? "S" : "N" } }),
                      "relatorio_banda",
                      bandaCampoRegras,
                    )}
                    {/* Banda superior e opções: só na banda Detalhe. */}
                    {(() => {
                      const naoDetalhe = !bandaEhDetalhe(detalhe.banda);
                      return (
                        <>
                          <div className="sm:col-span-6">
                            {rotulo("Banda superior", "relatorio_banda", "nr_seq_banda_superior", bandaCampoRegras)}
                            <Select
                              value={naoDetalhe ? "" : String(detalhe.banda.nr_seq_banda_superior ?? "")}
                              onChange={(v) => setDetalhe({ tipo: "banda", banda: { ...detalhe.banda, nr_seq_banda_superior: v || null } })}
                              options={opcoesBandaSuperior(detalhe.banda)}
                              disabled={naoDetalhe || statusDe(bandaCampoRegras, "nr_seq_banda_superior") === "D"}
                              error={errosDetalhe.includes("nr_seq_banda_superior")}
                            />
                          </div>
                          <div className="sm:col-span-6 flex flex-wrap gap-8">
                            {OPCOES_DETALHE.map(({ campo, label }) => (
                              <div key={campo} className="flex flex-col">
                                {rotulo(label, "relatorio_banda", campo, bandaCampoRegras)}
                                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="cg-checkbox"
                                    checked={!naoDetalhe && detalhe.banda[campo] === "S"}
                                    disabled={naoDetalhe || statusDe(bandaCampoRegras, campo) === "D"}
                                    onChange={(e) => setDetalhe({ tipo: "banda", banda: { ...detalhe.banda, [campo]: e.target.checked ? "S" : "N" } })}
                                  />
                                  <span>Sim</span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </>
                )}
                <div className="sm:col-span-12">
                  {rotulo("SQL", "relatorio_banda", "ds_sql", bandaCampoRegras)}
                  <textarea
                    value={detalhe.banda.ds_sql ?? ""}
                    onChange={(e) => setDetalhe({ tipo: "banda", banda: { ...detalhe.banda, ds_sql: e.target.value } })}
                    disabled={statusDe(bandaCampoRegras, "ds_sql") === "D"}
                    // Mesmo estilo dos campos Observação do sistema.
                    rows={3}
                    spellCheck={false}
                    className={`${comErro(errosDetalhe, "ds_sql")} resize-none`}
                  />
                </div>
              </div>
            </section>
          )}

          {detalhe?.tipo === "elemento" && (() => {
            const el = detalhe.elemento;
            const setEl = (mudanca: Partial<ElementoBanda>) => setDetalhe({ tipo: "elemento", elemento: { ...el, ...mudanca } });
            const r = (texto: string, campo: string) => rotulo(texto, "relatorio_banda_elemento", campo, elementoCampoRegras);
            const des = (campo: CampoElemento) => elementoDesabilitado(el, campo);
            const tipoAtual = tipoDoElemento(el);
            const valorDesabilitado = (campo: CampoElemento, valor: unknown) => (elementoDesabilitadoPeloTipo(el, campo) ? "" : String(valor ?? ""));
            const inputPx = (campo: "qt_esquerda" | "qt_topo" | "qt_largura" | "qt_altura" | "qt_padding_superior" | "qt_padding_inferior" | "qt_padding_esquerda" | "qt_padding_direita", texto: string, minimo1: boolean) => (
              <div className="sm:col-span-2">
                {r(texto, campo)}
                <input
                  inputMode="numeric"
                  value={valorDesabilitado(campo, el[campo])}
                  onChange={(e) => setEl({ [campo]: mascararPx(e.target.value, minimo1) })}
                  disabled={des(campo)}
                  className={comErro(errosDetalhe, campo)}
                />
              </div>
            );
            return (
              <section>
                <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Elemento</h2>
                <div className="grid gap-[15px] sm:grid-cols-12">
                  <div className="sm:col-span-2">
                    {r("Sequência", "nr_sequencia")}
                    <input disabled value={String(el.nr_sequencia ?? "")} className={INPUT} />
                  </div>
                  <div className="sm:col-span-4">
                    {r("Descrição", "ds_elemento")}
                    <input value={el.ds_elemento ?? ""} onChange={(e) => setEl({ ds_elemento: e.target.value })} disabled={des("ds_elemento")} className={comErro(errosDetalhe, "ds_elemento")} />
                  </div>
                  <div className="sm:col-span-2">
                    {r("Tipo", "ie_tipo")}
                    <Select
                      value={tipoAtual}
                      onChange={(v) => setEl({ ie_tipo: (TIPOS_ELEMENTO.some((t) => t.value === v) ? v : "sql") as TipoElemento })}
                      options={TIPOS_ELEMENTO}
                      showPlaceholder={false}
                      disabled={des("ie_tipo")}
                      error={errosDetalhe.includes("ie_tipo")}
                    />
                  </div>
                  <div className="sm:col-span-4">
                    {r("Imagem", "nr_seq_imagem")}
                    <Select
                      value={elementoDesabilitadoPeloTipo(el, "nr_seq_imagem") ? "" : String(el.nr_seq_imagem ?? "")}
                      onChange={(v) => setEl({ nr_seq_imagem: v || null })}
                      options={opcoesImagem}
                      disabled={des("nr_seq_imagem")}
                      error={errosDetalhe.includes("nr_seq_imagem")}
                    />
                  </div>
                  {inputPx("qt_esquerda", "Esquerda", false)}
                  {inputPx("qt_topo", "Topo", false)}
                  {inputPx("qt_largura", "Tamanho", true)}
                  {inputPx("qt_altura", "Altura", true)}
                  {inputPx("qt_padding_superior", "Padding superior", false)}
                  {inputPx("qt_padding_inferior", "Padding inferior", false)}
                  {inputPx("qt_padding_esquerda", "Padding esquerda", false)}
                  {inputPx("qt_padding_direita", "Padding direita", false)}
                  <div className="sm:col-span-2">
                    {r("Estilo", "ie_estilo")}
                    <Select value={valorDesabilitado("ie_estilo", el.ie_estilo)} onChange={(v) => setEl({ ie_estilo: v || null })} options={ESTILOS_ELEMENTO} disabled={des("ie_estilo")} error={errosDetalhe.includes("ie_estilo")} />
                  </div>
                  <div className="sm:col-span-2">
                    {r("Alinhamento", "ie_alinhamento")}
                    <Select value={valorDesabilitado("ie_alinhamento", el.ie_alinhamento)} onChange={(v) => setEl({ ie_alinhamento: v || null })} options={ALINHAMENTOS_ELEMENTO} disabled={des("ie_alinhamento")} error={errosDetalhe.includes("ie_alinhamento")} />
                  </div>
                  <div className="sm:col-span-4">
                    {r("Fonte", "ie_fonte")}
                    <Select value={valorDesabilitado("ie_fonte", el.ie_fonte)} onChange={(v) => setEl({ ie_fonte: v || null })} options={FONTES_ELEMENTO} disabled={des("ie_fonte")} error={errosDetalhe.includes("ie_fonte")} />
                  </div>
                  <div className="sm:col-span-2">
                    {r("Tamanho da fonte", "qt_fonte")}
                    <input
                      inputMode="numeric"
                      value={valorDesabilitado("qt_fonte", el.qt_fonte)}
                      onChange={(e) => setEl({ qt_fonte: e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 3) || null })}
                      disabled={des("qt_fonte")}
                      className={comErro(errosDetalhe, "qt_fonte")}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    {r("Cor", "cd_cor")}
                    <CampoCor valor={valorDesabilitado("cd_cor", el.cd_cor)} onChange={(v) => setEl({ cd_cor: v || null })} disabled={des("cd_cor")} erro={errosDetalhe.includes("cd_cor")} />
                  </div>
                  <div className="sm:col-span-3">
                    {r("Background", "cd_background")}
                    <CampoCor valor={valorDesabilitado("cd_background", el.cd_background)} onChange={(v) => setEl({ cd_background: v || null })} disabled={des("cd_background")} erro={errosDetalhe.includes("cd_background")} />
                  </div>
                  <div className="sm:col-span-2">
                    {r("Máscara", "ie_mascara")}
                    <Select
                      value={valorDesabilitado("ie_mascara", el.ie_mascara)}
                      onChange={(v) => setEl({ ie_mascara: v || null })}
                      options={tipoAtual === "data_hora" ? MASCARAS_ELEMENTO.filter((m) => ["data", "data_hora", "hora"].includes(m.value)) : MASCARAS_ELEMENTO}
                      disabled={des("ie_mascara")}
                      error={errosDetalhe.includes("ie_mascara")}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    {r("Casas decimais", "qt_casas_decimais")}
                    <input
                      inputMode="numeric"
                      value={valorDesabilitado("qt_casas_decimais", el.qt_casas_decimais)}
                      onChange={(e) => {
                        const digito = e.target.value.replace(/\D/g, "").slice(-1);
                        setEl({ qt_casas_decimais: digito === "" ? null : digito });
                      }}
                      disabled={des("qt_casas_decimais")}
                      className={comErro(errosDetalhe, "qt_casas_decimais")}
                    />
                  </div>
                  <div className="sm:col-span-2 flex flex-col">
                    {r("Quebrar linha", "ie_quebrar_linha")}
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        className="cg-checkbox"
                        checked={quebraHabilitada(el) && el.ie_quebrar_linha === "S"}
                        disabled={!quebraHabilitada(el) || statusDe(elementoCampoRegras, "ie_quebrar_linha") === "D"}
                        onChange={(e) => setEl({ ie_quebrar_linha: e.target.checked ? "S" : "N" })}
                      />
                      <span>Sim</span>
                    </label>
                  </div>
                  {checkboxesBorda(el, (campo, marcado) => setEl({ [campo]: marcado ? "S" : "N" }), "relatorio_banda_elemento", elementoCampoRegras)}
                  <div className="sm:col-span-6">
                    {r("Label", "ds_label")}
                    <input value={valorDesabilitado("ds_label", el.ds_label)} onChange={(e) => setEl({ ds_label: e.target.value })} disabled={des("ds_label")} className={comErro(errosDetalhe, "ds_label")} />
                  </div>
                  <div className="sm:col-span-6">
                    {r("Atributo", "cd_alias")}
                    <input value={valorDesabilitado("cd_alias", el.cd_alias)} onChange={(e) => setEl({ cd_alias: e.target.value })} disabled={des("cd_alias")} spellCheck={false} className={comErro(errosDetalhe, "cd_alias")} />
                  </div>
                  <div className="sm:col-span-12">
                    {r("Conteúdo", "ds_conteudo")}
                    <textarea
                      value={valorDesabilitado("ds_conteudo", el.ds_conteudo)}
                      onChange={(e) => setEl({ ds_conteudo: e.target.value })}
                      disabled={des("ds_conteudo")}
                      rows={3}
                      className={`${comErro(errosDetalhe, "ds_conteudo")} resize-none`}
                    />
                  </div>
                </div>
              </section>
            );
          })()}

          {detalhe?.tipo === "parametro" && (
            <section>
              <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Parâmetro</h2>
              <div className="grid gap-[15px] sm:grid-cols-12">
                <div className="sm:col-span-2">
                  {rotulo("Sequência", "relatorio_parametro", "nr_sequencia", parametroCampoRegras)}
                  <input disabled value={String(detalhe.parametro.nr_sequencia ?? "")} className={INPUT} />
                </div>
                <div className="sm:col-span-5">
                  {rotulo("Descrição do parâmetro", "relatorio_parametro", "ds_parametro", parametroCampoRegras)}
                  <input
                    value={detalhe.parametro.ds_parametro ?? ""}
                    onChange={(e) => setDetalhe({ tipo: "parametro", parametro: { ...detalhe.parametro, ds_parametro: e.target.value.replace(/\s/g, "") } })}
                    disabled={statusDe(parametroCampoRegras, "ds_parametro") === "D"}
                    placeholder="teste"
                    className={`${comErro(errosDetalhe, "ds_parametro")} placeholder:text-[#aaa]`}
                  />
                </div>
                <div className="sm:col-span-5">
                  {rotulo("Label", "relatorio_parametro", "ds_label", parametroCampoRegras)}
                  <input
                    value={detalhe.parametro.ds_label ?? ""}
                    onChange={(e) => setDetalhe({ tipo: "parametro", parametro: { ...detalhe.parametro, ds_label: e.target.value } })}
                    disabled={statusDe(parametroCampoRegras, "ds_label") === "D"}
                    className={comErro(errosDetalhe, "ds_label")}
                  />
                </div>
                <div className="sm:col-span-2">
                  {rotulo("Ordem", "relatorio_parametro", "nr_ordem", parametroCampoRegras)}
                  <input
                    inputMode="numeric"
                    value={detalhe.parametro.nr_ordem ?? ""}
                    onChange={(e) => {
                      const digitos = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setDetalhe({ tipo: "parametro", parametro: { ...detalhe.parametro, nr_ordem: digitos === "" ? null : Number(digitos) } });
                    }}
                    disabled={statusDe(parametroCampoRegras, "nr_ordem") === "D"}
                    className={comErro(errosDetalhe, "nr_ordem")}
                  />
                </div>
                <div className="sm:col-span-2">
                  {rotulo("Valor padrão", "relatorio_parametro", "vl_padrao", parametroCampoRegras)}
                  <input
                    value={detalhe.parametro.vl_padrao ?? ""}
                    onChange={(e) => setDetalhe({ tipo: "parametro", parametro: { ...detalhe.parametro, vl_padrao: e.target.value } })}
                    disabled={statusDe(parametroCampoRegras, "vl_padrao") === "D"}
                    className={comErro(errosDetalhe, "vl_padrao")}
                  />
                </div>
                {/* Perguntar e Obrigatório lado a lado (como os checkboxes do formulário de Usuários). */}
                <div className="sm:col-span-8 flex gap-8">
                  {([
                    ["ie_perguntar", "Perguntar"],
                    ["ie_obrigatorio", "Obrigatório"],
                  ] as const).map(([campo, texto]) => (
                    <div key={campo} className="flex flex-col">
                      {rotulo(texto, "relatorio_parametro", campo, parametroCampoRegras)}
                      <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          className="cg-checkbox"
                          checked={detalhe.parametro[campo] === "S"}
                          disabled={statusDe(parametroCampoRegras, campo) === "D"}
                          onChange={(e) => setDetalhe({ tipo: "parametro", parametro: { ...detalhe.parametro, [campo]: e.target.checked ? "S" : "N" } })}
                        />
                        <span>Sim</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>

        {mostraRodape && (
          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between gap-3">
              {auditoria && (
                <div className="text-[13px] text-slate-500">
                  <div className="relative group flex items-center gap-2">
                    <span>Criado por {autor(auditoria.criadoPor)} em {auditoria.criadoEm ? formatDate(auditoria.criadoEm) : "-"}</span>
                    <button type="button" onClick={auditoria.abrir} className="botao-auditoria inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none" aria-label="Abrir histórico de auditoria">
                      {iconeInfo}
                    </button>
                  </div>
                  <div className="relative group flex items-center gap-2 mt-1">
                    <span>Alterado por {autor(auditoria.alteradoPor)} em {auditoria.alteradoEm ? formatDate(auditoria.alteradoEm) : "-"}</span>
                    <button type="button" onClick={auditoria.abrir} className="botao-auditoria inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none" aria-label="Abrir histórico de auditoria">
                      {iconeInfo}
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => (ehBandas ? setDetalhe(null) : onCancel())}
                  className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                  style={{ backgroundColor: "#bdbdbd", borderBottomColor: "#000" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || gravando}
                  className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                  style={{ backgroundColor: "#003056", borderBottomColor: "#000" }}
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      {(gravando || saving) && <LoadingModal open message="Carregando..." />}
    </div>
  );
}
