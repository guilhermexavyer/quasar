/**
 * SQL dos relatórios (Gerenciador de Relatórios > banda do relatório XLS).
 *
 * Parâmetros são escritos no SQL como `:nome` (ex.: `where nr_sequencia = :teste`).
 * Antes de executar, cada `:nome` vira um placeholder do PostgreSQL ($1, $2...; o mesmo
 * nome usa o mesmo número), e os valores vão separados do texto — nunca concatenados.
 *
 * A leitura ignora o que não é código: textos ('...', E'...', $tag$...$tag$), nomes entre
 * aspas duplas, comentários (-- e /* *\/) e conversões de tipo (::text).
 */

export interface SqlPreparado {
  /** SQL com $1, $2... no lugar dos parâmetros, sem ponto e vírgula final. */
  texto: string;
  /** Nome de cada placeholder, na ordem ($1 = nomes[0]). */
  nomes: string[];
  /** Só o código (sem textos e comentários), para as verificações de segurança. */
  codigo: string;
}

const INICIO_NOME = /[A-Za-z_]/;
const PARTE_NOME = /[A-Za-z0-9_]/;

/** Nome do parâmetro como gravado (sem ":" e sem espaços), para comparar com o SQL. */
export function nomeDoParametro(valor: string | null | undefined): string {
  return String(valor ?? "").trim().replace(/^:+/, "");
}

export function prepararSql(sql: string): SqlPreparado {
  let texto = "";
  let codigo = "";
  const nomes: string[] = [];
  const indice = new Map<string, number>();
  let i = 0;
  const n = sql.length;

  while (i < n) {
    const c = sql[i];
    const prox = sql[i + 1];

    // Comentário de linha
    if (c === "-" && prox === "-") {
      const fim = sql.indexOf("\n", i);
      const ate = fim < 0 ? n : fim;
      texto += sql.slice(i, ate);
      codigo += " ";
      i = ate;
      continue;
    }
    // Comentário de bloco (pode ser aninhado no PostgreSQL)
    if (c === "/" && prox === "*") {
      let nivel = 1;
      let j = i + 2;
      while (j < n && nivel > 0) {
        if (sql[j] === "/" && sql[j + 1] === "*") { nivel++; j += 2; }
        else if (sql[j] === "*" && sql[j + 1] === "/") { nivel--; j += 2; }
        else j++;
      }
      texto += sql.slice(i, j);
      codigo += " ";
      i = j;
      continue;
    }
    // Texto entre aspas simples ('' escapa a aspa; E'...' aceita \')
    if (c === "'") {
      const comBarra = i > 0 && /[eE]/.test(sql[i - 1]) && (i < 2 || !PARTE_NOME.test(sql[i - 2]));
      let j = i + 1;
      while (j < n) {
        if (comBarra && sql[j] === "\\") { j += 2; continue; }
        if (sql[j] === "'") {
          if (sql[j + 1] === "'") { j += 2; continue; }
          j++;
          break;
        }
        j++;
      }
      texto += sql.slice(i, j);
      codigo += " '' ";
      i = j;
      continue;
    }
    // Nome entre aspas duplas (entra no código: pode ser o nome de uma função)
    if (c === '"') {
      let j = i + 1;
      while (j < n) {
        if (sql[j] === '"') {
          if (sql[j + 1] === '"') { j += 2; continue; }
          j++;
          break;
        }
        j++;
      }
      const trecho = sql.slice(i, j);
      texto += trecho;
      codigo += trecho;
      i = j;
      continue;
    }
    // Texto entre cifrões: $$...$$ ou $tag$...$tag$
    if (c === "$") {
      const m = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i));
      if (m) {
        const marca = m[0];
        const fim = sql.indexOf(marca, i + marca.length);
        const ate = fim < 0 ? n : fim + marca.length;
        texto += sql.slice(i, ate);
        codigo += " '' ";
        i = ate;
        continue;
      }
    }
    // Conversão de tipo (::)
    if (c === ":" && prox === ":") {
      texto += "::";
      codigo += "::";
      i += 2;
      continue;
    }
    // Parâmetro :nome
    if (c === ":" && prox !== undefined && INICIO_NOME.test(prox)) {
      let j = i + 1;
      while (j < n && PARTE_NOME.test(sql[j])) j++;
      const nome = sql.slice(i + 1, j);
      let pos = indice.get(nome);
      if (pos === undefined) {
        nomes.push(nome);
        pos = nomes.length;
        indice.set(nome, pos);
      }
      texto += `$${pos}`;
      codigo += `$${pos}`;
      i = j;
      continue;
    }
    texto += c;
    codigo += c;
    i++;
  }

  // Sem ponto e vírgula no fim (uma consulta só).
  texto = texto.replace(/[\s;]+$/, "");
  return { texto, nomes, codigo };
}

