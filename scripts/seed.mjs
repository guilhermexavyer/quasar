#!/usr/bin/env node
/**
 * Seeder — Implantação inicial (PostgreSQL)
 *
 * Cria o mínimo para acessar o sistema:
 *   - perfil  → 'Administrador', com todas as funções liberadas. Sem
 *               config_permissoes: o sistema trata a ausência como "tudo
 *               liberado", inclusive permissões criadas no futuro.
 *   - usuario → 'administrador' (senha em SHA-256, mesmo formato do login),
 *               com Base de Conhecimento e Central de Suporte, vinculado ao
 *               perfil 'Administrador' (também como perfil ativo).
 *
 * IDEMPOTENTE: se o perfil/usuário já existirem, não são recriados (apenas o
 * vínculo do usuário com o perfil é garantido). Tudo roda numa transação.
 * Troque a senha do administrador depois do primeiro acesso.
 *
 * Uso:
 *   node --env-file=.env.local scripts/seed.mjs              → grava
 *   node --env-file=.env.local scripts/seed.mjs --dry-run    → só mostra o que seria feito (desfaz no fim)
 */
import { createHash } from "node:crypto";
import { ajustarSequencia, auditarCriacao, conectar, falhar, textoDoErro } from "./lib/conexao.mjs";

const DRY_RUN = process.argv.includes("--dry-run");

/* Implantação: usuário e data de criação dos registros do seeder */
const USUARIO_IMPLANTACAO = "implantacao";
const DATA_IMPLANTACAO = new Date().toISOString();

const USUARIO_ADMIN = {
  ds_usuario: "administrador",
  ds_usuario_alternativo: "administrador",
  senha: "quasar.01",
};

/* Funções do sistema (mesmas chaves de FuncaoId em src/lib/perfilUtils.ts) */
const TODAS_FUNCOES = ["pessoaFisica", "estruturaAcademica", "patrimonio", "relatorio", "administracaoSistema", "cadastrosGerais"];

/**
 * Próximo número da tabela, calculado aqui (e não pela sequência do banco): uma
 * sequência não volta atrás quando o --dry-run desfaz a transação, então usá-la
 * faria a gravação real pular números.
 */
async function proximoNumero(db, tabela) {
  const { rows } = await db.query(`select coalesce(max(nr_sequencia), 0) + 1 as n from ${tabela}`);
  return Number(rows[0].n);
}

const controle = {
  dt_criacao: DATA_IMPLANTACAO,
  dt_alteracao: DATA_IMPLANTACAO,
  ds_usuario_criacao: USUARIO_IMPLANTACAO,
  ds_usuario_alteracao: USUARIO_IMPLANTACAO,
};

async function semearPerfilAdministrador(db) {
  const { rows } = await db.query("select nr_sequencia from perfil where lower(btrim(ds_perfil)) = 'administrador' order by nr_sequencia limit 1");
  if (rows[0]) {
    console.log(`ℹ️  perfil: Administrador já existe (${rows[0].nr_sequencia})`);
    return Number(rows[0].nr_sequencia);
  }
  const dados = {
    ds_perfil: "Administrador",
    ds_observacao: "Perfil padrão do sistema com acesso a todas as funções.",
    ie_status: "A",
    config_funcoes: JSON.stringify(TODAS_FUNCOES),
  };
  const { rows: novo } = await db.query(
    `insert into perfil (nr_sequencia, ds_perfil, ds_observacao, ie_status, config_funcoes, dt_criacao, dt_alteracao, ds_usuario_criacao, ds_usuario_alteracao)
     values ($7, $1, $2, $3, $4::jsonb, $5, $5, $6, $6) returning nr_sequencia`,
    [dados.ds_perfil, dados.ds_observacao, dados.ie_status, dados.config_funcoes, DATA_IMPLANTACAO, USUARIO_IMPLANTACAO, await proximoNumero(db, "perfil")]
  );
  const nr = Number(novo[0].nr_sequencia);
  await auditarCriacao(db, "perfil", nr, USUARIO_IMPLANTACAO, DATA_IMPLANTACAO, { nr_sequencia: nr, ...dados, ...controle });
  console.log(`✅ perfil: Administrador ${DRY_RUN ? "seria inserido" : "inserido"} (${nr})`);
  return nr;
}

