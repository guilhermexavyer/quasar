/** Cidade retornada pela API de localidades do IBGE (apenas o que usamos). */
export interface Cidade {
  id: number;
  nome: string;
  uf: string;
}

interface MunicipioIBGE {
  id: number;
  nome: string;
  microrregiao?: {
    mesorregiao?: {
      UF?: {
        sigla: string;
      };
    };
  };
}

let cache: Cidade[] | null = null;
let promiseCache: Promise<Cidade[]> | null = null;

/**
 * Busca todos os municípios brasileiros na API do IBGE uma única vez e
 * mantém em cache na memória. Retorna ordenado por nome (crescente).
 */
export async function obterMunicipios(): Promise<Cidade[]> {
  if (cache) return cache;
  if (!promiseCache) {
    promiseCache = fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome"
    )
      .then((resp) => {
        if (!resp.ok) throw new Error(`IBGE HTTP ${resp.status}`);
        return resp.json();
      })
      .then((data: MunicipioIBGE[]) => {
        cache = data.map((m) => ({
          id: m.id,
          nome: m.nome,
          uf: m.microrregiao?.mesorregiao?.UF?.sigla ?? "",
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

export interface FiltroCidade {
  codigo?: string;
  nome?: string;
  uf?: string;
}

/** Filtra os municípios por código IBGE, nome e/ou UF. */
export async function buscarCidades(filtro: FiltroCidade): Promise<Cidade[]> {
  const todas = await obterMunicipios();
  const codigo = (filtro.codigo ?? "").replace(/\D/g, "");
  const nome = (filtro.nome ?? "").trim().toLowerCase();
  const uf = (filtro.uf ?? "").trim().toUpperCase();

  return todas.filter((cidade) => {
    if (codigo && !String(cidade.id).startsWith(codigo)) return false;
    if (nome && !cidade.nome.toLowerCase().includes(nome)) return false;
    if (uf && cidade.uf !== uf) return false;
    return true;
  });
}

/** Retorna a cidade que possui exatamente o código IBGE informado (ou null). */
export async function cidadePorCodigo(codigo: string | number | null | undefined): Promise<Cidade | null> {
  if (codigo === null || codigo === undefined) return null;
  const id = Number(String(codigo).replace(/\D/g, ""));
  if (!id) return null;
  const todas = await obterMunicipios();
  return todas.find((cidade) => cidade.id === id) ?? null;
}
