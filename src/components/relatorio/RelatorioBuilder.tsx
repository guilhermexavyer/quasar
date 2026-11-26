"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import CampoCorPaleta from "@/components/ui/CampoCorPaleta";
import FormularioSomenteLeitura from "@/components/ui/FormularioSomenteLeitura";
import Select from "@/components/ui/Select";
import LoadingModal from "@/components/ui/LoadingModal";
import PaginationFooter, { usePagination } from "@/components/ui/PaginationFooter";
import RotuloCampo from "@/components/ui/RotuloCampo";
import RequiredAsterisk from "@/components/ui/RequiredAsterisk";
import ResizableTable, { useOrdenacaoTabela, type ConfigColunasTabela, type ResizableTableColumn } from "@/components/ui/ResizableTable";
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
  ALINHAMENTO_ELEMENTO_PADRAO,
  FONTE_ELEMENTO_PADRAO,
  alterarStatusItem,
  duplicarBandaSql,
  duplicarElementoBanda,
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
import NavegacaoRegistros from "@/components/ui/NavegacaoRegistros";
import AbasRegistros from "@/components/ui/AbasRegistros";

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
 *         do relatório). No XLS vale a primeira banda Detalhe (menor Ordem; empate ou sem Ordem, menor Sequência).
 *         No PDF, também Tipo (Cabeçalho, Detalhe, Rodapé), Altura (px), bordas e, na banda
 *         Detalhe, Banda superior (dependência: o SQL roda para cada registro da superior,
 *         com :COLUNA = valor da coluna) e as opções Quebrar página por registro, Exibir
 *         labels e Imprimir sem registros. O duplo clique numa banda abre os Elementos
 *         dela (Relatório > Banda > Elemento).
 *       Parâmetros: os :nome usados no SQL, com Descrição, Label, Atributo (o nome no SQL),
 *         Ordem, Valor padrão, Perguntar e Obrigatório.
 *     Bandas, elementos e parâmetros são gravados na hora (cada um com auditoria própria).
 *     Menu de contexto de cada um: Ver, Duplicar (banda, com os elementos, e elemento),
 *     Ativar/Inativar (inativo não sai no relatório; na lista, estilo do colaborador
 *     Desligado) e Excluir. No formulário aberto, as setas passam pelos registros da lista.
 */

interface ContextMenuItem {
  label: string;
  onClick?: () => void;
}

