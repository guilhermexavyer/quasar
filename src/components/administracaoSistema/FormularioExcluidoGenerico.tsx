"use client";

import RotuloCampo from "@/components/ui/RotuloCampo";
import CampoCorPaleta from "@/components/ui/CampoCorPaleta";
import Select from "@/components/ui/Select";
import { formatDate } from "@/lib/pessoaFisicaUtils";
import { rotuloTipoFeriado } from "@/lib/periodoLetivoFeriadoUtils";
import { formatarMedida } from "@/lib/cadastroGeralUtils";
import { getDataSource } from "@/lib/relatorioDataSources";
import { rotuloStatusRelacionamento } from "@/lib/relacionamentoUtils";

type Dados = Record<string, unknown>;

interface CampoGenerico {
  campo: string;
  rotulo: string;
  /** Largura na grade de 12 colunas. */
  span: number;
  /** texto (padrão), dropdown (o Select do formulário), check (checkbox), cor (quadrado da paleta) ou textoLongo. */
  tipo?: "texto" | "dropdown" | "check" | "cor" | "textoLongo";
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
const TIPOS_BANDA = [
  { value: "lista", label: "Lista" }, { value: "texto_valor", label: "Dados" },
  { value: "cabecalho", label: "Cabeçalho" }, { value: "rodape", label: "Rodapé" },
];
const BORDAS_PDF = [
  { value: "", label: "---" }, { value: "solid_fina", label: "Sólida fina" }, { value: "solid_grossa", label: "Sólida grossa" },
  { value: "dupla", label: "Dupla" }, { value: "tracejada", label: "Tracejada" }, { value: "pontilhada", label: "Pontilhada" },
];
const ALINHAMENTOS = [{ value: "centro", label: "Centro" }, { value: "direita", label: "Direita" }, { value: "esquerda", label: "Esquerda" }];
const TIPOS_BANDA_SQL = [{ value: "cabecalho", label: "Cabeçalho" }, { value: "detalhe", label: "Detalhe" }, { value: "rodape", label: "Rodapé" }];
const MASCARAS = [
  { value: "cep", label: "CEP" }, { value: "cnpj", label: "CNPJ" }, { value: "cpf", label: "CPF" }, { value: "data", label: "Data" },
  { value: "data_hora", label: "Data e hora" }, { value: "hora", label: "Hora" }, { value: "moeda", label: "Moeda" },
  { value: "numero", label: "Número" }, { value: "porcentagem", label: "Porcentagem" },
];
/** Status do relatório, da banda, do elemento e do parâmetro. */
const status = (v: unknown) => (v === "I" ? "Inativo" : "Ativo");
const FONTES = [
  { value: "arial", label: "Arial" }, { value: "calibri", label: "Calibri" }, { value: "courier_new", label: "Courier New" },
  { value: "times_new_roman", label: "Times New Roman" }, { value: "verdana", label: "Verdana" },
];

const nomeColecao = (v: unknown) => getDataSource(texto(v))?.label ?? texto(v);
const pdf = (d: Dados) => obj(d.configPdf);

/**
 * Formulários (somente leitura) das funções cujo formulário não pode ser
 * reaproveitado no "Ver" de Exclusões: mesmas seções e campos do original.
 */
export const FORMULARIOS_GENERICOS: Record<string, SecaoGenerica[]> = {
  aluno_responsavel: [{
    campos: [
      { campo: "nr_sequencia", rotulo: "Sequência", span: 1 },
      { campo: "nr_seq_pessoa_fisica", rotulo: "Pessoa física", span: 2 },
      { campo: "nr_seq_grau_parentesco", rotulo: "Grau de parentesco", span: 2 },
    ],
  }],
  fornecedor: [{
    titulo: "Identificação",
    campos: [
      { campo: "nr_sequencia", rotulo: "Sequência", span: 1 },
      { campo: "nr_seq_pessoa_fisica", rotulo: "Pessoa física", span: 4 },
      { campo: "nr_seq_pessoa_juridica", rotulo: "Pessoa jurídica", span: 5 },
      { campo: "ie_status", rotulo: "Status", span: 2, tipo: "dropdown", formatar: (v) => rotuloStatusRelacionamento(texto(v) || "A") },
      { campo: "ds_observacao", rotulo: "Observação", span: 12 },
    ],
  }],
  prestador_servico: [{
    titulo: "Identificação",
    campos: [
      { campo: "nr_sequencia", rotulo: "Sequência", span: 1 },
      { campo: "nr_seq_pessoa_fisica", rotulo: "Pessoa física", span: 4 },
      { campo: "nr_seq_pessoa_juridica", rotulo: "Pessoa jurídica", span: 5 },
      { campo: "ie_status", rotulo: "Status", span: 2, tipo: "dropdown", formatar: (v) => rotuloStatusRelacionamento(texto(v) || "A") },
      { campo: "ds_observacao", rotulo: "Observação", span: 12 },
    ],
  }],
  equipe: [{
    campos: [
      { campo: "nr_sequencia", rotulo: "Sequência", span: 1 },
      { campo: "ds_equipe", rotulo: "Descrição", span: 9 },
      { campo: "ie_status", rotulo: "Status", span: 2, tipo: "dropdown", formatar: (v) => rotuloStatusRelacionamento(texto(v) || "A") },
      { campo: "ds_observacao", rotulo: "Observação", span: 12 },
    ],
  }],
  equipe_membro: [{
    campos: [
      { campo: "nr_sequencia", rotulo: "Sequência", span: 1 },
      { campo: "nr_seq_equipe", rotulo: "Equipe", span: 11 },
      { campo: "nr_seq_colaborador", rotulo: "Colaborador", span: 4 },
      { campo: "nr_seq_fornecedor", rotulo: "Fornecedor", span: 4 },
      { campo: "nr_seq_prestador_servico", rotulo: "Prestador de serviço", span: 4 },
    ],
  }],
  ativo_responsavel: [{
    campos: [
      { campo: "nr_sequencia", rotulo: "Sequência", span: 1 },
      { campo: "nr_seq_colaborador", rotulo: "Colaborador", span: 5 },
      { campo: "nr_seq_equipe", rotulo: "Equipe", span: 6 },
    ],
  }],
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
        { campo: "ie_origem", rotulo: "Origem", span: 2, tipo: "dropdown", formatar: (v) => (v === "I" ? "Importação" : v === "Q" ? "Quasar" : "Criação") },
        { campo: "ds_relatorio", rotulo: "Descrição", span: 4 },
        { campo: "ie_formato", rotulo: "Formato", span: 2, tipo: "dropdown", formatar: (v) => (v === "pdf" ? "PDF" : v ? "XLS" : "") },
        { campo: "ie_status", rotulo: "Status", span: 2, tipo: "dropdown", formatar: status },
        { campo: "ds_sql", rotulo: "SQL", span: 12, tipo: "textoLongo" },
      ],
    },
    {
      titulo: "Saída",
      campos: [
        { campo: "ds_nome_arquivo", rotulo: "Nome do arquivo", span: 3, valor: (d) => d.ds_nome_arquivo ?? pdf(d).titulo },
        { campo: "nr_seq_formato_papel", rotulo: "Formato do papel", span: 3, tipo: "dropdown" },
        { campo: "ie_orientacao", rotulo: "Orientação", span: 3, tipo: "dropdown", formatar: rotuloDe([{ value: "P", label: "Padrão" }, { value: "I", label: "Invertido" }]) },
        { campo: "ie_borda", rotulo: "Borda", span: 3, tipo: "dropdown", formatar: rotuloDe(BORDAS_PDF) },
        { campo: "nr_margem_superior", rotulo: "Margem superior", span: 3, formatar: formatarMedida },
        { campo: "nr_margem_inferior", rotulo: "Margem inferior", span: 3, formatar: formatarMedida },
        { campo: "nr_margem_esquerda", rotulo: "Margem esquerda", span: 3, formatar: formatarMedida },
        { campo: "nr_margem_direita", rotulo: "Margem direita", span: 3, formatar: formatarMedida },
      ],
    },
  ],
  relatorio_importacao: [{
    titulo: "Importação",
    campos: [
      { campo: "nr_sequencia", rotulo: "Sequência", span: 2 },
      { campo: "ds_arquivo", rotulo: "Arquivo", span: 10 },
      { campo: "nr_seq_relatorio", rotulo: "Sequência do relatório", span: 2 },
      { campo: "ds_relatorio", rotulo: "Descrição do relatório", span: 10 },
      { campo: "ds_versao_sistema", rotulo: "Versão de origem", span: 4 },
      { campo: "dt_importacao", rotulo: "Importação", span: 2, formatar: (v) => (v ? formatDate(texto(v)) : "") },
      { campo: "qt_bandas", rotulo: "Bandas", span: 2 },
      { campo: "qt_elementos", rotulo: "Elementos", span: 2 },
      { campo: "qt_parametros", rotulo: "Parâmetros", span: 2 },
    ],
  }],
  relatorio_parametro: [{
    titulo: "Parâmetro",
    campos: [
      { campo: "nr_sequencia", rotulo: "Sequência", span: 2 },
      { campo: "ds_parametro", rotulo: "Descrição do parâmetro", span: 4 },
      { campo: "ds_label", rotulo: "Label", span: 3 },
      { campo: "cd_atributo", rotulo: "Atributo", span: 3 },
      { campo: "nr_ordem", rotulo: "Ordem", span: 2 },
      { campo: "vl_padrao", rotulo: "Valor padrão", span: 2 },
      { campo: "ie_status", rotulo: "Status", span: 2, tipo: "dropdown", formatar: status },
      { campo: "ie_perguntar", rotulo: "Perguntar", span: 2, tipo: "check" },
      { campo: "ie_obrigatorio", rotulo: "Obrigatório", span: 2, tipo: "check" },
    ],
  }],
  relatorio_banda: [
    {
      titulo: "Banda",
      // Bandas do modelo atual (as antigas, do layout PDF anterior, têm ie_tipo_banda).
      mostrar: (d) => !d.ie_tipo_banda,
      campos: [
        { campo: "nr_sequencia", rotulo: "Sequência", span: 1 },
        { campo: "ds_banda", rotulo: "Descrição", span: 2 },
        { campo: "nr_ordem", rotulo: "Ordem", span: 1 },
        { campo: "ie_tipo", rotulo: "Tipo", span: 2, tipo: "dropdown", formatar: rotuloDe(TIPOS_BANDA_SQL) },
        { campo: "nr_seq_banda_superior", rotulo: "Banda superior", span: 2, tipo: "dropdown" },
        { campo: "qt_altura", rotulo: "Altura", span: 2 },
        { campo: "ie_status", rotulo: "Status", span: 2, tipo: "dropdown", formatar: status },
        { campo: "ie_borda_superior", rotulo: "Borda superior", span: 1, tipo: "check" },
        { campo: "ie_borda_inferior", rotulo: "Borda inferior", span: 1, tipo: "check" },
        { campo: "ie_borda_esquerda", rotulo: "Borda esquerda", span: 1, tipo: "check" },
        { campo: "ie_borda_direita", rotulo: "Borda direita", span: 1, tipo: "check" },
        { campo: "ie_nova_pagina", rotulo: "Quebrar página por registro", span: 2, tipo: "check" },
        { campo: "ie_exibir_label", rotulo: "Exibir labels", span: 1, tipo: "check" },
        { campo: "ie_imprimir_vazio", rotulo: "Imprimir sem registros", span: 2, tipo: "check" },
        { campo: "ie_alternar_background", rotulo: "Alternar background", span: 1, tipo: "check" },
        { campo: "cd_background_registro", rotulo: "Registros", span: 1, tipo: "cor" },
        { campo: "cd_background_label", rotulo: "Labels", span: 1, tipo: "cor" },
        { campo: "ds_sql", rotulo: "SQL", span: 12, tipo: "textoLongo" },
      ],
    },
    {
      titulo: "PDF",
      // Bandas do layout PDF anterior: os campos de layout de então.
      mostrar: (d) => !!d.ie_tipo_banda,
      campos: [
        { campo: "nr_sequencia", rotulo: "Sequência", span: 2 },
        { campo: "ds_banda", rotulo: "Descrição", span: 6 },
        { campo: "ie_tipo_banda", rotulo: "Tipo", span: 2, tipo: "dropdown", formatar: rotuloDe(TIPOS_BANDA) },
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
  relatorio_banda_elemento: [{
    titulo: "Elemento",
    campos: [
      { campo: "nr_sequencia", rotulo: "Sequência", span: 1 },
      { campo: "nr_camada", rotulo: "Camada", span: 1 },
      { campo: "ds_elemento", rotulo: "Descrição", span: 4 },
      { campo: "ie_tipo", rotulo: "Tipo", span: 2, tipo: "dropdown", formatar: rotuloDe([{ value: "sql", label: "SQL" }, { value: "conteudo", label: "Conteúdo" }, { value: "imagem", label: "Imagem" }, { value: "parametro", label: "Parâmetro" }, { value: "pagina", label: "Página" }, { value: "data_hora", label: "Data/hora" }, { value: "usuario", label: "Usuário" }, { value: "linha", label: "Linha" }]) },
      { campo: "nr_seq_imagem", rotulo: "Imagem", span: 4, tipo: "dropdown" },
      { campo: "qt_esquerda", rotulo: "Esquerda", span: 2 },
      { campo: "qt_topo", rotulo: "Topo", span: 2 },
      { campo: "qt_largura", rotulo: "Tamanho", span: 2 },
      { campo: "qt_altura", rotulo: "Altura", span: 2 },
      { campo: "qt_padding_superior", rotulo: "Padding superior", span: 2 },
      { campo: "qt_padding_inferior", rotulo: "Padding inferior", span: 2 },
      { campo: "qt_padding_esquerda", rotulo: "Padding esquerda", span: 2 },
      { campo: "qt_padding_direita", rotulo: "Padding direita", span: 2 },
      { campo: "ie_alinhamento", rotulo: "Alinhamento", span: 2, tipo: "dropdown", formatar: rotuloDe(ALINHAMENTOS) },
      { campo: "ie_fonte", rotulo: "Fonte", span: 2, tipo: "dropdown", formatar: rotuloDe(FONTES) },
      { campo: "qt_fonte", rotulo: "Tamanho da fonte", span: 2 },
      { campo: "ie_estilo", rotulo: "Estilo", span: 2, tipo: "dropdown", formatar: rotuloDe(ESTILOS.map((e) => (e.value === "negrito_italico_sublinhado" ? { ...e, label: "Todos" } : e))) },
      { campo: "ie_mascara", rotulo: "Máscara", span: 2, tipo: "dropdown", formatar: rotuloDe(MASCARAS) },
      { campo: "qt_casas_decimais", rotulo: "Casas decimais", span: 2 },
      { campo: "ie_status", rotulo: "Status", span: 2, tipo: "dropdown", formatar: status },
      { campo: "cd_cor", rotulo: "Cor", span: 1, tipo: "cor" },
      { campo: "cd_background", rotulo: "Background", span: 1, tipo: "cor" },
      { campo: "ie_quebrar_linha", rotulo: "Quebrar linha", span: 2, tipo: "check" },
      { campo: "ie_borda_superior", rotulo: "Borda superior", span: 2, tipo: "check" },
      { campo: "ie_borda_inferior", rotulo: "Borda inferior", span: 2, tipo: "check" },
      { campo: "ie_borda_esquerda", rotulo: "Borda esquerda", span: 2, tipo: "check" },
      { campo: "ie_borda_direita", rotulo: "Borda direita", span: 2, tipo: "check" },
      { campo: "ds_label", rotulo: "Label", span: 6 },
      { campo: "cd_alias", rotulo: "Atributo", span: 6 },
      { campo: "ds_conteudo", rotulo: "Conteúdo", span: 12, tipo: "textoLongo" },
    ],
  }],
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
  resolverReferencia,
}: {
  colecao: string;
  dados: Dados;
  resolverNomeAutor?: (nome: string) => string;
  /** Descrição de um nr_seq_* (ex.: Formato do papel, Imagem, Banda superior); sem ela, o número. */
  resolverReferencia?: (campo: string, valor: unknown, dados: Dados) => string | undefined;
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
                const exibido = c.formatar
                  ? c.formatar(bruto, dados)
                  : c.campo.startsWith("nr_seq_") && bruto !== null && bruto !== undefined && bruto !== ""
                    ? resolverReferencia?.(c.campo, bruto, dados) ?? texto(bruto)
                    : texto(bruto);
                return (
                  <div key={c.campo} className={SPAN[c.span] ?? "sm:col-span-3"}>
                    <RotuloCampo texto={c.rotulo} colecao={colecao} campo={c.campo} tipo={c.tipo === "check" ? "boolean" : undefined} />
                    {c.tipo === "check" ? (
                      <div className="flex h-[34px] items-center">
                        <input type="checkbox" className="cg-checkbox" disabled checked={bruto === true || bruto === "S"} readOnly />
                      </div>
                    ) : c.tipo === "textoLongo" ? (
                      <textarea disabled rows={10} value={texto(bruto)} className={`${classeInput} font-mono text-[13px] leading-5 resize-y`} />
                    ) : c.tipo === "cor" ? (
                      // Mesmo campo de cor do formulário, só para ver (sem abrir a paleta).
                      <CampoCorPaleta valor={texto(bruto)} onChange={() => {}} rotuloAcessivel={c.rotulo} somenteLeitura />

                    ) : c.tipo === "dropdown" ? (
                      // O mesmo dropdown do formulário, desabilitado, com a opção gravada.
                      <Select value={exibido ? "1" : ""} onChange={() => {}} options={exibido ? [{ value: "1", label: exibido }] : []} disabled />
                    ) : (
                      <input disabled value={exibido} className={classeInput} />
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
