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

/** Mensagem do erro do PostgreSQL para o usuário corrigir o SQL (null = erro interno). */
function mensagemDoBanco(e: unknown): string | null {
  const erro = e as { code?: string; message?: string } | null;
  if (!erro?.code || !erro.message) return null;
  if (erro.code === "57014") return "A consulta demorou demais e foi cancelada.";
  if (erro.code === "42501") {
    return `Sem permissão no banco para esta consulta (${erro.message}). Sessões e senhas não podem ser lidas; em "usuario", liste as colunas em vez de usar *.`;
  }
  if (erro.code === "25006") return "O relatório só pode consultar dados (não pode alterar o banco).";
  return `Erro no SQL do relatório: ${erro.message}`;
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
    const { rows: bandas } = await query<Registro>(
      "select ds_sql from relatorio_banda where nr_seq_relatorio = $1 order by nr_sequencia limit 1",
      [nrRelatorio]
    );
    const sql = String(bandas[0]?.ds_sql ?? "");
    if (!sql.trim()) throw new ErroValidacao("O relatório não tem banda com SQL. Configure a banda (duplo clique no relatório).");

    const preparado = prepararSql(sql);
    const problema = problemaDoSql(preparado);
    if (problema) throw new ErroValidacao(problema);

    // Valor de cada parâmetro: o informado no modal (Perguntar) ou o valor padrão.
    const { rows: parametros } = await query<Registro>(
      "select ds_parametro, ds_label, vl_padrao, ie_perguntar, ie_obrigatorio from relatorio_parametro where nr_seq_relatorio = $1",
      [nrRelatorio]
    );
    const porNome = new Map(parametros.map((p) => [nomeDoParametro(p.ds_parametro as string), p]));
    const valores = preparado.nomes.map((nome) => {
      const parametro = porNome.get(nome);
      if (!parametro) throw new ErroValidacao(`O parâmetro :${nome} do SQL não está cadastrado na aba Parâmetros.`);
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
        const mensagem = mensagemDoBanco(e);
        if (mensagem) throw new ErroValidacao(mensagem);
        throw e;
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
