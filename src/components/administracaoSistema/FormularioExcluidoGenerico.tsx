"use client";

import RotuloCampo from "@/components/ui/RotuloCampo";
import { formatDate } from "@/lib/pessoaFisicaUtils";
import { rotuloTipoFeriado } from "@/lib/periodoLetivoFeriadoUtils";
import { OPERADORES_FILTRO, TAMANHOS_PAGINA } from "@/lib/relatorioUtils";
import { getDataSource } from "@/lib/relatorioDataSources";

type Dados = Record<string, unknown>;

interface CampoGenerico {
  campo: string;
  rotulo: string;
  /** Largura na grade de 12 colunas. */
  span: number;
  /** texto (padrão), check (checkbox) ou cor (amostra + código). */
  tipo?: "texto" | "check" | "cor";
  /** Valor a partir dos dados (padrão: dados[campo]). */
  valor?: (d: Dados) => unknown;
  /** Texto exibido (rótulo da opção, data formatada…). */
  formatar?: (v: unknown, d: Dados) => string;
}

interface SecaoGenerica {
  titulo?: string;
  campos: CampoGenerico[];
  /** Seção condicional (ex.: Configurações só para banda do tipo Lista). */
  mostrar?: (d: Dados) => boolean;
}

const texto = (v: unknown) => (v === undefined || v === null ? "" : String(v));
const rotuloDe = (opcoes: readonly { value: string; label: string }[]) => (v: unknown) =>
  opcoes.find((o) => o.value === texto(v))?.label ?? texto(v);
const obj = (v: unknown): Dados => (v && typeof v === "object" ? (v as Dados) : {});

const ESTILOS = [
  { value: "", label: "---" }, { value: "negrito", label: "Negrito" }, { value: "italico", label: "Itálico" },
  { value: "sublinhado", label: "Sublinhado" }, { value: "negrito_italico", label: "Negrito + Itálico" },
  { value: "negrito_sublinhado", label: "Negrito + Sublinhado" }, { value: "italico_sublinhado", label: "Itálico + Sublinhado" },
  { value: "negrito_italico_sublinhado", label: "Negrito + Itálico + Sublinhado" },
];
const TIPOS_ELEMENTO = [
  { value: "conteudo", label: "Conteúdo" }, { value: "data_horario_geracao", label: "Data + horário da geração" },
  { value: "data_geracao", label: "Data da geração" }, { value: "horario_geracao", label: "Horário da geração" },
  { value: "imagem", label: "Imagem" }, { value: "numero_pagina", label: "Número da página" },
  { value: "usuario_geracao", label: "Usuário da geração" }, { value: "valor", label: "Valor" },
];
const TIPOS_BANDA = [
  { value: "lista", label: "Lista" }, { value: "texto_valor", label: "Dados" },
  { value: "cabecalho", label: "Cabeçalho" }, { value: "rodape", label: "Rodapé" },
];
const BORDAS_PDF = [
  { value: "", label: "---" }, { value: "solid_fina", label: "Sólida fina" }, { value: "solid_grossa", label: "Sólida grossa" },
  { value: "dupla", label: "Dupla" }, { value: "tracejada", label: "Tracejada" }, { value: "pontilhada", label: "Pontilhada" },
];
const MASCARAS = [
  { value: "texto", label: "Texto" }, { value: "data", label: "Data" }, { value: "decimal", label: "Decimal" },
  { value: "inteiro", label: "Inteiro" }, { value: "cpf", label: "CPF" }, { value: "telefone", label: "Telefone" },
];
const ALINHAMENTOS = [{ value: "esquerda", label: "Esquerda" }, { value: "centro", label: "Centro" }, { value: "direita", label: "Direita" }];

const nomeColecao = (v: unknown) => getDataSource(texto(v))?.label ?? texto(v);
/** Rótulo do campo da fonte de dados (coleção informada no próprio registro). */
const nomeCampo = (chaveColecao: string) => (v: unknown, d: Dados) =>
  getDataSource(texto(d[chaveColecao]))?.campos.find((c) => c.key === texto(v))?.label ?? texto(v);