async function semearUsuarioAdministrador(db, perfilSeq) {
  const { rows } = await db.query(
    "select nr_sequencia, config_perfis from usuario where lower(btrim(ds_usuario)) = $1 order by nr_sequencia limit 1",
    [USUARIO_ADMIN.ds_usuario]
  );
  const existente = rows[0];
  if (existente) {
    const perfis = Array.isArray(existente.config_perfis) ? existente.config_perfis : [];
    if (perfis.includes(perfilSeq)) {
      console.log(`ℹ️  usuario: administrador já existe e já possui o perfil (${perfilSeq})`);
      return;
    }
    await db.query(
      "update usuario set config_perfis = $1::jsonb, config_perfil_ativo = $2 where nr_sequencia = $3",
      [JSON.stringify([...perfis, perfilSeq]), String(perfilSeq), existente.nr_sequencia]
    );
    console.log(`✅ usuario: administrador existente ${DRY_RUN ? "receberia" : "recebeu"} o perfil (${perfilSeq})`);
    return;
  }

  const dados = {
    ds_usuario: USUARIO_ADMIN.ds_usuario,
    ds_usuario_alternativo: USUARIO_ADMIN.ds_usuario_alternativo,
    ds_observacao: "",
    ie_status: "A",
    ie_base_conhecimento: "S",
    ie_central_suporte: "S",
    config_perfis: JSON.stringify([perfilSeq]),
    config_perfil_ativo: String(perfilSeq),
  };
  // SHA-256 em hexadecimal — mesmo formato conferido no login (src/lib/server/senha.ts)
  const hash = createHash("sha256").update(USUARIO_ADMIN.senha).digest("hex");
  const { rows: novo } = await db.query(
    `insert into usuario (nr_sequencia, ds_usuario, ds_usuario_alternativo, ds_senha, ds_observacao, ie_status, ie_base_conhecimento, ie_central_suporte,
                          config_perfis, config_perfil_ativo, dt_criacao, dt_alteracao, ds_usuario_criacao, ds_usuario_alteracao)
     values ($12, $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $10, $11, $11) returning nr_sequencia`,
    [dados.ds_usuario, dados.ds_usuario_alternativo, hash, dados.ds_observacao, dados.ie_status, dados.ie_base_conhecimento,
      dados.ie_central_suporte, dados.config_perfis, dados.config_perfil_ativo, DATA_IMPLANTACAO, USUARIO_IMPLANTACAO, await proximoNumero(db, "usuario")]
  );
  const nr = Number(novo[0].nr_sequencia);
  // A auditoria nunca guarda a senha.
  await auditarCriacao(db, "usuario", nr, USUARIO_IMPLANTACAO, DATA_IMPLANTACAO, { nr_sequencia: nr, ...dados, ...controle });
  console.log(`✅ usuario: administrador ${DRY_RUN ? "seria inserido" : "inserido"} (${nr}) com o perfil (${perfilSeq})`);
}

console.log(`🌱 Seeder — Implantação inicial${DRY_RUN ? " (dry-run)" : ""}`);
const db = await conectar();
try {
  await db.query("BEGIN");
  const perfilSeq = await semearPerfilAdministrador(db);
  await semearUsuarioAdministrador(db, perfilSeq);
  await ajustarSequencia(db, "perfil");
  await ajustarSequencia(db, "usuario");
  if (DRY_RUN) {
    await db.query("ROLLBACK");
    console.log("\n👀 Dry-run concluído. Nada foi gravado.");
  } else {
    await db.query("COMMIT");
    console.log("\n🎉 Concluído!");
  }
} catch (erro) {
  await db.query("ROLLBACK").catch(() => undefined);
  falhar(`Erro ao executar o seeder (${erro?.code ?? "sem código"}): ${textoDoErro(erro)}. Nada foi gravado.`);
} finally {
  await db.end().catch(() => undefined);
}
