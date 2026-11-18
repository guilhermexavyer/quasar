import "server-only";
import { query } from "@/lib/db";
import { urlDaRota, PASTA } from "@/lib/server/storage";
import { formatCpf, formatPhone } from "@/lib/pessoaFisicaUtils";

/**
 * Metadados das tabelas e conversão entre o formato do banco e o formato que a
 * tela usa:
 *   - `id` não existe no banco: a API devolve `id = String(nr_sequencia)`;
 *   - datas sem hora (date) trafegam como 'DD/MM/AAAA';
 *   - instantes (timestamptz) trafegam como string ISO;
 *   - config_* (jsonb) trafegam como string JSON;
 *   - CPF e telefone ficam no banco só com números, e o DDD em nr_ddd; na
 *     tela trafegam com máscara, e o telefone num campo só ((11) 98765-4321);
 *   - coluna nula não aparece no objeto.
 */

/** Tabelas com um único registro (nr_sequencia = 1). */
export const TABELAS_REGISTRO_UNICO = new Set([
  "aviso", "regra",
  "pat_param_codigo_patrimonio", "pat_param_cor_ativo_descartado", "pat_param_cor_ativo_estoque",
  "pat_param_cor_ativo_manutencao", "pat_param_cor_ativo_operacional", "pat_param_cor_manutencao_andamento",
  "pat_param_cor_manutencao_concluida", "pat_param_cor_manutencao_cancelada", "ea_param_matricula_aluno",
  "ea_param_matricula_colaborador", "ea_param_cor_periodo_letivo_andamento", "ea_param_cor_periodo_letivo_encerrado",
  "ea_param_encerramento_automatico_periodo_letivo",
]);

/** Tabelas acessíveis pelas rotas genéricas /api/dados/<colecao>. */
export const TABELAS_DADOS = new Set([
  "cg_sexo", "cg_estado_civil", "cg_cor_raca", "cg_profissao", "cg_orgao_emissor", "cg_logradouro",
  "cg_grau_parentesco", "cg_cargo", "cg_vinculo_contratual", "cg_localizacao", "cg_marca",
  "cg_sistema_operacional", "cg_combustivel", "pat_categoria", "curso",
  "pessoa_fisica", "pessoa_juridica", "aluno", "colaborador", "periodo_letivo", "periodo_letivo_feriado",
  "pat_ativo", "pat_ativo_responsavel", "pat_manutencao",
  "perfil", "usuario", "imagem",
  "relatorio", "relatorio_banda", "relatorio_banda_elemento", "relatorio_parametro",
  ...TABELAS_REGISTRO_UNICO,
]);

/** Colunas gravadas só pelo servidor. */
export const COLUNAS_CONTROLE = new Set(["nr_sequencia", "dt_criacao", "dt_alteracao", "ds_usuario_criacao", "ds_usuario_alteracao"]);

/** Chaves que a tela envia e não são colunas (identificação do cliente). */
const CHAVES_IGNORADAS = new Set(["id", "_idRegistro"]);

/** config_* guardados como texto simples (não são JSON). */
const CONFIG_TEXTO = new Set(["config_tema", "config_perfil_ativo"]);

export type TipoColuna = "texto" | "inteiro" | "numero" | "logico" | "data" | "instante" | "json" | "lista";
export type Colunas = Map<string, TipoColuna>;
export type Registro = Record<string, unknown>;

export class ErroValidacao extends Error {}

/* ── CPF e telefone: só números no banco, máscara na tela ── */

function somenteDigitos(valor: unknown): string {
  return String(valor ?? "").replace(/\D/g, "");
}

/** Telefone vindo da tela ("(11) 98765-4321") → DDD e número, só com dígitos (null = vazio). */
function separarTelefone(valor: unknown): { ddd: string | null; numero: string | null } {
  const digitos = somenteDigitos(valor);
  if (!digitos) return { ddd: null, numero: null };
  if (digitos.length !== 10 && digitos.length !== 11) {
    throw new ErroValidacao("Telefone inválido: informe o DDD e o número (10 ou 11 dígitos).");
  }
  return { ddd: digitos.slice(0, 2), numero: digitos.slice(2) };
}

/** CPF vindo da tela ("123.456.789-09") → 11 dígitos (null = vazio). */
function normalizarCpf(valor: unknown): string | null {
  const digitos = somenteDigitos(valor);
  if (!digitos) return null;
  if (digitos.length !== 11) throw new ErroValidacao("CPF inválido: informe os 11 dígitos.");
  return digitos;
}

/** Banco → tela: CPF com máscara; DDD + número de volta num campo só, com máscara. */
function mascararDocumentos(colunas: Colunas, linha: Registro, saida: Registro) {
  if (colunas.has("nr_cpf") && saida.nr_cpf) saida.nr_cpf = formatCpf(String(saida.nr_cpf));
  if (colunas.has("nr_ddd")) {
    delete saida.nr_ddd;
    if (linha.nr_telefone) saida.nr_telefone = formatPhone(`${linha.nr_ddd ?? ""}${linha.nr_telefone}`);
  }
}