const pdf = (d: Dados) => obj(d.configPdf);
const margem = (lado: string) => (d: Dados) => obj(pdf(d).margens)[lado];

/**
 * Formulários (somente leitura) das funções cujo formulário não pode ser
 * reaproveitado no "Ver" de Exclusões: mesmas seções e campos do original.
 */
export const FORMULARIOS_GENERICOS: Record<string, SecaoGenerica[]> = {
  periodo_letivo_feriado: [{
    campos: [
      { campo: "nr_sequencia", rotulo: "Sequência", span: 1 },
      { campo: "dt_feriado", rotulo: "Data", span: 2 },
      { campo: "ds_feriado", rotulo: "Descrição", span: 6 },
      { campo: "ie_tipo_feriado", rotulo: "Tipo", span: 3, formatar: (v) => rotuloTipoFeriado(texto(v)) },
    ],
  }],
  relatorio: [
    {
      titulo: "Relatório",
      campos: [
        { campo: "nr_sequencia", rotulo: "Sequência", span: 2 },
        { campo: "ds_relatorio", rotulo: "Descrição", span: 7 },
        { campo: "ie_formato", rotulo: "Formato", span: 3, formatar: () => "PDF" },
      ],
    },
    {
      titulo: "Saída",
      campos: [
        { campo: "ds_nome_arquivo", rotulo: "Nome do arquivo", span: 3, valor: (d) => pdf(d).titulo },
        { campo: "ie_pagina", rotulo: "Página", span: 3, valor: (d) => pdf(d).tamanhoPagina, formatar: rotuloDe(TAMANHOS_PAGINA) },
        { campo: "ie_orientacao", rotulo: "Orientação", span: 3, valor: (d) => pdf(d).orientacao, formatar: rotuloDe([{ value: "retrato", label: "Retrato" }, { value: "paisagem", label: "Paisagem" }]) },
        { campo: "ie_borda", rotulo: "Borda", span: 3, valor: (d) => pdf(d).estiloBorda, formatar: rotuloDe(BORDAS_PDF) },
        { campo: "nr_margem_superior", rotulo: "Margem superior", span: 3, valor: margem("superior") },
        { campo: "nr_margem_inferior", rotulo: "Margem inferior", span: 3, valor: margem("inferior") },
        { campo: "nr_margem_esquerda", rotulo: "Margem esquerda", span: 3, valor: margem("esquerda") },
        { campo: "nr_margem_direita", rotulo: "Margem direita", span: 3, valor: margem("direita") },
      ],
    },
  ],
  relatorio_parametro: [{
    titulo: "Parâmetro",
    campos: [
      { campo: "nr_sequencia", rotulo: "Sequência", span: 2 },
      { campo: "ie_colecao", rotulo: "Coleção", span: 3, formatar: nomeColecao },
      { campo: "ie_campo", rotulo: "Campo", span: 3, formatar: nomeCampo("ie_colecao") },
      { campo: "ds_label", rotulo: "Label", span: 4 },
      { campo: "operador", rotulo: "Operador", span: 2, formatar: rotuloDe(OPERADORES_FILTRO) },
      { campo: "ie_mascara", rotulo: "Máscara", span: 2, formatar: rotuloDe(MASCARAS) },
      { campo: "vl_padrao", rotulo: "Valor padrão", span: 3 },
      { campo: "valorFinal", rotulo: "Valor final", span: 3 },
      { campo: "ie_conector", rotulo: "Conector", span: 2 },
      { campo: "ie_parametro", rotulo: "Parâmetro", span: 2, tipo: "check" },
      { campo: "ie_obrigatorio", rotulo: "Obrigatório", span: 2, tipo: "check" },
    ],
  }],
  relatorio_banda: [
    {
      titulo: "Banda",
      campos: [
        { campo: "nr_sequencia", rotulo: "Sequência", span: 2 },
        { campo: "ds_banda", rotulo: "Descrição", span: 2 },
        { campo: "ie_tipo_banda", rotulo: "Tipo", span: 2, formatar: rotuloDe(TIPOS_BANDA) },
        { campo: "ie_colecao_principal", rotulo: "Coleção principal", span: 2, formatar: nomeColecao },
        { campo: "nr_posicao", rotulo: "Posição", span: 2 },
        { campo: "nr_altura", rotulo: "Altura", span: 2 },
        { campo: "ie_borda_superior", rotulo: "Borda superior", span: 2, tipo: "check" },
        { campo: "ie_borda_inferior", rotulo: "Borda inferior", span: 2, tipo: "check" },
        { campo: "ie_borda_esquerda", rotulo: "Borda esquerda", span: 2, tipo: "check" },
        { campo: "ie_borda_direita", rotulo: "Borda direita", span: 2, tipo: "check" },
      ],
    },
    {
      titulo: "Configurações",
      mostrar: (d) => d.ie_tipo_banda === "lista",
      campos: [
        { campo: "espessuraLabel", rotulo: "Espessura label", span: 2 },
        { campo: "topoLabel", rotulo: "Topo label", span: 2 },
        { campo: "bgLabel", rotulo: "Background label", span: 2, tipo: "cor" },
        { campo: "corLabelGlobal", rotulo: "Cor label", span: 2, tipo: "cor" },
        { campo: "fonteLabel", rotulo: "Fonte label", span: 2 },
        { campo: "tamanhoFonteLabel", rotulo: "Tamanho fonte label", span: 2 },
        { campo: "espessuraCampo", rotulo: "Espessura registro", span: 2 },
        { campo: "topoRegistro", rotulo: "Topo registro", span: 2 },
        { campo: "bgCampo", rotulo: "Background registro", span: 2, tipo: "cor" },
        { campo: "corCampoGlobal", rotulo: "Cor registro", span: 2, tipo: "cor" },
        { campo: "fonteCampo", rotulo: "Fonte registro", span: 2 },
        { campo: "tamanhoFonteCampo", rotulo: "Tamanho fonte registro", span: 2 },
      ],
    },
  ],
  relatorio_banda_elemento: [
    {
      titulo: "Identificação",
      campos: [
        { campo: "nr_sequencia", rotulo: "Sequência", span: 1 },
        { campo: "ds_elemento", rotulo: "Descrição", span: 3 },
        { campo: "ie_tipo_elemento", rotulo: "Tipo", span: 2, formatar: rotuloDe(TIPOS_ELEMENTO) },
        { campo: "ie_primeira_pagina", rotulo: "Primeira página", span: 2, tipo: "check" },
        { campo: "ie_colecao", rotulo: "Coleção", span: 2, formatar: nomeColecao },
        { campo: "ie_campo", rotulo: "Campo", span: 2, formatar: nomeCampo("ie_colecao") },
        { campo: "label", rotulo: "Label", span: 4 },
      ],
    },
    {
      titulo: "Aparência",
      campos: [
        { campo: "ie_fonte", rotulo: "Fonte", span: 2 },
        { campo: "qt_fonte", rotulo: "Tamanho fonte", span: 2 },
        { campo: "ie_estilo", rotulo: "Estilo", span: 2, formatar: rotuloDe(ESTILOS) },
        { campo: "ie_estilo_label", rotulo: "Estilo label", span: 2, formatar: rotuloDe(ESTILOS) },
        { campo: "ie_estilo_soma", rotulo: "Estilo soma", span: 2, formatar: rotuloDe(ESTILOS) },
        { campo: "cd_cor", rotulo: "Cor", span: 1, tipo: "cor" },
        { campo: "cd_background", rotulo: "Background", span: 1, tipo: "cor" },
        { campo: "qt_padding_superior", rotulo: "Padding superior", span: 3 },
        { campo: "qt_padding_direita", rotulo: "Padding direita", span: 3 },
        { campo: "qt_padding_inferior", rotulo: "Padding inferior", span: 3 },
        { campo: "qt_padding_esquerda", rotulo: "Padding esquerda", span: 3 },
        { campo: "ie_borda_superior", rotulo: "Borda superior", span: 3, tipo: "check" },
        { campo: "ie_borda_direita", rotulo: "Borda direita", span: 3, tipo: "check" },
        { campo: "ie_borda_inferior", rotulo: "Borda inferior", span: 3, tipo: "check" },
        { campo: "ie_borda_esquerda", rotulo: "Borda esquerda", span: 3, tipo: "check" },
        { campo: "nr_seq_imagem", rotulo: "Imagem", span: 3 },
        { campo: "qt_tamanho_imagem", rotulo: "Tamanho imagem", span: 3 },
        { campo: "conteudo", rotulo: "Conteúdo", span: 6 },
      ],
    },
    {
      titulo: "Posicionamento",
      campos: [
        { campo: "qt_esquerda", rotulo: "Esquerda", span: 2 },
        { campo: "qt_topo", rotulo: "Topo", span: 2 },
        { campo: "qt_largura", rotulo: "Largura", span: 2 },
        { campo: "ie_alinhamento", rotulo: "Alinhamento", span: 3, formatar: rotuloDe(ALINHAMENTOS) },
        { campo: "soma", rotulo: "Soma", span: 3, tipo: "check" },
      ],
    },
  ],
};

