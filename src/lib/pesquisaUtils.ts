/** Texto para comparação: minúsculo e sem acentos. */
function normalizar(valor: unknown): string {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Pesquisa dos campos de busca das listas, como o LIKE do SQL: o termo é
 * procurado em qualquer parte do texto (como '%termo%') e o % separa partes
 * que precisam aparecer nessa ordem, com qualquer coisa entre elas
 * ("pessoa%fis" encontra "Pessoa Física"). Ignora maiúsculas e acentos.
 * Recebe os textos exibidos na linha; basta um deles corresponder.
 */
export function correspondePesquisa(textos: unknown[], termo: string): boolean {
  const partes = normalizar(termo).split("%").filter((p) => p !== "");
  if (partes.length === 0) return true;
  return textos.some((t) => {
    const texto = normalizar(t);
    let inicio = 0;
    for (const parte of partes) {
      const pos = texto.indexOf(parte, inicio);
      if (pos === -1) return false;
      inicio = pos + parte.length;
    }
    return true;
  });
}

/** Filtra as linhas de uma lista pelo termo pesquisado (textos exibidos de cada linha). */
export function filtrarPesquisa<T>(linhas: T[], termo: string, textos: (linha: T) => unknown[]): T[] {
  if (!termo.trim()) return linhas;
  return linhas.filter((l) => correspondePesquisa(textos(l), termo));
}
