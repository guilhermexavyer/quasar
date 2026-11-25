import { NextResponse, type NextRequest } from "next/server";
import type { FieldDef, PoolClient } from "pg";
import { pool, query } from "@/lib/db";
import { bandasQueSaem, itemAtivo, nomeDoParametro, prepararSql, problemaDoSql, type SqlPreparado } from "@/lib/relatorioSql";
import { exigirPermissaoDaFuncao } from "@/lib/server/acesso";
import { ErroValidacao, type Registro } from "@/lib/server/esquema";
import { corpo, numeroDaUrl, rota } from "@/lib/server/http";

/**
 * Gera os dados de um relatório (Gerenciador de Relatórios > Relatórios > Gerar relatório).
 * Corpo: { valores: { <parâmetro>: <valor> }, modo?: "pdf" } (valores = os perguntados no modal).
 *
 * Inativos (ie_status 'I'): o relatório não é gerado; a banda não sai (nem as dependentes
 * dela); o parâmetro não vale (o :nome fica vazio).
 *
 * SQL de cada banda: o da própria banda; vazio, o SQL do relatório (capa).
 *
 * XLS (sem modo): o SQL da banda Detalhe (ou sem tipo) de menor Sequência — sem banda, o
 * SQL do relatório. Devolve { colunas, linhas } para a tela montar a planilha.
 *
 * PDF (modo "pdf"): o SQL de todas as bandas. Devolve { bandas: { <nr da banda>: dados } }
 * com o Cabeçalho, o Rodapé e as bandas Detalhe sem banda superior. Banda dependente
 * (Banda superior): roda uma vez para cada linha da banda superior, e cada :NOME do SQL
 * dela recebe o valor da coluna NOME daquela linha (da banda superior mais próxima que
 * tiver a coluna); sem coluna com o nome, vale o parâmetro do relatório. Os dados dela
 * vão em `filhas[i][<nr da banda>]` (i = linha da banda superior).
 *
 * O SQL vem do banco (nunca do pedido) e roda com várias travas:
 *   - permissão "Permite gerar relatório" do perfil ativo;
 *   - uma consulta só, começando com SELECT/WITH, sem funções que trocam de papel ou
 *     executam outro SQL (relatorioSql.problemaDoSql);
 *   - transação SOMENTE LEITURA desde o primeiro comando, sempre desfeita no fim;
 *   - papel quasar_relatorio (só SELECT; sem sessao nem usuario.ds_senha);
 *   - tempo máximo por consulta, limite de linhas (somando todas as bandas) e de execuções.
 * Parâmetros (:nome) viram $1, $2... com os valores separados do SQL.
 *
 * Relatório gerado mesmo sem SQL ou com SQL inválido (para testes): sem SQL, SQL barrado
 * pelas travas (que então nem é executado), erro de sintaxe, tabela ou coluna desconhecida
 * etc. deixam a banda vazia, sem aviso (cada consulta roda num savepoint, então o erro de
 * uma não derruba as outras). Parâmetro do SQL que não está cadastrado vai como nulo. Só o
 * tempo máximo, os limites e os parâmetros obrigatórios sem valor dão erro.
 */

const TEMPO_MAXIMO = "60s";
const MAXIMO_LINHAS = 200_000;
/** Máximo de consultas num PDF (bandas dependentes rodam uma vez por linha da superior). */
const MAXIMO_EXECUCOES = 5_000;
/** Níveis de bandas dependentes (proteção contra configurações em ciclo). */
const MAXIMO_NIVEIS = 10;

type TipoColuna = "numero" | "data" | "datahora" | "booleano" | "texto";

interface Dados {
  colunas: { nome: string; tipo: TipoColuna }[];
  linhas: unknown[][];
  /** PDF: dados das bandas dependentes, por linha (filhas[i][<nr da banda>]). */
  filhas?: Record<string, Dados>[];
}

interface Banda { nr: number; tipo: string | null; sql: string; superior: number | null }

/** Tipo da coluna para a tela (pelo OID do tipo no PostgreSQL). */
function tipoDaColuna(campo: FieldDef): TipoColuna {
  switch (campo.dataTypeID) {
    case 20: case 21: case 23: case 26: case 700: case 701: case 1700: case 790:
      return "numero";
    case 1082:
      return "data";
    case 1114: case 1184:
      return "datahora";
    case 16:
      return "booleano";
    default:
      return "texto";
  }
}

/** Valor pronto para JSON (objetos e listas viram texto, como o SGBD mostraria). */
function valorDaCelula(valor: unknown): unknown {
  if (valor === null || valor === undefined) return null;
  if (valor instanceof Date) return valor.toISOString();
  if (Buffer.isBuffer(valor)) return `\\x${valor.toString("hex")}`;
  if (typeof valor === "object") return JSON.stringify(valor);
  return valor;
}

