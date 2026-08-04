/** Estado (UF) retornado pela API de localidades do IBGE (apenas o que usamos). */
export interface Estado {
  sigla: string;
  nome: string;
}

interface EstadoIBGE {
  id: number;
  sigla: string;
  nome: string;
}

let cache: Estado[] | null = null;
let promiseCache: Promise<Estado[]> | null = null;

/**
 * Busca todos os estados brasileiros na API do IBGE uma única vez e
 * mantém em cache na memória. Retorna ordenado por nome (crescente).
 */
export async function obterEstados(): Promise<Estado[]> {
  if (cache) return cache;
  if (!promiseCache) {
    promiseCache = fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome"
    )
      .then((resp) => {
        if (!resp.ok) throw new Error(`IBGE HTTP ${resp.status}`);
        return resp.json();
      })
      .then((data: EstadoIBGE[]) => {
        cache = data.map((e) => ({
          sigla: e.sigla,
          nome: e.nome,
        }));
        return cache;
      })
      .catch((err) => {
        promiseCache = null;
        throw err;
      });
  }
  return promiseCache;
}
