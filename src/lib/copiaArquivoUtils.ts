/**
 * Tipos de arquivo que podem ser anexados em Controle de Cópias > Cópias.
 * O parâmetro "Tipos de arquivo para anexar em 'Cópias'" (copia_param_tipos_arquivo)
 * guarda em ds_regra as extensões marcadas, separadas por vírgula (ex.: "pdf,docx").
 * Usado na tela (checkboxes do parâmetro e `accept` do input file) e no servidor (validação do envio).
 */

export interface ExtensaoArquivoCopia {
  /** Extensão sem ponto, em minúsculas. */
  ext: string;
  /** Descrição exibida ao lado do checkbox. */
  descricao: string;
  /** Grupo (título) dos checkboxes. */
  grupo: string;
  /** Tipo MIME (usado no `accept` e no envio). */
  mime: string;
}

export const EXTENSOES_ARQUIVO_COPIA: ExtensaoArquivoCopia[] = [
  { ext: "pdf", descricao: "PDF", grupo: "Documentos", mime: "application/pdf" },
  { ext: "doc", descricao: "Word 97-2003", grupo: "Documentos", mime: "application/msword" },
  { ext: "docx", descricao: "Word", grupo: "Documentos", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  { ext: "odt", descricao: "OpenDocument (texto)", grupo: "Documentos", mime: "application/vnd.oasis.opendocument.text" },
  { ext: "rtf", descricao: "Rich Text", grupo: "Documentos", mime: "application/rtf" },
  { ext: "txt", descricao: "Texto", grupo: "Documentos", mime: "text/plain" },
  { ext: "xps", descricao: "XPS", grupo: "Documentos", mime: "application/vnd.ms-xpsdocument" },
  { ext: "xls", descricao: "Excel 97-2003", grupo: "Planilhas", mime: "application/vnd.ms-excel" },
  { ext: "xlsx", descricao: "Excel", grupo: "Planilhas", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  { ext: "ods", descricao: "OpenDocument (planilha)", grupo: "Planilhas", mime: "application/vnd.oasis.opendocument.spreadsheet" },
  { ext: "csv", descricao: "CSV", grupo: "Planilhas", mime: "text/csv" },
  { ext: "ppt", descricao: "PowerPoint 97-2003", grupo: "Apresentações", mime: "application/vnd.ms-powerpoint" },
  { ext: "pptx", descricao: "PowerPoint", grupo: "Apresentações", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
  { ext: "odp", descricao: "OpenDocument (apresentação)", grupo: "Apresentações", mime: "application/vnd.oasis.opendocument.presentation" },
  { ext: "jpg", descricao: "JPG", grupo: "Imagens", mime: "image/jpeg" },
  { ext: "jpeg", descricao: "JPEG", grupo: "Imagens", mime: "image/jpeg" },
  { ext: "png", descricao: "PNG", grupo: "Imagens", mime: "image/png" },
  { ext: "gif", descricao: "GIF", grupo: "Imagens", mime: "image/gif" },
  { ext: "bmp", descricao: "Bitmap", grupo: "Imagens", mime: "image/bmp" },
  { ext: "tif", descricao: "TIF", grupo: "Imagens", mime: "image/tiff" },
  { ext: "tiff", descricao: "TIFF", grupo: "Imagens", mime: "image/tiff" },
  { ext: "svg", descricao: "SVG", grupo: "Imagens", mime: "image/svg+xml" },
  { ext: "webp", descricao: "WebP", grupo: "Imagens", mime: "image/webp" },
  { ext: "eps", descricao: "EPS", grupo: "Gráficos", mime: "application/postscript" },
  { ext: "ps", descricao: "PostScript", grupo: "Gráficos", mime: "application/postscript" },
  { ext: "ai", descricao: "Illustrator", grupo: "Gráficos", mime: "application/postscript" },
  { ext: "psd", descricao: "Photoshop", grupo: "Gráficos", mime: "image/vnd.adobe.photoshop" },
  { ext: "cdr", descricao: "CorelDRAW", grupo: "Gráficos", mime: "application/vnd.corel-draw" },
  { ext: "pub", descricao: "Publisher", grupo: "Gráficos", mime: "application/x-mspublisher" },
];

/** Enquanto o parâmetro não for salvo, só PDF é permitido. */
export const EXTENSOES_COPIA_PADRAO = ["pdf"];

/** Tamanho máximo de um arquivo anexado em Cópias (também é o limite do bucket). */
export const TAMANHO_MAXIMO_ARQUIVO_COPIA = 50 * 1024 * 1024;

const CONHECIDAS = new Set(EXTENSOES_ARQUIVO_COPIA.map((e) => e.ext));

/**
 * Extensões permitidas a partir do valor salvo do parâmetro.
 * null/undefined (nunca salvo) = padrão; "" (salvo sem nenhuma marcada) = nenhuma.
 */
export function extensoesPermitidasCopia(valor: string | null | undefined): string[] {
  if (valor === null || valor === undefined) return [...EXTENSOES_COPIA_PADRAO];
  return valor
    .split(",")
    .map((v) => v.trim().toLowerCase().replace(/^\./, ""))
    .filter((v, i, lista) => v !== "" && CONHECIDAS.has(v) && lista.indexOf(v) === i);
}

/** Valor gravado no parâmetro (mesma ordem da lista de extensões). */
export function serializarExtensoesCopia(exts: string[]): string {
  const marcadas = new Set(exts);
  return EXTENSOES_ARQUIVO_COPIA.filter((e) => marcadas.has(e.ext)).map((e) => e.ext).join(",");
}

/** Extensão (sem ponto, minúscula) de um nome de arquivo. */
export function extensaoDoArquivo(nome: string): string {
  const i = nome.lastIndexOf(".");
  return i >= 0 ? nome.slice(i + 1).trim().toLowerCase() : "";
}

/**
 * `accept` do input file: só as extensões permitidas (o seletor do sistema mostra apenas esses
 * arquivos). Sem tipos MIME: um MIME pode cobrir mais de uma extensão (ex.: .eps e .ai).
 */
export function acceptDoArquivoCopia(exts: string[]): string {
  const marcadas = new Set(exts);
  return EXTENSOES_ARQUIVO_COPIA.filter((e) => marcadas.has(e.ext)).map((e) => `.${e.ext}`).join(",");
}

export function mimeDoArquivoCopia(nome: string): string {
  const ext = extensaoDoArquivo(nome);
  return EXTENSOES_ARQUIVO_COPIA.find((e) => e.ext === ext)?.mime ?? "application/octet-stream";
}

/** Nome do arquivo (última parte do caminho salvo em ie_arquivo). */
export function nomeDoArquivoCopia(caminho: string | null | undefined): string {
  const v = String(caminho ?? "");
  return v.slice(v.lastIndexOf("/") + 1);
}

/** Rota que entrega o arquivo de uma cópia (o servidor redireciona para uma URL assinada de validade curta). */
export function urlDoArquivoCopia(caminho: string): string {
  return `/api/copias/arquivo?caminho=${encodeURIComponent(caminho)}`;
}