/** Tela → banco: CPF só com números; o telefone é dividido em nr_ddd e nr_telefone. */
function desmascararDocumentos(colunas: Colunas, valores: Map<string, unknown>) {
  if (colunas.has("nr_cpf") && valores.has("nr_cpf")) valores.set("nr_cpf", normalizarCpf(valores.get("nr_cpf")));
  if (colunas.has("nr_ddd")) {
    // O DDD só chega pelo campo Telefone (a tela não conhece nr_ddd).
    valores.delete("nr_ddd");
    if (valores.has("nr_telefone")) {
      const { ddd, numero } = separarTelefone(valores.get("nr_telefone"));
      valores.set("nr_ddd", ddd);
      valores.set("nr_telefone", numero);
    }
  }
}

function tipoDe(dataType: string): TipoColuna {
  switch (dataType) {
    case "bigint":
    case "integer":
    case "smallint":
      return "inteiro";
    case "numeric":
    case "double precision":
    case "real":
      return "numero";
    case "boolean":
      return "logico";
    case "date":
      return "data";
    case "timestamp with time zone":
    case "timestamp without time zone":
      return "instante";
    case "jsonb":
    case "json":
      return "json";
    case "ARRAY":
      return "lista";
    default:
      return "texto";
  }
}

const globalEsquema = globalThis as unknown as { __quasarEsquema?: Promise<Map<string, Colunas>> };

/** Colunas de todas as tabelas (lidas do banco uma vez por instância). */
async function esquema(): Promise<Map<string, Colunas>> {
  if (!globalEsquema.__quasarEsquema) {
    globalEsquema.__quasarEsquema = query<{ table_name: string; column_name: string; data_type: string }>(
      "select table_name, column_name, data_type from information_schema.columns where table_schema = 'public' order by table_name, ordinal_position"
    )
      .then(({ rows }) => {
        const mapa = new Map<string, Colunas>();
        for (const r of rows) {
          if (!mapa.has(r.table_name)) mapa.set(r.table_name, new Map());
          mapa.get(r.table_name)!.set(r.column_name, tipoDe(r.data_type));
        }
        return mapa;
      })
      .catch((erro) => {
        globalEsquema.__quasarEsquema = undefined;
        throw erro;
      });
  }
  return globalEsquema.__quasarEsquema;
}

export async function colunasDe(tabela: string): Promise<Colunas> {
  const colunas = (await esquema()).get(tabela);
  if (!colunas) throw new ErroValidacao(`Coleção desconhecida: ${tabela}`);
  return colunas;
}

/** Identificador SQL entre aspas (nomes vêm sempre da lista de colunas do banco). */
export function ident(nome: string): string {
  return `"${nome.replace(/"/g, '""')}"`;
}

/** config_* que a tela lê e grava como string JSON. */
function ehConfigJson(coluna: string, tipo: TipoColuna): boolean {
  return tipo === "json" && coluna.startsWith("config_");
}

/* ── Datas ── */

