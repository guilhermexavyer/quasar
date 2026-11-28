import { NextResponse, type NextRequest } from "next/server";
import type { QueryArrayConfig } from "pg";
import { pool, query } from "@/lib/db";
import { itemAtivo, prepararSql, problemaDoSql, sqlComValores } from "@/lib/relatorioSql";
import { exigirPermissaoDaFuncao } from "@/lib/server/acesso";
import { ErroValidacao, type Registro } from "@/lib/server/esquema";
import { numeroDaUrl, rota } from "@/lib/server/http";

/**
 * Opções de um parâmetro do tipo Dropdown (modal "Parâmetros" ao gerar o relatório).
 * Executa o SQL do parâmetro (ds_sql) e devolve { opcoes: [{ cd, ds }] }: a coluna cd é o
 * valor passado ao :nome do SQL do relatório e a coluna ds é o texto exibido na opção.
 *
 * O SQL vem do banco (nunca do pedido) e roda com as mesmas travas da geração do
 * relatório (gerar/route.ts): permissão "Permite gerar relatório", uma consulta só
 * (SELECT/WITH, sem recursos bloqueados), transação SOMENTE LEITURA sempre desfeita,
 * papel quasar_relatorio, tempo máximo e limite de linhas. :nome no SQL das opções vai
 * como nulo.
 */

const TEMPO_MAXIMO = "30s";
const MAXIMO_OPCOES = 5_000;

export async function POST(request: NextRequest, { params }: { params: Promise<{ nr: string; np: string }> }) {
  const { nr, np } = await params;
  return rota(request, async (sessao) => {
    const nrRelatorio = numeroDaUrl(nr);
    const nrParametro = numeroDaUrl(np);
    await exigirPermissaoDaFuncao(sessao, "relatorio", "gerar_relatorio");

    const { rows } = await query<Registro>(
      "select p.ie_tipo, p.ds_sql, p.ds_label, p.ds_parametro, p.ie_status, r.ie_status as ie_status_relatorio " +
        "from relatorio_parametro p join relatorio r on r.nr_sequencia = p.nr_seq_relatorio " +
        "where p.nr_sequencia = $1 and p.nr_seq_relatorio = $2",
      [nrParametro, nrRelatorio]
    );
    const parametro = rows[0];
    if (!parametro) throw new ErroValidacao("Parâmetro não encontrado.");
    if (!itemAtivo({ ie_status: (parametro.ie_status_relatorio as string | null) ?? null })) throw new ErroValidacao("O relatório está inativo.");
    const nome = String(parametro.ds_label || parametro.ds_parametro || "").trim();
    const sql = String(parametro.ds_sql ?? "");
    if (parametro.ie_tipo !== "D" || !sql.trim()) return NextResponse.json({ opcoes: [] });

    const preparado = prepararSql(sql);
    const problema = problemaDoSql(preparado);
    if (problema) throw new ErroValidacao(`SQL do parâmetro "${nome}": ${problema.replace("O SQL da banda", "O SQL")}`);

    const db = await pool().connect();
    try {
      await db.query("begin transaction read only");
      await db.query(`set local statement_timeout = '${TEMPO_MAXIMO}'`);
      await db.query("set local role quasar_relatorio");
      let resultado;
      try {
        // :nome vai como NULL (literal); protocolo estendido = um comando só.
        resultado = await db.query({ text: sqlComValores(preparado, []), rowMode: "array", queryMode: "extended" } as QueryArrayConfig);
      } catch (e) {
        const codigo = (e as { code?: unknown } | null)?.code;
        if (typeof codigo !== "string") throw e;
        if (codigo === "57014") throw new ErroValidacao(`O SQL do parâmetro "${nome}" demorou demais e foi cancelado.`);
        throw new ErroValidacao(`O SQL do parâmetro "${nome}" tem um erro: ${(e as Error).message}`);
      }
      const colunas = resultado.fields.map((f) => f.name.toLowerCase());
      const iCd = colunas.indexOf("cd");
      const iDs = colunas.indexOf("ds");
      if (iCd < 0 || iDs < 0) throw new ErroValidacao(`O SQL do parâmetro "${nome}" precisa ter as colunas cd (valor) e ds (texto exibido).`);
      if (resultado.rows.length > MAXIMO_OPCOES) {
        throw new ErroValidacao(`O SQL do parâmetro "${nome}" passou de ${MAXIMO_OPCOES.toLocaleString("pt-BR")} opções.`);
      }
      const texto = (v: unknown) => (v === null || v === undefined ? "" : v instanceof Date ? v.toISOString() : String(v));
      const opcoes = (resultado.rows as unknown[][]).map((linha) => ({ cd: texto(linha[iCd]), ds: texto(linha[iDs]) }));
      return NextResponse.json({ opcoes });
    } finally {
      await db.query("rollback").catch(() => undefined);
      db.release();
    }
  });
}
