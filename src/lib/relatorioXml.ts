/**
 * Exportação de relatórios (Gerenciador de Relatórios > menu de contexto > Exportar relatório)
 * em XML, para compartilhar relatórios entre ambientes (escolas) diferentes. O arquivo leva o
 * relatório, as bandas, os elementos, os parâmetros e o formato do papel, para que a
 * importação recrie tudo em outro banco sem depender de nada que só existe no ambiente de
 * origem. As imagens NÃO vão: cada instituição usa as próprias (ver "Imagens" abaixo).
 *
 * ── Formato (versão 1) ──────────────────────────────────────────────────────────────────
 *
 * <quasar-relatorio formato="1" versao-sistema="0.94.0" exportado-em="2026-11-24T18:00:00.000Z">
 *   <relatorio>
 *     <ds_relatorio>...</ds_relatorio> ... (campos do relatório)
 *     <formato-papel>                     (opcional; o Formato do papel do relatório)
 *       <ds_formato_papel>A4</ds_formato_papel><qt_largura>210</qt_largura><qt_altura>297</qt_altura>
 *     </formato-papel>
 *   </relatorio>
 *   <parametros>
 *     <parametro ref="P1" ordem="1"> ... </parametro>
 *   </parametros>
 *   <bandas>
 *     <banda ref="B1" ordem="1" banda-superior="B0"> ... (campos da banda)
 *       <elementos>
 *         <elemento ref="E1" ordem="1"> ... </elemento>
 *       </elementos>
 *     </banda>
 *   </bandas>
 * </quasar-relatorio>
 *
 * Regras para a importação:
 *   - Sem nr_sequencia: nenhum nr_sequencia (nem nr_seq_relatorio, nr_seq_banda,
 *     nr_seq_banda_superior, nr_seq_imagem, nr_seq_formato_papel) vai no arquivo, porque no
 *     outro banco esses números já podem estar em uso. Cada item tem um `ref` (P1, B1,
 *     E1...) válido só dentro do arquivo; as ligações usam o ref:
 *       banda-superior="B?" → a banda superior (vazio = sem banda superior).
 *     A importação cria tudo com sequências novas e troca cada ref pela sequência criada
 *     (bandas: criar todas e depois gravar a Banda superior, que pode vir antes ou depois).
 *   - `ordem`: a ordem dos itens no relatório de origem (a Sequência define a ordem das
 *     bandas no PDF e a banda Detalhe do XLS); criar na ordem do arquivo mantém a ordem.
 *   - Formato do papel: procurar no destino pela descrição (ou largura x altura); sem
 *     correspondente, criar.
 *   - Imagens: não vão no arquivo, para não interferir nas imagens do destino. O elemento do
 *     tipo Imagem é importado sem imagem selecionada; a instituição escolhe a imagem dela
 *     mesma no elemento (Administração do Sistema > Imagens).
 *   - Origem: a Origem não vai no arquivo; o relatório importado fica com Origem
 *     'I' (Importação), mesmo que no ambiente de origem fosse 'C' ou 'Q'.
 *   - Campos ausentes = vazios (null). Campo desconhecido = ignorar (formatos futuros).
 *   - Logs (criação/alteração) não vão: o registro importado é de quem importou.
 */

export const FORMATO_EXPORTACAO_RELATORIO = "1";

/** Campos exportados de cada item (os demais — sequências, logs e campos antigos — ficam de fora). */
export const CAMPOS_EXPORTADOS = {
  relatorio: [
    "ds_relatorio", "ie_formato", "ie_status", "ds_sql", "ds_nome_arquivo",
    "ie_orientacao", "ie_borda", "nr_margem_superior", "nr_margem_inferior", "nr_margem_esquerda", "nr_margem_direita",
  ],
  parametro: ["ds_parametro", "ds_label", "cd_atributo", "nr_ordem", "vl_padrao", "ie_status", "ie_perguntar", "ie_obrigatorio"],
  banda: [
    "ds_banda", "nr_ordem", "ie_tipo", "qt_altura", "ie_status",
    "ie_borda_superior", "ie_borda_inferior", "ie_borda_esquerda", "ie_borda_direita",
    "ie_nova_pagina", "ie_exibir_label", "ie_imprimir_vazio", "ie_alternar_background",
    "cd_background_registro", "cd_background_label", "ds_sql",
  ],
  elemento: [
    "ds_elemento", "nr_camada", "ie_tipo", "qt_esquerda", "qt_topo", "qt_largura", "qt_altura",
    "qt_padding_superior", "qt_padding_inferior", "qt_padding_esquerda", "qt_padding_direita",
    "ie_alinhamento", "ie_fonte", "qt_fonte", "ie_estilo", "ie_mascara", "qt_casas_decimais", "ie_status",
    "cd_cor", "cd_background", "ie_quebrar_linha",
    "ie_borda_superior", "ie_borda_inferior", "ie_borda_esquerda", "ie_borda_direita",
    "ds_label", "cd_alias", "ds_conteudo",
  ],
  formatoPapel: ["ds_formato_papel", "qt_largura", "qt_altura"],
} as const;