/** Nomes dos parâmetros (:nome) usados no SQL, na ordem em que aparecem. */
export function parametrosDoSql(sql: string): string[] {
  return prepararSql(sql).nomes;
}

/**
 * Funções que trocam o papel da conexão ou executam outro SQL por dentro (fugindo das
 * restrições do papel de leitura), além de acesso a arquivos e objetos grandes.
 */
const BLOQUEADOS: { padrao: RegExp; motivo: string }[] = [
  { padrao: /\bset_config\b/i, motivo: "set_config" },
  { padrao: /\b(query|table|database|schema|cursor)_to_xml(schema|_and_xmlschema)?\b/i, motivo: "funções *_to_xml" },
  { padrao: /\bdblink\w*/i, motivo: "dblink" },
  { padrao: /\bpg_(read_file|read_binary_file|ls_dir|stat_file|ls_\w+)\b/i, motivo: "acesso a arquivos" },
  { padrao: /\blo_\w+/i, motivo: "objetos grandes (lo_*)" },
  { padrao: /\bpg_(terminate|cancel)_backend\b/i, motivo: "controle de conexões" },
  { padrao: /\bu&["']/i, motivo: "escapes Unicode (U&)" },
];

/**
 * Confere o SQL antes de executar: uma consulta só, começando com SELECT ou WITH, e
 * nenhuma função bloqueada. Devolve a mensagem do problema ou null.
 */
export function problemaDoSql(preparado: SqlPreparado): string | null {
  const codigo = preparado.codigo.trim();
  if (!codigo) return "O SQL da banda está vazio.";
  if (/;\s*\S/.test(preparado.codigo.replace(/[\s;]+$/, ""))) return "O SQL deve ter uma consulta só (sem ';' no meio).";
  if (!/^\(*\s*(select|with)\b/i.test(codigo)) return "O SQL deve ser uma consulta (começar com SELECT ou WITH).";
  for (const { padrao, motivo } of BLOQUEADOS) {
    if (padrao.test(preparado.codigo)) return `O SQL usa um recurso não permitido nos relatórios (${motivo}).`;
  }
  return null;
}

/** Status do relatório, da banda, do elemento e do parâmetro: sem valor (antigo) = ativo. */
export const itemAtivo = (item: { ie_status?: string | null } | null | undefined) => (item?.ie_status ?? "A") !== "I";

/**
 * Bandas que saem no relatório: as ativas cuja Banda superior (se houver) também sai.
 * Banda inativa leva junto as dependentes dela (direta ou indiretamente).
 */
export function bandasQueSaem<T extends { ie_status?: string | null }>(
  bandas: T[], nrDe: (b: T) => unknown, superiorDe: (b: T) => unknown,
): T[] {
  const porNr = new Map(bandas.map((b) => [String(nrDe(b)), b]));
  const sai = (b: T, visitadas = new Set<string>()): boolean => {
    if (!itemAtivo(b)) return false;
    const sup = superiorDe(b);
    if (sup === null || sup === undefined || sup === "") return true;
    const chave = String(sup);
    const superior = porNr.get(chave);
    // Banda superior que não existe mais: a banda sai sozinha (como antes).
    if (!superior) return true;
    if (visitadas.has(chave)) return false; // ciclo (não deveria existir)
    visitadas.add(chave);
    return sai(superior, visitadas);
  };
  return bandas.filter((b) => sai(b));
}
