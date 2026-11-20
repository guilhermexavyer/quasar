import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { rota } from "@/lib/server/http";

/**
 * Referências entre tabelas ({ tabela: { coluna: tabelaReferenciada } }), lidas das chaves
 * estrangeiras do próprio banco. Usado pelos infobuttons ("Depende de: Função > Opção").
 */
export async function GET(request: NextRequest) {
  return rota(request, async () => {
    const { rows } = await query<{ tabela: string; coluna: string; referencia: string }>(
      `select tc.relname as tabela, a.attname as coluna, rt.relname as referencia
         from pg_constraint k
         join pg_class tc on tc.oid = k.conrelid
         join pg_namespace n on n.oid = tc.relnamespace
         join pg_class rt on rt.oid = k.confrelid
         join pg_attribute a on a.attrelid = k.conrelid and a.attnum = k.conkey[1]
        where k.contype = 'f' and n.nspname = 'public' and array_length(k.conkey, 1) = 1`
    );
    const referencias: Record<string, Record<string, string>> = {};
    for (const r of rows) (referencias[r.tabela] ??= {})[r.coluna] = r.referencia;
    return NextResponse.json(referencias, { headers: { "Cache-Control": "private, max-age=300" } });
  });
}
