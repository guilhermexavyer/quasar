#!/usr/bin/env node
/**
 * Auditoria de rodapés (só leitura) — verifica, em todas as tabelas de
 * registros, se os campos exibidos no rodapé dos formulários estão presentes e
 * batem com a trilha de auditoria (tabela auditoria):
 *   - dt_criacao / dt_alteracao ausentes;
 *   - ds_usuario_criacao / ds_usuario_alteracao vazios;
 *   - usuário de criação/alteração diferente do registrado na auditoria
 *     (caso em que o rodapé mostra dado errado).
 *
 * Uso: node --env-file=.env.local scripts/audit-rodapes.mjs
 */
import { conectar, encerrarComErro, tabelasEmOrdem, textoDoErro } from "./lib/conexao.mjs";

/** Tabelas sem rodapé de registro. */
const SEM_RODAPE = new Set(["auditoria", "exclusao", "usuario_coluna", "usuario_painel"]);
const vazio = (v) => v === undefined || v === null || String(v).trim() === "";

const db = await conectar();
let problemas = 0;
try {
  const tabelas = (await tabelasEmOrdem(db)).filter((t) => !SEM_RODAPE.has(t)).sort();
  for (const t of tabelas) {
    const { rows } = await db.query(
      `select r.nr_sequencia, r.dt_criacao, r.dt_alteracao, r.ds_usuario_criacao, r.ds_usuario_alteracao,
              (select a.usuario_nome from auditoria a where a.ds_colecao = $1 and a.nr_seq_registro = r.nr_sequencia and a.acao = 'create'
                order by a."timestamp" asc limit 1) as aud_criacao,
              (select a.usuario_nome from auditoria a where a.ds_colecao = $1 and a.nr_seq_registro = r.nr_sequencia and a.acao in ('update', 'password')
                order by a."timestamp" desc limit 1) as aud_alteracao
         from "${t}" r order by r.nr_sequencia`,
      [t]
    );
    if (rows.length === 0) {
      console.log(`— ${t}: vazia`);
      continue;
    }
    const linhas = [];
    for (const r of rows) {
      const f = [];
      if (vazio(r.dt_criacao)) f.push("dt_criacao ausente");
      if (vazio(r.dt_alteracao)) f.push("dt_alteracao ausente");
      if (vazio(r.ds_usuario_criacao)) f.push("ds_usuario_criacao vazio");
      if (vazio(r.ds_usuario_alteracao)) f.push("ds_usuario_alteracao vazio");
      if (!vazio(r.aud_criacao) && !vazio(r.ds_usuario_criacao) && r.aud_criacao !== r.ds_usuario_criacao) {
        f.push(`criação divergente: registro="${r.ds_usuario_criacao}" vs auditoria="${r.aud_criacao}"`);
      }
      if (!vazio(r.aud_alteracao) && !vazio(r.ds_usuario_alteracao) && r.aud_alteracao !== r.ds_usuario_alteracao) {
        f.push(`alteração divergente: registro="${r.ds_usuario_alteracao}" vs auditoria="${r.aud_alteracao}"`);
      }
      if (f.length) {
        problemas += f.length;
        linhas.push(`   • ${r.nr_sequencia}: ${f.join(" | ")}`);
      }
    }
    if (linhas.length) {
      console.log(`✗ ${t} (${rows.length} registros, ${linhas.length} com problema):`);
      linhas.slice(0, 20).forEach((l) => console.log(l));
      if (linhas.length > 20) console.log(`   ... e mais ${linhas.length - 20}`);
    } else {
      console.log(`✓ ${t} (${rows.length} registros): rodapé OK`);
    }
  }
  console.log(problemas === 0 ? "\n🎉 Nenhum problema de rodapé nos dados." : `\n⚠️  ${problemas} problema(s) encontrado(s).`);
} catch (erro) {
  encerrarComErro(`Erro (${erro?.code ?? "sem código"}): ${textoDoErro(erro)}`);
} finally {
  await db.end().catch(() => undefined);
}