/** Dados do relatório gravados pelo formulário. */
export interface DadosRelatorioForm {
  ds_relatorio: string;
  ie_formato: "xls" | "pdf";
  /** A = ativo; I = inativo (não é gerado). */
  ie_status: "A" | "I";
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
  /** Gera o relatório aberto (menu de contexto das bandas, elementos e parâmetros); sem ela, a opção não aparece. */
  onGerarRelatorio?: () => void;
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

const RELATORIO_SELECT_OPTIONS = [{ value: "relatorio", label: "Relatórios" }, { value: "importarRelatorio", label: "Importar relatório" }];
/** Status do relatório, da banda, do elemento e do parâmetro (inativo não sai no relatório). */
const STATUS_OPTIONS = [{ value: "A", label: "Ativo" }, { value: "I", label: "Inativo" }];
/** Origem do relatório (campo só exibido). */
const ORIGEM_OPTIONS = [{ value: "C", label: "Criação" }, { value: "I", label: "Importação" }, { value: "Q", label: "Quasar" }];
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

/** Altura (linhas) dos campos SQL do relatório e da banda. */
const LINHAS_SQL = 6;

type Detalhe ={ tipo: "banda"; banda: BandaSql } | { tipo: "parametro"; parametro: ParametroSql } | { tipo: "elemento"; elemento: ElementoBanda } | null;
/** Linha em edição na lista: o rascunho da banda ou do elemento. */
type EdicaoLinha = { tipo: "banda"; item: BandaSql } | { tipo: "elemento"; item: ElementoBanda } | null;

/** Campos da edição na lista: mais baixos que os do formulário, para caber na linha. */
const INPUT_LINHA = "w-full rounded-[3px] border border-slate-300 bg-white px-1.5 py-0 text-sm leading-[22px] transition focus:border-[#003056] focus:outline-none disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500";
const SELECT_LINHA = "!px-1.5 !py-0 leading-[22px]";

/** Só dígitos (px), sem zeros à esquerda; `minimo1` impede o 0 (largura e altura). */
function mascararPx(texto: string, minimo1: boolean): string {
  const digitos = texto.replace(/\D/g, "").slice(0, 5);
  const sem0 = digitos.replace(/^0+(?=\d)/, "");
  return minimo1 ? sem0.replace(/^0$/, "") : sem0;
}

/** Ordem da banda (e Camada do elemento) digitada: só dígitos (até 5), sem zeros à esquerda; vazio = sem Ordem. */
function textoParaOrdem(texto: string): number | null {
  const digitos = texto.replace(/\D/g, "").slice(0, 5);
  return digitos === "" ? null : Number(digitos);
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
  onGerarRelatorio,
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
  /** Origem 'Q' (Quasar): o relatório e as bandas, elementos e parâmetros dele só podem ser vistos. */
  const somenteLeitura = relatorio?.ie_origem === "Q";
  const [sqlCapa, setSqlCapa] = useState(relatorio?.ds_sql ?? "");
  const [nomeArquivo, setNomeArquivo] = useState(
    relatorio?.ds_nome_arquivo ?? pdf?.titulo ?? ""
  );
  const [formato, setFormato] = useState<"xls" | "pdf">(relatorio?.ie_formato === "pdf" ? "pdf" : "xls");
  const [status, setStatus] = useState<"A" | "I">(relatorio?.ie_status === "I" ? "I" : "A");
  // Ativar/Inativar pelo menu com o formulário aberto: o Status acompanha (salvar não desfaz).
  const [statusRecebido, setStatusRecebido] = useState(relatorio?.ie_status);
  if (relatorio?.ie_status !== statusRecebido) {
    setStatusRecebido(relatorio?.ie_status);
    setStatus(relatorio?.ie_status === "I" ? "I" : "A");
  }
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
  /**
   * Edição na lista (Bandas e Elementos), como no Tasy: o lápis da linha deixa editar as
   * colunas ali mesmo. Tab passa ao campo da direita; Enter grava e passa a editar a linha
   * de baixo; Ctrl+S ou o Salvar do rodapé gravam e encerram; Esc ou o Cancelar descartam.
   */
  const [edicaoLinha, setEdicaoLinha] = useState<EdicaoLinha>(null);
  const [errosLinha, setErrosLinha] = useState<string[]>([]);
  const listaRef = useRef<HTMLElement | null>(null);
  /** Campo que recebe o foco quando a edição passa para outra linha (o mesmo da linha anterior). */
  const focoLinhaRef = useRef<string | null>(null);
  const gravandoLinhaRef = useRef(false);
  /** Paginação das listas (rodapé igual ao das demais telas de registros). */
  const paginacaoBandas = usePagination(bandas.length);
  const paginacaoElementos = usePagination(elementos.length);
  const paginacaoParametros = usePagination(parametros.length);
  // Clique no cabeçalho das listas: ordena pela coluna (o valor que a célula mostra).
  const { ordenados: bandasOrdenadas, props: ordenacaoBandas } = useOrdenacaoTabela("builder.bandas", bandas, (b, coluna) => {
    if (coluna === "ie_tipo") return TIPOS_BANDA.find((t) => t.value === b.ie_tipo)?.label ?? "";
    if (coluna === "nr_ordem") return bandaEhDetalhe(b) ? b.nr_ordem : null;
    if (coluna === "nr_seq_banda_superior") return nomeDaBanda(b.nr_seq_banda_superior);
    return (b as Record<string, unknown>)[coluna];
  });
  const { ordenados: elementosOrdenados, props: ordenacaoElementos } = useOrdenacaoTabela("builder.elementos", elementos, (el, coluna) =>
    coluna === "ie_tipo" ? TIPOS_ELEMENTO.find((t) => t.value === el.ie_tipo)?.label ?? "" : (el as Record<string, unknown>)[coluna],
  );
  const { ordenados: parametrosOrdenados, props: ordenacaoParametros } = useOrdenacaoTabela("builder.parametros", parametros);
  // Saiu da lista da linha (Ver, Adicionar, outra aba, elementos da banda): a edição é descartada.
  const edicaoNaTela = !edicaoLinha || (!detalhe && (edicaoLinha.tipo === "banda" ? !bandaElementos && aba === "bandas" : !!bandaElementos));
  if (!edicaoNaTela) {
    setEdicaoLinha(null);
    setErrosLinha([]);
  }

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
  /** Checkbox "Sim" com rótulo em cima (bordas, opções da banda, Quebrar linha, Perguntar...). */
  const campoCheck = (texto: string, colecao: string, campo: string, regras: Record<string, CampoStatus>, marcado: boolean, onChange: (marcado: boolean) => void, desabilitado = false) => (
    <div key={campo} className="flex flex-col">
      {rotulo(texto, colecao, campo, regras)}
      <label className="inline-flex h-[34px] items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          className="cg-checkbox"
          checked={marcado}
          disabled={desabilitado || statusDe(regras, campo) === "D"}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>Sim</span>
      </label>
    </div>
  );
  /** Borda superior, inferior, esquerda e direita (banda e elemento), para entrar numa linha de campos. */
  const checkboxesBorda = (
    valores: Partial<Record<(typeof CAMPOS_BORDA)[number]["campo"], "S" | "N" | null>>,
    onChange: (campo: (typeof CAMPOS_BORDA)[number]["campo"], marcado: boolean) => void,
    colecao: string,
    regras: Record<string, CampoStatus>,
  ) => CAMPOS_BORDA.map(({ campo, label }) => campoCheck(label, colecao, campo, regras, valores[campo] === "S", (m) => onChange(campo, m)));

  /* ── Salvar ── */
  // Obrigatoriedade só pelas regras de Campos x Formulários (nenhum campo é obrigatório por padrão).
  // Os campos do PDF só contam (e só são gravados) com o Formato PDF.
  function salvarRelatorio() {
    if (somenteLeitura) return;
    const valores: Record<string, string> = {
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
      ds_relatorio: dsRelatorio.trim(),
      ie_formato: formato,
      ie_status: status,
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
  const CAMPOS_ELEMENTO = ["ds_elemento", "nr_camada", "ie_tipo", "nr_seq_imagem", "qt_esquerda", "qt_topo", "ie_estilo", "qt_largura", "qt_altura", "ie_alinhamento", "cd_background", "cd_cor", "ie_fonte", "qt_fonte", "ds_label", "cd_alias", "ds_conteudo", "ie_mascara", "qt_casas_decimais", "qt_padding_superior", "qt_padding_inferior", "qt_padding_esquerda", "qt_padding_direita"] as const;
  type CampoElemento = (typeof CAMPOS_ELEMENTO)[number];
  function tipoDoElemento(el: ElementoBanda): TipoElemento {
    return TIPOS_ELEMENTO.some((t) => t.value === el.ie_tipo) ? (el.ie_tipo as TipoElemento) : "sql";
  }
  function elementoNormalizado(el: ElementoBanda): ElementoBanda {
    const normalizado: ElementoBanda = { ...el, ie_tipo: tipoDoElemento(el) };
    // Campos desabilitados pelo tipo não são gravados.
    (["nr_seq_imagem", "ie_estilo", "ie_alinhamento", "ie_fonte", "qt_fonte", "cd_cor", "cd_background", "ds_label", "cd_alias", "ds_conteudo", "ie_mascara", "qt_casas_decimais", "qt_padding_superior", "qt_padding_inferior", "qt_padding_esquerda", "qt_padding_direita"] as const)
      .forEach((c) => { if (elementoDesabilitadoPeloTipo(normalizado, c)) normalizado[c] = null; });
    // Alinhamento e Fonte não ficam vazios: sem escolha, Esquerda e Arial.
    if (!elementoDesabilitadoPeloTipo(normalizado, "ie_alinhamento") && !normalizado.ie_alinhamento) normalizado.ie_alinhamento = ALINHAMENTO_ELEMENTO_PADRAO;
    if (!elementoDesabilitadoPeloTipo(normalizado, "ie_fonte") && !normalizado.ie_fonte) normalizado.ie_fonte = FONTE_ELEMENTO_PADRAO;
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

  /** Problema que impede gravar: campos em vermelho e a mensagem. */
  type ProblemaGravacao = { campos: string[]; mensagem: string };
  /** Validação da banda (formulário e edição na lista). */
  function problemaDaBanda(b: BandaSql): ProblemaGravacao | null {
    const campos = relatorioPdf
      ? ["ds_banda", "ie_tipo", "qt_altura", "ds_sql", ...(bandaEhDetalhe(b) ? ["nr_ordem", "nr_seq_banda_superior"] : [])]
      : ["ds_banda", "nr_ordem", "ds_sql"];
    const faltantes = campos.filter((c) => statusDe(bandaCampoRegras, c) === "O" && !String(b[c as keyof BandaSql] ?? "").trim());
    if (faltantes.length > 0) return { campos: faltantes, mensagem: "Preencha os campos obrigatórios." };
    // Um Cabeçalho e um Rodapé por relatório.
    if (relatorioPdf && (b.ie_tipo === "cabecalho" || b.ie_tipo === "rodape") && bandas.some((x) => x.id !== b.id && x.ie_tipo === b.ie_tipo)) {
      return { campos: ["ie_tipo"], mensagem: `O relatório já tem uma banda do tipo ${b.ie_tipo === "cabecalho" ? "Cabeçalho" : "Rodapé"}.` };
    }
    // Banda superior de outras: continua Detalhe (as dependentes saem dentro dela).
    if (relatorioPdf && !bandaEhDetalhe(b) && b.id && dependentesDe(b).length > 0) {
      return { campos: ["ie_tipo"], mensagem: "A banda é a banda superior de outras bandas: o tipo precisa ser Detalhe." };
    }
    if (relatorioPdf && bandaEhDetalhe(b) && b.nr_seq_banda_superior && !opcoesBandaSuperior(b).some((o) => o.value === String(b.nr_seq_banda_superior))) {
      return { campos: ["nr_seq_banda_superior"], mensagem: "A banda superior precisa ser outra banda Detalhe, que não dependa desta." };
    }
    return null;
  }
  /** Validação do elemento (já normalizado), no formulário e na edição na lista. */
  function problemaDoElemento(el: ElementoBanda): ProblemaGravacao | null {
    const faltantes = CAMPOS_ELEMENTO.filter((c) => !elementoDesabilitado(el, c) && statusDe(elementoCampoRegras, c) === "O" && !String(el[c] ?? "").trim());
    return faltantes.length > 0 ? { campos: faltantes, mensagem: "Preencha os campos obrigatórios." } : null;
  }
  /** Banda como é gravada: Tipo, Altura, bordas, Banda superior e opções só existem no PDF. */
  function bandaParaGravar(b: BandaSql): BandaSql {
    const banda = relatorioPdf
      ? b
      : {
          ...b, ie_tipo: null, qt_altura: null, nr_seq_banda_superior: null, cd_background_registro: null, cd_background_label: null,
          ...Object.fromEntries([...CAMPOS_BORDA, ...OPCOES_DETALHE].map(({ campo }) => [campo, "N"])),
        };
    return { ...banda, nr_seq_relatorio: nrRelatorio ?? undefined };
  }

  async function salvarDetalhe() {
    if (!detalhe || nrRelatorio == null) return;
    if (detalhe.tipo === "banda" || detalhe.tipo === "elemento") {
      const problema = detalhe.tipo === "banda" ? problemaDaBanda(detalhe.banda) : problemaDoElemento(elementoNormalizado(detalhe.elemento));
      if (problema) {
        setErrosDetalhe(problema.campos);
        onToast?.(problema.mensagem, "error");
        return;
      }
    } else {
      const p = detalhe.parametro;
      const faltantes = ["ds_parametro", "cd_atributo", "ds_label", "nr_ordem", "vl_padrao"].filter((c) => {
        const vazio = String(p[c as keyof ParametroSql] ?? "").trim() === "";
        return vazio && statusDe(parametroCampoRegras, c) === "O";
      });
      if (faltantes.length > 0) {
        setErrosDetalhe(faltantes);
        onToast?.("Preencha os campos obrigatórios.", "error");
        return;
      }
      // Preenchido, o Atributo precisa ser um nome válido de parâmetro (o :nome do SQL).
      const nome = nomeDoParametro(p.cd_atributo);
      if (nome && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(nome)) {
        setErrosDetalhe(["cd_atributo"]);
        onToast?.("O Atributo deve ser o nome usado no SQL (letras, números e _, sem espaços).", "error");
        return;
      }
      if (nome && parametros.some((x) => x.id !== p.id && nomeDoParametro(x.cd_atributo).toLowerCase() === nome.toLowerCase())) {
        setErrosDetalhe(["cd_atributo"]);
        onToast?.(`Já existe o parâmetro :${nome} neste relatório.`, "error");
        return;
      }
    }
    setErrosDetalhe([]);
    setGravando(true);
    try {
      if (detalhe.tipo === "banda") {
        const salva = await salvarBandaSql(bandaParaGravar(detalhe.banda));
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
      if (somenteLeitura) return;
      if (ehBandas) {
        if (detalhe) { if (!gravando) void salvarDetalhe(); }
        // Linha em edição na lista: grava sem passar para a de baixo.
        else if (edicaoLinha) void salvarLinha();
      }
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
  // Colunas de Bandas e Elementos: na linha em edição (lápis), os campos editáveis; os
  // desabilitados (pela regra do perfil ou pelo tipo) ficam como no formulário.
  const desBanda = (campo: string) => statusDe(bandaCampoRegras, campo) === "D";
  const colunasDeBanda: ResizableTableColumn<BandaSql>[] = [
    { key: "nr_sequencia", label: "#", render: (b) => String(b.nr_sequencia ?? "") },
    {
      key: "ds_banda",
      label: "Descrição",
      render: (b) => {
        const e = bandaEmEdicao(b);
        return e ? inputLinha("ds_banda", e.ds_banda, (t) => alterarLinha({ ds_banda: t }), desBanda("ds_banda")) : b.ds_banda ?? "";
      },
    },
    {
      key: "nr_ordem",
      label: "Ordem",
      render: (b) => {
        const e = bandaEmEdicao(b);
        // Só na banda Detalhe.
        if (e) return inputLinha("nr_ordem", bandaEhDetalhe(e) ? e.nr_ordem : null, (t) => alterarLinha({ nr_ordem: textoParaOrdem(t) }), !bandaEhDetalhe(e) || desBanda("nr_ordem"));
        return bandaEhDetalhe(b) && b.nr_ordem != null ? String(b.nr_ordem) : "";
      },
    },
    ...(relatorioPdf
      ? [
          {
            key: "ie_tipo",
            label: "Tipo",
            render: (b: BandaSql) => {
              const e = bandaEmEdicao(b);
              if (!e) return TIPOS_BANDA.find((t) => t.value === b.ie_tipo)?.label ?? "";
              return campoLinha("ie_tipo", (
                <Select
                  value={e.ie_tipo ?? ""}
                  onChange={(v) => alterarLinha({ ie_tipo: (v || null) as TipoBanda | null })}
                  options={TIPOS_BANDA}
                  disabled={desBanda("ie_tipo")}
                  error={errosLinha.includes("ie_tipo")}
                  className={SELECT_LINHA}
                />
              ));
            },
          },
          {
            key: "qt_altura",
            label: "Altura",
            render: (b: BandaSql) => {
              const e = bandaEmEdicao(b);
              if (!e) return b.qt_altura == null ? "" : String(b.qt_altura);
              return inputLinha("qt_altura", e.qt_altura, (t) => {
                const digitos = t.replace(/\D/g, "").replace(/^0+/, "").slice(0, 5);
                alterarLinha({ qt_altura: digitos === "" ? null : Number(digitos) });
              }, desBanda("qt_altura"));
            },
          },
        ]
      : []),
    ...colunasAuditoria<BandaSql>(),
    // Coluna nova no fim: a ordem e a largura salvas das colunas são por posição.
    ...(relatorioPdf
      ? [{
          key: "nr_seq_banda_superior",
          label: "Banda superior",
          render: (b: BandaSql) => {
            const e = bandaEmEdicao(b);
            if (!e) return nomeDaBanda(b.nr_seq_banda_superior);
            const naoDetalhe = !bandaEhDetalhe(e);
            return campoLinha("nr_seq_banda_superior", (
              <Select
                value={naoDetalhe ? "" : String(e.nr_seq_banda_superior ?? "")}
                onChange={(v) => alterarLinha({ nr_seq_banda_superior: v || null })}
                options={opcoesBandaSuperior(e)}
                disabled={naoDetalhe || desBanda("nr_seq_banda_superior")}
                error={errosLinha.includes("nr_seq_banda_superior")}
                className={SELECT_LINHA}
              />
            ));
          },
        }]
      : []),
  ];
  /** Medidas em pixels: só o número (o px fica no infobutton do campo). */
  const px = (v: unknown) => (v === null || v === undefined || v === "" ? "" : String(v));
  /** Campo do elemento na linha em edição: vazio e desabilitado quando o tipo não usa o campo. */
  const inputElementoLinha = (e: ElementoBanda, campo: "ds_elemento" | "ds_label" | "cd_alias" | "qt_esquerda" | "qt_topo" | "qt_largura" | "qt_altura") => {
    const ehPx = campo.startsWith("qt_");
    const minimo1 = campo === "qt_largura" || campo === "qt_altura";
    return inputLinha(
      campo,
      elementoDesabilitadoPeloTipo(e, campo) ? null : e[campo],
      (t) => alterarLinha({ [campo]: ehPx ? mascararPx(t, minimo1) : t }),
      elementoDesabilitado(e, campo),
    );
  };
  const colunaElemento = (
    key: "ds_elemento" | "ds_label" | "cd_alias" | "qt_esquerda" | "qt_topo" | "qt_largura" | "qt_altura",
    label: string,
    exibir: (el: ElementoBanda) => string,
  ): ResizableTableColumn<ElementoBanda> => ({
    key,
    label,
    render: (el) => {
      const e = elementoEmEdicao(el);
      return e ? inputElementoLinha(e, key) : exibir(el);
    },
  });
  const colunasDeElemento: ResizableTableColumn<ElementoBanda>[] = [
    { key: "nr_sequencia", label: "#", render: (e) => String(e.nr_sequencia ?? "") },
    {
      key: "nr_camada",
      label: "Camada",
      render: (el) => {
        const e = elementoEmEdicao(el);
        if (e) return inputLinha("nr_camada", e.nr_camada, (t) => alterarLinha({ nr_camada: textoParaOrdem(t) }), elementoDesabilitado(e, "nr_camada"));
        return el.nr_camada == null || el.nr_camada === "" ? "" : String(el.nr_camada);
      },
    },
    colunaElemento("ds_elemento", "Descrição", (e) => e.ds_elemento ?? ""),
    {
      key: "ie_tipo",
      label: "Tipo",
      render: (el) => {
        const e = elementoEmEdicao(el);
        if (!e) return TIPOS_ELEMENTO.find((t) => t.value === el.ie_tipo)?.label ?? "";
        return campoLinha("ie_tipo", (
          <Select
            value={tipoDoElemento(e)}
            onChange={(v) => alterarLinha({ ie_tipo: (TIPOS_ELEMENTO.some((t) => t.value === v) ? v : "sql") as TipoElemento })}
            options={TIPOS_ELEMENTO}
            showPlaceholder={false}
            disabled={elementoDesabilitado(e, "ie_tipo")}
            error={errosLinha.includes("ie_tipo")}
            className={SELECT_LINHA}
          />
        ));
      },
    },
    ...(bandaComLabels ? [colunaElemento("ds_label", "Label", (e) => e.ds_label ?? "")] : []),
    colunaElemento("cd_alias", "Atributo", (e) => e.cd_alias ?? ""),
    colunaElemento("qt_esquerda", "Esquerda", (e) => px(e.qt_esquerda)),
    colunaElemento("qt_topo", "Topo", (e) => px(e.qt_topo)),
    colunaElemento("qt_largura", "Tamanho", (e) => px(e.qt_largura)),
    colunaElemento("qt_altura", "Altura", (e) => px(e.qt_altura)),
    ...colunasAuditoria<ElementoBanda>(),
  ];
  const colunasDeParametro: ResizableTableColumn<ParametroSql>[] = [
    { key: "nr_sequencia", label: "#", render: (p) => String(p.nr_sequencia ?? "") },
    { key: "ds_parametro", label: "Descrição do parâmetro", render: (p) => p.ds_parametro ?? "" },
    { key: "cd_atributo", label: "Atributo", render: (p) => p.cd_atributo ?? "" },
    { key: "ds_label", label: "Label", render: (p) => p.ds_label ?? "" },
    { key: "nr_ordem", label: "Ordem", render: (p) => (p.nr_ordem ?? "") === "" ? "" : String(p.nr_ordem ?? "") },
    { key: "vl_padrao", label: "Valor padrão", render: (p) => p.vl_padrao ?? "" },
    { key: "ie_perguntar", label: "Perguntar", render: (p) => simNao(p.ie_perguntar) },
    { key: "ie_obrigatorio", label: "Obrigatório", render: (p) => simNao(p.ie_obrigatorio) },
    ...colunasAuditoria<ParametroSql>(),
  ];

  /** Descrição da banda pelo nr_sequencia (coluna e campo Banda superior). */
  function nomeDaBanda(nr: unknown): string {
    if (nr === null || nr === undefined || nr === "") return "";
    return bandas.find((b) => String(b.nr_sequencia) === String(nr))?.ds_banda ?? "";
  }
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
      .map((b) => ({ value: String(b.nr_sequencia), label: b.ds_banda ?? "" }));
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
      // Esquerda, Topo, Tamanho e Altura começam vazios (vazio = 0); Alinhamento e Fonte com o padrão.
      setDetalhe({ tipo: "elemento", elemento: { ie_tipo: "sql", ie_alinhamento: ALINHAMENTO_ELEMENTO_PADRAO, ie_fonte: FONTE_ELEMENTO_PADRAO } });
      return;
    }
    if (aba === "bandas") {
      setDetalhe({ tipo: "banda", banda: { ds_banda: "", ds_sql: "", ie_tipo: relatorioPdf ? "detalhe" : null, qt_altura: null } });
    } else {
      setDetalhe({ tipo: "parametro", parametro: { ds_parametro: "", cd_atributo: "", ds_label: "", nr_ordem: null, vl_padrao: "", ie_perguntar: "N", ie_obrigatorio: "N" } });
    }
  }
  /** Ativa ou inativa a banda, o elemento ou o parâmetro (menu de contexto). */
  async function alternarStatus(tipo: "banda" | "parametro" | "elemento", item: BandaSql | ParametroSql | ElementoBanda) {
    if (!item.id) return;
    const novo = item.ie_status === "I" ? "A" : "I";
    const tabela = tipo === "banda" ? "relatorio_banda" : tipo === "elemento" ? "relatorio_banda_elemento" : "relatorio_parametro";
    const nome = tipo === "banda" ? "Banda" : tipo === "elemento" ? "Elemento" : "Parâmetro";
    const sufixo = tipo === "banda" ? "a" : "o";
    setGravando(true);
    try {
      const salvo = { ...item, ...(await alterarStatusItem<typeof item>(tabela, item.id, novo)), ie_status: novo } as typeof item;
      if (tipo === "banda") setBandas((lista) => lista.map((b) => (b.id === item.id ? (salvo as BandaSql) : b)));
      else if (tipo === "elemento") setElementos((lista) => lista.map((x) => (x.id === item.id ? (salvo as ElementoBanda) : x)));
      else setParametros((lista) => lista.map((p) => (p.id === item.id ? (salvo as ParametroSql) : p)));
      // Formulário aberto do item: acompanha o status (sem perder o que estiver sendo editado).
      setDetalhe((d) => {
        if (!d) return d;
        if (d.tipo === "banda" && d.banda.id === item.id) return { tipo: "banda", banda: { ...d.banda, ie_status: novo } };
        if (d.tipo === "elemento" && d.elemento.id === item.id) return { tipo: "elemento", elemento: { ...d.elemento, ie_status: novo } };
        if (d.tipo === "parametro" && d.parametro.id === item.id) return { tipo: "parametro", parametro: { ...d.parametro, ie_status: novo } };
        return d;
      });
      onToast?.(`${nome} ${novo === "I" ? `inativad${sufixo}` : `ativad${sufixo}`} com sucesso!`, "success");
    } catch (e) {
      onToast?.(e instanceof Error && e.message ? e.message : "Erro ao alterar o status.", "error");
    } finally {
      setGravando(false);
    }
  }
  /** Duplica a banda (com os elementos dela) ou o elemento, no fim da lista. */
  async function duplicar(tipo: "banda" | "elemento", item: BandaSql | ElementoBanda) {
    if (!item.id) return;
    if (tipo === "banda" && relatorioPdf && ((item as BandaSql).ie_tipo === "cabecalho" || (item as BandaSql).ie_tipo === "rodape")) {
      onToast?.(`O relatório só pode ter uma banda do tipo ${(item as BandaSql).ie_tipo === "cabecalho" ? "Cabeçalho" : "Rodapé"}.`, "error");
      return;
    }
    setGravando(true);
    try {
      if (tipo === "banda") {
        const { banda } = await duplicarBandaSql({ ...(item as BandaSql), nr_seq_relatorio: nrRelatorio ?? undefined });
        setBandas((lista) => [...lista, banda]);
        setSelecionadoId(banda.id ?? null);
        onToast?.("Banda duplicada com sucesso!", "success");
      } else {
        const copia = await duplicarElementoBanda(item as ElementoBanda);
        setElementos((lista) => [...lista, copia]);
        setSelecionadoId(copia.id ?? null);
        onToast?.("Elemento duplicado com sucesso!", "success");
      }
    } catch (e) {
      onToast?.(e instanceof Error && e.message ? e.message : "Erro ao duplicar.", "error");
    } finally {
      setGravando(false);
    }
  }
  /* ── Edição na lista (lápis) ── */
  /**
   * Grava a linha em edição (sem alteração, não grava nada). Com `abaixo` (Enter), passa a
   * editar a linha de baixo; sem ela (ou sem linha abaixo), encerra a edição. Com problema
   * (campo obrigatório, Cabeçalho repetido...), continua na linha. Devolve se terminou.
   */
  async function salvarLinha(abaixo = false): Promise<boolean> {
    const atual = edicaoLinha;
    if (!atual || nrRelatorio == null || gravandoLinhaRef.current) return false;
    // Na ordem em que a lista aparece (Enter passa para a linha de baixo).
    const lista: { id?: string }[] = atual.tipo === "banda" ? bandasOrdenadas : elementosOrdenados;
    const indice = lista.findIndex((x) => x.id === atual.item.id);
    const original = lista[indice];
    const proxima = abaixo && indice >= 0 ? lista[indice + 1] : undefined;
    if (!original || JSON.stringify(original) !== JSON.stringify(atual.item)) {
      const problema = atual.tipo === "banda" ? problemaDaBanda(atual.item) : problemaDoElemento(elementoNormalizado(atual.item));
      if (problema) {
        setErrosLinha(problema.campos);
        onToast?.(problema.mensagem, "error");
        return false;
      }
      gravandoLinhaRef.current = true;
      try {
        if (atual.tipo === "banda") {
          const salva = await salvarBandaSql(bandaParaGravar(atual.item));
          setBandas((l) => l.map((b) => (b.id === salva.id ? salva : b)));
          onToast?.("Banda atualizada com sucesso!", "success");
        } else {
          if (!bandaElementos?.nr_sequencia) return false;
          const salvo = await salvarElementoBanda({ ...elementoNormalizado(atual.item), nr_seq_banda: Number(bandaElementos.nr_sequencia), nr_seq_relatorio: nrRelatorio });
          setElementos((l) => l.map((x) => (x.id === salvo.id ? salvo : x)));
          onToast?.("Elemento atualizado com sucesso!", "success");
        }
      } catch (e) {
        onToast?.(e instanceof Error && e.message ? e.message : "Erro ao salvar.", "error");
        return false;
      } finally {
        gravandoLinhaRef.current = false;
      }
    }
    setErrosLinha([]);
    if (proxima?.id) {
      // Linha de baixo em outra página: a lista vai para a página dela.
      const paginacao = atual.tipo === "banda" ? paginacaoBandas : paginacaoElementos;
      if (paginacao.pageSize !== "all") {
        const pagina = Math.floor((indice + 1) / paginacao.pageSize) + 1;
        if (pagina !== paginacao.currentPage) paginacao.setCurrentPage(pagina);
      }
      setSelecionadoId(proxima.id);
      setEdicaoLinha(atual.tipo === "banda" ? { tipo: "banda", item: { ...(proxima as BandaSql) } } : { tipo: "elemento", item: { ...(proxima as ElementoBanda) } });
    } else {
      focoLinhaRef.current = null;
      setEdicaoLinha(null);
    }
    return true;
  }
  /** Lápis: começa a editar a linha (a que estava em edição é gravada antes). */
  async function iniciarEdicaoLinha(tipo: "banda" | "elemento", item: BandaSql | ElementoBanda) {
    if (somenteLeitura || !item.id) return;
    if (edicaoLinha) {
      if (edicaoLinha.item.id === item.id) return;
      if (!(await salvarLinha())) return;
    }
    focoLinhaRef.current = null;
    setErrosLinha([]);
    setSelecionadoId(item.id);
    setEdicaoLinha(tipo === "banda" ? { tipo: "banda", item: { ...(item as BandaSql) } } : { tipo: "elemento", item: { ...(item as ElementoBanda) } });
  }
  function cancelarEdicaoLinha() {
    focoLinhaRef.current = null;
    setErrosLinha([]);
    setEdicaoLinha(null);
  }
  const alterarLinha = (mudanca: Partial<BandaSql> | Partial<ElementoBanda>) =>
    setEdicaoLinha((e) => (e ? ({ ...e, item: { ...e.item, ...mudanca } } as EdicaoLinha) : e));
  // Linha nova em edição: o foco vai para o mesmo campo da linha anterior (Enter) ou para o primeiro.
  const idEmEdicao = edicaoLinha?.item.id;
  useEffect(() => {
    if (!idEmEdicao) return;
    const raiz = listaRef.current;
    if (!raiz) return;
    const habilitado = (seletor: string) => raiz.querySelector<HTMLElement>(`${seletor} input:not(:disabled), ${seletor} button:not(:disabled)`);
    const alvo = (focoLinhaRef.current ? habilitado(`[data-campo="${focoLinhaRef.current}"]`) : null) ?? habilitado("[data-campo]");
    alvo?.focus();
    if (alvo instanceof HTMLInputElement) alvo.select();
  }, [idEmEdicao]);
  /** Teclas nos campos da linha: Enter grava e desce; Esc descarta (com a lista do dropdown aberta, valem para ela). */
  function teclaNaLinha(e: ReactKeyboardEvent<HTMLDivElement>) {
    const listaAberta = (e.target as HTMLElement).getAttribute("aria-expanded") === "true";
    if (listaAberta) return;
    if (e.key === "Enter" && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      focoLinhaRef.current = e.currentTarget.dataset.campo ?? null;
      void salvarLinha(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      cancelarEdicaoLinha();
    }
  }
  /** Campo da linha em edição. Cliques não chegam à linha (o duplo clique abriria a banda). */
  const campoLinha = (campo: string, conteudo: ReactNode) => (
    <div data-campo={campo} onKeyDownCapture={teclaNaLinha} onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
      {conteudo}
    </div>
  );
  const classeCampoLinha = (campo: string) => (errosLinha.includes(campo) ? `${INPUT_LINHA} !border-red-500` : INPUT_LINHA);
  const inputLinha = (campo: string, valor: unknown, onChange: (texto: string) => void, desabilitado: boolean) =>
    campoLinha(
      campo,
      <input
        value={desabilitado && valor == null ? "" : String(valor ?? "")}
        onChange={(e) => onChange(e.target.value)}
        disabled={desabilitado}
        inputMode={campo.startsWith("qt_") || campo === "nr_ordem" || campo === "nr_camada" ? "numeric" : undefined}
        aria-label={campo}
        className={classeCampoLinha(campo)}
      />,
    );
  const bandaEmEdicao = (b: BandaSql) => (edicaoLinha?.tipo === "banda" && edicaoLinha.item.id === b.id ? edicaoLinha.item : null);
  const elementoEmEdicao = (el: ElementoBanda) => (edicaoLinha?.tipo === "elemento" && edicaoLinha.item.id === el.id ? edicaoLinha.item : null);
  /**
   * Lápis da linha: sobreposto à 1ª coluna (com fundo desfocado), aparece com o cursor sobre
   * a linha. Na linha em edição não aparece (gravar e cancelar ficam no rodapé).
   */
  function lapisDaLinha(tipo: "banda" | "elemento", row: BandaSql | ElementoBanda): ReactNode {
    if (somenteLeitura || !row.id) return null;
    if (edicaoLinha?.tipo === tipo && edicaoLinha.item.id === row.id) return null;
    return (
      <button
        type="button"
        aria-label="Editar na lista"
        className="inline-flex items-center justify-center bg-transparent border-none p-0 cursor-pointer"
        onClick={(e) => { e.stopPropagation(); void iniciarEdicaoLinha(tipo, row); }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      </button>
    );
  }
  /**
   * Rodapé das listas de Bandas, Elementos e Parâmetros: o mesmo das demais telas de
   * registros (página, registros por página e quantidade). Com uma linha em edição, dá
   * lugar aos botões Cancelar e Salvar.
   */
  function rodapeDaLista(total: number, paginacao: ReturnType<typeof usePagination>, comEdicao: boolean) {
    if (comEdicao && edicaoLinha) {
      return (
        <div className="bg-white/95 backdrop-blur-sm px-0 pt-3 pb-0 sticky bottom-0 z-10">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={cancelarEdicaoLinha}
              className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
              style={{ backgroundColor: "#bdbdbd", borderBottomColor: "#000" }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => { void salvarLinha(); }}
              className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
              style={{ backgroundColor: "#003056", borderBottomColor: "#000" }}
            >
              Salvar
            </button>
          </div>
        </div>
      );
    }
    return (
      <PaginationFooter
        totalRecords={total}
        currentPage={paginacao.currentPage}
        pageSize={paginacao.pageSize}
        onPageChange={paginacao.setCurrentPage}
        onPageSizeChange={paginacao.setPageSize}
      />
    );
  }

  /**
   * Menu de contexto de uma linha: Ver, Gerar relatório (o relatório aberto, com a permissão
   * de gerar e ativo), Duplicar (banda e elemento), Ativar/Inativar e Excluir.
   */
  function acoesDoItem(tipo: "banda" | "parametro" | "elemento", item: BandaSql | ParametroSql | ElementoBanda): ContextMenuItem[] {
    const ver = tipo === "elemento" ? () => abrirElemento(item as ElementoBanda) : () => abrir(item as BandaSql | ParametroSql);
    const gerar = onGerarRelatorio ? [{ label: "Gerar relatório", onClick: onGerarRelatorio }] : [];
    // Relatório Quasar: só ver (e gerar).
    if (somenteLeitura) return [{ label: "Ver", onClick: ver }, ...gerar];
    return [
      { label: "Ver", onClick: ver },
      ...gerar,
      ...(tipo !== "parametro" ? [{ label: "Duplicar", onClick: () => { void duplicar(tipo, item as BandaSql | ElementoBanda); } }] : []),
      { label: item.ie_status === "I" ? "Ativar" : "Inativar", onClick: () => { void alternarStatus(tipo, item); } },
      { label: "Excluir", onClick: () => excluir(tipo, item) },
    ];
  }
  /** Inativo: mesmo estilo do colaborador Desligado. */
  const classeDaLinha = (item: { id?: string; ie_status?: string | null }) =>
    `${item.id === selecionadoId ? "row-selected" : ""} ${item.ie_status === "I" ? "registro-desligado" : ""}`;
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
  /**
   * Setas do formulário aberto (banda, elemento ou parâmetro): o registro anterior ou o
   * seguinte da lista, como as setas do "Ver" do relatório. O que não foi salvo é descartado.
   */
  const listaDoDetalhe: { id?: string }[] = detalhe?.tipo === "banda" ? bandasOrdenadas : detalhe?.tipo === "elemento" ? elementosOrdenados : detalhe?.tipo === "parametro" ? parametrosOrdenados : [];
  const idDoDetalhe = detalhe?.tipo === "banda" ? detalhe.banda.id : detalhe?.tipo === "elemento" ? detalhe.elemento.id : detalhe?.tipo === "parametro" ? detalhe.parametro.id : undefined;
  const indiceDoDetalhe = idDoDetalhe ? listaDoDetalhe.findIndex((x) => x.id === idDoDetalhe) : -1;
  function navegarDetalhe(passo: -1 | 1) {
    if (!detalhe || indiceDoDetalhe < 0) return;
    const alvo = listaDoDetalhe[indiceDoDetalhe + passo];
    if (!alvo) return;
    if (detalhe.tipo === "elemento") abrirElemento(alvo as ElementoBanda);
    else abrir(alvo as BandaSql | ParametroSql);
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
  const mostraRodape = !ehBandas || !!detalhe;

  return (
    <div
      className="flex-1 flex flex-col min-h-0"
      onContextMenu={(e) => {
        // "Ver" de uma banda, elemento ou parâmetro: o menu do item (o mesmo da lista, sem o Ver).
        if (ehBandas && detalhe) {
          const item = detalhe.tipo === "banda" ? detalhe.banda : detalhe.tipo === "elemento" ? detalhe.elemento : detalhe.parametro;
          if (!item.id) return;
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY, acoes: acoesDoItem(detalhe.tipo, item).filter((a) => a.label !== "Ver") });
          return;
        }
        // Menu do relatório só no "Ver" dele. Nas listas de Bandas, Elementos e Parâmetros não
        // (o menu de cada item tem o Gerar relatório).
        if (ehBandas || contextMenuItems.length === 0) return;
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
            className="!w-[220px]"
            disabled
          />
          {/* Setas: no "Ver" do relatório, entre os relatórios; no formulário da banda, do
              elemento ou do parâmetro, entre os registros da lista dele. */}
          {(!ehBandas || detalhe) && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={ehBandas ? () => navegarDetalhe(-1) : onPrevRecord}
                disabled={ehBandas ? indiceDoDetalhe <= 0 : !hasPrevRecord}
                className={BOTAO_NAV}
                style={{ borderBottomColor: "#000" }}
                aria-label="Registro anterior"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18 9 12l6-6" /></svg>
              </button>
              <button
                type="button"
                onClick={ehBandas ? () => navegarDetalhe(1) : onNextRecord}
                disabled={ehBandas ? indiceDoDetalhe < 0 || indiceDoDetalhe >= listaDoDetalhe.length - 1 : !hasNextRecord}
                className={BOTAO_NAV}
                style={{ borderBottomColor: "#000" }}
                aria-label="Próximo registro"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18 15 12 9 6" /></svg>
              </button>
            </div>
          )}
          {relatorio && (
            <NavegacaoRegistros
              className="ml-2"
              itens={[
                { chave: "relatorio", texto: `Relatório: ${relatorio.nr_sequencia ?? ""} ${relatorio.ds_relatorio ?? ""}`, onClick: () => onNavigateToList?.() },
                ...(bandaElementos
                  ? [{ chave: "banda-elementos", texto: `Banda: ${bandaElementos.nr_sequencia ?? ""} ${bandaElementos.ds_banda ?? ""}`, onClick: () => { setDetalhe(null); setBandaElementos(null); } }]
                  : []),
                ...(detalhe
                  ? [{
                      chave: "detalhe",
                      texto: detalhe.tipo === "banda"
                        ? `Banda: ${detalhe.banda.nr_sequencia ?? "nova"} ${detalhe.banda.ds_banda ?? ""}`
                        : detalhe.tipo === "elemento"
                          ? `Elemento: ${detalhe.elemento.nr_sequencia ?? "novo"} ${detalhe.elemento.ds_elemento ?? ""}`
                          : `Parâmetro: ${detalhe.parametro.nr_sequencia ?? "novo"} ${detalhe.parametro.ds_parametro ?? ""}`,
                      onClick: () => setDetalhe(null),
                    }]
                  : []),
              ]}
            />
          )}
        </div>
        <div className="flex items-center gap-3">
          {ehBandas && !detalhe && !bandaElementos && (
            <AbasRegistros
              abas={[{ valor: "bandas", rotulo: "Bandas" }, { valor: "parametros", rotulo: "Parâmetros" }]}
              ativa={aba}
              onChange={(a) => { setAba(a); setSelecionadoId(null); }}
            />
          )}
          {ehBandas && !detalhe && !somenteLeitura && (
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
          {/* Relatório Quasar: os formulários ficam só para ver (campos desabilitados, infobuttons ativos). */}
          <FormularioSomenteLeitura empilhar={false} ativo={somenteLeitura && (!ehBandas || !!detalhe)}>
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
                    {/* Origem: só exibida (Criação, Importação ou Quasar); relatório novo = Criação. */}
                    {rotulo("Origem", "relatorio", "ie_origem", campoRegras)}
                    <Select value={relatorio?.ie_origem ?? "C"} onChange={() => {}} options={ORIGEM_OPTIONS} showPlaceholder={false} disabled />
                  </div>
                  <div className="sm:col-span-4">
                    {rotulo("Descrição", "relatorio", "ds_relatorio", campoRegras)}
                    <input
                      value={dsRelatorio}
                      onChange={(e) => setDsRelatorio(e.target.value)}
                      disabled={statusDe(campoRegras, "ds_relatorio") === "D"}
                      className={comErro([...errosDetalhe, ...campoErros], "ds_relatorio")}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    {rotulo("Formato", "relatorio", "ie_formato", campoRegras)}
                    <Select value={formato} onChange={(v) => setFormato(v === "pdf" ? "pdf" : "xls")} options={FORMATO_OPTIONS} showPlaceholder={false} disabled={statusDe(campoRegras, "ie_formato") === "D"} />
                  </div>
                  <div className="sm:col-span-2">
                    {rotulo("Status", "relatorio", "ie_status", campoRegras)}
                    <Select value={status === "I" ? "I" : "A"} onChange={(v) => setStatus(v === "I" ? "I" : "A")} options={STATUS_OPTIONS} showPlaceholder={false} disabled={statusDe(campoRegras, "ie_status") === "D"} />
                  </div>
                  <div className="sm:col-span-12">
                    {rotulo("SQL", "relatorio", "ds_sql", campoRegras)}
                    <textarea
                      value={sqlCapa}
                      onChange={(e) => setSqlCapa(e.target.value)}
                      disabled={statusDe(campoRegras, "ds_sql") === "D"}
                      rows={LINHAS_SQL}
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
            <section ref={listaRef} className="h-full flex min-h-0 flex-col">
              {carregandoElementos ? (
                <LoadingModal open message="Carregando..." />
              ) : elementos.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
                  <p className="mt-4 font-medium text-slate-500">Nenhum registro encontrado.</p>
                  <p className="mt-1 text-sm text-slate-500">Clique em &quot;Adicionar&quot; para cadastrar os elementos da banda (o estilo, o alinhamento e a posição das informações).</p>
                </div>
              ) : (
                <>
                <div className="min-h-0 flex-1 overflow-auto">
                <ResizableTable<ElementoBanda>
                  {...ordenacaoElementos}
                  columns={colunasDeElemento}
                  rows={paginacaoElementos.slice(elementosOrdenados)}
                  rowKey={(e) => String(e.id ?? e.nr_sequencia)}
                  onRowClick={(e) => setSelecionadoId(e.id ?? null)}
                  // Sem duplo clique: o elemento abre pelo "Ver" do menu de contexto (ou é editado pelo lápis).
                  rowClassName={classeDaLinha}
                  rowOverlay={(el) => lapisDaLinha("elemento", el)}
                  onRowContextMenu={(el, e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelecionadoId(el.id ?? null);
                    setMenu({ x: e.clientX, y: e.clientY, acoes: acoesDoItem("elemento", el) });
                  }}
                />
                </div>
                {rodapeDaLista(elementos.length, paginacaoElementos, true)}
                </>
              )}
            </section>
          )}

          {ehBandas && !detalhe && !bandaElementos && (
            <section ref={listaRef} className="h-full flex min-h-0 flex-col">
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
                <>
                <div className="min-h-0 flex-1 overflow-auto">
                <ResizableTable<BandaSql>
                  {...colunasBandas}
                  {...ordenacaoBandas}
                  columns={colunasDeBanda}
                  rows={paginacaoBandas.slice(bandasOrdenadas)}
                  rowKey={(b) => String(b.id ?? b.nr_sequencia)}
                  onRowClick={(b) => setSelecionadoId(b.id ?? null)}
                  // PDF: o duplo clique abre os elementos da banda. XLS: a banda não tem
                  // conteúdo próprio para abrir no duplo clique (só "Ver" no menu).
                  onRowDoubleClick={relatorioPdf ? (b) => { if (!bandaEmEdicao(b)) abrirElementos(b); } : undefined}
                  rowClassName={classeDaLinha}
                  rowOverlay={(b) => lapisDaLinha("banda", b)}
                  onRowContextMenu={(b, e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelecionadoId(b.id ?? null);
                    setMenu({ x: e.clientX, y: e.clientY, acoes: acoesDoItem("banda", b) });
                  }}
                />
                </div>
                {rodapeDaLista(bandas.length, paginacaoBandas, true)}
                </>
              ) : (
                <>
                <div className="min-h-0 flex-1 overflow-auto">
                <ResizableTable<ParametroSql>
                  {...colunasParametros}
                  {...ordenacaoParametros}
                  columns={colunasDeParametro}
                  rows={paginacaoParametros.slice(parametrosOrdenados)}
                  rowKey={(p) => String(p.id ?? p.nr_sequencia)}
                  onRowClick={(p) => setSelecionadoId(p.id ?? null)}
                  onRowDoubleClick={abrir}
                  rowClassName={classeDaLinha}
                  onRowContextMenu={(p, e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelecionadoId(p.id ?? null);
                    setMenu({ x: e.clientX, y: e.clientY, acoes: acoesDoItem("parametro", p) });
                  }}
                />
                </div>
                {rodapeDaLista(parametros.length, paginacaoParametros, false)}
                </>
              )}
            </section>
          )}

          {detalhe?.tipo === "banda" && (() => {
            const banda = detalhe.banda;
            const setBanda = (mudanca: Partial<BandaSql>) => setDetalhe({ tipo: "banda", banda: { ...banda, ...mudanca } });
            const r = (texto: string, campo: string) => rotulo(texto, "relatorio_banda", campo, bandaCampoRegras);
            // Banda superior, opções e fundos: só na banda Detalhe.
            const naoDetalhe = !bandaEhDetalhe(banda);
            return (
              <section>
                <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Banda</h2>
                <div className="space-y-[15px]">
                  {/* Linha 1: Sequência, Descrição, Ordem, Tipo, Banda superior, Altura e Status. */}
                  <div className="grid gap-[15px] sm:grid-cols-12">
                    <div className={relatorioPdf ? "sm:col-span-1" : "sm:col-span-2"}>
                      {r("Sequência", "nr_sequencia")}
                      <input disabled value={String(banda.nr_sequencia ?? "")} className={INPUT} />
                    </div>
                    <div className={relatorioPdf ? "sm:col-span-3" : "sm:col-span-6"}>
                      {r("Descrição", "ds_banda")}
                      <input
                        value={banda.ds_banda ?? ""}
                        onChange={(e) => setBanda({ ds_banda: e.target.value })}
                        disabled={statusDe(bandaCampoRegras, "ds_banda") === "D"}
                        className={comErro(errosDetalhe, "ds_banda")}
                      />
                    </div>
                    <div className={relatorioPdf ? "sm:col-span-1" : "sm:col-span-2"}>
                      {r("Ordem", "nr_ordem")}
                      <input
                        inputMode="numeric"
                        // Só na banda Detalhe (Cabeçalho e Rodapé não têm Ordem).
                        value={naoDetalhe ? "" : String(banda.nr_ordem ?? "")}
                        onChange={(e) => setBanda({ nr_ordem: textoParaOrdem(e.target.value) })}
                        disabled={naoDetalhe || statusDe(bandaCampoRegras, "nr_ordem") === "D"}
                        className={comErro(errosDetalhe, "nr_ordem")}
                      />
                    </div>
                    {relatorioPdf && (
                      <>
                        <div className="sm:col-span-2">
                          {r("Tipo", "ie_tipo")}
                          <Select
                            value={banda.ie_tipo ?? ""}
                            onChange={(v) => setBanda({ ie_tipo: (v || null) as TipoBanda | null })}
                            options={TIPOS_BANDA}
                            disabled={statusDe(bandaCampoRegras, "ie_tipo") === "D"}
                            error={errosDetalhe.includes("ie_tipo")}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          {r("Banda superior", "nr_seq_banda_superior")}
                          <Select
                            value={naoDetalhe ? "" : String(banda.nr_seq_banda_superior ?? "")}
                            onChange={(v) => setBanda({ nr_seq_banda_superior: v || null })}
                            options={opcoesBandaSuperior(banda)}
                            disabled={naoDetalhe || statusDe(bandaCampoRegras, "nr_seq_banda_superior") === "D"}
                            error={errosDetalhe.includes("nr_seq_banda_superior")}
                          />
                        </div>
                        <div className="sm:col-span-1">
                          {r("Altura", "qt_altura")}
                          <input
                            inputMode="numeric"
                            value={banda.qt_altura ?? ""}
                            onChange={(e) => {
                              const digitos = e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 5);
                              setBanda({ qt_altura: digitos === "" ? null : Number(digitos) });
                            }}
                            disabled={statusDe(bandaCampoRegras, "qt_altura") === "D"}
                            className={comErro(errosDetalhe, "qt_altura")}
                          />
                        </div>
                      </>
                    )}
                    <div className="sm:col-span-2">
                      {rotulo("Status", "relatorio_banda", "ie_status", bandaCampoRegras)}
                      <Select value={banda.ie_status === "I" ? "I" : "A"} onChange={(v) => setBanda({ ie_status: v === "I" ? "I" : "A" })} options={STATUS_OPTIONS} showPlaceholder={false} disabled={statusDe(bandaCampoRegras, "ie_status") === "D"} />
                    </div>
                  </div>
                  {/* Linha 2: bordas, opções da banda Detalhe e fundos (Registros e Labels). */}
                  {relatorioPdf && (
                    <div className="flex flex-wrap gap-x-8 gap-y-[15px]">
                      {checkboxesBorda(banda, (campo, marcado) => setBanda({ [campo]: marcado ? "S" : "N" }), "relatorio_banda", bandaCampoRegras)}
                      {OPCOES_DETALHE.map(({ campo, label }) => {
                        // Com cor nos Registros, o Alternar background não vale.
                        const anulada = campo === "ie_alternar_background" && !!banda.cd_background_registro;
                        return campoCheck(label, "relatorio_banda", campo, bandaCampoRegras, !naoDetalhe && !anulada && banda[campo] === "S", (m) => setBanda({ [campo]: m ? "S" : "N" }), naoDetalhe || anulada);
                      })}
                      {(["cd_background_registro", "cd_background_label"] as const).map((campo) => {
                        const label = campo === "cd_background_registro" ? "Registros" : "Labels";
                        // Labels: só com Exibir labels.
                        const desabilitado = naoDetalhe || (campo === "cd_background_label" && banda.ie_exibir_label !== "S") || statusDe(bandaCampoRegras, campo) === "D";
                        return (
                          <div key={campo} className="flex flex-col">
                            {r(label, campo)}
                            <CampoCorPaleta
                              valor={desabilitado ? "" : banda[campo] ?? ""}
                              onChange={(v) => setBanda({ [campo]: v || null, ...(campo === "cd_background_registro" && v ? { ie_alternar_background: "N" as const } : {}) })}
                              disabled={desabilitado}
                              erro={errosDetalhe.includes(campo)}
                              rotuloAcessivel={label}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Linha 3: SQL. */}
                  <div>
                    {r("SQL", "ds_sql")}
                    <textarea
                      value={banda.ds_sql ?? ""}
                      onChange={(e) => setBanda({ ds_sql: e.target.value })}
                      disabled={statusDe(bandaCampoRegras, "ds_sql") === "D"}
                      // Mesmo estilo dos campos Observação do sistema.
                      rows={LINHAS_SQL}
                      spellCheck={false}
                      className={`${comErro(errosDetalhe, "ds_sql")} resize-none`}
                    />
                  </div>
                </div>
              </section>
            );
          })()}

          {detalhe?.tipo === "elemento" && (() => {
            const el = detalhe.elemento;
            const setEl = (mudanca: Partial<ElementoBanda>) => setDetalhe({ tipo: "elemento", elemento: { ...el, ...mudanca } });
            const r = (texto: string, campo: string) => rotulo(texto, "relatorio_banda_elemento", campo, elementoCampoRegras);
            const des = (campo: CampoElemento) => elementoDesabilitado(el, campo);
            const tipoAtual = tipoDoElemento(el);
            const valorDesabilitado = (campo: CampoElemento, valor: unknown) => (elementoDesabilitadoPeloTipo(el, campo) ? "" : String(valor ?? ""));
            const inputPx = (campo: "qt_esquerda" | "qt_topo" | "qt_largura" | "qt_altura" | "qt_padding_superior" | "qt_padding_inferior" | "qt_padding_esquerda" | "qt_padding_direita", texto: string, minimo1: boolean) => (
              <div>
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
                <div className="space-y-[15px]">
                  {/* Linha 1: Sequência, Camada, Descrição, Tipo e Imagem. */}
                  <div className="grid gap-[15px] sm:grid-cols-12">
                    <div className="sm:col-span-1">
                      {r("Sequência", "nr_sequencia")}
                      <input disabled value={String(el.nr_sequencia ?? "")} className={INPUT} />
                    </div>
                    <div className="sm:col-span-1">
                      {r("Camada", "nr_camada")}
                      <input
                        inputMode="numeric"
                        value={String(el.nr_camada ?? "")}
                        onChange={(e) => setEl({ nr_camada: textoParaOrdem(e.target.value) })}
                        disabled={des("nr_camada")}
                        className={comErro(errosDetalhe, "nr_camada")}
                      />
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
                  </div>
                  {/* Linha 2: posição, tamanho e padding (px). */}
                  <div className="grid gap-[15px] sm:grid-cols-4 lg:grid-cols-8">
                    {inputPx("qt_esquerda", "Esquerda", false)}
                    {inputPx("qt_topo", "Topo", false)}
                    {inputPx("qt_largura", "Tamanho", true)}
                    {inputPx("qt_altura", "Altura", true)}
                    {inputPx("qt_padding_superior", "Padding superior", false)}
                    {inputPx("qt_padding_inferior", "Padding inferior", false)}
                    {inputPx("qt_padding_esquerda", "Padding esquerda", false)}
                    {inputPx("qt_padding_direita", "Padding direita", false)}
                  </div>
                  {/* Linha 3: Alinhamento, Fonte, Tamanho da fonte, Estilo, Máscara, Casas decimais e Status. */}
                  <div className="grid gap-[15px] sm:grid-cols-4 lg:grid-cols-7">
                    <div>
                      {r("Alinhamento", "ie_alinhamento")}
                      <Select value={elementoDesabilitadoPeloTipo(el, "ie_alinhamento") ? "" : el.ie_alinhamento || ALINHAMENTO_ELEMENTO_PADRAO} onChange={(v) => setEl({ ie_alinhamento: v || ALINHAMENTO_ELEMENTO_PADRAO })} options={ALINHAMENTOS_ELEMENTO} showPlaceholder={false} disabled={des("ie_alinhamento")} error={errosDetalhe.includes("ie_alinhamento")} />
                    </div>
                    <div>
                      {r("Fonte", "ie_fonte")}
                      <Select value={elementoDesabilitadoPeloTipo(el, "ie_fonte") ? "" : el.ie_fonte || FONTE_ELEMENTO_PADRAO} onChange={(v) => setEl({ ie_fonte: v || FONTE_ELEMENTO_PADRAO })} options={FONTES_ELEMENTO} showPlaceholder={false} disabled={des("ie_fonte")} error={errosDetalhe.includes("ie_fonte")} />
                    </div>
                    <div>
                      {r("Tamanho da fonte", "qt_fonte")}
                      <input
                        inputMode="numeric"
                        value={valorDesabilitado("qt_fonte", el.qt_fonte)}
                        onChange={(e) => setEl({ qt_fonte: e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 3) || null })}
                        disabled={des("qt_fonte")}
                        className={comErro(errosDetalhe, "qt_fonte")}
                      />
                    </div>
                    <div>
                      {r("Estilo", "ie_estilo")}
                      <Select value={valorDesabilitado("ie_estilo", el.ie_estilo)} onChange={(v) => setEl({ ie_estilo: v || null })} options={ESTILOS_ELEMENTO} disabled={des("ie_estilo")} error={errosDetalhe.includes("ie_estilo")} />
                    </div>
                    <div>
                      {r("Máscara", "ie_mascara")}
                      <Select
                        value={valorDesabilitado("ie_mascara", el.ie_mascara)}
                        onChange={(v) => setEl({ ie_mascara: v || null })}
                        options={tipoAtual === "data_hora" ? MASCARAS_ELEMENTO.filter((m) => ["data", "data_hora", "hora"].includes(m.value)) : MASCARAS_ELEMENTO}
                        disabled={des("ie_mascara")}
                        error={errosDetalhe.includes("ie_mascara")}
                      />
                    </div>
                    <div>
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
                    <div>
                      {rotulo("Status", "relatorio_banda_elemento", "ie_status", elementoCampoRegras)}
                      <Select value={el.ie_status === "I" ? "I" : "A"} onChange={(v) => setEl({ ie_status: v === "I" ? "I" : "A" })} options={STATUS_OPTIONS} showPlaceholder={false} disabled={statusDe(elementoCampoRegras, "ie_status") === "D"} />
                    </div>
                  </div>
                  {/* Linha 4: Cor, Background, Quebrar linha e bordas. */}
                  <div className="flex flex-wrap gap-x-8 gap-y-[15px]">
                    <div className="flex flex-col">
                      {r("Cor", "cd_cor")}
                      <CampoCorPaleta valor={valorDesabilitado("cd_cor", el.cd_cor)} onChange={(v) => setEl({ cd_cor: v || null })} disabled={des("cd_cor")} erro={errosDetalhe.includes("cd_cor")} rotuloAcessivel="Cor" rotuloVazio="Padrão" />
                    </div>
                    <div className="flex flex-col">
                      {r("Background", "cd_background")}
                      <CampoCorPaleta valor={valorDesabilitado("cd_background", el.cd_background)} onChange={(v) => setEl({ cd_background: v || null })} disabled={des("cd_background")} erro={errosDetalhe.includes("cd_background")} rotuloAcessivel="Background" />
                    </div>
                    {campoCheck("Quebrar linha", "relatorio_banda_elemento", "ie_quebrar_linha", elementoCampoRegras, quebraHabilitada(el) && el.ie_quebrar_linha === "S", (m) => setEl({ ie_quebrar_linha: m ? "S" : "N" }), !quebraHabilitada(el))}
                    {checkboxesBorda(el, (campo, marcado) => setEl({ [campo]: marcado ? "S" : "N" }), "relatorio_banda_elemento", elementoCampoRegras)}
                  </div>
                  {/* Linha 5: Label e Atributo. */}
                  <div className="grid gap-[15px] sm:grid-cols-2">
                    <div>
                      {r("Label", "ds_label")}
                      <input value={valorDesabilitado("ds_label", el.ds_label)} onChange={(e) => setEl({ ds_label: e.target.value })} disabled={des("ds_label")} className={comErro(errosDetalhe, "ds_label")} />
                    </div>
                    <div>
                      {r("Atributo", "cd_alias")}
                      <input value={valorDesabilitado("cd_alias", el.cd_alias)} onChange={(e) => setEl({ cd_alias: e.target.value })} disabled={des("cd_alias")} spellCheck={false} className={comErro(errosDetalhe, "cd_alias")} />
                    </div>
                  </div>
                  {/* Linha 6: Conteúdo. */}
                  <div>
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

          {detalhe?.tipo === "parametro" && (() => {
            const p = detalhe.parametro;
            const setP = (mudanca: Partial<ParametroSql>) => setDetalhe({ tipo: "parametro", parametro: { ...p, ...mudanca } });
            const r = (texto: string, campo: string) => rotulo(texto, "relatorio_parametro", campo, parametroCampoRegras);
            const des = (campo: string) => statusDe(parametroCampoRegras, campo) === "D";
            return (
              <section>
                <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Parâmetro</h2>
                <div className="space-y-[15px]">
                  {/* Linha 1: Sequência, Descrição, Label e Atributo. */}
                  <div className="grid gap-[15px] sm:grid-cols-12">
                    <div className="sm:col-span-2">
                      {r("Sequência", "nr_sequencia")}
                      <input disabled value={String(p.nr_sequencia ?? "")} className={INPUT} />
                    </div>
                    <div className="sm:col-span-4">
                      {r("Descrição do parâmetro", "ds_parametro")}
                      <input value={p.ds_parametro ?? ""} onChange={(e) => setP({ ds_parametro: e.target.value })} disabled={des("ds_parametro")} className={comErro(errosDetalhe, "ds_parametro")} />
                    </div>
                    <div className="sm:col-span-3">
                      {r("Label", "ds_label")}
                      <input value={p.ds_label ?? ""} onChange={(e) => setP({ ds_label: e.target.value })} disabled={des("ds_label")} className={comErro(errosDetalhe, "ds_label")} />
                    </div>
                    <div className="sm:col-span-3">
                      {r("Atributo", "cd_atributo")}
                      <input
                        value={p.cd_atributo ?? ""}
                        // O :nome do SQL: sem espaços e sem os dois-pontos.
                        onChange={(e) => setP({ cd_atributo: e.target.value.replace(/\s/g, "").replace(/^:+/, "") })}
                        disabled={des("cd_atributo")}
                        spellCheck={false}
                        className={comErro(errosDetalhe, "cd_atributo")}
                      />
                    </div>
                  </div>
                  {/* Linha 2: Ordem, Valor padrão, Status, Perguntar e Obrigatório. */}
                  <div className="grid gap-[15px] sm:grid-cols-12">
                    <div className="sm:col-span-2">
                      {r("Ordem", "nr_ordem")}
                      <input
                        inputMode="numeric"
                        value={p.nr_ordem ?? ""}
                        onChange={(e) => {
                          const digitos = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setP({ nr_ordem: digitos === "" ? null : Number(digitos) });
                        }}
                        disabled={des("nr_ordem")}
                        className={comErro(errosDetalhe, "nr_ordem")}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      {r("Valor padrão", "vl_padrao")}
                      <input value={p.vl_padrao ?? ""} onChange={(e) => setP({ vl_padrao: e.target.value })} disabled={des("vl_padrao")} className={comErro(errosDetalhe, "vl_padrao")} />
                    </div>
                    <div className="sm:col-span-2">
                      {rotulo("Status", "relatorio_parametro", "ie_status", parametroCampoRegras)}
                      <Select value={p.ie_status === "I" ? "I" : "A"} onChange={(v) => setP({ ie_status: v === "I" ? "I" : "A" })} options={STATUS_OPTIONS} showPlaceholder={false} disabled={statusDe(parametroCampoRegras, "ie_status") === "D"} />
                    </div>
                    <div className="sm:col-span-6 flex gap-8">
                      {campoCheck("Perguntar", "relatorio_parametro", "ie_perguntar", parametroCampoRegras, p.ie_perguntar === "S", (m) => setP({ ie_perguntar: m ? "S" : "N" }))}
                      {campoCheck("Obrigatório", "relatorio_parametro", "ie_obrigatorio", parametroCampoRegras, p.ie_obrigatorio === "S", (m) => setP({ ie_obrigatorio: m ? "S" : "N" }))}
                    </div>
                  </div>
                </div>
              </section>
            );
          })()}
          </FormularioSomenteLeitura>
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
                {!somenteLeitura && (
                <button
                  type="submit"
                  disabled={saving || gravando}
                  className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                  style={{ backgroundColor: "#003056", borderBottomColor: "#000" }}
                >
                  Salvar
                </button>
                )}
              </div>
            </div>
          </div>
        )}
      </form>

      {(gravando || saving) && <LoadingModal open message="Carregando..." />}
    </div>
  );
}