const vazio = (): Dados => ({ colunas: [], linhas: [] });

/** Erro do PostgreSQL causado pelo SQL do relatório (tem código SQLSTATE); sem código = erro interno. */
function erroDoSql(e: unknown): string | null {
  const codigo = (e as { code?: unknown } | null)?.code;
  return typeof codigo === "string" ? codigo : null;
}

/** Linha de uma banda superior: valor de cada coluna (nome em minúsculas). */
type Contexto = Map<string, unknown>;

export async function POST(request: NextRequest, { params }: { params: Promise<{ nr: string }> }) {
  const { nr } = await params;
  return rota(request, async (sessao) => {
    const nrRelatorio = numeroDaUrl(nr);
    const dados = await corpo(request);
    await exigirPermissaoDaFuncao(sessao, "relatorio", "gerar_relatorio");
    const valoresTela = (dados.valores && typeof dados.valores === "object" ? dados.valores : {}) as Record<string, unknown>;
    const modoPdf = dados.modo === "pdf";

    // ── Configuração do relatório (SQL da capa, bandas e parâmetros) ──
    const { rows: relatorios } = await query<Registro>("select ds_sql, ie_status from relatorio where nr_sequencia = $1", [nrRelatorio]);
    if (relatorios.length === 0) throw new ErroValidacao("Relatório não encontrado.");
    if (!itemAtivo(relatorios[0])) throw new ErroValidacao("O relatório está inativo.");
    const sqlCapa = String(relatorios[0].ds_sql ?? "");
    const { rows: linhasBanda } = await query<Registro>(
      "select nr_sequencia, ie_tipo, ds_sql, nr_seq_banda_superior, ie_status from relatorio_banda where nr_seq_relatorio = $1 order by nr_sequencia",
      [nrRelatorio]
    );
    // Só as bandas que saem: ativas, com a banda superior (se houver) também saindo.
    const bandas: Banda[] = bandasQueSaem(linhasBanda, (b) => b.nr_sequencia, (b) => b.nr_seq_banda_superior).map((b) => ({
      nr: Number(b.nr_sequencia),
      tipo: (b.ie_tipo as string | null) ?? null,
      // Banda sem SQL próprio usa o SQL do relatório.
      sql: String(b.ds_sql ?? "").trim() ? String(b.ds_sql) : sqlCapa,
      superior: b.nr_seq_banda_superior == null ? null : Number(b.nr_seq_banda_superior),
    }));
    const { rows: parametros } = await query<Registro>(
      "select cd_atributo, ds_parametro, ds_label, vl_padrao, ie_perguntar, ie_obrigatorio from relatorio_parametro where nr_seq_relatorio = $1 and coalesce(ie_status, 'A') = 'A'",
      [nrRelatorio]
    );
    const porNome = new Map(parametros.map((p) => [nomeDoParametro(p.cd_atributo as string).toLowerCase(), p]));

    /** Valor de um parâmetro do relatório: o informado no modal (Perguntar) ou o valor padrão. */
    function valorDoParametro(nome: string): string | null {
      const parametro = porNome.get(nome.toLowerCase());
      if (!parametro) return null;
      const chave = nomeDoParametro(parametro.cd_atributo as string);
      const perguntado = parametro.ie_perguntar === "S" && Object.prototype.hasOwnProperty.call(valoresTela, chave);
      const bruto = perguntado ? valoresTela[chave] : parametro.vl_padrao;
      const valor = bruto === null || bruto === undefined ? "" : String(bruto).trim();
      if (valor === "" && parametro.ie_obrigatorio === "S") {
        throw new ErroValidacao(`Informe o parâmetro "${String(parametro.ds_label || parametro.ds_parametro || chave)}".`);
      }
      return valor === "" ? null : valor;
    }

    /** SQL preparado de cada texto (null = vazio ou barrado pelas travas: não é executado). */
    const preparados = new Map<string, SqlPreparado | null>();
    function preparar(sql: string): SqlPreparado | null {
      if (!preparados.has(sql)) {
        const preparado = sql.trim() ? prepararSql(sql) : null;
        preparados.set(sql, preparado && !problemaDoSql(preparado) ? preparado : null);
      }
      return preparados.get(sql) ?? null;
    }

    let totalLinhas = 0;
    let execucoes = 0;

    /** Executa o SQL (num savepoint: o erro de uma consulta deixa só ela vazia). */
    async function executar(db: PoolClient, sql: string, contextos: Contexto[]): Promise<{ dados: Dados; brutas: unknown[][]; nomes: string[] }> {
      const preparado = preparar(sql);
      if (!preparado) return { dados: vazio(), brutas: [], nomes: [] };
      // Parâmetros: coluna da banda superior mais próxima com o nome; senão, o do relatório.
      const valores = preparado.nomes.map((nome) => {
        const alvo = nome.toLowerCase();
        for (const contexto of contextos) if (contexto.has(alvo)) return contexto.get(alvo) ?? null;
        return valorDoParametro(nome);
      });
      if (++execucoes > MAXIMO_EXECUCOES) {
        throw new ErroValidacao(`O relatório passou de ${MAXIMO_EXECUCOES.toLocaleString("pt-BR")} consultas (bandas dependentes rodam uma vez por registro da banda superior). Use parâmetros para filtrar.`);
      }
      await db.query("savepoint banda");
      let resultado;
      try {
        resultado = await db.query({ text: preparado.texto, values: valores, rowMode: "array" });
        await db.query("release savepoint banda");
      } catch (e) {
        const codigo = erroDoSql(e);
        if (!codigo) throw e;
        if (codigo === "57014") throw new ErroValidacao("A consulta demorou demais e foi cancelada.");
        // Sintaxe, tabela/coluna desconhecida, permissão, tipo de dado...: banda vazia.
        await db.query("rollback to savepoint banda");
        return { dados: vazio(), brutas: [], nomes: [] };
      }
      totalLinhas += resultado.rows.length;
      if (totalLinhas > MAXIMO_LINHAS) {
        throw new ErroValidacao(`O relatório passou de ${MAXIMO_LINHAS.toLocaleString("pt-BR")} linhas. Use parâmetros para filtrar.`);
      }
      const brutas = resultado.rows as unknown[][];
      return {
        dados: {
          colunas: resultado.fields.map((f) => ({ nome: f.name, tipo: tipoDaColuna(f) })),
          linhas: brutas.map((linha) => linha.map(valorDaCelula)),
        },
        brutas,
        nomes: resultado.fields.map((f) => f.name.toLowerCase()),
      };
    }

    // Bandas Detalhe (ou sem tipo) e as dependentes de cada uma.
    const ehDetalhe = (b: Banda) => b.tipo === null || b.tipo === "detalhe";
    const detalhes = bandas.filter(ehDetalhe);
    const nrsDetalhe = new Set(detalhes.map((b) => b.nr));
    const dependentes = new Map<number, Banda[]>();
    for (const b of detalhes) {
      if (b.superior !== null && nrsDetalhe.has(b.superior)) dependentes.set(b.superior, [...(dependentes.get(b.superior) ?? []), b]);
    }

    /** Dados de uma banda Detalhe e, linha a linha, das dependentes dela. */
    async function gerarDetalhe(db: PoolClient, banda: Banda, contextos: Contexto[], nivel: number): Promise<Dados> {
      const { dados: resultado, brutas, nomes } = await executar(db, banda.sql, contextos);
      const filhas = dependentes.get(banda.nr) ?? [];
      if (filhas.length === 0 || nivel >= MAXIMO_NIVEIS) return resultado;
      resultado.filhas = [];
      for (const linha of brutas) {
        const contexto: Contexto = new Map(nomes.map((nome, i) => [nome, linha[i]]));
        const porBanda: Record<string, Dados> = {};
        for (const filha of filhas) porBanda[filha.nr] = await gerarDetalhe(db, filha, [contexto, ...contextos], nivel + 1);
        resultado.filhas.push(porBanda);
      }
      return resultado;
    }

    // ── Execução: transação somente leitura, papel restrito, sempre desfeita ──
    const db = await pool().connect();
    try {
      await db.query("begin transaction read only");
      await db.query(`set local statement_timeout = '${TEMPO_MAXIMO}'`);
      await db.query("set local role quasar_relatorio");

      if (!modoPdf) {
        // XLS: a banda Detalhe de menor Sequência (sem banda, o SQL do relatório).
        const banda = detalhes[0];
        const { dados: resultado } = await executar(db, banda ? banda.sql : sqlCapa, []);
        return NextResponse.json(resultado);
      }

      const saida: Record<string, Dados> = {};
      for (const banda of bandas) {
        if (ehDetalhe(banda)) {
          // Dependentes saem dentro da banda superior.
          if (banda.superior !== null && nrsDetalhe.has(banda.superior)) continue;
          saida[banda.nr] = await gerarDetalhe(db, banda, [], 0);
        } else {
          saida[banda.nr] = (await executar(db, banda.sql, [])).dados;
        }
      }
      return NextResponse.json({ bandas: saida });
    } finally {
      // Nada desta transação fica gravado (e o papel volta ao normal com ela).
      await db.query("rollback").catch(() => undefined);
      db.release();
    }
  });
}
