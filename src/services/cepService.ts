/** Endereço retornado pela API do ViaCEP (apenas o que usamos). */
export interface EnderecoCep {
  cep: string;
  logradouro: string;
  bairro: string;
  /** Sigla da UF (ex.: SP) — usada para autofill do campo UF. */
  uf: string;
}

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  uf?: string;
  erro?: boolean;
}

/* Cache simples por CEP (somente dígitos) — evita repetir a mesma consulta. */
const cache = new Map<string, EnderecoCep>();

/**
 * Consulta um CEP na API do ViaCEP e retorna logradouro (Rua) e bairro.
 * Retorna null quando o CEP é inválido (menos de 8 dígitos) ou não existe
 * na base dos Correios (resposta com "erro": true). Lança em falha de rede.
 */
export async function buscarEnderecoPorCep(cep: string): Promise<EnderecoCep | null> {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;

  const cached = cache.get(digits);
  if (cached) return cached;

  const resp = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!resp.ok) throw new Error(`ViaCEP HTTP ${resp.status}`);

  const data = (await resp.json()) as ViaCepResponse;
  if (data.erro) return null;

  const endereco: EnderecoCep = {
    cep: digits,
    logradouro: data.logradouro ?? '',
    bairro: data.bairro ?? '',
    uf: data.uf ?? '',
  };
  cache.set(digits, endereco);
  return endereco;
}