function dataValida(ano: number, mes: number, dia: number): boolean {
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return ano >= 1 && ano <= 9999 && d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

/** 'DD/MM/AAAA' (ou 'AAAA-MM-DD' / ISO) → 'AAAA-MM-DD'. */
export function dataParaBanco(valor: unknown, coluna: string): string | null {
  if (valor === null || valor === undefined) return null;
  const texto = String(valor).trim();
  if (texto === "") return null;
  let ano: number, mes: number, dia: number;
  let m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (m) {
    [dia, mes, ano] = [Number(m[1]), Number(m[2]), Number(m[3])];
  } else if ((m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto))) {
    [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  } else if (/^\d{4}-\d{2}-\d{2}T/.test(texto) && !Number.isNaN(new Date(texto).getTime())) {
    // Instante completo: usa o dia no fuso do Brasil.
    const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(texto)).split("-");
    [ano, mes, dia] = partes.map(Number);
  } else {
    throw new ErroValidacao(`Data inválida em ${coluna}: informe no formato DD/MM/AAAA.`);
  }
  if (!dataValida(ano, mes, dia)) throw new ErroValidacao(`Data inválida em ${coluna}.`);
  return `${String(ano).padStart(4, "0")}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/** 'AAAA-MM-DD' → 'DD/MM/AAAA'. */
export function dataParaTela(valor: unknown): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valor ?? ""));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

/* ── Banco → tela ── */

export function paraTela(tabela: string, colunas: Colunas, linha: Registro): Registro {
  const saida: Registro = { id: String(linha.nr_sequencia) };
  for (const [coluna, tipo] of colunas) {
    const valor = linha[coluna];
    if (tabela === "usuario" && coluna === "ds_senha") continue; // o hash nunca sai do servidor
    if (tipo === "data") {
      saida[coluna] = dataParaTela(valor);
      continue;
    }
    if (valor === null || valor === undefined) continue;
    if (ehConfigJson(coluna, tipo)) {
      saida[coluna] = typeof valor === "string" ? valor : JSON.stringify(valor);
    } else if (tabela === "imagem" && coluna === "ie_arquivo" && String(valor).startsWith(PASTA)) {
      saida[coluna] = urlDaRota(String(valor)); // a tela exibe e baixa pela rota do próprio site
    } else if (tabela === "relatorio_banda_elemento" && coluna === "nr_seq_imagem") {
      saida[coluna] = String(valor); // a tela compara com imagem.id (string)
    } else {
      saida[coluna] = valor;
    }
  }
  mascararDocumentos(colunas, linha, saida);
  return saida;
}

/** Registro no formato da tela, sem o `id` virtual (para auditoria e exclusões). */
export function paraHistorico(tabela: string, colunas: Colunas, linha: Registro): Registro {
  const { id: _id, ...resto } = paraTela(tabela, colunas, linha);
  void _id;
  if (tabela === "relatorio") delete resto.bandas; // bandas têm auditoria própria
  return resto;
}

/* ── Tela → banco ── */

function converter(coluna: string, tipo: TipoColuna, valor: unknown): unknown {
  if (valor === null || valor === undefined) return null;
  switch (tipo) {
    case "data":
      return dataParaBanco(valor, coluna);
    case "instante": {
      if (valor === "") return null;
      const d = new Date(String(valor));
      if (Number.isNaN(d.getTime())) throw new ErroValidacao(`Data/hora inválida em ${coluna}.`);
      return d.toISOString();
    }
    case "inteiro":
    case "numero": {
      if (valor === "") return null;
      const n = typeof valor === "number" ? valor : Number(String(valor).trim());
      if (!Number.isFinite(n) || (tipo === "inteiro" && !Number.isInteger(n))) {
        throw new ErroValidacao(`Número inválido em ${coluna}.`);
      }
      return n;
    }
    case "logico":
      if (valor === "") return null;
      if (typeof valor === "boolean") return valor;
      if (valor === "true" || valor === "false") return valor === "true";
      throw new ErroValidacao(`Valor inválido em ${coluna}.`);
    case "json": {
      if (ehConfigJson(coluna, tipo) && typeof valor === "string") {
        if (valor === "") return null;
        try {
          return JSON.stringify(JSON.parse(valor));
        } catch {
          return JSON.stringify(valor); // texto que não é JSON: guarda como string JSON
        }
      }
      return JSON.stringify(valor);
    }
    case "lista":
      return Array.isArray(valor) ? valor.map((v) => String(v)) : null;
    default:
      if (CONFIG_TEXTO.has(coluna)) return String(valor);
      return typeof valor === "string" ? valor : String(valor);
  }
}

/**
 * Converte o que a tela enviou em valores de coluna. Colunas de controle e
 * identificação do cliente são descartadas; chaves que não são colunas são
 * devolvidas em `desconhecidas` (o chamador registra no log do servidor).
 */
export function paraBanco(colunas: Colunas, dados: Registro): { valores: Map<string, unknown>; desconhecidas: string[] } {
  const valores = new Map<string, unknown>();
  const desconhecidas: string[] = [];
  for (const [chave, valor] of Object.entries(dados)) {
    if (valor === undefined || COLUNAS_CONTROLE.has(chave) || CHAVES_IGNORADAS.has(chave) || chave.startsWith("_")) continue;
    const tipo = colunas.get(chave);
    if (!tipo) {
      desconhecidas.push(chave);
      continue;
    }
    valores.set(chave, converter(chave, tipo, valor));
  }
  desmascararDocumentos(colunas, valores);
  return { valores, desconhecidas };
}

/** Expressão do parâmetro SQL conforme o tipo (jsonb vai como texto JSON). */
export function parametro(tipo: TipoColuna, indice: number): string {
  return tipo === "json" ? `$${indice}::jsonb` : `$${indice}`;
}

/* ── Comparação (houve alteração?) ── */

function estavel(valor: unknown): string {
  if (Array.isArray(valor)) return `[${valor.map(estavel).join(",")}]`;
  if (valor && typeof valor === "object") {
    return `{${Object.keys(valor as object).sort().map((k) => `${JSON.stringify(k)}:${estavel((valor as Registro)[k])}`).join(",")}}`;
  }
  return JSON.stringify(valor ?? null);
}

/** Compara o valor atual da linha com o novo valor já convertido por `paraBanco`. */
export function mesmoValor(tipo: TipoColuna, atual: unknown, novo: unknown): boolean {
  if (tipo === "json") {
    const novoObjeto = typeof novo === "string" ? JSON.parse(novo) : novo;
    return estavel(atual ?? null) === estavel(novoObjeto ?? null);
  }
  if (tipo === "instante") {
    const a = atual ? new Date(String(atual)).getTime() : null;
    const b = novo ? new Date(String(novo)).getTime() : null;
    return a === b;
  }
  return estavel(atual ?? null) === estavel(novo ?? null);
}