const SPAN: Record<number, string> = {
  1: "sm:col-span-1", 2: "sm:col-span-2", 3: "sm:col-span-3", 4: "sm:col-span-4", 5: "sm:col-span-5", 6: "sm:col-span-6",
  7: "sm:col-span-7", 8: "sm:col-span-8", 9: "sm:col-span-9", 10: "sm:col-span-10", 11: "sm:col-span-11", 12: "sm:col-span-12",
};

const classeInput = "w-full rounded-[3px] border border-slate-300 px-2 py-1.5 text-sm transition focus:outline-none";

/** Formulário genérico somente leitura (seções e campos da função + rodapé de logs). */
export default function FormularioExcluidoGenerico({
  colecao,
  dados,
  resolverNomeAutor = (nome) => nome,
}: {
  colecao: string;
  dados: Dados;
  resolverNomeAutor?: (nome: string) => string;
}) {
  const secoes = (FORMULARIOS_GENERICOS[colecao] ?? []).filter((s) => !s.mostrar || s.mostrar(dados));
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-9 pt-2">
        {secoes.map((secao, i) => (
          <section key={secao.titulo ?? i}>
            {secao.titulo && <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">{secao.titulo}</h2>}
            <div className="grid gap-[15px] sm:grid-cols-12">
              {secao.campos.map((c) => {
                const bruto = c.valor ? c.valor(dados) : dados[c.campo];
                return (
                  <div key={c.campo} className={SPAN[c.span] ?? "sm:col-span-3"}>
                    <RotuloCampo texto={c.rotulo} colecao={colecao} campo={c.campo} tipo={c.tipo === "check" ? "boolean" : undefined} />
                    {c.tipo === "check" ? (
                      <div className="flex h-[34px] items-center">
                        <input type="checkbox" className="cg-checkbox" disabled checked={bruto === true || bruto === "S"} readOnly />
                      </div>
                    ) : c.tipo === "cor" ? (
                      <div className="flex items-center gap-2">
                        <span className="h-[34px] w-[34px] shrink-0 border border-slate-300" style={{ backgroundColor: texto(bruto) || "transparent" }} />
                        <input disabled value={texto(bruto)} className={classeInput} />
                      </div>
                    ) : (
                      <input disabled value={c.formatar ? c.formatar(bruto, dados) : texto(bruto)} className={classeInput} />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-auto pt-4 text-[13px] text-slate-500">
        <div>Criado por {resolverNomeAutor(texto(dados.ds_usuario_criacao)) || "-"} em {dados.dt_criacao ? formatDate(texto(dados.dt_criacao)) : "-"}</div>
        <div className="mt-1">Alterado por {resolverNomeAutor(texto(dados.ds_usuario_alteracao)) || "-"} em {dados.dt_alteracao ? formatDate(texto(dados.dt_alteracao)) : "-"}</div>
      </div>
    </div>
  );
}
