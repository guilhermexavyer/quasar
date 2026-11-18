import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { rota } from "@/lib/server/http";

/** Tabelas internas que não aparecem nos infobuttons. */
const OCULTAS = new Set(["sessao", "migracao_esquema"]);

/** Nome curto do tipo do PostgreSQL, como aparece no infobutton (ex.: bigint, text, date, timestamptz, jsonb, text[]). */
function nomeDoTipo(dataType: string, udt: string): string {
  if (dataType === "ARRAY") return `${udt.replace(/^_/, "")}[]`;
  if (dataType === "timestamp with time zone") return "timestamptz";
  if (dataType === "timestamp without time zone") return "timestamp";
  if (dataType === "character varying") return "varchar";
  return dataType;
}

/**
 * Tipo de cada coluna de cada tabela ({ tabela: { coluna: tipo } }), lido do
 * próprio banco. Usado pelos infobuttons para mostrar o tipo real.
 */
export async function GET(request: NextRequest) {
  return rota(request, async () => {
    const { rows } = await query<{ table_name: string; column_name: string; data_type: string; udt_name: string }>(
      "select table_name, column_name, data_type, udt_name from information_schema.columns where table_schema = 'public' order by table_name, ordinal_position"
    );
    const esquema: Record<string, Record<string, string>> = {};
    for (const r of rows) {
      if (OCULTAS.has(r.table_name)) continue;
      (esquema[r.table_name] ??= {})[r.column_name] = nomeDoTipo(r.data_type, r.udt_name);
    }
    return NextResponse.json(esquema, { headers: { "Cache-Control": "private, max-age=300" } });
  });
}
