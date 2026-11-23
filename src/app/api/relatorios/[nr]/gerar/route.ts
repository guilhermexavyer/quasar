import { NextResponse, type NextRequest } from "next/server";
import type { FieldDef } from "pg";
import { pool, query } from "@/lib/db";
import { nomeDoParametro, prepararSql, problemaDoSql } from "@/lib/relatorioSql";
import { exigirPermissaoDaFuncao } from "@/lib/server/acesso";
import { ErroValidacao, type Registro } from "@/lib/server/esquema";
import { corpo, numeroDaUrl, rota } from "@/lib/server/http";

/**
 * Gera os dados de um relatório XLS (Gerenciador de Relatórios > Relatórios):
 * executa o SQL da banda do relatório e devolve { colunas, linhas } para a tela montar
 * a planilha. Corpo: { valores: { <parâmetro>: <valor> } } (os perguntados no modal).
 *
 * O SQL vem do banco (nunca do pedido) e roda com várias travas:
 *   - permissão "Permite gerar relatório" do perfil ativo;
 *   - uma consulta só, começando com SELECT/WITH, sem funções que trocam de papel ou
 *     executam outro SQL (relatorioSql.problemaDoSql);
 *   - transação SOMENTE LEITURA desde o primeiro comando, sempre desfeita no fim;
 *   - papel quasar_relatorio (só SELECT; sem sessao nem usuario.ds_senha);
 *   - tempo máximo de execução e limite de linhas.
 * Parâmetros (:nome) viram $1, $2... com os valores separados do SQL.
 *
 * Relatório gerado mesmo sem SQL ou com SQL inválido (para testes): sem banda/SQL, SQL
 * barrado pelas travas (que então nem é executado), erro de sintaxe, tabela ou coluna
 * desconhecida etc. devolvem um resultado vazio, sem aviso. Parâmetro do SQL que não
 * está cadastrado vai como nulo. Só o tempo máximo, o limite de linhas e os parâmetros
 * obrigatórios sem valor continuam dando erro.
 */

const TEMPO_MAXIMO = "60s";
const MAXIMO_LINHAS = 200_000;

type TipoColuna = "numero" | "data" | "datahora" | "booleano" | "texto";

/** Tipo da coluna para a planilha (pelo OID do tipo no PostgreSQL). */
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

/** Relatório sem colunas nem linhas (SQL ausente ou inválido). */
const resultadoVazio = () => NextResponse.json({ colunas: [], linhas: [] });

/** Erro do PostgreSQL causado pelo SQL do relatório (tem código SQLSTATE); sem código = erro interno. */
function erroDoSql(e: unknown): string | null {
  const codigo = (e as { code?: unknown } | null)?.code;
  return typeof codigo === "string" ? codigo : null;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ nr: string }> }) {
  const { nr } = await params;
  return rota(request, async (sessao) => {
    await exigirPermissaoDaFuncao(sessao, "relatorio", "gerar_relatorio");
    const nrRelatorio = numeroDaUrl(nr);
    const dados = await corpo(request);
    const valoresTela = (dados.valores && typeof dados.valores === "object" ? dados.valores : {}) as Record<string, unknown>;

    // ── Configuração do relatório (banda e parâmetros) ──
    const { rows: relatorios } = await query<Registro>("select nr_sequencia from relatorio where nr_sequencia = $1", [nrRelatorio]);
    if (relatorios.length === 0) throw new ErroValidacao("Relatório não encontrado.");
    // PDF: o SQL da banda pedida (de relatório). XLS: o da (única) banda.
    const nrBanda = dados.nr_banda === undefined || dados.nr_banda === null ? null : Number(dados.nr_banda);
    if (nrBanda !== null && !Number.isSafeInteger(nrBanda)) throw new ErroValidacao("Banda inválida.");
    const { rows: bandas } = nrBanda === null
      ? await query<Registro>("select ds_sql from relatorio_banda where nr_seq_relatorio = $1 order by nr_sequencia limit 1", [nrRelatorio])
      : await query<Registro>("select ds_sql from relatorio_banda where nr_seq_relatorio = $1 and nr_sequencia = $2", [nrRelatorio, nrBanda]);
    const sql = String(bandas[0]?.ds_sql ?? "");
    if (!sql.trim()) return resultadoVazio();

    // SQL barrado pelas travas: não é executado (relatório vazio).
    const preparado = prepararSql(sql);
    if (problemaDoSql(preparado)) return resultadoVazio();

    // Valor de cada parâmetro: o informado no modal (Perguntar) ou o valor padrão.
    const { rows: parametros } = await query<Registro>(
      "select ds_parametro, ds_label, vl_padrao, ie_perguntar, ie_obrigatorio from relatorio_parametro where nr_seq_relatorio = $1",
      [nrRelatorio]
    );
    const porNome = new Map(parametros.map((p) => [nomeDoParametro(p.ds_parametro as string), p]));
    const valores = preparado.nomes.map((nome) => {
      const parametro = porNome.get(nome);
      if (!parametro) return null;
      const perguntado = parametro.ie_perguntar === "S" && Object.prototype.hasOwnProperty.call(valoresTela, nome);
      const bruto = perguntado ? valoresTela[nome] : parametro.vl_padrao;
      const valor = bruto === null || bruto === undefined ? "" : String(bruto).trim();
      if (valor === "" && parametro.ie_obrigatorio === "S") {
        throw new ErroValidacao(`Informe o parâmetro "${String(parametro.ds_label || nome)}".`);
      }
      return valor === "" ? null : valor;
    });

    // ── Execução: transação somente leitura, papel restrito, sempre desfeita ──
    const db = await pool().connect();
    try {
      await db.query("begin transaction read only");
      await db.query(`set local statement_timeout = '${TEMPO_MAXIMO}'`);
      await db.query("set local role quasar_relatorio");
      let resultado;
      try {
        resultado = await db.query({ text: preparado.texto, values: valores, rowMode: "array" });
      } catch (e) {
        const codigo = erroDoSql(e);
        if (!codigo) throw e;
        if (codigo === "57014") throw new ErroValidacao("A consulta demorou demais e foi cancelada.");
        // Sintaxe, tabela/coluna desconhecida, permissão, tipo de dado...: relatório vazio.
        return resultadoVazio();
      }
      if (resultado.rows.length > MAXIMO_LINHAS) {
        throw new ErroValidacao(`O relatório passou de ${MAXIMO_LINHAS.toLocaleString("pt-BR")} linhas. Use parâmetros para filtrar.`);
      }
      return NextResponse.json({
        colunas: resultado.fields.map((f) => ({ nome: f.name, tipo: tipoDaColuna(f) })),
        linhas: (resultado.rows as unknown[][]).map((linha) => linha.map(valorDaCelula)),
      });
    } finally {
      // Nada desta transação fica gravado (e o papel volta ao normal com ela).
      await db.query("rollback").catch(() => undefined);
      db.release();
    }
  });
}