type Registro = Record<string, unknown>;

export interface DadosExportacaoRelatorio {
  relatorio: Registro;
  formatoPapel?: Registro | null;
  parametros: Registro[];
  bandas: (Registro & { elementos: Registro[] })[];
  versaoSistema: string;
}

/** Texto seguro para XML (também em atributos). */
function escapar(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // Caracteres de controle não são válidos em XML 1.0 (menos tab, quebra de linha e CR).
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

const vazio = (v: unknown) => v === null || v === undefined || String(v) === "";

/** Um elemento por campo preenchido, na ordem da lista. */
function campos(registro: Registro, lista: readonly string[], recuo: string): string {
  return lista
    .filter((campo) => !vazio(registro[campo]))
    .map((campo) => `${recuo}<${campo}>${escapar(String(registro[campo]))}</${campo}>\n`)
    .join("");
}

const atributos = (attrs: Record<string, string | number | null | undefined>) =>
  Object.entries(attrs)
    .filter(([, v]) => !vazio(v))
    .map(([k, v]) => ` ${k}="${escapar(String(v))}"`)
    .join("");

const porSequencia = (a: Registro, b: Registro) => Number(a.nr_sequencia ?? 0) - Number(b.nr_sequencia ?? 0);

/** XML do relatório completo (ver o formato no topo do arquivo). */
export function relatorioParaXml(dados: DadosExportacaoRelatorio): string {
  const r = dados.relatorio;
  // Refs locais: a ordem de Sequência de origem (P1, B1, E1...).
  const bandas = [...dados.bandas].sort(porSequencia);
  const refBanda = new Map(bandas.map((b, i) => [String(b.nr_sequencia), `B${i + 1}`]));
  let contElemento = 0;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<!-- Relatório exportado do Quasar (Gerenciador de Relatórios). Sem nr_sequencia: as ligações usam os refs do próprio arquivo. -->\n`;
  xml += `<quasar-relatorio${atributos({ formato: FORMATO_EXPORTACAO_RELATORIO, "versao-sistema": dados.versaoSistema, "exportado-em": new Date().toISOString() })}>\n`;

  xml += `  <relatorio>\n${campos(r, CAMPOS_EXPORTADOS.relatorio, "    ")}`;
  if (dados.formatoPapel) xml += `    <formato-papel>\n${campos(dados.formatoPapel, CAMPOS_EXPORTADOS.formatoPapel, "      ")}    </formato-papel>\n`;
  xml += `  </relatorio>\n`;

  xml += `  <parametros>\n`;
  [...dados.parametros].sort(porSequencia).forEach((p, i) => {
    xml += `    <parametro${atributos({ ref: `P${i + 1}`, ordem: i + 1 })}>\n${campos(p, CAMPOS_EXPORTADOS.parametro, "      ")}    </parametro>\n`;
  });
  xml += `  </parametros>\n`;

  xml += `  <bandas>\n`;
  bandas.forEach((b, i) => {
    const superior = vazio(b.nr_seq_banda_superior) ? undefined : refBanda.get(String(b.nr_seq_banda_superior));
    xml += `    <banda${atributos({ ref: refBanda.get(String(b.nr_sequencia)), ordem: i + 1, "banda-superior": superior })}>\n`;
    xml += campos(b, CAMPOS_EXPORTADOS.banda, "      ");
    xml += `      <elementos>\n`;
    [...b.elementos].sort(porSequencia).forEach((e, j) => {
      contElemento += 1;
      // Sem a imagem: no destino, a instituição escolhe a dela no elemento.
      xml += `        <elemento${atributos({ ref: `E${contElemento}`, ordem: j + 1 })}>\n${campos(e, CAMPOS_EXPORTADOS.elemento, "          ")}        </elemento>\n`;
    });
    xml += `      </elementos>\n    </banda>\n`;
  });
  xml += `  </bandas>\n`;

  xml += `</quasar-relatorio>\n`;
  return xml;
}

/** Nome do arquivo: a Descrição do relatório, sem caracteres inválidos. */
export function nomeArquivoExportacao(relatorio: Registro): string {
  const base = String(relatorio.ds_relatorio || `relatorio-${relatorio.nr_sequencia ?? ""}`)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "relatorio";
  return `${base}.xml`;
}

/* ── Importação: leitura e validação do arquivo ─────────────────────────────────────────── */

export interface ItemImportado {
  /** ref do arquivo (P1, B1, E1...). */
  ref: string;
  campos: Record<string, string>;
}
export interface BandaImportada extends ItemImportado {
  /** ref da banda superior (vazio = sem banda superior). */
  superior: string;
  elementos: ItemImportado[];
}
export interface RelatorioImportado {
  formato: string;
  versaoSistema: string;
  exportadoEm: string;
  relatorio: Record<string, string>;
  formatoPapel: Record<string, string> | null;
  parametros: ItemImportado[];
  bandas: BandaImportada[];
}

/** Valores aceitos de cada campo com opções (os demais: texto livre ou número). */
const OPCOES_IMPORTACAO: Record<string, readonly string[]> = {
  "relatorio.ie_formato": ["xls", "pdf"],
  "relatorio.ie_orientacao": ["P", "I"],
  "relatorio.ie_borda": ["solid_fina", "solid_grossa", "dupla", "tracejada", "pontilhada"],
  "banda.ie_tipo": ["cabecalho", "detalhe", "rodape"],
  "elemento.ie_tipo": ["sql", "conteudo", "imagem", "parametro", "pagina", "data_hora", "usuario", "linha"],
  "elemento.ie_alinhamento": ["centro", "direita", "esquerda"],
  "elemento.ie_fonte": ["arial", "calibri", "courier_new", "times_new_roman", "verdana"],
  "elemento.ie_estilo": ["italico", "italico_sublinhado", "negrito", "negrito_italico", "negrito_sublinhado", "sublinhado", "negrito_italico_sublinhado"],
  "elemento.ie_mascara": ["cep", "cnpj", "cpf", "data", "data_hora", "hora", "moeda", "numero", "porcentagem"],
};
const SIM_NAO = ["S", "N"];
const STATUS = ["A", "I"];
const CAMPOS_SIM_NAO = /^ie_(borda_|nova_pagina|exibir_label|imprimir_vazio|alternar_background|quebrar_linha|perguntar|obrigatorio)/;
/** Campos numéricos: inteiros (qt_*, nr_ordem, nr_camada) ou decimais (margens e medidas do papel). */
const ehDecimal = (campo: string) => campo.startsWith("nr_margem_") || campo === "qt_largura" || campo === "qt_altura";
const ehNumero = (campo: string) => campo.startsWith("qt_") || campo === "nr_ordem" || campo === "nr_camada" || campo.startsWith("nr_margem_");
const ehCor = (campo: string) => campo === "cd_cor" || campo.startsWith("cd_background");

/**
 * Lê e confere um arquivo exportado (formato 1). Devolve os dados ou a lista de problemas
 * encontrados (arquivo que não é XML, de outro tipo, campos com valores inválidos, refs
 * repetidos ou que não existem, mais de um Cabeçalho/Rodapé...). Campos desconhecidos são
 * ignorados (arquivos de versões futuras).
 */
export function lerRelatorioXml(texto: string): { dados: RelatorioImportado | null; problemas: string[] } {
  const problemas: string[] = [];
  const doc = new DOMParser().parseFromString(texto, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) return { dados: null, problemas: ["O arquivo não é um XML válido."] };
  const raiz = doc.documentElement;
  if (raiz.tagName !== "quasar-relatorio") return { dados: null, problemas: ["O arquivo não é um relatório exportado pelo Quasar."] };
  const formato = raiz.getAttribute("formato") ?? "";
  if (formato !== FORMATO_EXPORTACAO_RELATORIO) {
    return { dados: null, problemas: [`Formato do arquivo não suportado (${formato || "sem formato"}). Este ambiente importa o formato ${FORMATO_EXPORTACAO_RELATORIO}.`] };
  }
  const filhos = (el: Element | null | undefined, nome: string) => (el ? Array.from(el.children).filter((c) => c.tagName === nome) : []);
  const filho = (el: Element | null | undefined, nome: string) => filhos(el, nome)[0] ?? null;

  /** Campos conhecidos de um item, conferidos (opções, S/N, status, números e cores). */
  const lerCampos = (el: Element, tipo: keyof typeof CAMPOS_EXPORTADOS, rotulo: string): Record<string, string> => {
    const saida: Record<string, string> = {};
    for (const campo of CAMPOS_EXPORTADOS[tipo]) {
      const valor = filho(el, campo)?.textContent ?? "";
      if (valor === "") continue;
      const opcoes = OPCOES_IMPORTACAO[`${tipo}.${campo}`] ?? (campo === "ie_status" ? STATUS : CAMPOS_SIM_NAO.test(campo) ? SIM_NAO : null);
      if (opcoes && !opcoes.includes(valor)) problemas.push(`${rotulo}: valor "${valor}" inválido em ${campo}.`);
      else if (ehNumero(campo) && !(ehDecimal(campo) ? /^\d+(\.\d+)?$/ : /^\d+$/).test(valor)) problemas.push(`${rotulo}: ${campo} deve ser um número (veio "${valor}").`);
      else if (ehCor(campo) && !/^#[0-9a-fA-F]{6}$/.test(valor)) problemas.push(`${rotulo}: cor "${valor}" inválida em ${campo}.`);
      saida[campo] = valor;
    }
    return saida;
  };

  const elRelatorio = filho(raiz, "relatorio");
  if (!elRelatorio) return { dados: null, problemas: ["O arquivo não tem o relatório (<relatorio>)."] };
  const relatorio = lerCampos(elRelatorio, "relatorio", "Relatório");
  if (!relatorio.ds_relatorio?.trim()) problemas.push("Relatório: sem descrição (ds_relatorio).");
  const elPapel = filho(elRelatorio, "formato-papel");
  const formatoPapel = elPapel ? lerCampos(elPapel, "formatoPapel", "Formato do papel") : null;

  const refs = new Set<string>();
  const lerRef = (el: Element, rotulo: string) => {
    const ref = el.getAttribute("ref") ?? "";
    if (!ref) problemas.push(`${rotulo}: sem ref.`);
    else if (refs.has(ref)) problemas.push(`${rotulo}: ref ${ref} repetido.`);
    refs.add(ref);
    return ref;
  };

  const atributosVistos = new Set<string>();
  const parametros = filhos(filho(raiz, "parametros"), "parametro").map((el, i) => {
    const rotulo = `Parâmetro ${i + 1}`;
    const item = { ref: lerRef(el, rotulo), campos: lerCampos(el, "parametro", rotulo) };
    const atributo = (item.campos.cd_atributo ?? "").trim();
    if (atributo && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(atributo)) problemas.push(`${rotulo}: Atributo "${atributo}" inválido.`);
    if (atributo && atributosVistos.has(atributo.toLowerCase())) problemas.push(`${rotulo}: Atributo "${atributo}" repetido.`);
    atributosVistos.add(atributo.toLowerCase());
    return item;
  });

  const bandas: BandaImportada[] = filhos(filho(raiz, "bandas"), "banda").map((el, i) => {
    const rotulo = `Banda ${i + 1}`;
    return {
      ref: lerRef(el, rotulo),
      superior: el.getAttribute("banda-superior") ?? "",
      campos: lerCampos(el, "banda", rotulo),
      elementos: filhos(filho(el, "elementos"), "elemento").map((e, j) => ({
        ref: lerRef(e, `${rotulo}, elemento ${j + 1}`),
        campos: lerCampos(e, "elemento", `${rotulo}, elemento ${j + 1}`),
      })),
    };
  });
  const porRef = new Map(bandas.map((b) => [b.ref, b]));
  bandas.forEach((b, i) => {
    if (!b.superior) return;
    const superior = porRef.get(b.superior);
    if (b.superior === b.ref) problemas.push(`Banda ${i + 1}: a banda superior não pode ser ela mesma.`);
    else if (!superior) problemas.push(`Banda ${i + 1}: a banda superior ${b.superior} não existe no arquivo.`);
    else if ((superior.campos.ie_tipo ?? "detalhe") !== "detalhe") problemas.push(`Banda ${i + 1}: a banda superior precisa ser do tipo Detalhe.`);
  });
  // Dependência circular (A depende de B, que depende de A).
  for (const b of bandas) {
    const vistas = new Set<string>([b.ref]);
    let atual = b.superior;
    while (atual && porRef.has(atual)) {
      if (vistas.has(atual)) { problemas.push(`Banda ${b.campos.ds_banda || b.ref}: dependência circular entre bandas superiores.`); break; }
      vistas.add(atual);
      atual = porRef.get(atual)?.superior ?? "";
    }
  }
  for (const tipo of ["cabecalho", "rodape"] as const) {
    if (bandas.filter((b) => b.campos.ie_tipo === tipo).length > 1) problemas.push(`O relatório tem mais de uma banda do tipo ${tipo === "cabecalho" ? "Cabeçalho" : "Rodapé"}.`);
  }

  return {
    dados: problemas.length > 0 ? null : {
      formato,
      versaoSistema: raiz.getAttribute("versao-sistema") ?? "",
      exportadoEm: raiz.getAttribute("exportado-em") ?? "",
      relatorio,
      formatoPapel,
      parametros,
      bandas,
    },
    problemas,
  };
}
